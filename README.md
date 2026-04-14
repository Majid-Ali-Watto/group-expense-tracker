# Kharchafy — Group Expense, Loans, and Personal Budget Hub

Kharchafy is a Vue 3 + Pinia single-page app for running small-group or household finances. It keeps shared expenses, shared loans, personal loans, and personal salary budgets in one place, backed by Cloud Firestore and Cloudinary for receipt storage. Every sensitive change flows through member approvals, so nothing destructive happens without consensus.

---

## Quick Start
- Prereqs: Node 18+, npm 9+, Firebase project with Realtime Database, and a Cloudinary account (for receipt uploads).
- Install deps: `npm install`
- Run dev server: `npm run dev -- --host`
- Build: `npm run build` (output in `dist/`)
- Lint / format: `npm run lint`, `npm run format`

### Environment (.env.local)
```
VITE_API_KEY=...
VITE_AUTH_DOMAIN=...
VITE_DATABASE_URL=...
VITE_PROJECT_ID=...
VITE_STORAGE_BUCKET=...
VITE_MESSAGE_SENDER_ID=...
VITE_APP_ID=...
VITE_MEASUREMENT_ID=...

VITE_RECAPTCHA_SITE_KEY=...
VITE_APP_CHECK_DEBUG_TOKEN=...

VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
VITE_CLOUDINARY_API_KEY=...
VITE_CLOUDINARY_API_SECRET=...

VITE_NODE_BE_EMAIL_API_URL=...

VITE_INACTIVITY_LOGOUT_MINUTES=15
```

### Firebase Storage CORS (for Cloudinary fallback receipts in Storage, if you use it)
```
npm install -g firebase-tools
firebase login
firebase storage:cors set cors.json --bucket gs://<your-storage-bucket>
# or for older CLI:
npx -y gsutil cors set cors.json gs://<your-storage-bucket>
```

---

## High-Level Architecture
- **Frontend:** Vue 3 (Composition API), Pinia for state, Element Plus UI, Tailwind utilities, Vite build.
- **Backend:** Cloud Firestore via the Firebase Web SDK (no server code in this repo).
- **Storage:** Cloudinary for receipts (images only, max 1 MB enforced client-side).
- **PWA bits:** `src/service-worker.js` registers a service worker (basic; extend as needed).
- **State & Security:** Active session kept in Pinia plus `sessionStorage`, both encrypted with different AES keys (see `src/utils/sessionCrypto.js`). Session re-verified every 5 minutes against Firebase and automatically logs out after inactivity.
- **Analytics:** Firebase Analytics is enabled only in production, and only when `VITE_MEASUREMENT_ID` is configured and the browser supports it. The app logs page views plus login, signup, and logout events.

---

## Data Model (top-level Firestore collections / document paths)
- `users/{uid}` — user profile (`name`, `mobile`, `email`, `emailVerified`, optional approval request fields).
- `groups/{groupId}` — group metadata, members, requests, transfer/delete/settlement state, and notifications.
- `shared-expenses/{groupId}/months/{YYYY-MM}/payments/{paymentId}` — shared expense records for a group and month.
- `shared-expenses-backup/{groupId}/months/{YYYY-MM}/payments/{paymentId}` — archived shared expenses after settlement finalization.
- `shared-loans/{groupId}/months/{YYYY-MM}/loans/{loanId}` — shared loan records for a group and month.
- `personal-expenses/{uid}/months/{YYYY-MM}/expenses/{expenseId}` — personal expense entries for a user and month.
- `personal-loans/{uid}/months/{YYYY-MM}/loans/{loanId}` — personal loan records for a user and month.
- `salaries/{uid}/months/{YYYY-MM}` — monthly salary entry for a user.
- `bug-reports/{uid}/reports/{reportId}` — user-submitted bug reports and note threads.
- `bug-report-notifications/admin/items/{bugId}` — admin-side bug-report notifications.
- `configs/storage`, `configs/cache` — app configuration and feature flags.

