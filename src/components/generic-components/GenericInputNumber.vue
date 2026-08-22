<template>
  <component :is="wrapFormItem ? 'el-form-item' : 'div'" v-bind="wrapperProps">
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
      @change="emit('update:modelValue', internalValue)"
    />
  </component>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
  formItemClass: { type: String, default: 'w-full' }
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

const wrapperProps = computed(() => {
  if (!props.wrapFormItem) return {}
  return {
    label: resolvedLabel.value,
    prop: props.prop,
    required: props.required,
    class: props.formItemClass
  }
})
</script>
