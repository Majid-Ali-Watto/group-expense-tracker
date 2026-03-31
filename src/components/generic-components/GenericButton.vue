<template>
  <button
    v-if="type === 'link'"
    type="button"
    :disabled="disabled"
    :class="['gb-link', customClass]"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </button>
  <el-button
    v-else
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :plain="plain"
    :class="[
      'focus:ring focus:ring-blue-200 text-white px-4 py-2 rounded',
      customClass
    ]"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </el-button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'primary' },
  size: { type: String, default: 'default' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  plain: { type: Boolean, default: false },
  customClass: { type: [String, Object, Array], default: '' }
})

defineEmits(['click'])
</script>

<style scoped>
.gb-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  color: #16a34a;
  cursor: pointer;
  text-decoration: none;
  text-underline-offset: 2px;
  transition:
    color 0.15s ease,
    text-decoration 0.15s ease;
}
.gb-link:hover {
  color: #15803d;
  text-decoration: underline;
}
.gb-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
