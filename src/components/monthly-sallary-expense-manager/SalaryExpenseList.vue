<template>
	<div class="w-full" ref="content">
		<h2>Expenses</h2>
		<el-row :gutter="30" class="mb-4 flex items-center">
			<el-col :lg="12" :md="12" :sm="24" class="space-y-2">
				<el-row>
					<el-col :lg="12" :md="12" :sm="12" :xs="12" class="space-y-2">
						<el-statistic :value="totalSpent" :formatter="formatAmount">
							<template #title>Total Spent</template>
						</el-statistic>
					</el-col>

					<el-col :lg="12" :md="12" :sm="12" :xs="12" class="space-y-2">
						<el-statistic :value="remaining" :formatter="formatAmount">
							<template #title>Remaining</template>
						</el-statistic>
					</el-col>
				</el-row>
			</el-col>
			<el-col :lg="12" :md="12" :sm="24" class="space-y-2">
				<el-form-item label="Select Month" class="w-full">
					<el-select class="w-full" v-model="selectedMonth" @change="fetchExpenses" placeholder="Select month">
						<el-option v-for="month in months" :key="month" :label="month" :value="month" />
					</el-select>
				</el-form-item>
			</el-col>

		</el-row>

		<Table downloadTitle="Monthly_Expenses" :rows="expenses" :keys="keys" :dataRef="content" />
	</div>
</template>

<script>
	import { inject, onMounted, ref, watch } from "vue";
	import { onValue } from "../../firebase";
	import { store } from "../../stores/store";
	import getCurrentMonth from "../../utils/getCurrentMonth";
	import { showError } from "../../utils/showAlerts";
	import Table from "../Table.vue";
	import useFireBase from "../../api/firebase-apis";
	export default {
		setup() {
			const formatAmount = inject("formatAmount");
			const { read, dbRef } = useFireBase();
			const userStore = store();
			const activeUser = ref(userStore.activeUser);
			const selectedMonth = ref(getCurrentMonth());
			const expenses = ref([]);
			const keys = ref([]);
			const totalSpent = ref(0);
			const remaining = ref(0);
			const salary = ref(0);
			const months = ref([]);
			const content = ref(null);
			onMounted(async () => {
				await fetchMonths();
				await fetchSalary(); // Fetch salary when the component mounts
				fetchExpenses(); // Fetch expenses after salary is loaded
			});

			watch(selectedMonth, async () => {
				await fetchSalary(); // Fetch salary when selected month changes
				fetchExpenses(); // Fetch expenses after salary is loaded
			});

			const fetchMonths = async () => {
				try {
					const data = await read(`salaries/${activeUser.value}`);
					months.value = data ? Object.keys(data) : [];
				} catch (error) {
					showError("Failed to load months. Please try again.");
				}
			};

			const fetchSalary = async () => {
				try {
					const salaryData = await read(`salaries/${activeUser.value}/${selectedMonth.value}`);
					salary.value = salaryData ? salaryData.salary : 0;
				} catch (error) {
					showError("Failed to load salary. Please try again.");
				}
			};

			const fetchExpenses = () => {
				const expensesRef = dbRef(`expenses/${activeUser.value}/${selectedMonth.value}`);

				onValue(
					expensesRef,
					(snapshot) => {
						if (snapshot.exists()) {
							const monthExpenses = snapshot.val();
							expenses.value = Object.values(monthExpenses);
							keys.value = Object.keys(monthExpenses);

							totalSpent.value = expenses.value.reduce((total, expense) => total + (expense.amount || 0), 0);
						} else {
							expenses.value = [];
							totalSpent.value = 0;
						}
						remaining.value = salary.value - totalSpent.value;
					},
					(error) => {
						showError("Failed to load expenses. Please try again.");
					}
				);
			};

			return {
				activeUser,
				selectedMonth,
				expenses,
				keys,
				totalSpent,
				remaining,
				months,
				fetchExpenses,
				formatAmount,
				content
			};
		},
		components: {
			Table
		}
	};
</script>
