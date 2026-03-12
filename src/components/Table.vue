<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="w-full" ref="containerRef">
    <!-- Filter / sort toolbar -->
    <div class="mb-2 flex items-center gap-3 flex-wrap no-print-pdf">
      <el-input
        v-model="filterText"
        placeholder="Search all columns..."
        clearable
        :prefix-icon="SearchIcon"
        size="small"
        class="table-filter-input"
      />
      <span
        v-if="filterText.trim()"
        class="text-sm"
        style="color: var(--text-secondary);"
      >
        {{ filteredSortedRows.length }} / {{ rows.length }} rows
      </span>
      <el-button
        v-if="sortKey"
        size="small"
        link
        style="color: var(--text-secondary);"
        @click="sortKey = null; sortOrder = 'asc'"
      >
        Clear sort
      </el-button>
    </div>

    <div v-if="filteredSortedRows.length" class="expense-table-v2-scroll-wrapper">
    <el-table-v2
      class="expense-table-v2"
      :columns="tableColumns"
      :data="filteredSortedRows"
      :width="tableWidth"
      :height="tableHeight"
      :row-event-handlers="rowEventHandlers"
      :row-class="getRowClass"
    >
      <!-- Sortable header cell -->
      <template #header-cell="{ column }">
        <div
          class="flex items-center gap-1 w-full select-none"
          style="cursor: pointer; overflow: hidden;"
          @click.stop="toggleSort(column.key)"
        >
          <span
            class="text-sm font-semibold uppercase tracking-wide"
            style="color: #ffffff !important; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          >
            {{ column.title }}
          </span>
          <span style="color: #ffffff !important; font-size: 11px; flex-shrink: 0; opacity: 0.9;">
            <template v-if="sortKey === column.key">
              {{ sortOrder === 'asc' ? '▲' : '▼' }}
            </template>
            <template v-else>⇅</template>
          </span>
        </div>
      </template>

      <!-- Custom cell rendering -->
      <template #cell="{ column, rowData }">
        <!-- amount -->
        <span
          v-if="column.key === 'amount'"
          class="et-cell-text px-2 text-sm"
          :data-cell-title="column.title"
        >
          {{ formatAmount(rowData[column.key]) }}
        </span>

        <!-- split -->
        <span v-else-if="column.key === 'split'" class="px-2 text-sm et-cell-overflow">
          <template v-if="Array.isArray(rowData.split)">
            <span class="et-cell-text" :data-cell-title="column.title">
              <span v-for="(s, i) in rowData.split.slice(0, 2)" :key="i">
                {{ formatSplit(s)
                }}<span v-if="i < Math.min(1, rowData.split.length - 1)">, </span>
              </span>
            </span>
            <el-button
              v-if="rowData.split.length > 2"
              link
              size="small"
              class="ml-2 flex-shrink-0"
              @click.stop="openShowMore('Split Details', rowData.split.map(formatSplit))"
            >
              +{{ rowData.split.length - 2 }} more
            </el-button>
          </template>
          <span
            v-else
            class="et-cell-text"
            :data-cell-title="column.title"
          >{{ rowData.split }}</span>
        </span>

        <!-- payer -->
        <span v-else-if="column.key === 'payer'" class="px-2 text-sm et-cell-overflow">
          <template v-if="rowData.payerMode === 'multiple' && rowData.payers?.length">
            <span class="et-cell-text" :data-cell-title="column.title">
              <span v-for="(p, i) in rowData.payers.slice(0, 2)" :key="i">
                {{ formatPayer(p)
                }}<span v-if="i < Math.min(1, rowData.payers.length - 1)">, </span>
              </span>
            </span>
            <el-button
              v-if="rowData.payers.length > 2"
              link
              size="small"
              class="ml-2 flex-shrink-0"
              @click.stop="openShowMore('Payers', rowData.payers.map(formatPayer))"
            >
              +{{ rowData.payers.length - 2 }} more
            </el-button>
          </template>
          <span
            v-else
            class="et-cell-text"
            :data-cell-title="column.title"
          >
            {{ tabStore.getUserByMobile(rowData.payer)?.name + ` (${rowData.payer})` || rowData.payer }}
          </span>
        </span>

        <!-- giver / receiver -->
        <span
          v-else-if="column.key === 'giver' || column.key === 'receiver'"
          class="et-cell-text px-2 text-sm"
          :data-cell-title="column.title"
        >
          {{ (tabStore.getUserByMobile(rowData[column.key])?.name || rowData[column.key]) + ` (${rowData[column.key]})` }}
        </span>

        <!-- receiptUrls (array) -->
        <span v-else-if="column.key === 'receiptUrls'" class="px-2 text-sm et-cell-overflow">
          <template v-if="Array.isArray(rowData.receiptUrls) && rowData.receiptUrls.length">
            <span class="et-cell-text">
              <a
                :href="rowData.receiptUrls[0]"
                target="_blank"
                rel="noopener"
                class="receipt-link hover:underline"
                @click.stop
              >
                {{ `Receipt${rowData.receiptUrls.length > 1 ? ' 1' : ''}` }}
              </a>
            </span>
            <el-button
              v-if="rowData.receiptUrls.length > 1"
              link
              size="small"
              class="ml-1 flex-shrink-0"
              @click.stop="openShowMore('Receipts', rowData.receiptUrls.map((u, i) => formatReceipt(u, i)))"
            >
              +{{ rowData.receiptUrls.length - 1 }} more
            </el-button>
          </template>
          <template v-else>—</template>
        </span>

        <!-- receiptUrl (single) -->
        <span v-else-if="column.key === 'receiptUrl'" class="px-2 text-sm et-cell-overflow">
          <template v-if="rowData.receiptUrl">
            <a
              :href="rowData.receiptUrl"
              target="_blank"
              rel="noopener"
              class="receipt-link hover:underline et-cell-text"
              @click.stop
            >
              Receipt
            </a>
          </template>
          <template v-else>—</template>
        </span>

        <!-- default -->
        <span
          v-else
          class="et-cell-text px-2 text-sm"
          :data-cell-title="column.title"
        >
          {{ typeof rowData[column.key] === 'object' ? JSON.stringify(rowData[column.key]) : rowData[column.key] }}
        </span>
      </template>
    </el-table-v2>
    </div>

    <div
      v-else
      class="et-empty"
    >
      <template v-if="filterText.trim()">
        <span class="et-empty__icon">🔍</span>
        <p class="et-empty__title">No results found</p>
        <p class="et-empty__sub">No rows match <strong>"{{ filterText.trim() }}"</strong>. Try a different search.</p>
      </template>
      <template v-else>
        <span class="et-empty__icon">📭</span>
        <p class="et-empty__title">No data</p>
        <p class="et-empty__sub">There are no records to display yet.</p>
      </template>
    </div>

    <!-- Edit / Delete dialog -->
    <el-dialog
      top="10vh"
      center
      destroy-on-close
      v-model="dialogFormVisible"
      :width="dialogWidth + 'px'"
    >
      <template #header>
        <div class="dialog-header">
          <strong>Delete or Update</strong>
        </div>
      </template>
      <HOC
        :componentToBeRendered="activeTabComponent()"
        :componentProps="dialogComponentProps"
        :listenersToPass="{ closeModal: () => (dialogFormVisible = false) }"
        ref="childRef"
      />
      <template #footer>
        <div class="dialog-footer">
          <BottomButtons
            @update="update"
            @delete="remove"
            @duplicate="duplicate"
            @cancel="dialogFormVisible = false"
          />
        </div>
      </template>
    </el-dialog>
  </div>

  <!-- Download buttons -->
  <div v-if="isDownloadAvailable" class="mt-2 flex justify-between">
    <GenericButton type="success" @click="downloadPdfData">Download PDF</GenericButton>
    <GenericButton type="" @click="downloadExcelData">Download Excel</GenericButton>
  </div>

  <!-- Show More dialog -->
  <el-dialog
    v-model="showMoreDialogVisible"
    :title="showMoreTitle"
    width="95%"
    destroy-on-close
  >
    <ol class="list-decimal pl-4 space-y-2 text-black dark:text-gray-300">
      <li
        v-for="(item, idx) in showMoreItems"
        :key="idx"
        v-html="
          typeof item === 'object'
            ? `<a href='${item.href}' target='_blank' rel='noopener' class='text-blue-600 dark:text-blue-400 hover:underline'>${item.label}</a>`
            : item
        "
      ></li>
    </ol>
  </el-dialog>

  <!-- Cell full-text popup -->
  <el-dialog
    v-model="cellPopupVisible"
    :title="cellPopupTitle"
    width="90%"
    destroy-on-close
  >
    <p style="color: var(--text-primary); word-break: break-word; white-space: pre-wrap;">{{ cellPopupText }}</p>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import BottomButtons from './BottomButtons.vue'
