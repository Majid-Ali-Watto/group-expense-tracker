import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    activeUser: null,
    sessionToken: null,
    activeLoginCode: null
  }),
  actions: {
    setActiveUser(user) {
      this.activeUser = user
    },
    setSessionToken(token) {
      this.sessionToken = token
    },
    setActiveLoginCode(code) {
      this.activeLoginCode = code
    }
  },
  getters: {
    getActiveUser: (state) => state.activeUser,
    getSessionToken: (state) => state.sessionToken,
    getActiveLoginCode: (state) => state.activeLoginCode
  }
})
