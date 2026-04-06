import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    activeUser: null,
    sessionToken: null,
    activePassword: null
  }),
  actions: {
    setActiveUser(user) {
      this.activeUser = user
    },
    setSessionToken(token) {
      this.sessionToken = token
    },
    setActivePassword(code) {
      this.activePassword = code
    }
  },
  getters: {
    getActiveUser: (state) => state.activeUser,
    getSessionToken: (state) => state.sessionToken,
    getActivePassword: (state) => state.activePassword
  }
})
