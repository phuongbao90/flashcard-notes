# HTTP Headers & Transport Security

### Question 8412e1ab-6902-452a-96bf-ee8b45129c91

- Why do per-request Content Security Policy (CSP) nonces break static prerendering (SSG/ISR), and how does an engineering leader align CSP strategy with rendering models?

### Answer

- **Static caching incompatibility**: A cryptographic nonce must be unique, random, and unguessable for **every individual HTTP request**. Statically generating an HTML page with a baked-in nonce means every user receives the identical nonce, defeating its security purpose.
- **Dynamic rendering requirement**: Strict nonce-based CSP (`script-src 'nonce-xyz' 'strict-dynamic'`) is viable only for dynamically rendered routes where headers and HTML are generated per request on the server or edge middleware.
- **Hash-based CSP for static routes**: For statically generated or ISR routes, calculate SHA-256 hashes of static inline scripts and whitelist them in the CSP header (`script-src 'sha256-...'`), or eliminate inline scripts entirely.

- [More detail on Next.js Content Security Policy](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [More detail on MDN CSP: script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)

---

### Question 98be31a2-1145-4a09-bb12-f0452ca87103

- How does `strict-dynamic` in a nonce-based CSP function, and how does it simplify third-party script loading?

### Answer

- **Trust propagation**: When `strict-dynamic` is specified alongside a valid nonce, the browser trusts the nonced script **and any subsequent script that the nonced script dynamically creates** via `document.createElement('script')`.
- **Bypasses rigid domain allow-lists**: Eliminates the need to maintain fragile host allow-lists for complex analytics or tag managers (which dynamically pull dependencies from varied subdomains and CDNs).
- **Fallback backward compatibility**: Modern browsers recognizing `strict-dynamic` ignore `'unsafe-inline'`, `http:`, and domain expressions in `script-src`; older CSP Level 2 browsers fall back to the domain allow-lists.

```http
Content-Security-Policy: script-src 'nonce-rAnd0m123' 'strict-dynamic' 'unsafe-inline' https:; object-src 'none'; base-uri 'none';
```

- [More detail on W3C CSP Level 3 strict-dynamic](https://www.w3.org/TR/CSP3/#strict-dynamic-usage)

---

### Question ca1048b2-5712-421a-a829-87c2b3e409da

- How is a nonce-based CSP generated in Next.js Middleware and propagated to Server Components?

### Answer

- **Generate cryptographic nonce**: Generate a random base64 string using `crypto.randomUUID()` or Web Crypto inside `middleware.ts`.
- **Forward via request headers**: Attach the nonce to incoming request headers (e.g., `x-nonce`) so downstream Server Components can read it via `headers()`.
- **Set CSP response header**: Apply the `Content-Security-Policy` header to the outgoing response.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}
```

- [More detail on Next.js Nonce Configuration](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy#adding-a-nonce-with-middleware)

---

### Question 47ba8301-3829-45c1-90a1-7c98eb14092b

- Why do Next.js applications typically require `'unsafe-inline'` in `style-src`, and what security compromises does this entail?

### Answer

- **Framework style injection**: Next.js, CSS-in-JS libraries (styled-components, Emotion), and streaming SSR inject `<style>` tags dynamically into the DOM stream during component hydration.
- **Lack of style noncing**: Attaching dynamic nonces to every styled-jsx or injected CSS chunk during SSR is complex and not fully supported across all UI component libraries.
- **Security implication**: While `style-src 'unsafe-inline'` exposes the app to CSS injection attacks (e.g., attribute selectors exfiltrating text via background images), script execution is still blocked if `script-src` remains strict.

- [More detail on CSS Injection Risks](https://portswigger.net/research/injecting-styles-into-styles)

---

### Question f5019a28-984b-4ec2-8819-38b47ca0812e

- How should an engineering team roll out a Content Security Policy in production without breaking existing user flows?

### Answer

- **Report-Only Mode**: Start by deploying the header as **`Content-Security-Policy-Report-Only`**; the browser logs violations without blocking script execution or styles.
- **Telemetry endpoint**: Configure `report-to` or `report-uri /api/csp-report` to collect violation reports across real user traffic and analyze false positives from browser extensions, third-party tags, or edge-case routes.
- **Iterative enforcement**: Prune invalid domains, inject missing nonces, and switch to enforced `Content-Security-Policy` once report violation volume stabilizes at zero.

```http
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'nonce-xyz'; report-uri /api/csp-report;
```

- [More detail on MDN Content-Security-Policy-Report-Only](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only)

---

### Question 871a409f-6721-43bf-b021-987ea0b45c21

- What parameters are required for HTTP Strict Transport Security (HSTS), and what operational hazard exists with the `preload` directive?

### Answer

- **HSTS parameters**:
  - `max-age=63072000` (2 years minimum for preload submission).
  - `includeSubDomains` (enforces HTTPS on all subdomains and internal services).
  - `preload` (requests inclusion into hardcoded browser preload lists).
- **Operational hazard with `preload`**: Once a domain is submitted and hardcoded into Chromium/Firefox preload lists, **any non-HTTPS subdomain becomes permanently unreachable** for all users worldwide until a browser release cycle removes it (taking months).

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- [More detail on HSTS Preload Submission](https://hstspreload.org/)

---

### Question d1498b01-4472-4b81-a890-5ca074be9821

- Why is `frame-ancestors 'none'` in CSP preferred over the legacy `X-Frame-Options: DENY` header for clickjacking defense?

### Answer

- **Granular multi-origin control**: `X-Frame-Options` only supports binary options (`DENY`, `SAMEORIGIN`); it cannot allow multiple trusted partner domains to frame a page.
- **CSP `frame-ancestors` flexibility**: `frame-ancestors 'self' https://trusted-partner.com` allows explicit whitelist control over which parents can embed the page inside an `<iframe>`.
- **Precedence**: Modern browsers give precedence to CSP `frame-ancestors` when both headers are present, rendering `X-Frame-Options` an obsolete fallback.

```http
Content-Security-Policy: frame-ancestors 'self' https://partner.example.com;
```

- [More detail on OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)

---

### Question 3918a0cf-789a-412b-b892-0ca07be58914

- What vulnerability does `X-Content-Type-Options: nosniff` prevent, and how do attackers exploit its absence?

### Answer

- **MIME type sniffing**: When this header is absent, browsers may ignore the server's `Content-Type` and attempt to guess the MIME type based on byte content (e.g., executing a file served as `text/plain` or `image/jpeg` as JavaScript if it contains `<script>`).
- **User upload exploit**: An attacker uploads a malicious avatar containing JavaScript (`avatar.jpg`); if requested directly without `nosniff`, the browser sniffs the file as `text/html` or `application/javascript` and executes the script in the domain context.
- **Mandatory header**: Always return `X-Content-Type-Options: nosniff` on all static assets, uploads, and API responses.

- [More detail on MDN X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)

---

### Question 67ba081e-8419-4cb2-8710-18ca09b45e22

- What do Cross-Origin Opener Policy (COOP) and Cross-Origin Embedder Policy (COEP) provide, and why are they required for `SharedArrayBuffer`?

### Answer

- **Spectre side-channel defense**: Modern hardware timing attacks (Spectre) allow malicious code to read memory across origins if high-precision timers or shared memory threads (`SharedArrayBuffer`) are active.
- **COOP (`same-origin`)**: Isolates the browser execution context by ensuring the window cannot share a browsing context group with cross-origin popups or openers (`window.opener` is `null`).
- **COEP (`require-corp`)**: Mandates that every cross-origin subresource loaded in the document explicitly opt in via Cross-Origin Resource Policy (CORP) or CORS.
- **Enabling high-performance APIs**: Together, COOP and COEP put the page in a **Cross-Origin Isolated** state, which modern browsers require to safely unlock `SharedArrayBuffer` and `performance.measureUserAgentSpecificMemory()`.

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

- [More detail on Cross-Origin Isolation Guide](https://web.dev/articles/cross-origin-isolation-guide)

---

### Question b0148fa2-6821-432a-bf01-8ca09be45710

- Why does the absence of CORS headers fail to protect an API endpoint against state-changing write operations (e.g., cross-origin POST requests)?

### Answer

- **CORS blocks reads, not executions**: The browser's Same-Origin Policy (SOP) and CORS evaluate whether JavaScript can **read the HTTP response**. An unauthenticated or simple POST request still travels across origins, arrives at the server, and executes server mutations.
- **Simple requests bypass preflight**: HTML `<form action="https://bank.com/transfer" method="POST">` generates a cross-origin simple request without an `OPTIONS` preflight; the browser automatically attaches ambient cookies if not protected by `SameSite`.
- **Write defense**: CSRF protection (anti-CSRF tokens, SameSite cookies, Origin validation) is required for write mutations; CORS headers alone never protect endpoints against unauthorized writes.

- [More detail on MDN CORS Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

### Question a9810ef2-8921-4b12-ba09-5ca07be58913

- Why is dynamically reflecting the incoming `Origin` header in `Access-Control-Allow-Origin` alongside `Access-Control-Allow-Credentials: true` a critical vulnerability?

### Answer

- **Browser restriction bypassed**: The CORS specification explicitly forbids the combination of `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Credentials: true`.
- **Insecure dynamic reflection**: Lazy developers write `setHeader('Access-Control-Allow-Origin', req.headers.origin)`, reflecting any untrusted caller's origin back to them with credentials allowed.
- **Complete SOP bypass**: Any malicious site can now initiate authenticated fetch requests with `credentials: 'include'` and read full private response payloads, completely destroying the browser's Same-Origin boundary.

```typescript
// ❌ Dangerous: Reflects arbitrary origin with credentials allowed
res.setHeader('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// ✅ Safe: Strict whitelist lookup
const ALLOWED_ORIGINS = new Set(['https://admin.example.com', 'https://app.example.com']);
const origin = req.headers.get('origin');
if (origin && ALLOWED_ORIGINS.has(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

- [More detail on PortSwigger CORS Vulnerabilities](https://portswigger.net/web-security/cors)

---

### Question

- How should a Next.js application configure the `Permissions-Policy` HTTP response header to protect user privacy against third-party embedded iframes?

### Answer

- **Feature delegation restriction**: Use `Permissions-Policy` in `next.config.js` or middleware to explicitly disallow sensitive browser hardware and payment APIs from running in untrusted third-party contexts.
- **Explicit origin binding**: Restrict permissions like `camera`, `microphone`, and `geolocation` to `'self'` or empty `()`, preventing third-party ad widgets, chat embeds, or malicious scripts from covertly accessing user peripherals.

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
          },
        ],
      },
    ];
  },
};
```

- [More detail on Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)

---

### Question

- Trace how the `Referrer-Policy: strict-origin-when-cross-origin` header handles referrer transmission during different navigation flows.

### Answer

- **Same-origin navigation**: Sends the full URL (including path and non-fragment query parameters) when navigating between pages on the same HTTPS origin.
- **Cross-origin HTTPS navigation**: Truncates the referrer to only the origin (`https://example.com/`), stripping sensitive token paths, workspace IDs, or reset keys.
- **Protocol downgrade**: Suppresses the `Referer` header completely if a user navigates from a secure HTTPS origin to an insecure HTTP link.

- [More detail on Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)

---

### Question

- In a Next.js App Router application, what are the CSP security tradeoffs between using Tailwind CSS versus runtime CSS-in-JS libraries (e.g., styled-components)?

### Answer

- **Tailwind CSS**: Compiles all styles into static external `.css` bundles at build time, allowing strict Content Security Policies that completely omit `'unsafe-inline'` from `style-src`.
- **Runtime CSS-in-JS**: Generates and inserts `<style>` tags dynamically into the DOM during client execution, requiring `'unsafe-inline'` or runtime dynamic style hashing in `style-src`, weakening XSS defenses against attribute-based CSS injection.

- [More detail on Next.js Content Security Policy with Styling](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
