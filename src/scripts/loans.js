import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { onValue, off } from '../firebase'
import { friends } from '../assets/data'
import { store } from '../stores/store'
import useFireBase from '../api/firebase-apis'
import { ElMessageBox } from 'element-plus'

export const Loans = () => {
  const userStore = store()
  const { dbRef, updateData, deleteData } = useFireBase()
  const formatAmount = inject('formatAmount')

  const showLoanForm = ref(false)
  const closeLoanForm = () => {
    showLoanForm.value = !showLoanForm.value
  }

  const selectedMonth = ref('All')
  const selectedGiver = ref('All')
  const months = ref([])

  const activeGroup = computed(() => userStore.getActiveGroup)
  const activeUser = computed(() => userStore.getActiveUser)
  const groupObj = computed(() =>
    activeGroup.value ? userStore.getGroupById(activeGroup.value) : null
  )

  const usersList = computed(() => {
    if (
      groupObj.value &&
      groupObj.value.members &&
      groupObj.value.members.length
    ) {
      return groupObj.value.members.map((m) => ({
        name: m.name,
        mobile: m.mobile
      }))
    }
    return userStore.getUsers && userStore.getUsers.length
      ? userStore.getUsers
      : friends.map((f) => ({ name: f, mobile: f }))
  })

  const usersOptions = computed(() => {
    return usersList.value.map((u) => ({
      label: `${u.name} (${u.mobile})`,
      value: u.mobile
    }))
  })

  const loans = ref([])
  const loanKeys = ref([])
  const rawLoansData = ref({})
  const loanContent = ref(null)

  let loansRef = null

  const fetchLoans = () => {
    if (loansRef) {
      off(loansRef)
    }

    const groupId = activeGroup.value || 'global'
    const path = `loans/${groupId}`
    loansRef = dbRef(path)

    onValue(loansRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        rawLoansData.value = data

        const loansArray = []
        const keysArray = []
        const monthsSet = new Set()

        Object.keys(data).forEach((key) => {
          if (data[key] && data[key].amount) {
            loansArray.push(data[key])
            keysArray.push(key)

            if (data[key].date) {
              const date = new Date(data[key].date)
              const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
              monthsSet.add(monthYear)
            }
          }
        })

        loans.value = loansArray
        loanKeys.value = keysArray

        months.value = Array.from(monthsSet).sort((a, b) => {
          const [aMonth, aYear] = a.split('/').map(Number)
          const [bMonth, bYear] = b.split('/').map(Number)
          return bYear - aYear || bMonth - aMonth
        })
      } else {
        loans.value = []
        loanKeys.value = []
        rawLoansData.value = {}
        months.value = []
      }
    })
  }

  onMounted(() => {
    fetchLoans()
  })

  watch(activeGroup, () => {
    fetchLoans()
  })

  onUnmounted(() => {
    if (loansRef) {
      off(loansRef)
    }
  })

  setTimeout(() => {
    userStore.setLoansRef(loanContent.value)
  }, 1000)

  const filteredLoans = computed(() => {
    if (!loans.value) return []

    return loans.value.filter((loan) => {
      if (selectedGiver.value !== 'All' && loan.giver !== selectedGiver.value) {
        return false
      }

      if (selectedMonth.value !== 'All' && loan.date) {
        const date = new Date(loan.date)
        const loanMonthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
        if (loanMonthYear !== selectedMonth.value) {
          return false
        }
      }

      return true
    })
  })

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
      name: userStore.getUserByMobile(mobile)?.name || mobile,
      amount: balanceMap[mobile]
    }))
  })

  // Notifications for current user
  const userNotifications = computed(() => {
    if (!rawLoansData.value || !activeUser.value) return []

    const notifications = []

    Object.keys(rawLoansData.value).forEach((loanId) => {
      const loan = rawLoansData.value[loanId]
      if (loan && loan.notifications && loan.notifications[activeUser.value]) {
        loan.notifications[activeUser.value].forEach((notif) => {
          notifications.push({ ...notif, loanId })
        })
      }
    })

    return notifications.sort((a, b) => b.timestamp - a.timestamp)
  })

  const dismissNotification = async (notificationId) => {
    const groupId = activeGroup.value || 'global'

    for (const loanId of Object.keys(rawLoansData.value)) {
      const loan = rawLoansData.value[loanId]
      if (loan.notifications && loan.notifications[activeUser.value]) {
        const filtered = loan.notifications[activeUser.value].filter(
          (n) => n.id !== notificationId
        )

        if (filtered.length !== loan.notifications[activeUser.value].length) {
          if (filtered.length === 0) {
            await deleteData(
              `loans/${groupId}/${loanId}/notifications/${activeUser.value}`,
              ''
            )
          } else {
            await updateData(
              `loans/${groupId}/${loanId}/notifications/${activeUser.value}`,
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
    if (!rawLoansData.value) return []

    const requests = []

    Object.keys(rawLoansData.value).forEach((loanId) => {
      const loan = rawLoansData.value[loanId]

      if (loan.deleteRequest && loan.amount) {
        requests.push({
          type: 'delete',
          loanId,
          loan: {
            amount: loan.amount,
            giver: loan.giver,
            receiver: loan.receiver,
            description: loan.description
          },
          requestedBy: loan.deleteRequest.requestedBy,
          requestedByName: loan.deleteRequest.requestedByName,
          approvals: loan.deleteRequest.approvals || [],
          requestedAt: loan.deleteRequest.requestedAt
        })
      }

      if (loan.updateRequest && loan.amount) {
        requests.push({
          type: 'update',
          loanId,
          loan: {
            amount: loan.amount,
            giver: loan.giver,
            receiver: loan.receiver,
            description: loan.description
          },
          requestedBy: loan.updateRequest.requestedBy,
          requestedByName: loan.updateRequest.requestedByName,
          approvals: loan.updateRequest.approvals || [],
          requestedAt: loan.updateRequest.requestedAt,
          changes: loan.updateRequest.changes
        })
      }
    })

    return requests
  })

  const memberCount = computed(() => groupObj.value?.members?.length || 0)

  const getTotalMembers = () => {
    return memberCount.value
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
        const loanPath = `loans/${groupId}/${request.loanId}`
        const requestPath = `${loanPath}/${request.type}Request`

        await deleteData(
          requestPath,
          `${request.type} request has been cancelled.`
        )
      })
      .catch(() => {})
  }

  const approveRequest = async (request) => {
    const groupId = activeGroup.value || 'global'
    const requestPath = `loans/${groupId}/${request.loanId}/${request.type}Request`

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
        const loanPath = `loans/${groupId}/${request.loanId}`
        const currentUser = userStore.getUserByMobile(activeUser.value)

        const notification = {
          id: Date.now().toString() + Math.random(),
          type: 'rejected',
          message: `Your ${request.type} request for loan was rejected`,
          byName: currentUser?.name || activeUser.value,
          timestamp: Date.now()
        }

        const existingNotifications =
          rawLoansData.value[request.loanId]?.notifications?.[
            request.requestedBy
          ] || []
        await updateData(
          `${loanPath}/notifications`,
          () => ({
            ...rawLoansData.value[request.loanId]?.notifications,
            [request.requestedBy]: [...existingNotifications, notification]
          }),
          ''
        )

        const requestPath = `${loanPath}/${request.type}Request`
        await deleteData(
          requestPath,
          `${request.type} request has been rejected.`
        )
      })
      .catch(() => {})
  }

  const executeRequest = async (request, groupId) => {
    const loanPath = `loans/${groupId}/${request.loanId}`

    await deleteData(`${loanPath}/${request.type}Request`, '')

    const notification = {
      id: Date.now().toString() + Math.random(),
      type: 'approved',
      message: `Your ${request.type} request for loan has been approved by all members`,
      timestamp: Date.now()
    }

    if (request.type === 'delete') {
      const existingNotifications =
        rawLoansData.value[request.loanId]?.notifications?.[
          request.requestedBy
        ] || []
      await updateData(
        `${loanPath}/notifications`,
        () => ({
          ...rawLoansData.value[request.loanId]?.notifications,
          [request.requestedBy]: [...existingNotifications, notification]
        }),
        ''
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      await deleteData(
        loanPath,
        'Loan has been deleted (approved by all members).'
      )
    } else if (request.type === 'update') {
      const updatedLoan = {
        ...rawLoansData.value[request.loanId],
        ...request.changes
      }

      delete updatedLoan.deleteRequest
      delete updatedLoan.updateRequest

      if (!updatedLoan.notifications) {
        updatedLoan.notifications = {}
      }
      if (!updatedLoan.notifications[request.requestedBy]) {
        updatedLoan.notifications[request.requestedBy] = []
      }
      updatedLoan.notifications[request.requestedBy].push(notification)

      await updateData(
        loanPath,
        () => updatedLoan,
        'Loan has been updated (approved by all members).'
      )
    }
  }

  return {
    formatAmount,
    showLoanForm,
    closeLoanForm,
    selectedMonth,
    selectedGiver,
    months,
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
    rejectRequest
  }
}
