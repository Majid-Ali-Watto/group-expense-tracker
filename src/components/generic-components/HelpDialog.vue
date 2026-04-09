<template>
  <el-dialog
    v-model="visible"
    title="How to Use Kharchafy"
    :width="isMobile ? '95%' : '680px'"
    append-to-body
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    @close="handleClose"
    class="help-dialog"
  >
    <HelpContent />

    <template #footer>
      <div class="help-footer">
        <!-- Row 1: Theme + Logout | Close -->
        <div class="help-footer-row1">
          <div class="help-footer-left">
            <button
              class="help-theme-btn"
              @click="toggleTheme"
              size="small"
              :title="
                isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'
              "
            >
              <MoonIcon v-if="!isDarkTheme" class="w-4 h-4" />
              <SunIcon v-else class="w-4 h-4" />
              {{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}
            </button>
            <el-button
              v-if="loggedIn"
              type="warning"
              plain
              size="small"
              @click="handleLogout"
              >Logout</el-button
            >
          </div>
          <el-button size="small" @click="handleClose">Close</el-button>
        </div>
        <!-- Row 2: Email -->
        <div class="help-footer-row2">
          <span class="help-email-label">Need help?</span>
          <a
            href="mailto:majid.teresol@gmail.com"
            class="help-email-link"
            title="Email support"
          >
            <EmailIcon class="w-4 h-4" />
            majid.teresol@gmail.com
          </a>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import HelpContent from './HelpContent.vue'
import { EmailIcon, MoonIcon, SunIcon } from '@/components/icons'
import { HelpDialog } from '@/scripts/generic'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loggedIn: { type: Boolean, default: false },
  isDarkTheme: { type: Boolean, default: false },
  toggleTheme: { type: Function, default: () => {} }
})

const emit = defineEmits(['update:modelValue', 'logout'])

const { isMobile, visible, handleClose, handleLogout } = HelpDialog(props, emit)
</script>

<style scoped>
/* Footer */
.help-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.help-footer-row1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.help-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-footer-row2 {
  display: flex;
  align-items: center;
  gap: 6px;
}

.help-email-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.help-email-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: color 0.15s;
}

.help-email-link:hover {
  color: #22c55e;
  text-decoration: underline;
}

.help-theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.help-theme-btn:hover {
  background: var(--el-fill-color);
}

/* Dark theme */
:root.dark-theme :deep(.help-dialog .el-dialog) {
  background-color: #1f2937;
}

:root.dark-theme :deep(.help-dialog .el-dialog__title) {
  color: #f9fafb;
}

:root.dark-theme :deep(.help-dialog .el-dialog__header) {
  border-bottom-color: #374151;
}

:root.dark-theme :deep(.help-dialog .el-dialog__footer) {
  border-top-color: #374151;
  background-color: #1f2937;
}

:root.dark-theme :deep(.help-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #9ca3af;
}

:root.dark-theme :deep(.help-collapse .el-collapse-item__header) {
  color: #f3f4f6;
  border-bottom-color: #374151;
}

:root.dark-theme :deep(.help-collapse .el-collapse-item__wrap) {
  border-bottom-color: #374151;
}

:root.dark-theme .help-theme-btn {
  color: #d1d5db;
  border-color: #4b5563;
}

:root.dark-theme .help-theme-btn:hover {
  background: #374151;
}

:root.dark-theme .help-email-label {
  color: #6b7280;
}

:root.dark-theme .help-email-link {
  color: #9ca3af;
}

:root.dark-theme .help-email-link:hover {
  color: #4ade80;
}

</style>
