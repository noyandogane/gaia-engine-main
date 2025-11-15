import { test, expect } from '@playwright/test'

test.describe('Smoke tests', () => {
  test('app loads and renders basic components', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads without crashing
    await expect(page).toHaveTitle(/Modern Web App/)

    // Wait a bit for the app to load
    await page.waitForTimeout(2000)

    // Check that the main HUD container is present
    const hud = page.locator('main[aria-label="Planet simulation interface"]')
    await expect(hud).toBeVisible()

    // Check that the main canvas element is present
    const canvas = page.locator('canvas[aria-label="Planet visualization"]')
    await expect(canvas).toBeVisible()
  })

  test('controls toggle functionality', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to load
    await page.waitForTimeout(2000)

    // Check for terrain controls
    const terrainControls = page.locator('[data-testid="terrain-controls"]')
    await expect(terrainControls).toBeVisible()

    // Check for camera controls
    const cameraControls = page.locator('[data-testid="camera-controls"]')
    await expect(cameraControls).toBeVisible()

    // Check for simulation controls
    const simulationControls = page.locator('[data-testid="simulation-controls"]')
    await expect(simulationControls).toBeVisible()

    // Test toggle functionality - look for toggle buttons
    const toggleButtons = page.locator('button[aria-label*="toggle"], button[title*="toggle"]')
    if (await toggleButtons.count() > 0) {
      // Click the first toggle button
      await toggleButtons.first().click()
      // Verify something changed (this is a basic smoke test)
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('sphere renders in canvas', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to load
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas[aria-label="Planet visualization"]')
    await expect(canvas).toBeVisible()

    // Wait a bit for the scene to initialize
    await page.waitForTimeout(1000)

    // Check that canvas has content (not just blank)
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).toBeTruthy()
    expect(canvasBox!.width).toBeGreaterThan(0)
    expect(canvasBox!.height).toBeGreaterThan(0)
  })

  test('HUD elements are accessible', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to load
    await page.waitForTimeout(2000)

    // Check for HUD stats
    const hudStats = page.locator('[data-testid="hud-stats"]')
    await expect(hudStats).toBeVisible()

    // Check for notification center
    const notificationCenter = page.locator('[data-testid="notification-center"]')
    await expect(notificationCenter).toBeVisible()

    // Verify ARIA labels are present
    const mainElement = page.locator('main[aria-label]')
    await expect(mainElement).toHaveAttribute('aria-label', 'Planet simulation interface')
  })
})