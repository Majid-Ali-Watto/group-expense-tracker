<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="w-full" ref="containerRef">
    <!-- Filter / sort toolbar -->
    <div class="mb-2 no-print-pdf">
      <!-- Row 1: search + columns button always on one line -->
      <div class="flex items-center gap-2 mb-1">
        <div class="min-w-0 flex-1">
          <GenericInputField
            v-model="filterText"
            placeholder="Search all columns..."
            :prefix-icon="SearchIcon"
            :wrap-form-item="false"
            input-class="table-filter-input"
          />
        </div>
        <span
          v-if="filterText.trim()"
          class="text-sm flex-shrink-0"
          style="color: var(--text-secondary)"
        >
          {{ filteredSortedRows.length }} / {{ rows.length }} rows
        </span>
        <el-button
          v-if="sortKey"
          size="small"
          link
          class="flex-shrink-0"
          style="color: var(--text-secondary)"
          @click="clearSort"
        >
          Clear sort
        </el-button>
        <el-button
          v-if="tableColumns.length > 1"
          size="small"
          link
          class="flex-shrink-0"
          style="color: var(--text-secondary)"
          @click="columnSettingsVisible = true"
          title="Reorder columns"
        >
          ⚙ Columns
        </el-button>
      </div>

      <!-- Row 2: bulk-action bar, only visible when rows are selected -->
      <div v-if="selectedKeys.length" class="flex items-center gap-2 flex-wrap">
        <el-button
          v-if="showPopup"
          size="small"
          type="danger"
          plain
          @click="bulkDeleteSelected"
        >
          {{ isBulkDeleteDirectly ? 'Delete' : 'Request Delete' }}
        </el-button>
        <el-button size="small" plain @click="downloadSelectedExcel"
          >Excel</el-button
        >
        <el-button size="small" plain @click="downloadSelectedPdf"
          >PDF</el-button
        >
        <span class="bulk-count flex-shrink-0"
          >{{ selectedKeys.length }} selected</span
        >
      </div>
    </div>

    <div
      v-if="filteredSortedRows.length"
      class="expense-table-v2-scroll-wrapper"
    >
      <el-table-v2
        class="expense-table-v2"
        :columns="tableColumns"
        :data="filteredSortedRows"
        :width="tableWidth"
        :height="tableHeight"
        :row-class="getRowClass"
      >
        <!-- Sortable header cell -->
        <template #header-cell="{ column }">
          <!-- Select-all checkbox -->
          <div
            v-if="column.key === '__select__'"
            class="flex items-center justify-center w-full h-full"
            @click.stop
          >
            <el-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="toggleSelectAll"
            />
          </div>
          <!-- Actions column: no sort -->
          <div
            v-else-if="column.key === '__actions__'"
            class="flex items-center justify-center w-full"
            style="overflow: hidden"
          >
            <span
              class="text-sm font-semibold uppercase tracking-wide"
              style="color: #ffffff !important"
              >Actions</span
            >
          </div>
          <!-- Regular sortable + draggable header -->
          <div
            v-else
            style="
              position: relative;
              overflow: visible;
              width: 100%;
              height: 100%;
            "
          >
            <div
              class="flex items-center gap-1 w-full select-none"
              :style="{
                cursor: dragSourceKey === column.key ? 'grabbing' : 'grab',
                overflow: 'hidden',
                opacity: dragSourceKey === column.key ? 0.5 : 1,
                height: '100%'
              }"
              draggable="true"
              @dragstart.stop="handleDragStart(column.key)"
              @dragover.prevent
              @drop.prevent="handleDrop(column.key)"
              @click.stop="toggleSort(column.key)"
            >
              <span
                style="
                  color: #ffffff !important;
                  font-size: 10px;
                  flex-shrink: 0;
                  opacity: 0.7;
                  margin-right: 2px;
                "
                >⠿</span
              >
              <span
                v-overflow-popup="{ title: 'Column Name' }"
                class="text-sm font-semibold uppercase tracking-wide"
                style="
                  color: #ffffff !important;
                  flex: 1;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                "
              >
                {{ column.title }}
              </span>
              <span
                style="
                  color: #ffffff !important;
                  font-size: 11px;
                  flex-shrink: 0;
                  opacity: 0.9;
                "
              >
                <template v-if="sortKey === column.key">
                  {{ sortOrder === 'asc' ? '▲' : '▼' }}
                </template>
                <template v-else>⇅</template>
              </span>
            </div>
          </div>
        </template>

        <!-- Custom cell rendering -->
        <template #cell="{ column, rowData }">
          <!-- select checkbox -->
          <div
            v-if="column.key === '__select__'"
            class="flex items-center justify-center w-full h-full"
            @click.stop
          >
            <el-checkbox
              :model-value="isRowSelected(rowData._origIndex)"
              @change="toggleSelectRow(rowData._origIndex)"
            />
          </div>

          <!-- amount -->
          <span
            v-else-if="column.key === 'amount'"
            v-overflow-popup="{ title: column.title }"
            class="et-cell-text px-2 text-sm"
            :data-cell-title="column.title"
          >
            {{ formatAmount(rowData[column.key]) }}
          </span>

          <!-- split -->
          <span
            v-else-if="column.key === 'split'"
            class="px-2 text-sm et-cell-overflow"
          >
            <template v-if="Array.isArray(rowData.split)">
              <span
                v-overflow-popup="{ title: column.title }"
                class="et-cell-text"
                :data-cell-title="column.title"
              >
                <span v-for="(s, i) in rowData.split.slice(0, 2)" :key="i">
                  {{ formatSplit(s)
                  }}<span v-if="i < Math.min(1, rowData.split.length - 1)"
                    >,
                  </span>
                </span>
              </span>
              <el-button
                v-if="rowData.split.length > 1"
                link
                size="small"
                class="ml-2 flex-shrink-0"
                @click.stop="
                  openShowMore('Split Details', rowData.split.map(formatSplit))
                "
              >
                +{{ rowData.split.length - 1 }} more
              </el-button>
            </template>
            <span
              v-else
              v-overflow-popup="{ title: column.title }"
              class="et-cell-text"
              :data-cell-title="column.title"
              >{{ rowData.split }}</span
            >
          </span>

          <!-- payer -->
          <span
            v-else-if="column.key === 'payer'"
            class="px-2 text-sm et-cell-overflow"
          >
            <template
              v-if="rowData.payerMode === 'multiple' && rowData.payers?.length"
            >
              <span
                v-overflow-popup="{ title: column.title }"
                class="et-cell-text"
                :data-cell-title="column.title"
              >
                <span v-for="(p, i) in rowData.payers.slice(0, 2)" :key="i">
                  {{ formatPayer(p)
                  }}<span v-if="i < Math.min(1, rowData.payers.length - 1)"
                    >,
                  </span>
                </span>
              </span>
              <el-button
                v-if="rowData.payers.length > 1"
                link
                size="small"
                class="ml-2 flex-shrink-0"
                @click.stop="
                  openShowMore('Payers', rowData.payers.map(formatPayer))
                "
              >
                +{{ rowData.payers.length - 1 }} more
              </el-button>
            </template>
            <span
              v-else
              v-overflow-popup="{ title: column.title }"
              class="et-cell-text"
              :data-cell-title="column.title"
            >
              {{ formatUser(rowData.payer) }}
            </span>
          </span>

          <!-- giver / receiver -->
          <span
            v-else-if="column.key === 'giver' || column.key === 'receiver'"
            v-overflow-popup="{ title: column.title }"
            class="et-cell-text px-2 text-sm"
            :data-cell-title="column.title"
          >
            {{ formatUser(rowData[column.key]) }}
          </span>

          <!-- receiptUrls (array) -->
          <span
            v-else-if="column.key === 'receiptUrls'"
            class="px-2 text-sm et-cell-overflow"
          >
            <template
              v-if="
                Array.isArray(rowData.receiptUrls) && rowData.receiptUrls.length
              "
            >
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
                @click.stop="
                  openShowMore(
                    'Receipts',
                    rowData.receiptUrls.map((u, i) => formatReceipt(u, i))
                  )
                "
              >
                +{{ rowData.receiptUrls.length - 1 }} more
              </el-button>
            </template>
            <template v-else>—</template>
          </span>

          <!-- receiptUrl (single) -->
          <span
            v-else-if="column.key === 'receiptUrl'"
            class="px-2 text-sm et-cell-overflow"
          >
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

          <!-- actions -->
          <div
            v-else-if="column.key === '__actions__'"
            class="et-actions-cell"
            @click.stop
          >
            <el-dropdown
              trigger="click"
              placement="bottom-end"
              @command="(cmd) => handleTableAction(cmd, rowData)"
            >
              <button class="et-actions-btn" @click.stop>&#8942;</button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="showPopup" command="edit"
                    >&#9998; Edit / Duplicate</el-dropdown-item
                  >
                  <el-dropdown-item
                    v-if="showPopup"
                    command="delete"
                    class="et-action-delete"
                    >&#128465; Delete</el-dropdown-item
                  >
                  <el-dropdown-item command="info"
                    >&#128712; Added By</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- default -->
          <span
            v-else
            v-overflow-popup="{ title: column.title }"
            class="et-cell-text px-2 text-sm"
            :data-cell-title="column.title"
          >
            {{
              typeof rowData[column.key] === 'object'
                ? JSON.stringify(rowData[column.key])
                : rowData[column.key]
            }}
          </span>
        </template>
      </el-table-v2>
    </div>

    <div v-else class="et-empty">
      <template v-if="filterText.trim()">
        <span class="et-empty__icon">🔍</span>
        <p class="et-empty__title">No results found</p>
        <p class="et-empty__sub">
          No rows match <strong>"{{ filterText.trim() }}"</strong>. Try a
          different search.
        </p>
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
      @close="deleteMode = false"
    >
      <template #header>
        <div class="dialog-header">
          <strong v-if="deleteMode">Confirm Delete</strong>
          <strong v-else>Edit Record</strong>
        </div>
      </template>

      <!-- Delete-mode: show confirmation message; form is rendered hidden so remove() can use it -->
      <template v-if="deleteMode">
        <div class="et-delete-confirm">
          <div class="et-delete-confirm__icon">🗑️</div>
          <p class="et-delete-confirm__msg">
            Are you sure you want to delete this record?<br /><span
              class="et-delete-confirm__sub"
              >This action cannot be undone.</span
            >
          </p>
        </div>
        <div
          style="
            display: none;
            height: 0;
            overflow: hidden;
            pointer-events: none;
          "
        >
          <HOC
            :componentToBeRendered="activeTabComponent()"
            :componentProps="dialogComponentProps"
            :listenersToPass="{
              closeModal: () => {
                dialogFormVisible = false
              }
            }"
            ref="childRef"
          />
        </div>
      </template>

      <!-- Edit mode: show form normally -->
      <HOC
        v-else
        :componentToBeRendered="activeTabComponent()"
        :componentProps="dialogComponentProps"
        :listenersToPass="{ closeModal: () => (dialogFormVisible = false) }"
        ref="childRef"
      />

      <template #footer>
        <div class="dialog-footer">
          <!-- Delete mode footer -->
          <template v-if="deleteMode">
            <el-button type="danger" size="small" @click="remove"
              >Yes, Delete</el-button
            >
            <el-button size="small" @click="dialogFormVisible = false"
              >Cancel</el-button
            >
          </template>
          <!-- Edit mode footer -->
          <template v-else>
            <el-button type="warning" size="small" @click="update"
              >Update</el-button
            >
            <el-button type="primary" size="small" @click="duplicate"
              >Duplicate</el-button
            >
            <el-button
              type="success"
              size="small"
              @click="dialogFormVisible = false"
              >Cancel</el-button
            >
          </template>
        </div>
      </template>
    </el-dialog>
  </div>

  <!-- Download buttons -->
  <div v-if="isDownloadAvailable" class="mt-2 flex justify-between">
    <GenericButton type="success" @click="downloadPdfData"
      >Download PDF</GenericButton
    >
    <GenericButton type="" @click="downloadExcelData"
      >Download Excel</GenericButton
    >
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

  <!-- Column settings dialog -->
  <el-dialog
    v-model="columnSettingsVisible"
    title="Reorder Columns"
    width="320px"
    destroy-on-close
  >
    <p class="col-settings-hint">Drag rows to reorder columns.</p>
    <ul class="col-settings-list">
      <li
        v-for="key in columnOrder"
        :key="key"
        class="col-settings-item"
        draggable="true"
        :class="{ 'col-settings-item--dragging': colSettingsDragKey === key }"
        @dragstart="colSettingsDragKey = key"
        @dragover.prevent
        @drop.prevent="handleColSettingsDrop(key)"
        @dragend="colSettingsDragKey = null"
      >
        <span class="col-settings-grip">⠿</span>
        <span class="col-settings-label">
          {{ tableColumns.find((c) => c.key === key)?.title || key }}
        </span>
      </li>
    </ul>
  </el-dialog>
