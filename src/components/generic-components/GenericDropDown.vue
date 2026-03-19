<template>
  <component :is="wrapFormItem ? 'el-form-item' : 'div'" v-bind="wrapperProps">
    <el-select
      v-model="internalValue"
      :filterable="filterable"
      :placeholder="placeholder"
      :class="selectClass"
      :clearable="clearable"
      :disabled="disabled"
      :multiple="multiple"
      :size="size"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      @change="$emit('update:modelValue', internalValue)"
    >
      <el-option
        v-for="item in options"
        :key="getKey(item)"
        :label="getLabel(item)"
        :value="getValue(item)"
      />
    </el-select>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { GenericDropDown } from '../../scripts/shared/generic-dropdown'

const props = defineProps({
  modelValue: {
    type: [String, Number, Object, Array],
    default: null
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
  labelPosition: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  filterable: {
    type: Boolean,
    default: true
  },
  clearable: {
    type: Boolean,
    default: true
  },
  wrapFormItem: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: ''
  },
  selectClass: {
    type: String,
    default: 'w-full'
  },
  formItemClass: {
    type: String,
    default: 'w-full'
  },
  collapseTags: {
    type: Boolean,
    default: false
  },
  collapseTagsTooltip: {
    type: Boolean,
    default: false
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

const wrapperProps = computed(() => {
  if (!props.wrapFormItem) {
    return {}
  }

  return {
    label: props.label,
    prop: props.prop,
    required: props.required,
    labelPosition: props.labelPosition || undefined,
    class: props.formItemClass
  }
})
</script>
