// Straight from the helper, not '@/firebase' — that module also bundles the
// full Firestore SDK, which this file has no reason to pull in.
import { performanceReady } from '@/helpers/firebase-performance'

let perfModulePromise = null

function getPerfModule() {
  perfModulePromise ||= import('firebase/performance')
  return perfModulePromise
}

/**
 * Runs `asyncFn` wrapped in a Firebase Performance custom trace.
 * In dev / when the SDK is unavailable the function runs unwrapped.
 *
 * @param {string} traceName - Trace name visible in Firebase Console → Performance.
 * @param {() => Promise<T>} asyncFn - The async work to measure.
 * @returns {Promise<T>}
 */
export async function withTrace(traceName, asyncFn) {
  const perf = await performanceReady
  if (!perf) return asyncFn()

  const { trace } = await getPerfModule()
  const t = trace(perf, traceName)
  t.start()
  try {
    return await asyncFn()
  } finally {
    t.stop()
  }
}
