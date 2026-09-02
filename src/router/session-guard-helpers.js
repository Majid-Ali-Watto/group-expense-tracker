// Firestore-backed lookups used by the router guard (src/router/index.js).
// Split into their own module and reached only via dynamic import() so an
// anonymous visitor with no session never pulls in the Firestore SDK just to
// navigate a public marketing page — see src/firebase.js's header comment.
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import {
  resolveUserFromAuth,
  findUserTabConfigByUid,
  findUserAdminFlagsByUid,
  canAccessManageTabs
} from '@/helpers'
import { maskMobile } from '@/utils/maskMobile'
import { auth, authReady } from '@/firebase-auth'

export async function getCurrentUserProfile() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const cachedUser = authStore.getActiveUserUid
    ? userStore.getUserByUid(authStore.getActiveUserUid)
    : null

  if (cachedUser) return cachedUser

  const firebaseUser = auth.currentUser ?? (await authReady)
  const user = await resolveUserFromAuth(firebaseUser)
  if (!user) return null

  authStore.setActiveUserUid(user.uid)
  userStore.addUser({
    uid: user.uid,
    mobile: user.mobile || '',
    name: user.name || '',
    email: user.email || '',
    emailVerified: user.emailVerified !== false,
    maskedMobile: maskMobile(user.mobile || ''),
    blocked: user.blocked === true,
    // Same payment-account fields as the other userStore hydration paths
    // (shared-groups.js, users.js, groups.js, app.js, login.js) — this
    // router-guard path can be the very first thing to seed the active
    // user's own store entry, so it needs them too.
    mobileWalletProvider: user.mobileWalletProvider || '',
    bankName: user.bankName || '',
    bankAccountNumber: user.bankAccountNumber || '',
    qrCodeUrl: user.qrCodeUrl || '',
    qrCodeMeta: user.qrCodeMeta || null
  })
  // resolveUserFromAuth already merged these in from user-admin-flags/{uid} —
  // seed the store slice here too so getCurrentUserAdminFlags() below (and any
  // other reader) doesn't have to fetch them a second time.
  userStore.setActiveUserAdminFlags({
    isAdmin: user.isAdmin === true,
    billedUser: user.billedUser === true
  })

  return userStore.getUserByUid(user.uid) || user
}

export async function getCurrentUserTabConfig(uid) {
  const userStore = useUserStore()
  if (userStore.isActiveUserTabConfigLoaded) {
    return userStore.getActiveUserTabConfig
  }

  const config = await findUserTabConfigByUid(uid)
  userStore.setActiveUserTabAccess({
    config,
    accessManageTabs: canAccessManageTabs(config)
  })
  return config
}

export async function getCurrentUserAdminFlags(uid) {
  const userStore = useUserStore()
  if (userStore.isActiveUserAdminFlagsLoaded) {
    return userStore.getActiveUserAdminFlags
  }

  const flags = await findUserAdminFlagsByUid(uid)
  userStore.setActiveUserAdminFlags(flags)
  return flags
}
