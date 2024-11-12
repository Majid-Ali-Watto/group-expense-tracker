<template>
    <div>
        <!-- Add New Loan Section -->
        <LoanForm :friends="friends" />

        <div ref="loanContent">
            <!-- Loan Records Section -->

            <h2>Loan Records</h2>
            <Table :rows="loans" :keys="loanKeys" :friends="friends" />

            <!-- Balances Section -->
            <fieldset class="border border-gray-300 rounded-lg p-3">
                <legend>
                    Final Balances
                </legend>
                <el-row>
                    <el-col
                        v-for="(balance, index) in balances"
                        :key="index"
                        :sm="24"
                        :lg="12"
                        :md="12"
                        class="mb-2"
                    >
                        <strong>{{ balance.name }}</strong> is
                        <span
                            :class="
                                balance.amount < 0
                                    ? 'text-red-500'
                                    : 'text-green-500'
                            "
                        >
                            {{ balance.amount < 0 ? "under debt" : "a lender" }}
                        </span>
                        with
                        <i> {{ formatAmount(Math.abs(balance.amount)) }}</i>
                    </el-col>
                </el-row>
            </fieldset>
        </div>
        <el-button
            type="success"
            class="mt-4 text-white"
            @click="downloadLoanDetails"
        >
            Download Loan Details
        </el-button>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { database, ref as dbRef, onValue } from "../firebase"; // Firebase setup
import html2pdf from "html2pdf.js"; // For PDF download
import Table from "./Table.vue";
import LoanForm from "./LoanForm.vue";
const formatAmount = inject("formatAmount");
const props = defineProps({
    friends: Array,
});

// Loan records array
const loans = ref([]);
const loanKeys = ref([]);

// Reference for the content to be downloaded
const loanContent = ref(null);

// Fetch existing loans on component mount
onMounted(() => {
    const loansRef = dbRef(database, "loans");
    onValue(loansRef, (snapshot) => {
        loans.value = snapshot.exists() ? Object.values(snapshot.val()) : [];
        loanKeys.value = snapshot.exists() ? Object.keys(snapshot.val()) : [];
        console.log(loanKeys.value);
    });
});

// Calculate final balances to determine debtors and lenders
const balances = computed(() => {
    const balanceMap = {};

    props.friends.forEach((friend) => {
        balanceMap[friend] = 0;
    });

    loans.value.forEach((loan) => {
        if (loan.giver && loan.receiver && loan.amount) {
            balanceMap[loan.giver] += loan.amount;
            balanceMap[loan.receiver] -= loan.amount;
        }
    });

    return Object.entries(balanceMap).map(([name, amount]) => ({
        name,
        amount,
    }));
});

// Download loan records as PDF
function downloadLoanDetails() {
    const options = {
        margin: 0.5,
        filename:
            props.friends.toString().replaceAll(",", "-") + "-Loan_Details.pdf",
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 5 },
        jsPDF: { unit: "in", format: "a3", orientation: "portrait" },
    };
    html2pdf().set(options).from(loanContent.value).save();
}
</script>

