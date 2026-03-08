import { computed } from 'vue'
import { store } from '../stores/store'

export function useUsersOptions() {
  const userStore = store()

  const usersOptions = computed(() => {
    const activeGroup = userStore.getActiveGroup
    const group = activeGroup ? userStore.getGroupById(activeGroup) : null
    if (group && group.members && group.members.length) {
      return group.members.map((m) => ({
        label: `${m.name} (${m.mobile})`,
        value: m.mobile
      }))
    }
    const users = userStore.getUsers?.length ? userStore.getUsers : []
    return users.map((u) => ({
      label: `${u.name} (${u.mobile})`,
      value: u.mobile
    }))
  })

  return { usersOptions }
}
