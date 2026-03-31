# Pre-Deployment Test Cases

This checklist is for manual regression before release. It is organized by feature so you can run:

- A quick smoke pass for small changes
- A full regression pass for major releases
- A targeted retest for bug fixes

## Recommended Test Data

Keep these users and groups available in your test environment:

- `owner_user`: group owner
- `member_user`: regular member
- `third_user`: extra member for 3+ member flows
- `non_member_user`: authenticated user not in the target group
- `bug_resolver_user`: user with `bugResolver: true`

Keep these groups available:

- `group_two_members`: 2-member group
- `group_three_members`: 3-member group
- `group_with_pending_requests`: group with open join/edit/delete/member requests
- `group_with_shared_expenses`: group with active shared expense records
- `group_with_shared_loans`: group with active shared loan records

## Release Levels

### Smoke Pass

Run these before every deployment:

- Auth: login, logout, refresh session
- Header: notifications, theme toggle, share current URL, expenses summary dialog
- Groups: load groups, select group, request to join available group, share group link
- Shared Groups route: open shared link, confirm `Join` or `Select`
- Shared Expenses: create payment, edit/delete request path, settlement screen loads
- Shared Loans: create loan, edit/delete request path
- Personal Expenses: add salary, add personal expense
- Personal Loans: add loan, filter, summary loads
- Users: list loads, search works
- Bug Reports: submit bug report, admin list loads for bug resolver
- Mobile: test header menu, share actions, critical form submit

### Full Regression

Run all sections below for major releases, schema changes, auth changes, routing changes, mobile/PWA changes, or approval-flow changes.

## Global / App Shell

- `APP-01`: App loads without console-crashing errors on desktop.
- `APP-02`: App loads without console-crashing errors on mobile.
- `APP-03`: Refresh on a protected route restores the same route after auth restore.
- `APP-04`: Unknown route redirects correctly to `/login` when logged out.
- `APP-05`: Unknown route redirects correctly to `/groups` when logged in.
- `APP-06`: Theme toggle works on desktop.
- `APP-07`: Theme toggle works from mobile hamburger menu.
- `APP-08`: Notification bell opens and closes correctly.
- `APP-09`: Clicking a notification navigates to the expected feature.
- `APP-10`: Header “Share current page” opens native share sheet where supported.
- `APP-11`: Header share falls back to clipboard or manual copy when native share is unavailable.
- `APP-12`: Expenses Summary dialog opens from desktop header.
- `APP-13`: Expenses Summary dialog opens from mobile menu.
- `APP-14`: Expenses Summary PDF download works.
- `APP-15`: All header controls remain usable on narrow screens.

## Authentication & Session

- `AUTH-01`: Register with valid data creates account and sends verification email flow.
- `AUTH-02`: Login with valid credentials succeeds.
- `AUTH-03`: Login with invalid credentials shows safe error message.
- `AUTH-04`: Unverified email cannot log in.
- `AUTH-05`: Password reset flow returns user to app correctly.
- `AUTH-06`: Session survives page refresh when Firebase auth is still valid.
- `AUTH-07`: Logout clears protected access and returns user to `/login`.
- `AUTH-08`: Visiting a protected route while logged out redirects to `/login?redirect=...`.
- `AUTH-09`: After login, redirect returns user to the intended protected route.
- `AUTH-10`: Bug resolver route is blocked for non-bug-resolver users.

## Groups Tab

### Group List / Navigation

- `GRP-01`: Joined Groups list loads.
- `GRP-02`: Available Groups list loads.
- `GRP-03`: Search by group name works.
- `GRP-04`: Search by owner/member text works.
- `GRP-05`: Sort A→Z works.
- `GRP-06`: Sort Z→A works.
- `GRP-07`: Filter by member works.
- `GRP-08`: Filter by category works.
- `GRP-09`: Selecting a joined group updates active group and related tabs.
- `GRP-10`: Pinned groups stay at the top of joined groups.

### Group Creation / Editing

- `GRP-11`: Create group with valid members succeeds.
- `GRP-12`: Creator is automatically included in new group.
- `GRP-13`: Duplicate-name protections work for same owner/member conflict cases.
- `GRP-14`: Owner can open edit dialog and submit valid edits.
- `GRP-15`: Non-owner cannot perform owner-only edit actions.

### Join / Invite / Leave / Ownership

