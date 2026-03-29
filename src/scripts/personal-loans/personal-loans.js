import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onValue, off } from '../../firebase'
import useFireBase from '../../api/firebase-apis'
import { useAuthStore } from '../../stores/authStore'
import { DB_NODES } from '../../constants/db-nodes'
import { useUserStore } from '../../stores/userStore'
import { useDataStore } from '../../stores/dataStore'
import getCurrentMonth from '../../utils/getCurrentMonth'
import { showError } from '../../utils/showAlerts'
import { formatUserDisplay } from '../../utils/user-display'

export const PersonalLoans = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef, readShallow } = useFireBase()
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
    if (selectedMonth.value && selectedMonth.value !== 'All') query.month = selectedMonth.value
    if (selectedGiver.value && selectedGiver.value !== 'All') query.giver = selectedGiver.value
    router.replace({ path: route.path, query })
  })

  const closeLoanForm = () => {
    showLoanForm.value = !showLoanForm.value
  }

  let loansListener = null
  let currentLoansRef = null
  const isContentLoading = computed(
    () => !monthsLoaded.value || !loansLoaded.value
  )

  const activeUser = computed(() => authStore.getActiveUser)

  const fetchMonths = async () => {
    monthsLoaded.value = false
    try {
      const keys = await readShallow(
        `${DB_NODES.PERSONAL_LOANS}/${activeUser.value}`
      )
      months.value = keys.sort((a, b) => b.localeCompare(a))

      if (months.value.length && selectedMonth.value === 'All') {
        const currentMonthFormatted = getCurrentMonth()
        selectedMonth.value = months.value.includes(currentMonthFormatted)
          ? currentMonthFormatted
          : months.value[0]
      }
    } catch (error) {
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
      off(currentLoansRef, 'value', loansListener)
    }

    if (selectedMonth.value === 'All') {
      const allLoansRef = dbRef(basePath)

      const handleAll = (snapshot) => {
        loansLoaded.value = true
        if (!snapshot.exists()) {
          loans.value = []
          loanKeys.value = []
          return
        }

        const data = snapshot.val()
        const allLoans = []
        const allKeys = []

        Object.keys(data).forEach((month) => {
          if (data[month] && typeof data[month] === 'object') {
            Object.keys(data[month]).forEach((loanId) => {
              const loan = data[month][loanId]
              if (loan && loan.amount) {
                allLoans.push(loan)
                allKeys.push(`${month}/${loanId}`)
              }
            })
          }
        })

        loans.value = allLoans
        loanKeys.value = allKeys
      }
      loansListener = handleAll
      currentLoansRef = allLoansRef
      onValue(allLoansRef, handleAll, () => {
        loansLoaded.value = true
      })
    } else {
      const monthPath = `${basePath}/${selectedMonth.value}`
      const monthLoansRef = dbRef(monthPath)

      const handleMonth = (snapshot) => {
        loansLoaded.value = true
        if (!snapshot.exists()) {
          loans.value = []
          loanKeys.value = []
          return
        }

        const data = snapshot.val()
        const loansArray = []
        const keysArray = []

        Object.keys(data).forEach((loanId) => {
          const loan = data[loanId]
          if (loan && loan.amount) {
            loansArray.push(loan)
            keysArray.push(loanId)
          }
        })

        loans.value = loansArray
        loanKeys.value = keysArray
      }
      loansListener = handleMonth
      currentLoansRef = monthLoansRef
      onValue(monthLoansRef, handleMonth, () => {
        loansLoaded.value = true
      })
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
    if (loansListener && currentLoansRef) {
      off(currentLoansRef, 'value', loansListener)
    }
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
