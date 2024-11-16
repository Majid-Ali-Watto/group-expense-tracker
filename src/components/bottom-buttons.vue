<template>
	<div class="flex justify-between space-x-4">
		<el-button @click="confirmUpdate" type="warning" class="text-white py-2 px-4 rounded-lg"> Update </el-button>
		<el-button @click="confirmDelete" type="danger" class="text-white py-2 px-4 rounded-lg"> Delete </el-button>
		<el-button @click="$emit('cancel')" type="success" class="py-2 px-4 rounded-lg"> Cancel </el-button>
	</div>
</template>

<script setup>
	import { markRaw } from "vue";
	import { ElMessageBox } from "element-plus";
	import { Delete, Edit,EditPen } from "@element-plus/icons-vue";

	const emit = defineEmits(["update", "delete", "cancel"]);

	const confirmUpdate = async () => {
		try {
			await ElMessageBox.confirm("Are you sure you want to update this item?", "Warning", {
				confirmButtonText: "OK",
				cancelButtonText: "Cancel",
				type: "warning",
				// icon: markRaw(Edit)
			});
			// If confirmed, emit the update event
			emit("update");
		} catch (error) {
			// Handle the case when user cancels
			if (error !== "cancel") {
				console.log("Update action cancelled");
			}
		}
	};

	const confirmDelete = async () => {
		try {
			await ElMessageBox.confirm("Are you sure you want to delete this item? This action cannot be undone.", "Danger", {
				confirmButtonText: "OK",
				cancelButtonText: "Cancel",
				type: "error",
				icon: markRaw(Delete)
			});
			// If confirmed, emit the delete event
			emit("delete");
		} catch (error) {
			// Handle the case when user cancels
			if (error !== "cancel") {
				console.log("Delete action cancelled");
			}
		}
	};
</script>
