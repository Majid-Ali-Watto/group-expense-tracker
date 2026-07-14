<template>
  <component :is="wrapFormItem ? 'el-form-item' : 'div'" v-bind="wrapperProps">
    <el-select
      v-model="internalValue"
      :filterable="filterable"
      :placeholder="resolvedPlaceholder"
      :class="selectClass"
      :clearable="clearable"
      :disabled="disabled"
      :multiple="multiple"
      :size="size"
      :allow-create="allowCreate"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      popper-class="gdd-popper"
      @change="$emit('update:modelValue', internalValue)"
    >
      <el-option
        v-for="opt in mappedOptions"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
        :disabled="opt.disabled"
      />
    </el-select>
  </component>
</template>

<script setup>
import { computed, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'

onErrorCaptured((err) => {
  if (err instanceof TypeError && err.message.includes('scrollTop'))
    return false
})
import { GenericDropDown } from '@/scripts/shared'

const { t } = useI18n()

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
    default: ''
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
    default: 'medium'
  },
  selectClass: {
    type: String,
    default: 'w-full'
  },
  formItemClass: {
    type: String,
    default: 'w-full'
  },
  allowCreate: {
    type: Boolean,
    default: false
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
  },
  disabledKey: {
    type: String,
    default: 'disabled'
  }
})

defineEmits(['update:modelValue'])

const { internalValue, getLabel, getValue } = GenericDropDown(props)

const resolvedPlaceholder = computed(
  () => props.placeholder || t('common.selectOption')
)

const mappedOptions = computed(
  () =>
    (props.options || []).map((item) => ({
      label: String(getLabel(item) ?? ''),
      value: getValue(item) ?? '',
      disabled: item[props.disabledKey] === true
    }))
  // .filter((item) => item.label !== '' || item.value !== '')
)

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
