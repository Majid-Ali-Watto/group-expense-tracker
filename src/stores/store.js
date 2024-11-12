// stores/useTabStore.js
import { defineStore } from "pinia";

export const store = defineStore("tab", {
	state: () => ({
		activeTab: "Expenses", // Default active tab
		activeUser: null
	}),
	actions: {
		setActiveTab(tab) {
			this.activeTab = tab;
		},
		setActiveUser(user) {
			this.activeUser = user;
		}
	}
});
