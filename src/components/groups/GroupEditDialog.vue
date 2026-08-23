<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('groups.editGroupTitle')"
    width="90%"
    append-to-body
    style="max-width: 500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      :model="localForm"
      :rules="rules"
      ref="formRef"
      label-position="top"
    >
      <GenericInputField
        v-model="localForm.name"
        :label="t('groups.groupNameLabel')"
        prop="name"
        required
        :placeholder="t('groups.namePlaceholder')"
        :maxlength="50"
      />
      <GenericInputField
        v-model="localForm.description"
        :label="t('common.description')"
        type="textarea"
        :rows="3"
        :placeholder="t('groups.descriptionPlaceholder')"
        :maxlength="100"
      />
      <GenericDropDown
        v-model="localForm.members"
        :label="t('groups.membersLabelPlain')"
        prop="members"
        required
        :options="memberOptions"
        :placeholder="t('groups.membersPlaceholder')"
        size="default"
        multiple
      />
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button
          size="default"
          style="min-width: 80px"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          size="default"
          style="min-width: 80px"
          @click="handleSave"
        >
          {{ t('groups.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGroupRules } from '@/assets'
import {
  GenericInputField,
  GenericDropDown
} from '@/components/generic-components'

const { t, locale } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  form: { type: Object, required: true },
  memberOptions: { type: Array, required: true }
})

const emit = defineEmits(['update:modelValue', 'save'])

const rules = computed(() => getGroupRules(locale.value))
const formRef = ref(null)
const localForm = reactive({ name: '', description: '', members: [] })

watch(
  () => props.form,
  (val) => {
    localForm.name = val.name ?? ''
    localForm.description = val.description ?? ''
    localForm.members = val.members ? [...val.members] : []
  },
  { immediate: true }
)

function handleSave() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    emit('save', { ...localForm })
  })
}
</script>
