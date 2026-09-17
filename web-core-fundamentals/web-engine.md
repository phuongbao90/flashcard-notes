# Web engine

### Question 325df3ce-d033-4d7f-84e1-78b345d41707

- What are the step-by-step stages of the ***Critical Rendering Path***, and how does ***HTML/CSS parsing*** construct the layout?

### Answer

- The browser processes raw bytes from network into ***DOM*** (from HTML) and ***CSSOM*** (from CSS).
- ***HTML parsing*** is ***incremental*** (streamed), while ***CSS parsing*** is ***render-blocking*** because the CSSOM must be fully built to calculate computed styles accurately.
- DOM and CSSOM are combined into the ***Render Tree***, which contains only visible nodes (`display: none` elements and `<head>` tags are excluded).
- ***Layout (Reflow)*** calculates exact geometries (position and size) of each render tree node relative to the viewport.
- ***Paint*** fills pixels (text, colors, borders, shadows) onto visual display layers.
- ***Composite*** combines separate drawn layers on the ***GPU*** in the correct order for screen output.

---

### Question 10d9f8d1-d2c4-4dbd-882a-24c1f255d1f7

- What is the difference between ***Reflow***, ***Repaint***, and ***Compositing***, and how do modern browser engines optimize animation performance using ***GPU layers***?

### Answer

- ***Reflow (Layout)***: Occurs when geometric properties change (`width`, `height`, `margin`, `fontSize`, `top`). Recalculates geometry for affected element and descendants; most expensive operation.
- ***Repaint***: Occurs when visual properties change without affecting geometry (`color`, `background-color`, `visibility`, `box-shadow`). Skipping Reflow saves CPU time, but still runs rasterization.
- ***Compositing***: Occurs when layer-only transform/opacity properties change (`transform`, `opacity`, `filter`). Skips both Reflow and Repaint; composite layers are sent straight to GPU hardware threads.
- Creating ***GPU hardware layers*** (e.g., via `will-change: transform` or `transform: translateZ(0)`) isolates elements, preventing full page reflows during animations.
- Gotcha: Excessive ***layer promotion*** consumes significant GPU memory and can lead to severe memory pressure on mobile devices.

```css
/* Triggers Compositing directly on GPU thread (no Reflow/Repaint) */
.animated-card {
  will-change: transform;
  transition: transform 0.2s ease-out;
}
.animated-card:hover {
  transform: translateY(-4px);
}
```

---

### Question fdb47120-65f9-4bf2-b588-f278309dba83

- What causes ***Forced Synchronous Layout*** (***Layout Thrashing***) in browser engines, and how can it be diagnosed and avoided?

### Answer

- Browsers normally defer and batch layout computations until the end of the current frame or microtask.
- ***Layout Thrashing*** occurs when code reads geometric properties (e.g., `offsetWidth`, `scrollTop`, `getBoundingClientRect()`) immediately after modifying DOM styles in a loop.
- Reading geometric state forces the browser to flush queued style changes and synchronously calculate layout mid-frame, causing severe frame drops.
- Fix: Separate DOM reads from DOM writes. Read all necessary values first into variables, then batch all style mutations afterwards, or use `requestAnimationFrame` / libraries like ***FastDOM***.

```javascript
// BAD: Causes Forced Synchronous Layout in every iteration
elements.forEach((el) => {
  const width = el.offsetWidth; // FORCED LAYOUT READ
  el.style.width = `${width + 10}px`; // WRITE
});

// GOOD: Batch reads before writes
const widths = elements.map(el => el.offsetWidth); // Batch READS
elements.forEach((el, index) => {
  el.style.width = `${widths[index] + 10}px`; // Batch WRITES
});
```

---

### Question 0c404700-38cb-4948-bd3c-109470d49787

- How do `async`, `defer`, and `type="module"` script attributes alter ***HTML parsing*** and ***execution order*** in browser engines?

### Answer

- Default `<script>`: HTML parsing pauses while script is fetched over network AND executed. Blocks DOM construction completely.
- `<script async>`: Fetched in parallel with HTML parsing. Execution starts ***IMMEDIATELY*** once downloaded, pausing HTML parsing mid-stream. Execution order is ***non-deterministic*** (first downloaded executes first).
- `<script defer>`: Fetched in parallel with HTML parsing. Execution is deferred until HTML parsing is completely finished, running in exact DOM order before `DOMContentLoaded`.
- `<script type="module">`: Behaves like `defer` by default (executes after document parsing in order). Also enables ES module scoping and automatically uses strict mode.
- Gotcha: `async` scripts can execute before or after `DOMContentLoaded` depending on network latency, making them unsuitable for scripts requiring full DOM access.

