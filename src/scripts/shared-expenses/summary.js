import { computed, inject } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import { formatUserDisplay } from '../../utils/user-display'

export const Summary = (props) => {
  const formatAmount = inject('formatAmount')
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }

  const activeGroup = computed(() => groupStore.getActiveGroup)
  const groupObj = computed(() =>
    activeGroup.value ? groupStore.getGroupById(activeGroup.value) : null
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
      : []
  })

  const hasCustomSplits = computed(() =>
    filteredPayments.value.some((p) => (p.splitMode || 'equal') === 'custom')
  )

  const averageSpent = computed(() => {
    const participants = new Set()
    filteredPayments.value.forEach((payment) => {
      if (payment.split?.length) {
        payment.split.forEach((s) => {
          if (s.mobile && (s.amount || 0) > 0) participants.add(s.mobile)
        })
      } else if (payment.participants?.length) {
        payment.participants.forEach((mobile) => participants.add(mobile))
      }
    })
    return participants.size ? totalSpent.value / participants.size : 0
  })

  // Per-person owed totals built from split arrays (used when custom splits exist)
  const perPersonOwed = computed(() => {
    const totals = {}
    filteredPayments.value.forEach((payment) => {
      if (!payment.split?.length) return
      payment.split.forEach((s) => {
        if (!s.mobile || !(s.amount > 0)) return
        if (!totals[s.mobile]) {
          totals[s.mobile] = {
            name: formatUserDisplay(storeProxy, s.mobile, {
              name: s.name,
              group: groupObj.value
            }),
            amount: 0
          }
        }
        totals[s.mobile].amount += s.amount
      })
    })
    return Object.values(totals)
  })

  const friendTotals = computed(() =>
    usersList.value.map((user) => ({
      name: formatUserDisplay(storeProxy, user.mobile, {
        name: user.name,
        group: groupObj.value,
        preferMasked: !groupObj.value
      }),
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

  const chartPayerSegments = computed(() =>
    friendTotals.value
      .filter((f) => f.total > 0)
      .map((f) => ({
        label: f.name,
        value: f.total,
        formatted: formatAmount(f.total)
      }))
  )

  const chartBarItems = computed(() => {
    if (hasCustomSplits.value) {
      return perPersonOwed.value.map((p) => ({
        label: p.name,
        value: p.amount,
        formatted: formatAmount(p.amount)
      }))
    }
    return friendTotals.value
      .filter((f) => f.total > 0)
      .map((f) => ({
        label: f.name,
        value: f.total,
        formatted: formatAmount(f.total)
      }))
  })

  return {
    formatAmount,
    totalSpent,
    averageSpent,
    hasCustomSplits,
    perPersonOwed,
    friendTotals,
    chartPayerSegments,
    chartBarItems
  }
}
