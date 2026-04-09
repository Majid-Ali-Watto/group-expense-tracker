import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { database, doc, deleteDoc, updateDoc, deleteField } from '@/firebase'
import { DB_NODES } from '@/constants'
import { PUBLIC_NAV_LINKS } from '@/constants'
import { showError, showSuccess } from '@/utils'
import { useDataStore } from '@/stores'

export const Header = (props, emit) => {
  const route = useRoute()
  const router = useRouter()
  const notifVisible = ref(false)
  const showHelp = ref(false)
  const showBugReport = ref(false)
  const bugReportView = ref('form') // 'form' | 'my-reports'
  const bugReportOpenId = ref(null)
  const isPublicPage = computed(
    () =>
      !props.loggedIn &&
      (route.meta?.publicPage === true || route.meta?.requiresGuest === true)
  )

  // Reset to form view when dialog closes
  watch(showBugReport, (val) => {
    if (!val) {
      bugReportView.value = 'form'
      bugReportOpenId.value = null
    }
  })

  function setLoggedInStatus() {
    emit('click-log', false)
  }

  async function confirmLogout() {
    try {
      await ElMessageBox.confirm(
        'Are you sure you want to logout?',
        'Confirm Logout',
        {
          confirmButtonText: 'Logout',
          cancelButtonText: 'Stay Logged In',
          type: 'info'
        }
      )
      setLoggedInStatus()
    } catch {
      /* user cancelled */
    }
  }

  function handleNetPosition() {
    emit('show-net-position')
  }

  async function copyUrl(url) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return
    }

    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    try {
      const copied = document.execCommand('copy')
      if (!copied) throw new Error('Copy command failed')
    } finally {
      document.body.removeChild(textarea)
    }
  }

  async function shareCurrentUrl() {
    const url = window.location.href
    const payload = {
      title: document.title || 'Kharchafy',
      text: 'Open this page in Kharchafy.',
      url
    }

    try {
      if (navigator.share) {
        await navigator.share(payload)
        return
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
    }

    try {
      await copyUrl(url)
      showSuccess('Link copied to clipboard!')
    } catch {
      window.prompt('Copy this link:', url)
      showError(
        'Native share is unavailable, so the link was opened for manual copy.'
      )
    }
  }

  async function handleNavigate(notif) {
    notifVisible.value = false
    if (notif.action === 'open-bug-report') {
      bugReportOpenId.value = notif.bugId || null
      bugReportView.value = 'my-reports'
      showBugReport.value = true
      return
    }

    if (notif.action === 'open-admin-bug-report' && notif.bugId) {
      props.dismissNotification(notif.id)
      deleteDoc(
        doc(
          database,
          DB_NODES.BUG_REPORT_NOTIFICATIONS,
          'admin',
          'items',
          notif.bugId
        )
      ).catch(() => {})
    }

    if (notif.action === 'dismiss-user-rejection' && notif.userUid) {
      props.dismissNotification(notif.id)
      updateDoc(doc(database, DB_NODES.USERS, notif.userUid), {
        rejectionNotification: deleteField()
      }).catch(() => {})
    }

    if (!notif.tab) return
    if (notif.action === 'scroll-to-row' && notif.rowId) {
      props.dismissNotification(notif.id)
      useDataStore().setPendingScrollRowId(notif.rowId)
    }
    emit('navigate-to-tab', { tab: notif.tab, groupId: notif.groupId })
  }

  const notifsByCategory = computed(() => {
    const map = {}
    props.notifications.forEach((n) => {
      if (!map[n.category]) map[n.category] = []
      map[n.category].push(n)
    })
    return map
  })

  const notifCategories = computed(() => Object.keys(notifsByCategory.value))

  function navigateTo(path) {
    if (route.path === path) return
    router.push(path)
  }

  return {
    route,
    notifVisible,
    showHelp,
    showBugReport,
    bugReportView,
    bugReportOpenId,
    isPublicPage,
    publicNavLinks: PUBLIC_NAV_LINKS,
    setLoggedInStatus,
    confirmLogout,
    handleNetPosition,
    navigateTo,
    shareCurrentUrl,
    handleNavigate,
    notifsByCategory,
    notifCategories
  }
}
