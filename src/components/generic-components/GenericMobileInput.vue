<template>
  <component :is="wrapFormItem ? ElFormItem : 'div'" v-bind="wrapperProps">
    <VueTelInput
      :model-value="modelValue"
      :auto-default-country="true"
      :auto-format="true"
      :default-country="defaultCountry"
      :disabled="disabled"
      :dropdown-options="dropdownOptions"
      :ignored-countries="blockedCountries"
      :input-options="resolvedInputOptions"
      :invalid-msg="invalidMsg"
      mode="international"
      :preferred-countries="preferredCountries"
      :style-classes="styleClasses"
      :valid-characters-only="true"
      @blur="emit('blur', modelValue)"
      @country-changed="onCountryChanged"
      @enter="emit('enter')"
      @input.capture="onSearchInput"
      @on-input="onInput"
      @update:modelValue="emit('update:modelValue', $event)"
      @validate="onValidate"
    />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElFormItem } from 'element-plus'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'
import { showError } from '@/utils/showAlerts'
import { normalizePhoneNumber } from '@/utils/phone'

const { t } = useI18n()
const unsupportedCountryMessage = 'This country is not supported'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  prop: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  wrapFormItem: { type: Boolean, default: true },
  formItemClass: { type: String, default: 'w-full' },
  defaultCountry: { type: String, default: '' },
  blockedCountries: { type: Array, default: () => ['IL'] },
  invalidMsg: { type: String, default: '' },
  preferredCountries: { type: Array, default: () => ['PK', 'US', 'GB'] },
  inputOptions: { type: Object, default: () => ({}) },
  dropdownOptions: {
    type: Object,
    default: () => ({
      showDialCodeInList: true,
      showDialCodeInSelection: true,
      showFlags: true,
      showSearchBox: true
    })
  },
  styleClasses: {
    type: [String, Array, Object],
    default: 'generic-mobile-input w-full'
  }
})

const emit = defineEmits([
  'update:modelValue',
  'blur',
  'country-changed',
  'enter',
  'input',
  'validate'
])

const resolvedLabel = computed(() =>
  props.label && !props.required
    ? `${props.label} (${t('common.optional')})`
    : props.label
)

const wrapperProps = computed(() => {
  if (!props.wrapFormItem) return {}
  return {
    label: resolvedLabel.value,
    prop: props.prop,
    required: props.required,
    class: props.formItemClass
  }
})

const resolvedInputOptions = computed(() => ({
  maxlength: 25,
  placeholder: props.placeholder,
  required: props.required,
  type: 'tel',
  ...props.inputOptions
}))

function isBlockedCountry(country) {
  const iso2 = String(country?.iso2 || country?.countryCode || country || '')
    .trim()
    .toUpperCase()

  return props.blockedCountries
    .map((code) => String(code).trim().toUpperCase())
    .includes(iso2)
}

function onCountryChanged(country) {
  if (isBlockedCountry(country)) {
    showError(unsupportedCountryMessage)
    emit('update:modelValue', '')
    return
  }

  emit('country-changed', country)
}

function onSearchInput(event) {
  const target = event?.target
  if (!target?.classList?.contains('vti__search_box')) return

  const query = String(target.value || '')
    .trim()
    .toLowerCase()
  if (query === 'il' || query.includes('israel')) {
    showError(unsupportedCountryMessage)
  }
}

function onInput(number, phoneObject) {
  const value =
    phoneObject?.isValid && phoneObject?.number
      ? normalizePhoneNumber(phoneObject.number)
      : number

  emit('update:modelValue', value || '')
  emit('input', value || '', phoneObject)
}

function onValidate(phoneObject) {
  emit('validate', phoneObject)
}
</script>

<style scoped>
:deep(.generic-mobile-input) {
  height: var(--el-component-size, 32px);
  min-height: var(--el-component-size, 32px);
  box-sizing: border-box;
  border-color: var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-base);
}

:deep(.generic-mobile-input:focus-within) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.vti__input) {
  min-width: 0;
  height: calc(var(--el-component-size, 32px) - 2px);
  line-height: calc(var(--el-component-size, 32px) - 2px);
  padding-top: 0;
  padding-bottom: 0;
  color: var(--el-input-text-color, var(--el-text-color-regular));
  background: var(--el-input-bg-color, var(--el-fill-color-blank));
}

:deep(.vti__dropdown) {
  height: calc(var(--el-component-size, 32px) - 2px);
  padding: 0 7px;
  background: var(--el-input-bg-color, var(--el-fill-color-blank));
}
</style>
