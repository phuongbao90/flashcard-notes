# Testing Strategy & Philosophy

### Question faea550a-db13-495f-ae6e-9affbec957f4

- Why does the classic testing pyramid mislead frontend architecture, and why does Kent C. Dodds' **Testing Trophy** prioritize integration tests as the primary investment?

### Answer

- **Frontend is an integration layer**: Unlike pure backend services where deep business logic resides in isolated domain entities, frontend applications exist primarily to integrate UI components, design system primitives, browser APIs, external network requests, and client state.
- **The flaw of the classic pyramid**: Placing the bulk of tests at the unit level leads to heavily mocked component tests. A component tested with mocked children, mocked hooks, and mocked network clients can achieve 100% test pass rates while failing completely when wired together in the DOM.
- **The Testing Trophy distribution**:
  - **Static checks (Base)**: TypeScript + ESLint catch typos, contract mismatches, and syntax errors at build time for near-zero runtime cost.
  - **Unit tests**: Fast and focused, reserved for pure logic (reducers, math calculators, date formatters, parsing utilities).
  - **Integration tests (Sweet spot)**: Render realistic component trees with real child components and network interception (MSW). Proves that user actions cause correct DOM updates and data flow.
  - **E2E tests (Apex)**: High-fidelity, real browser checks restricted to critical revenue paths (checkout, onboarding, authentication) due to execution speed and maintenance cost.

```
       Classic Pyramid                 Testing Trophy
           / \                              / \
          /E2E\                            /E2E\
         /-----\                          /-----\
        / Integ \                        / Integ \  <-- Largest ROI & volume
       /---------\                      /---------\
      /   Unit    \                    /   Unit    \
     /-------------\                  /-------------\
                                     /    Static     \
```

