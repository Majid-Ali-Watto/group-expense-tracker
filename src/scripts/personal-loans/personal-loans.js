import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onSnapshot } from '@/firebase'
import { useLoadingTimeout } from '@/composables/useLoadingTimeout'
import { loadMonthsList } from '@/composables/useMonthsLoader'
import { useRouteQuerySync } from '@/composables/useRouteQuerySync'
import useFireBase from '@/composables/useFirebase'
import { useAuthStore, useUserStore, useDataStore } from '@/stores'
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
import {
  createUserDisplayStoreProxy,
  formatUserDisplay
} from '@/utils/user-display'

export const PersonalLoans = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef, read, readShallow } = useFireBase()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const dataStore = useDataStore()

  const storeProxy = createUserDisplayStoreProxy(authStore, userStore)
  const route = useRoute()
  const router = useRouter()
  const loans = ref([])
  const loanKeys = ref([])
  const loanContent = ref(null)
  const selectedMonth = ref(route.query.month || 'All')
  const selectedGiver = ref(route.query.giver || 'All')
  const selectedCategory = ref(route.query.category || '')
  const months = ref([])
  const showLoanForm = ref(false)
  const monthsLoaded = ref(false)
  const loansLoaded = ref(false)

  useRouteQuerySync({
    route,
    router,
    sources: [selectedMonth, selectedGiver, selectedCategory],
    buildQuery: () => {
      const query = {}
      if (selectedMonth.value && selectedMonth.value !== 'All')
        query.month = selectedMonth.value
      if (selectedGiver.value && selectedGiver.value !== 'All')
        query.giver = selectedGiver.value
      if (selectedCategory.value) query.category = selectedCategory.value
      return query
    }
  })

  const closeLoanForm = () => {
    showLoanForm.value = !showLoanForm.value
  }

  let loansListener = null
  let currentLoansRef = null
  let _readAllGeneration = 0
  const isContentLoading = computed(
    () => !monthsLoaded.value || !loansLoaded.value
  )
  const { startLoadingTimeout, clearLoadingTimeout } = useLoadingTimeout([
    monthsLoaded,
    loansLoaded
  ])

  const activeUser = computed(() => authStore.getActiveUser)

  const fetchMonths = async () => {
    return loadMonthsList({
      isEnabled: () => !!activeUser.value,
      parentPath: `${DB_NODES.PERSONAL_LOANS}/${activeUser.value}`,
      monthsPath: `${DB_NODES.PERSONAL_LOANS}/${activeUser.value}/months`,
      read,
      readShallow,
      monthsRef: months,
      loadedRef: monthsLoaded,
      errorHandler: (error) => {
        showError('Failed to load months. Please try again.')
        console.error(error)
      },
      onResolved: (resolvedMonths) => {
        if (resolvedMonths.length && selectedMonth.value === 'All') {
          const currentMonthFormatted = getCurrentMonth()
          selectedMonth.value = resolvedMonths.includes(currentMonthFormatted)
            ? currentMonthFormatted
            : resolvedMonths[0]
        }
      }
    })
  }

  const fetchLoans = () => {
    const basePath = `${DB_NODES.PERSONAL_LOANS}/${activeUser.value}`
    loansLoaded.value = false

    if (loansListener && currentLoansRef) {
      currentLoansRef()
      currentLoansRef = null
      loansListener = null
    }

    if (selectedMonth.value === 'All') {
      // Listen on the months collection to aggregate all loans
      const allMonthsRef = dbRef(`${basePath}/months`)

      const unsubscribe = onSnapshot(
        allMonthsRef,
        () => {
          // Re-read all months and aggregate (simplified for the All view)
          // Since onSnapshot on a collection only gives the month docs (no loans),
          // we subscribe per-month. For the "All" view we do a single broad listen.
        },
        () => {
          loansLoaded.value = true
        }
      )
      // For "All months" view, listen on the parent path broadly
      // We must listen at the collection level and aggregate subcollection data
      // which requires multiple listeners. Simplify by reading once eagerly.
      unsubscribe()

      // Eager read for All: use getDocs per month
      _readAllGeneration++
      readAllLoans(basePath, _readAllGeneration)
    } else {
      const monthPath = `${basePath}/months/${selectedMonth.value}/loans`
      const cached = getCache(monthPath)
      if (cached) {
        applyCollectionState(cached, {
          listRef: loans,
          keysRef: loanKeys,
          loadedRef: loansLoaded
        })
      } else {
        loansLoaded.value = false
      }
      const monthLoansRef = dbRef(monthPath)

      const unsubscribe = onSnapshot(
        monthLoansRef,
        (snapshot) => {
          const state = snapshot.empty
            ? buildEmptyCollectionState()
            : buildSnapshotCollectionState(snapshot, {
                includeItem: (item) => !!item.amount
              })

          setCache(monthPath, state)
          applyCollectionState(state, {
            listRef: loans,
            keysRef: loanKeys,
            loadedRef: loansLoaded
          })
        },
        () => {
          loansLoaded.value = true
        }
      )
      loansListener = unsubscribe
      currentLoansRef = unsubscribe
    }
  }

  async function readAllLoans(basePath, generation) {
    const allCacheKey = `${basePath}/months/__all__`
    const cached = getCache(allCacheKey)
    if (cached) {
      loans.value = cached.list
      loanKeys.value = cached.keys
      loansLoaded.value = true
      return
    }
    loansLoaded.value = false
    try {
      // Read all month document IDs first
      const monthIds = await readShallow(`${basePath}/months`)
      // Bail out if a newer call has been issued (race condition guard)
      if (generation !== _readAllGeneration) return
      const allLoans = []
      const allKeys = []
      for (const monthId of monthIds) {
        const monthLoans = await read(
          `${basePath}/months/${monthId}/loans`,
          false
        )
        if (generation !== _readAllGeneration) return
        if (monthLoans) {
          Object.entries(monthLoans).forEach(([loanId, loan]) => {
            if (loan && loan.amount) {
              // Embed _month so table.js can build the correct Firestore path
              allLoans.push({ ...loan, _month: monthId })
              allKeys.push(loanId)
            }
          })
        }
      }
      loans.value = allLoans
      loanKeys.value = allKeys
      setCache(allCacheKey, { list: allLoans, keys: allKeys })
    } catch (error) {
      // Ignore permission errors that fire after logout — Firebase revokes the
      // auth token before reads complete (on component unmount).
      if (authStore.getActiveUser) {
        showError('Failed to load loans. Please try again.')
        console.error(error)
      }
    } finally {
      if (generation === _readAllGeneration) loansLoaded.value = true
    }
  }

  watch(selectedMonth, () => {
    fetchLoans()
  })

  watch(activeUser, () => {
    fetchMonths()
    fetchLoans()
  })

  onMounted(() => {
    fetchMonths()
    fetchLoans()
    startLoadingTimeout()

    setTimeout(() => {
      dataStore.setLoansRef(loanContent.value)
    }, 1000)
  })

  onUnmounted(() => {
    clearLoadingTimeout()
    if (loansListener) loansListener()
  })

  const giverOptions = computed(() => {
    const seen = new Set()
    const options = []
    loans.value.forEach((loan) => {
      if (loan.loanGiver && !seen.has(loan.loanGiver)) {
        seen.add(loan.loanGiver)
        options.push({
          mobile: loan.loanGiver,
          name: formatUserDisplay(storeProxy, loan.loanGiver, {
            name: loan.giverName
          })
        })
      }
    })
    return options.sort((a, b) => a.name.localeCompare(b.name))
  })

  const filteredLoans = computed(() => {
    return loans.value.filter((loan) => {
      if (
        selectedGiver.value !== 'All' &&
        loan.loanGiver !== selectedGiver.value
      ) {
        return false
      }
      if (selectedCategory.value && loan.category !== selectedCategory.value) {
        return false
      }
      return true
    })
  })
  const categoryOptions = computed(() =>
    buildCategoryFilterOptions(loans.value.map((loan) => loan.category))
  )

  const totalLending = computed(() => {
    return filteredLoans.value.reduce((total, loan) => {
      if (loan.loanGiver === activeUser.value) {
        return total + Number(loan.amount || 0)
      }
      return total
    }, 0)
  })

  const totalDebting = computed(() => {
    return filteredLoans.value.reduce((total, loan) => {
      if (loan.loanReceiver === activeUser.value) {
        return total + Number(loan.amount || 0)
      }
      return total
    }, 0)
  })

  const netPosition = computed(() => {
    return totalLending.value - totalDebting.value
  })

  const pairwiseSettlements = computed(() => {
    const pairMap = {}
    const nameMap = {}

    filteredLoans.value.forEach((loan) => {
      const { loanGiver, giverName, loanReceiver, receiverName, amount } = loan
      if (!loanGiver || !loanReceiver || !amount) return

      nameMap[loanGiver] = formatUserDisplay(storeProxy, loanGiver, {
        name: giverName
      })
      nameMap[loanReceiver] = formatUserDisplay(storeProxy, loanReceiver, {
        name: receiverName
      })

      const v = Number(amount)
      // Canonical key: always sort mobiles lexicographically so each pair has one stable key
      const [first, second] = [loanGiver, loanReceiver].sort()
      const key = `${first}__${second}`

      if (!pairMap[key]) {
        pairMap[key] = {
          first,
          second,
          firstGaveToSecond: 0,
          secondGaveToFirst: 0
        }
      }

      if (loanGiver === first) {
        pairMap[key].firstGaveToSecond += v
      } else {
        pairMap[key].secondGaveToFirst += v
      }
    })

    const result = []

    Object.values(pairMap).forEach(
      ({ first, second, firstGaveToSecond, secondGaveToFirst }) => {
        const net = firstGaveToSecond - secondGaveToFirst
        if (net > 0) {
          // first lent more → second (debtor) owes first (lender)
          result.push({
            from: nameMap[second] || second,
            to: nameMap[first] || first,
            amount: net
          })
        } else if (net < 0) {
          // second lent more → first (debtor) owes second (lender)
          result.push({
            from: nameMap[first] || first,
            to: nameMap[second] || second,
            amount: Math.abs(net)
          })
        }
      }
    )

    return result
  })

  const clearFilters = () => {
    selectedMonth.value = 'All'
    selectedGiver.value = 'All'
    selectedCategory.value = ''
  }

  const filterFields = computed(() => [
    {
      key: 'month',
      label: 'Month',
      placeholder: 'Select Month',
      modelValue: selectedMonth.value,
      options: [{ label: 'All Months', value: 'All' }, ...months.value],
      onChange: (v) => {
        selectedMonth.value = v
        fetchLoans()
      }
    },
    {
      key: 'giver',
      label: 'Giver',
      placeholder: 'All Givers',
      modelValue: selectedGiver.value,
      options: [
        { label: 'All Givers', value: 'All' },
        ...giverOptions.value.map((o) => ({ label: o.name, value: o.mobile }))
      ],
      onChange: (v) => {
        selectedGiver.value = v
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
    loans,
    loanKeys,
    loanContent,
    selectedMonth,
    selectedGiver,
    selectedCategory,
    giverOptions,
    filteredLoans,
    months,
    categoryOptions,
    isContentLoading,
    showLoanForm,
    closeLoanForm,
    fetchLoans,
    totalLending,
    totalDebting,
    netPosition,
    pairwiseSettlements,
    filterFields,
    clearFilters
  }
}
