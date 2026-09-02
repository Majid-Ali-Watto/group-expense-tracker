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
  // Prefer the widget's own selected/detected country over the PK fallback
  // in normalizePhoneNumber's default — matters for the "not yet fully
  // valid" fallback path below, where the raw digits have no leading "+"
  // and would otherwise always be parsed as if they were a PK number
  // regardless of which country the user actually picked.
  const country = phoneObject?.country?.iso2 || phoneObject?.country

  const value =
    phoneObject?.isValid && phoneObject?.number
      ? normalizePhoneNumber(phoneObject.number)
      : normalizePhoneNumber(number, country || undefined)

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

/* The country dropdown panel ships hardcoded light colors (white bg, #ccc
   border) with no theme awareness. Using the app's own theme tokens here
   (rather than a `:root.dark-theme` selector) means this stays correct in
   both themes automatically, since the tokens themselves flip. */
:deep(.vti__dropdown-list) {
  background-color: var(--card-bg);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.vti__dropdown-item.highlighted) {
  background-color: var(--bg-secondary);
}

:deep(.vti__dropdown-item.last-preferred) {
  border-bottom-color: var(--border-color);
}

:deep(.vti__search_box) {
  background-color: var(--card-bg);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.vti__country-code),
:deep(.vti__dropdown-arrow) {
  color: var(--text-secondary, #6b7280);
}
</style>
