<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="settings-page"
    :class="isLoggedIn ? 'min-h-screen p-4 sm:p-6' : 'public-page'"
  >
    <div class="space-y-4">
      <header class="settings-hero flex items-center gap-3 rounded-2xl p-4">
        <button
          type="button"
          class="settings-hero__back"
          :aria-label="t('settings.back')"
          @click="router.back()"
        >
          <el-icon :size="18"><Back /></el-icon>
        </button>
        <div class="min-w-0">
          <h1 class="text-xl font-bold" style="color: var(--text-primary)">
            {{ t('settings.title') }}
          </h1>
          <p class="settings-hero__subtitle">
            {{ t('settings.subtitle') }}
          </p>
        </div>
      </header>

      <section class="settings-card">
        <div class="settings-card__header">
          <span class="settings-card__icon">
            <el-icon :size="18"><Brush /></el-icon>
          </span>
          <div class="min-w-0">
            <h2 class="settings-card__title">
              {{ t('settings.appearance') }}
            </h2>
            <p class="settings-card__hint">
              {{ t('settings.appearanceHint') }}
            </p>
          </div>
        </div>

        <div class="settings-card__body space-y-6">
          <div class="settings-row">
            <div class="flex items-center gap-2 min-w-0">
              <MoonIcon v-if="!isDarkTheme" class="w-4 h-4 shrink-0" />
              <SunIcon v-else class="w-4 h-4 shrink-0" />
              <span class="settings-row__label">{{ t('settings.theme') }}</span>
            </div>
            <el-switch
              :model-value="isDarkTheme"
              :active-text="t('headerActions.darkMode')"
              :inactive-text="t('headerActions.lightMode')"
              inline-prompt
              @update:model-value="toggleTheme"
            />
          </div>

          <div>
            <p class="settings-row__label mb-2">{{ t('settings.font') }}</p>
            <div class="font-chip-grid">
              <button
                v-for="option in FONT_OPTIONS"
                :key="option.id"
                type="button"
                class="font-chip"
                :class="{ 'is-active': fontFamily === option.id }"
                :style="{ fontFamily: option.stack }"
                @click="setFontFamily(option.id)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div>
            <p class="settings-row__label mb-2">
              {{ t('settings.urduFont') }}
            </p>
            <div class="font-chip-grid">
              <button
                v-for="option in URDU_FONT_OPTIONS"
                :key="option.id"
                type="button"
                class="font-chip"
                :class="{ 'is-active': urduFontFamily === option.id }"
                :style="{
                  fontFamily: option.stack,
                  lineHeight: option.lineHeight
                }"
                @click="setUrduFontFamily(option.id)"
              >
                {{ option.label }}
              </button>
            </div>
            <p class="settings-card__hint mt-2">
              {{ t('settings.urduFontNote') }}
            </p>
          </div>
        </div>
      </section>

      <section v-if="isLoggedIn" class="settings-card">
        <div class="settings-card__header">
          <span class="settings-card__icon">
            <el-icon :size="18"><Money /></el-icon>
          </span>
          <div class="min-w-0">
            <h2 class="settings-card__title">
              {{ t('settings.currency') }}
            </h2>
            <p class="settings-card__hint">
              {{ t('settings.currencyHint') }}
            </p>
          </div>
        </div>

        <div class="settings-card__body">
          <GenericDropDown
            :model-value="currency"
            :options="currencyDropdownOptions"
            :wrap-form-item="false"
            :clearable="false"
            :placeholder="t('common.selectOption')"
            select-class="w-full max-w-xs"
            @update:model-value="setCurrency"
          />
        </div>
      </section>

      <section v-if="canManageTabs" class="settings-card">
        <div class="settings-card__header">
          <span class="settings-card__icon">
            <el-icon :size="18"><Grid /></el-icon>
          </span>
          <div class="min-w-0">
            <h2 class="settings-card__title">
              {{ t('settings.manageTabs') }}
            </h2>
            <p class="settings-card__hint">
              {{ t('auth.tabConfig.intro') }}
            </p>
          </div>
        </div>

        <div class="settings-card__body">
          <UserTabConfigForm v-model:selection="tabSelection" />
          <div class="flex justify-end mt-4">
            <el-button
              type="primary"
              :loading="isSavingTabs"
              @click="saveManageTabs"
            >
              {{ t('common.save') }}
            </el-button>
          </div>
        </div>
      </section>

      <section v-else-if="!isLoggedIn" class="settings-card settings-card--cta">
        <div
          class="settings-card__body flex items-center justify-between gap-3 flex-wrap"
        >
          <p class="settings-card__hint m-0">
            {{ t('settings.loginForMore') }}
          </p>
          <el-button type="primary" @click="router.push('/login')">
            {{ t('nav.login') }}
          </el-button>
        </div>
      </section>

      <section class="settings-card">
        <div class="settings-card__header">
          <span class="settings-card__icon settings-card__icon--danger">
            <el-icon :size="18"><Delete /></el-icon>
          </span>
          <div class="min-w-0">
            <h2 class="settings-card__title">
              {{ t('settings.storage') }}
            </h2>
            <p class="settings-card__hint">
              {{ t('settings.storageHint') }}
            </p>
          </div>
        </div>

        <div class="settings-card__body space-y-4">
          <div class="storage-action">
            <div class="min-w-0">
              <p class="settings-row__label">{{ t('settings.clearCache') }}</p>
              <p class="settings-card__hint">
                {{ t('settings.clearCacheHint') }}
              </p>
            </div>
            <el-button :loading="isClearingCache" @click="clearSiteCache">
              {{ t('settings.clearCache') }}
            </el-button>
          </div>

          <div class="storage-action">
            <div class="min-w-0">
              <p class="settings-row__label">
                {{ t('settings.clearLocalStorage') }}
              </p>
              <p class="settings-card__hint">
                {{ t('settings.clearLocalStorageHint') }}
              </p>
            </div>
            <el-button
              :loading="isClearingStorage"
              @click="clearLocalStorageData"
            >
              {{ t('settings.clearLocalStorage') }}
            </el-button>
          </div>

          <div class="storage-action storage-action--danger">
            <div class="min-w-0">
              <p class="settings-row__label">{{ t('settings.resetApp') }}</p>
              <p class="settings-card__hint">
                {{ t('settings.resetAppHint') }}
              </p>
            </div>
            <el-button type="danger" :loading="isResetting" @click="resetApp">
              {{ t('settings.resetApp') }}
            </el-button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Back, Brush, Grid, Delete, Money } from '@element-plus/icons-vue'
