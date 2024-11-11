// stores/useTabStore.js
import { defineStore } from "pinia";

export const useTabStore = defineStore("tab", {
	state: () => ({
		activeTab: "Expenses" // Default active tab
	}),
	actions: {
		setActiveTab(tab) {
			this.activeTab = tab;
		}
	}
});
