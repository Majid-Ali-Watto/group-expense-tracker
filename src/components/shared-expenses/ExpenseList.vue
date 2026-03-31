<template>
  <div class="my-4">
    <LoadingSkeleton v-if="isContentLoading" mode="page" />
    <template v-else>
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
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-gray-700">Filters</span>
        <div class="flex items-center gap-2">
          <button
            v-if="showFilters"
            class="clear-filter-link sm:hidden"
            @click="clearFilters()"
          >
            Clear
          </button>
          <button
            class="clear-filter-link hidden sm:inline"
            @click="clearFilters()"
          >
            Clear
          </button>
          <el-button
            circle
            :type="showFilters ? 'danger' : 'primary'"
            size="small"
            class="sm:hidden"
            :icon="showFilters ? Close : Filter"
            @click="showFilters = !showFilters"
          />
        </div>
      </div>
      <!-- Filters: desktop always visible -->
      <div class="hidden sm:block mb-1">
        <el-row :gutter="5" class="filter-bar" justify="start">
          <!-- Month Selection -->
          <el-col :lg="5" :md="5" :sm="12" :xs="12">
            <GenericDropDown
              v-model="selectedMonth"
              label="Month"
              placeholder="Select Month"
              :options="months"
              size="small"
            />
          </el-col>
          <el-col :lg="5" :md="5" :sm="12" :xs="12">
            <!-- Payer Selection -->
            <GenericDropDown
              v-model="selectedFriend"
              label="Payer"
              placeholder="Select Payer"
              :options="[{ label: 'All', value: 'All' }, ...usersOptions]"
              size="small"
            />
          </el-col>
          <el-col :lg="5" :md="5" :sm="12" :xs="12">
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
          <el-col :lg="5" :md="5" :sm="12" :xs="12">
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
      </div>
      <!-- Mobile filters (toggle) -->
      <Transition name="form-slide">
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
      </Transition>
      <div ref="pdfContent">
        <Summary :payments="filteredPayments" />
        <Settlement
          :payments="filteredPayments"
          :keys="paymentKeys"
          :selectedMonth="selectedMonth"
        />
        <el-divider />
        <div class="flex justify-between">
          <h2>Expense List</h2>
          <el-badge
            :value="filteredPayments.length"
            class="item mr-4"
            type="info"
            >{{ selectedFriend }}:<el-text tag="b"> Transactions</el-text>
          </el-badge>
        </div>

        <!-- Table -->
        <Table
          :rows="filteredPayments"
          downloadTitle="Shared Expenses"
          :keys="paymentKeys"
          :dataRef="pdfContent"
          :showPopup="true"
          :reportMonth="selectedMonth"
        />
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { Filter, Close } from '@element-plus/icons-vue'
import Settlement from './Settlement.vue'
import Summary from './Summary.vue'
import { Table, LoadingSkeleton } from '@/components/shared'
import { GenericDropDown } from '@/components/generic-components'
import { ExpenseList } from '@/scripts/shared-expenses'
import { DB_NODES } from '@/constants'
import { loadAsyncComponent } from '@/utils'
const NotificationsForCurrentUser = loadAsyncComponent(
  () => import('../generic-components/NotificationsForCurrentUser.vue')
)
const ShowPaymentDetails = loadAsyncComponent(
  () => import('../generic-components/ShowPaymentDetails.vue')
)

const props = defineProps({
  payments: Array,
  dbRef: { type: String, default: () => DB_NODES.SHARED_EXPENSES }
})

const {
  usersOptions,
  pdfContent,
  months,
  paymentKeys,
  isContentLoading,
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
  rejectRequest,
  clearFilters
} = ExpenseList(props)

const showFilters = ref(false)
</script>
