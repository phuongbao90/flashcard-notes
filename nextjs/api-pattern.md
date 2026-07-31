# API pattern

### Question

- Discuss the API pattern for a Next.js application.

### Answer

- Having a container component that fetches data and handles errors is a good practice.
  - This container can then pass the data down to child components for rendering.
  ```ts
    // Container component
    const Container = async () => {
      try {
        const data = await fetchData();
        return <ChildComponent data={data} />;
      } catch (error) {
        return null; // for non-critical components, return null on error to avoid breaking the page
        // throw error; // for critical components, throw error to trigger error boundary
      }
    };

  ```

---

### Question

- explain cache invalidation in Next.js

### Answer

---

### Question

- when Page-level fetching is appropriate vs Component-level fetching

### Answer

- page-level fetching is appropriate when:
  - the data is needed for the entire page and can be fetched in a single request.
  - single source of truth for the data is at the page level.
  - parallel data fetching:
    - product detail & reviews can be fetched in parallel at the page level without network waterfall.
  - Next.js automatically dedupes fetch
    - if 2 components fetch the same data, Next.js will only make one request and share the result with both components.

---

### Question

- discuss Automatic fetch deduplication in Next.js

### Answer

- For Server component only
  - Next.js does not deduplicate fetches in client components
- Next.js wraps the native fetch on the server and dedupes identical requests:
  - same URL + options -> only one request is made, and the result is shared with all components that requested it.
  - work within a single request / render pass
  - shared across layouts, pages, components
  - only for GET requests (POST, PUT, DELETE are not deduped)
  - scoped per request (not global across requests) unless you enable caching

---

### Question

- How to enable fetch deduplication across requests in Next.js?

### Answer

---

### Question

- How to enable fetch deduplication for axios?

### Answer

- use cache from react

```ts
import { cache } from "react";
import axios from "axios";

// ✅ Wrap your Axios function in React's cache()
export const getProduct = cache(async (id: string) => {
  const response = await axios.get(`https://api.example.com/products/${id}`);
  return response.data;
});
```

---

### Question

- explain cache option in fetch in Next.js

### Answer

- 'force-cache':
  - default option
  - cache-first strategy
  - store response in data cache and return it for subsequent requests
    👉 Good for: static data
- 'no-store':
  - cache-bypass strategy
  - always fetch from the network and do not store the response in cache
    👉 Good for: dynamic data, auth, dashboards, user-specific data
- 'reload':
  - rarely used
  - Forces refetch, but still updates cache

---

### Question

- explain next.revalidate option in fetch in Next.js

### Answer

```ts
fetch(url, {
  cache: "force-cache",
  next: { revalidate: 60 },
});
```

- Enables time-based revalidation
- Cache is reused for 60 seconds
- After that:
  - First request → returns stale data
  - Background → fetches fresh data
  - Next requests → get updated data

---

### Question

- explain next.tags option in fetch in Next.js

### Answer

```ts
fetch(url, {
  next: { tags: ["posts"] },
});

revalidateTag("posts");
```

- Manually invalidates cache
- Instant refresh of data

- 👉 Best for: CMS, mutations
- typically used in conjunction with server actions to trigger cache invalidation when data changes.

```ts
'use server'