import { MoonIcon, SunIcon } from '@/components/icons'
import {
  UserTabConfigForm,
  GenericDropDown
} from '@/components/generic-components'
import { Settings } from '@/scripts/settings'

const { t } = useI18n()

const {
  router,
  isLoggedIn,
  isDarkTheme,
  toggleTheme,
  fontFamily,
  FONT_OPTIONS,
  setFontFamily,
  urduFontFamily,
  URDU_FONT_OPTIONS,
  setUrduFontFamily,
  currency,
  currencyOptions,
  setCurrency,
  canManageTabs,
  tabSelection,
  isSavingTabs,
  saveManageTabs,
  isClearingCache,
  isClearingStorage,
  isResetting,
  clearSiteCache,
  clearLocalStorageData,
  resetApp
} = Settings()

// GenericDropDown expects {value, label} pairs — searchable by both code
// and name (Element Plus's el-select filters against the rendered label).
const currencyDropdownOptions = computed(() =>
  currencyOptions.value.map((option) => ({
    value: option.code,
    label: `${option.symbol} ${option.code} — ${option.label}`
  }))
)
</script>

<style scoped>
/* Guest (not-logged-in) view — matches the decorative background every
   other public marketing page (Login, Landing, Features, FAQ, ...) shares,
   so Settings doesn't look flat/plain next to them. The logged-in view
   stays undecorated, matching the rest of the authenticated app (Groups,
   Shared Expenses, ...), which has no such decoration either. */
.settings-page.public-page {
  position: relative;
  min-height: 100vh;
  padding: 108px 20px 32px;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
}

.settings-page.public-page::before,
.settings-page.public-page::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.settings-page.public-page::before {
  top: -120px;
  right: -80px;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.22), transparent 70%);
}

.settings-page.public-page::after {
  top: 260px;
  left: -120px;
  width: 320px;
  height: 320px;
  background: radial-gradient(
    circle,
    rgba(13, 148, 136, 0.16),
    transparent 70%
  );
}

.settings-hero {
  background:
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.14),
      transparent 45%
    ),
    linear-gradient(
      135deg,
      rgba(236, 253, 245, 0.95),
      rgba(240, 253, 244, 0.88)
    );
  border: 1px solid rgba(16, 185, 129, 0.18);
}

:global(:root.dark-theme .settings-hero) {
  background:
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.16),
      transparent 45%
    ),
    linear-gradient(135deg, rgba(6, 78, 59, 0.35), rgba(6, 95, 70, 0.22));
  border-color: rgba(52, 211, 153, 0.22);
}

.settings-hero__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(16, 185, 129, 0.3);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.settings-hero__back:hover {
  background-color: var(--hover-bg);
}

.settings-hero__subtitle {
  margin-top: 2px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* The hero's dark-theme background (above) is a saturated dark-green
   gradient, against which --text-secondary (#9ca3af) falls below WCAG AA
   contrast. Lighten just the subtitle here rather than everywhere
   --text-secondary is used. */
:global(:root.dark-theme .settings-hero__subtitle) {
  color: #cbd5e1;
}

.settings-card {
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  overflow: hidden;
}

.settings-card--cta {
  border-style: dashed;
}

.settings-card__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.settings-card--cta .settings-card__header {
  display: none;
}

.settings-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.12);
  color: var(--success-700, #16a34a);
}

.settings-card__title {
  font-weight: 600;
  color: var(--text-primary);
}

.settings-card__hint {
  margin-top: 2px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.settings-card__body {
  padding: 16px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-row__label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.font-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.font-chip {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease;
}

.font-chip:hover {
  border-color: rgba(34, 197, 94, 0.5);
}

.font-chip.is-active {
  border-color: var(--success-600, #22c55e);
  background: rgba(34, 197, 94, 0.12);
  color: var(--success-700, #16a34a);
  font-weight: 600;
}

.settings-card__icon--danger {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.storage-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.storage-action + .storage-action {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.storage-action--danger .settings-row__label {
  color: #ef4444;
}
</style>
