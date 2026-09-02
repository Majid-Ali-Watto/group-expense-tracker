<template>
  <el-collapse-item
    :name="name"
    class="accordion-item"
    :class="`is-${variant}`"
  >
    <template #title>
      <span class="accordion-item-title">
        <span v-if="$slots.badge" class="accordion-item-badge">
          <slot name="badge" />
        </span>
        <span class="accordion-item-title-text">
          <slot name="title" />
        </span>
      </span>
    </template>
    <div class="accordion-item-content">
      <slot />
    </div>
  </el-collapse-item>
</template>

<script setup>
defineProps({
  name: { type: [String, Number], required: true },
  // 'card' — the roomy, icon-badged card look used on public Help/FAQ pages.
  // 'compact' — a denser row for in-app use (e.g. group details), smaller
  // badge, tighter padding, same animated open/close either way.
  variant: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'compact'].includes(value)
  }
})
</script>

<style scoped>
/* Card chrome + hover lift. Open/close animation itself (height, opacity,
   translateY/scaleY on .is-active) is handled globally in main.css for
   every .el-collapse-item — this only adds the layout this component
   introduces (badge, spacing) on top of it. Colors use the app's
   theme tokens so both light and dark theme are covered without a
   separate dark-theme block here. */
:deep(.el-collapse-item) {
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  background: var(--card-bg);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.2s ease;
}

:deep(.el-collapse-item:hover) {
  border-color: var(--success-500);
  box-shadow: 0 10px 24px rgba(22, 101, 52, 0.08);
}

:deep(.el-collapse-item__header) {
  display: flex;
  align-items: center;
  font-weight: 600;
  background: transparent;
  border-bottom: none;
  height: auto;
  line-height: 1.4;
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
  border-bottom: none;
}

.accordion-item-title {
  display: flex;
  align-items: center;
  width: 100%;
  color: var(--text-primary);
}

.accordion-item-title-text {
  display: inline-flex;
  align-items: center;
  line-height: 1.4;
}

.accordion-item-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #15803d;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

:root.dark-theme .accordion-item-badge {
  color: #6ee7b7;
  background: linear-gradient(135deg, #14532d 0%, #0f3d24 100%);
}

/* card variant — roomy, marketing-page look (Help, FAQ) */
.is-card :deep(.el-collapse-item__header) {
  font-size: 15px;
  padding: 12px 14px;
}

.is-card .accordion-item-title {
  gap: 12px;
}

.is-card .accordion-item-badge {
  width: 30px;
  height: 30px;
  border-radius: 10px;
}

/* compact variant — dense in-app row (e.g. group details) */
.is-compact :deep(.el-collapse-item) {
  border-radius: 10px;
}

.is-compact :deep(.el-collapse-item__header) {
  font-size: 13px;
  padding: 8px 10px;
}

.is-compact .accordion-item-title {
  gap: 8px;
}

.is-compact .accordion-item-badge {
  width: 22px;
  height: 22px;
  border-radius: 7px;
}

.accordion-item-content {
  color: var(--text-primary);
}
</style>
