# Coupling & Cohesion

### Question 06085365-de05-4c2f-8dbc-0a82fc474cd5

- What is the fundamental difference between **high cohesion** and **low coupling**, and how do they interact in modular frontend architecture?

### Answer

- **Cohesion (Internal relatedness)**: The degree to which elements within a single module belong together and serve a unified, focused purpose. High cohesion means functions and state within a module change together.
- **Coupling (External interdependence)**: The degree of direct reliance and knowledge between distinct modules. Low coupling means a module can be altered or replaced with minimal disruption to other modules.
- **Architectural goal**: Maximize cohesion (keep related logic together, such as form validation with form submission) while minimizing coupling (use clean parameter boundaries and interfaces rather than deep cross-imports).

```tsx
// ❌ Low Cohesion, High Coupling: Logic scattered across global bags
// 'userActions.ts' manipulates cart state, auth tokens, and DOM cookies directly
export function handleLoginAndCartSync(user: any, cart: any) {
  localStorage.setItem('token', user.token);
  cart.items.forEach((item: any) => window.__APP_GLOBAL_CART__.add(item));
  document.getElementById('header-avatar')!.innerText = user.name;
}

// ✅ High Cohesion, Low Coupling:
// Cart module encapsulates cart logic; Auth module encapsulates session; caller coordinates via clean contracts
export class CartService {
  private items: CartItem[] = [];
  syncRemoteItems(incoming: CartItem[]) {
    this.items = [...this.items, ...incoming];
  }
}

export function useCart() {
  // Cohesive hook managing cart operations with zero direct knowledge of DOM or token storage
  return useContext(CartContext);
}
```

