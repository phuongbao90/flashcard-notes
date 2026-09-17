# Anti-patterns & Code Smells

### Question 3d920bbc-7434-4980-8306-2eaa8f55a8cf

- What are the **God Component** and **Golden Hammer** anti-patterns, and how do they manifest in modern frontend architectures?

### Answer

- **God Component**: A monolithic component that accumulates state, data-fetching, side-effects, sub-navigation, and presentation for an entire page into a single 1,500-line file. It violates SRP, causes unnecessary whole-tree re-renders, and is virtually impossible to unit test.
- **Golden Hammer**: Forcing a single favorite library, paradigm, or tool onto every engineering problem regardless of fit (e.g. using Redux for trivial toggle state, forcing GraphQL subscriptions on simple static pages, or deploying microfrontends on a 3-person team).

```tsx
// ❌ God Component: One monster component managing everything
function DashboardGodComponent() {
  const [user, setUser] = useState();
  const [billing, setBilling] = useState();
  const [notifications, setNotifications] = useState();
  const [metrics, setMetrics] = useState();
  // 30 useEffects, 40 helper functions, and 1,000 lines of JSX layout
  return (<div>{/* entire application UI */}</div>);
}

// ✅ Decomposed Architecture: Domain-bounded widgets composed into a layout
function DashboardPage() {
  return (
    <DashboardLayout>
      <UserProfileWidget />
      <BillingSummaryWidget />
      <MetricsChartWidget />
    </DashboardLayout>
  );
}
```

