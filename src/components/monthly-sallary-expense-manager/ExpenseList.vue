<template>
    <div class="w-full">
        <h2 class="text-lg font-semibold">Expenses</h2>
        <el-form-item label="Select Month">
            <el-select
                v-model="selectedMonth"
                @change="fetchExpenses"
                placeholder="Select month"
            >
                <el-option
                    v-for="month in months"
                    :key="month"
                    :label="month"
                    :value="month"
                />
            </el-select>
        </el-form-item>

        <el-divider />

        <!-- <el-row :gutter="20">
            <el-col :span="24" v-for="expense in expenses" :key="expense.id">
                <div class="expense-details">
                    <p>
                        <strong>Description:</strong>
                        {{ expense.description }}
                    </p>
                    <p>
                        <strong>Amount:</strong> ${{
                            expense.amount.toFixed(2)
                        }}
                    </p>
                    <p><strong>Location:</strong> {{ expense.location }}</p>
                    <p><strong>Recipient:</strong> {{ expense.recipient }}</p>
                </div>
                <el-divider />

            </el-col>
        </el-row> -->

        <p>
            Total Spent: <strong>${{ totalSpent.toFixed(2) }}</strong>
        </p>
        <p>
            Remaining: <strong>${{ remaining.toFixed(2) }}</strong>
        </p>
    </div>
    <Table :rows="expenses" :keys="keys" />
</template>
<script>
import { database, ref as dbRef, get } from "../../firebase";
import { ElMessage } from "element-plus";
import Table from "../Table.vue";
export default {
    components: {
        Table,
    },
    data() {
        return {
            expenses: [],
            keys: [],
            totalSpent: 0,
            remaining: 0,
            selectedMonth: this.getCurrentMonth(),
            salary: 0,
            months: [],
        };
    },
    async created() {
        await this.fetchMonths();
        await this.fetchExpenses();
    },
    methods: {
        async fetchMonths() {
            try {
                const snapshot = await get(dbRef(database, "salaries"));
                const data = snapshot.exists() ? snapshot.val() : null;
                console.log("Months data:", data); // Debugging: Check months data
                this.months = data ? Object.keys(data) : [];
            } catch (error) {
                console.error("Error fetching months:", error);
                ElMessage.error("Failed to load months. Please try again.");
            }
        },
        async fetchExpenses() {
            try {
                this.expenses = [];
                this.totalSpent = 0;
                this.salary = 0;

                // Fetch salary for the selected month
                const salarySnapshot = await get(
                    dbRef(database, `salaries/${this.selectedMonth}`)
                );
                const salaryData = salarySnapshot.exists()
                    ? salarySnapshot.val()
                    : null;
                console.log("Salary data:", salaryData); // Debugging: Check salary data
                this.salary = salaryData ? salaryData.salary : 0;

                // Fetch expenses for the selected month
                const expensesSnapshot = await get(dbRef(database, "expenses"));
                const expensesData = expensesSnapshot.exists()
                    ? expensesSnapshot.val()
                    : null;
                console.log("Expenses data:", expensesData); // Debugging: Check expenses data

                if (expensesData && expensesData[this.selectedMonth]) {
                    // Get the expenses for the selected month
                    const monthExpenses = expensesData[this.selectedMonth];

                    // Map over the expenses and add them to the array
                    this.expenses = Object.keys(monthExpenses).map((key) => ({
                        // id: key,
                        ...monthExpenses[key],
                    }));
                    this.keys = Object.keys(monthExpenses).map((key) => ({
                        id: key,
                    }));
                    console.log("Filtered expenses:", this.expenses); // Debugging: Check filtered expenses

                    // Calculate the total amount spent
                    this.totalSpent = this.expenses.reduce(
                        (total, expense) => total + expense.amount,
                        0
                    );
                }

                // Calculate the remaining amount
                this.remaining = this.salary - this.totalSpent;
                console.log("Total Spent:", this.totalSpent); // Debugging: Check total spent
                console.log("Remaining:", this.remaining); // Debugging: Check remaining
            } catch (error) {
                console.error("Error fetching expenses:", error);
                ElMessage.error("Failed to load expenses. Please try again.");
            }
        },

        getCurrentMonth() {
            const date = new Date();
            return `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
        },
    },
};
</script>


<style scoped>
.expense-form {
    max-width: 400px;
    margin: auto;
}
</style>
