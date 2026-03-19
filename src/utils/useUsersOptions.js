import { computed } from 'vue'
import { store } from '../stores/store'
import { formatMemberDisplay, formatUserDisplay } from './user-display'

export function useUsersOptions() {
  const userStore = store()

  const usersOptions = computed(() => {
    const activeGroup = userStore.getActiveGroup
    const group = activeGroup ? userStore.getGroupById(activeGroup) : null
    if (group && group.members && group.members.length) {
      return group.members.map((m) => ({
        label: formatMemberDisplay(userStore, m, { group }),
        value: m.mobile
      }))
    }
    const users = userStore.getUsers?.length ? userStore.getUsers : []
    return users.map((u) => ({
      label: formatUserDisplay(userStore, u.mobile, {
        name: u.name,
        preferMasked: true
      }),
      value: u.mobile
    }))
  })

  return { usersOptions }
}
