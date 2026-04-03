import { computed, inject, ref } from 'vue'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { useFireBase } from '@/composables'
import { showError, showSuccess } from '@/utils'
import { ElMessageBox } from 'element-plus'
import { DB_NODES } from '@/constants'
import { database, writeBatch, doc, deleteField } from '@/firebase'

export const Settlement = (props) => {
  const { updateData } = useFireBase()
  const formatAmount = inject('formatAmount')
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()

  const user = ref(authStore.activeUser)
  const activeGroup = computed(() => groupStore.getActiveGroup)
  const group = computed(() =>
    activeGroup.value ? groupStore.getGroupById(activeGroup.value) : null
  )

  const isAdmin = computed(() => {
    if (!group.value) return false
    return group.value.ownerMobile === authStore.getActiveUser
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
    const mobile = authStore.getActiveUser
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

      const mobile = authStore.getActiveUser

      const newSettlementRequest = {
        requested: true,
        requestedBy: mobile,
        requestedAt: new Date().toISOString(),
        month: props.selectedMonth,
        approvals: [{ mobile }]
      }

      const groupId = activeGroup.value
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ settlementRequest: newSettlementRequest }),
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

      const mobile = authStore.getActiveUser

      const updatedRequest = { ...settlementRequest.value }
      if (!updatedRequest.approvals) {
        updatedRequest.approvals = []
      }

      updatedRequest.approvals.push({ mobile })

      const groupId = activeGroup.value
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ settlementRequest: updatedRequest }),
        ''
      )

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
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ settlementRequest: deleteField() }),
        ''
      )

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
      const selectedMonth = props.selectedMonth

      // Firestore hard limit: 500 operations per batch.
      // Each payment costs 2 ops (set to backup + delete from source).
      // Reserve 1 op for the group settlement-request update in the last chunk.
      const BATCH_CHUNK = 249 // 249 * 2 = 498 ops + 1 group update = 499 ≤ 500

      for (let i = 0; i < props.payments.length; i += BATCH_CHUNK) {
        const chunkPayments = props.payments.slice(i, i + BATCH_CHUNK)
        const chunkKeys = props.keys.slice(i, i + BATCH_CHUNK)
        const isLastChunk = i + BATCH_CHUNK >= props.payments.length

        const batch = writeBatch(database)

        chunkPayments.forEach((payment, index) => {
          const key = chunkKeys[index]
          const backupRef = doc(
            database,
            DB_NODES.SHARED_EXPENSES_BACKUP,
            groupId,
            'months',
            selectedMonth,
            'payments',
            key
          )
          batch.set(backupRef, payment)

          const sourceRef = doc(
            database,
            DB_NODES.SHARED_EXPENSES,
            groupId,
            'months',
            selectedMonth,
            'payments',
            key
          )
          batch.delete(sourceRef)
        })

        // Include the group settlement-request removal in the last batch
        if (isLastChunk && activeGroup.value && hasSettlementRequest.value) {
          const groupRef = doc(database, DB_NODES.GROUPS, activeGroup.value)
          batch.update(groupRef, { settlementRequest: deleteField() })
        }

        await batch.commit()
      }
      showSuccess(
        'Expenses added to Backup successfully! ' +
          selectedMonth +
          ' data cleared.'
      )
    } catch (error) {
      if (error != 'cancel') showError(error)
    }
  }

  // Compute balances
  const balances = computed(() => {
    const map = {}
    const users =
      userStore.getUsers && userStore.getUsers.length ? userStore.getUsers : []
    if (users.length) users.forEach((u) => (map[u.uid || u.mobile] = 0))

    props.payments.forEach((payment) => {
      const amount = payment.amount || 0
      const participants =
        payment.participants && payment.participants.length
          ? payment.participants
          : users.map((u) => u.uid || u.mobile)

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
