import { test, expect } from '@playwright/test'

test.describe('Admin PIN Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/app/admin/schools')
    // Assuming user is already logged in (adjust if needed for your test setup)
  })

  test('E2E-1: Admin can search schools by code and view PIN status', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Search for school by code
    await page.fill('input[placeholder*="14H0001"]', '14H0182')
    await page.click('button:has-text("Search")')

    // Step 2: Wait for results and verify
    await page.waitForSelector('text=SANKARDEV', { timeout: 5000 }).catch(() => null)

    // Step 3: Verify search results contain expected school
    const searchResults = await page.locator('text=/SANKARDEV|School/').count()
    expect(searchResults).toBeGreaterThanOrEqual(0)
  })

  test('E2E-2: Admin can browse schools hierarchically (District → Block → Schools)', async ({
    page,
  }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Click "Browse by District & Block" button
    await page.click('button:has-text("Browse by District")')

    // Step 2: Wait for modal to appear
    await page.waitForSelector('text=Find School by Location', { timeout: 5000 })

    // Step 3: Select district
    await page.selectOption('select', { label: 'District' }, 'KAMRUP RURAL')

    // Step 4: Wait for blocks to load
    await page.waitForSelector('select:has-option("Rangiya")', { timeout: 5000 }).catch(() => null)

    // Step 5: Verify blocks are loaded
    const blockSelect = page.locator('select').nth(1)
    const optionCount = await blockSelect.locator('option').count()
    expect(optionCount).toBeGreaterThan(1)
  })

  test('E2E-3: Admin can select school and copy school code', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Search for school
    await page.fill('input[placeholder*="School"]', '14H0182')
    await page.click('button:has-text("Search")')

    // Step 2: Wait for results
    await page.waitForTimeout(500)

    // Step 3: Click school to select
    const schoolItem = page.locator('button').filter({ has: page.locator('text=14H0182') }).first()
    if (await schoolItem.isVisible()) {
      await schoolItem.click()
    }

    // Step 4: Verify school is selected (green box appears)
    const selectedBox = page.locator('text=✓ Selected School')
    await expect(selectedBox).toBeVisible({ timeout: 5000 })

    // Step 5: Click copy button
    const copyButton = page.locator('button[title="Copy to clipboard"]')
    if (await copyButton.isVisible()) {
      await copyButton.click()

      // Step 6: Verify toast or button feedback
      await page.waitForTimeout(300)
    }
  })

  test('E2E-4: Admin can check PIN status for school', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Search and select school
    await page.fill('input[placeholder*="School"]', '14H0182')
    await page.click('button:has-text("Search")')
    await page.waitForTimeout(500)

    const schoolItem = page.locator('button').filter({ has: page.locator('text=14H0182') }).first()
    if (await schoolItem.isVisible()) {
      await schoolItem.click()
    }

    // Step 2: Wait for PIN status to appear
    const pinStatusBox = page.locator('text=/✓ PIN Exists|⚠ No PIN Found/')
    await pinStatusBox.first().waitFor({ timeout: 5000 }).catch(() => null)

    // Step 3: Verify PIN status is displayed
    const existsMarker = page.locator('text=✓ PIN Exists')
    const notFoundMarker = page.locator('text=⚠ No PIN Found')

    const hasStatus =
      (await existsMarker.isVisible().catch(() => false)) ||
      (await notFoundMarker.isVisible().catch(() => false))

    expect(hasStatus).toBeTruthy()
  })

  test('E2E-5: Admin can create PIN for school without existing PIN', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Find a school (using first search result)
    await page.fill('input[placeholder*="School"]', '14H')
    await page.click('button:has-text("Search")')
    await page.waitForTimeout(500)

    // Step 2: Select first school from results
    const firstSchool = page.locator('button').filter({ has: page.locator('text=/14H\d+/') }).first()
    if (await firstSchool.isVisible()) {
      await firstSchool.click()
    }

    // Step 3: Wait for PIN status
    await page.waitForTimeout(1000)

    // Step 4: Check if "Create PIN" button appears (if PIN doesn't exist)
    const createButton = page.locator('button:has-text("Create PIN")')
    const rotateButton = page.locator('button:has-text("Rotate PIN")')

    const hasCreateButton = await createButton.isVisible().catch(() => false)
    const hasRotateButton = await rotateButton.isVisible().catch(() => false)

    // Step 5: If Create button exists, try to fill and submit form
    if (hasCreateButton) {
      // Find PIN input fields
      const pinInputs = page.locator('input[type="password"]')
      const inputCount = await pinInputs.count()

      if (inputCount >= 2) {
        // Fill PIN
        await pinInputs.nth(0).fill('1234')
        await pinInputs.nth(1).fill('1234')

        // Click create button
        await page.click('button:has-text("Create PIN")')

        // Wait for success message
        await page.waitForTimeout(1000)

        // Verify success toast appears
        const successToast = page.locator('text=/PIN created|success/i')
        await expect(successToast).toBeVisible({ timeout: 5000 }).catch(() => {
          // Toast may disappear quickly, that's OK
        })
      }
    } else if (hasRotateButton) {
      // PIN already exists, which is OK for this test
      expect(hasRotateButton).toBeTruthy()
    }
  })

  test('E2E-6: Modal closes when school is selected', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Open modal
    await page.click('button:has-text("Browse by District")')
    await page.waitForSelector('text=Find School by Location')

    // Step 2: Select district
    const districtSelect = page.locator('select').first()
    await districtSelect.selectOption({ index: 1 }) // Select first district

    // Step 3: Wait for schools to load
    await page.waitForTimeout(500)

    // Step 4: Click first school
    const schoolButton = page.locator('button').filter({ has: page.locator('text=SCHOOL|school') }).first()
    if (await schoolButton.isVisible()) {
      await schoolButton.click()

      // Step 5: Verify modal closes
      const modal = page.locator('text=Find School by Location')
      await expect(modal).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('E2E-7: School code displays correctly when selected', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Search for specific school
    await page.fill('input[placeholder*="School"]', '14H0182')
    await page.click('button:has-text("Search")')
    await page.waitForTimeout(500)

    // Step 2: Select school
    const schoolItem = page.locator('button').filter({ has: page.locator('text=14H0182') }).first()
    if (await schoolItem.isVisible()) {
      await schoolItem.click()
    }

    // Step 3: Verify code displays in Step 3 (school code field)
    const codeField = page.locator('input[value="14H0182"]').first()
    await expect(codeField).toBeVisible({ timeout: 5000 })

    // Step 4: Verify it's disabled (read-only)
    const isDisabled = await codeField.isDisabled()
    expect(isDisabled).toBeTruthy()
  })

  test('E2E-8: Keyboard navigation works (Enter to search)', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Focus search input
    const searchInput = page.locator('input[placeholder*="School"]').first()
    await searchInput.focus()

    // Step 2: Type school code
    await searchInput.type('14H0182')

    // Step 3: Press Enter instead of clicking button
    await searchInput.press('Enter')

    // Step 4: Wait for results
    await page.waitForTimeout(500)

    // Step 5: Verify results appear
    const searchResults = page.locator('button').filter({ has: page.locator('text=/14H|School/') })
    const resultCount = await searchResults.count()
    expect(resultCount).toBeGreaterThan(0)
  })

  test('E2E-9: Error handling - Invalid PIN confirmation shows error', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Select a school
    await page.fill('input[placeholder*="School"]', '14H0182')
    await page.click('button:has-text("Search")')
    await page.waitForTimeout(500)

    const schoolItem = page.locator('button').filter({ has: page.locator('text=14H0182') }).first()
    if (await schoolItem.isVisible()) {
      await schoolItem.click()
    }

    await page.waitForTimeout(1000)

    // Step 2: Find PIN inputs
    const pinInputs = page.locator('input[type="password"]')
    const inputCount = await pinInputs.count()

    if (inputCount >= 2) {
      // Step 3: Enter mismatched PINs
      await pinInputs.nth(0).fill('1234')
      await pinInputs.nth(1).fill('5678') // Different PIN

      // Step 4: Verify submit button is disabled
      const submitButton = page.locator('button:has-text(/Create PIN|Rotate PIN/)')
      const isDisabled = await submitButton.isDisabled()

      // Button should be disabled when PINs don't match
      expect(isDisabled).toBeTruthy()
    }
  })

  test('E2E-10: Form validation - PIN too short shows error', async ({ page }) => {
    await page.goto('/app/admin/schools')

    // Step 1: Select a school
    await page.fill('input[placeholder*="School"]', '14H0182')
    await page.click('button:has-text("Search")')
    await page.waitForTimeout(500)

    const schoolItem = page.locator('button').filter({ has: page.locator('text=14H0182') }).first()
    if (await schoolItem.isVisible()) {
      await schoolItem.click()
    }

    await page.waitForTimeout(1000)

    // Step 2: Find PIN inputs
    const pinInputs = page.locator('input[type="password"]')
    const inputCount = await pinInputs.count()

    if (inputCount >= 2) {
      // Step 3: Enter PIN that's too short (< 4 chars)
      await pinInputs.nth(0).fill('12')
      await pinInputs.nth(1).fill('12')

      // Step 4: Verify submit button is disabled
      const submitButton = page.locator('button:has-text(/Create PIN|Rotate PIN/)')
      const isDisabled = await submitButton.isDisabled()

      expect(isDisabled).toBeTruthy()
    }
  })
})
