<template>
	<div>
		<!-- Add New Loan Section -->
		<LoanForm :friends="friends" />

		<div ref="loanContent">
			<!-- Loan Records Section -->

			<!-- Balances Section -->
			<fieldset class="border border-gray-300 rounded-lg p-3 mb-1">
				<legend>Loan Summary</legend>
				<el-row>
					<el-col v-for="(balance, index) in balances" :key="index" :sm="24" :lg="12" :md="12" class="mb-2">
						<strong>{{ balance.name }}</strong> is
						<span :class="balance.amount < 0 ? 'text-red-500' : 'text-green-500'">
							{{ balance.amount < 0 ? "under debt" : "a lender" }}
						</span>
						with
						<i> {{ formatAmount(Math.abs(balance.amount)) }}</i>
					</el-col>
				</el-row>
			</fieldset>
			<h2>Loan Records</h2>
			<Table downloadTitle="Loans" :rows="loans" :keys="loanKeys" :friends="friends" :dataRef="loanContent" />

		</div>
	</div>
</template>

<script setup>
	import { ref, computed, onMounted, inject } from "vue";
	import { onValue } from "../firebase"; // Firebase setup
	import Table from "./Table.vue";
	import { friends } from "../assets/data";
	import LoanForm from "./LoanForm.vue";
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

	// Calculate final balances to determine debtors and lenders
	const balances = computed(() => {
		const balanceMap = {};

		friends.forEach((friend) => {
			balanceMap[friend] = 0;
		});

		loans.value.forEach((loan) => {
			if (loan.giver && loan.receiver && loan.amount) {
				balanceMap[loan.giver] += loan.amount;
				balanceMap[loan.receiver] -= loan.amount;
			}
		});

		return Object.entries(balanceMap).map(([name, amount]) => ({
			name,
			amount
		}));
	});
</script>
