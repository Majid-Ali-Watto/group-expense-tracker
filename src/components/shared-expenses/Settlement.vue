<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="my-4">
    <div>
      <h3 class="mb-2">Pairwise Settlements (Who pays whom)</h3>

      <!-- Show message when no settlements -->
      <div
        v-if="settlements.length === 0"
        class="settled-message text-center py-8 rounded-lg border"
      >
        <p class="settled-title text-lg mb-2">✅ All Settled!</p>
        <p class="settled-text text-sm">
          No pending settlements. Everyone's balance is zero.
        </p>
      </div>

      <!-- Show settlements table when data exists -->
      <BalanceSummaryCard
        v-else
        :columns="settlementColumns"
        :rows="settlements"
      />
    </div>

    <!-- Settlement Request Section -->
    <div
      v-if="activeGroup && hasSettlementRequest && settlements.length > 0"
      class="pending-card mt-4 pt-3 p-3 rounded"
    >
      <div class="pending-title text-sm font-medium mb-2">
        📋 Settlement Request
      </div>
      <div class="text-xs mb-2">
        Requested by: {{ formatUser(group.settlementRequest.requestedBy) }} for
        {{ group.settlementRequest.month }}
      </div>
      <div class="text-xs mb-2">
        All members must approve before settlement can be finalized.
      </div>
      <div class="text-sm mb-2">
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
          ✓ {{ formatMember(approval) }}
        </el-tag>
        <el-tag
          v-for="member in getAllSettlementMembers.filter(
            (m) => !getSettlementApprovals.some((a) => a.mobile === m.mobile)
          )"
          :key="member.mobile"
          size="small"
          type="info"
        >
          ⏳ {{ formatMember(member) }}
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
          type="warning"
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
      <div v-else class="text-xs text-green-700 dark:text-green-300">
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
        <el-button type="primary" size="small" @click="addPaymentsBatch">
          Finalize Settlement Now
        </el-button>
        <el-button type="warning" plain size="small" @click="rejectSettlement">
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
        <el-button size="small" type="warning" plain @click="rejectSettlement">
          Cancel Settlement Request
        </el-button>
      </div>
    </div>

    <!-- Action Buttons when no settlement request -->
    <div
      v-if="!hasSettlementRequest && settlements.length > 0"
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
        type="success"
        size="small"
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
import { computed } from 'vue'
import { GenericButton } from '@/components/generic-components'
import { BalanceSummaryCard } from '@/components/shared'
import { Settlement } from '@/scripts/shared-expenses'
import { formatMemberDisplay, formatUserDisplay } from '@/utils'

const props = defineProps({
  payments: Array,
  keys: Array,
  selectedMonth: String
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

const formatUser = (mobile) =>
  formatUserDisplay(userStore, mobile, {
    group: group.value,
    preferMasked: !group.value
  })

const formatMember = (member) =>
  formatMemberDisplay(userStore, member, {
    group: group.value,
    preferMasked: !group.value
  })

const settlementColumns = computed(() => [
  {
    key: 'from',
    label: 'Pays',
    class: 'text-red-500 font-medium',
    format: (row) => formatUser(row.from)
  },
  {
    key: 'to',
    label: 'Receives',
    class: 'text-green-600 font-medium',
    format: (row) => formatUser(row.to)
  },
  {
    key: 'amount',
    label: 'Amount',
    class: 'font-bold',
    format: (row) => formatAmount(row.amount)
  }
])
</script>

<style scoped>
/* Light mode - All Settled message */
.settled-message {
  background-color: #f9fafb !important;
  border-color: #e5e7eb !important;
}

.settled-title {
  color: #4b5563 !important;
}

.settled-text {
  color: #6b7280 !important;
}

/* Dark mode - All Settled message */
:root.dark-theme .settled-message {
  background-color: #1f2937 !important;
  border-color: #4b5563 !important;
}

:root.dark-theme .settled-title {
  color: #d1d5db !important;
}

:root.dark-theme .settled-text {
  color: #9ca3af !important;
}
</style>
