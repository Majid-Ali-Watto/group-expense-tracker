<template>
	<fieldset class="border border-gray-300 rounded-lg p-4">
		<legend>Transaction Details</legend>
		<el-form :model="formData" :rules="rules" ref="transactionForm" label-position="top" class="space-y-4">
			<el-row :gutter="20">
				<el-col :lg="12" :md="12" :sm="24">
					<AmountInput v-model="formData.amount" required />
					<GenericDropDown label="Payer" prop="payer" v-model="formData.payer" placeholder="Select payer" :options="friends" required />
					<DataTimePicker v-model="formData.date" required />
				</el-col>
				<el-col :lg="12" :md="12" :sm="24">
					<GenericInput rows="8" v-model="formData.description" label="Description" prop="description" required type="textarea" placeholder="Enter description" />
				</el-col>
			</el-row>
			<div class="flex justify-end">
				<GenericButton v-if="isVisible" type="success" @click="() => validateForm()">Add Payment</GenericButton>
			</div>
		</el-form>
	</fieldset>

	<HOC :componentToBeRendered="ExpenseList" v-if="isVisible" />
</template>

<script setup>
	import HOC from "./HOC.vue";
	import { ref, watch, defineAsyncComponent, computed } from "vue";
	import getWhoAddedTransaction from "../utils/whoAdded";
	import { DataTimePicker, AmountInput, GenericButton, GenericDropDown, GenericInput } from "./generic-components";
	const ExpenseList = defineAsyncComponent(() => import("./ExpenseList.vue"));
	const emit = defineEmits(["closeModal"]);
	import { friends } from "../assets/data";
	import { rules } from "../assets/validation-rules";
	import useFireBase from "../api/firebase-apis";

	const { deleteData, updateData, saveData } = useFireBase();
	const props = defineProps({
		row: Object
	});
	const isVisible = ref(true);
	// Form data model
	const formData = ref({
		amount: null,
		description: "",
		payer: "",
		date: ""
	});
	// Watch for changes in `row` prop and update formData
	watch(
		() => props.row,
		(newRow) => {
			console.log(newRow?.date);
			formData.value.amount = newRow?.amount ?? null;
			formData.value.description = newRow?.description ?? "";
			formData.value.payer = newRow?.payer ?? "";
			formData.value.date = newRow?.date ?? "";
			isVisible.value = !newRow?.amount;
		},
		{ immediate: true, deep: true }
	);

	computed(() => {
		console.log(formData.value);
	});
	// Form submission handler
	const transactionForm = ref(null);

	const validateForm = (whatTask = "Save") => {
		transactionForm.value.validate((valid) => {
			if (valid) {
				let monthYear = formData.value.date.split("-");
				monthYear = monthYear[0] + "-" + monthYear[1].toString().padStart(2, 0);
				if (whatTask == "Save") {
					saveData("payments/"+monthYear, getPaymentData, transactionForm, "Transaction successfully saved.");
				} else if (whatTask == "Update") {
					updateData(`payments/${monthYear}/${props.row.id}`, getPaymentData, transactionForm, `Payment record with ID ${props.row.id} updated successfully`);
					emit("closeModal");
				} else if (whatTask == "Delete") {
					deleteData(`payments/${monthYear}/${props.row.id}`, `Payment record with ID ${props.row.id} deleted successfully`);
					emit("closeModal");
				}
			}
		});
	};

	function getPaymentData() {
		const payment = {
			amount: parseFloat(formData.value.amount),
			description: formData.value.description,
			payer: formData.value.payer,
			date: new Date(formData.value.date).toLocaleString("en-PK"),
			whenAdded: new Date().toLocaleString("en-PK"),
			whoAdded: getWhoAddedTransaction()
		};
		return payment;
	}

	defineExpose({
		validateForm
	});
</script>
