<template>
  <el-dialog
    v-model="visible"
    title="Your Expenses Summary"
    :width="isMobile ? '95%' : '600px'"
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
        <div v-if="summary.totalLender + summary.totalDebtor > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <DonutChart :segments="overallDonutSegments" />
        </div>
      </div>

      <!-- Shared Expenses -->
      <div class="section-card">
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
      <div class="section-card">
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
      <div class="section-card">
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
      <div v-if="summary.totalLender + summary.totalDebtor > 0" class="section-card">
        <div class="section-header">Category Breakdown</div>
        <BarChart title="To Receive (↑) vs To Pay (↓) per Category" :items="categoryBarItems" />
      </div>
    </div>

    <template #footer>
      <el-button type="success" @click="downloadPdf" :disabled="!summary">Download PDF</el-button>
      <el-button @click="handleClose">Close</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import DonutChart from './DonutChart.vue'
import BarChart from './BarChart.vue'
import { downloadPDF } from '../../utils/downloadDataProcedures'
import getCurrentMonth from '../../utils/getCurrentMonth'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  summary: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const formatAmount = inject('formatAmount')
const isMobile = ref(window.innerWidth < 768)
const netPositionContent = ref(null)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleClose = () => {
  visible.value = false
}

async function downloadPdf() {
  if (!netPositionContent.value) return
  const el = netPositionContent.value
  const lightVars = {
    '--el-bg-color': '#ffffff',
    '--el-text-color-primary': '#1f2937',
    '--el-text-color-regular': '#374151',
    '--el-border-color': '#e5e7eb',
    '--el-border-color-lighter': '#f3f4f6',
    '--el-fill-color-lighter': '#f9fafb',
    '--el-color-success': '#22c55e',
    '--el-color-warning': '#f59e0b',
  }
  const prevBg = el.style.backgroundColor
  const prevColor = el.style.color
  const prevMaxHeight = el.style.maxHeight
  const prevOverflow = el.style.overflow
  Object.entries(lightVars).forEach(([k, v]) => el.style.setProperty(k, v))
  el.style.backgroundColor = '#ffffff'
  el.style.color = '#1f2937'
  el.style.maxHeight = 'none'
  el.style.overflow = 'visible'
  await downloadPDF(el, `${getCurrentMonth()}_Net_Position_`, 'Expenses Summary')
  Object.keys(lightVars).forEach((k) => el.style.removeProperty(k))
  el.style.backgroundColor = prevBg
  el.style.color = prevColor
  el.style.maxHeight = prevMaxHeight
  el.style.overflow = prevOverflow
}

const overallDonutSegments = computed(() => [
  { label: 'You Will Receive', value: props.summary?.totalLender ?? 0, formatted: formatAmount(props.summary?.totalLender ?? 0) },
  { label: 'You Will Pay', value: props.summary?.totalDebtor ?? 0, formatted: formatAmount(props.summary?.totalDebtor ?? 0) }
])

const categoryBarItems = computed(() => {
  if (!props.summary) return []
  const s = props.summary
  return [
    { label: 'Shared Exp ↑', value: s.sharedExpenses.lenderAmount, formatted: formatAmount(s.sharedExpenses.lenderAmount) },
    { label: 'Shared Exp ↓', value: s.sharedExpenses.debtorAmount, formatted: formatAmount(s.sharedExpenses.debtorAmount) },
    { label: 'Shared Loan ↑', value: s.sharedLoans.lenderAmount, formatted: formatAmount(s.sharedLoans.lenderAmount) },
    { label: 'Shared Loan ↓', value: s.sharedLoans.debtorAmount, formatted: formatAmount(s.sharedLoans.debtorAmount) },
    { label: 'Personal Loan ↑', value: s.personalLoans.lenderAmount, formatted: formatAmount(s.personalLoans.lenderAmount) },
    { label: 'Personal Loan ↓', value: s.personalLoans.debtorAmount, formatted: formatAmount(s.personalLoans.debtorAmount) }
  ]
})

// Handle window resize
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})
</script>

<style scoped>
.net-position-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 8px;
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
