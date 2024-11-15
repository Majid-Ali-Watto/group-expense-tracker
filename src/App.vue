<template>
	<Header @click-log="isLoggedIn" :loggedIn="loggedIn" />

	<div class="container mx-auto mt-16 p-4" v-if="!loggedIn">
		<Login :isLoggedIn="isLoggedIn" />
	</div>

	<div v-if="loggedIn" class="container mx-auto mt-16 sm:mt-20 md:20 lg:mt-20">
		<!-- Tabs -->
		<el-tabs v-model="activeTab" @tab-change="handleActiveTab" type="border-card">
			<el-tab-pane v-for="(tab, index) in tabs" :key="index" :label="tab" :name="tab">
				<!-- Dynamic Component with Keep-Alive -->
				<keep-alive>
					<component :is="activeTabComponent" />
				</keep-alive>
			</el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup>
import { store } from "./stores/store"; // Pinia store
import { defineAsyncComponent, ref, computed } from "vue";
import { tabs } from "./assets/data";

// Lazy-loaded components
const Login = defineAsyncComponent(() => import("./components/Login.vue"));
const PaymentForm = defineAsyncComponent(() => import("./components/PaymentForm.vue"));
const Loans = defineAsyncComponent(() => import("./components/Loans.vue"));
const SallaryManager = defineAsyncComponent(() => import("./components/monthly-sallary-expense-manager/Manager.vue"));
const Header = defineAsyncComponent(() => import("./components/Header.vue"));

const loggedIn = ref(false); // Default state
const tabStore = store(); // Pinia store

// Current active tab from store
const activeTab = ref(tabStore.$state.activeTab);

// Function to handle login state
function isLoggedIn(logged) {
	loggedIn.value = logged;
}

// Function to handle tab changes
function handleActiveTab(tab) {
	activeTab.value = tab;
	tabStore.setActiveTab(tab); // Update tab in store
}

// Map activeTab to dynamic components
const activeTabComponent = computed(() => {
	switch (activeTab.value) {
		case "Expenses":
			return PaymentForm;
		case "Loans":
			return Loans;
		case "Salary Manager":
			return SallaryManager;
		default:
			return null;
	}
});
</script>
