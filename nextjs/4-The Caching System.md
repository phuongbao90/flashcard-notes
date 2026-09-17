# The Caching System

### Question 30c80296-1b8f-456b-981e-5347d4db1ed9

- What are the four distinct caching layers in Next.js App Router, where does each live, and how do they interact during a request?

### Answer

- **Request Memoization**: React-level in-memory cache on the server. Deduplicates identical `fetch` calls (same URL and options) across a single React Server Component render tree pass; discarded after the render completes.
- **Data Cache**: Next.js server-side persistent key-value store (filesystem or custom cache handler). Persists `fetch` results across incoming requests, user sessions, and deployments until invalidated.
- **Full Route Cache**: Server-side persistent cache storing prerendered HTML markup and React Server Component (RSC) payloads for static routes generated at build time or during ISR.
- **Router Cache**: Client-side in-memory cache in the browser session. Stores RSC payloads of visited and prefetched route segments to make client-side transitions instantaneous without re-requesting the server.
- **Interaction flow**: A browser request checks the **Router Cache**; on a cache miss, it calls the server. The server checks the **Full Route Cache**; on a miss, it executes components, checking **Request Memoization** for in-flight render deduplication and **Data Cache** for persistent data.

- [More detail on Next.js Caching Architecture](https://nextjs.org/docs/app/building-your-application/caching)

---

### Question 91803591-8240-448b-99a2-3b1f25d375c6

- Which specific APIs and configuration flags control, opt out, or invalidate each of the four Next.js caching layers?

### Answer

- **Request Memoization**: Controlled via `fetch` (GET) automatic deduplication or `React.cache()` for non-fetch functions. Opt out using an `AbortController.signal`.
- **Data Cache**: Controlled via `fetch(url, { cache: 'force-cache' | 'no-store', next: { revalidate, tags } })` and `unstable_cache()`. Invalidated on-demand via `revalidateTag()` or `revalidatePath()`.
- **Full Route Cache**: Controlled via segment configs (`export const dynamic = 'force-static' | 'force-dynamic'`, `export const revalidate = N`). Invalidated via `revalidatePath()` or when underlying Data Cache dependencies revalidate.
- **Router Cache**: Controlled via `<Link prefetch={...}>`, `router.prefetch()`, or `experimental.staleTimes` in `next.config.js`. Invalidated via `router.refresh()`, Server Actions returning `revalidatePath()` / `revalidateTag()`, or cookie mutations.

```typescript
// Next.js caching API mapping summary:
// Layer 1: Request Memoization -> React.cache(), AbortSignal
// Layer 2: Data Cache         -> fetch({ cache, next: { tags, revalidate } }), unstable_cache
// Layer 3: Full Route Cache   -> export const dynamic / revalidate, revalidatePath()
// Layer 4: Router Cache       -> router.refresh(), experimental.staleTimes, Link prefetch
```

- [More detail on Caching APIs Overview](https://nextjs.org/docs/app/building-your-application/caching#overview)

---

### Question c1dd06b5-4535-4e0d-ab3c-9bc0de4ae52d

- How does Request Memoization mechanically deduplicate `fetch` requests within a single render pass, and what is its exact lifecycle?

### Answer

- **React-level mechanism**: React monkey-patches the global `fetch` API to inspect an internal per-request LRU/Map structure before dispatching any network call.
- **Key generation & matching**: The cache key is generated from the request URL and options (headers, method, body). Only HTTP **`GET`** requests qualify for automatic memoization.
- **Request sharing**: If Component A and deeply nested Component B both call `fetch('https://api.internal/user')` during the same render pass, only one network request fires. The second caller awaits the exact same promise.
- **Ephemeral lifecycle**: The cache exists strictly in server memory for the duration of a single incoming request's component tree execution. It does **not** persist across multiple HTTP requests or across different users.

- [More detail on Request Memoization](https://nextjs.org/docs/app/building-your-application/caching#request-memoization)

---

### Question ebcfc42a-a606-41d6-a1d5-9c0e3ccc19d5

- How do you implement request memoization for non-fetch data sources like database clients or ORMs using `React.cache`, and what are its constraints?

### Answer

- **`React.cache` wrapper**: Wraps arbitrary asynchronous or synchronous functions (e.g., Prisma, Drizzle, heavy math) to deduplicate execution within a single RSC render pass.
- **Identity-based cache keys**: Memoizes results based on argument shallow equality (`Object.is`). Passing new object literals or unstable references breaks memoization.
- **Render pass scope**: Like fetch request memoization, `React.cache` is ephemeral to the current request. It does **not** persist in the Data Cache and does not share state across distinct HTTP requests.

```typescript
import { cache } from 'react';
import { db } from '@/lib/db';

// Memoized across all Server Components for the duration of one request
export const getUser = cache(async (userId: string) => {
  return await db.user.findUnique({ where: { id: userId } });
});
```

- [More detail on React cache](https://react.dev/reference/react/cache)

---

### Question 6a8d8c0e-55da-4c3e-9797-d267c8111717

- How does the Next.js Data Cache mechanically persist data across requests and deployments, and how does it differ from the browser HTTP cache?

### Answer

- **Server-side persistence**: The Data Cache is a server-managed key-value store saved to disk (or shared object storage / Redis via custom cache handler). It persists across subsequent incoming requests, server restarts, and deployments.
- **HTTP cache vs Data Cache**: The browser HTTP cache is private to a single client device and governed by standard `Cache-Control` headers. The Data Cache is a **shared server-side cache** that serves identical fetched responses to multiple incoming requests across all clients.
- **Opt-in mechanics**: In Next.js 14, `fetch` entered the Data Cache by default (`cache: 'force-cache'`). In Next.js 15, `fetch` defaults to `cache: 'no-store'` unless explicitly tagged, configured with a revalidation time, or flagged with `cache: 'force-cache'`.

```typescript
// Persisted in the Data Cache across requests and deployments
const res = await fetch('https://api.example.com/products', {
  cache: 'force-cache',
  next: { tags: ['products'] },
});
```

- [More detail on Next.js Data Cache](https://nextjs.org/docs/app/building-your-application/caching#data-cache)

---

### Question 0f1810e7-0431-4f20-9b6d-9c0d76f885c6

- What mechanically triggers the Full Route Cache to statically prerender a route, and how does accessing dynamic data alter this behavior?

### Answer

- **Build-time compilation**: Next.js evaluates route segments during `next build`. If all data fetches are cached in the Data Cache and no dynamic functions are called, Next.js generates static HTML and an RSC payload, saving them in the **Full Route Cache**.
- **Dynamic function opt-out**: Invoking dynamic functions (`cookies()`, `headers()`, `searchParams`) or using uncached data fetches signals request-dependent state, causing Next.js to bypass the Full Route Cache and execute the segment dynamically on every HTTP request.
- **Segment override**: Setting `export const dynamic = 'force-static'` forces the route into the Full Route Cache, overriding dynamic functions (e.g., `cookies()` returns empty values).

```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-static'; // Forces Full Route Cache prerender
export const revalidate = 3600;        // Revalidates static route every hour via ISR
```

- [More detail on Full Route Cache](https://nextjs.org/docs/app/building-your-application/caching#full-route-cache)

---

### Question d9c7b66a-2d91-4ca3-aab9-5078091cf21e

- How does the Client Router Cache operate in memory, and how do Next.js 15's `staleTimes` settings control dynamic vs static segment retention?

### Answer

- **Client in-memory tree**: The Router Cache holds parsed RSC payload segments in browser memory for the duration of the page session, preventing network round-trips during back/forward and repeated navigations.
- **Prefetch duration**: The cache retention period is governed by `staleTimes`. When a user navigates within the stale window, the route is served instantly from browser memory.
- **Next.js 15 defaults**:
  - **Dynamic routes**: `staleTime = 0` (uncached by default; navigations always re-fetch the latest dynamic RSC payload).
  - **Static routes**: `staleTime = 5 minutes` (or 0 when `prefetch={false}`).
- **Custom configuration**: Tuned via `experimental.staleTimes` in `next.config.js`.

```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // Retain dynamic RSC payloads in client memory for 30s
      static: 180,  // Retain static route payloads for 3 minutes
    },
  },
};
export default nextConfig;
```

- [More detail on Client Router Cache staleTimes](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes)

---

### Question bdb2cda0-e4d7-4ab9-9681-1aca1bac71cf

- What fundamental caching defaults flipped between Next.js 14 and Next.js 15, and why is identifying your project's target version critical during code review?

### Answer

- **`fetch` request caching**: Next.js 14 treated `fetch` as `force-cache` by default. Next.js 15 flipped `fetch` to **`no-store` by default** (all unconfigured fetches are uncached).
- **Route Handlers**: Next.js 14 cached `GET` Route Handlers by default unless dynamic functions were used. Next.js 15 defaults `GET` Route Handlers to **uncached dynamic execution**.
- **Client Router Cache**: Next.js 14 cached dynamic routes in client browser memory for 30 seconds (`staleTimes.dynamic = 30`). Next.js 15 defaults dynamic routes to `0 seconds`.
- **Engineering impact**: Code written with Next.js 14 assumptions upgraded to Next.js 15 will cause unexpected database and downstream API load spikes due to missing caches. Conversely, assuming Next.js 15 defaults in Next.js 14 can lead to catastrophic data leakage if sensitive user fetches are accidentally cached server-wide.

- [More detail on Next.js 15 Caching Semantics Changes](https://nextjs.org/docs/app/building-your-application/upgrading/version-15#caching-semantics)

---

### Question fca11269-0de7-4177-903d-a8ae725b7066

- What is the mechanical difference and blast radius between `revalidateTag` and `revalidatePath` for on-demand cache invalidation?

### Answer

- **`revalidatePath` (Broad blast radius)**: Invalidates the **Full Route Cache** and all Data Cache entries associated with the specified URL path segment. If passed an entire layout (e.g., `revalidatePath('/', 'layout')`), it purges the cache for the entire application.
- **`revalidateTag` (Targeted granularity)**: Invalidates only the specific entries across the **Data Cache** tagged with that string (`next: { tags: ['tag-name'] }`), regardless of how many different pages or routes consume that data.
- **Execution context**: Both functions must be invoked from Server Actions or Route Handlers. They purge server caches immediately and instruct the client to refresh its active Router Cache.

```typescript
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function updateProduct(id: string) {
  await db.product.update({ where: { id }, data: { inStock: false } });
  
  // Surgical: Only invalidates fetch calls tagged with this product ID
  revalidateTag(`product-${id}`);
  
  // Coarse: Re-renders the entire catalog page and its layout
  revalidatePath('/catalog', 'page');
}
```

- [More detail on revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [More detail on revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)

---

### Question 117b7c27-bf76-4f44-bf79-e170b235e4c1

- How does `unstable_cache` cache non-fetch operations like raw database queries, and what are its required parameters and limitations?

### Answer

- **Purpose**: Persists the result of expensive non-fetch operations (Prisma, Drizzle, raw SQL, file I/O) directly into the Next.js server **Data Cache**.
- **Key signature**:
  - `fetcher`: Async function returning data.
  - `keyParts`: Array of strings identifying the operation. Must include dynamic variables (e.g., `[userId, locale]`) to prevent collision.
  - `options`: `{ revalidate?: number | false, tags?: string[] }`.
- **Serialization constraint**: Return values must be **JSON-serializable**. Complex class instances, recursive structures, or methods are lost or throw serialization errors.

```typescript
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

export const getCachedUser = (userId: string) =>
  unstable_cache(
    async () => db.user.findUnique({ where: { id: userId } }),
    ['user-cache-key', userId], // Key parts ensure per-user cache isolation
    { revalidate: 3600, tags: [`user-${userId}`] }
  )();
```

- [More detail on unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

---

### Question b3345e8a-314c-4a80-a94d-aedeca1113df

- What is the Next.js 15 `use cache` directive, and how do `cacheLife` and `cacheTag` define declarative caching profiles?

### Answer

- **`'use cache'` directive**: Next.js 15 directive placed at the file, component, or async function level. Replaces `unstable_cache` with a compiler-native mechanism that caches component outputs and function return values in the Data Cache.
- **`cacheLife` profiles**: Defines time-based lifecycle expiration (`stale`, `revalidate`, `expire`). Accepts predefined profile names (`'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`) or custom profiles configured in `next.config.js`.
- **`cacheTag` keys**: Assigns cache tags declaratively within the cached scope for on-demand invalidation via `revalidateTag()`.

```typescript
import { cacheLife, cacheTag } from 'next/cache';

export async function getProductCatalog() {
  'use cache';
  cacheLife('hours');          // Uses predefined revalidation profile
  cacheTag('product-catalog'); // Enables targeted invalidation

  return await db.product.findMany();
}
```

- [More detail on use cache directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [More detail on cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)

---

### Question 66974141-2559-40e2-b08c-de55e1331b7c

- Why do database clients and ORMs bypass the Data Cache by default, and how does `await connection()` prevent build-time prerender failures in Next.js 15?

### Answer

- **Socket vs HTTP**: Database clients (Prisma, Drizzle, `pg`) communicate over direct TCP/Unix sockets or custom database wire protocols, completely bypassing the patched global `fetch` API and the Data Cache.
- **Unintended static baking**: In Next.js, calling an ORM in a page without dynamic functions will execute the query **once at build time** and statically bake that data into the Full Route Cache HTML.
- **`await connection()`**: An explicit Next.js 15 server function that halts static prerendering at build time. It defers execution until an incoming client request arrives, ensuring dynamic ORM queries run per request without failing build-time prerender checks.

```typescript
import { connection } from 'next/server';
import { db } from '@/lib/db';

export default async function UserOrdersPage() {
  await connection(); // Halts prerender; guarantees request-time execution
  const orders = await db.order.findMany();
  return <OrderList orders={orders} />;
}
```

- [More detail on connection()](https://nextjs.org/docs/app/api-reference/functions/connection)

---

### Question 8ff7495a-7bda-4e29-b774-e191e3f85b33

- Debug Scenario: A user updates their profile via a Server Action and is redirected to the dashboard, but the dashboard displays stale data until a hard browser refresh. What is the root cause and fix?

### Answer

- **Root cause**: The database updated and the server Data Cache may have been updated, but the browser's **Client Router Cache** still holds the previously prefetched RSC payload in memory. Navigating back or redirecting reads from client memory instead of making a server request.
- **Fix 1 (Server Action)**: Call `revalidatePath('/dashboard')` or `revalidateTag('user-profile')` inside the Server Action. When the action resolves, Next.js automatically signals the client router to purge its cached RSC payload for that segment.
- **Fix 2 (Client Component)**: If mutating outside a Server Action (e.g., third-party API or client-side handler), invoke `router.refresh()` to force the browser to invalidate the Client Router Cache and fetch fresh RSC data from the server.

```typescript
// app/actions/update-profile.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  await db.user.update({ /* ... */ });
  
  // Crucial: Invalidates server cache AND clears client Router Cache for /dashboard
  revalidatePath('/dashboard');
}
```

- [More detail on Revalidating after Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#revalidating-data)

---

### Question 1ce77946-3175-4587-a362-21597cbd15b3

- Why does Incremental Static Regeneration (ISR) fail to synchronize across instances in a multi-replica self-hosted Next.js deployment, and how do you resolve it?

### Answer

- **Isolated file caches**: By default, Next.js writes Data Cache and Full Route Cache entries to the local filesystem (`.next/cache`). In Kubernetes or multi-container clusters, each pod has an isolated disk.
- **Cache jitter**: When Pod A performs ISR or handles `revalidateTag`, its local filesystem updates. Pod B and Pod C remain stale. Users hitting different pods via the load balancer experience oscillating stale and fresh data.
- **Resolution via `cacheHandler`**: Configure a custom distributed cache handler in `next.config.js` backed by Redis, Memcached, or an object store (S3/DynamoDB) so all pods share an atomic, synchronized cache state.
- **Memory tuning**: Tune `cacheMaxMemorySize: 0` or reduce in-memory size so container pods do not retain stale local memory caches that diverge from the shared store.

```javascript
// next.config.mjs
const nextConfig = {
  cacheHandler: process.env.NODE_ENV === 'production' 
    ? require.resolve('./cache-handler.js') 
    : undefined,
  cacheMaxMemorySize: 0, // Disable in-memory cache to force shared Redis reads
};
export default nextConfig;
```

- [More detail on Custom Next.js Cache Handler](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist#caching-and-isr)

---

### Question 313fad31-b199-4b2a-a5be-e73cb9cc2f0b

- What causes the "works in dev, stale in prod" divergence in Next.js, and how do you diagnose and enforce expected route caching behavior?

### Answer

- **Dev vs Prod divergence**: `next dev` disables the Full Route Cache and serves every page dynamically to ensure fast refresh and hot module replacement. In contrast, `next build && next start` aggressively evaluates routes and freezes static segments into HTML/RSC payloads.
- **Root cause**: A developer uses dynamic data (like an un-memoized DB query or date calculation) without a dynamic trigger (`cookies()`, `headers()`, or `connection()`). It re-runs on every refresh in dev, but gets frozen at build time in production.
- **Diagnostic enforcement**:
  - Check the terminal build output: verify whether routes display `○` (Static) or `ƒ` (Dynamic).
  - Add `export const dynamic = 'error'` to route segments intended to be static; the compiler throws a build error if any dynamic data source is accessed.
  - Run `next build && next start` locally before deploying to test production caching behavior.

```typescript
// app/api/live-rates/route.ts
// Forces the build to fail if dynamic data is accidentally evaluated as static
export const dynamic = 'error';
```

- [More detail on Dynamic Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic)
