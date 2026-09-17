# React Reconciliation

### Question 17f119f9-1be9-4c53-b937-2c270f5855b4

- What is React Reconciliation, and what heuristics does React's diffing algorithm use to achieve O(n) complexity?

### Answer

- **Reconciliation** is React's tree-diffing algorithm for comparing two element trees against the Fiber tree to compute the minimal set of real DOM mutations needed.
- A generic tree diff algorithm operates in **O(n³)** time; React reduces this to **O(n)** using two core heuristics:
  - **Different Element Types**: Two elements of different types (e.g., changing from `<div>` to `<span>`, or `<ComponentA>` to `<ComponentB>`) produce entirely different trees. React destroys (unmounts) the old tree and builds the new one from scratch.
  - **Keys for Lists**: Child elements with a stable **`key` prop** maintain identity across renders, allowing React to match children across renders regardless of array reordering, insertions, or deletions.
- **Diffing Scope**: React diffs elements level-by-level (per sibling group during downward traversal) rather than exploring deeper subtrees if a parent type has changed.

- [More detail on React Reconciliation](https://legacy.reactjs.org/docs/reconciliation.html)
- [More detail on Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)

---

### Question af721df7-312b-4ffb-895c-58f257e08504

- What is the difference between component rendering (the render phase) and the reconciliation and commit process?

### Answer

- **Render Phase (Virtual DOM generation & diffing)**:
  - React calls the component function (or `render()`) to obtain a new tree of **React elements** (plain JavaScript objects).
  - React compares (diffs) the newly generated element tree against the existing **Fiber tree** to compute required changes.
  - In modern React (Fiber), this phase is **pure, has no side effects, and is interruptible** in concurrent mode.
- **Reconciliation**:
  - The internal algorithmic process that determines *which parts* of the tree changed between renders by evaluating element types, keys, and props.
- **Commit Phase (DOM mutations & effects)**:
  - React applies the computed mutations to the **Real DOM** in a single, **synchronous, uninterruptible** pass to avoid visual tearing.
  - Executes lifecycle methods and hooks: `useLayoutEffect` synchronously after DOM mutations, then `useEffect` asynchronously after paint.

- [More detail on Render and Commit](https://react.dev/learn/render-and-commit)

---

### Question f2c9a76e-92ae-487f-a2cb-fb2d59779d84

- What factors determine component identity in React, and what happens if two elements share the same key but have different types?

### Answer

- Component identity is determined by three factors:
  - **Component / Element Type**: The function/class reference or HTML tag name (e.g., `div`, `MyComponent`).
  - **Key Prop**: An explicit identifier (`key="..."`) supplied to distinguish siblings.
  - **Tree Position**: The structural hierarchy and sibling order in the element tree when no key is provided.
- **Type Check Precedence**: Type takes strict precedence over `key`. If the `key` is identical but the `type` changes, React **unmounts the previous component** and mounts a fresh one. It will never reuse an instance across different types.

```javascript
// Although keys match, type change (<A> vs <B>) triggers a full unmount and remount
{toggle ? <A key="shared-id" /> : <B key="shared-id" />}
```

- [More detail on Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state#same-component-at-the-same-position-preserves-state)

---

### Question b79ce095-44c7-4220-a3c5-e8bbd6ba5c9c

- What is the difference between a re-render and an unmount/remount in React?

### Answer

- **Re-render (Identity Preserved)**:
  - Occurs when state or props change, but the component's **type, key, and position remain identical**.
  - React retains the **same Fiber node and DOM instance**.
  - Internal state (`useState`, `useRef`) is **preserved**.
  - Only altered DOM attributes and children are updated.
- **Unmount and Remount (Identity Changed)**:
  - Occurs when the component's **type changes, key changes, or its position shifts** without a persistent key.
  - React completely **destroys the existing component instance**, wipes out its **internal state and refs**, runs effect cleanups, and removes the DOM node.
  - Mounts a **brand-new instance** from scratch, initializing default state and re-running all mount effects.

- [More detail on Resetting State at the Same Position](https://react.dev/learn/preserving-and-resetting-state#resetting-state-at-the-same-position)

---

### Question b9f8a959-f9f6-4c22-8cb9-0198393555b5

- Why does the input value persist when toggling between two conditional inputs in this component, and how do you prevent it?

```javascript
const UserInfoForm = () => {
  const [isCompany, setIsCompany] = useState(false);

  return (
    <div className="form-container">
      <button onClick={() => setIsCompany(!isCompany)}>
        {isCompany ? "Cancel" : "Edit"}
      </button>

      {isCompany ? (
        <input type="text" placeholder="Company tax ID" id="company-tax-id" />
      ) : (
        <input type="text" placeholder="Personal tax ID" id="personal-tax-id" />
      )}
    </div>
  );
};
```

### Answer

- **Why it persists**:
  - Both branches return an element with the exact same **type** (`'input'`) and the exact same **tree position** (the second child of `div`).
  - Because neither has an explicit **`key`**, React's diffing algorithm considers them the **same identity**.
  - React updates only changed props (`placeholder`, `id`) on the existing real DOM node, leaving the unmanaged DOM state (`value`) intact.
- **How to prevent it**:
  - Assign distinct **`key` props** (e.g., `<input key="company" ... />` and `<input key="personal" ... />`).
  - This forces React to recognize an **identity change**, unmounting the previous input and mounting a clean, empty input element.

- [More detail on Resetting State with a Key](https://react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key)

---

### Question 6a7e2c98-57f4-434e-91f2-e862b0fa63a9

- Why is defining a component inside another component's render body considered a severe anti-pattern?

```javascript
const Form = () => {
  const Input = () => <input type="text" />;

  return <Input />;
};
```

### Answer

- **Creates a New Component Type on Every Render**:
  - Each time `Form` re-renders, a brand-new `Input` function reference is instantiated in memory.
  - React compares component identity by reference (`prevChild.type === nextChild.type`). Because the reference changed, React treats `Input` as an entirely **different component type**.
- **Forces Continuous Remounting**:
  - On every single render of `Form`, React **unmounts the previous `Input` DOM subtree and remounts a new one**.
- **Severe Consequences**:
  - **Loss of Input Focus**: Typing a single keystroke triggers a re-render, unmounting the active input and losing cursor focus immediately.
  - **Loss of Internal State**: Any `useState`, `useRef`, or child component state inside `Input` is destroyed on every render.
  - **Performance Degradation**: Continuous DOM teardown and recreation bypasses reconciliation reuse.
- **Solution**: Declare subcomponents outside the parent component, or pass them as children/props.

- [More detail on Nesting Component Definitions](https://react.dev/learn/your-first-component#nesting-and-organizing-components)

---

### Question 5e9b0e56-b89b-4a54-8351-f4f56a6ff48c

- Will `<StaticElement />` unmount and remount when items in the dynamic list are added, removed, or reordered?

```javascript
<>
  {items.map((item) => (
    <ListItem key={item.id} />
  ))}
  <StaticElement />
</>
```

### Answer

- **No, `<StaticElement />` will not remount**. It will only re-render if its own props or context change.
- **Slot Positioning**:
  - In JSX, the dynamic expression `{items.map(...)}` evaluates to a single array child.
  - The parent Fragment's `props.children` structure is: `[ [ ListItem, ListItem, ... ], StaticElement ]`.
  - The entire dynamic list occupies **slot index 0**, and `<StaticElement />` occupies **slot index 1**.
- **Stability**:
  - Even if `items` changes length from 10 to 0, `<StaticElement />` remains at slot index 1 with an unchanged component type and implicit key. Its **identity is preserved**.

- [More detail on Rendering Lists and Keys](https://react.dev/learn/rendering-lists#rules-of-keys)

---

### Question c8486715-9739-4469-b9d8-df5347b7fdcf

- How do the Component Tree, Element Tree (Virtual DOM), Fiber Tree, and Real DOM differ in React?

### Answer

- **Component Tree**:
  - The conceptual, developer-facing hierarchy of components composed together (e.g., `App` -> `Header`, `Content`).
- **Element Tree (Virtual DOM)**:
  - An immutable, lightweight in-memory tree of plain JavaScript objects produced by JSX compilation (`React.createElement` or `jsx()`).
  - Describes *what the UI should look like* (`{ type, props, key }`) for a single render pass.
  - Thrown away and recreated on every render cycle.
- **Fiber Tree**:
  - React's internal, persistent, mutable data structure representing **units of work**.
  - Retains component state, hooks, pending work, lanes (priorities), DOM node references, and tree relationships (`child`, `sibling`, `return`).
  - Persists across renders to facilitate reconciliation and scheduling.
- **Real DOM**:
  - The browser's actual native document tree rendered by the layout engine. Only mutated in the synchronous commit phase.

- [More detail on Describing the UI](https://react.dev/learn/describing-the-ui)
- [More detail on React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)

---

### Question ca6dd89d-e9fe-4795-b216-870744d55ddb

- What is a Fiber node, and what are its key structural pointers and fields?

### Answer

- A **Fiber node** is an internal JavaScript object representing a unit of work and the mutable runtime instance of a component or DOM node.
- **Structural Pointers (Singly-Linked List Tree)**:
  - **`child`**: Points to its first immediate child fiber.
  - **`sibling`**: Points to its next immediate sibling fiber.
  - **`return`**: Points to its parent fiber (the node it returns to after completion).
  - *Note*: This linked-list representation allows React to traverse trees with an iterative `while` loop rather than a recursive call stack, making rendering pausable.
- **Work & State Fields**:
  - **`memoizedState`**: Holds the hook state linked-list for function components, or class state.
  - **`memoizedProps` / `pendingProps`**: Props used during previous render vs. new incoming props.
  - **`flags` (formerly `effectTag`)**: Bitmask describing required DOM operations (e.g., `Placement`, `Update`, `Deletion`).
  - **`alternate`**: Pointer linking the `current` fiber node to its corresponding `workInProgress` counterpart.

- [More detail on Fiber node structure](https://github.com/acdlite/react-fiber-architecture#what-is-a-fiber)

---

### Question 7215ab54-4c86-4d4e-bf29-1c1001464f74

- How did the legacy Stack Reconciler (React 15) operate, and what were its primary architectural limitations?

### Answer

- **Core Mechanism**:
  - Relied on synchronous **depth-first recursive traversal** of the element tree using the native JavaScript **call stack**.
  - Calling `render()` on a parent immediately triggered recursive `render()` calls down through all descendants until reaching leaf DOM nodes.
- **Key Limitations**:
  - **Synchronous & Uninterruptible**: In JavaScript, a running function runs to completion. A large tree update could tie up the main thread for 50-100ms+.
  - **Main Thread Starvation (Jank)**: Blocked browser tasks like user clicks, keystrokes, and 60fps frame painting (~16.6ms window), causing noticeable frame drops and latency.
  - **No Update Prioritization**: A background data fetch update was processed with the same urgency as an active text input or hover animation.

- [More detail on Fiber Architecture Motivation](https://github.com/acdlite/react-fiber-architecture)
- [More detail on Design Principles - Scheduling](https://legacy.reactjs.org/docs/design-principles.html#scheduling)

---

### Question 0b108176-a332-49cf-8e27-d20d0f6fb4df

- How does the Fiber Reconciler utilize double buffering during an update cycle?

### Answer

- **Double Buffering Pattern**:
  - React maintains two fiber trees in memory simultaneously:
    - **`current` Tree**: Represents the UI already committed and visible on screen.
    - **`workInProgress` (WIP) Tree**: Represents the new UI currently being computed in memory.
  - Each fiber node references its twin via the **`alternate`** pointer.
- **Update Workflow**:
  1. **Schedule**: A state change allocates update lanes (priorities) and schedules work from the root fiber.
  2. **Render Phase (WIP Tree Construction)**:
     - React traverses the tree building the `workInProgress` fibers.
     - Existing fiber nodes and their DOM instances are reused whenever component identity (`type`, `key`, `position`) matches.
     - This phase is **pure and interruptible**.
  3. **Commit Phase (Pointer Swap)**:
     - React executes all DOM mutations and effect hooks synchronously.
     - React switches the root's `current` pointer to point to the `workInProgress` tree (`FiberRoot.current = workInProgress`). The old `current` becomes the next WIP pool.

- [More detail on Fiber Double Buffering](https://github.com/acdlite/react-fiber-architecture#double-buffering)

---

### Question cf0d08ae-89a5-4649-9fc5-57315ad61c81

- How do beginWork and completeWork operate during the Fiber Reconciler's render phase?

### Answer

- Traversal during the render phase is split into two steps: a downward pass (**`beginWork`**) and an upward pass (**`completeWork`**).
- **`beginWork` (Downward Pass - Reconciliation & Diffing)**:
  - Invoked on each fiber node moving from parent to child.
  - Compares existing props/state against incoming props/state.
  - Checks for **bailout**: if props/state haven't changed and no pending updates exist, skips re-evaluating the component.
  - If re-evaluating, executes the component, diffs the returned React elements against old child fibers (**reconciliation happens here**), and creates or tags new child fibers.
- **`completeWork` (Upward Pass - Node Finalization & Effect Bubbling)**:
  - Invoked once a fiber's leaf children have finished `beginWork`, traveling back up via `return` pointers.
  - For host DOM components, creates or updates the underlying DOM instance in memory.
  - Bubbles child **mutation flags** up into parent **`subtreeFlags`** bitmasks (or effect lists in legacy React) so the commit phase can skip subtrees without pending mutations in O(1) time.
  - No real DOM mutations occur during either phase; real DOM is touched only in the commit phase.

- [More detail on Fiber render phase traversal](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberWorkLoop.js)

---

### Question f811a7ba-3b4b-46d0-b043-b58ab248b060

- How does memoization (`React.memo`) trigger a bailout during Fiber reconciliation?

### Answer

- **Bailout Mechanism**:
  - During `beginWork`, React checks two conditions to bail out:
    - `oldProps === newProps` (referential equality or shallow equality in `React.memo`).
    - The fiber has no scheduled updates or context changes in its priority lane.
- **When Bailout Succeeds**:
  - React **skips executing the component function** entirely.
  - It clones the existing child fibers from `current` into `workInProgress` without diffing their internal subtrees.
- **Caveats & Overrides**:
  - A bailout is aborted if a child inside the subtree schedules a state update, or if the component consumes a `useContext` whose value changed.
  - Passing inline object literals, arrays, or anonymous functions breaks shallow prop equality unless stabilized via `useMemo` / `useCallback`.

- [More detail on React.memo](https://react.dev/reference/react/memo)

---

### Question d805c828-f436-4618-8444-88313b135486

- What is the React Scheduler, and what core mechanisms does it use to prevent UI jank?

### Answer

- The **Scheduler** is an independent cooperative task scheduler that coordinates *when* units of rendering work are executed on the browser's main thread.
- **Core Mechanisms**:
  - **Priority Queue**: Tasks are prioritized across lanes (e.g., `Immediate`, `UserBlocking`, `Normal`, `Low`, `Idle`). High-priority tasks (typing, clicks) jump ahead of low-priority tasks (transitions, data fetches).
  - **Cooperative Time Slicing**: During rendering, React repeatedly queries `shouldYield()`. If the current time slice budget (~5ms deadline) expires, work yields to the browser.
  - **Event Loop Integration**: Rather than running in a synchronous loop, yielding uses macrotask channels (via **`MessageChannel`**) to yield execution, allowing the browser to paint, run animations, and process I/O before React resumes.
  - **Task Starvation Prevention**: Every task has an expiration deadline based on priority. If a task is repeatedly interrupted or delayed until its deadline expires, it turns synchronous to prevent starvation.

- [More detail on React Scheduler](https://github.com/facebook/react/tree/main/packages/scheduler)

---

### Question c1ca8cf9-5698-42af-8de6-979656513296

- What does concurrency mean in React, and how is it fundamentally enabled by the Fiber Reconciler?

### Answer

- **What Concurrency Means**:
  - React Concurrency is **cooperative task switching on a single thread**, not multi-threaded parallel execution.
  - It allows React to **pause, resume, prioritize, or completely discard** render passes without blocking user interactions or frame rendering.
- **Why Fiber is the Enabling Foundation**:
  - In React 15, the call stack held execution state; pausing was impossible because execution had to run to completion.
  - **Fiber converts the call stack into heap-allocated objects**: Each fiber node stores its own pointer to `child`, `sibling`, and `return`.
  - React can pause traversal at any individual fiber node, store the pointer in memory, yield to the browser, and resume from that exact fiber later.
  - If a newer state update arrives mid-render (e.g., a new keystroke), React can abandon the current in-progress WIP tree and start fresh without leaving inconsistent UI in the DOM.

- [More detail on Concurrent React](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)

---

### Question bce4d62d-f135-4c1d-95fb-af4903b8031a

- What are the primary React Concurrency APIs, and how do they differentiate urgent from non-urgent updates?

### Answer

- **Urgent vs. Transition Updates**:
  - **Urgent Updates** (direct user input like typing, clicking, dragging) require immediate visual feedback.
  - **Transition Updates** (filtering large lists, switching tabs, fetching search results) can tolerate brief delays without degrading user experience.
- **Primary Concurrency APIs**:
  - **`useTransition` / `startTransition`**: Wraps state updates to mark them as low-priority transitions. React keeps the current UI interactive and can interrupt the transition render if an urgent update occurs.
  - **`useDeferredValue`**: Defers updating a derived value until urgent render work completes, keeping input elements responsive while heavy child trees re-render in the background.
  - **`Suspense`**: Coordinates asynchronous dependencies (data fetching, lazy code loading), rendering fallback UI without blocking the rest of the application tree.

```javascript
const [isPending, startTransition] = useTransition();

function handleChange(e) {
  // Urgent: updates input immediately
  setText(e.target.value);

  // Non-urgent: interruptible rendering for heavy filter computation
  startTransition(() => {
    setSearchQuery(e.target.value);
  });
}
```

- [More detail on useTransition](https://react.dev/reference/react/useTransition)
- [More detail on useDeferredValue](https://react.dev/reference/react/useDeferredValue)

---

### Question 0aaa8374-7ff4-41be-a864-2d3ba0dc027a

- How does Automatic Batching in React 18 differ from legacy batching, and how does it operate across asynchronous boundaries?

### Answer

- **Legacy Batching (React <=17)**:
  - React only batched state updates triggered within **React synthetic event handlers** (e.g., `onClick`, `onChange`).
  - Updates inside `setTimeout`, native `addEventListener`, or Promise chains (`fetch().then()`) were **not batched**, triggering separate, synchronous render passes for each `setState`.
- **Automatic Batching (React 18+)**:
  - All state updates scheduled within the same browser task or microtask are **automatically batched into a single render pass**, regardless of origin (Promises, timeouts, native event listeners).
- **Execution Mechanism**:
  - React enqueues update objects onto the Fiber's update queue and schedules a microtask via the Scheduler. When the current task finishes, React coalesces the pending updates into one coordinated render.

- [More detail on Automatic batching in React 18](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)

---

### Question da053ce9-0492-43e5-8267-7b42ed40c9b4

- When and why would you use `flushSync`, and what architectural cost does it introduce?

### Answer

- **Purpose of `flushSync`**:
  - Forces React to opt out of batching and immediately flush pending updates synchronously to mutate the Real DOM before the surrounding code continues.
- **Primary Use Case**:
  - Reading layout or geometry immediately after state change (e.g., scrolling a chat container to the bottom immediately after adding a new message).
- **Architectural Costs & Tradeoffs**:
  - **De-optimizes Rendering**: Bypasses the Scheduler and cooperative time slicing; turns rendering synchronous and blocking.
  - **Performance Hit**: Can induce layout thrashing and frame drops if executed frequently.
  - May interrupt active transitions and force pending fallback Suspense boundaries to display prematurely.

- [More detail on flushSync](https://react.dev/reference/react-dom/flushSync)

---

### Question 3f5e77d7-0487-442c-ba2c-86db6b088c8f

- What are the three distinct sub-phases of the Fiber Commit Phase, and in what sequence are DOM mutations and effects executed?

### Answer

- The commit phase executes **synchronously and uninterruptibly** on the Real DOM in three sequential passes:
  - **Before Mutation Phase (`commitBeforeMutationEffects`)**:
    - Reads current state of the DOM.
    - Executes class lifecycle `getSnapshotBeforeUpdate`.
    - Schedules passive effects (`useEffect`) to run asynchronously after paint via the Scheduler.
  - **Mutation Phase (`commitMutationEffects`)**:
    - Detaches existing host refs (`ref.current = null`).
    - Executes host DOM mutations matching flags: `Placement` (`appendChild` / `insertBefore`), `Update` (`updateDOMProperties`), and `ChildDeletion` (`removeChild`, calling effect cleanups and unmount lifecycles).
  - **Layout Phase (`commitLayoutEffects`)**:
    - Real DOM has been mutated and is in its final layout state before paint.
    - Executes synchronous lifecycle methods and **`useLayoutEffect` create callbacks**.
    - Attaches new refs (`commitAttachRef`).
- **Passive Effects Phase (Post-paint)**:
  - Browser paints the updated DOM; React Scheduler runs scheduled `useEffect` cleanup and setup functions asynchronously via `MessageChannel`.

- [More detail on Render and Commit phases](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)

---

### Question e88e5615-e76e-488b-82bf-cf0425e8d0aa

- How does the execution timing of `useLayoutEffect` versus `useEffect` relate to the browser paint cycle?

### Answer

- **`useLayoutEffect` (Pre-paint / Synchronous)**:
  - Executes during the **Layout sub-phase** of commit, immediately after Real DOM mutations but **before the browser paints**.
  - **Blocks the browser**: Any state update scheduled inside `useLayoutEffect` triggers a synchronous re-render and re-commit pass before the browser paints, preventing visual flickering when measuring DOM geometry.
- **`useEffect` (Post-paint / Asynchronous)**:
  - Deferred and executed asynchronously by the Scheduler **after the browser has painted** the current frame.
  - **Non-blocking**: Does not block user interactions or frame rendering; ideal for side effects like network requests, data subscriptions, and timers.

- [More detail on useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)
- [More detail on useEffect execution timing](https://react.dev/reference/react/useEffect)
