# Common Patterns in Next.js

### Question c33718c1-2b58-4fea-82cc-31e2e56c7c76

- Handling forms in Next.js 13+ with React Server Components (RSC) and Server Actions
  - Hybrid Form
  - What benefits does it bring to the table?

### Answer

- requisite:
  - server action
  - form component (client component)
  - useActionState, useFormStatus

- Benefits:
  - Progressive Enhancement: If JavaScript fails to load or is slow, the native HTML `<form action="...">` POST still submits to the server action. Once JS hydrates, React seamlessly intercepts it for an SPA experience.
  - Security Isolation: Database secrets, API tokens, and Zod schemas inside actions.ts stay on the server and are never included in client JS bundles.
  - Sub-Component Awareness: Child components inside the form (e.g. `<SubmitButton />`) can call useFormStatus() to know if their parent form is pending without prop drilling.
  - Optimistic UI Updates: Can be combined with React 19’s useOptimistic to show immediate visual changes before server confirmation.

---

### Question 0d402c8a-9ea1-41a0-96f1-b7a291745ee4

- What is Partial Prerendering (PPR)?

### Answer

- PPR splits a page into two parts:

  - Static Shell (Navbar, Footer, Layout): Built at build time and cached on a global CDN edge. Loads in ~10ms.
  - Dynamic Holes (User Avatar, Shopping Cart): Streamed in from the server inside `<Suspense>` boundaries.

---

### Question baa12afd-6791-4e63-909c-fb8055fd6a42

### Answer

---

### Question f096d7d1-b55c-4e72-87b0-4c7616af034b

### Answer

---

### Question 007dd3c5-8c67-4c72-b43f-cadacbd91e36

### Answer

---

### Question 3d4e5417-e2e6-4918-81cc-9ebac722dbe6

### Answer

---
