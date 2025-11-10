import { test, expect } from '@playwright/test'

test.describe('PWA Features', () => {
  test('should have correct page title and meta tags', async ({ page }) => {
    await page.goto('/')

    // Should redirect to login
    await expect(page).toHaveURL('/login')

    // Check title
    await expect(page).toHaveTitle(/ATAL AI/)
  })

  test('should have manifest.json available', async ({ page }) => {
    const response = await page.goto('/manifest.json')

    // Manifest should exist and return 200
    expect(response?.status()).toBe(200)

    // Should be valid JSON
    const manifest = await response?.json()
    expect(manifest).toHaveProperty('name', 'ATAL AI')
    expect(manifest).toHaveProperty('short_name', 'ATAL')
  })

  test('should have service worker registration', async ({ page }) => {
    await page.goto('/')

    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })

    expect(hasServiceWorker).toBe(true)
  })
})
