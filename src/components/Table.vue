<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="w-full overflow-x-auto">
    <table
      class="w-full border-collapse rounded-md shadow-md overflow-hidden"
      style="width: 100% !important; min-width: 800px !important"
    >
      <thead>
        <tr
          class="bg-gradient-to-r from-gray-800 to-black text-white text-left"
        >
          <!-- Render table headers -->
          <th
            v-for="(header, index) in headers"
            :key="index"
            class="px-6 py-3 border border-gray-700 font-semibold text-sm uppercase tracking-wide"
          >
            {{ header.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          @dblclick="() => handleDoubleClick(row)"
          @click="() => (showPopup ? handleClick(row, rowIndex) : null)"
          v-for="(row, rowIndex) in rows"
          :key="rowIndex"
          :class="[
            'w-full transition duration-300 ease-in-out',
            row.deleteRequest
              ? 'bg-red-50 hover:bg-red-100'
              : row.updateRequest
                ? 'bg-orange-50 hover:bg-orange-100'
                : 'hover:bg-indigo-100 even:bg-gray-50'
          ]"
        >
          <td
            v-for="header in headers"
            :key="header.key"
            class="px-6 py-3 border border-gray-300 text-sm text-gray-700"
          >
            <span v-if="header.key === 'amount'">{{
              formatAmount(row[header.key])
            }}</span>
            <span v-else-if="header.key === 'split'">
              <template v-if="Array.isArray(row.split)">
                <span v-for="(s, i) in row.split" :key="i">
                  {{
                    (tabStore.getUserByMobile(s.mobile)?.name || s.mobile) +
                    ': ' +
                    formatAmount(s.amount)
                  }}<span v-if="i < row.split.length - 1">, </span>
                </span>
              </template>
              <template v-else>
                {{ row.split }}
              </template>
            </span>
            <span v-else-if="header.key === 'payer'">
              <template
                v-if="row.payerMode === 'multiple' && row.payers?.length"
              >
                <span v-for="(p, i) in row.payers" :key="i">
                  {{
                    tabStore.getUserByMobile(p.mobile)?.name +
                      ` (${p.mobile})` || p.mobile
                  }}: {{ formatAmount(p.amount)
                  }}<span v-if="i < row.payers.length - 1">, </span>
                </span>
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
                <a
                  v-for="(url, i) in row.receiptUrls"
                  :key="i"
                  :href="url"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:underline mr-2"
                >
                  Receipt {{ i + 1 }}
                </a>
              </template>
              <template v-else>—</template>
            </span>
            <span v-else-if="header.key === 'receiptUrl'">
              <template v-if="row.receiptUrl">
                <a
                  :href="row.receiptUrl"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:underline"
                >
                  View Receipt
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
    <GenericButton type="warning" @click="downloadExcelData"
      >Download Excel</GenericButton
    >
  </div>
</template>

<script setup>
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
  friends: {
    type: Array
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
  childRef
} = Table(props)
</script>
