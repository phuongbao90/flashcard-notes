# Routing & Navigation Mechanics

### Question a6d24aee-55ae-40b7-b720-36a2e81d2e0f

- How does Next.js `<Link>` prefetching mechanically differ between static and dynamic route segments?

### Answer

- **Static routes (`prefetch={null}` or `true`)**: The client prefetches and caches the complete React Server Component (RSC) payload and component JavaScript bundle for the destination route in the Client-side Router Cache.
- **Dynamic routes (`prefetch={null}` default)**: The client prefetches down to the nearest `loading.tsx` boundary (the shared layout and suspense fallback), deliberately skipping dynamic page data and uncached server queries to avoid speculative compute costs.
- **Explicit full prefetch (`prefetch={true}`)**: Forces Next.js to prefetch the full RSC payload for dynamic routes regardless of loading boundaries, caching it in the router cache.

- [More detail on Link Component Prefetching](https://nextjs.org/docs/app/api-reference/components/link#prefetch)

---

### Question c2dd9af9-7b21-43b1-8fa8-397f385fbf3c

- Under what network and runtime conditions does Next.js automatically suppress or adapt `<Link>` prefetching?

### Answer

- **Network throttling & Data Saver**: Prefetching is automatically disabled if `navigator.connection.saveData` is `true` or if the effective connection type is `2g`.
- **Environment boundary**: Viewport-based prefetching via `IntersectionObserver` only executes in production builds (`next start`); in local development (`next dev`), prefetching executes only on hover.
- **Viewport vs hover triggers**: By default, links prefetch when entering the viewport; if a link has not entered the viewport yet, hovering over it triggers prefetch immediately.

- [More detail on Next.js Prefetching Behavior](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching)

---

### Question b5daea03-82ef-4daa-9872-1b6e9efc3fd1

- What is the complete sequential trace of events that occurs when a user clicks a `<Link>` in the App Router?

### Answer

- **1. Event interception & cache check**: The client router intercepts the click event, prevents full browser navigation, and inspects the in-memory Client-side Router Cache for the target route's RSC payload.
- **2. RSC payload request**: On a cache miss or partial prefetch, the client dispatches an HTTP request with an `RSC: 1` header and the current route tree encoded inside `Next-Router-State-Tree`.
- **3. Server differential render**: The server evaluates the requested segment against the received router state tree, rendering only the changed subtrees into a compact React Flight stream.
- **4. Shared layout reconciliation**: The client React runtime reconciles the Flight stream, keeping existing shared layout component instances mounted and retaining their local client state, DOM nodes, and focus.
- **5. Stream consumption & cache commit**: The client router updates its in-memory cache with the streamed segments and applies the update inside a Concurrent React transition (`startTransition`), updating the URL and scroll position.

- [More detail on Next.js Linking and Navigating](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#how-routing-and-navigation-works)

---

### Question 95b94923-7589-4975-9521-74417a1395ee

- Why does the App Router preserve client component state in shared layouts during child route navigation, and how can you force a layout to re-instantiate?

### Answer

- **Subtree preservation**: The router diffs the route hierarchy between current and target paths; unchanged ancestor layouts are never unmounted or re-rendered, preserving internal `useState`, DOM node references, and scroll positions.
- **Bandwidth & reconciliation optimization**: The server only generates and transmits the differential RSC payload for the modified child segments, avoiding redundant tree re-rendering.
- **Forcing remounts with `template.tsx`**: Replace `layout.tsx` with `template.tsx` when a fresh instance is required on every navigation; templates mount a new component instance and reset client state on every route change.

- [More detail on Next.js Layouts and Templates](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#templates)

---

### Question eea6f467-f448-4faf-96ee-7e7b8e5f2f18

- How does `useRouter` in the App Router differ mechanically and architecturally from `useRouter` in the Pages Router?

### Answer

- **Package decoupling**: App Router requires `next/navigation`; Pages Router requires `next/router`. Calling `useRouter` from `next/router` inside an App Router component throws an error.
- **Action-only API**: App Router's `useRouter` only exposes navigation methods (`push()`, `replace()`, `refresh()`, `back()`, `forward()`, `prefetch()`).
- **Separation of query & path hooks**: Pathname and search parameters are decoupled into specialized hooks: `usePathname()`, `useSearchParams()`, and `useParams()`.
- **No router events**: The App Router removes router lifecycle event listeners (`router.events.on`); navigation listening is achieved via `usePathname()` and `useSearchParams()` side effects.

- [More detail on useRouter Hook](https://nextjs.org/docs/app/api-reference/functions/use-router)

---

### Question 94dcb03f-d08a-47e0-bc8a-ca04fd2f3441

- What occurs under the hood when `router.refresh()` is invoked, and what happens to active client state?

### Answer

- **Server-side re-render**: Next.js dispatches a network request to re-execute Server Components for the current route and generate an updated RSC payload from the server.
- **Client state retention**: React applies the refreshed RSC payload without unmounting Client Components; existing `useState`, controlled form inputs, and browser scroll position are preserved.
- **Router cache update**: The in-memory Client-side Router Cache entry for the current route is overwritten with the fresh server response.
- **No hard reload**: Unlike `window.location.reload()`, JavaScript bundles are not re-evaluated and client-side memory is not wiped.

- [More detail on router.refresh](https://nextjs.org/docs/app/api-reference/functions/use-router#userouter)

---

### Question 81647643-d808-4bee-8dfc-111804ae4b73

- Why does the following Server Action fail to redirect the user to `/dashboard` when executed?

```typescript
async function submitForm(formData: FormData) {
  'use server';
  try {
    await processData(formData);
    redirect('/dashboard');
  } catch (error) {
    console.error('Failed to submit:', error);
    return { error: 'Submission failed' };
  }
}
```

### Answer

- **Exception-based control flow**: Next.js implements `redirect()` by throwing an internal `NEXT_REDIRECT` error that must bubble up to the framework runtime to complete navigation.
- **Try/catch interception**: The generic `catch (error)` block catches `NEXT_REDIRECT`, mistakes it for a runtime failure, and swallows the exception before the framework can process it.
- **Correct implementation**: Move `redirect()` outside the `try/catch` block, or rethrow the error if `isRedirectError(error)` is true:

```typescript
async function submitForm(formData: FormData) {
  'use server';
  try {
    await processData(formData);
  } catch (error) {
    console.error('Failed to submit:', error);
    return { error: 'Submission failed' };
  }
  redirect('/dashboard'); // Invoked outside try/catch
}
```

- [More detail on Next.js redirect](https://nextjs.org/docs/app/api-reference/functions/redirect)

---

### Question 032fff55-ebaa-4867-a71d-9c52b99b4b9f

- What are the HTTP semantics and SEO implications of using `redirect()` versus `permanentRedirect()`?

### Answer

- **HTTP status codes**: `redirect()` returns an **HTTP 307 (Temporary Redirect)**; `permanentRedirect()` returns an **HTTP 308 (Permanent Redirect)**.
- **Method preservation**: Both 307 and 308 forbid changing the HTTP request method during redirection (unlike legacy 301/302, which allowed clients to change a POST into a GET).
- **SEO & search engine indexing**: `permanentRedirect()` informs web crawlers that the resource permanently relocated, transferring PageRank and updating search index canonical URLs; `redirect()` retains the original URL in the index.
- **Client caching**: Browsers and CDNs cache 308 responses persistently, making post-deployment reversions difficult without client-side cache flushes.

- [More detail on permanentRedirect](https://nextjs.org/docs/app/api-reference/functions/permanentRedirect)

---

### Question 11f231f6-a702-4c57-bda9-5562c175b837

- How do route matching behavior and parameter shapes differ across `[slug]`, `[...slug]`, and `[[...slug]]`?

### Answer

- **Single segment (`[slug]`)**: Matches exactly one dynamic path segment (e.g., `/shop/[slug]` matches `/shop/shoes`). Resolves to `{ slug: 'shoes' }`. Fails on `/shop` or `/shop/shoes/nike`.
- **Catch-all (`[...slug]`)**: Matches one or more segments (e.g., `/docs/[...slug]` matches `/docs/api` and `/docs/api/auth`). Resolves to an array: `{ slug: ['api'] }` or `{ slug: ['api', 'auth'] }`. Fails on `/docs`.
- **Optional catch-all (`[[...slug]]`)**: Matches zero or more segments, including the root path (`/docs`, `/docs/api`, `/docs/api/auth`). When matching `/docs`, resolves to `{ slug: undefined }`.

- [More detail on Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

---

### Question 43b29551-c6a6-41dc-9f54-2af98dfeae38

- Why does accessing `params.id` synchronously in this Next.js 15 page trigger a runtime warning or build error?

```typescript
// app/users/[id]/page.tsx
export default function UserPage({ params }: { params: { id: string } }) {
  return <div>User: {params.id}</div>;
}
```

### Answer

- **Asynchronous params change**: In Next.js 15+, `params` and `searchParams` are delivered as **Promises** (`Promise<{ id: string }>`) across pages, layouts, route handlers, and metadata functions.
- **Awaiting the promise**: The component must be declared `async` and the parameter object explicitly awaited:

```typescript
// app/users/[id]/page.tsx
export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>User: {id}</div>;
}
```

- **Architectural rationale**: Making request data asynchronous allows Next.js to start rendering static segments and streaming early layout shells before dynamic request headers or route parameters resolve (unlocking Partial Prerendering).

- [More detail on Next.js 15 Async Request APIs](https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-apis-breaking-change)

---

### Question f2f0fb2a-e7e5-408a-8a22-85cc4bf9f647

- How does `generateStaticParams` execute at build time across nested layout and page segments?

### Answer

- **Top-down execution order**: Next.js executes `generateStaticParams` in parent layouts before executing child layout or page `generateStaticParams` functions.
- **Cartesian parameter composition**: Child `generateStaticParams` receive the resolved params from parent segments; Next.js invokes the child function for each parent combination, compiling the full set of static paths at build time.
- **Request deduplication**: Next.js automatically memoizes identical `fetch` calls across multiple `generateStaticParams` executions, preventing duplicate API calls during `next build`.

```typescript
// app/products/[category]/[id]/page.tsx
export async function generateStaticParams({
  params: { category },
}: {
  params: { category: string };
}) {
  const products = await getProductsByCategory(category);
  return products.map((product) => ({ id: product.id }));
}
```

- [More detail on generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)

---

### Question 7a5c1a9b-089b-420b-a903-18f789d9483c

- What is the mechanical behavior of `dynamicParams` when a request matches a dynamic route omitted from `generateStaticParams`?

### Answer

- **`export const dynamicParams = true` (default)**: Requests for un-enumerated paths trigger on-demand dynamic rendering (SSR) on the first visit; the generated HTML/RSC payload is cached for future requests (ISR).
- **`export const dynamicParams = false`**: Un-enumerated paths immediately return a **404 status** without executing server components or database queries.
- **Security & resource tradeoff**: Setting `dynamicParams = false` protects server backends from denial-of-service or database pool exhaustion caused by crawlers scanning invalid dynamic IDs.

```typescript
// app/blog/[slug]/page.tsx
export const dynamicParams = false; // Returns 404 for any slug not returned by generateStaticParams
```

- [More detail on dynamicParams Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams)

---

### Question 417e8f56-ba50-4e9d-a39f-2fb7f01059fc

- What is the in-memory lifespan and invalidation behavior of the App Router Client-side Router Cache?

### Answer

- **Memory scope**: Stores prefetched and visited RSC payloads in browser JavaScript memory per tab session; it does not persist across hard browser reloads.
- **Stale time windows**: By default, static route segments remain cached for **5 minutes**; dynamic route segments remain cached for **30 seconds** (or 0s / opt-out depending on configuration in Next 14.2+ / 15).
- **Invalidation mechanisms**: The router cache is invalidated via `router.refresh()`, executing a Server Action with `revalidatePath()` or `revalidateTag()`, or modifying cookies in a Server Action via `cookies().set()`.

- [More detail on Next.js Client-side Router Cache](https://nextjs.org/docs/app/building-your-application/caching#client-side-router-cache)
