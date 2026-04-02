<template>
  <fieldset class="w-full border border-gray-300 rounded-lg p-4">
    <legend>Expense Details</legend>
    <el-form
      label-position="top"
      :model="form"
      :rules="rules"
      ref="expenseForm"
      class="px-2"
    >
      <AmountInput v-model.number="form.amount" required />
      <GenericDropDown
        v-model="form.category"
        label="Category"
        prop="category"
        placeholder="Add or select category"
        :options="categoryOptions"
        :allow-create="true"
        required
      />
      <GenericInput
        :rows="1"
        v-model="form.description"
        label="Description"
        prop="description"
        placeholder="Enter description"
        required
        type="textarea"
        :maxlength="200"
        :autosize="{ minRows: 1, maxRows: 3 }"
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
      <DataTimePicker
        v-model="form.date"
        required
        type="date"
        placeholder="Select date"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
      />
      <ReceiptUploadField
        :selected-files="receiptFiles"
        :existing-urls="existingReceiptUrls"
        :uploading="receiptUploading"
        :multiple="false"
        @files-selected="setSelectedFiles"
        @remove="removeReceipt"
      />
      <div class="flex justify-end gap-2" v-if="!isEditMode">
        <el-button type="default" size="small" @click="resetForm">
          Reset
        </el-button>
        <GenericButton
          v-if="showForm"
          type="info"
          @click="handleCancel"
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
import { rules } from '@/assets'
import {
  GenericButton,
  AmountInput,
  DataTimePicker,
  GenericDropDown,
  GenericInput,
  ReceiptUploadField
} from '@/components/generic-components'
import { PersonalExpenseForm } from '@/scripts/personal-expenses'

const emit = defineEmits(['closeModal', 'click'])
const props = defineProps({
  row: Object,
  showForm: Boolean
})

const {
  isEditMode,
  form,
  categoryOptions,
  expenseForm,
  validateForm,
  resetForm,
  receiptFiles,
  receiptUploading,
  existingReceiptUrls,
  setSelectedFiles,
  removeReceipt,
  isSubmitting
} = PersonalExpenseForm(props, emit)

function handleCancel() {
  resetForm()
  emit('click')
}

defineExpose({
  validateForm,
  expenseForm
})
</script>
