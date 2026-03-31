import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onSnapshot } from '@/firebase'
import { useFireBase } from '@/composables'
import { useAuthStore, useUserStore, useDataStore } from '@/stores'
import { DB_NODES } from '@/constants'
import {
  getCurrentMonth,
  showError,
  formatUserDisplay,
  getCache,
  setCache
} from '@/utils'

export const PersonalLoans = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef, read, readShallow } = useFireBase()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const dataStore = useDataStore()

  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const route = useRoute()
  const router = useRouter()
  const loans = ref([])
  const loanKeys = ref([])
  const loanContent = ref(null)
  const selectedMonth = ref(route.query.month || 'All')
  const selectedGiver = ref(route.query.giver || 'All')
  const months = ref([])
  const showLoanForm = ref(false)
  const monthsLoaded = ref(false)
  const loansLoaded = ref(false)

  // Sync filters to URL so they are bookmarkable and shareable
  watch([selectedMonth, selectedGiver], () => {
    const query = {}
    if (selectedMonth.value && selectedMonth.value !== 'All')
      query.month = selectedMonth.value
    if (selectedGiver.value && selectedGiver.value !== 'All')
      query.giver = selectedGiver.value
    router.replace({ path: route.path, query })
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

  const activeUser = computed(() => authStore.getActiveUser)

  const fetchMonths = async () => {
    if (!activeUser.value) {
      monthsLoaded.value = true
      return
    }
    const monthsPath = `${DB_NODES.PERSONAL_LOANS}/${activeUser.value}/months`
    const cached = getCache(monthsPath)
    if (cached) {
      months.value = cached
      monthsLoaded.value = true
      return
    }
    monthsLoaded.value = false
    try {
      // Fast path: read months[] array recorded on the grandparent document
      const parentDoc = await read(
        `${DB_NODES.PERSONAL_LOANS}/${activeUser.value}`,
        false
      )
      if (parentDoc?.months?.length) {
        months.value = [...parentDoc.months].sort((a, b) => b.localeCompare(a))
      } else {
        const keys = await readShallow(monthsPath, false)
        months.value = keys.sort((a, b) => b.localeCompare(a))
      }
      setCache(monthsPath, months.value)

      if (months.value.length && selectedMonth.value === 'All') {
        const currentMonthFormatted = getCurrentMonth()
        selectedMonth.value = months.value.includes(currentMonthFormatted)
          ? currentMonthFormatted
          : months.value[0]
      }
    } catch (error) {
      if (error?.code === 'permission-denied') return
      showError('Failed to load months. Please try again.')
      console.error(error)
    } finally {
      monthsLoaded.value = true
    }
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
        loans.value = cached.list
        loanKeys.value = cached.keys
        loansLoaded.value = true
      } else {
        loansLoaded.value = false
      }
      const monthLoansRef = dbRef(monthPath)

      const unsubscribe = onSnapshot(
        monthLoansRef,
        (snapshot) => {
          loansLoaded.value = true
          if (!snapshot.empty) {
            const loansArray = []
            const keysArray = []
            snapshot.docs.forEach((docSnap) => {
              const loan = { id: docSnap.id, ...docSnap.data() }
              if (loan.amount) {
                loansArray.push(loan)
                keysArray.push(docSnap.id)
              }
            })
            loans.value = loansArray
            loanKeys.value = keysArray
            setCache(monthPath, { list: loansArray, keys: keysArray })
          } else {
            loans.value = []
            loanKeys.value = []
            setCache(monthPath, { list: [], keys: [] })
          }
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
        const { read } = useFireBase()
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
      showError('Failed to load loans. Please try again.')
      console.error(error)
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

  let loadingTimeout = null
  onMounted(() => {
    fetchMonths()
    fetchLoans()
    loadingTimeout = setTimeout(() => {
      monthsLoaded.value = true
      loansLoaded.value = true
    }, 8000)

    setTimeout(() => {
      dataStore.setLoansRef(loanContent.value)
    }, 1000)
  })

  onUnmounted(() => {
    if (loadingTimeout) clearTimeout(loadingTimeout)
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
    if (selectedGiver.value === 'All') return loans.value
    return loans.value.filter((loan) => loan.loanGiver === selectedGiver.value)
  })

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

  return {
    formatAmount,
    loans,
    loanKeys,
    loanContent,
    selectedMonth,
    selectedGiver,
    giverOptions,
    filteredLoans,
    months,
    isContentLoading,
    showLoanForm,
    closeLoanForm,
    fetchLoans,
    totalLending,
    totalDebting,
    netPosition,
    pairwiseSettlements,
    clearFilters: () => {
      selectedMonth.value = 'All'
      selectedGiver.value = 'All'
    }
  }
}
