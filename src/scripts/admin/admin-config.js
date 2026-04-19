import { reactive, ref, onUnmounted } from 'vue'
import { database, doc, setDoc, onSnapshot } from '@/firebase'
import { DB_NODES } from '@/constants'
import { showError, showSuccess } from '@/utils'

const CONFIG_DOCS = ['storage', 'cache', 'downloads', 'manage-tabs', 'bugs', 'email', 'ocr']

export function AdminConfig() {
  const configs = reactive(
    Object.fromEntries(CONFIG_DOCS.map((id) => [id, null]))
  )
  const loading = ref(true)
  const saving = ref(false)

  const unsubscribers = CONFIG_DOCS.map((docId) =>
    onSnapshot(
      doc(database, DB_NODES.CONFIGS, docId),
      (snap) => {
        configs[docId] = snap.exists() ? snap.data() : {}
        if (CONFIG_DOCS.every((id) => configs[id] !== null)) {
          loading.value = false
        }
      },
      () => {
        configs[docId] = {}
      }
    )
  )

  onUnmounted(() => unsubscribers.forEach((u) => u()))

  async function updateField(docId, field, value) {
    saving.value = true
    try {
      await setDoc(
        doc(database, DB_NODES.CONFIGS, docId),
        { [field]: value },
        { merge: true }
      )
      showSuccess('Config updated.')
    } catch (error) {
      console.error('Failed to update config:', error)
      showError('Failed to update config.')
    } finally {
      saving.value = false
    }
  }

  return { configs, loading, saving, updateField }
}
