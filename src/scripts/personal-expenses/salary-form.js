import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { onSnapshot } from '@/firebase'
import { getCurrentMonth, showError, showSuccess } from '@/utils'
import { useFireBase, useUnsavedChangesGuard } from '@/composables'
import { useAuthStore, useDataStore } from '@/stores'
import { DB_NODES } from '@/constants'

const MONTH_OPTIONS = [
  { key: 'january', value: '01' },
  { key: 'february', value: '02' },
  { key: 'march', value: '03' },
  { key: 'april', value: '04' },
  { key: 'may', value: '05' },
  { key: 'june', value: '06' },
  { key: 'july', value: '07' },
  { key: 'august', value: '08' },
  { key: 'september', value: '09' },
  { key: 'october', value: '10' },
  { key: 'november', value: '11' },
  { key: 'december', value: '12' }
]

function parseMonthKey(monthKey) {
  const [year, month] = String(monthKey || getCurrentMonth()).split('-')
  return {
    year: year || String(new Date().getFullYear()),
    month: month || String(new Date().getMonth() + 1).padStart(2, '0')
  }
}

export const SalaryForm = () => {
  const formatAmount = inject('formatAmount')
  const { t } = useI18n()
  const authStore = useAuthStore()
  const dataStore = useDataStore()
  const { read, dbRef, setData, updateData } = useFireBase()
  const initialMonth = parseMonthKey(
    dataStore.selectedMonth || getCurrentMonth()
  )
  const selectedYear = ref(initialMonth.year)
  const selectedMonthValue = ref(initialMonth.month)

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

  const activeUserUid = computed(() => authStore.getActiveUserUid)
  const selectedMonth = computed(
    () => `${selectedYear.value}-${selectedMonthValue.value}`
  )
  const monthOptions = computed(() =>
    MONTH_OPTIONS.map((option) => ({
      label: t(`months.${option.key}`),
      value: option.value
    }))
  )
  const yearOptions = computed(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear + 5; year >= currentYear - 10; year -= 1) {
      years.push({ label: String(year), value: String(year) })
    }
    if (!years.some((option) => option.value === selectedYear.value)) {
      years.unshift({
        label: selectedYear.value,
        value: selectedYear.value
      })
    }
    return years
  })
  const isFormDirty = computed(
    () =>
      form.value.salary !== null &&
      form.value.salary !== salaryData.value.salary
  )

  useUnsavedChangesGuard(isFormDirty)

  const syncSelectorsFromMonth = (monthKey) => {
    const parsed = parseMonthKey(monthKey)
    selectedYear.value = parsed.year
    selectedMonthValue.value = parsed.month
  }

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
        `${DB_NODES.SALARIES}/${activeUserUid.value}/months/${selectedMonth.value}`,
        { salary: form.value.salary, month: selectedMonth.value }
      )
      form.value.salary = null
      showSuccess(t('personalExpenses.salaryAdded'))
    } catch {
      showError(t('personalExpenses.salaryAddFailed'))
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
        t('personalExpenses.salaryUpdateConfirm'),
        t('common.warning'),
        {
          confirmButtonText: t('common.ok'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )

      isSubmitting.value = true
      const data = await read(
        `${DB_NODES.SALARIES}/${activeUserUid.value}/months/${selectedMonth.value}`
      )

      if (data) {
        await updateData(
          `${DB_NODES.SALARIES}/${activeUserUid.value}/months/${selectedMonth.value}`,
          () => ({ salary: form.value.salary, month: selectedMonth.value }),
          t('personalExpenses.salaryUpdated')
        )
        form.value.salary = null
      } else {
        throw new Error(t('personalExpenses.noSalaryToUpdate'))
      }
    } catch (error) {
      if (error !== 'cancel') {
        showError(error.message || t('personalExpenses.unexpectedError'))
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
    if (!activeUserUid.value) return
    const monthRef = dbRef(
      `${DB_NODES.SALARIES}/${activeUserUid.value}/months/${selectedMonth.value}`
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
          showError(t('personalExpenses.failedLoadSalaryData'))
        }
        console.error('Salary listener error:', error)
      }
    )
  }

  watch(
    () => dataStore.selectedMonth,
    (newMonth) => {
      const targetMonth = newMonth || getCurrentMonth()
      if (targetMonth !== selectedMonth.value) {
        syncSelectorsFromMonth(targetMonth)
      }
    },
    { immediate: true }
  )

  watch(selectedMonth, (newMonth) => {
    if (dataStore.selectedMonth !== newMonth) {
      dataStore.setCurrentMonth(newMonth)
    }
    listenForSalaryChanges()
  })

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

  watch(activeUserUid, (user) => {
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
    selectedYear,
    selectedMonthValue,
    monthOptions,
    yearOptions,
    isSaveEnbl,
    isUpdateEnbl,
    addSalary,
    updateSalary,
    isSubmitting
  }
}
