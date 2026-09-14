# State Management

### Question f43d0c49-cead-43ee-a7f6-2095fea3187f

- What are the unique characteristics of server state compared to client state, and how do data sources and mutation frequency dictate state ownership?

### Answer

- _**Server State**_ is persisted remotely on backend databases, owned by the server, fetched asynchronously, and inherently prone to becoming stale across client sessions.
- _**Client State**_ is purely synchronous, owned 100% by the frontend, and destroyed on browser tab reload unless explicitly persisted (e.g., in _**localStorage**_).
- High mutation frequency or multi-user editing requires robust caching, automated refetching, background polling, or WebSocket synchronization rather than manual state synchronization.
- Frontend components should treat server state as a read-only local projection of remote truth rather than local mutable data.

---

### Question eca41fa2-48c6-4079-994d-aa7aeeb6886d

- How does React's reconciler determine if a state update occurred, and why does mutating objects or arrays directly break re-rendering?

### Answer

- React checks if state changed by comparing previous and next state values using _**Object.is**_ (shallow comparison).
- If you mutate an object or array directly (e.g., `user.name = "Alice"`), the reference memory address remains identical (_**Object.is(prev, next) === true**_).
- React skips the component re-render entirely because it assumes the state has not changed.
- Immutability creates a new object/array reference (_**[...items, newItem]**_), signaling React to trigger reconciliation and re-render affected subtrees.
- Direct mutations also corrupt memoization (_**React.memo**_, _**useMemo**_) and time-travel debugging tools.

```javascript
// ❌ WRONG: Direct mutation (reference stays same, React skips re-render)
const updateUser = () => {
  user.name = "Alice";
  setUser(user);
};

// ✅ CORRECT: Immutable update creates a new object reference
const updateUser = () => {
  setUser((prev) => ({ ...prev, name: "Alice" }));
};
```

---

### Question 1ad24992-4372-4dd7-84d6-b5e15ee7607d

- How does React 18 Automatic Batching work, and in what scenarios would a senior developer use flushSync?

### Answer

- _**Automatic Batching**_ groups multiple state updates into a single re-render, regardless of where they are triggered (event handlers, _**Promises**_, _**setTimeout**_, native handlers).
- It reduces intermediate paints and improves rendering performance automatically.
- _**flushSync**_ opts out of batching by forcing React to execute the pending state update and immediately flush changes to the DOM synchronously.
- Use cases for _**flushSync**_: Scrolling to a DOM node immediately after state change, measuring DOM element dimensions right after adding a child node.
- Caveat: _**flushSync**_ harms performance by breaking render prioritization and forcing sync layouts; use it sparingly as a last resort.

```javascript
import { useState, flushSync } from "react";

const handleMessage = () => {
  // Force immediate DOM update before measuring
  flushSync(() => {
    setMessages((prev) => [...prev, newMsg]);
  });
  // DOM is updated synchronously here
  listRef.current.scrollTop = listRef.current.scrollHeight;
};
```

---

### Question 556bc7ca-5967-4c0c-8d5c-fa60714d212f

- Why is storing derived state in useState or synchronizing it via useEffect an anti-pattern, and how should it be handled?

### Answer

- Stored derived data (e.g., `fullName = firstName + ' ' + lastName` or `filteredList`) in state causes redundant re-renders, state desynchronization bugs, and unnecessary complexity.
- Syncing derived state inside _**useEffect**_ causes an extra render cycle: Component renders with old state -> Effect runs -> State updates -> Component renders again with new state.
- Always compute derived state synchronously during render: `const fullName = `${firstName} ${lastName}`;`.
- Use _**useMemo**_ ONLY when the derivation involves expensive computations (e.g., filtering/sorting 10,000 items) to cache the calculation between renders based on dependencies.

```javascript
// ❌ Anti-pattern: Extra state + useEffect causes extra render cycle
const [items, setItems] = useState([]);
const [selectedItem, setSelectedItem] = useState(null);
useEffect(() => {
  setSelectedItem(items.find((item) => item.id === selectedId));
}, [items, selectedId]);

// ✅ Correct: Derive directly during render (zero extra renders)
const selectedItem = items.find((item) => item.id === selectedId);
```

