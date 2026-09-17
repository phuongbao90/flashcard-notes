# Non-Functional & Specialized Testing

### Question 687f6448-2074-422c-b358-b82d40308854

- Why do engineering teams overlook load-testing the **Server-Side Rendering (SSR) layer**, and how do you execute performance tests against Next.js SSR using **k6**?

### Answer

- **The SSR is a Node Server realization**:
  - In client-side SPAs, web servers serve static HTML/JS files that scale easily via CDNs.
  - In Next.js App Router, SSR dynamically executes React component trees, runs asynchronous `fetch` calls, parses headers, and streams Flight payloads on **every incoming request**.
  - A heavy database query or CPU-bound JSON serialization inside a Server Component can cause Node's single-threaded event loop to lock up under modest traffic (e.g. 200 concurrent users), causing request queuing and 504 Gateway Timeouts.
- **Load-testing SSR with k6**:
  - Run synthetic load tests directly against SSR endpoints in staging.
  - Assert that **p95 Time-To-First-Byte (TTFB)** stays under acceptable thresholds (e.g. <300ms) under concurrent request spikes.

```javascript
// k6-ssr-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '1m', target: 200 },   // Stress test with 200 concurrent users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    // Fail test if p95 response time exceeds 400ms or error rate > 1%
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://staging.my-app.com/products/popular-item');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'SSR HTML delivered': (r) => r.body.includes('<!DOCTYPE html>'),
  });
  sleep(1);
}
```

