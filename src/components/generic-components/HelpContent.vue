<template>
  <div class="help-content">
    <div class="help-intro">
      <p class="help-intro-text">{{ intro }}</p>
    </div>

    <el-collapse v-model="openSections" class="help-collapse">
      <el-collapse-item
        v-for="(section, index) in sections"
        :key="section.name"
        :name="section.name"
      >
        <template #title>
          <span class="help-section-title">
            <span class="help-icon">{{ index + 1 }}</span> {{ section.title }}
          </span>
        </template>
        <ul class="help-list">
          <li v-for="item in section.items" :key="item.term">
            <strong>{{ item.term }}</strong> — {{ item.description }}
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  HELP_INTRO,
  HELP_SECTIONS,
  SECTION_NAMES
} from '@/scripts/generic-components/help-content'

const props = defineProps({
  expandAll: { type: Boolean, default: false },
  locale: { type: String, default: 'en' }
})

const sections = computed(() => HELP_SECTIONS[props.locale])
const intro = computed(() => HELP_INTRO[props.locale])
const openSections = ref(props.expandAll ? [...SECTION_NAMES] : ['start'])
</script>

<style scoped>
.help-content {
  max-height: 65vh;
  overflow-y: auto;
  padding: 4px 8px;
}

.help-intro {
  background: var(--el-color-primary-light-9, #f0fdf4);
  border-inline-start: 4px solid #22c55e;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.help-intro-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.6;
}

.help-collapse {
  border: none;
}

:deep(.help-collapse .el-collapse-item__header) {
  font-size: 15px;
  font-weight: 600;
  padding: 0 4px;
  background: transparent;
}

:deep(.help-collapse .el-collapse-item__content) {
  padding: 8px 4px 16px;
}

:deep(.help-collapse .el-collapse-item__wrap) {
  background: transparent;
}

.help-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-primary);
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #22c55e;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-list li {
  font-size: 13.5px;
  color: var(--el-text-color-regular);
  line-height: 1.55;
  padding-inline-start: 14px;
  position: relative;
}

.help-list li::before {
  content: '–';
  position: absolute;
  inset-inline-start: 0;
  color: #22c55e;
  font-weight: 700;
}

.help-list li strong {
  color: var(--el-text-color-primary);
}

:root.dark-theme .help-intro {
  background: rgba(34, 197, 94, 0.1);
}

:root.dark-theme .help-intro-text {
  color: #d1fae5;
}

:root.dark-theme .help-section-title {
  color: #f3f4f6;
}

:root.dark-theme :deep(.help-collapse .el-collapse-item__header) {
  color: #f3f4f6;
  border-bottom-color: #374151;
}

:root.dark-theme :deep(.help-collapse .el-collapse-item__wrap) {
  border-bottom-color: #374151;
}

:root.dark-theme .help-list li {
  color: #d1d5db;
}

:root.dark-theme .help-list li strong {
  color: #f9fafb;
}

:root.dark-theme .help-content::-webkit-scrollbar {
  width: 6px;
}

:root.dark-theme .help-content::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 4px;
}

:root.dark-theme .help-content::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}
</style>