import GenericButton from './generic-components/GenericButton.vue'
import HOC from './HOC.vue'
import { Table } from '../scripts/table'

const props = defineProps({
  rows: {
    type: Array,
    required: true
  },
  keys: {
    type: Array,
    required: true
  },
  dataRef: {
    type: [Object, null],
    required: false
  },
  downloadTitle: {
    type: String,
    required: true
  },
  reportMonth: {
    type: String,
    default: ''
  },
  showPopup: {
    type: Boolean,
    default: true
  }
})

const {
  tabStore,
  dialogFormVisible,
  activeTabComponent,
  dialogComponentProps,
  isDownloadAvailable,
  formatAmount,
  dialogWidth,
  headers,
  update,
  remove,
  duplicate,
  handleRowClick,
  downloadExcelData,
  downloadPdfData,
  childRef,
} = Table(props)

// --- Virtualized table sizing ---
const containerRef = ref(null)
const containerWidth = ref(800)
const tableHeight = computed(() => Math.floor(window.innerHeight * 0.6))

let resizeObserver = null

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
    resizeObserver = new ResizeObserver((entries) => {
      containerWidth.value = entries[0].contentRect.width
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

// --- Filter & Sort ---
const filterText = ref('')
const sortKey = ref(null)
const sortOrder = ref('asc')

function toggleSort(key) {
  if (sortKey.value === key) {
    if (sortOrder.value === 'asc') sortOrder.value = 'desc'
    else { sortKey.value = null; sortOrder.value = 'asc' }
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const filteredSortedRows = computed(() => {
  let data = props.rows.map((row, i) => ({ ...row, _origIndex: i }))

  const q = filterText.value.trim().toLowerCase()
  if (q) {
    data = data.filter((row) =>
      Object.entries(row).some(([k, val]) => {
        if (k.startsWith('_') || k === 'deleteRequest' || k === 'updateRequest') return false
        if (Array.isArray(val)) return JSON.stringify(val).toLowerCase().includes(q)
        if (typeof val === 'object' && val !== null) return JSON.stringify(val).toLowerCase().includes(q)
        return String(val ?? '').toLowerCase().includes(q)
      })
    )
  }

  if (sortKey.value) {
    const key = sortKey.value
    const order = sortOrder.value
    data = [...data].sort((a, b) => {
      const av = a[key] ?? ''
      const bv = b[key] ?? ''
      const an = parseFloat(av)
      const bn = parseFloat(bv)
      if (!isNaN(an) && !isNaN(bn)) return order === 'asc' ? an - bn : bn - an
      const as = String(av).toLowerCase()
      const bs = String(bv).toLowerCase()
      if (as < bs) return order === 'asc' ? -1 : 1
      if (as > bs) return order === 'asc' ? 1 : -1
      return 0
    })
  }

  return data
})

// --- Column definitions (equal-width, min 150px per column) ---
const MIN_COL_WIDTH = 150
const tableColumns = computed(() => {
  if (!headers.value.length) return []
  const count = headers.value.length
  const colWidth = Math.max(MIN_COL_WIDTH, Math.floor(containerWidth.value / count))
  return headers.value.map((h) => ({
    key: h.key,
    dataKey: h.key,
    title: h.label,
    width: colWidth,
    align: 'left'
  }))
})

// tableWidth = sum of all column widths so nothing gets clipped
// the scroll wrapper handles overflow when this exceeds containerWidth
const tableWidth = computed(() => {
  if (!tableColumns.value.length) return containerWidth.value
  return tableColumns.value.reduce((sum, col) => sum + col.width, 0)
})

// --- Row event handlers (single/double-click logic lives in handleRowClick) ---
const rowEventHandlers = computed(() => ({
  onClick: ({ event, rowData }) => {
    // If the click landed on a truncated et-cell-text, show the full text popup
    const cellEl = event?.target?.closest?.('.et-cell-text')
    if (cellEl && cellEl.scrollWidth > cellEl.clientWidth) {
      const title = cellEl.getAttribute('data-cell-title') || ''
      const text = cellEl.textContent?.trim() || ''
      if (text) {
        openCellPopup(title, text)
        return
      }
    }
    // Normal single / double-click row logic
    if (props.showPopup) {
      const { _origIndex, ...cleanRow } = rowData
      handleRowClick(cleanRow, _origIndex)
    }
  }
}))

// --- Row class for background colours ---
const getRowClass = ({ rowData, rowIndex }) => {
  const base = 'et-row'
  if (rowData.deleteRequest) return `${base} et-row--delete`
  if (rowData.updateRequest) return `${base} et-row--update`
  return `${base}${rowIndex % 2 !== 0 ? ' et-row--odd' : ''}`
}

// --- Show More dialog ---
const showMoreDialogVisible = ref(false)
const showMoreTitle = ref('')
const showMoreItems = ref([])

// --- Cell full-text popup ---
const cellPopupVisible = ref(false)
const cellPopupTitle = ref('')
const cellPopupText = ref('')

function openCellPopup(title, text) {
  if (!text || String(text).trim() === '') return
  cellPopupTitle.value = title
  cellPopupText.value = String(text)
  cellPopupVisible.value = true
}

const formatPayer = (p) =>
  `${tabStore.getUserByMobile(p.mobile)?.name || p.mobile} (${p.mobile}): ${formatAmount(p.amount)}`

const formatSplit = (s) =>
  `${tabStore.getUserByMobile(s.mobile)?.name || s.mobile}: ${formatAmount(s.amount)}`

const formatReceipt = (url, i) => ({ label: `Receipt ${i + 1}`, href: url })

function openShowMore(title, items) {
  showMoreTitle.value = title
  showMoreItems.value = items
  showMoreDialogVisible.value = true
}
</script>

<style>
/* ── Empty state ────────────────────────────────────────── */
.et-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  text-align: center;
}

.et-empty__icon {
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: 12px;
}

.et-empty__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary) !important;
  margin: 0 0 6px;
}

.et-empty__sub {
  font-size: 0.85rem;
  color: var(--text-secondary) !important;
  margin: 0;
}

.et-empty__sub strong {
  color: var(--text-primary) !important;
}

/* ── Filter input ───────────────────────────────────────── */
.table-filter-input {
  width: 100%;
}

/* ── Cell ellipsis truncation ───────────────────────────── */
.et-cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  width: 100%;
}

