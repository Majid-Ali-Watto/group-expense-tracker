<template>
	<fieldset class="w-full border border-gray-300 rounded-lg p-4">
		<legend>Expense Details</legend>
		<el-form label-position="top" :model="form" :rules="rules" ref="expenseForm">
			<el-form-item label="Amount" prop="amount">
				<el-input v-model.number="form.amount" placeholder="0.00" type="number" />
			</el-form-item>
			<el-form-item label="Description" prop="description">
				<el-input v-model="form.description" placeholder="Enter description" />
			</el-form-item>
			<el-form-item label="Location" prop="location">
				<el-input v-model="form.location" placeholder="Enter location" />
			</el-form-item>
			<el-form-item label="Recipient" prop="recipient">
				<el-input v-model="form.recipient" placeholder="To Whom" />
			</el-form-item>
			<div class="flex justify-end" v-if="isVisible">
				<el-button type="success" @click="() => validateForm()">Add Expense</el-button>
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

	const validateForm = async (whatTask = "Save") => {
		expenseForm.value.validate(async (valid) => {
			if (valid) {
				if (whatTask == "Save") {
					saveData(`expenses/${activeUser.value}/${getCurrentMonth()}`, getExpenseData, expenseForm, "Expense added successfully!");
				} else if (whatTask == "Update") {
					console.log("Expense updated successfully");
					updateData(`expenses/${activeUser.value}/${getCurrentMonth()}/${props.row.id}`, getExpenseData, expenseForm, `Expense record with ID ${props.row.id} updated successfully`);
					emit("closeModal");
				} else if (whatTask == "Delete") {
					console.log("delete from account");
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
			whoAdded: getWhoAddedTransaction()
		};
	}
	defineExpose({
		validateForm
	});
</script>
