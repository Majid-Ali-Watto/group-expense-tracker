import { ref, onMounted, onUnmounted } from 'vue'

// How long a browser-reported `offline` must persist before we believe it.
//
// The `offline` event is not a reliable "the user has no internet" signal on
// its own — browsers fire a spurious offline/online pair on Wi-Fi <-> cellular
// handover, VPN connect/disconnect, network-interface changes and sleep/wake.
// Because App.vue swaps the whole app subtree on `isOnline` (v-if), every one
// of those blips tore the tree down and remounted it a moment later, wiping
// in-progress form state. Requiring the offline reading to still hold after a
// short window swallows the blips; a real outage keeps `navigator.onLine`
// false, so OfflinePage still appears, just this much later.
const OFFLINE_CONFIRM_MS = 3000

// Tracks live network connectivity via the browser's online/offline events.
// navigator.onLine (not "isOnline") is the real API — it also updates
// reactively, unlike reading it once at setup.
//
// Guarded for SSR: Node (vite-ssg's prerender pass) has no real `navigator`
// connectivity signal — `navigator.onLine` there is `undefined`, not a
// meaningful offline reading. Left unguarded, that falsy value made every
// prerendered page's static HTML render <OfflinePage> ("You're offline")
// instead of the real content — visible to crawlers, and flashed on every
// client load until hydration corrected it. Defaulting to `true` when there's
// no real boolean to read fixes both: the common case (visitor is online)
// matches on hydration with no flicker, and an actually-offline visitor still
// sees this flip to OfflinePage immediately after mount, same as before.
export function useOnlineStatus() {
  const isOnline = ref(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  )
  // Pending offline confirmation, if an `offline` event is currently being
  // held in the OFFLINE_CONFIRM_MS window above.
  let pendingOffline = null
  const cancelPendingOffline = () => {
    if (pendingOffline === null) return
    clearTimeout(pendingOffline)
    pendingOffline = null
  }
  // Recovery is never in doubt — the browser only fires `online` once it has
  // a connection again — so go back immediately and drop any held offline.
  const setOnline = () => {
    cancelPendingOffline()
    isOnline.value = true
  }
  const setOffline = () => {
    // Already offline, or already waiting to confirm one — nothing to add.
    if (!isOnline.value || pendingOffline !== null) return
    pendingOffline = setTimeout(() => {
      pendingOffline = null
      // Re-read rather than trusting the event that scheduled this: only a
      // reading that still says offline is a real outage. An `online` event
      // would have cancelled this timer, but a transition the browser never
      // announced (or announced out of order) is caught here too.
      if (navigator.onLine === false) isOnline.value = false
    }, OFFLINE_CONFIRM_MS)
  }
  onMounted(() => {
    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)
  })
  onUnmounted(() => {
    window.removeEventListener('online', setOnline)
    window.removeEventListener('offline', setOffline)
    cancelPendingOffline()
  })
  return { isOnline }
}