/* For cells that mix a truncated text span + a "more" button */
.et-cell-overflow {
  display: flex;
  align-items: center;
  overflow: hidden;
  width: 100%;
}

.et-cell-overflow .et-cell-text {
  flex: 1;
  min-width: 0;
}

/* ── Horizontal scroll wrapper ──────────────────────────── */
.expense-table-v2-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

/* ── Table root / body background (uses app CSS vars) ───── */
.expense-table-v2,
.expense-table-v2 .el-table-v2__main,
.expense-table-v2 .el-table-v2__root {
  background-color: var(--card-bg) !important;
}

/* ── Header ──────────────────────────────────────────────── */
.expense-table-v2 .el-table-v2__header-row {
  background-color: rgb(34 197 94) !important; /* green-500 */
}

.dark-theme .expense-table-v2 .el-table-v2__header-row {
  background-color: rgb(22 163 74) !important; /* green-600 */
}

.expense-table-v2 .el-table-v2__header-cell {
  background-color: transparent !important;
  border-right: 1px solid rgb(22 163 74) !important; /* green-600 */
  border-bottom: 1px solid rgb(22 163 74) !important;
  color: #ffffff !important;
}

.expense-table-v2 .el-table-v2__header-cell span,
.expense-table-v2 .el-table-v2__header-cell * {
  color: #ffffff !important;
}

