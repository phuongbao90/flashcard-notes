# Functional Programming Fundamentals

### Question 10daa86e-588b-402a-bdb3-17e62dccab15

- What are **pure functions**, and how does React's render model rely directly on mathematical function purity?

### Answer

- **Two deterministic invariants**: A function is pure if:
  1. Given the same arguments, it always returns the exact same result.
  2. It produces zero observable side effects (no mutation of external state, no I/O, no network calls).
- **React render purity**: React renders components as pure functions of `(props, state) -> JSX`. React's concurrent rendering, server components, and StrictMode double-rendering rely on idempotency: rendering can be aborted, paused, or re-run without corrupting application state.
- **Impure render bug**: Mutating a prop, modifying an external module variable, or triggering a network request during render causes tearing, infinite loops, and hydration mismatches.

```tsx
// ❌ Impure Component: Mutates external variable during render
let guestCount = 0;
function BadCup() {
  guestCount = guestCount + 1; // Side effect! Double-invoked by StrictMode, corrupting counts
  return <h2>Tea cup for guest #{guestCount}</h2>;
}

// ✅ Pure Component: Result depends strictly on props, zero external mutation
function GoodCup({ guestIndex }: { guestIndex: number }) {
  return <h2>Tea cup for guest #{guestIndex}</h2>;
}
```

