import { ref, onUnmounted, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  useAuthStore,
  useTabStore,
  useGroupStore,
  useUserStore
} from '@/stores'
import { loadAppConfig, stopAppConfigSync } from '@/composables/useAppConfig'
import useFireBase from '@/composables/useFirebase'
import { useGlobalNotifications } from '@/composables/useGlobalNotifications'
import { useInactivityLogout } from '@/composables/useInactivityLogout'
import { DB_NODES } from '@/constants'
import { tabs as allTabs, Tabs } from '@/assets'
import { TAB_ROUTES, ROUTE_TABS, GROUP_TABS } from '@/router'
import {
  findUserByEmail,
  canAccessTab,
  getAccessibleTabs,
  getDefaultAccessibleTab,
  findUserTabConfigByUid,
  canAccessManageTabs,
  needsSharedTabsUpgrade,
  buildUpgradedSharedTabConfig,
  hasSharedFeatures
} from '@/helpers'
import {
  setAnalyticsIdentity,
  clearAnalyticsIdentity,
  trackAnalyticsEvent
} from '@/utils/analytics'
import { withTrace } from '@/utils/performance'
import { maskMobile } from '@/utils/maskMobile'
import { clearAllCache } from '@/utils/queryCache'
import {
  decryptFromSession,
  decryptFromStore,
  encryptForSession,
  encryptForStore
} from '@/utils/sessionCrypto'
import { showError } from '@/utils/showAlerts'
import { generateUUID } from '@/utils/uuid'
import {
  auth,
  onAuthStateChanged,
  signOut,
  setDoc,
  collection,
  doc,
  database,
  getDocs,
  onSnapshot,
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

  const getActiveUserProfile = () => {
    const uid = authStore.getActiveUser
    return uid ? userStore.getUserByUid(uid) : null
  }
  let activeUserTabConfigUnsubscribe = null

  function stopActiveUserTabConfigSync() {
    if (activeUserTabConfigUnsubscribe) {
      activeUserTabConfigUnsubscribe()
      activeUserTabConfigUnsubscribe = null
    }
  }

  function startActiveUserTabConfigSync(uid) {
    stopActiveUserTabConfigSync()
    if (!uid) {
      userStore.clearActiveUserTabAccess()
      return
    }

    activeUserTabConfigUnsubscribe = onSnapshot(
      doc(database, DB_NODES.USER_TAB_CONFIGS, uid),
      (snap) => {
        const config = snap.exists() ? { id: snap.id, ...snap.data() } : null
        userStore.setActiveUserTabAccess({
          config,
          accessManageTabs: canAccessManageTabs(config)
        })
      },
      () => {
        userStore.setActiveUserTabAccess({
          config: null,
          accessManageTabs: true
        })
      }
    )
  }

  function buildPathForTab(tab, groupId = groupStore.getActiveGroup) {
    return GROUP_TABS.has(tab) && groupId
      ? `${TAB_ROUTES[tab]}/${groupId}`
      : TAB_ROUTES[tab]
  }

  function canAccessPath(path, userTabConfig, groupId = groupStore.getActiveGroup) {
    if (!path || typeof path !== 'string' || !path.startsWith('/')) return false

    const basePath = '/' + path.split('/')[1].split('?')[0]
    const tab = ROUTE_TABS[basePath]

    if (basePath === '/shared-groups') {
      return canAccessTab(Tabs.GROUPS, userTabConfig)
    }

    if (!tab) return false

    return canAccessTab(tab, userTabConfig, {
      hasActiveGroup: GROUP_TABS.has(tab) ? !!groupId : true
    })
  }

  function getDefaultAccessiblePath(
    userTabConfig = userStore.getActiveUserTabConfig,
    groupId = groupStore.getActiveGroup
  ) {
    const tab = getDefaultAccessibleTab(userTabConfig, {
      hasActiveGroup: !!groupId
    })
    return buildPathForTab(tab, groupId)
  }

  function resolveAccessiblePath(path, userTabConfig, groupId = groupStore.getActiveGroup) {
    return canAccessPath(path, userTabConfig, groupId)
      ? path
      : getDefaultAccessiblePath(userTabConfig, groupId)
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
      // Firebase has no authenticated user — check for a stale _session left over
      // from an expired token, browser crash, or corrupted state. Clean it up so
      // the user is not permanently stuck on a protected route with no way out.
      if (!firebaseUser) {
        if (sessionStorage.getItem('_session')) {
          sessionStorage.removeItem('_session')
          sessionStorage.removeItem('_lastRoute')
          sessionStorage.removeItem('_lastGroupId')
          if (route.meta?.requiresAuth) {
            await router.replace('/login')
          }
        }
        return
      }
      if (!firebaseUser.emailVerified || loggedIn.value) return

      await withTrace('session_bootstrap', async () => {
        const userData = await findUserByEmail(firebaseUser.email)
        if (!userData?.emailVerified) return

        const uid = userData.uid
        const userTabConfig = await findUserTabConfigByUid(uid)
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
        userStore.setActiveUserTabAccess({
          config: userTabConfig,
          accessManageTabs: canAccessManageTabs(userTabConfig)
        })

        // Populate the active user immediately so displayName is never "Guest".
        userStore.addUser({
          uid,
          mobile: userData.mobile || '',
          name: userData.name || '',
          email: userData.email || '',
          maskedMobile: maskMobile(userData.mobile || ''),
          bugResolver: userData.bugResolver === true,
          blocked: userData.blocked === true
        })

        // Restore last route — this is a page-refresh, not a fresh login.
        // Only restore group state and fetch groups when the user has shared features.
        if (hasSharedFeatures(userTabConfig)) {
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

              // User is a member of at least one group — ensure their tab config
              // includes shared tabs (groups, sharedExpenses, sharedLoans).
              // This silently upgrades users who were added via join-request while
              // they only had personal features enabled.
              if (needsSharedTabsUpgrade(userTabConfig)) {
                try {
                  const upgraded = buildUpgradedSharedTabConfig(userTabConfig)
                  const docPayload = { uid, ...upgraded }
                  await setDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid), docPayload, { merge: true })
                  userStore.setActiveUserTabAccess({ config: docPayload, accessManageTabs: upgraded.accessManageTabs !== false })
                } catch {
                  // Non-fatal — will retry on next login
                }
              }
            } else {
              groupStore.setGroups([])
            }
          } catch {
            // Non-fatal — Groups tab will load them when visited
          }
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
            : null)
        router.replace(resolveAccessiblePath(destination, userTabConfig))
      }).catch((e) => {
        console.error('Auto session restore failed:', e)
      })
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
  const { startInactivityTracking, stopInactivityTracking } =
    useInactivityLogout({
      isLoggedIn: loggedIn,
      onTimeout: async (timeoutMs) => {
        showError(
          `You were logged out after ${formatInactivityLabel(timeoutMs)} of inactivity.`,
          { duration: 0 }
        )
        await logout('inactivity')
      }
    })

  // Computed tabs based on active group + bugResolver privilege
  const tabs = computed(() => {
    const activeGroup = groupStore.getActiveGroup
    const user = getActiveUserProfile()
    const isBugResolver = user?.bugResolver === true

    let base = getAccessibleTabs(userStore.getActiveUserTabConfig, {
      hasActiveGroup: !!activeGroup
    }).filter((tab) => allTabs.includes(tab))

    if (isBugResolver && !base.includes(Tabs.BUG_RESOLVER)) {
      base = [...base, Tabs.BUG_RESOLVER]
    }

    return base
  })

  const { read } = useFireBase()
  const displayName = computed(
    () => userStore.getUserByUid(authStore.getActiveUser)?.name || 'Guest'
  )
  const activeUserTabConfig = computed(
    () => userStore.getActiveUserTabConfig
  )
  const activeGroup = computed(() => {
    if (!hasSharedFeatures(userStore.getActiveUserTabConfig)) return null
    return groupStore.getGroupById(groupStore.getActiveGroup)?.name
  })
  const isPublicPage = computed(
    () => !loggedIn.value && route.meta?.publicPage === true
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

  watch(
    [loggedIn, activeUserTabConfig, () => route.fullPath],
    ([isLoggedIn, userTabConfig, currentPath]) => {
      if (!isLoggedIn || !currentPath) return
      if (canAccessPath(currentPath, userTabConfig)) return

      const fallbackPath = getDefaultAccessiblePath(userTabConfig)
      if (currentPath !== fallbackPath) {
        router.replace(fallbackPath)
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
  async function logout(reason = 'manual') {
    if (logoutPromise) return logoutPromise

    logoutPromise = (async () => {
      stopInactivityTracking()
      stopActiveUserTabConfigSync()
      userStore.clearActiveUserTabAccess()
      stopAppConfigSync()
      await trackAnalyticsEvent('logout', { reason })
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
    if (!tabs.value.includes(tab)) {
      tabBarKey.value += 1
      return
    }

    const previousTab =
      ROUTE_TABS['/' + route.path.split('/')[1]] || Tabs.GROUPS
    const gid = groupStore.getActiveGroup
    const path = buildPathForTab(tab, gid)
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
      logout('session_expired')
    }
  }

  // On login: immediately verify crypto match, then re-verify every 5 minutes.
  let verifyInterval = null
  watch(loggedIn, async (isLoggedIn) => {
    if (isLoggedIn) {
      startActiveUserTabConfigSync(authStore.getActiveUser)
      // Fresh login from /login or /register → navigate immediately so the
      // login form is replaced at once; verification runs in the background.
      if (route.path === '/login' || route.path === '/register') {
        sessionStorage.removeItem('_lastRoute')
        sessionStorage.removeItem('_lastGroupId')
        const redirectTo = route.query.redirect
        router.replace(
          resolveAccessiblePath(
            typeof redirectTo === 'string' && redirectTo.startsWith('/')
              ? redirectTo
              : null
          )
        )
      }
      // Background check — catches anyone who faked store/sessionStorage values
      const verified = await verifyUser(false)
      if (!verified) {
        showError('Session expired. Please login again.')
        logout('session_expired')
        return
      }
      await setAnalyticsIdentity(authStore.getActiveUser)
      startInactivityTracking()
      verifyInterval = setInterval(async () => {
        const verified = await verifyUser(false)
        if (!verified) {
          showError('Session expired. Please login again.')
          logout('session_expired')
        }
      }, 5 * 60_000)
    } else {
      stopActiveUserTabConfigSync()
      userStore.clearActiveUserTabAccess()
      clearAnalyticsIdentity()
      stopInactivityTracking()
      if (verifyInterval) {
        clearInterval(verifyInterval)
        verifyInterval = null
      }
    }
  })

  onUnmounted(() => {
    stopActiveUserTabConfigSync()
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
    if (!tabs.value.includes(tab)) return

    const gid = groupId || groupStore.getActiveGroup
    const path = buildPathForTab(tab, gid)
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
    isPublicPage,
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
