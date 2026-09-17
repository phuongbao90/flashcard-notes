# Client-Side Vulnerabilities & XSS Prevention

### Question a7c1824b-3df4-411a-85ef-976d8b9415c1

- Why does React automatically escape JSX text expressions, and what makes `dangerouslySetInnerHTML` vulnerable to bypasses when sanitized using custom regular expressions?

### Answer

- **JSX auto-escaping**: React treats strings inside JSX expressions (e.g., `{userInput}`) as pure text nodes, encoding HTML characters (`<`, `>`, `&`, `"`, `'`) before rendering to prevent script injection.
- **`dangerouslySetInnerHTML` bypass**: Setting `dangerouslySetInnerHTML={{ __html: rawHtml }}` directly writes raw HTML markup into the DOM node, bypassing React's built-in escaping.
- **Regex sanitization failure**: HTML parsing is context-sensitive and tolerant of invalid syntax; attackers easily bypass regular expressions using nested tags, unexpected whitespace, malformed quotes, or obscure HTML entities (e.g., `<svg/onload=alert(1)>`).
- **Mandatory parser-based sanitizer**: Always sanitize HTML using a robust, battle-tested DOM parser like **DOMPurify**.

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function SafeHtmlRenderer({ userHtml }: { userHtml: string }) {
  const cleanHtml = DOMPurify.sanitize(userHtml, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  });

  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
```

- [More detail on React dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [More detail on DOMPurify Security Rules](https://github.com/cure53/DOMPurify)

---

### Question 456b3e10-482a-43ec-95ea-271d1872cc85

- What XSS vulnerabilities emerge when using `react-markdown` with `rehype-raw`, and how must the rendering pipeline be secured?

### Answer

- **Safe markdown by default**: `react-markdown` parses Markdown into an AST and ignores raw HTML tags by default, making it secure against basic script tags.
- **`rehype-raw` opens HTML parsing**: Adding `rehype-raw` enables rendering embedded raw HTML tags inside Markdown content, re-introducing full XSS attack vectors.
- **Mandatory `rehype-sanitize`**: When raw HTML is permitted, `rehype-sanitize` must immediately follow `rehype-raw` in the pipeline with a strict schema allow-list.

```typescript
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[
        rehypeRaw,
        [rehypeSanitize, {
          ...defaultSchema,
          attributes: {
            ...defaultSchema.attributes,
            a: ['href', 'title'],
          },
        }],
      ]}
    >
      {content}
    </ReactMarkdown>
  );
}
```

- [More detail on rehype-sanitize](https://github.com/rehypejs/rehype-sanitize)

---

### Question 810eec14-6fae-4f32-bbec-9d95f87b89e3

- Why does rendering user-supplied SVG inline expose an application to XSS, whereas rendering the same SVG via an `<img>` tag is safe?

### Answer

- **Inline SVG execution context**: SVGs rendered inline into the DOM (e.g., `<svg dangerouslySetInnerHTML=... />` or direct JSX SVG components) are part of the active document; embedded `<script>` tags, `<animate onbegin=...>`, and `<foreignObject>` execute with full access to cookies, session, and DOM.
- **Image tag sandboxing**: When an SVG is loaded via `<img src="image.svg" />`, the browser treats the SVG as an isolated raster image and disables script execution, external resource fetching, and DOM interactions.
- **Serving recommendations**: Serve user-uploaded SVGs strictly via `<img>` tags, or deliver them from a dedicated isolated domain with `Content-Type: image/svg+xml` and `Content-Security-Policy: default-src 'none'`.

- [More detail on OWASP SVG Security](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#svg-scripting-and-xss)

---

### Question b82cecb8-6a39-4458-94ca-1959ce53ee10

- What security risks does Next.js `dangerouslyAllowSVG` in `next.config.js` introduce, and how should it be restricted?

### Answer

- **Next.js Image optimizer risk**: By default, Next.js image optimization blocks SVG files to prevent XSS. Enabling `dangerouslyAllowSVG: true` instructs the image optimizer to serve SVGs.
- **Content-Disposition and CSP**: If `dangerouslyAllowSVG` is enabled, Next.js must also configure `contentSecurityPolicy` (e.g., `default-src 'self'; script-src 'none'; sandbox;`) and `contentDispositionType: 'attachment'` to prevent browser execution when directly navigated to.

```javascript
// next.config.js
module.exports = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

