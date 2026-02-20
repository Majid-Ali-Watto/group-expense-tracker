<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="my-4">
    <div>
      <h3 class="mb-2">Pairwise Settlements (Who pays whom)</h3>

      <!-- Show message when no settlements -->
      <div
        v-if="settlements.length === 0"
        class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200"
      >
        <p class="text-gray-600 text-lg mb-2">✅ All Settled!</p>
        <p class="text-gray-500 text-sm">
          No pending settlements. Everyone's balance is zero.
        </p>
      </div>

      <!-- Show settlements table when data exists -->
      <el-table v-else :data="settlements" style="width: 100%">
        <el-table-column label="Debtor">
          <template #default="{ row }">
            {{ userStore.getUserByMobile(row.from)?.name || row.from }}
          </template>
        </el-table-column>
        <el-table-column label="Lender">
          <template #default="{ row }">
            {{ userStore.getUserByMobile(row.to)?.name || row.to }}
          </template>
        </el-table-column>
        <el-table-column label="Amount">
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Settlement Request Section -->
    <div
      v-if="
        activeGroup &&
        hasSettlementRequest &&
        !isHistory &&
        settlements.length > 0
      "
      class="mt-4 pt-3 border-t border-blue-200 bg-blue-50 p-3 rounded"
    >
      <div class="text-sm font-medium text-blue-800 mb-2">
        📋 Settlement Request
      </div>
      <div class="text-xs text-blue-700 mb-2">
        Requested by: {{ group.settlementRequest.requestedByName }} for
        {{ group.settlementRequest.month }}
      </div>
      <div class="text-xs text-blue-700 mb-2">
        All members must approve before settlement can be finalized.
      </div>
      <div class="text-sm text-blue-700 mb-2">
        Approvals: {{ getSettlementApprovals.length }} /
        {{ getAllSettlementMembers.length }}
      </div>
      <!-- Show who has approved -->
      <div class="flex flex-wrap gap-1 mb-2">
        <el-tag
          v-for="approval in getSettlementApprovals"
          :key="approval.mobile"
          size="small"
          type="success"
        >
          ✓ {{ approval.name }}
        </el-tag>
        <el-tag
          v-for="member in getAllSettlementMembers.filter(
            (m) => !getSettlementApprovals.some((a) => a.mobile === m.mobile)
          )"
          :key="member.mobile"
          size="small"
          type="info"
        >
          ⏳ {{ member.name }}
        </el-tag>
      </div>

      <!-- Approve/Reject buttons for members who haven't approved -->
      <div v-if="!hasUserApprovedSettlement" class="flex gap-2">
        <el-button size="small" type="success" @click="approveSettlement">
          Approve Settlement
        </el-button>
        <!-- Show Cancel for the requester -->
        <el-button
          v-if="group.settlementRequest.requestedBy === user"
          size="small"
          type="danger"
          plain
          @click="rejectSettlement"
        >
          Cancel Settlement Request
        </el-button>
        <!-- Show Reject only for admin who is NOT the requester -->
        <!-- v-else-if="isAdmin" -->
        <el-button size="small" type="danger" @click="rejectSettlement">
          Reject Settlement
        </el-button>
      </div>

      <!-- Show approved status -->
      <div v-else class="text-xs text-green-700">
        ✓ You have approved this settlement request
        <span v-if="isAdmin && !allMembersApprovedSettlement">
          - Waiting for all members to approve
        </span>
      </div>

      <!-- Finalize button for admin when all approved -->
      <div
        v-if="isAdmin && allMembersApprovedSettlement"
        class="mt-2 flex gap-2"
      >
        <el-button type="primary" @click="addPaymentsBatch">
          Finalize Settlement Now
        </el-button>
        <el-button type="danger" plain @click="rejectSettlement">
          Cancel Settlement Request
        </el-button>
      </div>

      <!-- Cancel button for requester after they've approved (but not all members yet) -->
      <div
        v-if="
          group.settlementRequest.requestedBy === user &&
          hasUserApprovedSettlement &&
          !allMembersApprovedSettlement
        "
        class="mt-2"
      >
        <el-button size="small" type="danger" plain @click="rejectSettlement">
          Cancel Settlement Request
        </el-button>
      </div>
    </div>

    <!-- Action Buttons when no settlement request -->
    <div
      v-if="!isHistory && !hasSettlementRequest && settlements.length > 0"
      style="
        display: flex !important;
        justify-content: end !important;
        gap: 10px;
      "
      class="mt-4"
    >
      <!-- Any member can request settlement -->
      <GenericButton
        v-if="activeGroup"
        @click="requestSettlement"
        type="warning"
      >
        Request Settlement
      </GenericButton>

      <!-- Settlement Done for non-group expenses -->
      <GenericButton
        v-if="!activeGroup"
        @click="addPaymentsBatch"
        type="success"
      >
        Settlement Done
      </GenericButton>
    </div>
  </div>
</template>

<script setup>
import { GenericButton } from './generic-components'
import { Settlement } from '../scripts/settlement'

const props = defineProps({
  payments: Array,
  keys: Array,
  selectedMonth: String,
  isHistory: { type: Boolean, default: false }
})

const {
  formatAmount,
  userStore,
  user,
  addPaymentsBatch,
  settlements,
  isAdmin,
  activeGroup,
  group,
  hasSettlementRequest,
  hasUserApprovedSettlement,
  getSettlementApprovals,
  getAllSettlementMembers,
  allMembersApprovedSettlement,
  requestSettlement,
  approveSettlement,
  rejectSettlement
} = Settlement(props)
</script>
