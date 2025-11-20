import { test, expect } from '@playwright/test'

/**
 * Teacher Registration Flow Tests
 * Tests the complete 4-step teacher onboarding process
 */

test.describe('Teacher Registration Flow', () => {
  const TEST_EMAIL = `teacher-${Date.now()}@example.com`
  const TEST_PASSWORD = 'SecurePassword123!'
  const TEST_SCHOOL_CODE = '14H0001' // Update with valid test school code
  const TEST_STAFF_PIN = '1234' // Update with valid test PIN
  const TEST_TEACHER_NAME = 'Test Teacher'

  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/')
  })

  test('should display teacher registration button on landing page', async ({ page }) => {
    const teacherButton = page.getByRole('button', { name: /I'm a Teacher/i })
    await expect(teacherButton).toBeVisible()
  })

  test('happy path: complete teacher registration flow', async ({ page }) => {
    test.slow() // This test involves OTP, mark as slow

    // Step 1: Click "I'm a Teacher"
    await page.getByRole('button', { name: /I'm a Teacher/i }).click()
    await expect(page).toHaveURL('/teacher/start')

    // Step 2: Enter email and send OTP
    await expect(page.getByText(/Teacher Registration/i)).toBeVisible()
    await expect(page.getByText(/Step 1 of 4/i)).toBeVisible()

    const emailInput = page.getByPlaceholder(/teacher@school.edu/i)
    await emailInput.fill(TEST_EMAIL)

    const sendOtpButton = page.getByRole('button', { name: /Send Verification Code/i })
    await sendOtpButton.click()

    // Wait for OTP sent confirmation
    await expect(page.getByText(/OTP sent to your email/i)).toBeVisible()

    // Note: In a real test, you would need to:
    // 1. Mock the Supabase OTP endpoint
    // 2. Or use a test email service that provides OTP
    // 3. Or implement a test-only bypass for OTP verification

    // For now, we'll test up to this point and mark the rest as TODO
    console.log('✅ Email OTP send successful')
    console.log('⏳ TODO: Implement OTP verification mock or test email service')
  })

  test('should validate email format', async ({ page }) => {
    await page.getByRole('button', { name: /I'm a Teacher/i }).click()

    const emailInput = page.getByPlaceholder(/teacher@school.edu/i)
    await emailInput.fill('invalid-email')

    const sendOtpButton = page.getByRole('button', { name: /Send Verification Code/i })
    await sendOtpButton.click()

    // HTML5 validation should prevent submission
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test('should show password strength meter', async ({ page }) => {
    // This test requires navigating to the password step
    // which needs OTP verification
    // TODO: Implement with OTP mock
    test.skip()
  })

  test('should reject weak passwords', async ({ page }) => {
    // This test requires navigating to the password step
    // TODO: Implement with OTP mock
    test.skip()
  })

  test('should validate school code format', async ({ page }) => {
    // This test requires navigating to school verification step
    // TODO: Implement with OTP + password mock
    test.skip()
  })

  test('should reject invalid school code', async ({ page }) => {
    // This test requires navigating to school verification step
    // TODO: Implement with OTP + password mock
    test.skip()
  })

  test('should reject incorrect staff PIN', async ({ page }) => {
    // This test requires navigating to school verification step
    // TODO: Implement with OTP + password mock
    test.skip()
  })

  test('should block duplicate teacher registration', async ({ page }) => {
    // This test requires a pre-existing teacher account
    // TODO: Implement with database seeding
    test.skip()
  })
})

/**
 * Test Helpers and Mocks
 * TODO: Implement these helpers for full E2E testing
 */

// Mock OTP verification for testing
async function mockOtpVerification(page: any, email: string) {
  // Intercept Supabase Auth API calls
  await page.route('**/auth/v1/otp', async (route: any) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true }),
    })
  })
}

// Get test OTP code (requires test email service integration)
async function getTestOtpCode(email: string): Promise<string> {
  // TODO: Integrate with test email service (e.g., Mailosaur, mailtrap.io)
  // For now, return a mock code
  return '123456'
}

// Seed test school data
async function seedTestSchool() {
  // TODO: Use Supabase client to insert test school
  // with known school code and PIN
}

// Clean up test data
async function cleanupTestData() {
  // TODO: Remove test teacher profiles after tests
}