```html
<!-- Non-blocking, executes sequentially after DOM parsing -->
<script defer src="/static/bundle.js"></script>

<!-- Non-blocking, executes immediately when fetched (analytics/telemetry) -->
<script async src="https://analytics.example.com/tracker.js"></script>
```

---

### Question 56e81168-30ff-4d48-8ae9-0e9e4320255c

- How does the browser ***event loop*** prioritize ***Microtasks*** vs ***Macrotasks*** (Task Queue) and ***render updates*** during a single execution frame?

### Answer

- Execution runs the current ***Call Stack*** synchronous code until completion.
- Once stack is empty, the engine drains the entire ***Microtask Queue*** completely before taking any other action (including tasks queued during microtask execution). Microtasks include: `Promise` callbacks (`.then`/`catch`/`finally`), `queueMicrotask`, `MutationObserver`, and `process.nextTick` (Node.js).
- After microtasks are exhausted, browser decides whether to run ***Render Steps*** (Style recalculation -> Layout -> Paint) based on display refresh rate (e.g. 60Hz = 16.6ms).
- `requestAnimationFrame` callbacks run immediately before rendering/painting.
- Finally, the event loop picks EXACTLY ONE ***Macrotask*** from the ***Task Queue*** (`setTimeout`, `setInterval`, `setImmediate`, I/O, user input events), executes it, and repeats the entire cycle.
- Gotcha: ***Infinite microtask recursion*** (`Promise.resolve().then(...)`) starves the event loop entirely, freezing UI rendering and user interactions without throwing stack overflow errors.

```javascript
console.log("1");

setTimeout(() => console.log("2: Macrotask"), 0);

Promise.resolve().then(() => console.log("3: Microtask"));

requestAnimationFrame(() => console.log("4: rAF"));

console.log("5");

// Output order: 1, 5, 3: Microtask, 4: rAF, 2: Macrotask
```

---

### Question 7622da40-285e-473b-a069-ce1155a85741

- How do modern V8 / JavaScript engines optimize object property access using ***Hidden Classes*** (Shapes) and ***Inline Caches*** (IC)?

### Answer

- Dynamic typing in JS makes object property lookup slow because key offsets are not fixed in memory.
- ***Hidden Classes (Shapes)***: V8 creates internal hidden transition structures sharing layout metadata across objects instantiated with identical properties in identical sequence.
- ***Transitions***: Adding properties dynamically creates new shape transitions. Reordering property initialization yields different shapes, breaking hidden class sharing.
- ***Inline Caches (IC)***: V8 caches memory offsets of property lookups directly in machine code. ***Monomorphic calls*** (always receiving same hidden class) stay fast; ***polymorphic/megamorphic calls*** slow down to generic dictionary lookups.
- Gotcha: Deleting properties with `delete obj.prop` mutates the shape into ***dictionary mode***, permanently degrading property lookup optimization.

```javascript
// GOOD: Monomorphic shape allocation (same class layout)
function Point(x, y) {
  this.x = x;
  this.y = y;
}
const p1 = new Point(1, 2);
const p2 = new Point(3, 4);

// BAD: Breaks hidden class sharing due to different initialization order
const objA = {}; objA.x = 1; objA.y = 2;
const objB = {}; objB.y = 2; objB.x = 1; // Different hidden class structure!
```

---

### Question c7bbfa22-8ef2-4d50-a9f7-d63002d5ceb7

- How does the V8 ***Garbage Collector*** manage memory across ***Generational Spaces***, and what triggers ***detached DOM tree*** memory leaks?

### Answer

- V8 splits memory into ***Young Generation*** (New Space / Nursery) and ***Old Generation*** (Old Space).
- ***Scavenger (Minor GC)***: Uses Cheney's copying algorithm to clear short-lived objects in Young Space quickly. Survived objects promote to Old Space.
- ***Major GC (Mark-Sweep-Compact)***: Scans reachable root objects (window, stack variables) and marks reachable nodes. Unmarked items are swept, and fragmented memory is compacted.
- ***Detached DOM Tree Leak***: Occurs when DOM nodes are removed from document body via `removeChild()`, but JavaScript memory retains a reference in an array, closure, or event listener.
- Retained detached DOM nodes prevent the entire subtree (including associated event handlers and internal references) from being garbage collected.

