# Kharchafy — Copilot Instructions

## Stack
Vue 3 (`<script setup>`) · Pinia · Element Plus · Tailwind CSS · Vite · Firebase Realtime Database · Cloudinary

## Structure
- `src/components/` — Vue SFCs grouped by feature
- `src/scripts/` — composables paired with each component (same folder names)
- `src/stores/` — Pinia stores (authStore, groupStore, userStore, dataStore, tabStore)
- `src/composables/` — shared composables (useFirebase, useApprovalRequests, useReceiptUpload, useDebouncedRef…)
- `src/utils/` — pure utility functions
- `src/helpers/` — domain helpers for approvals and group membership
- `src/constants/` — DB_NODES enum for all Firebase paths
- `src/firebase.js` — Firebase init

## Coding Patterns
- Components are thin templates — logic belongs in the paired `src/scripts/` composable.
- All imports use the `@/` alias for `src/`.
- Firebase DB paths always come from `DB_NODES`, never as raw strings.
- `String.prototype.toCapitalize()` is globally available — capitalises every word.
- `formatAmount` is available via `inject('formatAmount')` (PKR currency).
- Destructive actions (delete, edit) require multi-member approval stored in Firebase.

## Ignore
`node_modules/`, `dist/`, `dev-dist/`, `dist-ssr/`, `test-results/`, `playwright-report/`, `package-lock.json`
