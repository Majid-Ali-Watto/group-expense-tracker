<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div ref="containerRef" class="w-full overflow-x-auto">
    <el-table-v2
      v-if="containerWidth > 0 && tableColumns.length > 0"
      class="custom-vt"
      :columns="tableColumns"
      :data="rows"
      :width="containerWidth"
      :height="tableHeight"
      :row-class="getRowClass"
      :row-event-handlers="rowEventHandlers"
      fixed
    />
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
            @cancel="dialogFormVisible = false"
          />
        </div>
      </template>
    </el-dialog>
  </div>
  <div v-if="isDownloadAvailable" class="mt-2 flex justify-between">
    <GenericButton type="success" @click="downloadPdfData"
      >Download PDF</GenericButton
    >
    <GenericButton type="warning" @click="downloadExcelData"
      >Download Excel</GenericButton
    >
  </div>
</template>

<script setup>
import { h, computed, ref, onMounted, onUnmounted } from 'vue'
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
  handleClick,
  handleDoubleClick,
  downloadExcelData,
  downloadPdfData,
  childRef, // used as template ref on <HOC> — TSC can't see template refs
  getFileNameFromUrl
} = Table(props)

// Container width tracking via ResizeObserver
const containerRef = ref(null)
const containerWidth = ref(0)
let resizeObserver = null

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
    resizeObserver = new ResizeObserver(() => {
      containerWidth.value = containerRef.value?.clientWidth ?? 0
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// Table height: row count * row height + header, capped at 600px
const tableHeight = computed(() =>
  Math.max(Math.min(props.rows.length * 46 + 46, 600), 100)
)

// Distribute width equally across columns, minimum 120px each
const colWidth = computed(() => {
  if (!headers.value.length) return 120
  return Math.max(containerWidth.value / headers.value.length, 120)
})

// Row class for delete/update highlight
const getRowClass = ({ rowData }) => {
  if (rowData.deleteRequest) return 'vt-row--delete'
  if (rowData.updateRequest) return 'vt-row--update'
  return ''
}

// Row click / double-click handlers
const rowEventHandlers = {
  onClick: ({ rowData, rowIndex }) => {
    if (props.showPopup) handleClick(rowData, rowIndex)
  },
  onDblclick: ({ rowData }) => handleDoubleClick(rowData)
}

// Cell renderer for special column keys
function renderCell(key, cellData, rowData) {
  if (key === 'amount') {
    return h('span', formatAmount(cellData))
  }

  if (key === 'split') {
    if (Array.isArray(rowData.split)) {
      return h(
        'span',
        rowData.split.map((s, i) =>
          h(
            'span',
            { key: i },
            (tabStore.getUserByMobile(s.mobile)?.name || s.mobile) +
              ': ' +
              formatAmount(s.amount) +
              (i < rowData.split.length - 1 ? ', ' : '')
          )
        )
      )
    }
    return h('span', String(rowData.split ?? ''))
  }

  if (key === 'payer') {
    if (rowData.payerMode === 'multiple' && rowData.payers?.length) {
      return h(
        'span',
        rowData.payers.map((p, i) =>
          h(
            'span',
            { key: i },
            (tabStore.getUserByMobile(p.mobile)?.name + ` (${p.mobile})` ||
              p.mobile) +
              ': ' +
              formatAmount(p.amount) +
              (i < rowData.payers.length - 1 ? ', ' : '')
          )
        )
      )
    }
    return h(
      'span',
      tabStore.getUserByMobile(rowData.payer)?.name + ` (${rowData.payer})` ||
        rowData.payer
    )
  }

  if (key === 'giver' || key === 'receiver') {
    return h(
      'span',
      (tabStore.getUserByMobile(rowData[key])?.name || rowData[key]) +
        ` (${rowData[key]})`
    )
  }

  if (key === 'receiptUrls') {
    if (Array.isArray(rowData.receiptUrls) && rowData.receiptUrls.length) {
      return h(
        'ol',
        { class: 'list-decimal pl-4' },
        rowData.receiptUrls.map((url, i) =>
          h(
            'li',
            { key: i },
            h(
              'a',
              {
                href: url,
                target: '_blank',
                rel: 'noopener',
                class: 'text-blue-600 dark:text-blue-400 hover:underline',
                onClick: (e) => e.stopPropagation()
              },
              getFileNameFromUrl(url)
            )
          )
        )
      )
    }
    return h('span', '—')
  }

  if (key === 'receiptUrl') {
    if (rowData.receiptUrl) {
      return h(
        'a',
        {
          href: rowData.receiptUrl,
          target: '_blank',
          rel: 'noopener',
          class: 'text-blue-600 dark:text-blue-400 hover:underline',
          onClick: (e) => e.stopPropagation()
        },
        getFileNameFromUrl(rowData.receiptUrl)
      )
    }
    return h('span', '—')
  }

  // Default: stringify objects, render primitives as-is
  const val =
    typeof cellData === 'object' ? JSON.stringify(cellData) : (cellData ?? '')
  return h('span', String(val))
}

// Build columns array from dynamic headers
const tableColumns = computed(() =>
  headers.value.map((header) => ({
    key: header.key,
    dataKey: header.key,
    title: header.label,
    width: colWidth.value,
    headerCellRenderer: () =>
      h(
        'span',
        { class: 'font-semibold text-xs uppercase tracking-wide text-white' },
        header.label
      ),
    cellRenderer: ({ cellData, rowData }) =>
      renderCell(header.key, cellData, rowData)
  }))
)
</script>

<style>
/* Header background matching original dark gradient */
.custom-vt .el-table-v2__header-cell {
  background: linear-gradient(to right, #1f2937, #000000);
}

/* Delete-request row highlight */
.el-table-v2__row.vt-row--delete .el-table-v2__row-cell {
  background-color: #fef2f2 !important;
}
.el-table-v2__row.vt-row--delete:hover .el-table-v2__row-cell {
  background-color: #fee2e2 !important;
}

/* Update-request row highlight */
.el-table-v2__row.vt-row--update .el-table-v2__row-cell {
  background-color: #fff7ed !important;
}
.el-table-v2__row.vt-row--update:hover .el-table-v2__row-cell {
  background-color: #ffedd5 !important;
}

/* Dark mode overrides */
.dark .el-table-v2__row.vt-row--delete .el-table-v2__row-cell {
  background-color: rgba(127, 29, 29, 0.2) !important;
}
.dark .el-table-v2__row.vt-row--delete:hover .el-table-v2__row-cell {
  background-color: rgba(127, 29, 29, 0.3) !important;
}
.dark .el-table-v2__row.vt-row--update .el-table-v2__row-cell {
  background-color: rgba(124, 45, 18, 0.2) !important;
}
.dark .el-table-v2__row.vt-row--update:hover .el-table-v2__row-cell {
  background-color: rgba(124, 45, 18, 0.3) !important;
}
</style>