```javascript
// Memory Leak Example: Detached DOM Node
let detachedElement;

function createLeak() {
  const button = document.createElement("button");
  button.textContent = "Click Me";
  document.body.appendChild(button);
  
  // Detach from DOM
  document.body.removeChild(button);
  
  // Leak: JS variable retains reference to detached node
  detachedElement = button;
}
```

---

### Question 426f91b2-38ec-45b5-abf9-d7b49211d03c

- What are the core processes in modern browser engines (Blink/Chromium), and how does ***Process Isolation*** enforce security and stability?

### Answer

- ***Browser Process***: Top-level UI manager (address bar, back/forward buttons, tabs framing), manages network stream requests and disk storage privileges.
- ***Renderer Process***: Isolated per tab or per origin (Site Isolation). Contains Main Thread, Compositor Thread, Worker Threads, and Raster Threads. Converts HTML/CSS/JS into interactive pixels.
- ***GPU Process***: Handles hardware-accelerated drawing, composite layer synthesis, and 3D rendering pipeline requests from multiple renderer processes.
- ***Plugin / Utility Processes***: Runs isolated processes for network, audio, extensions, or storage sandboxes.
- ***Security & Stability***: Isolating renderer processes inside restricted OS sandboxes prevents a malicious website crash or exploit from corrupting host OS memory or crashing unrelated browser tabs.

---

### Question 59e17d5f-d9bc-409f-9460-75a09288c1a6

- How do the ***Main Thread***, ***Compositor Thread***, and ***Raster Threads*** collaborate inside the renderer process to render a frame?

### Answer

- ***Main Thread***: Parses HTML/CSS, executes JS, calculates computed styles, generates Layout Tree, and produces Paint Records (drawing instructions).
- ***Compositor Thread***: Receives Paint Records from Main Thread, divides page visual areas into Tiles, and schedules work across Raster Threads.
- ***Raster Threads***: Convert Paint Records into bitmaps stored in GPU memory (GPU rasterization).
- ***Off-Main-Thread Animations*** / ***Smooth Scrolling***: When user scrolls or triggers transform animations, the Compositor Thread directly manipulates compositor layers and generates frame commands without waiting for JS execution on the Main Thread.
- Gotcha: Heavy synchronous JS on Main Thread blocks event listeners and layout recalculation, but off-main-thread CSS transforms continue running smoothly.

---

### Question cc722b8b-d97d-45d4-a562-c34f62854035

- How does the ***Browser Preload Scanner*** work, and what are the exact behavioral differences between `preload`, `prefetch`, `preconnect`, and `dns-prefetch`?

### Answer

- ***Preload Scanner***: A lightweight secondary HTML parser that scans incoming byte streams for external resources (`<img>`, `<script>`, `<link rel="stylesheet">`) while the main parser is blocked by synchronous scripts.
- `rel="preload"`: High priority fetch for critical assets required in the ***CURRENT page render*** (e.g. key hero font, LCP image, critical CSS). Downloads without waiting for CSS DOM execution.
- `rel="prefetch"`: Low priority fetch for resources required in ***FUTURE navigations***. Downloaded during browser idle time and stored in HTTP cache.
- `rel="preconnect"`: Performs early ***TCP 3-way handshake***, ***TLS negotiation***, and ***DNS lookup*** for third-party origins before actual requests are fired.
- `rel="dns-prefetch"`: Performs background ***DNS resolution*** only; lower cost than `preconnect`.

```html
<!-- High priority fetch for immediate critical render asset -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

<!-- Early TLS connection to API domain -->
<link rel="preconnect" href="https://api.example.com" />

<!-- Low priority speculatively fetched script for next page -->
<link rel="prefetch" href="/next-page.js" as="script" />
```

---

### Question ecccb8ed-71cc-41b6-9b1f-7ed91d20982c

- What is the ***Back/Forward Cache (BFCache)***, what conditions disqualify a web application from BFCache eligibility, and how do lifecycle events fire?

### Answer

- ***BFCache***: In-memory snapshot of the entire DOM, JS execution state, and render state saved when navigating away from a page. Returning via back/forward button restores state instantly with 0ms render time.
- ***Disqualifying Conditions***:
  - Active `unload` event listeners registered on `window` (forces engine to skip BFCache).
  - Open `WebSocket`, `WebRTC`, or `IndexedDB` transaction locks in unclosed states.
  - Response headers containing `Cache-Control: no-store`.
