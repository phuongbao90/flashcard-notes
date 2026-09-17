# Test Architecture & Maintainability

### Question 2ca6f42b-f0a9-4efa-a358-efa8f9d0ee66

- How is the **Page Object Model (POM) vs Testing Library** debate resolved, and why is cargo-culting Page Objects into component integration tests an architectural anti-pattern?

### Answer

- **Where Page Objects Belong (E2E Workflows)**:
  - In Playwright/Cypress E2E tests, user journeys span multiple URLs, headers, modals, and tables.
  - Page Objects wrap complex, multi-page locators and navigation flows (`loginPage.loginAsAdmin()`, `checkoutPage.fillShippingDetails()`) behind an expressive domain API, shielding E2E scripts from minor DOM layout changes.
- **Why Page Objects are an Anti-Pattern in Component Tests (RTL)**:
  - React Testing Library is already designed as an accessible query abstraction (`screen.getByRole('button', { name: /save/i })`).
  - Wrapping component queries inside a Page Object class (`ButtonPageObject.clickSave()`) creates an unnecessary layer of indirection that obscures what the user actually sees, hides accessible name issues, and violates the simplicity of the Testing Library philosophy.
- **The Rule**: Use Page Objects to model entire pages and cross-route interactions in E2E; use direct Testing Library queries in component and integration tests.

```typescript
// ✅ Good: Page Object in Playwright E2E for complex cross-page flow
export class CheckoutPage {
  constructor(private page: Page) {}
  async completePurchase(card: CreditCard) {
    await this.page.getByLabel(/card number/i).fill(card.number);
    await this.page.getByRole('button', { name: /pay now/i }).click();
  }
}

// ❌ Bad: Cargo-culting Page Object into a 20-line component integration test
class ModalPageObject {
  static getCloseButton() { return screen.getByRole('button', { name: /close/i }); }
}
// Just write: await user.click(screen.getByRole('button', { name: /close/i }));
```

