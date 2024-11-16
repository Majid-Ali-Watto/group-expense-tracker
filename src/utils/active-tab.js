import { defineAsyncComponent } from "vue";
const PaymentForm = defineAsyncComponent(() => import("@/components/PaymentForm.vue"));
const LoanForm = defineAsyncComponent(() => import("@/components/LoanForm.vue"));
const ExpenseForm = defineAsyncComponent(() => import("@/components/monthly-sallary-expense-manager/ExpenseForm.vue"));
export function getActiveTab(activeTab) {
	switch (activeTab) {
		case "Expenses":
			return PaymentForm;
		case "Loans":
			return LoanForm;
		case "Salary Manager":
			return ExpenseForm;
		default:
			return null;
	}
}
