import { test, expect } from '@playwright/test'

test.describe('Public routes and unauthenticated guards', () => {
  test('login page loads and supports register toggle', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText('Kharchafy', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Login$/ })).toBeVisible()

    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByLabel('Mobile Number')).toBeVisible()
  })

  test('protected routes redirect to login with redirect query', async ({
    page
  }) => {
    await page.goto('/groups')
    await expect(page).toHaveURL(/\/login\?redirect=\/groups/)

    await page.goto('/shared-groups?ids=abc123')
    await expect(page).toHaveURL(
      /\/login\?redirect=\/shared-groups\?ids=abc123/
    )
  })
})
