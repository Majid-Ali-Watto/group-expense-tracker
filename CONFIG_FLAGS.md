# Configuration Flags

This file documents the current Firestore configuration flags, where they are used in the app, and who should edit them.

## Global Configs

| Firestore Path | Field / Structure | Used In | Default If Missing | Who Can Edit |
| --- | --- | --- | --- | --- |
| `configs/storage` | `cloudinary: boolean` | Receipt/image upload provider selection | Enabled | Admin / DB maintainer |
| `configs/storage` | `firebase: boolean` | Receipt/image upload provider selection | Enabled | Admin / DB maintainer |
| `configs/storage` | `upload_allowed: boolean` | Show/hide receipt upload field in all expense/loan forms | Show upload field | Admin / DB maintainer |
| `configs/cache` | `isCached: boolean` | Cache enable/disable behavior | Enabled | Admin / DB maintainer |
| `configs/downloads` | `pdf: boolean` | Show/hide PDF download buttons in shared tables | Show PDF button | Admin / DB maintainer |
| `configs/downloads` | `excel: boolean` | Show/hide Excel download buttons in shared tables | Show Excel button | Admin / DB maintainer |
| `configs/manage-tabs` | `showManageTab: boolean` | Show/hide the `Manage Tabs` option globally in header/mobile menu | Show `Manage Tabs` option | Admin / DB maintainer |
| `configs/bugs` | `report: boolean` | Show/hide bug report actions | Show bug report option | Admin / DB maintainer |
| `configs/email` | `send: boolean` | Gate all shared activity email notifications globally | Send emails | Admin / DB maintainer |
| `configs/email` | `free_email_limit_per_month: number` | Monthly email notification limit for free (non-billed) users | Unlimited | Admin / DB maintainer |
| `configs/email` | `paid_emails_limit_per_month: number` | Monthly email notification limit for billed users | Unlimited | Admin / DB maintainer |
| `configs/ocr` | `extract_allowed: boolean` | Show/hide the Extract Text button on receipt upload fields | Show extract button | Admin / DB maintainer |
| `configs/ocr` | `free_extraction_limit_per_month: number` | Monthly OCR extraction limit for free (non-billed) users | Unlimited | Admin / DB maintainer |
| `configs/ocr` | `paid_extraction_limit_per_month: number` | Monthly OCR extraction limit for billed users | Unlimited | Admin / DB maintainer |

## Per-User Account Data

Document path: `users/{uid}`

| Field | Purpose | Used In | Default If Missing | Who Can Edit |
| --- | --- | --- | --- | --- |
| `uid` | Identifies the user account | Auth/profile lookup and validation | Derived from document id / auth user | System / Admin |
| `name` | Display name | Profile UI, user lists, activity labels | Empty string | User for own profile, Admin |
| `mobile` | User mobile number | Profile UI, user lists, ownership checks | Empty string | User for own profile, Admin |
| `email` | User email address | Auth/profile UI, notifications | Empty string | System / Admin |
| `emailVerified` | Whether the email is verified | Auth/login guards, user lists | `false` | System / Admin |
| `photoUrl` | Profile photo URL | Header/profile/user cards | Empty string | User for own profile, Admin |
| `photoMeta` | Profile photo upload metadata | Profile photo replacement/removal | `null` | User for own profile, Admin |
| `blocked` | Whether the account is blocked by admin | App-wide interaction guards | `false` | Admin / DB maintainer only |
| `billedUser` | Whether the user is on a paid plan | OCR and email limit selection (free vs paid tier) | `false` (free tier) | Admin / DB maintainer only |
| `bugResolver` | Whether the user can access bug resolver/admin bug flows | Bug resolver visibility and routing | `false` | Admin / DB maintainer only |
| `isAdmin` | Whether the user can access admin config pages | Admin route/header visibility | `false` | Admin / DB maintainer only |
| `addedBy` | Optional source/reference for how the user was created | User notifications / metadata | Missing | System / Admin |
| `deleteRequest` | Pending delete approval flow data | Users tab notifications and approval flow | `null` | System / workflow |
| `updateRequest` | Pending update approval flow data | Users tab notifications and approval flow | `null` | System / workflow |
| `rejectionNotification` | Rejection notice for a user request | Global notifications / users UI | `null` | System / workflow |

