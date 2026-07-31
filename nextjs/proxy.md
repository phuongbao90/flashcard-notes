# Proxy

### Question

- What is the request lifecycle in Next.js?

### Answer

- 📥 Request Entry
  └─ 1. Incoming HTTP Request

- 🔍 Step 1: Matcher Evaluation
  ├─ ❌ No Match ──► Skip proxy.ts ──► Go to Step 3
  └─ ✅ Match ──► Proceed to Step 2

- ⚡ Step 2: `proxy.ts` Execution
  ├─ 🛑 Early Termination ──► Return 307 Redirect / 401 / Custom JSON
  └─ 🔄 Rewrite / Next ──► Proceed to Step 3

- 📁 Step 3: Route Resolution & Static Asset Lookup
  └─ Resolves target route in `app/` or serves `/public` static files

- ⚡ Step 4: Cache & PPR Evaluation
  └─ Checks `'use cache'` directives or Static Shell (PPR)

- ⚛️ Step 5: Server Execution
  └─ Executes RSCs (`layout.tsx` ──► `page.tsx`) or Route Handlers

- 🔀 Step 6: Response Merging
  └─ Combines headers & cookies set by `proxy.ts` with downstream RSC outputs

- 📤 Final Delivery
  └─ Final HTTP Response sent to Client

---

### Question

- the evolution of Next.js proxy.ts

### Answer

- pre 15
  - middleware.ts
  - runs on the edge -> cannot run npm packages, node modules
- 15
  - middleware.ts
  - support Node.js runtime -> can run npm packages, node modules
- 16
  - proxy.ts
  - runs on Node.js runtime -> can run npm packages, node modules

---

### Question

- what proxy should be used for?

### Answer

- for routing/redirects/headers with lightweight checks (i.e. cookie)
  - not for auth, use Data Access Layer or server actions instead

---

### Question

- diff between NextReponse.redirect() and NextResponse.rewrite()

### Answer

- redirect() → 3xx redirect to a new URL, browser will make a new request
- rewrite() → internal rewrite to a new URL, browser will not make a new request
  - useful for A/B testing, or multi-tenant routing, i18n routing

---

### Question

- the significance of matcher in proxy.ts

### Answer

- it runs before every request rendering and before static cache hits. Unfiltered proxy execution adds latency to all requests.
- it affects performance:
  - TTFB Bottleneck: The proxy runs before every request rendering and before static cache hits. Unfiltered proxy execution adds latency to all requests.
  - Asset Filtering: Omitting a matcher causes proxy logic to run on static assets (JS bundles, CSS, images, favicons).
  - Best Practice: Use regex matchers to explicitly exclude static assets (/_next/static, /_next/image, favicon.ico, static image extensions).

---

### Question

- How does proxy.ts interact with Next.js 16's explicit caching ('use cache' directive) and Partial Prerendering (PPR)?

### Answer

- Accidental Cache Busting
  - if proxy.ts sets cookies or headers, making the request dynamic, it can unintentionally bust static cache or PPR, causing unnecessary re-renders and increased server load.
  - solution: Keep your cached functions clean. Don't read dynamic headers set by proxy.ts inside cached functions unless you want the cache key to depend on them.

- proxy.ts + Partial Prerendering (PPR)
  - proxy.ts creates a Bottleneck for the Static Shell
  - The Static Shell is supposed to be served instantly from the CDN.
  - But proxy.ts executes on the server before the static shell is served.
  - solutions:
    - Avoid dynamic headers/cookies in proxy.ts for static shell routes.
    - Use matchers to exclude static shell routes from proxy.ts execution.

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
