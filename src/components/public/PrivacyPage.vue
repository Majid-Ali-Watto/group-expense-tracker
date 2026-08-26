<template>
  <main class="public-page inner-page">
    <PageTitleSection :eyebrow="t('privacy.eyebrow')" :title="t('privacy.title')">
      <template #icon><el-icon :size="14"><Lock /></el-icon></template>
      <p>{{ t('privacy.intro') }}</p>
      <p class="last-updated">
        {{ t('privacy.lastUpdated') }}: {{ lastUpdated }}
      </p>
    </PageTitleSection>

    <section class="legal-list">
      <article
        v-for="(section, index) in sections"
        :key="section.title"
        class="legal-card"
      >
        <CardHead>
          <template #icon
            ><el-icon :size="18"
              ><component :is="SECTION_ICONS[index]"
            /></el-icon
          ></template>
          <template #title><h2>{{ section.title }}</h2></template>
        </CardHead>
        <p v-for="(paragraph, pIndex) in section.paragraphs" :key="pIndex">
          {{ paragraph }}
        </p>
        <ul v-if="section.items" class="legal-items">
          <li v-for="item in section.items" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PRIVACY_SECTIONS, LEGAL_LAST_UPDATED } from '@/constants'
import {
  Guide,
  EditPen,
  DataAnalysis,
  Setting,
  Connection,
  View,
  Lock,
  Delete,
  User,
  CircleCheck,
  Refresh,
  Message
} from '@element-plus/icons-vue'
import PageTitleSection from './PageTitleSection.vue'
import CardHead from './CardHead.vue'

const { t, locale } = useI18n()
const sections = computed(() => PRIVACY_SECTIONS[locale.value])
const lastUpdated = computed(() => LEGAL_LAST_UPDATED[locale.value])

// Index-matched to PRIVACY_SECTIONS — purely decorative, content stays in
// the locale data (src/constants/legal.js).
const SECTION_ICONS = [
  Guide, // Overview & who operates Kharchafy
  EditPen, // Information you provide
  DataAnalysis, // Information collected automatically
  Setting, // How we use your information
  Connection, // Third-party service providers
  View, // What other group members can see
  Lock, // Data storage & security
  Delete, // Data retention & account deletion
  User, // Children's privacy
  CircleCheck, // Your choices
  Refresh, // Changes to this policy
  Message // Contact us
]
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

.last-updated {
  margin: 14px 0 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #15803d;
}

.legal-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.legal-card {
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.legal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 40px rgba(22, 101, 52, 0.14);
  border-color: rgba(21, 128, 61, 0.28);
}

.legal-card h2 {
  margin: 0;
  font-size: 1.15rem;
}

.legal-card p {
  margin: 10px 0 0;
  line-height: 1.75;
  color: #4a6359;
}

.legal-card p:first-of-type {
  margin-top: 0;
}

.legal-items {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.legal-items li {
  position: relative;
  margin-top: 10px;
  padding-inline-start: 22px;
  line-height: 1.7;
  color: #4a6359;
}

.legal-items li::before {
  content: '✓';
  position: absolute;
  inset-inline-start: 0;
  font-weight: 700;
  color: #15803d;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .legal-card {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .legal-card:hover {
  box-shadow: none;
  border-color: rgba(110, 231, 183, 0.32);
}

:root.dark-theme .last-updated {
  color: #6ee7b7;
}

:root.dark-theme .legal-items li::before {
  color: #6ee7b7;
}

:root.dark-theme .legal-card p,
:root.dark-theme .legal-items li {
  color: #c5ddcf;
}
</style>
