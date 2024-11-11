<template>
    <div class="w-full mx-auto p-4">
        <div class="flex flex-col gap-6">
            <el-row :gutter="30">
                <el-col :lg="11" :md="11" :sm="24">
                    <AddExpense />
                </el-col>
                <el-col :lg="11" :md="11" :sm="24">
                    <AddSalary />
                </el-col>
            </el-row>
            <ExpenseList />
        </div>
    </div>
</template>

<script setup>
import AddSalary from "./AddSalary.vue";
import AddExpense from "./AddExpense.vue";
import ExpenseList from "./ExpenseList.vue";
</script>