- [More detail on Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [More detail on Pure Functions](https://en.wikipedia.org/wiki/Pure_function)

---

### Question e14e4eed-ef1a-4fcb-a927-c34957df94ef

- Why is **immutability** foundational to React and Redux, and how does **structural sharing** prevent the performance pitfalls of naive deep cloning?

### Answer

- **Predictable change detection (`O(1)` identity check)**: React components (`React.memo`) and Redux selectors verify state changes via shallow reference equality (`prev === next`). If state is mutated in place, the reference remains identical and UI components fail to re-render.
- **Naive cloning overhead**: `structuredClone()` or deep copy creates complete duplicate copies of an entire tree on every keystroke, causing high memory churn and garbage collection spikes.
- **Structural sharing (Immer / Persistent Data Structures)**: Only modified nodes and their direct ancestors in the object tree are re-instantiated with new references. Unchanged branches retain their original references, preserving memoization downstream.

```typescript
// Structural sharing visual:
// Root -> { user: {...}, cart: { items: [A, B] } }
// If we update user.name:
// - 'user' gets a new reference
// - 'cart' keeps its EXACT SAME reference in memory!
// - Components subscribed only to 'cart' do NOT re-render.

import { produce } from 'immer';

interface State {
  user: { name: string; avatar: string };
  heavyData: { list: number[] };
}

const prevState: State = {
  user: { name: 'Alice', avatar: '/pic.jpg' },
  heavyData: { list: [1, 2, 3, 4, 5] },
};

const nextState = produce(prevState, draft => {
  draft.user.name = 'Bob';
});

console.log(nextState.user === prevState.user); // false (Updated branch gets new ref)
console.log(nextState.heavyData === prevState.heavyData); // true (Shared branch untouched)
```

- [More detail on Updating Objects in React State](https://react.dev/learn/updating-objects-in-react-state)
- [More detail on Immer Structural Sharing](https://immerjs.github.io/immer/)

---

### Question a42b3dc1-3d7b-4dae-b615-3ce61ca83d4b

- How do **higher-order functions (HOFs)** and **function composition** enable modular pipelines instead of giant configuration objects?

### Answer

- **HOF definition**: A function that accepts one or more functions as arguments, returns a function, or both (e.g. `map`, `filter`, `compose`, `curry`).
- **Composition over configuration**: Instead of creating a bloated function with 15 boolean options (`processData(data, { sort: true, filterNulls: true, toUpper: true })`), compose small, single-purpose unary functions (`pipe(filterNulls, toUpper, sort)`).
- **Point-free readability**: Composable functions can be plugged, tested, and reordered independently without modifying internal pipeline code.

```typescript
// Small pure transformation primitives:
const filterActive = (users: User[]) => users.filter(u => u.isActive);
const sortByName = (users: User[]) => [...users].sort((a, b) => a.name.localeCompare(b.name));
const extractEmails = (users: User[]) => users.map(u => u.email);

// Generic function composition pipe:
const pipe = <T>(...fns: Array<(arg: T) => T>) => (initial: T) =>
  fns.reduce((acc, fn) => fn(acc), initial);

// Composed pipeline:
const getActiveSortedUserEmails = (users: User[]) =>
  pipe(
    filterActive,
    sortByName
  )(users).map(u => u.email);
```

- [More detail on Function Composition](https://en.wikipedia.org/wiki/Function_composition_(computer_science))
- [More detail on Higher-Order Functions](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)

---

### Question 1391f65a-f860-4930-bd6e-db3d0ff42d48

- What is **referential transparency**, and why is it the mathematical prerequisite for memoization (`useMemo`, caching)?

### Answer

- **Referential transparency**: An expression is referentially transparent if it can be replaced with its corresponding evaluated value without changing the program's observable behavior.
- **Prerequisite for memoization**: If `computeTax(100)` always evaluates to `10`, you can safely cache `{ 100: 10 }` and return the cached result on future calls.
- **The failure mode of impure caching**: If `computeTax` accesses a global `exchangeRate` variable or reads system time, replacing the call with a previously cached value returns stale or incorrect data, destroying correctness.

```typescript
// ✅ Referentially Transparent: Can replace computeHash('hello') with 99162322 anywhere
function computeHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return hash;
}

// React useMemo relies on referential transparency:
function HashViewer({ input }: { input: string }) {
  // Safe to memoize because computeHash has zero side effects and depends only on 'input'
  const hash = useMemo(() => computeHash(input), [input]);
  return <div>Hash: {hash}</div>;
}
```

- [More detail on Referential Transparency](https://en.wikipedia.org/wiki/Referential_transparency)
- [More detail on React useMemo](https://react.dev/reference/react/useMemo)

---

### Question ac527c93-7edb-43f5-9f75-1ef72e350a84

- What does **"Functional Core, Imperative Shell"** mean, and how does it structure clean frontend architectures?

### Answer

- **Separation of computation and side effects**:
  - **Functional Core (Inner)**: Consists of pure functions, domain models, and business calculations with zero side effects, zero network calls, and zero external dependencies. Extremely fast and simple to unit test.
  - **Imperative Shell (Outer)**: The boundary layer that handles impure operations (HTTP requests, reading local storage, triggering alerts, handling DOM events) and passes inputs into the pure core.
- **Frontend alignment**: Redux reducers or custom state machine reducers represent the functional core; React event handlers, thunks, or effects represent the imperative shell.

```typescript
// 1. Functional Core: Pure decision engine with zero I/O
export type Cart = { items: { price: number; quantity: number }[]; couponPercent?: number };

export function calculateCartTotal(cart: Cart): number {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cart.couponPercent ? subtotal * (cart.couponPercent / 100) : 0;
  return Math.max(0, subtotal - discount);
}

// 2. Imperative Shell: Orchestrates side effects, API calls, and updates UI
export async function handleCheckout(cart: Cart, paymentGateway: PaymentGateway) {
  const total = calculateCartTotal(cart); // Delegate calculation to pure core
  try {
    await paymentGateway.charge(total); // Shell performs I/O
    toast.success('Order placed successfully!');
  } catch (err) {
    toast.error('Payment failed');
  }
}
```

- [More detail on Functional Core Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
- [More detail on Pure Business Logic in React](https://react.dev/learn/extracting-state-logic-into-a-reducer)

---

### Question b2602267-4f5a-41b1-872d-1a1c350820ed

- What are the trade-offs between **declarative programming** (JSX, CSS, SQL) and **imperative programming** in UI engineering?

### Answer

- **Declarative (Describe "What")**: You describe the desired final state (`<h1>{title}</h1>`); the underlying runtime (React DOM reconciliation engine, browser CSS layout engine) figures out the mutation steps required to achieve that state.
- **Imperative (Describe "How")**: You write explicit step-by-step instructions (`document.createElement`, `appendChild`, `classList.add`).
- **Trade-offs**:
  - **Declarative advantages**: Predictable mental model, zero manual DOM cleanup or memory leak management, vastly reduced state sync bugs.
  - **Declarative drawbacks**: Debugging opacity (when performance drops, inspecting what the reconciler is doing requires deep engine knowledge), and leaky escape hatches (`ref`, `flushSync`, `requestAnimationFrame`).

```tsx
// ❌ Imperative: Manual DOM mutation steps (Brittle, prone to desync)
function updateCounterImperative(count: number) {
  const el = document.getElementById('count-display');
  if (el) {
    el.innerText = `Count is ${count}`;
    if (count > 10) el.classList.add('highlight');
  }
}

// ✅ Declarative: Describes target state; React reconciler performs optimal DOM patch
function CounterView({ count }: { count: number }) {
  return (
    <span className={count > 10 ? 'highlight' : ''}>
      Count is {count}
    </span>
  );
}
```

- [More detail on Declarative Programming](https://en.wikipedia.org/wiki/Declarative_programming)
- [More detail on React as a Declarative UI Library](https://react.dev/learn/describing-the-ui)
