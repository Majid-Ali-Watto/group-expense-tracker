import { computed } from 'vue'

export const GenericDropDown = (props, emit) => {
  const internalValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const getLabel = (item) =>
    typeof item === 'object' ? item[props.labelKey] : item
  const getValue = (item) =>
    typeof item === 'object' ? item[props.valueKey] : item
  const getKey = (item) => getValue(item)
  const normalizeComparableValue = (value) => {
    if (value && typeof value === 'object') {
      return value[props.valueKey]
    }
    return value
  }
  const isSameValue = (left, right) => {
    const normalizedLeft = normalizeComparableValue(left)
    const normalizedRight = normalizeComparableValue(right)
    return (
      normalizedLeft === normalizedRight ||
      String(normalizedLeft ?? '') === String(normalizedRight ?? '')
    )
  }
  const findSelectedLabel = (value, options = []) => {
    const option = options.find((item) => isSameValue(item.value, value))
    if (option?.label) return option.label
    if (value && typeof value === 'object') {
      return value[props.labelKey] || value.label || ''
    }
    return value == null ? '' : String(value)
  }
  const resolveSelectedLabel = (label, value, options = []) => {
    if (String(label ?? '').trim()) return label
    if (Array.isArray(value)) {
      return value
        .map((item) => findSelectedLabel(item, options))
        .filter(Boolean)
        .join(', ')
    }
    return findSelectedLabel(value, options)
  }

  return {
    internalValue,
    getLabel,
    getValue,
    getKey,
    resolveSelectedLabel
  }
}
