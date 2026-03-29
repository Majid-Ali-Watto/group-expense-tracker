import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersOptions } from '../../utils/useUsersOptions'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import { onValue, off } from '../../firebase'
import useFireBase from '../../api/firebase-apis'
import { checkDaily } from '../../utils/notifications'
import getCurrentMonth from '../../utils/getCurrentMonth'
import { showError } from '../../utils/showAlerts'
import { appendNotificationForUser } from '../../utils/recordNotifications'
import { useApprovalRequests } from '../../utils/useApprovalRequests'
import { formatUserDisplay } from '../../utils/user-display'
import {
  deleteFromCloudinary,
  cleanupOldReceipts
} from '../../utils/cloudinaryUpload'

export const ExpenseList = (props) => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const route = useRoute()
  const router = useRouter()
  const { dbRef, readShallow, updateData, deleteData } = useFireBase()
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
  const selectedParticipants = ref(
    route.query.participants ? route.query.participants.split(',') : []
  )

  // Keep URL query params in sync with filter state so the URL is shareable
  watch(
    [selectedMonth, selectedFriend, selectedPayerMode, selectedSplitMode, selectedParticipants],
    () => {
      const query = {}
      if (selectedMonth.value) query.month = selectedMonth.value
      if (selectedFriend.value && selectedFriend.value !== 'All') query.payer = selectedFriend.value
      if (selectedPayerMode.value && selectedPayerMode.value !== 'all') query.payerMode = selectedPayerMode.value
      if (selectedSplitMode.value && selectedSplitMode.value !== 'all') query.splitMode = selectedSplitMode.value
      if (selectedParticipants.value?.length) query.participants = selectedParticipants.value.join(',')
      router.replace({ path: route.path, query })
    },
    { deep: true }
  )

  const activeUser = computed(() => authStore.getActiveUser)
  const activeGroup = computed(() => groupStore.getActiveGroup)
  const groupObj = computed(() =>
    activeGroup.value ? groupStore.getGroupById(activeGroup.value) : null
  )

  let paymentsListener = null
  const isContentLoading = computed(
    () => !monthsLoaded.value || !paymentsLoaded.value
  )

  // Watch active group and refetch when it changes
  watch(
    () => groupStore.getActiveGroup,
    () => {
      selectedMonth.value = getCurrentMonth()
      selectedFriend.value = 'All'
      selectedParticipants.value = []
      fetchMonths()
      fetchExpenses()
    }
  )

  let loadingTimeout = null
  onMounted(() => {
    checkDaily(pdfContent)
    fetchMonths()
    fetchExpenses()
    loadingTimeout = setTimeout(() => {
      monthsLoaded.value = true
      paymentsLoaded.value = true
    }, 8000)
  })

  // Clean up listeners on unmount
  onUnmounted(() => {
    if (loadingTimeout) clearTimeout(loadingTimeout)
    const groupId = groupStore.getActiveGroup || 'global'
    if (paymentsListener)
      off(
        dbRef(`${props.dbRef}/${groupId}/${selectedMonth.value}`),
        'value',
        paymentsListener
      )
  })

  // Fetch available months
  const fetchMonths = async () => {
    const groupId = groupStore.getActiveGroup || 'global'
    monthsLoaded.value = false
    try {
      months.value = await readShallow(`${props.dbRef}/${groupId}`)
      if (months.value.length) selectedMonth.value = getCurrentMonth()
    } catch {
      showError('Failed to load months. Please try again.')
    } finally {
      monthsLoaded.value = true
    }
  }

  // Fetch expenses for the selected month
  const fetchExpenses = () => {
    const groupId = groupStore.getActiveGroup || 'global'
    paymentsLoaded.value = false
    const paymentsRef = dbRef(
      `${props.dbRef}/${groupId}/${selectedMonth.value}`
    )
    if (paymentsListener) off(paymentsRef, 'value', paymentsListener)

    paymentsListener = onValue(
      paymentsRef,
      (snapshot) => {
        paymentsLoaded.value = true
        if (snapshot.exists()) {
          const data = snapshot.val()
          rawPaymentsData.value = data

          const paymentsArray = []
          const keysArray = []

          Object.keys(data).forEach((key) => {
            if (data[key].amount) {
              paymentsArray.push(data[key])
              keysArray.push(key)
            }
          })

          paymentKeys.value = keysArray
          payments.value = paymentsArray
        } else {
          paymentKeys.value = []
          payments.value = []
          rawPaymentsData.value = {}
        }
      },
      (error) => {
        paymentsLoaded.value = true
        if (activeGroup.value) showError('Failed to load expenses. Please try again.')
      }
    )
  }

  // Watch for changes in selectedMonth
  watch(selectedMonth, () => {
    selectedFriend.value = 'All'
    fetchExpenses()
  })

  // Filter payments based on selected friend
  const normalize = (val) => String(val ?? '').trim()

  const filteredPayments = computed(() => {
    const selected = normalize(selectedFriend.value)
    return payments.value?.filter((payment) => {
      if (props.isHistory) return true

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

      return true
    })
  })

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
      `${props.dbRef}/${groupId}/${monthYear}/${itemId}`,
    cleanupDeletedReceipts: (payment) => {
      const deletedMeta = payment?.receiptMeta
      if (!deletedMeta) return

      const metas = Array.isArray(deletedMeta) ? deletedMeta : [deletedMeta]
      metas.forEach((meta) =>
        deleteFromCloudinary(meta.publicId, meta.resourceType)
      )
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
    clearFilters: () => {
      selectedMonth.value = getCurrentMonth()
      selectedFriend.value = 'All'
      selectedPayerMode.value = 'all'
      selectedSplitMode.value = 'all'
    }
  }
}
