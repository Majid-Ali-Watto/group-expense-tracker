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
            <el-button
              size="default"
              text
              @click="dismissNotification(notif.id)"
            >
              ✕
            </el-button>
          </div>
        </div>

        <!-- Pending Approval Requests Section -->
        <div
          v-if="pendingRequests && pendingRequests.length > 0"
          class="mt-4 mb-6"
        >
          <h3 class="pending-title text-lg font-semibold mb-3 text-orange-600">
            {{ t('approval.pendingTitle') }}
          </h3>
          <el-collapse
            v-model="activePendingNames"
            class="pending-requests-accordion"
          >
            <el-collapse-item
              v-for="(request, index) in pendingRequests"
              :key="index"
              :name="index"
            >
              <template #title>
                <div class="flex justify-between items-center w-full pr-2">
                  <span>
                    <strong class="text-gray-800">
                      {{
                        request.type === 'delete'
                          ? t('approval.deleteRequest')
                          : t('approval.updateRequest')
                      }}
                    </strong>
                    — {{ t('approval.requestedBy') }}
                    {{ getUserName(request.requestedBy) }}
                  </span>
                  <el-tag
                    :type="request.type === 'delete' ? 'danger' : 'warning'"
                  >
                    {{ request.approvals.length }} / {{ getTotalMembers() }}
                    {{ t('approval.approved') }}
                  </el-tag>
                </div>
              </template>
              <div
                class="pending-card pending-request-card rounded-lg p-4 mb-3"
              >
                <p
                  v-if="request.requestedAt"
                  class="text-sm text-gray-600 mb-2"
                >
                  {{ t('approval.on') }} {{ request.requestedAt }}
                </p>

                <!-- Show loan details -->
                <div class="text-sm text-gray-700 mb-2">
                  <p v-if="request.type === 'update'">
                    <strong>{{ t('approval.proposedChanges') }}</strong
                    ><br />
                    <template v-if="request.changes.amount !== undefined">
                      {{ t('sharedExpenses.proposedAmountLabel') }}
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
                      {{ t('sharedExpenses.proposedDescriptionLabel') }}
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
                      {{ t('sharedExpenses.proposedCategoryLabel') }}
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
                    <strong>{{ t('sharedLoans.loanToBeDeleted') }}</strong
                    ><br />
                    {{ t('sharedExpenses.proposedAmountLabel') }}
                    {{ formatAmount(request.loan.amount) }}<br />
                    {{ t('sharedLoans.proposedGiver') }}
                    {{ getUserName(request.loan.giver) }}<br />
                    {{ t('sharedLoans.proposedReceiver') }}
                    {{ getUserName(request.loan.receiver) }}<br />
                    {{ t('sharedExpenses.proposedCategoryLabel') }}
                    {{ request.loan.category || t('common.none') }}
                  </p>
                </div>

                <!-- Approval buttons -->
                <div
                  v-if="isFullyApproved(request)"
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
                <div
                  class="flex gap-2 mt-3"
                  v-else-if="request.requestedBy === activeUserUid"
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
                <div
                  class="flex gap-2 mt-3"
                  v-else-if="!hasUserApproved(request)"
                >
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
                <div v-else class="text-green-600 text-sm font-semibold">
                  {{ t('approval.youApprovedRequest') }}
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
        <PaymentAccountDetailsDialog
          v-model:visible="loanPaymentDetailsVisible"
          :user-uid="loanPaymentDetailsUid"
          :display-name="loanPaymentDetailsName"
        />

        <el-dialog
          v-model="markLoanPaidDialogVisible"
          :title="t('sharedExpenses.markAsPaid')"
          width="min(92vw, 380px)"
          append-to-body
        >
          <p class="text-sm text-gray-600 mb-3">
            {{ t('sharedExpenses.markAsPaidHint') }}
          </p>
          <AmountInput
            v-model="markLoanPaidAmount"
            :label="t('sharedExpenses.amountToMarkPaidLabel')"
            :min="0.01"
            :max="markLoanPaidMaxAmount"
            required
            class="mb-3"
          />
          <input
            ref="markLoanPaidFileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="handleMarkLoanPaidFileSelected"
          />
          <el-button size="default" @click="markLoanPaidFileInputRef?.click()">
            {{
              markLoanPaidReceiptFile
                ? markLoanPaidReceiptFile.name
                : t('sharedExpenses.attachReceiptOptional')
            }}
          </el-button>
          <template #footer>
            <div class="flex justify-end gap-2">
              <el-button
                size="default"
                @click="markLoanPaidDialogVisible = false"
              >
                {{ t('common.cancel') }}
              </el-button>
              <el-button
                size="default"
                type="success"
                :loading="markLoanPaidSubmitting"
                @click="submitMarkLoanPaid"
              >
                {{ t('common.confirm') }}
              </el-button>
            </div>
          </template>
        </el-dialog>

        <!-- Filters -->
        <FilterBar :fields="filterFields" class="mt-4" @clear="clearFilters" />
        <div ref="loanContent">
          <!-- Who pays whom -->
          <el-collapse v-model="openPanels" class="mt-4">
            <el-collapse-item name="settlements">
              <template #title>
                <span class="font-semibold text-sm lg:text-base px-2">{{
                  t('personalLoans.whoPaysWhom')
                }}</span>
              </template>
              <div class="space-y-4 pb-2">
                <div
                  v-if="loanSettlements.length === 0"
                  class="text-center py-8 rounded-lg border bg-gray-50 dark:bg-gray-800/50"
                >
                  <p class="text-lg mb-2">
                    {{ t('sharedExpenses.allSettled') }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ t('table.noSettlementsPdf') }}
                  </p>
                </div>

                <BalanceSummaryCard
                  v-else
                  :columns="loanSettlementColumns"
                  :rows="loanSettlements"
                  :actions-label="t('common.actions')"
                >
                  <template #row-actions="{ row }">
                    <template v-if="row.from === activeUserUid">
                      <el-tag
                        v-if="getPendingPairLoans(row.from, row.to).length > 0"
                        size="small"
                        type="warning"
                      >
                        {{ t('sharedExpenses.pendingConfirmation') }}
                      </el-tag>
                      <ActionsMenuButton
                        v-else
                        :label="t('common.actions')"
                        @command="(cmd) => handleLoanPayerCommand(cmd, row)"
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

                  <!-- Full-width strip below the row — only rendered for
                       the lender while a repayment claim is pending (a "⋮"
                       menu / short tag is enough for every other case). -->
                  <template #row-confirmation="{ row }">
                    <div
                      v-if="
                        row.to === activeUserUid &&
                        getPendingPairLoans(row.from, row.to).length > 0
                      "
                      class="bsc-confirmation-row"
                    >
                      <span class="text-xs text-gray-500">
                        {{
                          t('sharedExpenses.claimedPaidAmount', {
                            user: getUserName(row.from),
                            amount: formatAmount(
                              getPendingPairLoans(row.from, row.to).reduce(
                                (sum, l) => sum + l.paidRequest.pending.amount,
                                0
                              )
                            )
                          })
                        }}
                      </span>
                      <a
                        v-if="getPendingPairLoans(row.from, row.to)[0]?.paidRequest?.pending?.receiptUrl"
                        :href="
                          getPendingPairLoans(row.from, row.to)[0].paidRequest
                            .pending.receiptUrl
                        "
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs underline"
                      >
                        {{ t('sharedExpenses.viewReceipt') }}
                      </a>
                      <el-button
                        size="small"
                        type="success"
                        @click="confirmLoanPaidForPair(row.from, row.to)"
                      >
                        {{ t('common.confirm') }}
                      </el-button>
                      <el-button
                        size="small"
                        type="danger"
                        plain
                        @click="rejectLoanPaidForPair(row.from, row.to)"
                      >
                        {{ t('common.reject') }}
                      </el-button>
                    </div>
                  </template>
                </BalanceSummaryCard>

                <div
                  v-if="myRepayableLoans.length > 0"
                  class="flex justify-end"
                >
                  <el-button
                    size="small"
                    type="success"
                    plain
                    @click="markAllMyLoansPaid"
                  >
                    {{
                      t('sharedExpenses.markAllPaid', {
                        count: myRepayableLoans.length
                      })
                    }}
                  </el-button>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>

          <h2 class="mt-4">{{ t('sharedLoans.loanRecords') }}</h2>
          <Table
            :downloadTitle="t('tabs.sharedLoans')"
            :rows="filteredLoans"
            :keys="loanKeys"
            :dataRef="loanContent"
            :reportMonth="selectedMonth"
            :currency="currency"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Table, BalanceSummaryCard, LoadingSkeleton } from '@/components/shared'
