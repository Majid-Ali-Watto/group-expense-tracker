import { computed, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { database, collection, doc, setDoc, onSnapshot } from '@/firebase'
import { DB_NODES } from '@/constants'
import { showError, showSuccess } from '@/utils'

// isAdmin/billedUser live in user-admin-flags/{uid} — a separate,
// admin-only-writable collection (see firestore.rules) — not on users/{uid}.
const ADMIN_FLAG_FIELDS = new Set(['isAdmin', 'billedUser'])
const DEFAULT_ADMIN_FLAGS = {
  isAdmin: false,
  billedUser: false
}

export function AdminUsers() {
  const { t } = useI18n()
  const rawUsers = ref([])
  const adminFlags = ref({})
  const userPrivate = ref({})
  const userTabConfigs = ref({})
  const usersLoaded = ref(false)
  const adminFlagsLoaded = ref(false)
  const userPrivateLoaded = ref(false)
  const userTabConfigsLoaded = ref(false)
  const loading = computed(
    () =>
      !usersLoaded.value ||
      !adminFlagsLoaded.value ||
      !userPrivateLoaded.value ||
      !userTabConfigsLoaded.value
  )
  const saving = ref(false)

  // Merges each users/{uid} row with its isAdmin/billedUser from
  // user-admin-flags/{uid} and its email from user-private/{uid} (both split
  // off users/{uid} because that doc is readable by any authenticated user),
  // so the rest of this composable (and AdminUsers.vue) can keep treating
  // "users" as one flat row per user.
  const users = computed(() =>
    rawUsers.value.map((u) => ({
      ...DEFAULT_ADMIN_FLAGS,
      ...u,
      ...(adminFlags.value[u.uid] || {}),
      email: userPrivate.value[u.uid]?.email || ''
    }))
  )

  const unsubscribeUsers = onSnapshot(
    collection(database, DB_NODES.USERS),
    (snap) => {
      rawUsers.value = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
      usersLoaded.value = true
    },
    () => {
      usersLoaded.value = true
    }
  )

  const unsubscribeAdminFlags = onSnapshot(
    collection(database, DB_NODES.USER_ADMIN_FLAGS),
    (snap) => {
      adminFlags.value = snap.docs.reduce((acc, entry) => {
        acc[entry.id] = { ...DEFAULT_ADMIN_FLAGS, ...entry.data() }
        return acc
      }, {})
      adminFlagsLoaded.value = true
    },
    () => {
      adminFlags.value = {}
      adminFlagsLoaded.value = true
    }
  )

  const unsubscribeUserPrivate = onSnapshot(
    collection(database, DB_NODES.USER_PRIVATE),
    (snap) => {
      userPrivate.value = snap.docs.reduce((acc, entry) => {
        acc[entry.id] = entry.data()
        return acc
      }, {})
      userPrivateLoaded.value = true
    },
    () => {
      userPrivate.value = {}
      userPrivateLoaded.value = true
    }
  )

  const unsubscribeUserTabConfigs = onSnapshot(
    collection(database, DB_NODES.USER_TAB_CONFIGS),
    (snap) => {
      userTabConfigs.value = snap.docs.reduce((acc, entry) => {
        acc[entry.id] = { id: entry.id, ...entry.data() }
        return acc
      }, {})
      userTabConfigsLoaded.value = true
    },
    () => {
      userTabConfigs.value = {}
      userTabConfigsLoaded.value = true
    }
  )

  onUnmounted(() => {
    unsubscribeUsers()
    unsubscribeAdminFlags()
    unsubscribeUserPrivate()
    unsubscribeUserTabConfigs()
  })

  async function updateUserFlag(uid, field, value) {
    if (saving.value) return
    saving.value = true
    try {
      const isAdminFlagField = ADMIN_FLAG_FIELDS.has(field)
      await setDoc(
        doc(
          database,
          isAdminFlagField ? DB_NODES.USER_ADMIN_FLAGS : DB_NODES.USERS,
          uid
        ),
        { [field]: value },
        { merge: true }
      )
      if (isAdminFlagField) {
        adminFlags.value = {
          ...adminFlags.value,
          [uid]: {
            ...DEFAULT_ADMIN_FLAGS,
            ...adminFlags.value[uid],
            [field]: value
          }
        }
      } else {
        const idx = rawUsers.value.findIndex((u) => u.uid === uid)
        if (idx !== -1) {
          rawUsers.value[idx] = { ...rawUsers.value[idx], [field]: value }
        }
      }
      showSuccess(t('admin.users.userUpdated'))
    } catch {
      showError(t('admin.users.userUpdateFailed'))
    } finally {
      saving.value = false
    }
  }

  function getUserTabConfig(uid) {
    return userTabConfigs.value[uid] || null
  }

  async function saveUserTabConfig(uid, payload) {
    if (saving.value || !uid) return false

    saving.value = true
    try {
      await setDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid), payload, {
        merge: true
      })
      userTabConfigs.value = {
        ...userTabConfigs.value,
        [uid]: {
          id: uid,
          ...(userTabConfigs.value[uid] || {}),
          ...payload
        }
      }
      showSuccess(t('admin.users.tabConfigUpdated'))
      return true
    } catch (error) {
      console.error('Failed to update user tab config:', error)
      showError(t('admin.users.tabConfigUpdateFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    users,
    loading,
    saving,
    updateUserFlag,
    getUserTabConfig,
    saveUserTabConfig
  }
}
