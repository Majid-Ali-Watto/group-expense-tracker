// stores/useTabStore.js
import { defineStore } from "pinia";

export const store = defineStore("tab", {
	state: () => ({
		activeTab: "Expenses", // Default active tab
		activeUser: null,
		expenseRef: null,
		loansRef: null,
		salaryRef: null,
		formResetRef: null
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
		setFormResetRef(state) {
			console.log("setFormResetRef", state);
			this.formResetRef = state;
		}
	}
});
