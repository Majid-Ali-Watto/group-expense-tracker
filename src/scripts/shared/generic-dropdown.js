import { ref, watch } from 'vue'

export const GenericDropDown = (props) => {
  const internalValue = ref(props.modelValue)

  watch(
    () => props.modelValue,
    (newValue) => {
      internalValue.value = newValue
    }
  )

  const getLabel = (item) =>
    typeof item === 'object' ? item[props.labelKey] : item
  const getValue = (item) =>
    typeof item === 'object' ? item[props.valueKey] : item
  const getKey = (item) => getValue(item)

  return {
    internalValue,
    getLabel,
    getValue,
    getKey
  }
}
