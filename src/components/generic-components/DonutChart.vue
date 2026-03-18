<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div v-if="hasData">
    <p
      v-if="title"
      class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
    >
      {{ title }}
    </p>
    <div class="flex flex-col sm:flex-row items-center gap-4">
      <!-- SVG donut — rotated so segments start at 12 o'clock -->
      <svg
        viewBox="0 0 42 42"
        class="w-36 h-36 shrink-0"
        style="transform: rotate(-90deg)"
        aria-hidden="true"
      >
        <!-- Background ring -->
        <circle
          cx="21"
          cy="21"
          r="15.9155"
          fill="transparent"
          stroke="#d1d5db"
          stroke-width="3.5"
        />
        <!-- Colored segments -->
        <circle
          v-for="(seg, i) in computedSegments"
          :key="i"
          cx="21"
          cy="21"
          r="15.9155"
          fill="transparent"
          :stroke="seg.color"
          stroke-width="3.5"
          :stroke-dasharray="`${seg.dash} ${100 - seg.dash}`"
          :stroke-dashoffset="-seg.offset"
        />
      </svg>

      <!-- Legend -->
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <div
          v-for="(seg, i) in computedSegments"
          :key="i"
          class="flex items-center gap-1.5 text-xs"
        >
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="`background: ${seg.color}`"
          ></span>
          <span class="text-gray-600 dark:text-gray-400">{{ seg.label }}</span>
          <span class="font-semibold text-gray-900 dark:text-gray-100">{{
            seg.formatted
          }}</span>
          <span class="text-gray-400 text-[10px]">({{ seg.pct }}%)</span>
        </div>
      </div>
    </div>
  </div>
  <p v-else class="text-xs text-gray-400 italic">No data to display</p>
</template>

<script setup>
import { computed } from 'vue'

const COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899'
]

const props = defineProps({
  // [{ label: string, value: number, formatted?: string }]
  segments: { type: Array, required: true },
  title: { type: String, default: '' }
})

const hasData = computed(() => props.segments.some((s) => (s.value || 0) > 0))

const total = computed(() =>
  props.segments.reduce((sum, s) => sum + (s.value || 0), 0)
)

const computedSegments = computed(() => {
  if (!total.value) return []
  let cumulative = 0
  return props.segments
    .filter((s) => (s.value || 0) > 0)
    .map((seg, i) => {
      const pct = (seg.value / total.value) * 100
      const offset = cumulative
      cumulative += pct
      return {
        label: seg.label,
        dash: pct,
        offset,
        color: COLORS[i % COLORS.length],
        formatted: seg.formatted ?? seg.value,
        pct: pct.toFixed(1)
      }
    })
})
</script>
