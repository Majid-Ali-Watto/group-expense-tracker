<template>
  <div
    class="ant-card"
    @click.stop="$emit('click')"
    role="button"
    tabindex="0"
    @keydown.enter.stop="$emit('click')"
  >
    <div class="ant-icon-wrap">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="ant-icon"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
    <div class="ant-body">
      <span class="ant-label">{{ text }}</span>
      <span class="ant-hint">Tap to open the form</span>
    </div>
    <span class="ant-arrow">&#8250;</span>
  </div>
</template>

<script setup lang="ts">
defineProps({ text: { type: String, required: true } })
defineEmits(['click'])
</script>

<style scoped>
.ant-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--tab-gradient-start) 0%,
    var(--bg-primary) 100%
  );
  border: 1.5px solid var(--success-200);
  box-shadow: 0 4px 16px -6px rgba(34, 197, 94, 0.18);
  cursor: pointer;
  min-height: 72px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
  user-select: none;
}
.ant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(34, 197, 94, 0.32);
  border-color: var(--success-500);
}
.ant-card:active {
  transform: translateY(0);
}
.ant-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px -6px rgba(34, 197, 94, 0.55);
  transition: box-shadow 0.15s ease;
}
.ant-card:hover .ant-icon-wrap {
  box-shadow: 0 8px 22px -4px rgba(34, 197, 94, 0.75);
}
.ant-icon {
  width: 20px;
  height: 20px;
  color: #fff;
}
.ant-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}
.ant-label {
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ant-hint {
  font-size: 0.72rem;
  color: var(--text-secondary);
}
.ant-arrow {
  flex-shrink: 0;
  font-size: 1.6rem;
  line-height: 1;
  color: var(--success-500);
  opacity: 0.6;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.ant-card:hover .ant-arrow {
  opacity: 1;
  transform: translateX(3px);
}
</style>
