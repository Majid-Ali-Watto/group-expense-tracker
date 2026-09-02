import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getBugReportConfig, useShare } from '@/composables'
import { PUBLIC_NAV_LINKS } from '@/constants'
import { confirmAction } from '@/utils/confirmAction'
import { getStoredLocale } from '@/i18n'
import { useAuthStore, useDataStore, useUserStore } from '@/stores'

export const Header = (props, emit) => {
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

    if (notif.action === 'dismiss-user-rejection' && notif.userUid) {
      props.dismissNotification(notif.id)
      // Firestore-backed and only reachable for a logged-in user dismissing
      // a real notification — lazy-loaded so Header.vue (rendered on every
      // route, including public marketing pages) doesn't force the
      // Firestore SDK into every visitor's bundle. See src/firebase.js's
      // header comment.
      import('./dismissUserRejection').then(({ dismissUserRejection }) =>
        dismissUserRejection(notif.userUid).catch(() => {})
      )
    }

    if (!notif.tab) return
    if (notif.action === 'scroll-to-row' && notif.rowId) {
      props.dismissNotification(notif.id)
      useDataStore().setPendingScrollRowId(notif.rowId)
    }
    emit('navigate-to-tab', { tab: notif.tab, groupId: notif.groupId })
  }

  // Login/register/help are emitted as bare paths by header buttons that
  // don't know about locales — preserve Urdu when navigating to them.
  // Login/register are themselves locale-variant routes, so the current
  // route's own meta.locale says which variant to stay on. Help is opened
  // from plain app routes (no meta.locale of their own — see router guard's
  // comment on getCurrentUserProfile), so it falls back to the user's saved
  // app-wide locale preference instead.
  function navigateTo(path) {
    let target = path

    if (path === '/login' || path === '/register') {
      target = route.meta?.locale === 'ur' ? `/ur${path}` : path
    } else if (path === '/help') {
      const locale = route.meta?.locale || getStoredLocale()
      target = locale === 'ur' ? `/ur${path}` : path
    }

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
