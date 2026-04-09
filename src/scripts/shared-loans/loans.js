import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onSnapshot } from '@/firebase'
import {
  useAuthStore,
  useGroupStore,
  useUserStore,
  useDataStore
} from '@/stores'
import { useApprovalRequests } from '@/composables/useApprovalRequests'
import useFireBase from '@/composables/useFirebase'
import { useLoadingTimeout } from '@/composables/useLoadingTimeout'
import { loadMonthsList } from '@/composables/useMonthsLoader'
import { useRouteQuerySync } from '@/composables/useRouteQuerySync'
import { buildCategoryFilterOptions } from '@/utils/category-options'
import { DB_NODES } from '@/constants'
import {
  applyCollectionState,
  buildEmptyCollectionState,
  buildSnapshotCollectionState
} from '@/utils/firestoreCollectionState'
import getCurrentMonth from '@/utils/getCurrentMonth'
import { getCache, setCache } from '@/utils/queryCache'
import { appendNotificationForUser } from '@/utils/recordNotifications'
import { showError } from '@/utils/showAlerts'
import {
  createUserDisplayStoreProxy,
  formatUserDisplay
} from '@/utils/user-display'
import { cleanupOldReceipts, deleteReceipt } from '@/utils/uploadReceipt'

export const Loans = () => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = createUserDisplayStoreProxy(authStore, userStore)
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

  useRouteQuerySync({
    route,
    router,
    sources: [selectedMonth, selectedGiver, selectedCategory],
    buildQuery: () => {
      const query = {}
      if (selectedMonth.value) query.month = selectedMonth.value
      if (selectedGiver.value && selectedGiver.value !== 'All')
        query.giver = selectedGiver.value
      if (selectedCategory.value) query.category = selectedCategory.value
      return query
    }
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
  const { startLoadingTimeout, clearLoadingTimeout } = useLoadingTimeout([
    monthsLoaded,
    loansLoaded
  ])

  // Fetch available months
  const fetchMonths = async () => {
    const groupId = groupStore.getActiveGroup || 'global'
    return loadMonthsList({
      isEnabled: () => !!authStore.getActiveUser,
      parentPath: `${DB_NODES.SHARED_LOANS}/${groupId}`,
      monthsPath: `${DB_NODES.SHARED_LOANS}/${groupId}/months`,
      read,
      readShallow,
      monthsRef: months,
      loadedRef: monthsLoaded,
      errorHandler: () => {
        showError('Failed to load months. Please try again.')
      },
      onResolved: (resolvedMonths) => {
        if (resolvedMonths.length) selectedMonth.value = getCurrentMonth()
      }
    })
  }
  // Fetch loans for the selected month

  const fetchLoans = () => {
    const groupId = groupStore.getActiveGroup || 'global'
    const loansPath = `${DB_NODES.SHARED_LOANS}/${groupId}/months/${selectedMonth.value}/loans`
    const cached = getCache(loansPath)
    if (cached) {
      applyCollectionState(cached, {
        listRef: loans,
        keysRef: loanKeys,
        rawRef: rawLoansData,
        loadedRef: loansLoaded
      })
    } else {
      loansLoaded.value = false
    }
    const loansRef = dbRef(loansPath)
    if (loansListener && currentLoansRef) currentLoansRef()
    currentLoansRef = null

    const unsubscribe = onSnapshot(
      loansRef,
      (snapshot) => {
        const state = snapshot.empty
          ? buildEmptyCollectionState(true)
          : buildSnapshotCollectionState(snapshot, {
              includeRaw: true,
              includeItem: (item) => !!item.amount
            })

        setCache(loansPath, state)
        applyCollectionState(state, {
          listRef: loans,
          keysRef: loanKeys,
          rawRef: rawLoansData,
          loadedRef: loansLoaded
        })
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

  onMounted(() => {
    fetchMonths()
    fetchLoans()
    startLoadingTimeout()
  })

  onUnmounted(() => {
    clearLoadingTimeout()
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
