import { maskMobile } from './maskMobile'

function getIdentity(memberOrId) {
  if (!memberOrId) return ''
  if (typeof memberOrId === 'string') return memberOrId
  return memberOrId.uid || memberOrId.mobile || ''
}

function getUserRecord(userStore, identity) {
  return (
    userStore.getUserByUid?.(identity) ||
    userStore.getUserByMobile?.(identity) ||
    null
  )
}

export function getDisplayMobile(userStore, identity, options = {}) {
  const userId = getIdentity(identity)
  if (!userId) return ''

  const { group = null, preferMasked = false } = options
  const activeUser = userStore.getActiveUser
  const targetUser = getUserRecord(userStore, userId)
  const targetMobile = targetUser?.mobile || userId

  if (userId === activeUser) {
    return targetMobile
  }

  const isVisibleWithinGroup =
    group &&
    group.members?.some((member) => getIdentity(member) === activeUser) &&
    group.members?.some((member) => getIdentity(member) === userId)

  if (!preferMasked && isVisibleWithinGroup) {
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
  const displayMobile = getDisplayMobile(userStore, userId, options)

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

  return formatUserDisplay(userStore, getIdentity(member), {
    ...options,
    name: member.name
  })
}
