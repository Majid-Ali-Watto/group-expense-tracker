/* global process */
export const e2eEnv = {
  email: process.env.E2E_EMAIL || '',
  password: process.env.E2E_PASSWORD || '',
  availableGroupName: process.env.E2E_AVAILABLE_GROUP_NAME || '',
  bugResolverEmail: process.env.E2E_BUG_RESOLVER_EMAIL || '',
  bugResolverPassword: process.env.E2E_BUG_RESOLVER_PASSWORD || ''
}

export const hasLoginCredentials = Boolean(
  e2eEnv.email && e2eEnv.password
)

export const hasBugResolverCredentials = Boolean(
  e2eEnv.bugResolverEmail && e2eEnv.bugResolverPassword
)