- [More detail on Coupling and Cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science))
- [More detail on Software Modularization](https://martinfowler.com/articles/modular-monolith.html)

---

### Question 988a7846-f766-4e19-a85f-7c0f105d0b4b

- What are the major **types of coupling**, and why is **shared mutable state** considered the most dangerous form?

### Answer

- **Data coupling**: Modules communicate strictly through primitive data values or narrow DTOs (the healthiest coupling).
- **Control coupling**: One module passes a flag (e.g. `mode: 'admin' | 'guest'` or `shouldRedirect: boolean`) to dictate the internal execution flow of another module.
- **Temporal coupling**: Operations implicitly require an exact execution sequence (`connect()` must precede `query()`), with no compile-time enforcement.
- **Shared mutable state coupling (The most dangerous)**: Multiple modules read from and write to the same mutable global object or module-level variable. A modification by Module A unpredictably corrupts Module B depending on asynchronous race conditions.

```typescript
// ❌ Shared Mutable State Coupling: Global state mutated by disparate modules
export const globalAppState = {
  currentUserId: null as string | null,
  activeTheme: 'light',
  pendingOrders: [] as string[],
};

// Module A mutates state directly
export function setAuthUser(id: string) {
  globalAppState.currentUserId = id; // Any module can mutate or overwrite this at any moment!
}

// Module B implicitly relies on Module A having run, with no guarantees
export function processOrder(orderId: string) {
  if (!globalAppState.currentUserId) throw new Error('Unauthenticated');
  globalAppState.pendingOrders.push(orderId);
}

// ✅ Data Coupling (Safe): Pure parameters with explicit inputs and outputs
export function processOrder(userId: string, orderId: string, currentOrders: readonly string[]): string[] {
  return [...currentOrders, orderId];
}
```

- [More detail on Types of Coupling](https://en.wikipedia.org/wiki/Coupling_(computer_science))
- [More detail on Shared Mutable State](https://en.wikipedia.org/wiki/Shared-memory_concurrency)

---

### Question 5845a104-847b-411b-b701-8ca480a52d9e

- How does **temporal coupling** manifest in frontend lifecycle methods and hooks, and how can it be eliminated?

### Answer

- **Order-of-execution trap**: Temporal coupling occurs when functions or methods must be called in a strict chronological sequence, but the interface does not enforce that order at compile time.
- **Frontend manifestation**: Requiring `initializeChart()` to be executed before `updateDataset()`, or an effect relying on a separate hook's ref initialization in the same render pass.
- **Elimination via builder pattern or factory functions**: Eliminate temporal coupling by designing APIs where calling the initialization function returns an initialized instance capable of data updates, or passing all dependencies at construction time.

```tsx
// ❌ Temporal Coupling: Caller must know to call init() before render()
class ChartController {
  private canvas: HTMLCanvasElement | null = null;
  init(canvas: HTMLCanvasElement) { this.canvas = canvas; }
  render() {
    if (!this.canvas) throw new Error('You must call init() first!'); // Runtime crash!
    // draw chart...
  }
}

// ✅ Temporal Coupling Eliminated: Object cannot exist in an uninitialized state
class SafeChartController {
  private constructor(private canvas: HTMLCanvasElement) {}

  static create(canvas: HTMLCanvasElement): SafeChartController {
    return new SafeChartController(canvas);
  }

  render() {
    // Canvas is guaranteed to exist; invalid temporal states are impossible
    this.canvas.getContext('2d')?.fillRect(0, 0, 100, 100);
  }
}
```

- [More detail on Temporal Coupling](https://martinfowler.com/bliki/TemporalCoupling.html)
- [More detail on Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

---

### Question d78baa36-2a2e-4977-b53c-2003c5d1f889

- Why is **hidden coupling via globals and event buses** a primary red flag in senior code reviews?

### Answer

- **Invisible dependency graph**: When components communicate via global event emitters (`eventBus.emit('ORDER_COMPLETED')`), static analysis and TypeScript cannot trace which components respond or what payloads they expect.
- **Ghost listeners and memory leaks**: Components subscribing to global event buses must manually unsubscribe on unmount; failing to clean up keeps detached DOM nodes and state retained in memory.
- **Testing nightmare**: Tests cannot run in parallel because global event bus subscriptions leak across isolated test files, causing nondeterministic test failures.
- **Architectural alternative**: Use explicit React Context, direct callback props, or observable state machines (Zustand, Redux Toolkit) where listeners and states are statically type-safe and bound to component lifecycles.

```tsx
// ❌ Hidden Coupling: Global event bus with invisible listeners
import { eventBus } from '@/lib/bus';

function CartSummary() {
  // Invisible listener: No clue who emits this, or what data shape arrives
  useEffect(() => {
    const unsub = eventBus.on('DISCOUNT_APPLIED', (data: any) => recalculate(data));
    return unsub;
  }, []);
  return <div>Cart</div>;
}

// ✅ Explicit Coupling / Inversion: Explicit callbacks and typed Context
interface CartContextValue {
  applyDiscount: (code: string) => Promise<void>;
  discount: number;
}
const CartContext = createContext<CartContextValue | null>(null);

function CartSummary() {
  const { discount } = useCart(); // Statically typed, tree-scoped, zero memory leak risk
  return <div>Discount: {discount}%</div>;
}
```

- [More detail on Event-Driven Architecture Tradeoffs](https://martinfowler.com/articles/201701-event-driven.html)
- [More detail on Global State Anti-Patterns](https://kentcdodds.com/blog/application-state-management-with-react)

---

### Question f207ce3f-9c23-40e9-ac54-32b2bb3fcf7f

- How is the **blast radius of a change** used as a pragmatic working measurement of architectural coupling?

### Answer

- **Pragmatic coupling metric**: Blast radius measures the number of files, test suites, and deployed services that must be modified or re-verified when implementing a single business change.
- **High blast radius (Tightly coupled)**: Adding a single field to a user profile requires modifying backend SQL, API gateway schemas, client DTO types, 15 component prop signatures, and 20 test mocks.
- **Low blast radius (Loosely coupled)**: A feature addition touches only the specific module responsible for that capability; consumer modules consume the change via optional fields or composition without breaking changes.
- **Shotgun surgery avoidance**: When a single change forces scattered modifications across disparate files, the codebase suffers from divergent cohesion and tight coupling.

```typescript
// Pragmatic Code Review Assessment:
// Scenario: Backend adds 'user.preferredLanguage'

// ❌ High Blast Radius: Monolithic prop passing through 6 intermediate layers
// App -> Dashboard -> Layout -> Sidebar -> NavList -> UserAvatar
// All 6 intermediate components must touch their props interface!

// ✅ Low Blast Radius: Feature-scoped Context or Hook
// Only the leaf component that consumes preferredLanguage touches its code:
function UserLanguagePicker() {
  const { language, setLanguage } = useUserPreferences();
  return <select value={language} onChange={e => setLanguage(e.target.value)} />;
}
// Blast radius: Exactly 1 file modified. 0 intermediate components touched.
```

- [More detail on Shotgun Surgery](https://refactoring.guru/smells/shotgun-surgery)
- [More detail on Software Modularity Metrics](https://martinfowler.com/books/evans.html)
