<!-- Reusable balance summary table used in Loans and Settlement -->
<template>
  <div class="bsc-table">
    <!-- Header (hidden on mobile) -->
    <div class="bsc-header">
      <span v-for="col in columns" :key="col.key">{{ col.label }}</span>
    </div>

    <!-- Rows -->
    <div v-for="(row, i) in rows" :key="i" class="bsc-row">
      <div v-for="col in columns" :key="col.key" class="bsc-cell">
        <span class="bsc-mobile-label">{{ col.label }}</span>
        <span :class="getCellClass(col, row)" class="bsc-value">{{
          getCellValue(col, row)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * Array of column definitions:
   * { key: string, label: string, class?: string | (row) => string, format?: (row) => string }
   */
  columns: { type: Array, required: true },
  /** Array of plain data objects */
  rows: { type: Array, required: true }
})

function getCellValue(col, row) {
  return col.format ? col.format(row) : (row[col.key] ?? '')
}

function getCellClass(col, row) {
  if (!col.class) return ''
  return typeof col.class === 'function' ? col.class(row) : col.class
}
</script>

<style scoped>
.bsc-table {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* Header */
.bsc-header {
  display: flex;
  background: var(--bg-secondary);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  gap: 0;
}
.bsc-header > span {
  flex: 1;
}

/* Data rows */
.bsc-row {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  gap: 0;
}
.bsc-row:hover {
  background: var(--hover-bg);
}

.bsc-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  word-break: break-word;
}

.bsc-value {
  font-weight: 500;
}

/* Mobile label hidden on desktop */
.bsc-mobile-label {
  display: none;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

/* ── Below 640px: card/column layout ──── */
@media (max-width: 639px) {
  .bsc-header {
    display: none;
  }

  .bsc-row {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .bsc-cell {
    width: 100%;
  }

  .bsc-mobile-label {
    display: block;
  }
}
</style>
