<template>
  <GroupAccessGuard :group-id="$route.params.groupId">
    <div class="space-y-4">
      <!-- Plus Button -->

      <AddNewTransactionButton
        v-if="!isEditMode"
        :form-open="showTransactionForm"
        text="Want to create a new transaction?"
        @click="openForm"
        @close="closeForm"
      />

      <!-- Transaction Form -->
      <Transition name="form-slide">
        <fieldset
          v-if="showTransactionForm || isEditMode"
          class="border border-gray-300 rounded-lg p-4"
        >
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
            <el-row :gutter="12">
              <el-col :xs="24" :sm="12" :md="12" :lg="12">
                <AmountInput v-model="formData.amount" required />

                <!-- Payer Mode Toggle -->
                <div class="flex items-center justify-between mb-4">
                  <span class="text-sm font-medium text-gray-700"
                    >Payer Mode</span
                  >
                  <el-radio-group v-model="formData.payerMode" size="small">
                    <el-radio-button value="single">Single</el-radio-button>
                    <el-radio-button value="multiple">Multiple</el-radio-button>
                  </el-radio-group>
                </div>

                <!-- Single Payer -->
                <div v-if="formData.payerMode === 'single'" class="relative">
                  <el-checkbox
                    v-model="isMePayer"
                    size="small"
                    class="absolute top-0 right-0 z-10 text-xs"
                    >ME?</el-checkbox
                  >
                  <GenericDropDown
                    label="Payer"
                    prop="payer"
                    v-model="formData.payer"
                    placeholder="Select payer"
                    :options="usersOptions"
                    :disabled="isMePayer"
                    required
                  />
                </div>

                <!-- Multiple Payers -->
                <div v-else class="space-y-2 mb-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700"
                      >Payers</span
                    >
                    <el-button size="small" type="primary" @click="addPayer">
                      + Add Payer
                    </el-button>
                  </div>

                  <div
                    v-for="(p, index) in formData.payers"
                    :key="index"
                    class="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50"
                  >
                    <div class="flex-1 min-w-0">
                      <GenericDropDown
                        v-model="p.uid"
                        :options="usersOptions"
                        placeholder="Select payer"
                        size="small"
                        select-class="w-full"
                        :wrap-form-item="false"
                      />
                    </div>
                    <GenericInputNumber
                      v-model="p.amount"
                      :min="0"
                      :precision="2"
                      :wrap-form-item="false"
                      input-class="w-full"
                      style="width: 120px; flex-shrink: 0"
                    />
                    <el-button
                      size="small"
                      type="danger"
                      plain
                      style="flex-shrink: 0; padding: 5px 8px"
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

                <GenericDropDown
                  v-model="formData.participants"
                  label="Participants"
                  prop="participants"
                  :options="usersOptions"
                  placeholder="Select participants"
                  size="small"
                  multiple
                  disabled
                  required
                />
              </el-col>

              <el-col :xs="24" :sm="12" :md="12" :lg="12">
                <GenericInput
                  v-model="formData.location"
                  label="Location"
                  placeholder="Enter location"
                  :maxlength="100"
                />
                <GenericDropDown
                  v-model="formData.category"
                  label="Category"
                  prop="category"
                  :options="categoryOptions"
                  placeholder="Select category"
                  required
                />

                <GenericInput
                  :rows="1"
                  v-model="formData.description"
                  label="Description"
                  prop="description"
                  required
                  type="textarea"
                  placeholder="Enter description"
                  :maxlength="200"
                  :autosize="{ minRows: 1, maxRows: 3 }"
                />

                <DataTimePicker
                  v-model="formData.date"
                  required
                  type="date"
                  placeholder="Select date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-col>
            </el-row>

            <ReceiptUploadField
              :selected-files="receiptFiles"
              :existing-urls="existingReceiptUrls"
              :uploading="receiptUploading"
              :multiple="allowsMultiple"
              :helper-text="
                allowsMultiple
                  ? 'Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed. Max size: 1MB per file. You can upload multiple files.'
                  : 'Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed. Max size: 1MB per file. Single file only.'
              "
              @files-selected="setSelectedFiles"
              @remove="removeReceipt"
            />
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

                <div class="flex gap-2 items-end mb-1">
                  <el-form-item label="Description" class="mb-0 flex-1 min-w-0">
                    <GenericInputField
                      v-model="item.description"
                      placeholder="e.g. Burger, Cake..."
                      :maxlength="100"
                      :wrap-form-item="false"
                    />
                  </el-form-item>
                  <el-form-item
                    label="Amount"
                    class="mb-0"
                    style="width: 120px; flex-shrink: 0"
                  >
                    <GenericInputNumber
                      v-model="item.amount"
                      :min="0"
                      :precision="2"
                      :wrap-form-item="false"
                      input-class="w-full"
                    />
                  </el-form-item>
                </div>

                <el-form-item label="Participants" class="mb-0">
                  <GenericDropDown
                    v-model="item.participants"
                    :options="usersOptions"
                    placeholder="Who shared this item?"
                    size="small"
                    multiple
                    :wrap-form-item="false"
                  />
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
                <span class="text-sm font-semibold text-gray-700"
                  >Split Items</span
                >
                <el-button size="small" type="primary" @click="addSplitItem">
                  + Add Item
                </el-button>
              </div>
            </div>

            <!-- Buttons (only for add mode, not dialog edit mode) -->
            <div v-if="!isEditMode" class="flex justify-end gap-2">
              <el-button type="default" size="small" @click="resetForm">
                Reset
              </el-button>
              <el-button type="info" plain size="small" @click="closeForm">
                Cancel
              </el-button>
              <el-button
                type="success"
                size="small"
                :loading="receiptUploading || isSubmitting"
                :disabled="receiptUploading || isSubmitting"
                @click="() => validateForm()"
              >
                {{ receiptUploading ? 'Uploading...' : 'Add Payment' }}
              </el-button>
            </div>
          </el-form>
        </fieldset>
      </Transition>

      <!-- Expense List (only in add mode, not dialog edit mode) -->
      <HOC v-if="!isEditMode" :componentToBeRendered="ExpenseList" />
    </div>
  </GroupAccessGuard>
</template>

<script setup>
import { HOC } from '@/components/layout'
import { GroupAccessGuard } from '@/components/shared'
import {
  DataTimePicker,
  AmountInput,
  GenericDropDown,
  GenericInput,
  ReceiptUploadField
} from '@/components/generic-components'
import {
  GenericInputField,
  GenericInputNumber,
  AddNewTransactionButton
} from '@/components/generic-components'
import { rules } from '@/assets'
import { SharedExpenses } from '@/scripts/shared-expenses'
import { loadAsyncComponent } from '@/utils'

const ExpenseList = loadAsyncComponent(() => import('./ExpenseList.vue'))
const emit = defineEmits(['closeModal'])
const props = defineProps({
  row: Object
})

const {
  isEditMode,
  showTransactionForm,
  openForm,
  closeForm,
  requestClose,
  resetForm,
  usersOptions,
  categoryOptions,
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
  allowsMultiple,
  existingReceiptUrls,
  setSelectedFiles,
  removeReceipt,
  isMePayer,
  isSubmitting
} = SharedExpenses(props, emit)

defineExpose({
  validateForm,
  requestClose
})
</script>
