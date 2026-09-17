### Question 64b90e15-ff4a-4b7e-bd0c-a022db220f56

- Why does client component state persist when a user navigates between sibling pages that share a layout in the App Router?

### Answer

- App Router wraps each segment in a **nested layout tree**; navigation only swaps the changed segments, the shared **layout subtree is not remounted**.
- Because React sees the same component tree for the layout, **state, scroll position, and focus** in layout and shared components are **preserved** across child navigations.
- To intentionally reset state on every navigation, use **`template.js`** or pass a changing **`key`**.

- [More detail on Pages and Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [More detail on Layout file convention](https://nextjs.org/docs/app/api-reference/file-conventions/layout)

---

### Question 8f8bd096-90b0-4853-849b-ff083f46d5ca

- What does `template.js` do differently from `layout.js`, and when would you choose it?

### Answer

- **`template.js`** renders its children in a **new component instance on each navigation** — children remount, so local state is discarded and `useEffect` re-runs.
- **`layout.js`** persists across navigations and preserves state.
- Use `template.js` for per-pageview behavior: **enter/exit animations, page-view logging, anything that must run once per visit**; use `layout.js` for persistent UI like nav bars.

```javascript
// app/template.tsx — runs on every navigation
export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    analytics.pageview(); // fires per pageview, not per mount of the layout
  }, []);
  return <div>{children}</div>;
}
```

- [More detail on Template file convention](https://nextjs.org/docs/app/api-reference/file-conventions/template)

---

### Question 7ea3d306-d020-421f-b699-dbd87115cbfa

- What are the requirements for a root layout, and what breaks if it doesn't define `<html>` and `<body>`?

### Answer

- `app/layout.js` is **mandatory** and **must define `<html>` and `<body>`** — all other layouts are nested inside it and cannot add or replace these tags.
- Removing them breaks the document structure Next.js expects; the dev server raises a **missing root layout tags error** until they are restored.
- Escape hatch: with **multiple root layouts** via top-level route groups, each group's layout is itself a root layout and each must define `<html>`/`<body>`.

- [More detail on Layout file convention](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
- [More detail on Pages and Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)

---

### Question 18eab41c-925f-4c5f-a721-75f3b853ebf6

- How do `error.js` and `global-error.js` differ in what they catch and what they must render?

### Answer

- **`error.js`** catches errors in its **sibling segment and all children below it** — but not errors thrown in the layout at the same level or above (those bubble to the next boundary up).
- Both are **client components** and receive `error` and `reset` props.
- **`global-error.js`** catches errors thrown in the **root layout itself**; because it replaces the root layout, it **must define its own `<html>` and `<body>`** tags.

```javascript
// app/global-error.tsx
'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

- [More detail on Error file convention](https://nextjs.org/docs/app/api-reference/file-conventions/error)

---

### Question 04da8bd8-1293-48fc-b023-b644f84df660

- What triggers `not-found.js` to render, and which one wins when several exist up the tree?

### Answer

- Two triggers: **`notFound()`** thrown from a route in a segment subtree, and **unmatched URLs** (404) — unmatched URLs render the **root `app/not-found.js`**.
- For `notFound()`, the **nearest enclosing `not-found.js` boundary** in the segment tree wins, letting branches customize their 404 UI.
- Common pattern: pair `app/not-found.js` with a **catch-all route** (`app/[...rest]/page.js`) to render the boundary for any unmatched path.

- [More detail on Not Found file convention](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)

---

### Question eabe0c1b-0cb8-4e1c-9340-a46e83c4bc30

- What does `loading.js` do mechanically when a user navigates to a slow segment?

### Answer

- `loading.js` wraps the segment in a **React `<Suspense>` boundary** automatically created by Next.js.
- On navigation, the **loading UI renders instantly** while the segment's server components and data fetches stream in; real content replaces it when ready.
- Each segment can have its own `loading.js`, so **spinner granularity follows the segment tree** — coarser layouts stream once, nested segments stream independently.

- [More detail on Loading file convention](https://nextjs.org/docs/app/api-reference/file-conventions/loading)

---

### Question eb565fbb-c9b3-4b80-bf5f-0027b1dddaeb

- Given `app/(marketing)/about/page.js` and `app/(shop)/products/page.js`, what are the resulting URLs, and why structure the app this way?

### Answer

- **`(folder)` is a route group** — it organizes files without affecting the URL: `/about` and `/products`.
- Purpose: apply **per-branch layouts, error boundaries, and loading states** (marketing shell vs shop shell) while keeping flat, clean URLs.
- Caveat: two groups resolving to the **same URL path** is a conflict and produces a build error.

- [More detail on Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

### Question db6536a0-6b54-4b62-99ce-f73a6b219f96

- What do you give up by splitting a site into multiple root layouts with top-level route groups, e.g. `app/(marketing)/layout.js` and `app/(shop)/layout.js` each with their own `<html>/<body>`?

### Answer

- Each group gets an **independent root layout** (its own `<html>`, `<body>`, fonts, providers) — no shared shell between them.
- **Navigating between root layouts triggers a full page load** instead of a client-side transition, and **no state or context is shared** across groups.
- The top-level `app/layout.js` becomes optional; typical use is separating a marketing site from an app shell with zero shared UI.

- [More detail on Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

### Question a707813d-1d85-455e-9fa8-51e340c7a2ba

- How do parallel routes (`@slot`) let a dashboard stream multiple panes independently?

### Answer

- A folder prefixed with **`@`** is a slot; the parent layout receives each slot as a **prop alongside `children`** and composes them into one view.

```javascript
// app/dashboard/layout.tsx
export default function Layout({
  children,
  analytics,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <>
      <div>{children}</div>
      <div>{analytics}</div>
    </>
  );
}
```

- Slots are **not part of the URL** — `/dashboard` renders `page.js` plus every slot's `page.js` — and each slot keeps its **own `loading.js` and `error.js`**, so slow or failing panes stream/fail **independently** without blocking the rest.
- Soft navigation keeps the current slot view even if the slot's route doesn't match the new URL, enabling **persistent dashboards** where only some panes change.

- [More detail on Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)

---

### Question 8c045bb4-bf93-4c83-9f17-a1e4cbc9824b

- A dashboard with a `@analytics` slot returns 404 only on hard navigation (direct load / refresh) but works on client-side navigation. Why?

### Answer

- On **soft navigation**, Next.js does a **partial render**: unmatched slots keep their existing view, so no match is required.
- On **hard navigation** (full page load), every slot must resolve: if the slot has no matching route for the URL, Next.js falls back to **`default.js`** in that slot folder.
- **Missing `default.js`** → 404. Fix by adding `app/dashboard/@analytics/default.js` to render a placeholder or empty pane.

- [More detail on Default file convention](https://nextjs.org/docs/app/api-reference/file-conventions/default)
- [More detail on Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)

---

### Question cfd2880c-40da-4453-984e-1e5247b0598f

- How does the intercepting route pattern implement "click a photo → modal over the feed, but opening the shared URL in a new tab → full photo page"?

### Answer

- Declare an **intercepting route** inside the feed segment, e.g. `app/feed/(..)photo/[id]/page.js`, alongside the real route `app/photo/[id]/page.js`.
- **Client-side navigation** from `/feed` to `/photo/123` is intercepted and renders the **modal version nested under the feed layout**; a **hard navigation** (new tab, refresh, shared link) skips interception and renders the **full `/photo/[id]` page**.
- Conventions: **`(.)`** intercept same level, **`(..)`** one level up, **`(..)(..)`** two levels, **`(...)`** from root — mirrored to the filesystem, not the URL.
- Commonly combined with **parallel routes** (`@modal` slot) so the modal has its own loading/error boundaries and persists during soft navigation.

- [More detail on Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)

---

### Question 459fbd49-a5aa-49fb-afb3-97b423df2f3b

- You put `setting-button.tsx` inside `app/dashboard/`. Is it publicly routable, and how do you opt a whole folder out of routing?

### Answer

- App Router files are **colocated and private by default**: only **`page.js`** makes a segment a public route; `setting-button.tsx` is just importable source, never a URL.
- Prefix a folder with **`_`** (e.g. `app/dashboard/_lib/`) to opt the **entire subtree out of routing** — useful for colocated components, tests, and utilities.
- Summary of folder prefixes: `_folder` private (no routing), `(folder)` route group (routing, no URL segment), `@folder` slot, `.` `..` `...` interception segments.

- [More detail on Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)

---

### Question 9b45dd58-d9cd-4c40-99de-121842046afa

- A page-view counter placed in `layout.js` with `useEffect` only fires once per app session instead of per navigation. What's the minimal fix?

### Answer

- The layout **persists across navigations** — its `useEffect` never re-runs because the component isn't remounted.
- Rename it to **`template.js`**: templates render a **new instance on each navigation**, so `useEffect` fires **once per pageview**.
- No other change needed; `template.js` receives the same `children` prop and sits between layout and page.

- [More detail on Template file convention](https://nextjs.org/docs/app/api-reference/file-conventions/template)
