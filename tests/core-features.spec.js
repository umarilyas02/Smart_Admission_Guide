// @ts-check
const { test, expect } = require('@playwright/test');

// Unique credentials for this test run — avoids email-already-exists conflicts
const TEST_EMAIL = `e2e_${Date.now()}@playwright.test`;
const TEST_PASSWORD = 'Playwright@2026';
const TEST_NAME = 'Playwright Tester';

// ─────────────────────────────────────────────────────────────────────────────
// WC-TC-001 — Verify Homepage Loads Correctly
// ─────────────────────────────────────────────────────────────────────────────
test('WC-TC-001: Homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Page title contains the app name
  await expect(page).toHaveTitle(/Smart Admission Guide/i);

  // Brand link is visible in the navbar
  await expect(page.getByRole('link', { name: 'Smart Admission Guide' })).toBeVisible();

  // Hero heading is visible
  await expect(
    page.getByRole('heading', { name: /university admissions/i })
  ).toBeVisible();

  // "Check Admission Chance" CTA button is present
  await expect(page.getByRole('link', { name: /check admission chance/i })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// WC-TC-002 — Verify Navigation Links Functionality
// ─────────────────────────────────────────────────────────────────────────────
test('WC-TC-002: Navigation links work', async ({ page }) => {
  await page.goto('/');

  // Click the "About" link in the desktop nav (first visible link with that text)
  await page.locator('a[href="/about"]').first().click();
  await expect(page).toHaveURL(/\/about$/);

  // Navigate back and click "Universities"
  await page.goto('/');
  await page.locator('a[href="/recommendation"]').first().click();
  await expect(page).toHaveURL(/\/recommendation/);
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-1-TC-01 — Successful User Registration
// ─────────────────────────────────────────────────────────────────────────────
test('UC-1-TC-01: Successful user registration', async ({ page }) => {
  await page.goto('/auth');

  // Switch to Register mode using the toggle button (not the submit button)
  await page.locator('button:not([type="submit"])').filter({ hasText: 'Register' }).click();

  // Assert the form switches to registration
  await expect(page.getByPlaceholder('Enter your name')).toBeVisible();

  // Fill in the registration form
  await page.getByPlaceholder('Enter your name').fill(TEST_NAME);
  await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
  await page.getByPlaceholder('Create password').fill(TEST_PASSWORD);
  await page.getByPlaceholder('Confirm password').fill(TEST_PASSWORD);

  // Submit the form
  await page.locator('button[type="submit"]').click();

  // Assert success message: API returns "User created successfully"
  await expect(page.getByText('User created successfully')).toBeVisible({ timeout: 10000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-2-TC-01 — Successful User Login
// ─────────────────────────────────────────────────────────────────────────────
test('UC-2-TC-01: Successful user login', async ({ page, request }) => {
  // Pre-create the account via API so this test is independent of UC-1
  await request.post('/api/auth/signup', {
    data: {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    },
    failOnStatusCode: false, // 409 is fine if account already exists from UC-1
  });

  await page.goto('/auth');

  // Login mode is the default — fill credentials
  await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD);

  // Submit login form
  await page.locator('button[type="submit"]').click();

  // Assert the inline success message appears first
  // API returns exactly: { message: 'Login successful' } — no exclamation mark
  await expect(page.getByText('Login successful')).toBeVisible({ timeout: 8000 });

  // After the 1-second redirect, land on the homepage with Logout visible
  await page.waitForURL('**/', { timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-8-TC-01 — Successful Calculation of Admission Probability
// ─────────────────────────────────────────────────────────────────────────────
test('UC-8-TC-01: Admission probability calculator works', async ({ page }) => {
  await page.goto('/admission-chance');

  // Assert the page heading is correct
  await expect(
    page.getByRole('heading', { name: /admission chance calculator/i })
  ).toBeVisible();

  // Fill in marks (85% → triggers 95% chance result)
  await page.getByPlaceholder('Enter your percentage marks').fill('85');

  // Select a university (FAST is the default, keep it)
  await expect(page.locator('select[name="university"]')).toHaveValue('FAST');

  // Submit the form
  await page.getByRole('button', { name: 'Calculate My Chances' }).click();

  // Assert the result section appears with "Admission Probability:" label
  await expect(page.getByText('Admission Probability:')).toBeVisible();

  // Assert the probability percentage is displayed (e.g. "95%")
  await expect(page.getByText('95%')).toBeVisible();

  // Assert the progress bar is rendered
  await expect(page.locator('.bg-primary.h-full.rounded-full')).toBeVisible();
});
