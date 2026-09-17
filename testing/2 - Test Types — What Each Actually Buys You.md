# Test Types — What Each Actually Buys You

### Question a20af479-d41c-4d48-996b-3644202f1d51

- What is **the mapping discipline** in frontend test strategy, and how do you determine the cheapest test type that reliably catches a specific bug class?

### Answer

- **The mapping rule**: Never use an expensive test type (slow, flaky, resource-heavy) when a cheaper test type provides equal or higher defect detection fidelity.
- **Defect-to-Test Type Matrix**:
  - **Type/Syntax Errors (e.g., passing number to string prop)**: **Static Typecheck** (`tsc`). Catches at compile time for zero runtime execution cost.
  - **Pure Algorithmic Logic (e.g., currency math, date formatting, sorting)**: **Unit Test**. Millisecond execution, zero DOM/network overhead.
  - **Component Wiring & User Interactions (e.g., modal opens on button click, form validates, data renders)**: **Component/Integration Test** (Testing Library + MSW). Exercises DOM events, state, and provider contexts without a headless browser.
  - **Multi-Page Workflows & Critical System Integration (e.g., login → checkout → payment webhook)**: **E2E Test** (Playwright). Proves browser runtime, real HTTP routing, and database writes work in tandem.
  - **CSS Regressions & Visual Breakages (e.g., text overflow, z-index collision, responsive wrapping)**: **Visual Regression Test** (Chromatic/Playwright snapshots). Catches pixel layout defects that DOM assertions cannot see.
  - **API Contract Drift (e.g., backend renames snake_case field to camelCase)**: **Contract Test** (Pact or OpenAPI schema validation). Catches payload drift before deployment.

```
Cost / Execution Time
▲  [ E2E (Playwright) ]              -> Critical business paths, auth, checkout
│  [ Visual Regression ]             -> Design systems, CSS overflow, responsive layout
│  [ Component/Integration (RTL) ]   -> Wiring, async states, user interaction flows
│  [ Contract (Pact/OpenAPI) ]       -> API payload shape divergence
│  [ Unit (Vitest/Jest) ]            -> Pure functions, reducers, date/currency utilities
▼  [ Static (TypeScript/ESLint) ]    -> Contract typos, syntax, null safety
Defect Detection Speed & Cost Efficiency
```

