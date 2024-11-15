<template>
	<fieldset class="w-full border border-gray-300 rounded-lg p-4">
		<legend>Add/Update Monthly Salary</legend>
		<el-form @submit.prevent="addSalary" label-position="top" :model="form" :rules="rules" ref="salaryForm">
			<el-form-item label="Monthly Salary" prop="salary">
				<el-input v-model.number="form.salary" type="number" placeholder="0.00" />
			</el-form-item>

			<el-form-item>
				<el-button type="success" @click="addSalary">Save Salary</el-button>

				<el-button button type="warning" @click="updateSalary">Update Salary</el-button>
			</el-form-item>
		</el-form>
		<!-- Show Salary Here -->
		<div v-if="salaryData.salary !== null">
			<p>
				<strong>Current Salary for {{ salaryData.month }}:</strong>
				{{ formatAmount(salaryData.salary) }}
			</p>
		</div>
	</fieldset>
</template>

<script>
	import { database } from "../../firebase";
	import { ElMessageBox } from "element-plus";
	import getCurrentMonth from "../../utils/getCurrentMonth";
	import { ref as dbRef, set, get, update, onValue, off } from "firebase/database";
	import { inject } from "vue";
	import { store } from "../../stores/store";
	import { showError, showSuccess } from "../../utils/showAlerts";
	import { rules } from "../../assets/validation-rules";
	import useFireBase from "../../api/firebase-apis";
	export default {
		setup() {
			const formatAmount = inject("formatAmount");
			const userStore = store();
			const { read, dbRef } = useFireBase();
			return {
				formatAmount,
				userStore,
				read,
				dbRef
			};
		},
		data() {
			return {
				salaryData: {
					month: null,
					salary: null
				},
				form: {
					salary: null
				},
				rules,
				salaryListener: null // Store the listener for cleanup
			};
		},
		methods: {
			async addSalary() {
				this.$refs.salaryForm.validate(async (valid) => {
					if (valid) {
						try {
							const monthRef = dbRef(database, `salaries/${this.userStore.activeUser}/${getCurrentMonth()}`);
							await set(monthRef, {
								salary: this.form.salary,
								month: getCurrentMonth()
							});
							this.form.salary = null;
							showSuccess("Salary added successfully!");
						} catch (error) {
							showError("Failed to add salary. Please try again.");
						}
					}
				});
			},
			async updateSalary() {
				try {
					// Validate form
					this.$refs.salaryForm.validate(async (valid) => {
						if (!valid) return;
						await ElMessageBox.confirm("Are you sure to update Salary. Continue?", "Warning", {
							confirmButtonText: "OK",
							cancelButtonText: "Cancel",
							type: "warning"
						});
						const monthRef = this.dbRef(`salaries/${this.userStore.activeUser}/${getCurrentMonth()}`);
						const data = await this.read(`salaries/${this.userStore.activeUser}/${getCurrentMonth()}`);
						if (data) {
							await update(monthRef, {
								salary: this.form.salary
							});
							this.form.salary = null;
							showSuccess("Salary updated successfully!");
						} else {
							throw new Error("No existing salary to update for this month.");
						}
					});
				} catch (error) {
					if (error !== "cancel") {
						showError(error.message || "An unexpected error occurred.");
					}
				}
			},
			listenForSalaryChanges() {
				const monthRef = dbRef(database, `salaries/${this.userStore.activeUser}/${getCurrentMonth()}`);

				this.salaryListener = onValue(monthRef, (snapshot) => {
					if (snapshot.exists()) {
						const data = snapshot.val();
						this.salaryData.salary = data.salary;
						this.salaryData.month = data.month;
					} else {
						this.salaryData.salary = null;
						this.salaryData.month = null;
					}
				});
			}
		},
		mounted() {
			console.log("active user", this.userStore.activeUser);
			this.listenForSalaryChanges(); // Start listening for changes when component mounts
		},
		unmounted() {
			// Clean up the listener when component unmounts
			if (this.salaryListener) {
				const monthRef = dbRef(database, `salaries/${this.userStore.activeUser}/${getCurrentMonth()}`);
				off(monthRef, "value", this.salaryListener);
			}
		}
	};
</script>
