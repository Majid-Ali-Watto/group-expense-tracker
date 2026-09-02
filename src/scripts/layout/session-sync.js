// Firestore-backed session bootstrap + live sync, split out of
// src/scripts/layout/app.js and reached only via dynamic import() from
// there — App() runs on every route (including public marketing pages), so
// anything it imports statically ships to every visitor. Everything in this
// file only ever runs once a real Firebase user is confirmed (session
// bootstrap) or the app's own `loggedIn` state flips true (the sync
// listeners) — see the header comment on src/firebase.js.
import {
  database,
  doc,
  onSnapshot,
  getDocs,
  query,
  collection,
  where,
  setDoc
} from '@/firebase'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'
import {
  resolveUserFromAuth,
  findUserTabConfigByUid,
  canAccessManageTabs,
  needsSharedTabsUpgrade,
  buildUpgradedSharedTabConfig,
  hasSharedFeatures,
  hasSavedUserTabConfig,
  DEFAULT_USER_ADMIN_FLAGS
} from '@/helpers'
import { maskMobile } from '@/utils/maskMobile'
import { generateUUID } from '@/utils/uuid'
import {
  encryptForSession,
  encryptForStore
} from '@/utils/sessionCrypto'
import { withTrace } from '@/utils/performance'
import { loadAppConfig, stopAppConfigSync } from '@/composables/useAppConfig'

