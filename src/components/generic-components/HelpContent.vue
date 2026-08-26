<template>
  <div class="help-content">
    <div class="help-intro">
      <span class="help-intro-icon">
        <el-icon :size="20"><Guide /></el-icon>
      </span>
      <p class="help-intro-text">{{ intro }}</p>
    </div>

    <el-collapse v-model="openSections" class="help-collapse">
      <AccordionItem
        v-for="section in sections"
        :key="section.name"
        :name="section.name"
      >
        <template #badge>
          <el-icon :size="16"
            ><component :is="SECTION_ICONS[section.name]"
          /></el-icon>
        </template>
        <template #title>{{ section.title }}</template>
        <ul class="help-list">
          <li v-for="item in section.items" :key="item.term">
            <strong>{{ item.term }}</strong> — {{ item.description }}
          </li>
        </ul>
      </AccordionItem>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  HELP_INTRO,
  HELP_SECTIONS
} from '@/scripts/generic-components/help-content'
import AccordionItem from './AccordionItem.vue'
import {
  Guide,
  MagicStick,
  Connection,
  Coin,
  Money,
  Handbag,
  CircleCheck,
  UserFilled,
  TrendCharts,
  WalletFilled,
  Bell,
  PieChart,
  Download,
  Brush
} from '@element-plus/icons-vue'

const props = defineProps({
  locale: { type: String, default: 'en' }
})

const sections = computed(() => HELP_SECTIONS[props.locale])
const intro = computed(() => HELP_INTRO[props.locale])
// All sections start collapsed — the user picks what to read.
const openSections = ref([])

// Keyed by section name (stable across locales) — purely decorative, content
// stays in HELP_SECTIONS.
const SECTION_ICONS = {
  start: Guide,
  'new-features': MagicStick,
  groups: Connection,
  expenses: Coin,
  'shared-loans': Money,
  'personal-loans': Handbag,
  settlement: CircleCheck,
  users: UserFilled,
  'net-position': TrendCharts,
  salary: WalletFilled,
  notifications: Bell,
  charts: PieChart,
  export: Download,
  theme: Brush
}
</script>

<style scoped>
.help-content {
  overflow-y: auto;
  padding: 4px 8px;
}

.help-intro {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid rgba(22, 101, 52, 0.12);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 18px;
}

.help-intro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  color: #ffffff;
  background: linear-gradient(135deg, #16a34a 0%, #0d9488 100%);
  box-shadow: 0 8px 18px rgba(21, 128, 61, 0.28);
}

.help-intro-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.6;
}

.help-collapse {
  border: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  content: '✓';
  position: absolute;
  inset-inline-start: 0;
  color: #15803d;
  font-weight: 700;
}

.help-list li strong {
  color: var(--el-text-color-primary);
}

:root.dark-theme .help-intro {
  background: linear-gradient(135deg, #0f2c1b 0%, #123f24 100%);
  border-color: rgba(110, 231, 183, 0.16);
}

:root.dark-theme .help-intro-text {
  color: #d1fae5;
}

/* Matches .help-intro's green-tinted dark palette above rather than
   AccordionItem's generic --card-bg default, since this component is
   also used inline on the public /help page. */
:root.dark-theme :deep(.help-collapse .el-collapse-item) {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
}

:root.dark-theme :deep(.help-collapse .el-collapse-item:hover) {
  border-color: rgba(110, 231, 183, 0.32);
  box-shadow: none;
}

:root.dark-theme .help-list li {
  color: #d1d5db;
}

:root.dark-theme .help-list li::before {
  color: #6ee7b7;
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
