import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { onValue, off } from '../firebase'
import useFireBase from '../api/firebase-apis'
import { store } from '../stores/store'
import getCurrentMonth from '../utils/getCurrentMonth'
import { showError } from '../utils/showAlerts'

export const PersonalLoans = () => {
  const formatAmount = inject('formatAmount')
  const { dbRef, readShallow } = useFireBase()
  const userStore = store()

  const loans = ref([])
  const loanKeys = ref([])
  const loanContent = ref(null)
  const selectedMonth = ref('All')
  const months = ref([])
  const showLoanForm = ref(false)

  const closeLoanForm = () => {
    showLoanForm.value = !showLoanForm.value
  }

  let loansListener = null
  let currentLoansRef = null

  const activeUser = computed(() => userStore.getActiveUser)

  const fetchMonths = async () => {
    try {
      const keys = await readShallow(`personal-loans/${activeUser.value}`)
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
    const basePath = `personal-loans/${activeUser.value}`

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
      userStore.setLoansRef(loanContent.value)
    }, 1000)
  })

  onUnmounted(() => {
    if (loansListener && currentLoansRef) {
      off(currentLoansRef, 'value', loansListener)
    }
  })

  const totalLending = computed(() => {
    return loans.value.reduce((total, loan) => {
      if (loan.loanGiver === activeUser.value) {
        return total + Number(loan.amount || 0)
      }
      return total
    }, 0)
  })

  const totalDebting = computed(() => {
    return loans.value.reduce((total, loan) => {
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

    loans.value.forEach((loan) => {
      const { loanGiver, giverName, loanReceiver, receiverName, amount } = loan
      if (!loanGiver || !loanReceiver || !amount) return

      if (giverName) nameMap[loanGiver] = giverName
      if (receiverName) nameMap[loanReceiver] = receiverName

      const v = Number(amount)
      // Canonical key: always sort mobiles lexicographically so each pair has one stable key
      const [first, second] = [loanGiver, loanReceiver].sort()
      const key = `${first}__${second}`

      if (!pairMap[key]) {
        pairMap[key] = { first, second, firstGaveToSecond: 0, secondGaveToFirst: 0 }
      }

      if (loanGiver === first) {
        pairMap[key].firstGaveToSecond += v
      } else {
        pairMap[key].secondGaveToFirst += v
      }
    })

    const result = []

    Object.values(pairMap).forEach(({ first, second, firstGaveToSecond, secondGaveToFirst }) => {
      const net = firstGaveToSecond - secondGaveToFirst
      if (net > 0) {
        // first lent more → second (debtor) owes first (lender)
        result.push({ from: nameMap[second] || second, to: nameMap[first] || first, amount: net })
      } else if (net < 0) {
        // second lent more → first (debtor) owes second (lender)
        result.push({ from: nameMap[first] || first, to: nameMap[second] || second, amount: Math.abs(net) })
      }
    })

    return result
  })

  return {
    formatAmount,
    loans,
    loanKeys,
    loanContent,
    selectedMonth,
    months,
    showLoanForm,
    closeLoanForm,
    totalLending,
    totalDebting,
    netPosition,
    pairwiseSettlements
  }
}
