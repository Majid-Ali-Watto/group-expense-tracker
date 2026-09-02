// Split out of user-tab-access.js: this is the one Firestore-touching export
// in that file, and Rollup's code-splitting works at module granularity, not
// per-export — sharing a single file between an eager consumer (pure
// functions, imported directly by src/scripts/layout/app.js and
// src/router/index.js) and a lazy-only consumer (this function, via
// session-guard-helpers.js / session-sync.js) pulled the whole file — and
// its '@/firebase' import — into the eager bundle regardless. See
// src/firebase.js's header comment.
import { database, doc, getDoc } from '@/firebase'
import { DB_NODES } from '@/constants'

export async function findUserTabConfigByUid(uid) {
  if (!uid) return null

  try {
    const snapshot = await getDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid))
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  } catch (error) {
    if (error?.code === 'permission-denied') {
      console.warn(
        'user-tab-configs read is not permitted; using default tab access.'
      )
      return null
    }

    throw error
  }
}
