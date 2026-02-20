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
      />
      <GenericInput
        v-model="form.location"
        label="Location"
        prop="location"
        placeholder="Enter location"
        required
      />
      <GenericInput
        v-model="form.recipient"
        label="Recipient"
        prop="recipient"
        placeholder="To Whom"
        required
      />
      <!-- Receipt Upload (optional) -->
      <div class="mb-4">
        <p class="text-sm font-medium text-gray-700 mb-1">
          Receipt
          <span class="text-gray-400 font-normal text-xs">(optional)</span>
        </p>
        <div class="flex items-center gap-2 flex-wrap">
          <el-button size="small" @click="triggerFileInput" :disabled="receiptUploading">
            {{ receiptFile ? 'Change File' : 'Choose File' }}
          </el-button>
          <span v-if="receiptFile" class="text-sm text-gray-600 truncate max-w-[180px]">
            {{ receiptFile.name }}
          </span>
          <span v-else class="text-sm text-gray-400">No file chosen</span>
          <el-button
            v-if="receiptFile"
            size="small"
            type="danger"
            text
            @click="removeReceipt"
          >✕</el-button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*,.pdf"
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
        >View current receipt</a>
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
import { onMounted, watch } from 'vue'

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

// Debug: Watch the expenseForm ref
watch(() => expenseForm.value, (newVal) => {
  console.log('ExpenseForm ref changed:', newVal)
}, { immediate: true })

onMounted(() => {
  console.log('ExpenseForm component mounted')
  console.log('expenseForm ref on mount:', expenseForm.value)
})

defineExpose({
  validateForm,
  expenseForm
})
</script>
