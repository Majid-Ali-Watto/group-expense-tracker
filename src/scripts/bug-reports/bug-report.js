import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  auth,
  database,
  ref as dbRef,
  push,
  onValue,
  update,
  remove,
  set,
  runTransaction
} from '../../firebase'
import { DB_NODES } from '../../constants/db-nodes'
import { uploadToCloudinary, cleanupOldReceipts } from '../../utils/cloudinaryUpload'
import { useAuthStore } from '../../stores/authStore'
import { useUserStore } from '../../stores/userStore'
import { showError, showSuccess } from '../../utils/showAlerts'
import { NoteThread } from './note-thread'

const MAX_SCREENSHOTS = 3
const MAX_SIZE_MB = 2
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const BUG_NUMBER_PREFIX = 'khata-bug'
const BUG_NUMBER_PAD = 6

export const ALL_CATEGORIES = [
  { label: 'Shared Expenses',      value: 'shared-expenses' },
  { label: 'Shared Loans',         value: 'shared-loans' },
  { label: 'Personal Loans',       value: 'personal-loans' },
  { label: 'Personal Expenses',    value: 'personal-expenses' },
  { label: 'Groups',               value: 'groups' },
  { label: 'Notifications',        value: 'notifications' },
  { label: 'Authentication / Login', value: 'auth' },
  { label: 'Settlement',           value: 'settlement' },
  { label: 'Export (PDF / Excel)', value: 'export' },
  { label: 'Charts / Visuals',     value: 'charts' },
  { label: 'Other',                value: 'other' }
]

export const GUEST_CATEGORIES = [
  { label: 'Authentication / Login', value: 'auth' },
  { label: 'Other',                  value: 'other' }
]

export const SEVERITIES = [
  { label: 'Low',      value: 'low' },
  { label: 'Medium',   value: 'medium' },
  { label: 'High',     value: 'high' },
  { label: 'Critical', value: 'critical' }
]

export const STATUS_LABEL = {
  open: 'Open',
  'in-progress': 'In Progress',
  'needs-info': 'Needs Info',
  duplicate: 'Duplicate',
  'wont-fix': "Won't Fix",
  resolved: 'Resolved',
  closed: 'Closed'
}

const BUG_TEMPLATE = `**What happened?**
Describe the bug clearly.

**What did you expect?**
Describe what you expected to happen.

**Steps to reproduce**
1. Go to ...
2. Click on ...
3. See the error

**Additional context**
- Browser / device: 
- Does it happen every time? 
- Any error message? `

function emptyForm() {
  return { category: '', title: '', description: '', severity: 'medium', reporterName: '', reporterEmail: '' }
}

/**
 * Script module for the reporter-side Bug Report view.
 * Follows the project's factory-function pattern.
 *
 * @param {{ view: string, openBugId: string | null }} props
 */