- [More detail on The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [More detail on Write Tests, Not Too Many, Mostly Integration](https://kentcdodds.com/blog/write-tests)

---

### Question 99b5ad0e-b23c-4f92-91bb-1bfe3dd447db

- What is the definitive heuristic for distinguishing **user behavior** from **implementation details**, and why are implementation-detail tests net-negative for a codebase?

### Answer

- **The Behavioral Heuristic**: Test exclusively what an end-user sees, hears, or interacts with, or what an external system (e.g. backend API) receives over the wire. Never assert internal component state variables, private class methods, or hook return structures.
- **Implementation-detail fragility**: Tests coupled to internal details (e.g., `expect(wrapper.state('isOpen')).toBe(true)`) break the moment an engineer refactors code (e.g., migrating from `useState` to a reducer or URL query param), even when the user-facing feature works flawlessly.
- **The Net-Negative impact**: Tests that fail on valid refactoring erode developer trust. Engineers spend more time repairing brittle tests than delivering features, eventually leading teams to disable or skip test suites.

```tsx
// ❌ Implementation-Detail Test: Breaks on refactor to useReducer or state machine
it('sets isOpen state to true when toggle button clicked', () => {
  const wrapper = shallow(<Accordion />);
  wrapper.find('button.toggle-btn').simulate('click');
  expect(wrapper.state('isOpen')).toBe(true); // Brittle! Couple to internal state name
});

// ✅ Behavior-Driven Test: Endures any internal state or component refactoring
it('expands panel content when user activates the accordion header', async () => {
  render(<Accordion title="Billing Details">Invoice #1234</Accordion>);
  const user = userEvent.setup();

  // Assert initial accessible DOM state
  expect(screen.queryByText(/invoice #1234/i)).not.toBeVisible();

  // Act as user
  await user.click(screen.getByRole('button', { name: /billing details/i }));

  // Assert visible user outcome
  expect(screen.getByText(/invoice #1234/i)).toBeVisible();
});
```

- [More detail on Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [More detail on Guiding Principles of DOM Testing](https://testing-library.com/docs/guiding-principles)

---

### Question 72701384-5c78-45e1-bce3-ec94914d88e6

- In code review, what is **the regression question**, and how does it prevent the accumulation of low-value test maintenance debt?

### Answer

- **The regression question**: "What specific production bug or user failure mode does this test catch that isn't already caught by static typing or another test?"
- **Test maintenance cost**: Every test has an ongoing cost: CI runtime, flakiness risk, and refactor maintenance. If a test only asserts that a component "renders without crashing" or that React forwards a prop, it provides near-zero confidence while charging a permanent tax.
- **Senior review filter**:
  - Reject tests that simply mirror JSX markup (e.g., asserting a `<div className="card">` exists).
  - Demand tests for boundary conditions: async network failure states, concurrent submission race conditions, empty data payloads, and permission boundaries.
  - If a test cannot plausibly fail due to a realistic regression, delete it.

```tsx
// ❌ Low-Value Test: Mirrors markup, catches zero realistic production regressions
it('renders card header with correct CSS class', () => {
  render(<ProfileCard name="Alex" />);
  const header = screen.getByRole('heading', { level: 2 });
  expect(header).toHaveClass('font-bold text-lg'); // Redundant with CSS/design system!
});

// ✅ High-Value Regression Guard: Guards against accidental double-billing race condition
it('disables submit button and prevents duplicate API calls while payment is in flight', async () => {
  const user = userEvent.setup();
  const mockSubmit = vi.fn().mockImplementation(() => new Promise((res) => setTimeout(res, 200)));
  render(<PaymentForm onSubmit={mockSubmit} />);

  const payButton = screen.getByRole('button', { name: /pay now/i });
  await user.click(payButton);
  await user.click(payButton); // Accidental rapid double-click

  expect(payButton).toBeDisabled();
  expect(mockSubmit).toHaveBeenCalledTimes(1);
});
```

- [More detail on Test Value vs Cost](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [More detail on Code Review Testing Standards](https://martinfowler.com/articles/practical-test-pyramid.html)

---

### Question 1a88511e-5c10-43a0-8ceb-463a0012bb9d

- Why is chasing **100% code coverage** considered an engineering anti-pattern, and what is the senior alternative for measuring test thoroughness?

### Answer

- **Execution ≠ Assertion**: Line and branch coverage only prove that code was evaluated by the JavaScript engine during a test run. A test that executes 500 lines with zero assertions achieves 100% coverage while guaranteeing 0% correctness.
- **The coverage gaming trap**: Mandating 100% global coverage incentives developers to write superficial tests asserting trivial getters, mock pass-throughs, and static UI templates while ignoring difficult async edge cases.
- **Risk-weighted ratcheting**:
  - Apply strict coverage thresholds (e.g., 90–95%) specifically on mission-critical paths: auth flows, checkout transactions, mathematical calculations, and permission gates.
  - Rely on smoke tests and static checks for low-risk presentational marketing views.
  - Implement **coverage ratcheting** in CI: enforce that new pull requests cannot decrease existing coverage on core business packages.

```json
// vitest.config.ts / jest.config.js - Risk-weighted coverage boundaries
{
  "coverage": {
    "thresholds": {
      // ✅ Non-negotiable strict verification on core transactional domain
      "src/domain/billing/**/*.ts": {
        "lines": 95,
        "branches": 90,
        "functions": 95,
        "statements": 95
      },
      // ✅ Pragmatic baseline on presentational UI leaves room for iteration
      "src/components/marketing/**/*.tsx": {
        "lines": 60,
        "branches": 50
      }
    }
  }
}
```

- [More detail on Code Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)
- [More detail on Ratcheting Test Coverage in CI](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html)

---

### Question d1eb6603-6608-492a-8319-5f387c3c5bf1

- When does **Test-Driven Development (TDD)** provide superior ROI in frontend development, and why is dogmatic TDD for UI components a known trap?

### Answer

- **Where TDD excels**: Pure deterministic domain logic with clear requirements:
  - Complex state reducers and finite state machines (e.g., checkout step transitions).
  - Business calculation engines (tax, shipping, currency conversion).
  - Parsers, serializers, and string/data normalizers.
  - Writing the test first clarifies the API signature, isolates edge cases, and prevents over-engineering.
- **The JSX dogmatic trap**: UI design is exploratory and fluid. Attempting strict TDD before visual layout, DOM hierarchy, and UX nuances are stabilized results in writing and rewriting tests for throwaway component trees.
- **The pragmatic senior stance**:
  - Test-first for domain logic, state machines, and bug reproductions (regression tests).
  - Test-during or test-after for React components: prototype the component first to establish UX/DOM structure, then immediately add behavior-focused integration tests guarding user interactions.

```typescript
// ✅ Ideal for TDD: Pure state reducer with strict transition invariants
describe('shoppingCartReducer', () => {
  it('applies tier-2 discount only when cart subtotal exceeds $100', () => {
    const initialState = { items: [{ id: '1', price: 60, qty: 1 }], discountCode: 'TIER2' };
    const nextState = cartReducer(initialState, { type: 'ADD_ITEM', payload: { id: '2', price: 45, qty: 1 } });

    expect(nextState.subtotal).toBe(105);
    expect(nextState.discountAmount).toBe(15.75); // 15% discount applied
    expect(nextState.total).toBe(89.25);
  });
});
```

- [More detail on TDD That Works](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [More detail on When to TDD in Frontend](https://kentcdodds.com/blog/when-i-follow-tdd)
