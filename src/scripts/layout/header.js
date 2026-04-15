import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { database, doc, deleteDoc, updateDoc, deleteField } from '@/firebase'
import { getManageTabsConfig, getBugReportConfig, useShare } from '@/composables'
import { DB_NODES } from '@/constants'
import { PUBLIC_NAV_LINKS } from '@/constants'
import { confirmAction } from '@/utils/confirmAction'
import { useAuthStore, useDataStore, useUserStore } from '@/stores'

export const Header = (props, emit, options = {}) => {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { share } = useShare()
  const notifVisible = ref(false)
  const activeUserProfile = computed(() =>
    authStore.getActiveUser
      ? userStore.getUserByUid(authStore.getActiveUser)
      : null
  )
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
  // True when the user has a stale session: on a protected route but not logged in.
  // This can happen when a Firebase token expires mid-session or after a hard reload
  // with a corrupted auth state. We show a Sign In button so they aren't stuck.
  const isStuckState = computed(
    () => !props.loggedIn && !isPublicPage.value
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

  async function shareCurrentUrl() {
    return share(
      {
        title: document.title || 'Kharchafy',
        text: 'Open this page in Kharchafy.',
        url: window.location.href
      },
      {
        copySuccessMessage: 'Link copied to clipboard!',
        manualPromptLabel: 'Copy this link:',
        manualPromptErrorMessage:
          'Native share is unavailable, so the link was opened for manual copy.'
      }
    )
  }

  async function handleNavigate(notif) {
    notifVisible.value = false
    if (notif.action === 'open-bug-report') {
      options.openBugReport?.({
        view: 'my-reports',
        openId: notif.bugId || null
      })
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

  function navigateTo(path) {
    if (route.path === path) return
    router.push(path)
  }

  return {
    route,
    notifVisible,
    activeUserProfile,
    canShowBugReport,
    canShowManageTabs,
    isPublicPage,
    isStuckState,
    publicNavLinks: PUBLIC_NAV_LINKS,
    setLoggedInStatus,
    confirmLogout,
    handleNetPosition,
    navigateTo,
    shareCurrentUrl,
    handleNavigate
  }
}