</template>

<script setup>
import { watch } from 'vue'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import GenericButton from '../generic-components/GenericButton.vue'
import GenericInputField from '../generic-components/GenericInputField.vue'
import HOC from '../layout/HOC.vue'
import { Table } from '../../scripts/shared/table'

const props = defineProps({
  rows: { type: Array, required: true },
  keys: { type: Array, required: true },
  dataRef: { type: [Object, null], required: false },
  downloadTitle: { type: String, required: true },
  reportMonth: { type: String, default: '' },
  showPopup: { type: Boolean, default: true }
})

const emit = defineEmits(['selection-change'])

const {
  dialogFormVisible,
  deleteMode,
  activeTabComponent,
  dialogComponentProps,
  isDownloadAvailable,
  formatAmount,
  dialogWidth,
  update,
  remove,
  duplicate,
  downloadExcelData,
  downloadPdfData,
  childRef,
  containerRef,
  tableHeight,
  filterText,
  sortKey,
  sortOrder,
  clearSort,
  toggleSort,
  filteredSortedRows,
  tableColumns,
  tableWidth,
  handleDragStart,
  handleDrop,
  dragSourceKey,
  columnOrder,
  columnSettingsVisible,
  colSettingsDragKey,
  handleColSettingsDrop,
  getRowClass,
  showMoreDialogVisible,
  showMoreTitle,
  showMoreItems,
  formatUser,
  formatPayer,
  formatSplit,
  formatReceipt,
  openShowMore,
  handleTableAction,
  selectedKeys,
  selectedRows,
  isAllSelected,
  isIndeterminate,
  toggleSelectAll,
  toggleSelectRow,
  isRowSelected,
  isBulkDeleteDirectly,
  bulkDeleteSelected,
  downloadSelectedExcel,
  downloadSelectedPdf
} = Table(props)