- [More detail on Playwright Page Object Models](https://playwright.dev/docs/pom)
- [More detail on Testing Library Avoid Page Objects](https://kentcdodds.com/blog/stop-using-page-objects-and-start-using-app-render)

---

### Question 12bcefa3-dc6d-42dd-8211-ab906153f221

- Why should test suites prioritize **DAMP (Descriptive And Meaningful Phrases)** over strict **DRY (Don't Repeat Yourself)**, and how does excessive test abstraction destroy maintainability?

### Answer

- **The DRY trap in test suites**:
  - Developers attempt to eliminate all duplication by creating complex shared setup functions, dynamic loops, and nested `beforeEach` hooks.
  - When a test fails, an engineer must mentally reconstruct 4 layers of helper functions across 3 files just to understand what data was fed into the component.
- **The DAMP philosophy**:
  - Tests are **executable specifications**. A developer reading a test should be able to understand the entire scenario (input, action, expected outcome) without leaving the test function.
  - Test suites tolerate repetitive setup code far better than production code.
- **The Balance**:
  - **Do abstract**: Test factories (`buildUser()`), custom renders (`renderWithProviders()`), and network mocks (MSW handlers).
  - **Do NOT abstract**: The core user actions and assertions. Keep the **Arrange-Act-Assert** sequence explicit and local to the test.

```typescript
// ❌ Over-Engineered DRY: Deeply nested beforeEach, impossible to read at a glance
describe('UserPermissions', () => {
  beforeEach(() => { setupBaseWorkspace(); });
  beforeEach(() => { elevateToManagerRole(); });
  it('allows billing export', () => {
    // What user? What workspace? What initial conditions were configured?
    expect(canExport()).toBe(true);
  });
});

// ✅ Clear DAMP: Self-contained, readable, explicit Arrange-Act-Assert
it('allows billing export when user has the manager role', () => {
  // Arrange
  const user = buildUser({ role: 'manager' });
  const workspace = buildWorkspace({ plan: 'enterprise' });

  // Act
  const permission = evaluateExportPermission(user, workspace);

  // Assert
  expect(permission.allowed).toBe(true);
});
```

- [More detail on DAMP vs DRY by Martin Fowler](https://martinfowler.com/bliki/GivenWhenThen.html)
- [More detail on Test Readability and Structure](https://kentcdodds.com/blog/write-tests)

---

### Question 519bd854-f288-48d4-905e-1b72015115dc

- How should **test descriptions (`it('...')`)** be authored to serve as behavioral specifications, and what are the classic anti-pattern naming styles?

### Answer

- **Tests as documentation**: When a test fails in CI, the test name is the first string printed on screen. A good test name immediately tells the on-call developer *what business requirement failed*, not what function threw.
- **The 3 Anti-Pattern Naming Styles**:
  1. **Method-name echo**: `it('calls validateUser()')` — coupled to implementation, reveals zero business meaning.
  2. **Vague success claims**: `it('works')`, `it('renders successfully')` — provides zero diagnostics on failure.
  3. **Conditional soup**: `it('should do something when clicked and condition is met')` — unspecific and wordy.
- **The Behavior-Driven Formula**:
  - State the subject and behavior under specific circumstances:
  - `[Subject] [Behavior / Outcome] when [Condition / Trigger]`.
  - Examples:
    - `"rejects checkout when credit card expiration date is in the past"`
    - `"disables submit button while transaction request is in flight"`
    - `"displays session-expired modal when API returns 401 Unauthorized"`

```typescript
// ❌ Poor Names: Reveal nothing about business behavior or failure cause
it('test 1', () => { ... });
it('handles click', () => { ... });
it('form validation works properly', () => { ... });

// ✅ Behavioral Documentation: Instantly actionable when seen in CI logs
it('displays red inline error message when email is missing @ symbol on blur', () => { ... });
it('preserves draft comment text in localStorage when network disconnects', () => { ... });
it('redirects unauthenticated guest to login page with returnUrl preserved in query param', () => { ... });
```

- [More detail on Test Naming Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices#%EF%B8%8F-12-name-your-tests-realistically)
- [More detail on Behavior-Driven Development](https://martinfowler.com/bliki/GivenWhenThen.html)

---

### Question 4b89f5ac-bb8a-496c-b16f-66032298453c

- What is **the delete instinct**, and why must tests guarding deprecated or removed business requirements be deleted rather than modified or kept?

### Answer

- **The test museum anti-pattern**:
  - When a product feature is removed (e.g. deprecating guest checkout in favor of mandatory SSO), teams often attempt to update or comment out old tests, or let them linger because "deleting tests feels wrong."
  - Over years, test suites turn into museums: hundreds of tests running in CI that guard features no production user cares about, adding minutes to build times and creating false alarms.
- **The Delete Instinct**:
  - Tests are not assets; they are **liabilities with an ongoing maintenance cost**.
  - A test is justified only as long as it guards a living, active business requirement.
  - The moment a feature is removed or replaced, **immediately delete every unit, integration, and E2E test guarding it**.
  - If a test constantly flakes and guards a low-risk edge case that hasn't failed in 2 years, the senior move is often to delete it rather than waste another engineering day debugging race conditions.

```
Feature Lifecycle & Test Governance:
┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│ Feature Conceived  │ ──►  │ Feature Active     │ ──►  │ Feature Deprecated │
│ Write Red Tests    │      │ Maintain Invariants│      │ DELETE TESTS!      │
│ (Regression/TDD)   │      │ Keep CI Green      │      │ Do NOT comment out │
└────────────────────┘      └────────────────────┘      └────────────────────┘
```

- [More detail on Deleting Tests by Kent C. Dodds](https://kentcdodds.com/blog/write-tests#the-cost-of-tests)
- [More detail on Test Suite Maintenance](https://martinfowler.com/articles/practical-test-pyramid.html#TestMaintenance)
