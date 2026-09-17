# Caching, State & Data Leakage

### Question f429a1b1-6a3f-42cb-b1b7-e17f0a990562

- Why is caching user-specific data in the Next.js Data Cache, Full Route Cache, or ISR considered a critical security vulnerability?

### Answer

- **Cross-user cache leakage**: Next.js Data Cache and Full Route Cache are **shared global caches** across all incoming requests and users.
- **Accidental tenant exposure**: If a route or fetch call containing personalized data (e.g., billing details, private messages) is cached, subsequent requests from unrelated users will receive the cached response of the first user.
- **Mandatory `no-store`**: Any route handler, Server Component query, or fetch call executing within an authenticated context must enforce `{ cache: 'no-store' }` or run dynamically.

```typescript
// ❌ Catastrophic: User-specific data cached globally for 60 seconds
const res = await fetch('https://api.internal/user/profile', {
  headers: { Authorization: `Bearer ${token}` },
  next: { revalidate: 60 }
});

// ✅ Safe: Prevents caching authenticated responses in shared Data Cache
const res = await fetch('https://api.internal/user/profile', {
  headers: { Authorization: `Bearer ${token}` },
  cache: 'no-store'
});
```

- [More detail on Next.js Caching Architecture](https://nextjs.org/docs/app/building-your-application/caching#data-cache)

---

### Question 719266eb-bc46-4cb4-8eb1-7c9ef633f81e

- How did default caching behavior change between Next.js 14 and Next.js 15, and what security risk does this introduce when maintaining legacy codebases?

### Answer

- **Next.js 14 aggressive caching**: Next.js 14 cached `fetch` requests (`force-cache`) and GET Route Handlers by default; developers had to explicitly opt out using `cache: 'no-store'`.
- **Next.js 15 secure default**: Next.js 15 changed the default `fetch` behavior to `no-store` and made GET Route Handlers unmemoized by default.
- **Migration & legacy audit risk**: If an older Next.js 14 codebase assumed `fetch` calls were dynamic without adding explicit options, or if a team migrates code without auditing fetch configs, assumptions about caching boundaries can result in either unintended cache poisoning or performance degradation.

- [More detail on Next.js 15 Caching Improvements](https://nextjs.org/blog/next-15#caching-updates)

---

### Question ca10fcf7-b248-4355-9ca0-7e8c078aeaf2

- How do Dynamic Rendering Triggers (`cookies()`, `headers()`, `searchParams`) impact Next.js route caching, and how should they be leveraged for auth-gated routes?

### Answer

- **Bypassing Full Route Cache**: Invocations of dynamic functions such as `cookies()` or `headers()` from `next/headers` signal to the compiler that the response depends on incoming request state, opting the segment out of static prerendering into **Dynamic Rendering**.
- **Deliberate auth gating**: Calling `cookies()` or `headers()` inside a root layout or page ensures Next.js evaluates authorization on every single request rather than serving a pre-built static HTML/Flight artifact.
- **Route segment enforcement**: To guarantee a route is never statically generated regardless of component code changes, explicitly set `export const dynamic = 'force-dynamic'`.

```typescript
// app/dashboard/layout.tsx
import { cookies } from 'next/headers';

// Explicit guarantee that this route tree is dynamically evaluated per request
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  // Route is evaluated per request; never cached in Full Route Cache
  return <>{children}</>;
}
```

- [More detail on Next.js Dynamic Functions](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-functions)

---

### Question 871aef42-3cae-4f32-8ea8-aa92c57803a1

- Why is Incremental Static Regeneration (ISR) an anti-pattern for pages displaying user-specific state, and what is the proper architectural pattern?

### Answer

- **ISR is request-agnostic**: `revalidate` generates static HTML and Flight data at build time or periodically in the background based on a timer, **without access to incoming request cookies or headers**.
- **Personalization failure**: If personalized content is attempted in ISR, either the page shows stale data from whichever user triggered the background regeneration, or it crashes attempting to read user cookies.
- **Architectural pattern**: Render the shared shell statically (or cache the public data), and fetch or render personalized user components dynamically using client-side data fetching or dynamic Suspense streaming boundaries.

```tsx
// app/blog/[slug]/page.tsx
export const revalidate = 3600; // Static ISR shell for public post

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <article>
      <PublicArticleContent slug={params.slug} />
      {/* Dynamic personal interaction streamed or fetched per user */}
      <Suspense fallback={<CommentsSkeleton />}>
        <UserCommentsList slug={params.slug} />
      </Suspense>
    </article>
  );
}
```

- [More detail on Incremental Static Regeneration (ISR)](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)

---

### Question 4ba81f4a-8ff4-4b53-b092-2616a2cba723

- How does cache poisoning occur when intermediate CDNs or reverse proxies cache responses that vary by unkeyed HTTP headers, and how does the `Vary` header resolve this?

### Answer

- **Unkeyed cache collision**: If a server responds differently based on headers (e.g., `Accept-Language`, `Authorization`, `X-Tenant-ID`) but the CDN cache key only includes the URL path, the first caller's variant is cached and served to all subsequent callers.
- **The `Vary` header contract**: Sending `Vary: Accept-Language, Cookie` instructs intermediate caches and CDNs to include those header values in the cache lookup key.
- **Caution with `Vary: Cookie`**: Setting `Vary: Cookie` on public CDNs can cause cache thrashing (since cookies like Google Analytics vary per user), but omitting it on cookie-dependent responses causes severe data leakage; authenticated routes should use `Cache-Control: private, no-store`.

```typescript
// Route Handler varying response by tenant header
export async function GET(request: Request) {
  const tenant = request.headers.get('X-Tenant-ID') ?? 'default';
  const data = await getTenantConfig(tenant);

  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Vary': 'X-Tenant-ID',
    },
  });
}
```

- [More detail on MDN Vary Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)

---

### Question 98be6041-3da6-4446-aa43-d8c9cf016ce6

- Why must reverse proxies and CDNs be strictly configured to never cache responses containing a `Set-Cookie` header?

### Answer

- **Session hijacking hazard**: If an origin server returns a `Set-Cookie: session=xyz` header (e.g., on login or session rotation) and a CDN caches the full HTTP response, the CDN will distribute that exact session cookie to every other user requesting that URL.
- **Mass account takeover**: Subsequent anonymous visitors receive the victim's session cookie and automatically authenticate as the victim.
- **Edge stripping / cache prevention**: CDNs (Cloudflare, Fastly, CloudFront) must be configured with rules: *Never cache responses with `Set-Cookie`*, or automatically strip `Set-Cookie` from cached responses before edge storage.

- [More detail on RFC 7234 Caching and Set-Cookie](https://datatracker.ietf.org/doc/html/rfc7234#section-8)

---

### Question 519d3f11-739c-48be-8fca-443b71bf3150

- What is the Next.js Client-Side Router Cache, and why does it cause sensitive authenticated pages to persist in browser memory even after a user logs out?

### Answer

- **In-memory Flight payload caching**: Next.js App Router caches visited and prefetched RSC Flight payloads in the browser's temporary JavaScript memory (Router Cache) to provide instant soft navigations.
- **Logout persistence**: When a user clicks "Log Out", clearing backend session cookies does **not** automatically purge previously cached RSC payloads stored in the client JavaScript memory for that browser session.
- **Shared terminal risk**: If another person clicks "Back" or navigates to `/dashboard` in the same browser tab without a hard reload, Next.js serves the cached route from memory without hitting the network.

- [More detail on Next.js Client-Side Router Cache](https://nextjs.org/docs/app/building-your-application/caching#client-side-router-cache)

---

### Question 1195aa02-ca52-47ef-b633-85b2e3cc3681

- How should a robust sign-out flow be implemented in Next.js to eliminate Router Cache and memory-persisted data leaks?

### Answer

- **Invalidate server session**: Send an authenticated POST request to invalidate the server session record and clear cookies with `Max-Age=0`.
- **Purge client router cache**: Call `router.refresh()` to invalidate the Next.js Client Router Cache.
- **Enforce full page reload**: Execute a hard navigation via `window.location.href = '/login'` instead of `router.push('/login')` to completely dump client-side memory, JavaScript state, and DOM trees.

```typescript
'use client';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh(); // Invalidates Next.js router cache
    window.location.href = '/login'; // Hard reload destroys browser JS memory state
  }

  return <button onClick={handleLogout}>Log Out</button>;
}
```

- [More detail on Next.js router.refresh](https://nextjs.org/docs/app/api-reference/functions/use-router#userouter)

---

### Question 6140fbcd-e435-4302-8610-cba068f89531

- How does the Browser Back/Forward Cache (bfcache) expose authenticated screens after logout, and how do HTTP headers prevent this?

### Answer

- **Complete page snapshot**: The **bfcache** stores a frozen snapshot of the entire DOM, JavaScript execution environment, and layout state in browser memory to enable instantaneous back/forward navigation.
- **Post-logout replay**: Clicking the browser "Back" button after logout immediately restores the protected dashboard from the bfcache without issuing an HTTP request or re-evaluating authentication tokens.
- **Mitigation with `no-store`**: Setting `Cache-Control: no-store` on HTML responses instructs browsers not to store the document in the bfcache (or to immediately evict it), forcing the browser to send a new network request when navigating back.

```http
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

- [More detail on MDN Back/forward cache](https://web.dev/articles/bfcache)
- [More detail on MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

---

### Question 27be30f5-da25-4c07-a365-1d6ef26e5b4b

- What is the difference between React's `cache()` and the Next.js `Data Cache`, and why is this distinction critical for preventing multi-tenant data leaks?

### Answer

- **React `cache()` (Request Scope)**: Memoizes data purely in server process memory for the **duration of a single HTTP request**; destroyed as soon as the request ends; completely isolated between users.
- **Next.js `Data Cache` (Cross-Request Scope)**: Persists fetch results across **multiple requests, sessions, and deployments** on disk or shared key-value stores (e.g., Redis); shared across all users.
- **Leak hazard**: Using Data Cache mechanisms (`unstable_cache`, `fetch` with `revalidate`) for user-specific data leaks information across sessions, while `React.cache()` is safe for deduplicating queries within an authenticated request.

- [More detail on Next.js Caching Overview](https://nextjs.org/docs/app/building-your-application/caching)

---

### Question d38cfb4a-a630-4be6-8e1c-7ce9fa08bc63

- Why does accessing `searchParams` inside a page component trigger dynamic rendering, while reading search params in a client component via `useSearchParams()` does not?

### Answer

- **Server page boundary**: `searchParams` passed as props to a Server Component page depends directly on the request URL query string; because query strings are unpredictable at build time, Next.js marks the entire page route as **dynamically rendered at request time**.
- **Client component isolation**: Using `useSearchParams()` inside a Client Component wrapped in `<Suspense>` allows the server to statically generate or cache the parent layout and page shell, streaming the client component dynamically or hydrating it on the client.
- **Security implication**: Wrapping search-dependent components in Suspense avoids forcing unintended dynamic re-execution on static segments, while ensuring query params are not assumed static during server builds.

```tsx
// app/search/page.tsx
import { Suspense } from 'react';
import SearchResultsClient from './SearchResultsClient';

export default function SearchPage() {
  return (
    <div>
      <h1>Search Catalog</h1>
      {/* Shell is statically prerendered; client param reading is isolated */}
      <Suspense fallback={<p>Loading results...</p>}>
        <SearchResultsClient />
      </Suspense>
    </div>
  );
}
```

- [More detail on Next.js useSearchParams and Suspense](https://nextjs.org/docs/app/api-reference/functions/use-search-params#behavior)
