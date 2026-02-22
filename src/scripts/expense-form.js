import { ref, watch, computed } from 'vue'
import { store } from '../stores/store'
import getCurrentMonth from '../utils/getCurrentMonth'
import getWhoAddedTransaction from '../utils/whoAdded'
import useFireBase from '../api/firebase-apis'
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload'
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
  const existingReceiptMeta = computed(() => props.row?.receiptMeta || null)

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
    }

    if (!expenseForm.value) {
      console.error('Form reference is not available after retries')
      return
    }

    expenseForm.value.validate(async (valid) => {
      if (valid) {
        // Upload receipt if selected
        let receiptUrl = existingReceiptUrl.value
        let receiptMeta = existingReceiptMeta.value
        if (receiptFile.value) {
          try {
            receiptUploading.value = true
            const uploaded = await uploadReceiptToStorage(receiptFile.value)
            receiptUrl = uploaded.url
            receiptMeta = { url: uploaded.url, publicId: uploaded.publicId, resourceType: uploaded.resourceType }
            // Delete old Cloudinary file when replacing on update
            if (whatTask === 'Update' && existingReceiptMeta.value) {
              deleteFromCloudinary(existingReceiptMeta.value.publicId, existingReceiptMeta.value.resourceType)
            }
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
            () => getExpenseData(receiptUrl, receiptMeta),
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
            () => getExpenseData(receiptUrl, receiptMeta),
            `Expense record with ID ${props.row.id} updated successfully`
          )
          emit('closeModal')
        } else if (whatTask == 'Delete') {
          if (existingReceiptMeta.value) {
            deleteFromCloudinary(existingReceiptMeta.value.publicId, existingReceiptMeta.value.resourceType)
          }
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
    const file = event.target.files?.[0] || null
    if (!file) {
      receiptFile.value = null
      return
    }
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showError('Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed.')
      if (fileInputRef.value) fileInputRef.value.value = ''
      receiptFile.value = null
      return
    }
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      showError('File size must be less than 1MB.')
      if (fileInputRef.value) fileInputRef.value.value = ''
      receiptFile.value = null
      return
    }
    receiptFile.value = file
  }

  function removeReceipt() {
    receiptFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  async function uploadReceiptToStorage(file) {
    return await uploadToCloudinary(file)
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
    receiptFile,
    receiptUploading,
    fileInputRef,
    existingReceiptUrl,
    triggerFileInput,
    handleReceiptChange,
    removeReceipt
  }
}
