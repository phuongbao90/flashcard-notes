# E2E Testing with Playwright

### Question a5aff3d5-f58b-4226-86b4-d25238d69781

- Why is **auto-waiting** the central mental model of Playwright, and why is `page.waitForTimeout()` an anti-pattern that signals a flawed test?

### Answer

- **How Playwright auto-waiting works**: Before performing any action (e.g., `locator.click()`, `locator.fill()`), Playwright automatically executes actionability checks:
  1. Attached to the DOM.
  2. Visible in the viewport.
  3. Stable (not animating or moving).
  4. Receives events (not obscured by an overlay or backdrop).
  5. Enabled (not `disabled`).
  - If any check fails, Playwright continuously retries up to the configured timeout (e.g. 5000ms).
- **Why `waitForTimeout(ms)` is an anti-pattern**:
  - A manual sleep admits that you are testing *time* rather than *state*.
  - Under heavy CI load, a 1000ms sleep may be too short, causing flakiness.
  - On fast local machines, a 1000ms sleep wastes developer time.
- **The Senior Fix**: Wait on explicit user-observable DOM or network conditions: `expect(locator).toBeVisible()`, or wait for dynamic elements to detach.

```typescript
// ❌ Flaky & Brittle: Arbitrary sleep causes CI timeouts or wasted time
await page.getByRole('button', { name: /checkout/i }).click();
await page.waitForTimeout(2000); // Bad! Hardcoded sleep!
await page.getByRole('button', { name: /confirm/i }).click();

// ✅ Resilient: Relies on auto-waiting and web-first assertions
await page.getByRole('button', { name: /checkout/i }).click();
// Auto-waits for confirm button to become attached, visible, stable, and clickable!
await page.getByRole('button', { name: /confirm/i }).click();
await expect(page.getByText(/order placed/i)).toBeVisible();
```

