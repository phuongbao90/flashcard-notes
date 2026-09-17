# Data Fetching & Mutations

### Question bb710d21-9af4-4f6f-833b-ce1d35791b97

- Why is querying databases or ORMs directly inside React Server Components preferred over dispatching HTTP requests to internal Route Handlers?

### Answer

- **Eliminates network overhead**: Direct DB queries avoid internal HTTP round-trips (serialization, deserialization, network latency, and DNS resolution) by executing within the server's local process and connection pool.
- **Prevents unnecessary API surface**: Internal route handlers expose public endpoints that require dedicated authentication, rate limiting, and CORS handling. RSC queries keep database calls private on the server.
- **Zero client bundle cost**: Database libraries (`@prisma/client`, `drizzle-orm`) and credentials remain strictly on the server; client components receive only rendered HTML and the serialized RSC payload.
- **Colocated data requirements**: Server components fetch only the data fields their specific UI needs, preventing over-fetching without requiring custom BFF (Backend-For-Frontend) endpoints.

- [More detail on Next.js Data Fetching in Server Components](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#fetching-data-on-the-server)

---

### Question 1b231850-d2e4-43cb-b81a-b7ffe8c0da3f

- How does Next.js extend the native Web `fetch()` API, and how do request memoization and the Data Cache interact?

### Answer

- **Per-request memoization**: Next.js wraps React's cache to automatically deduplicate identical `fetch` calls (same URL and options) made across different components within a single server render pass.
- **Data Cache persistence**: Next.js extends `fetch` with the `next: { revalidate, tags }` options to store HTTP response data in a persistent server-side cache across requests and deployments.
- **Execution lifecycle**: During rendering, Next.js checks memoization first. If not memoized, it checks the Data Cache. If a cache entry exists and is fresh, it returns it; otherwise, it executes the network request, writes to the Data Cache, and memoizes for the current render.
- **Next.js 15 default**: Starting in Next.js 15, `fetch` requests default to `no-store` (uncached) rather than `force-cache`.

```typescript
// Memoized during single render pass AND cached across requests for 1 hour
const res = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600, tags: ['catalog'] },
});
```

- [More detail on Next.js Fetch and Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#caching-data)

---

### Question 9327407c-ea26-4684-97fb-f4f302beb5f9

- What security vulnerability occurs when database queries in Server Components accept unvalidated client props or `searchParams`, and how is it mitigated?

### Answer

- **Missing API gateway validation**: Because Server Components execute database queries directly without passing through an API gateway or middleware, directly passing `searchParams` or user props to database calls can expose IDOR (Insecure Direct Object Reference) and query injection risks.
- **Data Access Layer (DAL)**: Consolidate data operations into dedicated data-access modules decorated with `import 'server-only'`.
- **Enforce input parsing & authorization**: Validate all search params and input IDs with schema validators (e.g. Zod) and verify session authentication inside the DAL before invoking ORM/SQL queries.

```typescript
// lib/dal.ts
import 'server-only';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getUserInvoice(invoiceId: string) {
  const session = await verifySession(); // Authorization check
  return db.invoice.findFirst({
    where: { id: invoiceId, userId: session.userId },
  });
}
```

- [More detail on Next.js Data Security and DAL](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#data-access-layer-dal)

---

### Question 88cd8ad5-5332-413c-a715-41361325a97e

- How do nested async Server Components cause request waterfalls, and how can they be systematically diagnosed?

### Answer

- **Sequential blocking**: When a parent Server Component awaits a data fetch before rendering a child Server Component that also awaits a fetch, the child request cannot start until the parent request finishes.
- **Compound latency**: The total time to render equals the sum of all serial network queries (`Time = T1 + T2 + ... + Tn`), severely delaying initial page streaming, TTFB, and LCP.
- **Diagnostic methods**:
  - **DevTools Network tab**: Inspect chunked RSC streaming responses for long idle gaps between HTML chunks.
  - **Server-Timing headers**: Instrument fetch functions with `performance.now()` to expose execution times in browser timing panels.
  - **OpenTelemetry / tracing**: Use Next.js instrumentation hooks to inspect spans and identify nested, blocking parent-child database spans.

- [More detail on Next.js Avoiding Waterfalls](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#parallel-and-sequential-data-fetching)

---

### Question a2a28c5f-1736-4072-9905-73f1f8440928

- How does the "preload pattern" eliminate waterfalls without lifting component data fetching up into a shared parent?

### Answer

- **Eager promise dispatch**: A helper function initiates a data fetch without awaiting it immediately, starting the network request before rendering child components.
- **Deduplication with `cache()`**: Wrap the fetch function in React `cache()` so the preload call and subsequent component call execute the identical network request only once.
- **Decoupled execution**: Enables the parent or layout to trigger the fetch eagerly as early as possible, while the deeply nested child component retains ownership of awaiting and consuming the data.

```typescript
// lib/data.ts
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});

export const preloadUser = (id: string) => {
  void getUser(id); // Kick off fetch eagerly without blocking
};

// app/user/[id]/page.tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  preloadUser(id); // Starts fetch immediately
  return <UserDetails id={id} />;
}

// app/user/[id]/UserDetails.tsx
async function UserDetails({ id }: { id: string }) {
  const user = await getUser(id); // Reuses the eagerly started promise
  return <h1>{user.name}</h1>;
}
```

- [More detail on the Next.js Preload Pattern](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#preloading-data)

---

### Question 312ec21e-0c6f-4bcb-b6ac-f1d4894ad046

- When should you use `Promise.all` versus independent `<Suspense>` boundaries for concurrent data fetching?

### Answer

- **Use `Promise.all`**: When multiple data sources are strictly interdependent or co-located in the same component, and rendering cannot partially succeed without all of them (e.g. comparing two datasets side-by-side).
- **Disadvantage of `Promise.all`**: Blocks rendering until the **slowest** promise resolves; one slow query delays the entire component even if other queries resolve instantly.
- **Use `<Suspense>` boundaries**: When data sources represent independent UI sections (e.g. main product details vs. customer reviews vs. related recommendations).
- **Streaming benefit**: Fast queries render and paint immediately to the client; slower sections stream in as asynchronous chunks without holding up initial page TTFB.

- [More detail on Next.js Parallel Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#parallel-data-fetching)

---

### Question b5d7cb48-fbbc-49f0-af2d-287457b714e2

- What is the mechanical lifecycle and serialization process when passing an unresolved Promise from a Server Component to a Client Component?

### Answer

- **Flight stream promise marker**: When a Server Component passes an unresolved Promise as a prop to a Client Component, React does not await the promise on the server. Instead, it serializes an unresolved placeholder reference into the RSC Flight stream.
- **Non-blocking client shell**: The Client Component receives the Promise reference immediately, mounts inside a `<Suspense>` boundary, and renders its fallback UI.
- **Chunk resolution**: When the server-side Promise finally resolves, React streams a new payload chunk containing the resolved data along with instructions to resolve the client-side promise.
- **Boundary unwinding**: React resolves the promise on the client, un-suspends the `<Suspense>` boundary, and commits the Client Component with resolved data.

- [More detail on React use Hook and Promises](https://react.dev/reference/react/use)

---

### Question d3af0858-2f2c-4043-967c-8ea67ff23a3f

- How do you consume a server-passed Promise in a Client Component using React's `use()` hook, and how are rejections handled?

### Answer

- **Resolution with `use()`**: Unlike `await`, the `use()` hook can be called directly inside Client Components (including conditionals and loops) to unwrap a promise.
- **Suspense requirement**: Calling `use(promise)` suspends the component until the promise resolves, requiring an ancestor `<Suspense fallback={...}>` boundary.
- **Error handling via Error Boundary**: If the server-passed promise rejects, React rethrows the rejection error inside the component tree, which is caught by the nearest Error Boundary (`error.tsx`).

```tsx
// app/ClientReviews.tsx
'use client';
import { use } from 'react';

export default function ClientReviews({ reviewsPromise }: { reviewsPromise: Promise<string[]> }) {
  const reviews = use(reviewsPromise); // Suspends until promise resolves
  return <ul>{reviews.map((r, i) => <li key={i}>{r}</li>)}</ul>;
}

// app/page.tsx (Server Component)
export default function Page() {
  const reviewsPromise = fetchReviewsAsync(); // Eager promise, not awaited
  return (
    <Suspense fallback={<p>Loading reviews...</p>}>
      <ClientReviews reviewsPromise={reviewsPromise} />
    </Suspense>
  );
}
```

- [More detail on Passing Promises to Client Components](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#streaming-with-suspense)

---

### Question 521a25bb-36df-4f16-a21c-d4f5f4f3ed51

- How do Server Actions achieve progressive enhancement when attached to native HTML forms?

### Answer

- **Zero-JS execution**: When a Server Action is passed to a `<form action={myAction}>`, Next.js creates a standard form action endpoint. If JavaScript is disabled or fails to load, submitting the form performs a native browser HTTP `POST` submission with `multipart/form-data`.
- **Server-side lifecycle**: The server handles the `POST`, parses form fields via `FormData`, runs mutations, triggers `revalidatePath`, and issues an HTTP redirect.
- **Hydrated enhancement**: When JavaScript hydrates, React intercepts the `<form>` submit event, dispatches an asynchronous `POST` request with RSC headers, updates UI state via Concurrent React without a full page reload, and streams differential updates.

```tsx
// app/actions.ts
'use server';
export async function updateName(formData: FormData) {
  const name = formData.get('name') as string;
  await db.user.update({ data: { name } });
  revalidatePath('/profile');
}

// app/ProfileForm.tsx
export default function ProfileForm() {
  return (
    <form action={updateName}>
      <input name="name" required />
      <button type="submit">Update</button>
    </form>
  );
}
```

- [More detail on Server Actions Progressive Enhancement](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#progressive-enhancement)

---

### Question f1a82dcb-1d93-405f-9f89-d465535f836c

- Why must Next.js `redirect()` and `notFound()` functions be invoked outside of `try...catch` blocks inside Server Actions?

### Answer

- **Control flow by throwing**: In Next.js, `redirect()` and `notFound()` work internally by throwing special control-flow exceptions (`NEXT_REDIRECT` and `NEXT_NOT_FOUND`).
- **Swallowing the exception**: Wrapping these functions in a generic `try...catch` block catches the internal exception, treating a successful redirect as an application error and preventing Next.js from completing the redirection.
- **Safe implementation pattern**: Perform data mutations inside `try...catch`, handle business errors, and invoke `redirect()` only after the try block completes (or check `isRedirectError(error)` before rethrowing).

```typescript
'use server';
import { redirect } from 'next/navigation';

export async function createItem(formData: FormData) {
  try {
    await db.item.create({ data: { name: formData.get('name') as string } });
  } catch (err) {
    return { error: 'Failed to create item' };
  }

  redirect('/dashboard'); // Called outside try...catch
}
```

- [More detail on Next.js redirect function](https://nextjs.org/docs/app/api-reference/functions/redirect)

---

### Question 61c7a863-73ef-4a80-8b70-5e65cbce19e7

- How do `useActionState` and `useOptimistic` coordinate pending states and rollback during Server Action mutations?

### Answer

- **`useActionState`**: Accepts an action function and initial state; returns `[state, formAction, isPending]`. It tracks whether the server mutation is in-flight (`isPending`) and captures returned server validation errors or messages.
- **`useOptimistic`**: Accepts current server state and an update reducer; returns `[optimisticState, setOptimisticState]`. Immediately updates the client UI while the mutation is processing.
- **Automatic rollback**: If the Server Action rejects or throws an error, React automatically discards the optimistic state and reverts the UI to the actual server state received via `useActionState`.

```tsx
'use client';
import { useActionState, useOptimistic } from 'react';
import { updateTodo } from '@/app/actions';

export default function TodoItem({ todo }: { todo: { id: string; title: string } }) {
  const [state, formAction, isPending] = useActionState(updateTodo, null);
  const [optimisticTodo, setOptimistic] = useOptimistic(
    todo,
    (current, update: string) => ({ ...current, title: update })
  );

  return (
    <form action={async (formData) => {
      const newTitle = formData.get('title') as string;
      setOptimistic(newTitle); // Optimistic UI update immediately
      await formAction(formData); // Execute mutation
    }}>
      <input name="title" defaultValue={optimisticTodo.title} />
      <button disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</button>
    </form>
  );
}
```

- [More detail on React useActionState and useOptimistic](https://react.dev/reference/react/useActionState)

---

### Question 6dc0432b-d6f9-46ec-ac4b-3cf48abea14c

- Why is implementing Route Handlers for internal UI mutations considered an architectural anti-pattern in the App Router?

### Answer

- **Manual cache revalidation**: Route Handlers (`POST /api/...`) do not automatically invalidate the Next.js Client-side Router Cache or server tags. Developers must manually orchestrate `router.refresh()`, client state stores, or SWR/React Query mutations.
- **Loss of RSC single round-trip**: Server Actions automatically mutate and return updated RSC Flight data in the same HTTP response, re-rendering affected Server Components in a single round-trip.
- **Loss of progressive enhancement**: Route Handlers require JavaScript on the client to intercept form submits, assemble payloads (`fetch()`), and handle JSON responses.
- **Excessive boilerplate**: Route Handlers require manual routing, request method switching, JSON serialization/deserialization, and separate status code management for internal component interactions.

- [More detail on Server Actions vs Route Handlers](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

### Question 7f06fd7e-f301-49a0-bca2-8bc11c166b7b

- Under what specific technical requirements should you implement a Route Handler instead of a Server Action?

### Answer

- **External webhooks & callbacks**: Ingesting third-party webhooks (e.g. Stripe, GitHub, Shopify) that require raw request bodies (`req.text()`) for cryptographic signature verification.
- **Public API endpoints**: Serving public REST or JSON APIs intended for consumption by third parties, mobile apps, or headless microservices without a browser session.
- **Non-HTML binary & streaming responses**: Generating dynamic images (`@vercel/og`), PDFs, file downloads, audio/video streams, or Server-Sent Events (SSE) requiring custom HTTP status codes and headers (e.g., `Content-Type`, `Content-Disposition`, CORS).
- **Custom authentication handshakes**: Handling OAuth redirects and machine-to-machine API key authorization protocols.

- [More detail on Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

### Question 04916c6a-d2eb-4afc-9c6a-46b475d7bad5

- Why do third-party HTTP libraries like `axios` bypass Next.js Data Cache and request deduplication, and how can this be addressed?

### Answer

- **Native fetch patching**: Next.js specifically patches global `fetch()` to plug into React's per-render request memoization and the persistent Next.js Data Cache.
- **Third-party client isolation**: Libraries like `axios` rely on Node.js native `http`/`https` modules or their own adapters, completely bypassing the monkey-patched `fetch` API.
- **Restoring request memoization**: Wrap the third-party client call in React's `cache()` to deduplicate identical calls within a single render pass.
- **Restoring cross-request caching**: Wrap the call in `unstable_cache` (or Next.js 15 `'use cache'`) to store and revalidate data across requests and deployments with custom cache tags and revalidation TTLs.

```typescript
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import axios from 'axios';

// 1. Memoized per render pass
export const getExternalUser = cache(async (id: string) => {
  const res = await axios.get(`https://api.external.com/users/${id}`);
  return res.data;
});

// 2. Cached across requests in Data Cache
export const getCachedExternalUser = unstable_cache(
  async (id: string) => (await axios.get(`https://api.external.com/users/${id}`)).data,
  ['external-user'],
  { revalidate: 3600, tags: ['users'] }
);
```

- [More detail on React cache and Next.js unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

---

### Question 4e2bcf58-45be-476a-93f2-e7b5674999fc

- Why is the `globalThis` singleton pattern required when instantiating database clients (like Prisma) in Next.js development mode?

### Answer

- **HMR module re-execution**: In development mode (`next dev`), Next.js Hot Module Replacement clears and re-evaluates module files every time code changes without restarting the Node.js process.
- **Connection pool exhaustion**: If `new PrismaClient()` is declared at top-level module scope, each code edit instantiates a new database client instance with its own connection pool, rapidly hitting database connection limits (`FATAL: too many connections`).
- **Singleton preservation**: Storing the instantiated client on the global `globalThis` object persists the single client reference across HMR re-evaluations while allowing standard instantiation in production.

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [More detail on Prisma with Next.js](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices)

---

### Question c4408603-472a-458c-acf2-784e94585d12

- How does the `server-only` package mechanically prevent server secrets and database drivers from leaking into client bundles?

### Answer

- **Build-time compiler assertion**: `server-only` is an empty package with an entry point that throws a build error if bundled into a Client Component module graph.
- **Accidental import prevention**: If a developer imports a database client or utility containing secret API keys into a file with `'use client'`, the Next.js bundler detects the `server-only` import and fails `next build` immediately with an explicit error.
- **Guaranteed environment boundary**: Ensures that sensitive internal operations, ORM packages, and private environment variables can never inadvertently leak into client-side JavaScript bundles.

```typescript
// lib/db.ts
import 'server-only'; // Fails build if imported by any Client Component
import { db } from './connection';

export async function getSensitiveData() {
  return db.secrets.findMany();
}
```

- [More detail on server-only package](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment)

---

### Question 26b8a6fb-4b3d-413f-af06-7bcfee36c09c

- How does Next.js mechanically stream slow data with `<Suspense>` over HTTP chunked transfer encoding?

### Answer

- **Initial flush of static shell**: The server immediately returns HTTP status `200` with the header `Transfer-Encoding: chunked` and flushes the initial HTML document containing the static shell, layout, and fallback skeleton markup.
- **Independent promise execution**: While the browser parses CSS and renders the fallback skeleton, the server runtime continues awaiting the unresolved Server Component promise in the background.
- **Streaming the resolved chunk**: Once the promise resolves, the server renders the component into HTML, wraps it inside an inline `<template id="...">` tag followed by an inline replacement script, and streams it down the open HTTP connection.
- **Client DOM swap**: The injected script finds the corresponding Suspense placeholder in the DOM and replaces the fallback markup with the resolved content before client JS bundles finish hydrating.

- [More detail on Next.js Streaming and Suspense](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#what-is-streaming)

---

### Question 2ef42253-bac9-49d4-815f-03c2cb31515f

- How do you architect a high-traffic e-commerce product page so that slow pricing and inventory queries do not degrade Core Web Vitals (TTFB and LCP)?

### Answer

- **Split static and dynamic data**: Colocate critical above-the-fold content (product title, images, specifications) in a fast or statically cached Server Component so it renders in the initial HTML chunk, ensuring near-instant TTFB and optimal LCP.
- **Isolate volatile queries**: Separate slow, personalized, or real-time queries (live inventory counts, personalized pricing tiers) into dedicated async Server Components.
- **Wrap with `<Suspense>` boundaries**: Encapsulate those slow components inside isolated `<Suspense>` boundaries with skeleton loaders so the main page layout renders immediately.
- **Avoid top-level awaits**: Never await slow inventory services in the page root or layout, preventing those operations from blocking the initial page stream.

```tsx
// app/products/[id]/page.tsx
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <FastProductHero id={id} /> {/* Renders immediately; satisfies LCP */}
      <Suspense fallback={<PricingSkeleton />}>
        <DynamicPricingAndStock id={id} /> {/* Streams in asynchronously */}
      </Suspense>
    </main>
  );
}
```

- [More detail on Next.js Streaming Architecture](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming#streaming-with-suspense)
