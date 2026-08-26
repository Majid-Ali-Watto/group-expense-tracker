import { database, doc, getDoc } from '@/firebase'
import { DB_NODES } from '@/constants'

// Safe defaults for a user who has no user-admin-flags doc yet (e.g. a
// brand-new registration — only an admin ever creates this doc, see
// firestore.rules).
export const DEFAULT_USER_ADMIN_FLAGS = {
  isAdmin: false,
  billedUser: false
}

// Mirrors findUserTabConfigByUid in user-tab-access.js: read the caller's own
// (or, for an admin, any) user-admin-flags doc, defaulting to all-false when
// it doesn't exist or the read is denied.
export async function findUserAdminFlagsByUid(uid) {
  if (!uid) return { ...DEFAULT_USER_ADMIN_FLAGS }

  try {
    const snapshot = await getDoc(doc(database, DB_NODES.USER_ADMIN_FLAGS, uid))
    return snapshot.exists()
      ? { ...DEFAULT_USER_ADMIN_FLAGS, ...snapshot.data() }
      : { ...DEFAULT_USER_ADMIN_FLAGS }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      console.warn(
        'user-admin-flags read is not permitted; using default (all-false) flags.'
      )
      return { ...DEFAULT_USER_ADMIN_FLAGS }
    }

    throw error
  }
}
