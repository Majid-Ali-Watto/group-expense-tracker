import { test, expect } from '@playwright/test'
import {
  ensureGroupSelected,
  firstJoinedGroupId,
  login
} from './helpers/auth'
import {
  e2eEnv,
  hasBugResolverCredentials,
  hasLoginCredentials
} from './helpers/env'

test.describe('Authenticated smoke coverage', () => {
  test.setTimeout(60_000)

  test.skip(
    !hasLoginCredentials,
    'Set E2E_EMAIL and E2E_PASSWORD to run authenticated smoke tests.'
  )

  test('core tabs render after login', async ({ page }) => {
    await login(page)
    await page.goto('/groups')

    await expect(page.locator('.el-tabs__item', { hasText: 'Groups' }).first())
      .toBeVisible({ timeout: 15000 })
    await expect(page.locator('.el-tabs__item', { hasText: 'Users' }).first())
      .toBeVisible({ timeout: 15000 })
    await expect(
      page.locator('.el-tabs__item', { hasText: 'Personal Expenses' }).first()
    ).toBeVisible({ timeout: 15000 })
    await expect(
      page.locator('.el-tabs__item', { hasText: 'Personal Loans' }).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('shared tabs open once a group is selected', async ({ page, isMobile }) => {
    await login(page)
    await ensureGroupSelected(page)

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page
        .locator('.mobile-dropdown-menu')
        .getByText('Shared Expenses', { exact: true })
        .click()
    } else {
      await page
        .locator('.el-tabs__item', { hasText: 'Shared Expenses' })
        .first()
        .click()
    }
    await expect(page).toHaveURL(/\/shared-expenses\//)

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page
        .locator('.mobile-dropdown-menu')
        .getByText('Shared Loans', { exact: true })
        .click()
    } else {
      await page
        .locator('.el-tabs__item', { hasText: 'Shared Loans' })
        .first()
        .click()
    }
    await expect(page).toHaveURL(/\/shared-loans\//)

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page
        .locator('.mobile-dropdown-menu')
        .getByText('Users', { exact: true })
        .click()
    } else {
      await page.locator('.el-tabs__item', { hasText: 'Users' }).first().click()
    }
    await expect(page).toHaveURL(/\/users$/)

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page
        .locator('.mobile-dropdown-menu')
        .getByText('Personal Expenses', { exact: true })
        .click()
    } else {
      await page
        .locator('.el-tabs__item', { hasText: 'Personal Expenses' })
        .first()
        .click()
    }
    await expect(page).toHaveURL(/\/personal-expenses$/)

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page
        .locator('.mobile-dropdown-menu')
        .getByText('Personal Loans', { exact: true })
        .click()
    } else {
      await page
        .locator('.el-tabs__item', { hasText: 'Personal Loans' })
        .first()
        .click()
    }
    await expect(page).toHaveURL(/\/personal-loans$/)
  })

  test('header current-page share control is present on desktop and mobile', async ({
    page,
    isMobile
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload) => {
          window.__lastSharePayload = payload
        }
      })
    })

    await login(page)
    await page.goto('/groups')

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page.getByText('Share This Page').click()
    } else {
      await page.locator('button[title="Share current page"]').click()
    }

    const sharedPayload = await page.evaluate(() => window.__lastSharePayload)
    expect(sharedPayload.url).toContain('/groups')
  })

  test('expenses summary dialog opens from header', async ({ page, isMobile }) => {
    await login(page)
    await page.goto('/groups')

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page
        .locator('.mobile-dropdown-menu')
        .getByText('Expenses Summary', { exact: true })
        .click()
    } else {
      await page.getByRole('button', { name: 'Expenses Summary' }).click()
    }

    await expect(
      page.getByRole('dialog', { name: 'View Expenses Summary' })
    ).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Yes, Calculate' }).click()

    await expect(
      page.getByRole('dialog', { name: 'Your Expenses Summary' })
    ).toBeVisible({ timeout: 20000 })
  })

  test('shared groups route resolves joined groups from URL', async ({ page }) => {
    await login(page)
    const groupId = await firstJoinedGroupId(page)

    await page.goto(`/shared-groups?ids=${groupId}`)

    await expect(page.getByText('Shared Groups')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Select$/ })).toBeVisible()
  })

  test('groups page shows join affordance for available groups when present', async ({
    page
  }) => {
    await login(page)
    await page.goto('/groups')

    const availableSection = page.getByText('Available Groups')
    await expect(availableSection).toBeVisible({ timeout: 15000 })

    if (e2eEnv.availableGroupName) {
      const card = page
        .locator('div.border.border-gray-200.rounded-lg.p-4')
        .filter({ hasText: e2eEnv.availableGroupName })
        .first()
      await expect(card).toBeVisible()
      await expect(
        card.getByRole('button', {
          name: /Request to Join|Cancel Request/
        })
      ).toBeVisible()
      return
    }

    const joinButtons = page.getByRole('button', {
      name: /Request to Join|Cancel Request/
    })
    if ((await joinButtons.count()) > 0) {
      await expect(joinButtons.first()).toBeVisible()
    }
  })
})

test.describe('Optional bug resolver coverage', () => {
  test.setTimeout(60_000)

  test.skip(
    !hasBugResolverCredentials,
    'Set E2E_BUG_RESOLVER_EMAIL and E2E_BUG_RESOLVER_PASSWORD to run bug resolver smoke tests.'
  )

  test('bug reports admin route loads for bug resolver', async ({ page, isMobile }) => {
    await login(page, {
      email: e2eEnv.bugResolverEmail,
      password: e2eEnv.bugResolverPassword
    })

    if (isMobile) {
      await page.locator('.hamburger-btn').click()
      await page
        .locator('.mobile-dropdown-menu')
        .getByText('Bug Reports', { exact: true })
        .click()
    } else {
      const bugReportsTab = page
        .locator('.el-tabs__item', { hasText: 'Bug Reports' })
        .first()

      await expect(bugReportsTab).toBeVisible({ timeout: 15000 })
      await bugReportsTab.click()
    }

    await expect(page).toHaveURL(/\/bug-reports$/, { timeout: 15000 })
    await expect(page.locator('.bra-page').first()).toBeVisible({ timeout: 15000 })
  })
})
