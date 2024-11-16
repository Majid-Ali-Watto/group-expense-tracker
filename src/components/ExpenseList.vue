<template>
	<div class="my-4" ref="pdfContent">
		<Summary :payments="payments" :friends="friends" />
		<Settlement :payments="payments" :friends="friends" />
		<el-divider />
		<h2>Expense List</h2>

		<!-- Filters -->
		<div class="flex space-x-4 mb-4">
			<!-- Month Selection -->
			<el-form-item label="Month" class="w-full md:w-1/2">
				<el-select v-model="selectedMonth" placeholder="Select Month" class="w-full">
					<el-option value="" label="All Months" />
					<el-option v-for="month in months" :key="month" :value="month" :label="month" />
				</el-select>
			</el-form-item>

			<!-- Friend Selection -->
			<el-form-item label="Friend" class="w-full md:w-1/2">
				<el-select v-model="selectedFriend" placeholder="Select Friend" class="w-full">
					<el-option value="" label="All Friends" />
					<el-option v-for="friend in friends" :key="friend" :value="friend" :label="friend" />
				</el-select>
			</el-form-item>
		</div>

		<!-- Table -->
		<Table :rows="filteredPayments" downloadTitle="Expenses" :keys="paymentKeys" :dataRef="pdfContent" />
	</div>
</template>

<script setup>
	import { computed, onMounted, ref } from "vue";
	import { friends } from "../assets/data";
	import { onValue } from "../firebase";
	import months from "../utils/monthsList";
	import Settlement from "./Settlement.vue";
	import Summary from "./Summary.vue";
	import Table from "./Table.vue";
	import useFireBase from "../api/firebase-apis";
	const { dbRef } = useFireBase();
	const props = defineProps({
		payments: Array
	});

	const payments = ref([]);
	const paymentKeys = ref([]);
	const selectedMonth = ref("");
	const selectedFriend = ref("");
	const pdfContent = ref(null);

	onMounted(() => {
		const paymentsRef = dbRef("payments");
		onValue(paymentsRef, (snapshot) => {
			const data = snapshot.val() || {};
			paymentKeys.value = Object.keys(data);
			payments.value = Object.values(data);
		});
	});

	const filteredPayments = computed(() => {
		return payments.value.filter((payment) => {
			const [day, month, timeYear] = payment.date.split("/");

			const monthMatches = selectedMonth.value
				? new Date([month, day, timeYear].toString()).toLocaleString("en", {
						month: "long"
				  }) === selectedMonth.value
				: true;
			const friendMatches = selectedFriend.value ? payment.payer === selectedFriend.value : true;
			return monthMatches && friendMatches;
		});
	});
</script>
