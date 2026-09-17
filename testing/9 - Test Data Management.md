# Test Data Management

### Question ec283d3b-f24b-409a-9bdd-e0b4e46477ff

- Why are **composable object factories** superior to rigid static JSON fixtures, and how do they prevent test fragility when data schemas evolve?

### Answer

- **The fragility of static JSON fixtures**:
  - Teams save `mockUser.json` with 40 fields.
  - When the user schema adds a required `tenantId` field, 200 disparate JSON fixtures across the codebase become invalid, requiring tedious manual editing.
  - Furthermore, static fixtures obscure test intent: when reading a test using `user_fixture_3.json`, it is impossible to discern which of the 40 fields actually matters for that specific test.
- **The Factory Pattern (`buildUser(overrides)`)**:
  - Provides sensible, valid defaults for all required fields.
  - Allows tests to override **only the fields relevant to the behavior being asserted**.
  - Centralizes schema changes in a single factory definition.

```typescript
// factories/user.ts
export function buildUser(overrides?: Partial<User>): User {
  return {
    id: 'usr_default_123',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'member',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// ❌ Bad: Static fixture hides intent
it('shows admin badge', () => {
  render(<UserBadge user={userFixture42} />); // Which of the 50 fields makes user 42 an admin?
});

// ✅ Good: Factory highlights the exact variable under test
it('shows admin badge when user has admin role', () => {
  const user = buildUser({ role: 'admin' });
  render(<UserBadge user={user} />);
  expect(screen.getByText(/admin/i)).toBeVisible();
});
```

- [More detail on Test Data Builders by Martin Fowler](https://martinfowler.com/bliki/TestObjectBuilder.html)
- [More detail on Factory Pattern in TypeScript Tests](https://kentcdodds.com/blog/test-isolation-with-react)

---

### Question 705f6d22-7771-4cb2-b190-1e03e5074cfa

- Why does testing with simplistic dummy data (e.g., `"test"`, `"foo"`) miss critical real-world bugs, and how does **production-realistic data variety** protect UI layout?

### Answer

- **The happy-path dummy data trap**:
  - Writing tests with names like `"Alice"`, prices like `10`, and titles like `"Book"` fails to challenge layout boundaries.
- **Production-realistic edge variations that break UI**:
  - **Extreme string lengths**: German compound words or 80-character customer names breaking card boundaries without truncation (`overflow: hidden; text-overflow: ellipsis`).
  - **Special characters & scripts**: Arabic/Hebrew RTL text, Asian multi-byte characters, and surrogate pair emojis (`👨‍👩‍👧‍👦`) breaking regex splits and string slicing.
  - **Number formatting extremes**: Floats with floating-point precision bugs (`0.1 + 0.2 = 0.30000000000000004`), negative currency balances, and huge totals (`$1,000,000,000.00`).
  - **Timezones**: Dates that cross leap years or midnight boundaries depending on client UTC offset.

```typescript
// ✅ Factory providing diverse, battle-tested edge values
export function buildEdgeCaseProduct() {
  return buildProduct({
    title: '🎧 Wireless Noise-Cancelling Headphones Pro Max Edition (2026)',
    description: 'Special character test: <script>alert(1)</script> & "quotes" + العربية',
    price: 199999.99, // Tests high-value currency formatter
    stockCount: 0,    // Tests out-of-stock badge
  });
}
```

- [More detail on Naughty Strings Test Suite](https://github.com/minimaxir/big-list-of-naughty-strings)
- [More detail on Generating Deterministic Mock Data](https://fakerjs.dev/)

---

### Question 442fd8ec-9888-441c-9a93-79ce442a7bd0

- What is the difference between **API/DB-seeded data per test** versus **shared mutable staging data** in E2E testing, and why does shared data break parallelization?

### Answer

- **The Shared Mutable Data Anti-Pattern**:
  - Multiple E2E tests share a single pre-seeded database with account `user@company.com`.
  - Test A updates the user's password; Test B attempts to log in with the default password.
  - When CI runs tests in parallel across multiple worker threads, Test A and Test B race against each other, causing random intermittent failures.
- **The Scalable Strategy: Isolated Seeded Data per Test**:
  - Each test dynamically creates its own isolated entities (e.g. `testOrg_${randomUUID()}`) via backend API endpoints or direct test database transactions before execution.
  - In teardown, the test deletes its specific entities.
  - **Zero collision**: 16 parallel Playwright runner threads can execute concurrently without touching or mutating any shared entity records.

```typescript
// playwright/fixtures.ts - Autonomous data lifecycle per test
test('invites team member to new organization', async ({ page, request }) => {
  // 1. Seed dedicated isolated org via fast API call
  const orgRes = await request.post('/api/test-helper/seed-org', {
    data: { name: `Org-${Date.now()}` },
  });
  const { orgId, ownerToken } = await orgRes.json();

  // 2. Execute test within isolated workspace
  await page.setExtraHTTPHeaders({ Authorization: `Bearer ${ownerToken}` });
  await page.goto(`/org/${orgId}/members`);
  await page.getByRole('button', { name: /invite member/i }).click();

  // ... assertions ...
});
```

- [More detail on Playwright Test Isolation](https://playwright.dev/docs/test-isolation)
- [More detail on Database Teardown Strategies](https://martinfowler.com/articles/practical-test-pyramid.html#DatabaseCleaning)

---

### Question 0e20dd44-02ad-45eb-9346-43c8dbb2bc6e

- Why are **giant DOM snapshots** considered technical dead weight, and what is the rule for **serialized intent snapshots**?

### Answer

- **The Giant Snapshot failure**:
  - Running `expect(container).toMatchSnapshot()` dumps 2,000 lines of generated HTML into a `.snap` file.
  - When a developer updates a shared button class, 40 snapshot files fail across the repo.
  - **The rubber-stamp reaction**: No human engineer will read 2,000 lines of diff in a PR review. Developers reflexively run `jest -u` or `vitest -u` to update snapshots without auditing, rendering the test completely useless.
- **The Serialized Intent Rule**:
  - Never snapshot full DOM component markup.
  - Only use snapshots for **small, targeted, serialized domain data structures** where a visual diff clearly highlights regressions (e.g., complex Redux action logs, GraphQL query shapes, parsed ASTs, or email template payload schemas).

```tsx
// ❌ Anti-Pattern: 1,500 lines of unaudited HTML DOM markup
expect(container).toMatchSnapshot();

// ✅ Serialized Intent: Small, readable, explicit regression check
const userPermissions = serializePermissionsTree(complexUserRoleObject);
expect(userPermissions).toMatchInlineSnapshot(`
  {
    "canDeleteWorkspace": false,
    "canExportInvoices": true,
    "maxUsersAllowed": 10,
    "tier": "enterprise",
  }
`);
```

- [More detail on Snapshot Testing Pitfalls](https://kentcdodds.com/blog/effective-snapshot-testing)
- [More detail on Jest Snapshot Testing Guidelines](https://jestjs.io/docs/snapshot-testing)
