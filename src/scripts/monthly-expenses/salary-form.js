import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { onSnapshot } from '../../firebase'
import getCurrentMonth from '../../utils/getCurrentMonth'
import useFireBase from '../../api/firebase-apis'
import { useAuthStore } from '../../stores/authStore'
import { DB_NODES } from '../../constants/db-nodes'
import { useDataStore } from '../../stores/dataStore'
import { showError, showSuccess } from '../../utils/showAlerts'

export const SalaryForm = () => {
  const formatAmount = inject('formatAmount')
  const authStore = useAuthStore()
  const dataStore = useDataStore()
  const { read, dbRef, setData, updateData } = useFireBase()
  const selectedMonth = ref(dataStore.selectedMonth)

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
  const isSubmitting = ref(false)
  let salaryListener = null

  const activeUser = computed(() => authStore.getActiveUser)

  watch(
    () => dataStore.selectedMonth,
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
    if (isSubmitting.value) return
    const formValid = await validateForm()
    if (!formValid) return

    isSubmitting.value = true
    try {
      await setData(
        `${DB_NODES.SALARIES}/${activeUser.value}/months/${selectedMonth.value}`,
        { salary: form.value.salary, month: getCurrentMonth() }
      )
      form.value.salary = null
      showSuccess('Salary added successfully!')
    } catch {
      showError('Failed to add salary. Please try again.')
    } finally {
      isSubmitting.value = false
    }
  }

  const updateSalary = async () => {
    if (isSubmitting.value) return
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

      isSubmitting.value = true
      const data = await read(
        `${DB_NODES.SALARIES}/${activeUser.value}/months/${selectedMonth.value}`
      )

      if (data) {
        await updateData(
          `${DB_NODES.SALARIES}/${activeUser.value}/months/${selectedMonth.value}`,
          () => ({ salary: form.value.salary }),
          'Salary updated successfully!'
        )
        form.value.salary = null
      } else {
        throw new Error('No existing salary to update for this month.')
      }
    } catch (error) {
      if (error !== 'cancel') {
        showError(error.message || 'An unexpected error occurred.')
      }
    } finally {
      isSubmitting.value = false
    }
  }

  const listenForSalaryChanges = () => {
    if (salaryListener) {
      salaryListener()
      salaryListener = null
    }
    if (!activeUser.value) return
    const monthRef = dbRef(
      `${DB_NODES.SALARIES}/${activeUser.value}/months/${selectedMonth.value}`
    )

    salaryListener = onSnapshot(
      monthRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          salaryData.value.salary = data.salary
          salaryData.value.month = data.month
          form.value.salary = data.salary
        } else {
          salaryData.value.salary = null
          salaryData.value.month = null
          form.value.salary = null
        }
      },
      (error) => {
        if (error?.code !== 'permission-denied') {
          showError('Failed to load salary data. Please try again.')
        }
        console.error('Salary listener error:', error)
      }
    )
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

  watch(activeUser, (user) => {
    if (user) listenForSalaryChanges()
  })

  onUnmounted(() => {
    if (salaryListener) salaryListener()
  })

  return {
    formatAmount,
    salaryData,
    form,
    salaryForm,
    isSaveEnbl,
    isUpdateEnbl,
    addSalary,
    updateSalary,
    isSubmitting
  }
}
