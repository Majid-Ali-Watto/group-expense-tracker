import { ref, watch, computed, nextTick } from 'vue'
import { useUsersOptions } from '../../utils/useUsersOptions'
import getWhoAddedTransaction from '../../utils/whoAdded'
import useFireBase from '../../api/firebase-apis'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import { showError } from '../../utils/showAlerts'
import { maskMobile } from '../../utils/maskMobile'
import { buildRequestMeta } from '../../utils/buildRequestMeta'
import getCurrentMonth from '../../utils/getCurrentMonth'
import { useReceiptUpload } from '../../utils/useReceiptUpload'

export const LoanForm = (props, emit) => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }

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
    selectedGiverUser.value = ''
    selectedReceiverUser.value = ''
    giverRealMobile.value = ''
    receiverRealMobile.value = ''
    copyToExpenses.value = false
    removeReceipt()
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

  const formData = ref({
    amount: null,
    loanGiver: '',
    loanReceiver: '',
    loanGiverMobile: '',
    loanReceiverMobile: '',
    description: ''
  })

  const activeUser = computed(() => authStore.getActiveUser)
  const activeUserName = computed(
    () => userStore.getUserByMobile(activeUser.value)?.name || ''
  )

  // ========== Select from Users (personal loans) ==========
  const selectedGiverUser = ref('')
  const selectedReceiverUser = ref('')
  // Real (unmasked) mobile when a user was picked from the dropdown
  const giverRealMobile = ref('')
  const receiverRealMobile = ref('')

  const usersForDropdown = computed(() => {
    const me = activeUser.value
    return (userStore.getUsers || [])
      .map((u) => ({
        label: `${u.name || u.mobile} (${
          u.mobile === me ? u.mobile : u.maskedMobile || maskMobile(u.mobile)
        })`,
        value: u.mobile
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
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

  // ========== Copy to Personal Expenses ==========
  const copyToExpenses = ref(false)

  const getOtherPartyName = () => {
    if (isMeGiver.value) {
      return props.isPersonal
        ? formData.value.loanReceiver
        : userStore.getUserByMobile(formData.value.loanReceiver)?.name ||
            formData.value.loanReceiver
    }
    return props.isPersonal
      ? formData.value.loanGiver
      : userStore.getUserByMobile(formData.value.loanGiver)?.name ||
          formData.value.loanGiver
  }

  // ========== ME? Checkboxes ==========
  const isMeGiver = ref(false)
  const isMeReceiver = ref(false)

  watch(isMeGiver, (val) => {
    if (val) {
      isMeReceiver.value = false
      selectedGiverUser.value = ''
      giverRealMobile.value = ''
      if (props.isPersonal) {
        formData.value.loanGiverMobile = activeUser.value
        formData.value.loanGiver = activeUserName.value
      } else {
        formData.value.loanGiver = activeUser.value
      }
    } else {
      selectedGiverUser.value = ''
      giverRealMobile.value = ''
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
      selectedReceiverUser.value = ''
      receiverRealMobile.value = ''
      if (props.isPersonal) {
        formData.value.loanReceiverMobile = activeUser.value
        formData.value.loanReceiver = activeUserName.value
      } else {
        formData.value.loanReceiver = activeUser.value
      }
    } else {
      selectedReceiverUser.value = ''
      receiverRealMobile.value = ''
      if (props.isPersonal) {
        formData.value.loanReceiverMobile = ''
        formData.value.loanReceiver = ''
      } else {
        formData.value.loanReceiver = ''
      }
    }
  })

  watch(selectedGiverUser, async (mobile) => {
    if (!mobile) {
      giverRealMobile.value = ''
      return
    }
    const user = userStore.getUserByMobile(mobile)
    if (!user) return
    if (mobile === activeUser.value) {
      // Let isMeGiver watcher handle field setting
      isMeGiver.value = true
      return
    }
    // Uncheck ME? first if it was set, wait for its watcher to clear fields
    if (isMeGiver.value) {
      isMeGiver.value = false
      await nextTick()
    }
    giverRealMobile.value = mobile
    formData.value.loanGiverMobile = user.maskedMobile || maskMobile(mobile)
    formData.value.loanGiver = user.name || ''
  })

  watch(selectedReceiverUser, async (mobile) => {
    if (!mobile) {
      receiverRealMobile.value = ''
      return
    }
    const user = userStore.getUserByMobile(mobile)
    if (!user) return
    if (mobile === activeUser.value) {
      isMeReceiver.value = true
      return
    }
    if (isMeReceiver.value) {
      isMeReceiver.value = false
      await nextTick()
    }
    receiverRealMobile.value = mobile
    formData.value.loanReceiverMobile = user.maskedMobile || maskMobile(mobile)
    formData.value.loanReceiver = user.name || ''
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
      removeReceipt()
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
            giverRealMobile.value ||
            formData.value.loanGiverMobile ||
            formData.value.loanGiver
          const receiverMobile =
            receiverRealMobile.value ||
            formData.value.loanReceiverMobile ||
            formData.value.loanReceiver
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
          loanPath = `${props.dbRef}/${authStore.getActiveUser}/${monthYear}`
        } else {
          const groupId = groupStore.getActiveGroup || 'global'
          loanPath = `${props.dbRef}/${groupId}/${monthYear}`
        }

        const uploadedReceipts = await uploadSelectedFiles({
          replaceExisting: whatTask === 'Update' && props.isPersonal
        })
        if (!uploadedReceipts) return

        const receiptUrl = uploadedReceipts.receiptUrl
        const receiptMeta = uploadedReceipts.receiptMetaSingle

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
              removeReceipt()
              if (isEditMode.value) {
                emit('closeModal')
              } else {
                emit('closeForm')
              }
            }
          )
        } else if (whatTask == 'Update') {
          if (!props.isPersonal) {
            const groupId = groupStore.getActiveGroup || 'global'
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
            const groupId = groupStore.getActiveGroup || 'global'
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            createDeleteRequest(
              `${props.dbRef}/${groupId}/${monthYear}/${props.row.id}`
            )
          } else {
            deleteExistingReceipts()
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

  const createDeleteRequest = (loanPath) => {
    const deleteRequest = buildRequestMeta(storeProxy)

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
      ...buildRequestMeta(storeProxy)
    }

    updateData(
      `${loanPath}/updateRequest`,
      () => updateRequest,
      'Update request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  function getLoanData(receiptUrl = null, receiptMeta = null) {
    const giverMobile = props.isPersonal
      ? giverRealMobile.value ||
        formData.value.loanGiverMobile ||
        formData.value.loanGiver
      : formData.value.loanGiver

    const receiverMobile = props.isPersonal
      ? receiverRealMobile.value ||
        formData.value.loanReceiverMobile ||
        formData.value.loanReceiver
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
    receiptFiles,
    receiptUploading,
    existingReceiptUrls,
    existingReceiptUrl,
    setSelectedFiles,
    removeReceipt,
    onGiverMobileBlur,
    onReceiverMobileBlur,
    isMeGiver,
    isMeReceiver,
    copyToExpenses,
    selectedGiverUser,
    selectedReceiverUser,
    usersForDropdown
  }
}