- [More detail on Next.js Image Component SVG Security](https://nextjs.org/docs/app/api-reference/components/image#dangerouslyallowsvg)

---

### Question f6599ad2-6638-4221-a3f8-7b9840d25bfb

- How can user-controlled URLs passed to `<Link href={url}>` or `<a href={url}>` lead to XSS, and how must URL schemes be validated?

### Answer

- **`javascript:` pseudo-protocol**: Browsers execute inline JavaScript when clicking an anchor tag whose `href` begins with `javascript:` (e.g., `<a href="javascript:alert(document.cookie)">`).
- **Scheme allow-listing**: Never rely on regex searching for `"javascript:"` (attackers bypass via control characters or casing: `JavaSCRIPT:`, `javascript&#x3a;`).
- **URL object validation**: Parse the URL with the browser/Node `new URL()` parser and explicitly verify that the protocol matches only approved schemes: `http:`, `https:`, or `mailto:`.

```typescript
export function sanitizeHref(untrustedUrl: string): string {
  try {
    const parsed = new URL(untrustedUrl, 'https://dummy-base.internal');
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (allowedProtocols.includes(parsed.protocol)) {
      return untrustedUrl;
    }
  } catch {
    // Malformed URL
  }
  return '#'; // Fallback safe link
}
```

- [More detail on OWASP URL Scheme Validation](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-3-inserting-untrusted-data-into-html-attributes)

---

### Question e14397cf-643f-42e5-a83f-423588df8831

- What security vulnerabilities occur when receiving `window.postMessage` events without verifying `event.origin`, and what is the proper message validation contract?

### Answer

- **Untrusted message injection**: Any iframe, popup, or cross-origin window can issue `postMessage()` to your window; omitting origin checks allows malicious websites to trigger internal handlers.
- **Origin verification requirement**: Always verify `event.origin === EXPECTED_ORIGIN` before reading `event.data` or executing state transitions.
- **Target origin specificity**: When sending messages via `targetWindow.postMessage(data, targetOrigin)`, never use `'*'`; specify the exact intended recipient origin to avoid leaking tokens to unauthorized frames.

```typescript
window.addEventListener('message', (event: MessageEvent) => {
  if (event.origin !== 'https://trusted-partner.com') {
    return; // Drop unauthorized message
  }

  // Parse and validate payload schema
  const payload = safeParsePayload(event.data);
  if (payload) {
    handlePartnerAction(payload);
  }
});
```

- [More detail on MDN Window.postMessage Security](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concerns)

---

### Question c0158ea9-eb41-4775-9267-27e1f40d85a1

- Why must `localStorage` and `sessionStorage` never be treated as authoritative sources of authentication or authorization truth?

### Answer

- **Attacker writable**: Any client script, XSS vulnerability, or malicious browser extension running in the origin has unrestricted read and write access to `localStorage`.
- **Zero integrity protection**: Storing claims like `{ "role": "admin" }` or `{ "isSubscribed": true }` in `localStorage` allows users to open DevTools or execute scripts to grant themselves elevated UI privileges.
- **Server verification mandatory**: Authorization decisions must always be validated server-side based on cryptographically signed, secure, HTTP-only cookies or verified session records.

- [More detail on OWASP HTML5 Storage Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)

---

### Question df6c79a4-1317-48f8-b39b-ff79ae6b13f1

- How does Client-Side Prototype Pollution occur during recursive object merges or query-string parsing, and how can applications guard against it?

### Answer

- **Polluting `Object.prototype`**: If a deep merge function or query parser (like older versions of `qs` or `lodash.merge`) processes untrusted keys like `__proto__`, `constructor.prototype`, it injects properties into JavaScript's root prototype.
- **Downstream exploit**: Injected prototype properties (e.g., `Object.prototype.isAdmin = true` or `Object.prototype.url = 'malicious.js'`) corrupt application logic, bypass permission checks, or lead to client-side XSS.
- **Mitigation guards**: Block sensitive keys (`__proto__`, `constructor`, `prototype`) during merges, use `Object.create(null)` for key-value dictionaries, or freeze base prototypes with `Object.freeze(Object.prototype)`.

```typescript
function safeDeepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue; // Block prototype pollution vectors
    }
    // merge safely
  }
  return target as T & U;
}
```

- [More detail on Client-Side Prototype Pollution (PortSwigger)](https://portswigger.net/web-security/prototype-pollution/client-side)

---

### Question 519d08e1-45ef-4573-b248-18e0018f2be4

- Why are third-party scripts (analytics, tag managers, chat widgets) the leading cause of real-world frontend security breaches, and how should `next/script` be configured?

### Answer

- **Supply chain compromise**: Third-party scripts execute with full origin privileges; if the vendor's CDN or account is compromised, the injected code can access DOM nodes, keylog input fields, and exfiltrate user cookies.
- **Next.js script loading strategies**: Use `next/script` with `strategy="lazyOnload"` or `strategy="afterInteractive"` to minimize execution interference, and strictly restrict permissions via CSP.
- **Subresource Integrity (SRI)**: Use SRI `integrity="sha384-..."` hashes on static third-party CDNs to ensure scripts matching unexpected hashes are blocked from executing.

```tsx
import Script from 'next/script';

export function AnalyticsWidget() {
  return (
    <Script
      src="https://scripts.trusted-analytics.com/bundle.js"
      strategy="lazyOnload"
      integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
      crossOrigin="anonymous"
    />
  );
}
```

- [More detail on Next.js Script Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [More detail on MDN Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)

---

### Question b48aa410-09de-4b71-9ffc-18a09f3e4e9a

- What is DOM Clobbering, and how can an attacker inject HTML attributes like `id` and `name` to manipulate JavaScript global variables?

### Answer

- **Named property access**: Browsers automatically expose DOM elements with `id` or `name` attributes as properties on the global `window` object (e.g., `<input id="config" value="...">` exposes `window.config`).
- **Global hijacking**: If client-side code checks `const apiUrl = window.config?.apiUrl || defaultUrl;`, an attacker injecting `<a id="config" href="https://attacker.com/steal">` clobbers `window.config` and points API calls to their server.
- **Mitigation**: Avoid relying on implicit globals; access variables via explicit module exports, declare strict local variables, or sanitize HTML with DOMPurify configured with `SANITIZE_DOM: true`.

- [More detail on DOM Clobbering (PortSwigger)](https://portswigger.net/web-security/dom-based/dom-clobbering)

---

### Question 8ba7f401-49ae-425b-ae29-5ca7431e7f30

- Why does spreading user-controlled object properties directly into React JSX elements (`<button {...userProps} />`) create a security vulnerability?

### Answer

- **Attribute injection**: Spreading an unvalidated object allows unexpected properties to be attached to the rendered DOM element.
- **Event handler injection**: If an attacker supplies keys like `dangerouslySetInnerHTML`, `onMouseOver`, or `onFocus`, they can execute arbitrary JavaScript or alter element styling and behavior.
- **Allow-list filtering**: Never spread unknown object shapes directly onto HTML elements; destructure and pass only explicit, expected HTML attributes.

```tsx
// ❌ Dangerous: Spreads untrusted keys like dangerouslySetInnerHTML
<div {...userSubmittedAttributes} />

// ✅ Safe: Explicitly extracts and passes allowed properties
const { title, ariaLabel } = userSubmittedAttributes;
<div title={title} aria-label={ariaLabel} />
```

- [More detail on React Props and Spread Attributes](https://react.dev/learn/passing-props-to-a-component#forwarding-props-with-the-jsx-spread-syntax)
