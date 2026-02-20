import { computed, inject, ref } from 'vue'
import { store } from '../stores/store'
import useFireBase from '../api/firebase-apis'
import { showError, showSuccess } from '../utils/showAlerts'
import { ElMessageBox } from 'element-plus'

export const Settlement = (props) => {
  const { updateData, deleteData, setData } = useFireBase()
  const formatAmount = inject('formatAmount')
  const userStore = store()

  const user = ref(userStore.$state.activeUser)
  const activeGroup = computed(() => userStore.getActiveGroup)
  const group = computed(() =>
    activeGroup.value ? userStore.getGroupById(activeGroup.value) : null
  )

  const isAdmin = computed(() => {
    if (!group.value) return false
    return group.value.ownerMobile === userStore.getActiveUser
  })

  // Make settlementRequest reactive to group changes
  const settlementRequest = computed(() => {
    return group.value?.settlementRequest || null
  })

  // Check if there's a pending settlement request
  const hasSettlementRequest = computed(() => {
    return (
      settlementRequest.value !== null && settlementRequest.value !== undefined
    )
  })

  // Check if current user has approved settlement request
  const hasUserApprovedSettlement = computed(() => {
    if (!hasSettlementRequest.value) return false
    const mobile = userStore.getActiveUser
    return (
      settlementRequest.value.approvals?.some((a) => a.mobile === mobile) ||
      false
    )
  })

  // Get settlement approvals
  const getSettlementApprovals = computed(() => {
    return settlementRequest.value?.approvals || []
  })

  // Get all affected members for settlement
  const getAllSettlementMembers = computed(() => {
    if (!group.value) return []
    return group.value.members || []
  })

  // Check if all members approved settlement
  const allMembersApprovedSettlement = computed(() => {
    if (!hasSettlementRequest.value) return false
    const approvals = getSettlementApprovals.value
    const allMembers = getAllSettlementMembers.value
    return allMembers.every((member) =>
      approvals.some((approval) => approval.mobile === member.mobile)
    )
  })

  const updates = ref({})

  // Request settlement (any member can request)
  async function requestSettlement() {
    try {
      await ElMessageBox.confirm(
        'This will send a settlement request to all group members. All members must approve before settlement can be finalized.',
        'Request Settlement',
        {
          confirmButtonText: 'Send Request',
          cancelButtonText: 'Cancel',
          type: 'info'
        }
      )

      if (!activeGroup.value) {
        return showError('No active group selected')
      }

      const mobile = userStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      const newSettlementRequest = {
        requested: true,
        requestedBy: mobile,
        requestedByName: userName,
        requestedAt: new Date().toISOString(),
        month: props.selectedMonth,
        approvals: [{ mobile, name: userName }]
      }

      const groupId = activeGroup.value
      await setData(
        `groups/${groupId}/settlementRequest`,
        newSettlementRequest,
        'Settlement request sent successfully'
      )
    } catch (error) {
      if (error !== 'cancel') showError(error.message || error)
    }
  }

  // Approve settlement request
  async function approveSettlement() {
    try {
      if (!hasSettlementRequest.value) return

      const mobile = userStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      const updatedRequest = { ...settlementRequest.value }
      if (!updatedRequest.approvals) {
        updatedRequest.approvals = []
      }

      updatedRequest.approvals.push({ mobile, name: userName })

      const groupId = activeGroup.value
      await setData(`groups/${groupId}/settlementRequest`, updatedRequest, '')

      showSuccess('You have approved the settlement request')
    } catch (error) {
      showError(error.message || error)
    }
  }

  // Reject settlement request
  async function rejectSettlement() {
    try {
      await ElMessageBox.confirm(
        'This will cancel the settlement request.',
        'Reject Settlement Request',
        {
          confirmButtonText: 'Reject',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      if (!activeGroup.value) return

      const groupId = activeGroup.value
      const { removeData } = useFireBase()
      await removeData(`groups/${groupId}/settlementRequest`)

      showSuccess('Settlement request rejected')
    } catch (error) {
      if (error !== 'cancel') showError(error.message || error)
    }
  }

  // Finalize settlement (admin only, after all approvals)
  async function addPaymentsBatch() {
    try {
      if (activeGroup.value && !allMembersApprovedSettlement.value) {
        return showError(
          'All group members must approve before settlement can be finalized'
        )
      }

      await ElMessageBox.confirm(
        'Are you sure to move expenses to backup and finalize settlement?',
        'Finalize Settlement',
        {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      updates.value = {}
      props.payments.forEach((payment, index) => {
        const key = props.keys[index]
        updates.value[key] = payment
      })

      const groupId = activeGroup.value || 'global'
      const monthPath =
        groupId === 'global'
          ? props.selectedMonth
          : `${groupId}/${props.selectedMonth}`

      updateData(
        `payments-backup/${monthPath}`,
        getData,
        'Expenses added to Backup successfully!'
      )
      deleteData(`payments/${monthPath}`, props.selectedMonth + ' data deleted')

      // Remove settlement request if exists
      if (activeGroup.value && hasSettlementRequest.value) {
        const { removeData } = useFireBase()
        await removeData(`groups/${activeGroup.value}/settlementRequest`)
      }
    } catch (error) {
      if (error != 'cancel') showError(error)
    }
  }

  const getData = () => {
    return updates.value
  }

  // Compute balances
  const balances = computed(() => {
    const map = {}
    const users =
      userStore.getUsers && userStore.getUsers.length ? userStore.getUsers : []
    if (users.length) users.forEach((u) => (map[u.mobile] = 0))

    props.payments.forEach((payment) => {
      const amount = payment.amount || 0
      const participants =
        payment.participants && payment.participants.length
          ? payment.participants
          : users.map((u) => u.mobile)

      let shares = []
      if (
        payment.split &&
        Array.isArray(payment.split) &&
        payment.split.length
      ) {
        shares = payment.split.map((s) => ({
          id: s.mobile,
          share: s.amount
        }))
      } else if (
        participants.length &&
        typeof participants[0] === 'object' &&
        participants[0].share != null
      ) {
        shares = participants.map((p) => ({
          id: p.userId || p.name,
          share: p.share
        }))
      } else {
        const equalShare = participants.length
          ? amount / participants.length
          : 0
        shares = participants.map((p) => ({
          id: typeof p === 'string' ? p : p.userId || p.name,
          share: equalShare
        }))
      }

      shares.forEach((s) => {
        map[s.id] = (map[s.id] || 0) - s.share
      })

      if (payment.payerMode === 'multiple' && payment.payers?.length) {
        payment.payers.forEach((p) => {
          if (p.mobile)
            map[p.mobile] = (map[p.mobile] || 0) + (parseFloat(p.amount) || 0)
        })
      } else if (payment.payer) {
        map[payment.payer] = (map[payment.payer] || 0) + amount
      }
    })

    return Object.keys(map).map((mobile) => ({
      mobile,
      name: userStore.getUserByMobile(mobile)?.name || mobile,
      balance: map[mobile]
    }))
  })

  // Pairwise settlements
  const settlements = computed(() => {
    const list = balances.value.map((b) => ({
      mobile: b.mobile,
      name: b.name,
      balance: Number(b.balance || 0)
    }))
    const creditors = list.filter((l) => l.balance > 0).map((c) => ({ ...c }))
    const debtors = list
      .filter((l) => l.balance < 0)
      .map((d) => ({ ...d, balance: -d.balance }))

    const result = []
    let i = 0
    let j = 0
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]
      const creditor = creditors[j]
      const amt = Math.min(debtor.balance, creditor.balance)
      if (amt > 0) {
        result.push({
          from: debtor.mobile,
          to: creditor.mobile,
          amount: parseFloat(amt.toFixed(2))
        })
        debtor.balance = parseFloat((debtor.balance - amt).toFixed(2))
        creditor.balance = parseFloat((creditor.balance - amt).toFixed(2))
      }
      if (debtor.balance <= 0.001) i++
      if (creditor.balance <= 0.001) j++
    }
    return result
  })

  return {
    formatAmount,
    userStore,
    user,
    addPaymentsBatch,
    settlements,
    isAdmin,
    activeGroup,
    group,
    hasSettlementRequest,
    hasUserApprovedSettlement,
    getSettlementApprovals,
    getAllSettlementMembers,
    allMembersApprovedSettlement,
    requestSettlement,
    approveSettlement,
    rejectSettlement
  }
}
