<template>
  <component :is="wrapFormItem ? ElFormItem : 'div'" v-bind="wrapperProps">
    <el-input
      resize="none"
      :clearable="clearable"
      :rows="rows"
      :autosize="type === 'textarea' ? autosize : false"
      v-model="internalValue"
      :placeholder="placeholder"
      :type="type"
      size="default"
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
import { useI18n } from 'vue-i18n'
import { ElFormItem } from 'element-plus'

const { t } = useI18n()

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

const resolvedLabel = computed(() =>
  props.label && !props.required
    ? `${props.label} (${t('common.optional')})`
    : props.label
)

const wrapperProps = computed(() => {
  // Unwrapped root is a plain <div> sitting inside an ancestor
  // el-form-item's __content box, which Element Plus always renders as
  // `display:flex`. Without flex-grow, that div shrinks to its content's
  // intrinsic width instead of filling whatever space the caller's own
  // el-form-item (or other flex container) allocated it — el-input's
  // width:100% then has nothing definite to resolve against and collapses.
  if (!props.wrapFormItem) return { class: 'flex-1 min-w-0' }
  const p = {
    label: resolvedLabel.value,
    prop: props.prop,
    required: props.required,
    class: props.formItemClass
  }
  if (props.labelPosition !== undefined) p.labelPosition = props.labelPosition
  return p
})
</script>
