<template>
  <!-- The responsive show/hide class lives on this plain wrapper, not on
       <el-dropdown> itself: el-dropdown's own theme-chalk CSS sets an
       unconditional `display: inline-flex` (same 0-1-0-0 specificity as a
       single Tailwind class) in a chunk that loads lazily with Header.vue
       — after the page's main stylesheet. Loaded-later wins a specificity
       tie, so that rule silently overrode min-[768px]:hidden and left the
       hamburger visible on desktop. A bare div has no competing framework
       CSS, so it can't lose that fight — same pattern DesktopHeaderActions
       already uses for its own div. -->
  <div class="min-[768px]:hidden mobile-menu-dropdown">
    <el-dropdown
      ref="dropdownRef"
      trigger="click"
      popper-class="mobile-menu-popper"
    >
      <button class="hamburger-btn">
        <MenuIcon class="w-6 h-6" />
      </button>
      <template #dropdown>
        <el-dropdown-menu class="mobile-dropdown-menu">
          <template v-if="loggedIn && tabs.length">
            <div class="mobile-menu-section-label">
              {{ t('headerActions.navigation') }}
            </div>
            <el-dropdown-item
              v-for="tab in tabs"
              :key="tab"
              @click="emit('tab-change', tab)"
            >
              <div
                class="flex items-center gap-3"
                :class="{ 'is-active-tab': tab === activeTab }"
              >
                <el-icon class="menu-icon" :size="20"
                  ><component :is="TAB_ICONS[tab] || ChevronRightIcon"
                /></el-icon>
                <span>{{ tabLabel(tab) }}</span>
              </div>
            </el-dropdown-item>
            <div class="mobile-menu-divider" />
          </template>

          <template v-if="isPublicPage">
            <div class="mobile-menu-section-label">
              {{ t('headerActions.explore') }}
            </div>
            <el-dropdown-item
              v-for="link in publicNavLinks"
              :key="link.to"
              @click="emit('navigate', link.to)"
            >
              <div
                class="flex items-center gap-3"
                :class="{ 'is-active-tab': routePath === link.to }"
              >
                <el-icon class="menu-icon" :size="20"
                  ><component :is="navIconFor(link.to)"
                /></el-icon>
                <span>{{ link.label }}</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item @click="emit('navigate', '/login')">
              <div class="flex items-center gap-3">
                <el-icon class="menu-icon" :size="20"><SwitchButton /></el-icon>
                <span>{{ t('nav.login') }}</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item @click="emit('navigate', '/register')">
              <div class="flex items-center gap-3">
                <el-icon class="menu-icon" :size="20"><UserFilled /></el-icon>
                <span>{{ t('nav.createAccount') }}</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item
              v-if="hasLocaleVariant"
              @click="emit('navigate', alternateLocalePath)"
            >
              <div class="flex items-center gap-3">
                <span class="menu-icon lang-badge">{{
                  alternateLocaleCode
                }}</span>
                <span>{{ alternateLocaleLabel }}</span>
              </div>
            </el-dropdown-item>
            <div class="mobile-menu-divider" />
          </template>

          <template v-if="isStuckState">
            <div class="mobile-menu-section-label">
              {{ t('headerActions.account') }}
            </div>
            <el-dropdown-item @click="emit('navigate', '/login')">
              <div class="flex items-center gap-3">
                <el-icon class="menu-icon" :size="20"><SwitchButton /></el-icon>
                <span>{{ t('headerActions.signIn') }}</span>
              </div>
            </el-dropdown-item>
            <div class="mobile-menu-divider" />
          </template>

          <div class="mobile-menu-section-label">
            {{ t('common.actions') }}
          </div>
          <el-dropdown-item v-if="!isPublicPage" @click="emit('open-help')">
            <div class="flex items-center gap-3">
              <QuestionCircleIcon class="w-5 h-5 menu-icon" />
              <span>{{ t('headerActions.help') }}</span>
            </div>
          </el-dropdown-item>

          <el-dropdown-item
            v-if="canShowBugReport"
            @click="emit('open-bug-report')"
          >
            <div class="flex items-center gap-3">
              <AlertTriangleIcon class="w-5 h-5 menu-icon" />
              <span>{{ t('headerActions.reportBug') }}</span>
            </div>
          </el-dropdown-item>

          <el-dropdown-item @click="emit('share')">
            <div class="flex items-center gap-3">
              <ShareIcon class="w-5 h-5 menu-icon" />
              <span>{{ t('headerActions.shareThisPage') }}</span>
            </div>
          </el-dropdown-item>
          <div class="mobile-menu-divider" />

          <template v-if="loggedIn || canShowAdmin">
            <div class="mobile-menu-section-label">
              {{ t('headerActions.workspace') }}
            </div>
            <el-dropdown-item v-if="loggedIn" @click="emit('open-profile')">
              <div class="flex items-center gap-3">
                <UserAvatar
                  :image-url="activeUserPhotoUrl"
                  :alt="t('common.profileAlt')"
                  size="xs"
                  variant="profile"
                  icon-size="md"
                  icon-tone="current"
                />
                <span>{{ t('common.profileAlt') }}</span>
              </div>
            </el-dropdown-item>

            <el-dropdown-item
              v-if="loggedIn"
              @click="emit('show-net-position')"
            >
              <div class="flex items-center gap-3">
                <el-icon class="menu-icon" :size="20"><DataAnalysis /></el-icon>
                <span>{{ t('headerActions.expensesSummary') }}</span>
              </div>
            </el-dropdown-item>

            <el-dropdown-item
              v-if="canShowAdmin"
              @click="emit('navigate', '/admin')"
            >
              <div class="flex items-center gap-3">
                <el-icon class="menu-icon" :size="20"><Tools /></el-icon>
                <span>{{ t('headerActions.adminConfig') }}</span>
              </div>
            </el-dropdown-item>

            <div class="mobile-menu-divider" />
          </template>

          <div class="mobile-menu-section-label">
            {{ t('headerActions.preferences') }}
          </div>
          <el-dropdown-item @click="emit('navigate', '/settings')">
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><Setting /></el-icon>
              <span>{{ t('headerActions.settings') }}</span>
            </div>
          </el-dropdown-item>

          <el-dropdown-item v-if="loggedIn" @click="toggleLocale">
            <div class="flex items-center gap-3">
              <span class="menu-icon lang-badge">{{ toggleLocaleCode }}</span>
              <span>{{ toggleLocaleLabel }}</span>
            </div>
          </el-dropdown-item>

          <el-dropdown-item v-if="loggedIn" @click="emit('logout')">
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><SwitchButton /></el-icon>
              <span>{{ t('headerActions.logout') }}</span>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMobileScreen } from '@/composables'
