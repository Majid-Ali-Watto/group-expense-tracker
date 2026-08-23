<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="my-4">
    <div>
      <h3 class="mb-2">{{ t('table.pairwiseSettlementsPdfTitle') }}</h3>

      <!-- Show message when no settlements -->
      <div
        v-if="settlements.length === 0"
        class="settled-message text-center py-8 rounded-lg border"
      >
        <p class="settled-title text-lg mb-2">
          {{ t('sharedExpenses.allSettled') }}
        </p>
        <p class="settled-text text-sm">
          {{ t('table.noSettlementsPdf') }}
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
        {{ t('sharedExpenses.settlementRequest') }}
      </div>
      <div class="text-xs mb-2">
        {{
          t('sharedExpenses.settlementRequestedBy', {
            user: formatUser(group.settlementRequest.requestedBy),
            month: group.settlementRequest.month
          })
        }}
      </div>
      <div class="text-xs mb-2">
        {{ t('sharedExpenses.settlementAllMustApprove') }}
      </div>
      <div class="text-sm mb-2">
        {{ t('sharedExpenses.approvals') }}
        {{ getSettlementApprovals.length }} /
        {{ getAllSettlementMembers.length }}
      </div>
      <!-- Show who has approved -->
      <div class="flex flex-wrap gap-1 mb-2">
        <el-tag
          v-for="approval in getSettlementApprovals"
          :key="getIdentity(approval)"
          size="small"
          type="success"
        >
          ✓ {{ formatMember(approval) }}
        </el-tag>
        <el-tag
          v-for="member in getAllSettlementMembers.filter(
            (m) =>
              !getSettlementApprovals.some(
                (a) => getIdentity(a) === getIdentity(m)
              )
          )"
          :key="member.uid"
          size="small"
          type="info"
        >
          ⏳ {{ formatMember(member) }}
        </el-tag>
      </div>

      <!-- Approve/Reject buttons for members who haven't approved -->
      <div v-if="!hasUserApprovedSettlement" class="flex gap-2">
        <el-button size="default" type="success" @click="approveSettlement">
          {{ t('sharedExpenses.approveSettlement') }}
        </el-button>
        <!-- Show Cancel for the requester -->
        <el-button
          v-if="group.settlementRequest.requestedBy === user"
          size="default"
          type="warning"
          plain
          @click="rejectSettlement"
        >
          {{ t('sharedExpenses.cancelSettlementRequest') }}
        </el-button>
        <!-- Show Reject only for admin who is NOT the requester -->
        <!-- v-else-if="isAdmin" -->
        <el-button size="default" type="danger" @click="rejectSettlement">
          {{ t('sharedExpenses.rejectSettlement') }}
        </el-button>
      </div>

      <!-- Show approved status -->
      <div v-else class="text-xs text-green-700 dark:text-green-300">
        {{ t('sharedExpenses.youApprovedSettlement') }}
        <span v-if="isAdmin && !allMembersApprovedSettlement">
          {{ t('sharedExpenses.waitingForMembers') }}
        </span>
      </div>

      <!-- Finalize button for admin when all approved -->
      <div
        v-if="isAdmin && allMembersApprovedSettlement"
        class="mt-2 flex gap-2"
      >
        <el-button type="primary" size="default" @click="addPaymentsBatch">
          {{ t('sharedExpenses.finalizeSettlement') }}
        </el-button>
        <el-button
          type="warning"
          plain
          size="default"
          @click="rejectSettlement"
        >
          {{ t('sharedExpenses.cancelSettlementRequest') }}
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
        <el-button
          size="default"
          type="warning"
          plain
          @click="rejectSettlement"
        >
          {{ t('sharedExpenses.cancelSettlementRequest') }}
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
        size="default"
      >
        {{ t('sharedExpenses.requestSettlement') }}
      </GenericButton>

      <!-- Settlement Done for non-group expenses -->
      <GenericButton
        v-if="!activeGroup"
        @click="addPaymentsBatch"
        type="success"
      >
        {{ t('sharedExpenses.settlementDone') }}
      </GenericButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GenericButton } from '@/components/generic-components'
import { BalanceSummaryCard } from '@/components/shared'
import { Settlement } from '@/scripts/shared-expenses'
import { formatMemberDisplay, formatUserDisplay, getIdentity } from '@/utils'

const { t } = useI18n()
const props = defineProps({
  payments: Array,
  keys: Array,
  selectedMonth: String
})

const {
  formatAmount,
  storeProxy,
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
  formatUserDisplay(storeProxy, mobile, {
    group: group.value,
    preferMasked: true
  })

const formatMember = (member) =>
  formatMemberDisplay(storeProxy, member, {
    group: group.value,
    preferMasked: true
  })

const settlementColumns = computed(() => [
  {
    key: 'from',
    label: t('sharedExpenses.pays'),
    class: 'text-red-500 font-medium',
    format: (row) => formatUser(row.from)
  },
  {
    key: 'to',
    label: t('sharedExpenses.receives'),
    class: 'text-green-600 font-medium',
    format: (row) => formatUser(row.to)
  },
  {
    key: 'amount',
    label: t('common.amount'),
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
