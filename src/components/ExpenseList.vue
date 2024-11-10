<template>
    <div class="my-4" ref="pdfContent">
        <Summary :payments="payments" :friends="friends" />
        <Settlement :payments="payments" :friends="friends" />
        <el-divider />
        <h2 class="text-xl font-semibold mb-4">Expense List</h2>

        <!-- Filters -->
        <div class="flex space-x-4 mb-4">
            <!-- Month Selection -->
            <el-form-item label="Month" class="w-full md:w-1/2">
                <el-select
                    v-model="selectedMonth"
                    placeholder="Select Month"
                    class="w-full"
                >
                    <el-option value="" label="All Months" />
                    <el-option
                        v-for="month in months"
                        :key="month"
                        :value="month"
                        :label="month"
                    />
                </el-select>
            </el-form-item>

            <!-- Friend Selection -->
            <el-form-item label="Friend" class="w-full md:w-1/2">
                <el-select
                    v-model="selectedFriend"
                    placeholder="Select Friend"
                    class="w-full"
                >
                    <el-option value="" label="All Friends" />
                    <el-option
                        v-for="friend in friends"
                        :key="friend"
                        :value="friend"
                        :label="friend"
                    />
                </el-select>
            </el-form-item>
        </div>

        <!-- Table -->
        <Table :rows="filteredPayments" />

        <!-- Download Buttons -->
        <el-row class="mt-2 flex justify-center">
            <el-col :lg="11" :md="11" :sm="24">
                <button
                    @click="downloadPDF"
                    class="bg-red-500 mt-1 text-white w-full px-4 py-2 rounded"
                >
                    Download PDF
                </button>
            </el-col>
            <el-col :lg="1" :md="1"></el-col>
            <el-col :lg="11" :md="11" :sm="24">
                <button
                    @click="downloadExcel"
                    class="bg-green-500 mt-1 text-white w-full px py-2 rounded"
                >
                    Download Excel
                </button>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import Summary from "./Summary.vue";
import Settlement from "./Settlement.vue";
import Table from "./Table.vue";
import { database, onValue, ref as dbRef } from "../firebase";
const props = defineProps({
    friends: Array,
    payments: Array,
    updatePayment: Function,
});
const friends = ref(props.friends); // Replace this if `friends` are passed as props.
const payments = ref([]);
const selectedMonth = ref("");
const selectedFriend = ref("");
const pdfContent = ref(null);
const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("en", { month: "long" })
);

onMounted(() => {
    const paymentsRef = dbRef(database, "payments");
    onValue(paymentsRef, (snapshot) => {
        const data = snapshot.val() || {};
        payments.value = Object.values(data);
        props.updatePayment(payments.value);
    });
});

const filteredPayments = computed(() => {
    return payments.value.filter((payment) => {
        const [day, month, timeYear] = payment.date.split("/");

        const monthMatches = selectedMonth.value
            ? new Date([month, day, timeYear].toString()).toLocaleString("en", {
                  month: "long",
              }) === selectedMonth.value
            : true;
        const friendMatches = selectedFriend.value
            ? payment.payer === selectedFriend.value
            : true;
        return monthMatches && friendMatches;
    });
});

function downloadPDF() {
    const options = {
        margin: 0.5, // No margin
        filename:
            props.friends.toString().replaceAll(",", "-") +
            "-Expenses-Table.pdf",
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
            scale: 5, // Higher scale for better quality
            logging: false,
            backgroundColor: "#ffffff", // Set a white background
        },
        jsPDF: {
            unit: "in",
            format: "a3",
            orientation: "portrait",
        },
    };

    html2pdf().set(options).from(pdfContent.value).save();
}

function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(filteredPayments.value);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(
        wb,
        props.friends.toString().replaceAll(",", "-") +
            " Expenses-Table" +
            ".xlsx"
    );
}
</script>

<style>
@import "tailwindcss/tailwind.css";
</style>
