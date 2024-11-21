<template>
	<div class="my-4" ref="pdfContent">
		<Summary :payments="filteredPayments" :friends="friends" />
		<Settlement :payments="filteredPayments" :keys="paymentKeys" :selectedMonth="selectedMonth" :friends="friends" />
		<el-divider />
		<div class="flex justify-between">
			<h2>Expense List</h2>
			<el-badge :value="filteredPayments.length" class="item mr-4" type="secondary">{{ selectedFriend }}:<el-text tag="b"> Transactions</el-text> </el-badge>
		</div>

		<!-- Filters -->
		<el-row :gutter="20" class="mb-1" justify="space-between">
			<!-- Month Selection -->
			<el-col :lg="6" :md="6" :sm="12" :xs="12">
				<el-form-item label="Month" class="w-full">
					<el-select v-model="selectedMonth" placeholder="Select Month" class="w-full">
						<!-- <el-option value="All" label="All" /> -->
						<el-option v-for="month in months" :key="month" :value="month" :label="month" />
					</el-select>
				</el-form-item>
			</el-col>
			<el-col :lg="6" :md="6" :sm="12" :xs="12">
				<!-- Friend Selection -->
				<el-form-item label="Payer" class="w-full">
					<el-select v-model="selectedFriend" placeholder="Select Payer" class="w-full">
						<el-option value="All" label="All" />
						<el-option v-for="friend in friends" :key="friend" :value="friend" :label="friend" />
					</el-select>
				</el-form-item>
			</el-col>
		</el-row>
		<!-- Table -->
		<Table :rows="filteredPayments" downloadTitle="Expenses" :keys="paymentKeys" :dataRef="pdfContent" />
	</div>
</template>
<script setup>
	import { computed, onMounted, onUnmounted, ref, watch } from "vue";
	import { onValue, off } from "../firebase";
	import Settlement from "./Settlement.vue";
	import Summary from "./Summary.vue";
	import Table from "./Table.vue";
	import useFireBase from "../api/firebase-apis";
	import { checkDaily } from "../utils/notifications";
	import getCurrentMonth from "../utils/getCurrentMonth";
	import { showError } from "../utils/showAlerts";
	import { friends } from "../assets/data";

	const pdfContent = ref(null);
	const months = ref([]);
	const { dbRef } = useFireBase();

	const props = defineProps({
		payments: Array
	});

	const payments = ref([]);
	const paymentKeys = ref([]);
	const selectedMonth = ref(getCurrentMonth());
	const selectedFriend = ref("All");

	let monthsListener = null;
	let paymentsListener = null;

	onMounted(() => {
		checkDaily(pdfContent);
		fetchMonths();
		fetchExpenses();
	});

	// Clean up listeners on unmount
	onUnmounted(() => {
		if (monthsListener) off(dbRef(`payments`), "value", monthsListener);
		if (paymentsListener) off(dbRef(`payments/${selectedMonth.value}`), "value", paymentsListener);
	});

	// Fetch available months
	const fetchMonths = () => {
		const monthsRef = dbRef(`payments`);
		monthsListener = onValue(
			monthsRef,
			(snapshot) => {
				const data = snapshot.val() || {};
				months.value = Object.keys(data);
				if (months.value.length) selectedMonth.value = getCurrentMonth();
			},
			(error) => {
				showError("Failed to load months. Please try again.");
			}
		);
	};

	// Fetch expenses for the selected month
	const fetchExpenses = () => {
		const paymentsRef = dbRef(`payments/${selectedMonth.value}`);
		if (paymentsListener) off(paymentsRef, "value", paymentsListener); // Remove old listener

		paymentsListener = onValue(
			paymentsRef,
			(snapshot) => {
				const data = snapshot.val() || {};
				paymentKeys.value = Object.keys(data);
				payments.value = Object.values(data);
			},
			(error) => {
				showError("Failed to load expenses. Please try again.");
			}
		);
	};

	// Watch for changes in selectedMonth
	watch(selectedMonth, () => {
		selectedFriend.value = "All";
		fetchExpenses();
	});

	// Filter payments based on selected friend
	const filteredPayments = computed(() => {
		return payments.value.filter((payment) => {
			const friendMatches = payment?.payer && (payment.payer === selectedFriend.value || selectedFriend.value === "All");
			return friendMatches;
		});
	});
</script>
