import { maskMobile } from './maskMobile'

export function getDisplayMobile(userStore, mobile, options = {}) {
  if (!mobile) return ''

  const { group = null, preferMasked = false } = options
  const activeUser = userStore.getActiveUser

  if (mobile === activeUser) {
    return mobile
  }

  const isVisibleWithinGroup =
    group &&
    group.members?.some((member) => member.mobile === activeUser) &&
    group.members?.some((member) => member.mobile === mobile)

  if (!preferMasked && isVisibleWithinGroup) {
    return mobile
  }

  return userStore.getUserByMobile(mobile)?.maskedMobile || maskMobile(mobile)
}

export function formatUserDisplay(userStore, mobile, options = {}) {
  if (!mobile) return ''

  const { name = null } = options
  const resolvedName = name || userStore.getUserByMobile(mobile)?.name || mobile
  const displayMobile = getDisplayMobile(userStore, mobile, options)

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

  return formatUserDisplay(userStore, member.mobile, {
    ...options,
    name: member.name
  })
}
