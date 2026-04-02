import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useUsersOptions, useFireBase, useReceiptUpload } from '@/composables'
import { getWhoAddedTransaction, buildRequestMeta } from '@/utils'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'

export const SharedExpenses = (props, emit) => {
  const { updateData, saveData, isSubmitting } = useFireBase()
  const isVisible = ref(true)
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const isEditMode = computed(() => !!props.row?.amount)

  const showTransactionForm = ref(false)

  const openForm = () => {
    showTransactionForm.value = true
  }

  const { usersOptions } = useUsersOptions()

  const activeUser = computed(() => authStore.getActiveUser)

  // ========== ME? Checkbox (single payer) ==========
  const isMePayer = ref(false)

  watch(isMePayer, (val) => {
    if (val) {
      formData.value.payer = activeUser.value
    } else {
      formData.value.payer = ''
    }
  })

  const createInitialFormData = () => ({
    amount: null,
    description: '',
    location: '',
    payerMode: 'single',
    payer: '',
    payers: [],
    participants: [...usersOptions.value.map((u) => u.value)],
    date: '',
    splitMode: 'equal',
    splitItems: []
  })

  const formData = ref(createInitialFormData())

  const {
    receiptFiles,
    receiptUploading,
    allowsMultiple,
    existingReceiptUrls,
    existingReceiptMeta,
    removeReceipt,
    setSelectedFiles,
    trimSelectedFiles,
    uploadSelectedFiles
  } = useReceiptUpload({
    existingUrls: computed(() =>
      Array.isArray(props.row?.receiptUrls) ? props.row.receiptUrls : []
    ),
    existingMeta: computed(() =>
      Array.isArray(props.row?.receiptMeta) ? props.row.receiptMeta : []
    ),
    maxFiles: computed(() =>
      formData.value.payerMode === 'single' ? 1 : Infinity
    )
  })

  watch(usersOptions, (newOptions) => {
    if (!isEditMode.value) {
      formData.value.participants = newOptions.map((u) => u.value)
    }
  })

  watch(
    () => props.row,
    (newRow) => {
      formData.value.amount = newRow?.amount ?? null
      formData.value.description = newRow?.description ?? ''
      formData.value.location = newRow?.location ?? ''
      formData.value.payerMode = newRow?.payerMode ?? 'single'
      formData.value.payer = newRow?.payer ?? ''
      formData.value.payers = newRow?.payers ?? []
      formData.value.date = newRow?.date ?? ''
      formData.value.participants = newRow?.participants ?? [
        ...usersOptions.value.map((u) => u.value)
      ]
      formData.value.splitMode = newRow?.splitMode ?? 'equal'
      formData.value.splitItems = newRow?.splitItems ?? []
      isVisible.value = !newRow?.amount
      removeReceipt()
      // Auto-tick ME? checkbox in edit mode (single payer only)
      if (newRow?.amount && newRow?.payerMode !== 'multiple') {
        isMePayer.value = formData.value.payer === activeUser.value
      } else {
        isMePayer.value = false
      }
    },
    { immediate: true }
  )

  watch(
    () => formData.value.payerMode,
    (mode) => {
      trimSelectedFiles()
      if (mode !== 'single') {
        isMePayer.value = false
      }
    }
  )

  const transactionForm = ref(null)

  const resetForm = async ({ close = false } = {}) => {
    formData.value = createInitialFormData()
    isMePayer.value = false
    removeReceipt()
    await nextTick()
    transactionForm.value?.clearValidate()
    if (close) {
      showTransactionForm.value = false
    }
  }

  const closeForm = async () => {
    await resetForm({ close: true })
  }

  // ========== Custom Split Helpers ==========
  const splitItemsTotal = computed(() =>
    formData.value.splitItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    )
  )

  function addSplitItem() {
    formData.value.splitItems.push({
      description: '',
      amount: null,
      participants: [...formData.value.participants]
    })
  }

  function removeSplitItem(index) {
    formData.value.splitItems.splice(index, 1)
  }

  // ========== Multiple Payers Helpers ==========
  const payersTotal = computed(() =>
    formData.value.payers.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    )
  )

  function addPayer() {
    formData.value.payers.push({ mobile: '', amount: null })
  }

  function removePayer(index) {
    formData.value.payers.splice(index, 1)
  }

  const validateForm = (whatTask = 'Save') => {
    // --- Extra guards not covered by el-form rules ---
    if (formData.value.payerMode === 'multiple') {
      const validPayers = formData.value.payers.filter((p) => p.mobile)
      if (validPayers.length === 0) {
        ElMessage.error(
          'Please add at least one payer when using Multiple payer mode.'
        )
        return
      }
      const payerSum = validPayers.reduce(
        (s, p) => s + parseFloat(p.amount || 0),
        0
      )
      const total = parseFloat(formData.value.amount || 0)
      if (total > 0 && Math.abs(payerSum - total) > 0.01) {
        ElMessage.error(
          `Payers total (${payerSum.toFixed(2)}) must equal the transaction amount (${total.toFixed(2)}).`
        )
        return
      }
    }

    if (
      formData.value.splitMode === 'custom' &&
      formData.value.splitItems.length === 0
    ) {
      ElMessage.error(
        'Please add at least one split item when using Custom split mode.'
      )
      return
    }

    transactionForm.value.validate(async (valid) => {
      if (valid) {
        let monthYear = formData.value.date.split('-')
        monthYear = monthYear[0] + '-' + monthYear[1].toString().padStart(2, 0)
        const groupId = groupStore.getActiveGroup || 'global'

        const uploadedReceipts = await uploadSelectedFiles()
        if (!uploadedReceipts) return

        const receiptUrls = uploadedReceipts.receiptUrls
        const receiptMeta = uploadedReceipts.receiptMeta

        if (whatTask == 'Save') {
          saveData(
            `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${monthYear}/payments`,
            () => getPaymentData(receiptUrls, receiptMeta),
            transactionForm,
            'Transaction successfully saved.',
            () => {
              if (isEditMode.value) {
                emit('closeModal')
              } else {
                resetForm({ close: true })
              }
            }
          )
        } else if (whatTask == 'Update') {
          createUpdateRequest(
            `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${monthYear}/payments/${props.row.id}`,
            receiptUrls,
            receiptMeta
          )
        } else if (whatTask == 'Delete') {
          createDeleteRequest(
            `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${monthYear}/payments/${props.row.id}`
          )
        }
      }
    })
  }

  const createDeleteRequest = (paymentPath) => {
    const deleteRequest = buildRequestMeta(storeProxy)

    updateData(
      paymentPath,
      () => ({ deleteRequest }),
      'Delete request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  const createUpdateRequest = (
    paymentPath,
    receiptUrls = [],
    receiptMeta = []
  ) => {
    const updateRequest = {
      changes: getPaymentData(receiptUrls, receiptMeta),
      ...buildRequestMeta(storeProxy)
    }

    updateData(
      paymentPath,
      () => ({ updateRequest }),
      'Update request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  function getPaymentData(receiptUrls = [], receiptMeta = []) {
    const amount = parseFloat(formData.value.amount)
    const location = formData.value.location?.trim() ?? ''
    const participantsList =
      formData.value.participants && formData.value.participants.length
        ? formData.value.participants
        : userStore.getUsers && userStore.getUsers.length
          ? userStore.getUsers.map((u) => u.mobile)
          : []

    // ---- compute split ----
    let split = []
    if (
      formData.value.splitMode === 'custom' &&
      formData.value.splitItems.length
    ) {
      // Item-based: sum each person's equal share within their item, across all items
      const perPerson = {}
      for (const item of formData.value.splitItems) {
        const itemPeople = item.participants || []
        const itemAmount = parseFloat(item.amount) || 0
        if (!itemPeople.length || !itemAmount) continue
        const equalShare =
          Math.floor((itemAmount / itemPeople.length) * 100) / 100
        let acc = 0
        itemPeople.forEach((mobile, i) => {
          let share
          if (i === itemPeople.length - 1) {
            share = parseFloat((itemAmount - acc).toFixed(2))
          } else {
            share = equalShare
            acc += share
          }
          perPerson[mobile] = parseFloat(
            ((perPerson[mobile] || 0) + share).toFixed(2)
          )
        })
      }
      split = Object.keys(perPerson).map((mobile) => ({
        mobile,
        name: userStore.getUserByMobile(mobile)?.name || mobile,
        amount: perPerson[mobile]
      }))
    } else {
      // Equal split among all participants (existing logic — unchanged)
      if (participantsList.length) {
        const equal = Math.floor((amount / participantsList.length) * 100) / 100
        let acc = 0
        for (let i = 0; i < participantsList.length; i++) {
          const mobile = participantsList[i]
          let share = equal
          if (i === participantsList.length - 1) {
            share = parseFloat((amount - acc).toFixed(2))
          } else {
            acc += share
          }
          split.push({
            mobile,
            name: userStore.getUserByMobile(mobile)?.name || mobile,
            amount: share
          })
        }
      }
    }

    // ---- payer(s) ----
    const isMultiPayer = formData.value.payerMode === 'multiple'
    const payersField = isMultiPayer
      ? formData.value.payers
          .filter((p) => p.mobile)
          .map((p) => ({
            mobile: p.mobile,
            name: userStore.getUserByMobile(p.mobile)?.name || p.mobile,
            amount: parseFloat(p.amount || 0)
          }))
      : null

    const payment = {
      amount,
      description: formData.value.description,
      ...(location ? { location } : isEditMode.value ? { location: null } : {}),
      payerMode: formData.value.payerMode,
      payer: isMultiPayer ? null : formData.value.payer,
      ...(payersField ? { payers: payersField } : {}),
      group: groupStore.getActiveGroup || null,
      date: new Date(formData.value.date).toLocaleString('en-PK'),
      whenAdded: new Date().toLocaleString('en-PK'),
      whoAdded: getWhoAddedTransaction(),
      participants: participantsList,
      splitMode: formData.value.splitMode,
      ...(formData.value.splitMode === 'custom'
        ? { splitItems: formData.value.splitItems }
        : {}),
      split,
      ...(receiptUrls && receiptUrls.length ? { receiptUrls, receiptMeta } : {})
    }

    return payment
  }

  return {
    isVisible,
    isEditMode,
    showTransactionForm,
    isMePayer,
    openForm,
    closeForm,
    resetForm,
    usersOptions,
    formData,
    transactionForm,
    validateForm,
    splitItemsTotal,
    addSplitItem,
    removeSplitItem,
    payersTotal,
    addPayer,
    removePayer,
    receiptFiles,
    receiptUploading,
    allowsMultiple,
    existingReceiptUrls,
    existingReceiptMeta,
    setSelectedFiles,
    removeReceipt,
    isSubmitting
  }
}
