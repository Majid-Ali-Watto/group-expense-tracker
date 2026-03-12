<template>
  <div>
    <LoanForm
      db-ref="personal-loans"
      :isPersonal="true"
      :showForm="showLoanForm"
      @close-form="closeLoanForm"
    />

    <div ref="loanContent">
      <!-- Month Filter -->
      <div class="flex items-center justify-between mb-2 mt-4 no-print-pdf">
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
      <el-row
        :gutter="20"
        class="filter-bar mb-3 mt-4 no-print-pdf"
        :class="showFilters ? '' : 'hidden sm:flex'"
      >
        <el-col :lg="8" :md="12" :sm="24">
          <el-form-item label="Select Month" class="w-full">
            <el-select
              filterable
              v-model="selectedMonth"
              placeholder="Select Month"
              class="w-full"
              @change="fetchLoans"
            >
              <el-option value="All" label="All Months" />
              <el-option
                v-for="month in months"
                :key="month"
                :value="month"
                :label="month"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- Accordions -->
      <el-collapse v-model="openPanels" class="mt-4">
        <!-- Summary Statistics -->
        <el-collapse-item name="summary">
          <template #title>
            <span class="font-semibold text-sm lg:text-base px-2">Loan Summary</span>
          </template>
          <el-descriptions
            :column="isMobileScreen ? 1 : 2"
            :border="true"
          >
            <el-descriptions-item label="Total Lending">
              <span class="text-green-500 font-bold">{{
                formatAmount(totalLending)
              }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Total Debting">
              <span class="text-red-500 font-bold">{{
                formatAmount(totalDebting)
              }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Expenses Summary">
              <span
                :class="netPosition >= 0 ? 'text-green-500' : 'text-red-500'"
                class="font-bold"
              >
                {{ netPosition >= 0 ? 'Lender' : 'Debtor' }} -
                {{ formatAmount(Math.abs(netPosition)) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="Total Transactions">
              <span class="font-bold">{{ loans.length }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-collapse-item>

        <!-- Who Owes Whom -->
        <el-collapse-item name="settlements">
          <template #title>
            <span class="font-semibold text-sm lg:text-base px-2">Who Owes Whom (Exact)</span>
          </template>
          <el-table :data="pairwiseSettlements" border>
            <el-table-column prop="from" label="Debtor">
              <template #default="{ row }">
                <span class="text-red-600 dark:text-red-400 font-medium">{{
                  row.from
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="to" label="Lender">
              <template #default="{ row }">
                <span class="text-green-600 dark:text-green-400 font-medium">{{
                  row.to
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Amount">
              <template #default="{ row }">
                <span class="text-orange-600 dark:text-orange-400 font-bold">{{
                  formatAmount(row.amount)
                }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>

      <!-- ===== LOANS ===== -->
      <h2 class="mt-6">Loan Records</h2>

      <Table
        downloadTitle="Personal_Loans"
        :rows="loans"
        :keys="loanKeys"
        :dataRef="loanContent"
        :showPopup="true"
        :reportMonth="selectedMonth"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMobileScreen } from '../../utils/useMobileScreen'
import { Filter } from '@element-plus/icons-vue'
import LoanForm from '../LoanForm.vue'
import Table from '../Table.vue'
import { PersonalLoans } from '../../scripts/personal-loans'

const {
  formatAmount,
  loans,
  loanKeys,
  loanContent,
  selectedMonth,
  months,
  showLoanForm,
  closeLoanForm,
  totalLending,
  totalDebting,
  netPosition,
  pairwiseSettlements
} = PersonalLoans()

const showFilters = ref(false)
const openPanels = ref(['summary', 'settlements'])
const { isMobileScreen } = useMobileScreen()
</script>

<style scoped>
.mt-6 {
  margin-top: 24px;
}

</style>
