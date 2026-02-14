<template>
  <div class="space-y-4">
    <!-- Plus Button -->
    <div
      v-if="!showTransactionForm"
      class="flex justify-between items-center gap-4"
    >
      <span> Want to create a new transaction? </span>
      <el-button type="primary" circle size="medium" @click="openForm">
        <span class="text-lg">+</span>
      </el-button>
    </div>

    <!-- Transaction Form -->
    <fieldset v-else class="border border-gray-300 rounded-lg p-4">
      <legend>Transaction Details</legend>

      <el-form
        :model="formData"
        :rules="rules"
        ref="transactionForm"
        label-position="top"
        class="space-y-4"
      >
        <el-row :gutter="20">
          <el-col :lg="12" :md="12" :sm="24">
            <AmountInput v-model="formData.amount" required />

            <GenericDropDown
              label="Payer"
              prop="payer"
              v-model="formData.payer"
              placeholder="Select payer"
              :options="usersOptions"
              required
            />

            <el-form-item
              label="Participants"
              prop="participants"
              class="w-full"
            >
              <el-select
                v-model="formData.participants"
                multiple
                disabled
                placeholder="Select participants"
                class="w-full"
                clearable
              >
                <el-option
                  v-for="opt in usersOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>

            <DataTimePicker v-model="formData.date" required />
          </el-col>

          <el-col :lg="12" :md="12" :sm="24">
            <GenericInput
              rows="9"
              v-model="formData.description"
              label="Description"
              prop="description"
              required
              type="textarea"
              placeholder="Enter description"
            />
          </el-col>
        </el-row>

        <!-- Buttons -->
        <div class="flex justify-end gap-2">
          <el-button type="info" plain @click="closeForm"> Cancel </el-button>
          <GenericButton type="success" @click="() => validateForm()">
            Add Payment
          </GenericButton>
        </div>
      </el-form>
    </fieldset>

    <!-- Expense List (always visible) -->
    <HOC :componentToBeRendered="ExpenseList" />
  </div>
</template>

<script setup>
import HOC from "./HOC.vue";
import { ref, watch, defineAsyncComponent, computed } from "vue";
import getWhoAddedTransaction from "../utils/whoAdded";
import {
  DataTimePicker,
  AmountInput,
  GenericButton,
  GenericDropDown,
  GenericInput,
} from "./generic-components";
const ExpenseList = defineAsyncComponent(() => import("./ExpenseList.vue"));
const emit = defineEmits(["closeModal"]);
import { friends } from "../assets/data";
import { store } from "../stores/store";
import { rules } from "../assets/validation-rules";
import useFireBase from "../api/firebase-apis";

const { deleteData, updateData, saveData } = useFireBase();
const props = defineProps({
  row: Object,
});
const isVisible = ref(true);
const userStore = store();

const showTransactionForm = ref(false);

const openForm = () => {
  showTransactionForm.value = true;
};

const closeForm = () => {
  showTransactionForm.value = false;
};

const usersOptions = computed(() => {
  // prefer active group's members if available
  const activeGroup = userStore.getActiveGroup;
  console.log("Active Group:", activeGroup);
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
// Form data model
const formData = ref({
  amount: null,
  description: "",
  payer: "",
  participants: [...usersOptions.value.map((u) => u.value)], // default to all users
  date: "",
});
// Watch for changes in `row` prop and update formData
watch(
  () => props.row,
  (newRow) => {
    formData.value.amount = newRow?.amount ?? null;
    formData.value.description = newRow?.description ?? "";
    formData.value.payer = newRow?.payer ?? "";
    formData.value.date = newRow?.date ?? "";
    isVisible.value = !newRow?.amount;
  },
  { immediate: true, deep: true },
);

// Form submission handler
const transactionForm = ref(null);

const validateForm = (whatTask = "Save") => {
  transactionForm.value.validate((valid) => {
    if (valid) {
      let monthYear = formData.value.date.split("-");
      monthYear = monthYear[0] + "-" + monthYear[1].toString().padStart(2, 0);
      const groupId = userStore.getActiveGroup || "global";
      if (whatTask == "Save") {
        saveData(
          `payments/${groupId}/${monthYear}`,
          getPaymentData,
          transactionForm,
          "Transaction successfully saved.",
        );
      } else if (whatTask == "Update") {
        updateData(
          `payments/${groupId}/${monthYear}/${props.row.id}`,
          getPaymentData,
          `Payment record with ID ${props.row.id} updated successfully`,
        );
        emit("closeModal");
      } else if (whatTask == "Delete") {
        deleteData(
          `payments/${groupId}/${monthYear}/${props.row.id}`,
          `Payment record with ID ${props.row.id} deleted successfully`,
        );
        emit("closeModal");
      }
    }
  });
};

function getPaymentData() {
  const amount = parseFloat(formData.value.amount);
  const participantsList =
    formData.value.participants && formData.value.participants.length
      ? formData.value.participants
      : userStore.getUsers && userStore.getUsers.length
        ? userStore.getUsers.map((u) => u.mobile)
        : [];

  // compute equal split and ensure rounding sums to total
  let split = [];
  if (participantsList.length) {
    const equal = Math.floor((amount / participantsList.length) * 100) / 100; // floor to cents
    let acc = 0;
    for (let i = 0; i < participantsList.length; i++) {
      const mobile = participantsList[i];
      let share = equal;
      // last participant gets the remainder to match total
      if (i === participantsList.length - 1) {
        share = parseFloat((amount - acc).toFixed(2));
      } else {
        acc += share;
      }
      split.push({
        mobile,
        name: userStore.getUserByMobile(mobile)?.name || mobile,
        amount: share,
      });
    }
  }

  const payment = {
    amount: amount,
    description: formData.value.description,
    payer: formData.value.payer,
    group: userStore.getActiveGroup || null,
    date: new Date(formData.value.date).toLocaleString("en-PK"),
    whenAdded: new Date().toLocaleString("en-PK"),
    whoAdded: getWhoAddedTransaction(),
    // store participants as array of mobile ids (strings)
    participants: participantsList,
    // per-participant split stored for display and calculations
    split,
  };

  return payment;
}

defineExpose({
  validateForm,
});
</script>
