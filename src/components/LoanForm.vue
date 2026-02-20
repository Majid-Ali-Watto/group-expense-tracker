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
              v-model="formData.loanGiver"
              label="Loan Giver"
              prop="loanGiver"
              required
              type="textarea"
              placeholder="Loan Giver Name"
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
            />
          </el-col>
        </el-row>

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
        <div v-if="!isEditMode" class="flex justify-end gap-2">
          <el-button type="info" plain @click="closeForm"> Cancel </el-button>
          <el-button
            v-if="isVisible"
            type="success"
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
  friends: Array,
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
  removeReceipt
} = LoanForm(props, emit)

defineExpose({
  validateForm
})
</script>
