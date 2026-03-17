<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div v-if="hasData">
    <p v-if="title" class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
      {{ title }}
    </p>
    <div class="space-y-2">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="flex items-center gap-2 text-xs"
      >
        <!-- Label -->
        <span
          class="w-24 text-right text-gray-600 dark:text-gray-400 shrink-0 truncate"
          :title="item.label"
        >{{ item.label }}</span>

        <!-- Bar track -->
        <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            class="h-full rounded-full"
            :style="`width: ${maxVal ? (item.value / maxVal) * 100 : 0}%; background: ${COLORS[i % COLORS.length]}; transition: width 0.5s ease`"
          ></div>
        </div>

        <!-- Value -->
        <span class="w-20 text-gray-800 dark:text-gray-200 shrink-0 font-semibold">
          {{ item.formatted ?? item.value }}
        </span>
      </div>
    </div>
  </div>
  <p v-else class="text-xs text-gray-400 italic">No data to display</p>
</template>

<script setup>
import { computed } from 'vue'

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'
]

const props = defineProps({
  // [{ label: string, value: number, formatted?: string }]
  items: { type: Array, required: true },
  title: { type: String, default: '' }
})

const hasData = computed(() => props.items.some((i) => (i.value || 0) > 0))

const maxVal = computed(() =>
  Math.max(...props.items.map((i) => i.value || 0), 1)
)
</script>
