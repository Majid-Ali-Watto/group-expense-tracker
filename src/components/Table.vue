<template>
	<div class="w-full overflow-x-auto">
		<table class="w-full border-collapse rounded-lg shadow-lg overflow-hidden">
			<thead>
				<tr class="bg-gradient-to-r from-gray-800 to-black text-white text-left">
					<!-- Render table headers -->
					<th v-for="(header, index) in headers" :key="index" class="px-6 py-4 border border-gray-700 font-semibold text-sm uppercase tracking-wide">
						{{ header.label }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr @dblclick="() => handleDoubleClick(row)" @click="() => handleClick(row, rowIndex)" v-for="(row, rowIndex) in rows" :key="rowIndex" class="hover:bg-indigo-100 transition duration-300 ease-in-out even:bg-gray-50">
					<td v-for="header in headers" :key="header.key" class="px-6 py-3 border border-gray-300 text-sm text-gray-700">
						{{ header.key == "amount" ? formatAmount(row[header.key]) : row[header.key] }}
					</td>
				</tr>
			</tbody>
		</table>

		<el-dialog top="10vh" center destroy-on-close v-model="dialogFormVisible" :width="dialogWidth + 'px'">
			<template #header>
				<div class="dialog-header">
					<strong>Delete or Update</strong>
				</div>
				<!-- <hr/> -->
			</template>
			<HOC :componentToBeRendered="activeTabComponent()" :componentProps="{ friends, row: state.row }" :listenersToPass="{ closeModal: () => (dialogFormVisible = false) }" ref="childRef" />
			<template #footer>
				<div class="dialog-footer">
					<BottomButtons @update="update" @delete="remove" @cancel="dialogFormVisible = false" />
				</div>
			</template>
		</el-dialog>
	</div>
	<div v-if="isDownloadAvailable" class="mt-2 flex justify-between">
		<el-button type="success" @click="downloadPdfData" class="mt-1 text-white px-4 py-2 rounded"> Download PDF </el-button>
		<el-button type="warning" @click="downloadExcelData" class="mt-1 text-white px py-2 rounded"> Download Excel </el-button>
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
	import HOC from "./HOC.vue";
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
	const activeTabComponent = () => getActiveTab(activeTab.value);
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
		childRef.value.componentRef.validateForm("Update");
	}
	function remove() {
		childRef.value.componentRef.validateForm("Delete");
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
