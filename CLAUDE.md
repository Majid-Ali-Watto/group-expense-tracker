# Kharchafy — Claude Code Project Guide

## Stack
- **Frontend:** Vue 3 (Composition API + `<script setup>`), Pinia, Element Plus, Tailwind CSS, Vite
- **Backend:** Firebase Realtime Database (no server code in this repo)
- **Storage:** Cloudinary for receipts (images, max 1 MB)
- **Auth:** Firebase Auth + encrypted session in Pinia/sessionStorage

## Project Structure
```
src/
  components/       # Vue SFCs grouped by feature
  scripts/          # Composables that back each component (mirror folder structure)
  stores/           # Pinia stores: authStore, groupStore, userStore, dataStore, tabStore
  composables/      # Shared composables: useFirebase, useDebouncedRef, useApprovalRequests, etc.
  utils/            # Pure utility functions (string, cache, upload, crypto, alerts)
  helpers/          # Domain helpers (group membership checks, approval logic)
  assets/           # Validation rules, constants, category lists
  constants/        # DB_NODES and other app-wide constants
  router/           # Vue Router config
  firebase.js       # Firebase init + exported helpers
```

## Key Conventions
- Every major component (`Foo.vue`) has a paired composable in `src/scripts/` that exports all reactive state and handlers. The component is a thin template; logic lives in the script.
- Component folders mirror script folders (e.g. `components/users/` ↔ `scripts/users/`).
- Imports use `@/` alias for `src/`.
- `String.prototype.toCapitalize` is globally patched in `main.js` — capitalizes every word.
- `formatAmount` is provided via `inject('formatAmount')` — PKR currency formatter.
- DB paths come from `DB_NODES` constants, never hardcoded strings.
- Destructive changes (delete, edit) require multi-member approval flows stored in Firebase.

## Ignored (never read these)
- `node_modules/`, `dist/`, `dev-dist/`, `dist-ssr/`
- `test-results/`, `playwright-report/`
- `package-lock.json`

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint fix
- `npm run format` — Prettier
- `npm run test:e2e` — Playwright tests
