<template>
    <div class="w-full" ref="content">
        <h2>Expenses</h2>
        <el-row :gutter="30">
            <el-col :lg="12" :md="12" :sm="12">
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
            </el-col>
        </el-row>

        <!-- <el-divider /> -->
        <el-row class="mb-4">
            <el-col :lg="12" :md="12" :sm="24">
                <p>
                    Total Spent: <strong>{{ formatAmount(totalSpent) }}</strong>
                </p>
            </el-col>
            <el-col :lg="12" :md="12" :sm="24">
                <p>
                    Remaining: <strong>{{ formatAmount(remaining) }}</strong>
                </p>
            </el-col>
        </el-row>

        <Table v-if="expenses.length" :rows="expenses" :keys="keys" />
        <!-- Download Buttons -->
        <el-row class="mt-2 flex justify-start">
            <el-col :lg="12" :md="12" :sm="24">
                <el-button
                    type="success"
                    @click="downloadPdfData"
                    class="mt-1 text-white px-4 py-2 rounded"
                >
                    Download PDF
                </el-button>
                <el-button
                    type="warning"
                    @click="downloadExcelData"
                    class="mt-1 text-white px py-2 rounded"
                >
                    Download Excel
                </el-button>
            </el-col>
            <!-- <el-col :lg="1" :md="1"></el-col>
            <el-col :lg="11" :md="11" :sm="24">
            </el-col> -->
        </el-row>
    </div>
</template>

<script>
import { database, ref as dbRef, get, onValue } from "../../firebase";
import { ElMessage } from "element-plus";
import Table from "../Table.vue";
import { store } from "../../stores/store";
import { ref, onMounted, watch, inject } from "vue";
import getCurrentMonth from "../../utils/getCurrentMonth";
import { downloadExcel, downloadPDF } from "../../utils/downloadDataProcedures";
export default {
    setup() {
        const formatAmount = inject("formatAmount");

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
                    ElMessage.error(
                        "Failed to load expenses. Please try again."
                    );
                }
            );
        };
        function downloadPdfData() {
            downloadPDF(content.value, "Monthly_Salary_Expense_");
        }

        function downloadExcelData() {
            downloadExcel(
                expenses.value,
                "Monthly_Salary_Expense_",
                "Salary Expenses"
            );
        }
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
            content,
            downloadPdfData,
            downloadExcelData,
        };
    },
    components: {
        Table,
    },
};
</script>

