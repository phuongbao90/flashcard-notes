# React Hooks

### Question 6fadd979-0269-45ad-8f1d-af622cabf10c

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

### Question 4ee869c9-0d5a-4290-ab76-cee9d8ce0054

### Answer

---

### Question 58bd6d89-638f-4d81-b2e2-d6760b1cfbfb

### Answer

---

### Question 9d7125db-1991-4e0a-bc55-b49071aa044a

### Answer

---

### Question b207517a-4c9d-4a75-9ffa-266b850d21ec

### Answer

---

### Question f61a172a-8fed-46cb-b442-a50336a746b7

### Answer

---

### Question c9de7dad-d671-471f-ad29-419939671825

### Answer

---

### Question 54601d67-da12-44dd-88ff-d9a3138344d2

### Answer

---

### Question d316430c-4c1b-4476-8b54-373640636af3

### Answer

---

### Question cee62d76-db04-4ddb-9d17-8382e7460b21

### Answer

---

### Question d2569ea8-2a52-4f1e-bd83-ab395bb79d46

### Answer

---

### Question 5637ee5d-7cff-416e-a13b-d24e031702a1

### Answer

---

### Question 57e2cab4-32e7-4f0e-a494-fcb82eccc66f

### Answer

---

### Question 19af59e2-aaa5-4de4-b923-75531ae432dd

### Answer

---

### Question 3bb11c74-28ff-41ea-bf22-a5e7e8566f4b

### Answer

---

### Question 4944b852-6320-4dea-a2eb-ed73f115ef51

### Answer

---
