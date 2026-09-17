# Core Design Principles

### Question fa9b42b0-b57c-4389-9e38-b2258bac9111

- What is the failure mode of over-applying **DRY**, and why is "duplication far cheaper than the wrong abstraction" (Sandi Metz)?

### Answer

- **Authoritative representation of knowledge**: DRY means every piece of knowledge must have a single, unambiguous, authoritative representation in a system.
- **The failure mode (Accidental duplication)**: Merging two pieces of code that look identical today but evolve for different business reasons couples unrelated features. Changing requirements for one feature forces parameter flags (`if (isCheckout) ...`) into the shared helper.
- **AHA (Avoid Hasty Abstractions)**: Prefer duplication until patterns emerge naturally (the Rule of Three). Untangling a wrong, leaky abstraction is significantly more expensive than refactoring duplicate code when requirements stabilize.

```tsx
// ❌ Over-DRY Failure Mode: Merging customer & admin table cells with boolean flag forks
function GenericStatusBadge({ status, isAdmin }: { status: string; isAdmin?: boolean }) {
  // Over time, admin needs override colors, audit timestamps, and click-to-edit
  if (isAdmin) {
    return <span className="admin-pill" onClick={openAuditModal}>{status} (Override)</span>;
  }
  return <span className="customer-pill">{status}</span>;
}

// ✅ AHA Compliant: Allow two small, decoupled components until genuine domain unification exists
export function CustomerStatusBadge({ status }: { status: string }) {
  return <span className="rounded-full bg-green-100 text-green-800">{status}</span>;
}

export function AdminStatusBadge({ status, onAudit }: { status: string; onAudit: () => void }) {
  return (
    <button onClick={onAudit} className="rounded border border-dashed border-gray-400">
      {status} (Audit)
    </button>
  );
}
```

