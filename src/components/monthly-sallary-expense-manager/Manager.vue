<template>
    <div class="w-full mx-auto">
        <div class="flex flex-col gap-6">
            <el-row :gutter="30">
                <el-col :lg="12" :md="12" :sm="12">
                    <AddExpense />
                </el-col>
                <el-col :lg="12" :md="12" :sm="12">
                    <AddSalary />
                </el-col>
            </el-row>
            <ExpenseList />
        </div>
    </div>
</template>

<script setup>
import { defineAsyncComponent } from "vue";

const AddSalary = defineAsyncComponent(() => import("./AddSalary.vue"));
const AddExpense = defineAsyncComponent(() => import("./AddExpense.vue"));
const ExpenseList = defineAsyncComponent(() => import("./ExpenseList.vue"));
</script>
