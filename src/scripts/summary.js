import { computed, inject } from 'vue'
import { friends } from '../assets/data'
import { store } from '../stores/store'

export const Summary = (props) => {
  const formatAmount = inject('formatAmount')
  const userStore = store()

  const activeGroup = computed(() => userStore.getActiveGroup)
  const groupObj = computed(() =>
    activeGroup.value ? userStore.getGroupById(activeGroup.value) : null
  )

  const filteredPayments = computed(() => {
    const all = props.payments || []
    if (activeGroup.value) {
      return all.filter((p) => p && p.group === activeGroup.value)
    }
    return all.filter((p) => !p || !p.group || p.group === 'global')
  })

  const totalSpent = computed(() =>
    filteredPayments.value.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    )
  )

  const usersList = computed(() => {
    if (
      groupObj.value &&
      groupObj.value.members &&
      groupObj.value.members.length
    ) {
      return groupObj.value.members.map((m) => ({
        name: m.name,
        mobile: m.mobile
      }))
    }
    return userStore.getUsers && userStore.getUsers.length
      ? userStore.getUsers
      : friends.map((f) => ({ name: f, mobile: f }))
  })

  const averageSpent = computed(() =>
    usersList.value.length ? totalSpent.value / usersList.value.length : 0
  )

  const friendTotals = computed(() =>
    usersList.value.map((user) => ({
      name: user.name,
      total: filteredPayments.value.reduce((sum, payment) => {
        if (payment.payerMode === 'multiple' && payment.payers?.length) {
          const entry = payment.payers.find((p) => p.mobile === user.mobile)
          return sum + (entry?.amount || 0)
        }
        if (payment.payer === user.mobile) return sum + (payment.amount || 0)
        return sum
      }, 0)
    }))
  )

  return {
    formatAmount,
    totalSpent,
    averageSpent,
    friendTotals
  }
}
