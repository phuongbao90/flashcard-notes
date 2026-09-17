# Web Performance Optimization Case Studies

### Question e137a74e-1e1f-4aab-8895-32bdd8cd3c9b

- Case Study: A data grid with 5,000 items exhibits a 650ms INP lag during keystrokes in search filtering. What is the root cause, how do you diagnose it in DevTools, and how do you fix it?

### Answer

- **Symptom & Metric**: **INP (Interaction to Next Paint) degrades to 650ms** (poor > 500ms). Keystrokes feel unresponsive and buffered because the browser main thread is blocked.
- **Diagnostic Steps**:
  1. Open Chrome DevTools -> **Performance** panel -> record typing into the search input.
  2. Inspect the **Interactions track**: identify the long interaction bar flagged with high input delay, processing duration, or presentation delay.
  3. Inspect the **Main thread flame chart**: identify a **Long Task (>50ms)** where synchronous filtering and DOM rendering execute in the same task tick as the keyboard input event.
- **Root Cause**: Synchronous state updates couple high-priority typing input with low-priority, CPU-intensive array filtering and component re-rendering in a single event loop tick.
- **Fixes**:
  - Decouple urgent UI updates (input value) from non-urgent filtering using React's **`useDeferredValue`** or **`startTransition`**.
  - Combine deferred rendering with **list virtualization** (`@tanstack/react-virtual`) to render only visible rows.

```tsx
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);
const isStale = query !== deferredQuery;

// Urgent state update maintains 60 FPS typing responsiveness
<input value={query} onChange={(e) => setQuery(e.target.value)} />

// Non-urgent rendering yields to subsequent keystrokes
<VirtualizedTable filter={deferredQuery} />
```

