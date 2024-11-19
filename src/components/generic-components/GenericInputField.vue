<template>
	<el-form-item :label="label" :prop="prop" :required="required" class="w-full">
		<el-input :rows="rows" v-model="internalValue" :placeholder="placeholder" :type="type" @input="$emit('update:modelValue', internalValue)" />
	</el-form-item>
</template>

<script setup>
	import { ref, watch } from "vue";
	// Props for customization
	const props = defineProps({
		modelValue: {
			type: String,
			required: true
		},
		rows: {
			type: Number,
			default: 0
		},
		label: {
			type: String,
			required: true
		},
		prop: {
			type: String,
			required: true
		},
		placeholder: {
			type: String,
			default: ""
		},
		required: {
			type: Boolean,
			default: false
		},
		type: {
			type: String,
			default: "text" // Supports other types like 'password', 'email', etc.
		}
	});

	// Emit event for two-way binding
	defineEmits(["update:modelValue"]);

	// Internal value for syncing
	const internalValue = ref(props.modelValue);

	// Watch for changes in the prop and update internal value
	watch(
		() => props.modelValue,
		(newValue) => {
			internalValue.value = newValue;
		}
	);
</script>
