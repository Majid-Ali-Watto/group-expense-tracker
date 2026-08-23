<template>
  <div class="space-y-4">
    <!-- Plus Button -->

    <AddNewTransactionButton
      v-if="!isEditMode"
      :form-open="showForm"
      :text="t('sharedLoans.newLoan')"
      @click="openForm"
      @close="closeForm"
    />

    <!-- Loan Form -->
    <Transition name="form-slide">
      <fieldset
        v-if="showForm || isEditMode"
        class="border border-gray-300 rounded-lg p-4"
      >
        <legend>{{ t('sharedLoans.loanDetails') }}</legend>

        <!-- Warning Alert for Shared Loans -->
        <el-alert
          v-if="!isPersonal && !isEditMode"
          class="mb-4"
          :title="t('common.importantNotice')"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            {{
              t('approval.verifyWarning', {
                type: t('sharedLoans.loanDetails')
              })
            }}
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
              :helper-text="t('common.receiptHelperDefault')"
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
                :label="t('common.category')"
                :options="categoryOptions"
                :allow-create="isPersonal"
                :placeholder="
                  isPersonal
                    ? t('sharedLoans.addOrSelectCategory')
                    : t('common.selectCategory')
                "
              />
            </el-col>
          </el-row>

          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
              <GenericInput
                :rows="1"
                v-model="formData.description"
                :label="t('common.description')"
                prop="description"
                required
                type="textarea"
                :placeholder="t('sharedLoans.loanDescription')"
                :maxlength="200"
                :autosize="{ minRows: 1, maxRows: 3 }"
              />
            </el-col>
            <el-col :xs="24" :sm="12" :md="12" :lg="12">
              <DataTimePicker
                v-model="formData.date"
                required
                type="date"
                :placeholder="t('common.selectDate')"
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
                  >{{ t('common.me') }}</el-checkbox
                >
                <GenericDropDown
                  v-model="formData.loanGiver"
                  :label="t('sharedLoans.loanGiver')"
                  prop="loanGiver"
                  :options="options"
                  :placeholder="t('sharedLoans.selectLoanGiver')"
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
                  >{{ t('common.me') }}</el-checkbox
                >
                <div v-if="!isMeGiver" class="mb-1">
                  <button
                    type="button"
                    class="text-xs text-blue-500 hover:underline mb-1"
                    @click="toggleGiverDropdown"
                  >
                    {{
                      showGiverDropdown
                        ? t('sharedLoans.hideUserSelector')
                        : t('sharedLoans.selectFromUsers')
                    }}
                  </button>
                  <GenericDropDown
                    v-if="showGiverDropdown"
                    v-model="selectedGiverUser"
                    :options="usersForDropdown"
                    :placeholder="t('sharedLoans.pickUserOptional')"
                    size="default"
                    :wrap-form-item="false"
                  />
                </div>
                <GenericMobileInput
                  v-if="!selectedGiverUser"
                  :model-value="formData.loanGiverMobile"
                  :label="t('sharedLoans.loanGiverMobile')"
                  prop="loanGiverMobile"
                  required
                  :placeholder="t('sharedLoans.mobilePlaceholder')"
                  :disabled="isMeGiver"
                  @blur="onGiverMobileBlur"
                  @update:modelValue="formData.loanGiverMobile = $event"
                />
                <GenericInput
                  v-if="!selectedGiverUser"
                  :rows="1"
                  :model-value="formData.loanGiver"
                  :label="t('sharedLoans.loanGiver')"
                  prop="loanGiver"
                  required
                  type="textarea"
                  :placeholder="t('sharedLoans.giverNamePlaceholder')"
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
                    ✕ {{ t('common.change') }}
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
                  >{{ t('common.me') }}</el-checkbox
                >
                <GenericDropDown
                  v-model="formData.loanReceiver"
                  :label="t('sharedLoans.loanReceiver')"
                  prop="loanReceiver"
                  :options="options"
                  :placeholder="t('sharedLoans.selectLoanReceiver')"
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
                  >{{ t('common.me') }}</el-checkbox
                >
                <div v-if="!isMeReceiver" class="mb-1">
                  <button
                    type="button"
                    class="text-xs text-blue-500 hover:underline mb-1"
                    @click="toggleReceiverDropdown"
                  >
                    {{
                      showReceiverDropdown
                        ? t('sharedLoans.hideUserSelector')
                        : t('sharedLoans.selectFromUsers')
                    }}
                  </button>
                  <GenericDropDown
                    v-if="showReceiverDropdown"
                    v-model="selectedReceiverUser"
                    :options="usersForDropdown"
                    :placeholder="t('sharedLoans.pickUserOptional')"
                    size="default"
                    :wrap-form-item="false"
                  />
                </div>
                <GenericMobileInput
                  v-if="!selectedReceiverUser"
                  :model-value="formData.loanReceiverMobile"
                  :label="t('sharedLoans.loanReceiverMobile')"
                  prop="loanReceiverMobile"
                  required
                  :placeholder="t('sharedLoans.mobilePlaceholder')"
                  :disabled="isMeReceiver"
                  @blur="onReceiverMobileBlur"
                  @update:modelValue="formData.loanReceiverMobile = $event"
                />
                <GenericInput
                  v-if="!selectedReceiverUser"
                  :rows="1"
                  :model-value="formData.loanReceiver"
                  :label="t('sharedLoans.loanReceiver')"
                  prop="loanReceiver"
                  required
                  type="textarea"
                  :placeholder="t('sharedLoans.receiverNamePlaceholder')"
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
                    ✕ {{ t('common.change') }}
                  </button>
                </div>
              </div>
            </el-col>
          </el-row>

          <div v-if="!isEditMode" class="mb-3">
            <el-checkbox v-model="copyToExpenses" size="small">
              {{ t('sharedLoans.copyToExpenses') }}
            </el-checkbox>
          </div>
          <div v-if="!isEditMode" class="flex justify-end gap-2">
            <el-button type="default" size="default" @click="handleResetForm">
              {{ t('common.reset') }}
            </el-button>
            <el-button type="info" plain size="default" @click="closeForm">
              {{ t('common.cancel') }}
            </el-button>
            <el-button
              v-if="isVisible"
              type="success"
              size="default"
              :loading="receiptUploading || receiptExtracting || isSubmitting"
              :disabled="receiptUploading || receiptExtracting || isSubmitting"
              @click="() => validateForm()"
            >
              {{
                receiptUploading
                  ? t('common.uploading')
                  : t('sharedLoans.addLoan')
              }}
            </el-button>
          </div>
        </el-form>
      </fieldset>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getRules } from '@/assets'
import { maskMobile } from '@/utils'
import {
  AmountInput,
  DataTimePicker,
  GenericDropDown,
  GenericInput,
  GenericMobileInput,
  ReceiptOcrField
} from '@/components/generic-components'
import { LoanForm } from '@/scripts/shared-loans'
import { DB_NODES } from '@/constants'
import { AddNewTransactionButton } from '@/components/generic-components'

const { t, locale } = useI18n()
const rules = computed(() => getRules(locale.value))
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
