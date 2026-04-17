import { maskMobile } from './maskMobile'
import { getIdentity } from './identity'

function getUserRecord(userStore, identity) {
  return userStore.getUserByUid?.(identity) || null
}

export function getDisplayMobile(userStore, identity) {
  const userId = getIdentity(identity)
  if (!userId) return ''

  const activeUserUid = userStore.getActiveUserUid
  const targetUser = getUserRecord(userStore, userId)
  const targetMobile = targetUser?.mobile || userId

  // Active user always sees their own real mobile; everyone else is always masked
  if (userId === activeUserUid) {
    return targetMobile
  }

  return targetUser?.maskedMobile || maskMobile(targetMobile)
}

export function formatUserDisplay(userStore, identity, options = {}) {
  const userId = getIdentity(identity)
  if (!userId) return ''

  const { name = null } = options
  const resolvedUser = getUserRecord(userStore, userId)
  const resolvedName = name || resolvedUser?.name || userId
  const displayMobile = getDisplayMobile(userStore, userId)

  if (!displayMobile || resolvedName === displayMobile) {
    return resolvedName
  }

  return `${resolvedName} (${displayMobile})`
}

export function formatMemberDisplay(userStore, member, options = {}) {
  if (!member) return ''

  if (typeof member === 'string') {
    return formatUserDisplay(userStore, member, options)
  }

  return formatUserDisplay(userStore, getIdentity(member), options)
}
