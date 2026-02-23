import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  push,
  onValue,
  update,
  remove,
  get,
  off
} from 'firebase/database'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updateProfile,
  deleteUser
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_DATABASE_URL,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGE_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
}
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const auth = getAuth(app)

export {
  database,
  ref,
  push,
  onValue,
  update,
  remove,
  get,
  off,
  auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updateProfile,
  deleteUser
}
