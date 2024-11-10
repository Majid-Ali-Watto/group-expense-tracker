<template>
    <header
        class="text-3xl font-bold text-center mb-6 fixed top-0 left-0 w-full p-4 bg-white shadow-md z-50"
    >
        Group Expense Tracker
    </header>

    <div class="container mx-auto mt-16 p-4" v-if="!loggedIn">
        <Login :isLoggedIn="isLoggedIn" />
    </div>
    <div v-if="loggedIn" class="container mx-auto mt-16 p-4">
        <!-- tabs -->
        <el-tabs
            v-model="activeTab"
            @tab-change="handleActiveTab"
            type="border-card"
        >
            <el-tab-pane
                v-for="(tab, index) in tabs"
                :key="index"
                :label="tab"
                :name="tab"
            >
                <div v-if="tab === 'Expenses'">
                    <PaymentForm :friends="friends" />
                    <div ref="pdfContentApp">
                        <ExpenseList
                            :friends="friends"
                            :updatePayment="updatePayment"
                        />
                    </div>
                </div>
                <div v-if="activeTab == 'Loans'">
                    <Loans  :friends="friends"/>
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>

    <button
        v-if="loggedIn"
        @click="() => isLoggedIn(false)"
        class="bg-green-500 text-white rounded p-2 fixed right-2 bottom-2"
    >
        Logout
    </button>
</template>
      <!-- :payments="payments" -->

<script setup>
import { ref } from "vue";
import Login from "./components/Login.vue";
import PaymentForm from "./components/PaymentForm.vue";
import ExpenseList from "./components/ExpenseList.vue";
import Loans from "./components/Loans.vue";
const pdfContentApp = ref(null);
const tabs = ref(["Expenses", "Loans"]);

const props = defineProps({
    tabs: Array,
    setActiveTab: Function,
});
// Set "Expenses" as the default active tab
const activeTab = ref("Expenses");

function handleActiveTab(tab) {
    console.log("Active tab:", tab); // Use tab.name to get the tab label
    activeTab.value = tab; // Set the active tab using the name
}
const payments = ref([]);
const friends = ["Majid Ali", "Aqil Shahzad"];
const loggedIn = ref(null);

function isLoggedIn(logged) {
    loggedIn.value = logged;
}
function updatePayment(payment) {
    payments.value = payment;
}
</script>

<style>
@import "tailwindcss/tailwind.css";
</style>
