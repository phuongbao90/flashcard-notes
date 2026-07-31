# Fetch API

### Question 3f6000fb-f81c-4c7d-90a6-3d727f00d3d3

- How does fetch() handle HTTP error statuses (like 404 or 500)?

### Answer

- Answer: fetch() does not reject its returned Promise on HTTP error responses (e.g., 404 Not Found or 500 Internal Server Error). The promise only rejects if there is a network failure or if the request was aborted/blocked (e.g., CORS violation, offline).
- Follow-up / Correct Handling: You must check the response.ok boolean property (which is true for HTTP status codes 200–299) or inspect response.status.

```javascript
const response = await fetch("/api/data");
if (!response.ok) {
  throw new Error(`HTTP error! Status: ${response.status}`);
}
const data = await response.json();
```

---

### Question 3126e1c5-62c7-4b55-8e1d-f3c1895230be

- What are the main differences between fetch() and XMLHttpRequest (XHR) or axios?

### Answer

- Promises vs Callbacks: fetch is native and Promise-based; XMLHttpRequest uses event listeners/callbacks.
- HTTP Error Handling: axios automatically rejects on status codes outside 2xx; fetch requires manual checks (response.ok).
- Request Cancellation: fetch uses AbortController, whereas axios uses CancelToken/AbortController, and XHR uses .abort().
- Automatic JSON Transformation: axios automatically parses JSON; fetch requires calling .json().
- Upload/Download Progress: XHR and axios easily track upload progress via event listeners (onprogress). fetch does not have built-in upload progress listeners (though download progress can be read via ReadableStream).

---

### Question e9ab2a8d-0e78-4db8-b2cf-756fa977d59e

- Why do response.json() or response.text() return Promises?

### Answer

- Answer: fetch yields HTTP headers as soon as they arrive. However, reading the HTTP response body occurs asynchronously as data packets stream over the network. Methods like response.json() read the body stream to completion and parse it, returning a Promise that resolves when the reading/parsing is finished.

---

### Question f6d95357-ebea-4bdd-ba40-c4e0cf04c2a6

- Why can a fetch response body only be read once?

### Answer

- Answer: response.body is a ReadableStream. Once consumed by methods like .json(), .text(), or .blob(), the stream is locked and emptied to prevent storing the entire payload repeatedly in memory.
- Workaround: If you need to read the body multiple times (e.g., for logging and then parsing), you must duplicate the response first using const clonedResponse = response.clone().

---

### Question dadf42a4-bf11-4cdf-81e8-c0f9b5425cba

- How do you handle authentication cookies with fetch()?

### Answer

- Answer: By default (in modern browsers), fetch sends same-origin credentials (cookies, HTTP basic auth) automatically, but omits them for cross-origin requests unless specified.
- credentials option:
  - 'same-origin' (default): Sends credentials only to the same origin.
  - 'include': Always sends credentials, even on cross-origin requests (requires Access-Control-Allow-Credentials: true header from the backend).
  - 'omit': Never sends or receives credentials.

---

### Question 1f4cd7b7-8278-43fc-a0b0-5e5463cfbc02

- What is the difference between request modes: cors, no-cors, and same-origin?

### Answer

- 'cors' (default): Standard CORS request. Expects appropriate CORS headers back from cross-origin servers.
- 'same-origin': Rejects requests made to cross-origin URLs before network dispatch.
- 'no-cors': Intended for opaque requests (e.g., sending analytics beacons or loading third-party media). The response status is 0, response type is 'opaque', and the body cannot be read via JS.

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

---

### Question e59ed236-62b4-4c12-8635-4b482e23de22

- What are keepalive and sendBeacon, and how do you send telemetry data on page unload using fetch?

### Answer

- Answer: Normally, when a user navigates away or closes a tab, standard fetch() requests may be cancelled by the browser.
- Setting keepalive: true in fetch() allows the request to outlive the page session (up to browser quota limits, typically ~64KB).

```javascript
window.addEventListener("unload", () => {
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(data),
    keepalive: true,
    headers: { "Content-Type": "application/json" },
  });
});
```

- Alternative: navigator.sendBeacon(url, data) is specifically designed for fire-and-forget analytics on unload, but fetch({ keepalive: true }) supports custom HTTP methods and headers.

---

### Question 86edf5ff-19e6-441e-9926-855776d94fc0

- How does Content Security Policy (CSP) affect fetch()?

### Answer

- Answer: The connect-src CSP directive restricts the URLs to which script interfaces like fetch, XHR, or WebSockets can send requests. If a web app attempts to fetch('https://api.external.com') without that domain whitelisted in connect-src, the browser blocks the request and throws a TypeError.

---

### Question 5ec1171a-a739-46a7-a5f8-ab7459706af2

- How do referrer and referrerPolicy work in fetch()?

### Answer

- Answer: They control what Referer header is sent with the outbound request.
- You can configure referrerPolicy to options like 'no-referrer', 'strict-origin-when-cross-origin', or 'same-origin' to prevent sensitive URL parameters or internal domain structure from leaking to third-party endpoints.

