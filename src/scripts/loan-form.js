import { ref, watch, computed } from 'vue'
import getWhoAddedTransaction from '../utils/whoAdded'
import useFireBase from '../api/firebase-apis'
import { store } from '../stores/store'

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
    },
    { immediate: true }
  )

  const validateForm = (whatTask = 'Save') => {
    loanForm.value.validate((valid) => {
      if (valid) {
        let loanPath
        if (props.isPersonal) {
          const date = new Date()
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          loanPath = `${props.dbRef}/${userStore.getActiveUser}/${monthYear}`
        } else {
          const groupId = userStore.getActiveGroup || 'global'
          loanPath = `${props.dbRef}/${groupId}`
        }

        if (whatTask == 'Save') {
          saveData(loanPath, getLoanData, loanForm, 'Loan added successfully.')
        } else if (whatTask == 'Update') {
          if (!props.isPersonal) {
            const groupId = userStore.getActiveGroup || 'global'
            createUpdateRequest(`${props.dbRef}/${groupId}/${props.row.id}`)
          } else {
            updateData(
              `${loanPath}/${props.row.id}`,
              getLoanData,
              `Loan record with ID ${props.row.id} updated successfully`
            )
            emit('closeModal')
          }
        } else if (whatTask == 'Delete') {
          if (!props.isPersonal) {
            const groupId = userStore.getActiveGroup || 'global'
            createDeleteRequest(`${props.dbRef}/${groupId}/${props.row.id}`)
          } else {
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

  const createUpdateRequest = (loanPath) => {
    const activeUser = userStore.getActiveUser
    const userName = userStore.getUserByMobile(activeUser)?.name || activeUser

    const updateRequest = {
      changes: getLoanData(),
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

  function getLoanData() {
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
      whenAdded: new Date().toLocaleString('en-PK')
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
    validateForm
  }
}
