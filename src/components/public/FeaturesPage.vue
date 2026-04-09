<template>
  <main class="public-page inner-page">
    <section class="title-section">
      <p class="eyebrow">Feature overview</p>
      <h1>Everything Kharchafy can handle in the current app</h1>
      <p>
        Kharchafy combines shared expense tracking, shared loans, personal
        budgeting, and approval-driven collaboration in one product.
      </p>
    </section>

    <section class="stacked-grid">
      <article v-for="section in FEATURE_SECTIONS" :key="section.title" class="feature-card">
        <h2>{{ section.title }}</h2>
        <ul>
          <li v-for="point in section.points" :key="point">{{ point }}</li>
        </ul>
      </article>
    </section>
  </main>
</template>

<script setup>
import { FEATURE_SECTIONS } from '@/constants'
</script>

<style scoped>
.public-page {
  padding: 108px 20px 32px;
  max-width: 1080px;
  margin: 0 auto;
  color: #173025;
}

.title-section {
  padding: 28px 30px;
  border-radius: 24px;
  background: linear-gradient(135deg, #eefcf2 0%, #dff8e8 100%);
  border: 1px solid rgba(22, 101, 52, 0.12);
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

.stacked-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.feature-card {
  padding: 24px;
  border-radius: 22px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
}

.feature-card h2 {
  margin: 0 0 14px;
  font-size: 1.2rem;
}

.feature-card ul {
  margin: 0;
  padding-left: 18px;
}

.feature-card li {
  margin-top: 10px;
  line-height: 1.7;
  color: #4a6359;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .title-section,
:root.dark-theme .feature-card {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .title-section p:last-child,
:root.dark-theme .feature-card li {
  color: #c5ddcf;
}

@media (max-width: 900px) {
  .stacked-grid {
    grid-template-columns: 1fr;
  }
}
</style>
