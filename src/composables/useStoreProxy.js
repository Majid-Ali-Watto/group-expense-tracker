import { useAuthStore, useUserStore } from '@/stores'

/**
 * Composable: Provides a unified proxy for store access, combining auth and user store facades.
 * Used by display utilities, form components, and approval flows.
 *
 * @returns {Object} storeProxy with getActiveUserUid, getUserByUid, and getUserByMobile (backwards-compat)
 */
export const useStoreProxy = () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  return createUserDisplayStoreProxy(authStore, userStore)
}

/**
 * Factory function: Creates a store proxy from explicit store instances.
 * Used in utility functions and contexts where composables cannot be called.
 *
 * @param {Object} authStore - useAuthStore instance
 * @param {Object} userStore - useUserStore instance
 * @returns {Object} storeProxy with getActiveUserUid, getUserByUid, and getUserByMobile (backwards-compat)
 */
export const createUserDisplayStoreProxy = (authStore, userStore) => {
  return {
    get getActiveUserUid() {
      return authStore.getActiveUserUid
    },
    getUserByUid: (identity) => userStore.getUserByUid?.(identity),
    getUserByMobile: (identity) => userStore.getUserByUid?.(identity) // Backwards-compat: delegates to uid lookup
  }
}
