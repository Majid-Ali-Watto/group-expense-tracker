import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useGroupStore } from '../stores/groupStore'
import { useUserStore } from '../stores/userStore'
import { onValue, off } from '../firebase'
import useFireBase from '../api/firebase-apis'
import { Tabs } from '../assets/enums'
import getCurrentMonth from './getCurrentMonth'
import { DB_NODES } from '../constants/db-nodes'
import { maskMobile } from './maskMobile'
import {
  isMemberOfGroup,
  hasPendingRequest,
  hasDeleteRequest,
  getLeaveRequests,
  hasEditRequest,
  isUserAffectedByEdit,
  hasUserApprovedEditRequest,
  hasAddMemberRequest,
  hasUserApprovedAddMemberRequest,
  hasUserApprovedDeletion,
  hasUserApprovedJoinRequest,
  hasUserApprovedLeaveRequest,
  hasUserApprovedOwnershipTransfer
} from '../helpers/users'

export function useGlobalNotifications() {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { dbRef } = useFireBase()

  const activeUser = computed(() => authStore.getActiveUser)
  const groups = computed(() => groupStore.getGroups || [])
  const users = computed(() => userStore.getUsers || [])

  // Early return if no active user - avoid expensive computations
  if (!activeUser.value) {
    return {
      allNotifications: computed(() => []),
      notificationCount: computed(() => 0),
      cleanup: () => {}
    }
  }

  // ─── Group notifications ─────────────────────────────────────────────────
  const groupNotifications = computed(() => {
    const me = activeUser.value
    if (!me) return []
    const result = []

    // Pending invitations
    groups.value
      .filter((g) => (g.pendingMembers || []).some((m) => m.mobile === me))
      .forEach((group) => {
        result.push({
          id: `invite-${group.id}`,
          icon: '📨',
          title: group.name,
          description: `Invited by ${userStore.getUserByMobile(group.ownerMobile)?.name || group.ownerMobile} (${maskMobile(group.ownerMobile)})`,  
          tab: Tabs.GROUPS,
          groupId: group.id,
          category: 'Groups'
        })
      })

    // Pending invitations visible to the group creator
    groups.value
      .filter((g) => g.ownerMobile === me && (g.pendingMembers || []).length)
      .forEach((group) => {
        ;(group.pendingMembers || []).forEach((member) => {
          result.push({
            id: `pending-invite-${group.id}-${member.mobile}`,
            icon: '⏳',
            title: group.name,
            description: `${userStore.getUserByMobile(member.mobile)?.name || member.mobile} (${maskMobile(member.mobile)}) hasn't responded to your invitation`,  
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        })
      })

    // Join request approval status (visible to the requester)
    groups.value
      .filter((g) => hasPendingRequest(g))
      .forEach((group) => {
        const request = (group.joinRequests || []).find((r) => r.mobile === me)
        if (!request) return
        const approvedCount = (request.approvals || []).length
        const totalCount = (group.members || []).length
        result.push({
          id: `join-status-${group.id}`,
          icon: '⏳',
          title: group.name,
          description: `Your join request: ${approvedCount}/${totalCount} member${totalCount !== 1 ? 's' : ''} approved`,
          tab: Tabs.GROUPS,
          groupId: group.id,
          category: 'Groups'
        })
      })

    // Rejection notifications for non-members (join request was rejected)
    groups.value
      .filter((g) => !isMemberOfGroup(g) && !hasPendingRequest(g))
      .forEach((group) => {
        ;(group.notifications?.[me] || []).forEach((notif) => {
          result.push({
            id: `group-notif-${group.id}-${notif.id}`,
            icon: '❌',
            title: group.name,
            description: notif.message,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        })
      })

    // Requests inside joined groups
    groups.value
      .filter((g) => isMemberOfGroup(g))
      .forEach((group) => {
        ;(group.joinRequests || [])
          .filter((req) => !hasUserApprovedJoinRequest(group, req.mobile))
          .forEach((req) => {
            result.push({
              id: `join-${group.id}-${req.mobile}`,
              icon: '👋',
              title: group.name,
              description: `${userStore.getUserByMobile(req.mobile)?.name || req.mobile} (${maskMobile(req.mobile)}) wants to join`,  
              tab: Tabs.GROUPS,
              groupId: group.id,
              category: 'Groups'
            })
          })

        if (hasDeleteRequest(group) && !hasUserApprovedDeletion(group)) {
          const delBy = group.deleteRequest?.requestedBy
          const delByName = userStore.getUserByMobile(delBy)?.name || delBy
          result.push({
            id: `del-${group.id}`,
            icon: '⚠️',
            title: group.name,
            description: `Delete group requested by ${delByName} (${maskMobile(delBy)})`,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        }

        getLeaveRequests(group)
          .filter(
            (req) =>
              req.mobile !== me &&
              !hasUserApprovedLeaveRequest(group, req.mobile)
          )
          .forEach((req) => {
            result.push({
              id: `leave-${group.id}-${req.mobile}`,
              icon: '🚪',
              title: group.name,
              description: `${userStore.getUserByMobile(req.mobile)?.name || req.mobile} (${maskMobile(req.mobile)}) wants to leave`,  
              tab: Tabs.GROUPS,
              groupId: group.id,
              category: 'Groups'
            })
          })

        if (
          hasEditRequest(group) &&
          isUserAffectedByEdit(group) &&
          !hasUserApprovedEditRequest(group)
        ) {
          const er = group.editRequest
          const erByName = userStore.getUserByMobile(er.requestedBy)?.name || er.requestedBy
          const erParts = []
          if (er.name && er.name !== group.name) erParts.push(`name → "${er.name}"`)
          if ((er.addedMembers || []).length) erParts.push(`+${er.addedMembers.length} member${er.addedMembers.length > 1 ? 's' : ''}`)
          if ((er.removedMembers || []).length) erParts.push(`-${er.removedMembers.length} member${er.removedMembers.length > 1 ? 's' : ''}`)
          const erDetail = erParts.length ? `: ${erParts.join(', ')}` : ''
          result.push({
            id: `edit-${group.id}`,
            icon: '📝',
            title: group.name,
            description: `Edit by ${erByName} (${maskMobile(er.requestedBy)})${erDetail}`,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        }

        if (
          hasAddMemberRequest(group) &&
          !hasUserApprovedAddMemberRequest(group)
        ) {
          const nm = group.addMemberRequest.newMember.mobile
          const nmName = userStore.getUserByMobile(nm)?.name || nm
          result.push({
            id: `addmem-${group.id}`,
            icon: '➕',
            title: group.name,
            description: `Add member: ${nmName} (${maskMobile(nm)})`,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        }

        if (
          group.transferOwnershipRequest &&
          !hasUserApprovedOwnershipTransfer(group)
        ) {
          const tor = group.transferOwnershipRequest
          const torFrom = userStore.getUserByMobile(tor.requestedBy)?.name || tor.requestedBy
          const torTo = userStore.getUserByMobile(tor.newOwner)?.name || tor.newOwner
          result.push({
            id: `transfer-${group.id}`,
            icon: '👑',
            title: group.name,
            description: `Transfer ownership: ${torFrom} (${maskMobile(tor.requestedBy)}) → ${torTo} (${maskMobile(tor.newOwner)})`,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        }
      })

    return result
  })

  // ─── User notifications ──────────────────────────────────────────────────
  const userNotifications = computed(() => {
    const me = activeUser.value
    if (!me) return []
    return users.value.flatMap((u) => {
      const result = []
      const check = (req, type) => {
        if (
          req?.requiredApprovals?.includes(me) &&
          !req.approvals?.some((a) => a.mobile === me)
        ) {
          result.push({
            id: `user-${type}-${u.mobile}`,
            icon: type === 'delete' ? '🗑️' : '✏️',
            title: 'Users',
            description: type === 'delete'
              ? `Delete request for ${u.name} (${maskMobile(u.mobile)})`
              : `Update request for ${u.name} (${maskMobile(u.mobile)}): Name → "${req.newName}"`,  
            tab: Tabs.USERS,
            category: 'Users'
          })
        }
      }
      check(u.deleteRequest, 'delete')
      check(u.updateRequest, 'update')
      return result
    })
  })

  // ─── Expense / Loan notifications ────────────────────────────────────────
  const expenseNotifs = ref({})
  const loanNotifs = ref({})
  const listeners = []

  function subscribeToExpensesAndLoans() {
    const me = activeUser.value
    if (!me) return

    listeners.forEach(({ r, fn }) => off(r, 'value', fn))
    listeners.length = 0

    const month = getCurrentMonth()
    const joined = groups.value.filter((g) => isMemberOfGroup(g))

    joined.forEach((group) => {
      // Shared expenses
      const eRef = dbRef(`${DB_NODES.SHARED_EXPENSES}/${group.id}/${month}`)
      const eFn = (snap) => {
        const notifs = []
        if (snap.exists()) {
          Object.entries(snap.val()).forEach(([paymentId, payment]) => {
            if (!payment.amount) return
            if (
              payment.deleteRequest &&
              !payment.deleteRequest.approvals?.some((a) => a.mobile === me)
            ) {
              notifs.push({
                id: `exp-del-${group.id}-${paymentId}`,
                icon: '🧾',
                title: group.name,
                description: `Delete expense: ${payment.description || payment.amount}`,
                tab: Tabs.SHARED_EXPENSES,
                groupId: group.id,
                category: 'Shared Expenses'
              })
            }
            if (
              payment.updateRequest &&
              !payment.updateRequest.approvals?.some((a) => a.mobile === me)
            ) {
              const ch = payment.updateRequest.changes || {}
              const diffParts = []
              if (ch.amount !== undefined && ch.amount !== payment.amount)
                diffParts.push(`Amount: ${payment.amount}→${ch.amount}`)
              if (ch.description !== undefined && ch.description !== payment.description)
                diffParts.push(`Desc: "${payment.description}"→"${ch.description}"`)
              if (ch.payer !== undefined && ch.payer !== payment.payer)
                diffParts.push(`Payer: ${payment.payer}→${ch.payer}`)
              const diffStr = diffParts.length ? ` [${diffParts.join(' | ')}]` : ''
              notifs.push({
                id: `exp-upd-${group.id}-${paymentId}`,
                icon: '🧾',
                title: group.name,
                description: `Update expense${diffStr || ': ' + (payment.description || payment.amount)}`,
                tab: Tabs.SHARED_EXPENSES,
                groupId: group.id,
                category: 'Shared Expenses'
              })
            }
          })
        }
        expenseNotifs.value = { ...expenseNotifs.value, [group.id]: notifs }
      }
      onValue(eRef, eFn)
      listeners.push({ r: eRef, fn: eFn })

      // Shared loans
      const lRef = dbRef(`${DB_NODES.SHARED_LOANS}/${group.id}/${month}`)
      const lFn = (snap) => {
        const notifs = []
        if (snap.exists()) {
          Object.entries(snap.val()).forEach(([loanId, loan]) => {
            if (!loan.amount) return
            if (
              loan.deleteRequest &&
              !loan.deleteRequest.approvals?.some((a) => a.mobile === me)
            ) {
              notifs.push({
                id: `loan-del-${group.id}-${loanId}`,
                icon: '💰',
                title: group.name,
                description: `Delete loan: ${loan.description || loan.amount}`,
                tab: Tabs.SHARED_LOANS,
                groupId: group.id,
                category: 'Shared Loans'
              })
            }
            if (
              loan.updateRequest &&
              !loan.updateRequest.approvals?.some((a) => a.mobile === me)
            ) {
              const ch = loan.updateRequest.changes || {}
              const diffParts = []
              if (ch.amount !== undefined && ch.amount !== loan.amount)
                diffParts.push(`Amount: ${loan.amount}→${ch.amount}`)
              if (ch.description !== undefined && ch.description !== loan.description)
                diffParts.push(`Desc: "${loan.description}"→"${ch.description}"`)
              if (ch.giver !== undefined && ch.giver !== loan.giver)
                diffParts.push(`Giver: ${loan.giver}→${ch.giver}`)
              if (ch.receiver !== undefined && ch.receiver !== loan.receiver)
                diffParts.push(`Receiver: ${loan.receiver}→${ch.receiver}`)
              const diffStr = diffParts.length ? ` [${diffParts.join(' | ')}]` : ''
              notifs.push({
                id: `loan-upd-${group.id}-${loanId}`,
                icon: '💰',
                title: group.name,
                description: `Update loan${diffStr || ': ' + (loan.description || loan.amount)}`,
                tab: Tabs.SHARED_LOANS,
                groupId: group.id,
                category: 'Shared Loans'
              })
            }
          })
        }
        loanNotifs.value = { ...loanNotifs.value, [group.id]: notifs }
      }
      onValue(lRef, lFn)
      listeners.push({ r: lRef, fn: lFn })
    })
  }

  watch(
    [activeUser, () => groups.value.map((g) => g.id).join(',')],
    () => subscribeToExpensesAndLoans(),
    { immediate: true }
  )

  const cleanup = () => {
    listeners.forEach(({ r, fn }) => off(r, 'value', fn))
    listeners.length = 0
    expenseNotifs.value = {}
    loanNotifs.value = {}
  }

  const allNotifications = computed(() => [
    ...groupNotifications.value,
    ...userNotifications.value,
    ...Object.values(expenseNotifs.value).flat(),
    ...Object.values(loanNotifs.value).flat()
  ])

  return {
    allNotifications,
    notificationCount: computed(() => allNotifications.value.length),
    cleanup
  }
}
