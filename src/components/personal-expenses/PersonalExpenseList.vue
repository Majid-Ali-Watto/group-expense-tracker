<template>
  <div class="w-full" ref="content">
    <LoadingSkeleton v-if="isContentLoading" mode="page" />
    <template v-else>
      <PersonalExpenseStats
        class="no-print-pdf"
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

      <div class="pdf-only-summary personal-expenses-pdf" style="display: none">
        <table class="pdf-report-table">
          <thead>
            <tr>
              <th colspan="2">{{ t('personalExpenses.expenseDetails') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ t('common.month') }}</td>
              <td>{{ selectedMonth }}</td>
            </tr>
            <tr>
              <td>{{ t('personalExpenses.monthlySalary') }}</td>
              <td>{{ formatAmount(salary) }}</td>
            </tr>
            <tr>
              <td>{{ t('personalExpenses.totalSpent') }}</td>
              <td class="amount-negative">{{ formatAmount(totalSpent) }}</td>
            </tr>
            <tr>
              <td>{{ t('personalExpenses.remaining') }}</td>
              <td
                :class="remaining >= 0 ? 'amount-positive' : 'amount-negative'"
              >
                {{ formatAmount(remaining) }}
              </td>
            </tr>
            <tr>
              <td>{{ t('common.transactions') }}</td>
              <td>{{ filteredExpenses.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Table
        :downloadTitle="t('personalExpenses.personalExpensesDownload')"
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  formatAmount,
  selectedMonth,
  expenses,
  filteredExpenses,
  keys,
  salary,
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

.personal-expenses-pdf {
  margin-bottom: 18px;
  font-family: Poppins, sans-serif;
}

.pdf-report-table {
  width: 100%;
  margin-bottom: 14px;
  border-collapse: collapse;
  font-size: 12px;
}

.pdf-report-table th {
  padding: 8px 12px;
  border: 1px solid #16a34a;
  background: #22c55e;
  color: #ffffff;
  font-weight: 700;
  text-align: left;
  letter-spacing: 0.04em;
}

.pdf-report-table td {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  text-align: left;
  word-break: break-word;
}

.pdf-report-table tbody tr:nth-child(odd) td {
  background: #f9fafb;
}

.amount-positive {
  color: #16a34a !important;
  font-weight: 700;
}

.amount-negative {
  color: #dc2626 !important;
  font-weight: 700;
}
</style>
