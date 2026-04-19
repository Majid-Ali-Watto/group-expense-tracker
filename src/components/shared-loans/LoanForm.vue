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
          <!-- Receipt upload at top -->
          <div>
            <ReceiptOcrField
              :selected-files="receiptFiles"
              :existing-urls="existingReceiptUrls"
              :uploading="receiptUploading"
              :extracting="receiptExtracting"
              :multiple="false"
              helper-text="Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed. Max size: 1MB per file."
              @files-selected="setSelectedFiles"
              @remove="removeReceipt"
              @extract="extractTextFromReceipt"
            />
          </div>

          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
              <AmountInput v-model="formData.amount" required />
            </el-col>
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
              <GenericDropDown
                v-model="formData.category"
                label="Category"
                :options="categoryOptions"
                :allow-create="isPersonal"
                :placeholder="
                  isPersonal ? 'Add or select category' : 'Select category'
                "
              />
            </el-col>
          </el-row>

          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
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
            </el-col>
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
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

          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
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
                  v-if="!selectedGiverUser"
                  :rows="1"
                  v-model="formData.loanGiverMobile"
                  label="Loan Giver Mobile"
                  prop="loanGiverMobile"
                  required
                  type="textarea"
                  placeholder="e.g. 03001234567"
                  :maxlength="15"
                  :disabled="isMeGiver"
                  @blur="onGiverMobileBlur"
                />
                <GenericInput
                  v-if="!selectedGiverUser"
                  :rows="1"
                  :model-value="formData.loanGiver"
                  label="Loan Giver"
                  prop="loanGiver"
                  required
                  type="textarea"
                  placeholder="Loan Giver Name"
                  :maxlength="50"
                  :disabled="isMeGiver"
                  @update:modelValue="
                    formData.loanGiver = $event.toCapitalize()
                  "
                />
                <div
                  v-if="selectedGiverUser"
                  class="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span class="font-medium">{{ formData.loanGiver }}</span>
                  <span class="text-gray-400 text-xs"
                    >· {{ maskMobile(formData.loanGiverMobile) }}</span
                  >
                  <button
                    type="button"
                    class="ml-auto text-xs text-red-400 hover:text-red-500"
                    @click="selectedGiverUser = ''"
                  >
                    ✕ Change
                  </button>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
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
                  v-if="!selectedReceiverUser"
                  :rows="1"
                  v-model="formData.loanReceiverMobile"
                  label="Loan Receiver Mobile"
                  prop="loanReceiverMobile"
                  required
                  type="textarea"
                  placeholder="e.g. 03001234567"
                  :maxlength="15"
                  :disabled="isMeReceiver"
                  @blur="onReceiverMobileBlur"
                />
                <GenericInput
                  v-if="!selectedReceiverUser"
                  :rows="1"
                  :model-value="formData.loanReceiver"
                  label="Loan Receiver"
                  prop="loanReceiver"
                  required
                  type="textarea"
                  placeholder="Loan Receiver Name"
                  :maxlength="50"
                  :disabled="isMeReceiver"
                  @update:modelValue="
                    formData.loanReceiver = $event.toCapitalize()
                  "
                />
                <div
                  v-if="selectedReceiverUser"
                  class="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span class="font-medium">{{ formData.loanReceiver }}</span>
                  <span class="text-gray-400 text-xs"
                    >· {{ maskMobile(formData.loanReceiverMobile) }}</span
                  >
                  <button
                    type="button"
                    class="ml-auto text-xs text-red-400 hover:text-red-500"
                    @click="selectedReceiverUser = ''"
                  >
                    ✕ Change
                  </button>
                </div>
              </div>
            </el-col>
          </el-row>

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
              :loading="receiptUploading || receiptExtracting || isSubmitting"
              :disabled="receiptUploading || receiptExtracting || isSubmitting"
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
import { maskMobile } from '@/utils'
import {
  AmountInput,
  DataTimePicker,
  GenericDropDown,
  GenericInput,
  ReceiptOcrField
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
  requestClose,
  validateForm,
  receiptFiles,
  receiptExtracting,
  receiptUploading,
  categoryOptions,
  existingReceiptUrls,
  setSelectedFiles,
  removeReceipt,
  extractTextFromReceipt,
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
  validateForm,
  requestClose
})
</script>
