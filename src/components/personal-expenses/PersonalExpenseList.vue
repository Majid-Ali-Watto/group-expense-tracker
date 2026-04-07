<template>
  <div class="w-full" ref="content">
    <LoadingSkeleton v-if="isContentLoading" mode="page" />
    <template v-else>
      <PersonalExpenseStats
        :format-amount="formatAmount"
        :remaining="remaining"
        :selected-month="selectedMonth"
        :total-spent="totalSpent"
        :transaction-count="expenses.length"
      />

      <!-- Filter -->
      <div class="sel-filter no-print-pdf">
        <FilterBar :fields="filterFields" @clear="clearFilters" />
      </div>

      <Table
        downloadTitle="Personal_Expenses"
        :rows="filteredExpenses"
        :keys="keys"
        :dataRef="content"
        :reportMonth="selectedMonth"
      />
    </template>
  </div>
</template>

<script setup>
import { Table, LoadingSkeleton } from '@/components/shared'
import { FilterBar } from '@/components/generic-components'
import PersonalExpenseStats from './PersonalExpenseStats.vue'
import { PersonalExpenseList } from '@/scripts/personal-expenses'

const {
  formatAmount,
  selectedMonth,
  expenses,
  filteredExpenses,
  keys,
  totalSpent,
  remaining,
  content,
  isContentLoading,
  filterFields,
  clearFilters
} = PersonalExpenseList()
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
