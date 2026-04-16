import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    activeUserUid: null,
    sessionToken: null,
    activePassword: null
  }),
  actions: {
    setActiveUserUid(uid) {
      this.activeUserUid = uid
    },
    setSessionToken(token) {
      this.sessionToken = token
    },
    setActivePassword(code) {
      this.activePassword = code
    }
  },
  getters: {
    getActiveUserUid: (state) => state.activeUserUid,
    getSessionToken: (state) => state.sessionToken,
    getActivePassword: (state) => state.activePassword
  }
})
