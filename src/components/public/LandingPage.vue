<template>
  <main class="public-page">
    <section class="hero-section">
      <div class="hero-copy">
        <div class="title-row">
          <span class="title-icon">
            <el-icon :size="14"><Wallet /></el-icon>
          </span>
          <p class="eyebrow">{{ t('landing.eyebrow') }}</p>
        </div>
        <h1>{{ t('landing.heroTitle') }}</h1>
        <p class="hero-text">{{ t('landing.heroText') }}</p>
        <div class="hero-actions">
          <RouterLink class="cta-primary" :to="withLocale('/register')">
            {{ t('nav.createAccount') }}
            <el-icon :size="16"><Right /></el-icon>
          </RouterLink>
          <RouterLink class="cta-secondary" :to="withLocale('/login')">{{
            t('landing.openApp')
          }}</RouterLink>
        </div>
      </div>

      <div class="hero-panel">
        <div
          v-for="(item, index) in highlights"
          :key="item.title"
          class="hero-card"
        >
          <CardHead dense>
            <template #icon
              ><el-icon :size="18"
                ><component :is="HIGHLIGHT_ICONS[index]"
              /></el-icon
            ></template>
            <template #title><h2>{{ item.title }}</h2></template>
          </CardHead>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="section-heading">
        <p class="eyebrow">{{ t('landing.useCasesEyebrow') }}</p>
      </div>

      <div class="card-grid">
        <article
          v-for="(item, index) in useCases"
          :key="item.title"
          class="content-card"
        >
          <CardHead dense>
            <template #icon
              ><el-icon :size="18"
                ><component :is="USE_CASE_ICONS[index]"
              /></el-icon
            ></template>
            <template #title><h3>{{ item.title }}</h3></template>
          </CardHead>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section class="content-section accent-section">
      <div class="section-heading">
        <p class="eyebrow">{{ t('landing.exploreEyebrow') }}</p>
      </div>

      <div class="card-grid">
        <RouterLink
          class="content-card link-card"
          :to="withLocale('/features')"
        >
          <CardHead dense>
            <template #icon><el-icon :size="18"><Grid /></el-icon></template>
            <template #title
              ><h3>{{ t('landing.explore.features.title') }}</h3></template
            >
          </CardHead>
          <p>{{ t('landing.explore.features.description') }}</p>
        </RouterLink>
        <RouterLink
          class="content-card link-card"
          :to="withLocale('/group-expense-tracker')"
        >
          <CardHead dense>
            <template #icon><UsersIcon class="card-icon-svg" /></template>
            <template #title
              ><h3>
                {{ t('landing.explore.groupExpenseTracker.title') }}
              </h3></template
            >
          </CardHead>
          <p>{{ t('landing.explore.groupExpenseTracker.description') }}</p>
        </RouterLink>
        <RouterLink
          class="content-card link-card"
          :to="withLocale('/personal-budget-tracker')"
        >
          <CardHead dense>
            <template #icon><el-icon :size="18"><WalletFilled /></el-icon></template>
            <template #title
              ><h3>
                {{ t('landing.explore.personalBudgetTracker.title') }}
              </h3></template
            >
          </CardHead>
          <p>{{ t('landing.explore.personalBudgetTracker.description') }}</p>
        </RouterLink>
        <RouterLink class="content-card link-card" :to="withLocale('/faq')">
          <CardHead dense>
            <template #icon><el-icon :size="18"><ChatDotRound /></el-icon></template>
            <template #title
              ><h3>{{ t('landing.explore.faq.title') }}</h3></template
            >
          </CardHead>
          <p>{{ t('landing.explore.faq.description') }}</p>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LANDING_HIGHLIGHTS, PUBLIC_USE_CASES } from '@/constants'
import {
  Coin,
  Money,
  PieChart,
  Bell,
  HomeFilled,
  Calendar,
  User,
  WalletFilled,
  Grid,
  ChatDotRound,
  Right,
  Wallet
} from '@element-plus/icons-vue'
import { UsersIcon } from '@/components/icons'
import CardHead from './CardHead.vue'

const route = useRoute()
const { t, locale } = useI18n()

