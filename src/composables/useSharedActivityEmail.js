import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { getEmailConfig } from '@/composables'

const EMAIL_API_URL = import.meta.env.VITE_NODE_BE_EMAIL_API_URL?.trim()
const PRODUCTION = import.meta.env.PROD
const SEND_EMAILS = getEmailConfig().send
const BUG_REPORT_RECIPIENT = 'majid.teresol@gmail.com'

function getIdentity(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.uid || value.mobile || value.userId || ''
}

export function useSharedActivityEmail() {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()

  function postEmailNotification(payload) {
    if (!EMAIL_API_URL || !PRODUCTION || !SEND_EMAILS) return

    fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_X_API_KEY || '',
      },
      body: JSON.stringify(payload)
    }).catch(() => {})
  }

  function sendSharedActivityEmail({ type, entryId = '', month = '', data = {} } = {}) {
    const groupId = groupStore.getActiveGroup
    const group = groupStore.getGroupById(groupId)
    if (!groupId || !group?.members?.length) return

    const actorId = authStore.getActiveUser
    const actor =
      userStore.getUserByUid(actorId) || userStore.getUserByMobile(actorId)

    const recipients = group.members
      .map((member) => {
        const identity = getIdentity(member)
        if (!identity || identity === actorId) return null
        return (
          userStore.getUserByUid(identity) || userStore.getUserByMobile(identity)
        )
      })
      .filter((user, index, list) => {
        if (!user?.email) return false
        return index === list.findIndex((candidate) => candidate?.email === user.email)
      })
      .map((user) => ({
        uid: user.uid || '',
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || ''
      }))

    if (!recipients.length) return

    const payload = {
      type,
      group: {
        name: group.name || ''
      },
      actor: {
        name: actor?.name || '',
        email: actor?.email || '',
        mobile: actor?.mobile || actorId || ''
      },
      entry: {
        id: entryId,
        month,
        ...data
      },
      recipients
    }

    postEmailNotification(payload)
  }

  function sendBugReportEmail({
    bugNumber = '',
    title = '',
    category = '',
    severity = '',
    description = '',
    reporter = {},
    screenshots = [],
    submittedAt = ''
  } = {}) {
    postEmailNotification({
      type: 'bug-report',
      recipients: [
        {
          email: BUG_REPORT_RECIPIENT,
          name: 'Majid'
        }
      ],
      report: {
        bugNumber,
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
        email: reporter?.email || '',
      }
    })
  }

  return { sendSharedActivityEmail, sendBugReportEmail }
}
