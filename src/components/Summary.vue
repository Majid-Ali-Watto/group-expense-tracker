<template>
    <div class="my-4">
        <fieldset class="border border-gray-300 rounded-lg p-4">
            <legend>Summary</legend>
            <el-row class="mt-2">
                <el-col :lg="12" :md="12" :sm="24" class="space-y-2">
                    <p>
                        Total spent: <i> {{ formatAmount(totalSpent) }}</i>
                    </p>
                    <p>
                        Average per person:
                        <i> {{ formatAmount(averageSpent) }}</i>
                    </p>
                </el-col>
                <el-col :lg="12" :md="12" :sm="24" class="space-y-2">
                    <p v-for="(friend, index) in friendTotals" :key="index">
                        <strong>{{ friend.name }}</strong> paid:
                        <i> {{ formatAmount(friend.total) }}</i>
                    </p>
                </el-col>
            </el-row>
        </fieldset>
    </div>
</template>

<script setup>
import { computed, inject } from "vue";
const formatAmount = inject("formatAmount");
const props = defineProps({
    payments: Array,
    friends: Array,
});

const totalSpent = computed(() =>
    props.payments.reduce((sum, payment) => sum + payment.amount, 0)
);
const averageSpent = computed(() => totalSpent.value / props.friends.length);
const friendTotals = computed(() =>
    props.friends.map((friend) => ({
        name: friend,
        total: props.payments
            .filter((payment) => payment.payer === friend)
            .reduce((sum, payment) => sum + payment.amount, 0),
    }))
);
</script>
