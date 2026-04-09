<template>
  <main class="public-page inner-page">
    <section class="title-section">
      <p class="eyebrow">Frequently asked questions</p>
      <h1>Questions people ask before using Kharchafy</h1>
      <p>
        These answers explain what the app does, who it is for, and what parts
        of the product should be public versus private in search.
      </p>
    </section>

    <section class="faq-list">
      <article v-for="item in FAQ_ITEMS" :key="item.question" class="faq-card">
        <h2>{{ item.question }}</h2>
        <p>{{ item.answer }}</p>
      </article>
    </section>
  </main>
</template>

<script setup>
import { FAQ_ITEMS } from '@/constants'
</script>

<style scoped>
.public-page {
  padding: 108px 20px 32px;
  max-width: 980px;
  margin: 0 auto;
  color: #173025;
}

.title-section,
.faq-card {
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
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.08;
}

.title-section p:last-child {
  margin: 16px 0 0;
  max-width: 66ch;
  line-height: 1.75;
  color: #446055;
}

.faq-list {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.faq-card {
  padding: 24px;
}

.faq-card h2 {
  margin: 0;
  font-size: 1.1rem;
}

.faq-card p {
  margin: 12px 0 0;
  line-height: 1.75;
  color: #4a6359;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .title-section,
:root.dark-theme .faq-card {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .title-section p:last-child,
:root.dark-theme .faq-card p {
  color: #c5ddcf;
}
</style>
