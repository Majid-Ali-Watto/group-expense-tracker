import { expect } from '@playwright/test'
import { e2eEnv } from './env'

export async function login(page, creds = {}) {
  const email = creds.email || e2eEnv.email
  const password = creds.password || e2eEnv.password

  if (!email || !password) {
    throw new Error('Missing E2E login credentials.')
  }

  await page.goto('/login')
  await page.getByPlaceholder('Enter your email address').fill(email)
  await page
    .getByPlaceholder('Enter your password (6-15 characters)')
    .fill(password)
  await page.getByRole('button', { name: /^Login$/ }).click()

  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
  await expect(
    page.getByText('Kharchafy', { exact: true }).first()
  ).toBeVisible({ timeout: 15000 })
}

export async function ensureGroupSelected(page) {
  await page.goto('/groups')

  await expect(
    page.locator('.el-tabs__item', { hasText: 'Groups' }).first()
  ).toBeVisible({ timeout: 15000 })

  const sharedExpensesTab = page
    .locator('.el-tabs__item', { hasText: 'Shared Expenses' })
    .first()

  if ((await sharedExpensesTab.count()) > 0) {
    return
  }

  const selectButton = page.getByRole('button', { name: /^Select$/ }).first()
  await expect(selectButton).toBeVisible({ timeout: 15000 })
  await selectButton.click()

  await expect(page).toHaveURL(/\/groups$/, { timeout: 15000 })
}

export async function firstJoinedGroupId(page) {
  await page.goto('/groups')
  const firstGroupCard = page.locator('[id^="group-card-"]').first()
  await expect(firstGroupCard).toBeVisible({ timeout: 15000 })
  const idAttr = await firstGroupCard.getAttribute('id')

  if (!idAttr) {
    throw new Error('Could not find a joined group card id.')
  }

  return idAttr.replace('group-card-', '')
}
