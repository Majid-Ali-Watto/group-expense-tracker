<template>
  <div class="my-4">
    <div class="w-full mx-auto">
      <el-descriptions
        direction="vertical"
        title="Expense Summary"
        column="2"
        :border="true"
      >
        <el-descriptions-item label="Total Spent">
          {{ formatAmount(totalSpent) }}
        </el-descriptions-item>
        <el-descriptions-item label="Average Per Person">
          {{ formatAmount(averageSpent) }}
        </el-descriptions-item>
        <template v-for="(friend, index) in friendTotals" :key="index">
          <el-descriptions-item :label="`${friend.name} Paid`">
            {{ formatAmount(friend.total) }}
          </el-descriptions-item>
        </template>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from "vue";
const formatAmount = inject("formatAmount");
import { friends } from "../assets/data";
import { store } from "../stores/store";
const userStore = store();

const props = defineProps({
  payments: Array,
});

const activeGroup = computed(() => userStore.getActiveGroup);
const groupObj = computed(() =>
  activeGroup.value ? userStore.getGroupById(activeGroup.value) : null,
);

const filteredPayments = computed(() => {
  const all = props.payments || [];
  if (activeGroup.value) {
    return all.filter((p) => p && p.group === activeGroup.value);
  }
  return all.filter((p) => !p || !p.group || p.group === "global");
});

const totalSpent = computed(() =>
  filteredPayments.value.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0,
  ),
);

const usersList = computed(() => {
  if (
    groupObj.value &&
    groupObj.value.members &&
    groupObj.value.members.length
  ) {
    return groupObj.value.members.map((m) => ({
      name: m.name,
      mobile: m.mobile,
    }));
  }
  return userStore.getUsers && userStore.getUsers.length
    ? userStore.getUsers
    : friends.map((f) => ({ name: f, mobile: f }));
});

const averageSpent = computed(() =>
  usersList.value.length ? totalSpent.value / usersList.value.length : 0,
);

const friendTotals = computed(() =>
  usersList.value.map((user) => ({
    name: user.name,
    total: filteredPayments.value
      .filter((payment) => payment.payer === user.mobile)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0),
  })),
);
</script>
