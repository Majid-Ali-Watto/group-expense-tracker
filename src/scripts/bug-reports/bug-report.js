import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { auth } from '@/firebase'
import { useSharedActivityEmail } from '@/composables'
import { useBugReportsApi } from '@/composables/useBugReportsApi'
import { uploadReceipt, showError, showSuccess } from '@/utils'
import { useAuthStore, useUserStore } from '@/stores'
import { resolveUserTabConfig, USER_TAB_KEYS } from '@/helpers'

const MAX_SCREENSHOTS = 3
const MAX_SIZE_MB = 2
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export const ALL_CATEGORIES = [
  {
    labelKey: 'tabs.sharedExpenses',
    value: 'shared-expenses'
  },
  { labelKey: 'tabs.sharedLoans', value: 'shared-loans' },
  { labelKey: 'tabs.personalLoans', value: 'personal-loans' },
  {
    labelKey: 'tabs.personalExpenses',
    value: 'personal-expenses'
  },
  { labelKey: 'tabs.groups', value: 'groups' },
  { labelKey: 'headerActions.notifications', value: 'notifications' },
  { labelKey: 'bugReports.categories.auth', value: 'auth' },
  { labelKey: 'bugReports.categories.settlement', value: 'settlement' },
  { labelKey: 'bugReports.categories.export', value: 'export' },
  { labelKey: 'bugReports.categories.charts', value: 'charts' },
  { labelKey: 'bugReports.categories.other', value: 'other' }
]

// Jira's literal priority names, straight through end to end — the reporter
// picks one of these on the submit form and the backend sets it as-is on
// the Jira issue's priority field (no low/medium/high/critical → Highest/
// High/Low/Lowest translation layer; see jira.service.ts's createBugIssue).
export const SEVERITIES = [
  { labelKey: 'bugReports.priorities.highest', value: 'Highest' },
  { labelKey: 'bugReports.priorities.high', value: 'High' },
  { labelKey: 'bugReports.priorities.low', value: 'Low' },
  { labelKey: 'bugReports.priorities.lowest', value: 'Lowest' }
]

function emptyForm() {
  return {
    category: '',
    title: '',
    description: '',
    severity: 'Low',
    reporterName: '',
    reporterEmail: ''
  }
}

/**
 * Script module for the reporter-side Bug Report view.
 * Follows the project's factory-function pattern.
 *
 * Bug reports are stored in Jira, not Firestore — submitting posts to the
 * node backend (which creates the Jira issue and returns its key), and
 * "My Reports" fetches the reporter's own issues from the same backend.
 * There's no real-time push (Jira has none), so the list is fetched on
 * mount / view switch / after a successful submit, plus a manual refresh.
 *
 * @param {{ view: string, openBugId: string | null }} props
 */
