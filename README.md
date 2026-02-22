# FinTrack — Group Expense, Loans, and Personal Budget Hub

FinTrack is a Vue 3 + Pinia single-page app for running small-group or household finances. It keeps shared expenses, shared loans, personal loans, and personal salary budgets in one place, backed by Firebase Realtime Database and Cloudinary for receipt storage. Every sensitive change flows through member approvals, so nothing destructive happens without consensus.

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

VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
VITE_CLOUDINARY_API_KEY=...
VITE_CLOUDINARY_API_SECRET=...
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
- **Backend:** Firebase Realtime Database (no server code in this repo).
- **Storage:** Cloudinary for receipts (images only, max 1 MB enforced client-side).
- **PWA bits:** `src/service-worker.js` registers a service worker (basic; extend as needed).
- **State & Security:** Active session kept in Pinia plus `sessionStorage`, both encrypted with different AES keys (see `src/utils/sessionCrypto.js`). Session re-verified every 5 minutes against Firebase.

---

## Data Model (paths in Realtime DB)
- `users/{mobile}` — `{ name, loginCode, recoveryCodes[], addedBy, deleteRequest?, updateRequest? }`
- `groups/{groupId}` — `{ name, description, ownerMobile, members[], joinRequests[], leaveRequests[], editRequest?, addMemberRequest?, deleteRequest?, transferOwnershipRequest?, settlementRequest?, notifications? }`
- `payments/{groupId|global}/{YYYY-MM}/{paymentId}` — shared expenses with splits, payer mode, receipts, update/delete requests, per-user notifications.
- `payments-backup/{groupId|global}/{YYYY-MM}` — archived after settlement.
- `loans/{groupId|global}/{YYYY-MM}/{loanId}` — shared loans plus requests/notifications.
- `personal-loans/{mobile}/{YYYY-MM}/{loanId}` — personal loans.
- `expenses/{mobile}/{YYYY-MM}/{expenseId}` — personal monthly expenses.
- `salaries/{mobile}/{YYYY-MM}` — personal monthly salary.

---

## Authentication & Session Flow
- **Login / Register:** Users enter name, mobile (PK), and a login code. New users set the code and receive printable recovery passcodes (see `src/scripts/login.js`).
- **Recovery:** “Forgot login code” consumes one recovery passcode; on last code, fresh codes are generated and shown.
- **Session hardening:** A random token is encrypted twice (AES-GCM in sessionStorage, AES-CBC in Pinia). Every tab change and a 5‑minute timer re-verify token + loginCode on Firebase; failures force logout.
- **Remember Me:** Stores name/mobile/loginCode in `localStorage` for prefill only (session still crypto-based).

---

## Tabs & Navigation
- Tabs are defined in `src/assets/data.js` and rendered via `App.vue`/`HOC.vue`.
- When no active group is selected, shared tabs are hidden (you still see personal salary/expenses, personal loans, users, groups).
- Tab → component mapping lives in `src/utils/active-tab.js` (also reused for edit dialogs).

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
- Name/description edits apply immediately and notify others.
- Member changes trigger an edit request. All affected members (existing, added, removed) must approve; on success the membership list is replaced.

**Adding members (non-owner)**
- Any member can propose an add-member request; all members approve, then owner clicks “Add Member Now”.

**Deletion**
- Owner starts a delete request; unanimous member approval is required, then owner can “Delete Now”.

**Ownership transfer**
- Owner proposes a new owner; all members approve to finalize.

**Notifications**
- Per-user notifications stored under `group.notifications[mobile]`. Users can dismiss locally.

**Balances snapshot**
- “Your Position” card computes (current month) net for shared expenses and shared loans to show what you owe/receive.

---

## Shared Expenses (tab: “Shared Expenses”)
Component stack: `PaymentForm.vue` → `ExpenseList.vue` → `Table.vue`

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

**Exports & history**
- Table supports PDF (html2pdf) and Excel (xlsx) downloads.
- Settled months move to `payments-backup` and appear under the “History” tab (read-only).

---

