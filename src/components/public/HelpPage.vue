<template>
  <main class="public-page inner-page">
    <section class="title-section">
      <p class="eyebrow">Public help page</p>
      <h1>How to use Kharchafy</h1>
      <p>
        This page explains the app’s current workflows, including registration,
        groups, shared expenses, shared loans, personal budgeting, exports, and
        notifications.
      </p>
    </section>

    <section class="help-shell">
      <HelpContent :expand-all="true" />
    </section>
  </main>
</template>

<script setup>
import HelpContent from '@/components/generic-components/HelpContent.vue'
</script>

<style scoped>
.public-page {
  padding: 108px 20px 32px;
  max-width: 980px;
  margin: 0 auto;
  color: #173025;
}

.title-section,
.help-shell {
  border-radius: 24px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
}

.title-section {
  padding: 30px;
  background: linear-gradient(135deg, #eefcf2 0%, #dff8e8 100%);
}

.help-shell {
  margin-top: 24px;
  padding: 16px;
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

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .title-section,
:root.dark-theme .help-shell {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .title-section p:last-child {
  color: #c5ddcf;
}
</style>