---

## Authentication & Session Flow
- **Register:** Users sign up with name, mobile, email, and password. Firebase Auth creates the account and a profile document is stored under `users/{uid}`.
- **Email verification:** New accounts must verify their email before login succeeds. The app supports resend-verification from the auth screen.
- **Login:** Users sign in with email and password, not mobile.
- **Password recovery:** "Forgot Password" sends a Firebase password-reset email.
- **Session hardening:** A random token is encrypted twice (AES-GCM in sessionStorage, AES-CBC in Pinia). Every tab change and a 5‑minute timer re-verify token + password on Firebase; failures force logout.
- **Idle logout:** Logged-in users are forced out after `VITE_INACTIVITY_LOGOUT_MINUTES` without activity. This repo currently sets `15` minutes in `.env`; the composable fallback is `30` if the env value is missing or invalid.
- **Remember Me:** Stores only the email in `localStorage` for prefill and uses Firebase persistence to keep or limit auth state.

---

## Tabs & Navigation
- Tabs are defined in `src/assets/data.js` and rendered via `App.vue`/`HOC.vue`.
- When no active group is selected, shared tabs are hidden (you still see personal salary/expenses, personal loans, users, groups).
- Tab → component mapping for the authenticated app lives in `src/router/index.js`.
- Public SEO routes are also available for non-logged-in users: `/`, `/features`, `/group-expense-tracker`, `/personal-budget-tracker`, `/help`, `/faq`.
- The public header/footer navigation is intentionally available on marketing routes and guest auth routes like `/login` and `/register`.

---

## Group Management (src/components/Groups.vue & src/scripts/groups.js)
**Creating & selecting**
- Create groups with name/description and initial members. Creator becomes `ownerMobile`.
- Pin frequently used groups locally; selection stored in Pinia.

**Joining**
- Non-members send join requests. Every existing member must approve; then the owner (or any member if owner missing) finalizes adding the user.

**Leaving**
- Members raise leave requests; all members must approve before removal.

**Editing**
- If only the name/description changes, the owner can update directly and members are notified.
- If membership changes, an edit request is created and the remaining members must approve before the new member list is applied.

**Adding members (non-owner)**
- Any member can propose an add-member request; all members approve, then owner clicks "Add Member Now".

**Deletion**
- Owner starts a delete request; unanimous member approval is required, then owner can "Delete Now".

**Ownership transfer**
- Owner proposes a new owner; all members approve to finalize.

**Notifications**
- Per-user notifications stored under `group.notifications[mobile]`. Users can dismiss locally.

**Balances snapshot**
- "Your Position" card computes (current month) net for shared expenses and shared loans to show what you will receive or need to pay.

**Filter & Sort**
- Sort groups alphabetically A–Z or Z–A.
- Filter by member: dropdown lists all group members; selecting one shows only groups containing that person.

---

## Shared Expenses (tab: "Shared Expenses")
Component stack: `SharedExpenses.vue` → `ExpenseList.vue` → shared table/helpers

**Add / edit payments**
- Payer modes: single payer or multi-payer with per-payer amounts (must balance total).
- Participants: default to all group members.
- Split modes: equal split or itemized custom split (per-item participants; totals must balance).
- Receipts: image-only, ≤1 MB; stored on Cloudinary; multiple files allowed for multi-payer mode.
- Metadata recorded: payer(s), split array, whoAdded, whenAdded, group, date.

**Change control**
- Any update/delete is a request: requester auto-approves; every group member must approve.
- Rejections notify the requester; approvals auto-apply change (and prune replaced Cloudinary files).
- Pending requests surface at top of ExpenseList; Table rows are locked while a request is open.

**Expense Summary accordion**
- Shows total spent, per-payer totals, and per-person share.
- Visual charts: donut chart for payer share proportions and bar chart for per-person amounts.

**Exports & history**
- Table supports PDF (html2pdf) and Excel (xlsx) downloads.
- Settled months move to `payments-backup` and appear under the "History" tab (read-only).