## Settlement Flow (src/components/Settlement.vue)
- Computes pairwise “who pays whom” from current month’s expenses.
- Any member may request settlement for the month; all members must approve.
- Admin (group owner) can finalize once approvals are unanimous: moves `payments/{groupId}/{month}` to `payments-backup` and clears live data.
- Requests can be canceled/rejected; approvals tracked on `group.settlementRequest`.

---

## Shared Loans (tab: “Shared Loans”)
- Guarded: if a group has >2 members, shows a warning (loans work best between two people).
- Add loans with giver/receiver, description, optional receipt (Cloudinary), auto-stamped dates.
- Updates/deletes follow the same unanimous approval flow as expenses.
- Balances table shows who is net lender/debtor across loaded month.

---

## Personal Budgeting
**Monthly Salary & Expenses (tab: “Personal Expenses”)**
- Salary per month (`salaries/{mobile}/{month}`) with live display and remaining budget.
- Personal expenses with receipts; month filter; PDF/Excel export.

**Personal Loans (tab: “Personal Loans”)**
- Loans stored per-user; month filter or “All”.
- Summary cards: total lending, total debting, net position.
- Pairwise settlements show exact who-owes-whom across personal loans.

---

## Users Admin (tab: “Users”)
- Add users (mobile is ID). Initial loginCode is `null` so the user must set it on first login.
- Reset login code: sets `loginCode=null` so the user recreates it and gets new recovery codes.
- Rename / delete with approvals:
  - If the user is in groups, all relevant group owners must approve the update/delete request.
  - Pending requests appear in “Pending Approvals” for approvers; actions recorded back to Firebase.
- Mobile numbers are masked outside the current group for privacy.

---

## Notifications Overview
- Group-level: join/edit/add-member/delete/ownership actions use `group.notifications`.
- Expense/Loan-level: approval/rejection notices stored per user under each record’s `notifications`.
- UI components: `NotificationsForCurrentUser.vue` and `GroupNotificationsForCurrentUser.vue`; dismiss just removes your copy.

---

## Receipts & File Handling
- Client-side validation: images only (JPG/PNG/GIF/BMP/WEBP), max 1 MB.
- Cloudinary upload via unsigned preset; public IDs stored to allow cleanup on updates/deletes.
- When replacing receipts during updates, old Cloudinary assets are deleted.

---

## Exports & Reporting
- Table downloads: PDF (`html2pdf.js`) and Excel (`xlsx`).
- Pairwise settlements, balances, and summaries are shown inline for quick reads.

---

## Key Files (for new contributors)
- App shell: `src/App.vue`, `src/main.js`
- State: `src/stores/store.js`
- Routing-by-tabs: `src/utils/active-tab.js`
- Shared expenses: `src/components/PaymentForm.vue`, `src/components/ExpenseList.vue`, `src/scripts/payment-form.js`, `src/scripts/expense-list.js`
- Settlements: `src/components/Settlement.vue`, `src/scripts/settlement.js`
- Shared loans: `src/components/Loans.vue`, `src/scripts/loans.js`, `src/components/SharedLoansGuard.vue`
- Personal budget: `src/components/monthly-sallary-expense-manager/*`, `src/components/personal-loans/PersonalLoans.vue`
- Groups: `src/components/Groups.vue`, `src/scripts/groups.js`, `src/helpers/users.js`
- Users admin: `src/components/Users.vue`, `src/scripts/users.js`
- Auth & security: `src/components/Login.vue`, `src/scripts/login.js`, `src/utils/sessionCrypto.js`, `src/utils/passcodes.js`

---

## Operational Notes & Gotchas
- Approval rules are unanimous for group actions, expense/loan mutations, and settlements; design your UI/UX changes to respect that invariant.
- Session verification runs every 5 minutes; devtools tweaks to Pinia/sessionStorage won’t bypass it.
- Group member visibility: mobile numbers are masked outside the active group; pass `displayMobileForGroup` helpers when adding new UI.
- Shared loans are designed for two-party groups; larger groups only get a warning (not a hard block).
- Receipts rely on Cloudinary; ensure the unsigned upload preset exists and is limited to images.

Happy hacking!
