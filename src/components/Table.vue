<template>
	<div class="w-full overflow-x-auto">
		<table class="w-full border-collapse border border-gray-300">
			<thead>
				<tr class="bg-neutral-800 text-white text-left">
					<!-- Render table headers -->
					<th v-for="(header, index) in headers" :key="index" class="px-4 py-3 border-b border-gray-300 font-bold text-sm">
						{{ header.label }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr @dblclick="() => handleDoubleClick(row)" @click="() => handleClick(row, rowIndex)" v-for="(row, rowIndex) in rows" :key="rowIndex" class="hover:bg-gray-50">
					<!-- Render each cell based on headers' keys -->
					<td v-for="header in headers" :key="header.key" class="px-4 py-3 border border-gray-200 text-sm text-gray-600">
						{{ header.key == "amount" ? formatAmount(row[header.key]) : row[header.key] }}
					</td>
				</tr>
			</tbody>
		</table>
		<!-- Download Buttons -->
		<div v-if="isDownloadAvailable" class="mt-2 flex justify-between">
			<!-- <el-col :lg="12" :md="12" :sm="24"> -->
			<el-button type="success" @click="downloadPdfData" class="mt-1 text-white px-4 py-2 rounded"> Download PDF </el-button>
			<el-button type="warning" @click="downloadExcelData" class="mt-1 text-white px py-2 rounded"> Download Excel </el-button>
			<!-- </el-col> -->
		</div>
		<el-dialog v-model="dialogFormVisible" title="Transaction Deletion/Updation" :width="dialogWidth + 'px'">
			<component :is="activeTabComponent" ref="childRef" @closeModal="dialogFormVisible = false" :friends="friends" :row="state.row" />
			<template #footer>
				<div class="dialog-footer">
					<BottomButtons @update="update" @delete="remove" @cancel="dialogFormVisible = false" />
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
	import { ElMessage } from "element-plus";
	import { computed, inject, onMounted, onUnmounted, reactive, ref, watch } from "vue";
	import { store } from "../stores/store"; // Import the Pinia store
	import { getActiveTab } from "../utils/active-tab";
	import BottomButtons from "./bottom-buttons.vue";
	import { downloadExcel, downloadPDF } from "../utils/downloadDataProcedures";
	import getCurrentMonth from "../utils/getCurrentMonth";
	const props = defineProps({
		rows: {
			type: Array,
			required: true
		},
		keys: {
			type: Array,
			required: true
		},
		friends: {
			type: Array
		},
		dataRef: {
			type: [Object, null], // Allow both Object and null
			required: false // Not required since it can be null
		},
		downloadTitle: {
			type: String,
			required: true
		}
	});
	const timeout = ref(null);
	const delay = 300; // Time to wait for double click in milliseconds
	const dialogFormVisible = ref(false);
	const state = reactive({ row: null });
	const screenWidth = ref(window.innerWidth); // Store the current screen width
	// Access the store
	const tabStore = store();
	const childRef = ref(null);

	// Directly use `activeTab` from Pinia store
	const activeTab = computed(() => tabStore.$state.activeTab);
	// Map activeTab to dynamic components
	const activeTabComponent = computed(() => getActiveTab(activeTab.value));
	const isDownloadAvailable = ref(props.rows.length > 0);

	watch(
		() => props.rows,
		(newRows) => {
			isDownloadAvailable.value = newRows.length > 0;
		},
		{ immediate: true, deep: true }
	);
	// Inject the globally provided formatAmount function
	const formatAmount = inject("formatAmount");
	function update() {
		childRef.value.validateForm("Update");
	}
	function remove() {
		childRef.value.validateForm("Delete");
	}

	function updateScreenWidth() {
		screenWidth.value = window.innerWidth;
	}

	// Listen for resize events
	onMounted(() => {
		window.addEventListener("resize", updateScreenWidth);
	});

	onUnmounted(() => {
		window.removeEventListener("resize", updateScreenWidth);
	});

	// Computed width for the dialog, responsive to screen width
	const dialogWidth = computed(() => {
		// Adjust this logic to make the width responsive based on screen size
		return screenWidth.value < 600 ? screenWidth.value * 0.95 : 500;
	});
	// Generate headers dynamically from `rows`
	const headers = computed(() => {
		if (props.rows.length > 0) {
			return Object.keys(props.rows[0]).map((key) => ({
				label: key.toCapitalize(),
				key
			}));
		}

		return [];
	});

	const handleClick = (rowS, rowIndex) => {
		clearTimeout(timeout.value);
		timeout.value = setTimeout(() => {
			dialogFormVisible.value = true;
			state.row = { ...rowS, id: props.keys[rowIndex] };
		}, delay);
	};

	const handleDoubleClick = (row) => {
		clearTimeout(timeout.value);
		ElMessage.info("Added By: " + (row.whoAdded || "N/A"));
	};
	function downloadExcelData() {
		downloadExcel(props.rows, getCurrentMonth() + `_${props.downloadTitle}_`, props.downloadTitle);
	}
	function downloadPdfData() {
		downloadPDF(props.dataRef, getCurrentMonth() + `_${props.downloadTitle}_`);
	}
</script>
