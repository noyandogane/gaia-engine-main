import { test, expect } from '@playwright/test'

test('basic smoke test', async ({ page }) => {
  await page.goto('/')

  // Check that page loads without crashing
  await expect(page).toHaveTitle(/Modern Web App/)

  // Wait for page to load
  await page.waitForTimeout(3000)

  // Check that page has some content
  const body = page.locator('body')
  await expect(body).toBeVisible()

  // Check for any canvas element
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
})