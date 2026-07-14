import { computed, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { database, collection, doc, setDoc, onSnapshot } from '@/firebase'
import { DB_NODES } from '@/constants'
import { showError, showSuccess } from '@/utils'

export function AdminUsers() {
  const { t } = useI18n()
  const users = ref([])
  const userTabConfigs = ref({})
  const usersLoaded = ref(false)
  const userTabConfigsLoaded = ref(false)
  const loading = computed(
    () => !usersLoaded.value || !userTabConfigsLoaded.value
  )
  const saving = ref(false)

  const unsubscribeUsers = onSnapshot(
    collection(database, DB_NODES.USERS),
    (snap) => {
      users.value = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
      usersLoaded.value = true
    },
    () => {
      usersLoaded.value = true
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
    unsubscribeUserTabConfigs()
  })

  async function updateUserFlag(uid, field, value) {
    if (saving.value) return
    saving.value = true
    try {
      await setDoc(
        doc(database, DB_NODES.USERS, uid),
        { [field]: value },
        { merge: true }
      )
      const idx = users.value.findIndex((u) => u.uid === uid)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], [field]: value }
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
