/**
 * In-memory query cache for Firestore reads.
 *
 * Purpose:
 *   Firestore real-time listeners (onSnapshot) already push updates
 *   automatically, so we never pay for extra API calls when data changes.
 *   The problem is that every route mount tears down the old listener and
 *   sets up a new one, causing a visible blank/loading flash on every
 *   navigation even when nothing has changed.
 *
 *   This module caches the last-known snapshot value per Firestore path so
 *   that on re-mount we can instantly populate the UI with stale-while-
 *   revalidating data.  The real-time listener still runs in the background
 *   and will overwrite the cached value as soon as Firestore confirms the
 *   data is up-to-date (or pushes a change).
 *
 * Cache flag:
 *   Controlled by `configs/cache` → { isCached: true|false } in Firestore.
 *   Loaded once after login via loadAppConfig().  When flag is false, all
 *   cache reads return null and writes are no-ops — behaves as if the cache
 *   does not exist.
 *
 * Invalidation:
 *   Call invalidate(path) after any write (add/update/delete) so the next
 *   cold mount always fetches fresh data.
 *   The live onSnapshot listener on the same path will still fire and
 *   refresh the UI in real time regardless of the cache state.
 */

// Module-level singleton — survives across route changes within the same tab
const _cache = new Map()

// Set by loadAppConfig() after login
let _cacheEnabled = true

/**
 * Called once after login with the resolved config flag.
 * @param {boolean} enabled
 */
export function setCacheEnabled(enabled) {
  _cacheEnabled = !!enabled
  if (!enabled) _cache.clear()
}

/**
 * Returns whether caching is currently active.
 */
export function isCacheEnabled() {
  return _cacheEnabled
}

/**
 * Store a value for the given Firestore path.
 * @param {string} path
 * @param {*}      value  — anything (array, object, primitive)
 */
export function setCache(path, value) {
  if (!_cacheEnabled) return
  _cache.set(path, value)
}

/**
 * Retrieve the cached value for the given path.
 * Returns null when caching is disabled or the path has no entry.
 * @param {string} path
 * @returns {*|null}
 */
export function getCache(path) {
  if (!_cacheEnabled) {
    console.log(`[cache] DISABLED — ${path}`)
    return null
  }
  const hit = _cache.has(path)
  console.log(`[cache] ${hit ? 'HIT' : 'MISS'} — ${path}`)
  return hit ? _cache.get(path) : null
}

/**
 * Remove a single cached entry.  Call after writes so the next mount gets
 * fresh data.  The running onSnapshot listener is not affected.
 * @param {string} path
 */
export function invalidate(path) {
  _cache.delete(path)
}

/**
 * Remove all cached entries whose key starts with `prefix`.
 * Useful when a whole month's worth of data changes.
 * @param {string} prefix
 */
export function invalidateByPrefix(prefix) {
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key)
  }
}

/**
 * Wipe the entire cache (e.g. on logout).
 */
export function clearAllCache() {
  _cache.clear()
}
