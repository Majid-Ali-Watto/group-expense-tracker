<template>
  <!-- Close button: shown when the form is already open -->
  <div
    v-if="formOpen"
    class="ant-card ant-card--close"
    @click.stop="$emit('close')"
    role="button"
    tabindex="0"
    @keydown.enter.stop="$emit('close')"
  >
    <div class="ant-icon-wrap ant-icon-wrap--close">
      <XIcon class="ant-icon" />
    </div>
    <div class="ant-body">
      <span class="ant-label">Close Form</span>
      <span class="ant-hint">Tap to discard and close</span>
    </div>
    <span class="ant-arrow ant-arrow--close">&#8249;</span>
  </div>

  <!-- Add button: shown when no form is open -->
  <div
    v-else
    class="ant-card"
    @click.stop="$emit('click')"
    role="button"
    tabindex="0"
    @keydown.enter.stop="$emit('click')"
  >
    <div class="ant-icon-wrap">
      <PlusIcon class="ant-icon" />
    </div>
    <div class="ant-body">
      <span v-overflow-popup="{ title: 'Action' }" class="ant-label">{{
        text
      }}</span>
      <span class="ant-hint">Tap to open the form</span>
    </div>
    <span class="ant-arrow">&#8250;</span>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, XIcon } from '@/components/icons'

defineProps({
  text: { type: String, required: true },
  formOpen: { type: Boolean, default: false }
})
defineEmits(['click', 'close'])
</script>

<style scoped>
.ant-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--tab-gradient-start) 0%,
    var(--bg-primary) 100%
  );
  border: 1px solid var(--success-200);
  box-shadow: 0 4px 16px -6px rgba(34, 197, 94, 0.18);
  cursor: pointer;
  min-height: 52px;
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
  width: 40px;
  height: 40px;
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
  width: 15px;
  height: 15px;
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

/* Close variant */
.ant-card--close {
  border-color: var(--el-color-danger-light-5, #fca5a5);
  box-shadow: 0 4px 16px -6px rgba(239, 68, 68, 0.18);
}
.ant-card--close:hover {
  box-shadow: 0 8px 24px -8px rgba(239, 68, 68, 0.32);
  border-color: #ef4444;
}
.ant-icon-wrap--close {
  background: #ef4444;
  box-shadow: 0 6px 18px -6px rgba(239, 68, 68, 0.55);
}
.ant-card--close:hover .ant-icon-wrap--close {
  box-shadow: 0 8px 22px -4px rgba(239, 68, 68, 0.75);
}
.ant-arrow--close {
  color: #ef4444;
  transform: scaleX(-1);
}
.ant-card--close:hover .ant-arrow--close {
  transform: scaleX(-1) translateX(3px);
}

/* Dark theme: soften the bright pastel borders */
:global(.dark-theme) .ant-card {
  border-color: rgba(34, 197, 94, 0.35);
}
:global(.dark-theme) .ant-card:hover {
  border-color: var(--success-400);
}
:global(.dark-theme) .ant-card--close {
  border-color: rgba(239, 68, 68, 0.35);
}
:global(.dark-theme) .ant-card--close:hover {
  border-color: #ef4444;
}
</style>
