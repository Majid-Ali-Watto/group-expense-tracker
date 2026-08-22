<template>
  <el-form-item
    :label="resolvedLabel"
    :prop="prop"
    :required="required"
    class="w-full"
  >
    <el-input
      v-model.number="internalValue"
      type="number"
      :placeholder="placeholder"
      class="w-full"
      :min="min"
      :max="max"
      :step="step"
      clearable
      size="default"
      @input="$emit('update:modelValue', internalValue)"
    />
  </el-form-item>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props for flexibility and customization
const props = defineProps({
  modelValue: {
    type: [Number, null],
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  prop: {
    type: String,
    default: 'amount'
  },
  required: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '0.00'
  },
  min: {
    type: Number,
    default: 1
  },
  max: {
    type: Number,
    default: Infinity
  },
  step: {
    type: Number,
    default: 1
  }
})

// Emit event for two-way binding
defineEmits(['update:modelValue'])

const resolvedLabel = computed(() => {
  const label = props.label || t('common.amount')
  return props.required ? label : `${label} (${t('common.optional')})`
})

// Internal value to sync with the parent
const internalValue = ref(props.modelValue)

// Sync prop changes with internal value
watch(
  () => props.modelValue,
  (newValue) => {
    internalValue.value = newValue
  }
)
</script>