import {
  ActionsMenuButton,
  AmountInput,
  FilterBar,
  PaymentAccountDetailsDialog
} from '@/components/generic-components'
import { Loans } from '@/scripts/shared-loans'
import { loadAsyncComponent, showError, uploadReceipt } from '@/utils'
import { MAX_RECEIPT_FILE_SIZE_BYTES } from '@/constants'
const LoanForm = loadAsyncComponent(() => import('./LoanForm.vue'))

const { t } = useI18n()

const {
  formatAmount,
  currency,
  showLoanForm,
  selectedMonth,
  isContentLoading,
  activeUserUid,
  loanKeys,
  loanContent,
  filteredLoans,
  loanSettlements,
  loanSettlementColumns,
  userNotifications,
  pendingRequests,
  activePendingNames,
  myRepayableLoans,
  getLoanRemaining,
  requestLoanPaidAllocated,
  markAllMyLoansPaid,
  getMarkablePairLoans,
  getPendingPairLoans,
  confirmLoanPaidForPair,
  rejectLoanPaidForPair,
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

// Collapsed by default, same as Personal Loans' accordion.
const openPanels = ref([])

// ── "View payment details" for the loan I owe ─────────────────────────────
const loanPaymentDetailsVisible = ref(false)
const loanPaymentDetailsUid = ref('')
const loanPaymentDetailsName = ref('')

function openLoanPaymentDetails(uid) {
  loanPaymentDetailsUid.value = uid
  loanPaymentDetailsName.value = getUserName(uid)
  loanPaymentDetailsVisible.value = true
}

// ── "Mark as paid" (amount defaults to the full remaining balance across
// every loan behind this "who pays whom" row, editable down for a partial
// payment — allocated oldest-first across those loans at submit time) ────
const markLoanPaidDialogVisible = ref(false)
const markLoanPaidTarget = ref(null)
const markLoanPaidAmount = ref(0)
const markLoanPaidMaxAmount = ref(0)
const markLoanPaidReceiptFile = ref(null)
const markLoanPaidFileInputRef = ref(null)
const markLoanPaidSubmitting = ref(false)

function openMarkLoanPaidDialog(row) {
  markLoanPaidTarget.value = row
  markLoanPaidMaxAmount.value = getMarkablePairLoans(row.from, row.to).reduce(
    (sum, loan) => sum + getLoanRemaining(loan),
    0
  )
  markLoanPaidAmount.value = markLoanPaidMaxAmount.value
  markLoanPaidReceiptFile.value = null
  markLoanPaidDialogVisible.value = true
}

// ── Payer's "⋮" actions menu (View Account No. / Mark as Paid) ───────────
function handleLoanPayerCommand(command, row) {
  if (command === 'view') openLoanPaymentDetails(row.to)
  else if (command === 'markPaid') openMarkLoanPaidDialog(row)
}

function handleMarkLoanPaidFileSelected(event) {
  const file = event?.target?.files?.[0]
  if (markLoanPaidFileInputRef.value) markLoanPaidFileInputRef.value.value = ''
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showError(t('profile.qrCodeTypeInvalid'))
    return
  }
  if (file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
    showError(t('profile.qrCodeSizeTooLarge'))
    return
  }

  markLoanPaidReceiptFile.value = file
}

async function submitMarkLoanPaid() {
  if (!markLoanPaidTarget.value) return

  const amount = Number(markLoanPaidAmount.value)
  if (!(amount > 0)) {
    showError(t('common.amountRequired'))
    return
  }
  if (amount > markLoanPaidMaxAmount.value + 0.001) {
    showError(t('sharedExpenses.amountExceedsRemaining'))
    return
  }

  markLoanPaidSubmitting.value = true
  try {
    let receiptUrl = null
    let receiptMeta = null
    if (markLoanPaidReceiptFile.value) {
      const uploaded = await uploadReceipt(markLoanPaidReceiptFile.value)
      receiptUrl = uploaded.url
      receiptMeta = uploaded
    }

    await requestLoanPaidAllocated(
      markLoanPaidTarget.value.from,
      markLoanPaidTarget.value.to,
      amount,
      { receiptUrl, receiptMeta }
    )
    markLoanPaidDialogVisible.value = false
  } catch (error) {
    showError(error.message || error)
  } finally {
    markLoanPaidSubmitting.value = false
  }
}
</script>

<style scoped>
.pending-requests-accordion :deep(.el-collapse-item__header) {
  padding-inline: 12px;
}

.bsc-confirmation-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--border-color);
}
</style>
