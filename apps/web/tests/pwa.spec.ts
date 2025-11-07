import { test, expect } from '@playwright/test'

test('PWA install banner appears', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ATAL AI/)
})
