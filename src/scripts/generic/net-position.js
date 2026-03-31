import { ref, computed } from 'vue'
import { useAuthStore, useGroupStore } from '@/stores'
import { useFireBase } from '@/composables'
import { ElMessageBox } from 'element-plus'
import { showError, showSuccess } from '@/utils'
import { DB_NODES } from '@/constants'

export const NetPosition = () => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const { read, readShallow } = useFireBase()

  const activeUser = computed(() => authStore.getActiveUser)
  const isCalculating = ref(false)

  /**
   * Helper function to yield to the browser and prevent blocking the main thread
   * @returns {Promise<void>}
   */
  const yieldToBrowser = () => {
    return new Promise((resolve) => setTimeout(resolve, 0))
  }

  /**
   * Calculate net position from shared expenses (payments)
   * @param {string} groupId - The group ID
   * @param {string} userMobile - The user's mobile number
   * @returns {Promise<Object>} Object with lender and debtor amounts
   */
  async function calculateSharedExpensesPosition(groupId, userMobile) {
    const result = {
      lenderAmount: 0,
      debtorAmount: 0
    }

    try {
      // Get all months for this group's payments
      const months = await readShallow(
        `${DB_NODES.SHARED_EXPENSES}/${groupId}/months`
      )
      if (!months || months.length === 0) return result

      // Fetch payments for each month
      for (const month of months) {
        const payments = await read(
          `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${month}/payments`,
          false
        )
        if (!payments) continue

        Object.values(payments).forEach((payment) => {
          if (!payment || !payment.amount) return

          let userPaid = 0
          let userOwes = 0

          // Calculate how much user paid
          if (payment.payerMode === 'multiple' && payment.payers?.length) {
            const userPayer = payment.payers.find(
              (p) => p.mobile === userMobile
            )
            if (userPayer) {
              userPaid = userPayer.amount || 0
            }
          } else if (payment.payer === userMobile) {
            userPaid = payment.amount || 0
          }

          // Calculate how much user owes
          if (payment.split?.length) {
            const userSplit = payment.split.find((s) => s.mobile === userMobile)
            if (userSplit) {
              userOwes = userSplit.amount || 0
            }
          } else if (payment.participants?.includes(userMobile)) {
            // Equal split
            const participantCount = payment.participants.length
            userOwes =
              participantCount > 0 ? payment.amount / participantCount : 0
          }

          const netForPayment = userPaid - userOwes
          if (netForPayment > 0) {
            result.lenderAmount += netForPayment
          } else if (netForPayment < 0) {
            result.debtorAmount += Math.abs(netForPayment)
          }
        })

        // Yield to browser after processing each month
        await yieldToBrowser()
      }
    } catch (error) {
      console.error(
        `Error calculating shared expenses for group ${groupId}:`,
        error
      )
    }

    return result
  }

  /**
   * Calculate net position from shared loans
   * @param {string} groupId - The group ID
   * @param {string} userMobile - The user's mobile number
   * @returns {Promise<Object>} Object with lender and debtor amounts
   */
  async function calculateSharedLoansPosition(groupId, userMobile) {
    const result = {
      lenderAmount: 0,
      debtorAmount: 0
    }

    try {
      // Get all months for this group's loans
      const months = await readShallow(
        `${DB_NODES.SHARED_LOANS}/${groupId}/months`
      )
      if (!months || months.length === 0) return result

      // Fetch loans for each month
      for (const month of months) {
        const loans = await read(
          `${DB_NODES.SHARED_LOANS}/${groupId}/months/${month}/loans`,
          false
        )
        if (!loans) continue

        Object.values(loans).forEach((loan) => {
          if (!loan || !loan.amount) return

          if (loan.giver === userMobile) {
            // User is the lender
            result.lenderAmount += loan.amount
          } else if (loan.receiver === userMobile) {
            // User is the debtor
            result.debtorAmount += loan.amount
          }
        })

        // Yield to browser after processing each month
        await yieldToBrowser()
      }
    } catch (error) {
      console.error(
        `Error calculating shared loans for group ${groupId}:`,
        error
      )
    }

    return result
  }

  /**
   * Calculate net position from personal loans
   * @param {string} userMobile - The user's mobile number
   * @returns {Promise<Object>} Object with lender and debtor amounts
   */
  async function calculatePersonalLoansPosition(userMobile) {
    const result = {
      lenderAmount: 0,
      debtorAmount: 0
    }

    try {
      // Get all months for personal loans
      const months = await readShallow(
        `${DB_NODES.PERSONAL_LOANS}/${userMobile}/months`
      )
      if (!months || months.length === 0) return result

      // Fetch loans for each month
      for (const month of months) {
        const loans = await read(
          `${DB_NODES.PERSONAL_LOANS}/${userMobile}/months/${month}/loans`,
          false
        )
        if (!loans) continue

        Object.values(loans).forEach((loan) => {
          if (!loan || !loan.amount) return

          if (loan.loanGiver === userMobile) {
            // User gave the loan (lender)
            result.lenderAmount += loan.amount
          } else if (loan.loanReceiver === userMobile) {
            // User took the loan (debtor)
            result.debtorAmount += loan.amount
          }
        })

        // Yield to browser after processing each month
        await yieldToBrowser()
      }
    } catch (error) {
      console.error('Error calculating personal loans:', error)
    }

    return result
  }

  /**
   * Calculate complete net position across all categories
   * @returns {Promise<Object>} Complete net position summary
   */
  async function calculateCompleteNetPosition() {
    isCalculating.value = true

    // Show message that calculations started
    showSuccess(
      'Calculating your net position... You will be notified when complete.'
    )

    const summary = {
      sharedExpenses: { lenderAmount: 0, debtorAmount: 0 },
      sharedLoans: { lenderAmount: 0, debtorAmount: 0 },
      personalLoans: { lenderAmount: 0, debtorAmount: 0 },
      totalLender: 0,
      totalDebtor: 0,
      netPosition: 0
    }

    try {
      const userMobile = activeUser.value

      if (!userMobile) {
        showError('Please log in to view your net position')
        return summary
      }

      // Get all groups the user is part of
      const allGroups = groupStore.getGroups || []
      const userGroups = allGroups.filter((group) => {
        if (!group || !group.members) return false
        return group.members.some((m) => m.mobile === userMobile)
      })

      // Calculate shared expenses for each group
      for (const group of userGroups) {
        const expensesResult = await calculateSharedExpensesPosition(
          group.id,
          userMobile
        )
        summary.sharedExpenses.lenderAmount += expensesResult.lenderAmount
        summary.sharedExpenses.debtorAmount += expensesResult.debtorAmount

        // Yield to browser to keep UI responsive
        await yieldToBrowser()
      }

      // Calculate shared loans for each group
      for (const group of userGroups) {
        const loansResult = await calculateSharedLoansPosition(
          group.id,
          userMobile
        )
        summary.sharedLoans.lenderAmount += loansResult.lenderAmount
        summary.sharedLoans.debtorAmount += loansResult.debtorAmount

        // Yield to browser to keep UI responsive
        await yieldToBrowser()
      }

      // Calculate personal loans
      summary.personalLoans = await calculatePersonalLoansPosition(userMobile)

      // Calculate totals
      summary.totalLender =
        summary.sharedExpenses.lenderAmount +
        summary.sharedLoans.lenderAmount +
        summary.personalLoans.lenderAmount

      summary.totalDebtor =
        summary.sharedExpenses.debtorAmount +
        summary.sharedLoans.debtorAmount +
        summary.personalLoans.debtorAmount

      summary.netPosition = summary.totalLender - summary.totalDebtor
    } catch (error) {
      console.error('Error calculating net position:', error)
      showError('Failed to calculate net position. Please try again.')
    } finally {
      isCalculating.value = false
    }

    return summary
  }

  /**
   * Show confirmation dialog before calculating
   */
  async function showNetPositionConfirmation() {
    try {
      await ElMessageBox.confirm(
        'Calculating your net position across all groups, loans, and expenses may take some time. Do you want to continue?',
        'View Expenses Summary',
        {
          confirmButtonText: 'Yes, Calculate',
          cancelButtonText: 'Cancel',
          type: 'info'
        }
      )
      return true
    } catch {
      return false
    }
  }

  return {
    isCalculating,
    calculateCompleteNetPosition,
    showNetPositionConfirmation
  }
}
