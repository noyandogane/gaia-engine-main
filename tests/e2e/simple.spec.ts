import { test, expect } from '@playwright/test'

test('page loads', async ({ page }) => {
  console.log('Starting test...')
  await page.goto('/')
  console.log('Page loaded')
  
  const title = await page.title()
  console.log('Page title:', title)
  
  await expect(page).toHaveTitle(/Modern Web App/)
})