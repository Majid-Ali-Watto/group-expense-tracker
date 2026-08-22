#!/usr/bin/env node
// One-time migration: copy isAdmin/billedUser/bugResolver off users/{uid} onto
// the new, separately-secured user-admin-flags/{uid} collection, then (in a
// later run) strip them off users/{uid}.
//
// Uses the project's existing `firebase` client SDK — no service account, no
// admin SDK. It signs in as a real admin account and is bound by the exact
// same firestore.rules as the app itself, so it only works once the updated
// rules (adding the user-admin-flags collection + the callerIsAdmin()/
// callerIsBugStaff() fallback) are deployed. See scripts/migrate-user-admin-flags.md
// for the full rollout order — running this out of order is safe (it will
// just fail with permission-denied), never destructive out of order.
//
// Usage:
//   node --env-file=.env scripts/migrate-user-admin-flags.mjs           # copy mode (default)
//   node --env-file=.env scripts/migrate-user-admin-flags.mjs --cleanup # strip legacy fields
//
// You'll be prompted for an admin's email + password on stdin — never pass
// credentials on the command line (shell history) or hardcode them here.

import { createInterface } from 'node:readline'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteField
} from 'firebase/firestore'

const ADMIN_FLAG_FIELDS = ['isAdmin', 'billedUser', 'bugResolver']
const USERS_COLLECTION = 'users'
const USER_ADMIN_FLAGS_COLLECTION = 'user-admin-flags'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing ${name} — run with: node --env-file=.env ${process.argv[1]}`
    )
  }
  return value
}

function promptVisible(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// Reads a line from stdin without echoing the typed characters (masks with
// `*`). Good enough for a one-time interactive admin script — not meant to be
// bulletproof terminal-emulator handling.
function promptHidden(query) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      // Not an interactive terminal (e.g. piped input) — fall back to a
      // plain, unmasked read so the script still works.
      promptVisible(query).then(resolve, reject)
      return
    }

    process.stdout.write(query)
    let input = ''
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    const onData = (char) => {
      switch (char) {
        case '\n':
        case '\r':
        case '': // Ctrl-D
          stdin.setRawMode(false)
          stdin.pause()
          stdin.removeListener('data', onData)
          process.stdout.write('\n')
          resolve(input)
          break
        case '': // Ctrl-C
          stdin.setRawMode(false)
          process.stdout.write('\n')
          process.exit(1)
          break
        case '': // Backspace
        case '\b':
          if (input.length > 0) {
            input = input.slice(0, -1)
            process.stdout.write('\b \b')
          }
          break
        default:
          input += char
          process.stdout.write('*')
      }
    }

    stdin.on('data', onData)
  })
}

async function main() {
  const cleanup = process.argv.includes('--cleanup')

  const app = initializeApp({
    apiKey: requireEnv('VITE_API_KEY'),
    authDomain: requireEnv('VITE_AUTH_DOMAIN'),
    projectId: requireEnv('VITE_PROJECT_ID'),
    storageBucket: process.env.VITE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_MESSAGE_SENDER_ID,
    appId: process.env.VITE_APP_ID
  })

  // App Check: only wired up if this project enforces it (see
  // src/helpers/firebase-app-check.js) and a debug token is available. Safe
  // to skip — initializeAppCheck is a no-op here if enforcement is off. If
  // this fails with an App Check error, register a fresh debug token in
  // Firebase Console → App Check → Manage debug tokens and set
  // VITE_APP_CHECK_DEBUG_TOKEN to it (see that file's own comment).
  const debugToken = process.env.VITE_APP_CHECK_DEBUG_TOKEN
  if (debugToken) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken
    try {
      const { initializeAppCheck, CustomProvider } = await import(
        'firebase/app-check'
      )
      initializeAppCheck(app, {
        // The debug token above takes over token generation entirely — this
        // provider is never actually invoked, it just satisfies the required
        // shape.
        provider: new CustomProvider({
          getToken: () =>
            Promise.reject(new Error('unused — debug token active'))
        }),
        isTokenAutoRefreshEnabled: false
      })
    } catch (error) {
      console.warn(
        'Could not initialize App Check debug provider — continuing without it:',
        error.message
      )
    }
  }

  const auth = getAuth(app)
  const db = getFirestore(app)

  const email = await promptVisible("Admin's email: ")
  const password = await promptHidden("Admin's password: ")
  await signInWithEmailAndPassword(auth, email, password)
  console.log(`Signed in as ${email}.`)

  const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION))
  const candidates = usersSnapshot.docs.filter((docSnap) => {
    const data = docSnap.data()
    return ADMIN_FLAG_FIELDS.some((field) => field in data)
  })

  console.log(
    `Found ${candidates.length} of ${usersSnapshot.size} users/{uid} docs carrying ` +
      `${ADMIN_FLAG_FIELDS.join('/')}.`
  )

  if (!cleanup) {
    let copied = 0
    for (const docSnap of candidates) {
      const data = docSnap.data()
      const flags = {}
      for (const field of ADMIN_FLAG_FIELDS) {
        flags[field] = data[field] === true
      }
      await setDoc(doc(db, USER_ADMIN_FLAGS_COLLECTION, docSnap.id), flags, {
        merge: true
      })
      copied += 1
      console.log(
        `  copied ${docSnap.id}: ${ADMIN_FLAG_FIELDS.map((f) => `${f}=${flags[f]}`).join(', ')}`
      )
    }
    console.log(
      `\nCopy complete: ${copied} user-admin-flags/{uid} docs written.\n` +
        'Next: deploy the new app code, confirm it works, then re-run this ' +
        'script with --cleanup.'
    )
  } else {
    let stripped = 0
    for (const docSnap of candidates) {
      const clears = {}
      for (const field of ADMIN_FLAG_FIELDS) {
        if (field in docSnap.data()) clears[field] = deleteField()
      }
      await updateDoc(doc(db, USERS_COLLECTION, docSnap.id), clears)
      stripped += 1
      console.log(`  stripped ${docSnap.id}`)
    }
    console.log(
      `\nCleanup complete: ${stripped} users/{uid} docs no longer carry ` +
        `${ADMIN_FLAG_FIELDS.join('/')}. This is the step that actually closes ` +
        'the exposure — confirm admin/bug-resolver/billed access still works ' +
        'for a few real accounts before considering this done.'
    )
  }

  await signOut(auth)
}

main().catch((error) => {
  console.error('\nMigration failed:', error)
  process.exitCode = 1
})
