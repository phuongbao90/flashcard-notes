# React

## React Reconciliation

### Question

What is React Reconciliation?

### Answer

Reconciliation is the process by which React updates the DOM to match your component tree.

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
