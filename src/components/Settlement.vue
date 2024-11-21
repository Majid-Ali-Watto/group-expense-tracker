<!-- <template>
	<div class="my-4">
		<fieldset class="border border-gray-300 rounded-lg p-4">
			<legend>Settlement</legend>
			<el-row>
				<el-col v-for="(balance, index) in balances" :key="index" class="space-y-2" :lg="12" :md="12" :sm="24">
					<strong>{{ balance.name }}</strong> will
					<span :class="balance.balance >= 0 ? 'text-green-500' : 'text-red-500'">
						{{ balance.balance >= 0 ? "take + " : "give - " }}
					</span>
					<i> {{ formatAmount(Math.abs(balance.balance)) }}</i>
				</el-col>
			</el-row>
		</fieldset>
	</div>
</template> -->
<template>
	<div class="my-4">
		<!-- <fieldset class="border border-gray-300 rounded-lg p-4">
			<legend>Settlement</legend> -->
		<el-descriptions title="Settlement Balances" column="1" :border="true">
			<el-descriptions-item v-for="(balance, index) in balances" :key="index" :label="balance.name">
				<span :class="balance.balance >= 0 ? 'text-green-500' : 'text-red-500'">
					{{ balance.balance >= 0 ? "Will Take + " : "Will Give - " }}
				</span>
				<i>{{ formatAmount(Math.abs(balance.balance)) }}</i>
			</el-descriptions-item>
		</el-descriptions>
		<!-- </fieldset> -->
		<!-- <br /> -->
		<div v-if="user == 'Majid'" style="display: flex !important; justify-content: end !important">
			<GenericButton @click="addPaymentsBatch" class="mt-4" type="success">Settlement Done</GenericButton>
		</div>
	</div>
</template>

<script setup>
	import { computed, inject, ref } from "vue";
	import { GenericButton } from "./generic-components";
	import { store } from "../stores/store";
	import useFireBase from "../api/firebase-apis";
	import { showError } from "../utils/showAlerts";
	import { ElMessageBox } from "element-plus";
	import { friends } from "../assets/data";
	const { updateData, deleteData } = useFireBase();
	const formatAmount = inject("formatAmount");
	const userStore = store();

	const user = ref(userStore.$state.activeUser);
	const props = defineProps({
		payments: Array,
		keys: Array,
		// friends: Array,
		selectedMonth: String
	});

	const updates = ref({});
	async function addPaymentsBatch() {
		try {
			await ElMessageBox.confirm("Are you sure to move expenses to backup. Continue?", "Warning", {
				confirmButtonText: "OK",
				cancelButtonText: "Cancel",
				type: "warning"
			});
			// Prepare a batch update object
			updates.value = {};
			props.payments.forEach((payment, index) => {
				const key = props.keys[index]; // Generate a unique key
				updates.value[key] = payment;
			});
			console.log(updates.value)
			// Perform batch update
			updateData(`payments-backup/${props.selectedMonth}`, getData, "Expenses added to Backup successfully!");
			deleteData(`payments/${props.selectedMonth}`, props.selectedMonth + " data deleted");
		} catch (error) {
			if (error != "cancel") showError(error);
		}
	}
	const getData = () => {
		return updates.value;
	};

	const totalSpent = computed(() => props.payments.reduce((sum, payment) => sum + payment.amount, 0));
	const averageSpent = computed(() => (friends.length ? totalSpent.value / friends.length : 0));
	const balances = computed(() =>
		friends.map((friend) => ({
			name: friend,
			balance: props.payments.filter((payment) => payment.payer === friend).reduce((sum, payment) => sum + payment.amount, 0) - averageSpent.value
		}))
	);
</script>
