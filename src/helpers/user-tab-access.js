import { Tabs } from '@/assets'
import { database, doc, getDoc } from '@/firebase'
import { DB_NODES } from '@/constants'

export const USER_TAB_KEYS = {
  GROUPS: 'groups',
  SHARED_EXPENSES: 'sharedExpenses',
  SHARED_LOANS: 'sharedLoans',
  USERS: 'users',
  PERSONAL_EXPENSES: 'personalExpenses',
  PERSONAL_LOANS: 'personalLoans'
}

export const FULL_USER_TAB_CONFIG = {
  [USER_TAB_KEYS.GROUPS]: true,
  [USER_TAB_KEYS.SHARED_EXPENSES]: true,
  [USER_TAB_KEYS.SHARED_LOANS]: true,
  [USER_TAB_KEYS.USERS]: true,
  [USER_TAB_KEYS.PERSONAL_EXPENSES]: true,
  [USER_TAB_KEYS.PERSONAL_LOANS]: true
}

export const EMPTY_USER_TAB_CONFIG = {
  [USER_TAB_KEYS.GROUPS]: false,
  [USER_TAB_KEYS.SHARED_EXPENSES]: false,
  [USER_TAB_KEYS.SHARED_LOANS]: false,
  [USER_TAB_KEYS.USERS]: false,
  [USER_TAB_KEYS.PERSONAL_EXPENSES]: false,
  [USER_TAB_KEYS.PERSONAL_LOANS]: false
}

export const TAB_CONFIG_BY_TAB = {
  [Tabs.GROUPS]: USER_TAB_KEYS.GROUPS,
  [Tabs.SHARED_EXPENSES]: USER_TAB_KEYS.SHARED_EXPENSES,
  [Tabs.SHARED_LOANS]: USER_TAB_KEYS.SHARED_LOANS,
  [Tabs.USERS]: USER_TAB_KEYS.USERS,
  [Tabs.PERSONAL_EXPENSES]: USER_TAB_KEYS.PERSONAL_EXPENSES,
  [Tabs.PERSONAL_LOANS]: USER_TAB_KEYS.PERSONAL_LOANS
}

const APP_TAB_ORDER = [
  Tabs.GROUPS,
  Tabs.SHARED_EXPENSES,
  Tabs.SHARED_LOANS,
  Tabs.USERS,
  Tabs.PERSONAL_EXPENSES,
  Tabs.PERSONAL_LOANS
]

export function hasSavedUserTabConfig(config) {
  if (!config || typeof config !== 'object') return false

  return Object.values(USER_TAB_KEYS).some((key) =>
    Object.prototype.hasOwnProperty.call(config, key)
  )
}

export function resolveUserTabConfig(config) {
  if (!hasSavedUserTabConfig(config)) {
    return { ...FULL_USER_TAB_CONFIG }
  }

  const resolved = {
    [USER_TAB_KEYS.GROUPS]: config[USER_TAB_KEYS.GROUPS] === true,
    [USER_TAB_KEYS.SHARED_EXPENSES]:
      config[USER_TAB_KEYS.SHARED_EXPENSES] === true,
    [USER_TAB_KEYS.SHARED_LOANS]: config[USER_TAB_KEYS.SHARED_LOANS] === true,
    [USER_TAB_KEYS.USERS]: config[USER_TAB_KEYS.USERS] === true,
    [USER_TAB_KEYS.PERSONAL_EXPENSES]:
      config[USER_TAB_KEYS.PERSONAL_EXPENSES] === true,
    [USER_TAB_KEYS.PERSONAL_LOANS]:
      config[USER_TAB_KEYS.PERSONAL_LOANS] === true
  }

  return Object.values(resolved).some(Boolean)
    ? resolved
    : { ...FULL_USER_TAB_CONFIG }
}

export function buildUserTabConfig(selection = {}) {
  const sharedEnabled = selection.shared === true
  const personalEnabled = selection.personal === true

  return {
    [USER_TAB_KEYS.GROUPS]: sharedEnabled,
    [USER_TAB_KEYS.SHARED_EXPENSES]:
      sharedEnabled && selection[USER_TAB_KEYS.SHARED_EXPENSES] === true,
    [USER_TAB_KEYS.SHARED_LOANS]:
      sharedEnabled && selection[USER_TAB_KEYS.SHARED_LOANS] === true,
    [USER_TAB_KEYS.USERS]:
      sharedEnabled && selection[USER_TAB_KEYS.USERS] === true,
    [USER_TAB_KEYS.PERSONAL_EXPENSES]:
      personalEnabled && selection[USER_TAB_KEYS.PERSONAL_EXPENSES] === true,
    [USER_TAB_KEYS.PERSONAL_LOANS]:
      personalEnabled && selection[USER_TAB_KEYS.PERSONAL_LOANS] === true
  }
}

