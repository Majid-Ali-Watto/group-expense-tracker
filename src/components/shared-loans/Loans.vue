<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <!-- Add New Loan Section -->
    <LoanForm :showForm="showLoanForm" @close-form="closeLoanForm" />

    <div>
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
              >({{
                notif.byMobile
                  ? `${notif.byName} (${notif.byMobile})`
                  : notif.byName
              }})</span
            >
          </div>
          <el-button size="small" text @click="dismissNotification(notif.id)">
            ✕
          </el-button>
        </div>
      </div>

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
      <!-- Mobile filter toggle -->
      <div class="flex items-center justify-between mb-2 mt-4">
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
        class="filter-bar mb-3 mt-4 hidden sm:flex"
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
          <!-- Giver Selection -->
          <GenericDropDown
            v-model="selectedGiver"
            label="Giver"
            placeholder="Select Giver"
            :options="[{ label: 'All Givers', value: 'All' }, ...usersOptions]"
            size="small"
          />
        </el-col>
      </el-row>
      <!-- Mobile filters (toggle) -->
      <el-row
        v-if="showFilters"
        :gutter="5"
        class="filter-bar mb-3 mt-2 sm:hidden"
        justify="space-between"
      >
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
          <!-- Giver Selection -->
          <GenericDropDown
            v-model="selectedGiver"
            label="Giver"
            placeholder="Select Giver"
            :options="[{ label: 'All Givers', value: 'All' }, ...usersOptions]"
            size="small"
          />
        </el-col>
      </el-row>
      <div ref="loanContent">
        <!-- Display Final Balances -->
        <el-descriptions title="Loan Details" :column="1" :border="true">
          <el-descriptions-item
            v-for="(balance, index) in balances"
            :key="index"
            :label="balance.name"
            label-class-name="loan-detail-name-cell"
          >
            <span
              :class="balance.amount < 0 ? 'text-red-500' : 'text-green-500'"
            >
              {{ balance.amount < 0 ? 'Will Pay' : 'Will Receive' }}
            </span>
            with
            <i>{{ formatAmount(Math.abs(balance.amount)) }}</i>
          </el-descriptions-item>
        </el-descriptions>

        <h2>Loan Records</h2>
        <Table
          downloadTitle="Shared Loans"
          :rows="filteredLoans"
          :keys="loanKeys"
          :dataRef="loanContent"
          :reportMonth="selectedMonth"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { Filter } from '@element-plus/icons-vue'
import Table from '../shared/Table.vue'
import GenericDropDown from '../generic-components/GenericDropDown.vue'
import { Loans } from '../../scripts/shared-loans/loans'
const LoanForm = defineAsyncComponent(() => import('./LoanForm.vue'))

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

const showFilters = ref(false)
</script>

<style scoped>
:deep(.loan-detail-name-cell) {
  min-width: 220px;
  white-space: normal;
  word-break: break-word;
}
</style>
