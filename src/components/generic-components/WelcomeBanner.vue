<template>
  <div class="mb-0">
    <div class="banner-card shadow-sm p-2 sm:p-3">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <!-- User Info -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div class="avatar-circle">
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
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
        <div class="flex items-center gap-3 sm:ml-4">
          <div class="flex-shrink-0">
            <div
              class="group-circle"
              :class="groupStore.getActiveGroup ? '' : 'group-circle--empty'"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
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
import GenericDropDown from './GenericDropDown.vue'
import { useGroupStore, useAuthStore, useUserStore } from '@/stores'
import { showSuccess } from '@/utils'
import { isMemberOfGroup } from '@/helpers'

defineProps({
  displayName: String
})

const groupStore = useGroupStore()
const authStore = useAuthStore()
const userStore = useUserStore()

const currentUserMobile = computed(
  () =>
    userStore.getUserByUid(authStore.getActiveUser)?.mobile ??
    authStore.getActiveUser
)

const joinedGroups = computed(() =>
  groupStore.getGroups.filter((g) => isMemberOfGroup(g))
)

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

.avatar-circle,
.group-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 18px -12px rgba(34, 197, 94, 0.5);
}

.avatar-circle {
  background: linear-gradient(135deg, var(--success-400), var(--success-600));
}

.group-circle {
  background: linear-gradient(135deg, var(--success-400), var(--success-600));
}

.group-circle--empty {
  background: #d1d5db;
  box-shadow: none;
}
</style>