export function createUserTabSelection() {
  return {
    shared: false,
    personal: false,
    [USER_TAB_KEYS.GROUPS]: false,
    [USER_TAB_KEYS.SHARED_EXPENSES]: false,
    [USER_TAB_KEYS.SHARED_LOANS]: false,
    [USER_TAB_KEYS.USERS]: false,
    [USER_TAB_KEYS.PERSONAL_EXPENSES]: false,
    [USER_TAB_KEYS.PERSONAL_LOANS]: false
  }
}

export function createUserTabSelectionFromConfig(config) {
  const resolvedConfig = resolveUserTabConfig(config)
  const selection = createUserTabSelection()

  selection.shared =
    resolvedConfig[USER_TAB_KEYS.GROUPS] ||
    resolvedConfig[USER_TAB_KEYS.USERS] ||
    resolvedConfig[USER_TAB_KEYS.SHARED_EXPENSES] ||
    resolvedConfig[USER_TAB_KEYS.SHARED_LOANS]
  selection.personal =
    resolvedConfig[USER_TAB_KEYS.PERSONAL_EXPENSES] ||
    resolvedConfig[USER_TAB_KEYS.PERSONAL_LOANS]

  selection[USER_TAB_KEYS.GROUPS] = resolvedConfig[USER_TAB_KEYS.GROUPS]
  selection[USER_TAB_KEYS.USERS] = resolvedConfig[USER_TAB_KEYS.USERS]
  selection[USER_TAB_KEYS.SHARED_EXPENSES] =
    resolvedConfig[USER_TAB_KEYS.SHARED_EXPENSES]
  selection[USER_TAB_KEYS.SHARED_LOANS] =
    resolvedConfig[USER_TAB_KEYS.SHARED_LOANS]
  selection[USER_TAB_KEYS.PERSONAL_EXPENSES] =
    resolvedConfig[USER_TAB_KEYS.PERSONAL_EXPENSES]
  selection[USER_TAB_KEYS.PERSONAL_LOANS] =
    resolvedConfig[USER_TAB_KEYS.PERSONAL_LOANS]

  if (selection.shared) {
    selection[USER_TAB_KEYS.GROUPS] = true
  }

  return selection
}

export function canAccessTab(tab, config, options = {}) {
  if (tab === Tabs.BUG_RESOLVER) return true

  const resolvedConfig = resolveUserTabConfig(config)
  const key = TAB_CONFIG_BY_TAB[tab]
  if (!key || resolvedConfig[key] !== true) return false

  if (
    options.hasActiveGroup === false &&
    (tab === Tabs.SHARED_EXPENSES || tab === Tabs.SHARED_LOANS)
  ) {
    return false
  }

  return true
}

export function hasEnabledUserTabs(config) {
  return Object.values(resolveUserTabConfig(config)).some(Boolean)
}

export function canAccessManageTabs(config) {
  return config?.accessManageTabs !== false
}

export function buildUserTabConfigDocument(uid, userTabConfig, existingConfig = null) {
  const payload = {
    uid,
    ...userTabConfig
  }

  if (
    existingConfig &&
    Object.prototype.hasOwnProperty.call(existingConfig, 'accessManageTabs')
  ) {
    payload.accessManageTabs = existingConfig.accessManageTabs
  }

  return payload
}

export async function findUserTabConfigByUid(uid) {
  if (!uid) return null

  try {
    const snapshot = await getDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid))
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  } catch (error) {
    if (error?.code === 'permission-denied') {
      console.warn(
        'user-tab-configs read is not permitted; using default tab access.'
      )
      return null
    }

    throw error
  }
}

export function getAccessibleTabs(config, options = {}) {
  return APP_TAB_ORDER.filter((tab) => canAccessTab(tab, config, options))
}

export function getDefaultAccessibleTab(config, options = {}) {
  const tabs = getAccessibleTabs(config, options)
  return tabs[0] || Tabs.GROUPS
}
