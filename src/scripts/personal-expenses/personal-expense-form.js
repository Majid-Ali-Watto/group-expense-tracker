import { ref, watch, computed, nextTick } from 'vue'
import { useAuthStore, useDataStore, useUserStore } from '@/stores'
import {
  getWhoAddedTransaction,
  dateToMonthNode,
  getCurrentDateInputValue,
  normalizeDateInputValue,
  formatDateForStorage,
  mergeCategoryOptions,
  formatUserDisplay,
  showSuccess
} from '@/utils'
import {
  useFireBase,
  useReceiptOcr,
  useReceiptUpload,
  useUnsavedChangesGuard,
  useStoreProxy
} from '@/composables'
import { DB_NODES } from '@/constants'

export const PersonalExpenseForm = (props, emit) => {
  const { saveData, updateData, deleteData, isSubmitting } = useFireBase()
  const isVisible = ref(true)
  const isEditMode = computed(() => !!props.row?.amount)

  const createInitialForm = () => ({
    amount: null,
    category: '',
    description: '',
    location: '',
    recipient: '',
    date: getCurrentDateInputValue(),
    splitItems: []
  })
  const form = ref(createInitialForm())
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
    showSuccess('Receipt data extracted and filled into the form.')
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
  const authStore = useAuthStore()
  const dataStore = useDataStore()
  const userStore = useUserStore()
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
        amount: newRow?.amount ?? null,
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
        const uploadedReceipts = await uploadSelectedFiles({
          replaceExisting: whatTask === 'Update'
        })
        if (!uploadedReceipts) return

        const receiptUrls = uploadedReceipts.receiptUrls
        const receiptMeta = uploadedReceipts.receiptMeta

        if (whatTask == 'Save') {
          saveData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}/months/${dateToMonthNode(form.value.date)}/expenses`,
            () => getExpenseData(receiptUrls, receiptMeta),
            expenseForm,
            'Expense added successfully!',
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
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}/months/${existingMonth.value || selectedMonth.value}/expenses/${props.row.id}`,
            () => getExpenseData(receiptUrls, receiptMeta),
            'Expense updated successfully'
          )
          emit('closeModal')
        } else if (whatTask == 'Delete') {
          deleteExistingReceipts()
          deleteData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}/months/${existingMonth.value || selectedMonth.value}/expenses/${props.row.id}`,
            'Expense deleted successfully'
          )
          emit('closeModal')
        }
      }
    })
  }

  function getExpenseData(receiptUrls = [], receiptMeta = []) {
    return {
      amount: form.value?.amount,
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
