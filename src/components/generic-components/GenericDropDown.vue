<template>
  <el-form-item :label="label" :prop="prop" :required="required" class="w-full">
    <el-select
      filterable
      v-model="internalValue"
      :placeholder="placeholder"
      class="w-full"
      clearable
      @change="$emit('update:modelValue', internalValue)"
    >
      <el-option
        v-for="item in options"
        :key="getKey(item)"
        :label="getLabel(item)"
        :value="getValue(item)"
      />
    </el-select>
  </el-form-item>
</template>

<script setup>
import { GenericDropDown } from '../../scripts/generic-dropdown'

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  prop: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  required: {
    type: Boolean,
    default: false
  },
  options: {
    type: Array,
    default: () => []
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  valueKey: {
    type: String,
    default: 'value'
  }
})

defineEmits(['update:modelValue'])

const { internalValue, getLabel, getValue, getKey } = GenericDropDown(props)
</script>
