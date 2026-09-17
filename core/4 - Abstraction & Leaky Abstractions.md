# Abstraction & Leaky Abstractions

### Question 49168aab-a05b-4dc5-8f2d-08db478e7408

- What is the **Single Level of Abstraction Principle (SLAP)**, and why is mixing abstraction levels in a single function a serious code smell?

### Answer

- **SLAP definition**: Every line of code inside a function should operate at the same level of conceptual abstraction. A high-level orchestration function should not mix high-level business logic with low-level bitwise operations or raw DOM manipulation.
- **The mixing smell**: When a function orchestrates checkout flow (`validateCart()`, `chargeCard()`), having three lines of raw regex parsing or direct `document.cookie = ...` strings inside that same function forces readers to jump between high-level architectural intent and low-level mechanical details.
- **Remedy**: Decompose the function so that high-level functions call intermediate step functions, which in turn call low-level primitive utilities.

```typescript
// ❌ SLAP Violation: High-level business flow mixed with low-level string manipulation and cookie parsing
async function processOrderCheckout(orderId: string) {
  const user = await fetchUser(); // High-level abstraction
  
  // Low-level detail leak: manual cookie parsing right in the business workflow
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('session_token='));
  const rawToken = tokenCookie ? tokenCookie.split('=')[1] : null;
  if (!rawToken) throw new Error('Unauthenticated');

  await api.submitOrder(orderId, rawToken); // High-level abstraction
}

// ✅ SLAP Compliant: All statements inside the orchestrator operate at the same conceptual level
async function processOrderCheckout(orderId: string) {
  const token = getSessionToken(); // Low-level detail encapsulated
  const user = await fetchUser();
  await submitOrderForUser(orderId, user, token);
}

function getSessionToken(): string {
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('session_token='));
  const rawToken = tokenCookie?.split('=')[1];
  if (!rawToken) throw new Error('Unauthenticated');
  return rawToken;
}
```