export const BugReport = (props) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const { t } = useI18n()
  const { sendBugReportEmail } = useSharedActivityEmail()
  const { fetchBugReports, updateBugReportStatus, updateBugReport, deleteBugReport } = useBugReportsApi()

  const activeView = ref(props.view)
  const isLoggedIn = computed(() => !!authStore.getActiveUserUid)
  const loggedInUser = computed(() => {
    const uid = authStore.getActiveUserUid
    return uid ? userStore.getUserByUid(uid) : null
  })

  const categories = computed(() => {
    const config = resolveUserTabConfig(userStore.getActiveUserTabConfig)
    const hasShared =
      config[USER_TAB_KEYS.GROUPS] ||
      config[USER_TAB_KEYS.SHARED_EXPENSES] ||
      config[USER_TAB_KEYS.SHARED_LOANS]
    const hasPersonal =
      config[USER_TAB_KEYS.PERSONAL_EXPENSES] ||
      config[USER_TAB_KEYS.PERSONAL_LOANS]

    return ALL_CATEGORIES.filter((cat) => {
      switch (cat.value) {
        case 'shared-expenses':
          return hasShared && config[USER_TAB_KEYS.SHARED_EXPENSES]
        case 'shared-loans':
          return hasShared && config[USER_TAB_KEYS.SHARED_LOANS]
        case 'groups':
        case 'settlement':
          return hasShared
        case 'personal-expenses':
          return hasPersonal && config[USER_TAB_KEYS.PERSONAL_EXPENSES]
        case 'personal-loans':
          return hasPersonal && config[USER_TAB_KEYS.PERSONAL_LOANS]
        default:
          // notifications, auth, export, charts, other — always visible
          return true
      }
    }).map((cat) => ({ ...cat, label: t(cat.labelKey) }))
  })

  const severities = computed(() =>
    SEVERITIES.map((severity) => ({
      ...severity,
      label: t(severity.labelKey)
    }))
  )

  // ── Validation rules ─────────────────────────────────────────────────────
  const rules = computed(() => ({
    category: [
      {
        required: true,
        message: t('bugReports.validation.categoryRequired'),
        trigger: 'change'
      }
    ],
    title: [
      {
        required: true,
        message: t('bugReports.validation.titleRequired'),
        trigger: 'blur'
      },
      {
        min: 5,
        message: t('bugReports.validation.titleMin'),
        trigger: 'blur'
      }
    ],
    description: [
      {
        required: true,
        message: t('bugReports.validation.descriptionRequired'),
        trigger: 'blur'
      },
      {
        min: 20,
        message: t('bugReports.validation.descriptionMin'),
        trigger: 'blur'
      }
    ]
  }))

  // ── Submit form state ─────────────────────────────────────────────────────
  const formRef = ref(null)
  const submitting = ref(false)
  const uploadingScreenshots = ref(false)
  const submitted = ref(false)
  const lastSubmittedIssueKey = ref('')
  const screenshots = ref([])
  const uploadProgress = ref([])
  const form = ref(emptyForm())

  const isClean = computed(
    () =>
      !form.value.category &&
      !form.value.title &&
      !form.value.description &&
      form.value.severity === 'Low' &&
      !screenshots.value.length
  )

  function applyTemplate() {
    if (form.value.description?.trim()) {
      ElMessageBox.confirm(
        t('bugReports.templateConfirm'),
        t('bugReports.useTemplateTitle'),
        {
          confirmButtonText: t('bugReports.yesUseTemplate'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }
      )
        .then(() => {
          form.value.description = t('bugReports.templateText')
        })
        .catch(() => {})
    } else {
      form.value.description = t('bugReports.templateText')
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleFileChange(e) {
    const remaining = MAX_SCREENSHOTS - screenshots.value.length
    Array.from(e.target.files || [])
      .slice(0, remaining)
      .forEach((file) => {
        if (!file.type.startsWith('image/')) {
          showError(t('bugReports.notImage', { name: file.name }))
          return
        }
        if (file.size > MAX_SIZE_BYTES) {
          showError(
            t('bugReports.exceedsLimit', {
              name: file.name,
              size: MAX_SIZE_MB
            })
          )
          return
        }
        screenshots.value.push({ file, preview: URL.createObjectURL(file) })
      })
    formRef.value?.clearFileInput()
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
    lastSubmittedIssueKey.value = ''
    formRef.value?.clearValidate()
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
        uploadProgress.value = screenshots.value.map((s) => ({
          name: s.file.name,
          percent: 0,
          status: ''
        }))
        for (let i = 0; i < screenshots.value.length; i++) {
          uploadProgress.value[i].percent = 30
          try {
            const result = await uploadReceipt(screenshots.value[i].file, {
              maxSizeBytes: MAX_SIZE_BYTES
            })
            screenshotMeta.push({
              url: result.url,
              provider: result.provider,
              publicId: result.publicId,
              path: result.path
            })
            uploadProgress.value[i].percent = 100
            uploadProgress.value[i].status = 'success'
          } catch (err) {
            uploadProgress.value[i].status = 'exception'
            throw new Error(
              t('bugReports.uploadFailed', {
                name: screenshots.value[i].file.name,
                message: err.message
              })
            )
          }
        }
        uploadingScreenshots.value = false
      }

      const reporter = {
        name: loggedInUser.value?.name || 'Unknown',
        email: auth.currentUser?.email || ''
      }

      // The backend creates the Jira issue (and re-uploads screenshots as
      // real Jira attachments) — this is now the only place the report is
      // stored, so it's awaited: a Jira failure must surface as a failed
      // submission, not a silently-lost report.
      const { jiraIssue } = await sendBugReportEmail({
        title: form.value.title.trim(),
        category: form.value.category,
        severity: form.value.severity,
        description: form.value.description.trim(),
        reporter,
        screenshots: screenshotMeta,
        submittedAt: new Date().toISOString()
      })

      lastSubmittedIssueKey.value = jiraIssue?.key || ''
      submitted.value = true
      await fetchMyReports()
    } catch (err) {
      uploadingScreenshots.value = false
      showError(err.message || t('bugReports.submissionFailed'))
    } finally {
      submitting.value = false
    }
  }

  // ── My Reports state ──────────────────────────────────────────────────────
  const myReports = ref([])
  const myReportsLoading = ref(false)
  const expandedIds = ref(new Set())
  const actionLoading = ref(null)

  function toggleExpand(id) {
    const next = new Set(expandedIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    expandedIds.value = next
  }

  async function fetchMyReports() {
    if (!authStore.getActiveUserUid) return
    myReportsLoading.value = true
    try {
      myReports.value = await fetchBugReports()
    } catch (err) {
      showError(err.message || t('bugReports.failedLoadReports', { message: '' }))
    } finally {
      myReportsLoading.value = false
    }
  }

  async function deleteReport(r) {
    try {
      await ElMessageBox.confirm(
        t('bugReports.deleteConfirm', { title: r.title }),
        t('bugReports.deleteTitle'),
        {
          confirmButtonText: t('common.delete'),
          cancelButtonText: t('common.cancel'),
          type: 'error',
          dangerouslyUseHTMLString: true
        }
      )
      actionLoading.value = r.key
      await deleteBugReport(r.key)
      myReports.value = myReports.value.filter((report) => report.key !== r.key)
      showSuccess(t('bugReports.reportDeleted'))
    } catch (e) {
      if (e !== 'cancel') showError(e?.message || t('bugReports.deleteFailed'))
    } finally {
      actionLoading.value = null
    }
  }

  async function reopenReport(r) {
    actionLoading.value = r.key
    try {
      await updateBugReportStatus(r.key, 'To Do')
      await fetchMyReports()
      showSuccess(t('bugReports.reportReopened'))
    } catch (e) {
      showError(e?.message || t('bugReports.reopenFailed'))
    } finally {
      actionLoading.value = null
    }
  }

  // ── Edit dialog state ─────────────────────────────────────────────────────
  const editDialogVisible = ref(false)
  const editFormRef = ref(null)
  const editForm = ref(null)
  const initialEditForm = ref(null)
  const editNewScreenshots = ref([])
  const removedAttachmentIds = ref([])
  const editSaving = ref(false)

  function openEdit(r) {
    initialEditForm.value = {
      key: r.key,
      title: r.title,
      category: r.category,
      severity: r.priority,
      description: r.description,
      existingScreenshots: r.screenshots ? [...r.screenshots] : []
    }
    editForm.value = {
      ...initialEditForm.value,
      existingScreenshots: [...initialEditForm.value.existingScreenshots]
    }
    editNewScreenshots.value = []
    removedAttachmentIds.value = []
    editDialogVisible.value = true
  }

  function closeEdit() {
    editNewScreenshots.value.forEach((s) => URL.revokeObjectURL(s.preview))
    editNewScreenshots.value = []
    removedAttachmentIds.value = []
    editForm.value = null
    initialEditForm.value = null
    editDialogVisible.value = false
  }

  function resetEdit() {
    editNewScreenshots.value.forEach((s) => URL.revokeObjectURL(s.preview))
    editNewScreenshots.value = []
    removedAttachmentIds.value = []
    editForm.value = initialEditForm.value
      ? {
          ...initialEditForm.value,
          existingScreenshots: [...initialEditForm.value.existingScreenshots]
        }
      : null
    editFormRef.value?.clearValidate()
  }

  function removeExistingScreenshot(index) {
    const [removed] = editForm.value.existingScreenshots.splice(index, 1)
    if (removed?.id) removedAttachmentIds.value.push(removed.id)
  }

  function handleEditFileChange(e) {
    const existing = editForm.value?.existingScreenshots?.length ?? 0
    const remaining = MAX_SCREENSHOTS - existing - editNewScreenshots.value.length
    Array.from(e.target.files || [])
      .slice(0, remaining)
      .forEach((file) => {
        if (!file.type.startsWith('image/')) {
          showError(t('bugReports.notImage', { name: file.name }))
          return
        }
        if (file.size > MAX_SIZE_BYTES) {
          showError(
            t('bugReports.exceedsLimit', {
              name: file.name,
              size: MAX_SIZE_MB
            })
          )
          return
        }
        editNewScreenshots.value.push({
          file,
          preview: URL.createObjectURL(file)
        })
      })
    editFormRef.value?.clearFileInput()
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
      const newScreenshotMeta = []
      for (const item of editNewScreenshots.value) {
        const result = await uploadReceipt(item.file, {
          maxSizeBytes: MAX_SIZE_BYTES
        })
        newScreenshotMeta.push({
          url: result.url,
          provider: result.provider,
          publicId: result.publicId,
          path: result.path
        })
      }

      const updated = await updateBugReport(editForm.value.key, {
        title: editForm.value.title.trim(),
        category: editForm.value.category,
        severity: editForm.value.severity,
        description: editForm.value.description.trim(),
        ...(removedAttachmentIds.value.length
          ? { removeAttachmentIds: removedAttachmentIds.value }
          : {}),
        ...(newScreenshotMeta.length ? { screenshots: newScreenshotMeta } : {})
      })

      const index = myReports.value.findIndex((r) => r.key === updated.key)
      if (index !== -1) myReports.value[index] = updated

      showSuccess(t('bugReports.reportUpdated'))
      closeEdit()
    } catch (e) {
      showError(e?.message || t('bugReports.saveFailed'))
    } finally {
      editSaving.value = false
    }
  }

  // ── Auto-expand bug from notification ─────────────────────────────────────
  watch(
    [() => props.openBugId, myReports],
    ([key]) => {
      if (!key || !myReports.value.find((r) => r.key === key)) return
      activeView.value = 'my-reports'
      nextTick(() => {
        const eSet = new Set(expandedIds.value)
        eSet.add(key)
        expandedIds.value = eSet
      })
    },
    { immediate: true }
  )

  // immediate: true covers both "already on My Reports at mount" (e.g.
  // opened from a notification with view: 'my-reports') and switching into
  // it later — a single fetch trigger, instead of a separate unconditional
  // onMounted fetch that ran even while showing the plain submit form and
  // then fired again here on switch.
  watch(
    activeView,
    (view) => {
      if (view === 'my-reports') fetchMyReports()
    },
    { immediate: true }
  )

  return {
    // Auth
    authStore,
    isLoggedIn,
    loggedInUser,
    // Submit form
    activeView,
    form,
    formRef,
    submitting,
    uploadingScreenshots,
    submitted,
    lastSubmittedIssueKey,
    screenshots,
    uploadProgress,
    isClean,
    categories,
    rules,
    applyTemplate,
    formatSize,
    handleFileChange,
    removeScreenshot,
    resetForm,
    submitReport,
    // My Reports
    myReports,
    myReportsLoading,
    expandedIds,
    actionLoading,
    fetchMyReports,
    toggleExpand,
    deleteReport,
    reopenReport,
    // Edit dialog
    editDialogVisible,
    editFormRef,
    editForm,
    editNewScreenshots,
    editSaving,
    openEdit,
    closeEdit,
    resetEdit,
    removeExistingScreenshot,
    handleEditFileChange,
    removeEditNewScreenshot,
    saveEdit,
    // Constants
    MAX_SCREENSHOTS,
    SEVERITIES: severities
  }
}
