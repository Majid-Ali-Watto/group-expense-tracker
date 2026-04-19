import { computed } from 'vue'
import { useAuthStore, useUserStore } from '@/stores'
import { getOcrConfig } from '@/composables/useAppConfig'
import { database, doc, updateDoc, increment } from '@/firebase'
import { DB_NODES } from '@/constants'

export function useOcrLimit() {
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
    const cfg = getOcrConfig()
    const raw = billedUser.value
      ? cfg.paid_extraction_limit_per_month
      : cfg.free_extraction_limit_per_month
    return raw != null ? Number(raw) : Infinity
  })

  const usedCount = computed(
    () => tabConfig.value?.ocrExtractions?.[monthKey.value] ?? 0
  )

  const canExtract = computed(() => usedCount.value < limit.value)

  const limitReachedMessage = computed(() => {
    if (canExtract.value) return null
    return billedUser.value
      ? `You've reached your monthly limit of ${limit.value} extractions. Contact support to increase it.`
      : `Free limit of ${limit.value} extractions/month reached. Upgrade to unlock more.`
  })

  async function incrementOcrExtraction() {
    const uid = authStore.getActiveUserUid
    if (!uid) return
    await updateDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid), {
      [`ocrExtractions.${monthKey.value}`]: increment(1)
    })
  }

  return { canExtract, limitReachedMessage, incrementOcrExtraction }
}
