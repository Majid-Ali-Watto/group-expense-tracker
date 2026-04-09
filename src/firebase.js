import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
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
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analyticsReady =
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  import.meta.env.VITE_MEASUREMENT_ID
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
        .catch((error) => {
          console.warn('Firebase Analytics is unavailable:', error)
          return null
        })
    : Promise.resolve(null)

// App Check — debug token in dev, reCAPTCHA in production.
// The debug token is printed to the browser console on first load;
// register it once in Firebase Console → App Check → Manage debug tokens.
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN || true
}
let appCheck = null
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  })
}

const database = getFirestore(app)
const auth = getAuth(app)

export {
  app,
  analyticsReady,
  appCheck,
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
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut
}
