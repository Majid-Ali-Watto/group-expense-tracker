<!-- Compact "⋮" trigger for an el-dropdown menu — reused wherever a table
     row needs a small overflow menu instead of several inline buttons (see
     Settlement.vue / Loans.vue's "who pays whom" row actions). Mirrors the
     same el-dropdown + vertical-ellipsis pattern already used in Table.vue's
     row actions column. -->
<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="$emit('command', $event)"
  >
    <button
      class="actions-menu-btn"
      :aria-label="label"
      :title="label"
      @click.stop
    >
      &#8942;
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <slot />
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' }
})
defineEmits(['command'])
</script>

<style scoped>
.actions-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: var(--text-secondary);
  padding: 4px 10px;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.actions-menu-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}
</style>