export const BugReport = (props) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  const activeView = ref(props.view)
  const isLoggedIn = computed(() => !!authStore.getActiveUser)
  const loggedInUser = computed(() => {
    const mobile = authStore.getActiveUser
    return mobile ? userStore.getUserByMobile(mobile) : null
  })

  const categories = computed(() => isLoggedIn.value ? ALL_CATEGORIES : GUEST_CATEGORIES)

  // ── Validation rules ─────────────────────────────────────────────────────
  const rules = computed(() => ({
    category: [{ required: true, message: 'Please select a category', trigger: 'change' }],
    title: [
      { required: true, message: 'Please enter a title', trigger: 'blur' },
      { min: 5, message: 'Title must be at least 5 characters', trigger: 'blur' }
    ],
    description: [
      { required: true, message: 'Please describe the bug', trigger: 'blur' },
      { min: 20, message: 'Description must be at least 20 characters', trigger: 'blur' }
    ],
    ...(!isLoggedIn.value ? {
      reporterName: [
        { required: true, message: 'Please enter your name', trigger: 'blur' },
        { min: 2, message: 'Name must be at least 2 characters', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value && !/^[a-zA-Z\s''-]{2,}$/.test(value.trim())) {
              callback(new Error('Please enter a valid name (letters only)'))
            } else { callback() }
          },
          trigger: 'blur'
        }
      ],
      reporterEmail: [
        { required: true, message: 'Please enter your email', trigger: 'blur' },
        { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
      ]
    } : {})
  }))

  // ── Submit form state ─────────────────────────────────────────────────────
  const formRef = ref(null)
  const fileInputRef = ref(null)
  const submitting = ref(false)
  const uploadingScreenshots = ref(false)
  const submitted = ref(false)
  const lastSubmittedBugNumber = ref('')
  const screenshots = ref([])
  const uploadProgress = ref([])
  const form = ref(emptyForm())

  const isClean = computed(() =>
    !form.value.category && !form.value.title && !form.value.description &&
    form.value.severity === 'medium' && !screenshots.value.length
  )

  function applyTemplate() {
    if (form.value.description?.trim()) {
      ElMessageBox.confirm(
        'This will replace your current description with the template. Continue?',
        'Use Template',
        { confirmButtonText: 'Yes, use template', cancelButtonText: 'Cancel', type: 'warning' }
      ).then(() => { form.value.description = BUG_TEMPLATE }).catch(() => {})
    } else {
      form.value.description = BUG_TEMPLATE
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleFileChange(e) {
    const remaining = MAX_SCREENSHOTS - screenshots.value.length
    Array.from(e.target.files || []).slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith('image/')) { showError(`"${file.name}" is not an image file.`); return }
      if (file.size > MAX_SIZE_BYTES) { showError(`"${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`); return }
      screenshots.value.push({ file, preview: URL.createObjectURL(file) })
    })
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  function removeScreenshot(index) {
    URL.revokeObjectURL(screenshots.value[index].preview)
    screenshots.value.splice(index, 1)
  }

  function resetForm() {
    screenshots.value.forEach((s) => URL.revokeObjectURL(s.preview))
    screenshots.value = []
    uploadProgress.value = []
    form.value = emptyForm()
    submitted.value = false
    lastSubmittedBugNumber.value = ''
    formRef.value?.clearValidate()
  }

  async function reserveNextBugNumber() {
    const counterRef = dbRef(database, `${DB_NODES.BUG_REPORT_COUNTERS}/global`)
    const result = await runTransaction(counterRef, (current) => Number(current || 0) + 1)
    if (!result.committed) throw new Error('Failed to reserve bug number. Please try again.')
    const bugSequence = Number(result.snapshot.val())
    return {
      bugSequence,
      bugNumber: `${BUG_NUMBER_PREFIX}-${String(bugSequence).padStart(BUG_NUMBER_PAD, '0')}`
    }
  }

  async function submitReport() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    uploadProgress.value = []
    try {
      const screenshotMeta = []
      if (screenshots.value.length) {
        uploadingScreenshots.value = true
        uploadProgress.value = screenshots.value.map((s) => ({ name: s.file.name, percent: 0, status: '' }))
        for (let i = 0; i < screenshots.value.length; i++) {
          uploadProgress.value[i].percent = 30
          try {
            const result = await uploadToCloudinary(screenshots.value[i].file)
            screenshotMeta.push({ url: result.url, publicId: result.publicId })
            uploadProgress.value[i].percent = 100
            uploadProgress.value[i].status = 'success'
          } catch (err) {
            uploadProgress.value[i].status = 'exception'
            throw new Error(`Failed to upload "${screenshots.value[i].file.name}": ${err.message}`)
          }
        }
        uploadingScreenshots.value = false
      }

      const reporter = isLoggedIn.value
        ? { name: loggedInUser.value?.name || 'Unknown', email: auth.currentUser?.email || '', mobile: authStore.getActiveUser, isGuest: false }
        : { name: form.value.reporterName.trim(), email: form.value.reporterEmail.trim() || '', isGuest: true }

      const { bugNumber, bugSequence } = await reserveNextBugNumber()
      const report = {
        bugNumber, bugSequence,
        category: form.value.category,
        title: form.value.title.trim(),
        description: form.value.description.trim(),
        severity: form.value.severity,
        reporter,
        screenshots: screenshotMeta,
        submittedAt: new Date().toISOString(),
        status: 'open'
      }

      const mobileKey = reporter.isGuest ? 'guest' : reporter.mobile
      const newRef = await push(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobileKey}`), report)

      try {
        await set(
          dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/${newRef.key}`),
          { title: report.title, bugNumber: report.bugNumber, action: 'new', reporterName: reporter.name || 'Anonymous', updatedAt: report.submittedAt }
        )
      } catch (notificationError) {
        console.warn('Bug report submitted, but admin notification could not be created.', notificationError)
      }

      lastSubmittedBugNumber.value = report.bugNumber
      submitted.value = true
    } catch (err) {
      uploadingScreenshots.value = false
      showError(err.message || 'Submission failed. Please try again.')
    } finally {
      submitting.value = false
    }
  }

  // ── My Reports state ──────────────────────────────────────────────────────
  const myReports = ref([])
  const myReportsLoading = ref(false)
  const expandedIds = ref(new Set())
  const actionLoading = ref(null)
  let myReportsUnsubscribe = null

  function toggleExpand(id) {
    const next = new Set(expandedIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    expandedIds.value = next
  }

  async function deleteReport(r) {
    try {
      await ElMessageBox.confirm(
        `Delete report "<strong>${r.title}</strong>"? This cannot be undone.`,
        'Delete Report',
        { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning', dangerouslyUseHTMLString: true }
      )
      actionLoading.value = r.id
      const mobile = authStore.getActiveUser
      await remove(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobile}/${r.id}`))
      if (mobile) await remove(dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/${mobile}/${r.id}`))
      if (r.screenshots?.length) r.screenshots.forEach((ss) => cleanupOldReceipts([ss], []))
      showSuccess('Report deleted.')
    } catch (e) {
      if (e !== 'cancel') showError(e?.message || 'Failed to delete report.')
    } finally {
      actionLoading.value = null
    }
  }

  async function reopenReport(r) {
    actionLoading.value = r.id
    const mobile = authStore.getActiveUser
    try {
      await update(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobile}/${r.id}`), { status: 'open' })
      await set(
        dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/${r.id}`),
        { title: r.title, action: 'reopened', reporterName: loggedInUser.value?.name || mobile, updatedAt: new Date().toISOString() }
      )
      showSuccess('Report re-opened.')
    } catch (e) {
      showError(e?.message || 'Failed to re-open report.')
    } finally {
      actionLoading.value = null
    }
  }

  // ── Edit dialog state ─────────────────────────────────────────────────────
  const editDialogVisible = ref(false)
  const editFormRef = ref(null)
  const editForm = ref(null)
  const editNewScreenshots = ref([])
  const editFileInputRef = ref(null)
  const editSaving = ref(false)

  function openEdit(r) {
    editForm.value = { id: r.id, category: r.category, title: r.title, description: r.description, severity: r.severity, screenshots: r.screenshots ? [...r.screenshots] : [] }
    editNewScreenshots.value = []
    editDialogVisible.value = true
  }

  function closeEdit() {
    editNewScreenshots.value.forEach((s) => URL.revokeObjectURL(s.preview))
    editNewScreenshots.value = []
    editForm.value = null
    editDialogVisible.value = false
  }

  function removeExistingScreenshot(index) { editForm.value.screenshots.splice(index, 1) }

  function handleEditFileChange(e) {
    const existing = editForm.value?.screenshots?.length ?? 0
    const remaining = MAX_SCREENSHOTS - existing - editNewScreenshots.value.length
    Array.from(e.target.files || []).slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith('image/')) { showError(`"${file.name}" is not an image.`); return }
      if (file.size > MAX_SIZE_BYTES) { showError(`"${file.name}" exceeds ${MAX_SIZE_MB}MB.`); return }
      editNewScreenshots.value.push({ file, preview: URL.createObjectURL(file) })
    })
    if (editFileInputRef.value) editFileInputRef.value.value = ''
  }

  function removeEditNewScreenshot(index) {
    URL.revokeObjectURL(editNewScreenshots.value[index].preview)
    editNewScreenshots.value.splice(index, 1)
  }

  async function saveEdit() {
    const valid = await editFormRef.value?.validate().catch(() => false)
    if (!valid) return
    editSaving.value = true
    try {
      const newMeta = []
      for (const item of editNewScreenshots.value) {
        const result = await uploadToCloudinary(item.file)
        newMeta.push({ url: result.url, publicId: result.publicId })
      }
      const allScreenshots = [...(editForm.value.screenshots || []), ...newMeta]
      const original = myReports.value.find((r) => r.id === editForm.value.id)
      if (original?.screenshots?.length) cleanupOldReceipts(original.screenshots, allScreenshots)

      const mobile = authStore.getActiveUser
      await update(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobile}/${editForm.value.id}`), {
        category: editForm.value.category,
        title: editForm.value.title,
        description: editForm.value.description,
        severity: editForm.value.severity,
        screenshots: allScreenshots
      })
      await set(
        dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/${editForm.value.id}`),
        { title: editForm.value.title, action: 'edited', reporterName: loggedInUser.value?.name || mobile, updatedAt: new Date().toISOString() }
      )
      showSuccess('Report updated.')
      closeEdit()
    } catch (e) {
      showError(e?.message || 'Failed to save changes.')
    } finally {
      editSaving.value = false
    }
  }

  // ── Notes & replies ───────────────────────────────────────────────────────
  const replyInputs = ref({})
  const replyErrors = ref({})
  const replySavingId = ref(null)
  const notesOpen = ref(new Set())
  const replyEditorRefs = {}

  const noteThread = NoteThread({
    actorKeyFn: () => authStore.getActiveUser,
    idPrefix: 'bug-mr-note',
    pickerWrapClass: 'nt-reaction-wrap'
  })

  function toggleNotes(id) {
    const s = new Set(notesOpen.value)
    if (s.has(id)) {
      s.delete(id)
    } else {
      s.add(id)
      const mobile = authStore.getActiveUser
      if (mobile) {
        remove(dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/${mobile}/${id}`)).catch(() => {})
      }
    }
    notesOpen.value = s
  }

  async function addReporterReply(r) {
    const text = (replyInputs.value[r.id] || '').trim()
    const editorImages = replyEditorRefs[r.id]?.images || []
    if (!text && !editorImages.length) { replyErrors.value[r.id] = 'Message cannot be empty.'; return }
    replySavingId.value = r.id
    const mobile = authStore.getActiveUser
    try {
      const uploadedImages = await noteThread.uploadNoteImages(editorImages)

      await push(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobile}/${r.id}/notes`), {
        text,
        authorType: 'reporter',
        authorName: loggedInUser.value?.name || mobile,
        createdAt: new Date().toISOString(),
        ...(uploadedImages.length ? { images: uploadedImages } : {}),
        ...noteThread.buildReplyTo(r.id)
      })
      await update(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobile}/${r.id}`), {
        hasReporterReply: true,
        reporterRepliedAt: new Date().toISOString()
      })
      await set(
        dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/${r.id}`),
        { title: r.title, status: r.status, hasReporterReply: true, reporterName: loggedInUser.value?.name || mobile, updatedAt: new Date().toISOString() }
      )
      replyInputs.value[r.id] = ''
      replyEditorRefs[r.id]?.clearImages()
      noteThread.cancelReply()
      showSuccess('Reply sent.')
    } catch (e) {
      showError(e?.message || 'Failed to send reply.')
    } finally {
      replySavingId.value = null
    }
  }

  // ── Auto-expand bug from notification ─────────────────────────────────────
  watch(
    [() => props.openBugId, myReports],
    ([id]) => {
      if (!id || !myReports.value.find((r) => r.id === id)) return
      activeView.value = 'my-reports'
      nextTick(() => {
        const eSet = new Set(expandedIds.value)
        const nSet = new Set(notesOpen.value)
        eSet.add(id); nSet.add(id)
        expandedIds.value = eSet; notesOpen.value = nSet
        const mobile = authStore.getActiveUser
        if (mobile) {
          remove(dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/${mobile}/${id}`)).catch(() => {})
        }
      })
    },
    { immediate: true }
  )

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onMounted(() => {
    const mobile = authStore.getActiveUser
    if (!mobile) return
    myReportsLoading.value = true
    myReportsUnsubscribe = onValue(
      dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobile}`),
      (snap) => {
        myReports.value = snap.exists()
          ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          : []
        myReportsLoading.value = false
      },
      () => { myReportsLoading.value = false }
    )
    document.addEventListener('mousedown', noteThread.closeReactionPicker)
  })

  onUnmounted(() => {
    if (myReportsUnsubscribe) myReportsUnsubscribe()
    document.removeEventListener('mousedown', noteThread.closeReactionPicker)
  })

  return {
    // Auth
    authStore, isLoggedIn, loggedInUser,
    // Submit form
    activeView, form, formRef, fileInputRef, submitting, uploadingScreenshots,
    submitted, lastSubmittedBugNumber, screenshots, uploadProgress,
    isClean, categories, rules,
    applyTemplate, formatSize, handleFileChange, removeScreenshot, resetForm, submitReport,
    // My Reports
    myReports, myReportsLoading, expandedIds, actionLoading,
    toggleExpand, deleteReport, reopenReport,
    // Edit
    editDialogVisible, editFormRef, editForm, editNewScreenshots, editFileInputRef, editSaving,
    openEdit, closeEdit, removeExistingScreenshot, handleEditFileChange, removeEditNewScreenshot, saveEdit,
    // Notes thread
    replyInputs, replyErrors, replySavingId, notesOpen, replyEditorRefs,
    toggleNotes, addReporterReply,
    // NoteThread (spread shared state/functions)
    ...noteThread,
    // Constants
    MAX_SCREENSHOTS, SEVERITIES, STATUS_LABEL
  }
}