export async function createPost() {
  await db.post.create(...)
  revalidateTag('posts')
}
```

---

### Question

- revalidateTag vs updateTag in Next.js

### Answer

- revalidateTag:
  - Marks tagged cache as stale
  - Refetch happens on next render/request
  - Existing users may still see old data until re-render
  - ✅ Default choice

- updateTag:
  - Immediately delete tagged cache and refetch
  - Forces fresh fetch next time
  - ⚠️ Use sparingly

- 👉 For the user on the client, the core difference is:
  - There is effectively NO visible difference.

---

### Question

- discuss caching in Next.js 14

### Answer

- Request Memoization
  - Next.js automatically deduplicates identical fetch requests within a single render pass on the server.
  - If two components fetch the same data, Next.js will only make one request and share the result with both components.
- Data Cache
  - A server-side persistent cache for fetch() results used in the App Router
  - fetch defaults to force-cache, meaning it will cache responses in the Data Cache.
    - However, if the request is already marked as dynamic (e.g., due to cookies() or headers()), Next.js automatically disables caching
  - Shared across users and requests
  - Backed by disk/edge storage depending on the deployment platform

- When it is used
  - Only when the route is statically rendered (SSG)
  - Or when you explicitly opt in via caching options

- Default behavior
  - In a static route → fetch uses cache: 'force-cache' (cached)
  - In a dynamic route → behaves like no-store (not cached)

---

### Question

- discuss what changed with caching in Next.js 15

### Answer

1. fetch Requests Are Uncached by Default
   - { cache: 'no-store' } // default
2. GET Route Handlers Are Dynamic by Default
   - In Next.js 15: GET Route Handlers execute fresh on every request by default.
     - export const dynamic = 'force-static'; // opt-in to static caching
   - In Next.js 14: An app/api/route.ts with a GET method was statically cached at build time unless you used cookies(), headers(), or export const dynamic = 'force-dynamic'.
3. Client Router Cache (Page Segments)
   - In Next.js 14: When navigating client-side, dynamic page segments were cached in the browser for 30 seconds, and static segments for 5 minutes.
   - In Next.js 15: Page segments have a staleTime of 0 seconds by default. Clicking will re-fetch and render the latest server data instead of showing a 30-second stale snapshot.
4. Async Request APIs (Breaking Signature Change)
   - cookies(), headers(), and params() are now async functions that return promises. You must await them in your code.
5. Intro to use cache Directive
   - In Next.js 15: You can now use the "use cache" directive to cache any async function, not just fetch. This allows you to cache database queries, API calls, or any other async operation.

- 🟢 What Stayed the Same
  1.  Request Memoization Still Works:
  - If you call fetch('[https://api.com/user](https://api.com/user)') three times inside a single render pass across different components, React will still deduplicate it so it only fires once on the server.
  2.  Layout & Loading Caching:
  - Client-side navigation still preserves shared state and / loading.tsx fallbacks to ensure snappy UI transitions.
  3.  Browser Back/Forward Navigation:
  - The browser still uses local caching for Back/Forward clicks to preserve scroll restoration and instant UX.
  4.  On-Demand Revalidation APIs:
  - revalidatePath('/blog') and revalidateTag('posts') function the same way when invalidating persistent server caches.

---

### Question

- discuss what changed with caching in Next.js 16

### Answer

1. Component-Level Caching ('use cache')
   - At the top of a file, inside a component, or inside an async function.
   - Not limited to fetch, can be used for any async function.
   ```ts
   async function getCategories() {
     "use cache";
     return await db.categories.findMany();
   }
   ```
2. Upgraded Invalidation APIs (updateTag & revalidateTag)
   - revalidateTag() updated: Requires a cacheLife profile as a parameter (e.g., controlling stale-while-revalidate lifetimes explicitly).
   - updateTag() added: Introduced alongside revalidateTag() for more immediate, imperative cache state updates on the server.

3. Smarter Prefetching & Router Cache Rewrite
   - Auto Re-prefetching: Automatically re-prefetches links when underlying cached tags are invalidated.
   - Viewport Cancellation: If a user scrolls quickly past a list of components, in-flight prefetch requests are canceled automatically when they leave the viewport.
   - layout deduplication: Next.js now deduplicates fetches across layouts, pages, and components, reducing redundant network requests.
   ```
    app/
    ├─ layout.tsx        <-- Dashboard layout
    ├─ dashboard/
    │   ├─ users/page.tsx
    │   ├─ settings/page.tsx
    │   └─ reports/page.tsx

    when user hover:
    Users
    Settings
    Reports

    before nextjs 16: nextjs will fetch
    /dashboard/layout RSC data
    /dashboard/users page data


    /dashboard/layout RSC data
    /dashboard/settings page data


    /dashboard/layout RSC data
    /dashboard/reports page data

    with nextjs 16: nextjs will fetch
    /dashboard/layout RSC data
    /dashboard/users page data
    /dashboard/settings page data
    /dashboard/reports page data

   ```

- What Stayed the Same (from Next.js 15)
  - Dynamic by Default: Unwrapped fetch() calls and Route Handlers still default to { cache: 'no-store' } / dynamic.
  - Async Context: cookies(), headers(), and params remain asynchronous promises (await cookies()).
  - Request Memoization: React still deduplicates identical GET requests in a single render pass.

---

### Question

- explain Router Cache

### Answer

- client-side
- managed by Next.js router
- stores RSC payloads
- used for instant navigation
- populated by visiting routes or prefetching links
- separate from server caches

- What does "Router" mean here?
  - The router controls:
    - current URL
    - navigation
    - loading new pages
    - replacing the current React Server Component tree
    ```
    Current URL:
    /products

    User clicks on a link to /products/123
    The Router Cache stores data needed for that transition.
    ```
- What exactly is stored?
  - The React Server Component tree needed for the next route.
  - This includes:
    - the layout RSC payload
    - the page RSC payload
    - any data fetched by components in that route

```
app/products/page.tsx

