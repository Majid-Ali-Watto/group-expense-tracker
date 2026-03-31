# Playwright E2E

## Install

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm run test:e2e
```

For headed mode:

```bash
npm run test:e2e:headed
```

## Environment

Optional variables:

```bash
E2E_BASE_URL=http://127.0.0.1:4173
E2E_PORT=4173
E2E_HOST=127.0.0.1

E2E_EMAIL=your-test-user@example.com
E2E_PASSWORD=your-test-password

E2E_AVAILABLE_GROUP_NAME=Name of an available group

E2E_BUG_RESOLVER_EMAIL=bug-resolver@example.com
E2E_BUG_RESOLVER_PASSWORD=bug-resolver-password
```

Notes:

- If `E2E_BASE_URL` is not set, Playwright starts the Vite dev server automatically.
- Public route tests run without credentials.
- Authenticated smoke tests are skipped until `E2E_EMAIL` and `E2E_PASSWORD` are provided.
- Bug resolver coverage is skipped until the bug-resolver credentials are provided.
