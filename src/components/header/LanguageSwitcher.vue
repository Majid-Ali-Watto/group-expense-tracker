<template>
  <button
    v-if="isVisible && useToggle"
    type="button"
    class="language-switcher"
    @click="toggleLocale"
  >
    {{ toggleLabel }}
  </button>
  <RouterLink v-else-if="isVisible" class="language-switcher" :to="alternatePath">
    {{ alternateLabel }}
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAlternateLocalePath } from '@/utils/seo'
import { setStoredLocale } from '@/i18n'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  routePath: { type: String, default: '' },
  // Guest/public pages have a real /ur URL to link to; logged-in app pages
  // don't (no SEO benefit), so they get an in-place toggle instead — see
  // src/i18n/index.js for the saved-preference rationale.
  useToggle: { type: Boolean, default: false }
})

const { t, locale } = useI18n()

const alternate = computed(() => getAlternateLocalePath(props.routePath || '/'))
const alternatePath = computed(() => alternate.value.path)
const alternateLabel = computed(() =>
  t(`languageSwitcher.${alternate.value.locale}`)
)

const nextLocale = computed(() => (locale.value === 'ur' ? 'en' : 'ur'))
const toggleLabel = computed(() => t(`languageSwitcher.${nextLocale.value}`))

function toggleLocale() {
  const next = nextLocale.value
  locale.value = next
  setStoredLocale(next)
  document.documentElement.lang = next
  document.documentElement.dir = next === 'ur' ? 'rtl' : 'ltr'
}
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: transparent;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.language-switcher:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
