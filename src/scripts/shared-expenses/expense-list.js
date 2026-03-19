import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'
import { useUsersOptions } from '../../utils/useUsersOptions'
import { store } from '../../stores/store'
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
  const userStore = store()
  const { dbRef, readShallow, updateData, deleteData } = useFireBase()
  const formatAmount = inject('formatAmount')

  const { usersOptions } = useUsersOptions()

  const pdfContent = ref(null)
  const months = ref([])

  const payments = ref([])
  const paymentKeys = ref([])
  const rawPaymentsData = ref({})
  const selectedMonth = ref(getCurrentMonth())
  const selectedFriend = ref('All')
  const selectedPayerMode = ref('all')
  const selectedSplitMode = ref('all')
  const selectedParticipants = ref([])

  const activeUser = computed(() => userStore.getActiveUser)
  const activeGroup = computed(() => userStore.getActiveGroup)
  const groupObj = computed(() =>
    activeGroup.value ? userStore.getGroupById(activeGroup.value) : null
  )

  let paymentsListener = null

  // Watch active group and refetch when it changes
  watch(
    () => userStore.getActiveGroup,
    () => {
      selectedMonth.value = getCurrentMonth()
      selectedFriend.value = 'All'
      selectedParticipants.value = []
      fetchMonths()
      fetchExpenses()
    }
  )

  onMounted(() => {
    checkDaily(pdfContent)
    fetchMonths()
    fetchExpenses()
  })

  // Clean up listeners on unmount
  onUnmounted(() => {
    const groupId = userStore.getActiveGroup || 'global'
    if (paymentsListener)
      off(
        dbRef(`${props.dbRef}/${groupId}/${selectedMonth.value}`),
        'value',
        paymentsListener
      )
  })

  // Fetch available months
  const fetchMonths = async () => {
    const groupId = userStore.getActiveGroup || 'global'
    try {
      months.value = await readShallow(`${props.dbRef}/${groupId}`)
      if (months.value.length) selectedMonth.value = getCurrentMonth()
    } catch {
      showError('Failed to load months. Please try again.')
    }
  }

  // Fetch expenses for the selected month
  const fetchExpenses = () => {
    const groupId = userStore.getActiveGroup || 'global'
    const paymentsRef = dbRef(
      `${props.dbRef}/${groupId}/${selectedMonth.value}`
    )
    if (paymentsListener) off(paymentsRef, 'value', paymentsListener)

    paymentsListener = onValue(
      paymentsRef,
      (snapshot) => {
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
      () => {
        showError('Failed to load expenses. Please try again.')
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
    return formatUserDisplay(userStore, mobile, { group: groupObj.value })
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
    rejectRequest
  }
}
