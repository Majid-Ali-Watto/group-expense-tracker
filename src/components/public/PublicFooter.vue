<template>
  <footer class="public-footer">
    <div class="public-footer__inner">
      <div class="public-footer__top">
        <div class="public-footer__brand-block">
          <span class="public-footer__badge">
            <el-icon :size="18"><Wallet /></el-icon>
          </span>
          <div>
            <p class="public-footer__brand">{{ t('footer.brand') }}</p>
            <p class="public-footer__copy">{{ t('footer.tagline') }}</p>
          </div>
        </div>

        <nav
          class="public-footer__links"
          :aria-label="t('footer.publicNavLabel')"
        >
          <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to">
            {{ link.label }}
          </RouterLink>
          <RouterLink :to="withLocale('/login')">{{
            t('nav.login')
          }}</RouterLink>
          <RouterLink :to="withLocale('/register')">{{
            t('nav.register')
          }}</RouterLink>
        </nav>
      </div>

      <div class="public-footer__bottom">
        <p class="public-footer__rights">
          © {{ year }} {{ t('footer.brand') }} — {{ t('footer.rights') }}
        </p>
        <nav class="public-footer__legal">
          <RouterLink :to="withLocale('/terms')">{{
            t('footer.terms')
          }}</RouterLink>
          <span class="public-footer__legal-sep" aria-hidden="true">·</span>
          <RouterLink :to="withLocale('/privacy')">{{
            t('footer.privacy')
          }}</RouterLink>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Wallet } from '@element-plus/icons-vue'
import { PUBLIC_NAV_LINKS } from '@/constants'

const route = useRoute()
const { t, locale } = useI18n()
const navLinks = computed(() => PUBLIC_NAV_LINKS[locale.value])
const withLocale = (path) => (route.meta?.locale === 'ur' ? `/ur${path}` : path)
// Prerendered by vite-ssg at build time — fine to read once here rather than
// keep reactive; the build re-runs often enough to stay current.
const year = new Date().getFullYear()
</script>

<style scoped>
.public-footer {
  padding: 0 20px 28px;
}

.public-footer__inner {
  position: relative;
  width: 100%;
  padding: 26px 28px 20px;
  border-radius: 22px;
  overflow: hidden;
  /* Same 3 stops as the header gradient (Header.vue), just angled — keeps
     the header and footer reading as one palette instead of two. */
  background: linear-gradient(120deg, #0f9d58 0%, #16a34a 50%, #0d9488 100%);
  color: #ffffff;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 10px 30px -12px rgba(6, 78, 59, 0.55);
}

.public-footer__inner::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -40px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  filter: blur(50px);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.14),
    transparent 70%
  );
  pointer-events: none;
}

.public-footer__top {
  position: relative;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: flex-start;
}

.public-footer__brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.public-footer__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
}

.public-footer__brand {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
}

.public-footer__copy {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.9);
}

.public-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.public-footer__links a {
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  opacity: 0.88;
  transition:
    opacity 0.15s ease,
    text-decoration-color 0.15s ease;
}

.public-footer__links a:hover {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.public-footer__bottom {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.public-footer__rights {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
}

.public-footer__legal {
  display: flex;
  align-items: center;
  gap: 8px;
}

.public-footer__legal a {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  transition: color 0.15s ease;
}

.public-footer__legal a:hover {
  color: #ffffff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.public-footer__legal-sep {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.82rem;
}

@media (max-width: 760px) {
  .public-footer__top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
