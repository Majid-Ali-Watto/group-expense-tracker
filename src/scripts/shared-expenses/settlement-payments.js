// "Mark as paid" tracking for the derived pairwise settlement rows computed
// in settlement.js. Settlements themselves stay 100% derived/recomputed on
// every render (see settlement.js's `settlements` computed) — this composable
// only persists a lightweight side-channel paid-so-far ledger per (from,to)
// pair for the active month, so it never affects the computed balances/
// amounts. The month's books still only actually close via the existing
// settlementRequest/addPaymentsBatch flow in settlement.js.
//
// Record shape (one doc per (from,to) pair per group per month):
//   { from, to,
//     totalPaid,       // cumulative CONFIRMED amount, starts 0
//     pending: null | { amount, requestedBy, requestedAt, receiptUrl, receiptMeta },
//     lastRejection: null | { amount, reason, rejectedAt } }
//
// Support for PARTIAL payments: a debtor can claim less than the full
// remaining balance, get it confirmed, and claim the rest later. `remaining`
// is always computed fresh against the row's live derived amount — never
// stored — so a later expense that changes the total is reflected
// automatically instead of needing to invalidate a stale snapshot.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { useAuthStore, useGroupStore } from '@/stores'
import { useFireBase } from '@/composables'
import { showError, showSuccess } from '@/utils'
import { DB_NODES } from '@/constants'

