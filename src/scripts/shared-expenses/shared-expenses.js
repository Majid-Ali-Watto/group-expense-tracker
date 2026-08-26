import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  useUsersOptions,
  useFireBase,
  useReceiptOcr,
  useReceiptUpload,
  useSharedActivityEmail,
  useUnsavedChangesGuard,
  useStoreProxy
} from '@/composables'
import {
  getWhoAddedTransaction,
  buildRequestMeta,
  dateToMonthNode,
  getCurrentDateInputValue,
  normalizeDateInputValue,
  formatDateForStorage,
  mergeCategoryOptions,
  showSuccess,
  showError,
  formatPlainNumber
} from '@/utils'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { DB_NODES, DEFAULT_CURRENCY } from '@/constants'

export const SharedExpenses = (props, emit) => {
  const { t } = useI18n()
  const route = useRoute()
  const { updateData, saveData, isSubmitting } = useFireBase()
  const isVisible = ref(true)
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { sendSharedActivityEmail } = useSharedActivityEmail()
  const storeProxy = useStoreProxy()
  const isEditMode = computed(() => !!props.row?.amount)

  const showTransactionForm = ref(route.query.new === '1')

  const openForm = () => {
    showTransactionForm.value = true
  }

  const { usersOptions } = useUsersOptions()
  const activeGroupCategory = computed(
    () => groupStore.getGroupById(groupStore.getActiveGroup)?.category || ''
  )
  const categoryOptions = computed(() =>
    mergeCategoryOptions([activeGroupCategory.value, formData.value?.category])
  )
  // The group's shared currency — every expense converts into this so
  // balances/settlement stay in one currency. The form still lets the
  // entrant pick a different currency per entry (see getPaymentData).
  const activeGroupCurrency = computed(
    () =>
      groupStore.getGroupById(groupStore.getActiveGroup)?.currency ||
      DEFAULT_CURRENCY
  )
  const { currencyOptionsIncluding, getExchangeRate, convertCurrency } =
    useCurrency()

  const activeUserUid = computed(() => authStore.getActiveUserUid)

  // ========== ME? Checkbox (single payer) ==========
  const isMePayer = ref(false)

  watch(isMePayer, (val) => {
    if (val) {
      formData.value.payer = activeUserUid.value
    } else {
      formData.value.payer = ''
    }
  })

  const createInitialFormData = () => ({
    amount: null,
    currency: activeGroupCurrency.value,
    description: '',
    location: '',
    payerMode: 'single',
    payer: '',
    payers: [],
    participants: [...usersOptions.value.map((u) => u.value)],
    date: getCurrentDateInputValue(),
    category: activeGroupCategory.value || '',
    splitMode: 'equal',
    splitItems: []
  })

  const formData = ref(createInitialFormData())
  // Narrowed to codes the current exchange-rate snapshot can actually
  // convert (plus whatever's already on the form, even if editing a past
  // entry whose currency later dropped out of the snapshot) — useCurrency.js.
  const currencyOptions = computed(() =>
    currencyOptionsIncluding(formData.value.currency)
  )
  // Live preview for the "Will be converted to {amount} {currency}..." note
  // — recalculates as the entrant edits the amount or currency. Null hides
  // the note (matching currency, no amount yet, or no rate available).
  const convertedAmountPreview = computed(() => {
    const enteredCurrency = formData.value.currency || activeGroupCurrency.value
    if (enteredCurrency === activeGroupCurrency.value) return null

    const enteredAmount = parseFloat(formData.value.amount)
    if (!enteredAmount || Number.isNaN(enteredAmount)) return null

    const converted = convertCurrency(
      enteredAmount,
      enteredCurrency,
      activeGroupCurrency.value
    )
    return converted === null ? null : formatPlainNumber(converted)
  })
  const initialFormSnapshot = ref(JSON.stringify(createInitialFormData()))
  const existingMonth = ref(dateToMonthNode(formData.value.date))
  const {
    receiptFiles,
    receiptUploading,
    allowsMultiple,
    existingReceiptUrls,
    existingReceiptMeta,
    removeReceipt,
    setSelectedFiles,
    trimSelectedFiles,
    uploadSelectedFiles
  } = useReceiptUpload({
    existingUrls: computed(() =>
      Array.isArray(props.row?.receiptUrls) ? props.row.receiptUrls : []
    ),
    existingMeta: computed(() =>
      Array.isArray(props.row?.receiptMeta) ? props.row.receiptMeta : []
    ),
    maxFiles: computed(() =>
      formData.value.payerMode === 'single' ? 1 : Infinity
    )
  })

  const { receiptExtracting, extractAndStructure } = useReceiptOcr({
    receiptFiles,
    existingReceiptUrls,
    type: 'shared-expense'
  })

  watch(usersOptions, (newOptions) => {
    if (!isEditMode.value) {
      formData.value.participants = newOptions.map((u) => u.value)
    }
  })

  watch(
    () => props.row,
    (newRow) => {
      // Edit mode shows/edits what was actually typed — the original
      // amount+currency when the entry was made in a different currency
      // than the group's, not the already-converted base amount.
      formData.value.amount = newRow?.originalAmount ?? newRow?.amount ?? null
      formData.value.currency =
        newRow?.originalCurrency ||
        newRow?.currency ||
        activeGroupCurrency.value
      formData.value.description = newRow?.description ?? ''
      formData.value.location = newRow?.location ?? ''
      formData.value.payerMode = newRow?.payerMode ?? 'single'
      formData.value.payer = newRow?.payer ?? ''
      // Same "show what was actually typed" rule as amount/currency above —
      // each payer's stored amount is group-currency-converted, so show the
      // originally-entered figure back when it differs.
      formData.value.payers = (newRow?.payers ?? []).map((p) => ({
        uid: p.uid,
        amount: p.originalAmount ?? p.amount ?? null
      }))
      formData.value.date = normalizeDateInputValue(newRow?.date)
      formData.value.category =
        newRow?.category ?? activeGroupCategory.value ?? ''
      formData.value.participants = newRow?.participants ?? [
        ...usersOptions.value.map((u) => u.value)
      ]
      formData.value.splitMode = newRow?.splitMode ?? 'equal'
      formData.value.splitItems = newRow?.splitItems ?? []
      initialFormSnapshot.value = JSON.stringify(formData.value)
      existingMonth.value = dateToMonthNode(newRow?.date || formData.value.date)
      isVisible.value = !newRow?.amount
      removeReceipt()
      // Auto-tick ME? checkbox in edit mode (single payer only)
      if (newRow?.amount && newRow?.payerMode !== 'multiple') {
        isMePayer.value = formData.value.payer === activeUserUid.value
      } else {
        isMePayer.value = false
      }
    },
    { immediate: true }
  )

  watch(
    () => formData.value.payerMode,
    (mode) => {
      trimSelectedFiles()
      if (mode !== 'single') {
        isMePayer.value = false
      }
    }
  )

  watch(activeGroupCategory, (category) => {
    if (!isEditMode.value && !formData.value.category) {
      formData.value.category = category || ''
    }
  })

  const transactionForm = ref(null)
  const receiptTax = ref(null)

  const resetForm = async ({ close = false } = {}) => {
    formData.value = createInitialFormData()
    initialFormSnapshot.value = JSON.stringify(formData.value)
    isMePayer.value = false
    receiptTax.value = null
    removeReceipt()
    await nextTick()
    transactionForm.value?.clearValidate()
    if (close) {
      showTransactionForm.value = false
    }
  }

  const isFormDirty = computed(
    () =>
      (showTransactionForm.value || isEditMode.value) &&
      (JSON.stringify(formData.value) !== initialFormSnapshot.value ||
        receiptFiles.value.length > 0)
  )

  const { confirmDiscardChanges } = useUnsavedChangesGuard(isFormDirty)

  async function requestClose() {
    const canClose = await confirmDiscardChanges()
    if (!canClose) return false

    if (isEditMode.value) {
      emit('closeModal')
    } else {
      await resetForm({ close: true })
    }
    return true
  }

  const closeForm = async () => {
    await requestClose()
  }

  // ========== Custom Split Helpers ==========
  const splitItemsTotal = computed(
    () =>
      formData.value.splitItems.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0
      ) + (parseFloat(receiptTax.value) || 0)
  )

  function addSplitItem() {
    formData.value.splitItems.push({
      description: '',
      amount: null,
      participants: [...formData.value.participants]
    })
  }

  function removeSplitItem(index) {
    formData.value.splitItems.splice(index, 1)
  }

  // ========== Multiple Payers Helpers ==========
  const payersTotal = computed(() =>
    formData.value.payers.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    )
  )

  function addPayer() {
    formData.value.payers.push({ uid: '', amount: null })
  }

  function removePayer(index) {
    formData.value.payers.splice(index, 1)
  }

  const validateForm = (whatTask = 'Save') => {
    // --- Extra guards not covered by el-form rules ---
    if (formData.value.payerMode === 'multiple') {
      const validPayers = formData.value.payers.filter((p) => p.uid)
      if (validPayers.length === 0) {
        ElMessage.error(t('sharedExpenses.addPayerError'))
        return
      }
      const payerSum = validPayers.reduce(
        (s, p) => s + parseFloat(p.amount || 0),
        0
      )
      const total = parseFloat(formData.value.amount || 0)
      if (total > 0 && Math.abs(payerSum - total) > 0.01) {
        ElMessage.error(
          t('sharedExpenses.payersTotalMismatch', {
            payersTotal: payerSum.toFixed(2),
            amount: total.toFixed(2)
          })
        )
        return
      }
    }

    if (formData.value.splitMode === 'custom') {
      if (formData.value.splitItems.length === 0) {
        ElMessage.error(t('sharedExpenses.splitItemError'))
        return
      }

      // Same tolerance check as the multi-payer total above — without this,
      // a mismatch between what's itemized and the actual transaction
      // amount silently corrupts the group's balances (whatever isn't
      // itemized is credited to the payer but never assigned to anyone as
      // owed, so it can never be collected in settlement).
      const splitTotal = splitItemsTotal.value
      const total = parseFloat(formData.value.amount || 0)
      if (total > 0 && Math.abs(splitTotal - total) > 0.01) {
        ElMessage.error(
          t('sharedExpenses.splitItemsTotalMismatch', {
            splitTotal: splitTotal.toFixed(2),
            amount: total.toFixed(2)
          })
        )
        return
      }
    }

    transactionForm.value.validate(async (valid) => {
      if (valid) {
        const monthYear = isEditMode.value
          ? existingMonth.value
          : dateToMonthNode(formData.value.date)
        const groupId = groupStore.getActiveGroup || 'global'

        const uploadedReceipts = await uploadSelectedFiles()
        if (!uploadedReceipts) return

        const receiptUrls = uploadedReceipts.receiptUrls
        const receiptMeta = uploadedReceipts.receiptMeta
        const paymentData = getPaymentData(receiptUrls, receiptMeta)
        if (!paymentData) return

        if (whatTask === 'Save' || whatTask === 'Duplicate') {
          saveData(
            `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${monthYear}/payments`,
            () => paymentData,
            transactionForm,
            whatTask === 'Duplicate'
              ? t('sharedExpenses.transactionDuplicated')
              : t('sharedExpenses.transactionSaved'),
            (createdDoc) => {
              sendSharedActivityEmail({
                type: 'shared-expense',
                action: whatTask === 'Duplicate' ? 'duplicated' : 'created',
                entryId: createdDoc?.id || '',
                month: monthYear,
                data: paymentData
              })
              if (isEditMode.value) {
                emit('closeModal')
              } else {
                resetForm({ close: true })
              }
            }
          )
        } else if (whatTask == 'Update') {
          createUpdateRequest(
            `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${monthYear}/payments/${props.row.id}`,
            receiptUrls,
            receiptMeta
          )
        } else if (whatTask == 'Delete') {
          createDeleteRequest(
            `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${monthYear}/payments/${props.row.id}`
          )
        }
      }
    })
  }

  const SHARED_EXPENSE_JSON_SHAPE = JSON.stringify({
    amount: 0,
    description: '',
    category: '',
    date: 'YYYY-MM-DD',
    location: '',
    tax: 0,
    splitItems: [{ description: '', amount: 0 }]
  })

  async function extractTextFromReceipt() {
    const { data } = await extractAndStructure(SHARED_EXPENSE_JSON_SHAPE)
    if (!data) return

    if (data.amount != null) formData.value.amount = data.amount
    if (data.description) formData.value.description = data.description
    if (data.category) formData.value.category = data.category
    if (data.date) formData.value.date = data.date
    if (data.location) formData.value.location = data.location

    if (data.splitItems?.length) {
      formData.value.splitMode = 'custom'
      // Let Vue render the empty custom-split container before populating items,
      // otherwise el-select / el-input-number mount before their parent is in the
      // DOM and throw offsetHeight / nextSibling null errors.
      await nextTick()
      formData.value.splitItems = data.splitItems.map((item) => ({
        description: item.description || '',
        amount: item.amount ?? null,
        participants: [...formData.value.participants]
      }))
    }

    receiptTax.value = data.tax != null && data.tax > 0 ? data.tax : null

    await nextTick()
    showSuccess(t('common.receiptExtracted'))
  }

  const createDeleteRequest = (paymentPath) => {
    const deleteRequest = buildRequestMeta(storeProxy)

    updateData(
      paymentPath,
      () => ({ deleteRequest }),
      t('approval.deleteRequestSent')
    )
    emit('closeModal')
  }

  const createUpdateRequest = (
    paymentPath,
    receiptUrls = [],
    receiptMeta = []
  ) => {
    const changes = getPaymentData(receiptUrls, receiptMeta)
    if (!changes) {
      showError(t('sharedExpenses.exchangeRateUnavailable'))
      return
    }

    const updateRequest = {
      changes,
      ...buildRequestMeta(storeProxy)
    }

    updateData(
      paymentPath,
      () => ({ updateRequest }),
      t('approval.updateRequestSent')
    )
    emit('closeModal')
  }

  // Converts the entered amount into the group's base currency if the
  // entrant picked a different one, freezing the rate used at this moment
  // (not recomputed later) — see originalAmount/originalCurrency/exchangeRate
  // below. Returns null if the rate table doesn't have a needed currency,
  // so the caller can block submission rather than silently store a wrong
  // number.
  function convertToGroupCurrency(enteredAmount) {
    const groupCurrency = activeGroupCurrency.value
    const enteredCurrency = formData.value.currency || groupCurrency

    if (enteredCurrency === groupCurrency) {
      return { amount: enteredAmount, extra: {} }
    }

    const rate = getExchangeRate(enteredCurrency, groupCurrency)
    if (rate === null) return null

    return {
      amount: Math.round(enteredAmount * rate * 100) / 100,
      extra: {
        originalAmount: enteredAmount,
        originalCurrency: enteredCurrency,
        exchangeRate: rate
      }
    }
  }

  function getPaymentData(receiptUrls = [], receiptMeta = []) {
    const enteredAmount = parseFloat(formData.value.amount)
    const converted = convertToGroupCurrency(enteredAmount)
    if (!converted) {
      showError(t('sharedExpenses.exchangeRateUnavailable'))
      return null
    }
    const amount = converted.amount
    const location = formData.value.location?.trim() ?? ''
    const participantsList =
      formData.value.participants && formData.value.participants.length
        ? formData.value.participants
        : userStore.getUsers && userStore.getUsers.length
          ? userStore.getUsers.map((u) => u.uid)
          : []

    // ---- compute split ----
    let split = []
    if (
      formData.value.splitMode === 'custom' &&
      formData.value.splitItems.length
    ) {
      // Item-based: sum each person's equal share within their item, across all items
      const perPerson = {}
      for (const item of formData.value.splitItems) {
        const itemPeople = item.participants || []
        const itemAmount = parseFloat(item.amount) || 0
        if (!itemPeople.length || !itemAmount) continue
        const equalShare =
          Math.floor((itemAmount / itemPeople.length) * 100) / 100
        let acc = 0
        itemPeople.forEach((uid, i) => {
          let share
          if (i === itemPeople.length - 1) {
            share = parseFloat((itemAmount - acc).toFixed(2))
          } else {
            share = equalShare
            acc += share
          }
          perPerson[uid] = parseFloat(
            ((perPerson[uid] || 0) + share).toFixed(2)
          )
        })
      }
      split = Object.keys(perPerson).map((uid) => ({
        uid,
        amount: perPerson[uid]
      }))
    } else {
      // Equal split among all participants (existing logic — unchanged)
      if (participantsList.length) {
        const equal = Math.floor((amount / participantsList.length) * 100) / 100
        let acc = 0
        for (let i = 0; i < participantsList.length; i++) {
          const uid = participantsList[i]
          let share = equal
          if (i === participantsList.length - 1) {
            share = parseFloat((amount - acc).toFixed(2))
          } else {
            acc += share
          }
          split.push({
            uid,
            amount: share
          })
        }
      }
    }

    // ---- payer(s) ----
    const isMultiPayer = formData.value.payerMode === 'multiple'
    // Payer amounts are entered in the same currency as the overall expense
    // (formData.value.currency) — convert with the same frozen rate used for
    // `amount` above, so payers[].amount stays comparable to amount/split
    // for summaries, settlements, and the personal-expenses cross-post.
    const payerRate = converted.extra.exchangeRate ?? 1
    const payersField = isMultiPayer
      ? formData.value.payers
          .filter((p) => p.uid)
          .map((p) => {
            const entered = parseFloat(p.amount || 0)
            return {
              uid: p.uid,
              amount: Math.round(entered * payerRate * 100) / 100,
              ...(payerRate !== 1
                ? {
                    originalAmount: entered,
                    originalCurrency: formData.value.currency
                  }
                : {})
            }
          })
      : null

    const payment = {
      amount,
      currency: activeGroupCurrency.value,
      ...converted.extra,
      description: formData.value.description,
      category: formData.value.category,
      ...(location ? { location } : isEditMode.value ? { location: null } : {}),
      payerMode: formData.value.payerMode,
      payer: isMultiPayer ? null : formData.value.payer,
      ...(payersField ? { payers: payersField } : {}),
      // Flat uid list mirroring payer/payers — lets Firestore rules verify
      // "uid is a payer on this item" without partial-matching map arrays.
      payerUids: isMultiPayer
        ? payersField.map((p) => p.uid)
        : formData.value.payer
          ? [formData.value.payer]
          : [],
      group: groupStore.getActiveGroup || null,
      date: formatDateForStorage(formData.value.date),
      whenAdded: new Date().toLocaleString('en-PK'),
      whoAdded: getWhoAddedTransaction(),
      participants: participantsList,
      splitMode: formData.value.splitMode,
      ...(formData.value.splitMode === 'custom'
        ? { splitItems: formData.value.splitItems }
        : {}),
      split,
      ...(receiptUrls && receiptUrls.length ? { receiptUrls, receiptMeta } : {})
    }

    return payment
  }

  return {
    isVisible,
    isEditMode,
    showTransactionForm,
    isMePayer,
    openForm,
    closeForm,
    requestClose,
    resetForm,
    usersOptions,
    categoryOptions,
    activeGroupCurrency,
    currencyOptions,
    convertedAmountPreview,
    formData,
    transactionForm,
    validateForm,
    splitItemsTotal,
    addSplitItem,
    removeSplitItem,
    payersTotal,
    addPayer,
    removePayer,
    receiptFiles,
    receiptExtracting,
    receiptTax,
    receiptUploading,
    allowsMultiple,
    existingReceiptUrls,
    existingReceiptMeta,
    extractTextFromReceipt,
    setSelectedFiles,
    removeReceipt,
    isSubmitting
  }
}
