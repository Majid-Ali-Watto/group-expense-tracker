/**
 * App-wide remote configuration loaded from Firestore after login.
 *
 * Firestore path: configs/storage
 * Expected document shape:
 *   { firebase: true|false, cloudinary: true|false }
 *
 * Rules:
 *   - If the document doesn't exist → both providers enabled (default behaviour)
 *   - true  → provider is enabled and eligible for fallback
 *   - false → provider is explicitly disabled; never used, even as fallback
 */

import { database, doc, getDoc } from '../firebase'
import { DB_NODES } from '../constants/db-nodes'

// Module-level singleton — loaded once per session, shared everywhere
const _config = {
  storage: null // null = not yet loaded (use defaults)
}

let _loaded = false

/**
 * Load app config from Firestore.
 * Called once after successful login. Subsequent calls are no-ops.
 */
export async function loadAppConfig() {
  if (_loaded) return
  _loaded = true
  try {
    const snap = await getDoc(doc(database, DB_NODES.CONFIGS, 'storage'))
    if (snap.exists()) {
      _config.storage = snap.data()
      console.log('[loadAppConfig] Loaded storage config:', _config.storage)
    } else {
      _config.storage = {} // doc absent → use defaults
    }
  } catch {
    // Non-critical — network error or permissions issue; fall back to defaults
    _config.storage = {}
  }
}

/**
 * Returns the resolved storage provider flags.
 *
 *  { cloudinary: true|false, firebase: true|false }
 *
 * If the config hasn't been loaded yet or a flag is absent for a provider,
 * that provider is treated as enabled (safe default).
 */
export function getStorageConfig() {
  const cfg = _config.storage
  if (!cfg) {
    // Not yet loaded — both enabled by default
    return { cloudinary: true, firebase: true }
  }
  return {
    cloudinary: cfg.cloudinary !== false, // absent or true → enabled
    firebase: cfg.firebase !== false // absent or true → enabled
  }
}
