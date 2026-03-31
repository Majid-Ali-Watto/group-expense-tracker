<template>
  <el-alert
    :title="''"
    :type="mode === 'register' ? 'success' : 'info'"
    :closable="false"
    class="mb-4"
  >
    <template #default>
      <span class="text-sm">
        <template v-if="mode === 'register'">
          Create a new account with your name, mobile, email, and login code.
          <strong
            >You must verify your email within 48 hours to activate your
            account.</strong
          >
        </template>
        <template v-else> Login with your email and password. </template>
      </span>
    </template>
  </el-alert>
</template>

<script setup>
defineProps({
  mode: { type: String, required: true }
})
</script>