---

### Question eee137d9-7b1c-4544-a01b-2e7838e1a955

- How does changing the key prop reset component state, and how does it compare to manually resetting state in useEffect?

### Answer

- React uses element _**type**_ and _**key**_ to determine component identity during reconciliation.
- Changing the _**key**_ prop signals to React that the old component identity is destroyed. React unmounts the old subtree, discards its state, and mounts a fresh component instance with initial state.
- Manually resetting state via _**useEffect**_ causes an initial render with stale props/state, followed by a layout shift/flicker when the reset effect fires.
- Using _**key**_ guarantees atomic, zero-flicker state resets when switching component contexts (e.g., switching user profiles `<UserProfile key={userId} />`).

```javascript
// ✅ Changing key forces React to unmount old instance and reset all local state
function ProfilePage({ userId }) {
  return <ProfileForm key={userId} userId={userId} />;
}
```

---

### Question 8f205b0b-d667-45fc-a39e-b0b40cc6af30

- What technical criteria determine when a component should transition from useState to useReducer?

### Answer

- Use _**useState**_ for independent, primitive, or isolated state fields (e.g., _**isOpen**_, _**inputValue**_).
- Transition to _**useReducer**_ when:
  - Multiple state fields depend on each other and update together (e.g., form state with status, data, error, and validation flags).
  - State logic involves complex state transitions or business rules (e.g., finite state machine semantics).
  - Next state calculation depends on deep properties of the previous state.
  - State updates need to be dispatched from deep child components, avoiding prop-drilling multiple state setters.
- _**useReducer**_ decouples state update logic (pure reducer function) from rendering logic, making state transitions 100% unit-testable in isolation.

```javascript
// ✅ useReducer handles interdependent state changes predictably
const [state, dispatch] = useReducer(formReducer, {
  data: null,
  isLoading: false,
  error: null,
});

// Single dispatch updates all correlated state fields atomically
dispatch({ type: "SUBMIT_START" });
```

---

### Question e6a36b03-eabe-4d3f-847d-5593f59ad443

- Why is the dispatch function from useReducer reference-stable, and why must reducers remain pure functions?

### Answer

- React guarantees that _**dispatch**_ (and _**setState**_ setters) identity is immutable across re-renders.
- Stable reference identity means adding _**dispatch**_ to _**useEffect**_ or _**useCallback**_ dependency arrays will never trigger re-execution.
- Reducers MUST be _**pure functions**_: given the same _**(state, action)**_ input, they must return the exact same new state with zero side effects.
- Side effects (API calls, logging, random numbers, timers, DOM mutations) inside a reducer violate React's Concurrent Rendering model, causing duplicate execution, race conditions, and non-deterministic behavior.

---

### Question 23b80f9d-316b-4e08-b71f-4350506c7107

- How does useRef differ from useState under the hood regarding Fiber storage, re-renders, and synchronous access?

### Answer

- _**useState**_ stores data on the Fiber node's memoizedState queue. Updating state schedules a component re-render and reconciliation pass.
- _**useRef**_ creates a persistent plain JavaScript object (`{ current: initialValue }`) attached to the Fiber node.
- Mutating _**ref.current**_ is a synchronous operation that does NOT schedule a re-render or trigger reconciliation.
- Reading/writing _**ref.current**_ during render can lead to bugs in Concurrent Mode because renders can be aborted or retried; update refs inside effects or event handlers instead.

```javascript
// useRef retains values without triggering renders
const renderCount = useRef(0);
useEffect(() => {
  renderCount.current += 1; // Does not cause re-render loop
});
```

---

### Question fc819bab-6050-4bbd-8884-39e09b6d12fd

- When should you use a Callback Ref over a Ref Object, and what are the best practices for non-DOM refs?

### Answer

