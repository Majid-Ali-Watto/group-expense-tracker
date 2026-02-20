import { ref, watch, computed } from 'vue'
import { store } from '../stores/store'
import getCurrentMonth from '../utils/getCurrentMonth'
import getWhoAddedTransaction from '../utils/whoAdded'
import useFireBase from '../api/firebase-apis'
import { storage } from '../firebase'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'
import { showError } from '../utils/showAlerts'

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

  // Receipt upload (single file)
  const receiptFile = ref(null)
  const receiptUploading = ref(false)
  const fileInputRef = ref(null)
  const existingReceiptUrl = computed(() => props.row?.receiptUrl || null)

  const expenseForm = ref(null)
  const userStore = store()
  const selectedMonth = ref(userStore.$state.selectedMonth)

  const activeUser = ref(userStore.activeUser)
  watch(
    () => userStore.$state.selectedMonth,
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
      receiptFile.value = null
      if (fileInputRef.value) fileInputRef.value.value = ''
    },
    { immediate: true, deep: true }
  )

  const validateForm = async (whatTask = 'Save') => {
    // Wait for form ref to be available with retries
    let retries = 0
    while (!expenseForm.value && retries < 30) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      retries++
      console.log(`Waiting for expenseForm ref... retry ${retries}`)
    }

    if (!expenseForm.value) {
      console.error('Form reference is not available after retries')
      console.error('expenseForm ref:', expenseForm)
      console.error('expenseForm.value:', expenseForm.value)
      return
    }

    console.log('Form ref is now available, validating...')
    expenseForm.value.validate(async (valid) => {
      if (valid) {
        // Upload receipt if selected
        let receiptUrl = existingReceiptUrl.value
        if (receiptFile.value) {
          try {
            receiptUploading.value = true
            receiptUrl = await uploadReceiptToStorage(receiptFile.value)
          } catch {
            showError('Failed to upload receipt. Please try again.')
            receiptUploading.value = false
            return
          }
          receiptUploading.value = false
        }

        if (whatTask == 'Save') {
          saveData(
            `expenses/${activeUser.value}/${getCurrentMonth()}`,
            () => getExpenseData(receiptUrl),
            expenseForm,
            'Expense added successfully!',
            () => {
              receiptFile.value = null
              if (fileInputRef.value) fileInputRef.value.value = ''
            }
          )
        } else if (whatTask == 'Update') {
          updateData(
            `expenses/${activeUser.value}/${selectedMonth.value}/${props.row.id}`,
            () => getExpenseData(receiptUrl),
            `Expense record with ID ${props.row.id} updated successfully`
          )
          emit('closeModal')
        } else if (whatTask == 'Delete') {
          deleteData(
            `expenses/${activeUser.value}/${selectedMonth.value}/${props.row.id}`,
            `Expense record with ID ${props.row.id} deleted successfully`
          )
          emit('closeModal')
        }
      }
    })
  }

  function triggerFileInput() {
    fileInputRef.value?.click()
  }

  function handleReceiptChange(event) {
    receiptFile.value = event.target.files?.[0] || null
  }

  function removeReceipt() {
    receiptFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  async function uploadReceiptToStorage(file) {
    const groupId = userStore.getActiveGroup || 'personal'
    const path = `receipts/${groupId}/${Date.now()}_${file.name}`
    const sRef = storageRef(storage, path)
    const snapshot = await uploadBytes(sRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  function getExpenseData(receiptUrl = null) {
    return {
      amount: form.value?.amount,
      description: form.value?.description,
      location: form.value?.location,
      recipient: form.value?.recipient,
      month: getCurrentMonth(),
      whoAdded: getWhoAddedTransaction(),
      date: new Date().toLocaleString('en-PK'),
      whenAdded: new Date().toLocaleString('en-PK'),
      ...(receiptUrl ? { receiptUrl } : {})
    }
  }

  return {
    isVisible,
    isEditMode,
    form,
    expenseForm,
    validateForm,
    receiptFile,
    receiptUploading,
    fileInputRef,
    existingReceiptUrl,
    triggerFileInput,
    handleReceiptChange,
    removeReceipt
  }
}
