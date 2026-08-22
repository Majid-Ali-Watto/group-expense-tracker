# Migrating isAdmin/billedUser/bugResolver off users/{uid}

`isAdmin`, `billedUser`, and `bugResolver` used to live on the world-readable
`users/{uid}` document. They now live in a separate `user-admin-flags/{uid}`
collection that only the owner and admins can read (see `firestore.rules`).
This doc is the runbook for rolling that change out on a live project without
locking any admin out along the way.

`callerIsAdmin()` / `callerIsBugStaff()` in `firestore.rules` check
`user-admin-flags/{uid}` first and fall back to the legacy `users/{uid}`
fields if the new doc doesn't exist yet — so the order below matters less
than it would otherwise, but still follow it.

## Steps

1. **Deploy the updated `firestore.rules`.**
   Purely additive at this point — nothing existing changes behavior.
   ```
   firebase deploy --only firestore:rules
   ```

2. **Run this script in copy mode** (default, no flag):
   ```
   node --env-file=.env scripts/migrate-user-admin-flags.mjs
   ```
   You'll be prompted for an admin's email + password. It reads every
   `users/{uid}` doc and, for each one carrying `isAdmin`/`billedUser`/
   `bugResolver`, writes those values to `user-admin-flags/{uid}`. It does
   **not** touch `users/{uid}` in this mode — safe to run more than once.

3. **Deploy the new app code** (this session's changes). Reads/writes for
   these three fields now go through `user-admin-flags/{uid}`.

4. **Smoke-test** a real admin, bug-resolver, and billed account against the
   deployed app: `/admin` access, the bug-resolver admin route, the Profile
   dialog's own-flag display, and the admin toggle checkboxes in `/admin`
   itself.

5. **Run this script again with `--cleanup`** once (4) checks out:
   ```
   node --env-file=.env scripts/migrate-user-admin-flags.mjs --cleanup
   ```
   This strips `isAdmin`/`billedUser`/`bugResolver` off every `users/{uid}`
   doc that still had them. **This is the step that actually closes the
   original exposure** — any authenticated user could otherwise still read
   these fields off `users/{uid}` even after the app stopped writing new
   ones there. Don't skip it, and don't run it before step 3 is confirmed
   working.

## App Check

If this Firebase project enforces App Check on Firestore (see
`src/helpers/firebase-app-check.js`), the script needs a registered debug
token to authenticate as a non-browser client. It reads one from
`VITE_APP_CHECK_DEBUG_TOKEN` in `.env` automatically. If the script fails
with an App Check–related error, register a fresh debug token in Firebase
Console → App Check → Manage debug tokens, set it as
`VITE_APP_CHECK_DEBUG_TOKEN`, and re-run.

## If something goes wrong mid-rollout

- Failed at step 2 (permission-denied writing `user-admin-flags`)? Step 1
  hasn't actually taken effect yet — re-check the rules deploy.
- An admin loses access after step 5? Re-run step 2 (copy) for that specific
  account, or manually `setDoc` their `user-admin-flags/{uid}` doc, then
  investigate before re-running `--cleanup` again.
- Steps 2 and 5 both print a per-user log line and a final count — keep that
  output if you need to audit exactly who was touched.
