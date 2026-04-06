import { ref, watch, computed } from 'vue'
import { useAuthStore, useDataStore, useUserStore } from '@/stores'
import {
  getWhoAddedTransaction,
  dateToMonthNode,
  getCurrentDateInputValue,
  normalizeDateInputValue,
  formatDateForStorage,
  mergeCategoryOptions,
  formatUserDisplay
} from '@/utils'
import {
  useFireBase,
  useReceiptUpload,
  useUnsavedChangesGuard
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
    date: getCurrentDateInputValue()
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

  const expenseForm = ref(null)
  const authStore = useAuthStore()
  const dataStore = useDataStore()
  const userStore = useUserStore()
  const selectedMonth = ref(dataStore.selectedMonth)
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (value) => userStore.getUserByMobile(value),
    getUserByUid: (uid) => userStore.getUserByUid(uid)
  }

  const recipientOptions = computed(() =>
    (userStore.getUsers || []).map((user) => ({
      label: formatUserDisplay(storeProxy, user.uid, {
        name: user.name,
        preferMasked: true
      }),
      value: user.uid
    }))
  )

  const activeUser = ref(authStore.activeUser)
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
        date: normalizeDateInputValue(newRow?.date)
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
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months/${dateToMonthNode(form.value.date)}/expenses`,
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
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months/${existingMonth.value || selectedMonth.value}/expenses/${props.row.id}`,
            () => getExpenseData(receiptUrls, receiptMeta),
            'Expense updated successfully'
          )
          emit('closeModal')
        } else if (whatTask == 'Delete') {
          deleteExistingReceipts()
          deleteData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months/${existingMonth.value || selectedMonth.value}/expenses/${props.row.id}`,
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
      ...(receiptUrls?.length ? { receiptUrls, receiptMeta } : {})
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
    receiptUploading,
    existingReceiptUrls,
    setSelectedFiles,
    removeReceipt,
    isSubmitting
  }
}
