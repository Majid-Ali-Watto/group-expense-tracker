<template>
  <footer class="public-footer">
    <div class="public-footer__inner">
      <div>
        <p class="public-footer__brand">{{ t('footer.brand') }}</p>
        <p class="public-footer__copy">{{ t('footer.tagline') }}</p>
      </div>

      <nav
        class="public-footer__links"
        :aria-label="t('footer.publicNavLabel')"
      >
        <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to">
          {{ link.label }}
        </RouterLink>
        <RouterLink :to="withLocale('/login')">{{ t('nav.login') }}</RouterLink>
        <RouterLink :to="withLocale('/register')">{{
          t('nav.register')
        }}</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PUBLIC_NAV_LINKS } from '@/constants'

const route = useRoute()
const { t, locale } = useI18n()
const navLinks = computed(() => PUBLIC_NAV_LINKS[locale.value])
const withLocale = (path) => (route.meta?.locale === 'ur' ? `/ur${path}` : path)
</script>

<style scoped>
.public-footer {
  padding: 0 20px 28px;
}

.public-footer__inner {
  width: 100%;
  padding: 22px 24px;
  border-radius: 22px;
  background: linear-gradient(135deg, #11331d 0%, #166534 100%);
  color: #f0fff4;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: center;
}

.public-footer__brand {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #f7fff9;
}

.public-footer__copy {
  margin: 8px 0 0;
  color: rgba(240, 255, 244, 0.8);
}

.public-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.public-footer__links a {
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
}

@media (max-width: 760px) {
  .public-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
