import { ref, watch, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import getCurrentMonth from '../../utils/getCurrentMonth'
import getWhoAddedTransaction from '../../utils/whoAdded'
import useFireBase from '../../api/firebase-apis'
import { useReceiptUpload } from '../../utils/useReceiptUpload'
import { DB_NODES } from '../../constants/db-nodes'

export const ExpenseForm = (props, emit) => {
  const { saveData, updateData, deleteData } = useFireBase()
  const isVisible = ref(true)
  const isEditMode = computed(() => !!props.row?.amount)

  const form = ref({
    amount: null,
    description: '',
    location: '',
    recipient: ''
  })

  const {
    receiptFiles,
    receiptUploading,
    existingReceiptUrls,
    existingReceiptUrl,
    removeReceipt,
    setSelectedFiles,
    uploadSelectedFiles,
    deleteExistingReceipts
  } = useReceiptUpload({
    existingUrls: computed(() => props.row?.receiptUrl || null),
    existingMeta: computed(() => props.row?.receiptMeta || null)
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

        const receiptUrl = uploadedReceipts.receiptUrl
        const receiptMeta = uploadedReceipts.receiptMetaSingle

        if (whatTask == 'Save') {
          saveData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/${getCurrentMonth()}`,
            () => getExpenseData(receiptUrl, receiptMeta),
            expenseForm,
            'Expense added successfully!',
            () => {
              removeReceipt()
              if (isEditMode.value) {
                emit('closeModal')
              } else {
                emit('click')
              }
            }
          )
        } else if (whatTask == 'Update') {
          updateData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/${selectedMonth.value}/${props.row.id}`,
            () => getExpenseData(receiptUrl, receiptMeta),
            `Expense record with ID ${props.row.id} updated successfully`
          )
          emit('closeModal')
        } else if (whatTask == 'Delete') {
          deleteExistingReceipts()
          deleteData(
            `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/${selectedMonth.value}/${props.row.id}`,
            `Expense record with ID ${props.row.id} deleted successfully`
          )
          emit('closeModal')
        }
      }
    })
  }

  function getExpenseData(receiptUrl = null, receiptMeta = null) {
    return {
      amount: form.value?.amount,
      description: form.value?.description,
      location: form.value?.location,
      recipient: form.value?.recipient,
      month: getCurrentMonth(),
      whoAdded: getWhoAddedTransaction(),
      date: new Date().toLocaleString('en-PK'),
      whenAdded: new Date().toLocaleString('en-PK'),
      ...(receiptUrl ? { receiptUrl, receiptMeta } : {})
    }
  }

  return {
    isVisible,
    isEditMode,
    form,
    expenseForm,
    validateForm,
    receiptFiles,
    receiptUploading,
    existingReceiptUrls,
    existingReceiptUrl,
    setSelectedFiles,
    removeReceipt
  }
}
