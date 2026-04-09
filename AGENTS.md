# Kharchafy — Agent Instructions

## Stack
Vue 3 (Composition API, `<script setup>`) · Pinia · Element Plus · Tailwind CSS · Vite · Firebase Realtime Database · Cloudinary

## Folder Layout
- `src/components/` — Vue SFCs by feature (auth, groups, users, shared-expenses, shared-loans, personal-expenses, personal-loans, generic-components, layout)
- `src/scripts/` — composables backing each component, mirroring the component folder structure
- `src/stores/` — Pinia: authStore, groupStore, userStore, dataStore, tabStore
- `src/composables/` — shared composables (useFirebase, useDebouncedRef, useApprovalRequests, useReceiptUpload, etc.)
- `src/utils/` — pure helpers (string, cache, upload, crypto, alerts, notifications)
- `src/helpers/` — domain logic (approval checks, membership tests)
- `src/constants/` — DB_NODES and app-wide enums
- `src/firebase.js` — Firebase initialisation and re-exports

## Conventions
- Components are thin templates; all state and handlers live in the paired `src/scripts/` composable.
- Use `@/` alias for all imports from `src/`.
- DB path strings come from `DB_NODES` — never hardcode them.
- `String.prototype.toCapitalize` capitalises every word (patched globally in `main.js`).
- `formatAmount` is injected via Vue `provide/inject` — PKR currency.
- Auth session state is centralized in `src/scripts/layout/app.js`; inactivity logout logic lives in `src/composables/useInactivityLogout.js`.
- Auto logout must be inactivity-based only: logged-in users are signed out after no activity for `VITE_INACTIVITY_LOGOUT_MINUTES` minutes, defaulting to 30 when unset or invalid.
- Multi-member approval flows guard all destructive operations.

## Never Read
`node_modules/`, `dist/`, `dev-dist/`, `dist-ssr/`, `test-results/`, `playwright-report/`, `package-lock.json`
