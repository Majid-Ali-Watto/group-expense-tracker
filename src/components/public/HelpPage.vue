<template>
  <main
    class="public-page inner-page"
    :style="{ paddingTop: isLoggedIn ? undefined : '108px' }"
  >
    <el-button
      v-if="isLoggedIn"
      size="default"
      class="help-back-btn"
      @click="router.back()"
      >{{ t('common.back') }}</el-button
    >

    <PageTitleSection :eyebrow="t('help.eyebrow')" :title="t('help.title')">
      <template #icon><el-icon :size="14"><QuestionFilled /></el-icon></template>
      <p>{{ t('help.intro') }}</p>
    </PageTitleSection>

    <section class="help-shell">
      <HelpContent :locale="route.meta?.locale || 'en'" />
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import HelpContent from '@/components/generic-components/HelpContent.vue'
import { useAuthStore } from '@/stores'
import { hasSession } from '@/router'
import { QuestionFilled } from '@element-plus/icons-vue'
import PageTitleSection from './PageTitleSection.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// /help is reachable both as the public marketing page (guests — the fixed
// Header has nothing below it, so this page needs its own top padding to
// clear it) and as the in-app route logged-in users reach from the header's
// Help button (App.vue already renders a WelcomeBanner block above the
// RouterView there, which provides that clearance itself — the page's own
// 108px on top of that is what created the oversized gap). Same three-part
// check as Settings.vue's isLoggedIn, the other route reachable both ways.
const isLoggedIn = computed(
  () =>
    !!(authStore.getActiveUserUid && authStore.getSessionToken && hasSession())
)
</script>

<style scoped>
.help-back-btn {
  display: inline-flex;
  margin-bottom: 12px;
}

.public-page {
  position: relative;
  padding: 32px 20px 32px;
  width: 100%;
  color: #173025;
  overflow: hidden;
  isolation: isolate;
}

.public-page::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: -120px;
  right: -80px;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.22), transparent 70%);
}

.help-shell {
  border-radius: 24px;
  border: 1px solid rgba(22, 101, 52, 0.12);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(22, 101, 52, 0.08);
  margin-top: 24px;
  padding: 16px;
}

:root.dark-theme .public-page {
  color: #eefbf2;
}

:root.dark-theme .help-shell {
  background: #11281a;
  border-color: rgba(110, 231, 183, 0.16);
  box-shadow: none;
}
</style>
