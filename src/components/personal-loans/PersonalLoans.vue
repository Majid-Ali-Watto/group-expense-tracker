<template>
  <div>
    <LoanForm
      db-ref="personal-loans"
      :isPersonal="true"
      :showForm="showLoanForm"
      @close-form="closeLoanForm"
    />

    <div ref="loanContent">
      <!-- Summary Statistics -->
      <el-descriptions
        title="Loan Summary"
        :column="2"
        :border="true"
        class="mt-4"
      >
        <el-descriptions-item label="Total Lending">
          <span class="text-green-500 font-bold">{{
            formatAmount(totalLending)
          }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="Total Debting">
          <span class="text-red-500 font-bold">{{
            formatAmount(totalDebting)
          }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="Net Position">
          <span
            :class="netPosition >= 0 ? 'text-green-500' : 'text-red-500'"
            class="font-bold"
          >
            {{ netPosition >= 0 ? 'Lender' : 'Debtor' }} -
            {{ formatAmount(Math.abs(netPosition)) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="Total Transactions">
          <span class="font-bold">{{ loans.length }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Month Filter -->
      <el-row :gutter="20" class="mb-3 mt-4">
        <el-col :lg="8" :md="12" :sm="24">
          <el-form-item label="Select Month" class="w-full">
            <el-select
              filterable
              v-model="selectedMonth"
              placeholder="Select Month"
              class="w-full"
              @change="fetchLoans"
            >
              <el-option value="All" label="All Months" />
              <el-option
                v-for="month in months"
                :key="month"
                :value="month"
                :label="month"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

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
        downloadTitle="Personal_Loans"
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
import LoanForm from '../LoanForm.vue'
import Table from '../Table.vue'
import { friends } from '../../assets/data'
import { PersonalLoans } from '../../scripts/personal-loans'

const {
  formatAmount,
  loans,
  loanKeys,
  loanContent,
  selectedMonth,
  months,
  showLoanForm,
  closeLoanForm,
  totalLending,
  totalDebting,
  netPosition,
  pairwiseSettlements
} = PersonalLoans()
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
