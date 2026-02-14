<template>
  <div>
    <LoanForm db-ref="personal-loans" :isPersonal="true" />

    <div ref="loanContent">
      <!-- ===== EXACT WHO-OWES-WHOM ===== -->
      <h2 class="mt-6">Who Owes Whom (Exact)</h2>

      <el-table :data="pairwiseSettlements" border>
        <el-table-column prop="from" label="Debtor" />
        <el-table-column prop="to" label="Lender" />
        <el-table-column label="Amount">
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- ===== LOANS ===== -->
      <h2 class="mt-6">Loan Records</h2>

      <Table
        downloadTitle="Loans"
        :rows="loans"
        :keys="loanKeys"
        :friends="friends"
        :dataRef="loanContent"
        :showPopup="true"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { onValue } from "../../firebase";
import useFireBase from "../../api/firebase-apis";
import { store } from "../../stores/store";

import LoanForm from "../LoanForm.vue";
import Table from "../Table.vue";
import { friends } from "../../assets/data";

const formatAmount = inject("formatAmount");
const { dbRef } = useFireBase();
const userStore = store();

const loans = ref([]);
const loanKeys = ref([]);
const loanContent = ref(null);

onMounted(() => {
  const loansRef = dbRef("personal-loans/" + userStore.getActiveUser);

  onValue(loansRef, (snapshot) => {
    if (!snapshot.exists()) {
      loans.value = [];
      loanKeys.value = [];
      return;
    }

    const data = snapshot.val();
    loanKeys.value = Object.keys(data);
    loans.value = Object.values(data);
  });
});

setTimeout(() => {
  userStore.setLoansRef(loanContent.value);
}, 1000);

/* ===== NET SUMMARY (optional) ===== */
const balances = computed(() => {
  const map = {};

  loans.value.forEach(({ giver, receiver, amount }) => {
    if (!giver || !receiver || !amount) return;
    const v = Number(amount);

    if (!map[giver]) map[giver] = 0;
    if (!map[receiver]) map[receiver] = 0;

    map[giver] += v;
    map[receiver] -= v;
  });

  return Object.entries(map).map(([mobile, amount]) => ({
    name: userStore.getUserByMobile(mobile)?.name || mobile,
    amount,
  }));
});

/* ===== EXACT LEDGER SETTLEMENT ===== */
const pairwiseSettlements = computed(() => {
  const pairMap = {};

  loans.value.forEach(({ giver, receiver, amount }) => {
    if (!giver || !receiver || !amount) return;

    const v = Number(amount);

    // create a stable pair key (order-independent)
    const [a, b] = [giver, receiver].sort();
    const key = `${a}__${b}`;

    if (!pairMap[key]) {
      pairMap[key] = {
        a,
        b,
        aToB: 0,
        bToA: 0,
      };
    }

    // track direction
    if (giver === a && receiver === b) {
      pairMap[key].bToA += v; // b owes a
    } else {
      pairMap[key].aToB += v; // a owes b
    }
  });

  // convert to settlements
  const result = [];

  Object.values(pairMap).forEach(({ a, b, aToB, bToA }) => {
    const net = aToB - bToA;

    if (net > 0) {
      result.push({
        from: userStore.getUserByMobile(a)?.name || a,
        to: userStore.getUserByMobile(b)?.name || b,
        amount: net,
      });
    } else if (net < 0) {
      result.push({
        from: userStore.getUserByMobile(b)?.name || b,
        to: userStore.getUserByMobile(a)?.name || a,
        amount: Math.abs(net),
      });
    }
    // if net === 0 → fully settled, ignore
  });

  return result;
});
</script>

<style scoped>
.text-red-500 {
  color: #ef4444;
}
.text-green-500 {
  color: #22c55e;
}
.mt-6 {
  margin-top: 24px;
}
</style>
