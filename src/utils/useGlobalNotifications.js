import { computed, ref, onUnmounted, watch } from 'vue'
import { store } from '../stores/store'
import { onValue, off } from '../firebase'
import useFireBase from '../api/firebase-apis'
import { Tabs } from '../assets/enums'
import getCurrentMonth from './getCurrentMonth'
import {
  isMemberOfGroup,
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
  const userStore = store()
  const { dbRef } = useFireBase()

  const activeUser = computed(() => userStore.getActiveUser)
  const groups = computed(() => userStore.getGroups || [])
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
          description: `Invited by ${userStore.getUserByMobile(group.ownerMobile)?.name || group.ownerMobile}`,
          tab: Tabs.GROUPS,
          groupId: group.id,
          category: 'Groups'
        })
      })

    // Requests inside joined groups
    groups.value
      .filter((g) => isMemberOfGroup(g))
      .forEach((group) => {
        ;(group.joinRequests || [])
          .filter((req) => !hasUserApprovedJoinRequest(group, req.mobile))
          .forEach((req) => {
            result.push({ id: `join-${group.id}-${req.mobile}`, icon: '👋', title: group.name, description: `${req.name} wants to join`, tab: Tabs.GROUPS, groupId: group.id, category: 'Groups' })
          })

        if (hasDeleteRequest(group) && !hasUserApprovedDeletion(group)) {
          result.push({ id: `del-${group.id}`, icon: '⚠️', title: group.name, description: 'Group deletion request', tab: Tabs.GROUPS, groupId: group.id, category: 'Groups' })
        }

        getLeaveRequests(group)
          .filter((req) => req.mobile !== me && !hasUserApprovedLeaveRequest(group, req.mobile))
          .forEach((req) => {
            result.push({ id: `leave-${group.id}-${req.mobile}`, icon: '🚪', title: group.name, description: `${req.name} wants to leave`, tab: Tabs.GROUPS, groupId: group.id, category: 'Groups' })
          })

        if (hasEditRequest(group) && isUserAffectedByEdit(group) && !hasUserApprovedEditRequest(group)) {
          result.push({ id: `edit-${group.id}`, icon: '📝', title: group.name, description: 'Group edit request', tab: Tabs.GROUPS, groupId: group.id, category: 'Groups' })
        }

        if (hasAddMemberRequest(group) && !hasUserApprovedAddMemberRequest(group)) {
          result.push({ id: `addmem-${group.id}`, icon: '➕', title: group.name, description: `Add ${group.addMemberRequest.newMember.name}`, tab: Tabs.GROUPS, groupId: group.id, category: 'Groups' })
        }

        if (group.transferOwnershipRequest && !hasUserApprovedOwnershipTransfer(group)) {
          result.push({ id: `transfer-${group.id}`, icon: '👑', title: group.name, description: 'Ownership transfer request', tab: Tabs.GROUPS, groupId: group.id, category: 'Groups' })
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
        if (req?.requiredApprovals?.includes(me) && !req.approvals?.some((a) => a.mobile === me)) {
          result.push({
            id: `user-${type}-${u.mobile}`,
            icon: type === 'delete' ? '🗑️' : '✏️',
            title: 'Users',
            description: `${type === 'delete' ? 'Delete' : 'Update'} request for ${u.name}`,
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
      const eRef = dbRef(`payments/${group.id}/${month}`)
      const eFn = (snap) => {
        const notifs = []
        if (snap.exists()) {
          Object.entries(snap.val()).forEach(([paymentId, payment]) => {
            if (!payment.amount) return
            if (payment.deleteRequest && !payment.deleteRequest.approvals?.some((a) => a.mobile === me)) {
              notifs.push({ id: `exp-del-${group.id}-${paymentId}`, icon: '🧾', title: group.name, description: `Delete expense: ${payment.description || payment.amount}`, tab: Tabs.SHARED_EXPENSES, groupId: group.id, category: 'Shared Expenses' })
            }
            if (payment.updateRequest && !payment.updateRequest.approvals?.some((a) => a.mobile === me)) {
              notifs.push({ id: `exp-upd-${group.id}-${paymentId}`, icon: '🧾', title: group.name, description: `Update expense: ${payment.description || payment.amount}`, tab: Tabs.SHARED_EXPENSES, groupId: group.id, category: 'Shared Expenses' })
            }
          })
        }
        expenseNotifs.value = { ...expenseNotifs.value, [group.id]: notifs }
      }
      onValue(eRef, eFn)
      listeners.push({ r: eRef, fn: eFn })

      // Shared loans
      const lRef = dbRef(`loans/${group.id}/${month}`)
      const lFn = (snap) => {
        const notifs = []
        if (snap.exists()) {
          Object.entries(snap.val()).forEach(([loanId, loan]) => {
            if (!loan.amount) return
            if (loan.deleteRequest && !loan.deleteRequest.approvals?.some((a) => a.mobile === me)) {
              notifs.push({ id: `loan-del-${group.id}-${loanId}`, icon: '💰', title: group.name, description: `Delete loan: ${loan.description || loan.amount}`, tab: Tabs.SHARED_LOANS, groupId: group.id, category: 'Shared Loans' })
            }
            if (loan.updateRequest && !loan.updateRequest.approvals?.some((a) => a.mobile === me)) {
              notifs.push({ id: `loan-upd-${group.id}-${loanId}`, icon: '💰', title: group.name, description: `Update loan: ${loan.description || loan.amount}`, tab: Tabs.SHARED_LOANS, groupId: group.id, category: 'Shared Loans' })
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

  onUnmounted(() => {
    cleanup()
  })

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