## Per-User Tab Config

Document path: `user-tab-configs/{uid}`

| Field | Purpose | Used In | Default If Missing | Who Can Edit |
| --- | --- | --- | --- | --- |
| `uid` | Identifies the config owner | Lookup and validation | Derived from document id / current user | System / Admin |
| `groups` | Access to Groups tab | App tabs, redirects, route guard | Included for shared flow when config is created | User for own config, Admin |
| `users` | Access to Users tab | App tabs, redirects, route guard | Hidden | User for own config, Admin |
| `sharedExpenses` | Access to Shared Expenses tab | App tabs, redirects, route guard | Hidden | User for own config, Admin |
| `sharedLoans` | Access to Shared Loans tab | App tabs, redirects, route guard | Hidden | User for own config, Admin |
| `personalExpenses` | Access to Personal Expenses tab | App tabs, redirects, route guard | Hidden | User for own config, Admin |
| `personalLoans` | Access to Personal Loans tab | App tabs, redirects, route guard | Hidden | User for own config, Admin |
| `accessManageTabs` | Per-user override for showing `Manage Tabs` option | Header/mobile menu visibility | Show `Manage Tabs` option | Admin / DB maintainer only |
| `emailSharedExpenses` | Whether to send group email notifications when user adds a shared expense | `sendSharedActivityEmail` guard | `true` (opt-in) | User (via tab config dialog) |
| `emailSharedLoans` | Whether to send group email notifications when user adds a shared loan | `sendSharedActivityEmail` guard | `true` (opt-in) | User (via tab config dialog) |
| `ocrExtractions` | Map of `{ "YYYY-MM": count }` tracking OCR extractions per month | `useOcrLimit` — enforce monthly limit | `{}` | System (auto-incremented on each extraction) |
| `emailsSent` | Map of `{ "YYYY-MM": count }` tracking email notifications triggered per month | `useEmailLimit` — enforce monthly limit | `{}` | System (auto-incremented on each email send) |
| `hideBlockedUsers` | Persisted Users-page filter preference | Users tab filter state | `false` | User for own config, Admin |
| `hideBlockedGroups` | Persisted Groups-page filter preference | Groups tab filter state | `false` | User for own config, Admin |

## Notes

- `configs/*` flags are real-time and update in the UI without a page reload.
- `configs/downloads` hides only the related buttons. Missing fields are treated as enabled.
- `configs/manage-tabs.showManageTab` is a global flag.
- `user-tab-configs/{uid}.accessManageTabs` is a per-user flag.
- `users/{uid}.billedUser` is the source of truth for free vs paid limits.
- `Manage Tabs` is shown only when both conditions allow it:
  - global `configs/manage-tabs.showManageTab` is not `false`
  - per-user `user-tab-configs/{uid}.accessManageTabs` is not `false`
- OCR extract button is hidden when `configs/ocr.extract_allowed` is `false` (shows "coming soon" message) or when the user's monthly limit is reached (shows limit message).
- Email notifications are suppressed when the global `configs/email.send` is `false`, when the user has opted out via `emailSharedExpenses`/`emailSharedLoans`, or when their monthly `emailsSent` count reaches their tier limit.
- `billedUser`, `blocked`, `bugResolver`, and `isAdmin` should not be editable by users from the client UI.
- `accessManageTabs`, `ocrExtractions`, and `emailsSent` should not be editable by users from the client UI.
- To upgrade a user to the paid tier, set `users/{uid}.billedUser = true`.
