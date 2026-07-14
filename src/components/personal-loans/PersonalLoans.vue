<template>
  <div>
    <LoadingSkeleton v-if="isContentLoading" mode="page" />
    <template v-else>
      <LoanForm
        db-ref="personal-loans"
        :isPersonal="true"
        :showForm="showLoanForm"
        @close-form="onFormClose"
      />

      <div ref="loanContent">
        <!-- Filters -->
        <FilterBar
          :fields="filterFields"
          class="mt-4 no-print-pdf"
          @clear="clearFilters"
        />
        <!-- Accordions -->
        <el-collapse v-model="openPanels" class="mt-4">
          <!-- Summary Statistics -->
          <el-collapse-item name="summary">
            <template #title>
              <span class="font-semibold text-sm lg:text-base px-2"
                >{{ t('personalLoans.loanSummary') }}</span
              >
            </template>
            <div class="space-y-4 pb-2">
              <el-descriptions :column="isMobileScreen ? 1 : 2" :border="true">
                <el-descriptions-item :label="t('personalLoans.totalLent')">
                  <span class="text-green-500 font-bold">{{
                    formatAmount(totalLending)
                  }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('personalLoans.totalBorrowed')">
                  <span class="text-red-500 font-bold">{{
                    formatAmount(totalDebting)
                  }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('personalLoans.overallBalance')">
                  <span
                    :class="
                      netPosition >= 0 ? 'text-green-500' : 'text-red-500'
                    "
                    class="font-bold"
                  >
                    {{
                      netPosition >= 0
                        ? t('sharedLoans.willReceive')
                        : t('sharedLoans.willPay')
                    }}
                    -
                    {{ formatAmount(Math.abs(netPosition)) }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item
                  :label="t('personalLoans.totalTransactions')"
                >
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
                    :title="t('personalLoans.lentVsBorrowed')"
                    :segments="lendingDebtingSegments"
                  />
                </div>

                <!-- Per-person settlement bar -->
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <BarChart
                    :title="t('personalLoans.settlementPerPerson')"
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
                >{{ t('personalLoans.whoPaysWhom') }}</span
              >
            </template>
            <BalanceSummaryCard
              :columns="settlementColumns"
              :rows="pairwiseSettlements"
            />
          </el-collapse-item>
        </el-collapse>

        <!-- ===== LOANS ===== -->
        <h2 class="mt-6">{{ t('personalLoans.loanRecords') }}</h2>

        <Table
          :downloadTitle="t('personalLoans.personalLoansDownload')"
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
import { useI18n } from 'vue-i18n'
import { useMobileScreen } from '@/composables'
import { Table, BalanceSummaryCard, LoadingSkeleton } from '@/components/shared'
import { FilterBar } from '@/components/generic-components'
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
const { t } = useI18n()

const {
  formatAmount,
  loanKeys,
  loanContent,
  selectedMonth,
  isContentLoading,
  filteredLoans,
  showLoanForm,
  closeLoanForm,
  fetchMonths,
  fetchLoans,
  totalLending,
  totalDebting,
  netPosition,
  pairwiseSettlements,
  filterFields,
  clearFilters
} = PersonalLoans()

const onFormClose = () => {
  closeLoanForm()
  fetchMonths()
  fetchLoans()
}

const openPanels = ref([])
const { isMobileScreen } = useMobileScreen()

const lendingDebtingSegments = computed(() => [
  {
    label: t('personalLoans.youLent'),
    value: totalLending.value,
    formatted: formatAmount(totalLending.value)
  },
  {
    label: t('personalLoans.youBorrowed'),
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

const settlementColumns = computed(() => [
  {
    key: 'from',
    label: t('personalLoans.pays'),
    class: 'text-red-500 font-medium'
  },
  {
    key: 'to',
    label: t('personalLoans.receives'),
    class: 'text-green-600 font-medium'
  },
  {
    key: 'amount',
    label: t('common.amount'),
    class: 'text-orange-500 font-bold',
    format: (row) => formatAmount(row.amount)
  }
])
</script>

<style scoped>
.mt-6 {
  margin-top: 24px;
}
</style>
