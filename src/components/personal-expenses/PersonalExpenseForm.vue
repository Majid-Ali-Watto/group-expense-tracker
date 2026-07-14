<template>
  <fieldset class="w-full border border-gray-300 rounded-lg p-4">
    <legend>{{ t('personalExpenses.expenseDetails') }}</legend>
    <el-form
      label-position="top"
      :model="form"
      :rules="rules"
      ref="expenseForm"
      class="px-2"
    >
      <div class="mb-4">
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
          <AmountInput v-model.number="form.amount" required />
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <GenericDropDown
            v-model="form.category"
            :label="t('common.category')"
            prop="category"
            :placeholder="t('personalExpenses.addOrSelectCategory')"
            :options="categoryOptions"
            :allow-create="true"
            required
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <GenericInput
            :rows="1"
            v-model="form.description"
            :label="t('common.description')"
            prop="description"
            :placeholder="t('common.enterDescription')"
            required
            type="textarea"
            :maxlength="200"
            :autosize="{ minRows: 1, maxRows: 3 }"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <GenericInput
            v-model="form.location"
            :label="t('common.location')"
            prop="location"
            :placeholder="t('common.enterLocation')"
            :maxlength="100"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <GenericDropDown
            v-model="form.recipient"
            :label="t('personalExpenses.recipient')"
            prop="recipient"
            :placeholder="t('personalExpenses.recipientPlaceholder')"
            :options="recipientOptions"
            :allow-create="true"
            :filterable="true"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="12">
          <DataTimePicker
            v-model="form.date"
            required
            type="date"
            :placeholder="t('common.selectDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-col>
      </el-row>
      <!-- Optional Line Items -->
      <div class="mt-2 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">
            {{ t('personalExpenses.lineItems') }}
            <span class="text-gray-400 font-normal text-xs ml-1"
              >({{ t('common.optional') }})</span
            >
          </span>
          <el-button size="medium" type="primary" plain @click="addSplitItem">
            {{ t('personalExpenses.addItem') }}
          </el-button>
        </div>

        <template v-if="form.splitItems.length > 0 || receiptTax != null">
          <div
            v-for="(item, index) in form.splitItems"
            :key="index"
            class="flex gap-2 items-end border border-gray-200 rounded-lg p-2 bg-gray-50"
          >
            <el-form-item
              :label="t('common.description')"
              class="mb-0 flex-1 min-w-0"
            >
              <GenericInputField
                v-model="item.description"
                :placeholder="t('personalExpenses.itemPlaceholder')"
                :maxlength="100"
                :wrap-form-item="false"
              />
            </el-form-item>
            <el-form-item
              :label="t('common.amount')"
              class="mb-0"
              style="width: 120px; flex-shrink: 0"
            >
              <GenericInputNumber
                v-model="item.amount"
                :min="0"
                :precision="2"
                :wrap-form-item="false"
                input-class="w-full"
              />
            </el-form-item>
            <el-button
              size="medium"
              type="danger"
              text
              style="flex-shrink: 0; margin-bottom: 2px"
              @click="removeSplitItem(index)"
            >
              ✕
            </el-button>
          </div>

          <!-- Tax row -->
          <div
            v-show="receiptTax != null"
            class="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
          >
            <span class="text-sm text-gray-600 flex-1">{{
              t('common.tax')
            }}</span>
            <GenericInputNumber
              v-model="receiptTax"
              :min="0"
              :precision="2"
              :wrap-form-item="false"
              input-class="w-full"
              style="width: 120px; flex-shrink: 0"
            />
            <el-button
              size="medium"
              type="danger"
              text
              style="flex-shrink: 0"
              :title="t('common.removeTax')"
              @click="receiptTax = null"
            >
              ✕
            </el-button>
          </div>

          <!-- Balance check -->
          <div
            v-if="form.splitItems.length > 0"
            class="flex items-center gap-2 text-sm"
          >
            <span class="text-gray-600">
              {{
                receiptTax != null && receiptTax > 0
                  ? t('personalExpenses.itemsTotalPlusTax')
                  : t('personalExpenses.itemsTotal')
              }}:
            </span>
            <span
              :class="
                splitItemsTotal === parseFloat(form.amount || 0)
                  ? 'text-green-600 font-semibold'
                  : 'text-orange-500 font-semibold'
              "
            >
              {{ splitItemsTotal.toFixed(2) }} /
              {{ parseFloat(form.amount || 0).toFixed(2) }}
            </span>
            <el-tag
              v-if="splitItemsTotal === parseFloat(form.amount || 0)"
              type="success"
              size="small"
            >
              {{ t('common.balanced') }}
            </el-tag>
            <el-tag v-else type="warning" size="small">{{
              t('common.mismatch')
            }}</el-tag>
          </div>
        </template>
      </div>

      <div class="flex justify-end gap-2 mt-3" v-if="!isEditMode">
        <el-button type="default" size="medium" @click="resetForm">
          {{ t('common.reset') }}
        </el-button>
        <GenericButton
          v-if="showForm"
          type="info"
          @click="requestClose"
          size="medium"
          >{{ t('common.cancel') }}</GenericButton
        >
        <el-button
          type="success"
          :loading="receiptUploading || receiptExtracting || isSubmitting"
          :disabled="receiptUploading || receiptExtracting || isSubmitting"
          @click="() => validateForm()"
          size="medium"
        >
          {{
            receiptUploading
              ? t('common.uploading')
              : t('personalExpenses.addExpense')
          }}
        </el-button>
      </div>
    </el-form>
  </fieldset>
</template>

<script setup>
import { rules } from '@/assets'
import { useI18n } from 'vue-i18n'
import {
  GenericButton,
  AmountInput,
  DataTimePicker,
  GenericDropDown,
  GenericInput,
  GenericInputField,
  GenericInputNumber,
  ReceiptOcrField
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
  recipientOptions,
  expenseForm,
  validateForm,
  resetForm,
  requestClose,
  receiptFiles,
  receiptExtracting,
  receiptTax,
  receiptUploading,
  existingReceiptUrls,
  setSelectedFiles,
  removeReceipt,
  extractTextFromReceipt,
  splitItemsTotal,
  addSplitItem,
  removeSplitItem,
  isSubmitting
} = PersonalExpenseForm(props, emit)
const { t } = useI18n()

defineExpose({
  validateForm,
  expenseForm,
  requestClose
})
</script>
