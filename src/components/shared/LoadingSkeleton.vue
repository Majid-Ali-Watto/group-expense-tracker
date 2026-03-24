<template>
  <div
    class="loading-skeleton"
    :class="{
      'loading-skeleton--page': mode === 'page',
      'loading-skeleton--compact': mode === 'compact'
    }"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="loading-skeleton__toolbar">
      <div class="loading-skeleton__pill loading-skeleton__pill--wide"></div>
      <div class="loading-skeleton__pill"></div>
      <div class="loading-skeleton__pill"></div>
    </div>

    <div class="loading-skeleton__hero">
      <div class="loading-skeleton__metric" v-for="block in metricCount" :key="block">
        <div class="loading-skeleton__line loading-skeleton__line--label"></div>
        <div class="loading-skeleton__line loading-skeleton__line--value"></div>
      </div>
    </div>

    <div class="loading-skeleton__panel" v-for="row in rowCount" :key="`row-${row}`">
      <div class="loading-skeleton__line loading-skeleton__line--title"></div>
      <div class="loading-skeleton__line"></div>
      <div class="loading-skeleton__line loading-skeleton__line--short"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'section'
  }
})

const metricCount = computed(() => (props.mode === 'compact' ? 2 : 3))
const rowCount = computed(() => (props.mode === 'compact' ? 2 : 4))
</script>

<style scoped>
.loading-skeleton {
  display: grid;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(59, 130, 246, 0.06)),
    var(--card-bg);
}

.loading-skeleton--page {
  min-height: 60vh;
  align-content: start;
  padding: 1.5rem;
}

.loading-skeleton--compact {
  padding: 0.9rem;
  border-radius: 14px;
}

.loading-skeleton__toolbar,
.loading-skeleton__hero,
.loading-skeleton__panel {
  display: grid;
  gap: 0.75rem;
}

.loading-skeleton__toolbar {
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(90px, 1fr));
}

.loading-skeleton__hero {
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.loading-skeleton__metric,
.loading-skeleton__panel {
  padding: 0.95rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.45);
}

.dark-theme .loading-skeleton__metric,
.dark-theme .loading-skeleton__panel {
  background: rgba(17, 24, 39, 0.35);
}

.loading-skeleton__pill,
.loading-skeleton__line {
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
}

.loading-skeleton__pill::after,
.loading-skeleton__line::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.65),
    transparent
  );
  animation: skeleton-shimmer 1.2s infinite;
}

.dark-theme .loading-skeleton__pill::after,
.dark-theme .loading-skeleton__line::after {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.16),
    transparent
  );
}

.loading-skeleton__pill {
  height: 38px;
}

.loading-skeleton__pill--wide {
  min-width: 0;
}

.loading-skeleton__line {
  height: 14px;
}

.loading-skeleton__line--label {
  width: 42%;
  height: 11px;
}

.loading-skeleton__line--value {
  width: 68%;
  height: 22px;
}

.loading-skeleton__line--title {
  width: 38%;
  height: 16px;
}

.loading-skeleton__line--short {
  width: 58%;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 640px) {
  .loading-skeleton__toolbar {
    grid-template-columns: 1fr;
  }

  .loading-skeleton__hero {
    grid-template-columns: 1fr;
  }
}
</style>
