<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <el-collapse v-model="activePanel" class="my-4">
    <el-collapse-item name="expense-summary">
      <template #title>
        <span class="font-semibold text-sm lg:text-base px-2"
          >Expense Summary</span
        >
      </template>

      <div class="w-full mx-auto px-2 pb-2">
        <el-descriptions direction="vertical" :column="2" :border="true">
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
              :label="`${person.name} Owes`"
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
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup>
import { ref } from 'vue'
import { Summary } from '../scripts/summary'

const props = defineProps({
  payments: Array
})

const activePanel = ref([])

const {
  formatAmount,
  totalSpent,
  averageSpent,
  hasCustomSplits,
  perPersonOwed,
  friendTotals
} = Summary(props)
</script>
