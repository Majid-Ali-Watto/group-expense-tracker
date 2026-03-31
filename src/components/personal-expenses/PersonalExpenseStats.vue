<template>
  <div class="sel-stats">
    <div class="sel-stat">
      <span class="sel-stat-label">Total Spent</span>
      <span
        v-overflow-popup="{ title: 'Total Spent' }"
        class="sel-stat-value sel-danger"
      >
        {{ formattedTotalSpent }}
      </span>
    </div>
    <div class="sel-divider" />
    <div class="sel-stat">
      <span class="sel-stat-label">Remaining</span>
      <span
        v-overflow-popup="{ title: 'Remaining' }"
        class="sel-stat-value sel-success"
      >
        {{ formattedRemaining }}
      </span>
    </div>
    <div class="sel-divider" />
    <div class="sel-stat sel-stat-end">
      <span class="sel-stat-label">Transactions</span>
      <span v-overflow-popup="{ title: 'Transactions' }" class="sel-stat-value">
        {{ transactionCount }}
        <span class="sel-month">{{ selectedMonth }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalSpent: {
    type: Number,
    required: true
  },
  remaining: {
    type: Number,
    required: true
  },
  transactionCount: {
    type: Number,
    required: true
  },
  selectedMonth: {
    type: String,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  }
})

const formattedTotalSpent = computed(() => props.formatAmount(props.totalSpent))
const formattedRemaining = computed(() => props.formatAmount(props.remaining))
</script>

<style scoped>
.sel-stats {
  display: flex;
  align-items: stretch;
  background: var(--card-bg, var(--bg-secondary));
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.07);
}
.sel-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.85rem 0.5rem;
  gap: 4px;
  min-width: 0;
}
.sel-stat-end {
  align-items: flex-end;
  padding-right: 1rem;
}
@media (max-width: 480px) {
  .sel-stat-end {
    display: none;
  }
}
.sel-divider {
  width: 1px;
  background: var(--border-color);
  margin: 8px 0;
  align-self: stretch;
}
.sel-stat-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.sel-stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.sel-month {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.sel-danger {
  color: #ef4444;
}
.sel-success {
  color: #22c55e;
}
</style>