RSC Payload

{
  type: "ProductPage",
  children: [
    Header,
    ProductList,
    ProductA,
    ProductB
  ]
}

Router Cache
│
└── Route Tree
    │
    ├── /products
    │     │
    │     ├── Layout segment
    │     │      └── RSC data
    │     │
    │     └── Page segment
    │            └── RSC data
    │
    └── Other visited/prefetched routes

```

---

### Question

- Why is it called "Router Cache" instead of "Page Cache"?

### Answer

- Because it stores the React Server Component tree needed for navigation, not just a page.

```
app/
├── layout.tsx
├── dashboard/
│    ├── users/page.tsx
│    └── settings/page.tsx

router tree:
Router Cache

dashboard
 |
 +-- layout
 |
 +-- users page
 |
 +-- settings page
```

- It understands the route hierarchy.
- This is why Next.js can reuse layouts.

- **Router Cache is NOT the same as browser cache**
  - browser cache:
    - HTTP cache
    - stores static assets (JS, CSS, images)
    - controlled by HTTP headers (cache-control, etag, last-modified)

  - router cache:
    - Next.js navigation data
    - /products RSC payload
    - /dashboard/settings RSC payload

---

### Question

- what is dynamic route in Next.js?

### Answer

- A route is dynamic when it must be rendered on every request, instead of being prebuilt and reused.

- What makes a route dynamic

1. Using request-specific APIs
   - cookies()
   - headers()

2. Using search params at runtime
3. Explicitly forcing dynamic
   `export const dynamic = 'force-dynamic'`
4. Disabling cache
   `fetch(url, { cache: 'no-store' })`

- What happens in a dynamic route
  - Rendering
    - Runs on every request
    - No Full Route Cache
    - HTML is generated each time
- Data fetching (this is where people mess up)
  - Dynamic route does NOT automatically mean no caching

---

### Question

- Does prefetching happen immediately when a link enters the viewport?

### Answer

- Not exactly. Prefetching is automatic, but it does not occur synchronously with rendering. Instead, Next.js uses a non-blocking, low-priority scheduling model.

- Accurate flow:
  - Initial Render
    - Server renders HTML.
    - Browser paints the page.
  - Hydration
    - React hydrates components, including `<Link>`.
  - Viewport Detection
    - An IntersectionObserver detects which `<Link>` elements are visible.
  - Low-Priority Scheduling
    - Prefetch tasks are scheduled with low priority.
    - The browser decides when to execute them (often soon after hydration, but not strictly “idle-only”).
  - Prefetch Execution
    - Requests are sent without blocking rendering or user interaction.

- Key clarification:
  - Prefetching is deferred and non-blocking, but not strictly tied to requestIdleCallback.
  - It may run shortly after hydration, depending on browser scheduling and available resources.

---

### Question

- prefetch in Link

### Answer

1. Default (prefetch not set)
   `<Link href="/dashboard" />`

- Behavior:
  - Automatically prefetches when the link enters the viewport
  - Requires client hydration first
  - Uses low-priority scheduling (non-blocking)

- What gets prefetched:
  - Static / cached routes
    - Full RSC payload
    - JS bundle
  - Dynamic / uncached routes
    - Partial data (up to nearest loading.js)
    - Layout shell only (no heavy data)

- Trigger timing:
  - After hydration
  - When visible via IntersectionObserver
  - Executed when browser schedules it (not strictly idle)

2. Disabled (prefetch={false})
   - data is fetched only when the user clicks the link

3. Intent-based (prefetch="intent")
   - Prefetches only when user shows intent
     - Hover (desktop)
     - Focus (keyboard navigation)

4. Manual Prefetch

- router.prefetch("/dashboard")

---

### Question

- discuss runtime dynamic import in Next.js

  ```ts
  async function getCookieStore() {
    const { cookies } = await import("next/headers");
    return cookies();
  }
  ```

### Answer

- the module is loaded only when this function is executed.

1. Lazy loads the module (execution-time import)

- The module is not loaded at build time
- It is loaded:
  - When getCookieStore() is called
  - On the server at runtime

- This is different from normal imports, which are eager and static

---

### Question

- explain cookie from next/headers in Next.js
  - what is the significance when using cookies() in a server component?

### Answer

- run on the server
- cookies() parses that incoming header into a type-safe RequestCookies object on the server.

- read & write permissions:
  - RSC: read-only
  - Route Handler: read & write
  - Server Action: read & write
  - Middleware: not support cookies() (use request.cookies or response.cookies instead)

- using cookies() in a server component makes the **route dynamic** by default, because the cookie values can change per request. This means that Next.js will opts that page out of Static Site Generation (SSG) / Build-Time Caching. -> Server-Side Rendering (SSR) per request.

---

### Question

- When to use dynamic module import in Next.js?
  `const { cookies } = await import("next/headers");`

### Answer

- Is this file STRICTLY Server-Side? (Page, Server Component, Server Action, Route Handler)
  - YES ──► Use Top-Level Import: import { cookies } from "next/headers"
  - NO ──► Is it an Isomorphic / Shared Utility used by both Server & Client?
    - YES ──► Use Dynamic Import: await import("next/headers")
    - NO ──► You have a code design smell. Split your server code from client code.

---

### Question

- How Next.js handles server action?
  - are they private?

### Answer

- Next.js compiles every Server Action into a publicly accessible HTTP POST API endpoint.

- When the user clicks that button, your browser sends an HTTP request over the network:

```
POST /
x-action-id: c90a887b41e...
Content-Type: application/json

["user_123"]
```

- An attacker can simply copy that request and run it in Terminal via curl or Postman without ever using your UI:

```
# An attacker calling your Server Action directly from terminal!
curl -X POST https://your-site.com/ \
  -H "x-action-id: c90a887b41e..." \
  -d '["victim_user_999"]'
```

- => 1. Security Misconception: "Server Actions are Private Internal Functions"

---

### Question

- Argument limitations for server actions in Next.js

### Answer

- must be serializable (JSON-safe): JSON-like data, FormData, Date, BigInt, Map, Set, ArrayBuffer
  - function, class instance, DOM element, or any non-serializable object will throw an error

---

### Question

- how server action handles unhandled exception error in Next.js

### Answer

- in Production: Next.js obfuscates the error message in production for security (digest: ...), leaving the client with no context.
  - Wrap server action logic in try...catch and return structured result objects { ok: false, error: "Custom message" }.

---

### Question

- server action vs server side function in Next.js

### Answer

- server side function:
  - can be called from server component, route handler, or server action
  - cannot be called from client component
  - does not require directive "use server"
- server action:
  - can be called from client component, server component, or route handler
  - requires directive "use server"
  - a server endpoint is generated for each server action, which can be called from the client via fetch() or form submission.

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
