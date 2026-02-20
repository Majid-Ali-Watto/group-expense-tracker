import { ref, watch, computed } from 'vue'
import { store } from '../stores/store'
import getCurrentMonth from '../utils/getCurrentMonth'
import getWhoAddedTransaction from '../utils/whoAdded'
import useFireBase from '../api/firebase-apis'

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
    },
    { immediate: true, deep: true }
  )

  const validateForm = async (whatTask = 'Save', _childRef) => {
    // Wait for form ref to be available with retries
    let retries = 0
    while (!expenseForm.value && retries < 30) {
      await new Promise(resolve => setTimeout(resolve, 50))
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
        if (whatTask == 'Save') {
          saveData(
            `expenses/${activeUser.value}/${getCurrentMonth()}`,
            getExpenseData,
            expenseForm,
            'Expense added successfully!'
          )
        } else if (whatTask == 'Update') {
          updateData(
            `expenses/${activeUser.value}/${selectedMonth.value}/${props.row.id}`,
            getExpenseData,
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

  function getExpenseData() {
    return {
      amount: form.value?.amount,
      description: form.value?.description,
      location: form.value?.location,
      recipient: form.value?.recipient,
      month: getCurrentMonth(),
      whoAdded: getWhoAddedTransaction(),
      date: new Date().toLocaleString('en-PK'),
      whenAdded: new Date().toLocaleString('en-PK')
    }
  }

  return {
    isVisible,
    isEditMode,
    form,
    expenseForm,
    validateForm
  }
}
