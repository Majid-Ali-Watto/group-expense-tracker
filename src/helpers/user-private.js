import { database, doc, getDoc, setDoc } from '@/firebase'
import { DB_NODES } from '@/constants'

// Safe default for a user who has no user-private doc yet (shouldn't normally
// happen post-migration — every account creates one at registration — but
// mirrors findUserAdminFlagsByUid's defensive default in case one is missing
// or the read is denied).
export const DEFAULT_USER_PRIVATE = {
  email: ''
}

// Mirrors findUserAdminFlagsByUid: read the caller's own (or, for an admin,
// any) user-private doc, defaulting to an empty email when it doesn't exist
// or the read is denied.
export async function findUserPrivateByUid(uid) {
  if (!uid) return { ...DEFAULT_USER_PRIVATE }

  try {
    const snapshot = await getDoc(doc(database, DB_NODES.USER_PRIVATE, uid))
    return snapshot.exists()
      ? { ...DEFAULT_USER_PRIVATE, ...snapshot.data() }
      : { ...DEFAULT_USER_PRIVATE }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      console.warn(
        'user-private read is not permitted; using default (empty) private fields.'
      )
      return { ...DEFAULT_USER_PRIVATE }
    }

    throw error
  }
}

// Keeps user-private/{uid}.email in sync with Firebase Auth's verified email
// (e.g. after the user changes it directly through Firebase Auth). Mirrors
// syncFirestoreUserFromAuth's drift-correction, but targets user-private
// instead of users/{uid} — email lives there now, not on the public doc.
export async function syncUserPrivateEmailFromAuth(uid, normalizedAuthEmail) {
  if (!uid || !normalizedAuthEmail) return

  const current = await findUserPrivateByUid(uid)
  if (current.email?.trim()?.toLowerCase() === normalizedAuthEmail) return

  await setDoc(
    doc(database, DB_NODES.USER_PRIVATE, uid),
    { email: normalizedAuthEmail },
    { merge: true }
  )
}
