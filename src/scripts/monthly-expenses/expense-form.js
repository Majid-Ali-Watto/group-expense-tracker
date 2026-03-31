import { ref, watch, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import getCurrentMonth from '../../utils/getCurrentMonth'
import getWhoAddedTransaction from '../../utils/whoAdded'
import useFireBase from '../../api/firebase-apis'
import { useReceiptUpload } from '../../utils/useReceiptUpload'
import { DB_NODES } from '../../constants/db-nodes'

export const ExpenseForm = (props, emit) => {
  const { saveData, updateData, deleteData, isSubmitting } = useFireBase()
  const isVisible = ref(true)
  const isEditMode = computed(() => !!props.row?.amount)

  const createInitialForm = () => ({
    amount: null,
    description: '',
    location: '',
    recipient: ''
  })
  const form = ref(createInitialForm())

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
  const selectedMonth = ref(dataStore.selectedMonth)

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
        description: newRow?.description ?? '',
        location: newRow?.location ?? '',
        recipient: newRow?.recipient ?? ''
      }
      removeReceipt()
    },
    { immediate: true, deep: true }
  )

  function resetForm() {
    form.value = createInitialForm()
    removeReceipt()
    expenseForm.value?.clearValidate()
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
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months/${getCurrentMonth()}/expenses`,
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
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months/${selectedMonth.value}/expenses/${props.row.id}`,
            () => getExpenseData(receiptUrls, receiptMeta),
            `Expense record with ID ${props.row.id} updated successfully`
          )
          emit('closeModal')
        } else if (whatTask == 'Delete') {
          deleteExistingReceipts()
          deleteData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months/${selectedMonth.value}/expenses/${props.row.id}`,
            `Expense record with ID ${props.row.id} deleted successfully`
          )
          emit('closeModal')
        }
      }
    })
  }

  function getExpenseData(receiptUrls = [], receiptMeta = []) {
    return {
      amount: form.value?.amount,
      description: form.value?.description,
      location: form.value?.location,
      recipient: form.value?.recipient,
      month: getCurrentMonth(),
      whoAdded: getWhoAddedTransaction(),
      date: new Date().toLocaleString('en-PK'),
      whenAdded: new Date().toLocaleString('en-PK'),
      ...(receiptUrls?.length ? { receiptUrls, receiptMeta } : {})
    }
  }

  return {
    isVisible,
    isEditMode,
    form,
    expenseForm,
    validateForm,
    resetForm,
    receiptFiles,
    receiptUploading,
    existingReceiptUrls,
    setSelectedFiles,
    removeReceipt,
    isSubmitting
  }
}
