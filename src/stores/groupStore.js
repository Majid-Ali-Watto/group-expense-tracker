import { defineStore } from 'pinia'

export const useGroupStore = defineStore('group', {
  state: () => ({
    groups: [],
    activeGroup: null,
    scrollToGroupTrigger: null
  }),
  actions: {
    addGroup(group) {
      const exists = this.groups.find((g) => g.id === group.id)
      if (!exists) this.groups.push(group)
      else Object.assign(exists, group)
    },
    setGroups(groups) {
      this.groups = groups || []
    },
    setActiveGroup(groupId) {
      this.activeGroup = groupId
    },
    setScrollToGroupTrigger(trigger) {
      this.scrollToGroupTrigger = trigger
    },
    removeGroup(id) {
      this.groups = this.groups.filter((g) => g.id !== id)
    },
    updateGroup(updated) {
      const index = this.groups.findIndex((g) => g.id === updated.id)
      if (index !== -1) this.groups[index] = updated
    }
  },
  getters: {
    getGroups: (state) => state.groups,
    getActiveGroup: (state) => state.activeGroup,
    getScrollToGroupTrigger: (state) => state.scrollToGroupTrigger,
    getGroupById: (state) => (id) =>
      state.groups.find((g) => g.id === id) || null
  }
})
