<template>
  <div class="w-full" ref="content">
    <div class="flex justify-between">
      <h2>Expenses</h2>
      <el-badge :value="expenses.length" class="item mr-4" type="info"
        >{{ selectedMonth }}:<el-text tag="b"> Transactions</el-text>
      </el-badge>
    </div>
    <el-row class="mb-4">
      <el-col :sm="12" :xs="12" class="space-y-2 text-left">
        <el-statistic :value="totalSpent" :formatter="formatAmount">
          <template #title>Total Spent</template>
        </el-statistic>
      </el-col>
      <el-col :sm="12" :xs="12" class="space-y-2 text-right">
        <el-statistic :value="remaining" :formatter="formatAmount">
          <template #title>Remaining</template>
        </el-statistic>
      </el-col>
    </el-row>

    <div class="flex items-center justify-between mb-2 mt-2">
      <span class="text-sm font-semibold text-gray-700">Filters</span>
      <el-button
        circle
        type="primary"
        size="small"
        class="sm:hidden"
        :icon="Filter"
        @click="showFilters = !showFilters"
      />
    </div>

    <div
      class="filter-bar mb-4"
      :class="showFilters ? 'block sm:block' : 'hidden sm:block'"
    >
      <el-form-item label="Select Month" class="w-full mb-0">
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
    </div>

    <Table
      downloadTitle="Monthly_Expenses"
      :rows="expenses"
      :keys="keys"
      :dataRef="content"
    />
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { Filter } from '@element-plus/icons-vue'
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

const showFilters = ref(false)
</script>
