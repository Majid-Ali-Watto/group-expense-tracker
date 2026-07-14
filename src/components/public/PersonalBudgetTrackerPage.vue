<template>
  <main class="public-page inner-page">
    <section class="title-section">
      <p class="eyebrow">{{ t('personalBudgetTracker.eyebrow') }}</p>
      <h1>{{ t('personalBudgetTracker.title') }}</h1>
      <p>{{ t('personalBudgetTracker.intro') }}</p>
    </section>

    <section class="bullet-section single-column">
      <article class="bullet-card">
        <h2>{{ t('personalBudgetTracker.benefitsHeading') }}</h2>
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

const { t, locale } = useI18n()
const benefits = computed(() => BUDGET_BENEFITS[locale.value])
</script>

<style scoped>
.public-page {
  padding: 108px 20px 32px;
  max-width: 1080px;
  margin: 0 auto;
  color: #173025;
}

.title-section,
.bullet-card {
  border-radius: 24px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
}

.title-section {
  padding: 30px;
  background: linear-gradient(135deg, #eefcf2 0%, #dff8e8 100%);
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #15803d;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.08;
}

.title-section p:last-child {
  margin: 16px 0 0;
  max-width: 66ch;
  line-height: 1.75;
  color: #446055;
}

.bullet-section {
  margin-top: 24px;
}

.bullet-card {
  padding: 24px;
}

.bullet-card h2 {
  margin: 0 0 14px;
}

.bullet-card ul {
  margin: 0;
  padding-inline-start: 18px;
}

.bullet-card li {
  margin-top: 10px;
  line-height: 1.7;
  color: #4a6359;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .title-section,
:root.dark-theme .bullet-card {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .title-section p:last-child,
:root.dark-theme .bullet-card li {
  color: #c5ddcf;
}
</style>
