<template>
  <el-form-item :label="label" :prop="prop" :required="required" class="w-full">
    <el-select
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
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number, Object], // Support various value types
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  prop: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Select an option",
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Array,
    default: () => [],
  },
  labelKey: {
    type: String,
    default: "label", // Key to display as label in dropdown
  },
  valueKey: {
    type: String,
    default: "value", // Key to bind as value in dropdown
  },
});

defineEmits(["update:modelValue"]);

const internalValue = ref(props.modelValue);

// Sync the external modelValue with the internal value
watch(
  () => props.modelValue,
  (newValue) => {
    internalValue.value = newValue;
  }
);

// Methods to get key, label, and value from options
const getLabel = (item) =>
  typeof item === "object" ? item[props.labelKey] : item;
const getValue = (item) =>
  typeof item === "object" ? item[props.valueKey] : item;
const getKey = (item) => getValue(item);
</script>
