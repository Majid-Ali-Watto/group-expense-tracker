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

    if (loansListener) {
      off(loansListener)
    }

    if (selectedMonth.value === 'All') {
      const allLoansRef = dbRef(basePath)

      loansListener = allLoansRef
      onValue(allLoansRef, (snapshot) => {
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
      })
    } else {
      const monthPath = `${basePath}/${selectedMonth.value}`
      const monthLoansRef = dbRef(monthPath)

      loansListener = monthLoansRef
      onValue(monthLoansRef, (snapshot) => {
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

  onMounted(() => {
    fetchMonths()
    fetchLoans()

    setTimeout(() => {
      userStore.setLoansRef(loanContent.value)
    }, 1000)
  })

  onUnmounted(() => {
    if (loansListener) {
      off(loansListener)
    }
  })

  const totalLending = computed(() => {
    return loans.value.reduce((total, loan) => {
      if (loan.giver === activeUser.value) {
        return total + Number(loan.amount || 0)
      }
      return total
    }, 0)
  })

  const totalDebting = computed(() => {
    return loans.value.reduce((total, loan) => {
      if (loan.receiver === activeUser.value) {
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

    loans.value.forEach(({ giver, receiver, amount }) => {
      if (!giver || !receiver || !amount) return

      const v = Number(amount)

      const [a, b] = [giver, receiver].sort()
      const key = `${a}__${b}`

      if (!pairMap[key]) {
        pairMap[key] = {
          a,
          b,
          aToB: 0,
          bToA: 0
        }
      }

      if (giver === a && receiver === b) {
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
          from: userStore.getUserByMobile(a)?.name || a,
          to: userStore.getUserByMobile(b)?.name || b,
          amount: net
        })
      } else if (net < 0) {
        result.push({
          from: userStore.getUserByMobile(b)?.name || b,
          to: userStore.getUserByMobile(a)?.name || a,
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
