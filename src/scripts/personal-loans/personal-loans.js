import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
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
  const loans = ref([])
  const loanKeys = ref([])
  const loanContent = ref(null)
  const selectedMonth = ref('All')
  const selectedGiver = ref('All')
  const months = ref([])
  const showLoanForm = ref(false)

  const closeLoanForm = () => {
    showLoanForm.value = !showLoanForm.value
  }

  let loansListener = null
  let currentLoansRef = null

  const activeUser = computed(() => authStore.getActiveUser)

  const fetchMonths = async () => {
    try {
      const keys = await readShallow(`${DB_NODES.PERSONAL_LOANS}/${activeUser.value}`)
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
    }
  }

  const fetchLoans = () => {
    const basePath = `${DB_NODES.PERSONAL_LOANS}/${activeUser.value}`

    if (loansListener && currentLoansRef) {
      off(currentLoansRef, 'value', loansListener)
    }

    if (selectedMonth.value === 'All') {
      const allLoansRef = dbRef(basePath)

      const handleAll = (snapshot) => {
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
      onValue(allLoansRef, handleAll)
    } else {
      const monthPath = `${basePath}/${selectedMonth.value}`
      const monthLoansRef = dbRef(monthPath)

      const handleMonth = (snapshot) => {
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
      onValue(monthLoansRef, handleMonth)
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

    setTimeout(() => {
      dataStore.setLoansRef(loanContent.value)
    }, 1000)
  })

  onUnmounted(() => {
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
    showLoanForm,
    closeLoanForm,
    fetchLoans,
    totalLending,
    totalDebting,
    netPosition,
    pairwiseSettlements
  }
}
