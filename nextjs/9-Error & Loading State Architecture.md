# Error & Loading State Architecture

### Question 58d3bb48-36be-4862-b76d-a38406c66df8

- Why must `error.tsx` be a Client Component in the Next.js App Router?

### Answer

- Error boundaries are implemented with React's error-boundary mechanism (`getDerivedStateFromError` / `componentDidCatch`), which relies on **client-side state and lifecycle** — unavailable in Server Components.
- The fallback UI must render **even when the server render fails**; only a client component can guarantee the browser has the code needed to display it.
- Consequence: no `metadata` / `generateMetadata` exports in `error.tsx`; use the React `<title>` component if a title is needed.

```javascript
'use client' // required — error boundaries must be Client Components

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => console.error(error), [error])
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

- [More detail on error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [More detail on React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

### Question 879bc594-e4aa-46b1-b680-954422d8e201

- What does the `reset()` prop of `error.tsx` actually do, and when will it fail to recover the UI?

### Answer

- `reset()` **clears the error state and re-renders the error boundary's children**, attempting recovery without a full page reload.
- It succeeds for **transient errors** (network blip, temporarily stale data). If the underlying cause is deterministic (bad data, code bug), the re-render throws again and the fallback UI returns.
- Next.js 16.3 added a stable **`retry()`** prop that goes further: it **re-fetches and re-renders** the segment; `reset()` remains for re-rendering without re-fetching.
- The retry affordance should live in a "Try again" button — never auto-invoked in a loop.

- [More detail on error.js reset and retry](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [More detail on Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)

---

### Question e49b5c54-31bc-4950-9194-bcd70cc793f3

- Which files does a segment's `error.tsx` wrap, and why is this scope important when debugging layout errors?

### Answer

- `error.tsx` wraps the segment's **`loading.tsx`, `not-found.tsx`, `page.tsx`, and nested (child) `layout.tsx` files** in a React error boundary.
- It does **not** wrap the `layout.tsx` / `template.tsx` in its own segment — the boundary sits *inside* that layout, so same-segment layout errors **bubble up to the parent segment's error boundary**.
- Corollary: an error thrown in the **root layout** is caught only by `global-error.tsx`, because there is no parent segment.
- Re-thrown errors inside the `error` component itself also bubble to the parent boundary — useful for deliberate escalation.

- [More detail on error.js component hierarchy](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [More detail on Component Hierarchy](https://nextjs.org/docs/app/getting-started/project-structure#component-hierarchy)

---

### Question e5bd97ad-d16f-4e75-a3a5-61636541fcd2

- How does "nearest boundary" error isolation work in the App Router, and how do you exploit it for granular error UX?

### Answer

- Uncaught render errors **bubble up the segment tree until they hit the closest `error.tsx`**; only that subtree is replaced with the fallback, while layouts and sibling segments around it stay mounted and interactive.
- Placing `error.tsx` deep in the tree gives small blast radius (one widget shows fallback); placing it high (e.g., root of a dashboard section) catches everything below with a coarser fallback.
- Nesting boundaries per panel of a dashboard means **one failing widget degrades to its own fallback instead of blanking the whole page**.
- If no boundary exists anywhere, Next.js renders its default error page.

- [More detail on Nested Error Boundaries](https://nextjs.org/docs/app/getting-started/error-handling)
- [More detail on error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)

---

### Question 9fdc2b38-5873-4270-afb0-0d82687f32fd

- A dashboard uses parallel routes (`@analytics`, `@team` alongside the main page). How do you make one pane's failure not take down the others?

### Answer

- Each parallel-route slot has its **own file conventions**: add an `error.tsx` (and `loading.tsx`) **inside each slot folder** (`app/dashboard/@analytics/error.tsx`, etc.).
- An error thrown in one slot renders **that slot's fallback only**; the other slots and the shared layout keep rendering — pane-level isolation.
- Without a slot-level `error.tsx`, the error bubbles toward the segment's boundary and the **whole route's fallback renders**, defeating the point of parallel panes.
- Add `loading.tsx` per slot too, so each pane skeletons independently instead of blocking on the slowest one.

```
app/dashboard/
  layout.tsx        ← renders {analytics} {team} {children}
  page.tsx
  @analytics/
    error.tsx       ← isolates analytics failures
    loading.tsx
    page.tsx
  @team/
    error.tsx
    page.tsx
