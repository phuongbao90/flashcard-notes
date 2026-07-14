# React

## React Reconciliation

### Question 17f119f9-1be9-4c53-b937-2c270f5855b4

What is React Reconciliation?

### Answer

Reconciliation is the process by which React updates the DOM to match your component tree.

---

### Question b9f8a959-f9f6-4c22-8cb9-0198393555b5

- Discuss what would happen when isCompany is toggled in the following code snippet.

```javascript
const UserInfoForm = () => {
  const [isCompany, setIsCompany] = useState(false);

  return (
    <div className="form-container">
      <button onClick={() => setIsCompany(!isCompany)}>{isCompany ? "Cancel" : "Edit"}</button>

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

- When user input "abc" to company tax input, and then toggle off isCompany, the input value "abc" will remain.
- the virtual DOM between toggles will have the same:
  - type: "input"
  - same position in the tree
  - the key is the same (no key provided, so React uses the index)
- so React will reuse the same input element and not create a new one, which means the value will persist.

---

### Question f2c9a76e-92ae-487f-a2cb-fb2d59779d84

- what are the key factors in determining indentity of a component in React?

### Answer

- The type of the component (function or class)
- The key prop (if provided)
- The position of the component in the tree

---

### Question 6a7e2c98-57f4-434e-91f2-e862b0fa63a9

What are the problems with this approach?

```javascript
const Form = () => {
  const Input = () => <input ... />;

  return (
    <Input ... />
  )
}
```

### Answer

Every time a component is created inside another component, it will be re-created on every render.

---

### Question 5e9b0e56-b89b-4a54-8351-f4f56a6ff48c

- Will StaticElement re-mount if list items change

```javascript
<>
  {items.map((item) => (
    <ListItem key={item.id} />
  ))}
  <StaticElement /> {/* Will this re-mount if items change? */}
</>
```

### Answer

- React treats the entire dynamic list as a single unit at the first position, so the StaticElement will always maintain its position and identity, regardless of changes to the list.

```javascript
[
  // The entire dynamic array becomes a single child
  [
    { type: ListItem, key: "1" },
    { type: ListItem, key: "2" },
  ],
  { type: StaticElement }, // Always maintains its second position
];
```

---

### Question 5f0231c7-8581-49d7-b614-009c51c60181

- What are the virtual DOM of this?

```javascript
const Component = () => {
  return (
    <div>
      <h1>Hello</h1>
      <p>World</p>
      <Input placeholder="Enter your name" id="name" />
    </div>
  );
};
```

### Answer

```javascript
{
  type: "div",
  props: {
    children: [
      { type: "h1", props: { children: "Hello" } },
      { type: "p", props: { children: "World" } },
      { type: Input, props: { placeholder: "Enter your name", id: "name" } },
    ],
  },
}
```

---

### Question 5fe1c485-8198-4915-9f42-19c944df8638

- component and dom element identity in React.
- components with same key but different type, will React reuse the same component or create a new one?

```javascript
<div>
  <button onClick={() => setToggle((t) => !t)}>Toggle</button>

  {/* SAME key, DIFFERENT type */}
  {toggle ? <A key="same" /> : <B key="same" />}
</div>
```

### Answer

- When the key is the same but the type is different, React will unmount the previous component and mount a new one. The identity of a component is determined by both its key and its type.

---

### Question 6b7267b5-b635-48b1-b352-922532f97af7

- React 15 - Stack Reconciler
  - what is its data structure?
  - what is its core algorithm?
  - what are its limitations?

### Answer

- Data structure: depth-first tree traversal
- Core algorithm: recursive function calls, using the JavaScript call stack as its scheduler.
- Limitations:
  - Cannot split work into chunks, leading to blocking of the main thread.
  - Cannot prioritize updates, leading to poor user experience for high-priority updates. Treat all updates equally, which can cause jank in the UI.
  - Cannot pause and resume work, which can lead to long-running updates that block the main thread.

---

### Question 7215ab54-4c86-4d4e-bf29-1c1001464f74

- React 15 - Stack Reconciler
  - What is the core function of the Stack Reconciler?
- Walk me through this tree and explain how the Stack Reconciler will traverse it.
- Why React cannot stop?

```
App
 ├── Header
 ├── Content
 │    ├── Post
 │    └── Sidebar
 └── Footer
```

### Answer

```javascript
function update(component) {
  const children = component.render();
  children.forEach(update);
}
```

```
 update(App)
  → update(Header)
  ← return
  → update(Content)
      → update(Post)
      ← return
      → update(Sidebar)
      ← return
  ← return
  → update(Footer)
  ← return
