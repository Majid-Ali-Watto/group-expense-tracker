import { ref, watch, computed } from 'vue'
import { useUsersOptions } from '../utils/useUsersOptions'
import getWhoAddedTransaction from '../utils/whoAdded'
import useFireBase from '../api/firebase-apis'
import { store } from '../stores/store'
import {
  uploadToCloudinary,
  deleteFromCloudinary
} from '../utils/cloudinaryUpload'
import { showError } from '../utils/showAlerts'
import { buildRequestMeta } from '../utils/buildRequestMeta'
import getCurrentMonth from '../utils/getCurrentMonth'

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
      loanGiverMobile: '',
      loanReceiverMobile: '',
      description: ''
    }
    isMeGiver.value = false
    isMeReceiver.value = false
    copyToExpenses.value = false
    receiptFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
    setTimeout(() => {
      if (loanForm.value) {
        loanForm.value.clearValidate()
      }
    }, 0)
    emit('closeForm')
  }

  const { usersOptions: options } = useUsersOptions()

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
    loanGiverMobile: '',
    loanReceiverMobile: '',
    description: ''
  })

  const activeUser = computed(() => userStore.getActiveUser)
  const activeUserName = computed(
    () => userStore.getUserByMobile(activeUser.value)?.name || ''
  )

  // ========== Copy to Personal Expenses ==========
  const copyToExpenses = ref(false)

  const getOtherPartyName = () => {
    if (isMeGiver.value) {
      return props.isPersonal
        ? formData.value.loanReceiver
        : userStore.getUserByMobile(formData.value.loanReceiver)?.name || formData.value.loanReceiver
    }
    return props.isPersonal
      ? formData.value.loanGiver
      : userStore.getUserByMobile(formData.value.loanGiver)?.name || formData.value.loanGiver
  }

  // ========== ME? Checkboxes ==========
  const isMeGiver = ref(false)
  const isMeReceiver = ref(false)

  watch(isMeGiver, (val) => {
    if (val) {
      isMeReceiver.value = false
      if (props.isPersonal) {
        formData.value.loanGiverMobile = activeUser.value
        formData.value.loanGiver = activeUserName.value
      } else {
        formData.value.loanGiver = activeUser.value
      }
    } else {
      if (props.isPersonal) {
        formData.value.loanGiverMobile = ''
        formData.value.loanGiver = ''
      } else {
        formData.value.loanGiver = ''
      }
    }
  })

  watch(isMeReceiver, (val) => {
    if (val) {
      if (props.isPersonal) {
        formData.value.loanReceiverMobile = activeUser.value
        formData.value.loanReceiver = activeUserName.value
      } else {
        formData.value.loanReceiver = activeUser.value
      }
    } else {
      if (props.isPersonal) {
        formData.value.loanReceiverMobile = ''
        formData.value.loanReceiver = ''
      } else {
        formData.value.loanReceiver = ''
      }
    }
  })

  watch(
    () => props.row,
    (newRow) => {
      formData.value.amount = newRow?.amount ?? null
      formData.value.loanGiver = newRow?.giverName ?? newRow?.giver ?? ''
      formData.value.loanReceiver =
        newRow?.receiverName ?? newRow?.receiver ?? ''
      formData.value.loanGiverMobile =
        newRow?.giverMobile ?? newRow?.giver ?? newRow?.loanGiverMobile ?? ''
      formData.value.loanReceiverMobile =
        newRow?.receiverMobile ??
        newRow?.receiver ??
        newRow?.loanReceiverMobile ??
        ''
      formData.value.description = newRow?.description ?? ''
      isVisible.value = !newRow?.amount
      receiptFile.value = null
      if (fileInputRef.value) fileInputRef.value.value = ''
      // Auto-tick ME? checkbox in edit mode
      if (newRow?.amount) {
        const giverMobile = props.isPersonal
          ? formData.value.loanGiverMobile || formData.value.loanGiver
          : formData.value.loanGiver
        const receiverMobile = props.isPersonal
          ? formData.value.loanReceiverMobile || formData.value.loanReceiver
          : formData.value.loanReceiver
        isMeGiver.value = giverMobile === activeUser.value
        isMeReceiver.value = receiverMobile === activeUser.value
      } else {
        isMeGiver.value = false
        isMeReceiver.value = false
      }
    },
    { immediate: true }
  )

  const onGiverMobileBlur = () => {
    if (formData.value.loanGiverMobile == activeUser.value) {
      formData.value.loanGiver =
        activeUserName.value || formData.value.loanGiver
    }
  }

  const onReceiverMobileBlur = () => {
    if (formData.value.loanReceiverMobile == activeUser.value) {
      formData.value.loanReceiver =
        activeUserName.value || formData.value.loanReceiver
    }
  }

  const validateForm = (whatTask = 'Save') => {
    loanForm.value.validate(async (valid) => {
      if (valid) {
        // Personal loan guard: logged-in user must be either giver or receiver
        if (props.isPersonal) {
          const giverMobile =
            formData.value.loanGiverMobile || formData.value.loanGiver
          const receiverMobile =
            formData.value.loanReceiverMobile || formData.value.loanReceiver
          if (giverMobile === receiverMobile) {
            showError('Giver and Receiver cannot be the same person.')
            return
          }
          if (
            giverMobile !== activeUser.value &&
            receiverMobile !== activeUser.value
          ) {
            showError(
              'For personal loans, either Giver or Receiver must be your own mobile.'
            )
            return
          }

          if (giverMobile === activeUser.value && formData.value.loanGiver) {
            if (formData.value.loanGiver !== activeUserName.value) {
              showError(
                'Giver name must match your account name when using your mobile.'
              )
              return
            }
          }
          if (
            receiverMobile === activeUser.value &&
            formData.value.loanReceiver
          ) {
            if (formData.value.loanReceiver !== activeUserName.value) {
              showError(
                'Receiver name must match your account name when using your mobile.'
              )
              return
            }
          }
        }

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
            receiptMeta = {
              url: uploaded.url,
              publicId: uploaded.publicId,
              resourceType: uploaded.resourceType
            }
            // Delete old Cloudinary file when replacing on direct update
            if (
              whatTask === 'Update' &&
              props.isPersonal &&
              existingReceiptMeta.value
            ) {
              deleteFromCloudinary(
                existingReceiptMeta.value.publicId,
                existingReceiptMeta.value.resourceType
              )
            }
          } catch {
            showError('Failed to upload receipt. Please try again.')
            receiptUploading.value = false
            return
          }
          receiptUploading.value = false
        }

        if (whatTask == 'Save') {
          // Capture expense data before saveData resets the form
          const expenseCopy = copyToExpenses.value
            ? {
                amount: formData.value.amount,
                description: formData.value.description,
                location: 'Loan',
                recipient: getOtherPartyName(),
                month: getCurrentMonth(),
                whoAdded: getWhoAddedTransaction(),
                date: new Date().toLocaleString('en-PK'),
                whenAdded: new Date().toLocaleString('en-PK')
              }
            : null

          saveData(
            loanPath,
            () => getLoanData(receiptUrl, receiptMeta),
            loanForm,
            'Loan added successfully.',
            () => {
              if (expenseCopy) {
                const mockFormRef = { value: { resetFields: () => {} } }
                saveData(
                  `expenses/${activeUser.value}/${getCurrentMonth()}`,
                  () => expenseCopy,
                  mockFormRef,
                  'Expense copy added to Personal Expenses.',
                  null
                )
              }
              receiptFile.value = null
              if (fileInputRef.value) fileInputRef.value.value = ''
              if (isEditMode.value) {
                emit('closeModal')
              } else {
                emit('closeForm')
              }
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
              deleteFromCloudinary(
                existingReceiptMeta.value.publicId,
                existingReceiptMeta.value.resourceType
              )
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
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ]
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
    const deleteRequest = buildRequestMeta(userStore)

    updateData(
      `${loanPath}/deleteRequest`,
      () => deleteRequest,
      'Delete request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  const createUpdateRequest = (
    loanPath,
    receiptUrl = null,
    receiptMeta = null
  ) => {
    const updateRequest = {
      changes: getLoanData(receiptUrl, receiptMeta),
      ...buildRequestMeta(userStore)
    }

    updateData(
      `${loanPath}/updateRequest`,
      () => updateRequest,
      'Update request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  function getLoanData(receiptUrl = null, receiptMeta = null) {
    const giverMobile =
      props.isPersonal && formData.value.loanGiverMobile
        ? formData.value.loanGiverMobile
        : formData.value.loanGiver

    const receiverMobile =
      props.isPersonal && formData.value.loanReceiverMobile
        ? formData.value.loanReceiverMobile
        : formData.value.loanReceiver

    const loan = {
      amount: formData.value.amount,
      description: formData.value.description,
      [!props.isPersonal ? 'giver' : 'loanGiver']: giverMobile,
      [!props.isPersonal ? 'receiver' : 'loanReceiver']: receiverMobile,
      giverName: formData.value.loanGiver,
      receiverName: formData.value.loanReceiver,
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
    removeReceipt,
    onGiverMobileBlur,
    onReceiverMobileBlur,
    isMeGiver,
    isMeReceiver,
    copyToExpenses
  }
}
