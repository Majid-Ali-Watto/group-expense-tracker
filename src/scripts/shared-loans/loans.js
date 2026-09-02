import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { deleteField, onSnapshot } from '@/firebase'
import {
  useAuthStore,
  useGroupStore,
  useUserStore,
  useDataStore
} from '@/stores'
import { useApprovalRequests } from '@/composables/useApprovalRequests'
import useFireBase from '@/composables/useFirebase'
import { useUsersOptions } from '@/composables'
import { useLoadingTimeout } from '@/composables/useLoadingTimeout'
import { loadMonthsList } from '@/composables/useMonthsLoader'
import { useRouteQuerySync } from '@/composables/useRouteQuerySync'
import { buildCategoryFilterOptions } from '@/utils/category-options'
import { DB_NODES } from '@/constants'
import {
  applyCollectionState,
  buildEmptyCollectionState,
  buildSnapshotCollectionState
} from '@/utils/firestoreCollectionState'
import getCurrentMonth from '@/utils/getCurrentMonth'
import { getCache, setCache } from '@/utils/queryCache'
import { appendNotificationForUser } from '@/utils/recordNotifications'
import { showError, showSuccess } from '@/utils/showAlerts'
import { formatUserDisplay } from '@/utils/user-display'
import { createUserDisplayStoreProxy } from '@/composables'
import { cleanupOldReceipts, deleteReceipt } from '@/utils/uploadReceipt'

