# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core-features.spec.js >> UC-2-TC-01: Successful user login
- Location: tests\core-features.spec.js:74:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Login successful!')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByText('Login successful!')

```

```yaml
- banner:
  - link "Smart Admission Guide":
    - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "About":
      - /url: /about
    - link "Universities":
      - /url: /recommendation
    - link "Quiz":
      - /url: /quiz
    - link "Dashboard":
      - /url: /dashboard
    - button "Logout"
- main:
  - heading "Your Smart Guide to University Admissions" [level=1]
  - paragraph: Smart Admission Guide helps intermediate students choose the best university and program using AI-powered recommendations.
  - link "Check Admission Chance":
    - /url: /admission-chance
  - img: AI SAG AI Powered % Merit Check Instant Result
  - heading "How It Works" [level=2]
  - paragraph: Just 4 simple steps to your future
  - heading "1. Enter Profile" [level=3]
  - paragraph: Provide your academic background and preferences.
  - heading "2. AI Analysis" [level=3]
  - paragraph: Our AI analyzes your profile using merit data.
  - heading "3. Get Recommendations" [level=3]
  - paragraph: Personalized universities and programs suggested.
  - heading "4. Apply Smartly" [level=3]
  - paragraph: Generate application documents and track deadlines.
  - heading "Powerful AI-Based Features" [level=2]
  - heading "Smart Recommendations" [level=3]
  - paragraph: Get university and program suggestions based on your marks.
  - heading "Admission Chance Calculator" [level=3]
  - paragraph: Predict your admission probability using AI.
  - heading "AI Chatbot" [level=3]
  - paragraph: Ask admission-related questions anytime.
  - heading "Unsure About Your Admission Chances?" [level=2]
  - paragraph: Use our AI-based admission chance calculator.
  - link "Check Now":
    - /url: /admission-chance
  - heading "Start Your Smart Admission Journey Today" [level=2]
  - paragraph: Join thousands of students making better academic decisions.
  - link "Admission Probability":
    - /url: /admission-probability
- contentinfo:
  - paragraph: © 2026 Smart Admission Guide | Final Year Project
