# React Hooks

### Question 6fadd979-0269-45ad-8f1d-af622cabf10c

- useActionState

### Answer

- **react 19**
- formerly **`useFormState`**

```ts
const [state, formAction, isPending] = useActionState(actionFn, initialState, permalink?);

async function actionFn(previousState: State, formData: FormData): Promise<State>{}
```

- **formAction**: Passed to `<form action={formAction}> or <button formAction={formAction}>`.
- **actionFn Signature**: Must accept `previousState` as its first parameter
  - unless use `.bind()` to add extra parameters
  ```ts
  // In Client Component:
  const updateItemWithId = updateItem.bind(null, id);
  const [state, formAction, isPending] = useActionState(updateItemWithId, initialState);

  async function updateItem(itemId: string, prevState: State, formData: FormData) { ... }

  ```
- this hook **does not reset the form when success**
  - **use ref to reset the form manually**

- [More detail on useActionState](https://react.dev/reference/react/useActionState)

---

### Question 4ee869c9-0d5a-4290-ab76-cee9d8ce0054

- How does React internally track hook state on fiber nodes, and why does this architecture mandate the Rules of Hooks?

### Answer

- **Singly linked list**: Hooks are stored as linked list nodes on `fiber.memoizedState` (`hook.next`).
- **Call-order cursor**: On each render pass, React advances an internal pointer (`workInProgressHook`) sequentially through the list in invocation order.
- **Order corruption**: Calling hooks conditionally or inside loops changes the number or sequence of calls, causing pointer alignment to mismatch between render passes (e.g., Hook #2 receives Hook #3's state and updater queue).
- **Rules of Hooks**: Enforcing top-level execution within React functions guarantees deterministic linked list traversal and 1:1 state mapping across commits.

- [More detail on Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

---

### Question 58bd6d89-638f-4d81-b2e2-d6760b1cfbfb

- Why does React StrictMode double-invoke component render functions and state updaters in development?

### Answer

- **Purity verification**: Rendering must be a pure calculation with no observable side effects. StrictMode intentionally executes render passes twice in development to surface unintended mutations.
- **Scope of double invocation**: Component function bodies, `useState`/`useReducer` functional updaters, and `useMemo` factory functions.
- **Failure mode surfacing**: Pure calculations return identical results; impure operations (e.g., mutating shared module variables or mutating draft state in-place) yield visual glitches or divergent states between invocations.
- **Zero production overhead**: Double-invocation is entirely stripped in production builds.

- [More detail on StrictMode](https://react.dev/reference/react/StrictMode)

---

### Question 9d7125db-1991-4e0a-bc55-b49071aa044a

- What are snapshot semantics in `useState`, and why does reading state immediately after calling `setState` yield the old value?

### Answer

- **Immutable render snapshot**: State variables within a render execution frame are constant values closed over for that specific render pass.
- **Scheduling vs Mutation**: `setState` enqueues an update request onto the fiber's update queue and schedules a future render pass; it never mutates the existing local variable.
- **Closure capture**: Any code running in the current tick (event handler, inline function) reads the immutable snapshot captured when the component function was invoked.

- [More detail on State as a Snapshot](https://react.dev/reference/react/useState#state-as-a-snapshot)

---

### Question b207517a-4c9d-4a75-9ffa-266b850d21ec

- When is a functional updater (`setCount(c => c + 1)`) mandatory over a direct value updater (`setCount(count + 1)`)?

### Answer

- **Batched updates in same tick**: Direct value updates calculate against the same render snapshot (`setCount(count + 1)` called 3 times evaluates `0 + 1` thrice, ending at 1).
- **Asynchronous closures**: Callbacks inside `setTimeout`, promises, or event listeners that close over a stale state snapshot.
- **Queue evaluation**: Functional updaters are queued on the fiber and evaluated sequentially: `state = updater(prevState)`.
- **Purity requirement**: Updater functions must remain pure because React may re-invoke them during concurrent rendering or StrictMode checks.

- [More detail on Updating state based on the previous state](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)

---

### Question f61a172a-8fed-46cb-b442-a50336a746b7

- How does automatic batching work in React 18+, and when is `flushSync` required?

### Answer

- **Universal batching**: React 18 batches all state updates triggered within promises, `setTimeout`, native browser events, and React synthetic events into a single render pass.
- **Performance benefit**: Prevents unnecessary intermediate component re-renders and redundant DOM style/paint recalculations.
- **`flushSync(callback)`**: Escape hatch that forces React to synchronously flush pending updates and mutate the DOM immediately.
- **When to use `flushSync`**: Integrating with imperative third-party DOM libraries, synchronously calculating scroll coordinates immediately after an item is added, or preparing the DOM before browser print dialogs.

- [More detail on flushSync](https://react.dev/reference/react-dom/flushSync)

---

### Question c9de7dad-d671-471f-ad29-419939671825

- How does calling `setState` during render work, and when is it preferred over `useEffect`?

### Answer

- **Execution mechanism**: Calling `setState` synchronously within the component body causes React to discard the current JSX return value and immediately restart rendering with the updated state *before* committing to DOM or painting.
- **Eliminating layout flicker**: Avoids the two-pass commit cycle of `useEffect` (`Render Old -> Paint Old -> Effect fires -> Render New -> Paint New`).
- **Mandatory guard**: Must be conditioned on a prop/state comparison (`if (prevProp !== prop)`) to prevent an infinite render loop.
- **Staff guideline**: Prefer computing derived values directly during render first; use setState-during-render only when state must reset or adjust based on prop transitions.

```tsx
function Selection({ item }) {
  const [prevItem, setPrevItem] = useState(item);
  const [selectedId, setSelectedId] = useState(null);

  if (item !== prevItem) {
    setPrevItem(item);
    setSelectedId(null); // Immediate re-render before commit
  }
}
```

- [More detail on Storing information from previous renders](https://react.dev/reference/react/useState#storing-information-from-previous-renders)

---

### Question 54601d67-da12-44dd-88ff-d9a3138344d2

- When does `useReducer` outperform `useState`, and why is dispatch identity significant?

### Answer

- **Complex transition logic**: Multiple interdependent sub-values where updating one state field requires transitioning others (finite state machine semantics).
- **Consolidating chained setters**: Replaces multiple consecutive `setState` calls with a single atomic action dispatch, eliminating invalid intermediate states.
- **Stable dispatch reference**: React guarantees the identity of `dispatch` never changes across re-renders, making it safe in `useEffect` dependency arrays and Context values without memoization.
- **Isolated testability**: Reducer functions are pure functions (`(state, action) => newState`) executable and testable in unit tests without mounting React components.

- [More detail on useReducer](https://react.dev/reference/react/useReducer)

---

### Question d316430c-4c1b-4476-8b54-373640636af3

- What is the primary purpose of `useEffect`, and why is treating it as a component lifecycle method an anti-pattern?

### Answer

- **Synchronization contract**: Synchronizing the component with external systems (browser DOM, network, timers, subscriptions, analytics). Not a hook to "run code after render."
- **Lifecycle trap**: Treating `useEffect` as `componentDidMount`/`componentDidUpdate` encourages synchronizing internal state with props, leading to cascading re-renders and race conditions.
- **Passive execution timing**: Passive effects run **asynchronously after the browser paints**, avoiding main-thread blocking during initial frame presentation.
- **Reversibility requirement**: Every effect must define its inverse via a cleanup function so synchronization can be cancelled or torn down cleanly.

- [More detail on Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

---

### Question cee62d76-db04-4ddb-9d17-8382e7460b21

- How do you prevent race conditions in asynchronous `useEffect` data fetching without external libraries?

### Answer

- **The stale response problem**: Fast sequential state/prop changes fire multiple overlapping async requests. An earlier, slower request resolving after a newer, faster request overwrites fresh state with stale data.
- **Pattern 1: AbortController**:
```javascript
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });
  return () => controller.abort();
}, [id]);
```
- **Pattern 2: Ignore flag**: Set a local `let ignore = false;` in the effect setup and set `ignore = true;` in cleanup; verify `!ignore` before setting state.

- [More detail on Fetching data in Effects](https://react.dev/learn/synchronizing-with-effects#fetching-data)

---

### Question d2569ea8-2a52-4f1e-bd83-ab395bb79d46

- What causes stale closures in `useEffect`, and how does `useEffectEvent` decouple non-reactive logic?

### Answer

- **Stale closure mechanism**: An effect captures variables from the render pass during which it was instantiated. Omitting reactive variables from dependencies causes the effect closure to read obsolete snapshots.
- **Reactive dilemma**: Adding non-reactive logic (e.g., an analytics ping or reading the latest theme) to the dependency array forces the entire effect to re-synchronize when only the logger changed.
- **`useEffectEvent` (experimental)**: Extracts non-reactive logic into an event function that always reads the latest values at execution time without needing to be included in the effect's dependency array.
- **Constraints**: Can only be called from inside effects; cannot be passed to other components or hooks.

```javascript
const onConnected = useEffectEvent(() => {
  logAnalytics('connected', roomUrl, theme); // Reads latest theme without theme dep
});

useEffect(() => {
  const socket = connect(roomUrl);
  socket.on('open', onConnected);
  return () => socket.disconnect();
}, [roomUrl]); // only re-runs when roomUrl changes
```

- [More detail on Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

---

### Question 5637ee5d-7cff-416e-a13b-d24e031702a1

- Why does React StrictMode mount, unmount, and re-mount components in development, and what does this diagnose?

### Answer

- **Development simulation**: React mounts the component, immediately invokes its cleanup function, and then runs setup again (`Setup -> Cleanup -> Setup`).
- **Remount resilience**: Verifies that the component can handle remounting with preserved state (e.g., React fast refresh, tab switching, offscreen rendering).
- **Diagnostic detection**:
  - Missing cleanup functions on event listeners, intervals, or WebSocket subscriptions.
  - Global state mutations that leak across component lifecycles.
  - Missing AbortControllers in asynchronous fetch operations.
- **Staff rule**: If code breaks or leaks in development under StrictMode, the cleanup is broken or missing—StrictMode is behaving correctly.

- [More detail on StrictMode Effect verification](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)

---

### Question 57e2cab4-32e7-4f0e-a494-fcb82eccc66f

- According to "You Might Not Need an Effect", what are the replacement patterns for derived data, user events, and state resets?

### Answer

- **Derived data**: Compute inline during render. Wrap in `useMemo` only if calculation is measurably expensive. Never duplicate props into state and sync via an effect.
- **User events**: Place logic inside event handlers (`onClick`, `onSubmit`), not in an effect listening to a state flag. Event handlers preserve access to user intent and exact event context.
- **Resetting state on prop change**: Pass a **`key` prop** to the component (e.g., `<Profile key={userId} />`). Changing the key forces React to recreate the component fiber with fresh initial state.
- **Chained state updates**: Consolidate interdependent fields into a single state object or `useReducer` to avoid cascading multi-render effect chains.

- [More detail on You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

---

### Question 19af59e2-aaa5-4de4-b923-75531ae432dd

- How does `useLayoutEffect` differ in timing from `useEffect`, and why is it hazardous in SSR?

### Answer

- **Synchronous execution before paint**: Runs synchronously immediately after React commits DOM mutations, but **before the browser paints** pixels to the screen.
- **Use cases**: Synchronous DOM measurements (`getBoundingClientRect`, scroll position), repositioning tooltips/popovers to prevent visual layout flicker.
- **SSR hazard**: The server environment lacks a DOM and cannot execute layout effects; invoking it on the server logs warnings and risks client-server hydration layout mismatches.
- **Performance penalty**: Blocks browser rendering; any expensive computation inside `useLayoutEffect` directly delays First Contentful Paint and increases input latency.

- [More detail on useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)

---

### Question 3bb11c74-28ff-41ea-bf22-a5e7e8566f4b

- What specific layout thrashing problem does `useInsertionEffect` solve in CSS-in-JS libraries?

### Answer

- **Timing**: Fires synchronously **before any DOM mutations are committed** and before `useLayoutEffect` runs.
- **Layout thrashing in CSS-in-JS**: If dynamic `<style>` tags are inserted during `useLayoutEffect`, the browser must recalculate styles and layout right as layout effects attempt to measure DOM geometry, triggering costly forced reflows.
- **Solution**: `useInsertionEffect` injects dynamic CSS rules into `<style>` tags before layout passes begin, ensuring styles are resolved prior to measurement.
- **Application boundary**: Built exclusively for CSS-in-JS library authors; application developers should use standard styling solutions or `useEffect`/`useLayoutEffect`.

- [More detail on useInsertionEffect](https://react.dev/reference/react/useInsertionEffect)

---

### Question 4944b852-6320-4dea-a2eb-ed73f115ef51

- What is the core contract of `useRef`, and why is reading or writing `ref.current` prohibited during render?

### Answer

- **Contract**: A persistent mutable container (`{ current: value }`) whose reference identity remains stable across all renders and whose mutation **never triggers a re-render**.
- **Render purity rule**: Reading or writing `ref.current` during render violates component purity and breaks Concurrent React.
- **Concurrent rendering hazard**: React can pause, discard, or restart concurrent render passes. Mutating refs in discarded render branches causes state leaks; reading refs during render causes sibling elements to observe different values in the same frame.
- **Safe access points**: Event handlers, `useEffect`, `useLayoutEffect`, or lazy initialization (`ref.current ??= init()`).
- **Decision rule**: If changing the value requires updating the visible UI, use `useState`; if the value must persist without affecting visual rendering, use `useRef`.

- [More detail on useRef caveats](https://react.dev/reference/react/useRef#caveats)

---

### Question 0c2ad44f-be24-4381-95eb-1100b7946f36

- When should you use a callback ref instead of an object ref (`useRef()`), and how do React 19 callback cleanups work?

### Answer

- **Dynamic lifecycle detection**: Object refs (`useRef()`) do not notify the component when the referenced DOM node is attached, detached, or swapped during conditional rendering.
- **Callback ref mechanism**: Passing a function `(node) => { ... }` executes when the DOM node mounts (with the element) and unmounts (with `null`).
- **React 19 cleanup functions**: Callback refs can now return a cleanup function directly:

```tsx
<div ref={(node) => {
  const observer = new ResizeObserver(entries => handleResize(entries));
  observer.observe(node);
  return () => observer.disconnect(); // React 19 ref cleanup
}} />
```

- **Use cases**: Measuring dynamically mounted elements, binding third-party listeners, and observing DOM nodes inside conditional lists.

- [More detail on Callback Refs](https://react.dev/reference/react-dom/components/common#ref-callback)

---

### Question 88453a2b-def3-4bd4-b205-43c6deb4e246

- How does the "latest-ref pattern" enable stable callbacks in custom hooks without causing stale closures?

### Answer

- **The callback stability problem**: Passing an inline callback to an effect or event listener often requires adding state variables to the dependency array, causing the effect to re-run and reconnect.
- **Pattern implementation**:

```javascript
function useEventCallback(fn) {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn; // update ref synchronously after render
  });
  return useCallback((...args) => ref.current(...args), []); // stable reference identity
}
```

- **Behavior**: The returned callback maintains permanent reference equality across renders, while guaranteeing that invocations always execute the freshest closure with current state.

- [More detail on Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

---

### Question bdf42349-2803-49a7-b025-7fd9f8e6d0df

- Why does `useContext` trigger consumer re-renders even when wrapped in `React.memo`, and what are the 4 re-render mitigation patterns?

### Answer

- **`memo` bypass**: `React.memo` only shallow-compares incoming props. When a Context provider receives a new value identity (evaluated via `Object.is`), React bypasses `React.memo` and forces re-renders on **all components calling `useContext`** for that provider.
- **Mitigation 1: Memoize Provider Value**: Wrap the context `value` object in `useMemo` so unchanged parent state does not create a new object reference.
- **Mitigation 2: Context Splitting**: Separate frequently changing state from rarely changing state (e.g., `ThemeContext` vs `UserContext`), or separate `StateContext` from `DispatchContext`.
- **Mitigation 3: Children Composition**: Pass child components as `{children}` or JSX elements to the Provider; React reuses their element instances and bails out of rendering them.
- **Mitigation 4: Selective Subscriptions**: Migrate granular sub-state consumption to external store libraries (`useSyncExternalStore`, Zustand) with selector functions.

- [More detail on Optimizing re-renders with useContext](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)

---

### Question fd3f9a5c-734d-4ec1-adb2-9d619f48d058

- Why is conditional invocation of `useContext` prohibited, and how should custom hook encapsulation be structured?

### Answer

- **Universal hook rule**: `useContext` cannot be wrapped in conditional statements or loops; conditional provision is achieved structurally by positioning Providers in the element tree.
- **Custom hook encapsulation**: Wrap the context in a dedicated custom hook (`useAuth()`, `useTheme()`) rather than exporting the raw Context object.
- **Fail-fast validation**:

```tsx
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

- **Refactoring flexibility**: Allows splitting or refactoring the underlying context provider architecture without modifying consumer component callsites.

- [More detail on Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)

---

### Question a39d4284-f16b-4489-899d-cc50b90a52f6

- What is "tearing" under Concurrent React, and why did `useEffect + useState` subscriptions fail to prevent it?

### Answer

- **Tearing definition**: An inconsistent visual state where different components on screen display divergent values for the same underlying external data source within a single render pass.
- **Concurrent failure mechanism**:
  - Under Concurrent React, render passes can yield execution to higher-priority user events.
  - If an external store updates while React is paused between rendering Component A and Component B, Component B reads the updated store while Component A committed the old store.
  - Result: UI displays conflicting, torn data.
- **`useSyncExternalStore` solution**: React verifies the snapshot value during concurrent rendering. If the store snapshot changes mid-render, React discards the concurrent pass and falls back to a synchronous re-render.

- [More detail on useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)

---

### Question 49aa88b1-273c-4aee-8626-2a3ea92b5166

- What is the contract of `getSnapshot` in `useSyncExternalStore`, and what bug occurs if it returns an unmemoized object?

### Answer

- **Immutable reference contract**: `getSnapshot` must return an immutable, cached reference or a primitive representing the current store state.
- **Infinite render loop bug**: If `getSnapshot` returns a newly created object or array literal (`() => ({ user: store.user })`), React evaluates `Object.is(prevSnapshot, nextSnapshot)` on every render.
- Because `Object.is({}, {})` evaluates to `false`, React assumes the store changed mid-pass, scheduling another render pass in an endless loop until maximum update depth is reached.
- **`getServerSnapshot`**: Mandatory for Server-Side Rendering to ensure the server-rendered markup matches the initial client snapshot during hydration.

- [More detail on useSyncExternalStore getSnapshot caveats](https://react.dev/reference/react/useSyncExternalStore#my-getsnapshot-should-return-a-different-object-each-time)

---

### Question 536fc5db-77e8-45c7-a24b-d45a1bc523e3

- How does `useTransition` preserve input responsiveness during expensive state updates compared to `useDeferredValue`?

### Answer

- **`useTransition` (Update-driven)**:
  - Wraps the state update call (`startTransition(() => setFilteredList(filter))`): marks the resulting re-render as low-priority.
  - Keeps the main thread responsive to urgent user events (keystrokes, clicks) by interrupting the non-urgent transition render.
  - Exposes `isPending` boolean to render loading indicators or dim the current UI.
- **`useDeferredValue` (Value-driven)**:
  - Wraps a value received from props or state (`const deferredQuery = useDeferredValue(query)`).
  - Renders the UI with the old value first, then immediately schedules a deferred background render with the new value.
- **Decision rule**: Use `useTransition` when you have direct access to the state setter function; use `useDeferredValue` when consuming props or values from an external hook.

- [More detail on useTransition](https://react.dev/reference/react/useTransition)
- [More detail on useDeferredValue](https://react.dev/reference/react/useDeferredValue)

---

### Question 73afef6b-d870-4e37-9980-dcf10fb52ae2

- How does React 19's `use()` API fundamentally break standard hook constraints, and how does it integrate with Suspense and RSC?

### Answer

- **Conditional & loop execution**: Unlike all traditional hooks, `use()` can be called conditionally (`if (condition) use(Context)`) and inside loops.
- **Promise unwrapping**: When passed a promise (`use(fetchPromise)`), React suspends component execution until the promise settles, displaying the nearest `<Suspense>` fallback.
- **Context reading**: Replaces `useContext` with support for conditional context reading.
- **RSC streaming integration**: React Server Components can pass streaming promises across the network boundary to Client Components; Client Components call `use(promise)` to consume data without `useEffect` or client-side fetch libraries.

- [More detail on React use API](https://react.dev/reference/react/use)

---

### Question 867c22bc-54c4-43c0-9dd2-4a4f994482de

- How does `useOptimistic` manage optimistic UI updates and automatic rollback in React 19?

### Answer

- **Immediate optimistic rendering**: Updates the UI instantly with anticipated mutation results while an asynchronous action is executing in the background.

```tsx
const [optimisticMessages, addOptimisticMessage] = useOptimistic(
  messages,
  (state, newMessage) => [...state, { text: newMessage, sending: true }]
);
```

- **Automatic rollback**: As soon as the async action or transition finishes (whether successful or rejected), React automatically discards the optimistic state and re-syncs to the authoritative state without manual `try/catch` rollback boilerplate.
- **Transition requirement**: Must be triggered inside a Transition (`startTransition`) or Server Action.

- [More detail on useOptimistic](https://react.dev/reference/react/useOptimistic)

---

### Question d0c6bf15-4602-447f-8971-8f5ed05354aa

- What problem does `useId` solve in React, and why must it never be used to generate list keys?

### Answer

- **SSR hydration stability**: Generates unique, stable IDs across server rendering and client hydration for accessibility wiring (`htmlFor`, `aria-describedby`).
- **Tree-position algorithm**: Derives IDs deterministically from the component's hierarchical position in the fiber tree, preventing hydration mismatches.
- **List key hazard**: Reordering, inserting, or filtering items changes their relative tree positions; `useId` would generate differing keys for the same items across renders, causing React to mismatch component instances, reset local state, and corrupt the DOM.
- **Staff rule**: List keys must come from data identifiers (e.g., entity IDs); `useId` is strictly for accessibility IDs.

- [More detail on useId](https://react.dev/reference/react/useId)

---

### Question 2e1b059e-7698-4e81-8aaa-dea6b10fd3d0

- What architectural role do custom hooks fulfill, and do multiple components using the same custom hook share state?

### Answer

- **Behavioral reuse**: Encapsulates reusable stateful logic, side effects, and lifecycle interactions, keeping components focused on declarative UI markup.
- **Per-instance state isolation**: Calling a custom hook in two separate components creates two completely independent sets of hook state and effect lifecycles. They never share state unless backed by an external store or Context.
- **Lint contract (`use*`)**: The `use` prefix is an explicit contract that informs `eslint-plugin-react-hooks` to enforce the Rules of Hooks inside the function body.
- **No magic scoping**: Follows identical closure, dependency array, and purity rules as standard components.

- [More detail on Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

### Question c2b794d7-06c0-4733-a1a9-123d99102f15

- What API design contract must custom hooks follow when returning objects and functions to consumer components?

### Answer

- **Referential stability contract**: Consumers frequently place functions or objects returned by custom hooks into `useEffect` dependency arrays or pass them to `React.memo` children.
- **Anti-pattern**: Returning unmemoized helper functions or object literals creates brand-new reference identities on every render pass, triggering infinite re-render loops in consumer effects.
- **Best practice**: Wrap returned helper functions in `useCallback` and configuration objects in `useMemo`, or return tuple arrays (`[state, action]`) with stable references.

- [More detail on Passing event handlers to custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks#passing-event-handlers-to-custom-hooks)

---

### Question 59da34b4-9a64-477a-bccd-28ecbabe0b8c

- Why is suppressing `react-hooks/exhaustive-deps` the leading cause of stale-closure bugs in production?

### Answer

- **Closure trapping**: Suppressing the linter comment causes effects or callbacks to reference variables from an earlier render cycle, silently executing against stale values.
- **Consequences**: Outdated conditionals, mutations applied to stale state, and cleanup functions failing to unbind dynamic event targets.
- **Staff-level resolution rules**:
  1. Need latest value without re-running effect? -> Use `useEffectEvent` or a mutable latest-value ref.
  2. Updating state based on previous state? -> Use functional updater (`setCount(c => c + 1)`).
  3. Object/array dep changing identity? -> Move the object literal inside the effect body or stabilize with `useMemo`.
- Never disable `exhaustive-deps`; treat lint warnings as architectural defects.

- [More detail on Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)

---

### Question 935d092d-6992-4c91-b34f-0371ec994663

- Why do non-deterministic expressions (`Math.random()`, `Date.now()`) during render cause SSR hydration mismatches, and how do you resolve them?

### Answer

- **Root cause**: The server renders HTML using one generated value (e.g., `id="0.4827"`). The client executes the render function during hydration and computes a different value, causing React's hydration engine to throw mismatch errors.
- **Solution for IDs**: Use `useId()` for deterministic, SSR-stable identifiers.
- **Solution for dynamic timestamps / client-only values**:
  - Render a deterministic placeholder during the initial render pass on both server and client.
  - Update to the client-specific dynamic value inside `useEffect`, which executes only on the client after hydration completes.

- [More detail on Handling Different Client and Server Content](https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content)

---

### Question d18a74dd-9a69-4ff6-81e5-bbdfa40f7ede

- What causes "effect storms" when using object or array dependencies, and how do you prevent them?

### Answer

- **Mechanism**: Inline object literals (`{ id, role }`) or array literals (`[item]`) defined in the component render body are allocated brand-new memory references on every render.
- **`Object.is` check**: `useEffect` compares dependencies using shallow equality. Because `Object.is({}, {})` is always `false`, the effect triggers after every render pass.
- **Effect storm**: Effect runs -> calls `setState` -> triggers re-render -> creates new object reference -> effect runs again.
- **Preventative patterns**:
  - Inline primitives: Depend directly on `[user.id, user.role]` instead of `[user]`.
  - Move definition inside effect: Declare the configuration object inside the `useEffect` body if it is not used elsewhere.
  - Memoize inputs: Wrap external objects in `useMemo` if they must be passed across boundaries.

- [More detail on Does some reactive value change unintentionally](https://react.dev/learn/removing-effect-dependencies#does-some-reactive-value-change-unintentionally)

---

### Question 82565882-e478-4769-a2c7-e66d06e7114c

- How do you trace hook execution order and effect lifecycles using React DevTools and strategic logging?

### Answer

- **DevTools Component panel**: Inspects the fiber's `memoizedState` linked list in exact order; displays custom hook names using `useDebugValue`.
- **Profiler flame graphs**: Identifies which specific state change or hook update triggered a commit, exposing cascading re-render chains.
- **Lifecycle log mapping**:

```javascript
useEffect(() => {
  console.log(`[Mount/Update] Setup for id: ${id}`);
  return () => console.log(`[Cleanup] Tearing down id: ${id}`);
}, [id]);
```

- **Execution verification**: In StrictMode dev, observe `Setup -> Cleanup -> Setup`. On dependency update, observe `Old Cleanup -> New Setup`.

- [More detail on React Developer Tools](https://react.dev/learn/react-developer-tools)

---

### Question 84c140c7-e30d-4be0-a0bf-68f46f1e1f21

- What is the disciplined 4-step diagnostic workflow for identifying and fixing hook contract violations?

### Answer

- **1. Reproduce under StrictMode**: Verify if the bug reproduces in dev under StrictMode double-invocation to distinguish concurrency/purity defects from production timing issues.
- **2. Classify the Contract Breach**:
  - Infinite loop -> Unstable dependency reference or unconditional `setState`.
  - Stale value -> Missing dependency or suppressed linter rule.
  - Visual flicker/tearing -> Passive effect timing (`useEffect` where `useLayoutEffect` or `useSyncExternalStore` was required).
- **3. Apply "Derive-Don't-Sync"**: Eliminate state variables and effects whenever values can be computed during render from existing props/state.
- **4. Ensure Reversibility**: Verify all external subscriptions, timers, and listeners have a reciprocal, idempotent cleanup function.

- [More detail on You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
