<template>
	<div class="w-full" ref="content">
		<div class="flex justify-between">
			<h2>Expenses</h2>
			<el-badge :value="expenses.length" class="item mr-4" type="secondary">{{ selectedMonth }}:<el-text tag="b"> Transactions</el-text> </el-badge>
		</div>
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
<script setup>
import { inject, ref, onMounted, watch, onUnmounted } from "vue";
import { onValue, off } from "../../firebase";
import { store } from "../../stores/store";
import getCurrentMonth from "../../utils/getCurrentMonth";
import { showError } from "../../utils/showAlerts";
import Table from "../Table.vue";
import useFireBase from "../../api/firebase-apis";

const formatAmount = inject("formatAmount");
const { dbRef } = useFireBase();
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

let expensesListener = null; // Listener reference for expenses
let salaryListener = null; // Listener reference for salary

// Fetch available months
const fetchMonths = () => {
  const monthsRef = dbRef(`expenses/${activeUser.value}`);
  onValue(
    monthsRef,
    (snapshot) => {
      months.value = snapshot.exists() ? Object.keys(snapshot.val()) : [];
    },
    (error) => {
      showError("Failed to load months. Please try again.");
      console.error(error);
    }
  );
};

// Fetch salary data
const fetchSalary = () => {
  const salaryRef = dbRef(`salaries/${activeUser.value}/${selectedMonth.value}`);
  if (salaryListener) off(salaryRef, "value", salaryListener); // Remove old listener if exists

  salaryListener = onValue(
    salaryRef,
    (snapshot) => {
      salary.value = snapshot.exists() ? snapshot.val().salary || 0 : 0;
      updateRemaining(); // Update remaining after fetching salary
    },
    (error) => {
      showError("Failed to load salary. Please try again.");
      console.error(error);
    }
  );
};

// Fetch expenses data
const fetchExpenses = () => {
  const expensesRef = dbRef(`expenses/${activeUser.value}/${selectedMonth.value}`);
  if (expensesListener) off(expensesRef, "value", expensesListener); // Remove old listener if exists

  expensesListener = onValue(
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
      updateRemaining(); // Update remaining after fetching expenses
    },
    (error) => {
      showError("Failed to load expenses. Please try again.");
      console.error(error);
    }
  );
};

// Update remaining amount
const updateRemaining = () => {
  remaining.value = salary.value - totalSpent.value;
};

// Watch for changes in selectedMonth and re-fetch data
watch(selectedMonth, () => {
  userStore.setCurrentMonth(selectedMonth.value);
  fetchSalary();
  fetchExpenses();
});

// Cleanup listeners on component unmount
onUnmounted(() => {
  if (salaryListener) off(dbRef(`salaries/${activeUser.value}/${selectedMonth.value}`), "value", salaryListener);
  if (expensesListener) off(dbRef(`expenses/${activeUser.value}/${selectedMonth.value}`), "value", expensesListener);
});

onMounted(() => {
  fetchMonths();
  fetchSalary();
  fetchExpenses();

  setTimeout(() => {
    userStore.setSalaryRef(content.value);
  }, 1000);
});
</script>
