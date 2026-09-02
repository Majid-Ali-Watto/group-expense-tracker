import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { getEmailConfig } from '@/composables/useAppConfig'
import { useEmailLimit } from '@/composables/useEmailLimit'
import { getApiAuthHeaders, getIdentity } from '@/utils'

const API_BASE_URL = import.meta.env.VITE_NODE_BE_API_URL?.trim()
const PRODUCTION = import.meta.env.PROD
const BUG_REPORT_RECIPIENT = import.meta.env.VITE_BUG_REPORT_HELP_EMAIL?.trim()

export function useSharedActivityEmail() {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const {
    canSendEmail,
    wantsSharedExpenseEmails,
    wantsSharedLoanEmails,
    incrementEmailCount
  } = useEmailLimit()

  function postEmailNotification(payload) {
    if (!API_BASE_URL || !PRODUCTION || !getEmailConfig().send) return
    ;(async () => {
      const headers = await getApiAuthHeaders({
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_X_API_KEY || ''
      })

      await fetch(API_BASE_URL + '/send-email', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
    })().catch(() => {})
  }

  // Unlike postEmailNotification() above, this is awaited and throws on
  // failure so the caller (bug-report.js's submitReport) can surface it.
  // The backend responds immediately with a locally-generated trackingId
  // (`{ notificationType, trackingId }`) — creating the real Jira issue
  // happens afterward, in the background (see kharcafy-node-be's
  // "Background jobs" — bug-report-creation-job.service.ts), so this no
  // longer waits on that Jira round-trip either. Also bypasses the
  // getEmailConfig().send toggle: that flag is a user preference for
  // *notification* emails, not a gate on whether a bug report actually
  // gets submitted.
  async function postBugReportNotification(payload) {
    if (!API_BASE_URL) {
      throw new Error('Bug report backend is not configured.')
    }

    const headers = await getApiAuthHeaders({
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_X_API_KEY || ''
    })

    const response = await fetch(API_BASE_URL + '/send-email', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        body?.message || `Bug report submission failed (${response.status}).`
      )
    }

    return body
  }

  function getUserIdentityRecord(identity) {
    const normalizedIdentity = getIdentity(identity)
    if (!normalizedIdentity) return null
    return userStore.getUserByUid(normalizedIdentity) || null
  }

  function buildMemberAmountPayload(member) {
    const identity = getIdentity(member?.uid || member)
    const user = getUserIdentityRecord(identity)

    return {
      uid: identity || '',
      name: user?.name || '',
      mobile: user?.mobile || '',
      amount: Number(member?.amount || 0)
    }
  }

  function buildSharedExpenseEntry(entryId, month, data) {
    return {
      id: entryId,
      month,
      ...data,
      split: Array.isArray(data?.split)
        ? data.split.map((member) => buildMemberAmountPayload(member))
        : [],
      ...(data?.payerMode === 'multiple'
        ? {
            payers: Array.isArray(data?.payers)
              ? data.payers.map((payer) => buildMemberAmountPayload(payer))
              : []
          }
        : {}),
      ...(data?.splitMode === 'custom'
        ? {
            splitItems: Array.isArray(data?.splitItems)
              ? data.splitItems.map((item) => ({
                  description: item?.description || '',
                  amount: Number(item?.amount || 0),
                  participants: Array.isArray(item?.participants)
                    ? item.participants
                    : []
                }))
              : []
          }
        : {})
    }
  }

  function buildSharedLoanEntry(entryId, month, data) {
    const giver = getUserIdentityRecord(data?.giver)
    const receiver = getUserIdentityRecord(data?.receiver)

    return {
      id: entryId,
      month,
      ...data,
      giverName: data?.giverName || giver?.name || '',
      receiverName: data?.receiverName || receiver?.name || ''
    }
  }

  function sendSharedActivityEmail({
    type,
    action = 'created',
    entryId = '',
    month = '',
    data = {}
  } = {}) {
    if (type === 'shared-expense' && !wantsSharedExpenseEmails.value) return
    if (type === 'shared-loan' && !wantsSharedLoanEmails.value) return
    if (!canSendEmail.value) return

    const groupId = groupStore.getActiveGroup
    const group = groupStore.getGroupById(groupId)
    if (!groupId || !group?.members?.length) return

    const actorId = authStore.getActiveUserUid
    const actor = userStore.getUserByUid(actorId)

    // email is no longer readable client-side for anyone but the active user
    // (it lives in the self/admin-only user-private/{uid} doc) — and it
    // doesn't need to be: the backend re-resolves the real recipient list
    // itself from Firestore via the Admin SDK before sending anything
    // (firebase-user.service.ts's buildRecipients()), ignoring whatever this
    // payload says. This just needs to identify *which* members to notify.
    const recipients = group.members
      .map((member) => {
        const identity = getIdentity(member)
        if (!identity) return null
        return userStore.getUserByUid(identity)
      })
      .filter((user, index, list) => {
        if (!user?.uid) return false
        return (
          index === list.findIndex((candidate) => candidate?.uid === user.uid)
        )
      })
      .map((user) => ({
        uid: user.uid || '',
        name: user.name || '',
        mobile: user.mobile || ''
      }))

    if (!recipients.length) return

    const entry =
      type === 'shared-expense'
        ? buildSharedExpenseEntry(entryId, month, data)
        : buildSharedLoanEntry(entryId, month, data)

    const payload = {
      type,
      action,
      group: {
        id: groupId,
        name: group.name || ''
      },
      actor: {
        name: actor?.name || '',
        uid: actorId || '',
        mobile: actor?.mobile || ''
      },
      entry,
      recipients
    }

    postEmailNotification(payload)
    incrementEmailCount()
  }

  // Returns the backend's response body (`{ notificationType, trackingId }`)
  // — awaited and thrown on failure, unlike sendSharedActivityEmail's
  // fire-and-forget.
  async function sendBugReportEmail({
    title = '',
    category = '',
    severity = '',
    description = '',
    reporter = {},
    screenshots = [],
    submittedAt = ''
  } = {}) {
    return postBugReportNotification({
      type: 'bug-report',
      recipients: [
        {
          email: BUG_REPORT_RECIPIENT,
          name: import.meta.env.VITE_BUG_RESOLVER || 'Support Team'
        }
      ],
      report: {
        title,
        category,
        severity,
        description,
        submittedAt,
        screenshotCount: Array.isArray(screenshots) ? screenshots.length : 0,
        screenshots
      },
      reporter: {
        name: reporter?.name || '',
        email: reporter?.email || ''
      }
    })
  }

  return { sendSharedActivityEmail, sendBugReportEmail }
}