← return
```

- JS: ❗ Once a function is running, it runs until it returns. The call stack is filled with function calls, making it impossible to pause or interrupt the execution.

---

### Question d805c828-f436-4618-8444-88313b135486

- Fiber - what is a scheduler?

### Answer

- A scheduler is a system that manages the execution of tasks, determining when and how they should be executed.
- It’s not React itself—it’s a cooperative task scheduler that React uses under the hood.
- In the context of React Fiber, the scheduler is responsible for prioritizing updates and breaking them into smaller units of work that can be processed incrementally, allowing for better responsiveness and user experience.

---

### Question 0aaf66fe-4244-4bb9-92ad-3cc1275ade97

- Fiber - what scheduler enables React to do?

### Answer

- Enables Concurrent React
- Makes rendering interruptible
- Keeps apps responsive under heavy updates
- Allows features like:
  - startTransition
  - Suspense
  - selective rendering

---

### Question e09d1558-d260-496a-99a9-ac8c636046c1

- Fiber - key concepts of scheduler

### Answer

1. Priority levels: Different updates can have different priorities,

- Immediate (rare, sync)
- User-blocking (click, typing)
- Normal (default updates)
- Low
- Idle

👉 Higher priority = runs sooner, can interrupt lower ones

2. Time slicing (cooperative)

- Work is split into small chunks
- React checks shouldYield()
- If time is up → pause → resume later

👉 Prevents blocking the UI thread

3. Frame awareness (modern behavior)

- Scheduler tries to finish work before next frame (~16ms)
- Not fixed time slicing (no hard 5ms anymore)
- Uses a deadline to decide when to yield

4. Scheduling APIs (simplified)

- Internally, React uses things like:
  - scheduleCallback(priority, callback)
  - shouldYield()
  - cancelCallback()

👉 Think: a priority queue + event loop integration

5. How it runs tasks

- Uses MessageChannel (or similar) to queue macrotasks
- Avoids blocking like a long while loop
- Lets browser handle input/paint in between

---

### Question ca6dd89d-e9fe-4795-b216-870744d55ddb

- Fiber - data structure of a fiber node

### Answer

- A fiber node is a JavaScript object that represents a unit of work in React's rendering process.

---

### Question 0c235953-5628-4203-ba53-60634f05f4ed

- Virtual DOM - What is the virtual DOM?

### Answer

- in-memory representation of Real DOM. It is lightweight JavaScript object which is copy of Real DOM.

---

### Question 0b108176-a332-49cf-8e27-d20d0f6fb4df

- How Virtual DOM works in Fiber Reconciler?
  App
  └── ProductDetail
  ....└── QuantityCount
  ........└── div
  ...........├── Button
  ...........├── Quantity ← shows {count}
  ...........└── Button

### Answer

- Fiber Reconciler:
  - React maintains two trees:
    - current tree → what is currently rendered (committed)
    - workInProgress tree → the new version being built (double buffering)
  - How it works:
    App
    └── ProductDetail
    ......└── QuantityCount
    ............└── div
    ...............├── Button
    ...............├── Quantity ← shows {count}
    ...............└── Button
    1. State / props change
    - React marks the Fiber with an update (lane/priority)
    - Then the scheduler decides when to start work (can delay, batch, or prioritize)
    2. Render phase (build workInProgress tree)
       ⚠️ This phase is interruptible (key feature of Fiber)
       👉 React always schedules work at the root Fiber
    - React starts from the root and traverses down:
      - App → ProductDetail → QuantityCount → div → children
      - At each node, React runs beginWork
    - At App, no state/props change -> visits App and bails out (skip re-rendering logic but not skipping traversal entirely)
    - At ProductDetail, no state/props change -> visits ProductDetail and bails out
    - At QuantityCount, state changed, re-run the component -> new Fiber node created
    3. Reconciliation happens DURING creation of the new Fiber node
    - compare new Fiber node with old Fiber node, check component identity (type + key + position)
    - same identity → reuse the DOM node + Fiber node
    - commit phase: apply changes to the real DOM
    - This is a big improvement over React 15:
      - React does render + diff at the same time
      - No separate “diff phase”
    4. Commit phase (apply changes to the real DOM)
       ⚠️ This phase is NOT interruptible
    - Apply changes to real DOM
    - Run effects (useEffect, layout effects)

---

### Question fad3635d-bcb9-490c-ac93-39891dd90c2b

- How Virtual DOM works in Stack Reconciler?

### Answer

- Stack Reconciler:
  - Recursive tree traversal
  - Uses JS call stack as scheduler
  - Cannot pause, prioritize, or split work

---

### Question cf0d08ae-89a5-4649-9fc5-57315ad61c81

- Fiber - Explain beginWork and completeWork phases in the Fiber Reconciler.
  - When does reconciliation happen in the Fiber Reconciler?

### Answer

- They both happen during the render phase of the Fiber Reconciler, which is interruptible and can be paused and resumed.
- During the render phase, React uses a two-step traversal: beginWork (top-down reconciliation) and completeWork (bottom-up finalization and effect collection).

- 🔽 Downward phase (beginWork)

  - React starts from the root and traverses down:
    - App → ProductDetail → QuantityCount → div → children
  - At each node:
    - run beginWork
  - What it does:
    - Compare new props/state vs old + is there a pending update?
    - Decide:
      - re-render?
      - bailout?
    - Generate child fibers

  🔼 Upward phase (completeWork)

  - After reaching the deepest node, React goes back up:

  - Button → Quantity → Button → div → QuantityCount → ProductDetail → App
  - At each node:
    - run completeWork
  - 🔹 What completeWork does:
    - Finalize the Fiber
    - Prepare DOM updates (mark what needs to change)
    - Build the effect list for commit phase

  - 👉 NO real DOM changes happen here

---

### Question f811a7ba-3b4b-46d0-b043-b58ab248b060

- Fiber - How does memorization effect reconciliation in the Fiber Reconciler?

### Answer

- React will NOT bailout a subtree if there is pending work inside it
- React.memo
  - if (props are equal)
  - → bailout
  - → skip calling component
  - → reuse previous subtree
