<template>
  <div class="my-4" ref="pdfContent">
    <Summary :payments="filteredPayments" :friends="friends" />
    <Settlement
      :payments="filteredPayments"
      :keys="paymentKeys"
      :selectedMonth="selectedMonth"
      :friends="friends"
      :isHistory="isHistory"
    />
    <el-divider />
    <div class="flex justify-between">
      <h2>Expense List</h2>
      <el-badge
        :value="filteredPayments.length"
        class="item mr-4"
        type="secondary"
        >{{ selectedFriend }}:<el-text tag="b"> Transactions</el-text>
      </el-badge>
    </div>

    <!-- Filters -->
    <el-row :gutter="20" class="mb-1" justify="space-between">
      <!-- Month Selection -->
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <el-form-item label="Month" class="w-full">
          <el-select
            v-model="selectedMonth"
            placeholder="Select Month"
            class="w-full"
          >
            <!-- <el-option value="All" label="All" /> -->
            <el-option
              v-for="month in months"
              :key="month"
              :value="month"
              :label="month"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Friend Selection -->
        <el-form-item label="Payer" class="w-full">
          <el-select
            v-model="selectedFriend"
            placeholder="Select Payer"
            class="w-full"
          >
            <el-option value="All" label="All" />
            <el-option
              v-for="opt in usersOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <!-- Table -->
    <Table
      :rows="filteredPayments"
      downloadTitle="Expenses"
      :keys="paymentKeys"
      :dataRef="pdfContent"
      :showPopup="!isHistory"
    />
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { store } from "../stores/store";
import { onValue, off } from "../firebase";
import Settlement from "./Settlement.vue";
import Summary from "./Summary.vue";
import Table from "./Table.vue";
import useFireBase from "../api/firebase-apis";
import { checkDaily } from "../utils/notifications";
import getCurrentMonth from "../utils/getCurrentMonth";
import { showError } from "../utils/showAlerts";
import { friends } from "../assets/data";

const userStore = store();
const usersOptions = computed(() => {
  const activeGroup = userStore.getActiveGroup;
  const group = activeGroup ? userStore.getGroupById(activeGroup) : null;
  if (group && group.members && group.members.length) {
    return group.members.map((m) => ({
      label: `${m.name} (${m.mobile})`,
      value: m.mobile,
    }));
  }
  const users =
    userStore.getUsers && userStore.getUsers.length ? userStore.getUsers : [];
  if (!users.length) return friends.map((f) => ({ label: f, value: f }));
  return users.map((u) => ({
    label: `${u.name} (${u.mobile})`,
    value: u.mobile,
  }));
});

const pdfContent = ref(null);
const months = ref([]);
const { dbRef } = useFireBase();

const props = defineProps({
  payments: Array,
  isHistory: { type: Boolean, default: false },
  dbRef: { type: String, default: "payments" },
});

const payments = ref([]);
const paymentKeys = ref([]);
const selectedMonth = ref(getCurrentMonth());
const selectedFriend = ref("All");
const selectedParticipants = ref([]);

let monthsListener = null;
let paymentsListener = null;

// Watch active group and refetch when it changes
watch(
  () => userStore.getActiveGroup,
  () => {
    selectedMonth.value = getCurrentMonth();
    selectedFriend.value = "All";
    selectedParticipants.value = [];
    fetchMonths();
    fetchExpenses();
  },
);

onMounted(() => {
  checkDaily(pdfContent);
  fetchMonths();
  fetchExpenses();
});

// Clean up listeners on unmount
onUnmounted(() => {
  const groupId = userStore.getActiveGroup || "global";
  if (monthsListener)
    off(dbRef(`${props.dbRef}/${groupId}`), "value", monthsListener);
  if (paymentsListener)
    off(
      dbRef(`${props.dbRef}/${groupId}/${selectedMonth.value}`),
      "value",
      paymentsListener,
    );
});

// Fetch available months
const fetchMonths = () => {
  const groupId = userStore.getActiveGroup || "global";
  console.log("Fetching months for group:", groupId);
  const monthsRef = dbRef(`${props.dbRef}/${groupId}`);
  monthsListener = onValue(
    monthsRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      months.value = Object.keys(data);
      console.log("Available months:", months.value);
      if (months.value.length) selectedMonth.value = getCurrentMonth();
    },
    (error) => {
      showError("Failed to load months. Please try again.");
    },
  );
};

// Fetch expenses for the selected month
const fetchExpenses = () => {
  const groupId = userStore.getActiveGroup || "global";
  const paymentsRef = dbRef(`${props.dbRef}/${groupId}/${selectedMonth.value}`);
  if (paymentsListener) off(paymentsRef, "value", paymentsListener); // Remove old listener

  paymentsListener = onValue(
    paymentsRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      paymentKeys.value = Object.keys(data);
      payments.value = Object.values(data);
    },
    (error) => {
      showError("Failed to load expenses. Please try again.");
    },
  );
};

// Watch for changes in selectedMonth
watch(selectedMonth, () => {
  selectedFriend.value = "All";
  fetchExpenses();
});

// Filter payments based on selected friend and current logged-in user
const normalize = (val) => String(val ?? "").trim();

const filteredPayments = computed(() => {
  const selected = normalize(selectedFriend.value);
  return payments.value?.filter((payment) => {
    if (props.isHistory) return true;

    const payer = normalize(payment?.payer);

    if (selected === "All") return true;
    if (payer === selected) return true;

    return false;
  });
});
</script>
