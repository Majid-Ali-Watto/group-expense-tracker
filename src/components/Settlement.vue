<template>
    <div class="my-4">
        <fieldset class="border border-gray-300 rounded-lg p-4">
            <legend class="text-xl font-semibold px-2 mb-2">Settlement</legend>
            <el-row>
                <el-col
                    v-for="(balance, index) in balances"
                    :key="index"
                    class="space-y-2"
                    :lg="12"
                    :md="12"
                    :sm="24"
                >
                    <strong>{{ balance.name }}</strong> will
                    <span
                        :class="
                            balance.balance >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                        "
                    >
                        {{ balance.balance >= 0 ? "take " : "give " }}
                    </span>
                    <i>  {{ formatAmount(Math.abs(balance.balance)) }}</i>
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
const averageSpent = computed(() =>
    props.friends.length ? totalSpent.value / props.friends.length : 0
);
const balances = computed(() =>
    props.friends.map((friend) => ({
        name: friend,
        balance:
            props.payments
                .filter((payment) => payment.payer === friend)
                .reduce((sum, payment) => sum + payment.amount, 0) -
            averageSpent.value,
    }))
);
</script>

<style scoped>
@import "tailwindcss/tailwind.css";
</style>
