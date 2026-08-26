<template>
  <component :is="wrapFormItem ? ElFormItem : 'div'" v-bind="wrapperProps">
    <el-input-number
      v-model="internalValue"
      :min="min"
      :max="max"
      :precision="precision"
      :step="step"
      :size="size"
      :placeholder="placeholder"
      :controls-position="controlsPosition"
      :class="inputClass"
      :style="numberInputStyle"
      @change="emit('update:modelValue', internalValue)"
    />
  </component>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElFormItem } from 'element-plus'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Number, default: null },
  label: { type: String, default: '' },
  prop: { type: String, default: '' },
  required: { type: Boolean, default: false },
  min: { type: Number, default: -Infinity },
  max: { type: Number, default: Infinity },
  precision: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  size: { type: String, default: 'default' },
  placeholder: { type: String, default: '' },
  controlsPosition: { type: String, default: 'right' },
  wrapFormItem: { type: Boolean, default: true },
  inputClass: { type: String, default: 'w-full' },
  formItemClass: { type: String, default: 'w-full' },
  // Explicit pixel (or any CSS length string) width applied directly to
  // el-input-number via inline style. el-input-number's own stylesheet sets
  // a fixed `width: 150px` — inputClass="w-full" only reliably beats that
  // when Tailwind's utility CSS happens to be ordered after Element Plus's
  // per-component styles in the bundle, which isn't guaranteed (this app
  // auto-imports Element Plus component CSS via unplugin-vue-components).
  // An inline style always wins regardless of bundle order, so callers that
  // need a specific fixed width (e.g. a 120px column next to another field)
  // should pass it here instead of relying on inputClass alone.
  width: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:modelValue'])

const internalValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    internalValue.value = v
  }
)

const resolvedLabel = computed(() =>
  props.label && !props.required
    ? `${props.label} (${t('common.optional')})`
    : props.label
)

const numberInputStyle = computed(() =>
  props.width == null
    ? undefined
    : { width: typeof props.width === 'number' ? `${props.width}px` : props.width }
)

const wrapperProps = computed(() => {
  // Deliberately NOT defaulting the unwrapped root to flex-1 here (unlike
  // GenericInputField/GenericDropDown) — several existing callers place
  // this as a direct flex child of a plain row (not inside an el-form-item)
  // and rely on it staying a fixed, non-growing width (e.g. a 120px Amount
  // field next to a remove button). flex-1 would make those grow and eat
  // the row's remaining space. Callers that DO need it to fill an ancestor
  // el-form-item's allocated width should pass class="flex-1 min-w-0"
  // themselves (it falls through to this root) alongside width="100%".
  if (!props.wrapFormItem) return {}
  return {
    label: resolvedLabel.value,
    prop: props.prop,
    required: props.required,
    class: props.formItemClass
  }
})
</script>
