# Fetch API

### Question 3f6000fb-f81c-4c7d-90a6-3d727f00d3d3

- How does fetch() handle HTTP error statuses (like 404 or 500)?

### Answer

- Answer: `fetch()` **does not reject** its returned Promise on **HTTP error responses** (e.g., 404 Not Found or 500 Internal Server Error). The promise only rejects if there is a **network failure** or if the request was **aborted/blocked** (e.g., CORS violation, offline).
- Follow-up / Correct Handling: You must check the **`response.ok`** boolean property (which is true for HTTP status codes 200–299) or inspect **`response.status`**.

```javascript
const response = await fetch("/api/data");
if (!response.ok) {
  throw new Error(`HTTP error! Status: ${response.status}`);
}
const data = await response.json();
```

- [More detail on Response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)
- [More detail on Using the Fetch API: checking that the fetch was successful](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful)
---

### Question 3126e1c5-62c7-4b55-8e1d-f3c1895230be

- What are the main differences between fetch() and XMLHttpRequest (XHR) or axios?

### Answer

- **Promises vs Callbacks**: fetch is **native and Promise-based**; XMLHttpRequest uses **event listeners/callbacks**.
- **HTTP Error Handling**: axios automatically **rejects on status codes outside 2xx**; fetch requires **manual checks (`response.ok`)**.
- **Request Cancellation**: fetch uses **`AbortController`**, whereas axios uses **`CancelToken`/`AbortController`**, and XHR uses **`.abort()`**.
- **Automatic JSON Transformation**: axios **automatically parses JSON**; fetch requires calling **`.json()`**.
- **Upload/Download Progress**: XHR and axios easily track **upload progress** via event listeners (`onprogress`). fetch does not have built-in upload progress listeners (though **download progress** can be read via **`ReadableStream`**).

- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
- [More detail on XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
---

### Question e9ab2a8d-0e78-4db8-b2cf-756fa977d59e

- Why do response.json() or response.text() return Promises?

### Answer

- Answer: fetch yields **HTTP headers** as soon as they arrive. However, reading the **HTTP response body** occurs **asynchronously** as data packets stream over the network. Methods like **`response.json()`** read the body stream to completion and parse it, returning a Promise that resolves when the reading/parsing is finished.

- [More detail on Response.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json)
- [More detail on the Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
---

### Question f6d95357-ebea-4bdd-ba40-c4e0cf04c2a6

- Why can a fetch response body only be read once?

### Answer

- Answer: `response.body` is a **`ReadableStream`**. Once consumed by methods like `.json()`, `.text()`, or `.blob()`, the stream is **locked and emptied** to prevent storing the entire payload repeatedly in memory.
- Workaround: If you need to read the body multiple times (e.g., for logging and then parsing), you must duplicate the response first using `const clonedResponse = response.clone()`.

- [More detail on Response.clone()](https://developer.mozilla.org/en-US/docs/Web/API/Response/clone)
---

### Question dadf42a4-bf11-4cdf-81e8-c0f9b5425cba

- How do you handle authentication cookies with fetch()?

### Answer

- Answer: By default (in modern browsers), fetch sends **same-origin credentials** (cookies, HTTP basic auth) automatically, but **omits them for cross-origin requests** unless specified.
- **`credentials` option**:
  - **`'same-origin'` (default)**: Sends credentials **only to the same origin**.
  - **`'include'`**: Always **sends credentials**, even on **cross-origin requests** (requires `Access-Control-Allow-Credentials: true` header from the backend).
  - **`'omit'`**: Never sends or receives credentials.

- [More detail on Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [More detail on HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
---

### Question 1f4cd7b7-8278-43fc-a0b0-5e5463cfbc02

- What is the difference between request modes: cors, no-cors, and same-origin?

### Answer

- **`'cors'` (default)**: Standard **CORS request**. Expects appropriate CORS headers back from cross-origin servers.
- **`'same-origin'`**: **Rejects requests** made to cross-origin URLs before network dispatch.
- **`'no-cors'`**: Intended for **opaque requests** (e.g., sending analytics beacons or loading third-party media). The response status is 0, response type is **`'opaque'`**, and the body cannot be read via JS.

- [More detail on Request: mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/mode)
---

### Question 210f5a77-2b87-41a7-ab33-935bfc001285

- Implement a fetchWithRetry(url, options, retries, delay) function.

### Answer

```ts
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} retries: ${err.message}`);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}
```

- **Caveat**: Retrying every non-2xx wastes requests — **other 4xx errors are deterministic** and will fail identically. Retry only **network failures, `502/503/504`, and `429`** (honoring `Retry-After`), with **exponential backoff and jitter**.

- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
- [More detail on Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
---

### Question e59ed236-62b4-4c12-8635-4b482e23de22

- What are keepalive and sendBeacon, and how do you send telemetry data on page unload using fetch?

### Answer

- Answer: Normally, when a user navigates away or closes a tab, standard `fetch()` requests may be **cancelled by the browser**.
- Setting **`keepalive: true`** in `fetch()` allows the request to **outlive the page session** (up to browser quota limits, typically ~64KB).

```javascript
window.addEventListener("pagehide", () => {
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(data),
    keepalive: true,
    headers: { "Content-Type": "application/json" },
  });
});
```

- Alternative: **`navigator.sendBeacon(url, data)`** is specifically designed for **fire-and-forget analytics on unload**, but `fetch({ keepalive: true })` supports **custom HTTP methods and headers**.
- Prefer **`pagehide` / `visibilitychange`** over `unload` for the listener: `unload` is unreliable (may never fire on mobile) and disqualifies the page from **BFCache**.

- [More detail on Request: keepalive](https://developer.mozilla.org/en-US/docs/Web/API/Request/keepalive)
- [More detail on navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/navigator/sendBeacon)
---

### Question 86edf5ff-19e6-441e-9926-855776d94fc0

- How does Content Security Policy (CSP) affect fetch()?

### Answer

- Answer: The **`connect-src` CSP directive** restricts the URLs to which script interfaces like fetch, XHR, or WebSockets can send requests. If a web app attempts to `fetch('https://api.external.com')` without that domain whitelisted in `connect-src`, the browser **blocks the request** and throws a **`TypeError`**.

- [More detail on Content-Security-Policy: connect-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src)
---

### Question 5ec1171a-a739-46a7-a5f8-ab7459706af2

- How do referrer and referrerPolicy work in fetch()?

### Answer

- Answer: They control what **`Referer` header** is sent with the outbound request.
- You can configure **`referrerPolicy`** to options like `'no-referrer'`, `'strict-origin-when-cross-origin'`, or `'same-origin'` to prevent **sensitive URL parameters or internal domain structure** from leaking to third-party endpoints.

- [More detail on Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
---

### Question edeedf95-442c-460b-911f-d6015c333866

- Why does calling response.json() fail on a 204 No Content response, and how do you prevent it?

### Answer

- Answer: An **HTTP 204 No Content** or **205 Reset Content** status code returns an **empty body**. Attempting to run `response.json()` on an empty string causes a **`SyntaxError: Unexpected end of JSON input`**.
- Prevention: Check **`response.status === 204`** or verify content before parsing:

```javascript
async function parseResponse(response) {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }
  return await response.json();
}
```

- [More detail on 204 No Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204)
- [More detail on Response.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json)
---

### Question 15e401ff-1c84-4326-9703-cf6d278741bb

- How can you track download progress with fetch() since it lacks an onprogress callback?

### Answer

- Answer: You can calculate progress by reading the response stream chunk-by-chunk using **`response.body.getReader()`** combined with the **`Content-Length`** response header:

```javascript
const response = await fetch("/large-file.pdf");
const totalBytes = parseInt(response.headers.get("Content-Length"), 10);
let loadedBytes = 0;
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  loadedBytes += value.byteLength;
  console.log(`Progress: ${((loadedBytes / totalBytes) * 100).toFixed(2)}%`);
}
```

- [More detail on ReadableStream: getReader()](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader)
---

### Question e0860ab8-a710-4cf4-a0d0-baffcfacae22

- How does fetch interact with Service Workers?

### Answer

- **Service Workers** can intercept every `fetch()` request made by a web app via the **`fetch` event listener**.

```javascript
// Service Worker context
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    }),
  );
});
```

- This enables **offline support**, **request caching strategies** (e.g., Cache-First, Network-First), and **custom request manipulation**.

- [More detail on FetchEvent](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent)
- [More detail on the Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
---

### Question 0e3ccc71-4553-4ecd-9f1c-de90bf33bc97

- How can you create a global request/response Interceptor for fetch (like Axios interceptors)?

### Answer

- Since native fetch doesn't have an interceptor API, you **Monkey-Patch** the global **`window.fetch`** function:

```javascript
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  // 1. Pre-request logic (e.g., attach auth token)
  config = config || {};
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
  // 2. Execute original fetch
  const response = await originalFetch(resource, config);
  // 3. Post-response logic (e.g., handle global 401 Unauthorized)
  if (response.status === 401) {
    window.location.href = "/login";
  }
  return response;
};
```

- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
---

### Question 8f5c4ecb-9b12-4e40-ad79-e4709b3dc32b

- Request Deduplication (In-flight Coalescing):
  - Scenario: If multiple components invoke fetchData('/api/user') at the same time, make only one network request and resolve all callers with the same result.

### Answer

```ts
const pendingRequests = new Map();

