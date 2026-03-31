<template>
  <div>
    <!-- Filters -->
    <div class="bra-filters">
      <div class="bra-filter-group">
        <el-select
          :model-value="activeStatusFilter"
          size="small"
          class="bra-status-filter-select"
          popper-class="bra-status-filter-popper"
          @change="$emit('update:activeStatusFilter', $event)"
        >
          <el-option
            v-for="s in statusFilters"
            :key="s.value"
            :label="s.selectLabel"
            :value="s.value"
          >
            <div class="bra-status-filter-option">
              <span class="bra-status-filter-option-label">{{ s.label }}</span>
              <span class="bra-filter-count">{{ s.count }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
      <div class="bra-filter-group">
        <GenericDropDown
          :model-value="activeSeverityFilter"
          :options="severityOptions"
          placeholder="Severity"
          :filterable="false"
          :clearable="false"
          :wrap-form-item="false"
          size="small"
          select-class="w-full"
          class="bra-severity-filter-select"
          @update:model-value="$emit('update:activeSeverityFilter', $event)"
        />
      </div>
    </div>

    <!-- Search -->
    <GenericInputField
      :model-value="searchQuery"
      placeholder="Search by bug number (khata-bug-…) or title…"
      :maxlength="120"
      :wrap-form-item="false"
      :clearable="true"
      class="bra-search-field"
      @update:model-value="$emit('update:searchQuery', $event)"
    >
      <template #prefix>
        <span class="text-gray-400">🔍</span>
      </template>
    </GenericInputField>
  </div>
</template>

<script setup>
import {
  GenericDropDown,
  GenericInputField
} from '@/components/generic-components'

defineProps({
  activeStatusFilter: { type: String, default: 'all' },
  activeSeverityFilter: { type: String, default: 'all' },
  searchQuery: { type: String, default: '' },
  statusFilters: { type: Array, default: () => [] },
  severityOptions: { type: Array, default: () => [] }
})

defineEmits([
  'update:activeStatusFilter',
  'update:activeSeverityFilter',
  'update:searchQuery'
])
</script>

<style scoped>
/* ── Filters ────────────────────────────────────────────────── */
.bra-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  align-items: center;
  justify-content: space-between;
}

.bra-filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bra-status-filter-select {
  min-width: 160px;
}
.bra-severity-filter-select {
  min-width: 160px;
}

.bra-status-filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.bra-status-filter-option-label {
  min-width: 0;
  font-size: 13px;
}

.bra-filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 10px;
  background: var(--el-fill-color);
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .bra-status-filter-select {
    width: 100%;
  }
  .bra-severity-filter-select {
    width: 100%;
  }
}

/* ── Search ─────────────────────────────────────────────────── */
.bra-search-field {
  margin-bottom: 14px;
}

/* Dark theme */
:root.dark-theme .bra-filter-count {
  background: #374151;
}
:root.dark-theme .bra-status-filter-option-label {
  color: #e5e7eb;
}
</style>