import {
  DataAnalysis,
  Setting,
  SwitchButton,
  Tools,
  Money,
  CreditCard,
  Wallet,
  Coin,
  UserFilled,
  Star,
  ChatDotRound
} from '@element-plus/icons-vue'
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  MenuIcon,
  QuestionCircleIcon,
  ShareIcon,
  UsersIcon
} from '@/components/icons'
// Direct path, not the '@/components/generic-components' barrel — see the
// equivalent comment in WelcomeBanner.vue.
import UserAvatar from '@/components/generic-components/UserAvatar.vue'
import { Tabs } from '@/assets'
import { getAlternateLocalePath } from '@/utils/seo'
import { setStoredLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'

// Tab name → icon component
const TAB_ICONS = {
  'Shared Expenses': Money,
  'Shared Loans': CreditCard,
  'Personal Expenses': Wallet,
  'Personal Loans': Coin,
  Users: UsersIcon,
  Groups: UserFilled
}

const TAB_LABEL_KEYS = {
  [Tabs.GROUPS]: 'tabs.groups',
  [Tabs.USERS]: 'tabs.users',
  [Tabs.SHARED_EXPENSES]: 'tabs.sharedExpenses',
  [Tabs.SHARED_LOANS]: 'tabs.sharedLoans',
  [Tabs.PERSONAL_EXPENSES]: 'tabs.personalExpenses',
  [Tabs.PERSONAL_LOANS]: 'tabs.personalLoans'
}

// Public nav path → icon component (keyed by the unprefixed English path;
// Urdu links are stripped of their /ur prefix before lookup)
const NAV_ICONS = {
  '/features': Star,
  '/group-expense-tracker': UserFilled,
  '/personal-budget-tracker': Wallet,
  '/help': QuestionCircleIcon,
  '/faq': ChatDotRound
}

function navIconFor(path) {
  const enPath = path.startsWith('/ur/') ? path.slice(3) : path
  return NAV_ICONS[enPath] || ChevronRightIcon
}

const props = defineProps({
  loggedIn: { type: Boolean, default: false },
  tabs: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' },
  isPublicPage: { type: Boolean, default: false },
  hasLocaleVariant: { type: Boolean, default: false },
  publicNavLinks: { type: Array, default: () => [] },
  routePath: { type: String, default: '' },
  isStuckState: { type: Boolean, default: false },
  canShowBugReport: { type: Boolean, default: false },
  canShowAdmin: { type: Boolean, default: false },
  activeUserPhotoUrl: { type: String, default: '' }
})

const { t, locale } = useI18n()
const alternateLocale = computed(() =>
  getAlternateLocalePath(props.routePath || '/')
)
const alternateLocalePath = computed(() => alternateLocale.value.path)
const alternateLocaleCode = computed(() =>
  alternateLocale.value.locale.toUpperCase()
)
const alternateLocaleLabel = computed(() =>
  t(`languageSwitcher.${alternateLocale.value.locale}`)
)

// Logged-in app pages have no /ur URL to link to (no SEO benefit), so they
// get an in-place toggle of the saved language preference instead — mirrors
// LanguageSwitcher.vue's useToggle mode.
const toggleLocaleCode = computed(() =>
  (locale.value === 'ur' ? 'en' : 'ur').toUpperCase()
)
const toggleLocaleLabel = computed(() =>
  t(`languageSwitcher.${locale.value === 'ur' ? 'en' : 'ur'}`)
)

function tabLabel(tab) {
  return TAB_LABEL_KEYS[tab] ? t(TAB_LABEL_KEYS[tab]) : tab
}

function toggleLocale() {
  const next = locale.value === 'ur' ? 'en' : 'ur'
  locale.value = next
  setStoredLocale(next)
  document.documentElement.lang = next
  document.documentElement.dir = next === 'ur' ? 'rtl' : 'ltr'
}

const emit = defineEmits([
  'tab-change',
  'navigate',
  'open-help',
  'open-bug-report',
  'share',
  'open-profile',
  'show-net-position',
  'logout'
])

// This trigger is hidden by CSS (min-[768px]:hidden, same 768 breakpoint
// passed below) once the viewport reaches desktop width, but Element
// Plus's dropdown panel is teleported to <body> — outside that hidden
// wrapper — so if it's already open when the window crosses 768px (e.g.
// resizing/rotating without closing it first), the panel itself has
// nothing forcing it shut and stays floating over the now-visible desktop
// header. popper-class="mobile-menu-popper" above adds a matching CSS
// safety net; this closes the dropdown's own state to match, so it
// doesn't reopen looking stale and isn't left aria-expanded for
// screen readers while invisible.
const dropdownRef = ref(null)
const { isMobileScreen } = useMobileScreen(768)
watch(isMobileScreen, (isMobile) => {
  if (!isMobile) dropdownRef.value?.handleClose()
})
</script>

<style scoped>
.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.hamburger-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.8);
}

