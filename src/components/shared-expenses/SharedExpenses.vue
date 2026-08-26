<template>
  <GroupAccessGuard :group-id="$route.params.groupId">
    <div class="space-y-4">
      <!-- Plus Button -->

      <AddNewTransactionButton v-if="!isEditMode" :form-open="showTransactionForm"
        :text="t('sharedExpenses.newTransaction')" @click="openForm" @close="closeForm" />

      <!-- Transaction Form -->
      <Transition name="form-slide">
        <fieldset v-if="showTransactionForm || isEditMode" class="border border-gray-300 rounded-lg p-4">
          <legend>{{ t('sharedExpenses.transactionDetails') }}</legend>

          <!-- Warning Alert -->
          <el-alert v-if="!isEditMode" class="mb-4" :title="t('common.importantNotice')" type="warning"
            :closable="false" show-icon>
            <template #default>
              {{
                t('approval.verifyWarning', {
                  type: t('sharedExpenses.transactionDetails')
                })
              }}
            </template>
          </el-alert>

          <el-form :model="formData" :rules="rules" ref="transactionForm" label-position="top" class="space-y-4">
            <div>
              <ReceiptOcrField :selected-files="receiptFiles" :existing-urls="existingReceiptUrls"
                :uploading="receiptUploading" :extracting="receiptExtracting" :multiple="allowsMultiple" :helper-text="allowsMultiple
                    ? t('common.receiptHelperMultiple')
                    : t('common.receiptHelperSingle')
                  " @files-selected="setSelectedFiles" @remove="removeReceipt" @extract="extractTextFromReceipt" />
            </div>

            <el-row :gutter="12">
              <el-col :xs="24" :sm="12" :md="12" :lg="12">
                <div class="flex gap-2 items-start">
                  <AmountInput v-model="formData.amount" required class="flex-1" />
                  <el-form-item label="&nbsp;" class="amount-currency-item">
                    <el-select v-model="formData.currency" class="w-full" size="default">
                      <el-option v-for="option in currencyOptions" :key="option.code" :value="option.code"
                        :label="option.code" />
                    </el-select>
                  </el-form-item>
                </div>
                <p v-if="convertedAmountPreview" class="text-xs text-gray-500 -mt-3 mb-3">
                  {{
                    t('sharedExpenses.willConvertTo', {
                      amount: convertedAmountPreview,
                      currency: activeGroupCurrency
                    })
                  }}
                </p>

                <!-- Payer Mode Toggle -->
                <div class="flex items-center justify-between mb-4">
                  <span class="text-sm font-medium text-gray-700">{{
                    t('sharedExpenses.payerMode')
                    }}</span>
                  <el-radio-group v-model="formData.payerMode" size="small">
                    <el-radio-button value="single">{{
                      t('common.single')
                      }}</el-radio-button>
                    <el-radio-button value="multiple">{{
                      t('common.multiple')
                      }}</el-radio-button>
                  </el-radio-group>
                </div>

                <!-- Single Payer -->
                <div v-if="formData.payerMode === 'single'" class="field-with-me-toggle">
                  <GenericDropDown prop="payer" v-model="formData.payer" :placeholder="t('sharedExpenses.selectPayer')"
                    :options="usersOptions" :disabled="isMePayer" required>
                    <template #label>
                      <span class="inline-flex items-center justify-between w-full">
                        <span>{{ t('sharedExpenses.payer') }}</span>
                        <el-checkbox v-model="isMePayer" size="small" class="text-xs">{{ t('common.me') }}</el-checkbox>
                      </span>
                    </template>
                  </GenericDropDown>
                </div>

                <!-- Multiple Payers -->
                <div v-else class="space-y-2 mb-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">{{
                      t('table.payersTitle')
                      }}</span>
                    <el-button size="default" type="primary" @click="addPayer">
                      {{ t('sharedExpenses.addPayer') }}
                    </el-button>
                  </div>

                  <div v-for="(p, index) in formData.payers" :key="index"
                    class="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <div class="flex-1 min-w-0">
                      <GenericDropDown v-model="p.uid" :options="usersOptions"
                        :placeholder="t('sharedExpenses.selectPayer')" size="default" select-class="w-full"
                        :wrap-form-item="false" />
                    </div>
                    <GenericInputNumber v-model="p.amount" :min="0" :precision="2" :wrap-form-item="false"
                      input-class="w-full" :width="120" style="flex-shrink: 0" />
                    <el-button size="small" type="danger" plain circle style="flex-shrink: 0"
                      @click="removePayer(index)">
                      ✕
                    </el-button>
                  </div>

                  <!-- Payers balance check -->
                  <div v-if="formData.payers.length > 0" class="flex items-center gap-2 text-sm">
                    <span class="text-gray-600">{{
                      t('sharedExpenses.payersTotal')
                      }}</span>
                    <span :class="payersTotal === parseFloat(formData.amount || 0)
                        ? 'text-green-600 font-semibold'
                        : 'text-orange-500 font-semibold'
                      ">
                      {{ payersTotal.toFixed(2) }} /
                      {{ parseFloat(formData.amount || 0).toFixed(2) }}
                    </span>
                    <el-tag v-if="payersTotal === parseFloat(formData.amount || 0)" type="success" size="small">
                      {{ t('common.balanced') }}
                    </el-tag>
                    <el-tag v-else type="warning" size="small">{{
                      t('common.mismatch')
                      }}</el-tag>
                  </div>
                </div>

                <GenericDropDown v-model="formData.participants" :label="t('sharedExpenses.participants')"
                  prop="participants" :options="usersOptions" :placeholder="t('sharedExpenses.selectParticipants')"
                  size="default" multiple disabled required />
              </el-col>

              <el-col :xs="24" :sm="12" :md="12" :lg="12">
                <GenericInput v-model="formData.location" :label="t('common.location')"
                  :placeholder="t('common.enterLocation')" :maxlength="100" />
                <GenericDropDown v-model="formData.category" :label="t('common.category')" prop="category"
                  :options="categoryOptions" :placeholder="t('common.selectCategory')" required />

                <GenericInput :rows="1" v-model="formData.description" :label="t('common.description')"
                  prop="description" required type="textarea" :placeholder="t('common.enterDescription')"
                  :maxlength="200" :autosize="{ minRows: 1, maxRows: 3 }" />

                <DataTimePicker v-model="formData.date" required type="date" :placeholder="t('common.selectDate')"
                  format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
              </el-col>
            </el-row>

            <!-- Split Mode -->
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-medium text-gray-700">{{
                t('sharedExpenses.splitMode')
                }}</span>
              <el-radio-group v-model="formData.splitMode" size="small">
                <el-radio-button value="equal">{{
                  t('common.equal')
                  }}</el-radio-button>
                <el-radio-button value="custom">{{
                  t('common.custom')
                  }}</el-radio-button>
              </el-radio-group>
            </div>
            <!-- Custom Split Items -->
            <div v-if="formData.splitMode === 'custom'" class="space-y-3">
              <div v-for="(item, index) in formData.splitItems" :key="index"
                class="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-gray-500">{{
                    t('sharedExpenses.item', { index: index + 1 })
                    }}</span>
                  <el-button size="small" type="danger" plain circle @click="removeSplitItem(index)">
                    ✕
                  </el-button>
                </div>

                <div class="flex flex-wrap mb-1" style="gap: 10%">
                  <el-form-item :label="t('common.description')" class="mb-0"
                    style="flex: 1 1 30%; min-width: 160px">
                    <GenericInputField v-model="item.description" :placeholder="t('sharedExpenses.itemPlaceholder')"
                      :maxlength="100" :wrap-form-item="false" />
                  </el-form-item>
                  <el-form-item :label="t('common.amount')" class="mb-0" style="flex: 1 1 20%; min-width: 100px">
                    <GenericInputNumber v-model="item.amount" :min="0" :precision="2" :wrap-form-item="false"
                      width="100%" class="flex-1 min-w-0" />
                  </el-form-item>
                  <el-form-item :label="t('sharedExpenses.participants')" class="mb-0"
                    style="flex: 1 1 30%; min-width: 160px">
                    <GenericDropDown v-model="item.participants" :options="usersOptions"
                      :placeholder="t('sharedExpenses.whoSharedThisItem')" size="default" multiple
                      :wrap-form-item="false" />
                  </el-form-item>
                </div>


              </div>

              <!-- Tax row (only shown when AI extracted a tax value) -->
              <div v-show="receiptTax != null"
                class="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
                <span class="text-sm text-gray-600 flex-1">{{
                  t('common.tax')
                  }}</span>
                <GenericInputNumber v-model="receiptTax" :min="0" :precision="2" :wrap-form-item="false"
                  input-class="w-full" :width="120" style="flex-shrink: 0" />
                <el-button size="default" type="danger" text style="flex-shrink: 0" :title="t('common.removeTax')"
                  @click="receiptTax = null">
                  ✕
                </el-button>
              </div>

              <!-- Balance check -->
              <div v-if="formData.splitItems.length > 0" class="flex items-center gap-2 text-sm">
                <span class="text-gray-600">{{
                  receiptTax != null && receiptTax > 0
                    ? t('sharedExpenses.itemsTotalPlusTax')
                    : t('sharedExpenses.itemsTotal')
                }}:</span>
                <span :class="splitItemsTotal === parseFloat(formData.amount || 0)
                    ? 'text-green-600 font-semibold'
                    : 'text-orange-500 font-semibold'
                  ">
                  {{ splitItemsTotal.toFixed(2) }} /
                  {{ parseFloat(formData.amount || 0).toFixed(2) }}
                </span>
                <el-tag v-if="splitItemsTotal === parseFloat(formData.amount || 0)" type="success" size="small">
                  {{ t('common.balanced') }}
                </el-tag>
                <el-tag v-else type="warning" size="small">{{
                  t('common.mismatch')
                  }}</el-tag>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-gray-700">{{
                  t('table.splitItemsTitle')
                  }}</span>
                <el-button size="default" type="primary" @click="addSplitItem">
                  {{ t('sharedExpenses.addItem') }}
                </el-button>
              </div>
            </div>

            <!-- Buttons (only for add mode, not dialog edit mode) -->
            <div v-if="!isEditMode" class="flex justify-end gap-2">
              <el-button type="default" size="default" @click="resetForm">
                {{ t('common.reset') }}
              </el-button>
              <el-button type="info" plain size="default" @click="closeForm">
                {{ t('common.cancel') }}
              </el-button>
              <el-button type="success" size="default" :loading="receiptUploading || isSubmitting"
                :disabled="receiptUploading || isSubmitting" @click="() => validateForm()">
                {{
                  receiptUploading
                    ? t('common.uploading')
                    : t('sharedExpenses.addPayment')
                }}
              </el-button>
            </div>
          </el-form>
        </fieldset>
      </Transition>

      <!-- Expense List (only in add mode, not dialog edit mode) -->
      <HOC v-if="!isEditMode" :componentToBeRendered="ExpenseList" />
    </div>
  </GroupAccessGuard>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { HOC } from '@/components/layout'