- [More detail on Interaction to Next Paint (INP)](https://web.dev/articles/inp)
- [More detail on React useDeferredValue](https://react.dev/reference/react/useDeferredValue)

---

### Question 9fd34eae-96e7-4654-99f6-dc235944c3bf

- Case Study: An infinite-scroll dashboard drops from 60 FPS to 15 FPS during scrolling due to Layout Thrashing (Forced Synchronous Layout). How do you identify this in DevTools and refactor the code?

### Answer

- **Symptom & Metric**: Scroll stutter (jank) dropping to 15 FPS; frame durations exceed the 16.6ms frame budget (60 Hz).
- **Diagnostic Steps**:
  1. Open DevTools **Performance** panel, enable CPU throttling (4x), and record scrolling.
  2. Locate red warning triangles in the **Main** thread flame chart indicating **"Forced reflow"** or **"Layout Thrashing"**.
  3. The Call Tree shows alternating sequences of reading geometric properties (`offsetTop`, `clientHeight`, `getBoundingClientRect()`) followed immediately by writing styles (`element.style.top`, `element.style.height`).
- **Root Cause**: Reading layout geometry after modifying styles invalidates the layout tree and forces the browser rendering engine to synchronously recompute layout before proceeding to the next JavaScript line.
- **Fixes**:
  - **Batch DOM Operations**: Read all required geometric properties first, then write all DOM changes inside **`requestAnimationFrame`**.
  - **Replace Scroll Handlers**: Use modern **`IntersectionObserver`** or CSS **`position: sticky`** instead of JavaScript-driven scroll calculation loops.

```javascript
// ❌ Bad: Read-write interleaved inside a loop triggers forced synchronous reflow
items.forEach((el) => {
  const top = el.offsetTop; // Read (forces synchronous layout)
  el.style.top = `${top + 10}px`; // Write (invalidates layout)
});

// ✅ Good: Batch reads first, then batch writes in requestAnimationFrame
const tops = items.map((el) => el.offsetTop); // Batch all reads
requestAnimationFrame(() => {
  items.forEach((el, i) => {
    el.style.top = `${tops[i] + 10}px`; // Batch all writes
  });
});
```

- [More detail on avoiding Layout Thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [More detail on Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

### Question 0668612b-f7e0-4e11-8807-04c8b288de61

- Case Study: A Single Page Application suffers from a client-side memory leak where memory climbs by 60MB on every route transition until the tab crashes (OOM). What 3-snapshot profiling technique locates the leak, and what are the standard fixes?

### Answer

- **Symptom & Metric**: Continuous rise in JavaScript heap in Chrome Task Manager without dropping after Garbage Collection (GC); eventual browser tab crash with `Error code: Out of Memory`.
- **Diagnostic Steps (Three-Snapshot Technique)**:
  1. Open DevTools **Memory** panel -> select **Heap snapshot**.
  2. **Snapshot 1**: Take baseline snapshot on `/home`.
  3. Navigate to `/dashboard`, interact, then navigate back to `/home`. Take **Snapshot 2**.
  4. Repeat the round-trip navigation once more. Take **Snapshot 3**.
  5. Select Snapshot 3, change the perspective dropdown to **"Objects allocated between Snapshot 1 and 2"**.
  6. Filter by `Detached` to locate **Detached HTMLDivElement** or uncollected closures, and inspect the **Retainers** tree to find the holding reference.
- **Root Causes & Fixes**:
  - **Uncleaned Global Event Listeners**: Missing return cleanup in `useEffect` when binding to `window`, `document`, or message buses. Always return an unbind callback.
  - **Retained Timers & Subscriptions**: Uncleared `setInterval` or active RxJS/WebSocket subscriptions holding component instances in their closure scope.
  - **Module-Level Caches**: Retaining component callbacks or state references in global module-level arrays/maps without using `WeakMap` or `WeakSet`.

```tsx
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", handleResize);

  // Mandatory cleanup: prevents detached DOM retention
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

- [More detail on Chrome DevTools Memory profiling](https://developer.chrome.com/docs/devtools/memory-problems)
- [More detail on React useEffect cleanup](https://react.dev/reference/react/useEffect#cleaning-up-an-effect)

---

### Question 9d1681ee-20ca-4a31-830e-7e7fc59af9ba

- Case Study: An e-commerce product page scores a poor 0.45 Cumulative Layout Shift (CLS) on mobile devices due to dynamic promotional banners and review widgets. How do you identify shifting elements and eliminate CLS?

### Answer

- **Symptom & Metric**: **CLS is 0.45** (Good threshold is ≤ 0.10). Content jumps down after page load, causing accidental mis-clicks and failed Core Web Vitals audits.
- **Diagnostic Steps**:
  1. In Chrome DevTools **Performance** panel, record page load with mobile device emulation and 4x CPU throttling.
  2. Inspect the **Experience track**: locate red **Layout Shift** flags.
  3. Click a layout shift record -> examine the **Summary** tab to inspect the exact **Moved from** and **Moved to** coordinates and the culprit DOM node.
- **Root Cause**: Asynchronously fetched content (promotional banners, ad slots, rating widgets) mounts without pre-allocated dimensional space in the initial CSS layout.
- **Fixes**:
  - **Reserve Space with CSS `min-height` / `aspect-ratio`**: Pre-allocate containers with explicit sizing matching the incoming widget dimensions.
  - **Skeleton Placeholders**: Render placeholder skeletons matching final dimensions during data loading.
  - **Non-Shifting Positioning**: Place promotional banners in fixed header slots, overlays, or below the initial fold rather than dynamically pushing critical content down.

```css
/* Reserve layout space for asynchronous client-loaded rating widget */
.review-widget-container {
  min-height: 120px;
  contain: layout size; /* Isolates internal layout from affecting external document */
}
```

- [More detail on Cumulative Layout Shift (CLS)](https://web.dev/articles/cls)
- [More detail on optimizing CLS](https://web.dev/articles/optimize-cls)

---

### Question 445f6ca4-7c0e-4811-a20c-48953ebdbe4a

- Case Study: A Next.js App Router SSR application exhibits a severe TTFB spike from 150ms to 4,200ms during peak traffic, pegging server CPU at 100%. How do you identify the server bottleneck and re-architect the route?

### Answer

- **Symptom & Metric**: **Time to First Byte (TTFB) exceeds 4 seconds** under concurrent load; Node.js process CPU is pinned at 100% while upstream database CPU is idle (< 20%).
- **Diagnostic Steps**:
  1. Profile the Node.js production server with **`clinic.js flame`** or Node.js CPU profiler (`--cpu-prof`).
  2. Inspect OpenTelemetry / APM traces to evaluate the time spent in upstream HTTP fetching versus synchronous JavaScript execution.
  3. Flamegraph reveals the main thread is blocked by **synchronous JSON serialization/parsing** (`JSON.parse` of 20MB upstream payloads) or sequential `await` waterfalls in root layouts.
- **Root Cause**: Monolithic SSR where the server waits for all slow upstream microservices before streaming any HTML bytes, while massive JSON parsing starves the Node.js event loop.
- **Fixes**:
  - **Streaming SSR with Suspense**: Stream the initial HTML shell immediately (< 150ms TTFB) and stream slow components as chunks using `<Suspense fallback={<Skeleton />}>`.
  - **Granular Server Caching**: Cache expensive fetch calls with Next.js `unstable_cache` or `fetch(url, { next: { revalidate: 300 } })`.
  - **Payload Truncation**: Request only required projection fields from upstream services to minimize JSON parsing overhead.

```tsx
export default async function ProductPage({ params }: { params: { id: string } }) {
  return (
    <main>
      {/* Fast critical shell rendered & streamed immediately (TTFB < 150ms) */}
      <ProductHeader id={params.id} />

      {/* Slow upstream data streamed in chunks without blocking initial TTFB */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <SlowReviewsSection id={params.id} />
      </Suspense>
    </main>
  );
}
```

- [More detail on Time to First Byte (TTFB)](https://web.dev/articles/ttfb)
- [More detail on Next.js Streaming with Suspense](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)

---

### Question 01fd7fce-00e1-4b77-aa70-dd8eb44d4bfa

- Case Study: A React application achieves fast visual rendering (FCP 1.1s), but users cannot interact with buttons or navigation menus for 4.5 seconds on mobile devices (TBT > 3,000ms). How do you diagnose and fix this hydration bottleneck?

### Answer

- **Symptom & Metric**: Fast FCP/LCP but extreme **Total Blocking Time (TBT > 3s)** and poor initial INP; page displays an "uncanny valley" where UI looks interactive but fails to respond to taps.
- **Diagnostic Steps**:
  1. Run Chrome DevTools **Coverage** tab: inspect unused JavaScript percentage on initial load.
  2. Run **`@next/bundle-analyzer`** or `source-map-explorer` to inspect bundle chunk composition.
  3. Profile CPU in DevTools Performance panel under 4x CPU throttling: observe a continuous multi-second **"Hydrate"** or **"Compile / Evaluate Script"** task blocking the main thread.
- **Root Cause**: Shhipping a monolithic client bundle (> 1.5MB gzip) on initial load; entire component tree hydrates synchronously on the main thread, including hidden modals, charts, and administrative drawers.
- **Fixes**:
  - **Dynamic Imports**: Lazy-load heavy, non-critical client components using `next/dynamic` with `ssr: false` for client-only widgets (e.g., Monaco editor, Chart.js, rich text editors).
  - **Tree-Shaking Optimization**: Eliminate barrel file imports (`import { Icon } from 'lucide-react'`) or configure `optimizePackageImports` in `next.config.js`.
  - **Server Component Conversion**: Convert static leaf components back to Server Components to remove their JavaScript from client bundles entirely.

```tsx
import dynamic from "next/dynamic";

// Heavy chart widget (~250KB) excluded from initial bundle & hydration pass
const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

- [More detail on Total Blocking Time (TBT)](https://web.dev/articles/tbt)
- [More detail on Next.js dynamic imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)

---

### Question 9f91aefe-9664-46ee-aca6-9765d5c21f9a

- Case Study: In a collaborative trading app, receiving high-frequency WebSocket price updates causes input lag and typing stutter inside the order form. How do you identify the React Context re-render cascade and fix it?

### Answer

- **Symptom & Metric**: High INP (> 400ms); typing drops characters whenever a price update arrives; React DevTools Profiler shows dozens of unaffected components rendering simultaneously.
- **Diagnostic Steps**:
  1. Open **React DevTools Profiler** -> Settings -> Check **"Record why each component rendered while profiling"**.
  2. Start recording, type into the order form while price ticks arrive, stop recording.
  3. Inspect the flamegraph: all form inputs, sidebars, and navbars re-render with reason: *"Context changed"*.
- **Root Cause**: Storing high-frequency volatile state (real-time price updates) together with low-frequency state (user inputs, user auth) inside a single React Context provider. Whenever the price updates, all consumers of the context re-render regardless of whether they consume the price.
- **Fixes**:
  - **Split Contexts**: Separate volatile high-frequency state into its own dedicated context provider.
  - **Atomic State / Selectors**: Migrate volatile state to external atomic stores (e.g. **Zustand**, **Jotai**) where components subscribe strictly to selected slices (`useStore(state => state.symbolPrice)`).

```tsx
// ❌ Bad: Monolithic context causes form re-render on price change
const GlobalContext = createContext({ prices, user, orderForm });

// ✅ Good: Atomic selector subscription prevents order form re-render
import { create } from "zustand";

export const useMarketStore = create((set) => ({
  prices: {},
  updatePrice: (sym, val) => set((s) => ({ prices: { ...s.prices, [sym]: val } })),
}));

// Only re-renders when AAPL price changes; order inputs never re-render!
function TickerDisplay({ symbol }: { symbol: string }) {
  const price = useMarketStore((state) => state.prices[symbol]);
  return <div>{symbol}: {price}</div>;
}
```

- [More detail on React Context performance](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)
- [More detail on Zustand state selectors](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)

---

### Question 84ad64fe-455e-42ef-b22f-e321a6aba786

- Case Study: A user profile page takes 4.2 seconds to load because nested React components trigger sequential waterfall network requests. How do you diagnose request waterfalls in DevTools and eliminate them?

### Answer

- **Symptom & Metric**: Excessive page load time; browser Network tab shows a "staircase" pattern where API calls fire only after preceding calls finish.
- **Diagnostic Steps**:
  1. Open Chrome DevTools **Network** tab -> sort by "Waterfall".
  2. Observe chronological order: `/api/user` (takes 800ms) finishes -> triggers `/api/organizations` (takes 900ms) -> finishes -> triggers `/api/permissions` (takes 1,200ms).
  3. Review component code: Parent component fetches user, conditionally renders Child when user is truthy; Child fetches orgs, renders Grandchild which fetches permissions ("Fetch-on-render" anti-pattern).
- **Root Cause**: Data dependencies coupled to UI rendering hierarchy; child components cannot discover or fetch their data until their parents complete fetching and render.
- **Fixes**:
  - **Server-Side Parallel Fetching**: Colocate data requirements at the page/route level in Server Components using `Promise.all`.
  - **Preloading Pattern**: Trigger data fetches as early as route navigation initiates using React Query `prefetchQuery` or Next.js layout data loaders.

```tsx
// ✅ Good: Parallel fetch at route level resolves in MAX(latency), not SUM(latency)
export default async function ProfilePage({ params }: { params: { id: string } }) {
  const [user, orgs, permissions] = await Promise.all([
    fetchUserData(params.id),
    fetchUserOrgs(params.id),
    fetchUserPermissions(params.id),
  ]);

  return <ProfileView user={user} orgs={orgs} permissions={permissions} />;
}
```

- [More detail on network waterfalls](https://web.dev/articles/waterfall)
- [More detail on Next.js parallel data fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#parallel-data-fetching)

---

### Question 53791719-3560-409c-9530-f6cd8466f66c

- Case Study: A high-traffic flash sale causes an edge cache entry to expire, resulting in a Cache Stampede (Thundering Herd) that crashes the backend database. How do you identify and mitigate this failure mode?

### Answer

- **Symptom & Metric**: Sudden avalanche of HTTP 500/503 errors and connection pool exhaustion on the origin database exactly at cache TTL expiration.
- **Diagnostic Steps**:
  1. Inspect edge CDN logs (Cloudflare, Fastly, CloudFront): cache HIT ratio plummets to 0% for the hot URL at a specific timestamp.
  2. Inspect origin server logs: thousands of concurrent requests for the exact same resource arrive within a 200ms window.
  3. Database APM shows CPU at 100% with lock contention and exhausted connection pools.
- **Root Cause**: When a cached item expires under high traffic, all incoming concurrent requests encounter a cache MISS simultaneously and attempt to regenerate the resource in parallel on origin systems.
- **Fixes**:
  - **Stale-While-Revalidate**: Serve the stale cached content immediately while a single asynchronous background request refreshes the cache.
  - **Request Coalescing (Single-Flight)**: Collapse multiple concurrent requests for the same key into a single in-flight Promise on the server.
  - **Probabilistic Early Expiration (XFetch)**: Recompute cache entries probabilistically before they officially expire.

```typescript
// In-memory request coalescing (Single-Flight pattern in Node.js)
const inflightRequests = new Map<string, Promise<any>>();

export async function fetchWithCoalescing(key: string, fetcher: () => Promise<any>) {
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key); // Share in-flight promise with all concurrent callers
  }
  const promise = fetcher().finally(() => {
    inflightRequests.delete(key);
  });
  inflightRequests.set(key, promise);
  return promise;
}
```

- [More detail on HTTP Stale-While-Revalidate](https://web.dev/articles/stale-while-revalidate)
- [More detail on Cache Stampede mitigation](https://en.wikipedia.org/wiki/Cache_stampede)

---

### Question 5cb3c81e-575e-490d-8265-d2b1f211f886

- Case Study: A website's performance degrades after marketing installs 15 third-party analytics, tracking, and A/B testing scripts via Google Tag Manager (GTM). How do you isolate their overhead and prevent main-thread degradation?

### Answer

- **Symptom & Metric**: Long tasks (> 150ms) during page load; degraded INP, LCP, and TBT; mobile devices heat up and drop frames.
- **Diagnostic Steps**:
  1. Open Chrome DevTools **Performance** panel -> click **Capture settings** (gear icon) -> check **"Enable advanced paint instrumentation"**.
  2. In the recording summary, inspect the **Bottom-Up** tab and group by **Domain**.
  3. View third-party scripts (e.g. `hotjar.com`, `googletagmanager.com`, `facebook.net`) consuming 60-80% of total JavaScript execution time.
  4. Run Chrome DevTools with **Request Blocking** to test page performance without third-party domains.
- **Root Cause**: Third-party scripts execute directly on the browser's single main thread, competing with application code for CPU time, DOM parsing, and network bandwidth.
- **Fixes**:
  - **Offload to Web Workers (Partytown)**: Run resource-intensive tracking libraries (Google Analytics, Mixpanel, Segment) inside a Web Worker.
  - **Server-Side Tagging**: Forward events from a lightweight first-party endpoint to a Server-Side GTM container instead of loading 15 vendor SDKs in the browser.
  - **Defer Non-Critical Scripts**: Load scripts with `next/script` using `strategy="lazyOnload"` or after user interaction.

```tsx
import Script from "next/script";

// Executes during idle browser time rather than blocking critical path
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
  strategy="lazyOnload"
/>
```

- [More detail on loading third-party JavaScript](https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript)
- [More detail on Partytown Web Worker execution](https://partytown.builder.io/)

---

### Question ecc9a5b1-1253-4226-9c4a-61a2b8bba11a

- Case Study: A client-side data analytics dashboard freezes for 3.5 seconds with a "Page Unresponsive" browser dialog when processing 100,000 tabular records. How do you profile and eliminate this computation bottleneck?

### Answer

- **Symptom & Metric**: Browser UI freezes completely; cursor shows loading spinner; user inputs are ignored; DevTools shows a single monolithic Long Task lasting > 3,000ms.
- **Diagnostic Steps**:
  1. Open DevTools **Performance** panel and record the action.
  2. Locate the massive red Long Task block.
  3. Expand the **Main** thread call tree: identify deeply nested synchronous array operations (`reduce`, `sort`, `filter`, or regex matching) executing over 100k items.
- **Root Cause**: Heavy synchronous CPU calculations run on the browser's single main thread, blocking event loop ticks, rendering, and input processing.
- **Fixes**:
  - **Dedicated Web Worker**: Move the sorting, aggregation, and calculation completely off the main thread into a Web Worker via `comlink` or native `Worker`.
  - **Time-Slicing / Cooperative Multitasking**: If running on main thread, chunk the data and yield to the event loop using `scheduler.yield()` or `setTimeout(0)`.

```javascript
// Yielding execution using the modern Scheduler API
async function processLargeDataset(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    results.push(heavyTransform(items[i]));

    // Periodically yield control back to the main thread every 50ms
    if (i % 500 === 0 && "scheduler" in window && scheduler.yield) {
      await scheduler.yield(); // Allows browser to handle clicks and render frames
    }
  }
  return results;
}
```

- [More detail on optimizing long tasks](https://web.dev/articles/optimize-long-tasks)
- [More detail on the Scheduler API scheduler.yield()](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)

---

### Question 3356a08f-e825-44f1-81a1-27670130f7e5

- Case Study: A client-side rendered (CSR) Single-Page App suffers from an LCP of 5.8 seconds on 4G connections. How do you audit the 4 sub-parts of LCP and systematically optimize each?

### Answer

- **Symptom & Metric**: Largest Contentful Paint (LCP) is 5.8s (Good is ≤ 2.5s). Users stare at a blank white screen or loading spinner for seconds.
- **Diagnostic Steps**:
  1. Open DevTools **Performance** panel -> click on the **LCP** marker in the "Timings" track.
  2. Inspect the breakdown of the 4 LCP sub-parts in the Summary panel:
     - **Time to First Byte (TTFB)**
     - **Resource Load Delay**
     - **Resource Load Duration**
     - **Element Render Delay**
- **Root Cause Analysis & Fixes by Sub-Part**:
  - **Resource Load Delay (Largest offender in CSR)**: The browser must download the HTML shell, download 2MB of JS, execute the bundle, and only then start fetching the hero image or data. Fix: Preload the LCP image in the raw HTML `<link rel="preload" as="image" href="..." fetchpriority="high">` so download begins before JS executes.
  - **Element Render Delay**: Image downloads, but React waits for client authentication or auxiliary state before mounting the `<img>`. Fix: Render critical hero markup immediately in SSR/SSG without client state dependencies.
  - **Resource Load Duration**: Huge uncompressed assets. Fix: Convert images to modern AVIF/WebP and serve from edge CDN.
  - **TTFB**: Slow origin server response. Fix: Edge caching and CDN distribution.

- [More detail on optimizing LCP](https://web.dev/articles/optimize-lcp)
- [More detail on the fetchpriority attribute](https://web.dev/articles/fetch-priority)

---

### Question 81ebf253-056c-46b4-b686-88943806c755

- Case Study: In an infinite scroll list containing 30,000 DOM nodes, browser scrolling stutters and RAM reaches 1.2GB. How do you diagnose DOM bloat and implement DOM virtualization?

### Answer

- **Symptom & Metric**: Frame rates drop to 20 FPS; DevTools Performance shows expanding Style Recalculation and Layout phases on every interaction; high DOM node count.
- **Diagnostic Steps**:
  1. Open DevTools **Performance Monitor** tab (Esc -> More tools -> Performance monitor).
  2. Observe **"DOM Nodes"** count escalating from 800 to 35,000+ as the user scrolls.
  3. Observe **"JS Heap size"** and **"CPU usage"** remaining high even when idle.
- **Root Cause**: Appending newly fetched items to the DOM without removing off-screen nodes causes DOM node bloat. The browser must calculate layout and style recalculations for all 35,000 nodes on every DOM modification.
- **Fixes**:
  - **Virtual Windowing**: Only render the items currently visible within the viewport (plus an overscan buffer), replacing the rest with empty spacer heights (`@tanstack/react-virtual` or `react-window`).
  - **CSS content-visibility**: Apply `content-visibility: auto` to off-screen list cards to allow the browser engine to skip layout and rendering for offscreen elements.

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated item height in px
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              height: `${virtualRow.size}px`,
            }}
          >
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [More detail on TanStack Virtual](https://tanstack.com/virtual/latest)
- [More detail on DOM size impact on interactivity](https://web.dev/articles/dom-size-and-interactive)

---

### Question 6b15aaa5-d4d0-459b-b9e2-0ee1bc07e07d

- Case Study: A web application experiences severe Cumulative Layout Shift (CLS) and Flash of Invisible Text (FOIT) when loading custom web fonts over slow networks. How do you diagnose and eliminate font-loading layout shifts?

### Answer

- **Symptom & Metric**: Text is invisible for 2–3 seconds on load (FOIT), and when the custom font swaps in, paragraphs wrap to new lines, shifting the layout below (CLS > 0.2).
- **Diagnostic Steps**:
  1. In Chrome DevTools **Network** tab, throttle to "Fast 3G" and reload.
  2. Inspect text rendering: observe empty whitespace before font file finishes downloading.
  3. In the **Performance** panel, look for a red **Layout Shift** marker that coincides with the completion of the `.woff2` network request.
- **Root Cause**: Custom web fonts take time to download. If `font-display` is not configured, browsers hide text (FOIT). When the font loads, differences in x-height, cap-height, and character width between fallback system fonts and the custom font cause reflow.
- **Fixes**:
  - **Self-Host & Preload**: Self-host fonts in modern WOFF2 format on the same origin (or CDN) and preload in `<head>`: `<link rel="preload" href="/fonts/brand.woff2" as="font" type="font/woff2" crossorigin>`.
  - **Next.js `next/font`**: Use `next/font/google` or `next/font/local` which automatically hosts fonts locally and inlines CSS font metrics.
  - **CSS Font Metric Overrides**: Tune fallback font metrics using `size-adjust`, `ascent-override`, and `descent-override` so fallback fonts occupy identical geometric dimensions as the custom font.

```css
@font-face {
  font-family: 'CustomBrandFontFallback';
  src: local('Arial');
  /* Eliminates CLS by matching Arial dimensions to CustomBrandFont */
  size-adjust: 102.5%;
  ascent-override: 95%;
  descent-override: 24%;
}

@font-face {
  font-family: 'CustomBrandFont';
  src: url('/fonts/custom-brand.woff2') format('woff2');
  font-display: swap;
}
```

- [More detail on optimizing web fonts](https://web.dev/articles/optimize-webfonts)
- [More detail on Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)

---

### Question d281e2b2-57d6-4b1c-9d11-09056eaa4ee5

- Case Study: Fast typing or rapid tab-switching triggers out-of-order race conditions where an earlier slow network response overwrites newer data. How do you implement request cancellation and avoid stale state updates?

### Answer

- **Symptom & Metric**: Inconsistent UI state; user searches for "react", then immediately searches for "next", but the slower "react" response finishes last and displays outdated results.
- **Diagnostic Steps**:
  1. Open DevTools **Network** tab -> select "Slow 3G".
  2. Type two queries in rapid succession.
  3. Observe network response timings: the first request finishes after the second request, and inspecting application state confirms the UI displays data from request #1.
- **Root Cause**: Asynchronous `fetch` calls complete nondeterministically. Earlier network requests that resolve after later requests execute their `setState` callback, overwriting newer state.
- **Fixes**:
  - **AbortController**: Bind each request to an `AbortController` signal and abort preceding in-flight requests when a new action begins or when the component unmounts.
  - **Query Client Deduplication**: Use TanStack Query or SWR, which manage query keys and automatically cancel or discard outdated query promises.

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function search() {
    try {
      const res = await fetch(`/api/search?q=${query}`, { signal: controller.signal });
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Fetch error:", err);
      }
    }
  }

  if (query) search();

  // Aborts active request when query changes or component unmounts
  return () => controller.abort();
}, [query]);
```

- [More detail on AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [More detail on TanStack Query Query Cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)

---

### Question c53e4662-76a3-4521-8a63-679d543ae2b7

- Case Study: In a product catalog with 60 items, each card triggers its own `/api/pricing?id=X` fetch on mount, causing browser socket stalling and 504 gateway timeouts under HTTP/1.1. How do you diagnose and fix this N+1 frontend problem?

### Answer

- **Symptom & Metric**: High network latency; browser Network tab shows multiple requests in a **"Queueing"** or **"Stalled"** state for hundreds of milliseconds.
- **Diagnostic Steps**:
  1. Open DevTools **Network** tab -> check the "Timing" tab for individual pricing requests.
  2. Observe 6 requests in "Downloading" status while 54 requests sit in **"Stalled"** or **"Waiting for connection"**.
  3. Review protocol: HTTP/1.1 enforces a strict limit of **6 concurrent TCP connections per origin** in modern browsers.
- **Root Cause**: Component-driven N+1 fetching anti-pattern; leaf components independently initiate network requests on mount instead of coordinating data retrieval.
- **Fixes**:
  - **Batching Endpoint**: Expose a batched endpoint `/api/pricing?ids=1,2,3...` and fetch all pricing in a single network roundtrip at the parent level.
  - **Client-Side DataLoader**: Implement an in-memory batching queue that collects requests occurring in the same event loop tick into a single batched request.
  - **HTTP/2 or HTTP/3 Multiplexing**: Ensure the server supports HTTP/2+ to multiplex concurrent streams over a single TCP connection.

```typescript
// Simple micro-task batcher for component-level requests
let pendingIds: string[] = [];
let batchPromise: Promise<Record<string, number>> | null = null;

export function getBatchPrice(id: string): Promise<number> {
  pendingIds.push(id);

  if (!batchPromise) {
    batchPromise = Promise.resolve().then(async () => {
      const idsToFetch = [...pendingIds];
      pendingIds = [];
      batchPromise = null;

      const res = await fetch(`/api/prices?ids=${idsToFetch.join(",")}`);
      return res.json();
    });
  }

  return batchPromise.then((prices) => prices[id]);
}
```

- [More detail on resource prioritization and socket limits](https://web.dev/articles/resource-prioritization)
- [More detail on DataLoader batching pattern](https://github.com/graphql/dataloader)

---

### Question f5b61139-c64a-48e8-938a-c33b952e4461

- Case Study: A complex web application suffers from a 160ms "Recalculate Style" freeze on hover states due to deeply nested CSS selectors and large DOM tree depth. How do you identify the selector bottleneck and optimize style calculation?

### Answer

- **Symptom & Metric**: Noticeable lag on mouse hover over menu items or cards; DevTools Performance recording displays repetitive purple **"Recalculate Style"** tasks exceeding 100ms.
- **Diagnostic Steps**:
  1. Open DevTools **Performance** panel -> record while hovering over UI elements.
  2. Click on the purple **"Recalculate Style"** task.
  3. Look at the Summary tab: check **"Elements Affected"** (e.g. 12,000 nodes re-evaluated for a single hover event).
  4. Enable **"CSS Selector Stats"** in DevTools Performance settings to view which selectors took the longest to match.
- **Root Cause**: High selector complexity combined with deep DOM tree depth. Selectors like `body.theme-dark div.container > div:nth-child(2n) ul li a:hover` require the browser CSS engine to traverse ancestor chains across thousands of DOM nodes.
- **Fixes**:
  - **Flatten Selectors**: Use flat, single-class selectors (Utility classes or BEM naming conventions) so selector matching resolves in O(1) time without ancestor crawling.
  - **CSS Containment**: Apply `contain: style layout;` or `content-visibility: auto;` to isolate subtrees, preventing style recalculations from propagating across the global document.

```css
/* ❌ Bad: Engine crawls ancestors across entire DOM tree */
body.theme-dark #main-wrapper .card-list div > ul > li a:hover {
  color: #3b82f6;
}

/* ✅ Good: Direct class target with CSS containment */
.nav-link:hover {
  color: #3b82f6;
}

.card-list {
  contain: layout style; /* Stops style recalculation from leaking outward */
}
```

- [More detail on reducing scope and complexity of style calculations](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations)
- [More detail on CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment)

---

### Question f3570d53-09cc-4249-be13-81845f177433

- Case Study: A crypto dashboard crashes browser tabs after 3 hours of real-time trading due to memory accumulation in a WebSocket listener. How do you diagnose and fix buffer-retention memory leaks?

### Answer

- **Symptom & Metric**: Browser tab memory continuously grows from 90MB to 2.8GB over several hours; garbage collection pauses grow longer and UI freezes.
- **Diagnostic Steps**:
  1. In Chrome DevTools **Memory** panel, take a Heap snapshot after 10 minutes, and another after 60 minutes.
  2. Select the second snapshot -> compare with the first snapshot.
  3. Inspect constructor list: notice explosive growth in `Array`, `Object`, or `Closure` counts holding WebSocket message payloads.
  4. Retainer tree shows an unbounded array or an outer closure variable retaining reference to every incoming message.
- **Root Cause**: WebSocket message handler appends incoming data to an unbounded in-memory array or captures variables inside closures that are never dereferenced or garbage-collected.
- **Fixes**:
  - **Circular Ring Buffer**: Maintain a fixed maximum capacity for streaming data (e.g. keep only latest 500 records), evicting oldest elements as new ones arrive.
  - **Lifecycle Disconnect**: Always close the WebSocket (`socket.close()`) and remove listeners inside component unmount cleanup functions.

```typescript
// Fixed-capacity sliding window prevents unbounded memory growth
const MAX_BUFFER_SIZE = 500;

function handleIncomingTick(newTick: MarketTick) {
  setMarketTicks((prevTicks) => {
    const updated = [...prevTicks, newTick];
    return updated.length > MAX_BUFFER_SIZE
      ? updated.slice(updated.length - MAX_BUFFER_SIZE)
      : updated;
  });
}
```

- [More detail on fixing memory leaks in JavaScript](https://developer.chrome.com/docs/devtools/memory-problems)
- [More detail on WebSocket connection lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close)

---

### Question 59ebfb72-5b9c-4670-b0b4-61677357ce67

- Case Study: A web application triggers redundant client-side API requests on every route switch because it lacks HTTP and client-side caching. How do you configure HTTP Cache-Control and client-side query caching?

### Answer

- **Symptom & Metric**: 80% of network requests are redundant repeats of identical resources; increased mobile battery and data consumption; server load is unnecessarily high.
- **Diagnostic Steps**:
  1. Open Chrome DevTools **Network** tab -> navigate between views.
  2. Observe identical API requests (`/api/user/settings`, `/api/config`) returning `200 OK` (full response body) instead of `304 Not Modified` or `(from disk cache)`.
  3. Check Response Headers: absence of `Cache-Control` or presence of misconfigured `no-store` on static or slow-changing data.
- **Root Cause**: Absence of client-side cache abstraction (like TanStack Query / SWR) and missing or incorrect HTTP caching headers on backend responses.
- **Fixes**:
  - **HTTP Caching Headers**: Serve API responses with `Cache-Control: private, max-age=60, stale-while-revalidate=300` and `ETag` headers.
  - **Client Cache Configuration**: Configure query clients with sensible `staleTime` (e.g. 5 minutes) so that navigating back to recently visited views reuses memory cache instantly with zero network requests.

```tsx
// TanStack Query configuration: prevents redundant fetches on view transitions
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes (no background fetch)
      gcTime: 1000 * 60 * 30, // Retain unused data in memory cache for 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

- [More detail on HTTP caching](https://web.dev/articles/http-cache)
- [More detail on TanStack Query caching terms](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)

---

### Question 24393449-eeff-4495-9ca6-49862ccb3b88

- Case Study: A Next.js e-commerce application suffers from an LCP delay because the hero image is hidden behind a CSS `background-image` property and lacks fetch prioritization. How do you diagnose and fix the preload scanner blind spot?

### Answer

- **Symptom & Metric**: Largest Contentful Paint (LCP) takes 4.1s over 4G networks; hero image download begins very late in the waterfall.
- **Diagnostic Steps**:
  1. Open DevTools **Network** tab and **Performance** panel.
  2. Trace the start time of the hero image download: notice that the image request does not start until *after* the CSS stylesheet is downloaded and parsed.
  3. Inspect element: the hero image is applied via CSS rule `.hero-banner { background-image: url('/banner.webp'); }`.
- **Root Cause**: The browser's **Preload Scanner** parses raw HTML tokens ahead of CSS/DOM tree construction. Images in CSS `background-image` are invisible to the Preload Scanner; the browser only discovers them during the Layout phase after CSSOM construction.
- **Fixes**:
  - **HTML Image Tag with High Priority**: Replace CSS background images with an explicit `<img>` tag or Next.js `<Image priority fetchPriority="high">`.
  - **Preload Link in HTML Head**: Add `<link rel="preload" as="image" href="..." fetchpriority="high">` inside `<head>` so the preload scanner initiates the network request immediately during initial HTML streaming.

```html
<!-- Head preload triggers instant download on first HTML byte -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" type="image/webp" />

<!-- Content rendered via native img with fetchpriority -->
<img
  src="/hero.webp"
  alt="Hero Banner"
  fetchpriority="high"
  loading="eager"
  width="1200"
  height="600"
/>
```

- [More detail on Preload Scanner behavior](https://web.dev/articles/preload-scanner)
- [More detail on Priority Hints](https://web.dev/articles/fetch-priority)
