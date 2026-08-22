<template>
  <el-form-item
    :label="resolvedLabel"
    class="w-full"
    :prop="prop"
    :required="required"
  >
    <el-date-picker
      clearable
      :disabled-date="disabledFutureDates"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :type="type"
      :placeholder="placeholder"
      :format="format"
      :value-format="valueFormat"
      style="width: 100%"
      size="default"
    />
  </el-form-item>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: [String, Date],
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  prop: {
    type: String,
    default: 'date'
  },
  required: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'datetime' // Can be 'date', 'datetime', etc.
  },
  placeholder: {
    type: String,
    default: ''
  },
  format: {
    type: String,
    default: 'YYYY/MM/DD hh:mm:ss'
  },
  valueFormat: {
    type: String,
    default: 'YYYY-MM-DD HH:mm:ss'
  },
  disableFuture: {
    type: Boolean,
    default: true
  }
})

defineEmits(['update:modelValue'])

const resolvedLabel = computed(() => {
  const label = props.label || t('common.date')
  return props.required ? label : `${label} (${t('common.optional')})`
})

function disabledFutureDates(time) {
  return props.disableFuture && time.getTime() > Date.now()
}
</script>
