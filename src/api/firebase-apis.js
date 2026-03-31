import { ref } from 'vue'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs
} from 'firebase/firestore'
import { database } from '../firebase'
import { startLoading, stopLoading, withLoading } from '../utils/loading'
import { showError, showSuccess } from '../utils/showAlerts'
import { resetForm } from '../utils/reset-form'
import getCurrentMonth, { dateToMonthNode } from '../utils/getCurrentMonth'
import { DB_NODES } from '../constants/db-nodes'

export default function useFireBase() {
  const isSubmitting = ref(false)

  /**
   * Returns a Firestore collection or document reference based on path segment count.
   * Odd segment count → collection reference; even segment count → document reference.
   *
   * @param {string} path - Slash-separated Firestore path, e.g. "groups/groupId" or "groups".
   */
  function dbRef(path) {
    const segments = path.split('/')
    return segments.length % 2 === 0
      ? doc(database, path)
      : collection(database, path)
  }

  /**
   * Reads a Firestore document or all documents in a collection by path.
   * Documents return their data object; collections return an id-keyed map.
   *
   * @param {string} path - Firestore path string.
   * @param {boolean} loading - Whether to show global loading indicator.
   * @returns {Promise<Object|null>}
   */
  async function read(path, loading = true) {
    return withLoading(async () => {
      const segments = path.split('/')
      if (segments.length % 2 === 0) {
        // Even segments → document
        const snap = await getDoc(doc(database, path))
        return snap.exists() ? { id: snap.id, ...snap.data() } : null
      } else {
        // Odd segments → collection — return id-keyed map
        const snap = await getDocs(collection(database, path))
        if (snap.empty) return null
        const result = {}
        snap.docs.forEach((d) => {
          result[d.id] = { id: d.id, ...d.data() }
        })
        return result
      }
    }, loading)
  }

  /**
   * Lists direct child document IDs of a collection path.
   * Replaces the old ?shallow=true REST hack used with RTDB.
   *
   * @param {string} path - Firestore collection path (odd segment count).
   * @param {boolean} loading - Whether to show global loading indicator.
   * @returns {Promise<string[]>}
   */
  async function readShallow(path, loading = true) {
    return withLoading(async () => {
      const snap = await getDocs(collection(database, path))
      return snap.docs.map((d) => d.id)
    }, loading)
  }

  /**
   * Deletes a Firestore document at the given path and shows a success toast.
   *
   * @param {string} path - Even-segment Firestore document path.
   * @param {string} message - Success message shown after deletion.
   */
  async function deleteData(path, message) {
    if (isSubmitting.value) return
    isSubmitting.value = true
    const loading = startLoading()
    try {
      await deleteDoc(doc(database, path))
      showSuccess(message)
    } catch (error) {
      showError(error.message)
    } finally {
      isSubmitting.value = false
      stopLoading(loading)
    }
  }

  /**
   * Merges (shallow-updates) fields into an existing Firestore document.
   *
   * @param {string} path - Even-segment Firestore document path.
   * @param {() => Object} getData - Factory returning the fields to update.
   * @param {string} message - Success message shown after update.
   */
  async function updateData(path, getData, message) {
    if (isSubmitting.value) return
    isSubmitting.value = true
    const loading = startLoading()
    try {
      await updateDoc(doc(database, path), getData())
      showSuccess(message)
    } catch (error) {
      showError(error.message)
    } finally {
      isSubmitting.value = false
      stopLoading(loading)
    }
  }

  function getNewData(formData) {
    return {
      amount: formData.amount,
      description: formData.description,
      location: 'Islamabad',
      recipient: 'Expenses-Auto-Add, Paid by ' + formData.payer,
      month: getCurrentMonth(),
      whoAdded: formData.whoAdded,
      date: formData.date,
      whenAdded: formData.whenAdded
    }
  }

  /**
   * Adds a new document to a Firestore collection (Firestore auto-generates the ID).
   * When saving a shared expense also cross-posts a simplified record to personal-expenses.
   *
   * @param {string} collectionPath - Odd-segment Firestore collection path.
   * @param {() => Object} getData - Factory returning the document data.
   * @param {import('vue').Ref} formRef - Form ref to reset on success.
   * @param {string} message - Success toast message.
   * @param {() => void} [onSuccess] - Optional callback after save.
   */
  function saveData(collectionPath, getData, formRef, message, onSuccess) {
    if (isSubmitting.value) return
    isSubmitting.value = true
    const loading = startLoading()
    const data = getData()
    addDoc(collection(database, collectionPath), data)
      .then(async () => {
        // Ensure the parent "month" document exists so getDocs on the months
        // collection returns it. Firestore does not surface implicit documents
        // (those with sub-collections but no own fields) in getDocs results.
        const parentPath = collectionPath.split('/').slice(0, -1).join('/')
        if (
          parentPath.split('/').length % 2 === 0 &&
          parentPath.split('/').length >= 4
        ) {
          await setDoc(doc(database, parentPath), {}, { merge: true })
        }
        if (collectionPath.includes(DB_NODES.SHARED_EXPENSES)) {
          // Cross-post a simplified record to the payer's personal-expenses
          const payerKey = data.payer || 'unknown'
          const monthYear = dateToMonthNode(data.date)
          const personalPath = `${DB_NODES.PERSONAL_EXPENSES}/${payerKey}/months/${monthYear}/expenses`
          await addDoc(collection(database, personalPath), getNewData(data))
          // Ensure the personal-expenses month document also exists
          await setDoc(
            doc(
              database,
              `${DB_NODES.PERSONAL_EXPENSES}/${payerKey}/months/${monthYear}`
            ),
            {},
            { merge: true }
          )
        }
        showSuccess(message)
        resetForm(formRef)
        if (onSuccess) onSuccess()
      })
      .catch((error) => {
        console.error(error)
        showError(error.message)
      })
      .finally(() => {
        isSubmitting.value = false
        stopLoading(loading)
      })
  }

  /**
   * Writes (overwrites) a Firestore document at the given path.
   *
   * @param {string} path - Even-segment Firestore document path.
   * @param {Object} data - Data to write.
   * @param {string} [message] - Optional success toast message.
   */
  async function setData(path, data, message) {
    if (isSubmitting.value) return
    isSubmitting.value = true
    const loading = startLoading()
    try {
      await setDoc(doc(database, path), data)
      if (message) showSuccess(message)
    } catch (error) {
      showError(error.message)
    } finally {
      isSubmitting.value = false
      stopLoading(loading)
    }
  }

  /**
   * Deletes a Firestore document (no toast — used internally).
   *
   * @param {string} path - Even-segment Firestore document path.
   */
  async function removeData(path) {
    await deleteDoc(doc(database, path))
  }

  return {
    dbRef,
    read,
    readShallow,
    deleteData,
    updateData,
    saveData,
    setData,
    removeData,
    isSubmitting
  }
}
