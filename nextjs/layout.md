# Nextjs

## Layout

### Question 8db75af3-4fb0-495a-9050-a4004948d874

- What is the difference between layout.js and template.js in Next.js (App Router)?

### Answer

- layout.js preserves its state, maintains DOM structure, and does not re-render or re-mount its children components during navigation between sub-routes.
- template.js creates a new instance for each child route upon navigation. Every time a user navigates between routes sharing a template, DOM nodes are re-created, state is reset, and useEffect hooks re-fire (useful for page view analytics, enter/exit animations, or resetting form states).

---

### Question 6d8739ce-f7fd-489f-b26e-32f3216c4f67

- Why must the Root Layout (app/layout.tsx) contain html and body tags, and what restrictions apply to it?

### Answer

- The top-level Root Layout replaces the legacy _app.js and _document.js. Next.js requires it to define the root HTML skeleton
  1. It must be a Server Component (cannot use "use client").
  2. You cannot pass event handlers or hooks inside it directly.
  3. Route groups (group) can define multiple root layouts, but every leaf route must be wrapped by exactly one root layout.

---

### Question c6e31a91-35eb-4ffe-8d06-1b4c07f266b0

- How do nested layouts affect performance and data fetching in Server Components?

### Answer

- allow independent parallel data fetching at each segment level, Data fetched in a parent layout does not block rendering of child layouts if wrapped in Suspense.
  ```javascript
  /dashboard/analytics Route Segment Execution:

  [Request Initiated]
      ├── RootLayout (fetches user profile)      --> Async Promise A
      ├── DashboardLayout (fetches nav items)     --> Async Promise B
      └── AnalyticsPage (fetches heavy metrics)   --> Async Promise C

  * Promises A, B, and C execute in parallel, not sequentially.
  ```
- Layouts enable partial rendering: when navigating between sibling routes (e.g., /dashboard/settings to /dashboard/profile), Next.js re-renders only the leaf page while preserving the parent layout, saving bandwidth and compute.

---

### Question 0f1842d6-c7a6-40b2-881a-881f831da5de

- What is a Request Waterfall in nested Layouts & Pages, and how do you prevent it when both layout.tsx and page.tsx fetch async data?

### Answer

- A Request Waterfall occurs when a parent layout fetches data before the child page can start fetching, causing sequential delays. To prevent it:
  1. Wrap Layout Children in Suspense: Allow layout.tsx to render shell UI immediately while streaming in page.tsx as its data resolves.
  2. Component-level Fetching: Move data fetching down to the specific UI components that require it rather than doing monolithic fetches in the top-level layout.
  3. Preloading / Request Deduping: Use React.cache() or fetch caching to initiate requests early without duplicating HTTP calls across the render tree.

---

### Question f51e1f15-33c6-4072-b4a9-9ac4c1633462

- How do Parallel Routes (@slot) work in Next.js layouts, and why is default.js critical when using them?

### Answer

-

---

### Question bdbaa00c-fbe1-4bbe-a0c6-ce26e2e955c4

- Explain parallel routes
- How does it work?
- key rules

### Answer

- Render multiple routes at the same time inside one layout (instead of one route replacing another). Useful for dashboards, sidebars, modals, etc.

- how it works:
  1. You define slots using @folder

  ```
  app/
      layout.tsx
      @team/page.tsx
      @analytics/page.tsx
  ```
  2. In layout.tsx, those slots become props:

  ```
  export default function Layout({ children, team, analytics }) {
      return (
          <>
              {children}
              {team}
              {analytics}
          </>
      )
  }
  ```

  👉 Result: all of them render in parallel, not nested.

- key rules:
  - Slots ≠ routes
    @analytics does NOT affect URL
    /@analytics/views → URL is /views
  - children is just a slot
    children = implicit slot (@children)
  - All slots share same route level
    You cannot mix static + dynamic slots at same level
    If one is dynamic → all must be dynamic
  - Independent Execution: Each slot maintains its own independent error handling (error.js), loading UI (loading.js), and route state.

---

### Question 5a9c615b-5fbc-45ff-9b23-934de4d48f0a

- explain default.js

### Answer

- default.js: file to render as a fallback for unmatched slots during the initial load or full-page reload.

---

### Question 9c9d5d74-6b34-4dc8-ba1c-7186fad1d824

- What are possible mistake with parallel routes?

### Answer

