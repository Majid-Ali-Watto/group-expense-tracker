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
              Welcome back
            </p>
            <p v-overflow-popup="{ title: 'User Name' }" class="truncate">
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
        <div class="flex items-center gap-3 sm:ml-4" v-if="sharedTab && !isAdminActive">
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
              Active Group (joined groups)
            </p>
            <GenericDropDown
              v-model="selectedGroupId"
              placeholder="No Group Selected"
              size="small"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { UsersIcon } from '@/components/icons'
import { UserAvatar } from '@/components/generic-components'
import GenericDropDown from './GenericDropDown.vue'
import { useGroupStore, useAuthStore, useUserStore } from '@/stores'
import { useJoinedGroups } from '@/composables'
import { hasSharedFeatures } from '@/helpers'
import { showSuccess } from '@/utils'

defineProps({
  displayName: String,
  activeTab: String,
  isAdminActive: Boolean
})

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
  showSuccess(`Selected group: ${group.name}`)
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
