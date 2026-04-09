import { ref, onUnmounted, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  useAuthStore,
  useTabStore,
  useGroupStore,
  useUserStore
} from '@/stores'
import {
  useFireBase,
  useGlobalNotifications,
  loadAppConfig,
  useInactivityLogout
} from '@/composables'
import { DB_NODES } from '@/constants'
import { tabs as allTabs, Tabs } from '@/assets'
import { TAB_ROUTES, ROUTE_TABS, GROUP_TABS } from '@/router'
import { findUserByEmail } from '@/helpers'
import {
  showError,
  generateUUID,
  maskMobile,
  clearAllCache,
  decryptFromSession,
  decryptFromStore,
  encryptForSession,
  encryptForStore
} from '@/utils'
import {
  auth,
  onAuthStateChanged,
  signOut,
  collection,
  database,
  getDocs,
  query,
  where
} from '@/firebase'
import { NetPosition } from '@/scripts/generic'

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
  const formatInactivityLabel = (timeoutMs) => {
    const minutes = Math.round(timeoutMs / 60_000)
    return minutes === 1 ? '1 minute' : `${minutes} minutes`
  }

  // Theme management - Initialize immediately
  const savedTheme = localStorage.getItem('theme')
  const isDarkTheme = ref(savedTheme === 'dark')
  const THEME_PAGE_TURN_MS = 760
  let themeAnimationTimeout = null
  const applyClasses = (docAddCls, docRemoveCls, bodyAddCls, bodyRemoveCls) => {
    document.documentElement.classList.add(docAddCls)
    document.documentElement.classList.remove(docRemoveCls)
    document.body.classList.add(bodyAddCls)
    document.body.classList.remove(bodyRemoveCls)
  }
  // Apply theme immediately on load
  const applyTheme = () => {
    if (isDarkTheme.value) {
      applyClasses('dark-theme', 'light-theme', 'dark-theme', 'light-theme')
    } else {
      applyClasses('light-theme', 'dark-theme', 'light-theme', 'dark-theme')
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
        const userData = await findUserByEmail(firebaseUser.email)
        if (!userData?.emailVerified) return

        const uid = userData.uid
        const token = generateUUID()
        const dataForEncryption = {
          name: userData.name,
          uid,
          mobile: userData.mobile,
          token
        }
        const [encryptedSession, encryptedStore] = await Promise.all([
          encryptForSession(dataForEncryption),
          encryptForStore(dataForEncryption)
        ])

        sessionStorage.setItem('_session', encryptedSession)
        authStore.setActiveUser(uid)
        authStore.setSessionToken(encryptedStore)
        authStore.setActivePassword('')
        loadAppConfig() // fire-and-forget: load remote config flags on auto-login

        // Populate the active user immediately so displayName is never "Guest".
        userStore.addUser({
          uid,
          mobile: userData.mobile || '',
          name: userData.name || '',
          email: userData.email || '',
          maskedMobile: maskMobile(userData.mobile || '')
        })

        // Restore last route — this is a page-refresh, not a fresh login.
        // Restore the active group first so group-gated route guards pass.
        const savedGroupId = sessionStorage.getItem('_lastGroupId')
        if (savedGroupId) groupStore.setActiveGroup(savedGroupId)

        // Also fetch groups so getGroupById works on any tab (not just Groups tab).
        // This is a one-time read — same cost as GroupAccessGuard.vue does on demand.
        try {
          const groupsSnapshot = await getDocs(
            query(
              collection(database, DB_NODES.GROUPS),
              where('memberMobiles', 'array-contains', uid)
            )
          )
          if (!groupsSnapshot.empty) {
            const groupList = groupsSnapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data()
            }))
            groupStore.setGroups(groupList)
          } else {
            groupStore.setGroups([])
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
  const {
    startInactivityTracking,
    stopInactivityTracking
  } = useInactivityLogout({
    isLoggedIn: loggedIn,
    onTimeout: async (timeoutMs) => {
      showError(
        `You were logged out after ${formatInactivityLabel(timeoutMs)} of inactivity.`,
        { duration: 0 }
      )
      await logout()
    }
  })

  // Computed tabs based on active group + bugResolver privilege
  const tabs = computed(() => {
    const activeGroup = groupStore.getActiveGroup
    const uid = authStore.getActiveUser
    const user = uid ? userStore.getUserByUid(uid) : null
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
    () => userStore.getUserByUid(authStore.getActiveUser)?.name || 'Guest'
  )
  const activeGroup = computed(
    () => groupStore.getGroupById(groupStore.getActiveGroup)?.name
  )

  // Active tab derived from current route path; synced back to tabStore
  const activeTab = ref(
    ROUTE_TABS['/' + route.path.split('/')[1]] || Tabs.GROUPS
  )
  const tabBarKey = ref(0)
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

  let logoutPromise = null
  async function logout() {
    if (logoutPromise) return logoutPromise

    logoutPromise = (async () => {
      stopInactivityTracking()
      clearAllCache()
      authStore.setActiveUser(null)
      groupStore.setActiveGroup(null)
      authStore.setSessionToken(null)
      authStore.setActivePassword(null)
      sessionStorage.removeItem('_session')
      sessionStorage.removeItem('_lastRoute')
      sessionStorage.removeItem('_lastGroupId')
      // rememberMeData (name + mobile) is intentionally kept if Remember Me was enabled.
      // It was already cleared during login when Remember Me is OFF.
      try {
        await signOut(auth)
      } catch (error) {
        console.error('Firebase sign-out failed:', error)
      } finally {
        await router.replace('/login')
        logoutPromise = null
      }
    })()

    return logoutPromise
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

    const uid = authStore.getActiveUser
    if (!uid) return false

    // Verify user exists in database
    // Note: password is only in Firebase Auth, not in database
    try {
      const user = await read(`${DB_NODES.USERS}/${uid}`, loading)
      return !!user
    } catch {
      return false
    }
  }

  // Function to handle tab changes — verifies user on every tab switch
  async function handleActiveTab(tab) {
    const previousTab =
      ROUTE_TABS['/' + route.path.split('/')[1]] || Tabs.GROUPS
    const gid = groupStore.getActiveGroup
    const path =
      GROUP_TABS.has(tab) && gid ? `${TAB_ROUTES[tab]}/${gid}` : TAB_ROUTES[tab]
    const previousRoute = route.fullPath
    await router.push(path)

    if (route.fullPath === previousRoute) {
      activeTab.value = previousTab
      tabStore.setActiveTab(previousTab)
      await nextTick()
      tabBarKey.value += 1
      return
    }

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
      // Fresh login from /login or /register → navigate immediately so the
      // login form is replaced at once; verification runs in the background.
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
      // Background check — catches anyone who faked store/sessionStorage values
      const verified = await verifyUser(false)
      if (!verified) {
        showError('Session expired. Please login again.')
        logout()
        return
      }
      startInactivityTracking()
      verifyInterval = setInterval(async () => {
        const verified = await verifyUser(false)
        if (!verified) {
          showError('Session expired. Please login again.')
          logout()
        }
      }, 5 * 60_000)
    } else {
      stopInactivityTracking()
      if (verifyInterval) {
        clearInterval(verifyInterval)
        verifyInterval = null
      }
    }
  })

  onUnmounted(() => {
    stopInactivityTracking()
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
    const gid = groupId || groupStore.getActiveGroup
    const path =
      GROUP_TABS.has(tab) && gid ? `${TAB_ROUTES[tab]}/${gid}` : TAB_ROUTES[tab]
    const previousRoute = route.fullPath

    router.push(path).then(() => {
      if (route.fullPath === previousRoute) {
        return
      }

      if (groupId) {
        groupStore.setActiveGroup(groupId)
        // Trigger scroll to group with timestamp to ensure reactivity
        groupStore.setScrollToGroupTrigger({ groupId, timestamp: Date.now() })
      }
    })
  }

  // Initialize notification system only after successful login
  const allNotifications = ref([])
  const notificationCount = computed(() => allNotifications.value.length)
  let notificationCleanup = null
  let notifDismissPersistent = null

  function dismissNotification(notificationId) {
    allNotifications.value = allNotifications.value.filter(
      (notif) => notif.id !== notificationId
    )
    notifDismissPersistent?.(notificationId)
  }

  // Watch for login state changes
  watch(
    loggedIn,
    (isLoggedIn) => {
      if (isLoggedIn) {
        // User logged in - initialize notifications in next tick to avoid blocking UI
        nextTick(() => {
          const {
            allNotifications: notifs,
            cleanup,
            dismissPersistentNotif
          } = useGlobalNotifications()
          notifDismissPersistent = dismissPersistentNotif

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
        notifDismissPersistent = null
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
    tabBarKey,
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
