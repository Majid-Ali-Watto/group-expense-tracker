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
      <ReceiptUploadField
        :selected-files="receiptFiles"
        :existing-urls="existingReceiptUrls"
        :uploading="receiptUploading"
        @files-selected="setSelectedFiles"
        @remove="removeReceipt"
      />
      <div class="flex justify-end gap-2" v-if="!isEditMode">
        <GenericButton
          v-if="showForm"
          type="info"
          @click="$emit('click')"
          size="small"
          >Cancel</GenericButton
        >
        <el-button
          type="success"
          :loading="receiptUploading || isSubmitting"
          :disabled="receiptUploading || isSubmitting"
          @click="() => validateForm()"
          size="small"
        >
          {{ receiptUploading ? 'Uploading...' : 'Add Expense' }}
        </el-button>
      </div>
    </el-form>
  </fieldset>
</template>

<script setup>
import { rules } from '../../assets/validation-rules'
import {
  GenericButton,
  AmountInput,
  GenericInput,
  ReceiptUploadField
} from '../generic-components'
import { ExpenseForm } from '../../scripts/monthly-expenses/expense-form'

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
  receiptFiles,
  receiptUploading,
  existingReceiptUrls,
  setSelectedFiles,
  removeReceipt,
  isSubmitting
} = ExpenseForm(props, emit)

defineExpose({
  validateForm,
  expenseForm
})
</script>
