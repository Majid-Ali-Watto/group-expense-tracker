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
                {{ request.approvals.length }} /
                {{ getTotalMembers() }} Approved
              </el-tag>
            </div>

            <!-- Show loan details -->
            <div class="text-sm text-gray-700 mb-2">
              <p v-if="request.type === 'update'">
                <strong>Proposed Changes:</strong><br />
                <template v-if="request.changes.amount !== undefined">
                  Amount:
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
                  Giver:
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
                  Receiver:
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
                  Description:
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
                  Category:
                  <span
                    v-if="
                      request.current?.category !== undefined &&
                      request.current.category !== request.changes.category
                    "
                  >
                    <span class="line-through text-gray-400">{{
                      request.current.category || 'None'
                    }}</span>
                    &nbsp;→&nbsp;
                  </span>
                  <span class="font-medium">{{
                    request.changes.category || 'None'
                  }}</span>
                </template>
              </p>
              <p v-else>
                <strong>Loan to be deleted:</strong><br />
                Amount: {{ formatAmount(request.loan.amount) }}<br />
                Giver: {{ getUserName(request.loan.giver) }}<br />
                Receiver: {{ getUserName(request.loan.receiver) }}<br />
                Category: {{ request.loan.category || 'None' }}
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
        <div class="hidden sm:block mb-3 mt-4">
          <el-row :gutter="5" class="filter-bar" justify="start">
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
                :options="[
                  { label: 'All Givers', value: 'All' },
                  ...usersOptions
                ]"
                size="small"
              />
            </el-col>
            <el-col :lg="6" :md="6" :sm="12" :xs="12">
              <GenericDropDown
                v-model="selectedCategory"
                label="Category"
                placeholder="All Categories"
                :options="categoryOptions"
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
                :options="[
                  { label: 'All Givers', value: 'All' },
                  ...usersOptions
                ]"
                size="small"
              />
            </el-col>
            <el-col :lg="6" :md="6" :sm="12" :xs="12">
              <GenericDropDown
                v-model="selectedCategory"
                label="Category"
                placeholder="All Categories"
                :options="categoryOptions"
                size="small"
              />
            </el-col>
          </el-row>
        </Transition>
        <div ref="loanContent">
          <!-- Display Final Balances -->
          <h3 class="mb-2">Loan Details</h3>
          <BalanceSummaryCard
            :columns="loanBalanceColumns"
            :rows="balances"
            class="mb-4"
          />

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
    </template>
  </div>
</template>

<script setup>
import { Filter, Close } from '@element-plus/icons-vue'
import { Table, BalanceSummaryCard, LoadingSkeleton } from '@/components/shared'
import { GenericDropDown } from '@/components/generic-components'
import { Loans } from '@/scripts/shared-loans'
import { loadAsyncComponent } from '@/utils'
const LoanForm = loadAsyncComponent(() => import('./LoanForm.vue'))

const {
  formatAmount,
  showLoanForm,
  selectedMonth,
  selectedGiver,
  selectedCategory,
  months,
  categoryOptions,
  isContentLoading,
  activeUser,
  usersOptions,
  loanKeys,
  loanContent,
  filteredLoans,
  balances,
  userNotifications,
  pendingRequests,
  loanBalanceColumns,
  showFilters,
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
