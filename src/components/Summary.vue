<template>
	<div class="my-4">
		<!-- <fieldset class="border border-gray-300 rounded-lg p-4">
			<legend>Summary</legend>
			<el-row class="mt-2">
				<el-col :lg="12" :md="12" :sm="24" class="space-y-2">
					<el-statistic :value="totalSpent" :formatter="formatAmount">
						<template #title>Total Spent</template>
					</el-statistic>
					<el-statistic :value="averageSpent" :formatter="formatAmount">
						<template #title>Average Per Person</template>
					</el-statistic>
				</el-col>
				<el-col :lg="12" :md="12" :sm="24" class="space-y-2">
					<div v-for="(friend, index) in friendTotals" :key="index">
						<el-statistic :value="friend.total" :formatter="formatAmount">
							<template #title>{{ `${friend.name} Paid` }}</template>
						</el-statistic>
					</div>
				</el-col>
			</el-row>
		</fieldset> -->
		<div class="w-full mx-auto">
			<el-descriptions direction="vertical" title="Expense Summary" column="2" :border="true">
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
	const props = defineProps({
		payments: Array
		// friends: Array
	});

	const totalSpent = computed(() => props.payments.reduce((sum, payment) => sum + payment.amount, 0));
	const averageSpent = computed(() => totalSpent.value / friends.length);
	const friendTotals = computed(() =>
		friends.map((friend) => ({
			name: friend,
			total: props.payments.filter((payment) => payment.payer === friend).reduce((sum, payment) => sum + payment.amount, 0)
		}))
	);
</script>
