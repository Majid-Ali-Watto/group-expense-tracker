<template>
  <div class="mb-0">
    <div class="banner-card shadow-sm p-2 sm:p-3">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <!-- User Info -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <UserAvatar
              :image-url="currentUserPhotoUrl"
              :preview-url="currentUserPhotoUrl"
              :name="displayName"
              alt="Profile"
              preview-title="Profile Photo"
              :show-zoom-button="true"
              size="md"
              variant="welcome"
              icon-size="md"
              icon-tone="white"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs sm:text-sm text-gray-500 font-medium mb-0.5">
              {{ t('welcomeBanner.welcomeBack') }}
            </p>
            <p
              v-overflow-popup="{ title: t('welcomeBanner.userNameLabel') }"
              class="truncate"
            >
              <span class="text-base font-bold text-gray-800">{{
                displayName
              }}</span>
              <span class="ml-1 text-xs font-medium text-gray-500"
                >({{ currentUserMobile }})</span
              >
            </p>
          </div>
        </div>

        <!-- Group Info -->
        <div
          class="flex items-center gap-3 sm:ml-4"
          v-if="sharedTab && isTabRoute"
        >
          <div class="flex-shrink-0">
            <div
              class="group-circle"
              :class="groupStore.getActiveGroup ? '' : 'group-circle--empty'"
            >
              <UsersIcon class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs sm:text-sm text-gray-500 font-medium mb-0.5">
              {{ t('welcomeBanner.activeGroupLabel') }}
            </p>
            <GenericDropDown
              v-model="selectedGroupId"
              :placeholder="t('welcomeBanner.noGroupSelected')"
              size="default"
              select-class="min-w-0 font-bold"
              :class="joinedGroups.length === 0 ? 'opacity-50' : ''"
              :disabled="joinedGroups.length === 0"
              :wrap-form-item="false"
              :clearable="false"
              label-key="name"
              value-key="id"
              :options="joinedGroups"
              @update:modelValue="handleSelectGroup"
            />
          </div>
        </div>

        <!-- Main Menu — shown instead of the group dropdown whenever the tab
             bar itself is hidden (/admin, /settings, /report-bug, /help),
             since there's no tab strip to navigate back from otherwise. -->
        <div class="flex items-center sm:ml-4" v-if="!isTabRoute">
          <GenericButton type="default" size="default" @click="goToMainMenu">
            <MenuIcon class="w-4 h-4" />
            {{ t('welcomeBanner.mainMenu') }}
          </GenericButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { MenuIcon, UsersIcon } from '@/components/icons'
import { GenericButton, UserAvatar } from '@/components/generic-components'
import GenericDropDown from './GenericDropDown.vue'
import { useGroupStore, useAuthStore, useUserStore } from '@/stores'
import { useJoinedGroups } from '@/composables'
import { hasSharedFeatures } from '@/helpers'
import { showSuccess } from '@/utils'

defineProps({
  displayName: String,
  activeTab: String,
  isTabRoute: Boolean,
  goToMainMenu: { type: Function, default: () => {} }
})

const { t } = useI18n()
const groupStore = useGroupStore()
const authStore = useAuthStore()
const userStore = useUserStore()

const currentUserMobile = computed(
  () =>
    userStore.getUserByUid(authStore.getActiveUserUid)?.mobile ??
    authStore.getActiveUserUid
)
const currentUserPhotoUrl = computed(
  () => userStore.getUserByUid(authStore.getActiveUserUid)?.photoUrl || ''
)
const sharedTab = computed(() =>
  hasSharedFeatures(userStore.getActiveUserTabConfig)
)

const joinedGroups = useJoinedGroups(computed(() => groupStore.getGroups))

const selectedGroupId = ref(groupStore.getActiveGroup)

watch(
  () => groupStore.getActiveGroup,
  (newId) => {
    selectedGroupId.value = newId
  }
)

// Re-sync when groups finish loading from Firebase so El-Select
// can resolve the label from the now-available options list.
// Reset to null first to force el-select to re-match value → label.
watch(joinedGroups, async () => {
  const id = groupStore.getActiveGroup
  selectedGroupId.value = null
  await nextTick()
  selectedGroupId.value = id
})

function handleSelectGroup(id) {
  const group = groupStore.getGroupById(id)
  if (!group) return
  groupStore.setActiveGroup(id)
  showSuccess(t('groupsMessages.selectedGroupSuccess', { name: group.name }))
}
</script>

<style scoped>
.banner-card {
  background: var(--tab-gradient-start);
  /* linear-gradient(
    90deg,
    var(--success-50),
    var(--tab-gradient-start),
    var(--tab-gradient-end)
  ); */
  border-bottom: 1px solid var(--success-100);
  /* border-radius: 12px; */
}

.group-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 18px -12px rgba(34, 197, 94, 0.5);
}

.group-circle {
  background: linear-gradient(135deg, var(--success-400), var(--success-600));
}

.group-circle--empty {
  background: #d1d5db;
  box-shadow: none;
}
</style>
