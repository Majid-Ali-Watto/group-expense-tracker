import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'

export const Header = (props, emit) => {
  const notifVisible = ref(false)
  const showHelp = ref(false)

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

  function handleNavigate(notif) {
    notifVisible.value = false
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
    setLoggedInStatus,
    confirmLogout,
    handleNetPosition,
    handleNavigate,
    notifsByCategory,
    notifCategories
  }
}
