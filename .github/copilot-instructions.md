# Kharchafy — Copilot Instructions

## Stack
Vue 3 (`<script setup>`) · Pinia · Element Plus · Tailwind CSS · Vite · Firebase Realtime Database · Cloudinary

## Structure
- `src/components/` — Vue SFCs grouped by feature
- `src/components/public/` — public SEO/indexable pages
- `src/scripts/` — composables paired with each component (same folder names)
- `src/stores/` — Pinia stores (authStore, groupStore, userStore, dataStore, tabStore)
- `src/composables/` — shared composables (useFirebase, useApprovalRequests, useReceiptUpload, useDebouncedRef…)
- `src/utils/` — pure utility functions
- `src/helpers/` — domain helpers for approvals and group membership
- `src/constants/` — DB_NODES, SEO config, and app-wide constants
- `src/firebase.js` — Firebase init

## Coding Patterns
- Components are thin templates — logic belongs in the paired `src/scripts/` composable.
- All imports use the `@/` alias for `src/`.
- Firebase DB paths always come from `DB_NODES`, never as raw strings.
- `String.prototype.toCapitalize()` is globally available — capitalises every word.
- `formatAmount` is available via `inject('formatAmount')` (PKR currency).
- Session handling is centralized in `src/scripts/layout/app.js`; inactivity tracking belongs in `src/composables/useInactivityLogout.js`.
- Automatic logout must only happen after true inactivity for `VITE_INACTIVITY_LOGOUT_MINUTES` minutes. This repo currently sets 15 minutes in `.env`; fallback is 30 minutes if unset or invalid.
- Route SEO is driven from `src/constants/seo.js` and `src/utils/seo.js`. Public routes should be indexable; login/register/private app routes should stay `noindex, nofollow`.
- Reuse `src/components/generic-components/HelpContent.vue` for both the public `/help` route and the in-app help dialog.
- Public header/footer navigation should also appear on guest auth routes (`/login`, `/register`).
- Destructive actions (delete, edit) require multi-member approval stored in Firebase.

## Ignore
`node_modules/`, `dist/`, `dev-dist/`, `dist-ssr/`, `test-results/`, `playwright-report/`, `package-lock.json`
