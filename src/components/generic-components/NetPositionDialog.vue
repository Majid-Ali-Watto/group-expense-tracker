<template>
  <el-dialog
    v-model="visible"
    title="Your Expenses Summary"
    :width="isMobile ? '95%' : '600px'"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    @close="handleClose"
  >
    <div v-if="summary" ref="netPositionContent" class="net-position-content">
      <!-- Overall Summary -->
      <div class="section-card">
        <div class="section-header">Overall Summary</div>
        <div class="summary-row">
          <span class="label">You Will Receive</span>
          <span class="amount positive">{{
            formatAmount(summary.totalLender)
          }}</span>
        </div>
        <div class="summary-row">
          <span class="label">You Will Pay</span>
          <span class="amount negative">{{
            formatAmount(summary.totalDebtor)
          }}</span>
        </div>
        <div class="summary-row net-row">
          <span class="label">Net Position</span>
          <span
            class="amount"
            :class="summary.netPosition >= 0 ? 'positive' : 'negative'"
          >
            {{ formatAmount(Math.abs(summary.netPosition)) }}
            <span class="position-label">
              {{ summary.netPosition >= 0 ? '(You Get)' : '(You Pay)' }}
            </span>
          </span>
        </div>
        <!-- Overall donut chart -->
        <div
          v-if="summary.totalLender + summary.totalDebtor > 0"
          class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600"
        >
          <DonutChart :segments="overallDonutSegments" />
        </div>
      </div>

      <!-- Shared Expenses -->
      <div
        v-if="summary.includedSections?.sharedExpenses !== false"
        class="section-card"
      >
        <div class="section-header">Shared Expenses</div>
        <div class="summary-row">
          <span class="label">You Will Receive:</span>
          <span class="amount positive">{{
            formatAmount(summary.sharedExpenses.lenderAmount)
          }}</span>
        </div>
        <div class="summary-row">
          <span class="label">You Will Pay:</span>
          <span class="amount negative">{{
            formatAmount(summary.sharedExpenses.debtorAmount)
          }}</span>
        </div>
        <div class="summary-row net-row">
          <span class="label">Net for Shared Expenses:</span>
          <span
            class="amount"
            :class="
              summary.sharedExpenses.lenderAmount -
                summary.sharedExpenses.debtorAmount >=
              0
                ? 'positive'
                : 'negative'
            "
          >
            {{
              formatAmount(
                Math.abs(
                  summary.sharedExpenses.lenderAmount -
                    summary.sharedExpenses.debtorAmount
                )
              )
            }}
            <span class="position-label">
              {{
                summary.sharedExpenses.lenderAmount -
                  summary.sharedExpenses.debtorAmount >=
                0
                  ? '(You Get)'
                  : '(You Pay)'
              }}
            </span>
          </span>
        </div>
      </div>

      <!-- Shared Loans -->
      <div
        v-if="summary.includedSections?.sharedLoans !== false"
        class="section-card"
      >
        <div class="section-header">Shared Loans</div>
        <div class="summary-row">
          <span class="label">You Lent:</span>
          <span class="amount positive">{{
            formatAmount(summary.sharedLoans.lenderAmount)
          }}</span>
        </div>
        <div class="summary-row">
          <span class="label">You Borrowed:</span>
          <span class="amount negative">{{
            formatAmount(summary.sharedLoans.debtorAmount)
          }}</span>
        </div>
        <div class="summary-row net-row">
          <span class="label">Net for Shared Loans:</span>
          <span
            class="amount"
            :class="
              summary.sharedLoans.lenderAmount -
                summary.sharedLoans.debtorAmount >=
              0
                ? 'positive'
                : 'negative'
            "
          >
            {{
              formatAmount(
                Math.abs(
                  summary.sharedLoans.lenderAmount -
                    summary.sharedLoans.debtorAmount
                )
              )
            }}
            <span class="position-label">
              {{
                summary.sharedLoans.lenderAmount -
                  summary.sharedLoans.debtorAmount >=
                0
                  ? '(You Get)'
                  : '(You Pay)'
              }}
            </span>
          </span>
        </div>
      </div>

      <!-- Personal Loans -->
      <div
        v-if="summary.includedSections?.personalLoans !== false"
        class="section-card"
      >
        <div class="section-header">Personal Loans</div>
        <div class="summary-row">
          <span class="label">You Lent:</span>
          <span class="amount positive">{{
            formatAmount(summary.personalLoans.lenderAmount)
          }}</span>
        </div>
        <div class="summary-row">
          <span class="label">You Borrowed:</span>
          <span class="amount negative">{{
            formatAmount(summary.personalLoans.debtorAmount)
          }}</span>
        </div>
        <div class="summary-row net-row">
          <span class="label">Net for Personal Loans:</span>
          <span
            class="amount"
            :class="
              summary.personalLoans.lenderAmount -
                summary.personalLoans.debtorAmount >=
              0
                ? 'positive'
                : 'negative'
            "
          >
            {{
              formatAmount(
                Math.abs(
                  summary.personalLoans.lenderAmount -
                    summary.personalLoans.debtorAmount
                )
              )
            }}
            <span class="position-label">
              {{
                summary.personalLoans.lenderAmount -
                  summary.personalLoans.debtorAmount >=
                0
                  ? '(You Get)'
                  : '(You Pay)'
              }}
            </span>
          </span>
        </div>
      </div>

      <!-- Category breakdown bar chart -->
      <div
        v-if="summary.totalLender + summary.totalDebtor > 0"
        class="section-card"
      >
        <div class="section-header">Category Breakdown</div>
        <BarChart
          title="To Receive (↑) vs To Pay (↓) per Category"
          :items="categoryBarItems"
        />
      </div>
    </div>

    <template #footer>
      <GenericButton type="default" size="small" @click="handleClose"
        >Close</GenericButton
      >
      <GenericButton
        type="success"
        size="small"
        :disabled="!summary"
        @click="downloadPdf"
      >
        Download PDF
      </GenericButton>
    </template>
  </el-dialog>