- _**Ref Objects**_ (`useRef()`) do not notify you when the referenced node attaches or detaches from the DOM.
- _**Callback Refs**_ (`ref={(node) => ...}`) are function callbacks triggered by React whenever the DOM node mounts (_**node**_) or unmounts (_**null**_).
- Use _**Callback Refs**_ when measuring DOM elements (e.g., _**getBoundingClientRect**_), initializing third-party non-React libraries on element mount, or observing resize events.
- Non-DOM refs are best suited for storing mutable values that persist across renders without affecting UI representation: interval/timeout IDs, WebSocket connections, previous prop/state snapshots, and drag coordinates.

```javascript
// ✅ Callback Ref fires whenever node attaches or detaches
const [height, setHeight] = useState(0);
const measuredRef = useCallback((node) => {
  if (node !== null) {
    setHeight(node.getBoundingClientRect().height);
  }
}, []);
```

---

### Question d750a3bc-7973-4719-9aec-6e746f57d0f6

- How does React Context propagate updates down the Fiber tree, and why do all consumers re-render when a context value changes?

### Answer

- When a `<Context.Provider>` value changes, React scans down the Fiber tree to locate all components that invoked _**useContext(Context)**_.
- React marks these consumer Fiber nodes as needing an update (_**ForceUpdate**_), bypassing _**React.memo**_ or _**shouldComponentUpdate**_ optimization boundaries on parent components.
- React Context lacks built-in selector capabilities: if the context value is an object `{ user, theme }` and _**theme**_ changes, components reading ONLY _**user**_ will STILL re-render.
- Re-renders occur because the consumer's subscribed context reference changed; to optimize, you must split contexts or memoize consumer subtrees.

---

### Question 6c9580e8-e1de-45fd-bd8b-e33378acda58

- What is the Context Re-render Trap with inline provider values, and how do you prevent unnecessary consumer re-renders?

### Answer

- Passing inline objects or arrays to provider values (`<Context.Provider value={{ user, theme }}>`) constructs a NEW object reference on every parent render.
- Every render of the Provider's parent forces ALL consumer components to re-render, even if _**user**_ and _**theme**_ values did not change.
- Solution 1: Memoize the context value using _**useMemo**_ (`const value = useMemo(() => ({ user, theme }), [user, theme]);`).
- Solution 2: Move the state logic inside a dedicated Context Provider component so parent re-renders do not affect the provider's child tree.

```javascript
// ❌ WRONG: New object reference created on every parent render
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

// ✅ CORRECT: Value reference is stable unless user state changes
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
```

---

### Question 063a3431-130c-4c7d-92db-9c8ed5c76e29

- How does the Context Splitting pattern prevent action-only or state-slice consumers from unnecessary re-renders?

### Answer

- Combining state data and update dispatch functions into a single context causes components that ONLY dispatch actions to re-render whenever state changes.
- _**Context Splitting**_ separates data into two distinct context providers: _**StateContext**_ and _**DispatchContext**_.
- Components consuming _**DispatchContext**_ will NEVER re-render when _**StateContext**_ updates because the _**dispatch**_ function reference is permanently stable.
- This pattern scales Context performance for complex domain state without introducing external state management libraries.

```javascript
const StateContext = createContext(null);
const DispatchContext = createContext(null);

export function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(todoReducer, initialData);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}
// Consumers reading ONLY DispatchContext won't re-render on state change!
```

---

### Question cb9fee24-625f-4361-b45d-2e294dc59b8d

- How does Component Composition (children pattern) eliminate parent re-render cascades without using Context or React.memo?

### Answer

- In React, components passed as _**children**_ or props are evaluated and created in the parent scope, not inside the receiving container.
- When container state updates, the _**children**_ prop holds the exact same element reference (_**children === prevChildren**_).
- React's reconciler detects identical element references and skips rendering the _**children**_ subtree entirely (_**Same Element Reference Optimization**_).
- Composition is cleaner and faster than Context for layout components, modal containers, and stateful wrappers.

```javascript
// ✅ Updating scroll state re-renders Header, but NOT expensive children subtree
function ScrollLayout({ children }) {
  const [scroll, setScroll] = useState(0);
  return (
    <div onScroll={(e) => setScroll(e.target.scrollTop)}>
      <Header scroll={scroll} />
      {children} {/* Skipped during re-render because reference is unchanged */}
    </div>
  );
}
```