const highlights = computed(() => LANDING_HIGHLIGHTS[locale.value])
const useCases = computed(() => PUBLIC_USE_CASES[locale.value])
const withLocale = (path) => (route.meta?.locale === 'ur' ? `/ur${path}` : path)

// Index-matched to LANDING_HIGHLIGHTS / PUBLIC_USE_CASES — purely decorative,
// content stays in the locale data.
const HIGHLIGHT_ICONS = [Coin, Money, PieChart, Bell]
const USE_CASE_ICONS = [HomeFilled, Calendar, User, WalletFilled]
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
  top: 260px;
  left: -120px;
  width: 320px;
  height: 320px;
  background: radial-gradient(
    circle,
    rgba(13, 148, 136, 0.16),
    transparent 70%
  );
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 24px;
  align-items: stretch;
}

.hero-copy,
.hero-panel,
.content-card {
  border-radius: 24px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
}

.hero-copy {
  padding: 34px;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.9),
      transparent 46%
    ),
    linear-gradient(135deg, #eefcf2 0%, #dff8e8 100%);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.title-row .eyebrow {
  margin: 0;
}

.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 7px;
  color: #ffffff;
  background: linear-gradient(135deg, #16a34a 0%, #0d9488 100%);
  box-shadow: 0 4px 10px rgba(21, 128, 61, 0.28);
}

.hero-panel {
  padding: 20px;
  display: grid;
  gap: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fff9 100%);
}

.hero-card {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(22, 101, 52, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.hero-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 28px rgba(22, 101, 52, 0.12);
}

.card-icon-svg {
  width: 18px;
  height: 18px;
}

.eyebrow {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 700;
  color: #15803d;
}

h1 {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 1.02;
  max-width: 10ch;
}

.hero-text {
  margin: 18px 0 0;
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 58ch;
  color: #365046;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.cta-primary,
.cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
  padding: 0 20px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.cta-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #16a34a 0%, #0d9488 100%);
  box-shadow: 0 10px 24px rgba(21, 128, 61, 0.28);
}

.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(21, 128, 61, 0.34);
}

[dir='rtl'] .cta-primary .el-icon {
  transform: scaleX(-1);
}

.cta-secondary {
  color: #166534;
  border: 1px solid rgba(21, 128, 61, 0.3);
  background: rgba(255, 255, 255, 0.84);
}

.cta-secondary:hover {
  transform: translateY(-2px);
  background: #ffffff;
}

.content-section {
  margin-top: 28px;
}

.section-heading {
  margin-bottom: 16px;
}

.section-heading h2,
.hero-card h2,
.content-card h3 {
  margin: 0;
}

.section-heading h2 {
  font-size: clamp(1.6rem, 2vw, 2.3rem);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.content-card {
  padding: 24px;
  background: #ffffff;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(22, 101, 52, 0.14);
  border-color: rgba(21, 128, 61, 0.28);
}

.content-card p,
.hero-card p {
  margin: 10px 0 0;
  line-height: 1.7;
  color: #4a6359;
}

.accent-section .content-card {
  background: linear-gradient(180deg, #ffffff 0%, #f7fff8 100%);
}

.link-card {
  text-decoration: none;
  color: inherit;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .hero-copy,
:root.dark-theme .hero-panel,
:root.dark-theme .content-card {
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .hero-copy {
  background: linear-gradient(135deg, #0f2c1b 0%, #123f24 100%);
}

:root.dark-theme .eyebrow {
  color: #6ee7b7;
}

:root.dark-theme .hero-panel,
:root.dark-theme .content-card,
:root.dark-theme .hero-card {
  background: #11281a;
}

:root.dark-theme .hero-text,
:root.dark-theme .content-card p,
:root.dark-theme .hero-card p {
  color: #c5ddcf;
}

:root.dark-theme .cta-secondary {
  color: #d6ffe1;
  border-color: rgba(110, 231, 183, 0.2);
  background: rgba(17, 40, 26, 0.9);
}

:root.dark-theme .content-card:hover {
  box-shadow: none;
  border-color: rgba(110, 231, 183, 0.32);
}

@media (max-width: 920px) {
  .hero-section,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
