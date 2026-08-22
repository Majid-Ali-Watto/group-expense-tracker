# Migrating email off users/{uid}

`email` used to live on the world-readable `users/{uid}` document, alongside
the plaintext `mobile` field. It now lives in a separate `user-private/{uid}`
collection that only the owner and admins can read (see `firestore.rules`).
This doc is the runbook for rolling that change out on a live project without
breaking login, password-change, or the admin Users tab along the way.

Mirrors `migrate-user-admin-flags.md` exactly — same shape, different field.
`mobile` is **not** part of this migration — it's used as a functional
identifier across group invites, split-matching, and dropdowns in ~25+ call
sites, not just for display, so de-risking that is a separate, larger effort.

## Steps

1. **Deploy the updated `firestore.rules`.**
   Purely additive at this point — nothing existing changes behavior.
   ```
   firebase deploy --only firestore:rules
   ```

2. **Run this script in copy mode** (default, no flag):
   ```
   node --env-file=.env scripts/migrate-user-private-fields.mjs
   ```
   You'll be prompted for an admin's email + password. It reads every
   `users/{uid}` doc and, for each one carrying `email`, writes it to
   `user-private/{uid}`. It does **not** touch `users/{uid}` in this mode —
   safe to run more than once.

3. **Deploy the new app code** (this session's changes). Registration now
   writes `email` straight to `user-private/{uid}`; login/change-password/the
   admin Users tab now read it from there instead of `users/{uid}`.

4. **Smoke-test** against the deployed app:
   - A fresh registration (password and Google) creates both docs correctly.
   - An existing account can log in and see its own email in the Profile
     dialog.
   - Change-password still works and keeps the stored email in sync.
   - The admin Users tab still shows every user's email.
   - Shared-expense/shared-loan email notifications still arrive for a group
     with 2+ members.
   - In a browser devtools console, signed in as a non-admin user, confirm
     `getDoc(doc(db, 'user-private', '<some other uid>'))` is denied.

5. **Run this script again with `--cleanup`** once (4) checks out:
   ```
   node --env-file=.env scripts/migrate-user-private-fields.mjs --cleanup
   ```
   This strips `email` off every `users/{uid}` doc that still had it. **This
   is the step that actually closes the original exposure** — any
   authenticated user could otherwise still read `email` off `users/{uid}`
   even after the app stopped writing new ones there. Don't skip it, and
   don't run it before step 3 is confirmed working.

## Known, accepted gap after this migration

`handleGoogleSignIn`'s "returning user, different auth method" reconciliation
(`src/scripts/auth/login.js`) looks up an existing account by querying
`users/{uid}` for a matching `email` field (`findUserByEmail` in
`src/helpers/users.js`). For any account **registered after this migration**,
`email` is no longer on that doc, so this lookup can no longer find them —
someone who registers by password and later tries Google sign-in with the
same email will be routed to the "new Google user" flow instead and asked for
their mobile number, where `findUserByMobile` will correctly catch the
duplicate and show "mobile already exists" rather than silently creating a
second account or exposing anything. This is a UX regression (a confusing
error instead of a smooth account link), not a security or data-integrity
issue, and only affects that specific combination of actions. Closing it
properly needs a server-side (Admin SDK) email→uid lookup — worth a small
follow-up on the backend if it comes up in practice.

## App Check

If this Firebase project enforces App Check on Firestore (see
`src/helpers/firebase-app-check.js`), the script needs a registered debug
token to authenticate as a non-browser client. It reads one from
`VITE_APP_CHECK_DEBUG_TOKEN` in `.env` automatically. If the script fails
with an App Check–related error, register a fresh debug token in Firebase
Console → App Check → Manage debug tokens, set it as
`VITE_APP_CHECK_DEBUG_TOKEN`, and re-run.

## If something goes wrong mid-rollout

- Failed at step 2 (permission-denied writing `user-private`)? Step 1 hasn't
  actually taken effect yet — re-check the rules deploy.
- A user's own email stops showing after step 5? Re-run step 2 (copy) for
  that specific account, or manually `setDoc` their `user-private/{uid}` doc,
  then investigate before re-running `--cleanup` again.
- Steps 2 and 5 both print a per-user log line and a final count — keep that
  output if you need to audit exactly who was touched.
