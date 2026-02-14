<template>
  <div>
    <!-- Add New Loan Section -->
    <LoanForm />

    <div ref="loanContent">
      <!-- Display Final Balances -->
      <el-descriptions title="Loan Details" column="1" :border="true">
        <el-descriptions-item
          v-for="(balance, index) in balances"
          :key="index"
          :label="balance.name"
        >
          <span :class="balance.amount < 0 ? 'text-red-500' : 'text-green-500'">
            {{ balance.amount < 0 ? "Under Debt" : "A Lender" }}
          </span>
          with
          <i>{{ formatAmount(Math.abs(balance.amount)) }}</i>
        </el-descriptions-item>
      </el-descriptions>
      <h2>Loan Records</h2>
      <Table
        downloadTitle="Loans"
        :rows="loans"
        :keys="loanKeys"
        :friends="friends"
        :dataRef="loanContent"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { onValue } from "../firebase"; // Firebase setup
import Table from "./Table.vue";
import { friends } from "../assets/data";
import LoanForm from "./LoanForm.vue";
import { store } from "../stores/store";
const userStore = store();

const usersList = computed(() =>
  userStore.getUsers && userStore.getUsers.length
    ? userStore.getUsers
    : friends.map((f) => ({ name: f, mobile: f })),
);
import useFireBase from "../api/firebase-apis";
const formatAmount = inject("formatAmount");
const { dbRef } = useFireBase();
// Loan records array
const loans = ref([]);
const loanKeys = ref([]);

// Reference for the content to be downloaded
const loanContent = ref(null);

// Fetch existing loans on component mount
onMounted(() => {
  const loansRef = dbRef("loans");
  onValue(loansRef, (snapshot) => {
    loans.value = snapshot.exists() ? Object.values(snapshot.val()) : [];
    loanKeys.value = snapshot.exists() ? Object.keys(snapshot.val()) : [];
  });
});
setTimeout(() => {
  userStore.setLoansRef(loanContent.value);
}, 1000);

// Calculate final balances to determine debtors and lenders
const balances = computed(() => {
  const balanceMap = {};

  // initialize balances by mobile
  usersList.value.forEach((u) => {
    balanceMap[u.mobile] = 0;
  });

  loans.value.forEach((loan) => {
    if (loan.giver && loan.receiver && loan.amount) {
      balanceMap[loan.giver] = (balanceMap[loan.giver] || 0) + loan.amount;
      balanceMap[loan.receiver] =
        (balanceMap[loan.receiver] || 0) - loan.amount;
    }
  });

  return Object.keys(balanceMap).map((mobile) => ({
    name: userStore.getUserByMobile(mobile)?.name || mobile,
    amount: balanceMap[mobile],
  }));
});
</script>