---

## Settlement Flow (src/components/Settlement.vue)
- Computes pairwise "who pays whom" from current month's expenses.
- Any member may request settlement for the month; all members must approve.
- Admin (group owner) can finalize once approvals are unanimous: moves `payments/{groupId}/{month}` to `payments-backup` and clears live data.
- Requests can be canceled/rejected; approvals tracked on `group.settlementRequest`.

---

## Shared Loans (tab: "Shared Loans")
- Guarded: if a group has >2 members, shows a warning (loans work best between two people).
- Add loans with giver/receiver, description, optional receipt (Cloudinary), auto-stamped dates.
- Updates/deletes follow the same unanimous approval flow as expenses.
- Balances table shows who is net lender/debtor across loaded month.
- Loan Summary accordion with donut and bar charts for visual breakdown.

---

## Personal Budgeting
**Monthly Salary & Expenses (tab: "Personal Expenses")**
- Salary per month (`salaries/{mobile}/{month}`) with live display and remaining budget.
- Personal expenses with receipts; month filter; PDF/Excel export.

**Personal Loans (tab: "Personal Loans")**
- Loans stored per-user; month filter or "All".
- **Filter by Giver:** dropdown to show only loans from a specific person.
- **Select from Users:** dropdown on giver/receiver fields to auto-fill name and masked mobile from registered users. Toggle shown via "Select from Users" link; hidden by default.
- **ME? Checkbox:** quickly fills your own details as giver or receiver.
- Summary cards: total you gave, total you received, net balance.
- Donut chart (gave vs. received) and bar chart (settlement amounts) inside the Loan Summary accordion.
- Pairwise settlements show exact who-pays-whom across all personal loans.
- PDF/Excel export.

---

## Users (tab: "Users")
- Browse all registered users; mobile numbers are masked for privacy.
- Search by name or mobile.
- **Sort:** alphabetical A–Z or Z–A buttons.
- **Shared Groups Only:** checkbox to filter to users who share at least one group with you.
- Each user card shows which groups they belong to.
- **Account actions:** update profile details and raise delete requests. Delete requests require approval from relevant group owners/members before finalization.

---

## Notifications
- Group-level: join/edit/add-member/delete/ownership actions use `group.notifications`.
- Expense/Loan-level: approval/rejection notices stored per user under each record's `notifications`.
- Bell icon in header shows count of pending actions. Tap any notification to jump to the relevant section.
- UI components: `NotificationsForCurrentUser.vue` and `GroupNotificationsForCurrentUser.vue`; dismiss just removes your copy.

---

## Expenses Summary Dialog (header button)
- Accessible from the header on every page (desktop button + mobile hamburger menu).
- Shows complete financial picture across all groups and loan types:
  - Total you will receive vs. total you need to pay (Shared Expenses, Shared Loans, Personal Loans).
  - Net position: positive means others pay you; negative means you pay others.
- **Charts:** donut chart for the overall receive/pay split; bar chart for per-category breakdown.
- **Download PDF:** saves the full summary including charts as a formatted PDF.

---

## Charts & Visuals
All charts are pure SVG/CSS — no external chart library dependency.

- **DonutChart** (`src/components/generic-components/DonutChart.vue`): SVG stroke-dasharray donut, auto-colored segments, legend with values and percentages.
- **BarChart** (`src/components/generic-components/BarChart.vue`): CSS percentage-width horizontal bars with animated transitions.
- **Where they appear:**
  - Shared Expenses → Expense Summary accordion
  - Shared Loans → Loan Summary accordion
  - Personal Loans → Loan Summary accordion
  - Expenses Summary dialog (header)

---

## Help Surfaces
- The in-app help dialog is available from the header when browsing the private app.
- A public help page is also available at `/help` and reuses the same content source as the dialog.
- The shared help content lives in `src/components/generic-components/HelpContent.vue`.
- The dialog footer includes a theme toggle and logout button (when logged in).