---

### Question edeedf95-442c-460b-911f-d6015c333866

- Why does calling response.json() fail on a 204 No Content response, and how do you prevent it?

### Answer

- Answer: An HTTP 204 No Content or 205 Reset Content status code returns an empty body. Attempting to run response.json() on an empty string causes a SyntaxError: Unexpected end of JSON input.
- Prevention: Check response.status === 204 or verify content before parsing:

```javascript
async function parseResponse(response) {
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }
  return await response.json();
}
```

---

### Question 15e401ff-1c84-4326-9703-cf6d278741bb

- How can you track download progress with fetch() since it lacks an onprogress callback?

### Answer

- Answer: You can calculate progress by reading the response stream chunk-by-chunk using response.body.getReader() combined with the Content-Length response header:

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

---

### Question e0860ab8-a710-4cf4-a0d0-baffcfacae22

- How does fetch interact with Service Workers?

### Answer

- Service Workers can intercept every fetch() request made by a web app via the fetch event listener.

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

- This enables offline support, request caching strategies (e.g., Cache-First, Network-First), and custom request manipulation.

---

### Question 0e3ccc71-4553-4ecd-9f1c-de90bf33bc97

- How can you create a global request/response Interceptor for fetch (like Axios interceptors)?

### Answer

- Since native fetch doesn't have an interceptor API, you Monkey-Patch the global window.fetch function:

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

---

### Question d1a40f8d-8d3e-42b3-a213-79a2f3bea998

- How does Next.js extend the native Web fetch API, and why?

### Answer

- Answer: Next.js (App Router) patches the native fetch on the server side to integrate data fetching directly with Next.js's Caching and Revalidation infrastructure.
- Key Features Added:
  - Request Memoization: Multiple fetch calls for the exact same URL and options within a single server render tree are automatically deduplicated (only 1 network request is made).
  - Data Cache: Allows caching fetched responses across server requests and deployments.
  - Revalidation: Control cache expiration via time intervals or tag-based invalidation.

---

### Question 6ddf6b70-500c-4fbc-bc4c-b7e47881f694

- What are the primary cache options in Next.js fetch?

### Answer

- cache: 'force-cache' (Default in Next.js 13/14 SSG): Caches the response permanently in the Data Cache until manually revalidated.
- cache: 'no-store' (Dynamic / SSR): Opts out of caching entirely. Fetches fresh data on every request.
- Time-based Revalidation:

```javascript
// Revalidates data at most once every 60 seconds (ISR)
fetch("https://api.example.com/data", {
  next: { revalidate: 60 },
});
```

- Tag-based Revalidation:

```javascript
// Associate request with a tag
fetch("https://api.example.com/products", {
  next: { tags: ["products"] },
});
// In a Server Action or Route Handler, purge the cache on demand:
import { revalidateTag } from "next/cache";
revalidateTag("products");
```

---

### Question 42e2ac60-48ab-4536-a91d-d318d15b1b6f

- What is the difference between React Request Memoization and Next.js Data Cache?

### Answer

- Request Memoization (React): Deduplicates identical fetch requests within a single request lifecycle (e.g., rendering a single page component tree). It exists in memory and is discarded once the render finishes.
- Data Cache (Next.js): Persists data across multiple incoming user requests and deployments (e.g., stored on disk or key-value store like Redis/Vercel Data Cache).

---

### Question d28e6a55-2fdc-481a-ac1d-62026943a873

- What do the different browser cache options in standard fetch() do?

### Answer

- Answer: You can control how fetch interacts with the browser's HTTP cache using the cache init option:
  - default: Standard browser behavior. Checks HTTP cache first (respecting Cache-Control headers).
  - no-store: Bypasses browser cache entirely. Does not look in cache, does not store response in cache.
  - no-cache: Checks cache, but forces browser to send a conditional request (If-None-Match / ETag) to the server to revalidate before serving cached data.
  - reload: Ignores existing cache, fetches fresh data from server, and updates the cache with the new response.
  - force-cache: Uses cached response regardless of age/freshness. Only fetches if no cache match exists.
  - only-if-cached: Returns cached response if available; fails with network error if not in cache (only works with mode: 'same-origin').

---

### Question f8dedbef-b3c4-41ef-96c1-2832691e0119

- What is the difference between Cache-Control: no-cache and Cache-Control: no-store?

### Answer

- no-store: Strictly forbids storing any request or response in cache storage. Essential for highly sensitive data (e.g., banking details).
- no-cache: Allows storing the response in cache, but requires revalidation with the origin server (using ETag or Last-Modified) before returning the cached asset. If server returns 304 Not Modified, the cached asset is used.

---

### Question 0315756a-a39e-4764-98ad-7d7df1ba23e8

- What is the Web Cache API (window.caches), and how is it used with fetch()?

### Answer

