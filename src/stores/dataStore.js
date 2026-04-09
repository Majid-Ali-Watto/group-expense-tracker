import { defineStore } from 'pinia'
import { getCurrentMonth } from '@/utils'

export const useDataStore = defineStore('data', {
  state: () => ({
    expenseRef: null,
    loansRef: null,
    salaryRef: null,
    selectedMonth: getCurrentMonth(),
    pendingScrollRowId: null
  }),
  actions: {
    setExpenseRef(ref) {
      this.expenseRef = ref
    },
    setLoansRef(ref) {
      this.loansRef = ref
    },
    setSalaryRef(ref) {
      this.salaryRef = ref
    },
    setCurrentMonth(month) {
      this.selectedMonth = month
    },
    setPendingScrollRowId(id) {
      this.pendingScrollRowId = id
    }
  },
  getters: {
    getExpenseRef: (state) => state.expenseRef,
    getLoansRef: (state) => state.loansRef,
    getSalaryRef: (state) => state.salaryRef,
    getSelectedMonth: (state) => state.selectedMonth
  }
})
