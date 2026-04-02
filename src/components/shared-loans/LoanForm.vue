<template>
  <div class="space-y-4">
    <!-- Plus Button -->

    <AddNewTransactionButton
      v-if="!isEditMode"
      :form-open="showForm"
      text="Want to add a new loan?"
      @click="openForm"
      @close="closeForm"
    />

    <!-- Loan Form -->
    <Transition name="form-slide">
      <fieldset
        v-if="showForm || isEditMode"
        class="border border-gray-300 rounded-lg p-4"
      >
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
          <el-row :gutter="5">
            <el-col :lg="12" :md="12" :sm="24">
              <AmountInput v-model="formData.amount" required />
              <div v-if="!isPersonal" class="relative">
                <el-checkbox
                  v-model="isMeGiver"
                  :disabled="isMeReceiver"
                  size="small"
                  class="absolute top-0 right-0 z-10 text-xs"
                  >ME?</el-checkbox
                >
                <GenericDropDown
                  v-model="formData.loanGiver"
                  label="Loan Giver"
                  prop="loanGiver"
                  :options="options"
                  placeholder="Select loan giver"
                  :disabled="isMeGiver"
                  required
                />
              </div>
              <div v-if="!isPersonal" class="relative">
                <el-checkbox
                  v-model="isMeReceiver"
                  :disabled="isMeGiver"
                  size="small"
                  class="absolute top-0 right-0 z-10 text-xs"
                  >ME?</el-checkbox
                >
                <GenericDropDown
                  v-model="formData.loanReceiver"
                  label="Loan Receiver"
                  prop="loanReceiver"
                  :options="options"
                  placeholder="Select loan receiver"
                  :disabled="isMeReceiver"
                  required
                />
              </div>
              <div v-if="isPersonal" class="relative">
                <el-checkbox
                  v-model="isMeGiver"
                  :disabled="isMeReceiver"
                  size="small"
                  class="absolute top-0 right-0 z-10 text-xs"
                  >ME?</el-checkbox
                >
                <div v-if="!isMeGiver" class="mb-1">
                  <button
                    type="button"
                    class="text-xs text-blue-500 hover:underline mb-1"
                    @click="toggleGiverDropdown"
                  >
                    {{
                      showGiverDropdown
                        ? 'Hide user selector'
                        : 'Select from Users'
                    }}
                  </button>
                  <GenericDropDown
                    v-if="showGiverDropdown"
                    v-model="selectedGiverUser"
                    :options="usersForDropdown"
                    placeholder="Pick a user (optional)"
                    size="small"
                    :wrap-form-item="false"
                  />
                </div>
                <GenericInput
                  :rows="1"
                  v-model="formData.loanGiverMobile"
                  label="Loan Giver Mobile"
                  prop="loanGiverMobile"
                  required
                  type="textarea"
                  placeholder="e.g. 03001234567"
                  :maxlength="15"
                  :disabled="isMeGiver || !!selectedGiverUser"
                  @blur="onGiverMobileBlur"
                />
                <GenericInput
                  :rows="1"
                  v-model="formData.loanGiver"
                  label="Loan Giver"
                  prop="loanGiver"
                  required
                  type="textarea"
                  placeholder="Loan Giver Name"
                  :maxlength="50"
                  :disabled="isMeGiver || !!selectedGiverUser"
                />
              </div>

              <!-- Personal loans: Receiver -->
              <div v-if="isPersonal" class="relative">
                <el-checkbox
                  v-model="isMeReceiver"
                  :disabled="isMeGiver"
                  size="small"
                  class="absolute top-0 right-0 z-10 text-xs"
                  >ME?</el-checkbox
                >
                <div v-if="!isMeReceiver" class="mb-1">
                  <button
                    type="button"
                    class="text-xs text-blue-500 hover:underline mb-1"
                    @click="toggleReceiverDropdown"
                  >
                    {{
                      showReceiverDropdown
                        ? 'Hide user selector'
                        : 'Select from Users'
                    }}
                  </button>
                  <GenericDropDown
                    v-if="showReceiverDropdown"
                    v-model="selectedReceiverUser"
                    :options="usersForDropdown"
                    placeholder="Pick a user (optional)"
                    size="small"
                    :wrap-form-item="false"
                  />
                </div>
                <GenericInput
                  :rows="1"
                  v-model="formData.loanReceiverMobile"
                  label="Loan Receiver Mobile"
                  prop="loanReceiverMobile"
                  required
                  type="textarea"
                  placeholder="e.g. 03001234567"
                  :maxlength="15"
                  :disabled="isMeReceiver || !!selectedReceiverUser"
                  @blur="onReceiverMobileBlur"
                />
              <GenericInput
                :rows="1"
                v-model="formData.loanReceiver"
                  label="Loan Receiver"
                  prop="loanReceiver"
                  required
                  type="textarea"
                  placeholder="Loan Receiver Name"
                :maxlength="50"
                :disabled="isMeReceiver || !!selectedReceiverUser"
              />
            </div>
            </el-col>
            <el-col :lg="12" :md="12" :sm="24">
              <GenericDropDown
                v-model="formData.category"
                label="Category"
                :options="categoryOptions"
                :allow-create="isPersonal"
                :placeholder="
                  isPersonal ? 'Add or select category' : 'Select category'
                "
              />
              <GenericInput
                :rows="1"
                v-model="formData.description"
                label="Description"
                prop="description"
                required
                type="textarea"
                placeholder="Loan details"
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
            :multiple="false"
            @files-selected="setSelectedFiles"
            @remove="removeReceipt"
          />
          <div v-if="!isEditMode" class="mb-3">
            <el-checkbox v-model="copyToExpenses" size="small">
              Also add a copy to Personal Expenses
            </el-checkbox>
          </div>
          <div v-if="!isEditMode" class="flex justify-end gap-2">
            <el-button type="default" size="small" @click="handleResetForm">
              Reset
            </el-button>
            <el-button type="info" plain size="small" @click="closeForm">
              Cancel
            </el-button>
            <el-button
              v-if="isVisible"
              type="success"
              size="small"
              :loading="receiptUploading || isSubmitting"
              :disabled="receiptUploading || isSubmitting"
              @click="() => validateForm()"
            >
              {{ receiptUploading ? 'Uploading...' : 'Add Loan' }}
            </el-button>
          </div>
        </el-form>
      </fieldset>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { rules } from '@/assets'
