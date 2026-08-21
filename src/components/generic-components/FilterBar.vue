<template>
  <div class="filter-bar">
    <div class="filter-bar__header">
      <span class="filter-bar__title">{{ t('filterBar.title') }}</span>
      <div class="flex items-center gap-2">
        <button
          v-show="showFilters"
          class="clear-filter-link"
          @click="$emit('clear')"
        >
          {{ t('common.clear') }}
        </button>
        <el-button
          circle
          :type="showFilters ? 'danger' : 'primary'"
          size="default"
          :icon="showFilters ? Close : Filter"
          @click="showFilters = !showFilters"
        />
      </div>
    </div>
    <Transition name="form-slide">
      <div v-show="showFilters" class="filter-bar__content">
        <div
          v-for="field in fields"
          :key="field.key"
          :class="
            field.type === 'checkbox'
              ? 'filter-bar__checkbox'
              : 'filter-bar__field flex-1 min-w-[150px]'
          "
        >
          <label
            v-if="field.type !== 'checkbox' && field.label"
            class="filter-bar__field-label"
          >
            {{ field.label }}
          </label>
          <GenericDropDown
            v-if="field.type !== 'checkbox'"
            :model-value="field.modelValue"
            :placeholder="field.placeholder"
            :options="field.options"
            :filterable="field.filterable !== false"
            :wrap-form-item="false"
            size="default"
            @update:model-value="field.onChange"
          />
          <el-checkbox
            v-else
            :model-value="field.modelValue"
            size="large"
            @update:model-value="field.onChange"
          >
            {{ field.label }}
          </el-checkbox>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Filter, Close } from '@element-plus/icons-vue'
import GenericDropDown from './GenericDropDown.vue'

defineProps({
  fields: { type: Array, required: true }
})

defineEmits(['clear'])

const { t } = useI18n()
const showFilters = ref(false)
</script>

<style scoped>
.filter-bar__checkbox {
  display: flex;
  min-height: 32px;
  align-items: center;
}

.filter-bar__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-bar__field-label {
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.25;
}

.filter-bar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.filter-bar__title {
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 700;
}

.filter-bar__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}
</style>