- ***Lifecycle Events***:
  - Restoring from BFCache fires `pageshow` with `event.persisted === true`. It does NOT re-run `DOMContentLoaded` or inline initialization scripts.
  - Page destruction or freeze fires `pagehide` (where `visibilitychange` should be preferred over `unload`).

```javascript
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    console.log("Page restored instantly from BFCache!");
    // Re-establish real-time socket connection if needed
  }
});
```

---

### Question 55a5171c-31d2-4df0-9f7d-47d8056c78ad

- How does the browser network engine enforce ***Same-Origin Policy (SOP)***, and what exact conditions mandate a ***CORS preflight request (`OPTIONS`)***?

### Answer

- ***Origin Definition***: Scheme (protocol) + Hostname + Port MUST match exactly.
- ***SOP Protection***: Prevents code running on `https://a.com` from reading response payloads returned from `https://b.com` via `fetch`/`XMLHttpRequest` without explicit server authorization headers.
- ***Simple Requests (No Preflight)***: Request method is `GET`, `HEAD`, or `POST`, AND content-type is `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`, AND headers contain only CORS-safelisted headers.
- ***Preflight Trigger (`OPTIONS`)***:
  - Using HTTP methods like `PUT`, `DELETE`, `PATCH`.
  - Custom headers added (e.g. `Authorization`, `X-Custom-Header`).
  - `Content-Type` is `application/json`.
- Engine sends preflight `OPTIONS` request first; if `Access-Control-Allow-Origin` and `Access-Control-Allow-Methods` pass validation, the actual request is dispatched.

---

### Question e5d73d46-4058-454e-a2a9-e2dafa6a50a9

- How does browser event dispatching work across ***Capture***, ***Target***, and ***Bubble*** phases, and how do `stopPropagation()` vs `stopImmediatePropagation()` operate internally?

### Answer

- ***Capture Phase (Propagation Downward)***: Event starts at `Window` -> `Document` -> `<html>` -> ancestor nodes down to the parent of target node. Listeners registered with `{ capture: true }` fire here.
- ***Target Phase***: Event reaches target element (`event.target`). All listeners attached directly to target node execute in order of registration.
- ***Bubble Phase (Propagation Upward)***: Event bubbles up from target element back through ancestors up to `Window`. Default phase for `addEventListener`.
- `event.preventDefault()`: Cancels browser's default behavior for event (e.g. preventing form submit navigation), but does NOT stop event propagation.
- `event.stopPropagation()`: Prevents event from propagating further up or down the DOM tree, but allows remaining listeners on current element to fire.
- `event.stopImmediatePropagation()`: Prevents propagation AND immediately halts invocation of any remaining event listeners attached to the exact same element.

```javascript
const btn = document.querySelector("#myBtn");

btn.addEventListener("click", (e) => {
  e.stopImmediatePropagation();
  console.log("First handler executes");
});

btn.addEventListener("click", () => {
  // WILL NOT EXECUTE because stopImmediatePropagation was called above!
  console.log("Second handler");
});
```

---

### Question ef84d851-3d34-4fe0-b2ee-426d259f2231

- What is ***Interaction to Next Paint (INP)***, how is frame latency measured in browser engines, and how can long tasks be broken up using `scheduler.yield()` or `requestIdleCallback()`?

### Answer

- ***INP***: Core Web Vital metric measuring overall responsiveness. Measures duration from user interaction (click, tap, keypress) to when the browser next presents updated pixels on screen.
- ***INP Breakdown***: Input Delay (waiting for queued main thread tasks to clear) + Processing Time (running JS callbacks) + Presentation Delay (style, layout, paint, composite).
- ***Long Tasks***: Tasks executing continuously on main thread for > 50ms block user input processing.
- ***Yielding Control***: Use `scheduler.yield()` (or fallback to `await new Promise(res => setTimeout(res, 0))`) to yield control back to the main thread during heavy calculations, allowing user inputs to be processed mid-task.
- `requestIdleCallback()`: Schedules low-priority background tasks only when browser main thread is idle during frame deadlines.

