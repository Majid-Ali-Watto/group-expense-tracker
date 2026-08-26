<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('groups.editGroupTitle')"
    width="90%"
    append-to-body
    style="max-width: 500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      :model="localForm"
      :rules="rules"
      ref="formRef"
      label-position="top"
    >
      <GenericInputField
        v-model="localForm.name"
        :label="t('groups.groupNameLabel')"
        prop="name"
        required
        :placeholder="t('groups.namePlaceholder')"
        :maxlength="50"
      />
      <GenericInputField
        v-model="localForm.description"
        :label="t('common.description')"
        type="textarea"
        :rows="3"
        :placeholder="t('groups.descriptionPlaceholder')"
        :maxlength="100"
      />
      <GenericDropDown
        v-model="localForm.members"
        :label="t('groups.membersLabelPlain')"
        prop="members"
        required
        :options="memberOptions"
        :placeholder="t('groups.membersPlaceholder')"
        size="default"
        multiple
      />
      <GenericDropDown
        v-model="localForm.currency"
        :label="t('groups.currencyLabel')"
        prop="currency"
        :options="currencyOptions"
        :disabled="hasCurrencyHistory"
        size="default"
      />
      <p v-if="hasCurrencyHistory" class="text-xs text-gray-500 -mt-2 mb-2">
        {{ t('groups.currencyLockedHint') }}
      </p>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button
          size="default"
          style="min-width: 80px"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          size="default"
          style="min-width: 80px"
          @click="handleSave"
        >
          {{ t('common.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGroupRules } from '@/assets'
import { DEFAULT_CURRENCY } from '@/constants'
import { useCurrency } from '@/composables/useCurrency'
import {
  GenericInputField,
  GenericDropDown
} from '@/components/generic-components'

const { t, locale } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  form: { type: Object, required: true },
  memberOptions: { type: Array, required: true },
  // Whether the group already has shared-expense/loan history — locks the
  // currency field (see groups.js's editingGroupHasCurrencyHistory/
  // updateGroup() for why: past amounts are frozen in the old currency and
  // balances are never re-converted).
  hasCurrencyHistory: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'save'])

const rules = computed(() => getGroupRules(locale.value))
const formRef = ref(null)
const localForm = reactive({
  name: '',
  description: '',
  members: [],
  currency: DEFAULT_CURRENCY
})

// Narrowed to codes the current exchange-rate snapshot can actually
// convert (plus whatever the group is already set to, even if that code
// dropped out of the snapshot) — see useCurrency.js.
const { currencyOptionsIncluding } = useCurrency()
const currencyOptions = computed(() =>
  currencyOptionsIncluding(localForm.currency).map((option) => ({
    value: option.code,
    label: `${option.code} — ${option.label}`
  }))
)

watch(
  () => props.form,
  (val) => {
    localForm.name = val.name ?? ''
    localForm.description = val.description ?? ''
    localForm.members = val.members ? [...val.members] : []
    localForm.currency = val.currency || DEFAULT_CURRENCY
  },
  { immediate: true }
)

function handleSave() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    emit('save', { ...localForm })
  })
}
</script>
