import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  collectionGroup,
  deleteField,
  writeBatch
} from 'firebase/firestore'
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
import { analyticsReady } from '@/helpers/firebase-analytics'
import { performanceReady } from '@/helpers/firebase-performance'
// Registers App Check before the first getAuth() call anywhere in the app —
// see the comment in firebase-app-check.js. Idempotent (ES modules dedupe by
// URL) whether this file or src/firebase-auth.js's own import of it runs
// first — getAuth(app) itself is also idempotent, returning the same
// singleton auth instance either module calls it from, so there's no
// duplicate-initialization risk from wiring auth independently here too
// (kept self-contained rather than re-exporting from firebase-auth.js,
// which tripped up Rollup's SSR bundling on this re-export chain).
import '@/helpers/firebase-app-check'

const database = getFirestore(app)
const auth = getAuth(app)

export {
  app,
  analyticsReady,
  performanceReady,
  database,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  collectionGroup,
  deleteField,
  writeBatch,
  auth,
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