.dark-theme .expense-table-v2 .el-table-v2__header-cell {
  border-color: rgb(21 128 61) !important; /* green-700 */
  color: #ffffff !important;
}

.dark-theme .expense-table-v2 .el-table-v2__header-cell span,
.dark-theme .expense-table-v2 .el-table-v2__header-cell * {
  color: #ffffff !important;
}

/* ── Row base & cursor ───────────────────────────────────── */
.expense-table-v2 .el-table-v2__row {
  background-color: var(--card-bg);
  cursor: pointer;
}

/* ── Cell borders and text color (CSS vars auto-flip) ────── */
.expense-table-v2 .el-table-v2__row-cell {
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary) !important;
}

/* make sure all text inside cells inherits the theme colour */
.expense-table-v2 .el-table-v2__row-cell span,
.expense-table-v2 .el-table-v2__row-cell a {
  color: var(--text-primary);
}

.expense-table-v2 .el-table-v2__row-cell a,
.expense-table-v2 .el-table-v2__row-cell a.receipt-link {
  color: #2563eb; /* blue-600 */
}

.dark-theme .expense-table-v2 .el-table-v2__row-cell a,
.dark-theme .expense-table-v2 .el-table-v2__row-cell a.receipt-link {
  color: #60a5fa; /* blue-400 */
}

