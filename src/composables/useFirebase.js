import { ref } from 'vue'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  arrayUnion
} from 'firebase/firestore'
import { database } from '@/firebase'
import { startLoading, stopLoading, withLoading } from '@/utils/loading'
import { withTrace } from '@/utils/performance'
import getCurrentMonth, { dateToMonthNode } from '@/utils/getCurrentMonth'
import { resetForm } from '@/utils/reset-form'
import { showError, showSuccess } from '@/utils/showAlerts'
import { DB_NODES } from '@/constants'

export default function useFireBase() {
  const isSubmitting = ref(false)

  async function runMutation(task, successMessage) {
    if (isSubmitting.value) return null

    isSubmitting.value = true
    const loading = startLoading()

    try {
      const result = await task()
      if (successMessage) showSuccess(successMessage)
      return result
    } catch (error) {
      console.error(error)
      showError(error.message)
      return null
    } finally {
      isSubmitting.value = false
      stopLoading(loading)
    }
  }

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
    return withLoading(
      () =>
        withTrace('db_read', async () => {
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
        }),
      loading
    )
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
    return withLoading(
      () =>
        withTrace('db_read_shallow', async () => {
          const snap = await getDocs(collection(database, path))
          return snap.docs.map((d) => d.id)
        }),
      loading
    )
  }

  /**
   * Deletes a Firestore document at the given path and shows a success toast.
   *
   * @param {string} path - Even-segment Firestore document path.
   * @param {string} message - Success message shown after deletion.
   */
  async function deleteData(path, message) {
    return runMutation(
      () => withTrace('db_delete', () => deleteDoc(doc(database, path))),
      message
    )
  }

  /**
   * Merges (shallow-updates) fields into an existing Firestore document.
   *
   * @param {string} path - Even-segment Firestore document path.
   * @param {() => Object} getData - Factory returning the fields to update.
   * @param {string} message - Success message shown after update.
   */
  async function updateData(path, getData, message) {
    return runMutation(
      () =>
        withTrace('db_update', () => updateDoc(doc(database, path), getData())),
      message
    )
  }

  function getNewData(formData) {
    return {
      amount: formData.amount,
      category: formData.category || 'Other',
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
    return runMutation(
      () =>
        withTrace('db_save', async () => {
          const data = getData()
          const createdDoc = await addDoc(
            collection(database, collectionPath),
            data
          )

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

          // Also record the month ID on the grandparent collection document so
          // fetchMonths() can read one document instead of a full getDocs across
          // the months sub-collection (saves N-1 reads per month list load where
          // N is the number of months with data).
          const segs = collectionPath.split('/')
          if (segs.length >= 5 && segs[segs.length - 3] === 'months') {
            const grandparentPath = segs.slice(0, 2).join('/')
            const monthId = segs[segs.length - 2]
            await setDoc(
              doc(database, grandparentPath),
              { months: arrayUnion(monthId) },
              { merge: true }
            )
          }

          if (collectionPath.includes(DB_NODES.SHARED_EXPENSES)) {
            // Cross-post a simplified record to each payer's personal-expenses.
            // For multiple-payer expenses each payer gets their own record with
            // their individual amount; single-payer uses the full expense amount.
            const monthYear = dateToMonthNode(data.date)
            const payerEntries =
              data.payerMode === 'multiple' && data.payers?.length
                ? data.payers
                    .filter((p) => p.uid)
                    .map((p) => ({ key: p.uid, amount: p.amount }))
                : data.payer
                  ? [{ key: data.payer, amount: data.amount }]
                  : []

            for (const { key, amount } of payerEntries) {
              const personalPath = `${DB_NODES.PERSONAL_EXPENSES}/${key}/months/${monthYear}/expenses`
              await addDoc(
                collection(database, personalPath),
                getNewData({ ...data, payer: key, amount })
              )
              await setDoc(
                doc(
                  database,
                  `${DB_NODES.PERSONAL_EXPENSES}/${key}/months/${monthYear}`
                ),
                {},
                { merge: true }
              )
              await setDoc(
                doc(database, `${DB_NODES.PERSONAL_EXPENSES}/${key}`),
                { months: arrayUnion(monthYear) },
                { merge: true }
              )
            }
          }
          resetForm(formRef)
          onSuccess?.(createdDoc, data)
        }),
      message
    )
  }

  /**
   * Writes (overwrites) a Firestore document at the given path.
   *
   * @param {string} path - Even-segment Firestore document path.
   * @param {Object} data - Data to write.
   * @param {string} [message] - Optional success toast message.
   */
  async function setData(path, data, message) {
    return runMutation(
      () => withTrace('db_set', () => setDoc(doc(database, path), data)),
      message
    )
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
