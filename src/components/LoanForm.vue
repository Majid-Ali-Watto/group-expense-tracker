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
        <div v-if="!isEditMode" class="flex justify-end gap-2">
          <el-button type="info" plain @click="closeForm"> Cancel </el-button>
          <GenericButton
            v-if="isVisible"
            type="success"
            @click="() => validateForm()"
            >Add Loan</GenericButton
          >
        </div>
      </el-form>
    </fieldset>
  </div>
</template>

<script setup>
import { rules } from '../assets/validation-rules'
import {
  AmountInput,
  GenericButton,
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
  validateForm
} = LoanForm(props, emit)

defineExpose({
  validateForm
})
</script>