function fetchDeduplicated(url, options) {
  if (pendingRequests.has(url)) {
    // Return existing in-flight Promise
    return pendingRequests.get(url);
  }

  const fetchPromise = fetch(url, options)
    .then((res) => res.json())
    .finally(() => {
      // Clean up when complete so future requests fetch fresh data
      pendingRequests.delete(url);
    });

  pendingRequests.set(url, fetchPromise);
  return fetchPromise;
}
```

- [More detail on TanStack Query: queries and request deduplication](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
---

### Question d1a40f8d-8d3e-42b3-a213-79a2f3bea998

- How does Next.js extend the native Web fetch API, and why?

### Answer

- Answer: Next.js (App Router) patches the native fetch on the server side to integrate data fetching directly with Next.js's **Caching and Revalidation infrastructure**.
- Key Features Added:
  - **Request Memoization**: Multiple fetch calls for the exact same URL and options within a single server render tree are automatically **deduplicated** (only 1 network request is made).
  - **Data Cache**: Allows **caching fetched responses** across server requests and deployments.
  - **Revalidation**: Control cache expiration via **time intervals** or **tag-based invalidation**.

- [More detail on Next.js caching](https://nextjs.org/docs/app/guides/caching)
---

### Question 6ddf6b70-500c-4fbc-bc4c-b7e47881f694

- What are the primary cache options in Next.js fetch?

### Answer

- **`cache: 'force-cache'` (Default in Next.js 13/14 SSG)**: Caches the response permanently in the **Data Cache** until manually revalidated.
- **`cache: 'no-store'` (Dynamic / SSR)**: **Opts out of caching entirely**. Fetches fresh data on every request.
- **Time-based Revalidation**:

```javascript
// Revalidates data at most once every 60 seconds (ISR)
fetch("https://api.example.com/data", {
  next: { revalidate: 60 },
});
```

- **Tag-based Revalidation**:

```javascript
// Associate request with a tag
fetch("https://api.example.com/products", {
  next: { tags: ["products"] },
});
// In a Server Action or Route Handler, purge the cache on demand:
import { revalidateTag } from "next/cache";
revalidateTag("products");
```

- [More detail on Next.js caching](https://nextjs.org/docs/app/guides/caching)
- [More detail on Request: cache](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache)
---

### Question 42e2ac60-48ab-4536-a91d-d318d15b1b6f

- What is the difference between React Request Memoization and Next.js Data Cache?

### Answer

- **Request Memoization (React)**: Deduplicates identical fetch requests within a **single request lifecycle** (e.g., rendering a single page component tree). It exists in **memory** and is discarded once the render finishes.
- **Data Cache (Next.js)**: Persists data across **multiple incoming user requests and deployments** (e.g., stored on disk or key-value store like Redis/Vercel Data Cache).

- [More detail on Next.js caching](https://nextjs.org/docs/app/guides/caching)
---

### Question d28e6a55-2fdc-481a-ac1d-62026943a873

- What do the different browser cache options in standard fetch() do?

### Answer

- Answer: You can control how fetch interacts with the browser's HTTP cache using the **`cache` init option**:
  - **`default`**: Standard browser behavior. Checks HTTP cache first (respecting `Cache-Control` headers).
  - **`no-store`**: Bypasses browser cache entirely. Does not look in cache, does not store response in cache.
  - **`no-cache`**: Checks cache, but forces browser to send a conditional request (`If-None-Match` / `ETag`) to the server to revalidate before serving cached data.
  - **`reload`**: Ignores existing cache, fetches fresh data from server, and updates the cache with the new response.
  - **`force-cache`**: Uses cached response regardless of age/freshness. Only fetches if no cache match exists.
  - **`only-if-cached`**: Returns cached response if available; fails with network error if not in cache (only works with `mode: 'same-origin'`).

- [More detail on Request: cache](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache)
---

### Question f8dedbef-b3c4-41ef-96c1-2832691e0119

- What is the difference between Cache-Control: no-cache and Cache-Control: no-store?

### Answer

- **`no-store`**: Strictly forbids storing any request or response in cache storage. Essential for **highly sensitive data** (e.g., banking details).
- **`no-cache`**: Allows storing the response in cache, but requires **revalidation with the origin server** (using ETag or Last-Modified) before returning the cached asset. If server returns **304 Not Modified**, the cached asset is used.

- [More detail on HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
---

### Question 0315756a-a39e-4764-98ad-7d7df1ba23e8

- What is the Web Cache API (window.caches), and how is it used with fetch()?

### Answer

- Answer: The **Cache API (`caches.open()`)** is a programmatic storage system for Request/Response pairs, independent of standard HTTP header caching. It is primarily used by **Service Workers** for offline PWA storage.

```javascript
async function getCachedOrFetch(requestUrl) {
  const cache = await caches.open("v1-api-cache");

  // 1. Try to find match in Cache API
  const cachedResponse = await cache.match(requestUrl);
  if (cachedResponse) {
    return cachedResponse;
  }
  // 2. Fall back to network fetch
  const networkResponse = await fetch(requestUrl);
  // 3. Store clone of response in cache (cloned because response body can only be read once)
  cache.put(requestUrl, networkResponse.clone());
  return networkResponse;
}
```

- [More detail on CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [More detail on the Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
---

### Question 379deaab-94c8-4273-a1bf-c08dcfebf2d2

- Core Motivation: Why document.cookie Needed Replacing

### Answer

- **Synchronous & Thread-Blocking**: `document.cookie` reads/writes synchronously on the **main thread**, forcing disk/IPC I/O that can cause **frame drops and UI jank**.
- **No Service Worker Support**: `document.cookie` depends on the **DOM (`document`)**, making cookies inaccessible within **Web Workers and Service Workers**.
- **Fragile String Parsing**: Standard operations require custom regex/string parsing and string formatting (`"name=val; path=/; SameSite=Lax"`).
- **No Change Detection**: Reacting to cookie changes previously required **polling or cross-tab messaging hacks**.

- [More detail on the Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API)
---

### Question 30211d23-46ba-4e04-be4d-56e97140c0fb

- Discuss cookie store api

### Answer

- **Asynchronous, non-blocking**
  - executing cookie store access **off the main thread**.
- **Service Worker Integration**
- **Reactive Event Model**
  `cookieStore.addEventListener('cookiechange', (event) => {`

- **Security & Scope Boundaries**
  - **Secure Context Required**: Only accessible over HTTPS (or localhost).
  - **HttpOnly Invisibility**: Designed for security boundaries; JavaScript cannot read or mutate HttpOnly cookies via cookieStore (just as with `document.cookie`).
  - **Same-Origin Policy**: Enforces domain and path scoping restrictions strictly based on current origin semantics.

- **notice**:
  - Safari and Firefox lack stable default support.

- [More detail on the Cookie Store API](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API)
---

### Question cad2c3ad-0a44-4e8c-8f14-c139dea10fc4

- How do you cancel an in-flight `fetch()` request, and how do you distinguish a deliberate cancellation from a real network failure in the rejected promise?

### Answer

- Create an **`AbortController`** and pass its signal: `fetch(url, { signal: controller.signal })`. Calling `controller.abort()` rejects the pending promise and closes the connection.
- The rejection is a **`DOMException` with `name === "AbortError"`**, not a network `TypeError`. Check `err.name` before surfacing errors to users or logging.
- Aborting also cancels body streaming: any pending `reader.read()` rejects with the same `AbortError`.

```javascript
const controller = new AbortController();
fetch(`/api/search?q=${query}`, { signal: controller.signal })
  .catch((err) => {
    if (err.name !== "AbortError") reportError(err);
  });

controller.abort(); // User typed a new query: cancel the stale request
```

- [More detail on AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [More detail on AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

---

### Question 5aa074f5-58d7-4298-98f5-95098659495b

- How do you add a per-request timeout to `fetch()` without leaking timers, and what error does it produce?

### Answer

- Use the native **`AbortSignal.timeout(ms)`**: `fetch(url, { signal: AbortSignal.timeout(5000) })` aborts automatically after 5 seconds — no `setTimeout`/`clearTimeout` bookkeeping.
- The promise rejects with a **`DOMException` whose `name` is `"TimeoutError"`** (distinct from a manual abort's `"AbortError"`), so catch blocks can distinguish timeouts from cancellations.
- Before this API, timeouts required racing fetch against a `setTimeout` that called `controller.abort()` — easy to leak or forget to clean up.

- [More detail on AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout)
- [More detail on AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

### Question c7c50e93-2e22-49fe-860c-de8dd1a51406

- A request must abort when either a 10-second timeout expires or the user navigates away. How do you combine multiple abort sources for one fetch?

### Answer

- **`AbortSignal.any([signalA, signalB])`** returns a composite signal that aborts as soon as **any** source signal aborts, carrying that source's reason.
- Combine **`AbortSignal.timeout(10_000)`** with a component-level controller so both the timeout and React unmount cleanup cancel the same request.
- Typical React shape: keep one `AbortController` per effect, pass the composite signal to fetch, and abort the controller in cleanup.

```javascript
useEffect(() => {
  const controller = new AbortController();
  fetchUser(id, {
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
  });
  return () => controller.abort(); // unmount or id change
}, [id]);
```

- [More detail on AbortSignal.any()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any)
- [More detail on AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

### Question d67dfa3e-26a8-4226-8105-ca04f0ec407e

- Which fetch failures should a retry wrapper retry, and why is "retry every non-2xx N times" a bad default?

### Answer

- **Retry**: network-level **`TypeError`** (connection reset, DNS hiccup), **`408`**, **`429`**, and **`5xx`** — these are transient or explicit rate limits.
- **Never retry** other **`4xx`** errors: `400/401/403/404` are deterministic — the identical request fails identically, multiplying load for nothing. `429` is the exception: honor its **`Retry-After`** header.
- Use **exponential backoff with jitter** (`delay = base * 2^attempt + random`) so concurrent clients don't synchronize into a thundering herd against a struggling server.

- [More detail on Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question 9341849e-39b5-4980-98d4-7e6732d060bf

- Why can retrying a failed POST create a duplicate payment, and how do idempotency keys make POST retries safe?

### Answer

- A network timeout is ambiguous: the request may have succeeded server-side — only the response was lost. Blindly retrying a POST re-executes the mutation (double charge).
- The client generates an **`Idempotency-Key`** (UUID) that stays **constant across retries of the same logical operation**; the server stores `key → first result` and replays it for duplicate submissions instead of re-executing.
- This makes POST retries as safe as GET retries — essential on flaky mobile networks where timeouts are common.

```javascript
const key = crypto.randomUUID(); // one key per logical payment
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(payload),
    });
    if (res.status < 500) return res;
  } catch { /* network error: safe to retry */ }
  await sleep(2 ** attempt * 500);
}
```

- [More detail on Idempotent methods](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question c2f06925-7394-4d77-9136-2bec3f694156

- In a search-as-you-type UI, the response for "re" arrives after the response for "rea" and overwrites it. How do you prevent this race condition?

### Answer

- Keep an **`AbortController` in the effect** and abort it in cleanup: when the query changes, the stale request is cancelled before it can resolve, so only the latest response updates state.
- Alternative pattern: an **`ignore` flag** set to `true` in cleanup — the late response still downloads, but its `setState` is skipped.
- Without either guard, React applies responses in **arrival order, not request order**, so slow early requests clobber fresh results.

```javascript
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then((res) => res.json())
    .then(setResults)
    .catch((err) => {
      if (err.name !== "AbortError") setError(err);
    });
  return () => controller.abort();
}, [query]);
```

- [More detail on useEffect cleanup](https://react.dev/reference/react/useEffect)
- [More detail on AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

### Question af1e64ff-de72-4472-bf4c-044ffa7be344

- How do you process a large text response incrementally as bytes arrive, and why is `TextDecoderStream` safer than manually decoding each chunk?

### Answer

- Pipe the body through a **`TextDecoderStream`**: `response.body.pipeThrough(new TextDecoderStream()).getReader()` yields decoded **strings chunk-by-chunk** as the network delivers them — constant memory instead of buffering the whole payload.
- `TextDecoderStream` carries decoder state across chunks, correctly reassembling **multi-byte UTF-8 characters split across chunk boundaries**; naive per-chunk `TextDecoder` calls corrupt them.
- Render/process per chunk to keep memory flat for megabyte-scale logs, exports, or streams.

```javascript
const response = await fetch("/api/logs");
const reader = response.body
  .pipeThrough(new TextDecoderStream())
  .getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  appendToLog(value); // decoded string
}
```

- [More detail on TextDecoderStream](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream)
- [More detail on the Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

---

### Question f46b261a-ec48-4383-a24c-d77bd7884b02

- How do you consume a newline-delimited JSON (NDJSON) stream (e.g. from an LLM API) using fetch?

### Answer

- NDJSON sends **one JSON object per line**; parse incrementally with a **partial-line buffer**: append each decoded chunk, split on `\n`, and `JSON.parse` only **complete lines**.
- The final fragment after a split is usually **incomplete JSON** — keep it buffered until its terminating newline arrives.
- This is the transport behind streaming chat UIs: the first token renders as soon as the first line lands, not after the full response.

```javascript
const reader = stream.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop(); // keep incomplete tail
  for (const line of lines) {
    if (line) handleEvent(JSON.parse(line));
  }
}
```

- [More detail on TextDecoderStream](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream)
- [More detail on the Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

---

### Question a8e52d45-ea65-4cd2-897d-b50a853968f9

- When should you implement server-sent events (SSE) with fetch + ReadableStream instead of the native EventSource API?

### Answer

- **`EventSource`**: simple — auto-reconnect, `Last-Event-ID` resume, built-in `text/event-stream` parsing — but **GET only and no custom headers** (no `Authorization`), no request body.
- **fetch-based SSE**: full control — send tokens via headers, use **POST** with a JSON payload (how OpenAI-style streaming APIs work), and parse `data:` lines from `response.body` yourself.
- Trade-off: you own **reconnection and `Last-Event-ID` resume** logic that `EventSource` provides for free.

- [More detail on EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [More detail on Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

### Question c8829e66-d7e3-4ab0-999b-2dd1480ba605

- How do you stream a request body (upload) with fetch, and what is the `duplex` option for?

### Answer

- Passing a **`ReadableStream` as `body`** starts uploading before the full payload exists — required for streaming uploads.
- The Fetch spec requires **`duplex: 'half'`** alongside a streaming body ("half" = one direction streams at a time); without it the request throws a `TypeError`.
- Use cases: pipelining file transforms to storage, or uploading generated data (archiving, transcoding) without buffering everything in memory.

```javascript
await fetch("/api/upload", {
  method: "POST",
  body: uploadStream, // ReadableStream
  duplex: "half", // REQUIRED for streaming request bodies
});
```

- [More detail on Request: duplex](https://developer.mozilla.org/en-US/docs/Web/API/Request/duplex)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question ea58d599-e375-4bfa-8126-be0ed2c220e3

- What is the biggest mistake when uploading files with fetch and FormData?

### Answer

- Let the browser set the **`Content-Type: multipart/form-data; boundary=...`** header itself — the boundary is generated per request and must match the body framing.
- Manually setting `Content-Type` (a common copy-paste mistake) **destroys the boundary**, so the server cannot parse the parts and the upload fails.
- `FormData` handles file, filename, and per-part content types; appending the `File` directly is enough.

```javascript
const form = new FormData();
form.append("avatar", fileInput.files[0]);
form.append("name", "Bao");

