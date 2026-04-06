import { computed, ref, watch } from 'vue'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { onSnapshot, collection, database } from '@/firebase'
import useFireBase from './useFirebase'
import { Tabs } from '@/assets'
import { getCurrentMonth, maskMobile } from '@/utils'
import { DB_NODES } from '@/constants'
import {
  isMemberOfGroup,
  hasPendingRequest,
  hasDeleteRequest,
  hasEditRequest,
  isUserAffectedByEdit,
  hasUserApprovedEditRequest,
  hasAddMemberRequest,
  hasUserApprovedAddMemberRequest,
  hasUserApprovedDeletion,
  hasUserApprovedJoinRequest,
  isCurrentUserPendingOwner
} from '@/helpers'

export function useGlobalNotifications() {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { dbRef } = useFireBase()

  const activeUser = computed(() => authStore.getActiveUser)
  const groups = computed(() => groupStore.getGroups || [])
  const users = computed(() => userStore.getUsers || [])

  function resolveUser(identity) {
    if (!identity) return null
    return (
      userStore.getUserByUid(identity) || userStore.getUserByMobile(identity)
    )
  }

  function getUserMetaByIdentity(identity, fallbackName = '') {
    const storedUser = resolveUser(identity)
    const mobile = storedUser?.mobile || ''
    const name =
      fallbackName || storedUser?.name || mobile || identity || 'User'

    return {
      name,
      mobile,
      maskedMobile: mobile ? maskMobile(mobile) : ''
    }
  }

  function formatUserWithMobile(identity, fallbackName = '') {
    const { name, maskedMobile } = getUserMetaByIdentity(identity, fallbackName)
    return maskedMobile ? `${name} (${maskedMobile})` : name
  }

  function getUserNotificationMeta(user) {
    const storedUser =
      (user?.uid && resolveUser(user.uid)) ||
      (user?.mobile && resolveUser(user.mobile)) ||
      null

    const name =
      user?.name ||
      storedUser?.name ||
      user?.mobile ||
      storedUser?.mobile ||
      'User'
    const mobile = user?.mobile || storedUser?.mobile || ''

    return {
      name,
      mobile,
      maskedMobile: mobile ? maskMobile(mobile) : ''
    }
  }

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
          description: `Invited by ${formatUserWithMobile(group.ownerMobile)}`,
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
            description: `${formatUserWithMobile(member.mobile)} hasn't responded to your invitation`,
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
              description: `${formatUserWithMobile(req.mobile)} wants to join`,
              tab: Tabs.GROUPS,
              groupId: group.id,
              category: 'Groups'
            })
          })

        if (hasDeleteRequest(group) && !hasUserApprovedDeletion(group)) {
          const delBy = group.deleteRequest?.requestedBy
          result.push({
            id: `del-${group.id}`,
            icon: '⚠️',
            title: group.name,
            description: `Delete group requested by ${formatUserWithMobile(delBy)}`,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        }

        if (
          hasEditRequest(group) &&
          isUserAffectedByEdit(group) &&
          !hasUserApprovedEditRequest(group)
        ) {
          const er = group.editRequest
          const erParts = []
          if (er.name && er.name !== group.name)
            erParts.push(`name → "${er.name}"`)
          if ((er.addedMembers || []).length)
            erParts.push(
              `+${er.addedMembers.length} member${er.addedMembers.length > 1 ? 's' : ''}`
            )
          if ((er.removedMembers || []).length)
            erParts.push(
              `-${er.removedMembers.length} member${er.removedMembers.length > 1 ? 's' : ''}`
            )
          const erDetail = erParts.length ? `: ${erParts.join(', ')}` : ''
          result.push({
            id: `edit-${group.id}`,
            icon: '📝',
            title: group.name,
            description: `Edit by ${formatUserWithMobile(er.requestedBy)}${erDetail}`,
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
          result.push({
            id: `addmem-${group.id}`,
            icon: '➕',
            title: group.name,
            description: `Add member: ${formatUserWithMobile(nm)}`,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        }

        if (
          group.transferOwnershipRequest &&
          isCurrentUserPendingOwner(group)
        ) {
          const tor = group.transferOwnershipRequest
          result.push({
            id: `transfer-${group.id}`,
            icon: '👑',
            title: group.name,
            description: `Transfer ownership: ${formatUserWithMobile(tor.requestedBy)} → ${formatUserWithMobile(tor.newOwner)}`,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        }

        // In-group user-specific notifications (e.g. removal-pending, member-renamed, rejections)
        ;(group.notifications?.[me] || []).forEach((notif) => {
          const iconMap = {
            'removal-pending': '🚪',
            'member-renamed': '✏️',
            rejection: '❌',
            'invitation-accepted': '✅'
          }
          result.push({
            id: `group-user-notif-${group.id}-${notif.id}`,
            icon: iconMap[notif.type] || '🔔',
            title: group.name,
            description: notif.message,
            tab: Tabs.GROUPS,
            groupId: group.id,
            category: 'Groups'
          })
        })
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
          !req.approvals?.some((a) => (a.uid || a.mobile) === me)
        ) {
          const { name, maskedMobile } = getUserNotificationMeta(u)
          const userLabel = maskedMobile ? `${name} (${maskedMobile})` : name
          result.push({
            id: `user-${type}-${u.uid}`,
            icon: type === 'delete' ? '🗑️' : '✏️',
            title: 'Users',
            description:
              type === 'delete'
                ? `Delete request for ${userLabel}`
                : `Update request for ${userLabel}: Name → "${req.newName}"`,
            tab: Tabs.USERS,
            category: 'Users'
          })
        }
      }
      check(u.deleteRequest, 'delete')
      check(u.updateRequest, 'update')

      // Notify the requester themselves about the status of their own delete request
      if (u.uid === me && u.deleteRequest) {
        const approved = u.deleteRequest.approvals?.length || 0
        const required = u.deleteRequest.requiredApprovals?.length || 0
        result.push({
          id: `my-delete-request-${me}`,
          icon: '⏳',
          title: 'Users',
          description: `Your account deletion request is pending approval (${approved}/${required})`,
          tab: Tabs.USERS,
          category: 'Users'
        })
      }

      // Notify the requester when their request was rejected
      if (u.uid === me && u.rejectionNotification?.type === 'delete-rejected') {
        const n = u.rejectionNotification
        result.push({
          id: `my-delete-rejected-${me}`,
          icon: '❌',
          title: 'Users',
          description:
            n.message || 'Your account deletion request was rejected.',
          tab: Tabs.USERS,
          category: 'Users',
          action: 'dismiss-user-rejection',
          userUid: me
        })
      }

      return result
    })
  })

  // ─── Expense / Loan notifications ────────────────────────────────────────
  const expenseNotifs = ref({})
  const loanNotifs = ref({})
  const listeners = [] // expense/loan unsubscribers — cleared on group change
  const bugListeners = [] // bug report unsubscribers — persistent, only cleared on cleanup

  function subscribeToExpensesAndLoans() {
    const me = activeUser.value
    if (!me) return

    listeners.forEach((unsub) => unsub())
    listeners.length = 0

    const month = getCurrentMonth()
    const joined = groups.value.filter((g) => isMemberOfGroup(g))

    joined.forEach((group) => {
      // Shared expenses
      const eRef = dbRef(
        `${DB_NODES.SHARED_EXPENSES}/${group.id}/months/${month}/payments`
      )
      const eUnsub = onSnapshot(eRef, (snap) => {
        const notifs = []
        snap.docs.forEach((docSnap) => {
          const paymentId = docSnap.id
          const payment = docSnap.data()
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
            if (
              ch.description !== undefined &&
              ch.description !== payment.description
            )
              diffParts.push(
                `Desc: "${payment.description}"→"${ch.description}"`
              )
            if (ch.payer !== undefined && ch.payer !== payment.payer)
              diffParts.push(`Payer: ${payment.payer}→${ch.payer}`)
            const diffStr = diffParts.length
              ? ` [${diffParts.join(' | ')}]`
              : ''
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
          // Approval/rejection feedback notifications stored on the expense record
          ;(payment.notifications?.[me] || []).forEach((notif) => {
            notifs.push({
              id: `exp-notif-${group.id}-${paymentId}-${notif.id || notif.timestamp}`,
              icon:
                notif.type === 'approved'
                  ? '✅'
                  : notif.type === 'rejected'
                    ? '❌'
                    : '🧾',
              title: group.name,
              description: notif.message || `Expense notification`,
              tab: Tabs.SHARED_EXPENSES,
              groupId: group.id,
              category: 'Shared Expenses'
            })
          })
        })
        expenseNotifs.value = { ...expenseNotifs.value, [group.id]: notifs }
      })
      listeners.push(eUnsub)

      // Shared loans
      const lRef = dbRef(
        `${DB_NODES.SHARED_LOANS}/${group.id}/months/${month}/loans`
      )
      const lUnsub = onSnapshot(lRef, (snap) => {
        const notifs = []
        snap.docs.forEach((docSnap) => {
          const loanId = docSnap.id
          const loan = docSnap.data()
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
            if (
              ch.description !== undefined &&
              ch.description !== loan.description
            )
              diffParts.push(`Desc: "${loan.description}"→"${ch.description}"`)
            if (ch.giver !== undefined && ch.giver !== loan.giver)
              diffParts.push(`Giver: ${loan.giver}→${ch.giver}`)
            if (ch.receiver !== undefined && ch.receiver !== loan.receiver)
              diffParts.push(`Receiver: ${loan.receiver}→${ch.receiver}`)
            const diffStr = diffParts.length
              ? ` [${diffParts.join(' | ')}]`
              : ''
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
          // Approval/rejection feedback notifications stored on the loan record
          ;(loan.notifications?.[me] || []).forEach((notif) => {
            notifs.push({
              id: `loan-notif-${group.id}-${loanId}-${notif.id || notif.timestamp}`,
              icon:
                notif.type === 'approved'
                  ? '✅'
                  : notif.type === 'rejected'
                    ? '❌'
                    : '💰',
              title: group.name,
              description: notif.message || `Loan notification`,
              tab: Tabs.SHARED_LOANS,
              groupId: group.id,
              category: 'Shared Loans'
            })
          })
        })
        loanNotifs.value = { ...loanNotifs.value, [group.id]: notifs }
      })
      listeners.push(lUnsub)
    })
  }

  watch(
    [activeUser, () => groups.value.map((g) => g.id).join(',')],
    () => subscribeToExpensesAndLoans(),
    { immediate: true }
  )

  // ─── Bug report status notifications (for the reporter) ─────────────────
  const bugReportNotifs = ref([])
  const brRef = dbRef(
    `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/${activeUser.value}/items`
  )
  const brUnsub = onSnapshot(brRef, (snap) => {
    if (snap.empty) {
      bugReportNotifs.value = []
      return
    }
    const statusLabel = {
      open: 'Open',
      'in-progress': 'In Progress',
      'needs-info': 'Needs Info',
      duplicate: 'Duplicate',
      'wont-fix': "Won't Fix",
      resolved: 'Resolved',
      closed: 'Closed'
    }
    const statusIcon = {
      open: '🔴',
      'in-progress': '🟡',
      'needs-info': '🔵',
      duplicate: '🟣',
      'wont-fix': '⚫',
      resolved: '🟢',
      closed: '⚫'
    }
    bugReportNotifs.value = snap.docs.map((d) => {
      const n = d.data()
      return {
        id: `bugreport-notif-${d.id}`,
        icon: n.hasNote ? '💬' : (statusIcon[n.status] ?? '🐛'),
        title: 'Bug Report',
        description: n.hasNote
          ? `Admin added a note to your report "${n.title}"`
          : `Your report "${n.title}" is now ${statusLabel[n.status] ?? n.status}`,
        tab: null,
        action: 'open-bug-report',
        bugId: d.id,
        category: 'Bug Reports'
      }
    })
  })
  bugListeners.push(brUnsub)

  // ─── Admin bug report notifications ───────────────────────────────────────
  const rawAdminBugReportNotifs = ref([])

  // Read bugResolver directly from Firestore to avoid user-store timing issues
  const isBugResolver = ref(false)
  const bugResolverDocRef = dbRef(`${DB_NODES.USERS}/${activeUser.value}`)
  const bugResolverUnsub = onSnapshot(bugResolverDocRef, (snap) => {
    isBugResolver.value = snap.exists() && snap.data().bugResolver === true
  })
  bugListeners.push(bugResolverUnsub)

  const adminBrRef = dbRef(`${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/items`)
  const adminBrUnsub = onSnapshot(adminBrRef, (snap) => {
    if (snap.empty) {
      rawAdminBugReportNotifs.value = []
      return
    }
    rawAdminBugReportNotifs.value = snap.docs.map((d) => {
      const n = d.data()
      const reporter = n.reporterName || 'Reporter'
      let icon = '💬'
      let description = `${reporter} replied to "${n.title}"`
      if (n.action === 'new') {
        icon = '🐛'
        description = `${reporter} submitted a new bug report "${n.title}"`
      } else if (n.action === 'edited') {
        icon = '✏️'
        description = `${reporter} edited their report "${n.title}"`
      } else if (n.action === 'reopened') {
        icon = '🔄'
        description = `${reporter} re-opened their report "${n.title}"`
      }
      return {
        id: `bugreport-admin-notif-${d.id}`,
        icon,
        title: 'Bug Reports',
        description,
        action: 'open-admin-bug-report',
        bugId: d.id,
        tab: Tabs.BUG_RESOLVER,
        category: 'Bug Reports'
      }
    })
  })
  bugListeners.push(adminBrUnsub)

  const adminBugReportNotifs = computed(() =>
    isBugResolver.value ? rawAdminBugReportNotifs.value : []
  )

  // ─── Real-time groups listener ────────────────────────────────────────────
  // Keeps groupStore up-to-date from any tab so group notifications (e.g.
  // member-renamed, join requests, delete requests) appear in the bell
  // immediately without needing to open the Groups tab.
  const groupsUnsubscribe = onSnapshot(
    collection(database, DB_NODES.GROUPS),
    (snap) => {
      const groupList = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      groupStore.setGroups(groupList)
    }
  )

  // ─── Real-time users listener ─────────────────────────────────────────────
  // Keeps userStore up-to-date from any tab so that delete/update request
  // notifications appear in the bell immediately, without needing to open the Users tab.
  const usersUnsubscribe = onSnapshot(
    collection(database, DB_NODES.USERS),
    (snap) => {
      snap.docs.forEach((docSnap) => {
        const uid = docSnap.id
        const u = docSnap.data()
        if (u.emailVerified === true) {
          userStore.addUser({
            uid,
            mobile: u.mobile || '',
            name: u.name || '',
            email: u.email || '',
            addedBy: u.addedBy || null,
            maskedMobile: maskMobile(u.mobile || ''),
            deleteRequest: u.deleteRequest || null,
            updateRequest: u.updateRequest || null,
            bugResolver: u.bugResolver === true,
            rejectionNotification: u.rejectionNotification || null
          })
        }
      })
    }
  )

  const cleanup = () => {
    listeners.forEach((unsub) => unsub())
    listeners.length = 0
    bugListeners.forEach((unsub) => unsub())
    bugListeners.length = 0
    usersUnsubscribe()
    groupsUnsubscribe()
    expenseNotifs.value = {}
    loanNotifs.value = {}
    bugReportNotifs.value = []
    rawAdminBugReportNotifs.value = []
  }

  const allNotifications = computed(() => [
    ...groupNotifications.value,
    ...userNotifications.value,
    ...Object.values(expenseNotifs.value).flat(),
    ...Object.values(loanNotifs.value).flat(),
    ...bugReportNotifs.value,
    ...adminBugReportNotifs.value
  ])

  return {
    allNotifications,
    notificationCount: computed(() => allNotifications.value.length),
    cleanup
  }
}
