// Split out of src/firebase.js so code that only needs an auth-state check
// (the router guard's silent-session detection, App.vue's onAuthStateChanged
// listener — both run on EVERY route including public marketing pages) never
// pulls in the much larger Firestore SDK that src/firebase.js also bundles.
// src/firebase.js re-exports auth-related names from here instead of calling
// getAuth() itself, so `auth` stays a single instance either way.
import {
  getAuth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { app } from '@/helpers/firebase-app'
// Must run before getAuth() — see the comment in firebase-app-check.js for why.
import '@/helpers/firebase-app-check'

const auth = getAuth(app)

// Resolves once with the initial Firebase Auth user (or null) after Auth's
// first state check completes. Moved here from src/router/index.js — it's
// an auth-SDK concern, and both the router guard and App.vue's session
// bootstrap (each lazy-loaded independently) need it.
const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe()
    resolve(user)
  })
})

export {
  auth,
  authReady,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
}
