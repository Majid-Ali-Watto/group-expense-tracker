import { ElNotification, ElButton } from 'element-plus'
import { h } from 'vue'

let _notified = false

/**
 * Triggers a service worker update check and, if a new version is found,
 * shows a persistent notification with an "Update now" button.
 *
 * The SW no longer auto-activates (skipWaiting removed from workbox config),
 * so it stays in "waiting" state until we explicitly send SKIP_WAITING.
 * This gives the notification time to appear before any reload happens.
 *
 * Safe to call multiple times — only shows the notification once per session.
 */
export async function checkForAppUpdate() {
  if (!('serviceWorker' in navigator) || _notified) return

  // Wait for the page to fully render before showing any notification,
  // so the popup doesn't appear before the login UI is visible.
  await new Promise((resolve) => setTimeout(resolve, 2000))

  if (_notified) return // re-check in case another call resolved first

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return

    // Force a network check now — browsers throttle this to every 24 hours.
    await registration.update().catch(() => {})

    // Case 1: a new SW already downloaded and is waiting (most common on revisit)
    if (registration.waiting) {
      _showUpdateNotification(registration.waiting)
      return
    }

    // Case 2: update() triggered a fresh download — wait for it to finish
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        // 'installed' means the SW finished downloading and is now waiting.
        // Because skipWaiting is NOT set, it stays here until we tell it to go.
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          _showUpdateNotification(newWorker)
        }
      })
    })
  } catch {
    // silently ignore — update check is best-effort
  }
}

function _showUpdateNotification(waitingWorker) {
  if (_notified) return
  _notified = true

  ElNotification({
    title: '🚀 New version available',
    message: h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [
      h('span', 'A new version of the app is ready.'),
      h(
        ElButton,
        {
          type: 'primary',
          size: 'small',
          onClick: () => {
            // Attach a precise, one-shot controllerchange listener BEFORE sending
            // SKIP_WAITING so the reload fires ONLY because the user clicked here,
            // not from any unrelated SW lifecycle event.
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              () => window.location.reload(),
              { once: true }
            )
            waitingWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        },
        () => 'Update now'
      )
    ]),
    type: 'info',
    duration: 0, // stay until dismissed or user clicks Update
    position: 'top-right'
  })
}
