import { ref, onUnmounted, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useTabStore } from '../../stores/tabStore'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import useFireBase from '../../composables/useFirebase'
import { DB_NODES } from '../../constants/db-nodes'
import { tabs as allTabs } from '../../assets/data'
import { Tabs } from '../../assets/enums'
import { TAB_ROUTES, ROUTE_TABS, GROUP_TABS } from '../../router'
import { showError } from '../../utils/showAlerts'
import {
  decryptFromSession,
  decryptFromStore,
  encryptForSession,
  encryptForStore
} from '../../utils/sessionCrypto'
import { useGlobalNotifications } from '../../composables/useGlobalNotifications'
import { generateUUID } from '../../utils/uuid'
import { auth, onAuthStateChanged, signOut } from '../../firebase'
import { maskMobile } from '../../utils/maskMobile'
import { loadAppConfig } from '../../composables/useAppConfig'
import { clearAllCache } from '../../utils/queryCache'
import { NetPosition } from '../generic/net-position'

export const App = () => {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const tabStore = useTabStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()

  // Expenses Summary state
  const showNetPositionDialog = ref(false)
  const netPositionSummary = ref(null)
  const { showNetPositionConfirmation, calculateCompleteNetPosition } =
    NetPosition()

  // Theme management - Initialize immediately
  const savedTheme = localStorage.getItem('theme')
  const isDarkTheme = ref(savedTheme === 'dark')
  const THEME_PAGE_TURN_MS = 760
  let themeAnimationTimeout = null

  // Apply theme immediately on load
  const applyTheme = () => {
    if (isDarkTheme.value) {
      document.documentElement.classList.add('dark-theme')
      document.documentElement.classList.remove('light-theme')
      document.body.classList.add('dark-theme')
      document.body.classList.remove('light-theme')
    } else {
      document.documentElement.classList.add('light-theme')
      document.documentElement.classList.remove('dark-theme')
      document.body.classList.add('light-theme')
      document.body.classList.remove('dark-theme')
    }
  }

  const clearThemeAnimation = () => {
    if (themeAnimationTimeout) {
      clearTimeout(themeAnimationTimeout)
      themeAnimationTimeout = null
    }

    document.body?.classList.remove(
      'theme-page-turning',
      'theme-page-turning-to-dark',
      'theme-page-turning-to-light'
    )
  }

  const animateThemeTurn = (nextTheme) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const body = document.body
    if (!body) return

    clearThemeAnimation()
    void body.offsetWidth

    body.classList.add(
      'theme-page-turning',
      nextTheme === 'dark'
        ? 'theme-page-turning-to-dark'
        : 'theme-page-turning-to-light'
    )

    themeAnimationTimeout = window.setTimeout(() => {
      clearThemeAnimation()
    }, THEME_PAGE_TURN_MS)
  }

  // Apply theme immediately (before mount)
  applyTheme()

  const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
    applyTheme()
    animateThemeTurn(isDarkTheme.value ? 'dark' : 'light')
  }

  // Apply theme on mount and restore session if Firebase Auth is still active
  let authUnsubscribe = null
  onMounted(() => {
    applyTheme()

    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.emailVerified || loggedIn.value) return

      try {
        const usersData = await read(DB_NODES.USERS, false)
        if (!usersData) return

        const entry = Object.entries(usersData).find(
          ([, data]) =>
            data.email?.toLowerCase() === firebaseUser.email.toLowerCase()
        )
        if (!entry) return

        const [mobile, userData] = entry
        const token = generateUUID()
        const [encryptedSession, encryptedStore] = await Promise.all([
          encryptForSession({ name: userData.name, mobile, token }),
          encryptForStore({ name: userData.name, mobile, token })
        ])

        sessionStorage.setItem('_session', encryptedSession)
        authStore.setActiveUser(mobile)
        authStore.setSessionToken(encryptedStore)
        authStore.setActiveLoginCode('')
        loadAppConfig() // fire-and-forget: load remote config flags on auto-login

        // Populate userStore immediately so displayName is never "Guest" on any tab.
        // We already have the full users payload — just map it into the store.
        Object.keys(usersData).forEach((m) => {
          const u = usersData[m]
          if (u.emailVerified === true) {
            userStore.addUser({
              mobile: m,
              name: u.name || '',
              maskedMobile: maskMobile(m)
            })
          }
        })

        // Restore last route — this is a page-refresh, not a fresh login.
        // Restore the active group first so group-gated route guards pass.
        const savedGroupId = sessionStorage.getItem('_lastGroupId')
        if (savedGroupId) groupStore.setActiveGroup(savedGroupId)

        // Also fetch groups so getGroupById works on any tab (not just Groups tab).
        // This is a one-time read — same cost as GroupAccessGuard.vue does on demand.
        try {
          const groupsData = await read(DB_NODES.GROUPS, false)
          if (groupsData) {
            const groupList = Object.keys(groupsData).map((k) => ({
              id: k,
              ...groupsData[k]
            }))
            groupStore.setGroups(groupList)
          }
        } catch {
          // Non-fatal — Groups tab will load them when visited
        }

        const savedRoute = sessionStorage.getItem('_lastRoute')
        const keepCurrentProtectedRoute = route.meta?.requiresAuth
          ? route.fullPath
          : null
        // Strip query params from the second path segment before checking validAppRoutes.
        // e.g. '/personal-loans?month=2026-02' → segment[1]='personal-loans?month=...' → strip '?' → '/personal-loans'
        const savedBasePath = savedRoute
          ? '/' + savedRoute.split('/')[1].split('?')[0]
          : null
        const destination =
          keepCurrentProtectedRoute ||
          (savedBasePath && validAppRoutes.has(savedBasePath)
            ? savedRoute
            : '/groups')
        router.replace(destination)
      } catch (e) {
        console.error('Auto session restore failed:', e)
      }
    })
  })
  onUnmounted(() => {
    if (authUnsubscribe) authUnsubscribe()
    clearThemeAnimation()
  })

  // loggedIn is a computed — cannot be manually overridden via DevTools.
  // Checks presence only; the full crypto comparison happens in verifyUser().
  const loggedIn = computed(() => {
    return !!(
      authStore.getActiveUser &&
      authStore.getSessionToken &&
      sessionStorage.getItem('_session')
    )
  })

  // Computed tabs based on active group + bugResolver privilege
  const tabs = computed(() => {
    const activeGroup = groupStore.getActiveGroup
    const mobile = authStore.getActiveUser
    const user = mobile ? userStore.getUserByMobile(mobile) : null
    const isBugResolver = user?.bugResolver === true

    let base = activeGroup
      ? allTabs
      : allTabs.filter(
          (tab) => tab !== Tabs.SHARED_EXPENSES && tab !== Tabs.SHARED_LOANS
        )

    if (isBugResolver && !base.includes(Tabs.BUG_RESOLVER)) {
      base = [...base, Tabs.BUG_RESOLVER]
    }

    return base
  })

  const { read } = useFireBase()
  const displayName = computed(
    () => userStore.getUserByMobile(authStore.getActiveUser)?.name || 'Guest'
  )
  const activeGroup = computed(
    () => groupStore.getGroupById(groupStore.getActiveGroup)?.name
  )

  // Active tab derived from current route path; synced back to tabStore
  const activeTab = ref(
    ROUTE_TABS['/' + route.path.split('/')[1]] || Tabs.GROUPS
  )
  const tabTransitionName = ref('tab-page-forward')

  // Valid app route paths (used to filter out /login, /register, /)
  const validAppRoutes = new Set(Object.values(TAB_ROUTES))

  // Keep activeTab in sync when route changes, and persist last route to sessionStorage
  watch(
    () => route.path,
    (path) => {
      // Strip dynamic segment: /shared-expenses/groupId → /shared-expenses
      const basePath = '/' + path.split('/')[1]
      const tab = ROUTE_TABS[basePath] || Tabs.GROUPS
      if (tab !== activeTab.value) {
        updateTabTransition(tab)
        activeTab.value = tab
        tabStore.setActiveTab(tab)
      }
      // Save last app route (full path incl. groupId and query params) so page-refresh can restore it
      if (validAppRoutes.has(basePath)) {
        sessionStorage.setItem('_lastRoute', route.fullPath)
      }
    }
  )

  // Persist the active group separately so it survives page refresh on any tab.
  // This is a dedicated watcher rather than part of the route watcher because
  // the route watcher fires before Pinia is hydrated on reload — reading
  // getActiveGroup there would always be null and wipe the saved value.
  watch(
    () => groupStore.getActiveGroup,
    (gid) => {
      if (!loggedIn.value) return
      if (gid) sessionStorage.setItem('_lastGroupId', gid)
      else sessionStorage.removeItem('_lastGroupId')
    }
  )

  function updateTabTransition(nextTab) {
    const currentIndex = tabs.value.indexOf(activeTab.value)
    const nextIndex = tabs.value.indexOf(nextTab)

    if (currentIndex === -1 || nextIndex === -1 || currentIndex === nextIndex) {
      tabTransitionName.value = 'tab-page-forward'
      return
    }

    tabTransitionName.value =
      nextIndex > currentIndex ? 'tab-page-forward' : 'tab-page-backward'
  }

  async function logout() {
    clearAllCache()
    authStore.setActiveUser(null)
    groupStore.setActiveGroup(null)
    authStore.setSessionToken(null)
    authStore.setActiveLoginCode(null)
    sessionStorage.removeItem('_session')
    sessionStorage.removeItem('_lastRoute')
    sessionStorage.removeItem('_lastGroupId')
    // rememberMeData (name + mobile) is intentionally kept if Remember Me was enabled.
    // It was already cleared during login when Remember Me is OFF.
    await signOut(auth)
    router.replace('/login')
  }

  // Header emits false on logout click; any other caller also uses this
  function setLoggedInStatus(logged) {
    if (!logged) logout()
  }

  async function verifyUser(loading = true) {
    const encryptedStore = authStore.getSessionToken
    const encryptedSession = sessionStorage.getItem('_session')
    if (!encryptedStore || !encryptedSession) return false

    // Decrypt both blobs independently with their separate keys and algorithms.
    // Both must decrypt successfully and produce the same original token.
    const [tokenFromStore, tokenFromSession] = await Promise.all([
      decryptFromStore(encryptedStore),
      decryptFromSession(encryptedSession)
    ])
    if (
      !tokenFromStore ||
      !tokenFromSession ||
      tokenFromStore !== tokenFromSession
    )
      return false

    const mobile = authStore.getActiveUser
    if (!mobile) return false

    // Verify user exists in database
    // Note: loginCode is only in Firebase Auth, not in database
    try {
      const user = await read(`${DB_NODES.USERS}/${mobile}`, loading)
      return !!user
    } catch {
      return false
    }
  }

  // Function to handle tab changes — verifies user on every tab switch
  async function handleActiveTab(tab) {
    updateTabTransition(tab)
    activeTab.value = tab
    tabStore.setActiveTab(tab)
    const gid = groupStore.getActiveGroup
    const path =
      GROUP_TABS.has(tab) && gid ? `${TAB_ROUTES[tab]}/${gid}` : TAB_ROUTES[tab]
    router.push(path)

    const verified = await verifyUser()
    if (!verified) {
      showError('Session expired. Please login again.')
      logout()
    }
  }

  // On login: immediately verify crypto match, then re-verify every 5 minutes.
  let verifyInterval = null
  watch(loggedIn, async (isLoggedIn) => {
    if (isLoggedIn) {
      // Immediate check — catches anyone who faked store/sessionStorage values
      const verified = await verifyUser(false)
      if (!verified) {
        showError('Session expired. Please login again.')
        logout()
        return
      }
      // Fresh login from /login or /register → honour ?redirect if present,
      // otherwise go to /groups. Clear any stale saved route.
      if (route.path === '/login' || route.path === '/register') {
        sessionStorage.removeItem('_lastRoute')
        sessionStorage.removeItem('_lastGroupId')
        const redirectTo = route.query.redirect
        router.replace(
          typeof redirectTo === 'string' && redirectTo.startsWith('/')
            ? redirectTo
            : '/groups'
        )
      }
      verifyInterval = setInterval(async () => {
        const verified = await verifyUser(false)
        if (!verified) {
          showError('Session expired. Please login again.')
          logout()
        }
      }, 5 * 60_000)
    } else {
      if (verifyInterval) {
        clearInterval(verifyInterval)
        verifyInterval = null
      }
    }
  })

  onUnmounted(() => {
    if (verifyInterval) clearInterval(verifyInterval)
  })

  // Handle Expenses Summary button click
  async function handleShowNetPosition() {
    const confirmed = await showNetPositionConfirmation()
    if (!confirmed) return

    // Run calculations in background and show dialog when complete
    calculateCompleteNetPosition().then((summary) => {
      netPositionSummary.value = summary
      showNetPositionDialog.value = true
    })
  }

  function navigateToTab(tab, groupId) {
    if (groupId) {
      groupStore.setActiveGroup(groupId)
      // Trigger scroll to group with timestamp to ensure reactivity
      groupStore.setScrollToGroupTrigger({ groupId, timestamp: Date.now() })
    }
    updateTabTransition(tab)
    activeTab.value = tab
    tabStore.setActiveTab(tab)
    const gid = groupId || groupStore.getActiveGroup
    const path =
      GROUP_TABS.has(tab) && gid ? `${TAB_ROUTES[tab]}/${gid}` : TAB_ROUTES[tab]
    router.push(path)
  }

  // Initialize notification system only after successful login
  const allNotifications = ref([])
  const notificationCount = computed(() => allNotifications.value.length)
  let notificationCleanup = null

  function dismissNotification(notificationId) {
    allNotifications.value = allNotifications.value.filter(
      (notif) => notif.id !== notificationId
    )
  }

  // Watch for login state changes
  watch(
    loggedIn,
    (isLoggedIn) => {
      if (isLoggedIn) {
        // User logged in - initialize notifications in next tick to avoid blocking UI
        nextTick(() => {
          const { allNotifications: notifs, cleanup } = useGlobalNotifications()

          // Update refs reactively
          watch(
            notifs,
            (newNotifs) => {
              allNotifications.value = newNotifs
            },
            { immediate: true }
          )

          // Store cleanup function
          notificationCleanup = cleanup
        })
      } else {
        // User logged out - cleanup notifications
        if (notificationCleanup) {
          notificationCleanup()
          notificationCleanup = null
        }
        allNotifications.value = []
      }
    },
    { immediate: true }
  )

  return {
    loggedIn,
    authStore,
    tabStore,
    groupStore,
    userStore,
    tabs,
    displayName,
    activeGroup,
    activeTab,
    tabTransitionName,
    allNotifications,
    notificationCount,
    dismissNotification,
    setLoggedInStatus,
    handleActiveTab,
    isDarkTheme,
    toggleTheme,
    showNetPositionDialog,
    netPositionSummary,
    handleShowNetPosition,
    navigateToTab
  }
}
