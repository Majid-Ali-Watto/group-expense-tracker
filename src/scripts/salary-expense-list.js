import { inject, ref, onMounted, watch, onUnmounted } from 'vue'
import { onValue, off } from '../firebase'
import { store } from '../stores/store'
import getCurrentMonth from '../utils/getCurrentMonth'
import { showError } from '../utils/showAlerts'
import useFireBase from '../api/firebase-apis'

export const SalaryExpenseList = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef } = useFireBase()
  const userStore = store()

  const activeUser = ref(userStore.activeUser)
  const selectedMonth = ref(getCurrentMonth())
  const expenses = ref([])
  const keys = ref([])
  const totalSpent = ref(0)
  const remaining = ref(0)
  const salary = ref(0)
  const months = ref([])
  const content = ref(null)

  let expensesListener = null
  let salaryListener = null

  const fetchMonths = () => {
    const monthsRef = dbRef(`expenses/${activeUser.value}`)
    onValue(
      monthsRef,
      (snapshot) => {
        months.value = snapshot.exists() ? Object.keys(snapshot.val()) : []
      },
      (error) => {
        showError('Failed to load months. Please try again.')
        console.error(error)
      }
    )
  }

  const fetchSalary = () => {
    const salaryRef = dbRef(
      `salaries/${activeUser.value}/${selectedMonth.value}`
    )
    if (salaryListener) off(salaryRef, 'value', salaryListener)

    salaryListener = onValue(
      salaryRef,
      (snapshot) => {
        salary.value = snapshot.exists() ? snapshot.val().salary || 0 : 0
        updateRemaining()
      },
      (error) => {
        showError('Failed to load salary. Please try again.')
        console.error(error)
      }
    )
  }

  const fetchExpenses = () => {
    const expensesRef = dbRef(
      `expenses/${activeUser.value}/${selectedMonth.value}`
    )
    if (expensesListener) off(expensesRef, 'value', expensesListener)

    expensesListener = onValue(
      expensesRef,
      (snapshot) => {
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
        showError('Failed to load expenses. Please try again.')
        console.error(error)
      }
    )
  }

  const updateRemaining = () => {
    remaining.value = salary.value - totalSpent.value
  }

  watch(selectedMonth, () => {
    userStore.setCurrentMonth(selectedMonth.value)
    fetchSalary()
    fetchExpenses()
  })

  onUnmounted(() => {
    if (salaryListener)
      off(
        dbRef(`salaries/${activeUser.value}/${selectedMonth.value}`),
        'value',
        salaryListener
      )
    if (expensesListener)
      off(
        dbRef(`expenses/${activeUser.value}/${selectedMonth.value}`),
        'value',
        expensesListener
      )
  })

  onMounted(() => {
    fetchMonths()
    fetchSalary()
    fetchExpenses()

    setTimeout(() => {
      userStore.setSalaryRef(content.value)
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
    fetchExpenses
  }
}
