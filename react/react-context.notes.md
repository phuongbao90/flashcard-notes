# React Context Internals: A 101 Report

## The short mental model

**Context is a React-managed way to make a value available to descendants without passing it through every component as a prop.** A component that reads a context becomes a dependency of that context. When the nearest Provider supplies a different value, React schedules the components that depend on it.

That’s a separate update path from props, but it doesn’t bypass React’s render process: React still renders affected components and commits their output.

## 1. The public API

Create a context once, outside your components:

```jsx
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("light");

function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
      <button onClick={() => setTheme("dark")}>Dark theme</button>
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);

  return <button className={theme}>Save</button>;
}
```

In React 18 and earlier, use `<ThemeContext.Provider>`. Starting in React 19, `<ThemeContext value={theme}>` is also valid. React describes `useContext` as letting a component “read and subscribe to context.” :chatgpt-content-reference{index="0"} :chatgpt-content-reference{index="1"}

A context has three important parts:

- **Context object:** identifies _which_ context is being provided or read.
- **Provider:** supplies a `value` for part of the React tree.
- **Consumer:** a component that reads that value, usually with `useContext`.

The context object is not your state store. React’s docs say, “The context object itself does not hold any information.” Your state usually lives in a component or another store; the Provider supplies its current value. :chatgpt-content-reference{index="2"}

The Provider’s value applies to descendants in the **React tree**. A consumer reads from the closest matching Provider above it. A nested Provider shadows an outer one for its own subtree:

```jsx
<ThemeContext.Provider value="dark">
  <Header /> {/* reads "dark" */}
  <ThemeContext.Provider value="light">
    <Dialog /> {/* reads "light" */}
  </ThemeContext.Provider>
</ThemeContext.Provider>
```

Context also follows the React tree through a portal, even when the portal’s DOM is placed elsewhere. :chatgpt-content-reference{index="3"} :chatgpt-content-reference{index="4"}

The `createContext(defaultValue)` default is a fallback for when there is **no matching Provider above the consumer**. It is not the Provider’s initial value, and a Provider with `value={undefined}` supplies `undefined`. :chatgpt-content-reference{index="5"} :chatgpt-content-reference{index="6"}

## 2. What React tracks internally

The following is a mental model of the modern Fiber reconciler. Fiber fields and helper functions are private implementation details and can change between React releases.

### The context value is scoped during rendering

When React renders a Provider, it makes that Provider’s value current for the subtree it is rendering. A useful way to picture this is a stack of active values:

1. React enters a Provider and makes its value current.
2. Descendants render and read the nearest current value.
3. React leaves the Provider’s subtree and restores the previous value.

That push-and-restore behavior explains nested Providers. It also means Context is scoped to a place in the React tree; it is not one mutable global value shared by every Provider.

### Reading Context creates a dependency

When a component calls `useContext(ThemeContext)` during render, React:

1. Finds the nearest Provider’s current value.
2. Returns that value to the component.
3. Records that the component’s Fiber depends on this context.

A **Fiber** is React’s internal work record for a component or host node. In the current implementation model, a Fiber can track which contexts it read and the values it last observed. `useContext` does not create a state update queue like `useState`; it records a context dependency React can use when deciding which work to schedule.

React also supports other context-reading forms, including the older `<Context.Consumer>` API. In React 19, `use(Context)` can read a context too; unlike `useContext`, it can be called inside a loop or conditional. :chatgpt-content-reference{index="7"} :chatgpt-content-reference{index="8"}

## 3. What happens when a Provider value changes

A Provider does not have a separate setter. Some update—often a state update—causes React to render the component that supplies the Provider’s `value`. React compares the previous and next values. The docs state: “The previous and the next values are compared with the `Object.is` comparison.” :chatgpt-content-reference{index="9"}

```
Provider renders with next value
        |
        v
Object.is says it changed? --No--> no context-driven update
        |
      Yes
        v
Find Fibers that read this context
        |
        v
Schedule consumers and the path to them
        |
        v
Render affected consumers, then commit
```

In more detail:

1. **An update schedules a render.** For example, `setTheme("dark")` causes the component holding that state to render again.
2. **The Provider receives its next value.** The value is part of the Provider’s render output.
3. **React compares old and new values.** If they are `Object.is` equal, React does not schedule consumers _because of a Context value change_. The parent render could still cause other rendering work.
4. **If they differ, React propagates the change.** It looks for descendant Fibers with dependencies on that context. A nested Provider for the same context establishes a closer value for its subtree.
5. **React marks the relevant work.** Internally, React schedules the matching consumers and marks the ancestor path so the render can reach them. Lanes are part of how Fiber tracks scheduled work and priority.
6. **Consumers render using the current value.** React computes their new output, then commits any required changes to the host UI, such as the DOM or native views.

React may visit or traverse intermediate Fibers to reach a consumer. That does **not** mean it must call every intermediate component’s render function.

## 4. Why this isn’t prop drilling

With props, data is passed through parent-child relationships: a parent creates an element with props, and the child receives those props. Without Context, intermediate components might have to accept and forward a value they do not use.