- [More detail on Test Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [More detail on The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

---

### Question 0165584e-9544-4390-b65b-a9394a8b431b

- What do **unit tests** actually buy you in a frontend codebase, and why does testing an isolated React component with mocked children fail to catch the most common UI bugs?

### Answer

- **What unit tests buy**: Near-instant feedback, deterministic isolation, and exhaustive edge-case testing for pure algorithmic logic (parsers, reducers, formatters, validation schemas).
- **The shallow component unit-test trap**: When a React component is tested by mocking its child components, custom hooks, and context providers:
  - You test React's internal ability to pass props, not your application's behavior.
  - **Missed defect classes**: Missing context provider errors (`useAuth must be used within an AuthProvider`), mismatched prop contracts between parent and child, unhandled CSS layout collisions, and race conditions between sibling state updates.
- **Senior rule**: Use unit tests for non-UI domain functions. When testing components, render the real child components and mock only external I/O boundaries (the network or browser device APIs).

```tsx
// ❌ Low-ROI Component Unit Test: Mocks all children, verifies zero actual integration
vi.mock('./UserAvatar', () => ({ UserAvatar: () => <div data-testid="avatar" /> }));
vi.mock('./BillingStatus', () => ({ BillingStatus: () => <div data-testid="billing" /> }));

it('renders children with props', () => {
  render(<UserProfile user={{ id: '1', name: 'Alice' }} />);
  // Proves nothing about whether UserAvatar actually renders Alice's image!
  expect(screen.getByTestId('avatar')).toBeInTheDocument();
});

// ✅ High-ROI Integration Test: Renders actual tree, mocks only network
it('displays user profile with active subscription badge', async () => {
  server.use(
    http.get('/api/users/1/subscription', () => HttpResponse.json({ plan: 'pro', active: true }))
  );
  renderWithProviders(<UserProfile userId="1" />);

  // Verifies real child component rendering and async data orchestration
  expect(await screen.findByRole('heading', { name: /alice smith/i })).toBeVisible();
  expect(screen.getByText(/pro member/i)).toBeVisible();
});
```

- [More detail on Component Integration Testing](https://testing-library.com/docs/guiding-principles)
- [More detail on Why Shallow Rendering is an Anti-Pattern](https://kentcdodds.com/blog/why-i-never-use-shallow-rendering)

---

### Question 52dca951-4781-4694-ba7b-ebd619f22853

- What are the architectural guarantees that only **End-to-End (E2E)** tests provide, and why must they be strictly rationed to critical revenue paths?

### Answer

- **Unique E2E guarantees**:
  - Real browser engine execution (V8, WebKit, Gecko) executing compiled JavaScript bundles.
  - Real browser storage (cookies, `localStorage`, session tokens, CORS headers).
  - True multi-step user navigation across distinct origin routes and full page refreshes.
  - Verification that the frontend and backend microservices correctly coordinate database mutations.
- **Why E2E tests must be rationed**:
  - **High cost**: Orders of magnitude slower than Vitest (seconds to minutes vs milliseconds per test).
  - **Flakiness susceptibility**: Susceptible to network jitter, animation delays, and race conditions.
  - **High maintenance**: UI layout tweaks break brittle locators if not designed with web-first locators.
- **The rationing discipline**: Restrict E2E tests to critical user journeys where failure halts the business:
  - User signup and authentication flows.
  - Checkout, subscription payment, and cart persistence.
  - Core CRUD workflows that define the company's value proposition.

```typescript
// ✅ Playwright E2E: Reserved for critical multi-step transactional integrity
test('guest user can add product to cart, authenticate, and complete purchase', async ({ page }) => {
  await page.goto('/shop/macbook-pro');
  await page.getByRole('button', { name: /add to cart/i }).click();

  await page.getByRole('link', { name: /checkout/i }).click();
  await page.getByLabel(/email address/i).fill('buyer@example.com');
  await page.getByLabel(/password/i).fill('Secret123!');
  await page.getByRole('button', { name: /log in & continue/i }).click();

  await page.getByRole('button', { name: /confirm order/i }).click();
  await expect(page.getByRole('heading', { name: /thank you for your order/i })).toBeVisible();
});
```

- [More detail on Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [More detail on Testing Strategies in Modern Web Apps](https://martinfowler.com/articles/practical-test-pyramid.html#End-to-endTests)

---

### Question 60f93e32-04e0-4a3a-9c52-357e0a181bf4

- Why are DOM-asserting tests inherently blind to **CSS and visual regressions**, and what specific failure modes does visual regression testing catch?

### Answer

- **The DOM assertion blind spot**: A DOM-asserting test inspects the HTML AST. It passes if `<button>Submit</button>` exists in the DOM and has an attached event handler. However, it cannot tell if:
  - An element has `z-index: -1` and is completely covered by a background div.
  - A layout change caused `overflow: hidden` to truncate the primary call-to-action button.
  - CSS variable compilation failure rendered black text over a black background (`#000000` on `#000000`).
  - Flexbox `flex-wrap` broke, pushing elements into invisible margins on mobile viewports.
- **What visual regression buys**: Catches layout shifts, broken typography, theme regressions (dark vs light mode), and unexpected CSS cascade side-effects by comparing pixel-level snapshots against accepted baselines.
- **Senior ROI judgment**: Use visual regression for design system components (buttons, dropdowns, typography tokens) and key application templates; avoid visual tests on dynamic, chaotic dashboard screens with constant real-time data shifts.

```typescript
// ❌ DOM test passes completely, yet the UI is totally unusable for human beings!
it('renders submit button', () => {
  render(<SubmitButton style={{ opacity: 0, pointerEvents: 'none', position: 'absolute', top: -9999 }} />);
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument(); // Green! But invisible!
});

// ✅ Visual Regression: Captures the actual rendered layout across viewports
test('pricing table responsive snapshot', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page).toHaveScreenshot('pricing-table-desktop.png', {
    maxDiffPixelRatio: 0.02, // Rejects even subtle layout regressions
  });
});
```

- [More detail on Visual Testing](https://storybook.js.org/docs/writing-tests/visual-testing)
- [More detail on Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)

---

### Question 7af2fdbe-cc55-4c44-bc07-cb0843373f80

- What percentage of accessibility defects do **automated axe scans** catch, and why can automated testing never replace manual assistive technology verification?

### Answer

- **The 30–40% automation reality**: Automated audits (e.g. `axe-core`, Lighthouse) identify approximately 30–40% of WCAG violations. They are excellent at catching programmatic rule violations:
  - Color contrast ratio failures.
  - Missing `alt` attributes on images.
  - Form `<input>` elements missing associated `<label>` tags.
  - Duplicate or invalid `id` attributes that break ARIA references.
- **What automated a11y tests cannot catch**:
  - **Meaningful accessible names**: An image with `alt="image123.jpg"` passes automated tests but fails WCAG 1.1.1 (Non-text Content).
  - **Focus order and keyboard traps**: Can a keyboard-only user navigate logically through a modal dialog and return focus to the trigger on close?
  - **Screen reader announcements**: Does `aria-live` convey dynamic status updates intelligibly without spamming speech output?
- **The Senior Protocol**:
  1. Automated axe checks in CI as a non-negotiable baseline gate for every PR.
  2. Manual keyboard navigation checks (Tab, Shift+Tab, Enter, Escape).
  3. Screen reader smoke testing (VoiceOver/NVDA) on critical interactive widgets.

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('dialog has no automated accessibility violations', async () => {
  const { container } = render(<CustomDialog isOpen title="Delete Account" />);
  const results = await axe(container);

  // ✅ Catches missing roles, bad ARIA attributes, contrast issues
  expect(results).toHaveNoViolations();
});
```

- [More detail on What Automated Accessibility Testing Can and Cannot Do](https://www.w3.org/WAI/test-evaluate/)
- [More detail on jest-axe](https://github.com/nickcolley/jest-axe)

---

### Question 263806b6-a12f-4591-b12e-808552850420

- What failure mode does **Consumer-Driven Contract Testing (Pact / OpenAPI)** prevent that isolated frontend mocks (MSW/Jest) cannot catch?

### Answer

- **The "green tests, broken production" failure**:
  - A frontend integration test relies on a mocked API handler returning `{ user_id: '123', email: 'a@b.com' }`.
  - The backend team refactors the endpoint to camelCase: `{ userId: '123', email: 'a@b.com' }`.
  - The frontend CI test suite runs against its static mock and **passes 100%**.
  - On deployment, the frontend crashes with `TypeError: Cannot read properties of undefined (reading 'user_id')`.
- **How contract testing operates**:
  - Frontend generates a contract specification defining the exact HTTP methods, headers, query parameters, and JSON payloads it expects.
  - The contract is published to a shared broker (e.g. Pact Broker) or validated against a shared OpenAPI schema.
  - In the backend CI pipeline, tests replay the contract requests against the actual backend implementation. If the backend schema deviates, backend CI fails before deployment.

```typescript
// Contract test: Formally specifies frontend expectation to the backend
import { pactWith } from 'jest-pact';

pactWith({ consumer: 'WebFrontend', provider: 'UserService' }, (provider) => {
  it('returns user details matching expected schema', async () => {
    await provider.addInteraction({
      state: 'user 123 exists',
      uponReceiving: 'a request for user 123',
      withRequest: { method: 'GET', path: '/api/users/123' },
      willRespondWith: {
        status: 200,
        body: { id: Matchers.string('123'), email: Matchers.email('user@test.com') },
      },
    });

    const user = await fetchUser('123');
    expect(user.id).toBe('123');
  });
});
```

- [More detail on Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [More detail on Pact Contract Testing](https://docs.pact.io/)