- [More detail on Playwright Auto-waiting](https://playwright.dev/docs/actionability)
- [More detail on Playwright Locators](https://playwright.dev/docs/locators)

---

### Question 21b3d4e2-aa68-4d22-a663-7f5fe03c5913

- Why do boolean checks like `expect(await locator.isVisible()).toBe(true)` cause intermittent E2E failures, and how do **web-first assertions** solve this?

### Answer

- **The immediate evaluation bug**:
  - `locator.isVisible()` returns a standard JavaScript boolean immediately. It evaluates the DOM state at the exact millisecond of execution with **zero retry logic**.
  - If a button is in the middle of a 150ms CSS fade-in or React re-render, `isVisible()` immediately evaluates to `false`, causing the test to fail.
- **Web-first assertions (`expect(locator)...`)**:
  - Playwright's `expect(locator).toBeVisible()`, `toBeEnabled()`, `toHaveText()` poll the DOM repeatedly until the condition evaluates to true or times out.
  - They automatically wait for asynchronous rendering, animation completion, and network hydration.

```typescript
// ❌ Flaky Boolean Assertion: Zero retries; fails if animation takes 50ms
const visible = await page.getByRole('alert').isVisible();
expect(visible).toBe(true); // Fails intermittently in CI!

// ✅ Web-First Assertion: Automatically polls and awaits visibility
await expect(page.getByRole('alert')).toBeVisible();
await expect(page.getByRole('button', { name: /submit/i })).toBeEnabled();
```

- [More detail on Playwright Web-First Assertions](https://playwright.dev/docs/test-assertions)
- [More detail on Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

### Question f174c0f1-289e-4676-9ae4-990853af626f

- How does **Storage State Reuse (`storageState`)** accelerate Playwright E2E suites, and why is logging in via the UI before every test an anti-pattern?

### Answer

- **The UI login bottleneck**:
  - If a suite has 150 authenticated tests and each test fills the login form, submits credentials, waits for OAuth redirects, and sets cookies, the suite spends 15+ minutes solely on login screens.
  - Any minor UI glitch on the login page causes all 150 tests to fail simultaneously, masking real regressions across unrelated features.
- **The Storage State pattern**:
  1. A dedicated `auth.setup.ts` project runs once before all tests, logs into the app via the UI or API, and dumps authenticated cookies and `localStorage` to an encrypted JSON file (`storageState.json`).
  2. All dependent E2E worker threads boot browser contexts pre-seeded with this `storageState`, immediately starting on authenticated routes.
- **Time savings**: Reduces average test execution time by 60–80% and eliminates authentication UI flakiness from feature suites.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // 1. Setup project executes once to save auth session
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 2. All tests reuse pre-authenticated browser cookies/storage
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

- [More detail on Playwright Authentication Reuse](https://playwright.dev/docs/auth)
- [More detail on Playwright Project Dependencies](https://playwright.dev/docs/test-projects#dependencies)

---

### Question 29649d65-a176-47eb-9c2f-d4b0c347980b

- How do you use Playwright's **`page.route()`** to test critical error and failure states that are virtually impossible to reproduce in a live staging environment?

### Answer

- **The Happy-Path E2E limitation**: Live staging environments only test the happy path. In production, users encounter 500 server crashes, network timeouts, offline states, and rate limits.
- **Network interception with `page.route`**:
  - Playwright allows intercepting outgoing HTTP calls from the browser to simulate edge-case failure modes without modifying backend databases.
  - **Critical failure test cases**:
    1. **500 Server Error**: Assert that an informative error message and retry button appear, rather than a blank white screen.
    2. **Network Offline / Drop**: Assert that offline banners appear and unsaved form data is preserved.
    3. **Slow 3G Latency**: Abort requests or delay responses to verify loading skeletons and disable buttons during processing.

```typescript
test('displays resilient recovery UI when payment gateway returns HTTP 500', async ({ page }) => {
  // ✅ Intercept external payment API call and force a 500 Internal Error
  await page.route('**/api/checkout/pay', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Gateway timeout from acquiring bank' }),
    });
  });

  await page.goto('/checkout');
  await page.getByRole('button', { name: /confirm purchase/i }).click();

  // Assert user is informed and cart is not destroyed
  await expect(page.getByRole('alert')).toHaveText(/payment could not be processed/i);
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
});
```

- [More detail on Playwright Network Mocking](https://playwright.dev/docs/mock#mock-api-requests)
- [More detail on Simulating Offline State in Playwright](https://playwright.dev/docs/network#offline)

---

### Question edd5fe37-58ff-47be-a96a-9f08d8ccab7e

- Why is **test isolation** mandatory for scalable E2E execution, and what happens when tests share mutable database state or depend on execution order?

### Answer

- **The isolation imperative**: Every E2E test must be completely independent and capable of running in isolation, in any arbitrary sequence, or simultaneously across parallel worker threads.
- **The shared-state disaster**:
  - If Test A creates a user named `"Alice"` and Test B assumes `"Alice"` already exists, running Test B alone fails.
  - If Test A updates the global company address while Test C is checking invoice addresses, running tests concurrently produces race conditions and random CI failures.
- **Isolation strategies**:
  1. **Dynamic Test Data per Test**: Generate unique entities per test using UUIDs or random emails (`test-user-${Date.now()}@example.com`).
  2. **API/DB Seeding Fixtures**: Use custom Playwright test fixtures (`test.extend`) that provision an isolated workspace/account before the test and delete it in teardown.
  3. **Parallel Sharding**: Clean isolation allows distributing the suite across multiple CI machines (`--shard=1/4`) without inter-machine collision.

```typescript
// Custom Playwright Fixture ensuring isolated test user per test
import { test as base } from '@playwright/test';

export const test = base.extend<{ testUser: User }>({
  testUser: async ({ request }, use) => {
    // Setup: Create unique user via API
    const res = await request.post('/api/test/users', { data: { email: `user-${crypto.randomUUID()}@test.com` } });
    const user = await res.json();

    await use(user); // Provide to test

    // Teardown: Clean up data
    await request.delete(`/api/test/users/${user.id}`);
  },
});
```

- [More detail on Playwright Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [More detail on Test Isolation Principles](https://playwright.dev/docs/test-isolation)
