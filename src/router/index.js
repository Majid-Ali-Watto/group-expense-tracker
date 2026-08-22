import { useGroupStore } from '../stores/groupStore'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { Tabs } from '../assets/enums'
import { PUBLIC_BASE_PATHS, SEO_PAGES, getSeoPages } from '@/constants'
import {
  resolveUserFromAuth,
  canAccessTab,
  getDefaultAccessibleTab,
  findUserTabConfigByUid,
  findUserAdminFlagsByUid,
  canAccessManageTabs
} from '@/helpers'
import { maskMobile } from '@/utils/maskMobile'
import { auth } from '@/firebase'
import { setStoredLocale } from '@/i18n'

// Standard dynamic imports — do NOT use loadAsyncComponent here.
// loadAsyncComponent sets suspensible:false which conflicts with Vue Router's
// internal async component handling and causes an infinite navigation loop.
const LandingPage = () => import('@/components/public/LandingPage.vue')
const FeaturesPage = () => import('@/components/public/FeaturesPage.vue')
const GroupExpenseTrackerPage = () =>
  import('@/components/public/GroupExpenseTrackerPage.vue')
const HelpPage = () => import('@/components/public/HelpPage.vue')
const PersonalBudgetTrackerPage = () =>
  import('@/components/public/PersonalBudgetTrackerPage.vue')
const FaqPage = () => import('@/components/public/FaqPage.vue')
const Groups = () => import('@/components/groups/Groups.vue')
const Login = () => import('@/components/auth/Login.vue')
const SharedExpenses = () =>
  import('@/components/shared-expenses/SharedExpenses.vue')
const SharedLoansGuard = () =>
  import('@/components/shared-loans/SharedLoansGuard.vue')
const Users = () => import('@/components/users/Users.vue')
const PersonalExpenses = () =>
  import('@/components/personal-expenses/PersonalExpenses.vue')
const PersonalLoans = () =>
  import('@/components/personal-loans/PersonalLoans.vue')
const BugReportsAdmin = () =>
  import('@/components/bug-reports-admin/BugReportsAdmin.vue')
const AdminConfig = () => import('@/components/admin/AdminConfig.vue')
const SharedGroups = () => import('@/components/groups/SharedGroups.vue')

// Tab name → URL path mapping (base paths, without :groupId)
export const TAB_ROUTES = {
  [Tabs.GROUPS]: '/groups',
  [Tabs.SHARED_EXPENSES]: '/shared-expenses',
  [Tabs.SHARED_LOANS]: '/shared-loans',
  [Tabs.USERS]: '/users',
  [Tabs.PERSONAL_EXPENSES]: '/personal-expenses',
  [Tabs.PERSONAL_LOANS]: '/personal-loans',
  [Tabs.BUG_RESOLVER]: '/bug-reports'
}

// URL base path → Tab name mapping
export const ROUTE_TABS = {
  '/groups': Tabs.GROUPS,
  '/shared-expenses': Tabs.SHARED_EXPENSES,
  '/shared-loans': Tabs.SHARED_LOANS,
  '/users': Tabs.USERS,
  '/personal-expenses': Tabs.PERSONAL_EXPENSES,
  '/personal-loans': Tabs.PERSONAL_LOANS,
  '/bug-reports': Tabs.BUG_RESOLVER
}

// Tabs that embed a groupId in their URL path
export const GROUP_TABS = new Set([Tabs.SHARED_EXPENSES, Tabs.SHARED_LOANS])

// Pure browser API — no Pinia / Vue reactive dependencies.
// Safe to call anywhere including router guards without risk of circular reactivity.
// Guarded for SSG prerendering, where there is no sessionStorage (Node).
function hasSession() {
  return (
    typeof sessionStorage !== 'undefined' &&
    !!sessionStorage.getItem('_session')
  )
}

// Resolves once Firebase Auth has finished its initial state check.
// Prevents the guard from seeing auth.currentUser as null on first navigation.
const authReady = new Promise((resolve) => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    unsubscribe()
    resolve(user)
  })
})

// Public marketing pages — each exists at one URL per supported locale
// (e.g. /features and /ur/features) so Urdu content is independently
// crawlable/indexable rather than a client-side toggle on the English URL.
const PUBLIC_PAGES = [
  { path: PUBLIC_BASE_PATHS.home, component: LandingPage, seoKey: 'home' },
  {
    path: PUBLIC_BASE_PATHS.features,
    component: FeaturesPage,
    seoKey: 'features'
  },
  {
    path: PUBLIC_BASE_PATHS.groupExpenseTracker,
    component: GroupExpenseTrackerPage,
    seoKey: 'groupExpenseTracker'
  },
  {
    path: PUBLIC_BASE_PATHS.personalBudgetTracker,
    component: PersonalBudgetTrackerPage,
    seoKey: 'personalBudgetTracker'
  },
  { path: PUBLIC_BASE_PATHS.help, component: HelpPage, seoKey: 'help' },
  { path: PUBLIC_BASE_PATHS.faq, component: FaqPage, seoKey: 'faq' }
]

