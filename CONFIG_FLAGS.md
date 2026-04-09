# Configuration Flags

This file documents the current Firestore configuration flags, where they are used in the app, and who should edit them.

## Global Configs

| Firestore Path | Field / Structure | Used In | Default If Missing | Who Can Edit |
| --- | --- | --- | --- | --- |
| `configs/storage` | `cloudinary: boolean` | Receipt/image upload provider selection | App falls back to current local handling | Admin / DB maintainer |
| `configs/storage` | `firebase: boolean` | Receipt/image upload provider selection | App falls back to current local handling | Admin / DB maintainer |
| `configs/cache` | `isCached: boolean` | Cache enable/disable behavior | Existing app fallback behavior applies | Admin / DB maintainer |
| `configs/downloads` | `pdf: boolean` | Show/hide PDF download buttons in shared tables | Show PDF button | Admin / DB maintainer |
| `configs/downloads` | `excel: boolean` | Show/hide Excel download buttons in shared tables | Show Excel button | Admin / DB maintainer |
| `configs/manage-tabs` | `showManageTab: boolean` | Show/hide the `Manage Tabs` option globally in header/mobile menu | Show `Manage Tabs` option | Admin / DB maintainer |
| `configs/bugs` | `report: boolean` | Show/hide bug report actions | Show bug report option | Admin / DB maintainer |

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

## Notes

- `configs/*` flags are real-time and update in the UI without a page reload.
- `configs/downloads` hides only the related buttons. Missing fields are treated as enabled.
- `configs/manage-tabs.showManageTab` is a global flag.
- `user-tab-configs/{uid}.accessManageTabs` is a per-user flag.
- `Manage Tabs` is shown only when both conditions allow it:
  - global `configs/manage-tabs.showManageTab` is not `false`
  - per-user `user-tab-configs/{uid}.accessManageTabs` is not `false`
- Users can update their own tab booleans from the app UI.
- Users should not be allowed to change `accessManageTabs` from the client.
