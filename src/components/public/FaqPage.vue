<template>
  <main class="public-page inner-page">
    <PageTitleSection :eyebrow="t('faq.eyebrow')" :title="t('faq.title')">
      <template #icon><el-icon :size="14"><ChatDotRound /></el-icon></template>
      <p>{{ t('faq.intro') }}</p>
    </PageTitleSection>

    <el-collapse v-model="openItems" class="faq-list">
      <AccordionItem
        v-for="(item, index) in faqItems"
        :key="item.question"
        :name="item.question"
      >
        <template #badge>{{ index + 1 }}</template>
        <template #title>{{ item.question }}</template>
        <p class="faq-answer">{{ item.answer }}</p>
      </AccordionItem>
    </el-collapse>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FAQ_ITEMS } from '@/constants'
import { ChatDotRound } from '@element-plus/icons-vue'
import AccordionItem from '@/components/generic-components/AccordionItem.vue'
import PageTitleSection from './PageTitleSection.vue'

const { t, locale } = useI18n()
const faqItems = computed(() => FAQ_ITEMS[locale.value])
// All questions start collapsed — the visitor picks what to read.
const openItems = ref([])
</script>

<style scoped>
.public-page {
  position: relative;
  padding: 108px 20px 32px;
  width: 100%;
  color: #173025;
  overflow: hidden;
  isolation: isolate;
}

.public-page::before,
.public-page::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.public-page::before {
  top: -120px;
  right: -80px;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.22), transparent 70%);
}

.public-page::after {
  top: 320px;
  left: -120px;
  width: 320px;
  height: 320px;
  background: radial-gradient(
    circle,
    rgba(13, 148, 136, 0.16),
    transparent 70%
  );
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 24px;
  border: none;
}

:deep(.faq-list .el-collapse-item) {
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
}

:deep(.faq-list .el-collapse-item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(22, 101, 52, 0.14);
}

:deep(.faq-list .el-collapse-item__header) {
  font-size: 1.1rem;
  padding: 18px 24px;
}

:deep(.faq-list .el-collapse-item__content) {
  padding-inline: 24px;
}

/* FAQ's badge is a numbered pill rather than the default rounded-square
   icon badge — everything else (sizing, color, dark theme) still comes
   from AccordionItem. */
:deep(.faq-list .accordion-item-badge) {
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.faq-answer {
  margin: 0;
  line-height: 1.75;
  color: #4a6359;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

/* Public pages use a greener dark palette than the app's generic
   --card-bg token — override AccordionItem's card chrome to match the
   rest of this page's dark-theme cards (title-section etc. above). */
:root.dark-theme :deep(.faq-list .el-collapse-item) {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme :deep(.faq-list .el-collapse-item:hover) {
  box-shadow: none;
  border-color: rgba(110, 231, 183, 0.32);
}

:root.dark-theme .faq-answer {
  color: #c5ddcf;
}
</style>