const SEO_PAGES_BY_LOCALE = { en: getSeoPages('en'), ur: getSeoPages('ur') }

const publicRoutes = PUBLIC_PAGES.flatMap(({ path, component, seoKey }) => [
  {
    path,
    component,
    meta: {
      publicPage: true,
      locale: 'en',
      seo: SEO_PAGES_BY_LOCALE.en[seoKey]
    }
  },
  {
    path: path === '/' ? '/ur' : `/ur${path}`,
    component,
    meta: {
      publicPage: true,
      locale: 'ur',
      seo: SEO_PAGES_BY_LOCALE.ur[seoKey]
    }
  }
])

// Every crawlable URL (both locales) — the single source of truth for which
// paths `vite-ssg` should prerender to static HTML. See ssgOptions.includedRoutes
// in vite.config.js.
export const PUBLIC_LOCALE_PATHS = publicRoutes.map((route) => route.path)

// Auth routes — Login.vue handles both modes; mode is derived from route
// path. Not `publicPage` (not indexed, no hreflang/footer), but still
// locale-aware so a user coming from an Urdu marketing page can register
// in Urdu too — see `locale` meta.
const GUEST_PAGES = [
  { path: '/login', seoKey: 'login' },
  { path: '/register', seoKey: 'register' }
]

const guestRoutes = GUEST_PAGES.flatMap(({ path, seoKey }) => [
  {
    path,
    component: Login,
    meta: {
      requiresGuest: true,
      locale: 'en',
      seo: SEO_PAGES_BY_LOCALE.en[seoKey]
    }
  },
  {
    path: `/ur${path}`,
    component: Login,
    meta: {
      requiresGuest: true,
      locale: 'ur',
      seo: SEO_PAGES_BY_LOCALE.ur[seoKey]
    }
  }
])

export const routes = [
  ...publicRoutes,
  ...guestRoutes,
  // App routes
  {
    path: '/groups',
    component: Groups,
    meta: {
      tab: Tabs.GROUPS,
      requiresAuth: true,
      requiresUserTab: Tabs.GROUPS,
      seo: SEO_PAGES.app
    }
  },
  {
    // groupId is part of the path so it survives page refresh and is shareable
    path: '/shared-expenses/:groupId',
    component: SharedExpenses,
    meta: {
      tab: Tabs.SHARED_EXPENSES,
      requiresAuth: true,
      requiresUserTab: Tabs.SHARED_EXPENSES,
      seo: SEO_PAGES.app
    }
  },
  {
    path: '/shared-loans/:groupId',
    component: SharedLoansGuard,
    meta: {
      tab: Tabs.SHARED_LOANS,
      requiresAuth: true,
      requiresUserTab: Tabs.SHARED_LOANS,
      seo: SEO_PAGES.app
    }
  },
  {
    path: '/users',
    component: Users,
    meta: {
      tab: Tabs.USERS,
      requiresAuth: true,
      requiresUserTab: Tabs.USERS,
      seo: SEO_PAGES.app
    }
  },
  {
    path: '/personal-expenses',
    component: PersonalExpenses,
    meta: {
      tab: Tabs.PERSONAL_EXPENSES,
      requiresAuth: true,
      requiresUserTab: Tabs.PERSONAL_EXPENSES,
      seo: SEO_PAGES.app
    }
  },
  {
    path: '/personal-loans',
    component: PersonalLoans,
    meta: {
      tab: Tabs.PERSONAL_LOANS,
      requiresAuth: true,
      requiresUserTab: Tabs.PERSONAL_LOANS,
      seo: SEO_PAGES.app
    }
  },
  {
    path: '/bug-reports',
    component: BugReportsAdmin,
    meta: {
      tab: Tabs.BUG_RESOLVER,
      requiresAuth: true,
      requiresBugResolver: true,
      seo: SEO_PAGES.app
    }
  },
  {
    path: '/shared-groups',
    component: SharedGroups,
    meta: {
      requiresAuth: true,
      requiresUserTab: Tabs.GROUPS,
      seo: SEO_PAGES.app
    }
  },
  {
    path: '/admin',
    component: AdminConfig,
    meta: { requiresAuth: true, requiresAdmin: true, seo: SEO_PAGES.app }
  },
  // Catch-all → redirect based on session
  {
    path: '/:pathMatch(.*)*',
    redirect: () => (hasSession() ? '/groups' : '/')
  }
]

// Restore scroll position when navigating back/forward; scroll to top on new
// navigation. Passed straight through to `ViteSSG`'s `createRouter` call —
// see src/main.js.
export function scrollBehavior(to, from, savedPosition) {
  if (savedPosition) return savedPosition
  return { top: 0, behavior: 'smooth' }
}