```javascript
async function processLargeDataset(items) {
  for (let i = 0; i < items.length; i++) {
    performChunkWork(items[i]);
    
    // Yield to main thread every 50 items to prevent INP regression
    if (i % 50 === 0) {
      if ("yield" in performance.scheduler) {
        await performance.scheduler.yield();
      } else {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
}
```

---

### Question 316042f3-2520-4439-aa68-9e5db78a75f8

- How do browser engines enforce cookie security attributes (`SameSite`, `HttpOnly`, `Secure`) and ***Storage Partitioning (CHIPS)***?

### Answer

- `HttpOnly`: Prevents JavaScript DOM access via `document.cookie`. Protects session identifiers against Cross-Site Scripting (XSS) extraction.
- `Secure`: Instructs browser engine to transmit cookie ONLY over encrypted HTTPS connections; dropped over HTTP.
- `SameSite=Strict`: Cookie is never sent in cross-site requests (including top-level link navigations from third-party sites).
- `SameSite=Lax`: Cookie is withheld on cross-site subresource requests (images, fetch, iframes), but included on top-level navigation `GET` requests (e.g. following external link). Default behavior in modern engines.
- `SameSite=None; Secure`: Sends cookie cross-site; requires `Secure` flag.
- ***Storage Partitioning / CHIPS*** (Cookies Having Independent Partitioned State): Modern browser engines partition cookies and storage (`localStorage`, `IndexedDB`) by top-level site context to block cross-site tracking across third-party iframes.

---

### Question 0555bc0c-c9ee-43be-adbb-91489eed16d4

- How does the ***Service Worker lifecycle*** operate, and how do ***Cache-First*** vs. ***Stale-While-Revalidate*** strategies function inside the browser network engine?

### Answer

- ***Lifecycle Phases***: Registration -> Install (cache static assets) -> Activate (clean old caches & claim clients via `clients.claim()`) -> Fetch/Idle.
- Service Workers act as a programmable network proxy running on a separate background thread, intercepting all HTTP requests fired by the origin.
- ***Cache-First*** (Cache Fallback to Network): Checks `CacheStorage` first. If match exists, returns immediately; otherwise fetches from network and populates cache. Ideal for immutable assets (hashed JS/CSS/fonts).
- ***Stale-While-Revalidate***: Serves cached asset instantly (low latency) while simultaneously dispatching a background network fetch to update the cache for future requests. Ideal for avatars or frequently updated content.
- Gotcha: Updating a Service Worker script requires a byte-for-byte difference. The new worker stays in `waiting` state until all tabs running the old worker are closed, unless `self.skipWaiting()` is invoked during `install`.

```javascript
// Stale-While-Revalidate implementation in Service Worker
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open("dynamic-v1").then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
```

---

### Question 9ec0cbb6-666e-4868-8b3b-9d16c51fec3b

- How do ***HTTP/2 multiplexing*** and ***HTTP/3 QUIC*** address ***TCP Head-of-Line (HoL) blocking*** inside browser network engines?

### Answer

- ***HTTP/1.1 Limitation***: Browser engine limits requests to 6 parallel TCP connections per origin. Pipelining caused application-level HoL blocking (subsequent requests must wait for earlier HTTP responses to finish).
- ***HTTP/2 Multiplexing***: Binary framing layer allows interleave of multiple request/response frames over a SINGLE TCP connection. Solves application-level HoL blocking.
- ***TCP HoL Blocking in HTTP/2***: If a single TCP packet is dropped, the OS TCP stack pauses ALL multiplexed streams on that connection until the lost packet is retransmitted.
- ***HTTP/3 (QUIC over UDP)***: Replaces TCP with UDP + QUIC. Streams are independent at the transport layer; dropping a packet on Stream A does NOT block Stream B.
- Gotcha: TCP slow start means a single HTTP/2 connection takes time to ramp up bandwidth; ***domain sharding*** (splitting static assets across multiple subdomains) is an anti-pattern in HTTP/2 and HTTP/3.

---

### Question 746eb43e-9b51-4202-93ba-3032753bcc71

- How does the browser security engine enforce ***Content Security Policy (CSP)***, and how do ***Strict Nonces*** and ***Trusted Types*** prevent ***DOM XSS***?

### Answer

