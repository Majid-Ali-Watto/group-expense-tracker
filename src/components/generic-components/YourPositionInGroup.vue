<template>
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-semibold text-gray-600">Your Position</span>
      <el-tag size="small" type="info">{{
        userStore.getUserByMobile(userStore.getActiveUser)?.name ||
        userStore.getActiveUser
      }}</el-tag>
    </div>
    <div v-if="balance.loading" class="text-xs text-gray-500">
      Calculating...
    </div>
    <div v-else class="space-y-2 text-sm">
      <div class="flex items-center justify-between">
        <span class="text-gray-700">Shared Expenses</span>
        <el-tag :type="expenseState.type" size="small">
          {{ expenseState.label }}
        </el-tag>
        <span class="font-semibold" :class="expenseState.textClass">
          Rs. {{ expenseState.abs }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-gray-700">Shared Loans</span>
        <el-tag :type="loanState.type" size="small">
          {{ loanState.label }}
        </el-tag>
        <span class="font-semibold" :class="loanState.textClass">
          Rs. {{ loanState.abs }}
        </span>
      </div>
      <el-divider class="!my-2" />
      <div class="flex items-center justify-between">
        <span class="text-gray-800 font-medium">Net Amount</span>
        <el-tag :type="netState.type" size="small">
          {{ netState.label }}
        </el-tag>
        <span class="font-semibold" :class="netState.textClass">
          Rs. {{ netState.abs }}
        </span>
      </div>
    </div>
    <div class="text-[11px] text-gray-500 mt-2">
      Only visible to you. Calculated from your share, payments, and loans in
      this group.
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { store } from '../../stores/store'

const userStore = store()

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  getGroupBalances: {
    type: Function,
    required: true
  }
})

const balance = computed(() => props.getGroupBalances(props.group.id) || {})

const makeState = (val, { pos = 'Lender', neg = 'Debtor', zero = 'Settled' } = {}) => {
  const num = Number(val || 0)
  return {
    type: num > 0 ? 'success' : num < 0 ? 'danger' : 'info',
    label: num > 0 ? pos : num < 0 ? neg : zero,
    abs: Math.abs(num).toFixed(2),
    textClass: num < 0 ? 'text-red-600' : 'text-green-700'
  }
}

const expenseState = computed(() => makeState(balance.value.expenses))
const loanState = computed(() => makeState(balance.value.loans))
const netState = computed(() =>
  makeState((balance.value.expenses || 0) + (balance.value.loans || 0), {
    pos: 'You Receive',
    neg: 'You Owe',
    zero: 'Settled'
  })
)
</script>
