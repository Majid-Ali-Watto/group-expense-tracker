import { computed, inject, ref, onMounted, watch, onUnmounted } from 'vue'
import { onValue, off } from '../../firebase'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import getCurrentMonth from '../../utils/getCurrentMonth'
import { showError } from '../../utils/showAlerts'
import useFireBase from '../../api/firebase-apis'
import { DB_NODES } from '../../constants/db-nodes'

export const SalaryExpenseList = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef, readShallow } = useFireBase()
  const authStore = useAuthStore()
  const dataStore = useDataStore()

  const activeUser = ref(authStore.activeUser)
  const selectedMonth = ref(getCurrentMonth())
  const expenses = ref([])
  const keys = ref([])
  const totalSpent = ref(0)
  const remaining = ref(0)
  const salary = ref(0)
  const months = ref([])
  const content = ref(null)
  const monthsLoaded = ref(false)
  const salaryLoaded = ref(false)
  const expensesLoaded = ref(false)
  const isContentLoading = computed(
    () => !monthsLoaded.value || !salaryLoaded.value || !expensesLoaded.value
  )

  let expensesListener = null
  let salaryListener = null

  const fetchMonths = async () => {
    monthsLoaded.value = false
    try {
      months.value = await readShallow(
        `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}`
      )
    } catch (error) {
      showError('Failed to load months. Please try again.')
      console.error(error)
    } finally {
      monthsLoaded.value = true
    }
  }

  const fetchSalary = () => {
    salaryLoaded.value = false
    const salaryRef = dbRef(
      `${DB_NODES.SALARIES}/${activeUser.value}/${selectedMonth.value}`
    )
    if (salaryListener) off(salaryRef, 'value', salaryListener)

    salaryListener = onValue(
      salaryRef,
      (snapshot) => {
        salaryLoaded.value = true
        salary.value = snapshot.exists() ? snapshot.val().salary || 0 : 0
        updateRemaining()
      },
      (error) => {
        salaryLoaded.value = true
        showError('Failed to load salary. Please try again.')
        console.error(error)
      }
    )
  }

  const fetchExpenses = () => {
    expensesLoaded.value = false
    const expensesRef = dbRef(
      `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/${selectedMonth.value}`
    )
    if (expensesListener) off(expensesRef, 'value', expensesListener)

    expensesListener = onValue(
      expensesRef,
      (snapshot) => {
        expensesLoaded.value = true
        if (snapshot.exists()) {
          const monthExpenses = snapshot.val()
          expenses.value = Object.values(monthExpenses)
          keys.value = Object.keys(monthExpenses)
          totalSpent.value = expenses.value.reduce(
            (total, expense) => total + (expense.amount || 0),
            0
          )
        } else {
          expenses.value = []
          totalSpent.value = 0
        }
        updateRemaining()
      },
      (error) => {
        expensesLoaded.value = true
        showError('Failed to load expenses. Please try again.')
        console.error(error)
      }
    )
  }

  const updateRemaining = () => {
    remaining.value = salary.value - totalSpent.value
  }

  watch(selectedMonth, () => {
    dataStore.setCurrentMonth(selectedMonth.value)
    fetchSalary()
    fetchExpenses()
  })

  onUnmounted(() => {
    if (loadingTimeout) clearTimeout(loadingTimeout)
    if (salaryListener)
      off(
        dbRef(
          `${DB_NODES.SALARIES}/${activeUser.value}/${selectedMonth.value}`
        ),
        'value',
        salaryListener
      )
    if (expensesListener)
      off(
        dbRef(
          `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/${selectedMonth.value}`
        ),
        'value',
        expensesListener
      )
  })

  let loadingTimeout = null
  onMounted(() => {
    fetchMonths()
    fetchSalary()
    fetchExpenses()
    loadingTimeout = setTimeout(() => {
      monthsLoaded.value = true
      salaryLoaded.value = true
      expensesLoaded.value = true
    }, 8000)

    setTimeout(() => {
      dataStore.setSalaryRef(content.value)
    }, 1000)
  })

  return {
    formatAmount,
    selectedMonth,
    expenses,
    keys,
    totalSpent,
    remaining,
    months,
    content,
    isContentLoading,
    fetchExpenses
  }
}
