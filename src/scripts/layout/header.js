import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  database,
  doc,
  deleteDoc,
  updateDoc,
  deleteField,
  setDoc
} from '@/firebase'
import { getManageTabsConfig, getBugReportConfig } from '@/composables'
import { DB_NODES } from '@/constants'
import { PUBLIC_NAV_LINKS } from '@/constants'
import { confirmAction } from '@/utils/confirmAction'
import { showError, showSuccess } from '@/utils/showAlerts'
import { useAuthStore, useDataStore, useUserStore } from '@/stores'
import {
  USER_TAB_KEYS,
  createUserTabSelection,
  createUserTabSelectionFromConfig,
  buildUserTabConfig,
  hasEnabledUserTabs,
  buildUserTabConfigDocument,
  canAccessManageTabs
} from '@/helpers'

export const Header = (props, emit) => {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const notifVisible = ref(false)
  const showHelp = ref(false)
  const showBugReport = ref(false)
  const showManageTabs = ref(false)
  const isSavingTabs = ref(false)
  const tabSelection = ref(createUserTabSelection())
  const bugReportView = ref('form') // 'form' | 'my-reports'
  const bugReportOpenId = ref(null)
  const canShowManageTabs = computed(
    () =>
      props.loggedIn &&
      getManageTabsConfig().showManageTab &&
      userStore.canActiveUserManageTabs
  )
  const canShowBugReport = computed(
    () => props.loggedIn && getBugReportConfig().report
  )
  const isPublicPage = computed(
    () =>
      !props.loggedIn &&
      (route.meta?.publicPage === true || route.meta?.requiresGuest === true)
  )

  // Reset to form view when dialog closes
  watch(showBugReport, (val) => {
    if (!val) {
      bugReportView.value = 'form'
      bugReportOpenId.value = null
    }
  })

  watch(canShowBugReport, (allowed) => {
    if (!allowed && showBugReport.value) {
      showBugReport.value = false
    }
  })

  watch(canShowManageTabs, (allowed) => {
    if (!allowed && showManageTabs.value) {
      closeManageTabs()
    }
  })

  watch(
    () => tabSelection.value.shared,
    (enabled) => {
      if (enabled) {
        tabSelection.value[USER_TAB_KEYS.GROUPS] = true
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
      if (enabled) return

      tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = false
      tabSelection.value[USER_TAB_KEYS.PERSONAL_LOANS] = false
    }
  )

  function setLoggedInStatus() {
    emit('click-log', false)
  }

  async function confirmLogout() {
    const confirmed = await confirmAction({
      message: 'Are you sure you want to logout?',
      title: 'Confirm Logout',
      confirmButtonText: 'Logout',
      cancelButtonText: 'Stay Logged In',
      type: 'info'
    })
    if (confirmed) setLoggedInStatus()
  }

  function handleNetPosition() {
    emit('show-net-position')
  }

  async function copyUrl(url) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return
    }

    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    try {
      const copied = document.execCommand('copy')
      if (!copied) throw new Error('Copy command failed')
    } finally {
      document.body.removeChild(textarea)
    }
  }

  async function shareCurrentUrl() {
    const url = window.location.href
    const payload = {
      title: document.title || 'Kharchafy',
      text: 'Open this page in Kharchafy.',
      url
    }

    try {
      if (navigator.share) {
        await navigator.share(payload)
        return
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
    }

    try {
      await copyUrl(url)
      showSuccess('Link copied to clipboard!')
    } catch {
      window.prompt('Copy this link:', url)
      showError(
        'Native share is unavailable, so the link was opened for manual copy.'
      )
    }
  }

  async function handleNavigate(notif) {
    notifVisible.value = false
    if (notif.action === 'open-bug-report') {
      bugReportOpenId.value = notif.bugId || null
      bugReportView.value = 'my-reports'
      showBugReport.value = true
      return
    }

    if (notif.action === 'open-admin-bug-report' && notif.bugId) {
      props.dismissNotification(notif.id)
      deleteDoc(
        doc(
          database,
          DB_NODES.BUG_REPORT_NOTIFICATIONS,
          'admin',
          'items',
          notif.bugId
        )
      ).catch(() => {})
    }

    if (notif.action === 'dismiss-user-rejection' && notif.userUid) {
      props.dismissNotification(notif.id)
      updateDoc(doc(database, DB_NODES.USERS, notif.userUid), {
        rejectionNotification: deleteField()
      }).catch(() => {})
    }

    if (!notif.tab) return
    if (notif.action === 'scroll-to-row' && notif.rowId) {
      props.dismissNotification(notif.id)
      useDataStore().setPendingScrollRowId(notif.rowId)
    }
    emit('navigate-to-tab', { tab: notif.tab, groupId: notif.groupId })
  }

  const notifsByCategory = computed(() => {
    const map = {}
    props.notifications.forEach((n) => {
      if (!map[n.category]) map[n.category] = []
      map[n.category].push(n)
    })
    return map
  })

  const notifCategories = computed(() => Object.keys(notifsByCategory.value))

  function navigateTo(path) {
    if (route.path === path) return
    router.push(path)
  }

  function openManageTabs() {
    if (!canShowManageTabs.value) return

    tabSelection.value = createUserTabSelectionFromConfig(
      userStore.getActiveUserTabConfig
    )
    showManageTabs.value = true
  }

  function closeManageTabs() {
    showManageTabs.value = false
    tabSelection.value = createUserTabSelection()
  }

  async function saveManageTabs() {
    const uid = authStore.getActiveUser
    if (!uid || isSavingTabs.value) return

    isSavingTabs.value = true
    try {
      const userTabConfig = buildUserTabConfig(tabSelection.value)
      if (!hasEnabledUserTabs(userTabConfig)) {
        return showError('Select at least one actual tab to continue.')
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
      showSuccess('Tabs updated successfully.')
      showManageTabs.value = false
    } catch (error) {
      console.error('Failed to update tabs:', error)
      showError(
        error?.code === 'permission-denied'
          ? 'You do not have permission to update tab settings.'
          : error?.message || 'Failed to update tab settings.'
      )
    } finally {
      isSavingTabs.value = false
    }
  }

  return {
    route,
    notifVisible,
    showHelp,
    showBugReport,
    canShowBugReport,
    showManageTabs,
    canShowManageTabs,
    isSavingTabs,
    tabSelection,
    bugReportView,
    bugReportOpenId,
    isPublicPage,
    publicNavLinks: PUBLIC_NAV_LINKS,
    setLoggedInStatus,
    confirmLogout,
    handleNetPosition,
    navigateTo,
    shareCurrentUrl,
    handleNavigate,
    openManageTabs,
    closeManageTabs,
    saveManageTabs,
    notifsByCategory,
    notifCategories
  }
}
