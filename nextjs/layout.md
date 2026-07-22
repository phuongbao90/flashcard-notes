# Nextjs
## Layout

### Question
- What is the difference between layout.js and template.js in Next.js (App Router)?  
### Answer
- layout.js preserves its state, maintains DOM structure, and does not re-render or re-mount its children components during navigation between  sub-routes.                                                                                                                                     
- template.js creates a new instance for each child route upon navigation. Every time a user navigates between routes sharing a template, DOM nodes are re-created, state is reset, and useEffect hooks re-fire (useful for page view analytics, enter/exit animations, or resetting form  states).  
---
### Question
- Why must the Root Layout (app/layout.tsx) contain html and body tags, and what restrictions apply to it? 

### Answer
- The top-level Root Layout replaces the legacy _app.js and _document.js. Next.js requires it to define the root HTML skeleton
    1. It must be a Server Component (cannot use "use client").                                                                                 
    2. You cannot pass event handlers or hooks inside it directly.                                                                              
    3. Route groups (group) can define multiple root layouts, but every leaf route must be wrapped by exactly one root layout.

---
### Question
- How do nested layouts affect performance and data fetching in Server Components?

### Answer
- allow independent parallel data fetching at each segment level, Data fetched in a parent layout does not block rendering of child layouts if wrapped in Suspense.
    ``` javascript
    /dashboard/analytics Route Segment Execution:

    [Request Initiated]
        ├── RootLayout (fetches user profile)      --> Async Promise A
        ├── DashboardLayout (fetches nav items)     --> Async Promise B
        └── AnalyticsPage (fetches heavy metrics)   --> Async Promise C
        
    * Promises A, B, and C execute in parallel, not sequentially.
    ```
- Layouts enable partial rendering: when navigating between sibling routes (e.g., /dashboard/settings to /dashboard/profile), Next.js re-renders only the leaf page while preserving the parent layout, saving bandwidth and compute.

---
### Question
- What is a Request Waterfall in nested Layouts & Pages, and how do you prevent it when both layout.tsx and page.tsx fetch async data?

### Answer
- A Request Waterfall occurs when a parent layout fetches data before the child page can start fetching, causing sequential delays. To prevent it:
    1. Wrap Layout Children in Suspense: Allow layout.tsx to render shell UI immediately while streaming in page.tsx as its data resolves.    
    2. Component-level Fetching: Move data fetching down to the specific UI components that require it rather than doing monolithic fetches in the top-level layout.
    3. Preloading / Request Deduping: Use React.cache() or fetch caching to initiate requests early without duplicating HTTP calls across the render tree.

---
### Question
- How do Parallel Routes (@slot) work in Next.js layouts, and why is default.js critical when using them?

### Answer
- 

---
### Question
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
### Question
- explain default.js

### Answer
- default.js: file to render as a fallback for unmatched slots during the initial load or full-page reload.

---
### Question
- What are possible mistake with parallel routes?

### Answer
- Possible mistakes
    - Thinking slots change URL (they don’t)
    - Forgetting default.js → random 404 on refresh
    - Expecting SSR-like full rerender (parallel routes preserve state)
    - Overusing → mental model becomes hard (this feature is complex)
    - Misunderstanding soft vs hard navigation (big source of bugs)

---
### Question
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

### Question
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