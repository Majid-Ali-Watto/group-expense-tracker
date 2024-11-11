<template>
    <header
        class="flex justify-between mb-6 fixed top-0 left-0 w-full p-4 bg-white shadow-md z-50"
    >
        <span class="text-center text-3xl font-bold"> FinTrack </span>
        <button
            v-if="loggedIn"
            @click="() => isLoggedIn(false)"
            class="text-blue-400 rounded p-2"
        >
            Logout
        </button>
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
                <!-- Content based on activeTab -->
                <div v-show="activeTab === 'Expenses'">
                    <PaymentForm :friends="friends" />
                    <div ref="pdfContentApp">
                        <ExpenseList
                            :friends="friends"
                            :updatePayment="updatePayment"
                        />
                    </div>
                </div>
                <div v-show="activeTab === 'Loans'">
                    <Loans :friends="friends" />
                </div>
                <div v-show="activeTab === 'Sallary Manager'">
                    <SallaryManager :friends="friends" />
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useTabStore } from "./stores/useTabStore"; // Import the Pinia store
import Login from "./components/Login.vue";
import PaymentForm from "./components/PaymentForm.vue";
import ExpenseList from "./components/ExpenseList.vue";
import Loans from "./components/Loans.vue";
import SallaryManager from "./components/monthly-sallary-expense-manager/Manager.vue";

const tabs = ref(["Expenses", "Loans", "Sallary Manager"]);

const payments = ref([]);
const friends = ["Majid Ali", "Aqil Shahzad"];
const loggedIn = ref(null);
// Access the store
const tabStore = useTabStore();
// Directly use `activeTab` from Pinia store
const activeTab = tabStore.$state.activeTab;
function isLoggedIn(logged) {
    loggedIn.value = logged;
}

function updatePayment(payment) {
    payments.value = payment;
}

function handleActiveTab(tab) {
    tabStore.setActiveTab(tab); // Update the tab in the store
}
</script>

<style scoped>
@import "tailwindcss/tailwind.css";
</style>
