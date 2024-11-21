// stores/useTabStore.js
import { defineStore } from "pinia";
import getCurrentMonth from "../utils/getCurrentMonth";

export const store = defineStore("tab", {
	state: () => ({
		activeTab: "Expenses", // Default active tab
		activeUser: null,
		expenseRef: null,
		loansRef: null,
		salaryRef: null,
		selectedMonth: getCurrentMonth()
	}),
	actions: {
		setActiveTab(tab) {
			this.activeTab = tab;
		},
		setActiveUser(user) {
			this.activeUser = user;
		},
		setExpenseRef(state) {
			this.expenseRef = state;
		},
		setLoansRef(state) {
			this.loansRef = state;
		},
		setSalaryRef(state) {
			this.salaryRef = state;
		},
		setCurrentMonth(month) {
			this.selectedMonth = month;
		}
	}
});
