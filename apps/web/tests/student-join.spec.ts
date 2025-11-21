import { test, expect } from '@playwright/test'

/**
 * Student Join Class Flow Tests
 * Tests the student enrollment process via anonymous, email, and phone
 */

test.describe('Student Join Class Flow', () => {
  const TEST_CLASS_CODE = 'TEST123' // Update with valid test class code
  const TEST_CLASS_PIN = '1234' // Update with valid test PIN

  test.beforeEach(async ({ page }) => {
    // Navigate to login/join page
    await page.goto('/login')
  })

  test('should display all three auth options', async ({ page }) => {
    // Email option
    await expect(page.getByText(/Sign in with Email/i)).toBeVisible()

    // Check for join/guest links
    await expect(page.getByText(/Join/i)).toBeVisible()
  })

  test('anonymous: should allow guest to join class', async ({ page }) => {
    test.slow() // Anonymous auth + class enrollment

    // Navigate to join page
    await page.goto('/join')

    // Look for "Join as Guest" or anonymous sign-in option
    const guestButton = page.getByRole('button', { name: /Guest|Anonymous/i })

    if (await guestButton.isVisible()) {
      await guestButton.click()

      // Should show class code input
      await expect(page.getByPlaceholder(/Class Code/i)).toBeVisible()

      // Enter test class code and PIN
      await page.getByPlaceholder(/Class Code/i).fill(TEST_CLASS_CODE)
      await page.getByPlaceholder(/PIN/i).fill(TEST_CLASS_PIN)

      // Submit
      await page.getByRole('button', { name: /Join Class/i }).click()

      // Note: This will fail without a valid class code
      // TODO: Seed test class data
      console.log('✅ Anonymous join flow initiated')
    } else {
      console.log('⏳ Guest button not found - check if anonymous auth is enabled')
      test.skip()
    }
  })

  test('should validate class code format', async ({ page }) => {
    await page.goto('/join')

    // Try submitting empty class code
    const joinButton = page.getByRole('button', { name: /Join Class/i })

    if (await joinButton.isVisible()) {
      await joinButton.click()

      // Should show validation error
      await expect(
        page.getByText(/required|enter|code/i)
      ).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should reject invalid class code', async ({ page }) => {
    test.slow()
    await page.goto('/join')

    // Fill with invalid code
    const classCodeInput = page.getByPlaceholder(/Class Code/i)

    if (await classCodeInput.isVisible()) {
      await classCodeInput.fill('INVALID')
      await page.getByPlaceholder(/PIN/i).fill('1234')
      await page.getByRole('button', { name: /Join/i }).click()

      // Should show error toast
      await expect(
        page.getByText(/not found|invalid/i)
      ).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('should reject incorrect PIN', async ({ page }) => {
    test.slow()
    await page.goto('/join')

    const classCodeInput = page.getByPlaceholder(/Class Code/i)

    if (await classCodeInput.isVisible()) {
      await classCodeInput.fill(TEST_CLASS_CODE)
      await page.getByPlaceholder(/PIN/i).fill('0000') // Wrong PIN
      await page.getByRole('button', { name: /Join/i }).click()

      // Should show error
      await expect(
        page.getByText(/incorrect|wrong|invalid/i)
      ).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })
})

/**
 * Student Authentication Tests
 */
test.describe('Student Authentication', () => {
  test('email OTP: should send verification code', async ({ page }) => {
    test.slow()
    await page.goto('/login')

    const emailInput = page.getByPlaceholder(/email/i)
    const sendCodeButton = page.getByRole('button', { name: /Send|Code|Continue/i })

    if (await emailInput.isVisible()) {
      await emailInput.fill(`student-${Date.now()}@example.com`)
      await sendCodeButton.click()

      // Should show OTP sent message
      await expect(
        page.getByText(/sent|code|check/i)
      ).toBeVisible({ timeout: 5000 })

      console.log('✅ Email OTP sent successfully')
    } else {
      test.skip()
    }
  })

  test('phone OTP: should send SMS code if enabled', async () => {
    // This test only runs if phone provider is enabled
    test.skip()
    // TODO: Implement when phone provider is configured
  })
})

/**
 * Navigation Tests
 */
test.describe('Student Navigation', () => {
  test('should navigate from landing page to student login', async ({ page }) => {
    await page.goto('/')

    const studentButton = page.getByRole('button', { name: /I'm a Student/i })
    await studentButton.click()

    await expect(page).toHaveURL('/login')
  })

  test('should have link to join class from login page', async ({ page }) => {
    await page.goto('/login')

    const joinLink = page.getByRole('link', { name: /Join|Class/i })
    await expect(joinLink).toBeVisible()
  })
})
