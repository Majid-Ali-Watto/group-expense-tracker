<template>
  <main class="public-page">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="eyebrow">Shared spending made clearer</p>
        <h1>Group expense tracking for trips, roommates, and monthly budgets</h1>
        <p class="hero-text">
          Kharchafy helps you split bills, track shared loans, store receipts,
          and manage personal budgets without losing track of who paid, who
          owes, or what changed.
        </p>
        <div class="hero-actions">
          <RouterLink class="cta-primary" to="/register">Create account</RouterLink>
          <RouterLink class="cta-secondary" to="/login">Open app</RouterLink>
        </div>
      </div>

      <div class="hero-panel">
        <div v-for="item in LANDING_HIGHLIGHTS" :key="item.title" class="hero-card">
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="section-heading">
        <p class="eyebrow">Common use cases</p>
        <h2>Built for real shared-money workflows</h2>
      </div>

      <div class="card-grid">
        <article v-for="item in PUBLIC_USE_CASES" :key="item.title" class="content-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section class="content-section accent-section">
      <div class="section-heading">
        <p class="eyebrow">Explore more</p>
        <h2>Public pages Google can index today</h2>
      </div>

      <div class="card-grid">
        <RouterLink class="content-card link-card" to="/features">
          <h3>Features</h3>
          <p>See shared expense, loan, approval, and export capabilities.</p>
        </RouterLink>
        <RouterLink class="content-card link-card" to="/group-expense-tracker">
          <h3>Group expense tracker</h3>
          <p>Learn how Kharchafy handles roommates, trips, and shared bills.</p>
        </RouterLink>
        <RouterLink class="content-card link-card" to="/personal-budget-tracker">
          <h3>Personal budget tracker</h3>
          <p>Review salary, monthly expenses, and personal finance workflows.</p>
        </RouterLink>
        <RouterLink class="content-card link-card" to="/faq">
          <h3>FAQ</h3>
          <p>Read practical answers before you create an account.</p>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { LANDING_HIGHLIGHTS, PUBLIC_USE_CASES } from '@/constants'
</script>

<style scoped>
.public-page {
  padding: 108px 20px 32px;
  max-width: 1180px;
  margin: 0 auto;
  color: #163020;
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
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), transparent 46%),
    linear-gradient(135deg, #f1fdf5 0%, #dcfce7 100%);
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
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
}

.cta-primary {
  color: #ffffff;
  background: #15803d;
}

.cta-secondary {
  color: #166534;
  border: 1px solid rgba(21, 128, 61, 0.3);
  background: rgba(255, 255, 255, 0.84);
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

@media (max-width: 920px) {
  .hero-section,
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
