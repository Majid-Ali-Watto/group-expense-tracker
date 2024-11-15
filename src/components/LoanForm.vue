<template>
	<!-- Add New Loan Section -->
	<fieldset class="border border-gray-300 rounded-lg p-4">
		<legend>Add New Loan</legend>

		<el-form :model="formData" :rules="rules" ref="loanForm" @submit.prevent="handleLoanSubmit" label-position="top" class="space-y-4">
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
						<el-input rows="8" v-model="formData.loanDescription" type="textarea" placeholder="Loan details" class="w-full" />
					</el-form-item>
				</el-col>
			</el-row>

			<!-- Submit Button -->
			<el-form-item>
				<el-button v-if="isVisible" type="success" class="text-white py-2 rounded-lg" @click="() => validateForm()"> Add Loan </el-button>
				<el-button v-if="!isVisible" type="warning" class="text-white py-2 rounded-lg" @click="() => validateForm('Update')">Update</el-button>
				<el-button v-if="!isVisible" class="text-white py-2 rounded-lg" type="danger" @click="() => validateForm('Delete')"> Delete </el-button>
			</el-form-item>
		</el-form>
	</fieldset>
</template>

<script setup>
	import { ref, watch } from "vue";
	import { showError, showSuccess } from "../utils/showAlerts";
	import { database, push, ref as dbRef, remove, update } from "../firebase"; // Firebase setup
	import getWhoAddedTransaction from "../utils/whoAdded";
	import { rules } from "../assets/validation-rules";
	const emit = defineEmits(["closeModal"]);
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
					handleLoanSubmit();
				} else if (whatTask == "Update") {
					console.log("Update");
					updateLoan(props.row.id);
					emit("closeModal");
				} else if (whatTask == "Delete") {
					deleteLoan(props.row.id);
					emit("closeModal");
				}
			}
		});
	};
	function deleteLoan(loanId) {
		console.log("loan Id: ", loanId);
		const loanRef = dbRef(database, `loans/${loanId}`); // Reference to the specific loan node
		console.log(loanRef);
		remove(loanRef)
			.then(() => {
				showSuccess(`Loan record with ID ${loanId} deleted successfully`);
			})
			.catch((error) => {
				showError("Error deleting loan record:" + error);
			});
	}
	function updateLoan(loanId) {
		const loanRef = dbRef(database, `loans/${loanId}`); // Reference to the specific loan node
		update(loanRef, getLoanData())
			.then(() => {
				showSuccess(`Loan record with ID ${loanId} updated successfully`);
				resetForm();
			})
			.catch((error) => {
				showError("Error updating loan record: " + error);
			});
	}

	// Handle loan submission
	function handleLoanSubmit() {
		push(dbRef(database, "loans"), getLoanData())
			.then(() => {
				showSuccess("Loan added successfully.");
				// Clear form
				resetForm();
			})
			.catch((error) => {
				showError("Error saving loan: " + error.message);
			});
	}
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
	function resetForm() {
		formData.value.loanAmount = null;
		formData.value.loanDescription = "";
		formData.value.loanGiver = "";
		formData.value.loanReceiver = "";
	}
</script>
