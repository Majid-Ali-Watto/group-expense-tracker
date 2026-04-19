import { createRouter, createWebHistory } from 'vue-router'
import { useGroupStore } from '../stores/groupStore'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { Tabs } from '../assets/enums'
import { SEO_PAGES } from '@/constants'
import {
  resolveUserFromAuth,
  canAccessTab,
  getDefaultAccessibleTab,
  findUserTabConfigByUid,
  canAccessManageTabs
} from '@/helpers'
import { maskMobile } from '@/utils/maskMobile'
import { auth } from '@/firebase'

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
function hasSession() {
  return !!sessionStorage.getItem('_session')
}

// Resolves once Firebase Auth has finished its initial state check.
// Prevents the guard from seeing auth.currentUser as null on first navigation.
const authReady = new Promise((resolve) => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    unsubscribe()
    resolve(user)
  })
})

const routes = [
  // Public marketing pages
  {
    path: '/',
    component: LandingPage,
    meta: { publicPage: true, seo: SEO_PAGES.home }
  },
  {
    path: '/features',
    component: FeaturesPage,
    meta: { publicPage: true, seo: SEO_PAGES.features }
  },
  {
    path: '/group-expense-tracker',
    component: GroupExpenseTrackerPage,
    meta: { publicPage: true, seo: SEO_PAGES.groupExpenseTracker }
  },
  {
    path: '/personal-budget-tracker',
    component: PersonalBudgetTrackerPage,
    meta: { publicPage: true, seo: SEO_PAGES.personalBudgetTracker }
  },
  {
    path: '/help',
    component: HelpPage,
    meta: { publicPage: true, seo: SEO_PAGES.help }
  },
  {
    path: '/faq',
    component: FaqPage,
    meta: { publicPage: true, seo: SEO_PAGES.faq }
  },
  // Auth routes — Login.vue handles both modes; mode is derived from route path
  {
    path: '/login',
    component: Login,
    meta: { requiresGuest: true, seo: SEO_PAGES.login }
  },
  {
    path: '/register',
    component: Login,
    meta: { requiresGuest: true, seo: SEO_PAGES.register }
  },
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

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  // Restore scroll position when navigating back/forward; scroll to top on new navigation
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  }
})

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
    billedUser: user.billedUser === true,
    bugResolver: user.bugResolver === true,
    blocked: user.blocked === true,
    isAdmin: user.isAdmin === true
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

function getFallbackPath(userTabConfig, groupId = null) {
  const tab = getDefaultAccessibleTab(userTabConfig, {
    hasActiveGroup: !!groupId
  })

  return GROUP_TABS.has(tab) && groupId
    ? `${TAB_ROUTES[tab]}/${groupId}`
    : TAB_ROUTES[tab]
}

router.beforeEach(async (to) => {
  const session = hasSession()

  if (to.path === '/' && session) {
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

  if (to.meta.requiresBugResolver || to.meta.requiresUserTab || to.meta.requiresAdmin) {
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

    if (to.meta.requiresBugResolver && !user?.bugResolver) {
      return fallbackPath
    }

    if (to.meta.requiresAdmin && !user?.isAdmin) {
      return fallbackPath
    }
  }
})

export default router
