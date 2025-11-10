# ATAL AI - E2E Tests

Playwright end-to-end tests for the ATAL AI Digital Empowerment Platform.

## 📁 Test Structure

```
tests/
├── auth.spec.ts          # Authentication flow tests (OTP, redirects)
├── pwa.spec.ts           # PWA feature tests (manifest, service worker)
├── helpers/
│   └── auth.ts           # Test helpers for authentication mocking
└── README.md             # This file
```

## 🧪 Test Coverage

### Authentication Tests ([auth.spec.ts](./auth.spec.ts))

#### **Unauthenticated Access**
- ✅ Redirect to `/login` when accessing protected `/app/dashboard`
- ✅ Show login form on `/login` route
- ✅ Verify ATAL AI branding elements

#### **OTP Authentication Flow**
- ✅ Handle OTP request and redirect to verify page
- ✅ Show error toast on OTP request failure
- ✅ Handle OTP verification and redirect to dashboard
- ✅ Show error on invalid OTP code
- ✅ Handle resend OTP functionality

#### **Authenticated Access**
- ✅ Allow access to dashboard when authenticated
- ✅ Redirect to dashboard when accessing login while authenticated

#### **UI Components**
- ✅ Disable submit button when email is empty
- ✅ Only accept 6-digit code in verification input
- ✅ Show loading state during OTP request

### PWA Tests ([pwa.spec.ts](./pwa.spec.ts))

- ✅ Correct page title and meta tags
- ✅ Manifest.json availability and content
- ✅ Service worker registration

## 🚀 Running Tests

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test auth.spec.ts
```

### Run in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run with Debugging

```bash
npx playwright test --debug
```

## 📊 View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## 🎭 Mocking Strategy

Tests use Playwright's `page.route()` to intercept and mock Supabase API calls:

### Mocked Endpoints

- `**/auth/v1/otp` - OTP request endpoint
- `**/auth/v1/verify` - OTP verification endpoint
- `**/auth/v1/user` - Get current user endpoint

### Example: Mock Successful OTP

```typescript
await page.route('**/auth/v1/otp', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  })
})
```

### Test Helpers

The `helpers/auth.ts` file provides reusable utilities:

- `mockAuthenticatedUser(context, user)` - Set auth cookies
- `mockSupabaseOTPSuccess(page)` - Mock successful OTP flow
- `mockSupabaseOTPFailure(page, error)` - Mock failed OTP
- `loginViaOTP(page, email, otp)` - Complete full login flow

## 🔧 Configuration

### Playwright Config ([playwright.config.ts](../playwright.config.ts))

- **Test Directory**: `./tests`
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_TEST_BASE_URL`)
- **Web Server**: Automatically starts `npm run dev`
- **Retries**: 2 retries in CI, 0 locally
- **Reporters**: HTML report
- **Browsers**: Chromium (Desktop Chrome)

### CI Environment

Set `CI=true` to enable:
- Stricter test mode (`forbidOnly`)
- Automatic retries (2x)
- Serial test execution

## 🐛 Debugging Tests

### 1. **Playwright Inspector**

```bash
npx playwright test --debug
```

### 2. **Visual Traces**

Traces are captured on first retry. View them:

```bash
npx playwright show-trace trace.zip
```

### 3. **Screenshots**

Screenshots are taken on failure and saved to `test-results/`

### 4. **Browser Console Logs**

Add to your test:

```typescript
page.on('console', msg => console.log(msg.text()))
```

## 📝 Writing New Tests

### 1. Create Test File

Create a new `.spec.ts` file in `/tests`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-route')
    await expect(page.getByRole('heading')).toBeVisible()
  })
})
```

### 2. Use Test Helpers

Import authentication helpers:

```typescript
import { mockAuthenticatedUser, loginViaOTP } from './helpers/auth'

test('authenticated test', async ({ page, context }) => {
  await mockAuthenticatedUser(context)
  await page.goto('/app/dashboard')
  // ... test logic
})
```

### 3. Mock API Responses

```typescript
test('with mocked API', async ({ page }) => {
  await page.route('**/api/endpoint', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ data: 'mock data' }),
    })
  })

  await page.goto('/page')
  // ... assertions
})
```

## ✅ Best Practices

1. **Use Semantic Selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for Navigation**: Use `page.waitForURL()` instead of arbitrary timeouts
3. **Mock External APIs**: Always mock Supabase and external services
4. **Isolate Tests**: Each test should be independent and not rely on others
5. **Use Helpers**: Reuse authentication and setup logic from `helpers/`
6. **Descriptive Names**: Use clear, behavior-focused test names
7. **Clean Up**: Clear cookies/storage between tests when needed

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test Guides](https://playwright.dev/docs/test-components)
- [Next.js Testing Guide](https://nextjs.org/docs/pages/guides/testing/playwright)
- [Supabase Testing Docs](https://supabase.com/docs/guides/getting-started/testing)

---

**Last Updated**: 2025-11-10
**Test Framework**: Playwright 1.56.1
**Target**: ATAL AI 1.0
