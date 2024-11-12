<template>
    <div class="w-full">
        <h2>Expenses</h2>
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

        <p>
            Total Spent: <strong>{{ formatAmount(totalSpent) }}</strong>
        </p>
        <p>
            Remaining: <strong>{{ formatAmount(remaining) }}</strong>
        </p>

        <Table v-if="expenses.length" :rows="expenses" :keys="keys" />
    </div>
</template>

<script>
import { database, ref as dbRef, get, onValue } from "../../firebase";
import { ElMessage } from "element-plus";
import Table from "../Table.vue";
import { store } from "../../stores/store";
import { ref, onMounted, watch, inject } from "vue";
export default {
    setup() {
        const formatAmount = inject("formatAmount");
        const getCurrentMonth = () => {
            const date = new Date();
            return `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
        };

        const userStore = store();
        const activeUser = ref(userStore.activeUser);
        const selectedMonth = ref(getCurrentMonth());
        const expenses = ref([]);
        const keys = ref([]);
        const totalSpent = ref(0);
        const remaining = ref(0);
        const salary = ref(0);
        const months = ref([]);

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
                const snapshot = await get(
                    dbRef(database, `salaries/${activeUser.value}`)
                );
                const data = snapshot.exists() ? snapshot.val() : null;
                months.value = data ? Object.keys(data) : [];
            } catch (error) {
                ElMessage.error("Failed to load months. Please try again.");
            }
        };

        const fetchSalary = async () => {
            try {
                const salarySnapshot = await get(
                    dbRef(
                        database,
                        `salaries/${activeUser.value}/${selectedMonth.value}`
                    )
                );
                const salaryData = salarySnapshot.exists()
                    ? salarySnapshot.val()
                    : null;
                salary.value = salaryData ? salaryData.salary : 0;
            } catch (error) {
                console.error("Error fetching salary:", error);
                ElMessage.error("Failed to load salary. Please try again.");
            }
        };

        const fetchExpenses = () => {
            const expensesRef = dbRef(
                database,
                `expenses/${activeUser.value}/${selectedMonth.value}`
            );

            onValue(
                expensesRef,
                (snapshot) => {
                    if (snapshot.exists()) {
                        const monthExpenses = snapshot.val();
                        expenses.value = Object.values(monthExpenses);
                        keys.value = Object.keys(monthExpenses);

                        totalSpent.value = expenses.value.reduce(
                            (total, expense) => total + (expense.amount || 0),
                            0
                        );
                    } else {
                        expenses.value = [];
                        totalSpent.value = 0;
                    }
                    remaining.value = salary.value - totalSpent.value;
                },
                (error) => {
                    console.error("Error fetching expenses:", error);
                    ElMessage.error(
                        "Failed to load expenses. Please try again."
                    );
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
        };
    },
    components: {
        Table,
    },
};
</script>

