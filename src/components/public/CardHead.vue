<template>
  <div class="card-head" :class="{ 'is-dense': dense }">
    <span class="card-icon">
      <slot name="icon" />
    </span>
    <slot name="title" />
  </div>
</template>

<script setup>
// Shared icon-badge + heading row used at the top of every card across the
// public marketing pages (feature cards, benefit/use-case cards, legal
// sections, landing page highlights/use-cases/explore cards) — was
// duplicated with identical icon-badge CSS in every one of those pages.
//
// The heading itself stays a slot (#title) rather than a prop, on purpose:
// each page writes its own <h2>/<h3> there, in its own scope, so its
// existing heading styles (font-size, tag choice) keep working unchanged —
// only the icon badge + row layout move into this component.
defineProps({
  // Landing page's highlight/use-case/explore cards sit closer together
  // than the standalone pages' feature/benefit/legal cards.
  dense: { type: Boolean, default: false }
})
</script>

<style scoped>
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.card-head.is-dense {
  margin-bottom: 8px;
}

.card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  color: #15803d;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

:root.dark-theme .card-icon {
  color: #6ee7b7;
  background: linear-gradient(135deg, #14532d 0%, #0f3d24 100%);
}
</style>
