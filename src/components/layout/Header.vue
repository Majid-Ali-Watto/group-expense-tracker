<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <el-header
    class="kharchafy-header flex flex-col shadow-md fixed top-0 left-0 w-full z-50 !bg-green-600 !text-white transition-all duration-300"
  >
    <div class="flex items-center justify-between w-full h-20">
      <TitleAndTagline />

      <div class="flex items-center gap-2">
        <PublicHeaderNav
          :is-visible="isPublicPage"
          :public-nav-links="publicNavLinks"
          :route-path="route.path"
          @navigate="navigateTo"
        />

        <NotificationBell
          v-if="loggedIn"
          v-model:visible="notifVisible"
          :notifications="notifications"
          :notification-count="notificationCount"
          @navigate="handleNavigate"
        />

        <DesktopHeaderActions
          :logged-in="loggedIn"
          :is-public-page="isPublicPage"
          :is-stuck-state="isStuckState"
          :is-dark-theme="isDarkTheme"
          :can-show-bug-report="canShowBugReport"
          :can-show-manage-tabs="canShowManageTabs"
          :can-show-admin="canShowAdmin"
          :active-user-photo-url="activeUserProfile?.photoUrl || ''"
          @open-profile="showProfile = true"
          @open-bug-report="showBugReport = true"
          @open-help="showHelp = true"
          @navigate="navigateTo"
          @share="shareCurrentUrl"
          @toggle-theme="toggleTheme"
          @show-net-position="handleNetPosition"
          @open-manage-tabs="openManageTabs"
          @logout="confirmLogout"
        />

        <MobileHeaderMenu
          :logged-in="loggedIn"
          :tabs="tabs"
          :active-tab="activeTab"
          :is-public-page="isPublicPage"
          :public-nav-links="publicNavLinks"
          :route-path="route.path"
          :is-stuck-state="isStuckState"
          :can-show-bug-report="canShowBugReport"
          :can-show-manage-tabs="canShowManageTabs"
          :can-show-admin="canShowAdmin"
          :is-dark-theme="isDarkTheme"
          :active-user-photo-url="activeUserProfile?.photoUrl || ''"
          @tab-change="emit('tab-change', $event)"
          @open-profile="showProfile = true"
          @navigate="navigateTo"
          @open-help="showHelp = true"
          @open-bug-report="showBugReport = true"
          @share="shareCurrentUrl"
          @show-net-position="handleNetPosition"
          @open-manage-tabs="openManageTabs"
          @toggle-theme="toggleTheme"
          @logout="confirmLogout"
        />
      </div>
    </div>
  </el-header>

  <!-- Help Dialog — rendered outside el-header so it can overlay correctly -->
  <HelpDialog
    v-if="showHelp"
    v-model="showHelp"
    :loggedIn="loggedIn"
    :isDarkTheme="isDarkTheme"
    :toggleTheme="toggleTheme"
    @logout="confirmLogout"
  />

  <!-- Bug Report Dialog -->
  <el-dialog
    v-if="showBugReport"
    v-model="showBugReport"
    title="Report a Bug"
    :width="'min(95vw, 740px)'"
    append-to-body
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    class="bug-report-dialog"
  >
    <BugReportPage :view="bugReportView" :open-bug-id="bugReportOpenId" />
  </el-dialog>

  <HeaderManageTabsDialog
    v-if="showManageTabs"
    :visible="showManageTabs"
    @update:visible="showManageTabs = $event"
  />

  <ProfileDialog
    v-if="showProfile"
    :visible="showProfile"
    :user="activeUserProfile"
    @update:visible="showProfile = $event"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { Header } from '@/scripts/layout'
import { loadAsyncComponent } from '@/utils/async-component'
import DesktopHeaderActions from '../header/DesktopHeaderActions.vue'
import MobileHeaderMenu from '../header/MobileHeaderMenu.vue'
import NotificationBell from '../header/NotificationBell.vue'
import ProfileDialog from '../header/ProfileDialog.vue'
import PublicHeaderNav from '../header/PublicHeaderNav.vue'
import TitleAndTagline from '../header/TitleAndTagline.vue'

defineOptions({ inheritAttrs: false })
const HelpDialog = loadAsyncComponent(
  () => import('../generic-components/HelpDialog.vue')
)
const HeaderManageTabsDialog = loadAsyncComponent(
  () => import('../header/HeaderManageTabsDialog.vue')
)
const BugReportPage = loadAsyncComponent(
  () => import('../bug-report/BugReport.vue')
)

const props = defineProps({
  loggedIn: { type: Boolean, default: false },
  tabs: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' },
  isDarkTheme: { type: Boolean, default: false },
  toggleTheme: { type: Function, default: () => {} },
  notifications: { type: Array, default: () => [] },
  notificationCount: { type: Number, default: 0 },
  dismissNotification: { type: Function, default: () => {} }
})

const emit = defineEmits([
  'click-log',
  'show-net-position',
  'navigate-to-tab',
  'tab-change'
])

const showHelp = ref(false)
const showBugReport = ref(false)
const showManageTabs = ref(false)
const showProfile = ref(false)
const bugReportView = ref('form')
const bugReportOpenId = ref(null)

const {
  route,
  notifVisible,
  activeUserProfile,
  canShowBugReport,
  canShowManageTabs,
  canShowAdmin,
  isPublicPage,
  isStuckState,
  publicNavLinks,
  confirmLogout,
  handleNetPosition,
  navigateTo,
  shareCurrentUrl,
  handleNavigate
} = Header(props, emit, {
  openBugReport: ({ view = 'form', openId = null } = {}) => {
    bugReportView.value = view
    bugReportOpenId.value = openId
    showBugReport.value = true
  }
})

watch(showBugReport, (visible) => {
  if (visible) return
  bugReportView.value = 'form'
  bugReportOpenId.value = null
})

watch(canShowBugReport, (allowed) => {
  if (!allowed && showBugReport.value) {
    showBugReport.value = false
  }
})

watch(canShowManageTabs, (allowed) => {
  if (!allowed && showManageTabs.value) {
    showManageTabs.value = false
  }
})

function openManageTabs() {
  if (!canShowManageTabs.value) return
  showManageTabs.value = true
}
</script>

<style scoped>
.kharchafy-header {
  /* Ensure the header height is consistent with el-main's expectations */
  --el-header-padding: 0 20px;
  --el-header-height: 80px;
}
</style>

<style>
:root.dark-theme .support-dialog .el-dialog,
:root.dark-theme .bug-report-dialog .el-dialog,
:root.dark-theme .profile-dialog .el-dialog {
  background-color: #1f2937 !important;
}

:root.dark-theme .support-dialog .el-dialog__title,
:root.dark-theme .bug-report-dialog .el-dialog__title,
:root.dark-theme .profile-dialog .el-dialog__title {
  color: #f9fafb !important;
}

:root.dark-theme .support-dialog .el-dialog__header,
:root.dark-theme .bug-report-dialog .el-dialog__header,
:root.dark-theme .profile-dialog .el-dialog__header {
  border-bottom-color: #374151 !important;
}

:root.dark-theme .support-dialog .el-dialog__headerbtn .el-dialog__close,
:root.dark-theme .bug-report-dialog .el-dialog__headerbtn .el-dialog__close,
:root.dark-theme .profile-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #9ca3af !important;
}

.support-dialog .el-dialog__body,
.bug-report-dialog .el-dialog__body {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
