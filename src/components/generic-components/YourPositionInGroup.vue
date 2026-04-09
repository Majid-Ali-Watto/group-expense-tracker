<template>
  <div class="your-position-card">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-semibold position-title">Your Position</span>
      <el-tag size="small" type="info">{{ currentUserLabel }}</el-tag>
    </div>
    <div v-if="balance.loading" class="text-xs position-text">
      Calculating...
    </div>
    <div v-else class="space-y-2 text-sm">
      <div class="flex justify-between gap-2">
        <span class="position-text shrink-0">Shared Expenses</span>
        <div class="flex items-center gap-1.5 flex-wrap justify-end">
          <el-tag
            :type="expenseState.type"
            size="small"
            :class="expenseState.customClass"
          >
            {{ expenseState.label }}
          </el-tag>
          <span class="font-semibold" :class="expenseState.textClass">
            Rs. {{ expenseState.abs }}
          </span>
        </div>
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="position-text shrink-0">Shared Loans</span>
        <div class="flex items-center gap-1.5 flex-wrap justify-end">
          <el-tag
            :type="loanState.type"
            size="small"
            :class="loanState.customClass"
          >
            {{ loanState.label }}
          </el-tag>
          <span class="font-semibold" :class="loanState.textClass">
            Rs. {{ loanState.abs }}
          </span>
        </div>
      </div>
      <el-divider class="!my-2" />
      <div class="flex items-center justify-between gap-2">
        <span class="position-label shrink-0">Net Amount</span>
        <div class="flex items-center gap-1.5 flex-wrap justify-end">
          <el-tag
            :type="netState.type"
            size="small"
            :class="netState.customClass"
          >
            {{ netState.label }}
          </el-tag>
          <span class="font-bold text-base" :class="netState.textClass">
            Rs. {{ netState.abs }}
          </span>
        </div>
      </div>
    </div>
    <div class="text-[11px] position-hint mt-2">
      Only visible to you. Calculated from your share, payments, and loans in
      this group.
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useAuthStore, useUserStore } from '@/stores'

const authStore = useAuthStore()
const userStore = useUserStore()

const currentUserLabel = computed(() => {
  const u = userStore.getUserByMobile(authStore.getActiveUser)
  return u ? `${u.name} (${u.mobile})` : authStore.getActiveUser
})

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

const makeState = (
  val,
  { pos = 'Will Receive', neg = 'Will Pay', zero = 'Settled' } = {}
) => {
  const num = Number(val || 0)
  return {
    type: num > 0 ? 'success' : num < 0 ? 'danger' : 'info',
    label: num > 0 ? pos : num < 0 ? neg : zero,
    abs: Math.abs(num).toFixed(2),
    textClass:
      num < 0
        ? 'text-red-600 dark:text-red-400'
        : num > 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-gray-600 dark:text-gray-400',
    customClass: num < 0 ? 'tag-owe' : num > 0 ? 'tag-receive' : ''
  }
}

const expenseState = computed(() => makeState(balance.value.expenses))
const loanState = computed(() => makeState(balance.value.loans))
const netState = computed(() =>
  makeState((balance.value.expenses || 0) + (balance.value.loans || 0), {
    pos: 'You Get',
    neg: 'You Pay',
    zero: 'Settled'
  })
)
</script>

<style scoped>
.your-position-card {
  background-color: #f9fafb !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

:root.dark-theme .your-position-card {
  background-color: #1f2937 !important;
  border-color: #4b5563 !important;
}

.position-title {
  color: #374151 !important;
}

:root.dark-theme .position-title {
  color: #d1d5db !important;
}

.position-text {
  color: #374151 !important;
}

:root.dark-theme .position-text {
  color: #d1d5db !important;
}

.position-label {
  color: #1f2937 !important;
  font-weight: 500;
}

:root.dark-theme .position-label {
  color: #e5e7eb !important;
}

.position-hint {
  color: #6b7280 !important;
}

:root.dark-theme .position-hint {
  color: #9ca3af !important;
}

/* Custom tag styling for You Owe (Red) */
.tag-owe {
  background-color: #fee2e2 !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
  font-weight: 600 !important;
}

:root.dark-theme .tag-owe {
  background-color: #7f1d1d !important;
  color: #fca5a5 !important;
  border-color: #991b1b !important;
}

/* Custom tag styling for You Receive (Green) */
.tag-receive {
  background-color: #dcfce7 !important;
  color: #166534 !important;
  border-color: #86efac !important;
  font-weight: 600 !important;
}

:root.dark-theme .tag-receive {
  background-color: #14532d !important;
  color: #86efac !important;
  border-color: #166534 !important;
}

/* Lender and Debtor tags styling */
.el-tag--danger.tag-owe,
.el-tag--success.tag-receive {
  font-weight: 600;
}
</style>