- [More detail on The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
- [More detail on AHA Programming](https://kentcdodds.com/blog/aha-programming)

---

### Question ebe7f479-a979-4bd8-a032-8aa2f2a8fc1d

- How does the **KISS (Keep It Simple, Stupid)** principle guide state management and component architecture?

### Answer

- **Simplicity over cleverness**: Software complexity compounds exponentially; the simplest solution that completely satisfies current requirements is the most maintainable.
- **Over-engineering trap**: Introducing global state stores, normalized entity adapters, or event buses for local UI state (such as an open/close toggle or simple tab switch) introduces cognitive overhead and boilerplate.
- **Implementation rule**: Start with local component state (`useState`). Lift state to the nearest common ancestor only when sharing is needed. Reach for global stores only when prop drilling causes severe architectural friction across distant trees.

```tsx
// ❌ Violating KISS: A complex reducer, action types, and dispatchers for a boolean modal
const modalReducer = (state: { isOpen: boolean }, action: { type: 'OPEN' | 'CLOSE' }) => {
  switch (action.type) {
    case 'OPEN': return { isOpen: true };
    case 'CLOSE': return { isOpen: false };
    default: return state;
  }
};

// ✅ KISS Compliant: Standard boolean hook
function UserProfile() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Edit</button>
      {isModalOpen && <EditModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
```

- [More detail on KISS Principle](https://en.wikipedia.org/wiki/KISS_principle)
- [More detail on Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)

---

### Question 39923feb-77c2-46a3-85e5-480d8969c972

- Why is **YAGNI (You Aren't Gonna Need It)** the critical architectural counterbalance to speculative flexibility?

### Answer

- **Build for today's constraints**: Implement things only when you actually need them, never when you merely foresee that you might need them.
- **Speculative cost**: Adding speculative options, generic plugin hooks, or multi-tenant database support "just in case" inflates bundle size, complicates debugging, and requires test maintenance for code that may never run in production.
- **Counterbalance to OCP**: While OCP encourages extensibility, YAGNI prevents developers from building complex abstraction layers before a second concrete requirement actually exists.

```tsx
// ❌ YAGNI Violation: Over-engineered generic filter system for a list that only filters by category
interface FilterStrategy<T> {
  predicate: (item: T, value: any) => boolean;
  serializer: (val: any) => string;
}

class ProductFilterEngine<T> {
  private strategies = new Map<string, FilterStrategy<T>>();
  registerStrategy(key: string, strategy: FilterStrategy<T>) { /* ... */ }
}

// ✅ YAGNI Compliant: Solve the actual requirement cleanly; extract when new filters arrive
function filterProductsByCategory(products: Product[], category: string | null) {
  if (!category) return products;
  return products.filter(p => p.category === category);
}
```

- [More detail on YAGNI Principle](https://martinfowler.com/bliki/Yagni.html)
- [More detail on Speculative Generality Code Smell](https://refactoring.guru/smells/speculative-generality)

---

### Question a214f3e0-475b-40f0-8c11-08fab41cf9dd

- How does **Separation of Concerns (SoC)** structure frontend code across architectural boundaries?

### Answer

- **Distinct modules for distinct duties**: A system should be divided into distinct sections, where each section addresses a separate concern (Data Access, Business Logic, Presentation, and Routing).
- **DAL boundary**: A Data Access Layer (DAL) abstracts raw database/network calls, ensuring UI components never perform direct SQL queries or construct raw fetch URLs.
- **Container vs Presentational split**: Container modules orchestrate state and side effects, while presentational modules translate props into pure JSX markup, ensuring UI can be designed and tested in isolation (e.g. via Storybook).

```tsx
// 1. Data Access Layer (Concern: network transport & serialization)
export async function getProductStock(productId: string): Promise<number> {
  const res = await fetch(`/api/inventory/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch stock');
  const data = await res.json();
  return data.availableQuantity;
}

// 2. Custom Hook / Application Layer (Concern: client-side lifecycle and state orchestration)
export function useProductInventory(productId: string) {
  return useQuery({ queryKey: ['inventory', productId], queryFn: () => getProductStock(productId) });
}

// 3. Presentational Layer (Concern: user interaction & styling only)
export function StockDisplay({ quantity, onRestock }: { quantity: number; onRestock: () => void }) {
  const isOutOfStock = quantity <= 0;
  return (
    <div>
      <span className={isOutOfStock ? 'text-red-600' : 'text-green-600'}>
        {isOutOfStock ? 'Out of Stock' : `${quantity} available`}
      </span>
      {isOutOfStock && <button onClick={onRestock}>Notify Me</button>}
    </div>
  );
}
```

- [More detail on Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [More detail on React Architecture Boundaries](https://martinfowler.com/bliki/PresentationDomainDataLayering.html)

---

### Question 0e5e3469-471f-445e-907e-c5d2a439d923

- Why did the React ecosystem abandon inheritance chains (mixins, base classes) in favor of **Composition over Inheritance**?

### Answer

- **The fragility of class inheritance**: Base class changes unexpectedly break derived components. In OOP hierarchies, subclasses inherit unnecessary baggage and state coupled to the parent class ("Gorilla-Banana problem").
- **Higher-Order Component (HOC) wrappers**: HOC chains created wrapper hell, name collisions on props, and poor TypeScript type inference.
- **Composition via hooks and children**: Custom hooks encapsulate behavior and stateful logic without altering component hierarchy; slot props and `children` allow parent components to compose layouts dynamically without knowing child implementations.

```tsx
// ❌ Inheritance Anti-pattern: Base dialog forcing layout and behavior onto subclasses
class BaseModal extends React.Component<{ title: string }> {
  renderHeader() { return <h2>{this.props.title}</h2>; }
  renderFooter() { return <button>Close</button>; }
}
class ConfirmModal extends BaseModal { /* Overriding methods, rigid coupling to base class */ }

// ✅ Composition: Compound slots and children allow total flexibility without shared hierarchy
function Modal({ children, isOpen, onClose }: { children: React.ReactNode; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="backdrop">
      <div className="dialog">{children}</div>
    </div>
  );
}

// Consuming components compose headers, bodies, and actions freely
export function DeleteConfirmDialog({ isOpen, onDelete, onClose }: { isOpen: boolean; onDelete: () => void; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>Delete Project</Modal.Header>
      <p>This action cannot be undone.</p>
      <Modal.Footer>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onDelete} className="bg-red-600 text-white">Delete</button>
      </Modal.Footer>
    </Modal>
  );
}
```

- [More detail on Composition vs Inheritance](https://legacy.reactjs.org/docs/composition-vs-inheritance.html)
- [More detail on Favoring Object Composition](https://en.wikipedia.org/wiki/Composition_over_inheritance)

---

### Question 2d537e88-ebc1-4220-836b-6f640b3b7c3a

- What is the **Law of Demeter ("Principle of Least Knowledge")**, and how does violating it through deep property chains degrade frontend code?

### Answer

- **Talk only to immediate friends**: A component or function should only communicate with its direct dependencies and immediate parameters, never navigate through intermediate collaborators.
- **Train-wreck smell (`a.b.c.d`)**: Writing `user.profile.shippingAddress.country.code` inside a payment button binds that button to the exact deeply nested schema of the user database.
- **Blast radius**: If the backend restructures `shippingAddress` into an array of addresses, every component that reached into the nested hierarchy breaks simultaneously.
- **Remedy**: Pass the specific leaf data required, or provide a helper method on the collaborator that encapsulates the path.

```tsx
// ❌ Law of Demeter Violation: Deeply reaches through foreign object graphs
interface Order {
  user: {
    membership: {
      tier: {
        discountPercent: number;
      };
    };
  };
}

function OrderDiscountSummary({ order }: { order: Order }) {
  // Breaks if membership or tier is made nullable or moved
  const discount = order.user.membership.tier.discountPercent;
  return <div>Discount: {discount}%</div>;
}

// ✅ Demeter Compliant: Component receives the direct value it needs or an immediate collaborator
function OrderDiscountSummary({ discountPercent }: { discountPercent: number }) {
  return <div>Discount: {discountPercent}%</div>;
}
```

- [More detail on Law of Demeter](https://en.wikipedia.org/wiki/Law_of_Demeter)
- [More detail on Message Chains Smell](https://refactoring.guru/smells/message-chains)

---

### Question 8b809479-2250-44a9-9a18-36d6e95757ad

- How does the **Principle of Least Astonishment (POLA)** govern UI component prop signatures and function contracts?

### Answer

- **Predictable behavior**: A component or API should behave in a way that minimizes surprises for engineers consuming it; conventions across the codebase should be strictly consistent.
- **Violations in frontend**:
  - A function named `getUser()` that unexpectedly triggers a state mutation or analytics tracking call.
  - A prop named `isOpen` that accepts an uncontrolled initial boolean rather than controlling current visibility (which should be named `defaultOpen`).
  - An array sort function that mutates the input array in place rather than returning a new sorted copy.

```tsx
// ❌ Astonishing Behavior: Mutates caller's array and triggers unexpected analytics side-effect
function getTopScores(scores: number[]): number[] {
  trackMetric('get_scores_called'); // Unexpected side effect in a getter!
  return scores.sort((a, b) => b - a).slice(0, 3); // MUTATES caller's original array!
}

// ✅ Least Astonishment Compliant: Pure calculation, zero side effects, non-mutating
function getTopScores(scores: readonly number[]): number[] {
  return [...scores].sort((a, b) => b - a).slice(0, 3);
}
```

- [More detail on Principle of Least Astonishment](https://en.wikipedia.org/wiki/Principle_of_least_astonishment)
- [More detail on Pure Functions](https://react.dev/learn/keeping-components-pure)

---

### Question ab8fdd7b-9df9-4eae-b6ac-0d5bf7afcb6d

- What is **Postel's Law (Robustness Principle)**, and why is its internal application criticized in modern typed codebases?

### Answer

- **The principle**: "Be liberal in what you accept, and conservative in what you send."
- **External boundary utility**: Excellent for public API inputs, webhook consumers, and browser parsers where accepting varied date formats (`ISO string`, `timestamp number`, `Date object`) prevents user-facing network crashes.
- **Modern criticism in internal contracts**: Being overly permissive in internal function contracts (e.g. accepting `string | number | boolean | null | undefined`) masks programmer mistakes, generates bloated defensive branches, and disables TypeScript's compile-time exhaustiveness checking.
- **Senior takeaway**: Apply Postel's Law at external boundaries (sanitize and normalize untrusted inputs into strict types), but enforce uncompromising, strict type contracts internally.

```typescript
// ❌ Over-applying Postel's Law internally: Lax signature spawns defensive boilerplate
function calculateTax(amount: string | number | null | undefined): number {
  if (amount == null) return 0; // Hides upstream bugs where amount was omitted!
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(parsed)) return 0;
  return parsed * 0.1;
}

// ✅ Robustness at Boundary, Strict Internally:
// Boundary: Normalize external string/null payloads into a strictly typed DTO
export function parseApiPayload(input: unknown): { amount: number } {
  return z.object({ amount: z.coerce.number().positive() }).parse(input);
}

// Internal: Strict contract allows clean, reliable, bug-free domain logic
export function calculateTax(amount: number): number {
  return amount * 0.1;
}
```

- [More detail on Robustness Principle](https://en.wikipedia.org/wiki/Robustness_principle)
- [More detail on Parse, Don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