```

- [More detail on Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- [More detail on Error Boundaries](https://nextjs.org/docs/app/getting-started/error-handling)

---

### Question ddcffa06-f509-495b-ac5d-67ebaddf1757

- What are the two defining requirements of `global-error.tsx`, and when does it actually activate?

### Answer

- It activates **only when the root `layout.tsx` / `template.tsx` throws** — nothing else, because the root layout has no parent segment whose `error.tsx` could catch it.
- It **replaces the root layout while active**, so it must render its **own `<html>` and `<body>` tags** and re-import any global styles/fonts it needs.
- Like `error.tsx` it is a **Client Component** (`'use client'`), receives `{ error, reset }` (plus `retry()` in v16.3+), and supports no `metadata` export — use React's `<title>`.
- Regular segment errors are handled by nested `error.tsx` files; `global-error.tsx` is the last line of defense, not the primary handler.

```javascript
'use client'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

- [More detail on global-error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error)

---

### Question 340e66b4-b3bb-4c9c-9f9b-6a47f301c3d4

- What does `notFound()` from `next/navigation` do mechanically, and why is no `return` needed?

### Answer

- It **throws an internal `NEXT_HTTP_ERROR_FALLBACK;404` error** that terminates rendering of the route segment and propagates to the **nearest `not-found.tsx` boundary** (segment-level if present, else the root `app/not-found.tsx`, else Next's default 404).
- Its TypeScript return type is **`never`** — like throwing — so `return notFound()` is unnecessary and TypeScript narrows the value after the call.

```javascript
const user = await getUser(id)

if (!user) {
  notFound() // throws; execution stops here
}

// user is narrowed to non-null here
return <Profile user={user} />
```

- It also triggers a `<meta name="robots" content="noindex" />` injection so the 404 page isn't indexed. Callable in Server Components, Server Functions, and Route Handlers.

- [More detail on notFound](https://nextjs.org/docs/app/api-reference/functions/not-found)
- [More detail on not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)

---

### Question 1bc1c672-beb1-48d0-bf89-3fb82b0d3c50

- Your custom 404 UI never renders: `notFound()` was called inside a `try/catch`. Why?

### Answer

- `notFound()` works **by throwing**, so a surrounding `try/catch` **swallows the interrupt** and the not-found boundary never sees it.
- Fix: rethrow Next.js control-flow errors with `unstable_rethrow` so they pass through your `catch` before your handler logic runs.

```javascript
import { unstable_rethrow } from 'next/navigation'

try {
  await doWork()
} catch (err) {
  unstable_rethrow(err) // lets notFound()/redirect() through
  // ...now handle genuine errors
}
```

- Related trap: `notFound()` must run in the **render path** (a component, or a function it `await`s). Called in a fire-and-forget promise, it becomes an `unhandledRejection` and no 404 UI renders.

- [More detail on notFound caveats](https://nextjs.org/docs/app/api-reference/functions/not-found)
- [More detail on unstable_rethrow](https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow)

---

### Question 9e4311bd-5e88-46bd-8e6e-4919fe12b562

- Contrast the two 404 paths in the App Router: unmatched URLs vs. `notFound()` thrown for a missing resource in a dynamic segment.

### Answer

- **Unmatched URL** (no route matches at all): the **root `app/not-found.tsx`** renders (it doubles as the global unmatched-URL handler since v13.3), served with a real `404` status.
- **Missing resource in a matched dynamic segment** (e.g., `/posts/[slug]` where the slug doesn't exist): the page fetches data, finds nothing, and **throws via `notFound()`** — the nearest `not-found.tsx` boundary renders, letting you place contextual 404 UI right beside the route.

```javascript
// app/posts/[slug]/page.tsx
const post = await getPost(slug)
if (!post) notFound() // → nearest not-found.tsx
```

- For a pre-stream check the response is a real `404`; if the response has already started streaming, the status is `200` with a `noindex` meta tag instead.
- Put a `not-found.tsx` next to the dynamic segment for a contextual message; without one it falls back to the nearest parent, ending at the root boundary.

- [More detail on not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [More detail on notFound](https://nextjs.org/docs/app/api-reference/functions/not-found)

---

### Question 6ca46058-dbc6-433a-850a-6fe787e726af

- Why can a `notFound()` call during streaming produce a `200` response, and how do you guarantee a real `404` status code?

### Answer

- Once a Suspense fallback (e.g., `loading.tsx`) has flushed, **response headers are already sent** and the status can't change; the not-found UI streams in with a `200` plus `<meta name="robots" content="noindex">` so it's a "soft 404" that won't be indexed.
- For a real `404` (compliance/analytics), the existence check must happen **before the response streams** — e.g., in `proxy.ts` (`middleware`), which can rewrite missing slugs to a not-found route or produce the 404 response itself.
- The pattern "stream the shell, check existence inside `<Suspense>`" trades an exact status code for a fast, unblocked shell — a deliberate UX/SEO trade-off.
- Bots that can't execute JS still get correct metadata; crawlers may label soft 404s, but `noindex` prevents indexation.

- [More detail on Status Codes with streaming](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes)
- [More detail on notFound](https://nextjs.org/docs/app/api-reference/functions/not-found)

---

### Question 4df4e627-2f49-4b3f-9a75-2abed79ee31a

- How does `loading.tsx` create "instant" navigation states without you writing any Suspense code?

### Answer

- Next.js **automatically wraps the segment's `page.tsx`, `not-found.tsx`, and nested `layout.tsx` in a `<Suspense>` boundary** whose fallback is your `loading.tsx` — the file convention is just an auto-wired Suspense boundary.
- The fallback is **prefetched** with the route, so on navigation it shows **immediately** while server content streams in; the real content swaps in automatically when ready.
- Navigation stays **interruptible** — users can navigate away mid-load — and **shared layouts remain interactive** while the loading UI shows.
- It does **not** wrap the same segment's own `layout.tsx`/`template.tsx`/`error.tsx`, and shows no fallback for uncached data (e.g., `cookies()`, uncached `fetch`) accessed in that same layout — move such fetches to `page.tsx` or wrap them in their own `<Suspense>`.

- [More detail on loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [More detail on React Suspense](https://react.dev/reference/react/Suspense)

---

### Question 55537f78-560e-46df-9d81-5ace33fe658c

- Granular skeletons vs. one big page-level spinner: how do you structure `loading.tsx` files and manual `<Suspense>` for better UX?

### Answer

- One `loading.tsx` per meaningful **content region**, not per route: route-level skeletons keep the shared layout visible (nav, sidebar) while only the swapping segment shows its skeleton — already better than a full-page spinner.
- For **independent data within a page**, use manual `<Suspense>` around each data-fetching component so slow regions stream in independently instead of blocking on the slowest fetch.

```javascript
export default function Page() {
  return (
    <section>
      <Suspense fallback={<FeedSkeleton />}><PostFeed /></Suspense>
      <Suspense fallback={<WeatherSkeleton />}><Weather /></Suspense>
    </section>
  )
}
```

- Judgment call: granular boundaries = more perceived speed and partial readability, but more skeleton components to maintain and more layout-shift risk; a single segment spinner is fine for cheap, fast pages.
- Also note `loading.tsx` **covers navigation**, while manual `<Suspense>` covers **in-page streaming** — use both where each fits.

- [More detail on Streaming with Suspense](https://nextjs.org/docs/app/api-reference/file-conventions/loading#streaming-with-suspense)
- [More detail on Suspense](https://react.dev/reference/react/Suspense)

---

### Question f4eee78c-b7fc-4c2e-bbf6-da92aa019e4d

- What does an unhandled error look like to the client in production vs. development, and what is `error.digest` for?

### Answer

- **Production**: errors originating in Server Components surface to the client with a **generic message** (e.g., "An error occurred in the Server Components render") to avoid leaking stack traces, internals, or sensitive data.
- **Development**: the `Error` object is serialized with the original `message` for debugging convenience.
- `error.digest` is an **automatically generated hash** of the error; send it to support and **match it against server-side logs** to find the real stack trace — the operational counterpart to client-side fallback UI.
- Client Component errors keep their original `message` in both environments since they carry nothing server-sensitive.

- [More detail on error.digest and production behavior](https://nextjs.org/docs/app/api-reference/file-conventions/error#error)
- [More detail on Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)

---

### Question be2d43fa-8071-42a3-82af-b7c607c612d6

- You're architecting error UX for a large dashboard app. Where do you place boundaries, and what affordances does each level get?

### Answer

- **Map boundaries to failure domains users can reason about**: a fallback per dashboard panel (slot-level `error.tsx` with parallel routes), one per route section, one app-wide `error.tsx` as catch-all — each failure degrades the smallest region that makes sense.
- **Retry affordance where retry can actually help**: transient data fetch → "Try again" button calling `reset()`/`retry()`; deterministic bugs → actionable message + link home, since retrying a code bug just throws again.
- **`useEffect` reporting**: log `error` (with `digest`) to an error service from every boundary so fallback UI and telemetry ship together.
- **Root safety net**: `global-error.tsx` with its own `<html>`/`<body>` handles root-layout crashes; expected errors (validation, failed mutations) are *not* boundary material — model them as return values via `useActionState` instead.
- Guardrails: expected errors → returned state; unexpected errors → thrown → boundaries. Don't blur the two.

- [More detail on Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [More detail on error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error)
