import { ref, watch, computed, nextTick } from 'vue'
import { useUsersOptions } from '../../utils/useUsersOptions'
import getWhoAddedTransaction from '../../utils/whoAdded'
import useFireBase from '../../api/firebase-apis'
import { useAuthStore } from '../../stores/authStore'
import { DB_NODES } from '../../constants/db-nodes'
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

  const createInitialFormData = () => ({
    amount: null,
    loanGiver: '',
    loanReceiver: '',
    loanGiverMobile: '',
    loanReceiverMobile: '',
    description: ''
  })

  const resetForm = async () => {
    formData.value = createInitialFormData()
    isMeGiver.value = false
    isMeReceiver.value = false
    selectedGiverUser.value = ''
    selectedReceiverUser.value = ''
    giverRealMobile.value = ''
    receiverRealMobile.value = ''
    copyToExpenses.value = false
    removeReceipt()
    await nextTick()
    loanForm.value?.clearValidate()
  }

  const closeForm = async () => {
    await resetForm()
    emit('closeForm')
  }

  const { usersOptions: options } = useUsersOptions()

  const { deleteData, updateData, saveData, isSubmitting } = useFireBase()

  const loanForm = ref(null)
  const isVisible = ref(true)
  const isEditMode = computed(() => !!props.row?.amount)

  const formData = ref(createInitialFormData())

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
    removeReceipt,
    setSelectedFiles,
    uploadSelectedFiles,
    deleteExistingReceipts
  } = useReceiptUpload({
    // Support both old single-value records and new array format
    existingUrls: computed(() => props.row?.receiptUrls ?? null),
    existingMeta: computed(() => props.row?.receiptMeta ?? null)
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
          loanPath = `${props.dbRef}/${authStore.getActiveUser}/months/${monthYear}/loans`
        } else {
          const groupId = groupStore.getActiveGroup || 'global'
          loanPath = `${props.dbRef}/${groupId}/months/${monthYear}/loans`
        }

        const uploadedReceipts = await uploadSelectedFiles({
          replaceExisting: whatTask === 'Update' && props.isPersonal
        })
        if (!uploadedReceipts) return

        const receiptUrls = uploadedReceipts.receiptUrls
        const receiptMeta = uploadedReceipts.receiptMeta

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
            () => getLoanData(receiptUrls, receiptMeta),
            loanForm,
            'Loan added successfully.',
            () => {
              if (expenseCopy) {
                const mockFormRef = { value: { resetFields: () => {} } }
                saveData(
                  `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/${getCurrentMonth()}`,
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
                closeForm()
              }
            }
          )
        } else if (whatTask == 'Update') {
          if (!props.isPersonal) {
            const groupId = groupStore.getActiveGroup || 'global'
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            createUpdateRequest(
              `${props.dbRef}/${groupId}/months/${monthYear}/loans/${props.row.id}`,
              receiptUrls,
              receiptMeta
            )
          } else {
            updateData(
              `${loanPath}/${props.row.id}`,
              () => getLoanData(receiptUrls, receiptMeta),
              `Loan record with ID ${props.row.id} updated successfully`
            )
            emit('closeModal')
          }
        } else if (whatTask == 'Delete') {
          if (!props.isPersonal) {
            const groupId = groupStore.getActiveGroup || 'global'
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            createDeleteRequest(
              `${props.dbRef}/${groupId}/months/${monthYear}/loans/${props.row.id}`
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
      loanPath,
      () => ({ deleteRequest }),
      'Delete request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  const createUpdateRequest = (
    loanPath,
    receiptUrls = [],
    receiptMeta = []
  ) => {
    const updateRequest = {
      changes: getLoanData(receiptUrls, receiptMeta),
      ...buildRequestMeta(storeProxy)
    }

    updateData(
      loanPath,
      () => ({ updateRequest }),
      'Update request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  function getLoanData(receiptUrls = [], receiptMeta = []) {
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
      ...(!props.isPersonal
        ? { group: groupStore.getActiveGroup || null }
        : {}),
      date:
        new Date().toLocaleDateString('en-PK') +
        ' ' +
        new Date().toLocaleTimeString(),
      whoAdded: getWhoAddedTransaction(),
      whenAdded: new Date().toLocaleString('en-PK'),
      ...(receiptUrls?.length ? { receiptUrls, receiptMeta } : {})
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
    resetForm,
    validateForm,
    receiptFiles,
    receiptUploading,
    existingReceiptUrls,
    setSelectedFiles,
    removeReceipt,
    onGiverMobileBlur,
    onReceiverMobileBlur,
    isMeGiver,
    isMeReceiver,
    copyToExpenses,
    selectedGiverUser,
    selectedReceiverUser,
    usersForDropdown,
    isSubmitting
  }
}