/* ── Alternating row background ──────────────────────────── */
.expense-table-v2 .et-row--odd {
  background-color: var(--bg-secondary); /* gray-50 light / #2d2d2d dark */
}

/* ── Normal row hover ────────────────────────────────────── */
.expense-table-v2 .et-row:hover,
.expense-table-v2 .et-row.is-hovered {
  background-color: rgb(199 210 254) !important; /* indigo-100 */
}

.dark-theme .expense-table-v2 .et-row:hover,
.dark-theme .expense-table-v2 .et-row.is-hovered {
  background-color: var(--hover-bg) !important; /* #374151 = gray-700 */
}

/* ── Delete-request row ──────────────────────────────────── */
.expense-table-v2 .et-row--delete {
  background-color: rgb(254 242 242) !important; /* red-50 */
}

.expense-table-v2 .et-row--delete:hover,
.expense-table-v2 .et-row--delete.is-hovered {
  background-color: rgb(254 226 226) !important; /* red-100 */
}

.dark-theme .expense-table-v2 .et-row--delete {
  background-color: rgba(153, 27, 27, 0.2) !important; /* red-900/20 */
}

.dark-theme .expense-table-v2 .et-row--delete:hover,
.dark-theme .expense-table-v2 .et-row--delete.is-hovered {
  background-color: rgba(153, 27, 27, 0.3) !important; /* red-900/30 */
}

/* ── Update-request row ──────────────────────────────────── */
.expense-table-v2 .et-row--update {
  background-color: rgb(255 247 237) !important; /* orange-50 */
}

.expense-table-v2 .et-row--update:hover,
.expense-table-v2 .et-row--update.is-hovered {
  background-color: rgb(255 237 213) !important; /* orange-100 */
}

.dark-theme .expense-table-v2 .et-row--update {
  background-color: rgba(154, 52, 18, 0.2) !important; /* orange-900/20 */
}

.dark-theme .expense-table-v2 .et-row--update:hover,
.dark-theme .expense-table-v2 .et-row--update.is-hovered {
  background-color: rgba(154, 52, 18, 0.3) !important; /* orange-900/30 */
}
</style>