import {
  AmountInput,
  DataTimePicker,
  GenericDropDown,
  GenericInput,
  ReceiptUploadField
} from '@/components/generic-components'
import { LoanForm } from '@/scripts/shared-loans'
import { DB_NODES } from '@/constants'
import { AddNewTransactionButton } from '@/components/generic-components'

const emit = defineEmits(['closeModal', 'closeForm'])
const props = defineProps({
  row: Object,
  dbRef: { type: String, default: () => DB_NODES.SHARED_LOANS },
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
  resetForm,
  validateForm,
  receiptFiles,
  receiptUploading,
  categoryOptions,
  existingReceiptUrls,
  setSelectedFiles,
  removeReceipt,
  onGiverMobileBlur,
  onReceiverMobileBlur,
  isMeGiver,
  isMeReceiver,
  copyToExpenses,
  selectedGiverUser,
  selectedReceiverUser,
  usersForDropdown,
  isSubmitting
} = LoanForm(props, emit)

const showGiverDropdown = ref(false)
const showReceiverDropdown = ref(false)

function toggleGiverDropdown() {
  showGiverDropdown.value = !showGiverDropdown.value
  if (!showGiverDropdown.value) selectedGiverUser.value = ''
}

function toggleReceiverDropdown() {
  showReceiverDropdown.value = !showReceiverDropdown.value
  if (!showReceiverDropdown.value) selectedReceiverUser.value = ''
}

function handleResetForm() {
  showGiverDropdown.value = false
  showReceiverDropdown.value = false
  resetForm()
}

defineExpose({
  validateForm
})
</script>
