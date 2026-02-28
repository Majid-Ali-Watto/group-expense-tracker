<template>
  <div class="add-new-transaction">
    <span class="label" @click.stop>{{ text }}</span>
    <el-button
      class="add-pill"
      type="primary"
      circle
      size="default"
      @click.stop="$emit('click')"
    >
      <span class="plus">+</span>
    </el-button>
  </div>
</template>
<script setup lang="ts">
defineProps({
  text: {
    type: String,
    required: true
  }
})
</script>
<style scoped>
.add-new-transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
  border-radius: 12px;
  background: var(--tab-gradient-start);
  /* background:
   linear-gradient(
    90deg,
    var(--success-50),
    var(--tab-gradient-start),
    var(--tab-gradient-end)
  ); */
  border: 1px solid var(--success-100);
  box-shadow: 0 10px 24px -12px rgba(34, 197, 94, 0.3);
}

.label {
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

.add-pill {
  background-color: #22c55e !important;
  border-color: #22c55e !important;
  color: #ffffff !important;
  box-shadow: 0 12px 30px -14px rgba(34, 197, 94, 0.7);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.add-pill:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 32px -12px rgba(34, 197, 94, 0.9);
}

.add-pill:active {
  transform: scale(0.96);
}

.plus {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}
</style>
