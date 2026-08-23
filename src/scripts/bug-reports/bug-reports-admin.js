import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
  { icon: '🔴', labelKey: 'common.open', value: 'open' },
  {
    icon: '🟡',
    labelKey: 'bugReports.statuses.inProgress',
    value: 'in-progress'
  },
  {
    icon: '🔵',
    labelKey: 'bugReports.statuses.needsInfo',
    value: 'needs-info'
  },
  { icon: '🟣', labelKey: 'common.duplicate', value: 'duplicate' },
  { icon: '⚪', labelKey: 'bugReports.statuses.wontFix', value: 'wont-fix' },
  { icon: '🟢', labelKey: 'bugReports.statuses.resolved', value: 'resolved' },
  { icon: '⬛', labelKey: 'bugReports.statuses.closed', value: 'closed' }
]

export const SEVERITY_OPTIONS = [
  { labelKey: 'bugReports.allSeverities', value: 'all' },
  { labelKey: 'bugReports.severities.critical', value: 'critical' },
  { labelKey: 'bugReports.severities.high', value: 'high' },
  { labelKey: 'bugReports.severities.medium', value: 'medium' },
  { labelKey: 'bugReports.severities.low', value: 'low' }
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
  const { t } = useI18n()
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
      label: t('common.all'),
      value: 'all',
      count: reports.value.length,
      selectLabel: `${t('common.all')} (${reports.value.length})`
    },
    {
      label: t('common.open'),
      value: 'open',
      count: reports.value.filter((r) => r.status === 'open').length,
      selectLabel: `${t('common.open')} (${reports.value.filter((r) => r.status === 'open').length})`
    },
    {
      label: t('bugReports.statuses.inProgress'),
      value: 'in-progress',
      count: reports.value.filter((r) => r.status === 'in-progress').length,
      selectLabel: `${t('bugReports.statuses.inProgress')} (${reports.value.filter((r) => r.status === 'in-progress').length})`
    },
    {
      label: t('bugReports.statuses.needsInfo'),
      value: 'needs-info',
      count: reports.value.filter((r) => r.status === 'needs-info').length,
      selectLabel: `${t('bugReports.statuses.needsInfo')} (${reports.value.filter((r) => r.status === 'needs-info').length})`
    },
    {
      label: t('common.duplicate'),
      value: 'duplicate',
      count: reports.value.filter((r) => r.status === 'duplicate').length,
      selectLabel: `${t('common.duplicate')} (${reports.value.filter((r) => r.status === 'duplicate').length})`
    },
    {
      label: t('bugReports.statuses.wontFix'),
      value: 'wont-fix',
      count: reports.value.filter((r) => r.status === 'wont-fix').length,
      selectLabel: `${t('bugReports.statuses.wontFix')} (${reports.value.filter((r) => r.status === 'wont-fix').length})`
    },
    {
      label: t('bugReports.statuses.resolved'),
      value: 'resolved',
      count: reports.value.filter((r) => r.status === 'resolved').length,
      selectLabel: `${t('bugReports.statuses.resolved')} (${reports.value.filter((r) => r.status === 'resolved').length})`
    },
    {
      label: t('bugReports.statuses.closed'),
      value: 'closed',
      count: reports.value.filter((r) => r.status === 'closed').length,
      selectLabel: `${t('bugReports.statuses.closed')} (${reports.value.filter((r) => r.status === 'closed').length})`
    }
  ])

  const totalCount = computed(() => reports.value.length)
  const openCount = computed(
    () => reports.value.filter((r) => r.status === 'open').length
  )
  const statusOptions = computed(() =>
    STATUS_OPTIONS.map((option) => ({
      ...option,
      label: `${option.icon} ${t(option.labelKey)}`
    }))
  )
  const severityOptions = computed(() =>
    SEVERITY_OPTIONS.map((option) => ({
      ...option,
      label: t(option.labelKey)
    }))
  )
  const statusLabelFor = (status) => {
    const option = STATUS_OPTIONS.find((item) => item.value === status)
    return option ? t(option.labelKey) : status
  }

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
        showError(t('bugReports.failedLoadReports', { message: err.message }))
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
      showSuccess(
        t('bugReports.statusUpdated', { status: statusLabelFor(newStatus) })
      )
    } catch (err) {
      showError(t('bugReports.failedUpdateStatus', { message: err.message }))
    }
  }

  // ── Delete report ─────────────────────────────────────────────────────────
  async function deleteReport(report) {
    try {
      await ElMessageBox.confirm(
        t('bugReports.deleteAdminConfirm', {
          label: report.bugNumber ? `#${report.bugNumber} — ` : '',
          title: report.title
        }),
        t('bugReports.deleteAdminTitle'),
        {
          confirmButtonText: t('common.delete'),
          cancelButtonText: t('common.cancel'),
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
      showSuccess(t('bugReports.reportDeleted'))
    } catch (err) {
      showError(t('bugReports.deleteAdminFailed', { message: err.message }))
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
      noteErrors.value[report.id] = t('bugReports.messageEmpty')
      return
    }
    noteSavingId.value = report.id
    try {
      const mobileKey = mobileKeyOf(report)
      const uploadedImages = await noteThread.uploadNoteImages(editorImages)

      await noteThread.pushNote(report, {
        text,
        authorType: 'admin',
        authorName: t('common.admin'),
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
      showSuccess(t('bugReports.noteSent'))
    } catch (err) {
      showError(t('bugReports.noteSendFailed', { message: err.message }))
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
    statusOptions,
    severityOptions
  }
}
