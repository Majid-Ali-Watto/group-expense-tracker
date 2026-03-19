import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: []
  }),
  actions: {
    addUser(user) {
      const exists = this.users.find((u) => u.mobile === user.mobile)
      if (!exists) this.users.push(user)
      else Object.assign(exists, user)
    },
    setUsers(users) {
      this.users = users || []
    }
  },
  getters: {
    getUsers: (state) => state.users,
    getUserByMobile: (state) => (mobile) =>
      state.users.find((u) => u.mobile === mobile) || null
  }
})
