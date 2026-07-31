# Common Patterns in Next.js

### Question

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

### Question

- What is Partial Prerendering (PPR)?

### Answer

- PPR splits a page into two parts:

  - Static Shell (Navbar, Footer, Layout): Built at build time and cached on a global CDN edge. Loads in ~10ms.
  - Dynamic Holes (User Avatar, Shopping Cart): Streamed in from the server inside `<Suspense>` boundaries.

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
