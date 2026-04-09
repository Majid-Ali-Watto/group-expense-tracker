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

export function createUserDisplayStoreProxy(authStore, userStore) {
  return {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByUid: (identity) => userStore.getUserByUid?.(identity),
    getUserByMobile: (identity) => userStore.getUserByMobile?.(identity)
  }
}

export function getDisplayMobile(userStore, identity) {
  const userId = getIdentity(identity)
  if (!userId) return ''

  const activeUser = userStore.getActiveUser
  const targetUser = getUserRecord(userStore, userId)
  const targetMobile = targetUser?.mobile || userId

  // Active user always sees their own real mobile; everyone else is always masked
  if (userId === activeUser) {
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

  return formatUserDisplay(userStore, getIdentity(member), {
    ...options,
    name: member.name
  })
}
