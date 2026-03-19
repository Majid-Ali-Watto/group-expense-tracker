<template>
  <div class="my-4">
    <!-- Notifications for current user -->
    <NotificationsForCurrentUser
      v-if="userNotifications && userNotifications.length > 0"
      :userNotifications="userNotifications"
      @dismiss="dismissNotification"
    />

    <!-- Pending Approval Requests Section -->
    <div v-if="pendingRequests && pendingRequests.length > 0" class="mb-6">
      <h3 class="pending-title text-lg font-semibold mb-3 text-orange-600">
        ⚠️ Pending Approval Requests
      </h3>
      <div
        v-for="(request, index) in pendingRequests"
        :key="index"
        class="pending-card pending-request-card rounded-lg p-4 mb-3"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <strong class="text-gray-800">
              {{ request.type === 'delete' ? 'Delete' : 'Update' }} Request
            </strong>
            <p class="text-sm text-gray-600">
              Requested by:
              <strong>{{ getUserName(request.requestedBy) }}</strong>
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
    <!-- Mobile filter toggle -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-semibold text-gray-700">Filters</span>
      <el-button
        circle
        type="primary"
        size="small"
        class="sm:hidden"
        :icon="Filter"
        @click="showFilters = !showFilters"
      />
    </div>
    <!-- Filters -->
    <el-row
      :gutter="5"
      class="filter-bar mb-1 hidden sm:flex"
      justify="space-between"
    >
      <!-- Month Selection -->
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <GenericDropDown
          v-model="selectedMonth"
          label="Month"
          placeholder="Select Month"
          :options="months"
          size="small"
        />
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Payer Selection -->
        <GenericDropDown
          v-model="selectedFriend"
          label="Payer"
          placeholder="Select Payer"
          :options="[{ label: 'All', value: 'All' }, ...usersOptions]"
          size="small"
        />
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Payer Mode Filter -->
        <GenericDropDown
          v-model="selectedPayerMode"
          label="Payer Mode"
          :filterable="false"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Single', value: 'single' },
            { label: 'Multiple', value: 'multiple' }
          ]"
          size="small"
        />
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Split Mode Filter -->
        <GenericDropDown
          v-model="selectedSplitMode"
          label="Split Mode"
          :filterable="false"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Equal', value: 'equal' },
            { label: 'Custom', value: 'custom' }
          ]"
          size="small"
        />
      </el-col>
    </el-row>
    <!-- Mobile filters (toggle) -->
    <el-row
      v-if="showFilters"
      :gutter="5"
      class="filter-bar mb-1 sm:hidden"
      justify="space-between"
    >
      <!-- Month Selection -->
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <GenericDropDown
          v-model="selectedMonth"
          label="Month"
          placeholder="Select Month"
          :options="months"
          size="small"
        />
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Payer Selection -->
        <GenericDropDown
          v-model="selectedFriend"
          label="Payer"
          placeholder="Select Payer"
          :options="[{ label: 'All', value: 'All' }, ...usersOptions]"
          size="small"
        />
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Payer Mode Filter -->
        <GenericDropDown
          v-model="selectedPayerMode"
          label="Payer Mode"
          :filterable="false"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Single', value: 'single' },
            { label: 'Multiple', value: 'multiple' }
          ]"
          size="small"
        />
      </el-col>
      <el-col :lg="6" :md="6" :sm="12" :xs="12">
        <!-- Split Mode Filter -->
        <GenericDropDown
          v-model="selectedSplitMode"
          label="Split Mode"
          :filterable="false"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Equal', value: 'equal' },
            { label: 'Custom', value: 'custom' }
          ]"
          size="small"
        />
      </el-col>
    </el-row>
    <div ref="pdfContent">
      <Summary :payments="filteredPayments" />
      <Settlement
        :payments="filteredPayments"
        :keys="paymentKeys"
        :selectedMonth="selectedMonth"
        :isHistory="isHistory"
      />
      <el-divider />
      <div class="flex justify-between">
        <h2>Expense List</h2>
        <el-badge :value="filteredPayments.length" class="item mr-4" type="info"
          >{{ selectedFriend }}:<el-text tag="b"> Transactions</el-text>
        </el-badge>
      </div>

      <!-- Table -->
      <Table
        :rows="filteredPayments"
        downloadTitle="Shared Expenses"
        :keys="paymentKeys"
        :dataRef="pdfContent"
        :showPopup="!isHistory"
        :reportMonth="selectedMonth"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { Filter } from '@element-plus/icons-vue'
import Settlement from './Settlement.vue'
import Summary from './Summary.vue'
import Table from '../shared/Table.vue'
import GenericDropDown from '../generic-components/GenericDropDown.vue'
import { ExpenseList } from '../../scripts/shared-expenses/expense-list'
const NotificationsForCurrentUser = defineAsyncComponent(
  () => import('../generic-components/NotificationsForCurrentUser.vue')
)
const ShowPaymentDetails = defineAsyncComponent(
  () => import('../generic-components/ShowPaymentDetails.vue')
)

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
  pendingRequests,
  dismissNotification,
  getTotalMembers,
  getUserName,
  hasUserApproved,
  isFullyApproved,
  executeRequestManually,
  cancelRequest,
  approveRequest,
  rejectRequest
} = ExpenseList(props)

const showFilters = ref(false)
</script>
