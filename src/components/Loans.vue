<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <!-- Add New Loan Section -->
    <LoanForm :showForm="showLoanForm" @close-form="closeLoanForm" />

    <div ref="loanContent">
      <!-- Notifications for current user -->
      <div
        v-if="userNotifications && userNotifications.length > 0"
        class="mb-4 space-y-2"
      >
        <div
          v-for="notif in userNotifications"
          :key="notif.id"
          :class="[
            'border p-3 rounded-lg flex justify-between items-center',
            notif.type === 'approved'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          ]"
        >
          <div
            :class="[
              'text-sm',
              notif.type === 'approved' ? 'text-green-800' : 'text-red-800'
            ]"
          >
            <span class="font-medium">{{ notif.message }}</span>
            <span v-if="notif.byName" class="text-gray-600 ml-2"
              >({{ notif.byName }})</span
            >
          </div>
          <el-button size="small" text @click="dismissNotification(notif.id)">
            ✕
          </el-button>
        </div>
      </div>

      <!-- Pending Approval Requests Section -->
      <div v-if="pendingRequests && pendingRequests.length > 0" class="mb-6">
        <h3 class="text-lg font-semibold mb-3 text-orange-600">
          ⚠️ Pending Approval Requests
        </h3>
        <div
          v-for="(request, index) in pendingRequests"
          :key="index"
          class="border border-orange-300 rounded-lg p-4 mb-3 bg-orange-50"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <strong class="text-gray-800">
                {{ request.type === 'delete' ? 'Delete' : 'Update' }} Request
              </strong>
              <p class="text-sm text-gray-600">
                Requested by: <strong>{{ request.requestedByName }}</strong>
                <span v-if="request.requestedAt">
                  on {{ request.requestedAt }}</span
                >
              </p>
            </div>
            <el-tag :type="request.type === 'delete' ? 'danger' : 'warning'">
              {{ request.approvals.length }} / {{ getTotalMembers() }} Approved
            </el-tag>
          </div>

          <!-- Show loan details -->
          <div class="text-sm text-gray-700 mb-2">
            <p v-if="request.type === 'update'">
              <strong>Proposed Changes:</strong><br />
              Amount: {{ formatAmount(request.changes.amount) }}<br />
              Giver: {{ getUserName(request.changes.giver) }}<br />
              Receiver: {{ getUserName(request.changes.receiver) }}<br />
              Description: {{ request.changes.description }}
            </p>
            <p v-else>
              <strong>Loan to be deleted:</strong><br />
              Amount: {{ formatAmount(request.loan.amount) }}<br />
              Giver: {{ getUserName(request.loan.giver) }}<br />
              Receiver: {{ getUserName(request.loan.receiver) }}
            </p>
          </div>

          <!-- Approval buttons -->
          <div
            class="flex gap-2 mt-3"
            v-if="request.requestedBy === activeUser"
          >
            <span class="text-blue-600 text-sm font-semibold">
              ✓ You requested this {{ request.type }}
            </span>
            <el-button
              type="warning"
              size="small"
              @click="cancelRequest(request)"
            >
              Cancel Request
            </el-button>
          </div>
          <div class="flex gap-2 mt-3" v-else-if="!hasUserApproved(request)">
            <el-button
              type="success"
              size="small"
              @click="approveRequest(request)"
            >
              Approve
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="rejectRequest(request)"
            >
              Reject
            </el-button>
          </div>
          <div
            v-else-if="isFullyApproved(request)"
            class="flex gap-2 mt-3 items-center"
          >
            <span class="text-green-600 text-sm font-semibold">
              ✓ All members approved
            </span>
            <el-button
              type="primary"
              size="small"
              @click="executeRequestManually(request)"
            >
              Complete Request
            </el-button>
          </div>
          <div v-else class="text-green-600 text-sm font-semibold">
            ✓ You have approved this request
          </div>
        </div>
      </div>

      <!-- Display Final Balances -->
      <el-descriptions title="Loan Details" :column="1" :border="true">
        <el-descriptions-item
          v-for="(balance, index) in balances"
          :key="index"
          :label="balance.name"
        >
          <span :class="balance.amount < 0 ? 'text-red-500' : 'text-green-500'">
            {{ balance.amount < 0 ? 'Under Debt' : 'A Lender' }}
          </span>
          with
          <i>{{ formatAmount(Math.abs(balance.amount)) }}</i>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Filters -->
      <el-row :gutter="20" class="mb-3 mt-4" justify="space-between">
        <!-- Month Selection -->
        <el-col :lg="6" :md="6" :sm="12" :xs="12">
          <el-form-item label="Month" class="w-full">
            <el-select
              filterable
              v-model="selectedMonth"
              placeholder="Select Month"
              class="w-full"
            >
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
          <!-- Giver Selection -->
          <el-form-item label="Loan Giver" class="w-full">
            <el-select
              filterable
              v-model="selectedGiver"
              placeholder="Select Giver"
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

      <h2>Loan Records</h2>
      <Table
        downloadTitle="Loans"
        :rows="filteredLoans"
        :keys="loanKeys"
        :friends="friends"
        :dataRef="loanContent"
      />
    </div>
  </div>
</template>

<script setup>
import Table from './Table.vue'
import { friends } from '../assets/data'
import LoanForm from './LoanForm.vue'
import { Loans } from '../scripts/loans'

const {
  formatAmount,
  showLoanForm,
  closeLoanForm,
  selectedMonth,
  selectedGiver,
  months,
  activeUser,
  usersOptions,
  loanKeys,
  loanContent,
  filteredLoans,
  balances,
  userNotifications,
  dismissNotification,
  pendingRequests,
  getTotalMembers,
  getUserName,
  hasUserApproved,
  isFullyApproved,
  executeRequestManually,
  cancelRequest,
  approveRequest,
  rejectRequest
} = Loans()
</script>