- Possible mistakes
  - Thinking slots change URL (they don’t)
  - Forgetting default.js → random 404 on refresh
  - Expecting SSR-like full rerender (parallel routes preserve state)
  - Overusing → mental model becomes hard (this feature is complex)
  - Misunderstanding soft vs hard navigation (big source of bugs)

---

### Question 588f7e64-4bf8-4c79-ba63-6d4eb7bc7d3a

- when to use / not to use Parallel routes?

### Answer

- Use parallel routes when you need multiple independent UI regions that:
  - Render at the same time
  - Have their own routing/state
  - Should not block or replace each other
- When NOT to use it (this is what separates strong candidates)
  - ❌ Simple page navigation
    - If UI fully changes per route → don’t use it
  - ❌ Shared layout only
    - Use normal layout.tsx, not parallel routes
  - ❌ If slots must always match URL
    - Then parallel routes add unnecessary complexity

---

### Question c4ee6cab-cb18-4cdc-8f93-5a52c5218e08

- In the context of Dashboard, explain the significant of parallel route, what problem does it solve?

### Answer

1. Without parallel route: (using normal layout.tsx)

   ```javascript
   /layout.tsx
   <Sidebar />
   {children}   // main content
   <Analytics />

   // routing
   /dashboard
   /dashboard/settings
   ```
   - What happens on navigation

     - Go /dashboard → /dashboard/settings

       👉 Entire children subtree changes

     - But also:

       - Sidebar might re-render
       - Analytics might re-render
       - Data fetching may re-run
       - Suspense boundaries may reset

     - Even if React skips DOM updates, you still:

       - re-run components
       - lose local state (depending on structure)
       - trigger loading states

2. Without parallel route:

   ```javascript
   app/
       layout.tsx
       @sidebar/
       @main/
       @analytics/

   export default function Layout({ sidebar, main, analytics }) {
       return (
           <>
               {sidebar}
               {main}
               {analytics}
           </>
       )
   }
   ```
   - Sidebar, Analytic stay the same / does not re-run magic / does not refetch data
   - State preserve:
     - filters
     - scroll position
     - fetched data

3. summary: “Parallel routes let different parts of the UI behave like independent mini-apps with their own routing, state, and data lifecycle.”

---

### Question

- above the fold content: considerations

### Answer

- Above the fold: the part of the page that is visible without scrolling
- consider to be critical
- `<suspense>` might not be the best choice for above the fold content
  - as it can flash the fallback content, which is not ideal for above the fold content

---

### Question

- Error handling for critical chrome

### Answer

- throw error
- for non-critical chrome, we never throw; a misconfigured placement should not break the page.
  - do it silently, and degrade to nothing

---

### Question

- api fetching with cache

### Answer

- in nextjs 16, i know that the default cache behavior is
  - `fetch(url, { cache: 'no-store' })`
  - but if we specify
    ```ts
    fetch(url, {
      next: { tags: ["banners"], revalidate: 60 },
    });

    // is equivalent to

    fetch(url, {
      cache: "force-cache",
      next: { tags: ["banners"], revalidate: 60 },
    });
    ```

---

### Question

- Accessibility for carousel

### Answer

- keyboard navigation
- Autoplay
  - pause on hover
  - respect prefers-reduced-motion
  - pause on tab hide
  - aria-live="polite" for screen readers
    - screen readers wont read the content if it is not visible
- WAI-ARIA
  - set aria-roledescription="carousel" on the carousel container
  - slide identificaton
    - set aria-hidden="true" on the slides that are not visible so that screen readers will not read them
    - set aria-roledescription="slide" and aria-label="Slide 1 of 3" on the slides that are visible so that screen readers will read them
  - tablist pagination
    - set role="tablist" on the pagination container
    - set role="tab" and aria-selected="true" on the active pagination button so that screen readers will read them
    - set role="tab" and aria-selected="false" on the inactive pagination buttons so that screen readers will not read them
  - Navigational buttons
    - set aria-label="Previous slide" on the previous button so that screen readers will read them
    - set aria-label="Next slide" on the next button so that screen readers will read them

---

### Question

- How streaming works in Next.js 13+ with React Server Components (RSC) and Suspense boundaries?

### Answer

-

---

### Question

- What is RSC Payload Chunk?
- What does it include?

### Answer

- a compact, binary JSON string created on the server that represents the rendered React component tree, client component references, and props.
- During streaming, it's sent to the browser in chunks over a single HTTP response

- It includes:
  - Component tree structure (hierarchy of server and client components)
  - Props for each component
  - References to client components (for hydration)
  - Suspense boundary information (to handle loading states)

---
