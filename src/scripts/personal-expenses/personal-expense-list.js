import { computed, inject, ref, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onSnapshot } from '@/firebase'
import { useAuthStore, useDataStore } from '@/stores'
import { useLoadingTimeout } from '@/composables/useLoadingTimeout'
import { loadMonthsList } from '@/composables/useMonthsLoader'
import { useRouteQuerySync } from '@/composables/useRouteQuerySync'
import useFireBase from '@/composables/useFirebase'
import { DB_NODES } from '@/constants'
import { buildCategoryFilterOptions } from '@/utils/category-options'
import {
  applyCollectionState,
  buildEmptyCollectionState,
  buildSnapshotCollectionState
} from '@/utils/firestoreCollectionState'
import getCurrentMonth from '@/utils/getCurrentMonth'
import { getCache, setCache } from '@/utils/queryCache'
import { showError } from '@/utils/showAlerts'

export const PersonalExpenseList = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef, read, readShallow } = useFireBase()
  const authStore = useAuthStore()
  const dataStore = useDataStore()

  const activeUserUid = computed(() => authStore.getActiveUserUid)
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
  const { startLoadingTimeout, clearLoadingTimeout } = useLoadingTimeout([
    monthsLoaded,
    salaryLoaded,
    expensesLoaded
  ])

  let expensesListener = null
  let salaryListener = null

  const stopDataListeners = () => {
    if (salaryListener) {
      salaryListener()
      salaryListener = null
    }
    if (expensesListener) {
      expensesListener()
      expensesListener = null
    }
  }

  const resetPersonalExpenseState = () => {
    stopDataListeners()
    months.value = []
    expenses.value = []
    keys.value = []
    totalSpent.value = 0
    remaining.value = 0
    salary.value = 0
    monthsLoaded.value = true
    salaryLoaded.value = true
    expensesLoaded.value = true
  }

  const fetchMonths = async () => {
    return loadMonthsList({
      isEnabled: () => !!activeUserUid.value,
      parentPath: `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}`,
      monthsPath: `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}/months`,
      read,
      readShallow,
      monthsRef: months,
      loadedRef: monthsLoaded,
      errorHandler: (error) => {
        showError('Failed to load months. Please try again.')
        console.error(error)
      },
      onResolved: (resolvedMonths) => {
        if (!resolvedMonths.length) return

        const currentMonthFormatted = getCurrentMonth()
        if (!resolvedMonths.includes(selectedMonth.value)) {
          selectedMonth.value = resolvedMonths.includes(currentMonthFormatted)
            ? currentMonthFormatted
            : resolvedMonths[0]
        }
      }
    })
  }

  const fetchSalary = () => {
    salaryLoaded.value = false
    if (!activeUserUid.value) {
      salaryLoaded.value = true
      return
    }
    const salaryPath = `${DB_NODES.SALARIES}/${activeUserUid.value}/months/${selectedMonth.value}`
    const cached = getCache(salaryPath)
    if (cached !== null) {
      salary.value = cached
      salaryLoaded.value = true
      updateRemaining()
    } else {
      salaryLoaded.value = false
    }
    const salaryRef = dbRef(salaryPath)
    if (salaryListener) salaryListener()

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
        if (activeUserUid.value) {
          showError('Failed to load salary. Please try again.')
          console.error(error)
        }
      }
    )
  }

  const fetchExpenses = () => {
    expensesLoaded.value = false
    if (!activeUserUid.value) {
      expensesLoaded.value = true
      return
    }
    const expensesPath = `${DB_NODES.PERSONAL_EXPENSES}/${activeUserUid.value}/months/${selectedMonth.value}/expenses`
    const cached = getCache(expensesPath)
    if (cached) {
      applyCollectionState(cached, {
        listRef: expenses,
        keysRef: keys,
        loadedRef: expensesLoaded,
        afterApply: () => {
          totalSpent.value = expenses.value.reduce(
            (total, expense) => total + (expense.amount || 0),
            0
          )
          updateRemaining()
        }
      })
    } else {
      expensesLoaded.value = false
    }
    const expensesRef = dbRef(expensesPath)
    if (expensesListener) expensesListener()

    expensesListener = onSnapshot(
      expensesRef,
      (snapshot) => {
        const state = snapshot.empty
          ? buildEmptyCollectionState()
          : buildSnapshotCollectionState(snapshot)

        setCache(expensesPath, state)
        applyCollectionState(state, {
          listRef: expenses,
          keysRef: keys,
          loadedRef: expensesLoaded,
          afterApply: () => {
            totalSpent.value = expenses.value.reduce(
              (total, expense) => total + (expense.amount || 0),
              0
            )
            updateRemaining()
          }
        })
      },
      (error) => {
        expensesLoaded.value = true
        if (activeUserUid.value) {
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
    buildCategoryFilterOptions(
      expenses.value.map((expense) => expense.category)
    )
  )

  watch(selectedMonth, () => {
    dataStore.setCurrentMonth(selectedMonth.value)
    fetchSalary()
    fetchExpenses()
  })

  watch(
    activeUserUid,
    async (userUid) => {
      if (!userUid) {
        resetPersonalExpenseState()
        return
      }

      await fetchMonths()
      dataStore.setCurrentMonth(selectedMonth.value)
      fetchSalary()
      fetchExpenses()
    },
    { immediate: true }
  )

  useRouteQuerySync({
    route,
    router,
    sources: [selectedMonth, selectedCategory],
    buildQuery: () => {
      const query = {}
      if (selectedMonth.value !== getCurrentMonth())
        query.month = selectedMonth.value
      if (selectedCategory.value) query.category = selectedCategory.value
      return query
    }
  })

  onUnmounted(() => {
    clearLoadingTimeout()
    stopDataListeners()
  })

  onMounted(() => {
    startLoadingTimeout()

    setTimeout(() => {
      dataStore.setSalaryRef(content.value)
    }, 1000)
  })

  const clearFilters = () => {
    selectedMonth.value = getCurrentMonth()
    selectedCategory.value = ''
  }

  const filterFields = computed(() => [
    {
      key: 'month',
      label: 'Month',
      placeholder: 'Select month',
      modelValue: selectedMonth.value,
      options: months.value,
      onChange: (v) => {
        selectedMonth.value = v
        fetchExpenses()
      }
    },
    {
      key: 'category',
      label: 'Category',
      placeholder: 'All Categories',
      modelValue: selectedCategory.value,
      options: categoryOptions.value,
      onChange: (v) => {
        selectedCategory.value = v
      }
    }
  ])

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
    filterFields,
    clearFilters
  }
}