- ***CSP Execution***: The browser evaluates HTTP `Content-Security-Policy` header rules before fetching resources or executing scripts. Violations block execution and send report payloads to `report-uri` / `report-to`.
- `unsafe-inline` Risk: Allowing inline scripts permits attackers to execute injected `<script>` tags or `onload` attributes during XSS vulnerabilities.
- ***Strict Nonces*** (`'nonce-rAnd0m'`): Server generates a cryptographically random single-use token per response. Browser engine ONLY executes inline scripts matching the valid `nonce` attribute.
- ***Trusted Types***: Enforces browser engine validation on dangerous DOM sinks (e.g. `innerHTML`, `outerHTML`, `document.write`). Assigning un-sanitized strings throws a runtime `TypeError` directly from the DOM engine.

```html
<!-- Server sends header: Content-Security-Policy: script-src 'nonce-2726ea60' -->
<script nonce="2726ea60">
  // Executes successfully
  console.log("Trusted script executed");
</script>

<script>
  // BLOCKED by browser CSP engine because nonce is missing
  alert("XSS attempt blocked");
</script>
```

---

### Question 71746b9d-edc7-40bb-bd39-faeefb8d09ce

- Why does `localStorage` block main-thread rendering, and how do ***IndexedDB*** and ***Origin Private File System (OPFS)*** handle high-performance browser storage?

### Answer

- ***`localStorage` Limitations***: Synchronous API operating on a single key-value string store. Any read/write blocks the main thread during disk I/O, causing frame jank and INP degradation for large datasets (>5MB limit).
- ***IndexedDB***: Asynchronous transactional database engine (B-Tree indexed). Supports structured objects, blob storage, index queries, and auto-incrementing keys without blocking rendering.
- ***Origin Private File System (OPFS)***: Highly optimized private virtual filesystem sandboxed to origin. Accessing file handles via Web Workers provides an `FileSystemSyncAccessHandle` for direct, synchronous, un-buffered binary read/write locks (ideal for SQLite/Wasm databases).
- ***Storage Eviction***: Under storage pressure, browser engines dynamically evict `best-effort` origin caches, but `persisted` storage (requested via `navigator.storage.persist()`) is protected from automatic deletion.

---

### Question d773c5d0-c0c2-45f4-9329-0d19a3c681c1

- How does the browser font rendering pipeline trigger ***FOIT/FOUT***, and how do `font-display` strategies impact ***Cumulative Layout Shift (CLS)***?

### Answer

- ***FOIT (Flash of Invisible Text)***: Browser hides text for up to 3 seconds while downloading custom web font. Text remains transparent, hurting FCP and perceived performance.
- ***FOUT (Flash of Unstyled Text)***: Browser immediately displays text using a fallback system font, then swaps to custom web font once loaded. Prevents invisible text but causes layout shifts.
- `font-display: swap`: Forces instant fallback display (FOUT), followed by infinite swap period once custom font loads.
- `font-display: optional`: Gives font ~100ms block period. If font is not cached/downloaded within 100ms, fallback font is used for entire page session without swapping, preventing CLS entirely.
- Metric Impact: Abrupt font swapping changes glyph dimensions (ascent/descent), triggering Reflow and increasing ***Cumulative Layout Shift (CLS)***.

```css
@font-face {
  font-family: "CustomInter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-display: optional; /* Prevents CLS by avoiding late font swaps */
  size-adjust: 100%;       /* Normalizes fallback font dimensions */
}
```

---

### Question 0b023b5b-b77e-40ab-ad4f-c83dc5548ce1

- What is the difference between native browser ***Shadow DOM*** style/event encapsulation and ***React Virtual DOM*** reconciliation?

### Answer

- ***Shadow DOM***: Browser engine feature providing true style and DOM encapsulation. CSS rules defined inside a Shadow Root (`#shadow-root`) do not leak out, and page CSS does not penetrate inside (except inherited properties like `color`/`font`).
- ***Event Retargeting***: Events originating inside Shadow DOM are retargeted as they cross the shadow boundary so `event.target` appears as the host element to outer document listeners.
- ***React Virtual DOM***: JavaScript memory tree of React elements. Does NOT provide CSS encapsulation or native DOM isolation; reconciliation computes minimal DOM patches before calling browser DOM APIs.
- ***Synthetic Event System***: React attaches top-level event listeners to the root container (`#root`), capturing events bubbling up the native DOM tree and re-dispatching synthetic wrappers.

---

### Question fa21b6eb-4396-4dbf-802c-75ddfa9df5f0

- How does the ***Web Streams API*** prevent memory exhaustion through ***Backpressure*** management during large data transfers?

### Answer

