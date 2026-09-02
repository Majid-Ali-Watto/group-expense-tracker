<!-- Reusable balance summary table used in Loans and Settlement -->
<template>
  <div class="bsc-table">
    <!-- Header (hidden on mobile) -->
    <div class="bsc-header" :style="gridStyle">
      <span v-for="col in columns" :key="col.key">{{ col.label }}</span>
      <span v-if="hasActions">{{ actionsLabel }}</span>
    </div>

    <!-- Rows -->
    <div v-for="(row, i) in rows" :key="i" class="bsc-row">
      <div class="bsc-row-main" :style="gridStyle">
        <div v-for="col in columns" :key="col.key" class="bsc-cell">
          <span class="bsc-mobile-label">{{ col.label }}</span>
          <span :class="getCellClass(col, row)" class="bsc-value">{{
            getCellValue(col, row)
          }}</span>
          <span
            v-if="getCellSubtext(col, row)"
            class="bsc-subtext"
            :class="[
              getCellSubtextClass(col, row),
              { 'bsc-subtext-clickable': col.onSubtextClick }
            ]"
            @click="col.onSubtextClick?.(row)"
            >{{ getCellSubtext(col, row) }}</span
          >
        </div>
        <div v-if="hasActions" class="bsc-cell">
          <span v-if="actionsLabel" class="bsc-mobile-label">{{
            actionsLabel
          }}</span>
          <div class="bsc-row-actions">
            <slot name="row-actions" :row="row" :index="i" />
          </div>
        </div>
      </div>

      <!-- Consumer-controlled full-width block (e.g. a pending-confirmation
           notice with Confirm/Reject buttons) — rendered as-is with no
           decoration from this component, so a row where it doesn't apply
           renders nothing here (unlike row-actions, kept compact/inline
           above for a "⋮" menu or a short status tag). -->
      <slot name="row-confirmation" :row="row" :index="i" />
    </div>

    <!-- No rows at all — a blank table reads as broken, so show one
         placeholder row with a dash in every column instead of nothing. -->
    <div v-if="rows.length === 0" class="bsc-row">
      <div class="bsc-row-main" :style="gridStyle">
        <div v-for="col in columns" :key="col.key" class="bsc-cell">
          <span class="bsc-mobile-label">{{ col.label }}</span>
          <span class="bsc-value">-</span>
        </div>
        <div v-if="hasActions" class="bsc-cell"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  /**
   * Array of column definitions:
   * { key, label, class?: string | (row) => string, format?: (row) => string,
   *   subtext?: (row) => string, subtextClass?: string | (row) => string,
   *   onSubtextClick?: (row) => void } — subtext renders a small secondary
   *   line under the value (e.g. a "Rejected - View Reason" note under the
   *   payer, or an informational "X of Y paid" note); defaults to a
   *   danger/red style, pass subtextClass: 'bsc-subtext-neutral' for an
   *   informational one. onSubtextClick makes it clickable instead of
   *   showing the (possibly long) text inline.
   */
  columns: { type: Array, required: true },
  /** Array of plain data objects */
  rows: { type: Array, required: true },
  /** Header label for the actions column (only shown when the row-actions
   *  slot is actually used) */
  actionsLabel: { type: String, default: '' }
})

const slots = useSlots()
const hasActions = computed(() => !!slots['row-actions'])

// Header and each row's data cells (plus the compact actions column, when
// present) share this same grid template, so columns always line up
// regardless of how many there are. Kept deliberately compact
// (minmax(110px, auto)) — this column is for short content only (a "⋮"
// menu button or a one-word status tag); anything longer belongs in the
// row-confirmation slot below instead, or it would stretch every row.
const gridStyle = computed(() => {
  const dataColumns = `repeat(${props.columns.length}, minmax(0, 1fr))`
  return {
    gridTemplateColumns: hasActions.value
      ? `${dataColumns} minmax(110px, auto)`
      : dataColumns
  }
})

function getCellValue(col, row) {
  const value = col.format ? col.format(row) : (row[col.key] ?? '')
  return !value ? '-' : value
}

function getCellClass(col, row) {
  if (!col.class) return ''
  return typeof col.class === 'function' ? col.class(row) : col.class
}

function getCellSubtext(col, row) {
  return col.subtext ? col.subtext(row) : ''
}

// Defaults to the original danger/red styling (e.g. a rejection note) —
// pass subtextClass for a neutral, informational note (e.g. "X of Y paid").
function getCellSubtextClass(col, row) {
  if (!col.subtextClass) return 'bsc-subtext-danger'
  return typeof col.subtextClass === 'function'
    ? col.subtextClass(row)
    : col.subtextClass
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
  display: grid;
  background: var(--bg-secondary);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  gap: 0.5rem;
}

/* Data rows */
.bsc-row {
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  gap: 0.5rem;
}
.bsc-row:hover {
  background: var(--hover-bg);
}

.bsc-row-main {
  display: grid;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.bsc-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  word-break: break-word;
}

.bsc-value {
  font-weight: 500;
}

.bsc-subtext {
  font-size: 0.75rem;
  font-weight: 500;
}

.bsc-subtext-danger {
  color: var(--el-color-danger, #dc2626);
}

.bsc-subtext-neutral {
  color: var(--text-secondary);
}

.bsc-subtext-clickable {
  cursor: pointer;
  text-decoration: underline;
}

.bsc-row-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
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

  .bsc-row-main {
    grid-template-columns: 1fr !important;
    gap: 0.35rem;
  }

  .bsc-cell {
    width: 100%;
  }

  .bsc-mobile-label {
    display: block;
  }
}
</style>
