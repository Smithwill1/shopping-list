import { expect, test } from '@playwright/test'

test('shows the sign-in screen when signed out', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /shopping list/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^sign in$/i })).toBeVisible()
})

test('shows a validation error for a blank email', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Password').fill('longenough')
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page.getByRole('alert')).toContainText(/email is required/i)
})
