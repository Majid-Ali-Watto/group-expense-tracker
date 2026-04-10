export const ACTIVE_USER_BLOCKED_MESSAGE =
  'Your account is blocked by admin. Users and groups are disabled.'

export function isBlockedRecord(record) {
  return record?.blocked === true
}

export function isUserBlocked(user) {
  return isBlockedRecord(user)
}

export function isGroupBlocked(group) {
  return isBlockedRecord(group)
}

export function getBlockedEntityMessage(entityLabel = 'item') {
  return `This ${entityLabel} is blocked by admin. Do not interact with it.`
}