- [More detail on k6 Load Testing](https://k6.io/docs/)
- [More detail on Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)

---

### Question 6fdefc18-b813-404b-9d14-b5eb3f7ba14b

- How does **pseudo-localization** uncover internationalization (i18n) and layout overflow defects before translations are delivered, and what should be asserted?

### Answer

- **The i18n late-discovery problem**:
  - English strings are notoriously compact. When translating to German, French, or Russian, text length expands by **30% to 100%**.
  - If a team tests only with English strings, translation delivery arrives days before release, immediately causing buttons to wrap awkwardly, headers to clip, and layouts to break.
- **How Pseudo-Localization works**:
  - An automated pipeline transforms English strings into accented characters with extra padding:
  - `"Account Settings"` → `"[!!! Àççôûñţ Šéţţîñğš !!!]"`
  - It increases string length by ~40% and replaces standard characters with accented glyphs.
- **What it catches**:
  1. **Hardcoded un-translated strings**: Any text that did NOT transform is hardcoded in JSX and missed by the i18n dictionary.
  2. **Layout overflow & clipping**: Verifies whether CSS flex/grid containers handle text expansion without breaking.
  3. **Character encoding bugs**: Ensures UTF-8 rendering supports non-ASCII diacritics.

```typescript
// i18n/pseudoLocalize.ts
export function pseudoLocalize(str: string): string {
  const map: Record<string, string> = { a: 'à', e: 'é', i: 'î', o: 'ô', u: 'û' };
  const expanded = str.replace(/[aeiou]/gi, (c) => map[c.toLowerCase()] || c);
  // Pad with brackets and exclamation marks to test character expansion
  return `[!!! ${expanded} ~~~~ !!!]`;
}

// In test environment:
it('verifies card layout does not truncate under pseudo-localized string expansion', () => {
  const expandedTitle = pseudoLocalize('Order Confirmation');
  render(<OrderCard title={expandedTitle} />);
  // Check in visual regression that button layout and card width endure expansion
  expect(screen.getByText(expandedTitle)).toBeVisible();
});
```

- [More detail on Pseudo-Localization Guidelines by Netflix](https://netflixtechblog.com/pseudo-localization-what-it-is-and-how-it-helps-internationalization-4f0144f8f41)
- [More detail on W3C Internationalization Testing](https://www.w3.org/International/)

---

### Question 2cf4c77f-b3f7-42d3-ac4e-cfaf6fe8cc26

- How do you simulate **chaos and resilience scenarios** (offline states, slow-3G network latency, and `ChunkLoadError` deployment races) in frontend test suites?

### Answer

- **The Real-World Mobile Reality**: Users do not experience apps on fiber-optic connections. They ride subways into dead zones, use throttled 3G networks, and encounter deployment races.
- **Scenario 1: Offline transition and background sync**
  - Use Playwright's `context.setOffline(true)` to simulate sudden network drops.
  - Assert that an offline indicator appears, form submissions queue locally (IndexedDB), and error messages prompt the user gracefully rather than crashing.
- **Scenario 2: Deployment race conditions (`ChunkLoadError`)**
  - When a new deployment merges to production, older hashed JavaScript bundles (`main.[hash].js`) are deleted from the origin server.
  - A user with an open browser tab clicks a dynamic `React.lazy()` route, and the browser receives a 404 for the missing JS chunk.
  - **What to test**: Intercept the script tag request with a 404 and assert that the application's Error Boundary automatically performs a soft reload (`window.location.reload()`) to download the latest bundle.

```typescript
// playwright/resilience.spec.ts - Testing ChunkLoadError recovery
test('automatically recovers and reloads when encountering a stale chunk 404', async ({ page }) => {
  await page.goto('/dashboard');

  // Simulate deployment clearing old webpack chunks
  await page.route('**/*chunk-analytics*.js', (route) => route.abort('failed'));

  // Click on lazy-loaded analytics tab
  await page.getByRole('link', { name: /analytics/i }).click();

  // Assert error boundary catches ChunkLoadError and triggers recovery banner
  await expect(page.getByText(/a new version is available/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /reload now/i })).toBeVisible();
});
```

- [More detail on Simulating Offline State in Playwright](https://playwright.dev/docs/network#offline)
- [More detail on Handling ChunkLoadError in React](https://react.dev/reference/react/lazy#handling-loading-errors)

---

### Question 3efcbb61-b660-40a8-9403-3077fea7780f

- What is the senior strategy for **Cross-Browser Testing**, and why is testing every commit across 10 different real devices an expensive mistake?

### Answer

- **The Exhaustive Matrix Fallacy**:
  - Running a 200-test E2E suite across Chrome, Firefox, WebKit, Mobile Safari, Android Chrome, and Edge on every pull request generates extreme CI compute bills and multiplies flakiness by 6x.
  - 95% of frontend regressions are business logic, state management, or network wiring errors that fail identically on all browsers.
- **The Senior Tiered Strategy**:
  - **Tier 1 (Every PR Gate - Fast & High Fidelity)**: Run full E2E suite against **Headless Chromium** only. Fast, deterministic, and catches all functional logic bugs.
  - **Tier 2 (Nightly / Pre-Release Matrix)**: Run critical-path smoke tests across **Firefox and WebKit (Safari engine)** in Playwright to catch browser-specific rendering bugs (e.g. WebKit flexbox quirks, date parsing nuances).
  - **Tier 3 (Real-Device Lab Testing - Manual & Periodic)**: Reserve real-device farms (BrowserStack, SauceLabs) for physical mobile touch gestures, keyboard popping, and hardware camera/biometric integrations prior to major quarterly releases.

```
Cross-Browser CI Hierarchy:
┌─────────────────────────────────────────────────────────┐
│ Tier 1: Every PR (Chromium Only)                        │
│ - Full unit, integration, and critical-path E2E suites  │
├─────────────────────────────────────────────────────────┤
│ Tier 2: Nightly Cron (Firefox & WebKit Matrix)          │
│ - Critical smoke tests: Auth, Checkout, Navigation      │
├─────────────────────────────────────────────────────────┤
│ Tier 3: Pre-Release (Real Device Cloud - iOS/Android)   │
│ - Physical gestures, virtual keyboard, mobile Safari    │
└─────────────────────────────────────────────────────────┘
```

- [More detail on Playwright Multi-browser Testing](https://playwright.dev/docs/browsers)
- [More detail on Cross-Browser Testing Strategy](https://martinfowler.com/articles/practical-test-pyramid.html)
