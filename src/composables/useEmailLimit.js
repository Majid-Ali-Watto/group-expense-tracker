import { computed } from 'vue'
import { useAuthStore, useUserStore } from '@/stores'
import { getEmailConfig } from '@/composables/useAppConfig'
import { database, doc, updateDoc, increment } from '@/firebase'
import { DB_NODES } from '@/constants'

export function useEmailLimit() {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  const monthKey = computed(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const tabConfig = computed(() => userStore.getActiveUserTabConfig)
  const activeUser = computed(() =>
    userStore.getUserByUid(authStore.getActiveUserUid)
  )
  const billedUser = computed(() => activeUser.value?.billedUser === true)

  const limit = computed(() => {
    const cfg = getEmailConfig()
    const raw = billedUser.value
      ? cfg.paid_emails_limit_per_month
      : cfg.free_email_limit_per_month
    return raw != null ? Number(raw) : Infinity
  })

  const usedCount = computed(
    () => tabConfig.value?.emailsSent?.[monthKey.value] ?? 0
  )

  const canSendEmail = computed(() => usedCount.value < limit.value)

  const wantsSharedExpenseEmails = computed(
    () => tabConfig.value?.emailSharedExpenses !== false
  )

  const wantsSharedLoanEmails = computed(
    () => tabConfig.value?.emailSharedLoans !== false
  )

  async function incrementEmailCount() {
    const uid = authStore.getActiveUserUid
    if (!uid) return
    await updateDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid), {
      [`emailsSent.${monthKey.value}`]: increment(1)
    })
  }

  return {
    canSendEmail,
    wantsSharedExpenseEmails,
    wantsSharedLoanEmails,
    incrementEmailCount
  }
}
