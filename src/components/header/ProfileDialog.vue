<template>
  <el-dialog
    :model-value="visible"
    title="My Profile"
    :width="'min(92vw, 560px)'"
    class="profile-dialog"
    append-to-body
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <div class="profile-hero flex items-start gap-3 rounded-2xl p-4">
        <div class="profile-avatar">
          <UserIcon class="w-6 h-6 text-white" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
            Account
          </p>
          <h3 class="mt-1 text-xl font-bold text-slate-900">
            {{ profileName }}
          </h3>
          <p class="mt-1 text-sm text-slate-600 break-all">
            {{ profileEmail }}
          </p>
        </div>
      </div>

      <el-alert
        v-if="isBlocked"
        title="Your account is currently blocked. Users and groups remain visible for reference only."
        type="warning"
        :closable="false"
      />

      <el-descriptions :column="1" border>
        <el-descriptions-item label="Full Name">
          {{ profileName }}
        </el-descriptions-item>
        <el-descriptions-item label="Email Address">
          {{ profileEmail }}
        </el-descriptions-item>
        <el-descriptions-item label="Mobile Number">
          {{ profileMobile }}
        </el-descriptions-item>
        <el-descriptions-item label="Email Verification">
          <el-tag :type="emailVerified ? 'success' : 'info'" effect="light">
            {{ emailVerified ? 'Verified' : 'Pending' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Account Status">
          <el-tag :type="isBlocked ? 'danger' : 'success'" effect="light">
            {{ isBlocked ? 'Blocked' : 'Active' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button size="small" type="primary" @click="emit('update:visible', false)">
        Close
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { UserIcon } from '@/components/icons'

const props = defineProps({
  visible: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

const profileName = computed(() => props.user?.name || 'Account User')
const profileEmail = computed(() => props.user?.email || 'Not available')
const profileMobile = computed(() => props.user?.mobile || 'Not available')
const emailVerified = computed(() => props.user?.emailVerified !== false)
const isBlocked = computed(() => props.user?.blocked === true)
</script>

<style scoped>
.profile-hero {
  background:
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.14), transparent 45%),
    linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(240, 253, 244, 0.88));
  border: 1px solid rgba(16, 185, 129, 0.18);
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #15803d);
  box-shadow: 0 14px 24px -18px rgba(21, 128, 61, 0.8);
}

:global(:root.dark-theme) .profile-hero {
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.2), transparent 45%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(31, 41, 55, 0.94));
  border-color: rgba(74, 222, 128, 0.2);
}

:global(:root.dark-theme) .profile-hero h3 {
  color: #f9fafb;
}

:global(:root.dark-theme) .profile-hero p {
  color: #d1d5db;
}
</style>
