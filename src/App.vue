<template>
    <Header @click-log="isLoggedIn" :loggedIn="loggedIn" />

    <div class="container mx-auto mt-16 p-4" v-if="!loggedIn">
        <Login :isLoggedIn="isLoggedIn" />
    </div>
    <div
        v-if="loggedIn"
        class="container mx-auto mt-16 sm:mt-20 md:20 lg:mt-20"
    >
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
                <div
                    v-show="activeTab === 'Expenses'"
                    v-if="activeTab === 'Expenses'"
                >
                    <PaymentForm :friends="friends" />
                    <div ref="pdfContentApp">
                        <ExpenseList
                            :friends="friends"
                            :updatePayment="updatePayment"
                        />
                    </div>
                </div>
                <div
                    v-show="activeTab === 'Loans'"
                    v-if="activeTab === 'Loans'"
                >
                    <Loans :friends="friends" />
                </div>
                <div
                    v-show="activeTab === 'Salary Manager'"
                    v-if="activeTab === 'Salary Manager'"
                >
                    <SallaryManager :friends="friends" />
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup>
import { store } from "./stores/store"; // Import the Pinia store
import { defineAsyncComponent, ref } from "vue";

const Login = defineAsyncComponent(() => import("./components/Login.vue"));
const PaymentForm = defineAsyncComponent(() =>
    import("./components/PaymentForm.vue")
);
const ExpenseList = defineAsyncComponent(() =>
    import("./components/ExpenseList.vue")
);
const Loans = defineAsyncComponent(() => import("./components/Loans.vue"));
const SallaryManager = defineAsyncComponent(() =>
    import("./components/monthly-sallary-expense-manager/Manager.vue")
);
const Header = defineAsyncComponent(() => import("./components/Header.vue"));

const tabs = ref(["Expenses", "Loans", "Salary Manager"]);
const friends = ["Majid Ali", "Aqil Shahzad"];
const payments = ref([]);
const loggedIn = ref(null);
// Access the store
const tabStore = store();
// Directly use `activeTab` from Pinia store
const activeTab = ref(tabStore.$state.activeTab);
function isLoggedIn(logged) {
    loggedIn.value = logged;
}

function updatePayment(payment) {
    payments.value = payment;
}

function handleActiveTab(tab) {
    activeTab.value = tab;
    tabStore.setActiveTab(tab); // Update the tab in the store
}
</script>

