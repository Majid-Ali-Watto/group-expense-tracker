import i18n from '@/i18n'

export function getActiveUserBlockedMessage() {
  return i18n.global.t('common.activeUserBlocked')
}

export function isBlockedRecord(record) {
  return record?.blocked === true
}

export function isUserBlocked(user) {
  return isBlockedRecord(user)
}

export function isGroupBlocked(group) {
  return isBlockedRecord(group)
}

const ENTITY_LABEL_KEYS = {
  group: 'common.entityGroup',
  user: 'common.entityUser'
}

export function getBlockedEntityMessage(entityLabel = 'item') {
  const label = ENTITY_LABEL_KEYS[entityLabel]
    ? i18n.global.t(ENTITY_LABEL_KEYS[entityLabel])
    : entityLabel
  return i18n.global.t('common.entityBlocked', { entity: label })
}
