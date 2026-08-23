import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { database, doc, deleteDoc, updateDoc, deleteField } from '@/firebase'
import { getBugReportConfig, useShare } from '@/composables'
import { DB_NODES } from '@/constants'
import { PUBLIC_NAV_LINKS } from '@/constants'
import { confirmAction } from '@/utils/confirmAction'
import { useAuthStore, useDataStore, useUserStore } from '@/stores'

export const Header = (props, emit, options = {}) => {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { share } = useShare()
  const notifVisible = ref(false)
  const activeUserProfile = computed(() =>
    authStore.getActiveUserUid
      ? userStore.getUserByUid(authStore.getActiveUserUid)
      : null
  )
  const canShowBugReport = computed(
    () => props.loggedIn && getBugReportConfig().report
  )
  const canShowAdmin = computed(
    () => props.loggedIn && userStore.getActiveUserAdminFlags?.isAdmin === true
  )
  const isPublicPage = computed(
    () =>
      !props.loggedIn &&
      (route.meta?.publicPage === true || route.meta?.requiresGuest === true)
  )
  // True for any route that participates in the locale system — the 6
  // public marketing pages plus /login and /register — used to gate the
  // language switcher. Plain app routes never set `meta.locale` at all.
  const hasLocaleVariant = computed(() => route.meta?.locale !== undefined)
  const currentLocale = computed(() => route.meta?.locale || 'en')
  // True when the user has a stale session: on a protected route but not logged in.
  // This can happen when a Firebase token expires mid-session or after a hard reload
  // with a corrupted auth state. We show a Sign In button so they aren't stuck.
  const isStuckState = computed(() => !props.loggedIn && !isPublicPage.value)

  function setLoggedInStatus() {
    emit('click-log', false)
  }

  async function confirmLogout() {
    const confirmed = await confirmAction({
      message: t('headerActions.confirmLogoutMessage'),
      title: t('headerActions.confirmLogoutTitle'),
      confirmButtonText: t('headerActions.logout'),
      cancelButtonText: t('headerActions.stayLoggedIn'),
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
        title: document.title || t('footer.brand'),
        text: t('layout.shareText'),
        url: window.location.href
      },
      {
        copySuccessMessage: t('layout.linkCopied'),
        manualPromptLabel: t('layout.copyThisLink'),
        manualPromptErrorMessage: t('layout.nativeShareUnavailable')
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

  // Login/register are emitted as bare paths by header buttons that don't
  // know about locales — preserve the current /ur context when navigating
  // to them so an Urdu marketing/guest page doesn't drop back to English.
  function navigateTo(path) {
    const target =
      (path === '/login' || path === '/register') && route.meta?.locale === 'ur'
        ? `/ur${path}`
        : path
    if (route.path === target) return
    router.push(target)
  }

  return {
    route,
    notifVisible,
    activeUserProfile,
    canShowBugReport,
    canShowAdmin,
    isPublicPage,
    hasLocaleVariant,
    currentLocale,
    isStuckState,
    publicNavLinks: computed(() => PUBLIC_NAV_LINKS[currentLocale.value]),
    setLoggedInStatus,
    confirmLogout,
    handleNetPosition,
    navigateTo,
    shareCurrentUrl,
    handleNavigate
  }
}
