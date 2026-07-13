# React

## React Reconciliation

### Question

What is React Reconciliation?

### Answer

Reconciliation is the process by which React updates the DOM to match your component tree.

---

### Question

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

### Question

- what are the key factors in determining indentity of a component in React?

### Answer

- The type of the component (function or class)
- The key prop (if provided)
- The position of the component in the tree

---

### Question

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

### Question

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

### Question

```javascript
<div>
  {activeTab === "profile" && <ProfileTab state={sharedState} onStateChange={setSharedState} />}
  {activeTab === "settings" && <SettingsTab state={sharedState} onStateChange={setSharedState} />}
  {/* Other tabs */}
</div>
```

### Answer

- When switching between tabs, React will unmount the previous tab and mount the new one, which means the state of the previous tab will be lost unless it is lifted up to a common parent or managed in a global state.

---

### Question

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

### Question

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

### Question

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

### Question

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