---

### Question d8ae3d41-713d-4dfc-b690-66933295523b

- How can you implement a fine-grained Context Selector pattern to restrict re-renders to specific state properties?

### Answer

- React Context has no native selector API (_**useContextSelector**_ is not built-in).
- To create fine-grained context subscriptions:
  1. Store the state inside a custom external store reference (e.g. _**useRef**_ holding store listeners).
  2. Pass the store instance (sub/pub bus) through React Context instead of passing the state values directly.
  3. Consuming components call _**useSyncExternalStore(store.subscribe, () => selector(store.getState()))**_.
- Consuming components only re-render when the specific selected primitive/reference value returned by the selector changes.

```javascript
// Component subscribes ONLY to theme slice via selector
function ThemeButton() {
  const theme = useStoreSelector(store, (state) => state.theme);
  return <button className={theme}>Click</button>;
}
```

---

### Question d1876e32-cb37-426a-a107-4e84f1ff031f

- What architectural criteria dictate choosing between React Context, Reducers, or an External Store/Cache library for application state?

### Answer

- _**React Context**_: Best for low-frequency, app-wide global settings (theme, locale, auth user) or scoped layout sharing; unsuitable for high-frequency domain state due to re-render cascades.
- _**useReducer**_: Best for complex, interdependent local state transitions within a single component tree without external dependencies.
- _**External Store / Cache (e.g., Zustand, Redux Toolkit, React Query)**_: Best for high-frequency domain state, fine-grained selector subscriptions, normalized entity caches, and server state management.
- Architectural selection depends on state ownership, update frequency, team maintainability, and whether fine-grained reactivity is required without provider wrapping overhead.

---

### Question 47f155e9-7caf-4a60-860b-c28f2eb54977

- What is tearing in React 18 Concurrent Rendering, and why is useSyncExternalStore required for external store subscriptions?

### Answer

- _**Tearing**_ is a visual artifact where two UI components display different values for the same underlying state within the same rendered frame.
- In React 18 Concurrent Rendering, React can yield/pause rendering mid-tree to process higher-priority user events.
- If an external store (mutable global object, WebSocket, browser storage) mutates while React is paused mid-render, components rendered after the pause read the new value, while components rendered before read the old value (_**Tearing**_).
- _**useSyncExternalStore**_ solves tearing by providing a synchronous snapshot mechanism (_**getSnapshot**_) and forcing React to fall back to synchronous rendering if external state mutates during a concurrent render pass.

---

### Question 0bcdbac4-09cb-4b22-92f6-c56772787955

- How do you implement a lightweight custom store using useSyncExternalStore with subscribe and getSnapshot callbacks?

### Answer

- _**useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)**_ requires two core functions:
  - _**subscribe**_: A function that registers a callback to be invoked whenever the store changes and returns an unsubscribe function.
  - _**getSnapshot**_: A function that returns an immutable snapshot of the current store state.
- _**getSnapshot**_ MUST return a stable reference if data hasn't changed; returning a new object reference on every call causes infinite re-render loops.

```javascript
import { useSyncExternalStore } from "react";

// 1. External Store implementation
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    setState: (fn) => {
      state = fn(state);
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const store = createStore({ count: 0 });

// 2. Component usage
function Counter() {
  const count = useSyncExternalStore(store.subscribe, () => store.getState().count);
  return <button onClick={() => store.setState((s) => ({ count: s.count + 1 }))}>{count}</button>;
}
```

---

### Question bae3c714-f3fa-4d40-8142-97235cd2f815

- How does useActionState manage pending state, returned form state, and errors for Server/Client Actions in React 19?

### Answer

- _**useActionState**_ is a built-in React 19 hook designed for handling form actions and asynchronous operations seamlessly.
- Signature: `const [state, formAction, isPending] = useActionState(actionFn, initialState);`.
- _**state**_: Holds the value returned by the last action execution (e.g. form validation errors, success messages).
- _**formAction**_: A wrapped action handler passed directly to `<form action={formAction}>` or invoked manually.
- _**isPending**_: A boolean indicating if the action is currently executing in a transition, eliminating manual _**isLoading**_ state variables.

