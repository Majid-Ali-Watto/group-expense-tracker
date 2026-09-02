<template>
  <section class="title-section">
    <div class="title-row">
      <span class="title-icon">
        <slot name="icon" />
      </span>
      <p class="eyebrow">{{ eyebrow }}</p>
    </div>
    <h1>{{ title }}</h1>
    <slot />
  </section>
</template>

<script setup>
// Shared header block for every public marketing page (Features, Group
// Expense Tracker, Personal Budget Tracker, FAQ, Help, Privacy, Terms) —
// was duplicated 7 times with drifting cosmetics (some had a box-shadow,
// some didn't). #icon takes whatever badge content the page needs (an
// <el-icon> or a raw custom icon component); the default slot takes the
// intro paragraph(s) below the title — Privacy/Terms pass two (intro +
// "last updated").
defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true }
})
</script>

<style scoped>
.title-section {
  padding: 30px;
  border-radius: 24px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  background: linear-gradient(135deg, #eefcf2 0%, #dff8e8 100%);
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
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

.eyebrow {
  margin: 0;
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

:slotted(p) {
  margin: 16px 0 0;
  /* max-width: 66ch; */
  line-height: 1.75;
  color: #446055;
}

:root.dark-theme .title-section {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}

:root.dark-theme .eyebrow {
  color: #6ee7b7;
}

:root.dark-theme :slotted(p) {
  color: #c5ddcf;
}
</style>
