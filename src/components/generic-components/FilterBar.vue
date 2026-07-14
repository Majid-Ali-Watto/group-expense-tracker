<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-semibold text-gray-700">{{
        t('filterBar.title')
      }}</span>
      <div class="flex items-center gap-2">
        <button
          v-show="showFilters || !isMobileScreen"
          class="clear-filter-link"
          @click="$emit('clear')"
        >
          {{ t('common.clear') }}
        </button>
        <el-button
          circle
          :type="showFilters ? 'danger' : 'primary'"
          size="medium"
          class="sm:hidden"
          :icon="showFilters ? Close : Filter"
          @click="showFilters = !showFilters"
        />
      </div>
    </div>
    <Transition name="form-slide">
      <div v-show="showFilters || !isMobileScreen" class="flex flex-wrap gap-3">
        <div
          v-for="field in fields"
          :key="field.key"
          class="flex-1 min-w-[150px]"
        >
          <GenericDropDown
            :model-value="field.modelValue"
            :label="field.label"
            :placeholder="field.placeholder"
            :options="field.options"
            :filterable="field.filterable !== false"
            :label-position="isMobileScreen ? 'top' : undefined"
            size="medium"
            @update:model-value="field.onChange"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Filter, Close } from '@element-plus/icons-vue'
import { useMobileScreen } from '@/composables'
import GenericDropDown from './GenericDropDown.vue'

defineProps({
  fields: { type: Array, required: true }
})

defineEmits(['clear'])

const { t } = useI18n()
const showFilters = ref(false)
const { isMobileScreen } = useMobileScreen()
</script>