watch(selectedRows, (rows) => emit('selection-change', rows))
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

/* ── Bulk action bar ────────────────────────────────────── */
.bulk-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ── Filter input ───────────────────────────────────────── */
.table-filter-input {
  width: 100%;
  min-width: 0;
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
  cursor: default;
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

/* ── Selected row ────────────────────────────────────────── */
.expense-table-v2 .et-row--selected {
  background-color: rgb(220 252 231) !important; /* green-100 */
}

.dark-theme .expense-table-v2 .et-row--selected {
  background-color: rgba(22, 163, 74, 0.2) !important; /* green-600/20 */
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

/* ── Actions column ─────────────────────────────────────── */
.et-actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.et-actions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: var(--text-secondary);
  padding: 4px 10px;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
  letter-spacing: 0;
}

.et-actions-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

/* ── Delete dropdown item ───────────────────────────────── */
:global(.et-action-delete) {
  color: #ef4444 !important;
}
:global(.et-action-delete:hover),
:global(.et-action-delete:focus) {
  background-color: rgb(254 242 242) !important;
  color: #dc2626 !important;
}

/* ── Delete confirmation dialog body ───────────────────── */
.et-delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 12px 8px 4px;
  text-align: center;
}
.et-delete-confirm__icon {
  font-size: 2.5rem;
  line-height: 1;
}
.et-delete-confirm__msg {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}
.et-delete-confirm__sub {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--text-secondary);
}

/* ── Column settings dialog ─────────────────────────────── */
.col-settings-hint {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin: 0 0 10px;
}

.col-settings-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-settings-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  cursor: grab;
  user-select: none;
  transition:
    opacity 0.15s,
    box-shadow 0.15s;
}

.col-settings-item--dragging {
  opacity: 0.45;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.col-settings-grip {
  font-size: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.col-settings-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex: 1;
}
</style>