---

## Receipts & File Handling
- Client-side validation: images only (JPG/PNG/GIF/BMP/WEBP), max 1 MB.
- Cloudinary upload via unsigned preset; public IDs stored to allow cleanup on updates/deletes.
- When replacing receipts during updates, old Cloudinary assets are deleted.

---

## Exports & Reporting
- **PDF:** `html2pdf.js` — captures the full page/section with styles, branding, and page numbers.
- **Excel:** `xlsx` — exports all visible rows as a spreadsheet (.xlsx).
- **Available on:** Shared Expenses list, Shared Loans list, Personal Loans list, Expenses Summary dialog.

---

## Theme & Appearance
- Light / Dark mode toggle via the sun/moon icon in the header (or hamburger menu on mobile).
- Theme preference saved to `localStorage` and restored on next visit.
- All dialogs, charts, and custom components have explicit dark theme overrides.

---

## Key Files (for new contributors)
- App shell: `src/App.vue`, `src/main.js`
- Router + SEO: `src/router/index.js`, `src/constants/seo.js`, `src/utils/seo.js`
- State: `src/stores/authStore.js`, `src/stores/groupStore.js`, `src/stores/userStore.js`, `src/stores/dataStore.js`, `src/stores/tabStore.js`
- Shared expenses: `src/components/shared-expenses/SharedExpenses.vue`, `src/components/shared-expenses/ExpenseList.vue`, `src/scripts/shared-expenses/shared-expenses.js`, `src/scripts/shared-expenses/expense-list.js`
- Settlements: `src/components/shared-expenses/Settlement.vue`, `src/scripts/shared-expenses/settlement.js`
- Shared loans: `src/components/shared-loans/Loans.vue`, `src/components/shared-loans/LoanForm.vue`, `src/components/shared-loans/SharedLoansGuard.vue`, `src/scripts/shared-loans/loans.js`, `src/scripts/shared-loans/loan-form.js`
- Personal budget: `src/components/personal-expenses/PersonalExpenses.vue`, `src/components/personal-expenses/PersonalExpenseForm.vue`, `src/components/personal-expenses/PersonalExpenseList.vue`, `src/components/personal-expenses/SalaryForm.vue`
- Personal loans: `src/components/personal-loans/PersonalLoans.vue`, `src/scripts/personal-loans/personal-loans.js`
- Groups: `src/components/groups/Groups.vue`, `src/components/groups/SharedGroups.vue`, `src/scripts/groups/groups.js`
- Users: `src/components/users/Users.vue`, `src/scripts/users/users.js`
- Auth & security: `src/components/auth/Login.vue`, `src/scripts/auth/login.js`, `src/utils/sessionCrypto.js`, `src/composables/useInactivityLogout.js`
- Analytics: `src/firebase.js`, `src/utils/analytics.js`
- Charts: `src/components/generic-components/DonutChart.vue`, `src/components/generic-components/BarChart.vue`
- Expenses Summary: `src/components/generic-components/NetPositionDialog.vue`
- Help: `src/components/generic-components/HelpDialog.vue`, `src/components/generic-components/HelpContent.vue`, `src/components/public/HelpPage.vue`
- Public pages: `src/components/public/*`
- Header: `src/components/layout/Header.vue`

---

## Operational Notes & Gotchas
- Approval rules are unanimous for group actions, expense/loan mutations, and settlements; design your UI/UX changes to respect that invariant.
- Session verification runs every 5 minutes; devtools tweaks to Pinia/sessionStorage won't bypass it.
- Group member visibility: mobile numbers are masked outside the active group; pass `displayMobileForGroup` helpers when adding new UI.
- Shared loans are designed for two-party groups; larger groups only get a warning (not a hard block).
- Receipts rely on Cloudinary; ensure the unsigned upload preset exists and is limited to images.
- Charts are dependency-free (pure SVG/CSS); keep them that way to avoid bundle bloat.

Happy hacking!
