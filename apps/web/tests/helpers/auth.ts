import { Page, BrowserContext } from '@playwright/test'

/**
 * Mock authentication state by setting session cookies
 */
export async function mockAuthenticatedUser(
  context: BrowserContext,
  user: { id: string; email: string } = { id: '123', email: 'test@atalai.com' }
) {
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: 'mock-access-token',
      domain: 'localhost',
      path: '/',
    },
  ])

  return user
}

/**
 * Mock Supabase auth API responses for successful OTP flow
 */
export async function mockSupabaseOTPSuccess(page: Page) {
  // Mock OTP request
  await page.route('**/auth/v1/otp', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  // Mock OTP verification
  await page.route('**/auth/v1/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: '123',
          email: 'test@atalai.com',
        },
      }),
    })
  })

  // Mock getUser
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '123',
        email: 'test@atalai.com',
      }),
    })
  })
}

/**
 * Mock Supabase auth API responses for failed OTP
 */
export async function mockSupabaseOTPFailure(
  page: Page,
  errorMessage = 'Invalid OTP code'
) {
  await page.route('**/auth/v1/verify', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'invalid_grant',
        error_description: errorMessage,
      }),
    })
  })
}

/**
 * Login helper - completes full OTP flow
 */
export async function loginViaOTP(
  page: Page,
  email = 'test@atalai.com',
  otp = '123456'
) {
  await mockSupabaseOTPSuccess(page)

  // Go to login page
  await page.goto('/login')

  // Fill email and submit
  await page.getByLabel('Email Address').fill(email)
  await page.getByRole('button', { name: /Send Verification Code/i }).click()

  // Should be redirected to verify page
  await page.waitForURL('/verify')

  // Fill OTP and submit
  await page.getByLabel('Verification Code').fill(otp)
  await page.getByRole('button', { name: /Verify Code/i }).click()

  // Should redirect to dashboard
  await page.waitForURL('/app/dashboard')
}
