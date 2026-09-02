<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="my-4">
    <div>
      <el-collapse v-model="openPanels">
        <el-collapse-item name="settlements">
          <template #title>
            <span class="font-semibold text-sm lg:text-base px-2">{{
              t('table.pairwiseSettlementsPdfTitle')
            }}</span>
          </template>
          <div class="pb-2">
            <!-- Show message when no settlements -->
            <div
              v-if="visibleSettlements.length === 0"
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
              :rows="visibleSettlements"
              :actions-label="t('common.actions')"
            >
              <!-- Mark-as-paid tracking only exists per group per month
                   (settlement-payments/{groupId}/...) — there's no groupId
                   to scope it under for the "non-group personal expenses"
                   mode (activeGroup null, see the Settlement Done button
                   below), so the whole actions column is omitted there. -->
              <template v-if="activeGroup" #row-actions="{ row }">
                <template v-if="row.from === user">
                  <el-tag
                    v-if="getRecord(row.from, row.to)?.pending"
                    size="small"
                    type="warning"
                  >
                    {{ t('sharedExpenses.pendingConfirmation') }}
                  </el-tag>
                  <ActionsMenuButton
                    v-else
                    :label="t('common.actions')"
                    @command="(cmd) => handlePayerCommand(cmd, row)"
                  >
                    <el-dropdown-item command="view">
                      {{ t('paymentAccount.viewDetails') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="markPaid">
                      {{ t('sharedExpenses.markAsPaid') }}
                    </el-dropdown-item>
                  </ActionsMenuButton>
                </template>
              </template>

              <!-- Full-width strip below the row — only rendered for the
                   creditor while a claim is pending (a "⋮" menu / short tag
                   is enough for every other case, kept compact above). -->
              <template v-if="activeGroup" #row-confirmation="{ row }">
                <div
                  v-if="row.to === user && getRecord(row.from, row.to)?.pending"
                  class="bsc-confirmation-row"
                >
                  <span class="text-xs text-gray-500">
                    {{
                      t('sharedExpenses.claimedPaidAmount', {
                        user: formatUser(row.from),
                        amount: formatAmount(
                          getRecord(row.from, row.to).pending.amount
                        )
                      })
                    }}
                  </span>
                  <a
                    v-if="getRecord(row.from, row.to)?.pending?.receiptUrl"
                    :href="getRecord(row.from, row.to).pending.receiptUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs underline"
                  >
                    {{ t('sharedExpenses.viewReceipt') }}
                  </a>
                  <el-button
                    size="small"
                    type="success"
                    @click="confirmPaid(getRecord(row.from, row.to))"
                  >
                    {{ t('common.confirm') }}
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="rejectPaid(getRecord(row.from, row.to))"
                  >
                    {{ t('common.reject') }}
                  </el-button>
                </div>
              </template>
            </BalanceSummaryCard>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <PaymentAccountDetailsDialog
      v-model:visible="paymentDetailsVisible"
      :user-uid="paymentDetailsUid"
      :display-name="paymentDetailsName"
    />

    <el-dialog
      v-model="markPaidDialogVisible"
      :title="t('sharedExpenses.markAsPaid')"
      width="min(92vw, 380px)"
      append-to-body
    >
      <p class="text-sm text-gray-600 mb-3">
        {{ t('sharedExpenses.markAsPaidHint') }}
      </p>
      <AmountInput
        v-model="markPaidAmount"
        :label="t('sharedExpenses.amountToMarkPaidLabel')"
        :min="0.01"
        :max="markPaidMaxAmount"
        required
        class="mb-3"
      />
      <input
        ref="markPaidFileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="handleMarkPaidFileSelected"
      />
      <el-button size="default" @click="markPaidFileInputRef?.click()">
        {{
          markPaidReceiptFile
            ? markPaidReceiptFile.name
            : t('sharedExpenses.attachReceiptOptional')
        }}
      </el-button>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button size="default" @click="markPaidDialogVisible = false">
            {{ t('common.cancel') }}
          </el-button>
          <el-button
            size="default"
            type="success"
            :loading="markPaidSubmitting"
            @click="submitMarkPaid"
          >
            {{ t('common.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

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

    <!-- Action Buttons: bulk mark-as-paid + settlement request/done, all in one row -->
    <div
      v-if="
        (activeGroup && mySettlementRowsToMark.length > 0) ||
        (!hasSettlementRequest && settlements.length > 0)
      "
      class="mt-4 flex flex-wrap justify-end gap-2"
    >
      <el-button
        v-if="activeGroup && mySettlementRowsToMark.length > 0"
        size="default"
        type="success"
        plain
        @click="markAllMyRowsPaid"
      >
        {{
          t('sharedExpenses.markAllPaid', {
            count: mySettlementRowsToMark.length
          })
        }}
      </el-button>

      <!-- Any member can request settlement -->
      <GenericButton
        v-if="activeGroup && !hasSettlementRequest && settlements.length > 0"
        @click="requestSettlement"
        type="success"
        size="default"
      >
        {{ t('sharedExpenses.requestSettlement') }}
      </GenericButton>

      <!-- Settlement Done for non-group expenses -->
      <GenericButton
        v-if="!activeGroup && !hasSettlementRequest && settlements.length > 0"
        @click="addPaymentsBatch"
        type="success"
      >
        {{ t('sharedExpenses.settlementDone') }}
      </GenericButton>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import {
  ActionsMenuButton,
  AmountInput,
  GenericButton,
  PaymentAccountDetailsDialog
} from '@/components/generic-components'
import { BalanceSummaryCard } from '@/components/shared'
import { Settlement, useSettlementPayments } from '@/scripts/shared-expenses'
import {
  formatMemberDisplay,
  formatUserDisplay,
  getIdentity,
  showError,
  uploadReceipt
} from '@/utils'
import { MAX_RECEIPT_FILE_SIZE_BYTES } from '@/constants'

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

const {
  getRecord,
  getRemaining,
  canMarkPaid,
  markPaid,
  markAllMinePaid,
  confirmPaid,
  rejectPaid
} = useSettlementPayments(props)

// Collapsed by default, same as Personal Loans' / shared-loans' accordion.
const openPanels = ref([])

// A row fully paid off (remaining <= 0) is genuinely settled — hide it from
// "who pays whom" entirely instead of leaving a stale-looking tag next to a
// zeroed-out amount. `settlements` itself stays untouched (still 100%
// derived from live expense data — see settlement.js); this is purely a
// display-time filter. `getRemaining` is always computed against the row's
// live amount, so a new expense that changes the total is reflected
// automatically — no separate staleness check needed.
const visibleSettlements = computed(() =>
  settlements.value.filter(
    (row) => getRemaining(row.from, row.to, row.amount) > 0
  )
)

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

// Only the payer needs to see why their claim was rejected — other group
// members just see the ordinary pending row, same as before it was ever
// marked paid. A fresh claim clears lastRejection (see markPaid), so this
// naturally stops showing once the payer resubmits.
function showRejectionReason(row) {
  const reason = getRecord(row.from, row.to)?.lastRejection?.reason
  ElMessageBox.alert(
    reason || t('sharedExpenses.noRejectionReason'),
    t('sharedExpenses.rejectionReasonTitle'),
    { confirmButtonText: t('common.close') }
  )
}

const settlementColumns = computed(() => [
  {
    key: 'from',
    label: t('sharedExpenses.pays'),
    class: 'text-red-500 font-medium',
    format: (row) => formatUser(row.from),
    subtext: (row) =>
      row.from === user.value &&
      !getRecord(row.from, row.to)?.pending &&
      getRecord(row.from, row.to)?.lastRejection
        ? t('sharedExpenses.paymentRejected')
        : '',
    onSubtextClick: showRejectionReason
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
    // Shows what's still outstanding (not the gross derived total) — a
    // partial payment already confirmed is credited here automatically.
    format: (row) => formatAmount(getRemaining(row.from, row.to, row.amount)),
    subtext: (row) => {
      const totalPaid = getRecord(row.from, row.to)?.totalPaid || 0
      return totalPaid > 0
        ? t('sharedExpenses.partiallyPaidNote', {
            paid: formatAmount(totalPaid),
            total: formatAmount(row.amount)
          })
        : ''
    },
    subtextClass: 'bsc-subtext-neutral'
  }
])

// ── "View payment details" ────────────────────────────────────────────────
const paymentDetailsVisible = ref(false)
const paymentDetailsUid = ref('')
const paymentDetailsName = computed(() =>
  paymentDetailsUid.value ? formatUser(paymentDetailsUid.value) : ''
)

function openPaymentDetails(uid) {
  paymentDetailsUid.value = uid
  paymentDetailsVisible.value = true
}

// ── "Mark as paid" (single row, amount defaults to the full remaining
// balance but is editable down for a partial payment) ─────────────────────
const markPaidDialogVisible = ref(false)
const markPaidTarget = ref(null)
const markPaidAmount = ref(0)
const markPaidMaxAmount = ref(0)
const markPaidReceiptFile = ref(null)
const markPaidFileInputRef = ref(null)
const markPaidSubmitting = ref(false)

function openMarkPaidDialog(row) {
  markPaidTarget.value = row
  markPaidMaxAmount.value = getRemaining(row.from, row.to, row.amount)
  markPaidAmount.value = markPaidMaxAmount.value
  markPaidReceiptFile.value = null
  markPaidDialogVisible.value = true
}

// ── Payer's "⋮" actions menu (View Account No. / Mark as Paid) ───────────
function handlePayerCommand(command, row) {
  if (command === 'view') openPaymentDetails(row.to)
  else if (command === 'markPaid') openMarkPaidDialog(row)
}

function handleMarkPaidFileSelected(event) {
  const file = event?.target?.files?.[0]
  if (markPaidFileInputRef.value) markPaidFileInputRef.value.value = ''
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showError(t('profile.qrCodeTypeInvalid'))
    return
  }
  if (file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
    showError(t('profile.qrCodeSizeTooLarge'))
    return
  }

  markPaidReceiptFile.value = file
}

async function submitMarkPaid() {
  if (!markPaidTarget.value) return

  const amount = Number(markPaidAmount.value)
  if (!(amount > 0)) {
    showError(t('common.amountRequired'))
    return
  }
  if (amount > markPaidMaxAmount.value + 0.001) {
    showError(t('sharedExpenses.amountExceedsRemaining'))
    return
  }

  markPaidSubmitting.value = true
  try {
    let receiptUrl = null
    let receiptMeta = null
    if (markPaidReceiptFile.value) {
      const uploaded = await uploadReceipt(markPaidReceiptFile.value)
      receiptUrl = uploaded.url
      receiptMeta = uploaded
    }

    await markPaid({
      from: markPaidTarget.value.from,
      to: markPaidTarget.value.to,
      amount,
      receiptUrl,
      receiptMeta
    })
    markPaidDialogVisible.value = false
  } catch (error) {
    showError(error.message || error)
  } finally {
    markPaidSubmitting.value = false
  }
}

// ── "Mark all my payments as paid" (bulk) ─────────────────────────────────
const mySettlementRowsToMark = computed(() =>
  settlements.value.filter(
    (row) =>
      row.from === user.value && canMarkPaid(row.from, row.to, row.amount)
  )
)

function markAllMyRowsPaid() {
  markAllMinePaid(mySettlementRowsToMark.value)
}
</script>

<style scoped>
.bsc-confirmation-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-color);
}

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