With Context, a consumer reads from the nearest Provider in its React ancestry. The value does not need to be included in intermediate components’ props. React tracks which components read it and can schedule those consumers when the value changes. The official guide describes Context as letting descendants read data without passing it explicitly through props. :chatgpt-content-reference{index="10"}

So “Context bypasses the render flow entirely” is too strong. A more accurate version is:

> **Context bypasses the need to pass the value through intermediate props. React still schedules, renders, and commits updates through its normal rendering system.**

## 5. What `React.memo` does—and doesn’t do

`React.memo` can skip rendering when a component’s props have not changed. But a component that reads a changed context still updates. React puts it this way: “Even with `memo`, your component will re-render if its own state changes or if a context that it’s using changes.” :chatgpt-content-reference{index="11"}

For example, a memoized `Toolbar` that does not read the theme may be able to bail out, while a memoized `ThemedButton` below it still updates because it reads the changed theme. React can traverse the Fiber path to reach the consumer without necessarily running the `Toolbar` function again.

A useful comparison:

| Update cause                          | What React checks        | Can `memo` block it?              |
| ------------------------------------- | ------------------------ | --------------------------------- |
| Parent passes changed props           | Component props          | Sometimes, if props compare equal |
| Component’s own state changes         | Component’s state update | No                                |
| Context used by the component changes | Its context dependency   | No                                |

## 6. The biggest performance consequence: Context has no built-in field selector

Suppose a Provider supplies this object:

```jsx
<AppContext.Provider value={{ user, theme }}>{children}</AppContext.Provider>
```

A component that calls `useContext(AppContext)` and uses only `user` still depends on the **whole context value**. If the Provider supplies a new object because only `theme` changed, that consumer is still scheduled. React does not automatically subscribe to just the `user` field.

The two common causes of unnecessary context updates are:

### A new object or function on every Provider render

```jsx
<AppContext.Provider value={{ user, login }}>
```

This creates a new object each time the Provider’s owner renders. Since the object reference changes, context consumers may render again even if `user` did not change. React’s docs show stabilizing a function with `useCallback` and the object with `useMemo` as a performance optimization. :chatgpt-content-reference{index="12"}

### Mutating the same object

```js
value.user.name = "Bao";
setValue(value); // same object reference
```

The reference is unchanged, so `Object.is` sees no context value change. React cannot use Context’s value comparison to detect that you mutated a nested property. Prefer immutable updates that create a new value when its contents change.

### Practical ways to keep updates focused

- Split unrelated data into separate contexts, especially if they change at different rates.
- Separate state from a stable dispatch function when consumers need one but not the other.
- Let a small outer component read Context, then pass only the needed value as a prop to a memoized child.
- Use `useMemo` or `useCallback` to stabilize Provider values when measurements show the extra updates matter. They are performance tools, not correctness requirements. React’s memo docs show the outer-reader/memoized-child pattern for selecting which part a child receives. :chatgpt-content-reference{index="13"}

## 7. Common gotchas

- **Creating the context inside a component:** this creates a new context object on each render. Define it at module scope so the Provider and consumers use the same object.
- **Reading context in the component that returns the Provider:** `useContext` reads from Providers _above_ that component. A Provider returned by the component is below its own hook call.
- **Forgetting `value`:** a Provider without a value supplies `undefined`; it does not fall back to `defaultValue`.
- **Using different context objects:** the Provider and consumer must import the same context object. Duplicate bundled modules can break this.
- **Assuming every descendant rerenders:** Context updates schedule readers of that context; nonreaders are not automatically consumers.
- **Assuming no intermediate Fiber work occurs:** React may traverse intermediate Fibers to reach scheduled consumers, even when it skips running those components’ render functions.
- **Treating Context as a full state-management store:** Context distributes values and tracks readers. It does not provide state updates, reducer logic, persistence, or built-in field selectors.

## 8. Interview-ready summary

> A Provider supplies a value within its React subtree, and `useContext` reads the nearest matching Provider and records that dependency on the rendering component. When a Provider’s value changes according to `Object.is`, React propagates work to Fibers that read that context and marks the path needed to reach them. Intermediate components do not have to pass the value as props and may bail out, but consumers still render even when wrapped in `React.memo`. Context avoids prop drilling; it does not skip React’s render and commit process.

For source-level follow-up, trace the context read and propagation logic in React’s [`ReactFiberNewContext.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberNewContext.js) and Provider/bailout logic in [`ReactFiberBeginWork.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.js). These files describe implementation details, not a stable public API.

## Assumptions

- This focuses on modern React’s Fiber reconciler, with `useContext` as the main reader.
- The code uses `.Provider` syntax for compatibility with React 18; React 19 also supports rendering the Context object directly as the Provider.

## Possible mistakes

The main pitfalls are treating Context as global state, assuming it tracks object fields individually, assuming `memo` blocks a context update, or interpreting “bypasses props” as “bypasses React rendering.”

## Confidence

**High** for the public API behavior. **Medium-high** for the Fiber-level explanation: it matches the current implementation model, but internal fields and scheduling details can change between React versions.
