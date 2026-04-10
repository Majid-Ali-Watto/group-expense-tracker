# Kharchafy — Command Reference

## Development

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (LAN-accessible via `--host`) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |

## Code Quality

| Command | Description |
|---|---|
| `npm run lint` | Run ESLint and auto-fix all violations |
| `npm run format` | Run Prettier over `src/` |

## Testing

| Command | Description |
|---|---|
| `npm run test:e2e` | Run all Playwright end-to-end tests (headless) |
| `npm run test:e2e:headed` | Run Playwright tests in a visible browser |
| `npm run test:e2e:debug` | Run Playwright tests in debug / step mode |

## Firebase

### Firestore

| Command | Description |
|---|---|
| `npx firebase-tools deploy --only firestore:rules` | Deploy `firestore.rules` to production |
| `npx firebase-tools deploy --only firestore:indexes` | Deploy `firestore.indexes.json` to production |
| `npx firebase-tools deploy --only firestore` | Deploy both rules **and** indexes in one shot |

### Hosting (Netlify)

| Command | Description |
|---|---|
| `npm run build` | Build `dist/` — Netlify auto-deploys on git push |
| `npx netlify deploy --dir=dist` | Preview deploy to a temporary Netlify URL |
| `npx netlify deploy --dir=dist --prod` | Manual production deploy to Netlify |
| `npx netlify dev` | Run Netlify dev server locally (with edge functions / redirects) |

### Emulators

| Command | Description |
|---|---|
| `npx firebase-tools emulators:start` | Start all configured Firebase emulators locally |
| `npx firebase-tools emulators:start --only firestore` | Start only the Firestore emulator |

### Auth / Project

| Command | Description |
|---|---|
| `npx firebase-tools login` | Authenticate the CLI with your Google account |
| `npx firebase-tools projects:list` | List all Firebase projects linked to your account |
| `npx firebase-tools use khata-application` | Switch the active project to `khata-application` |
| `npx firebase-tools logout` | Sign out of the Firebase CLI |
