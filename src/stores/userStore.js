import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    activeUserTabConfig: null,
    activeUserTabConfigLoaded: false,
    activeUserCanManageTabs: true
  }),
  actions: {
    addUser(user) {
      const exists = this.users.find((u) => u.uid === user.uid)
      if (!exists) this.users.push(user)
      else Object.assign(exists, user)
    },
    setUsers(users) {
      this.users = users || []
    },
    setActiveUserTabAccess({ config = null, accessManageTabs = true } = {}) {
      this.activeUserTabConfig = config
      this.activeUserTabConfigLoaded = true
      this.activeUserCanManageTabs = accessManageTabs !== false
    },
    clearActiveUserTabAccess() {
      this.activeUserTabConfig = null
      this.activeUserTabConfigLoaded = false
      this.activeUserCanManageTabs = true
    }
  },
  getters: {
    getUsers: (state) => state.users,
    getActiveUserTabConfig: (state) => state.activeUserTabConfig,
    isActiveUserTabConfigLoaded: (state) => state.activeUserTabConfigLoaded,
    canActiveUserManageTabs: (state) => state.activeUserCanManageTabs,
    getUserByUid: (state) => (uid) =>
      state.users.find((u) => u.uid === uid) || null,
    getUserByMobile: (state) => (value) =>
      state.users.find((u) => u.mobile === value) || null,
    getUserByEmail: (state) => (email) =>
      state.users.find(
        (u) => u.email?.toLowerCase() === email?.toLowerCase()
      ) || null
  }
})
