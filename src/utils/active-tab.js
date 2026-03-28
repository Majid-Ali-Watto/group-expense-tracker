import { Tabs } from '../assets/enums'
import { loadAsyncComponent } from './async-component'
const PersonalLoans = loadAsyncComponent(
  () => import('@/components/personal-loans/PersonalLoans.vue')
)

const PaymentForm = loadAsyncComponent(
  () => import('@/components/shared-expenses/PaymentForm.vue')
)
const LoanForm = loadAsyncComponent(
  () => import('@/components/shared-loans/LoanForm.vue')
)
const SharedLoansGuard = loadAsyncComponent(
  () => import('@/components/shared-loans/SharedLoansGuard.vue')
)
const SalaryManager = loadAsyncComponent(
  () => import('@/components/monthly-sallary-expense-manager/Manager.vue')
)
const SalaryExpenseForm = loadAsyncComponent(
  () => import('@/components/monthly-sallary-expense-manager/ExpenseForm.vue')
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
      return PaymentForm
    case Tabs.SHARED_LOANS:
      return SharedLoansGuard
    case Tabs.PERSONAL_EXPENSES:
      return SalaryManager
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
      return PaymentForm
    case Tabs.SHARED_LOANS:
    case Tabs.PERSONAL_LOANS:
      return LoanForm
    case Tabs.PERSONAL_EXPENSES:
      return SalaryExpenseForm
    default:
      return null
  }
}
