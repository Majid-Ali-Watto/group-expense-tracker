<template>
  <div class="my-4">
    <div>
      <h3 class="mb-2">Pairwise Settlements (Who pays whom)</h3>
      <el-table :data="settlements" style="width: 100%">
        <el-table-column label="Debtor">
          <template #default="{ row }">
            {{ userStore.getUserByMobile(row.from)?.name || row.from }}
          </template>
        </el-table-column>
        <el-table-column label="Lender">
          <template #default="{ row }">
            {{ userStore.getUserByMobile(row.to)?.name || row.to }}
          </template>
        </el-table-column>
        <el-table-column label="Amount">
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div
      v-if="userStore.getUserByMobile(user)?.name === 'Majid' && !isHistory"
      style="display: flex !important; justify-content: end !important"
    >
      <GenericButton @click="addPaymentsBatch" class="mt-4" type="success"
        >Settlement Done</GenericButton
      >
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from "vue";
import { GenericButton } from "./generic-components";
import { store } from "../stores/store";
import useFireBase from "../api/firebase-apis";
import { showError } from "../utils/showAlerts";
import { ElMessageBox } from "element-plus";
// use users from store instead of static friends list
const { updateData, deleteData } = useFireBase();
const formatAmount = inject("formatAmount");
const userStore = store();

const user = ref(userStore.$state.activeUser);
const props = defineProps({
  payments: Array,
  keys: Array,
  // friends: Array,
  selectedMonth: String,
  isHistory: { type: Boolean, default: false },
});

const updates = ref({});
async function addPaymentsBatch() {
  try {
    await ElMessageBox.confirm(
      "Are you sure to move expenses to backup. Continue?",
      "Warning",
      {
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );
    // Prepare a batch update object
    updates.value = {};
    props.payments.forEach((payment, index) => {
      const key = props.keys[index]; // Generate a unique key
      updates.value[key] = payment;
    });
    console.log(updates.value);
    // Perform batch update
    updateData(
      `payments-backup/${props.selectedMonth}`,
      getData,
      "Expenses added to Backup successfully!",
    );
    deleteData(
      `payments/${props.selectedMonth}`,
      props.selectedMonth + " data deleted",
    );
  } catch (error) {
    if (error != "cancel") showError(error);
  }
}
const getData = () => {
  return updates.value;
};

// Total spent across all payments
const totalSpent = computed(() =>
  props.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
);

// Compute balances using per-payment participants (equal split when participants stored as strings)
const balances = computed(() => {
  const map = {};
  // Initialize with known users from store (mobile as key)
  const users =
    userStore.getUsers && userStore.getUsers.length ? userStore.getUsers : [];
  if (users.length) users.forEach((u) => (map[u.mobile] = 0));
  else {
    // fallback: if no users known, initialize map empty
  }

  props.payments.forEach((payment) => {
    const amount = payment.amount || 0;
    // participants can be an array of strings (names) or objects with { userId/name, share }
    const participants =
      payment.participants && payment.participants.length
        ? payment.participants
        : users.map((u) => u.mobile); // default to all users if none provided

    // prefer explicit per-payment split if present
    let shares = [];
    if (payment.split && Array.isArray(payment.split) && payment.split.length) {
      shares = payment.split.map((s) => ({ id: s.mobile, share: s.amount }));
    } else if (
      participants.length &&
      typeof participants[0] === "object" &&
      participants[0].share != null
    ) {
      shares = participants.map((p) => ({
        id: p.userId || p.name,
        share: p.share,
      }));
    } else {
      const equalShare = participants.length ? amount / participants.length : 0;
      shares = participants.map((p) => ({
        id: typeof p === "string" ? p : p.userId || p.name,
        share: equalShare,
      }));
    }

    // subtract each participant's share
    shares.forEach((s) => {
      map[s.id] = (map[s.id] || 0) - s.share;
    });

    // credit the payer with the full amount they paid
    const payer = payment.payer;
    map[payer] = (map[payer] || 0) + amount;
  });

  return Object.keys(map).map((mobile) => ({
    mobile,
    name: userStore.getUserByMobile(mobile)?.name || mobile,
    balance: map[mobile],
  }));
});

// Pairwise settlements: who pays whom (list of {from, to, amount})
const settlements = computed(() => {
  const list = balances.value.map((b) => ({
    mobile: b.mobile,
    name: b.name,
    balance: Number(b.balance || 0),
  }));
  const creditors = list.filter((l) => l.balance > 0).map((c) => ({ ...c }));
  const debtors = list
    .filter((l) => l.balance < 0)
    .map((d) => ({ ...d, balance: -d.balance })); // make positive for owed amount

  const result = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amt = Math.min(debtor.balance, creditor.balance);
    if (amt > 0) {
      result.push({
        from: debtor.mobile,
        to: creditor.mobile,
        amount: parseFloat(amt.toFixed(2)),
      });
      debtor.balance = parseFloat((debtor.balance - amt).toFixed(2));
      creditor.balance = parseFloat((creditor.balance - amt).toFixed(2));
    }
    if (debtor.balance <= 0.001) i++;
    if (creditor.balance <= 0.001) j++;
  }
  return result;
});
</script>