async function getCurrentUserProfile() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const cachedUser = authStore.getActiveUserUid
    ? userStore.getUserByUid(authStore.getActiveUserUid)
    : null

  if (cachedUser) return cachedUser

  const firebaseUser = auth.currentUser ?? (await authReady)
  const user = await resolveUserFromAuth(firebaseUser)
  if (!user) return null

  authStore.setActiveUserUid(user.uid)
  userStore.addUser({
    uid: user.uid,
    mobile: user.mobile || '',
    name: user.name || '',
    email: user.email || '',
    emailVerified: user.emailVerified !== false,
    maskedMobile: maskMobile(user.mobile || ''),
    blocked: user.blocked === true
  })
  // resolveUserFromAuth already merged these in from user-admin-flags/{uid} —
  // seed the store slice here too so getCurrentUserAdminFlags() below (and any
  // other reader) doesn't have to fetch them a second time.
  userStore.setActiveUserAdminFlags({
    isAdmin: user.isAdmin === true,
    billedUser: user.billedUser === true,
    bugResolver: user.bugResolver === true
  })

  return userStore.getUserByUid(user.uid) || user
}

async function getCurrentUserTabConfig(uid) {
  const userStore = useUserStore()
  if (userStore.isActiveUserTabConfigLoaded) {
    return userStore.getActiveUserTabConfig
  }

  const config = await findUserTabConfigByUid(uid)
  userStore.setActiveUserTabAccess({
    config,
    accessManageTabs: canAccessManageTabs(config)
  })
  return config
}

async function getCurrentUserAdminFlags(uid) {
  const userStore = useUserStore()
  if (userStore.isActiveUserAdminFlagsLoaded) {
    return userStore.getActiveUserAdminFlags
  }

  const flags = await findUserAdminFlagsByUid(uid)
  userStore.setActiveUserAdminFlags(flags)
  return flags
}

function getFallbackPath(userTabConfig, groupId = null) {
  const tab = getDefaultAccessibleTab(userTabConfig, {
    hasActiveGroup: !!groupId
  })

  return GROUP_TABS.has(tab) && groupId
    ? `${TAB_ROUTES[tab]}/${groupId}`
    : TAB_ROUTES[tab]
}

// Registers the auth/tab-access navigation guard on a router instance.
// Called from src/main.js once `ViteSSG` has created the router — kept as a
// function (rather than this module creating and exporting its own router)
// so `ViteSSG` can own router creation and pick the right history mode
// (memory on the server during prerender, web on the client).
export function setupRouterGuard(router) {
  router.beforeEach(async (to) => {
    // Persist the locale carried by an explicit /ur URL before any redirect
    // below can strip it away. App routes (dashboard, tabs) have no
    // `meta.locale` of their own and fall back to this saved preference
    // (see src/i18n/index.js) — without saving it here first, a returning
    // user hitting `/ur` gets silently bounced back to English mid-navigation.
    if (to.meta.locale) {
      setStoredLocale(to.meta.locale)
    }

    const session = hasSession()

    if ((to.path === '/' || to.path === '/ur') && session) {
      const user = await getCurrentUserProfile()
      const tabConfig = await getCurrentUserTabConfig(user?.uid)
      return getFallbackPath(tabConfig, useGroupStore().getActiveGroup)
    }

    if (to.meta.requiresGuest && session) {
      const user = await getCurrentUserProfile()
      const tabConfig = await getCurrentUserTabConfig(user?.uid)
      return getFallbackPath(tabConfig, useGroupStore().getActiveGroup)
    }

    if (to.meta.requiresAuth && !session) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    const groupStore = useGroupStore()

    // Group-gated routes — set active group from URL param.
    // Non-member access is handled inside the route component (GroupAccessGuard).
    if (to.params.groupId) {
      groupStore.setActiveGroup(to.params.groupId)
    }

    if (
      to.meta.requiresBugResolver ||
      to.meta.requiresUserTab ||
      to.meta.requiresAdmin
    ) {
      const user = await getCurrentUserProfile()
      const tabConfig = await getCurrentUserTabConfig(user?.uid)
      const fallbackPath = getFallbackPath(
        tabConfig,
        to.params.groupId || groupStore.getActiveGroup
      )

      if (to.meta.requiresUserTab) {
        const allowed = canAccessTab(to.meta.requiresUserTab, tabConfig, {
          hasActiveGroup: GROUP_TABS.has(to.meta.requiresUserTab)
            ? !!to.params.groupId
            : true
        })
        if (!allowed) return fallbackPath
      }

      if (to.meta.requiresBugResolver || to.meta.requiresAdmin) {
        // isAdmin/bugResolver live in user-admin-flags/{uid}, not on the
        // users/{uid} doc returned by getCurrentUserProfile().
        const adminFlags = await getCurrentUserAdminFlags(user?.uid)

        if (to.meta.requiresBugResolver && !adminFlags?.bugResolver) {
          return fallbackPath
        }

        if (to.meta.requiresAdmin && !adminFlags?.isAdmin) {
          return fallbackPath
        }
      }
    }
  })
}
