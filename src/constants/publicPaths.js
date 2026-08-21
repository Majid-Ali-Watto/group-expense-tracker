// Public marketing page paths — indexable in both supported locales, and
// the only routes that get prerendered as static HTML (see
// `ssgOptions.includedRoutes` in vite.config.js, which imports this file
// directly). Deliberately dependency-free: vite.config.js is evaluated by
// Vite's own config loader, outside the app's normal env-injected module
// graph, so anything it imports (like src/router/index.js, which pulls in
// Firebase and `import.meta.env.VITE_*`) is not safe to evaluate there.
export const PUBLIC_BASE_PATHS = {
  home: '/',
  features: '/features',
  groupExpenseTracker: '/group-expense-tracker',
  personalBudgetTracker: '/personal-budget-tracker',
  help: '/help',
  faq: '/faq'
}
