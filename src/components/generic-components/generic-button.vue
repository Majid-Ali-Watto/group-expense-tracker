<template>
	<el-button :type="type" class="mt-1 text-white px-4 py-2 rounded">
		<slot></slot>
	</el-button>
</template>

<script setup>
	defineProps({
		type: {
			type: String,
			default: "primary"
		}
	});
</script>
