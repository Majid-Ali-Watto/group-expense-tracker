import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useDataStore, useUserStore } from '@/stores'
import {
  getWhoAddedTransaction,
  dateToMonthNode,
  getCurrentDateInputValue,
  normalizeDateInputValue,
  formatDateForStorage,
  mergeCategoryOptions,
  formatUserDisplay,
  showSuccess,
  showError,
  formatPlainNumber
} from '@/utils'
import {
  useFireBase,
  useReceiptOcr,
  useReceiptUpload,
  useUnsavedChangesGuard,
  useStoreProxy
} from '@/composables'
import { DB_NODES, DEFAULT_CURRENCY } from '@/constants'
import { useCurrency } from '@/composables/useCurrency'

export const PersonalExpenseForm = (props, emit) => {
  const { saveData, updateData, deleteData, isSubmitting } = useFireBase()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { t } = useI18n()
  const isVisible = ref(true)
  const isEditMode = computed(() => !!props.row?.amount)
  const { currencyOptionsIncluding, getExchangeRate, convertCurrency } =
    useCurrency()

  // The active user's own currency — personal expenses convert into this
  // so the user's totals stay in one currency even if an entry was made
  // while picking a different one (see getExpenseData).
  const personalCurrency = computed(
    () =>
      userStore.getUserByUid(authStore.getActiveUserUid)?.currency ||
      DEFAULT_CURRENCY
  )

  const createInitialForm = () => ({
    amount: null,
    currency: personalCurrency.value,
    category: '',
    description: '',
    location: '',
    recipient: '',
    date: getCurrentDateInputValue(),
    splitItems: []
  })
  const form = ref(createInitialForm())
  // Narrowed to codes the current exchange-rate snapshot can actually
  // convert (plus whatever's already on the form, even if editing a past
  // entry whose currency later dropped out of the snapshot) — useCurrency.js.
  const currencyOptions = computed(() =>
    currencyOptionsIncluding(form.value.currency)
  )
  // Live preview for the "Will be converted to {amount} {currency}..." note
  // — recalculates as the entrant edits the amount or currency. Null hides
  // the note (matching currency, no amount yet, or no rate available).
  const convertedAmountPreview = computed(() => {
    const enteredCurrency = form.value.currency || personalCurrency.value
    if (enteredCurrency === personalCurrency.value) return null

    const enteredAmount = parseFloat(form.value.amount)
    if (!enteredAmount || Number.isNaN(enteredAmount)) return null

    const converted = convertCurrency(
      enteredAmount,
      enteredCurrency,
      personalCurrency.value
    )
    return converted === null ? null : formatPlainNumber(converted)
  })
  const initialFormSnapshot = ref(JSON.stringify(createInitialForm()))
  const existingMonth = ref(dateToMonthNode(form.value.date))
  const categoryOptions = computed(() =>
    mergeCategoryOptions([form.value?.category])
  )

  const {
    receiptFiles,
    receiptUploading,
    existingReceiptUrls,
    removeReceipt,
    setSelectedFiles,
    uploadSelectedFiles,
    deleteExistingReceipts
  } = useReceiptUpload({
    // Support both old single-value records and new array format
    existingUrls: computed(() => props.row?.receiptUrls ?? null),
    existingMeta: computed(() => props.row?.receiptMeta ?? null)
  })

  const { receiptExtracting, extractAndStructure } = useReceiptOcr({
    receiptFiles,
    existingReceiptUrls,
    type: 'personal-expense'
  })

  const receiptTax = ref(null)

  const PERSONAL_EXPENSE_JSON_SHAPE = JSON.stringify({
    amount: 0,
    description: '',
    category: '',
    date: 'YYYY-MM-DD',
    location: '',
    recipient: '',
    tax: 0,
    splitItems: [{ description: '', amount: 0 }]
  })

  async function extractTextFromReceipt() {
    const { data } = await extractAndStructure(PERSONAL_EXPENSE_JSON_SHAPE)
    if (!data) return

    if (data.amount != null) form.value.amount = data.amount
    if (data.description) form.value.description = data.description
    if (data.category) form.value.category = data.category
    if (data.date) form.value.date = data.date
    if (data.location) form.value.location = data.location
    if (data.recipient) form.value.recipient = data.recipient

    if (data.splitItems?.length) {
      await nextTick()
      form.value.splitItems = data.splitItems.map((item) => ({
        description: item.description || '',
        amount: item.amount ?? null
      }))
    }

    receiptTax.value = data.tax != null && data.tax > 0 ? data.tax : null

    await nextTick()
    showSuccess(t('common.receiptExtracted'))
  }

  const splitItemsTotal = computed(
    () =>
      form.value.splitItems.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0
      ) + (parseFloat(receiptTax.value) || 0)
  )

  function addSplitItem() {
    form.value.splitItems.push({ description: '', amount: null })
  }

  function removeSplitItem(index) {
    form.value.splitItems.splice(index, 1)
  }

  const expenseForm = ref(null)
  const dataStore = useDataStore()
  const selectedMonth = ref(dataStore.selectedMonth)
  const storeProxy = useStoreProxy()

  const recipientOptions = computed(() =>
    (userStore.getUsers || []).map((user) => ({
      label: formatUserDisplay(storeProxy, user.uid, {
        name: user.name,
        preferMasked: true
      }),
      value: user.uid
    }))
  )

  const activeUserUid = ref(authStore.activeUserUid)
  watch(
    () => dataStore.selectedMonth,
    (newMonth) => {
      selectedMonth.value = newMonth
    }
  )

  watch(
    () => props.row,
    (newRow) => {
      isVisible.value = !newRow?.amount
      form.value = {
        // Edit mode shows/edits what was actually typed (original
        // amount+currency), not the already-converted base amount.
        amount: newRow?.originalAmount ?? newRow?.amount ?? null,
        currency:
          newRow?.originalCurrency ||
          newRow?.currency ||
          personalCurrency.value,
        category: newRow?.category ?? '',
        description: newRow?.description ?? '',
        location: newRow?.location ?? '',
        recipient: newRow?.recipient ?? '',
        date: normalizeDateInputValue(newRow?.date),
        splitItems: newRow?.splitItems ?? []
      }
      initialFormSnapshot.value = JSON.stringify(form.value)
      existingMonth.value = dateToMonthNode(newRow?.date || form.value.date)
      removeReceipt()
    },
    { immediate: true, deep: true }
  )

  function resetForm() {
    form.value = createInitialForm()
    initialFormSnapshot.value = JSON.stringify(form.value)
    receiptTax.value = null
    removeReceipt()
    expenseForm.value?.clearValidate()
  }

  const isFormDirty = computed(
    () =>
      (props.showForm || isEditMode.value) &&
      (JSON.stringify(form.value) !== initialFormSnapshot.value ||
        receiptFiles.value.length > 0)
  )

  const { confirmDiscardChanges } = useUnsavedChangesGuard(isFormDirty)

  async function requestClose() {
    const canClose = await confirmDiscardChanges()
    if (!canClose) return false

    resetForm()
    if (isEditMode.value) emit('closeModal')
    else emit('click')
    return true
  }

  const validateForm = async (whatTask = 'Save') => {
    // Itemization is optional (the breakdown UI only shows once a split
    // item exists), but once a user starts itemizing, the total should
    // match the amount — otherwise the "balanced/mismatch" indicator in the
    // template is silently ignorable and the saved receipt breakdown
    // permanently disagrees with the actual charge.
    if (form.value.splitItems.length > 0) {
      const total = parseFloat(form.value.amount || 0)
      if (total > 0 && Math.abs(splitItemsTotal.value - total) > 0.01) {
        showError(
          t('sharedExpenses.splitItemsTotalMismatch', {
            splitTotal: splitItemsTotal.value.toFixed(2),
            amount: total.toFixed(2)
          })
        )
        return
      }
    }

    // Wait for form ref to be available with retries
    let retries = 0
    while (!expenseForm.value && retries < 30) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      retries++
    }

    if (!expenseForm.value) {
      console.error('Form reference is not available after retries')
      return
    }

    expenseForm.value.validate(async (valid) => {
      if (valid) {
        const expenseDocumentPath =
          isEditMode.value && props.row?.id
            ? `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}/months/${existingMonth.value || selectedMonth.value}/expenses/${props.row.id}`
            : null
        const uploadedReceipts = await uploadSelectedFiles({
          replaceExisting: whatTask === 'Update',
          deleteContext: expenseDocumentPath
            ? { documentPath: expenseDocumentPath }
            : null
        })
        if (!uploadedReceipts) return

        const receiptUrls = uploadedReceipts.receiptUrls
        const receiptMeta = uploadedReceipts.receiptMeta
        const expenseData =
          whatTask === 'Delete' ? null : getExpenseData(receiptUrls, receiptMeta)
        if (whatTask !== 'Delete' && !expenseData) return

        if (whatTask == 'Save' || whatTask == 'Duplicate') {
          saveData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}/months/${dateToMonthNode(form.value.date)}/expenses`,
            () => expenseData,
            expenseForm,
            whatTask == 'Duplicate'
              ? t('personalExpenses.transactionDuplicated')
              : t('personalExpenses.expenseAdded'),
            () => {
              if (isEditMode.value) {
                emit('closeModal')
              } else {
                resetForm()
                emit('click')
              }
            }
          )
        } else if (whatTask == 'Update') {
          updateData(
            expenseDocumentPath,
            () => expenseData,
            t('personalExpenses.expenseUpdated')
          )
          emit('closeModal')
        } else if (whatTask == 'Delete') {
          deleteExistingReceipts({ documentPath: expenseDocumentPath })
          deleteData(expenseDocumentPath, t('personalExpenses.expenseDeleted'))
          emit('closeModal')
        }
      }
    })
  }

  // Converts the entered amount into the user's own currency if a
  // different one was picked, freezing the rate used at this moment. Returns
  // null when the rate table doesn't have a needed currency, so the caller
  // can block submission rather than silently store a wrong number.
  function convertToPersonalCurrency(enteredAmount) {
    const ownCurrency = personalCurrency.value
    const enteredCurrency = form.value.currency || ownCurrency

    if (enteredCurrency === ownCurrency) {
      return { amount: enteredAmount, extra: {} }
    }

    const rate = getExchangeRate(enteredCurrency, ownCurrency)
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

  function getExpenseData(receiptUrls = [], receiptMeta = []) {
    const converted = convertToPersonalCurrency(
      parseFloat(form.value?.amount)
    )
    if (!converted) {
      showError(t('sharedExpenses.exchangeRateUnavailable'))
      return null
    }

    return {
      amount: converted.amount,
      currency: personalCurrency.value,
      ...converted.extra,
      category: form.value?.category,
      description: form.value?.description,
      location: form.value?.location,
      recipient: String(form.value?.recipient || '').trim(),
      month: dateToMonthNode(form.value?.date),
      whoAdded: getWhoAddedTransaction(),
      date: formatDateForStorage(form.value?.date),
      whenAdded: new Date().toLocaleString('en-PK'),
      ...(receiptUrls?.length ? { receiptUrls, receiptMeta } : {}),
      ...(form.value.splitItems?.length
        ? {
            splitItems: form.value.splitItems.filter(
              (i) => i.description || i.amount
            )
          }
        : {})
    }
  }

  return {
    isVisible,
    isEditMode,
    form,
    categoryOptions,
    recipientOptions,
    personalCurrency,
    currencyOptions,
    convertedAmountPreview,
    expenseForm,
    validateForm,
    resetForm,
    requestClose,
    receiptFiles,
    receiptExtracting,
    receiptTax,
    receiptUploading,
    existingReceiptUrls,
    setSelectedFiles,
    removeReceipt,
    extractTextFromReceipt,
    splitItemsTotal,
    addSplitItem,
    removeSplitItem,
    isSubmitting
  }
}
