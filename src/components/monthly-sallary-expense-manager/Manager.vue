<template>
    <div class="w-full mx-auto">
        <div class="flex flex-col gap-6">
            <el-row :gutter="30">
                <el-col :lg="12" :md="12" :sm="12">
                    <HOC :componentToBeRendered="AddExpense" />
                </el-col>
                <el-col :lg="12" :md="12" :sm="12">
                    <HOC :componentToBeRendered="AddSalary" />
                </el-col>
            </el-row>
            <HOC :componentToBeRendered="ExpenseList" />
        </div>
    </div>
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import HOC from "../HOC.vue";

// Async components
const AddSalary = defineAsyncComponent(() => import("./SalaryForm.vue"));
const AddExpense = defineAsyncComponent(() => import("./ExpenseForm.vue"));
const ExpenseList = defineAsyncComponent(() => import("./SalaryExpenseList.vue"));
</script>
