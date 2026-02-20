import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'
import { store } from '../stores/store'
import { onValue, off } from '../firebase'
import useFireBase from '../api/firebase-apis'
import { checkDaily } from '../utils/notifications'
import getCurrentMonth from '../utils/getCurrentMonth'
import { showError } from '../utils/showAlerts'
import { friends } from '../assets/data'
import { ElMessageBox } from 'element-plus'

export const ExpenseList = (props) => {
  const userStore = store()
  const { dbRef, updateData, deleteData } = useFireBase()
  const formatAmount = inject('formatAmount')

  const usersOptions = computed(() => {
    const activeGroup = userStore.getActiveGroup
    const group = activeGroup ? userStore.getGroupById(activeGroup) : null
    if (group && group.members && group.members.length) {
      return group.members.map((m) => ({
        label: `${m.name} (${m.mobile})`,
        value: m.mobile
      }))
    }
    const users =
      userStore.getUsers && userStore.getUsers.length ? userStore.getUsers : []
    if (!users.length) return friends.map((f) => ({ label: f, value: f }))
    return users.map((u) => ({
      label: `${u.name} (${u.mobile})`,
      value: u.mobile
    }))
  })

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

  let monthsListener = null
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
    if (monthsListener)
      off(dbRef(`${props.dbRef}/${groupId}`), 'value', monthsListener)
    if (paymentsListener)
      off(
        dbRef(`${props.dbRef}/${groupId}/${selectedMonth.value}`),
        'value',
        paymentsListener
      )
  })

  // Fetch available months
  const fetchMonths = () => {
    const groupId = userStore.getActiveGroup || 'global'
    const monthsRef = dbRef(`${props.dbRef}/${groupId}`)
    monthsListener = onValue(
      monthsRef,
      (snapshot) => {
        const data = snapshot.val() || {}
        months.value = Object.keys(data)
        if (months.value.length) selectedMonth.value = getCurrentMonth()
      },
      (_) => {
        showError('Failed to load months. Please try again.')
      }
    )
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
      (_) => {
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
          if (!payment.payers.map((p) => normalize(p.mobile)).includes(selected)) return false
        } else {
          if (normalize(payment?.payer) !== selected) return false
        }
      }

      // Payer mode filter
      if (selectedPayerMode.value !== 'all') {
        if ((payment.payerMode || 'single') !== selectedPayerMode.value) return false
      }

      // Split mode filter
      if (selectedSplitMode.value !== 'all') {
        if ((payment.splitMode || 'equal') !== selectedSplitMode.value) return false
      }

      return true
    })
  })

  // Notifications for current user
  const userNotifications = computed(() => {
    if (!rawPaymentsData.value || !activeUser.value) return []

    const notifications = []

    Object.keys(rawPaymentsData.value).forEach((paymentId) => {
      const payment = rawPaymentsData.value[paymentId]
      if (
        payment &&
        payment.notifications &&
        payment.notifications[activeUser.value]
      ) {
        payment.notifications[activeUser.value].forEach((notif) => {
          notifications.push({
            ...notif,
            paymentId,
            monthYear: selectedMonth.value
          })
        })
      }
    })

    return notifications.sort((a, b) => b.timestamp - a.timestamp)
  })

  const dismissNotification = async (notificationId) => {
    const groupId = activeGroup.value || 'global'

    for (const paymentId of Object.keys(rawPaymentsData.value)) {
      const payment = rawPaymentsData.value[paymentId]
      if (payment.notifications && payment.notifications[activeUser.value]) {
        const filtered = payment.notifications[activeUser.value].filter(
          (n) => n.id !== notificationId
        )

        if (
          filtered.length !== payment.notifications[activeUser.value].length
        ) {
          const paymentPath = `${props.dbRef}/${groupId}/${selectedMonth.value}/${paymentId}`

          if (filtered.length === 0) {
            await deleteData(
              `${paymentPath}/notifications/${activeUser.value}`,
              ''
            )
          } else {
            await updateData(
              `${paymentPath}/notifications/${activeUser.value}`,
              () => filtered,
              ''
            )
          }
          break
        }
      }
    }
  }

  // Approval request logic
  const pendingRequests = computed(() => {
    if (!rawPaymentsData.value) return []

    const requests = []

    Object.keys(rawPaymentsData.value).forEach((paymentId) => {
      const payment = rawPaymentsData.value[paymentId]
      const commonPayment = {
        paymentId,
        payment: {
          amount: payment.amount,
          payer: payment.payer,
          description: payment.description,
          date: payment.date
        },
        monthYear: selectedMonth.value
      }
      if (payment.deleteRequest && payment.amount) {
        requests.push({
          type: 'delete',
          ...commonPayment,
          requestedBy: payment.deleteRequest.requestedBy,
          requestedByName: payment.deleteRequest.requestedByName,
          approvals: payment.deleteRequest.approvals || [],
          requestedAt: payment.deleteRequest.requestedAt
        })
      }

      if (payment.updateRequest && payment.amount) {
        requests.push({
          type: 'update',
          ...commonPayment,
          requestedBy: payment.updateRequest.requestedBy,
          requestedByName: payment.updateRequest.requestedByName,
          approvals: payment.updateRequest.approvals || [],
          requestedAt: payment.updateRequest.requestedAt,
          changes: payment.updateRequest.changes
        })
      }
    })

    return requests
  })

  const getTotalMembers = () => {
    return groupObj.value?.members?.length || 0
  }

  const getUserName = (mobile) => {
    return userStore.getUserByMobile(mobile)?.name || mobile
  }

  const hasUserApproved = (request) => {
    return request.approvals.includes(activeUser.value)
  }

  const isFullyApproved = (request) => {
    return request.approvals.length >= getTotalMembers()
  }

  const executeRequestManually = async (request) => {
    const groupId = activeGroup.value || 'global'
    await executeRequest(request, groupId)
  }

  const cancelRequest = async (request) => {
    ElMessageBox.confirm(
      `Are you sure you want to cancel this ${request.type} request?`,
      'Cancel Request',
      {
        confirmButtonText: 'Yes, Cancel',
        cancelButtonText: 'No',
        type: 'warning'
      }
    )
      .then(async () => {
        const groupId = activeGroup.value || 'global'
        const paymentPath = `${props.dbRef}/${groupId}/${request.monthYear}/${request.paymentId}`
        const requestPath = `${paymentPath}/${request.type}Request`

        await deleteData(
          requestPath,
          `${request.type} request has been cancelled.`
        )
      })
      .catch(() => {})
  }

  const approveRequest = async (request) => {
    const groupId = activeGroup.value || 'global'
    const requestPath = `${props.dbRef}/${groupId}/${request.monthYear}/${request.paymentId}/${request.type}Request`

    const updatedApprovals = [...request.approvals, activeUser.value]

    await updateData(
      requestPath,
      () => ({ approvals: updatedApprovals }),
      'Your approval has been recorded.'
    )

    if (updatedApprovals.length >= getTotalMembers()) {
      await executeRequest(request, groupId)
    }
  }

  const rejectRequest = async (request) => {
    ElMessageBox.confirm(
      `Are you sure you want to reject this ${request.type} request?`,
      'Confirm Rejection',
      {
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
      .then(async () => {
        const groupId = activeGroup.value || 'global'
        const paymentPath = `${props.dbRef}/${groupId}/${request.monthYear}/${request.paymentId}`
        const currentUser = userStore.getUserByMobile(activeUser.value)

        const notification = {
          id: Date.now().toString() + Math.random(),
          type: 'rejected',
          message: `Your ${request.type} request for payment was rejected`,
          byName: currentUser?.name || activeUser.value,
          timestamp: Date.now()
        }

        const existingNotifications =
          rawPaymentsData.value[request.paymentId]?.notifications?.[
            request.requestedBy
          ] || []
        await updateData(
          `${paymentPath}/notifications`,
          () => ({
            ...rawPaymentsData.value[request.paymentId]?.notifications,
            [request.requestedBy]: [...existingNotifications, notification]
          }),
          ''
        )

        const requestPath = `${paymentPath}/${request.type}Request`
        await deleteData(
          requestPath,
          `${request.type} request has been rejected.`
        )
      })
      .catch(() => {})
  }

  const executeRequest = async (request, groupId) => {
    const paymentPath = `${props.dbRef}/${groupId}/${request.monthYear}/${request.paymentId}`

    await deleteData(`${paymentPath}/${request.type}Request`, '')

    const notification = {
      id: Date.now().toString() + Math.random(),
      type: 'approved',
      message: `Your ${request.type} request for payment has been approved by all members`,
      timestamp: Date.now()
    }

    if (request.type === 'delete') {
      const existingNotifications =
        rawPaymentsData.value[request.paymentId]?.notifications?.[
          request.requestedBy
        ] || []
      await updateData(
        `${paymentPath}/notifications`,
        () => ({
          ...rawPaymentsData.value[request.paymentId]?.notifications,
          [request.requestedBy]: [...existingNotifications, notification]
        }),
        ''
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      await deleteData(
        paymentPath,
        'Payment has been deleted (approved by all members).'
      )
    } else if (request.type === 'update') {
      const updatedPayment = {
        ...rawPaymentsData.value[request.paymentId],
        ...request.changes
      }

      delete updatedPayment.deleteRequest
      delete updatedPayment.updateRequest

      if (!updatedPayment.notifications) {
        updatedPayment.notifications = {}
      }
      if (!updatedPayment.notifications[request.requestedBy]) {
        updatedPayment.notifications[request.requestedBy] = []
      }
      updatedPayment.notifications[request.requestedBy].push(notification)

      await updateData(
        paymentPath,
        () => updatedPayment,
        'Payment has been updated (approved by all members).'
      )
    }
  }

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
