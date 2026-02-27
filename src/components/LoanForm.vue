<template>
  <div class="space-y-4">
    <!-- Plus Button -->

    <AddNewTransactionButton
      v-if="!showForm && !isEditMode"
      text="Want to add a new loan?"
      @click="openForm"
    />

    <!-- Loan Form -->
    <fieldset v-else class="border border-gray-300 rounded-lg p-4">
      <legend>Loan Details</legend>

      <!-- Warning Alert for Shared Loans -->
      <el-alert
        v-if="!isPersonal && !isEditMode"
        class="mb-4"
        title="Important Notice"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          Please verify the loan details carefully. Once added, any changes or
          deletions will require approval from all group members.
        </template>
      </el-alert>

      <el-form
        :model="formData"
        :rules="rules"
        ref="loanForm"
        label-position="top"
        class="space-y-4"
      >
        <el-row :gutter="20">
          <el-col :lg="12" :md="12" :sm="24">
            <AmountInput v-model="formData.amount" required />
            <GenericDropDown
              v-if="!isPersonal"
              v-model="formData.loanGiver"
              label="Loan Giver"
              prop="loanGiver"
              :options="options"
              placeholder="Select loan giver"
              required
            />
            <GenericDropDown
              v-if="!isPersonal"
              v-model="formData.loanReceiver"
              label="Loan Receiver"
              prop="loanReceiver"
              :options="options"
              placeholder="Select loan receiver"
              required
            />
            <GenericInput
              v-if="isPersonal"
              :rows="1"
              v-model="formData.loanGiverMobile"
              label="Loan Giver Mobile"
              prop="loanGiverMobile"
              required
              type="textarea"
              placeholder="e.g. 03001234567"
              :maxlength="15"
              @blur="onGiverMobileBlur"
            />
            <GenericInput
              v-if="isPersonal"
              :rows="1"
              v-model="formData.loanGiver"
              label="Loan Giver"
              prop="loanGiver"
              required
              type="textarea"
              placeholder="Loan Giver Name"
              :maxlength="50"
            />
            <GenericInput
              v-if="isPersonal"
              :rows="1"
              v-model="formData.loanReceiverMobile"
              label="Loan Receiver Mobile"
              prop="loanReceiverMobile"
              required
              type="textarea"
              placeholder="e.g. 03001234567"
              :maxlength="15"
              @blur="onReceiverMobileBlur"
            />
            <GenericInput
              v-if="isPersonal"
              :rows="1"
              v-model="formData.loanReceiver"
              label="Loan Receiver"
              prop="loanReceiver"
              required
              type="textarea"
              placeholder="Loan Receiver Name"
              :maxlength="50"
            />
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <GenericInput
              :rows="9"
              v-model="formData.description"
              label="Description"
              prop="description"
              required
              type="textarea"
              placeholder="Loan details"
              :maxlength="100"
            />
          </el-col>
        </el-row>

        <!-- Receipt Upload (optional) -->
        <div class="mb-4">
          <p class="text-sm font-medium receipt-label mb-1">
            Receipt
            <span class="text-gray-400 dark:text-gray-500 font-normal text-xs"
              >(optional)</span
            >
            <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">
              Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed. Max size:
              1MB per file.
            </span>
          </p>
          <div class="flex items-center gap-2 flex-wrap">
            <el-button
              size="small"
              @click="triggerFileInput"
              :disabled="receiptUploading"
            >
              {{ receiptFile ? 'Change File' : 'Choose File' }}
            </el-button>
            <span
              v-if="receiptFile"
              class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]"
            >
              {{ receiptFile.name }}
            </span>
            <span v-else class="text-sm text-gray-400 dark:text-gray-500"
              >No file chosen</span
            >
            <el-button
              v-if="receiptFile"
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
              @change="handleReceiptChange"
            />
          </div>
          <a
            v-if="existingReceiptUrl && !receiptFile"
            :href="existingReceiptUrl"
            target="_blank"
            rel="noopener"
            class="text-xs text-blue-500 hover:underline mt-1 inline-block"
            >View current receipt</a
          >
        </div>
        <div v-if="!isEditMode" class="flex justify-end gap-2">
          <el-button type="info" plain size="small" @click="closeForm">
            Cancel
          </el-button>
          <el-button
            v-if="isVisible"
            type="success"
            size="small"
            :loading="receiptUploading"
            @click="() => validateForm()"
          >
            {{ receiptUploading ? 'Uploading...' : 'Add Loan' }}
          </el-button>
        </div>
      </el-form>
    </fieldset>
  </div>
</template>

<script setup>
import { rules } from '../assets/validation-rules'
import {
  AmountInput,
  GenericDropDown,
  GenericInput
} from './generic-components'
import { LoanForm } from '../scripts/loan-form'
import AddNewTransactionButton from './generic-components/AddNewTransactionButton.vue'

const emit = defineEmits(['closeModal', 'closeForm'])
const props = defineProps({
  row: Object,
  dbRef: { type: String, default: 'loans' },
  isPersonal: { type: Boolean, default: false },
  showForm: { type: Boolean, default: false }
})

const {
  options,
  loanForm,
  isVisible,
  isEditMode,
  formData,
  openForm,
  closeForm,
  validateForm,
  receiptFile,
  receiptUploading,
  fileInputRef,
  existingReceiptUrl,
  triggerFileInput,
  handleReceiptChange,
  removeReceipt,
  onGiverMobileBlur,
  onReceiverMobileBlur
} = LoanForm(props, emit)

defineExpose({
  validateForm
})
</script>

<style scoped>
.receipt-label {
  color: #111827 !important; /* text-gray-900 */
}

:root.dark-theme .receipt-label {
  color: #d1d5db !important; /* text-gray-300 */
}
</style>
