import { computed } from 'vue'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { formatMemberDisplay, formatUserDisplay } from '@/utils'

export function useUsersOptions() {
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
    const activeGroup = groupStore.getActiveGroup
    const group = activeGroup ? groupStore.getGroupById(activeGroup) : null
    if (group && group.members && group.members.length) {
      return group.members.map((m) => ({
        label: formatMemberDisplay(storeProxy, m, { group }),
        value: m.mobile
      }))
    }
    const users = userStore.getUsers?.length ? userStore.getUsers : []
    return users.map((u) => ({
      label: formatUserDisplay(storeProxy, u.mobile, {
        name: u.name,
        preferMasked: true
      }),
      value: u.mobile
    }))
  })

  return { usersOptions }
}
