<template>
  <div class="space-y-4">
    <!-- Plus Button -->

    <AddNewTransactionButton
      v-if="!showTransactionForm && !isEditMode"
      text="Want to create a new transaction?"
      @click="openForm"
    />

    <!-- Transaction Form -->
    <fieldset v-else class="border border-gray-300 rounded-lg p-4">
      <legend>Transaction Details</legend>

      <!-- Warning Alert -->
      <el-alert
        v-if="!isEditMode"
        class="mb-4"
        title="Important Notice"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          Please verify the transaction details carefully. Once added, any
          changes or deletions will require approval from all group members.
        </template>
      </el-alert>

      <el-form
        :model="formData"
        :rules="rules"
        ref="transactionForm"
        label-position="top"
        class="space-y-4"
      >
        <el-row :gutter="20">
          <el-col :lg="12" :md="12" :sm="24">
            <AmountInput v-model="formData.amount" required />

            <!-- Payer Mode Toggle -->
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-medium text-gray-700">Payer Mode</span>
              <el-radio-group v-model="formData.payerMode" size="small">
                <el-radio-button value="single">Single</el-radio-button>
                <el-radio-button value="multiple">Multiple</el-radio-button>
              </el-radio-group>
            </div>

            <!-- Single Payer -->
            <GenericDropDown
              v-if="formData.payerMode === 'single'"
              label="Payer"
              prop="payer"
              v-model="formData.payer"
              placeholder="Select payer"
              :options="usersOptions"
              required
            />

            <!-- Multiple Payers -->
            <div v-else class="space-y-2 mb-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Payers</span>
                <el-button size="small" type="primary" @click="addPayer">
                  + Add Payer
                </el-button>
              </div>

              <div
                v-for="(p, index) in formData.payers"
                :key="index"
                class="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50"
              >
                <el-select
                  v-model="p.mobile"
                  placeholder="Select payer"
                  size="small"
                  class="flex-1"
                >
                  <el-option
                    v-for="opt in usersOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <el-input-number
                  v-model="p.amount"
                  :min="0"
                  :precision="2"
                  size="small"
                  controls-position="right"
                  placeholder="Amount"
                  style="width: 130px"
                />
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="removePayer(index)"
                >
                  ✕
                </el-button>
              </div>

              <!-- Payers balance check -->
              <div
                v-if="formData.payers.length > 0"
                class="flex items-center gap-2 text-sm"
              >
                <span class="text-gray-600">Payers total:</span>
                <span
                  :class="
                    payersTotal === parseFloat(formData.amount || 0)
                      ? 'text-green-600 font-semibold'
                      : 'text-orange-500 font-semibold'
                  "
                >
                  {{ payersTotal.toFixed(2) }} /
                  {{ parseFloat(formData.amount || 0).toFixed(2) }}
                </span>
                <el-tag
                  v-if="payersTotal === parseFloat(formData.amount || 0)"
                  type="success"
                  size="small"
                >
                  Balanced
                </el-tag>
                <el-tag v-else type="warning" size="small">Mismatch</el-tag>
              </div>
            </div>

            <el-form-item
              label="Participants"
              prop="participants"
              class="w-full"
            >
              <el-select
                filterable
                v-model="formData.participants"
                multiple
                disabled
                placeholder="Select participants"
                class="w-full"
                clearable
              >
                <el-option
                  v-for="opt in usersOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>

            <DataTimePicker v-model="formData.date" required />

            <!-- Receipt Upload (optional) -->
            <div class="mb-4">
              <p class="text-sm font-medium text-gray-700 mb-1">
                Receipt
                <span class="text-gray-400 font-normal text-xs"
                  >(optional)</span
                >
                <span class="block text-xs text-gray-500 mt-1">
                  Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed. Max size: 1MB per file.
                  {{ formData.payerMode === 'multiple' ? 'You can upload multiple files.' : 'Single file only.' }}
                </span>
              </p>
              <div class="flex items-center gap-2 flex-wrap">
                <el-button
                  size="small"
                  @click="triggerFileInput"
                  :disabled="receiptUploading"
                >
                  {{ receiptFiles.length ? 'Change File' : 'Choose File' }}
                </el-button>
                <span
                  v-if="receiptFiles.length"
                  class="text-sm text-gray-600 truncate max-w-[220px]"
                >
                  {{
                    receiptFiles.length === 1
                      ? receiptFiles[0].name
                      : receiptFiles[0].name +
                        ' +' +
                        (receiptFiles.length - 1) +
                        ' more'
                  }}
                </span>
                <span v-else class="text-sm text-gray-400">No file chosen</span>
                <el-button
                  v-if="receiptFiles.length"
                  size="small"
                  type="danger"
                  text
                  @click="removeReceipt"
                  >✕</el-button
                >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :multiple="formData.payerMode === 'multiple'"
                  @change="handleReceiptChange"
                />
              </div>
              <div
                v-if="existingReceiptUrls.length && !receiptFiles.length"
                class="flex flex-col gap-1 mt-1"
              >
                <a
                  v-for="(url, idx) in existingReceiptUrls"
                  :key="idx"
                  :href="url"
                  target="_blank"
                  rel="noopener"
                  class="text-xs text-blue-500 hover:underline inline-block"
                  >View receipt
                  {{ existingReceiptUrls.length > 1 ? idx + 1 : '' }}</a
                >
              </div>
            </div>
          </el-col>

          <el-col :lg="12" :md="12" :sm="24">
            <GenericInput
              :rows="9"
              v-model="formData.description"
              label="Description"
              prop="description"
              required
              type="textarea"
              placeholder="Enter description"
            />
          </el-col>
        </el-row>
        <!-- Split Mode -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-gray-700">Split Mode</span>
          <el-radio-group v-model="formData.splitMode" size="small">
            <el-radio-button value="equal">Equal</el-radio-button>
            <el-radio-button value="custom">Custom</el-radio-button>
          </el-radio-group>
        </div>
        <!-- Custom Split Items -->
        <div v-if="formData.splitMode === 'custom'" class="space-y-3">
          <div
            v-for="(item, index) in formData.splitItems"
            :key="index"
            class="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500"
                >Item {{ index + 1 }}</span
              >
              <el-button
                size="small"
                type="danger"
                text
                @click="removeSplitItem(index)"
              >
                ✕ Remove
              </el-button>
            </div>

            <el-row :gutter="12">
              <el-col :sm="14">
                <el-form-item label="Description" class="mb-1">
                  <el-input
                    v-model="item.description"
                    placeholder="e.g. Burger, Cake..."
                    size="small"
                  />
                </el-form-item>
              </el-col>
              <el-col :sm="10">
                <el-form-item label="Amount" class="mb-1">
                  <el-input-number
                    v-model="item.amount"
                    :min="0"
                    :precision="2"
                    size="small"
                    class="w-full"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="Participants" class="mb-0">
              <el-select
                v-model="item.participants"
                multiple
                placeholder="Who shared this item?"
                class="w-full"
                size="small"
              >
                <el-option
                  v-for="opt in usersOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <!-- Balance check -->
          <div
            v-if="formData.splitItems.length > 0"
            class="flex items-center gap-2 text-sm"
          >
            <span class="text-gray-600">Items total:</span>
            <span
              :class="
                splitItemsTotal === parseFloat(formData.amount || 0)
                  ? 'text-green-600 font-semibold'
                  : 'text-orange-500 font-semibold'
              "
            >
              {{ splitItemsTotal.toFixed(2) }} /
              {{ parseFloat(formData.amount || 0).toFixed(2) }}
            </span>
            <el-tag
              v-if="splitItemsTotal === parseFloat(formData.amount || 0)"
              type="success"
              size="small"
            >
              Balanced
            </el-tag>
            <el-tag v-else type="warning" size="small">Mismatch</el-tag>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700">Split Items</span>
            <el-button size="small" type="primary" @click="addSplitItem">
              + Add Item
            </el-button>
          </div>
        </div>

        <!-- Buttons (only for add mode, not dialog edit mode) -->
        <div v-if="!isEditMode" class="flex justify-end gap-2">
          <el-button type="info" plain @click="closeForm"> Cancel </el-button>
          <el-button
            type="success"
            :loading="receiptUploading"
            @click="() => validateForm()"
          >
            {{ receiptUploading ? 'Uploading...' : 'Add Payment' }}
          </el-button>
        </div>
      </el-form>
    </fieldset>

    <!-- Expense List (only in add mode, not dialog edit mode) -->
    <HOC v-if="!isEditMode" :componentToBeRendered="ExpenseList" />
  </div>
</template>

<script setup>
import HOC from './HOC.vue'
import { defineAsyncComponent } from 'vue'
import {
  DataTimePicker,
  AmountInput,
  GenericDropDown,
  GenericInput
} from './generic-components'
import { rules } from '../assets/validation-rules'
import { PaymentForm } from '../scripts/payment-form'
import AddNewTransactionButton from './generic-components/AddNewTransactionButton.vue'

const ExpenseList = defineAsyncComponent(() => import('./ExpenseList.vue'))
const emit = defineEmits(['closeModal'])
const props = defineProps({
  row: Object
})

const {
  isEditMode,
  showTransactionForm,
  openForm,
  closeForm,
  usersOptions,
  formData,
  transactionForm,
  validateForm,
  splitItemsTotal,
  addSplitItem,
  removeSplitItem,
  payersTotal,
  addPayer,
  removePayer,
  receiptFiles,
  receiptUploading,
  fileInputRef,
  existingReceiptUrls,
  triggerFileInput,
  handleReceiptChange,
  removeReceipt
} = PaymentForm(props, emit)

defineExpose({
  validateForm
})
</script>
