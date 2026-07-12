# React

## React Reconciliation

### Question

What is React Reconciliation?

### Answer

Reconciliation is the process by which React updates the DOM to match your component tree.

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

### Question

- what are the key factors in determining indentity of a component in React?

### Answer

- The type of the component (function or class)
- The key prop (if provided)
- The position of the component in the tree

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

### Question

````javascript
    <div>
      {activeTab === "profile" && (
        <ProfileTab state={sharedState} onStateChange={setSharedState} />
      )}
      {activeTab === "settings" && (
        <SettingsTab state={sharedState} onStateChange={setSharedState} />
      )}
      {/* Other tabs */}
    </div>
    ```
````
