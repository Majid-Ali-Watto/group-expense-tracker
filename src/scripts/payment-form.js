import { ref, watch, computed } from 'vue'
import getWhoAddedTransaction from '../utils/whoAdded'
import { friends } from '../assets/data'
import { store } from '../stores/store'
import useFireBase from '../api/firebase-apis'

export const PaymentForm = (props, emit) => {
  const { updateData, saveData } = useFireBase()
  const isVisible = ref(true)
  const userStore = store()
  const isEditMode = computed(() => !!props.row?.amount)

  const showTransactionForm = ref(false)

  const openForm = () => {
    showTransactionForm.value = true
  }

  const closeForm = () => {
    showTransactionForm.value = false
  }

  const usersOptions = computed(() => {
    const activeGroup = userStore.getActiveGroup
    const group = activeGroup ? userStore.getGroupById(activeGroup) : null
    if (group && group.members && group.members.length) {
      return group.members.map((m) => ({
        label: `${m.name} (${m.mobile})`,
        value: m.mobile
      }))
    }
    const users =
      userStore.getUsers && userStore.getUsers.length ? userStore.getUsers : []
    if (!users.length) return friends.map((f) => ({ label: f, value: f }))
    return users.map((u) => ({
      label: `${u.name} (${u.mobile})`,
      value: u.mobile
    }))
  })

  const formData = ref({
    amount: null,
    description: '',
    payerMode: 'single',
    payer: '',
    payers: [],
    participants: [...usersOptions.value.map((u) => u.value)],
    date: '',
    splitMode: 'equal',
    splitItems: []
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
    },
    { immediate: true }
  )

  const transactionForm = ref(null)

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
    transactionForm.value.validate((valid) => {
      if (valid) {
        let monthYear = formData.value.date.split('-')
        monthYear = monthYear[0] + '-' + monthYear[1].toString().padStart(2, 0)
        const groupId = userStore.getActiveGroup || 'global'
        if (whatTask == 'Save') {
          saveData(
            `payments/${groupId}/${monthYear}`,
            getPaymentData,
            transactionForm,
            'Transaction successfully saved.',
            () => {
              // Reset all form fields and hide the form
              formData.value.amount = null
              formData.value.description = ''
              formData.value.payerMode = 'single'
              formData.value.payer = ''
              formData.value.payers = []
              formData.value.participants = [...usersOptions.value.map((u) => u.value)]
              formData.value.date = ''
              formData.value.splitMode = 'equal'
              formData.value.splitItems = []
              showTransactionForm.value = false
            }
          )
        } else if (whatTask == 'Update') {
          createUpdateRequest(
            `payments/${groupId}/${monthYear}/${props.row.id}`
          )
        } else if (whatTask == 'Delete') {
          createDeleteRequest(
            `payments/${groupId}/${monthYear}/${props.row.id}`
          )
        }
      }
    })
  }

  const createDeleteRequest = (paymentPath) => {
    const activeUser = userStore.getActiveUser
    const userName = userStore.getUserByMobile(activeUser)?.name || activeUser

    const deleteRequest = {
      requestedBy: activeUser,
      requestedByName: userName,
      approvals: [activeUser],
      requestedAt: new Date().toLocaleString('en-PK')
    }

    updateData(
      `${paymentPath}/deleteRequest`,
      () => deleteRequest,
      'Delete request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  const createUpdateRequest = (paymentPath) => {
    const activeUser = userStore.getActiveUser
    const userName = userStore.getUserByMobile(activeUser)?.name || activeUser

    const updateRequest = {
      changes: getPaymentData(),
      requestedBy: activeUser,
      requestedByName: userName,
      approvals: [activeUser],
      requestedAt: new Date().toLocaleString('en-PK')
    }

    updateData(
      `${paymentPath}/updateRequest`,
      () => updateRequest,
      'Update request sent. Waiting for approval from all group members.'
    )
    emit('closeModal')
  }

  function getPaymentData() {
    const amount = parseFloat(formData.value.amount)
    const participantsList =
      formData.value.participants && formData.value.participants.length
        ? formData.value.participants
        : userStore.getUsers && userStore.getUsers.length
          ? userStore.getUsers.map((u) => u.mobile)
          : []

    // ---- compute split ----
    let split = []
    if (formData.value.splitMode === 'custom' && formData.value.splitItems.length) {
      // Item-based: sum each person's equal share within their item, across all items
      const perPerson = {}
      for (const item of formData.value.splitItems) {
        const itemPeople = item.participants || []
        const itemAmount = parseFloat(item.amount) || 0
        if (!itemPeople.length || !itemAmount) continue
        const equalShare = Math.floor((itemAmount / itemPeople.length) * 100) / 100
        let acc = 0
        itemPeople.forEach((mobile, i) => {
          let share
          if (i === itemPeople.length - 1) {
            share = parseFloat((itemAmount - acc).toFixed(2))
          } else {
            share = equalShare
            acc += share
          }
          perPerson[mobile] = parseFloat(((perPerson[mobile] || 0) + share).toFixed(2))
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
      payerMode: formData.value.payerMode,
      payer: isMultiPayer ? null : formData.value.payer,
      ...(payersField ? { payers: payersField } : {}),
      group: userStore.getActiveGroup || null,
      date: new Date(formData.value.date).toLocaleString('en-PK'),
      whenAdded: new Date().toLocaleString('en-PK'),
      whoAdded: getWhoAddedTransaction(),
      participants: participantsList,
      splitMode: formData.value.splitMode,
      ...(formData.value.splitMode === 'custom' ? { splitItems: formData.value.splitItems } : {}),
      split
    }

    return payment
  }

  return {
    isVisible,
    isEditMode,
    showTransactionForm,
    openForm,
    closeForm,
    usersOptions,
    formData,
    transactionForm,
    validateForm,
    splitItemsTotal,
    addSplitItem,
    removeSplitItem,
    payersTotal,
    addPayer,
    removePayer
  }
}
