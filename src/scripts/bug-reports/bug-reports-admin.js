import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  auth,
  database,
  collectionGroup,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  onAuthStateChanged
} from '@/firebase'
import { DB_NODES } from '@/constants'
import { showError, showSuccess } from '@/utils'
import { NoteThread } from './note-thread'

export const STATUS_OPTIONS = [
  { label: '🔴 Open', value: 'open' },
  { label: '🟡 In Progress', value: 'in-progress' },
  { label: '🔵 Needs Info', value: 'needs-info' },
  { label: '🟣 Duplicate', value: 'duplicate' },
  { label: "⚪ Won't Fix", value: 'wont-fix' },
  { label: '🟢 Resolved', value: 'resolved' },
  { label: '⬛ Closed', value: 'closed' }
]

export const SEVERITY_OPTIONS = [
  { label: 'All Severities', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

const STATUS_ORDER = {
  open: 0,
  'in-progress': 1,
  'needs-info': 2,
  duplicate: 3,
  'wont-fix': 4,
  resolved: 5,
  closed: 6
}

/**
 * Script module for the admin Bug Reports view.
 * Follows the project's factory-function pattern (see scripts/shared-expenses/expense-list.js).
 */
export const BugReportsAdmin = () => {
  // ── Report list state ─────────────────────────────────────────────────────
  const route = useRoute()
  const router = useRouter()
  const loading = ref(true)
  const reports = ref([])
  const expandedIds = ref(new Set())
  const activeStatusFilter = ref(route.query.status || 'all')
  const activeSeverityFilter = ref(route.query.severity || 'all')
  const searchQuery = ref(route.query.q || '')
  const deletingId = ref(null)

  // Sync all filters to URL so admin views are shareable / bookmarkable
  watch([searchQuery, activeStatusFilter, activeSeverityFilter], () => {
    const query = {}
    if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
    if (activeStatusFilter.value !== 'all')
      query.status = activeStatusFilter.value
    if (activeSeverityFilter.value !== 'all')
      query.severity = activeSeverityFilter.value
    router.replace({ path: route.path, query })
  })

  const statusFilters = computed(() => [
    {
      label: 'All',
      value: 'all',
      count: reports.value.length,
      selectLabel: `All (${reports.value.length})`
    },
    {
      label: 'Open',
      value: 'open',
      count: reports.value.filter((r) => r.status === 'open').length,
      selectLabel: `Open (${reports.value.filter((r) => r.status === 'open').length})`
    },
    {
      label: 'In Progress',
      value: 'in-progress',
      count: reports.value.filter((r) => r.status === 'in-progress').length,
      selectLabel: `In Progress (${reports.value.filter((r) => r.status === 'in-progress').length})`
    },
    {
      label: 'Needs Info',
      value: 'needs-info',
      count: reports.value.filter((r) => r.status === 'needs-info').length,
      selectLabel: `Needs Info (${reports.value.filter((r) => r.status === 'needs-info').length})`
    },
    {
      label: 'Duplicate',
      value: 'duplicate',
      count: reports.value.filter((r) => r.status === 'duplicate').length,
      selectLabel: `Duplicate (${reports.value.filter((r) => r.status === 'duplicate').length})`
    },
    {
      label: "Won't Fix",
      value: 'wont-fix',
      count: reports.value.filter((r) => r.status === 'wont-fix').length,
      selectLabel: `Won't Fix (${reports.value.filter((r) => r.status === 'wont-fix').length})`
    },
    {
      label: 'Resolved',
      value: 'resolved',
      count: reports.value.filter((r) => r.status === 'resolved').length,
      selectLabel: `Resolved (${reports.value.filter((r) => r.status === 'resolved').length})`
    },
    {
      label: 'Closed',
      value: 'closed',
      count: reports.value.filter((r) => r.status === 'closed').length,
      selectLabel: `Closed (${reports.value.filter((r) => r.status === 'closed').length})`
    }
  ])

  const totalCount = computed(() => reports.value.length)
  const openCount = computed(
    () => reports.value.filter((r) => r.status === 'open').length
  )

  const filteredReports = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return reports.value
      .filter((r) => {
        const searchOk =
          !q ||
          (r.bugNumber || '').toLowerCase().includes(q) ||
          (r.title || '').toLowerCase().includes(q)
        return searchOk
      })
      .sort((a, b) => {
        const so = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
        if (so !== 0) return so
        return new Date(b.submittedAt) - new Date(a.submittedAt)
      })
  })

  // ── Firebase real-time listener ───────────────────────────────────────────
  let unsubscribe = null
  let unsubscribeAuth = null

  function fetchReports() {
    loading.value = true
    if (unsubscribe) unsubscribe()

    const constraints = []
    if (activeStatusFilter.value !== 'all') {
      constraints.push(where('status', '==', activeStatusFilter.value))
    }
    if (activeSeverityFilter.value !== 'all') {
      constraints.push(where('severity', '==', activeSeverityFilter.value))
    }
    constraints.push(orderBy('submittedAt', 'desc'))

    unsubscribe = onSnapshot(
      query(collectionGroup(database, 'reports'), ...constraints),
      (snapshot) => {
        reports.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        loading.value = false
      },
      (err) => {
        reports.value = []
        showError('Failed to load bug reports: ' + err.message)
        loading.value = false
      }
    )
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function mobileKeyOf(report) {
    return report.reporter?.mobile || 'unknown'
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
      await updateDoc(
        doc(database, DB_NODES.BUG_REPORTS, mobileKey, 'reports', id),
        { status: newStatus }
      )
      if (report?.reporter?.mobile) {
        await setDoc(
          doc(
            database,
            DB_NODES.BUG_REPORT_NOTIFICATIONS,
            report.reporter.mobile,
            'items',
            id
          ),
          {
            title: report.title,
            status: newStatus,
            updatedAt: new Date().toISOString()
          }
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
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'error',
          dangerouslyUseHTMLString: true
        }
      )
    } catch {
      return
    }
    deletingId.value = report.id
    try {
      const mobileKey = mobileKeyOf(report)
      await deleteDoc(
        doc(database, DB_NODES.BUG_REPORTS, mobileKey, 'reports', report.id)
      )
      await deleteDoc(
        doc(
          database,
          DB_NODES.BUG_REPORT_NOTIFICATIONS,
          'admin',
          'items',
          report.id
        )
      ).catch(() => {})
      if (report.reporter?.mobile) {
        await deleteDoc(
          doc(
            database,
            DB_NODES.BUG_REPORT_NOTIFICATIONS,
            report.reporter.mobile,
            'items',
            report.id
          )
        ).catch(() => {})
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
      deleteDoc(
        doc(database, DB_NODES.BUG_REPORT_NOTIFICATIONS, 'admin', 'items', id)
      ).catch(() => {})
      const report = reports.value.find((r) => r.id === id)
      if (report?.hasReporterReply) {
        const mobileKey = mobileKeyOf(report)
        updateDoc(
          doc(database, DB_NODES.BUG_REPORTS, mobileKey, 'reports', id),
          { hasReporterReply: null }
        ).catch(() => {})
      }
    }
    notesOpen.value = s
  }

  async function addAdminNote(report) {
    const text = (noteInputs.value[report.id] || '').trim()
    const editorImages = noteEditorRefs[report.id]?.images || []
    if (!text && !editorImages.length) {
      noteErrors.value[report.id] = 'Message cannot be empty.'
      return
    }
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
        await updateDoc(
          doc(database, DB_NODES.BUG_REPORTS, mobileKey, 'reports', report.id),
          { hasReporterReply: null }
        )
      }
      if (report.reporter?.mobile) {
        await setDoc(
          doc(
            database,
            DB_NODES.BUG_REPORT_NOTIFICATIONS,
            report.reporter.mobile,
            'items',
            report.id
          ),
          {
            title: report.title,
            status: report.status,
            hasNote: true,
            updatedAt: new Date().toISOString()
          }
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
  watch([activeStatusFilter, activeSeverityFilter], () => {
    if (auth.currentUser) fetchReports()
  })

  onMounted(() => {
    unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        loading.value = false
        if (unsubscribe) {
          unsubscribe()
          unsubscribe = null
        }
        return
      }

      unsubscribeAuth?.()
      unsubscribeAuth = null
      fetchReports()
    })

    document.addEventListener('mousedown', noteThread.closeReactionPicker)
  })

  onUnmounted(() => {
    if (unsubscribeAuth) unsubscribeAuth()
    if (unsubscribe) unsubscribe()
    document.removeEventListener('mousedown', noteThread.closeReactionPicker)
  })

  return {
    // List
    loading,
    reports,
    filteredReports,
    totalCount,
    openCount,
    activeStatusFilter,
    activeSeverityFilter,
    searchQuery,
    statusFilters,
    expandedIds,
    deletingId,
    fetchReports,
    toggleExpand,
    updateStatus,
    deleteReport,
    // Notes
    noteInputs,
    noteErrors,
    noteSavingId,
    notesOpen,
    noteEditorRefs,
    toggleNotes,
    addAdminNote,
    // NoteThread (spread all shared state/functions)
    ...noteThread,
    // Named re-exports for template use
    STATUS_OPTIONS,
    SEVERITY_OPTIONS
  }
}
