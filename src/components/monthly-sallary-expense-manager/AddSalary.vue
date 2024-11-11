<template>
    <fieldset class="w-full border border-gray-300 rounded-lg p-4">
        <legend class="text-xl font-semibold px-2">
            Add/Update Monthly Salary
        </legend>
        <el-form
            @submit.prevent="addSalary"
            label-position="top"
            :model="form"
            :rules="rules"
            ref="salaryForm"
        >
            <el-form-item label="Monthly Salary" prop="salary">
                <el-input
                    v-model.number="form.salary"
                    type="number"
                    placeholder="0.00"
                />
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="addSalary"
                    >Save Salary</el-button
                >
                <el-button type="primary" @click="updateSalary"
                    >Update Salary</el-button
                >
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
import { ElMessage, ElMessageBox } from "element-plus";
import { ref as dbRef, set, get, update } from "firebase/database";
import { inject } from "vue";
export default {
    setup() {
        const formatAmount = inject("formatAmount");
        return {
            formatAmount,
        };
    },
    data() {
        return {
            salaryData: {
                month: null,
                salary: null,
            },
            form: {
                salary: null,
            },
            rules: {
                salary: [
                    {
                        required: true,
                        message: "Salary is required",
                        trigger: "blur",
                    },
                    {
                        type: "number",
                        min: 1,
                        message: "Salary should be greater than zero",
                        trigger: "blur",
                    },
                ],
            },
        };
    },
    methods: {
        async addSalary() {
            this.$refs.salaryForm.validate(async (valid) => {
                if (valid) {
                    try {
                        const monthRef = dbRef(
                            database,
                            `salaries/${this.getCurrentMonth()}`
                        );
                        await set(monthRef, {
                            salary: this.form.salary,
                            month: this.getCurrentMonth(),
                        });
                        this.form.salary = null;
                        ElMessage.success("Salary added successfully!");
                    } catch (error) {
                        console.error("Error adding salary:", error);
                        ElMessage.error(
                            "Failed to add salary. Please try again."
                        );
                    }
                }
            });
        },
        async updateSalary() {
            this.$refs.salaryForm.validate(async (valid) => {
                if (valid) {
                    const monthRef = dbRef(
                        database,
                        `salaries/${this.getCurrentMonth()}`
                    );
                    try {
                        const snapshot = await get(monthRef);
                        if (snapshot.exists()) {
                            await update(monthRef, {
                                salary: this.form.salary,
                            });
                            this.form.salary = null;
                            ElMessage.success("Salary updated successfully!");
                        } else {
                            ElMessageBox.alert(
                                "No existing salary to update for this month.",
                                "Update Failed",
                                {
                                    type: "warning",
                                }
                            );
                        }
                    } catch (error) {
                        console.error("Error updating salary:", error);
                        ElMessage.error(
                            "Failed to update salary. Please try again."
                        );
                    }
                }
            });
        },
        async fetchSalary() {
            try {
                const monthRef = dbRef(
                    database,
                    `salaries/${this.getCurrentMonth()}`
                );
                const snapshot = await get(monthRef);
                if (snapshot.exists()) {
                    console.log("salary:", snapshot.val());
                    this.salaryData.salary = snapshot.val().salary;
                    this.salaryData.month = snapshot.val().month;
                } else {
                    this.salaryData.salary = null;
                    this.salaryData.month = null;
                }
            } catch (error) {
                console.error("Error fetching salary:", error);
                ElMessage.error("Failed to fetch salary. Please try again.");
            }
        },
        getCurrentMonth() {
            const date = new Date();
            return `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
        },
    },
    mounted() {
        this.fetchSalary(); // Fetch salary when component mounts
    },
};
</script>

