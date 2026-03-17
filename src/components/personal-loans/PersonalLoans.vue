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
        :gutter="5"
        class="filter-bar mb-3 mt-4 no-print-pdf"
        :class="showFilters ? '' : 'hidden sm:flex'"
      >
        <el-col :lg="6" :md="6" :sm="12" :xs="12">
          <el-form-item label="Month" class="w-full">
            <el-select
              filterable
              v-model="selectedMonth"
              placeholder="Select Month"
              class="w-full"
              @change="fetchLoans"
              size="small"
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
        <el-col :lg="6" :md="6" :sm="12" :xs="12">
          <el-form-item label="Giver" class="w-full">
            <el-select
              filterable
              clearable
              v-model="selectedGiver"
              placeholder="All Givers"
              class="w-full"
              size="small"
            >
              <el-option value="All" label="All Givers" />
              <el-option
                v-for="opt in giverOptions"
                :key="opt.mobile"
                :value="opt.mobile"
                :label="opt.name"
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
            <span class="font-semibold text-sm lg:text-base px-2"
              >Loan Summary</span
            >
          </template>
          <div class="space-y-4 pb-2">
            <el-descriptions :column="isMobileScreen ? 1 : 2" :border="true">
              <el-descriptions-item label="Total Lent">
                <span class="text-green-500 font-bold">{{
                  formatAmount(totalLending)
                }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Total Borrowed">
                <span class="text-red-500 font-bold">{{
                  formatAmount(totalDebting)
                }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Overall Balance">
                <span
                  :class="netPosition >= 0 ? 'text-green-500' : 'text-red-500'"
                  class="font-bold"
                >
                  {{ netPosition >= 0 ? 'Will Receive' : 'Will Pay' }} -
                  {{ formatAmount(Math.abs(netPosition)) }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="Total Transactions">
                <span class="font-bold">{{ filteredLoans.length }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <!-- Charts -->
            <div
              v-if="filteredLoans.length > 0"
              class="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <!-- Lending vs Debting donut -->
              <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <DonutChart
                  title="Lent vs Borrowed"
                  :segments="lendingDebtingSegments"
                />
              </div>

              <!-- Per-person settlement bar -->
              <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <BarChart
                  title="Settlement per Person"
                  :items="settlementBarItems"
                />
              </div>
            </div>
          </div>
        </el-collapse-item>

        <!-- Who Owes Whom -->
        <el-collapse-item name="settlements">
          <template #title>
            <span class="font-semibold text-sm lg:text-base px-2"
              >Who Pays Whom</span
            >
          </template>
          <el-table :data="pairwiseSettlements" border>
            <el-table-column prop="from" label="Pays">
              <template #default="{ row }">
                <span class="text-red-600 dark:text-red-400 font-medium">{{
                  row.from
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="to" label="Receives">
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
        :rows="filteredLoans"
        :keys="loanKeys"
        :dataRef="loanContent"
        :showPopup="true"
        :reportMonth="selectedMonth"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMobileScreen } from '../../utils/useMobileScreen'
import { Filter } from '@element-plus/icons-vue'
import LoanForm from '../LoanForm.vue'
import Table from '../Table.vue'
import { PersonalLoans } from '../../scripts/personal-loans'
import DonutChart from '../generic-components/DonutChart.vue'
import BarChart from '../generic-components/BarChart.vue'

const {
  formatAmount,
  loanKeys,
  loanContent,
  selectedMonth,
  selectedGiver,
  giverOptions,
  filteredLoans,
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

const lendingDebtingSegments = computed(() => [
  {
    label: 'You Lent',
    value: totalLending.value,
    formatted: formatAmount(totalLending.value)
  },
  {
    label: 'You Borrowed',
    value: totalDebting.value,
    formatted: formatAmount(totalDebting.value)
  }
])

const settlementBarItems = computed(() =>
  pairwiseSettlements.value.map((s) => ({
    label: `${s.from} → ${s.to}`,
    value: s.amount,
    formatted: formatAmount(s.amount)
  }))
)
</script>

<style scoped>
.mt-6 {
  margin-top: 24px;
}
</style>
