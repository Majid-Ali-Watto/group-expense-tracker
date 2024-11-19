<template>
	<fieldset class="w-full border border-gray-300 rounded-lg p-4">
		<legend>Expense Details</legend>
		<el-form label-position="top" :model="form" :rules="rules" ref="expenseForm">
			<AmountInput v-model.number="form.amount" required />
			<GenericInput v-model="form.description" label="Description" prop="description" placeholder="Enter description" required />
			<GenericInput v-model="form.location" label="Location" prop="location" placeholder="Enter location" required />
			<GenericInput v-model="form.recipient" label="Recipient" prop="recipient" placeholder="To Whom" required />
			<div class="flex justify-end" v-if="isVisible">
				<GenericButton type="success" @click="() => validateForm()">Add Expense</GenericButton>
			</div>
		</el-form>
	</fieldset>
</template>

<script setup>
	import { ref, watch } from "vue";
	import { store } from "../../stores/store";
	import getCurrentMonth from "../../utils/getCurrentMonth";
	import getWhoAddedTransaction from "../../utils/whoAdded";
	import { rules } from "../../assets/validation-rules";
	import useFireBase from "../../api/firebase-apis";
	import { GenericButton, AmountInput, GenericInput } from "../generic-components";
	const emit = defineEmits(["closeModal"]);

	// Props
	const props = defineProps({
		row: Object
	});
	const { saveData, updateData, deleteData } = useFireBase();
	const isVisible = ref(true);
	// State
	const form = ref({
		amount: null,
		description: "",
		location: "",
		recipient: ""
	});

	const expenseForm = ref(null);
	const userStore = store();
	const activeUser = ref(userStore.activeUser);

	// Watcher for props.row
	watch(
		() => props.row,
		(newRow) => {
			isVisible.value = !newRow?.amount;
			form.value = {
				amount: newRow?.amount ?? null,
				description: newRow?.description ?? "",
				location: newRow?.location ?? "",
				recipient: newRow?.recipient ?? ""
			};
		},
		{ immediate: true, deep: true }
	);

	const validateForm = async (whatTask = "Save",childRef) => {
		console.log(childRef.value)
		userStore.setFormResetRef(childRef.value)
		expenseForm.value.validate(async (valid) => {

			if (valid) {
				if (whatTask == "Save") {
					saveData(`expenses/${activeUser.value}/${getCurrentMonth()}`, getExpenseData, expenseForm, "Expense added successfully!");
				} else if (whatTask == "Update") {
					updateData(`expenses/${activeUser.value}/${getCurrentMonth()}/${props.row.id}`, getExpenseData, expenseForm, `Expense record with ID ${props.row.id} updated successfully`);
					emit("closeModal");
				} else if (whatTask == "Delete") {
					deleteData(`expenses/${activeUser.value}/${getCurrentMonth()}/${props.row.id}`, `Expense record with ID ${props.row.id} deleted successfully`);
					emit("closeModal");
				}
			}
		});
	};
	function getExpenseData() {
		return {
			amount: form.value?.amount,
			description: form.value?.description,
			location: form.value?.location,
			recipient: form.value?.recipient,
			month: getCurrentMonth(),
			whoAdded: getWhoAddedTransaction(),
			date:new Date().toLocaleString('en-PK'),
			whenAdded: new Date().toLocaleString("en-PK"),
		};
	}
	defineExpose({
		validateForm
	});
</script>
