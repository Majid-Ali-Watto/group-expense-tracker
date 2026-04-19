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

import { reactive } from 'vue'
import { database, doc, onSnapshot } from '@/firebase'
import { DB_NODES } from '@/constants'
import { setCacheEnabled } from '@/utils/queryCache'

// Module-level singleton — loaded once per session, shared everywhere
const _config = reactive({
  storage: null, // null = not yet loaded (use defaults)
  app: null,
  downloads: null,
  manageTabs: null,
  bugs: null,
  ocr: null
})

let _loaded = false
let _unsubscribers = []

function resetConfigState() {
  _config.storage = null
  _config.app = null
  _config.downloads = null
  _config.manageTabs = null
  _config.bugs = null
  _config.ocr = null
  setCacheEnabled(true)
}

/**
 * Load app config from Firestore.
 * Called once after successful login. Subsequent calls are no-ops.
 * Subscribes to config documents in real time:
 *   configs/storage  → { cloudinary, firebase }  (storage provider flags)
 *   configs/cache    → { isCached }               (feature flags)
 *   configs/downloads → { pdf, excel }            (download button flags)
 *   configs/manage-tabs → { showManageTab }       (manage-tabs visibility)
 *   configs/bugs → { report }                     (bug-report visibility)
 */
export async function loadAppConfig() {
  if (_loaded) return
  _loaded = true

  const listeners = [
    {
      key: 'storage',
      ref: doc(database, DB_NODES.CONFIGS, 'storage'),
      onData: (snap) => {
        _config.storage = snap.exists() ? snap.data() : {}
      },
      onError: () => {
        _config.storage = {}
      }
    },
    {
      key: 'app',
      ref: doc(database, DB_NODES.CONFIGS, 'cache'),
      onData: (snap) => {
        _config.app = snap.exists() ? snap.data() : {}
        // Default: cache enabled (true) unless explicitly set to false
        setCacheEnabled(_config.app?.isCached !== false)
      },
      onError: () => {
        _config.app = {}
        setCacheEnabled(true)
      }
    },
    {
      key: 'downloads',
      ref: doc(database, DB_NODES.CONFIGS, 'downloads'),
      onData: (snap) => {
        _config.downloads = snap.exists() ? snap.data() : {}
      },
      onError: () => {
        _config.downloads = {}
      }
    },
    {
      key: 'manageTabs',
      ref: doc(database, DB_NODES.CONFIGS, 'manage-tabs'),
      onData: (snap) => {
        _config.manageTabs = snap.exists() ? snap.data() : {}
      },
      onError: () => {
        _config.manageTabs = {}
      }
    },
    {
      key: 'bugs',
      ref: doc(database, DB_NODES.CONFIGS, 'bugs'),
      onData: (snap) => {
        _config.bugs = snap.exists() ? snap.data() : {}
      },
      onError: () => {
        _config.bugs = {}
      }
    },
    {
      key: 'email',
      ref: doc(database, DB_NODES.CONFIGS, 'email'),
      onData: (snap) => {
        _config.email = snap.exists() ? snap.data() : {}
      },
      onError: () => {
        _config.email = {}
      }
    },
    {
      key: 'ocr',
      ref: doc(database, DB_NODES.CONFIGS, 'ocr'),
      onData: (snap) => {
        _config.ocr = snap.exists() ? snap.data() : {}
      },
      onError: () => {
        _config.ocr = {}
      }
    }
  ]

  _unsubscribers = listeners.map(({ ref, onData, onError }) =>
    onSnapshot(ref, onData, onError)
  )
}

export function stopAppConfigSync() {
  _unsubscribers.forEach((unsubscribe) => unsubscribe?.())
  _unsubscribers = []
  _loaded = false
  resetConfigState()
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
    return { cloudinary: true, firebase: true, upload_allowed: true }
  }
  return {
    cloudinary: cfg.cloudinary !== false,
    firebase: cfg.firebase !== false,
    upload_allowed: cfg.upload_allowed !== false
  }
}

export function getDownloadConfig() {
  const cfg = _config.downloads
  if (!cfg) {
    return { pdf: true, excel: true }
  }

  return {
    pdf: cfg.pdf !== false,
    excel: cfg.excel !== false
  }
}

export function getManageTabsConfig() {
  const cfg = _config.manageTabs
  if (!cfg) {
    return { showManageTab: true }
  }

  return {
    showManageTab: cfg.showManageTab !== false
  }
}

export function getBugReportConfig() {
  const cfg = _config.bugs
  if (!cfg) {
    return { report: true }
  }

  return {
    report: cfg.report !== false
  }
}

export function getEmailConfig() {
  const cfg = _config.email
  if (!cfg) {
    return { send: true, free_email_limit_per_month: null, paid_emails_limit_per_month: null }
  }

  return {
    send: cfg.send !== false,
    free_email_limit_per_month: cfg.free_email_limit_per_month ?? null,
    paid_emails_limit_per_month: cfg.paid_emails_limit_per_month ?? null
  }
}

export function getOcrConfig() {
  const cfg = _config.ocr
  if (!cfg) {
    return { extract_allowed: true, free_extraction_limit_per_month: null, paid_extraction_limit_per_month: null }
  }

  return {
    extract_allowed: cfg.extract_allowed !== false,
    free_extraction_limit_per_month: cfg.free_extraction_limit_per_month ?? null,
    paid_extraction_limit_per_month: cfg.paid_extraction_limit_per_month ?? null
  }
}