export const Loans = () => {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = createUserDisplayStoreProxy(authStore, userStore)
  const dataStore = useDataStore()
  const route = useRoute()
  const router = useRouter()
  const { dbRef, read, readShallow, updateData, deleteData } = useFireBase()
  const rawFormatAmount = inject('formatAmount')

  const showLoanForm = ref(route.query.new === '1')
  const closeLoanForm = () => {
    showLoanForm.value = !showLoanForm.value
  }

  const selectedMonth = ref(route.query.month || getCurrentMonth())
  const selectedGiver = ref(route.query.giver || 'All')
  const selectedCategory = ref(route.query.category || '')

  useRouteQuerySync({
    route,
    router,
    sources: [selectedMonth, selectedGiver, selectedCategory],
    buildQuery: () => {
      const query = {}
      if (selectedMonth.value) query.month = selectedMonth.value
      if (selectedGiver.value && selectedGiver.value !== 'All')
        query.giver = selectedGiver.value
      if (selectedCategory.value) query.category = selectedCategory.value
      return query
    }
  })
  const months = ref([])
  const monthsLoaded = ref(false)
  const loansLoaded = ref(false)

  const activeGroup = computed(() => groupStore.getActiveGroup)
  const activeUserUid = computed(() => authStore.getActiveUserUid)
  const groupObj = computed(() =>
    activeGroup.value ? groupStore.getGroupById(activeGroup.value) : null
  )
  const currency = computed(() => groupObj.value?.currency)
  const formatAmount = (amount) => rawFormatAmount(amount, currency.value)

  const { usersOptions } = useUsersOptions()

  const loans = ref([])
  const loanKeys = ref([])
  const rawLoansData = ref({})
  const loanContent = ref(null)

  let loansListener = null
  let currentLoansRef = null
  const isContentLoading = computed(
    () => !monthsLoaded.value || !loansLoaded.value
  )
  const { startLoadingTimeout, clearLoadingTimeout } = useLoadingTimeout([
    monthsLoaded,
    loansLoaded
  ])

  // Fetch available months
  const fetchMonths = async () => {
    const groupId = groupStore.getActiveGroup || 'global'
    return loadMonthsList({
      isEnabled: () => !!authStore.getActiveUserUid,
      parentPath: `${DB_NODES.SHARED_LOANS}/${groupId}`,
      monthsPath: `${DB_NODES.SHARED_LOANS}/${groupId}/months`,
      read,
      readShallow,
      monthsRef: months,
      loadedRef: monthsLoaded,
      errorHandler: () => {
        showError(t('common.failedLoadMonths'))
      },
      onResolved: (resolvedMonths) => {
        if (resolvedMonths.length) selectedMonth.value = getCurrentMonth()
      }
    })
  }
  // Fetch loans for the selected month

  const fetchLoans = () => {
    const groupId = groupStore.getActiveGroup || 'global'
    const loansPath = `${DB_NODES.SHARED_LOANS}/${groupId}/months/${selectedMonth.value}/loans`
    const cached = getCache(loansPath)
    if (cached) {
      applyCollectionState(cached, {
        listRef: loans,
        keysRef: loanKeys,
        rawRef: rawLoansData,
        loadedRef: loansLoaded
      })
    } else {
      loansLoaded.value = false
    }
    const loansRef = dbRef(loansPath)
    if (loansListener && currentLoansRef) currentLoansRef()
    currentLoansRef = null

    const unsubscribe = onSnapshot(
      loansRef,
      (snapshot) => {
        const state = snapshot.empty
          ? buildEmptyCollectionState(true)
          : buildSnapshotCollectionState(snapshot, {
              includeRaw: true,
              includeItem: (item) => !!item.amount
            })

        setCache(loansPath, state)
        applyCollectionState(state, {
          listRef: loans,
          keysRef: loanKeys,
          rawRef: rawLoansData,
          loadedRef: loansLoaded
        })
      },
      () => {
        loansLoaded.value = true
        // Ignore permission errors that fire after logout — Firebase revokes the
        // auth token before this listener is detached (on component unmount).
        if (activeGroup.value && authStore.getActiveUserUid)
          showError(t('sharedLoans.failedLoadLoans'))
      }
    )
    loansListener = unsubscribe
    currentLoansRef = unsubscribe
  }

  // Watch active group and refetch when it changes
  watch(activeGroup, () => {
    selectedMonth.value = getCurrentMonth()
    selectedGiver.value = 'All'
    selectedCategory.value = ''
    fetchMonths()
    fetchLoans()
  })

  // Watch for changes in selectedMonth
  watch(selectedMonth, () => {
    selectedGiver.value = 'All'
    selectedCategory.value = ''
    fetchLoans()
  })

  onMounted(() => {
    fetchMonths()
    fetchLoans()
    startLoadingTimeout()
  })

  onUnmounted(() => {
    clearLoadingTimeout()
    if (loansListener) loansListener()
  })

  setTimeout(() => {
    dataStore.setLoansRef(loanContent.value)
  }, 1000)

  const filteredLoans = computed(() => {
    if (!loans.value) return []

    return loans.value.filter((loan) => {
      // Only filter by giver (month filtering is done in fetchLoans)
      if (selectedGiver.value !== 'All' && loan.giver !== selectedGiver.value) {
        return false
      }

      if (selectedCategory.value && loan.category !== selectedCategory.value) {
        return false
      }

      return true
    })
  })
  const categoryOptions = computed(() =>
    buildCategoryFilterOptions(
      loans.value
        .map((loan) => loan.category)
        .concat(groupObj.value?.category || '')
    )
  )

  // How much of this specific loan is still unpaid — always computed fresh
  // against loan.paidRequest.totalPaid (the cumulative CONFIRMED repayment),
  // never a stored snapshot, so a new confirmation is reflected immediately
  // and nothing needs separate invalidation.
  function getLoanRemaining(loan) {
    const remaining = (loan?.amount || 0) - (loan?.paidRequest?.totalPaid || 0)
    return remaining > 0.001 ? parseFloat(remaining.toFixed(2)) : 0
  }

  // "Who pays whom" — pairwise net settlement between each unique
  // giver/receiver pair, same convention as personal-loans.js's
  // pairwiseSettlements. Replaces the old per-person net-balance table.
  const loanSettlements = computed(() => {
    const pairMap = {}

    filteredLoans.value.forEach((loan) => {
      if (!loan.giver || !loan.receiver || !loan.amount) return

      // A loan has no month-end archival flow the way shared-expense
      // settlements do — so once part (or all) of it is confirmed repaid,
      // only what's still outstanding should count toward the net balance.
      // Otherwise an already-repaid loan silently cancels out a later,
      // unrelated loan between the same two people and misreports them as
      // settled (e.g. A lends B, B repays in full and it's confirmed, then
      // B separately lends A the same amount — the two should NOT net to
      // zero). A partial repayment is credited the same way: only the
      // remaining balance counts.
      const remaining = getLoanRemaining(loan)
      if (remaining <= 0) return

      // Canonical key: sort mobiles lexicographically so each pair has one stable key
      const [first, second] = [loan.giver, loan.receiver].sort()
      const key = `${first}__${second}`

      if (!pairMap[key]) {
        pairMap[key] = {
          first,
          second,
          firstGaveToSecond: 0,
          secondGaveToFirst: 0
        }
      }

      if (loan.giver === first) {
        pairMap[key].firstGaveToSecond += remaining
      } else {
        pairMap[key].secondGaveToFirst += remaining
      }
    })

    const result = []
    Object.values(pairMap).forEach(
      ({ first, second, firstGaveToSecond, secondGaveToFirst }) => {
        const net = firstGaveToSecond - secondGaveToFirst
        // Loans flow giver → receiver; repayment flows the other way (the
        // net debtor pays the net lender back) — same from/to convention as
        // requestLoanPaid below.
        if (net > 0) {
          result.push({ from: second, to: first, amount: net })
        } else if (net < 0) {
          result.push({ from: first, to: second, amount: Math.abs(net) })
        }
      }
    )

    return result
  })

  const memberCount = computed(() => groupObj.value?.members?.length || 0)

  const getTotalMembers = () => {
    return memberCount.value
  }

  const getUserName = (mobile) => {
    return formatUserDisplay(storeProxy, mobile, { group: groupObj.value })
  }

  const {
    userNotifications,
    dismissNotification,
    pendingRequests,
    activePendingNames,
    hasUserApproved,
    isFullyApproved,
    executeRequestManually,
    cancelRequest,
    approveRequest,
    rejectRequest
  } = useApprovalRequests({
    rawItems: rawLoansData,
    activeUserUid,
    activeGroup,
    selectedMonth,
    userStore,
    getTotalMembers,
    updateData,
    deleteData,
    itemIdKey: 'loanId',
    summaryKey: 'loan',
    itemLabel: 'loan',
    listLabel: 'Loan',
    getSummary: (loan) => ({
      amount: loan.amount,
      giver: loan.giver,
      receiver: loan.receiver,
      description: loan.description
    }),
    buildItemPath: ({ groupId, monthYear, itemId }) =>
      `${DB_NODES.SHARED_LOANS}/${groupId}/months/${monthYear}/loans/${itemId}`,
    cleanupDeletedReceipts: (loan, _request, itemPath) => {
      const deletedMeta = loan?.receiptMeta
      if (!deletedMeta) return

      const metas = Array.isArray(deletedMeta) ? deletedMeta : [deletedMeta]
      metas.forEach((meta) => deleteReceipt(meta, { documentPath: itemPath }))
    },
    buildUpdatedItem: (loan, request, notification, itemPath) => {
      cleanupOldReceipts(loan?.receiptMeta, request.changes?.receiptMeta, {
        documentPath: itemPath
      })

      const updatedLoan = appendNotificationForUser(
        {
          ...loan,
          ...request.changes
        },
        request.requestedBy,
        notification
      )

      delete updatedLoan.deleteRequest
      delete updatedLoan.updateRequest
      // A stray paidRequest shouldn't survive an unrelated approved edit (the
      // giver/receiver/amount it was claiming against may no longer match).
      // updateDoc() merges rather than replaces, so clearing it needs the
      // deleteField() sentinel explicitly — omitting the key from this
      // returned object would leave whatever's already in Firestore alone.
      updatedLoan.paidRequest = deleteField()

      return updatedLoan
    }
  })

  // ── "Mark as paid" repayment tracking ─────────────────────────────────
  // Deliberately NOT routed through useApprovalRequests above — that engine
  // requires ALL group members to approve (isFullyApproved/getTotalMembers).
  // A loan repayment only needs the lender's (loan.giver's) confirmation, so
  // paidRequest is read/written directly here instead. Repayment flows
  // receiver → giver (the borrower pays the lender back), the mirror image
  // of the loan itself (giver → receiver).
  function loanItemPath(itemId) {
    const groupId = activeGroup.value || 'global'
    return `${DB_NODES.SHARED_LOANS}/${groupId}/months/${selectedMonth.value}/loans/${itemId}`
  }

  function canMarkLoanPaid(loan) {
    return !loan?.paidRequest?.pending && getLoanRemaining(loan) > 0
  }

  const myRepayableLoans = computed(() =>
    filteredLoans.value.filter(
      (loan) =>
        loan.receiver === activeUserUid.value && canMarkLoanPaid(loan)
    )
  )

  // ── Pair-scoped helpers for the "who pays whom" table's row actions ──────
  // A pairwise settlement row can be backed by more than one individual loan
  // item between the same two people (e.g. two separate loans in one
  // month) — these look up exactly the loan docs behind one from/to row so
  // its mark-as-paid/confirm/reject actions apply to all of them at once.
  function getLoansForPair(from, to) {
    return filteredLoans.value.filter(
      (loan) => loan.receiver === from && loan.giver === to
    )
  }

  function getMarkablePairLoans(from, to) {
    return getLoansForPair(from, to).filter(canMarkLoanPaid)
  }

  function getPendingPairLoans(from, to) {
    return getLoansForPair(from, to).filter((loan) => loan.paidRequest?.pending)
  }

  // A loan can be re-marked paid (for the remainder) as soon as its rejection
  // is set — the note only shows while nothing new has been submitted since.
  function getPairLastRejectionReason(from, to) {
    const rejected = getLoansForPair(from, to).find(
      (loan) => !loan.paidRequest?.pending && loan.paidRequest?.lastRejection
    )
    return rejected?.paidRequest?.lastRejection?.reason || ''
  }

  // Only the payer needs to see why their claim was rejected — other group
  // members just see the ordinary pending row, same as before it was ever
  // marked paid.
  function showLoanRejectionReason(from, to) {
    ElMessageBox.alert(
      getPairLastRejectionReason(from, to) || t('sharedExpenses.noRejectionReason'),
      t('sharedExpenses.rejectionReasonTitle'),
      { confirmButtonText: t('common.close') }
    )
  }

  // `amount` is the installment being claimed — defaults to the loan's full
  // remaining balance in the UI, but editable down for a partial repayment.
  async function requestLoanPaid(loan, { amount, receiptUrl, receiptMeta } = {}) {
    if (!loan?.id || loan.receiver !== activeUserUid.value || !(amount > 0))
      return

    try {
      const paidRequest = {
        from: loan.receiver,
        to: loan.giver,
        totalPaid: loan.paidRequest?.totalPaid || 0,
        // A fresh claim supersedes any previous rejection note.
        lastRejection: null,
        pending: {
          amount,
          requestedBy: loan.receiver,
          requestedAt: new Date().toISOString(),
          receiptUrl: receiptUrl || null,
          receiptMeta: receiptMeta || null
        }
      }

      await updateData(
        loanItemPath(loan.id),
        () => ({ paidRequest }),
        t('sharedLoans.markedPaidSuccess')
      )
    } catch (error) {
      showError(error.message || error)
    }
  }

  // Claims the FULL remaining balance for every eligible loan (no partial
  // amounts in the bulk flow — use the per-row dialog for that).
  async function markAllMyLoansPaid() {
    const eligible = myRepayableLoans.value
    if (!eligible.length) return

    for (const loan of eligible) {
      await requestLoanPaid(loan, { amount: getLoanRemaining(loan) })
    }
    showSuccess(t('sharedLoans.markedAllPaidSuccess', { count: eligible.length }))
  }

  async function confirmLoanPaid(loan) {
    if (!loan?.paidRequest?.pending || loan.giver !== activeUserUid.value) return

    try {
      const updated = {
        ...loan.paidRequest,
        totalPaid: parseFloat(
          (
            (loan.paidRequest.totalPaid || 0) + loan.paidRequest.pending.amount
          ).toFixed(2)
        ),
        pending: null
      }

      await updateData(
        loanItemPath(loan.id),
        () => ({ paidRequest: updated }),
        t('sharedLoans.paymentConfirmedSuccess')
      )
    } catch (error) {
      showError(error.message || error)
    }
  }

  async function rejectLoanPaidRecord(loan, reason) {
    if (!loan?.paidRequest?.pending || loan.giver !== activeUserUid.value) return

    try {
      const updated = {
        ...loan.paidRequest,
        pending: null,
        lastRejection: {
          amount: loan.paidRequest.pending.amount,
          reason,
          rejectedAt: new Date().toISOString()
        }
      }

      await updateData(
        loanItemPath(loan.id),
        () => ({ paidRequest: updated }),
        t('sharedLoans.paymentRejectedNotice')
      )
    } catch (error) {
      showError(error.message || error)
    }
  }

  // Bulk variants acting on every loan behind one pairwise "who pays whom"
  // row at once (usually just one loan, occasionally more) — the reject
  // prompt only pops once even when several loans are involved.
  async function confirmLoanPaidForPair(from, to) {
    for (const loan of getPendingPairLoans(from, to)) {
      await confirmLoanPaid(loan)
    }
  }

  // The rejecter must explain why — the reason is only ever surfaced to the
  // payer (see loanSettlementColumns' subtext in Loans.vue), never shown to
  // the rest of the group, and kept out of the row itself so an arbitrarily
  // long explanation can't break the table layout (it opens in its own
  // dialog on click instead).
  async function rejectLoanPaidForPair(from, to) {
    const loans = getPendingPairLoans(from, to)
    if (!loans.length) return

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

    for (const loan of loans) {
      await rejectLoanPaidRecord(loan, reason)
    }
  }

  // Submits one partial (or full) amount against a pairwise row that may be
  // backed by more than one loan — allocated oldest-first: fills the first
  // eligible loan's remaining balance, spills into the next, and so on.
  async function requestLoanPaidAllocated(from, to, amount, { receiptUrl, receiptMeta } = {}) {
    let left = amount
    for (const loan of getMarkablePairLoans(from, to)) {
      if (left <= 0.001) break
      const claim = Math.min(getLoanRemaining(loan), left)
      if (claim <= 0) continue
      await requestLoanPaid(loan, {
        amount: parseFloat(claim.toFixed(2)),
        receiptUrl,
        receiptMeta
      })
      left = parseFloat((left - claim).toFixed(2))
    }
  }

  const loanSettlementColumns = computed(() => [
    {
      key: 'from',
      label: t('sharedExpenses.pays'),
      class: 'text-red-500 font-medium',
      format: (row) => getUserName(row.from),
      subtext: (row) =>
        row.from === activeUserUid.value &&
        getPendingPairLoans(row.from, row.to).length === 0 &&
        getPairLastRejectionReason(row.from, row.to)
          ? t('sharedExpenses.paymentRejected')
          : '',
      onSubtextClick: (row) => showLoanRejectionReason(row.from, row.to)
    },
    {
      key: 'to',
      label: t('sharedExpenses.receives'),
      class: 'text-green-600 font-medium',
      format: (row) => getUserName(row.to)
    },
    {
      key: 'amount',
      label: t('common.amount'),
      class: 'font-bold',
      format: (row) => formatAmount(row.amount),
      subtext: (row) => {
        const loans = getLoansForPair(row.from, row.to)
        const totalOriginal = loans.reduce((sum, l) => sum + (l.amount || 0), 0)
        const totalPaid = loans.reduce(
          (sum, l) => sum + (l.paidRequest?.totalPaid || 0),
          0
        )
        return totalPaid > 0
          ? t('sharedExpenses.partiallyPaidNote', {
              paid: formatAmount(totalPaid),
              total: formatAmount(totalOriginal)
            })
          : ''
      },
      subtextClass: 'bsc-subtext-neutral'
    }
  ])

  const clearFilters = () => {
    selectedMonth.value = getCurrentMonth()
    selectedGiver.value = 'All'
    selectedCategory.value = ''
  }

  const filterFields = computed(() => [
    {
      key: 'month',
      label: t('common.month'),
      placeholder: t('common.selectMonth'),
      modelValue: selectedMonth.value,
      options: months.value,
      onChange: (v) => {
        selectedMonth.value = v
      }
    },
    {
      key: 'giver',
      label: t('sharedLoans.giver'),
      placeholder: t('sharedLoans.selectGiver'),
      modelValue: selectedGiver.value,
      options: [
        { label: t('sharedLoans.allGivers'), value: 'All' },
        ...usersOptions.value
      ],
      onChange: (v) => {
        selectedGiver.value = v
      }
    },
    {
      key: 'category',
      label: t('common.category'),
      placeholder: t('common.allCategories'),
      modelValue: selectedCategory.value,
      options: categoryOptions.value,
      onChange: (v) => {
        selectedCategory.value = v
      }
    }
  ])

  return {
    formatAmount,
    currency,
    showLoanForm,
    closeLoanForm,
    selectedMonth,
    selectedGiver,
    selectedCategory,
    months,
    categoryOptions,
    isContentLoading,
    activeUserUid,
    usersOptions,
    loans,
    loanKeys,
    loanContent,
    filteredLoans,
    loanSettlements,
    loanSettlementColumns,
    memberCount,
    userNotifications,
    dismissNotification,
    pendingRequests,
    activePendingNames,
    getTotalMembers,
    getUserName,
    hasUserApproved,
    isFullyApproved,
    executeRequestManually,
    cancelRequest,
    approveRequest,
    rejectRequest,
    myRepayableLoans,
    canMarkLoanPaid,
    getLoanRemaining,
    requestLoanPaidAllocated,
    markAllMyLoansPaid,
    getLoansForPair,
    getMarkablePairLoans,
    getPendingPairLoans,
    confirmLoanPaidForPair,
    rejectLoanPaidForPair,
    filterFields,
    clearFilters
  }
}