```javascript
import { useActionState } from "react";

async function updateUser(prevState, formData) {
  const name = formData.get("name");
  if (!name) return { error: "Name is required" };
  await api.updateName(name);
  return { success: true };
}

function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateUser, null);

  return (
    <form action={formAction}>
      <input name="name" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        Save
      </button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

---

### Question a37cf8ba-37ca-4b41-8b90-9a3ae8556a2d

- What is State Colocation, and why is it more effective at preventing re-renders than wrapping components in React.memo?

### Answer

- _**State Colocation**_ is the architectural practice of moving state as close as possible to the components that read and write it.
- Lifting state up to a distant common ancestor forces the ancestor and all intermediate children to re-render whenever state changes.
- Moving state down into a localized component ensures that only the localized subtree re-renders, leaving the rest of the application tree untouched.
- _**React.memo**_ introduces overhead (shallow prop comparison on every render) and breaks easily when passing un-memoized callbacks or object props. Colocation eliminates the re-render at the source without comparison overhead.

```javascript
// ❌ WRONG: Modal open state lifted to top page component -> entire page re-renders on toggle
function Page() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Header />
      <ExpensiveDashboard />
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

// ✅ CORRECT: Colocate state inside a dedicated trigger/modal wrapper component
function ModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <Modal onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

---

### Question 5a923d52-263d-43e8-9dc8-0a11d11a91c3

- Why is syncing props to state inside useEffect an anti-pattern, and what bugs does it cause?

### Answer

- Writing `useEffect(() => { setState(props.value); }, [props.value]);` introduces an anti-pattern called _**State Mirroring**_.
- Bugs caused:
  1. _**Double Render Penalty**_: Component renders first with old state, effect runs post-paint, schedules update, component renders second time with new state.
  2. _**Stale UI Flicker**_: Users momentarily see outdated state before the effect fires and updates the screen.
  3. _**Split Source of Truth**_: State can get out of sync if local state is edited independently of prop updates.
- Solutions:
  - Compute derived data directly in render: `const value = props.value;`.
  - Reset state completely using the _**key**_ prop: `<Child key={props.id} />`.

---

### Question 633e9623-d809-4eb6-931f-894a2281ae55

- How do stale closures occur in asynchronous callbacks, and how do you resolve them cleanly in React?

### Answer

- A _**Stale Closure**_ occurs when a function callback captures variables from an earlier component render pass and is executed later after state has changed.
- Common trigger sites: _**setTimeout**_, _**setInterval**_, WebSocket event handlers, event listeners.
- Resolutions:
  1. _**Functional State Updates**_: Pass `setState(prev => ...)` so React injects the latest queued state.
  2. _**Mutable Refs**_: Store high-frequency or asynchronous callbacks/values in _**useRef**_ (`ref.current`), which can be read synchronously without re-subscribing.
  3. _**Proper Dependency Lists**_: Include all reactive variables in hook dependency arrays.