- [More detail on Single Level of Abstraction Principle](https://wiki.c2.com/?SingleLevelOfAbstractionPrinciple)
- [More detail on Clean Code Functions](https://martinfowler.com/books/clean-code.html)

---

### Question bd40c977-2cf6-463a-99d5-c5f90c0eb9d5

- What are **leaky abstractions (Spolsky's Law)**, and how do React Server Components (RSC) or JavaScript's `Array.prototype.sort()` leak their underlying mechanics?

### Answer

- **Spolsky's Law of Leaky Abstractions**: All non-trivial abstractions, to some degree, leak their underlying implementation details; callers cannot remain completely ignorant of what lies underneath.
- **RSC leak**: React Server Components abstract away the client-server network boundary by allowing developers to write async server code directly in component trees. However, the abstraction leaks through serialization constraints: functions, class instances, or circular references cannot cross props into `'use client'` boundaries.
- **`Array.prototype.sort()` leak**: JavaScript abstracts sorting algorithms under a simple `.sort()` method. However, the default implementation converts elements to strings before sorting (`[10, 2].sort()` yields `[10, 2]`), leaking the legacy ECMAScript dictionary conversion mechanic and causing subtle arithmetic bugs without an explicit comparator.

```tsx
// ❌ RSC Leaky Abstraction: Looks like a normal component prop, but leaks network serialization
import ClientModal from './ClientModal';

export default async function ServerPage() {
  const user = await db.user.findFirst();

  // Runtime error: Closures and methods cannot cross the client boundary!
  const handleClose = () => { console.log('Closed'); };

  return <ClientModal user={user} onClose={handleClose} />;
}

// ✅ Acknowledging and designing around the leak:
// Pass serializable DTOs across the boundary; handle client interaction within the client island
export default async function ServerPage() {
  const user = await db.user.findFirst();
  const serializableUser = { id: user.id, name: user.name }; // Plain DTO

  return <ClientModal user={serializableUser} />;
}
```

- [More detail on The Law of Leaky Abstractions](https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/)
- [More detail on React Server Component Serialization](https://react.dev/reference/rsc/use-client#serializable-types)

---

### Question 329b9e0d-0cbd-4e53-8e14-50d24cde3a3f

- What is **Hyrum's Law**, and why does it explain why internal "pure refactors" unexpectedly break production systems?

### Answer

- **Hyrum's Law definition**: "With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody."
- **Observable behavior vs contract**: Even if an API contract specifies that a response list is unordered, if the implementation happened to return items ordered by `creationDate` for 6 months, callers will omit sorting and rely on that order.
- **Frontend example**: Changing DOM markup or class name hashing during a component refactor breaks automated End-to-End tests or third-party user scripts that relied on incidental DOM structure rather than explicit accessibility roles.
- **Mitigation**: Minimize observable incidental surface (use data-testid / ARIA roles, freeze object property order in responses, or explicitly shuffle lists where order is not guaranteed).

```tsx
// Scenario: Refactoring a dropdown menu
// v1: Component rendered <ul><li> with class "menu-item"
export function DropdownItem({ label }: { label: string }) {
  return <li className="menu-item">{label}</li>;
}

// v2: Engineer "refactors" internal DOM to use modern semantic <button>
// ❌ Breaks consumer CSS or E2E tests: document.querySelector('li.menu-item') returns null!
export function DropdownItem({ label }: { label: string }) {
  return <button role="menuitem" className="dropdown-button">{label}</button>;
}

// ✅ Hyrum-Resilient Contract: Provide explicit stable hooks (role or data-testid)
export function DropdownItem({ label }: { label: string }) {
  return (
    <button role="menuitem" data-testid="dropdown-item" className="dropdown-button">
      {label}
    </button>
  );
}
```

- [More detail on Hyrum's Law](https://www.hyrumslaw.com/)
- [More detail on Software Engineering at Google](https://abseil.io/resources/swe-book/html/ch01.html)

---

### Question 2b6d4c0b-381e-4d31-b4e5-ccba020f315a

- How do you distinguish between **premature abstraction** and **earned abstraction** during architectural design?

### Answer

- **Premature abstraction**: Creating generic interfaces, wrappers, or configuration engines before encountering multiple concrete use cases. Driven by speculative developer imagination, resulting in rigid, ill-fitting parameters.
- **Earned abstraction**: Abstracting only after experiencing three distinct, concrete implementations (the Rule of Three). The abstraction is derived by discovering the common core among real, existing requirements.
- **Spike-then-extract workflow**: Write code imperatively first (the spike). Get the feature working and verified with tests. Observe the friction points, and extract shared abstractions only when distinct sites demand identical semantics.

```typescript
// ❌ Premature Abstraction: Generic, speculative query builder for an app with 1 search input
interface QueryFilter<T> {
  field: keyof T;
  operator: 'eq' | 'gt' | 'contains';
  value: any;
}
class QueryEngine<T> {
  build(filters: QueryFilter<T>[]) { /* 100 lines of dynamic SQL generation */ }
}

// ✅ Earned Abstraction: Simple dedicated fetcher until varied search criteria are actually required
export async function searchUsersByName(query: string): Promise<User[]> {
  const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
  return res.json();
}
```

- [More detail on The Rule of Three](https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming))
- [More detail on Refactoring by Martin Fowler](https://martinfowler.com/books/refactoring.html)

---

### Question b4b38ddb-eb63-4ee0-b691-4b2a3572da18

- Why should abstractions be placed at **natural system seams (I/O, time, randomness, auth)** rather than arbitrary internal code boundaries?

### Answer

- **Natural seams**: Seams are boundaries where your application crosses into non-deterministic, external, or side-effecting environments (network requests, filesystem, clocks, Math.random, authentication tokens).
- **Testability leverage**: Abstracting at natural seams allows unit and integration tests to swap non-deterministic dependencies with deterministic stubs (e.g. freezing system time or mocking network transport) without invasive monkey-patching.
- **Arbitrary boundaries tax**: Abstracting pure business logic that has no side effects (such as creating an interface for a basic string capitalization function) adds cognitive indirection without conferring testability or swappability benefits.

```typescript
// ❌ Arbitrary Seam: Creating an interface for a deterministic pure math operation
interface AdderInterface { add(a: number, b: number): number; } // Useless abstraction!

// ✅ Natural Seam: Abstracting time and system clock
// Non-deterministic seam: Date.now() prevents reproducible tests
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date { return new Date(); }
}

export class FakeClock implements Clock {
  constructor(private frozenDate: Date) {}
  now(): Date { return this.frozenDate; }
}

// Domain logic depends on the natural seam
export function isSubscriptionExpired(expiresAt: Date, clock: Clock): boolean {
  return clock.now().getTime() > expiresAt.getTime();
}
```

- [More detail on Working Effectively with Legacy Code (Seams)](https://martinfowler.com/bliki/Seam.html)
- [More detail on Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