// Correct: NO Content-Type header — the browser sets multipart + boundary
await fetch("/api/profile", { method: "POST", body: form });
```

- [More detail on FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question c829b98d-dfd5-4fdb-a4b0-37ade44fda2c

- Your upload progress bar works with XHR but not with fetch. Why, and what are the options?

### Answer

- `fetch` **cannot observe upload progress**: the request body is opaque and no `upload.onprogress` equivalent exists (download progress works via `response.body` streaming).
- **`XMLHttpRequest` exposes `xhr.upload.onprogress`** with `loaded`/`total` — still the pragmatic choice for large-file progress bars.
- Either wrap XHR in a promise to keep ergonomics, or split large files into chunks and report progress per chunk with fetch.

```javascript
function uploadWithProgress(file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => setProgress(e.loaded / e.total);
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = reject;
    xhr.send(file);
  });
}
```

- [More detail on XMLHttpRequest.upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question 71f0bcdd-e245-4848-a13b-82630d6a48e7

- How do you trigger a file download from an endpoint that requires an `Authorization` header (so a plain `<a href>` cannot work)?

### Answer

- **`fetch` with the header**, read the body via **`response.blob()`**, wrap it with **`URL.createObjectURL`**, and click a temporary `<a download>` link.
- **Revoke** the object URL afterwards (`URL.revokeObjectURL`) — otherwise the blob stays pinned in memory until the document unloads.
- Optionally read the filename from the `Content-Disposition` response header instead of hardcoding it.

```javascript
const res = await fetch("/api/report.pdf", {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "report.pdf";
a.click();
URL.revokeObjectURL(url);
```

- [More detail on URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question b1a472cc-9d68-4879-b930-8875e4c36492

- Why would you construct a `Response` yourself with `new Response(...)`?

### Answer

- **Service Workers** synthesize responses (offline fallbacks, cached-body rewrites) to return from `event.respondWith()`.
- **Wrapping**: re-emit cached or transformed data with custom **status/headers** without refetching — e.g. adding `Cache-Control` to a cached API payload.
- **Frameworks build on it** — Next.js Route Handler `Response.json(data, { status: 201 })` and test mocks use the same constructor.

```javascript
const cached = await cache.match(request);
return new Response(cached.body, {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "max-age=60",
  },
});
```

- [More detail on the Response constructor](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response)
- [More detail on the Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

---

### Question 4017231d-78b1-4450-89a2-164530ff49f6

- Why can a `Request` object that carries a body be sent with fetch only once, and how do you reuse it?

### Answer

- A `Request`'s body is a **stream**; sending the request drains it — a second `fetch(sameRequest)` throws a **"body used already" `TypeError`**.
- Call **`request.clone()`** before each send to get an independent copy.
- Building a `Request` once (URL + headers + init) also gives a single, inspectable object to pass around instead of re-assembling options per call.

```javascript
const request = new Request("/api/track", {
  method: "POST",
  body: JSON.stringify(event),
  headers: { "Content-Type": "application/json" },
});

await fetch(request.clone()); // retry path
await fetch(request.clone()); // mirror/telemetry path
```

- [More detail on the Request constructor](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request)
- [More detail on Request.clone()](https://developer.mozilla.org/en-US/docs/Web/API/Request/clone)

---

### Question b186629c-eef5-476a-812a-cc8352a17b76

- Why does `response.headers.get("Set-Cookie")` return only one cookie when the server set several?

### Answer

- **`Headers.get()` returns a single value**; multiple `Set-Cookie` headers were historically collapsed into one comma-joined string — corrupting cookie syntax.
- **`headers.getSetCookie()`** returns an **array of every `Set-Cookie` header** in order — the correct way to read them in modern browsers.
- `Headers` is otherwise **case-insensitive** and iterable (`entries()`/spread) for diagnostics.

```javascript
const res = await fetch("/api/login", { method: "POST" });
for (const cookie of res.headers.getSetCookie()) {
  console.log("raw cookie:", cookie); // "name=value; Path=/; HttpOnly"
}
```

- [More detail on Headers.getSetCookie()](https://developer.mozilla.org/en-US/docs/Web/API/Headers/getSetCookie)
- [More detail on Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers)

---

### Question 80d38d58-ad4f-43bf-b8f8-31ae9433574e

- The fetch succeeds cross-origin, but `response.headers.get("X-Request-Id")` returns null. Why, and what is the fix?

### Answer

- Cross-origin responses expose only the **CORS-safelisted response headers** (`Cache-Control`, `Content-Language`, `Content-Type`, a few others); custom headers are **hidden from JavaScript by default**.
- The server must opt in with **`Access-Control-Expose-Headers: X-Request-Id`** (comma-separated list) for the header to become readable.
- Without it, the header exists on the wire (visible in DevTools) but is filtered out of the `Headers` object — a classic "works in the network tab, null in code" trap.

- [More detail on Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers)
- [More detail on CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

### Question 049904a1-4dea-48a0-b272-499cf3b31133

- How do you control redirect handling in fetch, and why can't you read the `Location` header with `redirect: "manual"`?

### Answer

- **`redirect` option**: `"follow"` (default) auto-follows the chain; `"error"` rejects on redirect; `"manual"` stops after the first hop.
- With `"manual"` the response has **`type: "opaqueredirect"`, `status: 0`, and empty headers** — by design, so scripts cannot use redirects to probe or read cross-origin locations. You know it redirected, but not where.
- On followed responses, **`response.redirected === true`** and `response.url` expose the final URL — useful to detect post-login redirects.

- [More detail on Request: redirect](https://developer.mozilla.org/en-US/docs/Web/API/Request/redirect)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question 99c7e0c9-f0ac-47c7-ab38-74a2a41c0b27

- What happens if you pass a body to a fetch with `method: "GET"`?

### Answer

- The **fetch throws a `TypeError`** ("Request with GET/HEAD method cannot have body") — the request never leaves the browser, per the Fetch spec.
- To send data with GET, encode it in the **URL query string** (`?page=2&sort=asc`); GET bodies are unsupported because they break HTTP caching and semantics.
- The same applies to **HEAD**; only POST/PUT/PATCH and friends accept bodies.

- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
- [More detail on URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

---

### Question 2f91bc18-a8b9-418a-ba11-78fc96d4f070

- What two things must every JSON POST with fetch include, and what silently happens if you forget them?

### Answer

- Set **`headers: { "Content-Type": "application/json" }`** — otherwise servers and middleware (parsers, CSRF rules) treat the body as plain text.
- **`body: JSON.stringify(payload)`** — passing a raw object sends the useless string `"[object Object]"`; fetch does not serialize objects for you.
- Together they are what makes Express/Next handlers populate `req.body` / `await req.json()` correctly.

```javascript
await fetch("/api/todos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Ship it" }),
});
```

- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
- [More detail on Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful)

---

### Question e889f4a0-f036-4df0-b0f7-5ebea1516486

- What `Content-Type` does fetch send when the body is a `URLSearchParams` object?

### Answer

- The browser sets **`Content-Type: application/x-www-form-urlencoded`** automatically and serializes the pairs — exactly what legacy OAuth token endpoints and form-based APIs expect.
- This is the "form POST" counterpart to `FormData` (multipart) — handy for APIs that require form encoding rather than JSON.

```javascript
await fetch("/oauth/token", {
  method: "POST",
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: "https://app.example/cb",
  }),
});
```

- [More detail on URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)

---

### Question b5263687-c27c-4ecd-8cdd-a0ea9848bfcc

- How does the global fetch in Node.js (undici) differ from browser fetch?

### Answer

- Available globally since **Node 18**, powered by **undici**, implementing the same WHATWG Fetch spec API.
- **No credential store**: there is no cookie jar — `Set-Cookie` responses are not stored or replayed automatically; handle cookies manually or with an undici `CookieAgent`.
- **No CORS enforcement** (server-side code is not restricted by same-origin policy), connections reuse a **global keep-alive dispatcher** — and in Next.js the global fetch is **patched** to add request memoization and the Data Cache.

- [More detail on Node.js global fetch](https://nodejs.org/docs/latest/api/globals.html)
- [More detail on Next.js fetch caching](https://nextjs.org/docs/app/guides/caching)

---

### Question b781b114-71f7-4982-a8eb-50705c145716

- What are the three distinct failure classes around a fetch call, and which of them reject the promise?

### Answer

- **Network-level failure → rejects with `TypeError`**: DNS failure, connection refused, CORS block, offline — no `Response` object exists at all.
- **HTTP error status → resolves**: a `404` or `500` resolves normally with `response.ok === false`; you must check `ok`/`status` yourself.
- **Body parsing failure → rejects later**: `response.json()` rejects with a `SyntaxError` when the payload is not valid JSON (e.g. an HTML error page returned by a proxy) — a different `try/catch` boundary than the request itself.

- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
- [More detail on Response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)

---

### Question 4c6f594e-fd7d-4e93-aff1-367bcf4370b0

- How do you tell apart a timeout, a user cancellation, and a hard abort when all three reject fetch with a `DOMException`?

### Answer

- **`AbortSignal.timeout()` rejections have `name === "TimeoutError"`**; manual `controller.abort()` produces **`"AbortError"`** — the name distinguishes "too slow" from "deliberately stopped".
- **`controller.abort(reason)`** and **`signal.reason`** carry a caller-supplied reason into the rejection (`err.cause`), enabling structured cause codes like `"user-navigated-away"`.
- Use the names to pick policy: retry on `TimeoutError`, silently drop deliberate `AbortError` cancellations.

- [More detail on AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout)
- [More detail on AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

### Question 16deda86-86cc-4080-bee0-b93624cdccee

- Which promise combinator fits: rendering a dashboard from 5 endpoints, racing 3 CDN mirrors, or all-or-nothing validation?

### Answer

- **`Promise.all`** — all-or-nothing: one rejection discards every successful result; best when partial data is useless.
- **`Promise.allSettled`** — dashboard pattern: each fetch settles independently; render the cards that succeeded and per-card errors for the rest.
- **`Promise.any`** — racing mirrors: first fulfillment wins; rejects with an `AggregateError` only if **all** fail.

- [More detail on Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [More detail on Promise.any()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)

---

### Question 2fbf7f59-566e-4eec-9776-fb4b43152a89

- What is the correct pattern for polling an API endpoint with fetch, and why not `setInterval`?

### Answer

- Use **recursive `setTimeout`**: schedule the next poll only after the previous response settles — no overlapping requests when the server is slower than the interval.
- Pause when the tab is hidden (**`visibilitychange`**) — background polling burns battery, data, and server quota for pixels nobody sees.
- Thread an **`AbortController`** through the loop so "stop polling" also cancels any in-flight request immediately.

```javascript
async function poll(url, interval, signal) {
  while (!signal.aborted) {
    const res = await fetch(url, { signal });
    update(await res.json());
    await new Promise((r) => setTimeout(r, interval));
  }
}
```

- [More detail on the Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [More detail on setTimeout()](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)

---

### Question 35d786e6-c4a1-4cd4-8c41-0b678c90d871

- How do you implement stale-while-revalidate for fetch in plain JavaScript (no library)?

### Answer

- Respond **instantly from a cache** while firing a **background fetch** that updates the cache for the next request.
- The user always gets sub-millisecond reads; freshness lags exactly one request — ideal for avatars, config, or slow-changing APIs.
- Optionally notify the UI when the background refresh completes so the screen eventually shows fresh data.

```javascript
const cache = new Map();

