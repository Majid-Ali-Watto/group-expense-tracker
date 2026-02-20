/**
 * Dual-layer session token encryption.
 *
 * Two independent, non-extractable CryptoKeys live only in JS memory:
 *   _sessionKey  — AES-GCM 256  → used for the sessionStorage blob
 *   _storeKey    — AES-CBC 256  → used for the Pinia store value
 *
 * On verification both blobs are decrypted independently; the two resulting
 * plain tokens must match each other.  An attacker who reads sessionStorage
 * gets useless GCM ciphertext.  One who reads the Pinia store gets useless
 * CBC ciphertext.  Even with both blobs, neither key is ever exportable.
 */

// ── Key registry ──────────────────────────────────────────────────────────────

let _sessionKey = null // AES-GCM — for sessionStorage
let _storeKey = null // AES-CBC — for Pinia store

async function getSessionKey() {
  if (!_sessionKey) {
    _sessionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    )
  }
  return _sessionKey
}

async function getStoreKey() {
  if (!_storeKey) {
    _storeKey = await crypto.subtle.generateKey(
      { name: 'AES-CBC', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    )
  }
  return _storeKey
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

// ── sessionStorage layer — AES-GCM (12-byte IV) ───────────────────────────────

export async function encryptForSession(token) {
  const key = await getSessionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(token)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  const combined = new Uint8Array(12 + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), 12)
  return toBase64(combined)
}

export async function decryptFromSession(encryptedBase64) {
  if (!_sessionKey) return null
  try {
    const combined = fromBase64(encryptedBase64)
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      _sessionKey,
      data
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}

// ── Pinia store layer — AES-CBC (16-byte IV) ──────────────────────────────────

export async function encryptForStore(token) {
  const key = await getStoreKey()
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const encoded = new TextEncoder().encode(token)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    encoded
  )

  const combined = new Uint8Array(16 + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), 16)
  return toBase64(combined)
}

export async function decryptFromStore(encryptedBase64) {
  if (!_storeKey) return null
  try {
    const combined = fromBase64(encryptedBase64)
    const iv = combined.slice(0, 16)
    const data = combined.slice(16)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      _storeKey,
      data
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}
