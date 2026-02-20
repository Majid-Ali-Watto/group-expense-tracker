<template>
  <div class="my-4">
    <div class="w-full mx-auto">
      <el-descriptions
        direction="vertical"
        title="Expense Summary"
        :column="2"
        :border="true"
      >
        <el-descriptions-item label="Total Spent">
          {{ formatAmount(totalSpent) }}
        </el-descriptions-item>
        <el-descriptions-item label="Average Per Person">
          {{ formatAmount(averageSpent) }}
        </el-descriptions-item>
        <template v-for="(friend, index) in friendTotals" :key="index">
          <el-descriptions-item :label="`${friend.name} Paid`">
            {{ formatAmount(friend.total) }}
          </el-descriptions-item>
        </template>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { Summary } from '../scripts/summary'

const props = defineProps({
  payments: Array
})

const { formatAmount, totalSpent, averageSpent, friendTotals } = Summary(props)
</script>