- ***Core Streams***: `ReadableStream`, `WritableStream`, and `TransformStream` enable processing data chunk-by-chunk as it arrives over network, rather than buffering entire payloads into memory heap.
- ***Backpressure Mechanism***: If a `WritableStream` destination processes data slower than `ReadableStream` produces it, backpressure signals the reader to pause or slow down chunk emission.
- ***Internal Queuing Strategy***: Uses High Water Mark (`highWaterMark`) bounds. When internal buffer size exceeds `highWaterMark`, `controller.desiredSize` drops below zero, signaling upstream producer to wait.
- Usage: Processing large CSV/JSON uploads or video streams directly to/from `fetch` responses without causing browser heap Out-Of-Memory (OOM) crashes.

```javascript
// Fetch and stream process chunks incrementally
const response = await fetch("/large-dataset.json");
const reader = response.body.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Process Uint8Array chunk immediately (low memory footprint)
  console.log(`Received chunk size: ${value.byteLength} bytes`);
}
```

---

### Question c9f992ff-fdb4-4a9e-b3da-b8ca0d75b02a

- How does V8 partition memory between ***Stack*** and ***Heap***, and how does 32-bit ***Pointer Compression*** work in 64-bit V8 execution engines?

### Answer

- ***Call Stack***: Stores primitive values (booleans, small numbers, undefined), function call frames, and memory pointer references. Fast L1-cache friendly access with strict stack size limits (stack overflow on deep recursion).
- ***Memory Heap***: Unordered memory region storing dynamic objects, arrays, closures, and strings. Managed by V8 Garbage Collector.
- ***Smi vs HeapObject***: Small Integers (Smi) are stored directly inside 31-bit tagged pointers without heap allocation. Objects hold 64-bit pointers pointing to Heap addresses.
- ***Pointer Compression***: In 64-bit builds, 64-bit heap object pointers consume heavy cache space. V8 compresses pointers down to 32-bit relative offsets from a base 4GB V8 isolate heap base pointer.
- Benefit: Cuts JS heap memory footprint by 40% and improves CPU L1/L2 cache hit rates significantly.

---

### Question 0520b465-c6c3-45f6-bf9e-c9b16f3611f0

- How does the ***View Transitions API*** allow seamless SPA route transitions without layout flashes, and how does the browser engine capture pseudo-elements?

### Answer

- Problem: SPA routing updates DOM nodes instantly, causing jarring jumps or requiring complex custom CSS/JS animation orchestrations.
- `document.startViewTransition()`:
  1. Browser engine captures visual snapshot (`::view-transition-old`) of current page state.
  2. Pauses rendering and executes developer DOM update callback (e.g. updating React state / router DOM).
  3. Captures snapshot (`::view-transition-new`) of new DOM state.
  4. Automatically runs GPU composited cross-fade transition between old and new pseudo-element layers.
- ***Paint Holding***: Prevents Flash of Unstyled Content (FOUC) during cross-document navigation by holding current rendered frame until new document finishes initial critical paint.

```javascript
// SPA route transition using View Transitions API
function navigateToPage(newUrl) {
  if (!document.startViewTransition) {
    updateDOM(); // Fallback for unsupported engines
  }

  document.startViewTransition(() => {
    updateDOM(); // Synchronously mutate DOM for new route
  });
}
```

---

### Question 8039151b-018f-41d9-b119-d1009cc4667e

- How does ***WebAssembly (Wasm)*** execute inside browser engines, and how do `WebAssembly.Memory` buffers handle JS-to-Wasm data passing?

### Answer

- ***Compilation & Execution***: Wasm bytecode parses and compiles directly to native machine code via two-tier V8 compilers (Liftoff baseline compiler -> TurboFan optimizing compiler), executing at near-native speeds.
- ***Linear Memory***: Wasm has no direct access to JS Garbage Collector or JS objects. It operates exclusively on an array buffer (`WebAssembly.Memory`) representing a contiguous block of raw memory bytes.
- ***JS-to-Wasm Bridge***: Passing complex data structures (objects, strings, arrays) requires encoding data into UTF-8 / binary buffers in JS, writing bytes into `WebAssembly.Memory` pointers, and reading raw memory addresses inside Wasm.
- ***SharedArrayBuffer & Atomics***: Allows true multithreaded shared memory access across Web Workers and Wasm threads using atomic operations (`Atomics.wait()`, `Atomics.notify()`) for thread synchronization.
