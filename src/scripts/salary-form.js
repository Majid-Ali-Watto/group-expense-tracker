import { ref, onMounted, onUnmounted, inject, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { set, update, onValue, off } from 'firebase/database'
import getCurrentMonth from '../utils/getCurrentMonth'
import useFireBase from '../api/firebase-apis'
import { store } from '../stores/store'
import { showError, showSuccess } from '../utils/showAlerts'

export const SalaryForm = () => {
  const formatAmount = inject('formatAmount')
  const userStore = store()
  const { read, dbRef } = useFireBase()
  const selectedMonth = ref(userStore.$state.selectedMonth)

  const salaryData = ref({
    month: null,
    salary: null
  })

  const form = ref({
    salary: null
  })
  const salaryForm = ref(null)
  const isSaveEnbl = ref(false)
  const isUpdateEnbl = ref(true)
  let salaryListener = null

  watch(
    () => userStore.$state.selectedMonth,
    (newMonth) => {
      selectedMonth.value = newMonth
      listenForSalaryChanges()
    }
  )

  watch(
    () => salaryData.value.salary,
    () => {
      isSaveEnbl.value = !!salaryData.value.salary
      isUpdateEnbl.value = !isSaveEnbl.value
    }
  )

  const addSalary = async () => {
    const formValid = await validateForm()
    if (!formValid) return

    try {
      const monthRef = dbRef(
        `salaries/${userStore.activeUser}/${selectedMonth.value}`
      )
      await set(monthRef, {
        salary: form.value.salary,
        month: getCurrentMonth()
      })

      form.value.salary = null
      showSuccess('Salary added successfully!')
    } catch {
      showError('Failed to add salary. Please try again.')
    }
  }

  const updateSalary = async () => {
    const formValid = await validateForm()
    if (!formValid) return

    try {
      await ElMessageBox.confirm(
        'Are you sure to update Salary. Continue?',
        'Warning',
        {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const monthRef = dbRef(
        `salaries/${userStore.activeUser}/${selectedMonth.value}`
      )
      const data = await read(
        `salaries/${userStore.activeUser}/${selectedMonth.value}`
      )

      if (data) {
        await update(monthRef, { salary: form.value.salary })

        form.value.salary = null
        showSuccess('Salary updated successfully!')
      } else {
        throw new Error('No existing salary to update for this month.')
      }
    } catch (error) {
      if (error !== 'cancel') {
        showError(error.message || 'An unexpected error occurred.')
      }
    }
  }

  const listenForSalaryChanges = () => {
    const monthRef = dbRef(
      `salaries/${userStore.activeUser}/${selectedMonth.value}`
    )

    salaryListener = onValue(monthRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()

        salaryData.value.salary = data.salary
        salaryData.value.month = data.month
        form.value.salary = data.salary
      } else {
        salaryData.value.salary = null
        salaryData.value.month = null
        form.value.salary = null
      }
    })
  }

  const validateForm = async () => {
    // Wait for form ref to be available with retries
    let retries = 0
    while (!salaryForm.value && retries < 30) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      retries++
    }

    if (!salaryForm.value) {
      console.error('Salary form reference is not available after retries')
      return false
    }

    let isValid = false
    await new Promise((resolve) => {
      salaryForm.value.validate((valid) => {
        isValid = valid
        resolve(valid)
      })
    })
    return isValid
  }

  onMounted(() => {
    listenForSalaryChanges()
  })

  onUnmounted(() => {
    if (salaryListener) {
      const monthRef = dbRef(
        `salaries/${userStore.activeUser}/${getCurrentMonth()}`
      )
      off(monthRef, 'value', salaryListener)
    }
  })

  return {
    formatAmount,
    salaryData,
    form,
    salaryForm,
    isSaveEnbl,
    isUpdateEnbl,
    addSalary,
    updateSalary
  }
}
