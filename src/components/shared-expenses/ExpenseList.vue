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
          {{ t('approval.pendingTitle') }}
        </h3>
        <div
          v-for="(request, index) in pendingRequests"
          :key="index"
          class="pending-card pending-request-card rounded-lg p-4 mb-3"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <strong class="text-gray-800">
                {{ request.type === 'delete' ? t('approval.deleteRequest') : t('approval.updateRequest') }}
              </strong>
              <p class="text-sm text-gray-600">
                {{ t('approval.requestedBy') }}
                <strong>{{ getUserName(request.requestedBy) }}</strong>
                <span v-if="request.requestedAt">
                  {{ t('approval.on') }} {{ request.requestedAt }}</span
                >
              </p>
            </div>
            <el-tag :type="request.type === 'delete' ? 'danger' : 'warning'">
              {{ request.approvals.length }} / {{ getTotalMembers() }} {{ t('approval.approved') }}
            </el-tag>
          </div>

          <!-- Show payment details -->
          <ShowPaymentDetails :getUserName="getUserName" :request="request" />

          <!-- Approval buttons -->
          <div
            class="flex gap-2 mt-3"
            v-if="request.requestedBy === activeUserUid"
          >
            <span class="text-blue-600 text-sm font-semibold">
              {{ t('approval.youRequestedThis', { type: request.type }) }}
            </span>
            <el-button
              type="warning"
              size="default"
              @click="cancelRequest(request)"
            >
              {{ t('approval.cancelRequest') }}
            </el-button>
          </div>
          <div class="flex gap-2 mt-3" v-else-if="!hasUserApproved(request)">
            <el-button
              type="success"
              size="default"
              @click="approveRequest(request)"
            >
              {{ t('common.approve') }}
            </el-button>
            <el-button
              type="danger"
              size="default"
              @click="rejectRequest(request)"
            >
              {{ t('common.reject') }}
            </el-button>
          </div>
          <div
            v-else-if="isFullyApproved(request)"
            class="flex gap-2 mt-3 items-center"
          >
            <span class="text-green-600 text-sm font-semibold">
              {{ t('approval.allMembersApproved') }}
            </span>
            <el-button
              type="primary"
              size="default"
              @click="executeRequestManually(request)"
            >
              {{ t('approval.completeRequest') }}
            </el-button>
          </div>
          <div v-else class="text-green-600 text-sm font-semibold">
            {{ t('approval.youApprovedRequest') }}
          </div>
        </div>
      </div>
      <!-- Filters -->
      <FilterBar :fields="filterFields" @clear="clearFilters" />
      <div ref="pdfContent">
        <div class="pdf-summary-section">
          <Summary :payments="filteredPayments" />
        </div>
        <div class="pdf-settlement-section">
          <Settlement
            :payments="filteredPayments"
            :keys="paymentKeys"
            :selectedMonth="selectedMonth"
          />
        </div>
        <el-divider />
        <div class="flex justify-between">
          <h2>{{ t('sharedExpenses.expenseList') }}</h2>
          <el-badge
            :value="filteredPayments.length"
            class="item mr-4"
            type="info"
            >{{ selectedFriend }}:<el-text tag="b"> {{ t('common.transactions') }}</el-text>
          </el-badge>
        </div>

        <!-- Table -->
        <Table
          :rows="filteredPayments"
          :downloadTitle="t('sharedExpenses.sharedExpensesDownload')"
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
import { useI18n } from 'vue-i18n'
import { Table, LoadingSkeleton } from '@/components/shared'
import { FilterBar } from '@/components/generic-components'
import Settlement from './Settlement.vue'
import Summary from './Summary.vue'
import { ExpenseList } from '@/scripts/shared-expenses'
import { DB_NODES } from '@/constants'
import { loadAsyncComponent } from '@/utils'
const NotificationsForCurrentUser = loadAsyncComponent(
  () => import('../generic-components/NotificationsForCurrentUser.vue')
)
const ShowPaymentDetails = loadAsyncComponent(
  () => import('../generic-components/ShowPaymentDetails.vue')
)

const { t } = useI18n()

const props = defineProps({
  payments: Array,
  dbRef: { type: String, default: () => DB_NODES.SHARED_EXPENSES }
})

const {
  pdfContent,
  paymentKeys,
  isContentLoading,
  selectedMonth,
  selectedFriend,
  filteredPayments,
  activeUserUid,
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
  filterFields,
  clearFilters
} = ExpenseList(props)
</script>
