<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- Normal app view (hidden in PDF) -->
  <el-collapse v-model="activePanel" class="my-4 no-print-pdf">
    <el-collapse-item name="expense-summary">
      <template #title>
        <span class="font-semibold text-sm lg:text-base px-2"
          >Expense Summary</span
        >
      </template>

      <div class="w-full mx-auto px-2 pb-4 space-y-4">
        <!-- Text descriptions -->
        <el-descriptions
          direction="vertical"
          :column="isMobileScreen ? 1 : 2"
          :border="true"
        >
          <el-descriptions-item label="Total Spent">
            {{ formatAmount(totalSpent) }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="!hasCustomSplits"
            label="Average Per Person"
          >
            {{ formatAmount(averageSpent) }}
          </el-descriptions-item>
          <template v-if="hasCustomSplits">
            <el-descriptions-item
              v-for="(person, i) in perPersonOwed"
              :key="i"
              :label="`${person.name}'s Expense`"
            >
              {{ formatAmount(person.amount) }}
            </el-descriptions-item>
          </template>
          <template v-for="(friend, index) in friendTotals" :key="index">
            <el-descriptions-item :label="`${friend.name} Paid`">
              {{ formatAmount(friend.total) }}
            </el-descriptions-item>
          </template>
        </el-descriptions>

        <!-- Charts -->
        <div
          v-if="totalSpent > 0"
          class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2"
        >
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <DonutChart title="Who Paid" :segments="chartPayerSegments" />
          </div>
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <BarChart
              :title="
                hasCustomSplits ? 'Each Person Pays' : 'Amount Paid per Person'
              "
              :items="chartBarItems"
            />
          </div>
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>

  <!-- PDF-only summary: plain HTML table, always hidden in the app.
       _downloadPdf shows this and hides the el-collapse above. -->
  <div class="pdf-only-summary" style="display:none">
    <table
      style="width:100%;border-collapse:collapse;font-family:Poppins,sans-serif;font-size:13px;margin-bottom:12px;"
    >
      <thead>
        <tr>
          <th
            colspan="2"
            style="text-align:left;padding:8px 12px;background:#22c55e;color:#fff;font-size:13px;font-weight:700;border:1px solid #16a34a;letter-spacing:.04em;"
          >
            Expense Summary
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th
            style="padding:8px 12px;border:1px solid #d1d5db;background:#f5f7fa;color:#111827;font-weight:600;font-size:12px;text-align:left;width:40%;"
          >
            Total Spent
          </th>
          <td
            style="padding:8px 12px;border:1px solid #d1d5db;background:#ffffff;color:#111827;font-size:13px;"
          >
            {{ formatAmount(totalSpent) }}
          </td>
        </tr>
        <tr v-if="!hasCustomSplits">
          <th
            style="padding:8px 12px;border:1px solid #d1d5db;background:#f5f7fa;color:#111827;font-weight:600;font-size:12px;text-align:left;"
          >
            Average Per Person
          </th>
          <td
            style="padding:8px 12px;border:1px solid #d1d5db;background:#ffffff;color:#111827;font-size:13px;"
          >
            {{ formatAmount(averageSpent) }}
          </td>
        </tr>
        <template v-if="hasCustomSplits">
          <tr v-for="(person, i) in perPersonOwed" :key="'p' + i">
            <th
              style="padding:8px 12px;border:1px solid #d1d5db;background:#f5f7fa;color:#111827;font-weight:600;font-size:12px;text-align:left;"
            >
              {{ person.name }}'s Expense
            </th>
            <td
              style="padding:8px 12px;border:1px solid #d1d5db;background:#ffffff;color:#111827;font-size:13px;"
            >
              {{ formatAmount(person.amount) }}
            </td>
          </tr>
        </template>
        <tr v-for="(friend, i) in friendTotals" :key="'f' + i">
          <th
            style="padding:8px 12px;border:1px solid #d1d5db;background:#f5f7fa;color:#111827;font-weight:600;font-size:12px;text-align:left;"
          >
            {{ friend.name }} Paid
          </th>
          <td
            style="padding:8px 12px;border:1px solid #d1d5db;background:#ffffff;color:#111827;font-size:13px;"
          >
            {{ formatAmount(friend.total) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMobileScreen } from '@/composables'
import { Summary } from '@/scripts/shared-expenses'
import { loadAsyncComponent } from '@/utils'
const DonutChart = loadAsyncComponent(
  () => import('../generic-components/DonutChart.vue')
)
const BarChart = loadAsyncComponent(
  () => import('../generic-components/BarChart.vue')
)

const props = defineProps({
  payments: Array
})

const activePanel = ref([])
const { isMobileScreen } = useMobileScreen()

const {
  formatAmount,
  totalSpent,
  averageSpent,
  hasCustomSplits,
  perPersonOwed,
  friendTotals,
  chartPayerSegments,
  chartBarItems
} = Summary(props)
</script>
