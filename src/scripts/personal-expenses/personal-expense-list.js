import { computed, inject, ref, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onSnapshot, auth, onAuthStateChanged } from '@/firebase'
import { useAuthStore, useDataStore } from '@/stores'
import {
  getCurrentMonth,
  showError,
  getCache,
  setCache,
  buildCategoryFilterOptions
} from '@/utils'
import { useFireBase } from '@/composables'
import { DB_NODES } from '@/constants'

export const PersonalExpenseList = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef, read, readShallow } = useFireBase()
  const authStore = useAuthStore()
  const dataStore = useDataStore()

  const activeUser = computed(() => authStore.getActiveUser)
  const route = useRoute()
  const router = useRouter()
  const selectedMonth = ref(route.query.month || getCurrentMonth())
  const selectedCategory = ref(route.query.category || '')
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
    if (!activeUser.value) {
      monthsLoaded.value = true
      return
    }
    const monthsPath = `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months`
    const cached = getCache(monthsPath)
    if (cached) {
      months.value = cached
      monthsLoaded.value = true
      return
    }
    try {
      // Fast path: read months[] array recorded on the grandparent document
      const parentDoc = await read(
        `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}`,
        false
      )
      if (parentDoc?.months?.length) {
        months.value = [...parentDoc.months].sort((a, b) => b.localeCompare(a))
      } else {
        months.value = await readShallow(monthsPath, false)
      }
      setCache(monthsPath, months.value)
    } catch (error) {
      if (error?.code === 'permission-denied') return
      showError('Failed to load months. Please try again.')
      console.error(error)
    } finally {
      monthsLoaded.value = true
    }
  }

  const fetchSalary = () => {
    salaryLoaded.value = false
    if (!activeUser.value) {
      salaryLoaded.value = true
      return
    }
    const salaryPath = `${DB_NODES.SALARIES}/${activeUser.value}/months/${selectedMonth.value}`
    const cached = getCache(salaryPath)
    if (cached !== null) {
      salary.value = cached
      salaryLoaded.value = true
      updateRemaining()
    } else {
      salaryLoaded.value = false
    }
    const salaryRef = dbRef(salaryPath)
    if (salaryListener) {
      salaryListener()
      salaryListener = null
    }

    salaryListener = onSnapshot(
      salaryRef,
      (snapshot) => {
        salaryLoaded.value = true
        salary.value = snapshot.exists() ? snapshot.data().salary || 0 : 0
        setCache(salaryPath, salary.value)
        updateRemaining()
      },
      (error) => {
        salaryLoaded.value = true
        if (activeUser.value) {
          showError('Failed to load salary. Please try again.')
          console.error(error)
        }
      }
    )
  }

  const fetchExpenses = () => {
    expensesLoaded.value = false
    if (!activeUser.value) {
      expensesLoaded.value = true
      return
    }
    const expensesPath = `${DB_NODES.PERSONAL_EXPENSES}/${activeUser.value}/months/${selectedMonth.value}/expenses`
    const cached = getCache(expensesPath)
    if (cached) {
      expenses.value = cached.list
      keys.value = cached.keys
      totalSpent.value = expenses.value.reduce((t, e) => t + (e.amount || 0), 0)
      expensesLoaded.value = true
      updateRemaining()
    } else {
      expensesLoaded.value = false
    }
    const expensesRef = dbRef(expensesPath)
    if (expensesListener) {
      expensesListener()
      expensesListener = null
    }

    expensesListener = onSnapshot(
      expensesRef,
      (snapshot) => {
        expensesLoaded.value = true
        if (!snapshot.empty) {
          expenses.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          keys.value = snapshot.docs.map((d) => d.id)
          totalSpent.value = expenses.value.reduce(
            (total, expense) => total + (expense.amount || 0),
            0
          )
          setCache(expensesPath, { list: expenses.value, keys: keys.value })
        } else {
          expenses.value = []
          keys.value = []
          totalSpent.value = 0
          setCache(expensesPath, { list: [], keys: [] })
        }
        updateRemaining()
      },
      (error) => {
        expensesLoaded.value = true
        if (activeUser.value) {
          showError('Failed to load expenses. Please try again.')
          console.error(error)
        }
      }
    )
  }

  const updateRemaining = () => {
    remaining.value = salary.value - totalSpent.value
  }
  const filteredExpenses = computed(() => {
    if (!selectedCategory.value) return expenses.value
    return expenses.value.filter(
      (expense) => expense.category === selectedCategory.value
    )
  })
  const categoryOptions = computed(() =>
    buildCategoryFilterOptions(expenses.value.map((expense) => expense.category))
  )

  watch(selectedMonth, () => {
    dataStore.setCurrentMonth(selectedMonth.value)
    fetchSalary()
    fetchExpenses()
  })

  watch([selectedMonth, selectedCategory], () => {
    // Sync to URL so the selected month is bookmarkable
    const query = {}
    if (selectedMonth.value !== getCurrentMonth())
      query.month = selectedMonth.value
    if (selectedCategory.value) query.category = selectedCategory.value
    router.replace({ path: route.path, query })
  })

  onUnmounted(() => {
    if (unsubscribeAuth) unsubscribeAuth()
    if (loadingTimeout) clearTimeout(loadingTimeout)
    if (salaryListener) salaryListener()
    if (expensesListener) expensesListener()
  })

  let loadingTimeout = null
  let unsubscribeAuth = null
  onMounted(() => {
    loadingTimeout = setTimeout(() => {
      monthsLoaded.value = true
      salaryLoaded.value = true
      expensesLoaded.value = true
    }, 8000)

    unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) return
      unsubscribeAuth?.()
      unsubscribeAuth = null
      fetchMonths()
      fetchSalary()
      fetchExpenses()
    })

    setTimeout(() => {
      dataStore.setSalaryRef(content.value)
    }, 1000)
  })

  return {
    formatAmount,
    selectedMonth,
    selectedCategory,
    expenses,
    filteredExpenses,
    keys,
    totalSpent,
    remaining,
    months,
    categoryOptions,
    content,
    isContentLoading,
    fetchExpenses,
    clearFilters: () => {
      selectedMonth.value = getCurrentMonth()
      selectedCategory.value = ''
    }
  }
}
