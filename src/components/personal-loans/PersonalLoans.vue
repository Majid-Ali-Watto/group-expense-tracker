<template>
  <div>
    <LoadingSkeleton v-if="isContentLoading" mode="page" />
    <template v-else>
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
        <div
          :gutter="5"
          class="filter-bar mb-3 mt-4 no-print-pdf"
          :class="showFilters ? 'flex sm:flex' : 'hidden sm:flex'"
        >
          <el-col :lg="6" :md="6" :sm="12" :xs="12">
            <GenericDropDown
              v-model="selectedMonth"
              label="Month"
              placeholder="Select Month"
              :options="[{ label: 'All Months', value: 'All' }, ...months]"
              size="small"
              @update:modelValue="fetchLoans"
            />
          </el-col>
          <el-col :lg="6" :md="6" :sm="12" :xs="12">
            <GenericDropDown
              v-model="selectedGiver"
              label="Giver"
              placeholder="All Givers"
              :options="[
                { label: 'All Givers', value: 'All' },
                ...giverOptions.map((o) => ({ label: o.name, value: o.mobile }))
              ]"
              size="small"
            />
          </el-col>
        </div>
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
                    :class="
                      netPosition >= 0 ? 'text-green-500' : 'text-red-500'
                    "
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
            <BalanceSummaryCard
              :columns="settlementColumns"
              :rows="pairwiseSettlements"
            />
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMobileScreen } from '@/composables'
import { Filter, Close } from '@element-plus/icons-vue'
import { Table, BalanceSummaryCard, LoadingSkeleton } from '@/components/shared'
import { GenericDropDown } from '@/components/generic-components'
import { PersonalLoans } from '@/scripts/personal-loans'
import { loadAsyncComponent } from '@/utils'
const LoanForm = loadAsyncComponent(
  () => import('../shared-loans/LoanForm.vue')
)
const DonutChart = loadAsyncComponent(
  () => import('../generic-components/DonutChart.vue')
)
const BarChart = loadAsyncComponent(
  () => import('../generic-components/BarChart.vue')
)

const {
  formatAmount,
  loanKeys,
  loanContent,
  selectedMonth,
  selectedGiver,
  isContentLoading,
  giverOptions,
  filteredLoans,
  months,
  showLoanForm,
  closeLoanForm,
  fetchLoans,
  totalLending,
  totalDebting,
  netPosition,
  pairwiseSettlements,
  clearFilters
} = PersonalLoans()

const showFilters = ref(false)
const openPanels = ref([])
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

const settlementColumns = [
  {
    key: 'from',
    label: 'Pays',
    class: 'text-red-500 font-medium'
  },
  {
    key: 'to',
    label: 'Receives',
    class: 'text-green-600 font-medium'
  },
  {
    key: 'amount',
    label: 'Amount',
    class: 'text-orange-500 font-bold',
    format: (row) => formatAmount(row.amount)
  }
]
</script>

<style scoped>
.mt-6 {
  margin-top: 24px;
}
</style>
