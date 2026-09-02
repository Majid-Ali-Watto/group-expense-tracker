<template>
  <main class="public-page inner-page">
    <PageTitleSection
      :eyebrow="t('landing.explore.personalBudgetTracker.title')"
      :title="t('personalBudgetTracker.title')"
    >
      <template #icon
        ><el-icon :size="14"><WalletFilled /></el-icon
      ></template>
      <p>{{ t('personalBudgetTracker.intro') }}</p>
    </PageTitleSection>

    <section class="bullet-section single-column">
      <article class="bullet-card">
        <CardHead>
          <template #icon
            ><el-icon :size="18"><WalletFilled /></el-icon
          ></template>
          <template #title
            ><h2>{{ t('personalBudgetTracker.benefitsHeading') }}</h2></template
          >
        </CardHead>
        <ul>
          <li v-for="point in benefits" :key="point">{{ point }}</li>
        </ul>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BUDGET_BENEFITS } from '@/constants'
import { WalletFilled } from '@element-plus/icons-vue'
import PageTitleSection from './PageTitleSection.vue'
import CardHead from './CardHead.vue'

const { t, locale } = useI18n()
const benefits = computed(() => BUDGET_BENEFITS[locale.value])
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

.bullet-card {
  border-radius: 24px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
}

.bullet-section {
  margin-top: 24px;
}

.bullet-card {
  padding: 24px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.bullet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(22, 101, 52, 0.14);
  border-color: rgba(21, 128, 61, 0.28);
}

.bullet-card h2 {
  margin: 0;
}

.bullet-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.bullet-card li {
  position: relative;
  margin-top: 10px;
  padding-inline-start: 22px;
  line-height: 1.7;
  color: #4a6359;
}

.bullet-card li::before {
  content: '✓';
  position: absolute;
  inset-inline-start: 0;
  font-weight: 700;
  color: #15803d;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .bullet-card {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .bullet-card:hover {
  box-shadow: none;
  border-color: rgba(110, 231, 183, 0.32);
}

:root.dark-theme .bullet-card li::before {
  color: #6ee7b7;
}

:root.dark-theme .bullet-card li {
  color: #c5ddcf;
}
</style>
