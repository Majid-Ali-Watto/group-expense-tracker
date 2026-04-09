import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onSnapshot } from '@/firebase'
import {
  useAuthStore,
  useGroupStore,
  useUserStore,
  useDataStore
} from '@/stores'
import { useFireBase, useApprovalRequests } from '@/composables'
import {
  appendNotificationForUser,
  formatUserDisplay,
  deleteReceipt,
  cleanupOldReceipts,
  getCurrentMonth,
  showError,
  getCache,
  setCache,
  buildCategoryFilterOptions
} from '@/utils'
import { DB_NODES } from '@/constants'

export const Loans = () => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const dataStore = useDataStore()
  const route = useRoute()
  const router = useRouter()
  const { dbRef, read, readShallow, updateData, deleteData } = useFireBase()
  const formatAmount = inject('formatAmount')

  const showLoanForm = ref(false)
  const closeLoanForm = () => {
    showLoanForm.value = !showLoanForm.value
  }

  const selectedMonth = ref(route.query.month || getCurrentMonth())
  const selectedGiver = ref(route.query.giver || 'All')
  const selectedCategory = ref(route.query.category || '')

  // Keep URL query params in sync with filter state so the URL is shareable
  watch([selectedMonth, selectedGiver, selectedCategory], () => {
    const query = {}
    if (selectedMonth.value) query.month = selectedMonth.value
    if (selectedGiver.value && selectedGiver.value !== 'All')
      query.giver = selectedGiver.value
    if (selectedCategory.value) query.category = selectedCategory.value
    router.replace({ path: route.path, query })
  })
  const months = ref([])
  const monthsLoaded = ref(false)
  const loansLoaded = ref(false)

  const activeGroup = computed(() => groupStore.getActiveGroup)
  const activeUser = computed(() => authStore.getActiveUser)
  const groupObj = computed(() =>
    activeGroup.value ? groupStore.getGroupById(activeGroup.value) : null
  )

  const usersList = computed(() => {
    if (
      groupObj.value &&
      groupObj.value.members &&
      groupObj.value.members.length
    ) {
      return groupObj.value.members.map((m) => ({
        mobile: m.mobile,
        name: m.name || userStore.getUserByMobile(m.mobile)?.name || m.mobile
      }))
    }
    return userStore.getUsers && userStore.getUsers.length
      ? userStore.getUsers.map((u) => ({
          mobile: u.uid || u.mobile,
          name: u.name || u.mobile || u.uid
        }))
      : []
  })

  const usersOptions = computed(() => {
    return usersList.value.map((u) => ({
      label: formatUserDisplay(storeProxy, u.mobile, {
        name: u.name,
        group: groupObj.value
      }),
      value: u.mobile
    }))
  })

  const loans = ref([])
  const loanKeys = ref([])
  const rawLoansData = ref({})
  const loanContent = ref(null)

  let loansListener = null
  let currentLoansRef = null
  const isContentLoading = computed(
    () => !monthsLoaded.value || !loansLoaded.value
  )

  // Fetch available months
  const fetchMonths = async () => {
    if (!authStore.getActiveUser) {
      monthsLoaded.value = true
      return
    }
    const groupId = groupStore.getActiveGroup || 'global'
    const monthsPath = `${DB_NODES.SHARED_LOANS}/${groupId}/months`
    const cached = getCache(monthsPath)
    if (cached) {
      months.value = cached
      monthsLoaded.value = true
      return
    }
    monthsLoaded.value = false
    try {
      // Fast path: read months[] array recorded on the grandparent document
      const parentDoc = await read(`${DB_NODES.SHARED_LOANS}/${groupId}`, false)
      if (parentDoc?.months?.length) {
        months.value = [...parentDoc.months].sort((a, b) => b.localeCompare(a))
      } else {
        months.value = await readShallow(monthsPath, false)
      }
      setCache(monthsPath, months.value)
      if (months.value.length) selectedMonth.value = getCurrentMonth()
    } catch (error) {
      if (error?.code === 'permission-denied') return
      showError('Failed to load months. Please try again.')
    } finally {
      monthsLoaded.value = true
    }
  }
  // Fetch loans for the selected month

  const fetchLoans = () => {
    const groupId = groupStore.getActiveGroup || 'global'
    const loansPath = `${DB_NODES.SHARED_LOANS}/${groupId}/months/${selectedMonth.value}/loans`
    const cached = getCache(loansPath)
    if (cached) {
      rawLoansData.value = cached.raw
      loans.value = cached.list
      loanKeys.value = cached.keys
      loansLoaded.value = true
    } else {
      loansLoaded.value = false
    }
    const loansRef = dbRef(loansPath)
    if (loansListener && currentLoansRef) currentLoansRef()
    currentLoansRef = null

    const unsubscribe = onSnapshot(
      loansRef,
      (snapshot) => {
        loansLoaded.value = true
        if (!snapshot.empty) {
          const data = {}
          const loansArray = []
          const keysArray = []

          snapshot.docs.forEach((docSnap) => {
            const item = { id: docSnap.id, ...docSnap.data() }
            data[docSnap.id] = item
            if (item.amount) {
              loansArray.push(item)
              keysArray.push(docSnap.id)
            }
          })

          rawLoansData.value = data
          loanKeys.value = keysArray
          loans.value = loansArray
          setCache(loansPath, { raw: data, list: loansArray, keys: keysArray })
        } else {
          loanKeys.value = []
          loans.value = []
          rawLoansData.value = {}
          setCache(loansPath, { raw: {}, list: [], keys: [] })
        }
      },
      () => {
        loansLoaded.value = true
        // Ignore permission errors that fire after logout — Firebase revokes the
        // auth token before this listener is detached (on component unmount).
        if (activeGroup.value && authStore.getActiveUser)
          showError('Failed to load loans. Please try again.')
      }
    )
    loansListener = unsubscribe
    currentLoansRef = unsubscribe
  }

  // Watch active group and refetch when it changes
  watch(activeGroup, () => {
    selectedMonth.value = getCurrentMonth()
    selectedGiver.value = 'All'
    selectedCategory.value = ''
    fetchMonths()
    fetchLoans()
  })

  // Watch for changes in selectedMonth
  watch(selectedMonth, () => {
    selectedGiver.value = 'All'
    selectedCategory.value = ''
    fetchLoans()
  })

  let loadingTimeout = null
  onMounted(() => {
    fetchMonths()
    fetchLoans()
    loadingTimeout = setTimeout(() => {
      monthsLoaded.value = true
      loansLoaded.value = true
    }, 8000)
  })

  onUnmounted(() => {
    if (loadingTimeout) clearTimeout(loadingTimeout)
    if (loansListener) loansListener()
  })

  setTimeout(() => {
    dataStore.setLoansRef(loanContent.value)
  }, 1000)

  const filteredLoans = computed(() => {
    if (!loans.value) return []

    return loans.value.filter((loan) => {
      // Only filter by giver (month filtering is done in fetchLoans)
      if (selectedGiver.value !== 'All' && loan.giver !== selectedGiver.value) {
        return false
      }

      if (selectedCategory.value && loan.category !== selectedCategory.value) {
        return false
      }

      return true
    })
  })
  const categoryOptions = computed(() =>
    buildCategoryFilterOptions(
      loans.value
        .map((loan) => loan.category)
        .concat(groupObj.value?.category || '')
    )
  )

  const balances = computed(() => {
    const balanceMap = {}

    usersList.value.forEach((u) => {
      balanceMap[u.mobile] = 0
    })

    filteredLoans.value.forEach((loan) => {
      if (loan.giver && loan.receiver && loan.amount) {
        balanceMap[loan.giver] = (balanceMap[loan.giver] || 0) + loan.amount
        balanceMap[loan.receiver] =
          (balanceMap[loan.receiver] || 0) - loan.amount
      }
    })

    return Object.keys(balanceMap).map((mobile) => ({
      name: formatUserDisplay(storeProxy, mobile, { group: groupObj.value }),
      amount: balanceMap[mobile]
    }))
  })

  const memberCount = computed(() => groupObj.value?.members?.length || 0)

  const getTotalMembers = () => {
    return memberCount.value
  }

  const getUserName = (mobile) => {
    return formatUserDisplay(storeProxy, mobile, { group: groupObj.value })
  }

  const {
    userNotifications,
    dismissNotification,
    pendingRequests,
    hasUserApproved,
    isFullyApproved,
    executeRequestManually,
    cancelRequest,
    approveRequest,
    rejectRequest
  } = useApprovalRequests({
    rawItems: rawLoansData,
    activeUser,
    activeGroup,
    selectedMonth,
    userStore,
    getTotalMembers,
    updateData,
    deleteData,
    itemIdKey: 'loanId',
    summaryKey: 'loan',
    itemLabel: 'loan',
    listLabel: 'Loan',
    getSummary: (loan) => ({
      amount: loan.amount,
      giver: loan.giver,
      receiver: loan.receiver,
      description: loan.description
    }),
    buildItemPath: ({ groupId, monthYear, itemId }) =>
      `${DB_NODES.SHARED_LOANS}/${groupId}/months/${monthYear}/loans/${itemId}`,
    cleanupDeletedReceipts: (loan) => {
      const deletedMeta = loan?.receiptMeta
      if (!deletedMeta) return

      const metas = Array.isArray(deletedMeta) ? deletedMeta : [deletedMeta]
      metas.forEach((meta) => deleteReceipt(meta))
    },
    buildUpdatedItem: (loan, request, notification) => {
      cleanupOldReceipts(loan?.receiptMeta, request.changes?.receiptMeta)

      const updatedLoan = appendNotificationForUser(
        {
          ...loan,
          ...request.changes
        },
        request.requestedBy,
        notification
      )

      delete updatedLoan.deleteRequest
      delete updatedLoan.updateRequest

      return updatedLoan
    }
  })

  const loanBalanceColumns = computed(() => [
    {
      key: 'name',
      label: 'Member'
    },
    {
      key: 'status',
      label: 'Status',
      class: (row) =>
        row.amount < 0
          ? 'text-red-500 font-semibold'
          : row.amount > 0
            ? 'text-green-500 font-semibold'
            : 'text-gray-400',
      format: (row) =>
        row.amount < 0
          ? 'Will Pay'
          : row.amount > 0
            ? 'Will Receive'
            : 'Settled'
    },
    {
      key: 'amount',
      label: 'Amount',
      format: (row) => formatAmount(Math.abs(row.amount))
    }
  ])

  const clearFilters = () => {
    selectedMonth.value = getCurrentMonth()
    selectedGiver.value = 'All'
    selectedCategory.value = ''
  }

  const filterFields = computed(() => [
    {
      key: 'month',
      label: 'Month',
      placeholder: 'Select Month',
      modelValue: selectedMonth.value,
      options: months.value,
      onChange: (v) => {
        selectedMonth.value = v
      }
    },
    {
      key: 'giver',
      label: 'Giver',
      placeholder: 'Select Giver',
      modelValue: selectedGiver.value,
      options: [{ label: 'All Givers', value: 'All' }, ...usersOptions.value],
      onChange: (v) => {
        selectedGiver.value = v
      }
    },
    {
      key: 'category',
      label: 'Category',
      placeholder: 'All Categories',
      modelValue: selectedCategory.value,
      options: categoryOptions.value,
      onChange: (v) => {
        selectedCategory.value = v
      }
    }
  ])

  return {
    formatAmount,
    showLoanForm,
    closeLoanForm,
    selectedMonth,
    selectedGiver,
    selectedCategory,
    months,
    categoryOptions,
    isContentLoading,
    activeUser,
    usersOptions,
    loans,
    loanKeys,
    loanContent,
    filteredLoans,
    balances,
    memberCount,
    userNotifications,
    dismissNotification,
    pendingRequests,
    getTotalMembers,
    getUserName,
    hasUserApproved,
    isFullyApproved,
    executeRequestManually,
    cancelRequest,
    approveRequest,
    rejectRequest,
    loanBalanceColumns,
    filterFields,
    clearFilters
  }
}
