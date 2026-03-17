<template>
  <div class="w-full" ref="content">
    <!-- Stats bar -->
    <div class="sel-stats">
      <div class="sel-stat">
        <span class="sel-stat-label">Total Spent</span>
        <span class="sel-stat-value sel-danger">{{ formatAmount(totalSpent) }}</span>
      </div>
      <div class="sel-divider" />
      <div class="sel-stat">
        <span class="sel-stat-label">Remaining</span>
        <span class="sel-stat-value sel-success">{{ formatAmount(remaining) }}</span>
      </div>
      <div class="sel-divider" />
      <div class="sel-stat sel-stat-end">
        <span class="sel-stat-label">Transactions</span>
        <span class="sel-stat-value">{{ expenses.length }} <span class="sel-month">{{ selectedMonth }}</span></span>
      </div>
    </div>

    <!-- Filter -->
    <div class="sel-filter no-print-pdf">
      <div class="sel-filter-toggle">
        <span class="sel-filter-label">Filter by month</span>
        <el-button circle type="primary" size="small" class="sm:hidden" :icon="Filter" @click="showFilters = !showFilters" />
      </div>
      <div :class="showFilters ? 'block' : 'hidden sm:block'">
        <el-form-item label="Select Month" class="w-full mb-0">
          <el-select filterable class="w-full" v-model="selectedMonth" @change="fetchExpenses" placeholder="Select month">
            <el-option v-for="month in months" :key="month" :label="month" :value="month" />
          </el-select>
        </el-form-item>
      </div>
    </div>

    <Table
      downloadTitle="Personal_Expenses"
      :rows="expenses"
      :keys="keys"
      :dataRef="content"
      :reportMonth="selectedMonth"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Filter } from '@element-plus/icons-vue'
import Table from '../Table.vue'
import { SalaryExpenseList } from '../../scripts/salary-expense-list'

const { formatAmount, selectedMonth, expenses, keys, totalSpent, remaining, months, content, fetchExpenses } = SalaryExpenseList()
const showFilters = ref(false)
</script>

<style scoped>
.sel-stats {
  display: flex;
  align-items: stretch;
  background: var(--card-bg, var(--bg-secondary));
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.07);
}
.sel-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.85rem 0.5rem;
  gap: 4px;
  min-width: 0;
}
.sel-stat-end { align-items: flex-end; padding-right: 1rem; }
@media (max-width: 480px) {
  .sel-stat-end { display: none; }
}
.sel-divider {
  width: 1px;
  background: var(--border-color);
  margin: 8px 0;
  align-self: stretch;
}
.sel-stat-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.sel-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.sel-month {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.sel-danger { color: #ef4444; }
.sel-success { color: #22c55e; }
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