</template>

<script setup>
import { inject } from 'vue'
import DonutChart from './DonutChart.vue'
import BarChart from './BarChart.vue'
import GenericButton from './GenericButton.vue'
import { NetPositionDialog } from '@/scripts/generic'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  summary: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])

const formatAmount = inject('formatAmount')

const {
  isMobile,
  netPositionContent,
  visible,
  handleClose,
  downloadPdf,
  overallDonutSegments,
  categoryBarItems
} = NetPositionDialog(props, emit, formatAmount)
</script>

<style scoped>
.net-position-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 8px 0px;
}

.section-card {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
}

.section-header {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--el-border-color);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.summary-row.net-row {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color);
  font-weight: bold;
}

.summary-row .label {
  font-size: 15px;
  color: var(--el-text-color-regular);
}

.summary-row .amount {
  font-size: 18px;
  font-weight: 600;
}

.amount.positive {
  color: var(--el-color-success);
}

.amount.negative {
  color: var(--el-color-warning);
}

.position-label {
  font-size: 13px;
  font-weight: normal;
  margin-left: 8px;
  opacity: 0.85;
}

@media (max-width: 768px) {
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .summary-row .amount {
    font-size: 16px;
  }
}

/* Dark Theme Support */
:root.dark-theme .net-position-content {
  background-color: transparent;
}

:root.dark-theme .section-card {
  background: #374151;
  border-color: #4b5563;
}

:root.dark-theme .section-header {
  color: #e5e7eb;
  border-bottom-color: #4b5563;
}

:root.dark-theme .summary-row {
  border-top-color: #4b5563;
}

:root.dark-theme .summary-row .label {
  color: #d1d5db;
}

:root.dark-theme .summary-row .amount {
  color: #e5e7eb;
}

:root.dark-theme .amount.positive {
  color: #86efac;
}

:root.dark-theme .amount.negative {
  color: #fca5a5;
}

:root.dark-theme .position-label {
  color: #d1d5db;
}

/* Scrollbar styling for dark theme */
:root.dark-theme .net-position-content::-webkit-scrollbar {
  width: 8px;
}

:root.dark-theme .net-position-content::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 4px;
}

:root.dark-theme .net-position-content::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

:root.dark-theme .net-position-content::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
