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

    loans.value.forEach((loan) => {
      const { loanGiver, giverName, loanReceiver, receiverName, amount } = loan
      if (!loanGiver || !loanReceiver || !amount) return

      const v = Number(amount)

      const [a, b] = [
        { loanGiver, giverName },
        { loanReceiver, receiverName }
      ].sort((x, y) => x.loanGiver - y.loanReceiver)
      const key = `${a.loanGiver}__${b.loanReceiver}`

      if (!pairMap[key]) {
        pairMap[key] = {
          a,
          b,
          aToB: 0,
          bToA: 0
        }
      }

      if (loanGiver === a.loanGiver && loanReceiver === b.loanReceiver) {
        pairMap[key].bToA += v
      } else {
        pairMap[key].aToB += v
      }
    })

    const result = []

    Object.values(pairMap).forEach(({ a, b, aToB, bToA }) => {
      const net = aToB - bToA
      if (net > 0) {
        result.push({
          from: a.giverName || a.loanGiver,
          to: b.receiverName || b.loanReceiver,
          amount: net
        })
      } else if (net < 0) {
        result.push({
          from: b.receiverName || b.loanReceiver,
          to: a.giverName || a.loanGiver,
          amount: Math.abs(net)
        })
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
