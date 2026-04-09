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
  components/public/# Public SEO/indexable pages
  scripts/          # Composables that back each component (mirror folder structure)
  stores/           # Pinia stores: authStore, groupStore, userStore, dataStore, tabStore
  composables/      # Shared composables: useFirebase, useDebouncedRef, useApprovalRequests, etc.
  utils/            # Pure utility functions (string, cache, upload, crypto, alerts)
  helpers/          # Domain helpers (group membership checks, approval logic)
  assets/           # Validation rules, constants, category lists
  constants/        # DB_NODES, SEO config, and other app-wide constants
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
- Session orchestration belongs in `src/scripts/layout/app.js`; the inactivity tracker lives in `src/composables/useInactivityLogout.js`.
- Idle logout is required to be activity-based only: users are logged out after `VITE_INACTIVITY_LOGOUT_MINUTES` of no activity. This repo currently configures 15 minutes in `.env`, with a 30-minute fallback if the env value is missing or invalid.
- SEO metadata is route-driven: use `src/constants/seo.js` and `src/utils/seo.js`. Public marketing pages should be indexable; login/register/private app routes should remain `noindex, nofollow`.
- Reuse `src/components/generic-components/HelpContent.vue` for both help surfaces. The public `/help` page and the in-app help dialog must stay in sync.
- Public navigation in the header/footer should remain available on public routes and guest routes like `/login` and `/register`.
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
