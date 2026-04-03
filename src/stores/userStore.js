import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: []
  }),
  actions: {
    addUser(user) {
      const exists = this.users.find((u) => u.uid === user.uid)
      if (!exists) this.users.push(user)
      else Object.assign(exists, user)
    },
    setUsers(users) {
      this.users = users || []
    }
  },
  getters: {
    getUsers: (state) => state.users,
    getUserByUid: (state) => (uid) =>
      state.users.find((u) => u.uid === uid) || null,
    getUserByMobile: (state) => (value) =>
      state.users.find((u) => u.uid === value || u.mobile === value) || null,
    getUserByEmail: (state) => (email) =>
      state.users.find((u) => u.email?.toLowerCase() === email?.toLowerCase()) ||
      null
  }
})
