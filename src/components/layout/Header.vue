<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <el-header
    class="kharchafy-header flex flex-col fixed top-0 left-0 w-full z-50 !text-white transition-all duration-300"
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

        <LanguageSwitcher
          :is-visible="hasLocaleVariant || loggedIn"
          :use-toggle="!hasLocaleVariant"
          :route-path="route.path"
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
          :can-show-bug-report="canShowBugReport"
          :can-show-admin="canShowAdmin"
          :active-user-photo-url="activeUserProfile?.photoUrl || ''"
          @open-profile="showProfile = true"
          @open-bug-report="navigateTo('/report-bug')"
          @open-help="navigateTo('/help')"
          @navigate="navigateTo"
          @share="shareCurrentUrl"
          @show-net-position="handleNetPosition"
          @logout="confirmLogout"
        />

        <MobileHeaderMenu
          :logged-in="loggedIn"
          :tabs="tabs"
          :active-tab="activeTab"
          :is-public-page="isPublicPage"
          :has-locale-variant="hasLocaleVariant"
          :public-nav-links="publicNavLinks"
          :route-path="route.path"
          :is-stuck-state="isStuckState"
          :can-show-bug-report="canShowBugReport"
          :can-show-admin="canShowAdmin"
          :active-user-photo-url="activeUserProfile?.photoUrl || ''"
          @tab-change="emit('tab-change', $event)"
          @open-profile="showProfile = true"
          @navigate="navigateTo"
          @open-help="navigateTo('/help')"
          @open-bug-report="navigateTo('/report-bug')"
          @share="shareCurrentUrl"
          @show-net-position="handleNetPosition"
          @logout="confirmLogout"
        />
      </div>
    </div>
  </el-header>

  <ProfileDialog
    v-if="showProfile"
    :visible="showProfile"
    :user="activeUserProfile"
    @update:visible="showProfile = $event"
  />
</template>

<script setup>
import { ref } from 'vue'
// Direct path, not the '@/scripts/layout' barrel — that barrel also
// re-exports app.js, same reasoning as App.vue's equivalent comment.
import { Header } from '@/scripts/layout/header'
import DesktopHeaderActions from '../header/DesktopHeaderActions.vue'
import LanguageSwitcher from '../header/LanguageSwitcher.vue'
import MobileHeaderMenu from '../header/MobileHeaderMenu.vue'
import NotificationBell from '../header/NotificationBell.vue'
import PublicHeaderNav from '../header/PublicHeaderNav.vue'
import TitleAndTagline from '../header/TitleAndTagline.vue'
import { loadAsyncComponent } from '@/utils/async-component'

// Lazy, not a plain synchronous import like its siblings above —
// ProfileDialog is `v-if="showProfile"` (opened by clicking the profile
// icon), but a synchronous import bundles its full module — including a
// direct '@/firebase' import and the '@/components/generic-components'
// barrel (which statically imports ~30 components, NetPositionDialog.vue
// among them) — into Header.vue's own chunk unconditionally. Since Header
// renders on every route including public marketing pages, that dragged
// Firestore-touching code and a pile of unrelated component CSS
// (NetPositionDialog + the el-dialog/el-checkbox/el-form/el-alert it needs)
// into every visitor's bundle regardless of whether they ever open this
// dialog.
const ProfileDialog = loadAsyncComponent(
  () => import('../header/ProfileDialog.vue')
)

defineOptions({ inheritAttrs: false })

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

const showProfile = ref(false)

const {
  route,
  notifVisible,
  activeUserProfile,
  canShowBugReport,
  canShowAdmin,
  isPublicPage,
  hasLocaleVariant,
  isStuckState,
  publicNavLinks,
  confirmLogout,
  handleNetPosition,
  navigateTo,
  shareCurrentUrl,
  handleNavigate
} = Header(props, emit)
</script>

<style scoped>
.kharchafy-header {
  /* Ensure the header height is consistent with el-main's expectations */
  --el-header-padding: 0 20px;
  --el-header-height: 80px;

  background: linear-gradient(
    100deg,
    #0f9d58 0%,
    #16a34a 32%,
    #0d9488 68%,
    #0f9d58 100%
  );
  background-size: 200% 100%;
  animation: kharchafy-header-shimmer 12s ease-in-out infinite;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 10px 30px -12px rgba(6, 78, 59, 0.55);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

@keyframes kharchafy-header-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kharchafy-header {
    animation: none;
  }
}
</style>

<style>
:root.dark-theme .support-dialog .el-dialog,
:root.dark-theme .profile-dialog .el-dialog {
  background-color: #1f2937 !important;
}

:root.dark-theme .support-dialog .el-dialog__title,
:root.dark-theme .profile-dialog .el-dialog__title {
  color: #f9fafb !important;
}

:root.dark-theme .support-dialog .el-dialog__header,
:root.dark-theme .profile-dialog .el-dialog__header {
  border-bottom-color: #374151 !important;
}

:root.dark-theme .support-dialog .el-dialog__headerbtn .el-dialog__close,
:root.dark-theme .profile-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #9ca3af !important;
}

.support-dialog .el-dialog__body {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
