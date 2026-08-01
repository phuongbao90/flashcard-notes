# React Hooks

### Question

- useActionState

### Answer

- react 19
- formerly useFormState

```ts
const [state, formAction, isPending] = useActionState(actionFn, initialState, permalink?);

async function actionFn(previousState: State, formData: FormData): Promise<State>{}
```

- formAction: Passed to `<form action={formAction}> or <button formAction={formAction}>`.
- actionFn Signature: Must accept previousState as its first parameter
  - unless use .bind() to add extra parameters
  ```ts
  // In Client Component:
  const updateItemWithId = updateItem.bind(null, id);
  const [state, formAction, isPending] = useActionState(updateItemWithId, initialState);

  async function updateItem(itemId: string, prevState: State, formData: FormData) { ... }

  ```
- this hook does not reset the form when success
  - use ref to reset the form manually

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---
