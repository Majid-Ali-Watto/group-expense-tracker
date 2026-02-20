import { defineAsyncComponent } from 'vue'
import { Tabs } from '../assets/enums'
const PersonalLoans = defineAsyncComponent(
  () => import('@/components/personal-loans/PersonalLoans.vue')
)
const PaymentForm = defineAsyncComponent(
  () => import('@/components/PaymentForm.vue')
)
const LoanForm = defineAsyncComponent(() => import('@/components/LoanForm.vue'))
const SharedLoansGuard = defineAsyncComponent(
  () => import('@/components/SharedLoansGuard.vue')
)
const SalaryManager = defineAsyncComponent(
  () => import('@/components/monthly-sallary-expense-manager/Manager.vue')
)
const SalaryExpenseForm = defineAsyncComponent(
  () => import('@/components/monthly-sallary-expense-manager/ExpenseForm.vue')
)
const History = defineAsyncComponent(() => import('@/components/History.vue'))
const Users = defineAsyncComponent(() => import('@/components/Users.vue'))
const Groups = defineAsyncComponent(() => import('@/components/Groups.vue'))

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
