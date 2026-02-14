import { defineAsyncComponent } from "vue";
import { Tabs } from "../assets/enums";
const PersonalLoans = defineAsyncComponent(
  () => import("@/components/personal-loans/PersonalLoans.vue"),
);

const PaymentForm = defineAsyncComponent(
  () => import("@/components/PaymentForm.vue"),
);
const LoanForm = defineAsyncComponent(() => import("@/components/Loans.vue"));
const ExpenseForm = defineAsyncComponent(
  () => import("@/components/monthly-sallary-expense-manager/Manager.vue"),
);
const History = defineAsyncComponent(() => import("@/components/History.vue"));
const Users = defineAsyncComponent(() => import("@/components/Users.vue"));
const Groups = defineAsyncComponent(() => import("@/components/Groups.vue"));
export function getActiveTab(activeTab) {
  console.log("Active Tab:", activeTab);
  switch (activeTab) {
    case Tabs.SHARED_EXPENSES:
      return PaymentForm;
    case Tabs.SHARED_LOANS:
      return LoanForm;
    case Tabs.SALARY_MANAGER:
      return ExpenseForm;
    case Tabs.PERSONAL_LOANS:
      return PersonalLoans;
    case Tabs.HISTORY:
      return History;
    case Tabs.USERS:
      return Users;
    case Tabs.GROUPS:
      return Groups;
    default:
      return null;
  }
}