async function swrFetch(url) {
  const cached = cache.get(url);
  const refresh = fetch(url)
    .then((res) => res.json())
    .then((fresh) => {
      cache.set(url, fresh);
      return fresh;
    });
  return cached ?? (await refresh); // stale first, refresh in background
}
```

- [More detail on CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [More detail on HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

### Question afd77d91-0157-469c-89cc-e5378e6553a8

- How do you invalidate fetch responses stored in the Cache API without serving stale data to existing users?

### Answer

- **Version the cache name** (`caches.open("api-v3")`) and write new entries there — old versions become invisible to new code instantly.
- Clean up on upgrade: `caches.keys()` → `caches.delete()` everything that is not the current version.
- For surgical invalidation, **`cache.delete(url)`** single entries after a mutation, or key the URL with a content hash/tag — the manual analogue of Next.js `revalidateTag`.

- [More detail on CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [More detail on the Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

---

### Question 74f59145-ce45-4c65-b10d-197ae99dc7ed

- How do you use a stored ETag with fetch to skip re-downloading unchanged data?

### Answer

- Save the **`ETag`** response header with the payload; on the next fetch send it back as **`If-None-Match`**.
- If the resource is unchanged, the server returns **`304 Not Modified` with an empty body** — keep the cached copy; the transfer bytes are saved.
- It still costs a **full round trip** (revalidation, not elimination) — pair with `Cache-Control: max-age` so the browser skips the request entirely while fresh.

```javascript
const res = await fetch(url, {
  headers: store.etag ? { "If-None-Match": store.etag } : {},
});
if (res.status === 304) return store.data; // skip download
```

- [More detail on ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
- [More detail on HTTP conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)

---

### Question 3a72d43e-f548-4480-b8ef-7d6d473d0d84

- Two users edit the same resource; how do you prevent the second save from silently overwriting the first when using fetch?

### Answer

- **Optimistic concurrency**: read the resource's **`ETag`**, then send the update with **`If-Match: "<etag>"`**.
- The server applies the mutation **only if its current ETag matches**; otherwise it returns **`412 Precondition Failed`** — "someone changed it since you loaded, merge or retry".
- This turns blind last-write-wins into a detectable conflict without holding locks.

```javascript
const res = await fetch("/api/doc/42", {
  method: "PUT",
  headers: { "Content-Type": "application/json", "If-Match": '"v3"' },
  body: JSON.stringify(doc),
});
if (res.status === 412) promptReloadAndMerge();
```

- [More detail on If-Match](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match)
- [More detail on HTTP conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)

---

### Question 8afbb340-9208-4ad2-8372-4f0f94d21c0d

- How do you resume an interrupted large download with fetch?

### Answer

- Check **`Accept-Ranges: bytes`** (from a prior response or HEAD); then request the remainder with **`Range: bytes=<received>-`**.
- The server replies **`206 Partial Content`** with a **`Content-Range`** describing the slice; append the streamed bytes to what you already stored.
- Caveats: the resource must not change mid-download (guard with ETag / `If-Range`), and `Content-Length` on a 206 covers only the remaining bytes.

```javascript
const res = await fetch(url, {
  headers: { Range: `bytes=${receivedBytes}-` },
});
if (res.status !== 206) throw new Error("Range not supported");
const reader = res.body.getReader(); // stream onto existing blob
```

- [More detail on 206 Partial Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206)
- [More detail on Accept-Ranges](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Ranges)

---

### Question 14e29d62-dd73-4047-b8ee-6d262fb17aad

- `response.headers.get("Content-Length")` returns null on a streamed response. How do you show download progress?

### Answer

- A null `Content-Length` means **`Transfer-Encoding: chunked`** — the server itself does not know the final size (live streams, compression, dynamic rendering).
- Without a total you cannot compute a percentage; show **indeterminate progress** — spinner, bytes-downloaded counter, or transfer rate.
- If an estimate exists, do a **HEAD request first** (many servers expose `Content-Length` there) or have the backend send a custom `X-Total-Bytes` header up front.

- [More detail on Transfer-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding)
- [More detail on the Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

---

### Question 4f4d0dc7-944e-458d-831c-ec9b3ff017b0

- How do you measure how long a fetch took and where the time went, purely client side?

### Answer

- **Resource Timing** records every fetch automatically: `performance.getEntriesByName(url)` returns a `PerformanceResourceTiming` with `domainLookupStart/End`, `connectStart`, `responseStart`, `responseEnd` — a full waterfall with no manual `Date.now()` bookkeeping.
- Cross-origin entries hide detailed timings unless the server sends **`Timing-Allow-Origin`**; backend phases can annotate results via the **`Server-Timing`** header, surfaced as `entry.serverTiming`.
- The same `PerformanceObserver` machinery powers `web-vitals` and Next.js `useReportWebVitals`.

- [More detail on PerformanceResourceTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming)
- [More detail on Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing)

---

### Question 38c6b237-de1d-4262-9bc6-0e767c335773

- Why should analytics beacons fire on `pagehide`/`visibilitychange` instead of the `unload` event?

### Answer

- **`unload` is unreliable**: mobile browsers frequently skip it (bfcache restore, app switch), and registering any `unload` listener **disqualifies the page from BFCache**.
- **`visibilitychange → hidden`** fires predictably when the tab is hidden — the last moment guaranteed to run; **`pagehide`** covers actual navigation/close.
- Fire `navigator.sendBeacon()` or `fetch(..., { keepalive: true })` from there — both survive page teardown.

```javascript
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    navigator.sendBeacon("/api/analytics", JSON.stringify(session));
  }
});
```

- [More detail on the pagehide event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)
- [More detail on the Back/forward cache](https://web.dev/articles/bfcache)

---

### Question 8805d220-99b1-405e-a188-a46813b8b6a4

- What changed about fetch caching defaults in Next.js 15, and what should you audit when upgrading from 14?

### Answer

- **Next 14**: `fetch` was cached by default (`force-cache`) in App Router — many teams unknowingly served stale data.
- **Next 15**: fetch defaults to **`no-store`** unless you explicitly opt in with `cache: 'force-cache'`, `next.revalidate`, or `next.tags`; uncached `GET` Route Handlers are also no longer cached by default.
- **Upgrade audit runs both directions**: fetches that silently stopped caching (perf/billing spike on hot paths) and behavior that assumed no-store semantics but now hits explicitly-configured caches.

- [More detail on Next.js caching](https://nextjs.org/docs/app/guides/caching)
- [More detail on upgrading to Next.js 15](https://nextjs.org/docs/app/guides/upgrading)

---

### Question a9aa9e55-aa2d-479c-b776-895876317d61

- What breaks when teams monkey-patch `window.fetch` to add global interceptors?

### Answer

- **Frameworks patch it too** — Next.js replaces global fetch for memoization/Data Cache; a naive wrapper can double-apply caching, strip the patch, or wrap the wrong reference depending on load order.
- **Bodies are single-use**: an interceptor that consumes the request body (e.g. logging without `clone()`) makes the real request throw "body used already".
- **Infinite loops**: a wrapper calling the patched global instead of the saved original re-enters itself. Prefer an **explicit `apiFetch()` wrapper** in the data layer over global mutation.

- [More detail on the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
- [More detail on Next.js fetch patching](https://nextjs.org/docs/app/guides/caching)

---
