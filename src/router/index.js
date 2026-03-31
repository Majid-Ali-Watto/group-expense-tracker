import { createRouter, createWebHistory } from 'vue-router'
import { useGroupStore } from '../stores/groupStore'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import { Tabs } from '../assets/enums'

// Standard dynamic imports — do NOT use loadAsyncComponent here.
// loadAsyncComponent sets suspensible:false which conflicts with Vue Router's
// internal async component handling and causes an infinite navigation loop.
const Groups = () => import('@/components/groups/Groups.vue')
const Login = () => import('@/components/auth/Login.vue')
const PaymentForm = () => import('@/components/shared-expenses/PaymentForm.vue')
const SharedLoansGuard = () =>
  import('@/components/shared-loans/SharedLoansGuard.vue')
const Users = () => import('@/components/users/Users.vue')
const SalaryManager = () =>
  import('@/components/monthly-sallary-expense-manager/Manager.vue')
const PersonalLoans = () =>
  import('@/components/personal-loans/PersonalLoans.vue')
const BugReportsAdmin = () =>
  import('@/components/bug-reports-admin/BugReportsAdmin.vue')
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

const routes = [
  // '/' and unknown paths → redirect based on session
  { path: '/', redirect: () => (hasSession() ? '/groups' : '/login') },
  // Auth routes — Login.vue handles both modes; mode is derived from route path
  { path: '/login', component: Login, meta: { requiresGuest: true } },
  { path: '/register', component: Login, meta: { requiresGuest: true } },
  // App routes
  {
    path: '/groups',
    component: Groups,
    meta: { tab: Tabs.GROUPS, requiresAuth: true }
  },
  {
    // groupId is part of the path so it survives page refresh and is shareable
    path: '/shared-expenses/:groupId',
    component: PaymentForm,
    meta: { tab: Tabs.SHARED_EXPENSES, requiresAuth: true }
  },
  {
    path: '/shared-loans/:groupId',
    component: SharedLoansGuard,
    meta: { tab: Tabs.SHARED_LOANS, requiresAuth: true }
  },
  {
    path: '/users',
    component: Users,
    meta: { tab: Tabs.USERS, requiresAuth: true }
  },
  {
    path: '/personal-expenses',
    component: SalaryManager,
    meta: { tab: Tabs.PERSONAL_EXPENSES, requiresAuth: true }
  },
  {
    path: '/personal-loans',
    component: PersonalLoans,
    meta: { tab: Tabs.PERSONAL_LOANS, requiresAuth: true }
  },
  {
    path: '/bug-reports',
    component: BugReportsAdmin,
    meta: {
      tab: Tabs.BUG_RESOLVER,
      requiresAuth: true,
      requiresBugResolver: true
    }
  },
  {
    path: '/shared-groups',
    component: SharedGroups,
    meta: { requiresAuth: true }
  },
  // Catch-all → redirect based on session
  {
    path: '/:pathMatch(.*)*',
    redirect: () => (hasSession() ? '/groups' : '/login')
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

router.beforeEach((to) => {
  const session = hasSession()

  // Logged-in users hitting /login or /register → go to app
  if (to.meta.requiresGuest && session) return '/groups'

  // Unauthenticated users hitting any app route → redirect to login,
  // preserving the intended destination so it can be restored after login
  if (to.meta.requiresAuth && !session) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Group-gated routes — set active group from URL param.
  // Non-member access is handled inside the route component (GroupAccessGuard).
  if (to.params.groupId) {
    const groupStore = useGroupStore()
    groupStore.setActiveGroup(to.params.groupId)
  }

  // Admin-only routes
  if (to.meta.requiresBugResolver) {
    const authStore = useAuthStore()
    const userStore = useUserStore()
    const user = userStore.getUserByMobile(authStore.getActiveUser)
    if (!user?.bugResolver) return '/groups'
  }
})

export default router
