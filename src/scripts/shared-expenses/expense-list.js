import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApprovalRequests } from '@/composables/useApprovalRequests'
import useFireBase from '@/composables/useFirebase'
import { useLoadingTimeout } from '@/composables/useLoadingTimeout'
import { loadMonthsList } from '@/composables/useMonthsLoader'
import { useRouteQuerySync } from '@/composables/useRouteQuerySync'
import { useUsersOptions } from '@/composables/useUsersOptions'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { onSnapshot } from '@/firebase'
import { buildCategoryFilterOptions } from '@/utils/category-options'
import {
  applyCollectionState,
  buildEmptyCollectionState,
  buildSnapshotCollectionState
} from '@/utils/firestoreCollectionState'
import getCurrentMonth from '@/utils/getCurrentMonth'
import { checkDaily } from '@/utils/notifications'
import { getCache, setCache } from '@/utils/queryCache'
import { appendNotificationForUser } from '@/utils/recordNotifications'
import { showError } from '@/utils/showAlerts'
import {
  createUserDisplayStoreProxy,
  formatUserDisplay
} from '@/utils/user-display'
import { cleanupOldReceipts, deleteReceipt } from '@/utils/uploadReceipt'

export const ExpenseList = (props) => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = createUserDisplayStoreProxy(authStore, userStore)
  const route = useRoute()
  const router = useRouter()
  const { dbRef, read, readShallow, updateData, deleteData } = useFireBase()
  const formatAmount = inject('formatAmount')

  const { usersOptions } = useUsersOptions()

  const pdfContent = ref(null)
  const months = ref([])
  const monthsLoaded = ref(false)
  const paymentsLoaded = ref(false)

  const payments = ref([])
  const paymentKeys = ref([])
  const rawPaymentsData = ref({})
  const selectedMonth = ref(route.query.month || getCurrentMonth())
  const selectedFriend = ref(route.query.payer || 'All')
  const selectedPayerMode = ref(route.query.payerMode || 'all')
  const selectedSplitMode = ref(route.query.splitMode || 'all')
  const selectedCategory = ref(route.query.category || '')
  const selectedParticipants = ref(
    route.query.participants ? route.query.participants.split(',') : []
  )

  useRouteQuerySync({
    route,
    router,
    sources: [
      selectedMonth,
      selectedFriend,
      selectedPayerMode,
      selectedSplitMode,
      selectedCategory,
      selectedParticipants
    ],
    buildQuery: () => {
      const query = {}
      if (selectedMonth.value) query.month = selectedMonth.value
      if (selectedFriend.value && selectedFriend.value !== 'All')
        query.payer = selectedFriend.value
      if (selectedPayerMode.value && selectedPayerMode.value !== 'all')
        query.payerMode = selectedPayerMode.value
      if (selectedSplitMode.value && selectedSplitMode.value !== 'all')
        query.splitMode = selectedSplitMode.value
      if (selectedCategory.value) query.category = selectedCategory.value
      if (selectedParticipants.value?.length)
        query.participants = selectedParticipants.value.join(',')
      return query
    },
    deep: true
  })

  const activeUser = computed(() => authStore.getActiveUser)
  const activeGroup = computed(() => groupStore.getActiveGroup)
  const groupObj = computed(() =>
    activeGroup.value ? groupStore.getGroupById(activeGroup.value) : null
  )

  let paymentsListener = null
  const isContentLoading = computed(
    () => !monthsLoaded.value || !paymentsLoaded.value
  )
  const { startLoadingTimeout, clearLoadingTimeout } = useLoadingTimeout([
    monthsLoaded,
    paymentsLoaded
  ])

  // Watch active group and refetch when it changes
  watch(
    () => groupStore.getActiveGroup,
    () => {
      selectedMonth.value = getCurrentMonth()
      selectedFriend.value = 'All'
      selectedCategory.value = ''
      selectedParticipants.value = []
      fetchMonths()
      fetchExpenses()
    }
  )

  onMounted(() => {
    checkDaily(pdfContent)
    fetchMonths()
    fetchExpenses()
    startLoadingTimeout()
  })

  // Clean up listeners on unmount
  onUnmounted(() => {
    clearLoadingTimeout()
    if (paymentsListener) paymentsListener()
  })

  // Fetch available months
  const fetchMonths = async () => {
    const groupId = groupStore.getActiveGroup || 'global'
    return loadMonthsList({
      isEnabled: () => !!authStore.getActiveUser,
      parentPath: `${props.dbRef}/${groupId}`,
      monthsPath: `${props.dbRef}/${groupId}/months`,
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

  // Fetch expenses for the selected month
  const fetchExpenses = () => {
    const groupId = groupStore.getActiveGroup || 'global'
    const paymentsPath = `${props.dbRef}/${groupId}/months/${selectedMonth.value}/payments`
    const cached = getCache(paymentsPath)
    if (cached) {
      applyCollectionState(cached, {
        listRef: payments,
        keysRef: paymentKeys,
        rawRef: rawPaymentsData,
        loadedRef: paymentsLoaded
      })
    } else {
      paymentsLoaded.value = false
    }
    const paymentsRef = dbRef(paymentsPath)
    if (paymentsListener) paymentsListener()

    paymentsListener = onSnapshot(
      paymentsRef,
      (snapshot) => {
        const state = snapshot.empty
          ? buildEmptyCollectionState(true)
          : buildSnapshotCollectionState(snapshot, {
              includeRaw: true,
              includeItem: (item) => !!item.amount
            })

        setCache(paymentsPath, state)
        applyCollectionState(state, {
          listRef: payments,
          keysRef: paymentKeys,
          rawRef: rawPaymentsData,
          loadedRef: paymentsLoaded
        })
      },
      () => {
        paymentsLoaded.value = true
        if (activeGroup.value)
          showError('Failed to load expenses. Please try again.')
      }
    )
  }

  // Watch for changes in selectedMonth
  watch(selectedMonth, () => {
    selectedFriend.value = 'All'
    selectedCategory.value = ''
    fetchExpenses()
  })

  // Filter payments based on selected friend
  const normalize = (val) => String(val ?? '').trim()

  const filteredPayments = computed(() => {
    const selected = normalize(selectedFriend.value)
    return payments.value?.filter((payment) => {
      // Payer filter (supports single and multiple payers)
      if (selected !== 'All') {
        if (Array.isArray(payment.payers) && payment.payers.length) {
          if (
            !payment.payers.map((p) => normalize(p.mobile)).includes(selected)
          )
            return false
        } else {
          if (normalize(payment?.payer) !== selected) return false
        }
      }

      // Payer mode filter
      if (selectedPayerMode.value !== 'all') {
        if ((payment.payerMode || 'single') !== selectedPayerMode.value)
          return false
      }

      // Split mode filter
      if (selectedSplitMode.value !== 'all') {
        if ((payment.splitMode || 'equal') !== selectedSplitMode.value)
          return false
      }

      if (
        selectedCategory.value &&
        payment.category !== selectedCategory.value
      ) {
        return false
      }

      return true
    })
  })
  const categoryOptions = computed(() =>
    buildCategoryFilterOptions(
      payments.value
        .map((payment) => payment.category)
        .concat(groupObj.value?.category || '')
    )
  )

  const getTotalMembers = () => {
    return groupObj.value?.members?.length || 0
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
    rawItems: rawPaymentsData,
    activeUser,
    activeGroup,
    selectedMonth,
    userStore,
    getTotalMembers,
    updateData,
    deleteData,
    itemIdKey: 'paymentId',
    summaryKey: 'payment',
    itemLabel: 'payment',
    listLabel: 'Payment',
    getSummary: (payment) => ({
      amount: payment.amount,
      payer: payment.payer,
      description: payment.description,
      date: payment.date
    }),
    buildItemPath: ({ groupId, monthYear, itemId }) =>
      `${props.dbRef}/${groupId}/months/${monthYear}/payments/${itemId}`,
    cleanupDeletedReceipts: (payment) => {
      const deletedMeta = payment?.receiptMeta
      if (!deletedMeta) return

      const metas = Array.isArray(deletedMeta) ? deletedMeta : [deletedMeta]
      metas.forEach((meta) => deleteReceipt(meta))
    },
    buildUpdatedItem: (payment, request, notification) => {
      cleanupOldReceipts(payment?.receiptMeta, request.changes?.receiptMeta)

      const updatedPayment = appendNotificationForUser(
        {
          ...payment,
          ...request.changes
        },
        request.requestedBy,
        notification
      )

      delete updatedPayment.deleteRequest
      delete updatedPayment.updateRequest

      return updatedPayment
    }
  })

  const clearFilters = () => {
    selectedMonth.value = getCurrentMonth()
    selectedFriend.value = 'All'
    selectedPayerMode.value = 'all'
    selectedSplitMode.value = 'all'
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
      key: 'payer',
      label: 'Payer',
      placeholder: 'Select Payer',
      modelValue: selectedFriend.value,
      options: [{ label: 'All', value: 'All' }, ...usersOptions.value],
      onChange: (v) => {
        selectedFriend.value = v
      }
    },
    {
      key: 'payerMode',
      label: 'Payer Mode',
      filterable: false,
      modelValue: selectedPayerMode.value,
      options: [
        { label: 'All', value: 'all' },
        { label: 'Single', value: 'single' },
        { label: 'Multiple', value: 'multiple' }
      ],
      onChange: (v) => {
        selectedPayerMode.value = v
      }
    },
    {
      key: 'splitMode',
      label: 'Split Mode',
      filterable: false,
      modelValue: selectedSplitMode.value,
      options: [
        { label: 'All', value: 'all' },
        { label: 'Equal', value: 'equal' },
        { label: 'Custom', value: 'custom' }
      ],
      onChange: (v) => {
        selectedSplitMode.value = v
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
    userStore,
    formatAmount,
    usersOptions,
    pdfContent,
    months,
    payments,
    paymentKeys,
    isContentLoading,
    selectedMonth,
    selectedFriend,
    selectedPayerMode,
    selectedSplitMode,
    selectedCategory,
    categoryOptions,
    filteredPayments,
    activeUser,
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
    filterFields,
    clearFilters
  }
}
