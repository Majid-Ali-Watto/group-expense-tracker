import { ref, onUnmounted, onMounted, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useTabStore } from '../../stores/tabStore'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import useFireBase from '../../api/firebase-apis'
import { tabs as allTabs } from '../../assets/data'
import { Tabs } from '../../assets/enums'
import { getActiveTab } from '../../utils/active-tab'
import { showError } from '../../utils/showAlerts'
import {
  decryptFromSession,
  decryptFromStore,
  encryptForSession,
  encryptForStore
} from '../../utils/sessionCrypto'
import { useGlobalNotifications } from '../../utils/useGlobalNotifications'
import { generateUUID } from '../../utils/uuid'
import { auth, onAuthStateChanged, signOut } from '../../firebase'
import { NetPosition } from '../generic/net-position'

export const App = () => {
  const authStore = useAuthStore()
  const tabStore = useTabStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()

  // Holds the saved tab to restore after HOC loads groups/users data
  const pendingTabRestore = ref(null)

  // Expenses Summary state
  const showNetPositionDialog = ref(false)
  const netPositionSummary = ref(null)
  const { showNetPositionConfirmation, calculateCompleteNetPosition } =
    NetPosition()

  // Theme management - Initialize immediately
  const savedTheme = localStorage.getItem('theme')
  const isDarkTheme = ref(savedTheme === 'dark')

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

  // Apply theme immediately (before mount)
  applyTheme()

  const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
    applyTheme()
  }

  // Apply theme on mount and restore session if Firebase Auth is still active
  let authUnsubscribe = null
  onMounted(() => {
    applyTheme()

    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.emailVerified || loggedIn.value) return

      try {
        const usersData = await read('users', false)
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

        // Queue the saved tab — Groups opens first so HOC can load data,
        // then the watcher below applies the restore once users are ready
        const savedTab = sessionStorage.getItem('_activeTab')
        if (savedTab && allTabs.includes(savedTab)) {
          pendingTabRestore.value = savedTab
        }
      } catch (e) {
        console.error('Auto session restore failed:', e)
      }
    })
  })
  onUnmounted(() => {
    if (authUnsubscribe) authUnsubscribe()
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

  // Computed tabs based on active group
  const tabs = computed(() => {
    const activeGroup = groupStore.getActiveGroup
    if (!activeGroup) {
      return allTabs.filter(
        (tab) => tab !== Tabs.SHARED_EXPENSES && tab !== Tabs.SHARED_LOANS
      )
    }
    return allTabs
  })

  const { read } = useFireBase()
  const displayName = computed(
    () => userStore.getUserByMobile(authStore.getActiveUser)?.name || 'Guest'
  )
  const activeGroup = computed(
    () => groupStore.getGroupById(groupStore.getActiveGroup)?.name
  )

  // Current active tab from store
  const activeTab = ref(tabStore.getActiveTab || tabs.value[0])

  // Once HOC loads users (signal that group/user data is ready), apply the queued tab restore
  const stopTabRestoreWatch = watch(
    () => userStore.users.length,
    (len) => {
      if (len > 0 && pendingTabRestore.value) {
        const tab = pendingTabRestore.value
        pendingTabRestore.value = null
        if (tabs.value.includes(tab)) {
          activeTab.value = tab
          tabStore.setActiveTab(tab)
        }
        stopTabRestoreWatch()
      }
    }
  )

  async function logout() {
    authStore.setActiveUser(null)
    groupStore.setActiveGroup(null)
    authStore.setSessionToken(null)
    authStore.setActiveLoginCode(null)
    sessionStorage.removeItem('_session')
    sessionStorage.removeItem('_activeTab')
    pendingTabRestore.value = null
    // rememberMeData (name + mobile) is intentionally kept if Remember Me was enabled.
    // It was already cleared during login when Remember Me is OFF.
    await signOut(auth)
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
      const user = await read(`users/${mobile}`, loading)
      return !!user
    } catch {
      return false
    }
  }

  // Function to handle tab changes — verifies user on every tab switch
  async function handleActiveTab(tab) {
    activeTab.value = tab
    tabStore.setActiveTab(tab)
    sessionStorage.setItem('_activeTab', tab)

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

  // Map activeTab to dynamic components
  const activeTabComponent = (activeTab) => {
    return getActiveTab(activeTab)
  }

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
    activeTab.value = tab
    tabStore.setActiveTab(tab)
    sessionStorage.setItem('_activeTab', tab)
  }

  // Initialize notification system only after successful login
  const allNotifications = ref([])
  const notificationCount = computed(() => allNotifications.value.length)
  let notificationCleanup = null

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
    allNotifications,
    notificationCount,
    setLoggedInStatus,
    handleActiveTab,
    activeTabComponent,
    isDarkTheme,
    toggleTheme,
    showNetPositionDialog,
    netPositionSummary,
    handleShowNetPosition,
    navigateToTab
  }
}
