<template>
  <fieldset class="w-full border border-gray-300 rounded-lg p-4">
    <legend>Expense Details</legend>
    <el-form
      label-position="top"
      :model="form"
      :rules="rules"
      ref="expenseForm"
    >
      <AmountInput v-model.number="form.amount" required />
      <GenericInput
        v-model="form.description"
        label="Description"
        prop="description"
        placeholder="Enter description"
        required
        :maxlength="200"
      />
      <GenericInput
        v-model="form.location"
        label="Location"
        prop="location"
        placeholder="Enter location"
        required
        :maxlength="100"
      />
      <GenericInput
        v-model="form.recipient"
        label="Recipient"
        prop="recipient"
        placeholder="To Whom"
        required
        :maxlength="50"
      />
      <!-- Receipt Upload (optional) -->
      <div class="mb-4">
        <p class="text-sm font-medium receipt-label mb-1">
          Receipt
          <span class="text-gray-400 dark:text-gray-500 font-normal text-xs">(optional)</span>
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
          <span v-else class="text-sm text-gray-400 dark:text-gray-500">No file chosen</span>
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
      <div class="flex justify-end" v-if="!isEditMode">
        <GenericButton v-if="showForm" type="info" @click="$emit('click')"
          >Cancel</GenericButton
        >
        <el-button
          type="success"
          :loading="receiptUploading"
          @click="() => validateForm()"
        >
          {{ receiptUploading ? 'Uploading...' : 'Add Expense' }}
        </el-button>
      </div>
    </el-form>
  </fieldset>
</template>

<script setup>
import { rules } from '../../assets/validation-rules'
import { GenericButton, AmountInput, GenericInput } from '../generic-components'
import { ExpenseForm } from '../../scripts/expense-form'

const emit = defineEmits(['closeModal', 'click'])
const props = defineProps({
  row: Object,
  showForm: Boolean
})

const {
  isEditMode,
  form,
  expenseForm,
  validateForm,
  receiptFile,
  receiptUploading,
  fileInputRef,
  existingReceiptUrl,
  triggerFileInput,
  handleReceiptChange,
  removeReceipt
} = ExpenseForm(props, emit)


defineExpose({
  validateForm,
  expenseForm
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
