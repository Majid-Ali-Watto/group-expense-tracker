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
        <div class="sel-filter-toggle">
          <span class="sel-filter-label">Filter by month</span>
          <div class="flex items-center gap-2">
            <button
              v-if="showFilters"
              class="clear-filter-link sm:hidden"
              @click="clearFilters()"
            >
              Clear
            </button>
            <button
              class="clear-filter-link hidden sm:inline"
              @click="clearFilters()"
            >
              Clear
            </button>
            <el-button
              circle
              :type="showFilters ? 'danger' : 'primary'"
              size="small"
              class="sm:hidden"
              :icon="showFilters ? Close : Filter"
              @click="showFilters = !showFilters"
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div :class="showFilters ? 'block flex-1' : 'hidden sm:block flex-1'">
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
import { Filter, Close } from '@element-plus/icons-vue'
import { Table, LoadingSkeleton } from '@/components/shared'
import { GenericDropDown } from '@/components/generic-components'
import PersonalExpenseStats from './PersonalExpenseStats.vue'
import { PersonalExpenseList } from '@/scripts/personal-expenses'

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
  fetchExpenses,
  clearFilters
} = PersonalExpenseList()
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
