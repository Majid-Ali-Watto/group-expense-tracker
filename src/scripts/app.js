import { defineAsyncComponent, ref, onUnmounted, onMounted, computed, watch } from 'vue'
import { store } from '../stores/store'
import useFireBase from '../api/firebase-apis'
import { tabs as allTabs } from '../assets/data'
import { Tabs } from '../assets/enums'
import { getActiveTab } from '../utils/active-tab'
import { showError } from '../utils/showAlerts'
import { decryptFromSession, decryptFromStore } from '../utils/sessionCrypto'

export const App = () => {
  // Lazy-loaded components
  const HOC = defineAsyncComponent(() => import('@/components/HOC.vue'))
  const Login = defineAsyncComponent(() => import('@/components/Login.vue'))
  const Header = defineAsyncComponent(() => import('@/components/Header.vue'))

  const tabStore = store()

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

  // Apply theme on mount as well
  onMounted(() => {
    applyTheme()
  })

  // loggedIn is a computed — cannot be manually overridden via DevTools.
  // Checks presence only; the full crypto comparison happens in verifyUser().
  const loggedIn = computed(() => {
    return !!(
      tabStore.getActiveUser &&
      tabStore.getSessionToken &&
      sessionStorage.getItem('_session')
    )
  })

  // Computed tabs based on active group
  const tabs = computed(() => {
    const activeGroup = tabStore.getActiveGroup
    if (!activeGroup) {
      return allTabs.filter(
        (tab) => tab !== Tabs.SHARED_EXPENSES && tab !== Tabs.SHARED_LOANS
      )
    }
    return allTabs
  })

  const { read } = useFireBase()
  const displayName = computed(
    () => tabStore.getUserByMobile(tabStore.getActiveUser)?.name || 'Guest'
  )
  const activeGroup = computed(
    () => tabStore.getGroupById(tabStore.getActiveGroup)?.name
  )

  // Current active tab from store
  const activeTab = ref(tabStore.getActiveTab || tabs.value[0])

  function logout() {
    tabStore.setActiveUser(null)
    tabStore.setActiveGroup(null)
    tabStore.setSessionToken(null)
    tabStore.setActiveLoginCode(null)
    sessionStorage.removeItem('_session')
    // rememberMeData (name + mobile) is intentionally kept if Remember Me was enabled.
    // It was already cleared during login when Remember Me is OFF.
  }

  // Header emits false on logout click; any other caller also uses this
  function setLoggedInStatus(logged) {
    if (!logged) logout()
  }

  async function verifyUser(loading = true) {
    const encryptedStore = tabStore.getSessionToken
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

    const mobile = tabStore.getActiveUser
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

  return {
    HOC,
    Login,
    Header,
    loggedIn,
    tabStore,
    tabs,
    displayName,
    activeGroup,
    activeTab,
    setLoggedInStatus,
    handleActiveTab,
    activeTabComponent,
    isDarkTheme,
    toggleTheme
  }
}
