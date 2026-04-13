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
import { app } from '@/helpers/firebase-app'
import { analyticsReady } from '@/helpers/firebase-analytics'
import { performanceReady } from '@/helpers/firebase-performance'
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
