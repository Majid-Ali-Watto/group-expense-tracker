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
- SEO metadata is route-driven: use `src/constants/seo.js` (per-route title/description/keywords/structured data) and `src/utils/seo.js` (`buildHeadConfig`, consumed by a single `useHead()` call in `src/scripts/layout/app.js`). Public marketing pages should be indexable; login/register/private app routes should remain `noindex, nofollow`.
- The 6 public marketing pages (`src/constants/publicPaths.js`) are statically prerendered at build time via `vite-ssg` (`npm run build` = `vite-ssg build`) — real HTML/meta/JSON-LD for crawlers, no JS execution required. Everything else stays a plain client-rendered SPA. `ssgOptions` lives in `vite.config.js`; it can't import anything Firebase/env-dependent (evaluated outside the app's normal Vite module graph), which is why `publicPaths.js` and the `SITE_URL` in `constants/seo.js` are dependency-free. Prerendered output uses `dist/<route>/index.html` (`dirStyle: 'nested'`) — `vercel.json` has explicit rewrites for each of the 12 public URLs to that path.
- Reuse `src/components/generic-components/HelpContent.vue` for both help surfaces. The public `/help` page and the in-app help dialog must stay in sync.
- Public navigation in the header/footer should remain available on public routes and guest routes like `/login` and `/register`.
- Destructive changes (delete, edit) require multi-member approval flows stored in Firebase.
- Security headers live in `vercel.json`, applied to every route. `X-Frame-Options`/`frame-ancestors 'none'`/`X-Content-Type-Options`/`Referrer-Policy` are enforced (zero functional risk). The full `Content-Security-Policy` is currently shipped as `Content-Security-Policy-Report-Only` only — tesseract.js's default worker/wasm/language-data CDN endpoints can't be pinned down precisely without a live browser trace, and an enforced-but-wrong policy would silently break receipt OCR or reCAPTCHA App Check instead of failing loudly. Watch the browser console for actual violations across real usage for a while, then promote it to a real (enforced) `Content-Security-Policy` header once it's been quiet. The `script-src` hashes in that policy cover `index.html`'s 3 inline theme/reload IIFEs exactly as currently written — if you edit those scripts, recompute their SHA-256 (base64) and update the hashes, or the CSP report will start flagging them (and blocking them outright once the policy is enforced).

## Git Workflow
- Before starting any fix or feature, pull latest `master` and branch off it.
- Already on another branch? Pull `master` and merge it into the current branch first, then continue.

## Response Style
- Explanations should be short, concise, and meaningful — no filler, no restating the obvious.

## Ignored (never read these)
- `node_modules/`, `dist/`, `dev-dist/`, `dist-ssr/`
- `package-lock.json`

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint fix
- `npm run format` — Prettier