```javascript
// ✅ Solution using useRef to always execute the latest callback
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

---

### Question 8b6b874e-54e0-4253-aab4-a061784df184

- How can state management architecture be designed to support isolated testing across pure update logic, custom hooks, and mockable data boundaries?

### Answer

- _**Pure Update Logic**_: Extracting transition logic into pure reducer functions allows 100% unit test coverage in standard JavaScript without DOM dependencies or React test runners.
- _**Isolated Hook Testing**_: Testing custom hooks with tools like _**@testing-library/react-hooks**_ validates stateful side effects and lifecycle behavior in isolation from UI layout components.
- _**Mockable Data Boundaries**_: Abstracting API calls behind service interfaces or using tools like _**MSW (Mock Service Worker)**_ isolates state management tests from real network layers.
- Separating UI presentation from state logic ensures fast, resilient test suites that do not break during visual UI refactors.

```javascript
// Pure reducer function tested easily with Jest/Vitest without React!
describe("cartReducer", () => {
  it("should calculate total correctly", () => {
    const nextState = cartReducer({ items: [] }, { type: "ADD", item: { price: 10 } });
    expect(nextState.total).toBe(10);
  });
});
```

---

### Question 148d8601-4d79-40d7-9949-71f7152bf26e

- When reviewing React PRs, what specific code smells indicate over-architected global state or fragile state coupling?

### Answer

- Top Red Flags:
  1. _**Single Monolithic Context**_: Storing unrelated state (auth, UI modals, user theme, form drafts) inside a single giant Context Provider.
  2. _**Effect-Heavy State Syncing**_: Cascading _**useEffect**_ calls where one state update triggers another effect, which updates a second state variable.
  3. _**State Mirroring**_: Duplicating props or server query data into local _**useState**_ without a clear requirement for local mutation.
  4. _**Premature Globalization**_: Putting ephemeral UI state (e.g. _**isDropdownOpen**_) into a global Context or Redux store instead of local component state.
  5. _**Missing Immutability**_: Array methods like _**sort()**_, _**push()**_, _**splice()**_ called directly on state variables before passing to _**setState**_.
  6. _**Over-memoization**_: Wrapping simple primitive components in _**React.memo**_ or _**useCallback**_ while passing inline object literals or un-colocated state.

---

### Question 6451c744-5f07-4f11-a492-875295135fd1

- Does React Context provide state management by itself? Why or why not?

### Answer

- _**No, React Context is NOT state management**_: Context is purely a transport mechanism for passing values down a component tree without explicit prop drilling.
- _**State Management Requirements**_: A complete state management system must provide mechanisms to:
  1. Store state value.
  2. Mutate state safely.
  3. Select specific slices of state.
  4. Optimize component re-renders.
  5. Handle side effects / async logic.
- _**Why Context Lacks Management**_: Context only satisfies step 1 (passing values). Actual state storage and mutation logic must be powered by `useState` or `useReducer` inside a custom Provider component. Context itself does not manage, cache, or optimize state updates.

---

### Question bb896e45-3387-4192-8c68-a6671bb36f57

- How would you prevent unnecessary re-renders when using React Context?

### Answer

- _**Context Splitting**_: Split monolithic context into separate, single-purpose contexts (e.g. `StateContext` for data, `DispatchContext` for action callbacks). Components reading only actions won't re-render on state changes.
- _**Memoizing Provider Values**_: Wrap context value objects in `useMemo` so child consumers only re-render when reactive dependencies change rather than on every parent render.
- _**Component Composition (Children Pattern)**_: Pass static child JSX through `{children}` in Provider components so intermediate layouts avoid re-rendering.
- _**Fine-Grained Custom Subscriptions**_: Pass an external store reference (e.g., `useRef` event emitter) through Context and subscribe using `useSyncExternalStore` inside consumers.

```javascript
// Context Splitting + Memoization
const StateContext = createContext(null);
const DispatchContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const memoizedState = useMemo(() => state, [state]);

  return (
    <StateContext.Provider value={memoizedState}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}
```

---

### Question 9413cdf7-a100-4b46-a6bc-35ed72d51db2

- How would you structure multiple Contexts in a large application?

### Answer

- _**Context Separation by Domain**_: Split global context by domain responsibility (e.g. `AuthContext`, `ThemeContext`, `NotificationContext`, `CartContext`) rather than creating a single monolithic AppContext.
- _**Context Composition (Provider Tree Flattening)**_: Combine multiple Provider wrappers using a custom `ComposeProviders` component to eliminate deeply nested "JSX Provider Pyramids of Doom".
- _**Context Splitting (State vs Dispatch)**_: Separate read-heavy data contexts from write-only action contexts for high-frequency domain states to prevent unnecessary consumer re-renders.

```javascript
// Helper component to flatten multiple nested Providers cleanly
function ComposeProviders({ providers, children }) {
  return providers.reduceRight(
    (acc, [Provider, props]) => <Provider {...props}>{acc}</Provider>,
    children,
  );
}

// Usage in App root
<ComposeProviders providers={[[AuthProvider], [ThemeProvider], [CartProvider]]}>
  <App />
</ComposeProviders>;
```

---
