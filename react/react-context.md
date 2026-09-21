# React Context — State Management

### Question 347b577a-9635-4759-ad46-2b83099557b7

- When a Provider's `value` changes, how does React propagate the update to consumers — and why does it bypass the normal parent-to-props render flow entirely?

### Answer

- Context is a **second update channel**: when a Provider's `value` changes (compared with `Object.is`), React walks the subtree below the Provider and marks every fiber that registered a **context dependency** (i.e., called `useContext`) as needing re-render.
- Components **between** the Provider and the consumer do nothing — they don't receive, forward, or even know about the value, so they are not re-rendered by the context update.
- This is why context "teleports" data: no **prop drilling**, no intermediate re-renders, and no way for `React.memo` on the middle layers to block the consumer update.
- Normal props flow is top-down element creation during render; context flow is a **subscription model** resolved at fiber level, which is exactly why the two re-render triggers are independent.

- [More detail on useContext](https://react.dev/reference/react/useContext)
- [More detail on Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)

---

### Question 7e107264-efd5-4f06-858d-83e8763348ba

- React compares the Provider's new `value` to the old one using `Object.is`. Explain exactly why this makes `<Ctx.Provider value={{ state, dispatch }}>` re-render **every** consumer on every Provider render, even when `state` is identical.

### Answer

- The inline `{ ... }` literal creates a **new object reference on every Provider render**, so `Object.is(prevValue, nextValue)` is always `false`, even if every field inside is unchanged.
- React does **not deep-compare** context values; identity change alone marks all consumers for re-render.
- Consumers therefore re-render on *every* render of the Provider component — including renders caused by unrelated state in the Provider.
- Fix: stabilize the value — `useMemo(() => ({ state, dispatch }), [state, dispatch])` — or split into separate state/dispatch contexts with stable references.

```jsx
// Every Provider render → new reference → every consumer re-renders
<Ctx.Provider value={{ state, dispatch }}>
// Stable: re-renders consumers only when state actually changes
const value = useMemo(() => ({ state, dispatch }), [state]);
<Ctx.Provider value={value}>
```

- [More detail on useContext — "React will re-render all consumers"](https://react.dev/reference/react/useContext)

---

### Question 447a5795-23a2-4ec5-8fd6-0d63e3575747

- A consumer component is wrapped in `React.memo` and receives no props. The context value it reads changes. Does it re-render? Trace why `memo` fails to block this and what `memo` actually does and does not guard against.

### Answer

- **Yes, it re-renders.** `memo` only implements a bail-out for re-renders caused by a **parent re-rendering** with identical props (and it does nothing about the component's own state or hooks).
- Context changes are a separate render trigger: the Provider change marks the consumer's fiber through its **context dependency**, which `memo` never inspects.
- This is by design — `memo` compares *props*, and context is explicitly *not* a prop. A `memo` wrapper can never block a `useContext` consumer from seeing fresh values.
- Practical consequence: wrapping context consumers in `memo` protects them from unrelated parent renders, **not** from context updates.

```jsx
const Badge = memo(function Badge() {
  const theme = useContext(ThemeCtx); // re-renders even inside memo
  return <b>{theme}</b>;
});
```

- [More detail on memo](https://react.dev/reference/react/memo)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question ae66a70b-c2e1-4aab-b497-cc2068053af6

- Why does the pattern below prevent most of the subtree from re-rendering on context change, even though it sits inside the Provider?

```jsx
<Ctx.Provider value={value}>{children}</Ctx.Provider>
```

### Answer

- `children` is an element created in the **parent's** render (e.g., `<App/>` renders `<Provider><Page/></Provider>` once). When the Provider component re-renders, the `children` prop is the **same element reference**, so React bails out of re-rendering that subtree.
- Only two things still re-render: the Provider itself, and — via context propagation — the **actual consumers** inside `children`, because context updates pierce the bail-out.
- Every non-consuming component between them (wrappers, layouts) is skipped entirely.
- This is the standard trick to make a stateful Provider cheap: move the state **into** the Provider and the rest of the app **outside** via `children`.

- [More detail on useContext](https://react.dev/reference/react/useContext)
- [More detail on memo bail-outs and children](https://react.dev/reference/react/memo#specifying-a-compare-function-with-memo)

---

### Question 81caaf6e-8847-48d5-a0b2-423004f9f014

- `useContext` accepts no selector argument. Explain the performance consequence for a context holding a large object, and how libraries like `use-context-selector` or Zustand's `useStore(fn)` get around React's context model.

### Answer

- `useContext(Ctx)` subscribes to the **whole value**: a change to any single field re-renders every consumer, even ones reading a tiny slice. There is no way to say "only re-render me if `cart.items` changed".
- External-store libraries subscribe via **`useSyncExternalStore`**: the component provides a selector, React compares `Object.is(prevSlice, nextSlice)` after each store change, and skips re-rendering components whose selected slice is identical.
- `use-context-selector` applies the same selector idea on top of context-style APIs; Redux and Zustand expose store subscriptions natively.
- Rule of thumb: context = broadcast with no filtering; external store = fine-grained subscriptions.

```jsx
const { cart, user, ui } = useContext(ShopCtx);   // React: all or nothing
const items = useShopStore(s => s.cart.items);    // selector: one slice
```

- [More detail on useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [More detail on useContext — caveats](https://react.dev/reference/react/useContext)

---

### Question 1b59c16f-5c3c-4030-82c8-f6b6beb16446

- Two nested Providers of the same context exist (e.g., a feature-scoped Provider inside the app root). The inner Provider's value changes. Which components re-render — inner consumers only, or all consumers of that context?

### Answer

- Each `useContext` call binds to the **nearest Provider above it** in the tree; consumers under the inner Provider are subscribed only to the inner value.
- When the **inner** Provider's value changes, only consumers **below it** re-render — outer consumers never subscribed to that Provider.
- Symmetrically, an outer value change re-renders outer consumers but is shadowed for inner ones: inner consumers keep reading the inner value (React re-computes the nearest provider during propagation).
- This makes context scoping a legit isolation tool: wrap a heavy subtree in its own Provider and only that subtree pays for its updates.

```jsx
<A.Provider value={1}>
  <A.Provider value={2}>   {/* this value changes */}
    <Comp />               {/* useContext(A) → re-renders */}
  </A.Provider>
</A.Provider>
```

- [More detail on useContext — "React continues searching"](https://react.dev/reference/react/useContext)

---

### Question e9826587-6606-490b-be3c-e63911a9283f

- Context value changed, but a component that receives `contextProp` as a plain prop (never calling `useContext`) did NOT re-render. Explain how React treats a context consumer differently from a prop-passing consumer, and when each re-renders.

### Answer

- A plain-prop component is **not subscribed** to the context; from React's perspective it just has props. It re-renders only when its parent re-creates its element or its props change.
- A component calling `useContext` registers a **context dependency** and is re-rendered directly by context propagation, regardless of props.
- In the described case the value holder probably re-rendered from context, but the prop chain between them bailed out (e.g., `memo` or stable `children`), so the prop never arrived.
- Fix by choosing the correct channel: read the context directly where the data is rendered, or actually pass the new prop down.

```jsx
<Cell value={ctx.value} />     // A: plain prop — needs parent to re-render
const v = useContext(Ctx);     // B: consumer — updates itself
```

- [More detail on useContext](https://react.dev/reference/react/useContext)
- [More detail on render-and-commit](https://react.dev/learn/render-and-commit)

---

### Question 48c29109-79b6-45ad-84b1-9f18173d79cc

- **(React 19)** What does the new `use(Context)` API allow that `useContext` does not — specifically regarding conditional rendering, early returns, and deferred context reads?

### Answer

- `use(Context)` can be called **conditionally**, inside loops, and after early returns — unlike `useContext`, which must follow the unconditional Hooks rules. Only reads during render, never after (no early return then read).
- Context can be passed around as a **value/prop** (`{contextRef.current}` patterns aside, the context object itself) and read deeper in the tree where it's actually needed, instead of forcing a hook call at the top.
- `use` also unwraps **Promises and context uniformly**, integrating with Suspense for deferred reads.
- Migration is incremental: `useContext` remains valid; `use` is a general-purpose "read a resource during render" API.

- [More detail on use](https://react.dev/reference/react/use)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question 38cef658-22b8-4e8d-91db-622c2abb758d

- How does React locate the "nearest provider" for a `useContext` call at fiber level, and what happens semantically when a consumer has **no** matching Provider anywhere above it?

### Answer

- During render, a context read resolves against the **current context stack** maintained while React descends the fiber tree: each Provider pushes its value, and the read picks the value pushed by the **closest** Provider for that exact context object.
- Identity matters: the context object returned by `createContext` is the key — two "same-looking" contexts (e.g., duplicated package copies) are unrelated.
- With **no matching Provider**, `useContext` returns the **`defaultValue`** passed to `createContext`. This is a static module value — it never changes and React will never notify the consumer about it.
- Senior takeaway: defaults are a convenience for tests/isolated rendering, not a state mechanism.

```jsx
const Ctx = createContext('fallback');
// <Comp /> rendered with NO <Ctx.Provider> above it → reads 'fallback'
```

- [More detail on createContext — default value](https://react.dev/reference/react/createContext)

---

### Question d14a422d-5b89-4766-9a78-cb1c9b3b0b04

- Does changing a context value ever re-render components between the Provider and the consumers (the "pass-through" components)? Explain why this makes Provider placement high in the tree cheap, and what actually decides the re-render set.

### Answer

- **No.** A context value change only re-renders fibers that depend on that context — the consumers. Wrappers in between are not marked, because they never read the value.
- What *does* re-render pass-throughs is the **Provider component itself re-rendering** (it re-creates its children elements) — which is neutralized by the `children` prop pattern, since the element comes from an outer render.
- So the re-render set = "consumers of the changed context" + "components re-rendered by normal parent flow". Provider placement high in the tree costs almost nothing on its own.
- The real cost lives in **how many components consume** the context, not how deep the Provider sits.

- [More detail on Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [More detail on render-and-commit](https://react.dev/learn/render-and-commit)

---

### Question 1b5f5696-a5c8-4a83-87d4-f4e7e6070601

- When would you deliberately NOT use Context for state management, even though it's built-in? Contrast its broadcast re-render model with external-store subscriptions (`useSyncExternalStore`, Zustand, Redux) that notify only selected components.

### Answer

- **High-frequency updates**: typing, drag, mouse, animation clocks — every update broadcasts to *all* consumers; stores notify only components whose selected slice changed.
- **Large shared state with independent slices**: multiple teams/features reading different fields of one store — with context you're forced into context-splitting gymnastics; with a store, selectors give this for free.
- **Derived/computed state with memoized selectors** (reselect-style), **middleware** (logging, persistence, undo), and **time-travel devtools** are store ecosystems features, not context features.
- Context remains right for low-frequency, app-wide concerns (theme, locale, session) where its zero-dependency simplicity wins.

- [More detail on useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [More detail on Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---

### Question 8457ab11-f296-4004-847d-6d4c1ab4fd98

- A team replaces prop drilling through 2 levels with a global context. Argue when this is over-engineering: what does Context cost (re-render coupling, testability, implicit dependencies) versus the drilling it removes?

### Answer

- **Explicitness loss**: with props, the component signature lists its data needs; with context, dependencies are invisible — readers must trace providers to know what `useCart()` returns.
- **Testability cost**: every test needs the Provider wrapper and realistic value setup; pure prop-driven components render standalone.
- **Re-render coupling**: any consumer anywhere re-renders when the shared value changes; two-level drilling only touches the chain that owns the prop.
- **Reusability loss**: a context-reading component can't be dropped into another app/tree without the Provider.
- Two levels of drilling is cheap and self-documenting. Context earns its cost when data must cross many unrelated layers or reach many distant consumers.

- [More detail on Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)

---

### Question 57e459bf-a3f3-4152-a69f-c3b2660a88a2

- Context + `useReducer` vs. Redux Toolkit for a medium-size app. Which two technical differences (devtools/time-travel, middleware/side-effect placement, selector-level subscriptions) usually decide the outcome, independent of team preference?

### Answer

- **Selector-level subscriptions**: Redux components subscribe via selectors and skip re-render when their slice is unchanged; context consumers re-render on every value identity change. For interconnected state read by many components, this is the biggest architectural difference.
- **Middleware and devtools**: RTK ships a dispatch pipeline (thunks/sagas for side effects) and time-travel-able action log out of the box; context+`useReducer` gives you none — you hand-roll side-effect placement (event handlers, effects, or custom middleware).
- If the app is mostly **server state** (React Query/SWR handles it) plus small UI state, context+reducer is usually enough; genuine client-side app state with cross-feature mutations tips toward RTK.

- [More detail on Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [More detail on useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)

---

### Question 293f005b-8c4e-414d-9abb-6fda3fbd0d3e

- Design the minimal custom hook + Provider wrapper pattern so that calling `useAuth()` outside a Provider throws a descriptive error instead of silently returning the default value. Why is shipping raw `useContext(AuthContext)` considered a smell in shared libraries?

### Answer

- Create the context with `null` default, wrap `useContext` in a hook that validates and throws. The error fires at the **exact call site** with an actionable message instead of a `TypeError: Cannot read properties of null` from somewhere downstream.

```jsx
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return <AuthCtx.Provider value={{ user, setUser }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
```

- Raw `useContext(AuthContext)` in a library leaks the context identity as public API: consumers can bypass the wrapper, the null default explodes far from the cause, and there is no single place to evolve the shape or add validation.

- [More detail on createContext](https://react.dev/reference/react/createContext)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question 84e03922-1058-4835-9931-322615afb6e9

- For a `useReducer`-based context store, why is it idiomatic to split into a `StateContext` and a `DispatchContext`? What does a stable `dispatch` reference guarantee about which consumers re-render on each action?

### Answer

- `useReducer` guarantees **`dispatch` is referentially stable** across renders, while `state` changes on every action. Splitting lets each consumer subscribe to only what it needs.
- Components that only **dispatch** (buttons, forms) sit in a context whose value never changes → they effectively never re-render from store activity.
- Components that **read state** re-render when state changes — the desired behavior.
- If both live in one `value={{ state, dispatch }}` object, dispatch-only consumers re-render on every action because the *object* identity changed.

```jsx
<StateCtx.Provider value={state}>
  <DispatchCtx.Provider value={dispatch}>  {/* never changes */}
```

- [More detail on Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [More detail on useReducer](https://react.dev/reference/react/useReducer)

---

### Question 16d1202b-cb38-4900-86dd-10760e6c4227

- **Case study:** A theme toggle using Context re-renders the entire 500-component page on every click, dropping frames. Walk through your diagnosis and at least three fixes (splitting static/dynamic contexts, memoizing the subtree via `children`, CSS variables instead of JS values), including the tradeoff of each.

### Answer

- **Diagnose**: React DevTools Profiler "highlight updates" shows all 500 components flashing on toggle → almost every component consumes `ThemeContext` (or re-renders under a non-isolated Provider). Check the Provider's `value` for inline objects first.
- **Fix 1 — split static vs dynamic**: `ThemeStaticContext` (icons, `setTheme` — never changes) vs `ThemeValueContext` (the theme string). Only components rendering theme-dependent styles consume the value context. Tradeoff: more boilerplate, two hooks to import.
- **Fix 2 — `children` isolation**: keep the toggle state inside the Provider and pass the page as `children`; non-consumers bail out because the `children` element identity never changes. Tradeoff: requires restructure, and memo discipline as the tree grows.
- **Fix 3 — CSS variables**: `document.documentElement.dataset.theme = 'dark'`; colors resolve in CSS (`var(--bg)`), so **zero React re-renders** on theme change. Tradeoff: only works for styling — JS logic branching on theme (e.g., picking chart colors) still needs the value.

- [More detail on Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question 1fcabc53-7185-49a0-b857-3e70e9ede0d2

- **Case study:** An auth context holds `{ token, user, permissions }`. Silent token refresh every 5 minutes re-renders the whole app and resets scroll position in a virtualized list. How do you restructure the contexts to isolate the blast radius?

### Answer

- Root cause: one context value object → token change creates a new object → **every** consumer of `user`, `permissions`, or `token` re-renders, including the virtualized list.
- Split by **change frequency**: `TokenContext` (changes every refresh — consumed only by the fetch/API layer, ideally zero React components), `UserContext` (changes on login/logout), `PermissionsContext` (changes on role change only).
- Even better: keep the token **out of React state entirely** — a module-level store or closure read by the API client. Auth tokens are not UI state; components rarely need to re-render for them.
- Result: silent refresh updates the token store, re-renders nothing, virtualized list keeps its scroll.

- [More detail on Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [More detail on useSyncExternalStore (for external token store)](https://react.dev/reference/react/useSyncExternalStore)

---

### Question 8cb83925-5a7d-4bf3-8205-a23055a8aa32

- **Case study:** In an e-commerce cart, typing in a quantity input re-renders all 100 cart rows because each row calls `useCart()`. Compare two fixes: splitting item state out of the global context vs. memoizing rows — and why memoization alone often fails here.

### Answer

- Why memo fails: every row calls `useCart()` → every row is a **context consumer** → the value change marks all 100 fibers directly. `memo` cannot block context-driven re-renders, and the `items` array is a new reference anyway.
- **Fix 1 — narrow the subscription**: global context holds only `ids: string[]`; each row gets its own item via props from a per-item source (row-level store, or item state lifted into a `RowProvider` per row that doesn't change when quantities change). Typing in row 7 updates row 7 only.
- **Fix 2 — move volatile state down**: quantity editing lives in the row's local `useState` and commits to the global store on blur/step — global value changes rarely.
- If updates must stay global (live price sync), an external store with **selector subscriptions** (`useCart(s => s.items[id])`) is the honest tool; context cannot select.

- [More detail on useContext — caveats](https://react.dev/reference/react/useContext)
- [More detail on useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)

---

### Question 98e24277-c46f-4010-b3ec-6b1300f4cd48

- A `<RowProvider value={...}>` wraps each row in a table. Adding one row re-renders all rows. Why does per-row context scoping not isolate renders the way memoized components would, and what pattern would you use instead?

### Answer

- Context scoping isolates **context-value updates**, not **parent re-renders**. Adding a row changes `rows` → the parent re-renders → it re-creates the element for *every* row in `rows.map(...)` → all rows re-render through the normal props flow, regardless of their Providers.
- Context never enters the picture: no context value changed; this is plain element-recreation re-rendering.
- Fix: wrap `Row` in `memo` and feed it stable props — item object (only the touched row's item changes identity), stable callbacks (`useCallback` keyed by id, or dispatch). Then only the new/changed row re-renders.
- Alternatively render via external store + selector per row; but `memo` + stable props is the minimal correct shape.

```jsx
{rows.map(r => (
  <Row key={r.id} item={r} onRemove={remove} />   // Row = memo(...)
))}
```

- [More detail on memo](https://react.dev/reference/react/memo)
- [More detail on Rendering Lists](https://react.dev/learn/rendering-lists)

---

### Question 10efca1d-d46d-48f5-9f71-09554d4450e2

- When is Context the *right* tool for state management in a senior engineer's view? Give 3 concrete categories (e.g., theming, i18n, DI of low-frequency deps) and explain why their low update frequency fits the broadcast model.

### Answer

- **Theming / design tokens**: changes on explicit user toggle or system preference — a few times per session; re-rendering consumers is correct and rare.
- **i18n / locale**: language switches are discrete, user-initiated, infrequent; broadcast re-render is exactly what "translate the page" means.
- **Dependency injection of stable services/config**: feature flags, logger, API base, analytics client — set once at mount, essentially never change; consumers just need access, not reactivity.
- The pattern: **write-rare, read-everywhere** data. Broadcast cost scales with update frequency, so near-zero frequency makes context the simplest correct tool — built-in, no deps, no store ceremony.

- [More detail on Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)

---

### Question e403753b-b47a-46b1-9d83-283eff965c98

- **(RSC)** Why can't a React Server Component read context created with `createContext`, and what does this force you to do at the client boundary when migrating a context-based store in Next.js App Router?

### Answer

- Context is a client-runtime mechanism: it depends on a **persistent fiber tree across renders** and the dispatcher-based hooks pipeline. RSCs render once per request on the server, produce serializable output, and have no stateful instance to subscribe or re-render — so `createContext`/`useContext` are unavailable and error in Server Components.
- Consequence: the Provider must live in a **Client Component** (`'use client'`), typically a thin wrapper that receives serializable data as props from the RSC tree.
- Server-fetched data flows into the store as **props** at the boundary (e.g., `<StoreProvider initial={serverData}>`), or stays as RSC props and is never globalized.
- Migration instinct: ask what actually needs to be *shared mutable client state* — often the answer is "less than the old context held", and the rest stays server-side.

- [More detail on Server Components (React)](https://react.dev/reference/rsc/server-components)
- [More detail on Server Components (Next.js)](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

### Question 8c7e5b9e-9cb8-429a-9fd1-5bbd6199ee3b

- A developer writes `const { user } = useContext(AuthContext)` but gets `TypeError: Cannot destructure property 'user' of undefined`. Trace the two most likely root causes related to `createContext` defaults and provider placement.

### Answer

- **Cause 1 — no default value**: `createContext()` was called without an argument, and the consumer rendered with **no Provider above it** → context value is `undefined` → destructuring throws.
- **Cause 2 — provider placement/identity mismatch**: the Provider exists but **not above this consumer** (consumer rendered in a portal root, separate render root, or before the Provider mounts), or the code imports **two different context instances** (duplicated package, context defined inside a component, HMR artifacts) — so "the" Provider isn't the nearest provider for *this* context object.
- Diagnosis: log `useContext(AuthContext)` alone — `undefined` with a Provider present means identity mismatch, not placement.
- Prevention: default to `createContext(null)` + a validating wrapper hook that throws a named error.

```jsx
const AuthCtx = createContext(); // no default → value is undefined
```

- [More detail on createContext — default value](https://react.dev/reference/react/createContext)

---

### Question c9a43d1a-2d1a-42de-9b5f-132be6577fae

- A Provider computes `value` from state but passes callbacks created inline: `value={{ onAdd: () => setItems(...) }}`. Consumers that only call `onAdd` still re-render on every state change. Why, and what's the minimal fix?

### Answer

- The inline arrow is a **new function reference every render**, and the wrapping object literal is new too — so the context value identity changes on every Provider render, and React re-renders all consumers (`Object.is` fails).
- Consumers "only calling `onAdd`" still re-render because `useContext` subscribes to the **whole value object**, not to the fields they use.
- Minimal fix: `useCallback` the handler and `useMemo` the value —
  `const onAdd = useCallback(() => setItems(...), []);` then
  `const value = useMemo(() => ({ onAdd }), [onAdd]);`
- For read/write split at scale, move callbacks into a separate **actions context** so its value never changes.

- [More detail on useContext](https://react.dev/reference/react/useContext)
- [More detail on useMemo](https://react.dev/reference/react/useMemo)

---

### Question 6365f66d-8528-4be5-8c74-32d7d4c48fd5

- Consumers of a context re-render correctly, but a child component reading props derived from context shows **stale data** for one frame after a navigation. Identify how an unstable `useMemo` dependency or a keyed-remount could produce this, and how you'd verify which one it is.

### Answer

- **Unstable `useMemo` deps**: the parent recomputes derived data with wrong deps (e.g., `[route]` instead of the changed entity, or a dep that didn't change) → `useMemo` returns the **cached old object** → child receives stale props while the consumer itself renders fresh context values.
- **Keyed remount**: navigation changes the child's `key` (e.g., `key={route}`) → old child unmounts, new child mounts with fresh props but also **fresh internal state** — perceived as a flash/stale frame, plus lost scroll/focus/input state.
- Verify with React DevTools **Profiler**: for the stale frame, check the memoized value's identity in the commit — same reference = `useMemo` cache hit (deps bug). Watch the elements tree: unmount/mount of the child (different fiber) = key remount.
- Log `value` in the child's render vs the context consumer's render: same render pass with different values isolates the memo; a remount shows as a full mount in the flame graph.

- [More detail on useMemo — you might not need an effect](https://react.dev/learn/you-might-not-need-an-effect)
- [More detail on state and keyed reset](https://react.dev/learn/preserving-and-resetting-state)

---

### Question 06154581-5b47-4da0-b458-b73fee3db815

- A context value is `useMemo`'d on `[state, dispatch]`, yet a consumer still re-renders when nothing it reads changed. List every mechanism that can cause this (parent re-render without memo, unstable dispatch wrapper, new context identity from a re-created context object) and how you'd bisect it.

### Answer

- **Parent re-render without memo**: the Provider re-rendered for an unrelated reason and re-created the consumer's element — plain parent-flow re-render, context value irrelevant. `useMemo` can't save a component that isn't memoized.
- **Unstable dependencies**: `dispatch` wrapped or recreated (e.g., `dispatch={(a) => rawDispatch(a)}`) breaks the "stable dispatch" assumption → `useMemo` recomputes every render → new value object → all consumers re-render.
- **Re-created context**: the `createContext` call itself runs per-mount (context defined *inside* a component) or duplicate package copies exist → consumers and provider use different context objects, or defaults re-resolve; a memoized value can't reconcile across context instances.
- Bisect with the Profiler's **"rendered because"** hints / `why-did-you-render`: if it says "parent rendered", it's mechanism 1; if "hooks changed", log `value` identity — same value but hook-changed points to mechanism 3.

```jsx
const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
```

- [More detail on useMemo](https://react.dev/reference/react/useMemo)
- [More detail on memo](https://react.dev/reference/react/memo)

---

### Question bb965a17-3913-4c36-864d-cc12c715b6fb

- The button is clicked. Will `Display` re-render?

```jsx
const Ctx = createContext(0);

function App() {
  const [count, setCount] = useState(0);
  return (
    <Ctx.Provider value={42}>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <Display />   {/* calls useContext(Ctx) */}
    </Ctx.Provider>
  );
}

const Display = () => {
  const v = useContext(Ctx);
  return <p>{v}</p>;
};
```

### Answer

- **Yes.** But not because of context — the context value `42` is unchanged.
- `setCount` re-renders `App`; `App` re-creates the `<Display />` element; `Display` is **not memoized**, so it re-renders through the normal parent flow.
- Key insight: a re-rendering parent re-renders all its non-memo children **even when the Provider value is identical**. Context memoization (`value={42}`) only prevents context-*driven* updates, not element recreation.
- Wrap `Display` in `memo` (see next card) and the re-render disappears.

- [More detail on render-and-commit](https://react.dev/learn/render-and-commit)
- [More detail on memo](https://react.dev/reference/react/memo)

---

### Question daaea548-3ce7-4804-aa5f-b45501e87454

- Same setup, but `Display` is now wrapped in `memo`. The button is clicked. Does the answer change, and why?

```jsx
const Display = memo(function Display() {
  const v = useContext(Ctx);
  return <p>{v}</p>;
});
```

### Answer

- **Yes — it changes: `Display` does NOT re-render.**
- The re-render had two possible triggers: parent flow (App re-created the element) and context change. `memo` neutralizes the first — props are unchanged, so React bails out.
- The second trigger never fires: `value={42}` is a stable primitive, `Object.is(42, 42)` is true, so no context propagation happens.
- Contrast with #26: same component tree, only the bail-out wrapper differs — proving the original re-render was parent-driven, not context-driven.

- [More detail on memo](https://react.dev/reference/react/memo)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question 40821c49-80f9-4b69-8e20-051d29aef194

- The button inside `Provider` is clicked. Does `Display` re-render? Does the pass-through `Layout` re-render?

```jsx
const Ctx = createContext(null);

function Provider({ children }) {
  const [count, setCount] = useState(0);
  return (
    <Ctx.Provider value={{ count, setCount }}>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      {children}
    </Ctx.Provider>
  );
}

function App() {
  return (
    <Provider>
      <Layout>
        <Display />   {/* calls useContext(Ctx), reads count */}
      </Layout>
    </Provider>
  );
}

const Layout = ({ children }) => <section>{children}</section>;
const Display = () => {
  const { count } = useContext(Ctx);
  return <p>{count}</p>;
};
```

### Answer

- **`Display`: yes** — the value `{ count, setCount }` is a new object every Provider render, so the context changed, and context propagation pierces every bail-out to reach consumers.
- **`Layout`: no** — the `children` element was created in `App`'s render, which never ran; when `Provider` re-renders, its `children` prop is the same element reference, so React skips re-rendering `Layout` (and would skip `Display` too, if it weren't a consumer).
- This is the `children`-isolation pattern in action: the state update costs exactly one Provider render plus its consumers — nothing else in the subtree.
- Flip side: `Display` would re-render even if it read only `setCount`, because the whole value object changed.

- [More detail on useContext](https://react.dev/reference/react/useContext)
- [More detail on createContext](https://react.dev/reference/react/createContext)

---

### Question 8ea8a3a5-ad7d-40f2-bcae-1e76eba3d3ef

- The quantity state changes. Will `Toolbar` re-render, even though it only uses `setItems` and `setItems` is stable?

```jsx
const StoreCtx = createContext(null);

function StoreProvider({ children }) {
  const [items, setItems] = useState([]);
  const value = useMemo(() => ({ items, setItems }), [items]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

const Toolbar = memo(function Toolbar() {
  const { setItems } = useContext(StoreCtx);
  return <button onClick={() => setItems([])}>clear</button>;
});
```

### Answer

- **Yes.** `items` changed → `useMemo` recomputed → `value` is a **new object** → context identity changed.
- `Toolbar` subscribes to the **whole value object** via `useContext`; React does not care that the field it destructures (`setItems`) is the same reference. Identity change of the context value = consumer re-render, `memo` or not.
- This is the classic argument for the **state/dispatch split**: put `setItems` in its own context with a never-changing value, and `Toolbar` never re-renders again.
- Alternative: keep one context but exclude `items` from it (actions-only context) and give read-heavy components a different subscription.

- [More detail on useContext](https://react.dev/reference/react/useContext)
- [More detail on Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---

### Question 6178567d-1289-4fe4-bd9a-9b54bcf1887b

- `setN(5)` is called when `n` is already 5. Then `setN(6)` is called. For each call: does the memoized `Comp` re-render?

```jsx
const A = createContext(0);
const B = createContext(1);

function App() {
  const [n, setN] = useState(5);
  return (
    <A.Provider value={n}>
      <B.Provider value={1}>
        <Comp />   {/* memoized, calls useContext(B) only */}
      </B.Provider>
    </A.Provider>
  );
}

const Comp = memo(function Comp() {
  const b = useContext(B);
  return <p>{b}</p>;
});
```

### Answer

- **`setN(5)`: no.** `Object.is(5, 5)` is true → React bails out of the state update entirely → `App` doesn't re-render → nothing happens below.
- **`setN(6)`: still no.** `App` re-renders, and `A`'s value changed — but `Comp` consumes **`B` only**, whose value is untouched. `memo` blocks the parent-flow re-render (no props changed), and no context dependency of `Comp` was triggered.
- Three independent guards stack here: state bail-out, `memo` prop bail-out, and per-context subscriptions. All three must be pierced to force a re-render.
- Senior trap: change `B.Provider`'s value to `1`→`2` and `Comp` re-renders instantly, `memo` notwithstanding.

- [More detail on useState — bailing out](https://react.dev/reference/react/useState)
- [More detail on memo](https://react.dev/reference/react/memo)

---

### Question 15dbb232-8bd7-401d-a4ce-ee2bff97d73d

- `setUser` is called with a new object where only `lastSeen` changed (`id` is the same). Will the memoized `Avatar` re-render?

```jsx
const UserCtx = createContext(null);

function UserProvider({ children }) {
  const [user, setUser] = useState({ id: 1, name: 'Bao', lastSeen: 0 });
  const value = useMemo(() => ({ user, setUser }), [user.id]);
  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

const Avatar = memo(function Avatar() {
  const { user } = useContext(UserCtx);
  return <img alt={user.name} />;
});
```

### Answer

- **No.** `user.id` didn't change → the `useMemo` returns the **same cached object** → context value identity is unchanged → no consumer is marked for re-render.
- `UserProvider` itself re-renders (new `user` object from `setUser`), but `Avatar` sits behind the `children` bail-out *and* `memo` *and* an unchanged context — every path is blocked.
- The subtle cost: the UI is now **intentionally stale** — `lastSeen` updates exist in state but never reach consumers until `id` changes. Deliberate selector-by-memo is a legitimate context hack, but it must be a conscious decision.
- Also note the lint trap: exhaustive-deps will flag `[user.id]`; this is one of the few places you intentionally narrow deps.

- [More detail on useMemo](https://react.dev/reference/react/useMemo)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question d94800f1-6b31-4bc3-85c3-648bfa3e4346

- The user clicks the counter button rendered from context state. Does the memoized `Log` component re-render? What about a non-memoized `Log`?

```jsx
const CountCtx = createContext(null);

function App() {
  const [count, setCount] = useState(0);
  return (
    <CountCtx.Provider value={count}>
      <Counter />   {/* memoized, calls useContext(CountCtx), renders the button */}
      <Log />       {/* memoized, does NOT call useContext — renders a static list */}
    </CountCtx.Provider>
  );
}
```

### Answer

- **Memoized `Log`: no.** The click re-renders `App`; `Log`'s element is re-created, but `memo` sees unchanged props and bails out. `Log` has no context dependency, so context propagation never touches it. The context value did change — but only consumers care.
- **Non-memoized `Log`: yes.** Without `memo`, re-creating the element from `App`'s render is enough; React re-renders every non-memo child unconditionally.
- Shows the precise division of labor: **context change → consumers only; parent re-render → all non-memo children**. `memo` is what separates the two flows for siblings of consumers.

- [More detail on memo](https://react.dev/reference/react/memo)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question 91d71fea-d697-4e50-8fcf-d8ffcd71c895

- Code outside React mutates the default object: `defaultValue.items.push('x')`. Will `Badge` re-render?

```jsx
// module scope
const defaultValue = { items: [] };
const ItemsCtx = createContext(defaultValue);

// Badge renders with NO provider above it
function Badge() {
  const { items } = useContext(ItemsCtx);
  return <span>{items.length}</span>;
}
```

### Answer

- **No.** The default value is a static module constant: React has no Provider to compare, no snapshot to diff — mutation is invisible to the render system.
- Nothing schedules a render: no state update, no context identity change (the reference never changed), no subscription exists.
- Worse, the mutation corrupts the value silently: if `Badge` re-renders later for any other reason, it suddenly renders `1` — a heisenbug coupling unrelated renders to external mutation.
- Rules this violates: context values must be treated as **immutable snapshots**; external mutable data belongs in a store subscribed via `useSyncExternalStore`, which can schedule renders on change.

- [More detail on useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [More detail on createContext](https://react.dev/reference/react/createContext)