- `GRP-16`: Pending invitation appears in the Pending Invitations section.
- `GRP-17`: Accept invitation adds user to members.
- `GRP-18`: Decline invitation removes pending invite state.
- `GRP-19`: Available group shows `Request to Join`.
- `GRP-20`: Join request creates pending approval state.
- `GRP-21`: Existing member can approve join request.
- `GRP-22`: Reject join request removes request and notifies requester.
- `GRP-23`: Owner transfer dialog opens for eligible groups.
- `GRP-24`: Ownership transfer request can be created and approved.
- `GRP-25`: Leave group works only when allowed.
- `GRP-26`: Leave is blocked when group-level requests are pending.
- `GRP-27`: Leave is blocked when settlement request is pending.
- `GRP-28`: Leave is blocked when user still has active shared expenses or loans.
- `GRP-29`: Leaving as owner in a 2-member group transfers ownership correctly.

### Group Delete / Member Requests

- `GRP-30`: Owner can create delete request.
- `GRP-31`: Members can approve delete request.
- `GRP-32`: Members can reject delete request.
- `GRP-33`: Add-member request can be created.
- `GRP-34`: Add-member request approval flow works.
- `GRP-35`: Add-member finalization works after all approvals.

### Group Sharing

- `GRP-36`: Share single group works from joined group actions.
- `GRP-37`: Share Joined button creates usable link.
- `GRP-38`: Share Pinned button creates usable link.
- `GRP-39`: Group sharing works on mobile.
- `GRP-40`: Group sharing fallback does not crash when clipboard API is unavailable.

## Shared Groups Route

- `SG-01`: Opening `/shared-groups?ids=...` while logged out redirects to login.
- `SG-02`: After login, redirect returns user to the shared groups page.
- `SG-03`: Shared groups page loads listed groups from URL ids.
- `SG-04`: Missing/deleted shared groups show warning but do not break the page.
- `SG-05`: Non-member sees `Join`.
- `SG-06`: Existing member sees `Select`.
- `SG-07`: Pending join request shows disabled pending state.
- `SG-08`: Clicking `Select` sets active group and returns to Groups.
- `SG-09`: Clicking `Join` creates join request or accepts invitation when applicable.

## Shared Expenses Tab

### Basic CRUD

- `EXP-01`: Shared Expenses tab opens for selected group.
- `EXP-02`: Add payment with single payer and equal split succeeds.
- `EXP-03`: Add payment with multiple payers succeeds.
- `EXP-04`: Add payment with custom split succeeds.
- `EXP-05`: Validation blocks mismatched payer totals.
- `EXP-06`: Validation blocks mismatched split totals.
- `EXP-07`: Receipt upload succeeds with valid image.
- `EXP-08`: Oversized/invalid receipt is rejected safely.
- `EXP-09`: Month filter loads correct data.
- `EXP-10`: Payer filter works.
- `EXP-11`: Split mode / payer mode filters work.

### Approval Flows

- `EXP-12`: Edit request can be created.
- `EXP-13`: Delete request can be created.
- `EXP-14`: Pending request is visible to other members.
- `EXP-15`: Member approval applies request after all approvals.
- `EXP-16`: Rejection cancels request and preserves original record.
- `EXP-17`: Updated receipts clean up old assets correctly.

### Settlement

- `EXP-18`: Settlement panel computes pairwise settlements.
- `EXP-19`: Settlement request can be created.
- `EXP-20`: Members can approve settlement request.
- `EXP-21`: Members can reject/cancel settlement request.
- `EXP-22`: Finalize settlement moves records out of active month.
- `EXP-23`: Settled month no longer appears in active data.

### Export / Responsive

- `EXP-24`: PDF export works.
- `EXP-25`: Excel export works.
- `EXP-26`: Table and dialogs remain usable on mobile.

## Shared Loans Tab

- `LOAN-01`: Shared Loans tab opens for selected group.
- `LOAN-02`: Guard message appears for unsupported 3+ member cases if expected.
- `LOAN-03`: Add shared loan succeeds.
- `LOAN-04`: Edit request flow works.
- `LOAN-05`: Delete request flow works.
- `LOAN-06`: Loan approvals apply after all required approvals.
- `LOAN-07`: Loan rejection preserves original record.
- `LOAN-08`: Loan summary/balance cards load correctly.
- `LOAN-09`: Loan PDF export works.
- `LOAN-10`: Loan Excel export works.
- `LOAN-11`: Mobile layout is usable.

## Personal Expenses Tab

