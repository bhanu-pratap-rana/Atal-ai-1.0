import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to /login when accessing protected /app/dashboard route', async ({ page }) => {
      // Attempt to access protected dashboard without authentication
      await page.goto('/app/dashboard')

      // Should be redirected to login page
      await expect(page).toHaveURL('/login')

      // Verify login page elements are visible
      await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible()
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Send Verification Code/i })).toBeVisible()
    })

    test('should show login form on /login route', async ({ page }) => {
      await page.goto('/login')

      // Verify we're on the login page
      await expect(page).toHaveURL('/login')

      // Check for ATAL AI branding
      await expect(page.getByText('ATAL AI')).toBeVisible()
      await expect(page.getByText('Digital Empowerment Platform')).toBeVisible()

      // Check for form elements
      await expect(page.getByLabel('Email Address')).toBeVisible()
      await expect(page.getByRole('button', { name: /Send Verification Code/i })).toBeVisible()
    })
  })

  test.describe('OTP Authentication Flow', () => {
    test('should handle OTP request and redirect to verify page', async ({ page }) => {
      // Mock the Supabase signInWithOtp API call
      await page.route('**/auth/v1/otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      // Navigate to login page
      await page.goto('/login')

      // Fill in email
      const emailInput = page.getByLabel('Email Address')
      await emailInput.fill('test@atalai.com')

      // Click send verification code
      await page.getByRole('button', { name: /Send Verification Code/i }).click()

      // Should redirect to verify page
      await expect(page).toHaveURL('/verify')

      // Verify page should show verification form
      await expect(page.getByRole('heading', { name: /Verify Your Email/i })).toBeVisible()
      await expect(page.getByLabel('Verification Code')).toBeVisible()
    })

    test('should show error toast on OTP request failure', async ({ page }) => {
      // Mock failed OTP request
      await page.route('**/auth/v1/otp', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid email address',
            error_description: 'The email address provided is invalid'
          }),
        })
      })

      await page.goto('/login')

      // Fill invalid email
      await page.getByLabel('Email Address').fill('invalid-email')
      await page.getByRole('button', { name: /Send Verification Code/i }).click()

      // Should show error toast (Sonner toast notification)
      await expect(page.getByRole('status')).toContainText(/Failed to send OTP|error/i, { timeout: 5000 })
    })

    test('should handle OTP verification and redirect to dashboard', async ({ page }) => {
      // Mock successful OTP verification
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

      // Mock getUser to return authenticated state
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

      // Go to verify page (simulating redirect from login)
      await page.goto('/verify')

      // Fill in email and token
      await page.getByLabel('Email Address').fill('test@atalai.com')
      await page.getByLabel('Verification Code').fill('123456')

      // Click verify
      await page.getByRole('button', { name: /Verify Code/i }).click()

      // Should show success toast
      await expect(page.getByRole('status')).toContainText(/verified successfully/i, { timeout: 5000 })

      // Should redirect to dashboard
      await expect(page).toHaveURL('/app/dashboard', { timeout: 10000 })

      // Verify dashboard elements
      await expect(page.getByRole('heading', { name: /Welcome to ATAL AI/i })).toBeVisible()
    })

    test('should show error on invalid OTP code', async ({ page }) => {
      // Mock failed verification
      await page.route('**/auth/v1/verify', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid OTP code'
          }),
        })
      })

      await page.goto('/verify')

      // Fill in email and invalid token
      await page.getByLabel('Email Address').fill('test@atalai.com')
      await page.getByLabel('Verification Code').fill('000000')

      // Click verify
      await page.getByRole('button', { name: /Verify Code/i }).click()

      // Should show error toast
      await expect(page.getByRole('status')).toContainText(/Invalid verification code|error/i, { timeout: 5000 })

      // Should still be on verify page
      await expect(page).toHaveURL('/verify')
    })

    test('should handle resend OTP functionality', async ({ page }) => {
      // Mock resend OTP request
      await page.route('**/auth/v1/otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      await page.goto('/verify')

      // Fill email
      await page.getByLabel('Email Address').fill('test@atalai.com')

      // Click resend button
      await page.getByRole('button', { name: /resend/i }).click()

      // Should show success toast
      await expect(page.getByRole('status')).toContainText(/New code sent/i, { timeout: 5000 })
    })
  })

  test.describe('Authenticated Access', () => {
    test('should allow access to dashboard when authenticated', async ({ page, context }) => {
      // Mock authenticated state by setting cookies
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-access-token',
          domain: 'localhost',
          path: '/',
        },
      ])

      // Mock getUser to return authenticated user
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

      // Access dashboard
      await page.goto('/app/dashboard')

      // Should stay on dashboard (not redirected to login)
      await expect(page).toHaveURL('/app/dashboard')

      // Verify dashboard content
      await expect(page.getByRole('heading', { name: /Welcome to ATAL AI/i })).toBeVisible()
      await expect(page.getByText(/test@atalai.com/i)).toBeVisible()
    })

    test('should redirect to dashboard when accessing login while authenticated', async ({ page, context }) => {
      // Mock authenticated state
      await context.addCookies([
        {
          name: 'sb-access-token',
          value: 'mock-access-token',
          domain: 'localhost',
          path: '/',
        },
      ])

      // Try to access login page
      await page.goto('/login')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/app/dashboard')
    })
  })

  test.describe('UI Components', () => {
    test('should disable submit button when email is empty', async ({ page }) => {
      await page.goto('/login')

      const submitButton = page.getByRole('button', { name: /Send Verification Code/i })

      // Button should be disabled when email is empty
      await expect(submitButton).toBeDisabled()

      // Fill email
      await page.getByLabel('Email Address').fill('test@example.com')

      // Button should now be enabled
      await expect(submitButton).toBeEnabled()
    })

    test('should only accept 6-digit code in verification input', async ({ page }) => {
      await page.goto('/verify')

      const codeInput = page.getByLabel('Verification Code')

      // Type more than 6 digits
      await codeInput.fill('12345678')

      // Input should truncate to 6 digits
      await expect(codeInput).toHaveValue('123456')
    })

    test('should show loading state during OTP request', async ({ page }) => {
      // Delay the API response
      await page.route('**/auth/v1/otp', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      await page.goto('/login')

      await page.getByLabel('Email Address').fill('test@atalai.com')

      const submitButton = page.getByRole('button', { name: /Send Verification Code/i })
      await submitButton.click()

      // Button should show loading state
      await expect(page.getByRole('button', { name: /Sending/i })).toBeVisible()
    })
  })
})
