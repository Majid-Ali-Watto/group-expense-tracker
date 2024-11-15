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
		<Table :rows="filteredPayments" :keys="paymentKeys" />

		<!-- Download Buttons -->
		<el-row class="mt-2 flex justify-start">
			<el-col :lg="12" :md="12" :sm="24">
				<el-button type="success" @click="downloadPdfData" class="mt-1 text-white px-4 py-2 rounded"> Download PDF </el-button>
				<el-button type="warning" @click="downloadExcelData" class="mt-1 text-white px py-2 rounded"> Download Excel </el-button>
			</el-col>
		</el-row>
	</div>
</template>

<script setup>
	import { computed, onMounted, ref } from "vue";
	import { friends } from "../assets/data";
	import { database, ref as dbRef, onValue } from "../firebase";
	import { downloadExcel, downloadPDF } from "../utils/downloadDataProcedures";
	import months from "../utils/monthsList";
	import Settlement from "./Settlement.vue";
	import Summary from "./Summary.vue";
	import Table from "./Table.vue";

	const props = defineProps({
		payments: Array
	});

	const payments = ref([]);
	const paymentKeys = ref([]);
	const selectedMonth = ref("");
	const selectedFriend = ref("");
	const pdfContent = ref(null);

	onMounted(() => {
		const paymentsRef = dbRef(database, "payments");
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

	function downloadPdfData() {
		downloadPDF(pdfContent.value, friends?.toString()?.replaceAll(",", "-") + "Expenses_");
	}

	function downloadExcelData() {
		downloadExcel(filteredPayments.value, friends?.toString()?.replaceAll(",", "-") + "Expenses_", "Expenses");
	}
</script>
