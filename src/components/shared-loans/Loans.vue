<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <LoadingSkeleton v-if="isContentLoading" mode="page" />
    <template v-else>
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
              <span v-if="notif.byMobile" class="text-gray-600 ml-2"
                >({{ getUserName(notif.byMobile) }})</span
              >
            </div>
            <el-button size="default" text @click="dismissNotification(notif.id)">
              ✕
            </el-button>
          </div>
        </div>

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
                {{ request.approvals.length }} /
                {{ getTotalMembers() }} {{ t('approval.approved') }}
              </el-tag>
            </div>

            <!-- Show loan details -->
            <div class="text-sm text-gray-700 mb-2">
              <p v-if="request.type === 'update'">
                <strong>{{ t('approval.proposedChanges') }}</strong><br />
                <template v-if="request.changes.amount !== undefined">
                  {{ t('sharedLoans.proposedAmount') }}
                  <span
                    v-if="
                      request.current?.amount !== undefined &&
                      String(request.current.amount) !==
                        String(request.changes.amount)
                    "
                  >
                    <span class="line-through text-gray-400">{{
                      formatAmount(request.current.amount)
                    }}</span>
                    &nbsp;→&nbsp;
                  </span>
                  <span class="font-medium">{{
                    formatAmount(request.changes.amount)
                  }}</span
                  ><br />
                </template>
                <template v-if="request.changes.giver !== undefined">
                  {{ t('sharedLoans.proposedGiver') }}
                  <span
                    v-if="
                      request.current?.giver &&
                      request.current.giver !== request.changes.giver
                    "
                  >
                    <span class="line-through text-gray-400">{{
                      getUserName(request.current.giver)
                    }}</span>
                    &nbsp;→&nbsp;
                  </span>
                  <span class="font-medium">{{
                    getUserName(request.changes.giver)
                  }}</span
                  ><br />
                </template>
                <template v-if="request.changes.receiver !== undefined">
                  {{ t('sharedLoans.proposedReceiver') }}
                  <span
                    v-if="
                      request.current?.receiver &&
                      request.current.receiver !== request.changes.receiver
                    "
                  >
                    <span class="line-through text-gray-400">{{
                      getUserName(request.current.receiver)
                    }}</span>
                    &nbsp;→&nbsp;
                  </span>
                  <span class="font-medium">{{
                    getUserName(request.changes.receiver)
                  }}</span
                  ><br />
                </template>
                <template v-if="request.changes.description !== undefined">
                  {{ t('sharedLoans.proposedDescription') }}
                  <span
                    v-if="
                      request.current?.description !== undefined &&
                      request.current.description !==
                        request.changes.description
                    "
                  >
                    <span class="line-through text-gray-400">{{
                      request.current.description
                    }}</span>
                    &nbsp;→&nbsp;
                  </span>
                  <span class="font-medium">{{
                    request.changes.description
                  }}</span>
                  <br />
                </template>
                <template v-if="request.changes.category !== undefined">
                  {{ t('sharedLoans.proposedCategory') }}
                  <span
                    v-if="
                      request.current?.category !== undefined &&
                      request.current.category !== request.changes.category
                    "
                  >
                    <span class="line-through text-gray-400">{{
                      request.current.category || t('common.none')
                    }}</span>
                    &nbsp;→&nbsp;
                  </span>
                  <span class="font-medium">{{
                    request.changes.category || t('common.none')
                  }}</span>
                </template>
              </p>
              <p v-else>
                <strong>{{ t('sharedLoans.loanToBeDeleted') }}</strong><br />
                {{ t('sharedLoans.proposedAmount') }} {{ formatAmount(request.loan.amount) }}<br />
                {{ t('sharedLoans.proposedGiver') }} {{ getUserName(request.loan.giver) }}<br />
                {{ t('sharedLoans.proposedReceiver') }} {{ getUserName(request.loan.receiver) }}<br />
                {{ t('sharedLoans.proposedCategory') }} {{ request.loan.category || t('common.none') }}
              </p>
            </div>

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
        <FilterBar :fields="filterFields" class="mt-4" @clear="clearFilters" />
        <div ref="loanContent">
          <!-- Display Final Balances -->
          <h3 class="mb-2">{{ t('sharedLoans.loanDetails') }}</h3>
          <BalanceSummaryCard
            :columns="loanBalanceColumns"
            :rows="balances"
            class="mb-4"
          />

          <h2>{{ t('sharedLoans.loanRecords') }}</h2>
          <Table
            :downloadTitle="t('sharedLoans.sharedLoansDownload')"
            :rows="filteredLoans"
            :keys="loanKeys"
            :dataRef="loanContent"
            :reportMonth="selectedMonth"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { Table, BalanceSummaryCard, LoadingSkeleton } from '@/components/shared'
import { FilterBar } from '@/components/generic-components'
import { Loans } from '@/scripts/shared-loans'
import { loadAsyncComponent } from '@/utils'
const LoanForm = loadAsyncComponent(() => import('./LoanForm.vue'))

const { t } = useI18n()

const {
  formatAmount,
  showLoanForm,
  selectedMonth,
  isContentLoading,
  activeUserUid,
  loanKeys,
  loanContent,
  filteredLoans,
  balances,
  userNotifications,
  pendingRequests,
  loanBalanceColumns,
  filterFields,
  closeLoanForm,
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
} = Loans()
</script>

<style scoped></style>
