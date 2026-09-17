# Web fundamental

### Question d6cab4d1-ba51-4487-973c-c13168863148

- explaim credential option in fetch api

### Answer

- controls whether browsers automatically send and store user credentials (such as HTTP cookies including HttpOnly cookies, HTTP Basic Auth headers, and TLS client certificates) when making HTTP requests
- variants:
  - "include":
    - behavior: Tells the browser to always attach cookies (including HttpOnly cookies) and authentication headers to requests, whether the request is same-origin or cross-origin.
    - when to use: When your frontend web app (e.g. http://localhost:3000) communicates with a backend API on a different domain or port (e.g., http://localhost:4000), and authentication is managed via cookies
    - CORS Security Requirements: For cross-origin requests with credentials: "include", the backend server must respond with:
      1. Access-Control-Allow-Credentials: true
      2. Access-Control-Allow-Origin: http://localhost:3000 (must specify the exact origin, cannot be wildcard *).
  - same-origin: (default)
    - Behavior: The browser sends cookies and credential headers only if the request origin matches the page origin (same protocol, domain, and port).
    - Cross-origin behavior: If the request goes to a different domain or port, the browser strips all cookies and ignores any Set-Cookie headers returned by the server.
    - When to use: Standard same-domain Next.js apps or monolithic setups where API routes share the exact same origin as the frontend.
  - omit:
    - Behavior: Instructs the browser to never attach cookies or authentication headers to the request, even if the request is same-origin. Any Set-Cookie headers in the server's response will be ignored and discarded by the browser.
    - When to use:
      - Fetching public static assets (images, public JSON, CDN files).
      - Preventing user session cookies from leaking or cluttering requests where cookies are unnecessary.
      - Improving cacheability on CDNs (since requests without Cookie headers are easier to cache).

---

### Question a86c53bf-4bf0-4a01-a482-354990f6f574

- pure cookie vs hybrid cookie pattern

### Answer

- Bottom Line:
  - If your frontend and backend share the exact same domain (e.g. Next.js / monolith), using Pure HttpOnly Cookies for everything is great and very easy!
  - If your frontend and backend are on different domains/ports or you have a mobile app, the Hybrid Pattern is safer and much less headache with browser cookie restrictions.

---

### Question b5e973bc-93fc-4640-a50e-a81f59deb1b2

- what are problems of pure cookie patterns?

### Answer

- Reason 1: Protection Against CSRF (Cross-Site Request Forgery) Attacks
  - If Access Token is in a Cookie (credentials: "include" on every request): Because the browser automatically attaches cookies to every request, a malicious website (e.g. evil-website.com) can trick a logged-in user into making a hidden request to your backend:
    ```javascript
    <!-- On evil-website.com -->
    <form action="http://your-bank.com/api/transfer" method="POST">
        <input type="hidden" name="amount" value="1000" />
    </form>
    <script>document.forms[0].submit();</script>
    ```
- Reason 2: Third-Party Cookie Blocking in Modern Browsers
  - If your frontend is hosted at https://myapp.com
  - And your backend API is at https://api.myapp-backend.com
- Reason 3: Support for Mobile Apps & Microservices

---

### Question 7a6dcb21-940c-4e45-84a0-647374f03878

- when using pure cookie pattern, how to protect from csrf?

### Answer

1. Use the SameSite Cookie Attribute (Most Important)
   When setting your HttpOnly cookie on the backend, set SameSite=Lax or SameSite=Strict:
2. Restrict APIs to Content-Type: application/json
   Standard HTML forms (form) can only send application/x-www-form-urlencoded, multipart/form-data, or text/plain. They cannot send application/json.

---

### Question 45a9dffe-c276-43c2-9671-93adfcf6dbc7

- explain httpOnly

### Answer

- HttpOnly is a security flag added to an HTTP response header when setting a cookie (Set-Cookie: cookie_name=value; HttpOnly).
- key points:
  - Blocks Client-Side Access: Prevents client-side JavaScript (e.g., document.cookie) from reading or modifying the cookie.
  - Mitigates XSS Attacks: If a malicious script is injected into your website (Cross-Site Scripting), the attacker cannot steal session identifiers or JWTs stored in HttpOnly cookies.
  - Automatic Transmission: The browser automatically attaches HttpOnly cookies to subsequent HTTP requests sent to the server.

- What HttpOnly Does NOT Do
  - Does not prevent CSRF: The browser will still send HttpOnly cookies automatically on cross-site requests (use SameSite attribute and anti-CSRF tokens for CSRF protection).
  - Does not encrypt data: It does not protect against network interception (use the Secure flag to mandate HTTPS).

---

### Question 619e5bcf-3a62-474c-a3c6-0f0c3f7239fc

- given the backend strictly require Authorization: Bearer token + backend return cookie including jwt + refresh_token
  - how do you handle it in nextjs project

### Answer

- For client side:
  - API Gateway Proxy Pattern (use Next.js Route Handler as a Proxy:)
    - Step 1: Create a Route Handler (app/api/proxy/route.ts) or catch all route: app/api/proxy/[...path]/route.ts
    - Step 2: Call /api/proxy from your Client Component
- For server side
  - simple, use cookies() from 'next/headers'

---

### Question 7a94bb92-c1b2-4dc1-98e1-069ea2c508b9

- What happens if you send a cross-origin request with credentials: "include", but the server responds with Access-Control-Allow-Origin: *?

### Answer

- The browser will block the response due to CORS policy violation. When credentials are included, the server must specify an exact origin in Access-Control-Allow-Origin (e.g., Access-Control-Allow-Origin: https://example.com) and cannot use a wildcard (*).

---

### Question 36ec264a-e143-43b2-98e3-a1d216ebea9f

- How does cookie authentication work during Next.js Server-Side Rendering (SSR) versus on the Client?

### Answer

- Client-side: The browser automatically attaches HttpOnly cookies to outgoing API calls when credentials: "include" (or "same-origin") is set.
- SSR (Server-side): Server Components run in Node.js, not the browser. They must read incoming cookies using next/headers (cookies()) from the incoming HTTP request and explicitly forward the Cookie header when making server-side fetch requests to a backend API

---

### Question ed65b32a-95a5-44cf-b5c6-cb41a84ffffd

- I set credentials: 'include' on my client fetch, but the session cookie is still not being sent to my backend during local development. What could be wrong?

### Answer

1. CORS Headers: Does the backend return Access-Control-Allow-Credentials: true and Access-Control-Allow-Origin: http://localhost:3000?
2. SameSite attribute: If frontend and backend run on different ports/domains (e.g. localhost:3000 vs api.domain.com), SameSite=Strict might block the cookie.
3. Secure flag on HTTP: If the cookie has the Secure flag but dev environment runs on http://, the browser will ignore the cookie.
4. Domain/Path mismatch: Ensure the cookie's Domain and Path attributes match the backend endpoint URL.

---

### Question e962a731-8240-4fc8-a27e-b100b8fb4146

- Why replace window.addEventListener('scroll') / 'resize' with Observer APIs in modern React/Next.js applications?

### Answer

- Main Thread Blocking: Legacy scroll/resize listeners run synchronously on the main thread during render/layout. Querying layout properties (getBoundingClientRect(), offsetHeight) inside scroll handlers causes Layout Thrashing (forced reflow).
- Observer Efficiency: Observers (Intersection, Resize, Mutation) are computed asynchronously by the browser off the main thread and batched via microtasks.
- Element-Level Precision: Scroll/resize events only report window state. Observers watch specific DOM elements regardless of how or why their position/size changed (e.g., sidebar toggling, parent layout shift).

---

### Question 90b55d22-e940-4acf-9bb9-7393353c06f6

- What are Core Web Vitals (CWV), and what are the primary 3 metrics currently tracked by Google?

### Answer

Core Web Vitals are a set of specific metrics defined by Google to measure real-world user experience for web performance, visual stability, and interactivity. The 3 Core Web Vitals (as of 2024+) are:

1. LCP (Largest Contentful Paint): Measures loading performance. Target: ≤2.5s
2. NP (Interaction to Next Paint): Measures runtime interactivity and responsiveness (replaced FID in March 2024).Target: ≤200ms.
3. CLS (Cumulative Layout Shift): Measures visual stability. Target: ≤0.1.

---

### Question 029142e1-74c4-44fe-9233-626b7dd11066

- What is LCP, what usually causes a poor LCP score, and how do you optimize it?

### Answer

- Definition: LCP measures how long it takes for the largest visual element in the viewport (hero image, video poster, large text block) to render.
- Common Bottlenecks:
  - Slow server response times (TTFB).
  - Render-blocking JavaScript and CSS.
  - Late-discovered images (e.g., images injected via JS or CSS background images).
  - Slow resource download speeds.
- Optimization Strategies:
  - Preload critical assets: Use `<link rel="preload">` or Next.js priority attribute on hero images.
  - Optimize rendering strategy: Use Server-Side Rendering (SSR) or Static Site Generation (SSG) to send pre-rendered HTML instead of relying on client-side JS rendering (CSR).
  - Optimize image formats & sizing: Modern formats (AVIF/WebP), responsive srcset.
  - CDN and caching: Serve static assets edge-cached via a CDN to minimize TTFB.

---

### Question 3ddc5fc8-cea1-437e-b5a2-74259443b4b2

- What replaced FID with INP in March 2024, and how does INP differ from FID?

### Answer

- FID (First Input Delay) only measured the delay after the very first user interaction (click/tap) to when the main thread became available to start processing the handler. It ignored event execution time and paint duration.
- INP (Interaction to Next Paint) measures the overall response latency for all user interactions throughout the entire page lifecycle (clicks, taps, keyboard inputs) and reports the worst/95th percentile latency. It accounts for three phases:
  - Input Delay (waiting for main thread).
  - Processing Time (running event handlers).
  - Presentation Delay (browser repainting the frame).

---

### Question 6ae786c4-f3d1-401a-b564-af17f370f1b8

- What causes high CLS (Cumulative Layout Shift), and how do you prevent layout shifts?

### Answer

- Definition: CLS measures unscheduled structural changes to elements on a page during its lifecycle.
- Common Causes:
  - Images or embeds (`<iframe>`, ads) without explicit width and height dimensions.
  - Dynamically injected content above existing content (e.g., banners, cookie notices).
  - Custom Web Fonts causing FOUT (Flash of Unstyled Text) or FOIT (Flash of Invisible Text).
- Prevention Strategies:
  - Set aspect ratio boxes: Reserve space using CSS aspect-ratio or width/height attributes.
  - Reserve space for dynamic content: Skeleton loaders or fixed-height containers for ads/banners.
  - Font loading: Use font-display: swap or local font fallbacks with CSS size-adjust.

---

### Question cf365dbf-2458-4bab-9464-87e5fbad7d4c

- How does React’s client-side hydration impact LCP and INP, and how can React 18+ features help?

### Answer

- Hydration Impact:
  - LCP: If elements depend on client-side state hydration before becoming visible or fully rendered, LCP gets delayed.
  - INP: Heavy hydration bundles block the main thread. If a user clicks during initial hydration, the input handling and painting are delayed, raising INP.
- React 18 Solutions:
  - Concurrent React & Selective Hydration (`<Suspense>`): Allows React to stream HTML and hydrate parts of the page independently without blocking the main thread.
  - useTransition & useDeferredValue: Mark non-urgent UI updates as low priority, yielding to user inputs to keep INP under 200ms.
  - React Server Components (RSC): Shift non-interactive component logic to the server, shipping 0kB JS for those components to the client.

---

### Question 4cac218d-b517-4b22-8b63-35104dfa2a96

- How does Next.js (next/image and next/font) automatically optimize Core Web Vitals?

### Answer

- next/image:
  - LCP: Auto-converts images to modern formats (WebP/AVIF), resizes for device viewports, and supports priority prop to generate preloads.
  - CLS: Forces developers to define width/height or use fill with parent container sizing, reserving exact DOM space before load.
- next/font (@next/font / next/font/google):
  - Downloads font files at build time and hosts them with static assets.
  - Uses CSS size-adjust to match fallbacks with web fonts, eliminating layout shifts (zero CLS) caused by font loading.

---

### Question fc125c60-94a8-441e-a909-b3ab3768e999

- What strategies would you use in Next.js (App Router or Pages Router) to reduce bundle size and lower INP/LCP?

### Answer

- Leverage React Server Components (App Router): Keep heavy libraries (e.g., markdown parsers, date formatters) on the server side so they aren't bundled into the client JS.
- Dynamic Imports (next/dynamic / React lazy): Lazy-load heavy components that aren't visible on initial render (modals, charts, drawer menus).
- Optimize Third-Party Scripts (next/script): Load non-critical analytics or chat widgets using strategies like strategy="lazyOnload" or strategy="afterInteractive".
- Tree Shaking & Barrel Imports: Avoid importing full library bundles (e.g., import { debounce } from 'lodash' vs import debounce from 'lodash/debounce').

---

### Question 24a3b318-847b-4021-9dcb-ab5fa811dc53

- How do you measure and report Web Vitals in a Next.js application?

### Answer

- Next.js has built-in support for reporting Web Vitals via the useReportWebVitals hook (App Router / Pages Router)
- Or using the standard standalone web-vitals JavaScript library:

---

### Question b589e3ec-3ae2-421d-b7ca-0295feffbd49

- What is the Long Animation Frame (LoAF) API, and how does it help diagnose high INP in React apps?

### Answer

- Background: Traditional Long Tasks API only identifies tasks that take >50ms on the main thread, but it doesn't give visibility into frame rendering or React component tree updates.
- LoAF API: Measures any frame update delayed beyond 50ms and breaks down the duration into:
  - Script Duration: Time spent executing JavaScript (event listeners, React render lifecycle).
  - Style & Layout: Time browser spent recalculating styles and layout.
  - Pre-render & Render Time: Time spent painting.
- Diagnosing React INP: LoAF exposes the exact script URL, function name, and character offset that triggered the long frame, allowing you to trace a delayed paint directly back to a specific React handler or component render.

---

### Question 841bf2be-0fbb-4dda-96e3-3793695ac40a

- How do useTransition and useDeferredValue lower INP during heavy React state updates? What happens under the hood?

### Answer

- Problem: Standard React state updates (setState) are synchronous and urgent. If updating a state causes 100 components to re-render, React blocks the main thread until all 100 components finish rendering. If a user clicks during this time, the click input handler is delayed (high INP).
- Under the Hood: startTransition marks the update as non-urgent concurrent work. If a user interacts with the page (e.g., typing another key or clicking a tab) while React is mid-render, React interrupts the low-priority render, handles the user event immediately (keeping INP low), and then resumes or restarts the background render.

---

### Question ac7e7afb-848c-4236-bd3a-c14c4bf139c9

- How can you break up long JavaScript tasks in modern browsers when React startTransition isn't enough?

### Answer

When performing heavy non-React CPU computations (e.g., data processing, heavy array transformations):

- scheduler.yield() (Modern Chrome API): Explicitly yields control back to the main thread so user inputs and paints can execute before resuming the loop
  ```javascript
  async function processLargeData(items) {
    for (let i = 0; i < items.length; i++) {
      processItem(items[i]);
      if (i % 100 === 0 && "scheduler" in window) {
        await performance.scheduler.yield(); // Yields control briefly
      }
    }
  }
  ```
- setTimeout / requestIdleCallback Fallback: Yields execution to the macro-task queue.
- Web Workers: Offload non-DOM, compute-heavy JS entirely off the main thread to a background worker thread.

---

### Question 79133187-0142-44ae-83ad-321b13da86af

- How does TTFB (Time to First Byte) impact LCP, and how can Edge Middleware in Next.js negatively impact TTFB if misused?

### Answer

- TTFB & LCP Relationship: LCP is downstream of TTFB (LCP=TTFB+Resource Load Delay+Resource Load Time+Element Render Delay). If TTFB takes 1.5s, LCP can never be faster than 1.5s.
- Next.js Middleware Impact:
  - Next.js Middleware runs on every request before the response HTML/page is generated.
  - If Middleware performs blocking synchronous operations, un-cached external API fetches, or complex crypto operations on cold-starts, it adds direct delay to TTFB.
- Best Practice: Keep Middleware minimal (e.g., header rewrites, lightweight auth token checks). Avoid heavy database or external API calls inside Middleware.

---

### Question 3963fde4-af70-4e4b-86d1-d550720347a2

- How does React 18 HTML Streaming (renderToReadableStream / `<Suspense>`) improve TTFB and FCP compared to traditional SSR?

### Answer

- Traditional SSR (renderToString): The server must wait for all data fetching on the page to finish before sending a single byte of HTML back to the browser. If one API endpoint is slow, TTFB and FCP are blocked.
- HTML Streaming (`<Suspense>`):
  - The server immediately streams early shell HTML (navbar, layout, skeleton loaders) → Extremely fast TTFB & FCP.
  - Slow dynamic components wrapped in `<Suspense>` fetch data asynchronously on the server.
  - Once ready, the server streams the remaining HTML chunk and inline `<script>` tags down the open HTTP connection to swap out the fallback skeleton in real-time.

---

### Question a575f79b-a46f-41f3-b6b4-2e0b842f5420

- What is Partial Prerendering (PPR) in Next.js App Router, and how does it optimize both TTFB and LCP?

### Answer

- Concept: Combines static generation (SSG) speed with dynamic rendering (SSR) flexibility on the exact same page.
- How it works:
  - At build time, Next.js generates a static shell for the page (headers, sidebars, static UI + suspense fallbacks).
  - When a request arrives, the static shell is served instantly from the Edge CDN (Instant TTFB & near-zero FCP/LCP for static content).
  - Concurrently, dynamic `<Suspense>` holes stream in parallel from the server without delaying the initial page shell delivery.

---

### Question 01f5e2ca-11dd-4ae7-b3ed-af8f12156886

- Why do CSS transform animations avoid CLS, whereas animating top, left, width, or height causes layout shifts?

### Answer

- Browser Rendering Pipeline: JavaScript⟶Style⟶Layout⟶Paint⟶Composite
- top, left, width, height: Trigger the Layout phase. The browser must recalculate positions and dimensions of the element and all surrounding sibling/parent elements. This causes layout recalculation and contributes to CLS.
- transform (e.g., translate3d, scale) & opacity: Skip Layout and Paint phases entirely. They run directly on the GPU in the Composite phase without moving other elements in the DOM tree, resulting in 0 CLS.

---

### Question 360bf58e-8ed3-47de-8de1-a4cecb958ddb

- How would you debug an intermittent, real-user INP spike that only happens in production?

### Answer

- Collect RUM Attribution Data: Use web-vitals/attribution package in Next.js/React to log detailed telemetry:
  ```javascript
  import { onINP } from "web-vitals/attribution";
  onINP((metric) => {
    console.log("Target element:", metric.attribution.interactionTarget);
    console.log("Interaction type:", metric.attribution.interactionType);
    console.log("Load delay:", metric.attribution.inputDelay);
    console.log("Processing duration:", metric.attribution.processingDuration);
    console.log("Presentation delay:", metric.attribution.presentationDelay);
  });
  ```
- Analyze Interaction Target: Identify if the culprit is a specific UI element (e.g., auto-suggest search input, multi-select filter dropdown, or third-party chat widget).
- Reproduce CPU Throttling in Chrome DevTools: Enable 4x/6x CPU throttling and record a trace using the Performance Panel while interacting with the identified target.
- Inspect Flame Chart: Search for long orange task bars indicating long handlers, synchronous layout thrashing (forced reflows), or un-memoized heavy React component subtrees.

---

### Question 184581ac-89e1-4239-954a-9fb4a84d437b

- What is Layout Thrashing (Forced Synchronous Layout), how does it break INP and CLS, and how do you fix it in React?

### Answer

- What it is: Layout Thrashing occurs when JavaScript writes to the DOM (e.g., changes style/class) and then immediately reads a geometric property (e.g., offsetWidth, getBoundingClientRect(), scrollTop).
- Why it breaks performance:
  - Normally, the browser batch-calculates layouts asynchronously at the end of the frame.
  - Reading geometry after a DOM write forces the browser to stop JS execution synchronously and recalculate the layout immediately mid-frame. Doing this inside loops or React useEffect hooks causes massive frame drops, spiking INP.
- Bad Pattern (Forced Reflow):

  ```ts
  // BAD: Read-Write-Read-Write in a loop causes forced layout thrashing
  elements.forEach((el) => {
    const width = el.offsetWidth; // READ (Forces sync layout!)
    el.style.width = `${width + 10}px`; // WRITE
  });
  ```

- Fix Strategy:
  - Batch Reads first, then Writes:
  ```ts
  const widths = elements.map((el) => el.offsetWidth); // Batch READS
  elements.forEach((el, i) => {
    el.style.width = `${widths[i] + 10}px`;
  }); // Batch WRITES
  ```
  - Use useLayoutEffect vs useEffect correctly in React: Use useLayoutEffect for DOM measurements before paint, but do not trigger state updates inside it that force re-layouts.
  - Prefer pure CSS: Use CSS Flexbox, Grid, or CSS container queries instead of measuring elements via JS.

---

### Question 0c738b08-4ea2-45b8-b7e1-fe3d45456601

- Why does next/image still produce a bad LCP if you forget the sizes prop? How does sizes work under the hood?

### Answer

- The Problem: Without the sizes prop, Next.js doesn't know how wide the image will be on the user's viewport screen (especially inside responsive grid layouts).
- Default Behavior: By default, next/image assumes sizes="100vw" (image takes up 100% of screen width). On a 4K display or desktop grid with 4 columns, the browser requests a huge 3840px image for a container that only displays at 300px width.
- Impact on LCP: Downloading a 2MB image instead of a 30kB image delays image fetch/download time by seconds, destroying LCP.
- The Solution: Define precise media query breakpoints using sizes:
  ```tsx
  <Image
    src="/hero.png"
    alt="Hero"
    fill
    priority // Preloads image (crucial for LCP)
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
  ```
  - Result: The browser downloads only the exact resolution needed for the client's viewport width, drastically reducing LCP download latency.

---

### Question 4d53d306-a391-4f28-9f80-9075f38eec6b

- How do Hydration Mismatches in Next.js/React cause high CLS, and how do you fix them cleanly?

### Answer

- How Mismatches Cause CLS: During SSR/SSG, the server renders HTML based on initial state. On the client, if JavaScript reads browser-only APIs (window.innerWidth, localStorage, current timezone/date) during initial render, client DOM output differs from server HTML. When React hydrates, it replaces/swaps DOM nodes on the fly, causing visible page jumps (high CLS).

- Anti-Pattern (Causes CLS):

  ```tsx
  // BAD: Renders null on server, then pops in on client -> CLS shift!
  function UserHeader() {
    const isMobile = window.innerWidth < 768; // Error during SSR / shift on client
    return isMobile ? <MobileNav /> : <DesktopNav />;
  }
  ```

- Clean Solutions:

  - CSS-First (Zero CLS): Render both navigation states or use CSS Media Queries (display: none / @media) so layout space is settled in pure HTML/CSS before JS loads.
  - Two-Pass Client Mount (Safe for non-layout state like Theme/Auth):

  ```tsx
  function Component() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <SkeletonLoader />; // Fixed-size skeleton prevents shift
    return <ClientOnlyContent />;
  }
  ```

---

### Question 22d685c8-ab05-4259-b086-cd174f8f03db

- Third-party scripts (GTM, Ads, Chat Widgets) are destroying your site's INP and LCP. How do you mitigate them without removing them?

### Answer

- Use Next.js Script Strategies (next/script):
  - strategy="afterInteractive": Loads right after page is interactive (default for analytics).
  - strategy="lazyOnload": Waits until browser is completely idle during requestIdleCallback. Great for chat widgets (Zendesk, Intercom).
- Move Execution Off the Main Thread (Partytown / Web Workers):
  - Run heavy scripts (like Google Tag Manager, Hubspot) inside a Web Worker using libraries like Partytown.
  - This offloads JS execution completely off the main UI thread, keeping INP under 200ms.
- Lazy-Load on User Interaction:
  - Don't load chat widgets or heavy video embeds (YouTube/Vimeo) on initial page load.
  - Render a static placeholder image / button; load the real third-party script/iframe only when the user hovers or clicks the widget.
- Use iframe Isolation for Ads:
  - Wrap third-party ad tags in isolated iframe elements with fixed containers to prevent layout shifts (CLS).

---

### Question 34948a8d-c2f3-4d9a-b342-e28a3f2397c5

- What are Resource Hints (dns-prefetch, preconnect, preload, prefetch), and how do you use them specifically to optimize LCP and TTFB?

### Answer

- preconnect

  - What It Does: Initiates early DNS lookup, TCP handshake, and TLS negotiation with a third-party domain.
  - Best Used For: Critical third-party origins (e.g., Google Fonts or CDN assets domain).
  - CWV Metric Impact: Improves LCP & TTFB by saving 100–300ms of network setup time.

- dns-prefetch

  - What It Does: Performs DNS lookup only (a lightweight fallback for older browsers or non-critical domains).
  - Best Used For: Secondary domains (such as analytics or tracking scripts).
  - CWV Metric Impact: Provides indirect TTFB support.

- preload

  - What It Does: Forces the browser to download a high-priority resource immediately, even before the parser discovers it in CSS or HTML.
  - Best Used For: Hero LCP images and critical self-hosted fonts (.woff2).
  - CWV Metric Impact: Directly and drastically reduces LCP.

- prefetch

  - What It Does: Downloads low-priority resources in the background for the next page navigation.
  - Best Used For: Next page JS chunks or assets triggered during user hover (frameworks like Next.js perform this automatically).
  - CWV Metric Impact: Enables instant future page loads.

---

### Question 40e5440a-9268-40bb-b69e-179b454f92dd

- How do you implement Infinite Scroll in Next.js using IntersectionObserver? Why use a "sentinel node" instead of watching the last item in the list?

### Answer

- The Sentinel Pattern: Place an empty `<div ref={sentinelRef} />` below the list. Observe this invisible target.
- Why Sentinel > Last Item:
  - Watching the last item requires re-binding the observer every time the data list updates (causing layout shifts and observer re-initializations).
  - A fixed sentinel at the bottom remains static; when it intersects, fetch next page, append items above sentinel.
- Implementation Edge Case: Always check !isLoading && hasNextPage inside the intersection callback to prevent firing multiple duplicate API calls while a fetch is in flight.

```tsx
useEffect(() => {
  if (!sentinelRef.current) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isLoading) {
        fetchNextPage();
      }
    },
    { rootMargin: "200px" },
  ); // Load 200px BEFORE reaching bottom!
  observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isLoading]);
```

---

### Question 1ebb55df-3767-4baf-871a-56816d0d8b22

- Why does standard useRef + useEffect often fail with Observers on conditionally rendered elements? How do Callback Refs fix it?

### Answer

- The Problem: If an element is conditionally rendered ({isOpen && `<div ref={myRef} />`}), useEffect runs on mount when myRef.current is null. When isOpen becomes true, useEffect does not re-run, so the observer is never attached.
- The Solution (Callback Ref): React calls callback refs whenever the node attaches or detaches from the DOM.
  ```tsx
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  // Callback ref passed directly to DOM element
  const ref = useCallback((node: HTMLDivElement | null) => {
    setNode(node);
  }, []);
  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(...);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  ```

---

### Question d205e744-8147-4f75-bc41-036c8e88a105

- If you need to observe 1,000 items in a list (e.g., tracking visibility of every item in a feed), should you create 1,000 Observers?

### Answer

- Answer: No. Instantiating hundreds of IntersectionObserver instances creates unnecessary memory overhead.
- Best Practice (Observer Pooling): Create one single IntersectionObserver instance and call .observe(element) for each item in the list.
- Identifying Targets: Use data-* attributes on target elements (data-id={item.id}) to identify which item triggered the callback from entry.target.dataset.id.

```tsx
// Single shared observer instance
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const itemId = (entry.target as HTMLElement).dataset.id;
      trackImpression(itemId);
    }
  });
});
```

---

### Question 7d8fe077-45d8-47e6-a102-5ed162e73df9

- Observer callbacks fire rapidly (e.g., during fast scrolling). How do you prevent layout thrashing and excessive state updates in React?

### Answer

- Unobserve on First Trigger: For one-time actions (like lazy rendering or entrance animations), immediately call observer.unobserve(entry.target) inside the callback as soon as entry.isIntersecting is true.
- Debounce/Throttle State Updates: If tracking continuous intersection ratios, debounce the React state update.
- Use rootMargin: Expand root margin (e.g., rootMargin: '100px 0px') to pre-trigger calculations before visual entry, smoothing UI rendering.

---

### Question cc1da63a-08c0-49b4-b752-f98ac0b0ec37

- What is PerformanceObserver, and how does Next.js / Core Web Vitals use it?

### Answer

- Core Concept: Watches browser performance timeline events (LCP, CLS, INP, FID, long tasks).
- Next.js Integration: Used in Next.js useReportWebVitals hook to measure app metrics in production.
- Key Use Case: Catching Long Tasks (>50ms main thread blocking execution) to log analytics without instrumenting individual functions.

```tsx
// Measuring Core Web Vitals / Long Tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn("Long Task detected:", entry.duration, entry);
    }
  }
});
observer.observe({ type: "longtask", buffered: true });
```

---

### Question bba5c334-11fd-44d2-9187-07e508b57a7d

- discuss localStorage & sessionStorage (Web Storage API)

### Answer

- Both localStorage and sessionStorage store string-based key-value pairs per origin (protocol://domain:port).

- Key Differences & Mechanics
  - localStorage: Persists indefinitely until explicitly cleared by the user or code (localStorage.clear()). Shared across all tabs/windows of the same origin.
  - sessionStorage: Bound to a single browser tab/window context. Opening a URL in a new tab creates a fresh session context (though duplicating a tab copies the existing session storage state). Storage is cleared as soon as the tab is closed.
- Critical Drawbacks
  - Synchronous Execution (Main-Thread Blocking): Reads and writes interact synchronously with the disk/memory on the main JS thread. Reading large data blobs during application startup causes main-thread jank, degrading Interaction to Next Paint (INP) and Total Blocking Time (TBT).
  - String-Only Constraint: All values are coerced into strings. Non-primitive objects require JSON.stringify() / JSON.parse(), adding CPU overhead.
  - XSS Vulnerability: Fully accessible to any JavaScript code running on the origin. Storing sensitive tokens (like JWT access tokens) exposes them to malicious 3rd-party scripts or injected XSS attacks.

```javascript
// Example: Safe JSON wrapper for UI state
function setPreference(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      console.error("LocalStorage limit reached");
    }
  }
}
```

---

### Question 4ac1d068-c189-45d4-8225-a7f3dccbade8

- discuss IndexedDB

### Answer

- IndexedDB is a low-level, object-oriented database embedded inside the browser. It stores structured records indexed by primary keys and custom field indexes.

- Advantages & Mechanics
  - Asynchronous & Transactional: All operations are async (event/promise-driven) and wrapped in atomic transactions (readonly, readwrite). Disk I/O never blocks main-thread rendering.
  - Structured Clone Algorithm: Can store complex JS data types natively—including Object, Array, Blob, File, ArrayBuffer, Map, Set, and ImageData—without manual JSON serialization.
  - High Storage Capacity: Operates under dynamic browser quotas, often allowing hundreds of megabytes to gigabytes of data depending on available disk space.
- Best Practice & Modern Usage
  - Raw IndexedDB syntax is notoriously verbose and event-driven (request.onerror, request.onsuccess). Modern applications use lightweight promise wrappers like idb or full ORM-like libraries such as Dexie.js.

---

### Question c1b44d21-c572-4761-b959-75c869d18294

- Cookie Store API

### Answer

- The Cookie Store API is a modern, asynchronous alternative to the legacy document.cookie interface.

- Why replacing document.cookie matters
  - Asynchronous & Non-blocking: document.cookie forces synchronous string parsing on the main thread. cookieStore returns native promises.
  - Service Worker Availability: document.cookie is unavailable inside Service Worker global scopes. cookieStore works inside Service Workers (ServiceWorkerGlobalScope), allowing background handlers to read and write cookies asynchronously.
  - Event-Driven: Provides a cookiechange event listener to observe cookie modifications reactively.
- Security Note: HttpOnly cookies remain inaccessible to JavaScript (including cookieStore), preserving defense-in-depth against token theft via XSS.

---

### Question 625af0e6-3150-4c6a-972b-72c4aeae68fb

- StorageManager & Persistence API (navigator.storage)

### Answer

- StorageManager provides utilities to inspect storage availability and request persistent storage protection against browser cache eviction.

1. Disk Quota Inspection (storage.estimate())
   navigator.storage.estimate() queries how much storage an origin is currently consuming and the maximum quota granted by the browser.

```javascript
if (navigator.storage && navigator.storage.estimate) {
  const { quota, usage } = await navigator.storage.estimate();
  const usageInMB = (usage / (1024 * 1024)).toFixed(2);
  const quotaInMB = (quota / (1024 * 1024)).toFixed(2);
  console.log(`Using ${usageInMB} MB out of ${quotaInMB} MB quota.`);
}
```

2. Persistence Requests (storage.persist())

- By default, browser storage operates under a Best-Effort policy: under low disk space conditions, the browser can silently clear an origin's IndexedDB, Cache Storage, or Service Worker data.

- Calling navigator.storage.persist() requests permission for Persistent Storage, preventing automatic disk cleanup.

```javascript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persisted();
  if (!isPersisted) {
    const granted = await navigator.storage.persist();
    console.log(`Persistent storage granted: ${granted}`);
  }
}
```

---

### Question 6b71fd8a-2640-4a74-aacf-23e51a93d2a3

- What are the main differences between localStorage, sessionStorage, and IndexedDB?"

### Answer

- Storage & Data Types: localStorage and sessionStorage hold string key-value pairs capped at ~5–10MB. IndexedDB is a transactional NoSQL database storing structured JS objects (via Structured Clone Algorithm), binary data, and Blobs, with capacity in the gigabytes.
- Sync vs. Async: Web Storage (localStorage/sessionStorage) operations are synchronous and block the main thread. IndexedDB is asynchronous and event/promise-based.
- Scope & Lifecycle: localStorage persists indefinitely across tabs on the same origin. sessionStorage is scoped to a single tab context and dies when the tab closes. IndexedDB persists until explicitly deleted or cleared under storage pressure.

---

### Question 08589ae7-e36e-44f0-9729-d4e0efddea93

- "Why is localStorage considered bad for application performance?"

### Answer

- localStorage executes synchronous file I/O on the main thread. When reading or writing large strings or parsing nested JSON structures (JSON.parse(localStorage.getItem(...))), JS execution blocks layout and rendering. This directly increases Total Blocking Time (TBT) during app startup and can cause jank, degrading Interaction to Next Paint (INP).

---

### Question 1ca2499b-87b0-4544-8325-3984aeb6e650

- "Where should you store a JWT access token: localStorage or HttpOnly Cookies? Why?"

### Answer

- localStorage: Susceptible to XSS (Cross-Site Scripting). Any malicious 3rd-party script or injected dependency running on the origin can read localStorage.getItem('token') and exfiltrate it.
- HttpOnly Cookie: Immune to XSS script reads because document.cookie and JavaScript cannot access it. However, cookies automatically attach to requests, exposing the site to CSRF (Cross-Site Request Forgery).
- Best Practice: Use HttpOnly cookies with SameSite=Strict (or Lax) and Secure flags. For SPAs needing fine-grained control, store refresh tokens in an HttpOnly cookie and keep access tokens in short-lived in-memory JS state (or secure worker memory).

---

### Question 71e8f39f-7167-455b-84d0-43633855b104

- "How does the Cookie Store API differ from standard document.cookie?"

### Answer

- Asynchronous: cookieStore returns Promises, preventing main-thread blocking when parsing or setting cookies.
- Service Worker Support: document.cookie isn't accessible in Service Workers. cookieStore is available in ServiceWorkerGlobalScope, allowing background sync tasks to read/update authentication context.
- Reactive Events: It provides a cookiechange event listener so apps can react to cookie modifications without polling.

---

### Question dcf67e78-4e55-4816-8aed-a62da46b70cd

- "How can you synchronize state across multiple open tabs of the same website in real-time?"

### Answer

- storage Event: Listening to window.addEventListener('storage', callback) triggers in other tabs whenever localStorage is updated.
- BroadcastChannel API: Purpose-built for low-overhead pub/sub messaging between tabs, windows, or workers of the same origin.
- SharedWorker: A single worker shared across tabs that acts as a centralized state authority.

---

### Question 3137c628-8ee0-43f6-bda1-fc88aa9dff08

- "How does Safari/WebKit’s ITP (Intelligent Tracking Prevention) affect client storage, and how do you handle it?"

### Answer

- The 7-Day Cap: In Safari (iOS & macOS), client-side storage (including localStorage, IndexedDB, Cache API, and OPFS) created via script is automatically deleted after 7 days of non-use if the user accessed the site through a link with tracking parameters or if the origin has no top-level interaction.
- Workarounds & Mitigations:
  - Server-set cookies (via HTTP response headers) are not subject to the 7-day script cap.
  - Encourage users to add the application to their home screen as a PWA (Standalone mode), which waives the aggressive 7-day eviction rule.
  - Prompt users to grant Persistent Storage (navigator.storage.persist()).

---

### Question bca52c0a-d87f-4559-9e35-e2e2becc8dad

- "What happens when storage APIs are accessed in Private / Incognito Mode?"

### Answer

- Quota Reduction: In Incognito mode, available storage quota is drastically reduced (often capped at 50MB–100MB or dynamic RAM allocation).
- Ephemeral Storage: All writes to localStorage, IndexedDB, or cookies exist only for the duration of the incognito session and are purged as soon as all incognito windows are closed.
- Safari Legacy Quirks: Older versions of Safari threw a QuotaExceededError immediately on calling localStorage.setItem(). Defensive code should always wrap setItem calls in try...catch blocks.

---

### Question cef08a24-0183-4855-bcbc-a91e62fa2385

- "What is Storage Partitioning (Double-Keying), and how does it impact localStorage inside `<iframe>`s?"

### Answer

- Mechanism: Traditionally, storage was keyed only by origin (https://example.com). Modern browsers (Chrome, Firefox, Safari) key storage using (Top-Level Site, Embedded Site).
- Impact on `<iframe>`: An iframe running https://widget.com inside https://site-a.com gets a completely isolated localStorage instance from the same https://widget.com iframe rendered inside https://site-b.com. Cross-site tracking via shared storage across different top-level domains is blocked.

---

### Question 1ac47ce1-d128-47bc-9700-f36d6de69408

- "How do you decide between using the Cache API vs. IndexedDB in a Progressive Web App (PWA)?"

### Answer

- Cache API (caches): Specialized for HTTP Request/Response pairs. Ideal for static assets (HTML, CSS, JS bundles, images) and REST/GraphQL API response caching consumed directly by a Service Worker to intercept network fetches.
- IndexedDB: Specialized for application state and structured data. Ideal for user-generated offline data, queueing offline mutation actions before syncing with the backend, or querying local datasets with indexes.

---

### Question 6a8d665d-9842-4389-bfbe-c3f363be2e21

- "How do you prevent race conditions when writing to storage across multiple browser tabs?"

### Answer

- Standard localStorage has no built-in locking mechanism. To prevent race conditions during read-modify-write cycles across tabs, use the Web Locks API (navigator.locks).

```javascript
// Acquiring an origin-wide lock across tabs
await navigator.locks.request("storage_update_lock", async (lock) => {
  // Critical section: Guaranteed to run exclusively in one tab at a time
  const currentCount = parseInt(localStorage.getItem("counter") || "0", 10);
  localStorage.setItem("counter", (currentCount + 1).toString());
});
```

---

### Question 2ec9d9ab-7dc1-435a-bfa3-3d052e44c968

- explain http Etag, how it works? how to use it?

### Answer

- An _**ETag (Entity Tag)**_ is an HTTP response header that serves as a unique validator (hash or version identifier) for a specific version of a resource at a given URL.
- Mechanics & Workflow:
  - Initial Fetch: Server computes a hash of the response payload and returns `ETag: "v1-hash"` along with the resource.
  - Subsequent Fetch: Browser sends `If-None-Match: "v1-hash"` request header to validate if the cached version is still fresh.
  - Cache Hit: If unchanged, the server returns status _**304 Not Modified**_ with an empty body, saving bandwidth.
  - Cache Miss: If modified, the server returns status _**200 OK**_ with the new payload and updated `ETag: "v2-hash"`.
- Strong vs. Weak ETags:
  - _**Strong ETag**_ (`ETag: "xyz"`): Requires byte-for-byte identity; changes if any byte in the resource changes.
  - _**Weak ETag**_ (`ETag: W/"xyz"`): Indicates semantic equality; resource content is functionally equivalent even if minor bytes differ.
- Practical Usage & Caveats:
  - Essential for dynamic APIs where file modification timestamps (`Last-Modified`) are inaccurate.
  - In load-balanced server clusters, ensure ETags are generated using content hashing rather than server-specific inode numbers to avoid cache misses across nodes.

```javascript
// Express.js backend using ETag validation
app.get("/api/user", (req, res) => {
  const data = JSON.stringify({ id: 1, name: "Alice" });
  const etag = crypto.createHash("md5").update(data).digest("hex");

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end(); // Not Modified
  }

  res.setHeader("ETag", etag);
  res.send(data);
});
```

---

### Question 04f133ee-3707-45ae-ae8c-6e4d20c125d8

- explain:
  - If-Modified-Since
  - If-None-Match
  - If-Match
  - If-Unmodified-Since
  - If-Range
- When to use them?

### Answer

- These are HTTP _**Conditional Headers**_ that allow clients to execute requests conditionally based on resource state (timestamps or ETags).
- Key Header Breakdown:
  - _**If-None-Match**_: Checks if the server's current `ETag` matches the client's cached ETag. Used in `GET` for cache revalidation (returns _**304 Not Modified**_ if matched).
  - _**If-Modified-Since**_: Checks if the resource was modified after a specific HTTP date timestamp. Used as fallback cache revalidation when ETags are absent.
  - _**If-Match**_: Ensures the server resource matches the client's expected ETag before performing mutations (`PUT`, `DELETE`). Used to prevent _**lost update concurrency issues**_ (optimistic locking).
  - _**If-Unmodified-Since**_: Ensures resource hasn't changed since a given date before processing mutations or resuming downloads.
  - _**If-Range**_: Used with `Range` requests (`GET`). If the ETag/date matches, server returns _**206 Partial Content**_; if changed, server returns _**200 OK**_ with the full payload instead of failing.
- Usage Summary:
  - Revalidation (`GET`): Prefer _**If-None-Match**_ (accurate hash) over _**If-Modified-Since**_ (1-second precision limit).
  - Concurrency Control (`PUT`/`PATCH`): Use _**If-Match**_ to prevent overwriting someone else's edits.
  - Resumable Downloads: Use _**If-Range**_ to avoid fetching invalid range chunks when files mutate mid-download.

---
