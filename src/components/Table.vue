<template>
    <div class="w-full overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
            <thead>
                <tr class="bg-slate-900 text-white text-left">
                    <!-- Render table headers -->
                    <th
                        v-for="(header, index) in headers"
                        :key="index"
                        class="px-4 py-3 border-b border-gray-300 font-bold text-sm"
                    >
                        {{ header.label }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    @dblclick="() => handleDoubleClick(row)"
                    @click="() => handleClick(row, rowIndex)"
                    v-for="(row, rowIndex) in rows"
                    :key="rowIndex"
                    class="hover:bg-gray-50"
                >
                    <!-- Render each cell based on headers' keys -->
                    <td
                        v-for="header in headers"
                        :key="header.key"
                        class="px-4 py-3 border border-gray-200 text-sm text-gray-600"
                        :style="
                            'text-align:' +
                            (header.key == 'amount' ? 'right;' : 'left;')
                        "
                    >
                        {{
                            header.key == "amount"
                                ? formatAmount(row[header.key])
                                : row[header.key]
                        }}
                    </td>
                </tr>
            </tbody>
        </table>
        <el-dialog
            v-model="dialogFormVisible"
            title="Transaction Modification"
            :width="dialogWidth + 'px'"
        >
            <!-- <el-form :model="form">
                <el-form-item
                    label="Promotion name"
                    :label-width="formLabelWidth"
                >
                    <el-input v-model="form.name" autocomplete="off" />
                </el-form-item>
                <el-form-item label="Zones" :label-width="formLabelWidth">
                    <el-select
                        v-model="form.region"
                        placeholder="Please select a zone"
                    >
                        <el-option label="Zone No.1" value="shanghai" />
                        <el-option label="Zone No.2" value="beijing" />
                    </el-select>
                </el-form-item>
            </el-form> -->
            <div v-if="activeTab == 'Expenses'">
                <PaymentForm
                    @closeModal="dialogFormVisible = false"
                    :friends="friends"
                    :row="state.row"
                />
            </div>
            <div v-if="activeTab == 'Loans'">
                <LoanForm
                    @closeModal="dialogFormVisible = false"
                    :friends="friends"
                    :row="state.row"
                />
            </div>
            <div v-if="activeTab == 'Salary Manager'">
                <AddExpense
                    @closeModal="dialogFormVisible = false"
                    :friends="friends"
                    :row="state.row"
                />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="success" @click="dialogFormVisible = false"
                        >Cancel</el-button
                    >
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { computed, inject, onMounted, onUnmounted, reactive, ref } from "vue";
import { store } from "../stores/store"; // Import the Pinia store
import PaymentForm from "./PaymentForm.vue";

import LoanForm from "./LoanForm.vue";
import AddExpense from "./monthly-sallary-expense-manager/AddExpense.vue";
const timeout = ref(null);
const delay = 300; // Time to wait for double click in milliseconds
const dialogFormVisible = ref(false);
const state = reactive({ row: null });
const screenWidth = ref(window.innerWidth); // Store the current screen width
// Access the store
const tabStore = store();

// Directly use `activeTab` from Pinia store
const activeTab = computed(() => tabStore.$state.activeTab);
console.log(activeTab, " is active tab");
// Inject the globally provided formatAmount function
const formatAmount = inject("formatAmount");
const props = defineProps({
    rows: {
        type: Array,
        required: true,
    },
    keys: {
        type: Array,
        required: true,
    },
    friends: {
        type: Array,
    },
});

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
// Generate headers based on `rows` or use `customHeaders` if provided
const headers = computed(() => {
    // Generate headers dynamically from `rows` if not provided
    if (props.rows.length > 0) {
        return Object.keys(props.rows[0]).map((key) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
            key,
        }));
    }

    return [];
});

const handleClick = (rowS, rowIndex) => {
    // Clear previous timeout if any
    clearTimeout(timeout.value);

    // Set a new timeout for a single click action
    timeout.value = setTimeout(() => {
        // Handle single click action
        dialogFormVisible.value = true;
        state.row = { ...rowS, id: props.keys[rowIndex] };
    }, delay);
};

const handleDoubleClick = (row) => {
    // Clear the timeout to prevent single click action
    clearTimeout(timeout.value);

    // Handle double click action
    ElMessage.info("Added By: " + (row.whoAdded || "N/A"));
};
</script>