- `PE-01`: Personal Expenses tab loads.
- `PE-02`: Salary can be added/updated for selected month.
- `PE-03`: Personal expense can be added.
- `PE-04`: Personal expense can be edited.
- `PE-05`: Personal expense can be deleted.
- `PE-06`: Remaining budget updates correctly after salary/expense changes.
- `PE-07`: Month switch loads correct salary and expenses.
- `PE-08`: PDF export works.
- `PE-09`: Excel export works.
- `PE-10`: Mobile layout is usable.

## Personal Loans Tab

- `PL-01`: Personal Loans tab loads.
- `PL-02`: Add personal loan succeeds.
- `PL-03`: Edit personal loan succeeds.
- `PL-04`: Delete personal loan succeeds.
- `PL-05`: Month filter works.
- `PL-06`: “All” month view works if supported.
- `PL-07`: Filter by giver works.
- `PL-08`: “Select from Users” autofill works.
- `PL-09`: “ME?” autofill works.
- `PL-10`: Summary cards load correctly.
- `PL-11`: Pairwise settlements render correctly.
- `PL-12`: PDF export works.
- `PL-13`: Excel export works.

## Users Tab

- `USR-01`: Users list loads.
- `USR-02`: Search by name works.
- `USR-03`: Search by mobile works.
- `USR-04`: Sort A→Z works.
- `USR-05`: Sort Z→A works.
- `USR-06`: Shared Groups Only filter works.
- `USR-07`: Edit user name succeeds with valid input.
- `USR-08`: Invalid user name is blocked by validation.
- `USR-09`: Delete request flow works where approval is required.
- `USR-10`: Immediate delete path works where approval is not required.

## Bug Reports

### Reporter Side

- `BUG-01`: Bug report dialog opens from header.
- `BUG-02`: Guest can submit guest-allowed bug categories.
- `BUG-03`: Logged-in user can submit bug report.
- `BUG-04`: Screenshot upload works.
- `BUG-05`: My Reports list loads for logged-in user.
- `BUG-06`: Reporter can edit own report where allowed.
- `BUG-07`: Reporter can reopen report.
- `BUG-08`: Reporter note thread works.

### Admin Side

- `BUG-09`: Bug Reports admin route loads for bug resolver.
- `BUG-10`: Non-bug-resolver is blocked from bug admin route.
- `BUG-11`: Admin can filter by status, severity, and search query.
- `BUG-12`: Admin can update report status.
- `BUG-13`: Admin note thread works.
- `BUG-14`: Admin can delete report.

## Notifications

- `NOTIF-01`: Group action notifications appear for relevant users.
- `NOTIF-02`: Expense approval notifications appear.
- `NOTIF-03`: Loan approval notifications appear.
- `NOTIF-04`: Bug report notifications appear for reporter/admin.
- `NOTIF-05`: Dismissing a notification removes it from the current user’s view.
- `NOTIF-06`: Notification navigation opens the intended feature.

## Route / Refresh / Shareability

- `ROUTE-01`: Query-based filters survive refresh on Groups.
- `ROUTE-02`: Query-based filters survive refresh on Shared Expenses.
- `ROUTE-03`: Query-based filters survive refresh on Shared Loans.
- `ROUTE-04`: Query-based filters survive refresh on Users.
- `ROUTE-05`: Direct visit to `/shared-expenses/:groupId` works after refresh.
- `ROUTE-06`: Direct visit to `/shared-loans/:groupId` works after refresh.
- `ROUTE-07`: Shared current-page URL from header opens the same route on another device.
- `ROUTE-08`: Shared group link opens `/shared-groups` and remains usable after login.

## Mobile / PWA / Installed App

- `MOB-01`: Header actions are usable in installed Android app.
- `MOB-02`: Header share current page works in installed Android app.
- `MOB-03`: Group share actions work in installed Android app.
- `MOB-04`: Forms do not overflow horizontally on common mobile widths.
- `MOB-05`: Dialogs remain scrollable and closable on small screens.
- `MOB-06`: Hamburger navigation works.
- `MOB-07`: Back/forward navigation does not break active route state.

## Final Deployment Gate

Do not deploy if any of these fail:

- Authentication or redirect flow
- Group selection / active-group routing
- Shared expense create/edit/delete request flow
- Shared loan create/edit/delete request flow
- Settlement flow
- Any leave-group blocker related to unsettled balances/active transactions
- Header notifications or share actions
- Mobile critical flows
- `npm run build`

## Test Run Template

Use this block for each release:

```md
Release:
Environment:
Tester:
Date:

Smoke Pass: PASS / FAIL
Full Regression: PASS / FAIL / PARTIAL

Known Issues:
- 

Blocked Cases:
- 

Go / No-Go:
```
