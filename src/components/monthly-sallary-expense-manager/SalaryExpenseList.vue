<template>
  <div class="w-full" ref="content">
    <div class="flex justify-between">
      <h2>Expenses</h2>
      <el-badge :value="expenses.length" class="item mr-4" type="info"
        >{{ selectedMonth }}:<el-text tag="b"> Transactions</el-text>
      </el-badge>
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
          <el-select
            filterable
            class="w-full"
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

    <Table
      downloadTitle="Monthly_Expenses"
      :rows="expenses"
      :keys="keys"
      :dataRef="content"
    />
  </div>
</template>
<script setup>
import Table from '../Table.vue'
import { SalaryExpenseList } from '../../scripts/salary-expense-list'

const {
  formatAmount,
  selectedMonth,
  expenses,
  keys,
  totalSpent,
  remaining,
  months,
  content,
  fetchExpenses
} = SalaryExpenseList()
</script>
