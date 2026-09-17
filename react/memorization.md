# React

## React Memorization

### Question 52a6560d-3219-4608-9cd3-9268284964e5

- What is the purpose of `useMemo` in React?

### Answer

- Caches the **result of a calculation between renders** until specified dependencies change.
- Skips expensive recalculations on subsequent renders when dependency values remain referentially identical via **`Object.is`**.
- Provides **referential stability** for objects or arrays passed downstream to memoized children (`React.memo`) or hook dependency arrays (`useEffect`).
- **Does not guarantee memory retention**: React may discard the cached value under memory pressure or for offscreen components, recomputing it on the next render.

- [More detail on useMemo](https://react.dev/reference/react/useMemo)

---

### Question c8c55e55-ff66-422e-82d0-4b24c9a014df

- What is the primary purpose of `useCallback` and `useMemo` in React?

### Answer

- Optimize component render performance and maintain semantic correctness through two core mechanisms:
  - **Reducing work during render**: `useMemo` avoids re-running CPU-intensive transformations or filtering on unchanged data.
  - **Preserving referential stability**: Both hooks maintain stable object and function references across renders to prevent unnecessary downstream child re-renders (`React.memo`) and effect re-executions (`useEffect`).
- Neither hook prevents re-renders triggered by the component's own **local state updates** (`useState`, `useReducer`) or **consumed context changes** (`useContext`).

- [More detail on useMemo](https://react.dev/reference/react/useMemo)
- [More detail on useCallback](https://react.dev/reference/react/useCallback)

---

### Question b141e0a7-9c3a-4114-96f6-76dfaf66ab2e

- Can `useMemo` be used to replace `useCallback`, and how are they mechanically related?

### Answer

- Yes: **`useCallback(fn, deps)` is identical to `useMemo(() => fn, deps)`**.
- `useCallback` is **syntactic sugar** that caches the passed function directly, eliminating the need to write an outer factory function that returns the inner function.

```javascript
// useCallback syntax
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Identical behavior using useMemo
const handleClick = useMemo(() => {
  return () => {
    doSomething(id);
  };
}, [id]);
```

- [More detail on useCallback relationship with useMemo](https://react.dev/reference/react/useCallback#how-is-usecallback-related-to-usememo)

---

### Question 61489bb2-7b89-4698-8df4-f3197c0840ed

- When is memoization genuinely warranted in a React application?

### Answer

- Memoization is an optimization and contract tool that should be applied selectively:
  - **Expensive calculations**: Calculations, large list aggregations, or complex regex matching that tangibly block the main thread (measurably > 1ms).
  - **Preventing re-renders of heavy children**: Stabilizing props passed to components wrapped in **`React.memo`**.
  - **Generic custom hook return values**: Ensuring functions and objects returned by reusable hooks do not break consumers' dependency arrays.
  - **Context provider values**: Wrapping the Provider's `value` object in `useMemo` to avoid re-rendering all consumers when the provider re-renders.
  - **`useEffect` & `useSyncExternalStore` dependencies**: Stabilizing non-primitive inputs to prevent infinite loops or unwanted effect re-executions.

```javascript
function AuthProvider({ user, status, forgotPwLink, children }) {
  const memoizedValue = useMemo(() => ({
    user,
    status,
    forgotPwLink,
  }), [user, status, forgotPwLink]);

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
```

- [More detail on should you add useMemo everywhere](https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere)

---

### Question 79e5c29d-2408-48d3-9f3d-2209d1ed9e49

- Why do React children re-render by default when a parent re-renders, and how does reconciliation evaluate element trees?

### Answer

- **Default cascading re-renders**: When a parent component re-renders, React recursively calls all child component functions by default, regardless of whether their props changed.
- **Element instantiation**: In JSX, `<Child />` compiles to `React.createElement(Child, null)`, which produces a **brand-new JavaScript element object** (`{ type: Child, props: {}, ... }`) every render pass.
- **Diffing output vs. Diffing execution**: Reconciliation determines whether to mutate the real DOM by comparing element outputs, but it still executes the child component function to produce that output unless explicitly bailed out.

- [More detail on Render and Commit](https://react.dev/learn/render-and-commit)
- [More detail on React.memo](https://react.dev/reference/react/memo)

---

### Question 95da634e-b462-4af7-baa4-28b7781bdde4

- Why is JavaScript referential equality the primary cause of memoization failures in React?

### Answer

- **Identity vs. Value**: JavaScript compares non-primitive types (objects, arrays, functions) by **memory reference (identity)**, not by structural value (`{} !== {}` and `(() => {}) !== (() => {})`).
- **Re-creation on render**: Inline literals and function declarations allocate new memory addresses on every component execution pass.
- **Dependency array invalidation**: Hook dependency arrays and `React.memo` evaluate dependencies using **`Object.is`**; new references register as changes, causing memoized subtrees and effects to recalculate every render.

- [More detail on Object.is equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)
- [More detail on minimizing props changes](https://react.dev/reference/react/memo#minimizing-props-changes)

---

### Question 7f811f02-bf29-4f39-aa1f-eb5381dea73a

- How does React's shallow comparison work in `React.memo` and hook dependency arrays, and why does it fail on nested data structures?

### Answer

- **Shallow comparison mechanism**: Compares previous and next values using **`Object.is`** across top-level keys only (1 level deep):
```javascript
Object.is(prevProps[key], nextProps[key]);
```
- **Nested object failure**: If a prop is an object with nested properties (e.g. `options={{ filter: { active: true } }}`), `Object.is` compares the outer `options` reference and inner `filter` reference, not their inner scalar fields.
- A newly allocated outer or inner object reference fails the equality check even if all nested scalar values are identical.

- [More detail on React.memo object props](https://react.dev/reference/react/memo#my-component-rerenders-when-a-prop-is-an-object-or-array)

---

### Question 68e1c117-1376-4ad9-b7c2-5d6ce7fcbf94

- What is the difference between avoiding work in the render phase versus the commit phase, and where does memoization operate?

### Answer

- **Render Phase**: React calls the component function, calculates JSX, and runs reconciliation diffing against the Fiber tree.
- **Commit Phase**: React applies computed differences to the real DOM (`appendChild`, `updateDOMProperties`).
- **Commit skip without memo**: If an unmemoized component re-renders but produces identical DOM output, React **skips the commit phase** (no DOM mutation), but still pays the full CPU cost of executing the component function and diffing child elements.
- **Render skip with memo**: `React.memo` intercepts execution during the **render phase**, bailing out before the component function is ever invoked, saving both JavaScript execution and tree reconciliation diffing.

- [More detail on Render and Commit phases](https://react.dev/learn/render-and-commit)

---

### Question 660a3840-3783-4698-b458-0cd1fb4daba8

- How does `React.memo` determine whether to skip rendering a component, and what are its boundaries?

### Answer

- **Higher-Order Component**: Wraps a component to memoize its rendered output based on prop comparison.
- **Prop equality check**: Uses `Object.is` to shallowly compare `prevProps` against `nextProps`. If all top-level props are referentially identical, React bails out and reuses the previous Fiber output.
- **Internal state boundary**: `React.memo` **never prevents re-renders** caused by the component's own `useState` or `useReducer` updates.
- **Context boundary**: Any context consumed via `useContext` will bypass `React.memo` and force a re-render whenever the context value changes.

- [More detail on React.memo](https://react.dev/reference/react/memo)

---

### Question 01068d41-03fa-42d6-8e95-b28bf508acc2

- What is the contract of the `arePropsEqual` custom comparator in `React.memo`, and how does its boolean return value differ from `shouldComponentUpdate`?

### Answer

- **Signature**: `arePropsEqual(prevProps, nextProps)`.
- **Inverted boolean logic**:
  - Returns **`true`** to indicate props are equal → **skip re-render** (bailout).
  - Returns **`false`** to indicate props changed → **trigger re-render**.
  - Opposite of class-component `shouldComponentUpdate`, which returns `true` to render.
- **Stale prop risk**: Omitting deep comparisons or ignoring function props in `arePropsEqual` causes the component to capture stale props and closures without re-rendering, causing silent data desynchronization.

- [More detail on custom comparison in React.memo](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function)

---

### Question 280f175d-94f1-484c-bb18-bc8ff660a79b

- How do inline object literals, arrays, and functions break `React.memo` on child components?

### Answer

- **Reference recreation**: Evaluating `{ color: 'red' }`, `[1, 2]`, or `() => handleClick()` inside parent JSX allocates a new memory reference on every parent render pass.
- **Shallow comparison failure**: The child wrapped in `React.memo` compares `prevProps.style !== nextProps.style` via `Object.is`, which evaluates to `false`.
- **Defeated optimization**: The child re-renders on every parent render; the shallow comparison check becomes pure overhead.

```javascript
// ❌ Defeats React.memo(ItemRow) on every parent render
<ItemRow config={{ mode: 'dark' }} onSelect={() => selectItem(id)} />

// ✅ Preserves React.memo bailout
const config = useMemo(() => ({ mode: 'dark' }), []);
const handleSelect = useCallback(() => selectItem(id), [id]);
<ItemRow config={config} onSelect={handleSelect} />
```

- [More detail on minimizing props changes](https://react.dev/reference/react/memo#minimizing-props-changes)

---

### Question 63cf014f-94d4-4d83-aba7-29fbfae19428

- Why does passing `children` to a component wrapped in `React.memo` frequently defeat memoization?

### Answer

- **JSX desugaring**: `<MemoizedCard><Content /></MemoizedCard>` passes `props.children` as `React.createElement(Content, null)`.
- **New element object**: Every time the parent renders, it creates a brand-new `children` React element object reference (`prevProps.children !== nextProps.children`).
- **Shallow diff failure**: `React.memo` shallowly compares `prevProps.children` with `nextProps.children`; because the references differ, `React.memo` bails out and re-renders the wrapper.
- **Remedy**: Either memoize the children element in the parent using `useMemo(() => <Content />, [])`, or pass components via props created outside the render path.

- [More detail on React.memo and children](https://react.dev/reference/react/memo#minimizing-props-changes)

---

### Question 534e5bb9-33e4-4278-bbc1-0708be7fcd0b

- Why does React Context bypass `React.memo`, and what happens to consumers when a Provider value changes?

### Answer

- **Bypasses prop diffing**: `useContext(MyContext)` reads directly from the React Fiber Context dependency list, completely bypassing prop checks.
- **Unconditional consumer re-render**: When the Provider's `value` prop changes referentially, React marks every Fiber subscribing to that context as dirty and schedules a re-render.
- Wrapping the consuming component in `React.memo` **does not stop the re-render** when the consumed context value changes.

- [More detail on useContext re-render optimization](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)

---

### Question 784bcbd5-dd93-4bb9-ac73-e1645ef85a60

- How can an external store selector returning a new object reference cause render loops or continuous re-renders?

### Answer

- **Selector identity leak**: Returning an object literal in a selector (`useStore(state => ({ a: state.a, b: state.b }))`) generates a fresh object reference on every store evaluation.
- **Subscription re-render trigger**: Store subscribers check equality using `Object.is` by default; because the new object fails referential equality, the component re-renders on *every* store dispatch, even if `a` and `b` are identical.
- **Resolution**: Use atomic individual selectors (`const a = useStore(s => s.a)`), or supply a shallow equality comparator (such as `useShallow` in Zustand or `shallowEqual` in Redux).

```javascript
// ❌ Returns new reference every store update
const { a, b } = useStore(state => ({ a: state.a, b: state.b }));

// ✅ Evaluates shallow equality across fields
const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })));
```

- [More detail on Zustand useShallow](https://docs.pmnd.rs/zustand/guides/prevent-rerenders-with-use-shallow)
- [More detail on useSelector equality](https://react-redux.js.org/api/hooks#useselector)

---

### Question c4e1a0c6-aafb-4c00-83a7-6c8791976963

- What are the distinct failure modes of having too few versus too many dependencies in a hook dependency array?

### Answer

- **Too few dependencies (Under-specifying)**:
  - Causes **stale closures**: the callback captures variables from an earlier render pass.
  - Results in **silent correctness bugs**, such as saving outdated state or reading obsolete props.
- **Too many / unstable dependencies (Over-specifying)**:
  - If dependencies include unmemoized objects, arrays, or inline functions, the array invalidates on every render.
  - Causes **useless caching**: React executes `Object.is` comparisons and re-runs the hook on every render, wasting memory and CPU while providing zero caching benefits.

- [More detail on removing effect dependencies](https://react.dev/learn/removing-effect-dependencies)
- [More detail on useCallback dependencies](https://react.dev/reference/react/useCallback)

---

### Question bef5ac5f-57d0-42ce-a92f-fd15668d4edf

- Why is memoizing the Context Provider `value` considered the single most impactful memoization pattern in React apps?

### Answer

- **Unmemoized Provider leak**: If `<ThemeContext.Provider value={{ theme, toggleTheme }}>` is rendered inside a parent that re-renders, a new `{ theme, toggleTheme }` object is instantiated on every render.
- **Global consumer churn**: Every component calling `useContext(ThemeContext)` across the entire application tree is forced to re-render, even if `theme` did not change.
- **Stabilization fix**: Wrapping the value in `useMemo` guarantees the context value maintains referential stability unless an actual data dependency changes:

```javascript
const contextValue = useMemo(() => ({
  theme,
  toggleTheme,
}), [theme, toggleTheme]);

return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
```

- [More detail on optimizing Context re-renders](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)

---

### Question 84e98ee2-2251-40e2-821d-ce456b58baa2

- How does the Context Splitting pattern prevent unnecessary re-renders in action-only consumers?

### Answer

- **Single context problem**: Storing both state and dispatch handlers in a single context (`{ state, dispatch }`) forces dispatch-only buttons to re-render whenever `state` changes.
- **Context separation**: Split data into two distinct contexts:
  - `StateContext`: Holds reactive data, updates frequently.
  - `DispatchContext`: Holds stable dispatch functions or callbacks (`useCallback`), rarely or never changes.
- **Targeted subscription**: Components that only dispatch events subscribe exclusively to `DispatchContext`, completely avoiding re-renders when data updates.

```javascript
const StateContext = createContext(null);
const DispatchContext = createContext(null);

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}
```

- [More detail on scaling up with reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---

### Question fd1d2435-752f-4210-ae79-5ee890911162

- How does the Component Composition / Children as Props pattern eliminate the need for `React.memo` around context providers or heavy layouts?

### Answer

- **Lifting elements**: When a parent component passes JSX as `children` to a stateful container (`<Container><HeavyTree /></Container>`), `HeavyTree` is evaluated in the outer scope.
- **Fiber identity reuse**: When `Container` updates its internal state and re-renders, its `children` prop already points to the previously instantiated React element object (`prevProps.children === nextProps.children`).
- **Reconciliation bailout**: React sees the same element identity and automatically skips re-rendering `HeavyTree` without needing `React.memo` or manual dependency arrays.

```javascript
// HeavyTree never re-renders when Container's local state toggles
function Container({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {children}
    </div>
  );
}
```

- [More detail on passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)

---

### Question 3a33f061-9a7a-460d-a156-e87f90924ac9

- When should you use selector-based context libraries or `useSyncExternalStore` instead of React's native Context API?

### Answer

- **Native Context bottleneck**: React Context is designed for low-frequency updates (theme, auth, locale). Any update to a context value re-renders **all consumers**, even if a consumer only needs a small slice of that value.
- **High-frequency updates**: When state changes rapidly (animations, form inputs, streaming tickers, canvas cursors), native context causes severe main-thread frame drops.
- **Selector-based context**: Libraries like `use-context-selector` or external stores using **`useSyncExternalStore`** allow components to subscribe to fine-grained sub-slices (`useStore(state => state.activeId)`), re-rendering only when the selected slice changes.

- [More detail on useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [More detail on use-context-selector](https://github.com/dai-shi/use-context-selector)

---

### Question 3fcfbf08-0c26-4b0f-80df-562649ea391e

- Why is memoization in `useEffect` dependency arrays a requirement for program correctness rather than a performance optimization?

### Answer

- **Unstable callback triggers**: If an effect depends on an unmemoized callback or object defined in the component body, that dependency receives a new reference on every render.
- **Continuous effect re-execution**: The effect fires after every single render pass, leading to:
  - Infinite network fetch loops (if the effect triggers state updates upon completion).
  - Constant timer or WebSocket teardown and reconnection.
  - Loss of local subscription states and unnecessary DOM listener churn.
- Here, `useCallback` and `useMemo` enforce **semantic stability** to ensure the effect only executes when its logical inputs actually change.

- [More detail on specifying reactive dependencies](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies)

---

### Question cc6d4bd8-808c-425e-9f50-f0832001b5a1

- Why does `useSyncExternalStore` require `getSnapshot` to return a cached or referentially stable value, and what error occurs if it returns a new object?

### Answer

- **Snapshot immutability contract**: React calls `getSnapshot` to determine if external store state changed. React compares the returned snapshot to the previous snapshot using **`Object.is`**.
- **Infinite loop trigger**: If `getSnapshot` constructs and returns a new object or array literal (`return { ...store.getState() }`), `Object.is(prevSnapshot, nextSnapshot)` is perpetually `false`.
- **Runtime crash**: React detects continuous re-renders and crashes the application:
  `Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside getSnapshot...`
- **Rule**: `getSnapshot` must return immutable primitive values, or pre-cached, referentially stable objects.

- [More detail on useSyncExternalStore infinite loop gotcha](https://react.dev/reference/react/useSyncExternalStore#my-component-re-renders-in-an-infinite-loop)

---

### Question 377ef5c1-1dce-4b29-a8f3-99b079bfce3c

- Why must custom hooks establish an implicit contract of referential stability for their returned functions and objects?

### Answer

- **Consumer dependency assumption**: Callers of custom hooks frequently pass hook returns into their own `useEffect` or `useCallback` dependency arrays, or forward them to `React.memo` children.
- **Cascading invalidation**: If a custom hook returns an unstable function reference (`const fetchData = () => { ... }`), every consumer's `useEffect([fetchData])` re-runs on every render pass.
- **API contract**: Well-architected custom hooks treat function stability as an API guarantee by wrapping returned handlers in **`useCallback`** and returned non-primitive objects in **`useMemo`**.

- [More detail on passing event handlers to custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks#passing-event-handlers-to-custom-hooks)

---

### Question 8da47597-26cf-4077-b921-af50a59e19be

- Why does the official React documentation state that `useMemo` does not provide semantic guarantees, and how should durable caching be handled?

### Answer

- **Cache volatility**: React explicitly reserves the right to "forget" memoized values under memory pressure, during offscreen pre-rendering, or in future concurrent optimizations.
- **Recomputation at will**: React may discard the cached value and recalculate it on the next render even if the dependency array has not changed.
- **Architectural implication**: Never use `useMemo` to enforce side-effect execution guarantees or persist mutable business state.
- **Durable caching alternative**: Use **`useRef`** or persistent state stores (`useState`, external store) when a value must never be discarded across renders.

- [More detail on useMemo calculation runs twice](https://react.dev/reference/react/useMemo#my-calculation-runs-twice-on-every-render)

---

### Question fa7a1931-36f1-4d52-a6b1-b58de868acab

- How does state colocation eliminate unnecessary component re-renders without using `useMemo` or `React.memo`?

### Answer

- **Over-lifting problem**: Placing localized state (e.g. form inputs, tooltips, dialogs) in a high-level parent forces the parent and all sibling trees to re-render on every keystroke.
- **Colocation solution**: Push state down to the lowest component in the tree that actually needs it.
- **Architectural win**: When the isolated leaf component updates its local state, only that leaf re-renders. Parents and siblings are not touched, rendering `React.memo` and `useCallback` unnecessary.

- [More detail on sharing state between components](https://react.dev/learn/sharing-state-between-components)

---

### Question c2de8453-03f5-467f-a0c0-645dabce8c68

- How does the `key={id}` pattern provide a cleaner reset mechanism than syncing state with `useEffect` or memoizing initial state?

### Answer

- **Effect sync anti-pattern**: Using `useEffect` to watch `userId` and call `setFormState(defaultUser)` causes an extra re-render pass and renders stale form data for one frame.
- **Key reset mechanism**: Passing a unique `key` prop (`<UserProfileForm key={userId} user={user} />`) instructs React to treat a changed ID as a completely different component identity.
- **Clean state tear-down**: React automatically unmounts the old instance, wipes its internal state, and mounts a fresh instance with the new initial state in a single synchronous commit pass with zero stale flashes or synchronization boilerplate.

- [More detail on resetting state with a key](https://react.dev/learn/preserving-and-resetting-state#resetting-state-with-a-key)

---

### Question a8d74066-c3d2-4325-9ba3-8fc4c8545e5b

- Why is calculating derived state directly during render preferred over wrapping it in `useMemo` for typical computations?

### Answer

- **CPU cost of basic math**: Computing `const fullName = `${first} ${last}`` or filtering a 50-item list in JavaScript takes a fraction of a microsecond.
- **Overhead of `useMemo`**: Hook instantiation, dependency array allocation, and element-by-element `Object.is` comparison often consume more CPU cycles and memory than recalculating the derived value.
- **Simplicity & maintainability**: Calculating directly during render ensures values are always synchronous, avoids dependency array sync issues, and simplifies code readability.

- [More detail on updating state based on props or state](https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

---

### Question d80bf3a3-bf6c-478b-af59-93597c7d9d73

- When should URL query parameters replace React state, and how does this eliminate re-render cascades?

### Answer

- **Single source of truth**: Complex filtering, pagination, sorting, and tab selection represent navigational state that belongs in the URL query string (`?page=2&filter=active`).
- **Cascading state elimination**: Instead of passing state down through multiple tiers of components and managing memoized sync handlers, components read directly from router hooks (e.g. `useSearchParams`).
- **Benefits**: Eliminates synchronization bugs, preserves state across page reloads and bookmarks, and enables server-side rendering without client hydration discrepancies.

- [More detail on Next.js searchParams handling](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#using-the-native-history-api)

---

### Question f7dcea6d-e5a1-45da-9503-ee68daea39a6

- How does the React Compiler (Forget) automate memoization, and how does it change manual optimization practices?

### Answer

- **Compile-time memoization**: Analyzes component and hook code at build time via static analysis, inserting fine-grained memoization blocks directly into compiled output.
- **Automated dependency tracking**: Automatically computes exact dependency values and memoizes both intermediate computations and JSX element trees.
- **Eliminating manual boilerplate**: Eliminates the routine need for manual `useMemo`, `useCallback`, and `React.memo` calls in application code.
- **Strategic insight**: Manual memoization APIs are transitional syntax; understanding the underlying mechanics of referential equality, purity, and reconciliation is permanent architectural knowledge.

- [More detail on the React Compiler](https://react.dev/learn/react-compiler)

---

### Question 3e6a19e9-3a38-4e35-8a3b-52d697626931

- What strict compiler constraints (Rules of React) must code satisfy for the React Compiler to optimize it, and what happens when rules are violated?

### Answer

- **Core constraints**:
  - **Purity**: Component render must be pure and idempotent (no mutations of objects created outside render, no direct DOM mutations, no side effects during render).
  - **Immutable props and state**: Props and state must never be mutated directly.
  - **Hook call rules**: Hooks must be called unconditionally at top level.
- **Graceful bailout**: When the compiler detects dynamic mutations, non-analyzable side effects, or rule violations, it **bails out** of compiling that specific component or hook, falling back to standard unmemoized React execution without crashing the build.

- [More detail on the Rules of React](https://react.dev/reference/rules/rules-of-react)
- [More detail on React Compiler optimizations](https://react.dev/learn/react-compiler#what-does-the-compiler-optimize)

---

### Question 2bc458cd-5bcb-4c7a-8a9f-5ba9e4f260d6

- What is the purpose of the `"use no memo"` directive in the React Compiler ecosystem?

### Answer

- **Opt-out directive**: An escape hatch placed at the top of a component or file that explicitly instructs the React Compiler to skip automatic memoization for that scope.
- **Use cases**:
  - Temporary workaround when debugging suspected compiler regressions or unexpected behavior.
  - Components that rely on intentional reference mutations or non-standard third-party library integrations that fail compiler purity assumptions.

- [More detail on opting out of the React Compiler](https://react.dev/learn/react-compiler#opting-out-of-the-compiler)

---

### Question f9ebea1b-f1d3-43b7-82db-d93543d4a671

- Why is blanket memoization (memoizing every component and callback by default) considered an anti-pattern?

### Answer

- **Cumulative runtime overhead**: Every `useMemo` and `useCallback` introduces:
  - Closure instantiation.
  - Dependency array allocation in memory.
  - Per-render loop iterating over dependencies with `Object.is`.
- **Memory pressure**: Retaining memoized caches increases heap memory footprint.
- **Negative net performance**: If the component re-renders frequently because props genuinely change, `React.memo` runs its shallow diff on every render only to return `false`, adding overhead on top of normal render work.
- **Code rot**: Clutters codebases with noisy dependency lists that require constant maintenance.

- [More detail on should you add useMemo everywhere](https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere)

---

### Question fe228045-a586-42a5-988a-c220f3e7f987

- Why is triggering side effects inside `useMemo` a critical error in React?

### Answer

- **Render phase execution**: `useMemo` executes synchronously during the **Render phase**, which must remain pure and free of side effects.
- **Concurrent / StrictMode hazards**: React in Strict Mode or Concurrent Mode may invoke `useMemo` multiple times, pause rendering, or discard the in-flight render tree without committing it to the DOM.
- **Failure symptoms**: Side effects (e.g. tracking analytics, setting timers, mutating global objects) placed in `useMemo` will fire duplicate events or execute for UI updates that are aborted and never displayed.
- **Remedy**: Place all side effects inside `useEffect` or event handlers.

- [More detail on useMemo usage](https://react.dev/reference/react/useMemo#usage)
- [More detail on pure components](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

---

### Question 53bd9b19-4d75-44d9-8f22-8e5d96110a0c

- What failure mode occurs when a custom comparator (`arePropsEqual`) returns `true` incorrectly, and why is it worse than a performance bug?

### Answer

- **Silent UI freeze**: Returning `true` causes React to skip rendering the component and retain its previous Fiber tree, completely ignoring actual prop updates.
- **Data integrity defect**: The UI displays stale, out-of-sync information (e.g. outdated financial balances, old customer data, or stale action closures).
- **Worse than performance degradation**: While missing memoization only impacts frame rates, a faulty custom comparator causes a **silent correctness and data-integrity defect** that fails to reflect user actions or real-time server changes.

- [More detail on custom comparison in React.memo](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function)

---

### Question 2567dbfc-e9de-4b59-ba25-3b96429f4f53

- Why does wrapping a component in `React.memo` yield zero benefit if any one of its received props changes reference on every render?

### Answer

- **All-or-nothing bailout**: `React.memo` skips re-render **only if every single prop** passes the shallow comparison check (`Object.is`).
- **Single prop failure**: If even one prop (e.g. an unmemoized callback `onClick={() => ...}` or inline object `style={{}}`) has a new reference, `React.memo` fails the check and triggers a full re-render.
- **Pure overhead**: The application pays the CPU cost of shallowly diffing all props, only to re-render anyway on every single pass.

- [More detail on minimizing props changes](https://react.dev/reference/react/memo#minimizing-props-changes)

---

### Question c2703f86-9f80-48e8-bc1d-7108db0a44db

- How do you use the React DevTools Profiler to diagnose whether a component re-render was caused by changed props, state, or hooks?

### Answer

- **Recording commits**: Start a profiling session in React DevTools, perform the user interaction, and stop recording.
- **Flamegraph view**: Bars represent component fibers; colored bars indicate components that rendered during that commit (width represents render duration).
- **"Why did this render?" inspection**: Select the component in the Flamegraph. The right-hand sidebar lists the exact trigger:
  - `Props changed: [keyName]`
  - `State changed`
  - `Hooks changed: [hookIndex]`
- **Bailout verification**: Gray bars with diagonal stripes represent components that successfully bailed out (skipped render).

- [More detail on React Developer Tools Profiler](https://react.dev/learn/react-developer-tools)

---

### Question 432cc178-7c83-4b00-8b93-adb86c544f97

- How do real-time tools like "Highlight updates" and `React Scan` aid in identifying render storms?

### Answer

- **DevTools Highlight Updates**: Renders colored rectangular borders around DOM elements as they re-render. Frequent color flashes or flashing during idle states immediately expose unnecessary render cascades.
- **`React Scan` / `why-did-you-render`**:
  - Instruments React's runtime to automatically detect and flag components that re-rendered with identical shallow or deep props.
  - Logs exact diff comparisons directly to the browser console, pinpointing the unstable callback or object literal causing the render storm.

- [More detail on React Scan](https://github.com/aidenybai/react-scan)
- [More detail on why-did-you-render](https://github.com/welldone-software/why-did-you-render)

---

### Question 88301c97-47fe-4747-9ba9-13fe8399caf7

- What is the staff engineer's systematic optimization workflow before applying `useMemo` or `React.memo`?

### Answer

- **1. Measure first**: Profile using React DevTools or Long Animation Frames (LoAF) to locate the actual interaction bottleneck; never optimize speculatively.
- **2. Apply architectural fixes first**:
  - **State colocation**: Push state down to avoid re-rendering sibling and parent subtrees.
  - **Composition**: Pass components as `children` or props to preserve element identity across renders.
- **3. Apply targeted memoization**: If a heavy subtree remains slow and must receive changing inputs, apply `React.memo` and stabilize non-primitive props using `useMemo` / `useCallback`.
- **4. Re-measure & verify**: Profile again to confirm commit durations decreased and frame rates improved without introducing stale closures or regressions.

- [More detail on should you add useMemo everywhere](https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere)
- [More detail on Render and Commit](https://react.dev/learn/render-and-commit)
