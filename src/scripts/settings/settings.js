import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { useTheme } from '@/composables/useTheme'
import {
  useFontFamily,
  preloadAllFontOptions
} from '@/composables/useFontFamily'
import { useManageTabsForm } from '@/composables/useManageTabsForm'
import { getManageTabsConfig } from '@/composables/useAppConfig'
import { useFireBase } from '@/composables'
import { useCurrency } from '@/composables/useCurrency'
import { useAuthStore, useUserStore } from '@/stores'
import { hasSession } from '@/router'
import { clearAllSiteCaches, showError, showSuccess } from '@/utils'
import { DB_NODES } from '@/constants'

export const Settings = () => {
  const { t } = useI18n()
  const router = useRouter()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { currencyOptionsIncluding, isAvailableCurrency } = useCurrency()
  // Provided by App.vue, the only place logout() actually exists (it closes
  // over sync-listener teardown created inside the App() composable, which
  // itself can only run once). Absent in isolated tests/stories — guarded
  // at the call site below.
  const appLogout = inject('appLogout', null)

  // Settings is reachable whether logged in or not (Appearance should work
  // pre-login) — same three-part check as `loggedIn` in scripts/layout/app.js,
  // needed here only to keep Manage Tabs hidden for guests (userStore's
  // tab-access getters default to `true` when no session has ever loaded one).
  const isLoggedIn = computed(
    () =>
      !!(
        authStore.getActiveUserUid &&
        authStore.getSessionToken &&
        hasSession()
      )
  )

  const { isDarkTheme, toggleTheme } = useTheme()
  const {
    fontFamily,
    FONT_OPTIONS,
    setFontFamily,
    urduFontFamily,
    URDU_FONT_OPTIONS,
    setUrduFontFamily
  } = useFontFamily()

  // Same gate the header used for its old "Manage Tabs" entry point: the
  // admin-controlled global kill switch (configs/manage-tabs) AND the
  // per-user lock (user-tab-configs/{uid}.accessManageTabs).
  const canManageTabs = computed(
    () =>
      isLoggedIn.value &&
      getManageTabsConfig().showManageTab &&
      userStore.canActiveUserManageTabs
  )

  const { tabSelection, isSavingTabs, saveManageTabs } = useManageTabsForm()

  const { updateData } = useFireBase()

  // Personal default currency — used for personal expenses/loans, and as
  // the default when creating a new group (see groups-create.js). Falls
  // back to currencyOption's own default (PKR) until the active user's
  // doc has loaded.
  const currency = computed(
    () => userStore.getUserByUid(authStore.getActiveUserUid)?.currency || ''
  )
  // Narrowed to codes the current exchange-rate snapshot can actually
  // convert (plus whatever the user already has set, even if that code
  // dropped out of the snapshot) — see useCurrency.js.
  const currencyOptions = computed(() =>
    currencyOptionsIncluding(currency.value)
  )

  async function setCurrency(code) {
    const uid = authStore.getActiveUserUid
    if (!uid || !isAvailableCurrency(code)) return

    await updateData(`${DB_NODES.USERS}/${uid}`, () => ({ currency: code }), '')
    userStore.addUser({ uid, currency: code })
  }

  // Load every font option's stylesheet only once the user is actually on
  // this page, so the pickers can preview each font in itself — see
  // preloadAllFontOptions()'s comment for why this doesn't happen globally.
  onMounted(preloadAllFontOptions)

  const isClearingCache = ref(false)
  const isClearingStorage = ref(false)
  const isResetting = ref(false)

  async function clearSiteCache() {
    try {
      await ElMessageBox.confirm(
        t('settings.clearCacheConfirmMessage'),
        t('settings.clearCacheConfirmTitle'),
        {
          confirmButtonText: t('settings.clearCache'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return // cancelled
    }

    isClearingCache.value = true
    try {
      const cleared = await clearAllSiteCaches()
      if (!cleared) {
        showError(t('settings.noCacheToClear'))
        return
      }
      await showSuccess(t('settings.clearCacheSuccess'))
      // Reload so the browser re-fetches every asset fresh and the service
      // worker re-precaches from scratch, instead of running the rest of
      // this session against whatever's still in memory.
      window.location.reload()
    } catch {
      showError(t('settings.clearCacheError'))
    } finally {
      isClearingCache.value = false
    }
  }

  async function clearLocalStorageData() {
    try {
      await ElMessageBox.confirm(
        t('settings.clearLocalStorageConfirmMessage'),
        t('settings.clearLocalStorageConfirmTitle'),
        {
          confirmButtonText: t('settings.clearLocalStorage'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return // cancelled
    }

    isClearingStorage.value = true
    try {
      localStorage.clear()
      await showSuccess(t('settings.clearLocalStorageSuccess'))
      // Reload so every default (theme, font, locale) that was only held
      // in memory re-initializes from the now-empty storage.
      window.location.reload()
    } catch {
      showError(t('settings.clearLocalStorageError'))
    } finally {
      isClearingStorage.value = false
    }
  }

  async function resetApp() {
    try {
      await ElMessageBox.confirm(
        t('settings.resetAppConfirmMessage'),
        t('settings.resetAppConfirmTitle'),
        {
          confirmButtonText: t('settings.resetApp'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
    } catch {
      return // cancelled
    }

    isResetting.value = true
    try {
      await clearAllSiteCaches()
      localStorage.clear()
      if (appLogout) await appLogout('reset')
    } catch {
      showError(t('settings.resetAppError'))
      isResetting.value = false
      return
    }
    // Hard navigation, not router.replace — every in-memory store and
    // anything that read localStorage/theme/font at boot needs a clean
    // restart, not just a route change.
    window.location.href = '/login'
  }

  return {
    router,
    isLoggedIn,
    isDarkTheme,
    toggleTheme,
    fontFamily,
    FONT_OPTIONS,
    setFontFamily,
    urduFontFamily,
    URDU_FONT_OPTIONS,
    setUrduFontFamily,
    currency,
    currencyOptions,
    setCurrency,
    canManageTabs,
    tabSelection,
    isSavingTabs,
    saveManageTabs,
    isClearingCache,
    isClearingStorage,
    isResetting,
    clearSiteCache,
    clearLocalStorageData,
    resetApp
  }
}
