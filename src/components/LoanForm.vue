<template>
	<fieldset class="border border-gray-300 rounded-lg p-4">
		<legend>Loan Details</legend>

		<el-form :model="formData" :rules="rules" ref="loanForm" label-position="top" class="space-y-4">
			<el-row :gutter="20">
				<el-col :lg="12" :md="12" :sm="24">
					<AmountInput v-model="formData.amount" required />
					<GenericDropDown v-model="formData.loanGiver" label="Loan Giver" prop="loanGiver" :options="friends" placeholder="Select loan giver" required />
					<GenericDropDown v-model="formData.loanReceiver" label="Loan Receiver" prop="loanReceiver" :options="friends" placeholder="Select loan receiver" required />
				</el-col>
				<el-col :lg="12" :md="12" :sm="24">
					<GenericInput rows="8" v-model="formData.description" label="Description" prop="description" required type="textarea" placeholder="Loan details" />
				</el-col>
			</el-row>
			<div class="flex justify-end">
				<GenericButton v-if="isVisible" type="success" @click="() => validateForm()">Add Loan</GenericButton>
			</div>
		</el-form>
	</fieldset>
</template>

<script setup>
	import { ref, watch } from "vue";
	import getWhoAddedTransaction from "../utils/whoAdded";
	import { rules } from "../assets/validation-rules";
	import useFireBase from "../api/firebase-apis";
	import { AmountInput, GenericButton, GenericDropDown, GenericInput } from "./generic-components";
	const emit = defineEmits(["closeModal"]);

	const { deleteData, updateData, saveData } = useFireBase();
	const props = defineProps({
		friends: Array,
		row: Object
	});

	const loanForm = ref(null);
	const isVisible = ref(true);

	// Form data model
	const formData = ref({
		amount: null,
		loanGiver: "",
		loanReceiver: "",
		description: ""
	});
	// Watch for changes in `row` prop and update formData
	watch(
		() => props.row,
		(newRow) => {
			formData.value.amount = newRow?.amount ?? null;
			formData.value.loanGiver = newRow?.giver ?? "";
			formData.value.loanReceiver = newRow?.receiver ?? "";
			formData.value.description = newRow?.description ?? "";
			isVisible.value = !newRow?.amount;
		},
		{ immediate: true, deep: true }
	);

	// Handle form submission with validation
	const validateForm = (whatTask = "Save") => {
		loanForm.value.validate((valid) => {
			if (valid) {
				if (whatTask == "Save") {
					saveData("loans", getLoanData, loanForm, "Loan added successfully.");
				} else if (whatTask == "Update") {
					updateData(`loans/${props.row.id}`, getLoanData, loanForm, `Loan record with ID ${props.row.id} updated successfully`);
					emit("closeModal");
				} else if (whatTask == "Delete") {
					deleteData(`loans/${props.row.id}`, `Loan record with ID ${props.row.id} deleted successfully`);
					emit("closeModal");
				}
			}
		});
	};

	function getLoanData() {
		const loan = {
			amount: formData.value.amount,
			description: formData.value.description,
			giver: formData.value.loanGiver,
			receiver: formData.value.loanReceiver,
			date: new Date().toLocaleDateString("en-PK") + " " + new Date().toLocaleTimeString(),
			whoAdded: getWhoAddedTransaction(),
			whenAdded: new Date().toLocaleString("en-PK"),
		};
		return loan;
	}

	defineExpose({
		validateForm
	});
</script>
