<template>
	<fieldset class="w-full border border-gray-300 rounded-lg p-4">
		<legend>Add/Update Monthly Salary</legend>
		<el-form label-position="top" :model="form" :rules="rules" ref="salaryForm">
			<el-form-item label="Monthly Salary" prop="salary">
				<el-input v-model.number="form.salary" type="number" placeholder="0.00" />
			</el-form-item>

			<div class="flex justify-between">
				<el-button :disabled="isSaveEnbl" type="success" @click="addSalary">Save Salary</el-button>
				<el-button :disabled="isUpdateEnbl" button type="warning" @click="updateSalary">Update Salary</el-button>
			</div>
		</el-form>
		<!-- Show Salary Here -->
		<el-divider/>
		<div v-if="salaryData.salary !== null">
			<p>
				<strong>Current Salary for {{ salaryData.month }}:</strong>
				{{ formatAmount(salaryData.salary) }}
			</p>
		</div>
	</fieldset>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, inject } from "vue";
	import { ElMessageBox } from "element-plus";
	import { set, update, onValue, off } from "firebase/database";
	import getCurrentMonth from "../../utils/getCurrentMonth";
	import useFireBase from "../../api/firebase-apis";
	import { store } from "../../stores/store";
	import { showError, showSuccess } from "../../utils/showAlerts";
	import { rules } from "../../assets/validation-rules";

	const formatAmount = inject("formatAmount"); // Inject global dependency
	const userStore = store(); // Access Pinia store
	const { read, dbRef } = useFireBase(); // Firebase API helpers

	// Reactive state
	const salaryData = ref({
		month: null,
		salary: null
	});

	const form = ref({
		salary: null
	});
	const salaryForm = ref(null);
	const isSaveEnbl = ref(false);
	const isUpdateEnbl = ref(true);
	let salaryListener = null; // Reference for Firebase listener

	// Method: Add Salary
	const addSalary = async () => {
		const formValid = await validateForm();
		if (!formValid) return;

		try {
			const monthRef = dbRef(`salaries/${userStore.activeUser}/${getCurrentMonth()}`);
			await set(monthRef, {
				salary: form.value.salary,
				month: getCurrentMonth()
			});

			form.value.salary = null;
			showSuccess("Salary added successfully!");
		} catch (error) {
			showError("Failed to add salary. Please try again.");
		}
	};

	// Method: Update Salary
	const updateSalary = async () => {
		const formValid = await validateForm();
		if (!formValid) return;

		try {
			await ElMessageBox.confirm("Are you sure to update Salary. Continue?", "Warning", {
				confirmButtonText: "OK",
				cancelButtonText: "Cancel",
				type: "warning"
			});

			const monthRef = dbRef(`salaries/${userStore.activeUser}/${getCurrentMonth()}`);
			const data = await read(`salaries/${userStore.activeUser}/${getCurrentMonth()}`);

			if (data) {
				await update(monthRef, { salary: form.value.salary });

				form.value.salary = null;
				showSuccess("Salary updated successfully!");
			} else {
				throw new Error("No existing salary to update for this month.");
			}
		} catch (error) {
			if (error !== "cancel") {
				showError(error.message || "An unexpected error occurred.");
			}
		}
	};

	// Listen for salary changes
	const listenForSalaryChanges = () => {
		const monthRef = dbRef(`salaries/${userStore.activeUser}/${getCurrentMonth()}`);

		salaryListener = onValue(monthRef, (snapshot) => {
			if (snapshot.exists()) {
				const data = snapshot.val();

				salaryData.value.salary = data.salary;
				salaryData.value.month = data.month;
				form.value.salary = data.salary;

				isSaveEnbl.value = !!data.salary;
				isUpdateEnbl.value = !data.salary;
			} else {
				salaryData.value.salary = null;
				salaryData.value.month = null;
			}
		});
	};

	// Form validation helper
	const validateForm = async () => {
		let isValid = false;
		await new Promise((resolve) => {
			// Assuming form validation is linked to a ref element
			salaryForm.value.validate((valid) => {
				isValid = valid;
				resolve(valid);
			});
		});
		return isValid;
	};

	// Lifecycle hooks
	onMounted(() => {
		console.log("active user", userStore.activeUser);
		listenForSalaryChanges();
	});

	onUnmounted(() => {
		if (salaryListener) {
			const monthRef = dbRef(`salaries/${userStore.activeUser}/${getCurrentMonth()}`);
			off(monthRef, "value", salaryListener);
		}
	});
</script>
