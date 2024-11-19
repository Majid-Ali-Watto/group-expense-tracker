<template>
	<div class="my-4" ref="pdfContent">
		<Summary :payments="filteredPayments" :friends="friends" />
		<Settlement :payments="filteredPayments" :friends="friends" />
		<el-divider />
		<h2>Expense List</h2>

		<!-- Filters -->
		<div class="flex space-x-4 mb-4">
			<!-- Month Selection -->
			<el-form-item label="Month" class="w-full md:w-1/2">
				<el-select v-model="selectedMonth" placeholder="Select Month" class="w-full">
					<!-- <el-option value="All" label="All" /> -->
					<el-option v-for="month in months" :key="month" :value="month" :label="month" />
				</el-select>
			</el-form-item>

			<!-- Friend Selection -->
			<el-form-item label="Payer" class="w-full md:w-1/2">
				<el-select v-model="selectedFriend" placeholder="Select Payer" class="w-full">
					<el-option value="All" label="All" />
					<el-option v-for="friend in friends" :key="friend" :value="friend" :label="friend" />
				</el-select>
			</el-form-item>
		</div>

		<!-- Table -->
		<Table :rows="filteredPayments" downloadTitle="Expenses" :keys="paymentKeys" :dataRef="pdfContent" />
	</div>
</template>

<script setup>
	import { computed, onMounted, ref, watch } from "vue";
	import { friends } from "../assets/data";
	import { onValue } from "../firebase";
	import Settlement from "./Settlement.vue";
	import Summary from "./Summary.vue";
	import Table from "./Table.vue";
	import useFireBase from "../api/firebase-apis";
	import { checkDaily } from "../utils/notifications";
	import getCurrentMonth from "../utils/getCurrentMonth";
	import { showError } from "../utils/showAlerts";
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
	onMounted(() => {
		checkDaily(pdfContent);
	});

	onMounted(async () => {
		await fetchMonths();
		await fetchExpenses();
	});
	watch(selectedMonth, async () => {
		selectedFriend.value = "All";
		await fetchMonths();
		await fetchExpenses();
	});
	const fetchMonths = async () => {
		try {
			const monthsRef = dbRef(`payments`);
			onValue(monthsRef, (snapshot) => {
				const data = snapshot.val() || {};
				months.value = data ? Object.keys(data) : [];
			});
		} catch (error) {
			showError("Failed to load months. Please try again.");
		}
	};
	const fetchExpenses = async () => {
		const paymentsRef = dbRef(`payments/${selectedMonth.value}`);
		onValue(paymentsRef, (snapshot) => {
			const data = snapshot.val() || {};
			paymentKeys.value = Object.keys(data);
			payments.value = Object.values(data);
		});
	};

	const filteredPayments = computed(() => {
		return payments.value.filter((payment) => {
			const friendMatches = selectedFriend.value ? payment.payer === selectedFriend.value || selectedFriend.value === "All" : true;
			return friendMatches;
		});
	});
</script>
