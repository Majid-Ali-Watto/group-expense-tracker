<template>
  <div class="w-full" ref="content">
    <LoadingSkeleton v-if="isContentLoading" mode="page" />
    <template v-else>
      <SalaryExpenseStats
        :format-amount="formatAmount"
        :remaining="remaining"
        :selected-month="selectedMonth"
        :total-spent="totalSpent"
        :transaction-count="expenses.length"
      />

      <!-- Filter -->
      <div class="sel-filter no-print-pdf">
        <div class="sel-filter-toggle">
          <span class="sel-filter-label">Filter by month</span>
          <el-button
            circle
            type="primary"
            size="small"
            class="sm:hidden"
            :icon="Filter"
            @click="showFilters = !showFilters"
          />
        </div>
        <div :class="showFilters ? 'block' : 'hidden sm:block'">
          <GenericDropDown
            size="small"
            v-model="selectedMonth"
            label="Select Month"
            placeholder="Select month"
            :options="months"
            @update:modelValue="fetchExpenses"
          />
        </div>
      </div>

      <Table
        downloadTitle="Personal_Expenses"
        :rows="expenses"
        :keys="keys"
        :dataRef="content"
        :reportMonth="selectedMonth"
      />
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Filter } from '@element-plus/icons-vue'
import Table from '../shared/Table.vue'
import GenericDropDown from '../generic-components/GenericDropDown.vue'
import LoadingSkeleton from '../shared/LoadingSkeleton.vue'
import SalaryExpenseStats from './SalaryExpenseStats.vue'
import { SalaryExpenseList } from '../../scripts/monthly-expenses/salary-expense-list'

const {
  formatAmount,
  selectedMonth,
  expenses,
  keys,
  totalSpent,
  remaining,
  months,
  content,
  isContentLoading,
  fetchExpenses
} = SalaryExpenseList()
const showFilters = ref(false)
</script>

<style scoped>
.sel-filter {
  margin-bottom: 1rem;
}
.sel-filter-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}
.sel-filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>
