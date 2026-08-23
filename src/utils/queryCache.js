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
    return null
  }
  const hit = _cache.has(path)
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

// Must match the `cacheName` Workbox is configured with in vite.config.js's
// PWA runtimeCaching entry — this is the Cache Storage bucket the service
// worker actually writes fetched images into (CacheFirst, 30-day TTL).
const SERVICE_WORKER_IMAGE_CACHE = 'firebase-images'

/**
 * Wipe the entire cache (e.g. on logout).
 *
 * Only clears the in-memory query cache by itself — it never touched the
 * service worker's own Cache Storage, so receipt/avatar images fetched
 * during the session stayed recoverable (via browser devtools) on a shared
 * device for up to the cache's 30-day expiration, well after logout. Purge
 * that too, best-effort: Cache Storage can be unavailable (e.g. private
 * browsing in some browsers) or there may be no service worker at all in
 * dev, so failures here are swallowed rather than surfaced to the user.
 */
export function clearAllCache() {
  _cache.clear()

  if (typeof caches === 'undefined') return

  caches.delete(SERVICE_WORKER_IMAGE_CACHE).catch(() => {
    // best-effort — nothing the user can act on
  })
}

/**
 * Wipe EVERY Cache Storage bucket for this origin, not just the named
 * image bucket above — including Workbox's own precache of the app shell
 * (JS/CSS/HTML). This is heavier than clearAllCache() and is meant for the
 * explicit "Clear site cache" action in Settings, not the silent call on
 * every logout: deleting the precache there is harmless (the next
 * navigation re-fetches over the network and the service worker
 * re-precaches), but doing it on every logout would be wasteful.
 *
 * @returns {Promise<boolean>} true if Cache Storage was available and the
 *   clear was attempted, false if this browser/context has no Cache
 *   Storage at all (e.g. private browsing in some browsers) — lets the
 *   caller decide whether to tell the user there was nothing to clear.
 */
export async function clearAllSiteCaches() {
  _cache.clear()

  if (typeof caches === 'undefined') return false

  const names = await caches.keys()
  await Promise.all(names.map((name) => caches.delete(name).catch(() => {})))
  return true
}
