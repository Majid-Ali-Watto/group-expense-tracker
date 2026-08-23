import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { database, doc, setDoc } from '@/firebase'
import { useAuthStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'
import { showError, showSuccess } from '@/utils/showAlerts'
import {
  USER_TAB_KEYS,
  createUserTabSelectionFromConfig,
  buildUserTabConfig,
  hasEnabledUserTabs,
  buildUserTabConfigDocument,
  canAccessManageTabs
} from '@/helpers'

// Shared manage-tabs form state + save logic — backs both the Settings page
// section and (previously) the header's HeaderManageTabsDialog, so the
// validation/save path only lives in one place.
export function useManageTabsForm() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { t } = useI18n()
  const isSavingTabs = ref(false)
  const tabSelection = ref(
    createUserTabSelectionFromConfig(userStore.getActiveUserTabConfig)
  )

  watch(
    () => tabSelection.value.shared,
    (enabled) => {
      if (enabled) {
        tabSelection.value[USER_TAB_KEYS.GROUPS] = true
        tabSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] = true
        return
      }

      tabSelection.value[USER_TAB_KEYS.GROUPS] = false
      tabSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] = false
      tabSelection.value[USER_TAB_KEYS.SHARED_LOANS] = false
      tabSelection.value[USER_TAB_KEYS.USERS] = false
    }
  )

  watch(
    () => tabSelection.value.personal,
    (enabled) => {
      if (enabled) {
        tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = true
        return
      }

      tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = false
      tabSelection.value[USER_TAB_KEYS.PERSONAL_LOANS] = false
    }
  )

  async function saveManageTabs() {
    const uid = authStore.getActiveUserUid
    if (!uid || isSavingTabs.value) return

    isSavingTabs.value = true
    try {
      const sel = tabSelection.value
      if (!sel.shared && !sel.personal) {
        return showError(t('authMessages.selectFeatureGroup'), { duration: 0 })
      }
      if (
        sel.shared &&
        !sel[USER_TAB_KEYS.SHARED_EXPENSES] &&
        !sel[USER_TAB_KEYS.SHARED_LOANS] &&
        !sel[USER_TAB_KEYS.USERS]
      ) {
        return showError(t('authMessages.sharedNoTabsEnabled'), {
          duration: 0
        })
      }
      if (
        sel.personal &&
        !sel[USER_TAB_KEYS.PERSONAL_EXPENSES] &&
        !sel[USER_TAB_KEYS.PERSONAL_LOANS]
      ) {
        return showError(t('authMessages.personalNoTabsEnabled'), {
          duration: 0
        })
      }
      const userTabConfig = buildUserTabConfig(sel)
      if (!hasEnabledUserTabs(userTabConfig)) {
        return showError(t('authMessages.selectAtLeastOneTab'))
      }

      const payload = buildUserTabConfigDocument(
        uid,
        userTabConfig,
        userStore.getActiveUserTabConfig
      )

      await setDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid), payload, {
        merge: true
      })

      userStore.setActiveUserTabAccess({
        config: payload,
        accessManageTabs: canAccessManageTabs(payload)
      })

      showSuccess(t('authMessages.tabsUpdated'))
      return true
    } catch (error) {
      console.error('Failed to update tabs:', error)
      showError(
        error?.code === 'permission-denied'
          ? t('authMessages.noPermissionSaveTabs')
          : error?.message || t('authMessages.saveTabSettingsFailed')
      )
      return false
    } finally {
      isSavingTabs.value = false
    }
  }

  return {
    tabSelection,
    isSavingTabs,
    saveManageTabs
  }
}
