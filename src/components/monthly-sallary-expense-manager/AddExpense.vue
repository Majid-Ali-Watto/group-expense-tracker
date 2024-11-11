<template>
    <fieldset class="w-full border border-gray-300 rounded-lg p-4">
        <legend class="text-xl font-semibold px-2">Add Expense</legend>
        <el-form
            @submit.prevent="addExpense"
            label-position="top"
            :model="form"
            :rules="rules"
            ref="expenseForm"
        >
            <el-form-item label="Amount" prop="amount">
                <el-input
                    v-model.number="form.amount"
                    placeholder="0.00"
                    type="number"
                />
            </el-form-item>
            <el-form-item label="Description" prop="description">
                <el-input
                    v-model="form.description"
                    placeholder="Enter description"
                />
            </el-form-item>
            <el-form-item label="Location" prop="location">
                <el-input
                    v-model="form.location"
                    placeholder="Enter location"
                />
            </el-form-item>
            <el-form-item label="Recipient" prop="recipient">
                <el-input v-model="form.recipient" placeholder="To Whom" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="addExpense"
                    >Add Expense</el-button
                >
            </el-form-item>
        </el-form>
    </fieldset>
</template>

<script>
import { database } from "../../firebase";
import { ElMessage } from "element-plus";
import { ref as dbRef, push } from "firebase/database";

export default {
    data() {
        return {
            form: {
                amount: null,
                description: "",
                location: "",
                recipient: "",
            },
            rules: {
                amount: [
                    {
                        required: true,
                        message: "Amount is required",
                        trigger: "blur",
                    },
                    {
                        type: "number",
                        min: 1,
                        message: "Amount must be a positive number",
                        trigger: "blur",
                    },
                ],
                description: [
                    {
                        required: true,
                        message: "Description is required",
                        trigger: "blur",
                    },
                ],
                location: [
                    {
                        required: true,
                        message: "Location is required",
                        trigger: "blur",
                    },
                ],
                recipient: [
                    {
                        required: true,
                        message: "Recipient is required",
                        trigger: "blur",
                    },
                ],
            },
        };
    },
    methods: {
        async addExpense() {
            this.$refs.expenseForm.validate(async (valid) => {
                if (valid) {
                    try {
                        await push(
                            dbRef(
                                database,
                                `expenses/${this.getCurrentMonth()}`
                            ),
                            {
                                amount: this.form.amount,
                                description: this.form.description,
                                location: this.form.location,
                                recipient: this.form.recipient,
                                month: this.getCurrentMonth(),
                            }
                        );
                        this.resetForm();
                        ElMessage.success("Expense added successfully!");
                    } catch (error) {
                        console.error("Error adding expense:", error);
                        ElMessage.error(
                            "Failed to add expense. Please try again."
                        );
                    }
                }
            });
        },
        resetForm() {
            this.form.amount = null;
            this.form.description = "";
            this.form.location = "";
            this.form.recipient = "";
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

