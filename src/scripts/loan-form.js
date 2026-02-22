import { ref, watch, computed } from 'vue'
import getWhoAddedTransaction from '../utils/whoAdded'
import useFireBase from '../api/firebase-apis'
import { store } from '../stores/store'
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload'
import { showError } from '../utils/showAlerts'

export const LoanForm = (props, emit) => {
  const userStore = store()

  const openForm = () => {
    emit('closeForm')
  }

  const closeForm = () => {
    formData.value = {
      amount: null,
      loanGiver: '',
      loanReceiver: '',
      description: ''
    }
    receiptFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
    setTimeout(() => {
      if (loanForm.value) {
        loanForm.value.clearValidate()
      }
    }, 0)
    emit('closeForm')
  }

  const options = computed(() => {
    const activeGroup = userStore.getActiveGroup
    const group = activeGroup ? userStore.getGroupById(activeGroup) : null
    if (group && group.members && group.members.length)
      return group.members.map((m) => ({
        label: `${m.name} (${m.mobile})`,
        value: m.mobile
      }))

    const users =
      userStore.getUsers && userStore.getUsers.length ? userStore.getUsers : []
    if (users.length)
      return users.map((u) => ({
        label: `${u.name} (${u.mobile})`,
        value: u.mobile
      }))

    return (props.friends || []).map((f) => ({ label: f, value: f }))
  })

  const { deleteData, updateData, saveData } = useFireBase()

  const loanForm = ref(null)
  const isVisible = ref(true)
  const isEditMode = computed(() => !!props.row?.amount)

  // ========== Receipt Upload ==========
  const receiptFile = ref(null)
  const receiptUploading = ref(false)
  const fileInputRef = ref(null)
  const existingReceiptUrl = computed(() => props.row?.receiptUrl || null)
  const existingReceiptMeta = computed(() => props.row?.receiptMeta || null)

  const formData = ref({
    amount: null,
    loanGiver: '',
    loanReceiver: '',
    description: ''
  })

  watch(
    () => props.row,
    (newRow) => {
      formData.value.amount = newRow?.amount ?? null
      formData.value.loanGiver = newRow?.giver ?? ''
      formData.value.loanReceiver = newRow?.receiver ?? ''
      formData.value.description = newRow?.description ?? ''
      isVisible.value = !newRow?.amount
      receiptFile.value = null
      if (fileInputRef.value) fileInputRef.value.value = ''
    },
    { immediate: true }
  )

  const validateForm = (whatTask = 'Save') => {
    loanForm.value.validate(async (valid) => {
      if (valid) {
        let loanPath
        const date = new Date()
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (props.isPersonal) {
          loanPath = `${props.dbRef}/${userStore.getActiveUser}/${monthYear}`
        } else {
          const groupId = userStore.getActiveGroup || 'global'
          loanPath = `${props.dbRef}/${groupId}/${monthYear}`
        }

        // Upload receipt if selected
        let receiptUrl = existingReceiptUrl.value
        let receiptMeta = existingReceiptMeta.value
        if (receiptFile.value) {
          try {
            receiptUploading.value = true
            const uploaded = await uploadReceiptToStorage(receiptFile.value)
            receiptUrl = uploaded.url
            receiptMeta = { url: uploaded.url, publicId: uploaded.publicId, resourceType: uploaded.resourceType }
            // Delete old Cloudinary file when replacing on direct update
            if (whatTask === 'Update' && props.isPersonal && existingReceiptMeta.value) {
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
            loanPath,
            () => getLoanData(receiptUrl, receiptMeta),
            loanForm,
            'Loan added successfully.',
            () => {
              receiptFile.value = null
              if (fileInputRef.value) fileInputRef.value.value = ''
            }
          )
        } else if (whatTask == 'Update') {
          if (!props.isPersonal) {
            const groupId = userStore.getActiveGroup || 'global'
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            createUpdateRequest(
              `${props.dbRef}/${groupId}/${monthYear}/${props.row.id}`,
              receiptUrl,
              receiptMeta
            )
          } else {
            updateData(
              `${loanPath}/${props.row.id}`,
              () => getLoanData(receiptUrl, receiptMeta),
              `Loan record with ID ${props.row.id} updated successfully`
            )
            emit('closeModal')
          }
        } else if (whatTask == 'Delete') {
          if (!props.isPersonal) {
            const groupId = userStore.getActiveGroup || 'global'
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            createDeleteRequest(
              `${props.dbRef}/${groupId}/${monthYear}/${props.row.id}`
            )
          } else {
            if (existingReceiptMeta.value) {
              deleteFromCloudinary(existingReceiptMeta.value.publicId, existingReceiptMeta.value.resourceType)
            }
            deleteData(
              `${loanPath}/${props.row.id}`,
              `Loan record with ID ${props.row.id} deleted successfully`
            )
            emit('closeModal')
          }
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

  const createDeleteRequest = (loanPath) => {
    const activeUser = userStore.getActiveUser
    const userName = userStore.getUserByMobile(activeUser)?.name || activeUser

    const deleteRequest = {
      requestedBy: activeUser,
      requestedByName: userName,
      approvals: [activeUser],
      requestedAt: new Date().toLocaleString('en-PK')
    }

    updateData(
      `${loanPath}/deleteRequest`,
      () => deleteRequest,
      'Delete request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  const createUpdateRequest = (loanPath, receiptUrl = null, receiptMeta = null) => {
    const activeUser = userStore.getActiveUser
    const userName = userStore.getUserByMobile(activeUser)?.name || activeUser

    const updateRequest = {
      changes: getLoanData(receiptUrl, receiptMeta),
      requestedBy: activeUser,
      requestedByName: userName,
      approvals: [activeUser],
      requestedAt: new Date().toLocaleString('en-PK')
    }

    updateData(
      `${loanPath}/updateRequest`,
      () => updateRequest,
      'Update request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  function getLoanData(receiptUrl = null, receiptMeta = null) {
    const loan = {
      amount: formData.value.amount,
      description: formData.value.description,
      giver: formData.value.loanGiver,
      receiver: formData.value.loanReceiver,
      date:
        new Date().toLocaleDateString('en-PK') +
        ' ' +
        new Date().toLocaleTimeString(),
      whoAdded: getWhoAddedTransaction(),
      whenAdded: new Date().toLocaleString('en-PK'),
      ...(receiptUrl ? { receiptUrl, receiptMeta } : {})
    }
    return loan
  }

  return {
    options,
    loanForm,
    isVisible,
    isEditMode,
    formData,
    openForm,
    closeForm,
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
