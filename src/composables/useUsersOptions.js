import { computed } from 'vue'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { formatMemberDisplay, formatUserDisplay } from '@/utils'

export function useUsersOptions({ allUsers = false } = {}) {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }

  const usersOptions = computed(() => {
    if (!allUsers) {
      const activeGroup = groupStore.getActiveGroup
      const group = activeGroup ? groupStore.getGroupById(activeGroup) : null
      if (group && group.members && group.members.length) {
        return group.members.map((m) => {
          const memberId = m.uid || m.mobile
          const memberUser = userStore.getUserByMobile(memberId)
          const isBlocked = memberUser?.blocked === true
          const label = formatMemberDisplay(storeProxy, m, { group })
          return {
            label: isBlocked ? `${label} (blocked)` : label,
            value: memberId,
            disabled: isBlocked
          }
        })
      }
    }
    const users = userStore.getUsers || []
    return users.map((u) => {
      const isBlocked = u?.blocked === true
      const label = formatUserDisplay(storeProxy, u.uid, {
        name: u.name,
        preferMasked: true
      })
      return {
        label: isBlocked ? `${label} (blocked)` : label,
        value: u.uid,
        disabled: isBlocked
      }
    })
  })

  return { usersOptions }
}
