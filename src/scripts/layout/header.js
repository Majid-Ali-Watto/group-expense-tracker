import { ref, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { database, ref as dbRef, remove } from '../../firebase'
import { DB_NODES } from '../../constants/db-nodes'

export const Header = (props, emit) => {
  const notifVisible = ref(false)
  const showHelp = ref(false)
  const showBugReport = ref(false)
  const bugReportView = ref('form') // 'form' | 'my-reports'
  const bugReportOpenId = ref(null)

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
          type: 'warning'
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
      remove(
        dbRef(database, `${DB_NODES.BUG_REPORT_NOTIFICATIONS}/admin/${notif.bugId}`)
      ).catch(() => {})
    }

    if (!notif.tab) return
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

  return {
    notifVisible,
    showHelp,
    showBugReport,
    bugReportView,
    bugReportOpenId,
    setLoggedInStatus,
    confirmLogout,
    handleNetPosition,
    handleNavigate,
    notifsByCategory,
    notifCategories
  }
}
