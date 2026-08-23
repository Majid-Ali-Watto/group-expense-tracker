<template>
  <div>
    <fieldset class="border border-gray-300 rounded-lg p-4">
      <legend class="font-medium">{{ t('users.createGroup') }}</legend>
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef">
        <GenericInputField
          v-model="groupForm.name"
          :label="t('groups.nameLabel')"
          prop="name"
          required
          label-position="top"
          :placeholder="t('groups.namePlaceholder')"
          :maxlength="50"
        />
        <GenericInputField
          v-model="groupForm.description"
          :label="t('common.description')"
          label-position="top"
          type="textarea"
          :rows="3"
          :placeholder="t('groups.descriptionPlaceholder')"
          :maxlength="100"
        />
        <GenericDropDown
          v-model="groupForm.members"
          :label="t('groups.membersLabel')"
          prop="members"
          label-position="top"
          :options="usersOptions"
          :placeholder="t('groups.membersPlaceholder')"
          size="default"
          multiple
          required
        />
        <p class="text-xs text-gray-500 -mt-2 mb-2">
          {{
            t('groups.selectedCount', {
              count: memberCount,
              max: MAX_GROUP_MEMBERS
            })
          }}
        </p>
        <GenericDropDown
          v-model="groupForm.category"
          :label="t('common.category')"
          label-position="top"
          :options="categoryOptions"
          :placeholder="t('groups.categoryOptionalPlaceholder')"
          size="default"
        />
        <div class="flex flex-row justify-end gap-2">
          <slot name="clear"></slot>
          <el-button size="default" @click="resetCreateForm">{{
            t('common.reset')
          }}</el-button>
          <el-button
            type="primary"
            size="default"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="createGroup"
            >{{ t('groups.create') }}</el-button
          >
        </div>
      </el-form>
    </fieldset>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGroupRules, GROUP_CATEGORIES } from '@/assets'
import { GroupsCreate } from '@/scripts/groups'
import { GenericDropDown } from '@/components/generic-components'
import { GenericInputField } from '@/components/generic-components'

const { t, locale } = useI18n()
const groupRules = computed(() => getGroupRules(locale.value))

const emit = defineEmits(['groupCreated'])
const props = defineProps({
  preselectedMember: { type: String, default: null }
})

const categoryOptions = GROUP_CATEGORIES
const {
  MAX_GROUP_MEMBERS,
  memberCount,
  groupForm,
  groupFormRef,
  usersOptions,
  createGroup,
  resetCreateForm,
  isSubmitting
} = GroupsCreate(emit, props)
</script>
