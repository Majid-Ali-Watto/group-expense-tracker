<template>
  <div class="my-4" ref="pdfContent">
    <!-- Notifications for current user -->
    <NotificationsForCurrentUser
      v-if="userNotifications && userNotifications.length > 0"
      :userNotifications="userNotifications"
      @dismiss="dismissNotification"
    />

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

        <!-- Show payment details -->
        <ShowPaymentDetails :getUserName="getUserName" :request="request" />

        <!-- Approval buttons -->
        <div class="flex gap-2 mt-3" v-if="request.requestedBy === activeUser">
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
          <el-button type="danger" size="small" @click="rejectRequest(request)">
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
      <el-badge :value="filteredPayments.length" class="item mr-4" type="info"
        >{{ selectedFriend }}:<el-text tag="b"> Transactions</el-text>
      </el-badge>
    </div>

    <!-- Filters -->
    <el-row :gutter="20" class="mb-1" justify="space-between">
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
        <!-- Payer Selection -->
        <el-form-item label="Payer" class="w-full">
          <el-select
            filterable
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
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Payer Mode Filter -->
        <el-form-item label="Payer Mode" class="w-full">
          <el-select v-model="selectedPayerMode" class="w-full">
            <el-option value="all" label="All" />
            <el-option value="single" label="Single" />
            <el-option value="multiple" label="Multiple" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Split Mode Filter -->
        <el-form-item label="Split Mode" class="w-full">
          <el-select v-model="selectedSplitMode" class="w-full">
            <el-option value="all" label="All" />
            <el-option value="equal" label="Equal" />
            <el-option value="custom" label="Custom" />
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
import Settlement from './Settlement.vue'
import Summary from './Summary.vue'
import Table from './Table.vue'
import { friends } from '../assets/data'
import { ExpenseList } from '../scripts/expense-list'
import NotificationsForCurrentUser from './generic-components/NotificationsForCurrentUser.vue'
import ShowPaymentDetails from './generic-components/ShowPaymentDetails.vue'

const props = defineProps({
  payments: Array,
  isHistory: { type: Boolean, default: false },
  dbRef: { type: String, default: 'payments' }
})

const {
  usersOptions,
  pdfContent,
  months,
  paymentKeys,
  selectedMonth,
  selectedFriend,
  selectedPayerMode,
  selectedSplitMode,
  filteredPayments,
  activeUser,
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
} = ExpenseList(props)
</script>