// route/router/resolveAccessiblePath/validAppRoutes come from the App()
// instance that lazy-loads this module — see src/scripts/layout/app.js.
export function createSessionSync({
  route,
  router,
  resolveAccessiblePath,
  validAppRoutes
}) {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()

  let activeUserTabConfigUnsubscribe = null

  function stopActiveUserTabConfigSync() {
    if (activeUserTabConfigUnsubscribe) {
      activeUserTabConfigUnsubscribe()
      activeUserTabConfigUnsubscribe = null
    }
  }

  function startActiveUserTabConfigSync(uid) {
    stopActiveUserTabConfigSync()
    if (!uid) {
      userStore.clearActiveUserTabAccess()
      return
    }

    activeUserTabConfigUnsubscribe = onSnapshot(
      doc(database, DB_NODES.USER_TAB_CONFIGS, uid),
      (snap) => {
        const config = snap.exists() ? { id: snap.id, ...snap.data() } : null
        userStore.setActiveUserTabAccess({
          config,
          accessManageTabs: canAccessManageTabs(config)
        })
      },
      () => {
        userStore.setActiveUserTabAccess({
          config: null,
          accessManageTabs: true
        })
      }
    )
  }

  let activeUserAdminFlagsUnsubscribe = null

  function stopActiveUserAdminFlagsSync() {
    if (activeUserAdminFlagsUnsubscribe) {
      activeUserAdminFlagsUnsubscribe()
      activeUserAdminFlagsUnsubscribe = null
    }
  }

  function startActiveUserAdminFlagsSync(uid) {
    stopActiveUserAdminFlagsSync()
    if (!uid) {
      userStore.clearActiveUserAdminFlags()
      return
    }

    activeUserAdminFlagsUnsubscribe = onSnapshot(
      doc(database, DB_NODES.USER_ADMIN_FLAGS, uid),
      (snap) => {
        userStore.setActiveUserAdminFlags(
          snap.exists()
            ? { ...DEFAULT_USER_ADMIN_FLAGS, ...snap.data() }
            : { ...DEFAULT_USER_ADMIN_FLAGS }
        )
      },
      () => {
        userStore.setActiveUserAdminFlags({ ...DEFAULT_USER_ADMIN_FLAGS })
      }
    )
  }

  let activeUserPrivateUnsubscribe = null

  function stopActiveUserPrivateSync() {
    if (activeUserPrivateUnsubscribe) {
      activeUserPrivateUnsubscribe()
      activeUserPrivateUnsubscribe = null
    }
  }

  // email lives in user-private/{uid} — same reasoning as user-admin-flags
  // above: users/{uid} is readable by any authenticated user, so anything
  // that shouldn't be moves to a self/admin-only doc instead.
  function startActiveUserPrivateSync(uid) {
    stopActiveUserPrivateSync()
    if (!uid) {
      userStore.clearActiveUserPrivate()
      return
    }

    activeUserPrivateUnsubscribe = onSnapshot(
      doc(database, DB_NODES.USER_PRIVATE, uid),
      (snap) => {
        userStore.setActiveUserPrivate(
          snap.exists() ? snap.data() : { email: '' }
        )
      },
      () => {
        userStore.setActiveUserPrivate({ email: '' })
      }
    )
  }

  // Silent session restore for an already-authenticated Firebase user —
  // moved verbatim from app.js's onAuthStateChanged callback.
  async function bootstrapSessionFromFirebaseUser(firebaseUser) {
    await withTrace('session_bootstrap', async () => {
      const userData = await resolveUserFromAuth(firebaseUser)
      if (!userData?.emailVerified) return

      const uid = userData.uid
      const userTabConfig = await findUserTabConfigByUid(uid)
      // Only auto-restore a session for a user who has already completed the
      // app's own onboarding (tabs selection) at least once. Without this,
      // Firebase Auth's persisted, verified user alone would be enough to grant
      // a full session — skipping password re-verification and the onboarding
      // dialog entirely. Force those users through the normal login form instead,
      // which already gates on the same hasSavedUserTabConfig check.
      if (!hasSavedUserTabConfig(userTabConfig)) return
      const token = generateUUID()
      const dataForEncryption = {
        name: userData.name,
        uid,
        mobile: userData.mobile,
        token
      }
      const [encryptedSession, encryptedStore] = await Promise.all([
        encryptForSession(dataForEncryption),
        encryptForStore(dataForEncryption)
      ])

      sessionStorage.setItem('_session', encryptedSession)
      authStore.setActiveUserUid(uid)
      authStore.setSessionToken(encryptedStore)
      loadAppConfig() // fire-and-forget: load remote config flags on auto-login
      userStore.setActiveUserTabAccess({
        config: userTabConfig,
        accessManageTabs: canAccessManageTabs(userTabConfig)
      })
      // Seed admin flags synchronously (resolveUserFromAuth already merged
      // them into userData) so there's no gap before startActiveUserAdminFlagsSync
      // takes over below.
      userStore.setActiveUserAdminFlags({
        isAdmin: userData.isAdmin === true,
        billedUser: userData.billedUser === true
      })
      userStore.setActiveUserPrivate({ email: userData.email || '' })

      // Populate the active user immediately so displayName is never "Guest".
      // This runs on every page refresh with a still-valid Firebase session —
      // the most common way userStore's active-user row first gets seeded, well
      // before loadSharedGroups() (SharedGroups.vue) ever runs — so payment-account
      // fields need to be here too, or the user's own profile shows them blank
      // for the rest of the session even though Firestore has them.
      userStore.addUser({
        uid,
        mobile: userData.mobile || '',
        name: userData.name || '',
        email: userData.email || '',
        photoUrl: userData.photoUrl || '',
        photoMeta: userData.photoMeta || null,
        mobileWalletProvider: userData.mobileWalletProvider || '',
        bankName: userData.bankName || '',
        bankAccountNumber: userData.bankAccountNumber || '',
        qrCodeUrl: userData.qrCodeUrl || '',
        qrCodeMeta: userData.qrCodeMeta || null,
        emailVerified: userData.emailVerified !== false,
        maskedMobile: maskMobile(userData.mobile || ''),
        billedUser: userData.billedUser === true,
        blocked: userData.blocked === true,
        isAdmin: userData.isAdmin === true
      })

      // Restore last route — this is a page-refresh, not a fresh login.
      // Only restore group state and fetch groups when the user has shared features.
      if (hasSharedFeatures(userTabConfig)) {
        const savedGroupId = sessionStorage.getItem('_lastGroupId')
        if (savedGroupId) groupStore.setActiveGroup(savedGroupId)

        // Also fetch groups so getGroupById works on any tab (not just Groups tab).
        // This is a one-time read — same cost as GroupAccessGuard.vue does on demand.
        try {
          const groupsSnapshot = await getDocs(
            query(
              collection(database, DB_NODES.GROUPS),
              where('memberUids', 'array-contains', uid)
            )
          )
          if (!groupsSnapshot.empty) {
            const groupList = groupsSnapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data()
            }))
            groupStore.setGroups(groupList)

            // User is a member of at least one group — ensure their tab config
            // includes shared tabs (groups, sharedExpenses, sharedLoans).
            // This silently upgrades users who were added via join-request while
            // they only had personal features enabled.
            if (needsSharedTabsUpgrade(userTabConfig)) {
              try {
                const upgraded = buildUpgradedSharedTabConfig(userTabConfig)
                const docPayload = { uid, ...upgraded }
                await setDoc(
                  doc(database, DB_NODES.USER_TAB_CONFIGS, uid),
                  docPayload,
                  { merge: true }
                )
                userStore.setActiveUserTabAccess({
                  config: docPayload,
                  accessManageTabs: upgraded.accessManageTabs !== false
                })
              } catch {
                // Non-fatal — will retry on next login
              }
            }
          } else {
            groupStore.setGroups([])
          }
        } catch {
          // Non-fatal — Groups tab will load them when visited
        }
      }

      const savedRoute = sessionStorage.getItem('_lastRoute')
      // /help has no requiresAuth (it's also the public marketing page),
      // so it isn't covered by the requiresAuth check below — but a
      // logged-in user refreshing on it should stay there too, same as
      // any requiresAuth route, rather than bouncing to their last tab
      // (see canAccessPath's matching /help special-case above).
      const keepCurrentProtectedRoute =
        route.meta?.requiresAuth ||
        route.path === '/help' ||
        route.path === '/ur/help'
          ? route.fullPath
          : null
      // Strip query params from the second path segment before checking validAppRoutes.
      // e.g. '/personal-loans?month=2026-02' → segment[1]='personal-loans?month=...' → strip '?' → '/personal-loans'
      const savedBasePath = savedRoute
        ? '/' + savedRoute.split('/')[1].split('?')[0]
        : null
      const destination =
        keepCurrentProtectedRoute ||
        (savedBasePath && validAppRoutes.has(savedBasePath)
          ? savedRoute
          : null)
      router.replace(resolveAccessiblePath(destination, userTabConfig))
    }).catch((e) => {
      console.error('Auto session restore failed:', e)
    })
  }

  function stopAllSync() {
    stopActiveUserTabConfigSync()
    stopActiveUserAdminFlagsSync()
    stopActiveUserPrivateSync()
    stopAppConfigSync()
  }

  return {
    bootstrapSessionFromFirebaseUser,
    startActiveUserTabConfigSync,
    stopActiveUserTabConfigSync,
    startActiveUserAdminFlagsSync,
    stopActiveUserAdminFlagsSync,
    startActiveUserPrivateSync,
    stopActiveUserPrivateSync,
    stopAllSync
  }
}
