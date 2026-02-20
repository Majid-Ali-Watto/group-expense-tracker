<template>
  <el-form-item :label="label" class="w-full" :prop="prop" :required="required">
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
    />
  </el-form-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Date],
    required: true
  },
  label: {
    type: String,
    default: 'Date'
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

function disabledFutureDates(time) {
  return props.disableFuture && time.getTime() > Date.now()
}
</script>
