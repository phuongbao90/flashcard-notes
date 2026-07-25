# Fetch API

### Question

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

### Question

- What are the main differences between fetch() and XMLHttpRequest (XHR) or axios?

### Answer

- Promises vs Callbacks: fetch is native and Promise-based; XMLHttpRequest uses event listeners/callbacks.
- HTTP Error Handling: axios automatically rejects on status codes outside 2xx; fetch requires manual checks (response.ok).
- Request Cancellation: fetch uses AbortController, whereas axios uses CancelToken/AbortController, and XHR uses .abort().
- Automatic JSON Transformation: axios automatically parses JSON; fetch requires calling .json().
- Upload/Download Progress: XHR and axios easily track upload progress via event listeners (onprogress). fetch does not have built-in upload progress listeners (though download progress can be read via ReadableStream).

---

### Question

- Why do response.json() or response.text() return Promises?

### Answer

- Answer: fetch yields HTTP headers as soon as they arrive. However, reading the HTTP response body occurs asynchronously as data packets stream over the network. Methods like response.json() read the body stream to completion and parse it, returning a Promise that resolves when the reading/parsing is finished.

---

### Question

- Why can a fetch response body only be read once?

### Answer

- Answer: response.body is a ReadableStream. Once consumed by methods like .json(), .text(), or .blob(), the stream is locked and emptied to prevent storing the entire payload repeatedly in memory.
- Workaround: If you need to read the body multiple times (e.g., for logging and then parsing), you must duplicate the response first using const clonedResponse = response.clone().

---

### Question

- How do you handle authentication cookies with fetch()?

### Answer

- Answer: By default (in modern browsers), fetch sends same-origin credentials (cookies, HTTP basic auth) automatically, but omits them for cross-origin requests unless specified.
- credentials option:
  - 'same-origin' (default): Sends credentials only to the same origin.
  - 'include': Always sends credentials, even on cross-origin requests (requires Access-Control-Allow-Credentials: true header from the backend).
  - 'omit': Never sends or receives credentials.

---

### Question

- What is the difference between request modes: cors, no-cors, and same-origin?

### Answer

- 'cors' (default): Standard CORS request. Expects appropriate CORS headers back from cross-origin servers.
- 'same-origin': Rejects requests made to cross-origin URLs before network dispatch.
- 'no-cors': Intended for opaque requests (e.g., sending analytics beacons or loading third-party media). The response status is 0, response type is 'opaque', and the body cannot be read via JS.

---

### Question

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

### Question

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

### Question

- How does Content Security Policy (CSP) affect fetch()?

### Answer

- Answer: The connect-src CSP directive restricts the URLs to which script interfaces like fetch, XHR, or WebSockets can send requests. If a web app attempts to fetch('https://api.external.com') without that domain whitelisted in connect-src, the browser blocks the request and throws a TypeError.

---

### Question

- How do referrer and referrerPolicy work in fetch()?

### Answer

- Answer: They control what Referer header is sent with the outbound request.
- You can configure referrerPolicy to options like 'no-referrer', 'strict-origin-when-cross-origin', or 'same-origin' to prevent sensitive URL parameters or internal domain structure from leaking to third-party endpoints.

---

### Question

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

### Question

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

### Question

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

### Question

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

### Question

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

### Question

- How does Next.js extend the native Web fetch API, and why?

### Answer

- Answer: Next.js (App Router) patches the native fetch on the server side to integrate data fetching directly with Next.js's Caching and Revalidation infrastructure.
- Key Features Added:
  - Request Memoization: Multiple fetch calls for the exact same URL and options within a single server render tree are automatically deduplicated (only 1 network request is made).
  - Data Cache: Allows caching fetched responses across server requests and deployments.
  - Revalidation: Control cache expiration via time intervals or tag-based invalidation.

---

### Question

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

### Question

- What is the difference between React Request Memoization and Next.js Data Cache?

### Answer

- Request Memoization (React): Deduplicates identical fetch requests within a single request lifecycle (e.g., rendering a single page component tree). It exists in memory and is discarded once the render finishes.
- Data Cache (Next.js): Persists data across multiple incoming user requests and deployments (e.g., stored on disk or key-value store like Redis/Vercel Data Cache).

---

### Question

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

### Question

- What is the difference between Cache-Control: no-cache and Cache-Control: no-store?

### Answer

- no-store: Strictly forbids storing any request or response in cache storage. Essential for highly sensitive data (e.g., banking details).
- no-cache: Allows storing the response in cache, but requires revalidation with the origin server (using ETag or Last-Modified) before returning the cached asset. If server returns 304 Not Modified, the cached asset is used.

---

### Question

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

### Question

### Answer

---

### Question

### Answer

---