- [More detail on God Object Anti-Pattern](https://en.wikipedia.org/wiki/God_object)
- [More detail on Golden Hammer](https://en.wikipedia.org/wiki/Law_of_the_instrument)

---

### Question 42d6bd65-27c4-4e3c-b874-6000d42b1891

- What was Donald Knuth's full quote on **premature optimization**, and how do engineers misinterpret it to justify sloppy code?

### Answer

- **Full Knuth quote**: "We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%."
- **Common misinterpretation**: Engineers cite "premature optimization" to excuse `O(N^2)` rendering loops, memory leaks, unmemoized expensive transformations, or layout thrashing in hot animation loops.
- **Senior distinction**: Clean, idiomatic algorithms and standard efficiency (e.g. picking a `Set` for `O(1)` lookups instead of `.includes()` inside an array loop) are table stakes, not premature optimization. Premature optimization refers specifically to unmeasured, convoluted micro-optimizations (e.g. manual bitwise tricks or premature Web Workers for 10-item lists) before profiling actual bottlenecks.

```tsx
// ❌ Not "Premature Optimization" — Just Bad Engineering: O(N * M) lookup
function findActiveBad(items: Item[], activeIds: string[]) {
  return items.filter(item => activeIds.includes(item.id)); // O(N * M)
}

// ✅ Clean Table-Stakes Engineering: O(N + M) lookup using standard data structures
function findActiveClean(items: Item[], activeIds: string[]) {
  const activeSet = new Set(activeIds); // O(1) membership check
  return items.filter(item => activeSet.has(item.id));
}
```

- [More detail on Premature Optimization](https://en.wikipedia.org/wiki/Program_optimization#When_to_optimize)
- [More detail on Profiling React Components](https://react.dev/reference/react/Profiler)

---

### Question c0b1d86c-a452-4085-a880-5952f1e67515

- What is the difference between **Spaghetti code** and **Lasagna code**, and how does **Boat Anchor** waste engineering cycles?

### Answer

- **Spaghetti code**: Unstructured, entangled execution flow with cross-dependencies, global state mutations, and arbitrary jumps where tracing data flow requires reading 50 files.
- **Lasagna code**: The opposite extreme — an excessive number of paper-thin abstraction layers where every operation passes through a Controller, Service, Repository, Facade, Adapter, and DTO Transformer without adding real value or logic.
- **Boat Anchor**: Retained dead code, abandoned libraries, or speculative endpoints kept in the repo "just in case we need it again". It consumes build time, confuses newcomers, requires maintenance during refactors, and should be deleted immediately (version control preserves historical code).

```typescript
// ❌ Lasagna Code: 5 useless passthrough layers for a basic user query
class UserController { async get(id: string) { return this.service.get(id); } }
class UserService { async get(id: string) { return this.repo.get(id); } }
class UserRepository { async get(id: string) { return this.client.get(id); } }
class UserClient { async get(id: string) { return fetch(`/users/${id}`).then(r => r.json()); } }

// ✅ Pragmatic, Healthy Depth: A clean service boundary that does real work
export async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new ApiError('User not found', res.status);
  return userSchema.parse(await res.json());
}
```

- [More detail on Lasagna Code](https://en.wikipedia.org/wiki/Spaghetti_code#Lasagna_code)
- [More detail on Boat Anchor Anti-Pattern](https://wiki.c2.com/?BoatAnchor)

---

### Question 902c2e13-2693-40f9-85b7-37f60ba09626

- What are the **Primitive Obsession** and **Boolean Flag Parameter** code smells, and how do they harm maintainability?

### Answer

- **Primitive Obsession**: Using raw primitives (`string`, `number`) to represent domain concepts that have specific invariants (e.g., using `string` for a ZIP code, currency, or email address instead of a dedicated branded type or value object).
- **Boolean Flag Parameter**: Passing `boolean` flags to a function (`renderUser(user, true, false)`). A boolean flag is a telltale sign that the function does two completely different things and should be split into two separate, self-describing functions.

```typescript
// ❌ Boolean Flag Parameter Smell: Secretly two different functions bundled together
function exportData(format: 'json' | 'csv', includeMetadata: boolean) {
  if (includeMetadata) {
    // 50 lines of metadata aggregation...
  }
  // 50 lines of basic export...
}

// ✅ Clean Refactoring: Separate functions with clear, single intents
export function exportDataBasic(format: 'json' | 'csv') { /* ... */ }
export function exportDataWithMetadata(format: 'json' | 'csv') { /* ... */ }

// ❌ Primitive Obsession: String used for email, enabling invalid states
function sendVerification(email: string) { /* what if email === 'invalid-string'? */ }

// ✅ Value Object / Branded Type: Guaranteed valid by construction
type Email = string & { readonly __brand: unique symbol };
function sendVerification(email: Email) { /* statically guaranteed to be a valid email */ }
```

- [More detail on Primitive Obsession](https://refactoring.guru/smells/primitive-obsession)
- [More detail on Flag Arguments](https://martinfowler.com/bliki/FlagArgument.html)

---

### Question a5945861-ae35-4d37-b4a9-9b9f7e269005

- How do **Feature Envy**, **Shotgun Surgery**, and **Divergent Change** signal architectural decomposition problems during code review?

### Answer

- **Feature Envy**: A method or hook that accesses the data of another module more than its own. Fix: Move the calculation into the module that owns the data.
- **Divergent Change (SRP violation)**: One single module is frequently edited for multiple, completely unrelated business reasons (e.g. edited when authentication rules change AND when invoice layout changes).
- **Shotgun Surgery**: One single logical change forces scattered, coordinated edits across 15 different files. Fix: Consolidate the related logic into a single cohesive module.

```typescript
// ❌ Feature Envy: Component constantly inspects and calculates cart totals itself
function OrderSummary({ items }: { items: CartItem[] }) {
  // Envious of CartItem data: performing discount math that belongs to the Cart entity
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity) - (item.discount || 0), 0);
  return <div>Total: ${total}</div>;
}

// ✅ Refactored: Cart domain model encapsulates its own calculation
export class Cart {
  constructor(public readonly items: CartItem[]) {}
  get total(): number {
    return this.items.reduce((sum, item) => sum + item.calculateSubtotal(), 0);
  }
}
function OrderSummary({ cart }: { cart: Cart }) {
  return <div>Total: ${cart.total}</div>;
}
```

- [More detail on Feature Envy](https://refactoring.guru/smells/feature-envy)
- [More detail on Divergent Change](https://refactoring.guru/smells/divergent-change)

---

### Question c684723a-88c0-4aa3-93b1-d6f1b6e59ddd

- Why should **code smells be treated as hints rather than dogmatic rules** during engineering review?

### Answer

- **Context-dependent judgment**: A "smell" indicates something worthy of inspection, not an automatic defect. A 250-line pure function that implements a complex finite state transition table in one readable place is often vastly superior to 10 scattered micro-files.
- **Hidden complexity vs line count**: A 30-line function with three hidden global state mutations and asynchronous race conditions is far more dangerous than an 80-line pure switch statement.
- **Dogmatic refactoring risk**: Splitting code purely to satisfy arbitrary linter line-count rules creates artificial abstraction layers, jumps between files, and degrades developer velocity.

```tsx
// ✅ Acceptable "Smell": A long, pure, declarative mapping function
// Breaking this into 10 smaller files would destroy readability with zero architectural benefit
export function getTaxRateByZipCode(zip: string): number {
  switch (zip.slice(0, 2)) {
    case '90': return 0.095; // Los Angeles
    case '94': return 0.0875; // Bay Area
    case '10': return 0.08875; // NYC
    case '60': return 0.1025; // Chicago
    // ... 50 clean, cohesive, pure lookup cases in one transparent place
    default: return 0.05;
  }
}
```

- [More detail on Code Smells](https://martinfowler.com/bliki/CodeSmell.html)
- [More detail on Pragmatic Refactoring](https://refactoring.guru/refactoring/smells)