export const useSettlementPayments = (props) => {
  const { t } = useI18n()
  const { read, updateData, setData } = useFireBase()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()

  const activeUserUid = computed(() => authStore.getActiveUserUid)
  const activeGroup = computed(() => groupStore.getActiveGroup)

  const records = ref({})
  const loadingRecords = ref(false)

  function recordKey(from, to) {
    return `${from}_${to}`
  }

  function recordsCollectionPath(groupId, monthYear) {
    return `${DB_NODES.SETTLEMENT_PAYMENTS}/${groupId}/months/${monthYear}/records`
  }

  function recordPath(groupId, monthYear, key) {
    return `${recordsCollectionPath(groupId, monthYear)}/${key}`
  }

  async function loadRecords() {
    const groupId = activeGroup.value
    const monthYear = props.selectedMonth
    if (!groupId || !monthYear) {
      records.value = {}
      return
    }

    loadingRecords.value = true
    try {
      const result = await read(recordsCollectionPath(groupId, monthYear), false)
      records.value = result || {}
    } catch (error) {
      // Fails soft — e.g. firestore.rules for settlement-payments not yet
      // deployed, or a transient network error. The mark-as-paid UI just
      // shows no tracked status rather than blowing up the whole settlement
      // view; log so it's still visible during development.
      console.error('Failed to load settlement payment records:', error)
      records.value = {}
    } finally {
      loadingRecords.value = false
    }
  }

  watch(
    () => [activeGroup.value, props.selectedMonth],
    () => loadRecords(),
    { immediate: true }
  )

  function getRecord(from, to) {
    return records.value[recordKey(from, to)] || null
  }

  // Always computed against the row's live derived amount — never a stored
  // snapshot — so new expenses added after a partial payment just change
  // how much is left, instead of invalidating what was already confirmed.
  function getRemaining(from, to, currentAmount) {
    const totalPaid = getRecord(from, to)?.totalPaid || 0
    const remaining = Number(currentAmount || 0) - totalPaid
    return remaining > 0.001 ? parseFloat(remaining.toFixed(2)) : 0
  }

  // A row can be (re-)marked paid when nothing is currently pending and
  // there's still a balance left to claim.
  function canMarkPaid(from, to, currentAmount) {
    const record = getRecord(from, to)
    return !record?.pending && getRemaining(from, to, currentAmount) > 0
  }

  async function markPaid({ from, to, amount, receiptUrl, receiptMeta }) {
    if (activeUserUid.value !== from || !(amount > 0)) return
    const groupId = activeGroup.value
    const monthYear = props.selectedMonth
    if (!groupId || !monthYear) return

    try {
      const key = recordKey(from, to)
      const existing = getRecord(from, to)
      const record = {
        from,
        to,
        totalPaid: existing?.totalPaid || 0,
        // A fresh claim supersedes any previous rejection note — it's now
        // stale (see the "Rejected - View Reason" subtext in Settlement.vue).
        lastRejection: null,
        pending: {
          amount,
          requestedBy: from,
          requestedAt: new Date().toISOString(),
          receiptUrl: receiptUrl || null,
          receiptMeta: receiptMeta || null
        }
      }

      await setData(
        recordPath(groupId, monthYear, key),
        record,
        t('sharedExpenses.markedPaidSuccess')
      )
      records.value = { ...records.value, [key]: record }
    } catch (error) {
      showError(error.message || error)
    }
  }

  // Bulk variant of markPaid — claims the FULL remaining balance for every
  // outgoing row the active user can still mark paid (no partial amounts in
  // the bulk flow; use the per-row dialog for that), each still needing its
  // own receiver confirmation (this never skips that step).
  async function markAllMinePaid(rows = []) {
    const eligible = rows.filter(
      (row) =>
        row.from === activeUserUid.value && canMarkPaid(row.from, row.to, row.amount)
    )
    if (!eligible.length) return

    for (const row of eligible) {
      await markPaid({
        from: row.from,
        to: row.to,
        amount: getRemaining(row.from, row.to, row.amount)
      })
    }
    showSuccess(
      t('sharedExpenses.markedAllPaidSuccess', { count: eligible.length })
    )
  }

  async function confirmPaid(record) {
    if (!record?.pending || activeUserUid.value !== record.to) return
    const groupId = activeGroup.value
    const monthYear = props.selectedMonth
    if (!groupId || !monthYear) return

    try {
      const key = recordKey(record.from, record.to)
      const updated = {
        ...record,
        totalPaid: parseFloat(
          ((record.totalPaid || 0) + record.pending.amount).toFixed(2)
        ),
        pending: null
      }

      await updateData(
        recordPath(groupId, monthYear, key),
        () => updated,
        t('sharedExpenses.paymentConfirmedSuccess')
      )
      records.value = { ...records.value, [key]: updated }
    } catch (error) {
      showError(error.message || error)
    }
  }

  // The rejecter must explain why — the reason is only ever surfaced to the
  // payer (see settlementColumns' subtext in Settlement.vue), never shown to
  // the rest of the group, and kept out of the row itself so an arbitrarily
  // long explanation can't break the table layout (it opens in its own
  // dialog on click instead).
  async function rejectPaid(record) {
    if (!record?.pending || activeUserUid.value !== record.to) return

    let reason
    try {
      const result = await ElMessageBox.prompt(
        t('sharedExpenses.rejectPaidConfirm'),
        t('sharedExpenses.rejectPaidTitle'),
        {
          confirmButtonText: t('common.reject'),
          cancelButtonText: t('common.cancel'),
          inputType: 'textarea',
          inputPlaceholder: t('sharedExpenses.rejectionReasonPlaceholder'),
          inputValidator: (value) => !!value?.trim(),
          inputErrorMessage: t('sharedExpenses.rejectionReasonRequired'),
          type: 'warning'
        }
      )
      reason = result.value.trim()
    } catch {
      return
    }

    const groupId = activeGroup.value
    const monthYear = props.selectedMonth
    if (!groupId || !monthYear) return

    try {
      const key = recordKey(record.from, record.to)
      const updated = {
        ...record,
        pending: null,
        lastRejection: {
          amount: record.pending.amount,
          reason,
          rejectedAt: new Date().toISOString()
        }
      }

      await updateData(
        recordPath(groupId, monthYear, key),
        () => updated,
        t('sharedExpenses.paymentRejectedNotice')
      )
      records.value = { ...records.value, [key]: updated }
    } catch (error) {
      showError(error.message || error)
    }
  }

  return {
    records,
    loadingRecords,
    getRecord,
    getRemaining,
    canMarkPaid,
    markPaid,
    markAllMinePaid,
    confirmPaid,
    rejectPaid
  }
}
