import { Tabs } from '../assets/enums'
import { loadAsyncComponent } from './async-component'
const PersonalLoans = loadAsyncComponent(
  () => import('@/components/personal-loans/PersonalLoans.vue')
)

const SharedExpenses = loadAsyncComponent(
  () => import('@/components/shared-expenses/SharedExpenses.vue')
)
const LoanForm = loadAsyncComponent(
  () => import('@/components/shared-loans/LoanForm.vue')
)
const SharedLoansGuard = loadAsyncComponent(
  () => import('@/components/shared-loans/SharedLoansGuard.vue')
)
const PersonalExpenses = loadAsyncComponent(
  () => import('@/components/personal-expenses/PersonalExpenses.vue')
)
const PersonalExpenseForm = loadAsyncComponent(
  () => import('@/components/personal-expenses/PersonalExpenseForm.vue')
)
const History = loadAsyncComponent(
  () => import('@/components/history/History.vue')
)
const Users = loadAsyncComponent(() => import('@/components/users/Users.vue'))
const Groups = loadAsyncComponent(
  () => import('@/components/groups/Groups.vue')
)
const BugReportsAdmin = loadAsyncComponent(
  () => import('@/components/bug-reports-admin/BugReportsAdmin.vue')
)

// Used for main tab content rendering
export function getActiveTab(activeTab) {
  switch (activeTab) {
    case Tabs.SHARED_EXPENSES:
      return SharedExpenses
    case Tabs.SHARED_LOANS:
      return SharedLoansGuard
    case Tabs.PERSONAL_EXPENSES:
      return PersonalExpenses
    case Tabs.PERSONAL_LOANS:
      return PersonalLoans
    case Tabs.HISTORY:
      return History
    case Tabs.USERS:
      return Users
    case Tabs.GROUPS:
      return Groups
    case Tabs.BUG_RESOLVER:
      return BugReportsAdmin
    default:
      return null
  }
}

// Used for the Table dialog edit form
export function getEditComponent(activeTab) {
  switch (activeTab) {
    case Tabs.SHARED_EXPENSES:
      return SharedExpenses
    case Tabs.SHARED_LOANS:
    case Tabs.PERSONAL_LOANS:
      return LoanForm
    case Tabs.PERSONAL_EXPENSES:
      return PersonalExpenseForm
    default:
      return null
  }
}
