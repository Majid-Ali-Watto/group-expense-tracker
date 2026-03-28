import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { database, ref as dbRef, onValue, update, set, remove } from '../../firebase'
import { DB_NODES } from '../../constants/db-nodes'
import { showError, showSuccess } from '../../utils/showAlerts'
import { NoteThread } from './note-thread'

export const STATUS_OPTIONS = [
  { label: '🔴 Open',        value: 'open' },
  { label: '🟡 In Progress', value: 'in-progress' },
  { label: '🔵 Needs Info',  value: 'needs-info' },
  { label: '🟣 Duplicate',   value: 'duplicate' },
  { label: "⚪ Won't Fix",   value: 'wont-fix' },
  { label: '🟢 Resolved',    value: 'resolved' },
  { label: '⬛ Closed',      value: 'closed' }
]

export const SEVERITY_OPTIONS = [
  { label: 'All Severities', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

const STATUS_ORDER = { open: 0, 'in-progress': 1, 'needs-info': 2, duplicate: 3, 'wont-fix': 4, resolved: 5, closed: 6 }

/**
 * Script module for the admin Bug Reports view.
 * Follows the project's factory-function pattern (see scripts/shared-expenses/expense-list.js).
 */
export const BugReportsAdmin = () => {
  // ── Report list state ─────────────────────────────────────────────────────
  const loading = ref(true)
  const reports = ref([])
  const expandedIds = ref(new Set())
  const activeStatusFilter = ref('all')
  const activeSeverityFilter = ref('all')
  const searchQuery = ref('')
  const deletingId = ref(null)

  const statusFilters = computed(() => [
    { label: 'All',          value: 'all',          count: reports.value.length, selectLabel: `All (${reports.value.length})` },
    { label: 'Open',         value: 'open',         count: reports.value.filter((r) => r.status === 'open').length, selectLabel: `Open (${reports.value.filter((r) => r.status === 'open').length})` },
    { label: 'In Progress',  value: 'in-progress',  count: reports.value.filter((r) => r.status === 'in-progress').length, selectLabel: `In Progress (${reports.value.filter((r) => r.status === 'in-progress').length})` },
    { label: 'Needs Info',   value: 'needs-info',   count: reports.value.filter((r) => r.status === 'needs-info').length, selectLabel: `Needs Info (${reports.value.filter((r) => r.status === 'needs-info').length})` },
    { label: 'Duplicate',    value: 'duplicate',    count: reports.value.filter((r) => r.status === 'duplicate').length, selectLabel: `Duplicate (${reports.value.filter((r) => r.status === 'duplicate').length})` },
    { label: "Won't Fix",    value: 'wont-fix',     count: reports.value.filter((r) => r.status === 'wont-fix').length, selectLabel: `Won't Fix (${reports.value.filter((r) => r.status === 'wont-fix').length})` },
    { label: 'Resolved',     value: 'resolved',     count: reports.value.filter((r) => r.status === 'resolved').length, selectLabel: `Resolved (${reports.value.filter((r) => r.status === 'resolved').length})` },
    { label: 'Closed',       value: 'closed',       count: reports.value.filter((r) => r.status === 'closed').length, selectLabel: `Closed (${reports.value.filter((r) => r.status === 'closed').length})` }
  ])

  const totalCount = computed(() => reports.value.length)
  const openCount = computed(() => reports.value.filter((r) => r.status === 'open').length)

  const filteredReports = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return reports.value
      .filter((r) => {
        const statusOk = activeStatusFilter.value === 'all' || r.status === activeStatusFilter.value
        const sevOk = activeSeverityFilter.value === 'all' || r.severity === activeSeverityFilter.value
        const searchOk = !q ||
          (r.bugNumber || '').toLowerCase().includes(q) ||
          (r.title || '').toLowerCase().includes(q)
        return statusOk && sevOk && searchOk
      })
      .sort((a, b) => {
        const so = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
        if (so !== 0) return so
        return new Date(b.submittedAt) - new Date(a.submittedAt)
      })
  })

  // ── Firebase real-time listener ───────────────────────────────────────────
  let unsubscribe = null

  function fetchReports() {
    loading.value = true
    if (unsubscribe) unsubscribe()
    unsubscribe = onValue(
      dbRef(database, DB_NODES.BUG_REPORTS),
      (snapshot) => {
        if (!snapshot.exists()) {
          reports.value = []
        } else {
          const collected = []
          Object.values(snapshot.val()).forEach((bugsByUser) => {
            if (bugsByUser && typeof bugsByUser === 'object') {
              Object.entries(bugsByUser).forEach(([id, val]) => collected.push({ id, ...val }))
            }
          })
          reports.value = collected
        }
        loading.value = false
      },
      (err) => {
        showError('Failed to load bug reports: ' + err.message)
        loading.value = false
      }
    )
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function mobileKeyOf(report) {
    return report.reporter?.isGuest ? 'guest' : (report.reporter?.mobile || 'guest')
  }

  function toggleExpand(id) {
    const next = new Set(expandedIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    expandedIds.value = next
  }

  // ── Status update ─────────────────────────────────────────────────────────
  async function updateStatus(id, newStatus) {
    try {
      const report = reports.value.find((r) => r.id === id)
      const mobileKey = mobileKeyOf(report)
      await update(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobileKey}/${id}`), { status: newStatus })
      if (report?.reporter?.mobile && !report.reporter.isGuest) {
        await set(
          dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/${report.reporter.mobile}/${id}`),
          { title: report.title, status: newStatus, updatedAt: new Date().toISOString() }
        )
      }
      showSuccess(`Status updated to "${newStatus}"`)
    } catch (err) {
      showError('Failed to update status: ' + err.message)
    }
  }

  // ── Delete report ─────────────────────────────────────────────────────────
  async function deleteReport(report) {
    try {
      await ElMessageBox.confirm(
        `Permanently delete report <strong>${report.bugNumber ? '#' + report.bugNumber + ' — ' : ''}"${report.title}"</strong>? This cannot be undone.`,
        'Delete Bug Report',
        { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning', dangerouslyUseHTMLString: true }
      )
    } catch { return }
    deletingId.value = report.id
    try {
      const mobileKey = mobileKeyOf(report)
      await remove(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobileKey}/${report.id}`))
      await remove(dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/${report.id}`)).catch(() => {})
      if (report.reporter?.mobile && !report.reporter.isGuest) {
        await remove(dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/${report.reporter.mobile}/${report.id}`)).catch(() => {})
      }
      showSuccess('Report deleted.')
    } catch (err) {
      showError('Failed to delete: ' + err.message)
    } finally {
      deletingId.value = null
    }
  }

  // ── Notes thread state ────────────────────────────────────────────────────
  const noteInputs = ref({})
  const noteErrors = ref({})
  const noteSavingId = ref(null)
  const notesOpen = ref(new Set())
  const noteEditorRefs = {}

  const noteThread = NoteThread({
    actorKeyFn: () => 'admin',
    idPrefix: 'bra-note',
    pickerWrapClass: 'nt-reaction-wrap'
  })

  function toggleNotes(id) {
    const s = new Set(notesOpen.value)
    if (s.has(id)) {
      s.delete(id)
    } else {
      s.add(id)
      remove(dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/${id}`)).catch(() => {})
      const report = reports.value.find((r) => r.id === id)
      if (report?.hasReporterReply) {
        const mobileKey = mobileKeyOf(report)
        update(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobileKey}/${id}`), { hasReporterReply: null }).catch(() => {})
      }
    }
    notesOpen.value = s
  }

  async function addAdminNote(report) {
    const text = (noteInputs.value[report.id] || '').trim()
    const editorImages = noteEditorRefs[report.id]?.images || []
    if (!text && !editorImages.length) { noteErrors.value[report.id] = 'Message cannot be empty.'; return }
    noteSavingId.value = report.id
    try {
      const mobileKey = mobileKeyOf(report)
      const uploadedImages = await noteThread.uploadNoteImages(editorImages)

      await noteThread.pushNote(report, {
        text,
        authorType: 'admin',
        authorName: 'Admin',
        createdAt: new Date().toISOString(),
        ...(uploadedImages.length ? { images: uploadedImages } : {}),
        ...noteThread.buildReplyTo(report.id)
      })

      if (report.hasReporterReply) {
        await update(dbRef(database, `${DB_NODES.BUG_REPORTS}/${mobileKey}/${report.id}`), { hasReporterReply: null })
      }
      if (report.reporter?.mobile && !report.reporter.isGuest) {
        await set(
          dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/${report.reporter.mobile}/${report.id}`),
          { title: report.title, status: report.status, hasNote: true, updatedAt: new Date().toISOString() }
        )
      }
      noteInputs.value[report.id] = ''
      noteEditorRefs[report.id]?.clearImages()
      noteThread.cancelReply()
      showSuccess('Note sent.')
    } catch (err) {
      showError('Failed to send note: ' + err.message)
    } finally {
      noteSavingId.value = null
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onMounted(() => {
    fetchReports()
    document.addEventListener('mousedown', noteThread.closeReactionPicker)
  })

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
    document.removeEventListener('mousedown', noteThread.closeReactionPicker)
  })

  return {
    // List
    loading, reports, filteredReports, totalCount, openCount,
    activeStatusFilter, activeSeverityFilter, searchQuery, statusFilters,
    expandedIds, deletingId,
    fetchReports, toggleExpand, updateStatus, deleteReport,
    // Notes
    noteInputs, noteErrors, noteSavingId, notesOpen, noteEditorRefs,
    toggleNotes, addAdminNote,
    // NoteThread (spread all shared state/functions)
    ...noteThread,
    // Named re-exports for template use
    STATUS_OPTIONS,
    SEVERITY_OPTIONS
  }
}
