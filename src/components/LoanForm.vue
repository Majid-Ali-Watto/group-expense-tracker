<template>
	<!-- Add New Loan Section -->
	<fieldset class="border border-gray-300 rounded-lg p-4">
		<legend>Loan Details</legend>

		<el-form :model="formData" :rules="rules" ref="loanForm" label-position="top" class="space-y-4">
			<el-row :gutter="20">
				<!-- Column for Loan Amount, Giver, and Receiver -->
				<el-col :lg="12" :md="12" :sm="24">
					<el-form-item label="Loan Amount" prop="loanAmount" required>
						<el-input v-model.number="formData.loanAmount" type="number" placeholder="Enter loan amount" class="w-full" />
					</el-form-item>

					<el-form-item label="Loan Giver" prop="loanGiver" required>
						<el-select v-model="formData.loanGiver" placeholder="Select loan giver" class="w-full">
							<el-option v-for="friend in friends" :key="friend" :label="friend" :value="friend" />
						</el-select>
					</el-form-item>

					<el-form-item label="Loan Receiver" prop="loanReceiver" required>
						<el-select v-model="formData.loanReceiver" placeholder="Select loan receiver" class="w-full">
							<el-option v-for="friend in friends" :key="friend" :label="friend" :value="friend" />
						</el-select>
					</el-form-item>
				</el-col>

				<!-- Column for Loan Description -->
				<el-col :lg="12" :md="12" :sm="24">
					<el-form-item label="Description" prop="loanDescription" required>
						<el-input rows=8 v-model="formData.loanDescription" type="textarea" placeholder="Loan details" class="w-full" />
					</el-form-item>
				</el-col>
			</el-row>

			<!-- Submit Button -->
			<div class="flex justify-end">
				<el-button v-if="isVisible" type="success" class="text-white py-2 rounded-lg" @click="() => validateForm()"> Add Loan </el-button>
			</div>
		</el-form>
	</fieldset>
</template>

<script setup>
	import { ref, watch } from "vue";
	import getWhoAddedTransaction from "../utils/whoAdded";
	import { rules } from "../assets/validation-rules";
	import useFireBase from "../api/firebase-apis";
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
		loanAmount: null,
		loanGiver: "",
		loanReceiver: "",
		loanDescription: ""
	});
	// Watch for changes in `row` prop and update formData
	watch(
		() => props.row,
		(newRow) => {
			formData.value.loanAmount = newRow?.amount ?? null;
			formData.value.loanGiver = newRow?.giver ?? "";
			formData.value.loanReceiver = newRow?.receiver ?? "";
			formData.value.loanDescription = newRow?.description ?? "";
			isVisible.value = !newRow?.amount;
		},
		{ immediate: true, deep: true }
	);

	// Handle form submission with validation
	const validateForm = (whatTask = "Save") => {
		loanForm.value.validate((valid) => {
			if (valid) {
				if (whatTask == "Save") {
					saveData('loans',getLoanData, loanForm, "Loan added successfully.");
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
			amount: formData.value.loanAmount,
			description: formData.value.loanDescription,
			giver: formData.value.loanGiver,
			receiver: formData.value.loanReceiver,
			date: new Date().toLocaleDateString("en-PK") + " " + new Date().toLocaleTimeString(),
			whoAdded: getWhoAddedTransaction()
		};
		return loan;
	}

	defineExpose({
		validateForm
	});
</script>
