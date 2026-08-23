<template>
  <div class="hidden min-[768px]:flex items-center gap-2">
    <button
      v-if="canShowBugReport"
      class="theme-btn"
      :title="t('headerActions.reportBug')"
      @click="emit('open-bug-report')"
    >
      <AlertTriangleIcon class="w-5 h-5" />
    </button>

    <button
      v-if="!isPublicPage"
      class="theme-btn"
      :title="t('headerActions.help')"
      @click="emit('open-help')"
    >
      <QuestionCircleIcon class="w-5 h-5" />
    </button>

    <button
      v-if="isPublicPage"
      class="guest-link-btn"
      @click="emit('navigate', '/login')"
    >
      {{ t('nav.login') }}
    </button>

    <button
      v-if="isPublicPage"
      class="guest-cta-btn"
      @click="emit('navigate', '/register')"
    >
      {{ t('nav.createAccount') }}
    </button>

    <button
      v-if="isStuckState"
      class="guest-cta-btn"
      @click="emit('navigate', '/login')"
    >
      {{ t('headerActions.signIn') }}
    </button>

    <button
      class="theme-btn"
      :title="t('headerActions.shareCurrentPage')"
      @click="emit('share')"
    >
      <ShareIcon class="w-5 h-5" />
    </button>

    <button
      class="theme-btn"
      :title="
        isDarkTheme
          ? t('headerActions.switchToLightMode')
          : t('headerActions.switchToDarkMode')
      "
      @click="emit('toggle-theme')"
    >
      <MoonIcon v-if="!isDarkTheme" class="w-5 h-5" />
      <SunIcon v-else class="w-5 h-5" />
    </button>

    <button
      v-if="loggedIn"
      class="theme-btn"
      :title="t('common.profileAlt')"
      @click="emit('open-profile')"
    >
      <UserAvatar
        :image-url="activeUserPhotoUrl"
        :alt="t('common.profileAlt')"
        size="fill"
        variant="profile"
        icon-size="md"
        icon-tone="current"
      />
    </button>

    <button
      v-if="loggedIn"
      class="theme-btn"
      :title="t('headerActions.expensesSummary')"
      @click="emit('show-net-position')"
    >
      <el-icon :size="18"><DataAnalysis /></el-icon>
    </button>

    <button
      v-if="canShowAdmin"
      class="theme-btn"
      :title="t('headerActions.adminConfig')"
      @click="emit('navigate', '/admin')"
    >
      <el-icon :size="18"><Tools /></el-icon>
    </button>

    <button
      v-if="canShowManageTabs"
      class="theme-btn"
      :title="t('headerActions.manageTabs')"
      @click="emit('open-manage-tabs')"
    >
      <el-icon :size="18"><Setting /></el-icon>
    </button>

    <button
      v-if="loggedIn"
      class="theme-btn"
      :title="t('headerActions.logout')"
      @click="emit('logout')"
    >
      <el-icon :size="18"><SwitchButton /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  DataAnalysis,
  Setting,
  SwitchButton,
  Tools
} from '@element-plus/icons-vue'
import { UserAvatar } from '@/components/generic-components'
import {
  AlertTriangleIcon,
  MoonIcon,
  QuestionCircleIcon,
  ShareIcon,
  SunIcon
} from '@/components/icons'

const { t } = useI18n()

defineProps({
  loggedIn: { type: Boolean, default: false },
  isPublicPage: { type: Boolean, default: false },
  isStuckState: { type: Boolean, default: false },
  isDarkTheme: { type: Boolean, default: false },
  canShowBugReport: { type: Boolean, default: false },
  canShowManageTabs: { type: Boolean, default: false },
  canShowAdmin: { type: Boolean, default: false },
  activeUserPhotoUrl: { type: String, default: '' }
})

const emit = defineEmits([
  'open-bug-report',
  'open-help',
  'navigate',
  'share',
  'toggle-theme',
  'open-profile',
  'show-net-position',
  'open-manage-tabs',
  'logout'
])
</script>

<style scoped>
.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #ffffff;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.guest-link-btn,
.guest-cta-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: transparent;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.guest-cta-btn {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.72);
}

.guest-link-btn:hover,
.guest-cta-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.theme-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}
</style>