- button "SAG AI"
- alert
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | // Unique credentials for this test run — avoids email-already-exists conflicts
  5   | const TEST_EMAIL = `e2e_${Date.now()}@playwright.test`;
  6   | const TEST_PASSWORD = 'Playwright@2026';
  7   | const TEST_NAME = 'Playwright Tester';
  8   | 
  9   | // ─────────────────────────────────────────────────────────────────────────────
  10  | // WC-TC-001 — Verify Homepage Loads Correctly
  11  | // ─────────────────────────────────────────────────────────────────────────────
  12  | test('WC-TC-001: Homepage loads correctly', async ({ page }) => {
  13  |   await page.goto('/');
  14  | 
  15  |   // Page title contains the app name
  16  |   await expect(page).toHaveTitle(/Smart Admission Guide/i);
  17  | 
  18  |   // Brand link is visible in the navbar
  19  |   await expect(page.getByRole('link', { name: 'Smart Admission Guide' })).toBeVisible();
  20  | 
  21  |   // Hero heading is visible
  22  |   await expect(
  23  |     page.getByRole('heading', { name: /university admissions/i })
  24  |   ).toBeVisible();
  25  | 
  26  |   // "Check Admission Chance" CTA button is present
  27  |   await expect(page.getByRole('link', { name: /check admission chance/i })).toBeVisible();
  28  | });
  29  | 
  30  | // ─────────────────────────────────────────────────────────────────────────────
  31  | // WC-TC-002 — Verify Navigation Links Functionality
  32  | // ─────────────────────────────────────────────────────────────────────────────
  33  | test('WC-TC-002: Navigation links work', async ({ page }) => {
  34  |   await page.goto('/');
  35  | 
  36  |   // Click the "About" link in the desktop nav (first visible link with that text)
  37  |   await page.locator('a[href="/about"]').first().click();
  38  |   await expect(page).toHaveURL(/\/about$/);
  39  | 
  40  |   // Navigate back and click "Universities"
  41  |   await page.goto('/');
  42  |   await page.locator('a[href="/recommendation"]').first().click();
  43  |   await expect(page).toHaveURL(/\/recommendation/);
  44  | });
  45  | 
  46  | // ─────────────────────────────────────────────────────────────────────────────
  47  | // UC-1-TC-01 — Successful User Registration
  48  | // ─────────────────────────────────────────────────────────────────────────────
  49  | test('UC-1-TC-01: Successful user registration', async ({ page }) => {
  50  |   await page.goto('/auth');
  51  | 
  52  |   // Switch to Register mode using the toggle button (not the submit button)
  53  |   await page.locator('button:not([type="submit"])').filter({ hasText: 'Register' }).click();
  54  | 
  55  |   // Assert the form switches to registration
  56  |   await expect(page.getByPlaceholder('Enter your name')).toBeVisible();
  57  | 
  58  |   // Fill in the registration form
  59  |   await page.getByPlaceholder('Enter your name').fill(TEST_NAME);
  60  |   await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
  61  |   await page.getByPlaceholder('Create password').fill(TEST_PASSWORD);
  62  |   await page.getByPlaceholder('Confirm password').fill(TEST_PASSWORD);
  63  | 
  64  |   // Submit the form
  65  |   await page.locator('button[type="submit"]').click();
  66  | 
  67  |   // Assert success message: API returns "User created successfully"
  68  |   await expect(page.getByText('User created successfully')).toBeVisible({ timeout: 10000 });
  69  | });
  70  | 
  71  | // ─────────────────────────────────────────────────────────────────────────────
  72  | // UC-2-TC-01 — Successful User Login
  73  | // ─────────────────────────────────────────────────────────────────────────────
  74  | test('UC-2-TC-01: Successful user login', async ({ page, request }) => {
  75  |   // Pre-create the account via API so this test is independent of UC-1
  76  |   await request.post('/api/auth/signup', {
  77  |     data: {
  78  |       name: TEST_NAME,
  79  |       email: TEST_EMAIL,
  80  |       password: TEST_PASSWORD,
  81  |       confirmPassword: TEST_PASSWORD,
  82  |     },
  83  |     failOnStatusCode: false, // 409 is fine if account already exists from UC-1
  84  |   });
  85  | 
  86  |   await page.goto('/auth');
  87  | 
  88  |   // Login mode is the default — fill credentials
  89  |   await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
  90  |   await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD);
  91  | 
  92  |   // Submit login form
  93  |   await page.locator('button[type="submit"]').click();
  94  | 
  95  |   // Assert the inline success message appears first
> 96  |   await expect(page.getByText('Login successful!')).toBeVisible({ timeout: 8000 });
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  97  | 
  98  |   // After the 1-second redirect, land on the homepage with Logout visible
  99  |   await page.waitForURL('/', { timeout: 5000 });
  100 |   await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  101 | });
  102 | 
  103 | // ─────────────────────────────────────────────────────────────────────────────
  104 | // UC-8-TC-01 — Successful Calculation of Admission Probability
  105 | // ─────────────────────────────────────────────────────────────────────────────
  106 | test('UC-8-TC-01: Admission probability calculator works', async ({ page }) => {
  107 |   await page.goto('/admission-chance');
  108 | 
  109 |   // Assert the page heading is correct
  110 |   await expect(
  111 |     page.getByRole('heading', { name: /admission chance calculator/i })
  112 |   ).toBeVisible();
  113 | 
  114 |   // Fill in marks (85% → triggers 95% chance result)
  115 |   await page.getByPlaceholder('Enter your percentage marks').fill('85');
  116 | 
  117 |   // Select a university (FAST is the default, keep it)
  118 |   await expect(page.locator('select[name="university"]')).toHaveValue('FAST');
  119 | 
  120 |   // Submit the form
  121 |   await page.getByRole('button', { name: 'Calculate My Chances' }).click();
  122 | 
  123 |   // Assert the result section appears with "Admission Probability:" label
  124 |   await expect(page.getByText('Admission Probability:')).toBeVisible();
  125 | 
  126 |   // Assert the probability percentage is displayed (e.g. "95%")
  127 |   await expect(page.getByText('95%')).toBeVisible();
  128 | 
  129 |   // Assert the progress bar is rendered
  130 |   await expect(page.locator('.bg-primary.h-full.rounded-full')).toBeVisible();
  131 | });
  132 | 
```