.hamburger-btn:active {
  transform: scale(0.95);
}
</style>

<style>
/* Element Plus teleports the dropdown panel to <body>, outside the
   min-[768px]:hidden wrapper on the hamburger trigger in the template —
   so that class alone can't hide an already-open panel once the viewport
   crosses into desktop width. This is the CSS-only backstop (the
   script-side watch(isMobileScreen) above closes the dropdown's own state
   to match, once JS has had a chance to run). Same 768px breakpoint. */
@media (min-width: 768px) {
  .mobile-menu-popper {
    display: none !important;
  }
}

.mobile-dropdown-menu {
  min-width: 200px;
  padding: 8px 0;
}

.mobile-dropdown-menu .el-dropdown-menu__item {
  padding: 5px 16px;
}

.mobile-menu-section-label {
  padding: 6px 16px 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9ca3af;
}

.mobile-menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 2px 10px;
}

.menu-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.lang-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid currentColor;
}

.mobile-dropdown-menu .is-active-tab {
  color: var(--el-color-primary);
  font-weight: 600;
}

.mobile-dropdown-menu .is-active-tab svg.menu-icon {
  stroke: var(--el-color-primary);
}

.mobile-dropdown-menu .el-dropdown-menu__item:has(.is-active-tab) {
  background-color: var(--el-color-primary-light-9);
  border-inline-start: 3px solid var(--el-color-primary);
  padding-inline-start: 17px;
}

.mobile-dropdown-menu .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.mobile-dropdown-menu
  .el-dropdown-menu__item:not(.is-disabled):hover
  .menu-icon {
  color: var(--el-color-primary);
}

:root.dark-theme .mobile-menu-section-label {
  color: #6b7280;
}

:root.dark-theme .mobile-menu-divider {
  background: #4b5563;
}

:root.dark-theme .mobile-dropdown-menu {
  background-color: #374151 !important;
  border-color: #4b5563 !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item {
  color: #e5e7eb !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item span {
  color: #e5e7eb !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item svg {
  stroke: #e5e7eb;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item .el-icon {
  color: #e5e7eb !important;
}

:root.dark-theme .mobile-dropdown-menu .is-active-tab {
  color: #93c5fd !important;
  font-weight: 600;
}

:root.dark-theme .mobile-dropdown-menu .is-active-tab svg {
  stroke: #93c5fd !important;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:has(.is-active-tab) {
  background-color: #1e3a5f !important;
  border-inline-start-color: #93c5fd !important;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: #4b5563 !important;
  color: #93c5fd !important;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:not(.is-disabled):hover
  svg {
  stroke: #93c5fd;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:not(.is-disabled):hover
  .el-icon {
  color: #93c5fd !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item.is-divided {
  border-top-color: #4b5563 !important;
}
</style>