- Answer: The Cache API (caches.open()) is a programmatic storage system for Request/Response pairs, independent of standard HTTP header caching. It is primarily used by Service Workers for offline PWA storage.

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

---

### Question 379deaab-94c8-4273-a1bf-c08dcfebf2d2

- Core Motivation: Why document.cookie Needed Replacing

### Answer

- Synchronous & Thread-Blocking: document.cookie reads/writes synchronously on the main thread, forcing disk/IPC I/O that can cause frame drops and UI jank.
- No Service Worker Support: document.cookie depends on the DOM (document), making cookies inaccessible within Web Workers and Service Workers.
- Fragile String Parsing: Standard operations require custom regex/string parsing and string formatting ("name=val; path=/; SameSite=Lax").
- No Change Detection: Reacting to cookie changes previously required polling or cross-tab messaging hacks.

---

### Question 30211d23-46ba-4e04-be4d-56e97140c0fb

- Discuss cookie store api

### Answer

- Asynchronous, non-blocking
  - executing cookie store access off the main thread.
- Service Worker Integration
- Reactive Event Model
  `cookieStore.addEventListener('cookiechange', (event) => {`

- Security & Scope Boundaries
  - Secure Context Required: Only accessible over HTTPS (or localhost).
  - HttpOnly Invisibility: Designed for security boundaries; JavaScript cannot read or mutate HttpOnly cookies via cookieStore (just as with document.cookie).
  - Same-Origin Policy: Enforces domain and path scoping restrictions strictly based on current origin semantics.

- notice:
  - Safari and Firefox lack stable default support.

---

### Question cad2c3ad-0a44-4e8c-8f14-c139dea10fc4

### Answer

---

### Question 5aa074f5-58d7-4298-98f5-95098659495b

### Answer

---

### Question c7c50e93-2e22-49fe-860c-de8dd1a51406

### Answer

---

### Question d67dfa3e-26a8-4226-8105-ca04f0ec407e

### Answer

---

### Question 9341849e-39b5-4980-98d4-7e6732d060bf

### Answer

---

### Question c2f06925-7394-4d77-9136-2bec3f694156

### Answer

---

### Question af1e64ff-de72-4472-bf4c-044ffa7be344

### Answer

---

### Question f46b261a-ec48-4383-a24c-d77bd7884b02

### Answer

---

### Question a8e52d45-ea65-4cd2-897d-b50a853968f9

### Answer

---

### Question c8829e66-d7e3-4ab0-999b-2dd1480ba605

### Answer

---

### Question ea58d599-e375-4bfa-8126-be0ed2c220e3

### Answer

---

### Question c829b98d-dfd5-4fdb-a4b0-37ade44fda2c

### Answer

---

### Question 71f0bcdd-e245-4848-a13b-82630d6a48e7

### Answer

---

### Question b1a472cc-9d68-4879-b930-8875e4c36492

### Answer

---

### Question 4017231d-78b1-4450-89a2-164530ff49f6

### Answer

---

### Question b186629c-eef5-476a-812a-cc8352a17b76

### Answer

---

### Question 80d38d58-ad4f-43bf-b8f8-31ae9433574e

### Answer

---

### Question 049904a1-4dea-48a0-b272-499cf3b31133

### Answer

---

### Question 99c7e0c9-f0ac-47c7-ab38-74a2a41c0b27

### Answer

---

### Question 2f91bc18-a8b9-418a-ba11-78fc96d4f070

### Answer

---

### Question e889f4a0-f036-4df0-b0f7-5ebea1516486

### Answer

---

### Question b5263687-c27c-4ecd-8cdd-a0ea9848bfcc

### Answer

---

### Question b781b114-71f7-4982-a8eb-50705c145716

### Answer

---

### Question 4c6f594e-fd7d-4e93-aff1-367bcf4370b0

### Answer

---

### Question 16deda86-86cc-4080-bee0-b93624cdccee

### Answer

---

### Question 2fbf7f59-566e-4eec-9776-fb4b43152a89

### Answer

---

### Question 35d786e6-c4a1-4cd4-8c41-0b678c90d871

### Answer

---

### Question afd77d91-0157-469c-89cc-e5378e6553a8

### Answer

---

### Question 74f59145-ce45-4c65-b10d-197ae99dc7ed

### Answer

---

### Question 3a72d43e-f548-4480-b8ef-7d6d473d0d84

### Answer

---

### Question 8afbb340-9208-4ad2-8372-4f0f94d21c0d

### Answer

---

### Question 14e29d62-dd73-4047-b8ee-6d262fb17aad

### Answer

---

### Question 4f4d0dc7-944e-458d-831c-ec9b3ff017b0

### Answer

---

### Question 38c6b237-de1d-4262-9bc6-0e767c335773

### Answer

---

### Question 8805d220-99b1-405e-a188-a46813b8b6a4

### Answer

---

### Question a9aa9e55-aa2d-479c-b776-895876317d61

### Answer

---
