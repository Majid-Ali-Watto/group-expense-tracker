<template>
  <component :is="wrapFormItem ? 'el-form-item' : 'div'" v-bind="wrapperProps">
    <el-input
      resize="none"
      :clearable="clearable"
      :rows="rows"
      :autosize="type === 'textarea' ? autosize : false"
      v-model="internalValue"
      :placeholder="placeholder"
      :type="type"
      size="small"
      :maxlength="maxlength || undefined"
      :disabled="disabled"
      :show-password="showPassword"
      :prefix-icon="prefixIcon || undefined"
      :class="inputClass"
      @input="onInput"
      @blur="emit('blur', internalValue)"
    >
      <template v-if="$slots.prefix" #prefix>
        <slot name="prefix" />
      </template>
    </el-input>
  </component>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  rows: { type: Number, default: 0 },
  label: { type: String, default: '' },
  prop: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  maxlength: { type: Number, default: undefined },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  showPassword: { type: Boolean, default: false },
  prefixIcon: { default: undefined },
  wrapFormItem: { type: Boolean, default: true },
  inputClass: { type: String, default: 'w-full' },
  formItemClass: { type: String, default: 'w-full' },
  labelPosition: { type: String, default: undefined },
  autosize: { type: [Boolean, Object], default: false }
})

const emit = defineEmits(['update:modelValue', 'blur', 'input'])

const internalValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    internalValue.value = v
  }
)

function onInput() {
  emit('update:modelValue', internalValue.value)
  emit('input', internalValue.value)
}

const wrapperProps = computed(() => {
  if (!props.wrapFormItem) return {}
  const p = {
    label: props.label,
    prop: props.prop,
    required: props.required,
    class: props.formItemClass
  }
  if (props.labelPosition !== undefined) p.labelPosition = props.labelPosition
  return p
})
</script>
