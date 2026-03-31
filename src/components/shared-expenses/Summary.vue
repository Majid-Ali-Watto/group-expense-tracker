<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <el-collapse v-model="activePanel" class="my-4">
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
          <!-- Equal splits: show a simple average -->
          <el-descriptions-item
            v-if="!hasCustomSplits"
            label="Average Per Person"
          >
            {{ formatAmount(averageSpent) }}
          </el-descriptions-item>

          <!-- Custom splits: show each person's actual owed total -->
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
          <!-- Who paid what — donut -->
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <DonutChart title="Who Paid" :segments="chartPayerSegments" />
          </div>

          <!-- Per-person owed (custom splits) OR payer comparison (equal splits) -->
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
</template>

<script setup>
import { ref } from 'vue'
import { useMobileScreen } from '../../composables/useMobileScreen'
import { Summary } from '../../scripts/shared-expenses/summary'
import { loadAsyncComponent } from '../../utils/async-component'
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
