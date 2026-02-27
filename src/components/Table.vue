<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="w-full overflow-x-auto">
    <table
      class="w-full border-collapse rounded-md shadow-md overflow-hidden"
      style="width: 100% !important; min-width: 800px !important"
    >
      <thead>
        <tr class="bg-green-500 dark:bg-green-600 text-white text-left">
          <!-- Render table headers -->
          <th
            v-for="(header, index) in headers"
            :key="index"
            class="px-6 py-3 border border-green-600 dark:border-green-700 font-semibold text-sm uppercase tracking-wide"
          >
            {{ header.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          @click.stop="() => (showPopup ? handleRowClick(row, rowIndex) : null)"
          v-for="(row, rowIndex) in rows"
          :key="rowIndex"
          :class="[
            'w-full transition duration-300 ease-in-out',
            row.deleteRequest
              ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
              : row.updateRequest
                ? 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30'
                : 'hover:bg-indigo-100 dark:hover:bg-gray-700 even:bg-gray-50 dark:even:bg-gray-800/50'
          ]"
        >
          <td
            v-for="header in headers"
            :key="header.key"
            class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300"
          >
            <span v-if="header.key === 'amount'">{{
              formatAmount(row[header.key])
            }}</span>
            <span v-else-if="header.key === 'split'">
              <template v-if="Array.isArray(row.split)">
                <span v-for="(s, i) in row.split.slice(0, 2)" :key="i">
                  {{ formatSplit(s)
                  }}<span v-if="i < Math.min(1, row.split.length - 1)">, </span>
                </span>
                <el-button
                  v-if="row.split.length > 2"
                  link
                  size="small"
                  class="ml-2"
                  @click.stop="
                    openShowMore('Split Details', row.split.map(formatSplit))
                  "
                >
                  Show more (+{{ row.split.length - 2 }})
                </el-button>
              </template>
              <template v-else>
                {{ row.split }}
              </template>
            </span>
            <span v-else-if="header.key === 'payer'">
              <template
                v-if="row.payerMode === 'multiple' && row.payers?.length"
              >
                <span v-for="(p, i) in row.payers.slice(0, 2)" :key="i">
                  {{ formatPayer(p)
                  }}<span v-if="i < Math.min(1, row.payers.length - 1)"
                    >,
                  </span>
                </span>
                <el-button
                  v-if="row.payers.length > 2"
                  link
                  size="small"
                  class="ml-2"
                  @click.stop="
                    openShowMore('Payers', row.payers.map(formatPayer))
                  "
                >
                  Show more (+{{ row.payers.length - 2 }})
                </el-button>
              </template>
              <template v-else>
                {{
                  tabStore.getUserByMobile(row.payer)?.name +
                    ` (${row.payer})` || row.payer
                }}
              </template>
            </span>
            <span
              v-else-if="header.key === 'giver' || header.key === 'receiver'"
              >{{
                (tabStore.getUserByMobile(row[header.key])?.name ||
                  row[header.key]) + ` (${row[header.key]})`
              }}</span
            >
            <span v-else-if="header.key === 'receiptUrls'">
              <template
                v-if="Array.isArray(row.receiptUrls) && row.receiptUrls.length"
              >
                <ol class="list-decimal pl-4">
                  <li v-for="(url, i) in row.receiptUrls.slice(0, 2)" :key="i">
                    <a
                      :href="url"
                      target="_blank"
                      rel="noopener"
                      class="text-blue-600 dark:text-blue-400 hover:underline"
                      @click.stop
                    >
                      {{ getFileNameFromUrl(url) }}
                    </a>
                  </li>
                </ol>
                <el-button
                  v-if="row.receiptUrls.length > 2"
                  link
                  size="small"
                  class="ml-1"
                  @click.stop="
                    openShowMore(
                      'Receipts',
                      row.receiptUrls.map((u) => formatReceipt(u))
                    )
                  "
                >
                  Show more (+{{ row.receiptUrls.length - 2 }})
                </el-button>
              </template>
              <template v-else>—</template>
            </span>
            <span v-else-if="header.key === 'receiptUrl'">
              <template v-if="row.receiptUrl">
                <a
                  :href="row.receiptUrl"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 dark:text-blue-400 hover:underline"
                  @click.stop
                >
                  {{ getFileNameFromUrl(row.receiptUrl) }}
                </a>
              </template>
              <template v-else>—</template>
            </span>
            <span v-else>
              {{
                typeof row[header.key] === 'object'
                  ? JSON.stringify(row[header.key])
                  : row[header.key]
              }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
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
        <!-- <hr/> -->
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
    <GenericButton type="" @click="downloadExcelData"
      >Download Excel</GenericButton
    >
  </div>

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
</template>

<script setup>
import { ref } from 'vue'
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
  handleRowClick,
  downloadExcelData,
  downloadPdfData,
  childRef,
  getFileNameFromUrl
} = Table(props)

const showMoreDialogVisible = ref(false)
const showMoreTitle = ref('')
const showMoreItems = ref([])

const formatPayer = (p) =>
  `${tabStore.getUserByMobile(p.mobile)?.name || p.mobile} (${p.mobile}): ${formatAmount(p.amount)}`

const formatSplit = (s) =>
  `${tabStore.getUserByMobile(s.mobile)?.name || s.mobile}: ${formatAmount(s.amount)}`

const formatReceipt = (url) => ({
  label: getFileNameFromUrl(url),
  href: url
})

function openShowMore(title, items) {
  showMoreTitle.value = title
  showMoreItems.value = items
  showMoreDialogVisible.value = true
}
</script>
