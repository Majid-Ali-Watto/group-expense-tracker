<template>
	<Suspense>
		<template #default>
			<div>
				<Header @click-log="isLoggedIn" :loggedIn="loggedIn" />
				<div class="container my-auto mx-auto mt-16 p-4" v-if="!loggedIn">
					<Login :isLoggedIn="isLoggedIn" />
				</div>
				<div v-if="loggedIn" class="container mx-auto mt-14 sm:mt-16 md:16 lg:mt-16">
					<!-- Tabs -->
					<el-tabs v-model="activeTab" @tab-change="handleActiveTab" type="border-card">
						<el-tab-pane v-for="(tab, index) in tabs" :key="index" :label="tab" :name="tab">
							<keep-alive>
								<HOC :componentToBeRendered="activeTabComponent(tab)" />
							</keep-alive>
						</el-tab-pane>
					</el-tabs>
				</div>
			</div>
		</template>
		<template #fallback>
			<div class="loading-wrapper" v-loading="true" element-loading-text-color="red" element-loading-text="Loading..." :element-loading-spinner="svg" element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(0, 0, 0, 0)" style="width: 100%"></div>
		</template>
	</Suspense>
</template>

<script setup>
	import HOC from "./components/HOC.vue";
	import { defineAsyncComponent, ref } from "vue";
	import { store } from "./stores/store"; // Pinia store
	import { tabs } from "./assets/data";
	import { svg } from "./assets/loader-svg";
	// Lazy-loaded components
	const Login = defineAsyncComponent(() => import("@/components/Login.vue"));
	const PaymentForm = defineAsyncComponent(() => import("@/components/PaymentForm.vue"));
	const Loans = defineAsyncComponent(() => import("@/components/Loans.vue"));
	const SallaryManager = defineAsyncComponent(() => import("@/components/monthly-sallary-expense-manager/Manager.vue"));
	const Header = defineAsyncComponent(() => import("@/components/Header.vue"));

	// State
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
	const activeTabComponent = (activeTab) => {
		switch (activeTab) {
			case "Expenses":
				return PaymentForm;
			case "Loans":
				return Loans;
			case "Salary Manager":
				return SallaryManager;
			default:
				return null;
		}
	};
</script>

<style>
	.loading-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		width: 100%;
		background: rgba(30, 32, 28, 0.8); /* Optional for background overlay */
	}
	.el-loading-text {
		color: white !important;
	}
</style>