import { GroupAccessGuard } from '@/components/shared'
import {
  DataTimePicker,
  AmountInput,
  GenericDropDown,
  GenericInput,
  ReceiptOcrField
} from '@/components/generic-components'
import {
  GenericInputField,
  GenericInputNumber,
  AddNewTransactionButton
} from '@/components/generic-components'
import { getRules } from '@/assets'
import { SharedExpenses } from '@/scripts/shared-expenses'
import { loadAsyncComponent } from '@/utils'

const { t, locale } = useI18n()
const rules = computed(() => getRules(locale.value))
const ExpenseList = loadAsyncComponent(() => import('./ExpenseList.vue'))
const emit = defineEmits(['closeModal'])
const props = defineProps({
  row: Object
})

const {
  isEditMode,
  showTransactionForm,
  openForm,
  closeForm,
  requestClose,
  resetForm,
  usersOptions,
  categoryOptions,
  activeGroupCurrency,
  currencyOptions,
  convertedAmountPreview,
  formData,
  transactionForm,
  validateForm,
  splitItemsTotal,
  addSplitItem,
  removeSplitItem,
  payersTotal,
  addPayer,
  removePayer,
  receiptFiles,
  receiptExtracting,
  receiptTax,
  receiptUploading,
  allowsMultiple,
  existingReceiptUrls,
  extractTextFromReceipt,
  setSelectedFiles,
  removeReceipt,
  isMePayer,
  isSubmitting
} = SharedExpenses(props, emit)

defineExpose({
  validateForm,
  requestClose
})
</script>

<style scoped>
/* Element Plus's label-position="top" gives .el-form-item__label a
   width:fit-content (only as wide as the label text) — override it here so
   the "Me" checkbox, rendered via the #label slot, can sit flush at the
   field's far right edge instead of immediately after the label text. */
.field-with-me-toggle :deep(.el-form-item__label) {
  width: 100%;
}

/* Same el-form-item as AmountInput's own "Amount" label — putting the
   select in a form-item with a blank label (instead of a hand-tuned
   margin-top) keeps the two inputs aligned via Element Plus's own label
   height/spacing rather than a guessed pixel offset. */
.amount-currency-item {
  width: 92px;
  flex-shrink: 0;
}

.amount-currency-item :deep(.el-form-item__label) {
  visibility: hidden;
}
</style>
