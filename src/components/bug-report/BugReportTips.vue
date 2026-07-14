<template>
  <div class="bug-tips">
    <p class="bug-tips-title">{{ t('bugReports.tipsTitle') }}</p>
    <ul class="bug-tips-list">
      <li v-for="tip in tm('bugReports.tips')" :key="tip">{{ tip }}</li>
    </ul>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()
</script>

<style scoped>
.bug-tips {
  padding: 16px 20px;
  border: 1px dashed var(--el-border-color);
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.bug-tips-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 10px;
}

.bug-tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bug-tips-list li {
  font-size: 13px;
  color: var(--el-text-color-regular);
  padding-left: 14px;
  position: relative;
  line-height: 1.5;
}

.bug-tips-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #f97316;
  font-weight: 700;
}

/* Dark theme */
:root.dark-theme .bug-tips {
  border-color: #374151;
}
:root.dark-theme .bug-tips-title {
  color: #f3f4f6;
}
:root.dark-theme .bug-tips-list li {
  color: #d1d5db;
}
</style>
