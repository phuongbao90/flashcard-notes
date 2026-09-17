# Asset & Optimization Primitives

### Question 3c27b7f3-8605-4de5-bab2-ff46dae400d1

- How does `next/image` mechanically negotiate modern image formats (AVIF/WebP) and generate responsive `srcset` candidates?

### Answer

- **`Accept` header negotiation**: Next.js inspects the incoming HTTP request `Accept` header. If `image/avif` is present and configured in `images.formats`, it serves AVIF; otherwise it tests for `image/webp` before falling back to the original format.
- **Configured breakpoint mapping**: Next.js combines `deviceSizes` (for full/responsive widths) and `imageSizes` (for fixed dimensions) from `next.config.js` to build a deterministic width array.
- **`srcset` generation**: Renders an `<img>` with a generated `srcset` pointing to the internal optimizer endpoint `/_next/image?url=${src}&w=${width}&q=${quality}` for each matched breakpoint.
- **Deterministic variant caching**: The browser matches viewport size and display density against the `srcset`, requesting only the exact transformed variant it requires.

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
```

- [More detail on Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [More detail on next/image API Reference](https://nextjs.org/docs/app/api-reference/components/image)

---

### Question 9c642777-2a7c-4e4c-9516-ee8dc62973d5

- Why does omitting the `sizes` attribute on responsive or `fill` images in `next/image` cause severe mobile performance degradation?

### Answer

- **Preload scanner limitation**: Browsers parse HTML and start downloading images before parsing stylesheets or calculating element layouts. The browser cannot know an image's computed CSS width in advance.
- **HTML spec default (`100vw`)**: Without an explicit `sizes` attribute, browsers assume the image occupies `100vw` (100% of the viewport width) across all screen sizes.
- **Oversized mobile downloads**: On high-DPI mobile devices (e.g. 3x pixel ratio), an omitted `sizes` attribute causes the browser to select an image candidate suitable for a full 100vw screen (~1080px–1200px wide) even if CSS constrains the image to a tiny 100px thumbnail.
- **Precise `sizes` definition**: Supply media queries describing layout allocation so the browser selects the smallest adequate candidate from `srcset`.

```tsx
// Bad: browser assumes 100vw, downloading desktop-sized image on mobile
<Image src="/thumbnail.jpg" alt="Thumbnail" fill />

// Good: informs browser of exact layout dimensions across viewports
<Image
  src="/thumbnail.jpg"
  alt="Thumbnail"
  fill
  sizes="(max-width: 768px) 100px, (max-width: 1200px) 200px, 300px"
/>
```

- [More detail on next/image sizes prop](https://nextjs.org/docs/app/api-reference/components/image#sizes)
- [More detail on Responsive Images on MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)

---

### Question 2e2e4603-fc66-41e1-8c56-eecc19a56ea1

- What mechanical changes does the `priority` prop trigger in `next/image`, and why is adding it to non-LCP images an anti-pattern?

### Answer

- **Preload injection**: Injects a `<link rel="preload" as="image" href="..." imageSrcSet="..." imageSizes="...">` tag into the document `<head>`.
- **Eager loading attributes**: Sets `fetchpriority="high"` and disables native lazy loading by assigning `loading="eager"` to the rendered `<img>` element.
- **Bypasses hydration delay**: The browser's preload scanner initiates the network fetch immediately upon reading `<head>`, without waiting for React scripts to download, execute, or hydrate.
- **Bandwidth contention anti-pattern**: Applying `priority` to non-LCP or below-the-fold images causes high-priority network contention against critical CSS, JS runtime bundles, and the actual LCP asset, actively degrading LCP.

```tsx
// Use priority ONLY on the confirmed Largest Contentful Paint (LCP) element
export default function HeroBanner() {
  return (
    <Image
      src="/hero.jpg"
      alt="Product Hero"
      width={1200}
      height={600}
      priority // High priority preload in <head>
    />
  );
}
```

- [More detail on next/image priority prop](https://nextjs.org/docs/app/api-reference/components/image#priority)
- [More detail on Optimizing LCP on web.dev](https://web.dev/articles/optimize-lcp)

---

### Question 971b3a01-c0c0-4351-bdf4-02b273b7c034

- What CSS and DOM constraints must be met when using the `fill` prop on `next/image` to prevent broken layouts or zero-height collapses?

### Answer

- **Absolute positioning**: The `fill` prop styles the underlying `<img>` with `position: absolute; inset: 0; width: 100%; height: 100%`, removing it from the normal document flow.
- **Positioned container required**: The immediate parent element must establish a positioning context by declaring `position: relative`, `position: fixed`, or `position: absolute`.
- **Explicit container dimensions**: The parent container must define a layout size via explicit width/height, CSS `aspect-ratio`, or grid/flexbox constraints; otherwise, a parent with `height: auto` collapses to `0px`.
- **Aspect ratio handling**: Use CSS `object-fit: cover` or `object-fit: contain` on the image alongside `overflow: hidden` on the parent to avoid image distortion.

```tsx
// Correct pattern for dynamic responsive containers
<div className="relative w-full aspect-video overflow-hidden">
  <Image
    src="/scene.jpg"
    alt="Landscape"
    fill
    sizes="(max-width: 768px) 100vw, 1200px"
    className="object-cover"
  />
</div>
```

- [More detail on next/image fill prop](https://nextjs.org/docs/app/api-reference/components/image#fill)

---

### Question db284c63-32a0-40ae-96c6-58f918300625

- How does `placeholder="blur"` differ mechanically between static local image imports and remote dynamic images in `next/image`?

### Answer

- **Static local imports**: Next.js analyzes local files (`import banner from './banner.png'`) at build time, computes dimensions, and automatically generates an inline base64 blurred placeholder string into `blurDataURL`.
- **Remote dynamic images**: Build-time static analysis cannot access remote URLs. Passing `placeholder="blur"` without a manually provided `blurDataURL` throws a runtime error.
- **Server-side blur generation**: For dynamic or CMS images, compute a tiny base64 placeholder (e.g. 10x10 px WebP/PNG or SVG) on the server at data-fetch time using tools like `plaiceholder` or `sharp`.

```tsx
import Image from 'next/image';
import localHero from '@/public/hero.png';

// 1. Static import: blurDataURL generated automatically
export function StaticBanner() {
  return <Image src={localHero} alt="Hero" placeholder="blur" />;
}

// 2. Remote image: blurDataURL must be provided explicitly
export function RemoteBanner({ url, blurData }: { url: string; blurData: string }) {
  return (
    <Image
      src={url}
      alt="Remote Hero"
      width={800}
      height={400}
      placeholder="blur"
      blurDataURL={blurData} // Base64 data URI generated server-side
    />
  );
}
```

- [More detail on next/image placeholder prop](https://nextjs.org/docs/app/api-reference/components/image#placeholder)
- [More detail on next/image blurDataURL](https://nextjs.org/docs/app/api-reference/components/image#blurdataurl)

---

### Question a3981c9a-4e29-40c6-860f-b85ce872c282

- Why does the Next.js Image Optimizer execute on-demand at request time rather than during `next build`, and how are transformed variants cached?

### Answer

- **Combinatorial build explosion**: Pre-generating all combinations of image sizes (`deviceSizes` + `imageSizes`), modern formats (AVIF, WebP), and quality values across thousands of assets scales exponentially $O(N \times S \times F)$, leading to unmanageable build times and deployment sizes.
- **On-demand transformation**: Next.js delegates image transformation to the server runtime (using `sharp` in Node.js) when a client requests `/_next/image?url=...&w=...&q=...`.
- **Filesystem cache**: Transformed images are cached locally on the server under `.next/cache/images` to avoid re-processing identical subsequent requests.
- **CDN edge caching**: Responses include cache headers (`Cache-Control: public, max-age=31536000, must-revalidate`), allowing CDN edge proxies to serve subsequent requests globally without hitting the origin server.

- [More detail on Next.js Image Optimization Architecture](https://nextjs.org/docs/app/building-your-application/optimizing/images#how-it-works)

---

### Question 618707bb-bb5a-4829-b106-9d9ba625ab6c

- What security vulnerabilities does `images.remotePatterns` mitigate compared to legacy `images.domains`, and how is it structured?

### Answer

- **SSRF and open proxy prevention**: An unrestricted image optimizer can be abused as a public proxy to conduct Server-Side Request Forgery (SSRF) against internal network IPs or orchestrate DoS attacks via CPU-intensive resizing.
- **Multi-tenant bucket protection**: Legacy `domains: ['s3.amazonaws.com']` allowed any user to proxy images from any third-party AWS S3 bucket through your server.
- **Granular restriction**: `remotePatterns` enforces strict protocol (`http` vs `https`), specific hostnames with wildcard globbing, specific ports, and exact `pathname` matching prefixes.

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.example.com',
        port: '',
        pathname: '/media/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.cdn.mysite.com',
      },
    ],
  },
};

export default nextConfig;
```

- [More detail on remotePatterns Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/images#remotepatterns)

---

### Question 3843e6da-dfe6-417c-8026-0102001dd331

- What failure occurs when using default `next/image` with `output: 'export'`, and what are the two architectural solutions?

### Answer

- **Runtime optimizer failure**: Static HTML export (`output: 'export'`) eliminates the Node.js server runtime; without a server, the default on-demand optimizer endpoint `/_next/image` cannot run, causing `next build` to throw an error.
- **Solution 1 (`unoptimized: true`)**: Enable `images: { unoptimized: true }` in `next.config.js`. Disables server-side resizing and format conversion, serving source files directly while preserving width/height layout attributes.
- **Solution 2 (Custom edge loader)**: Implement a custom loader function (or configure third-party loaders like Cloudinary, Imgix, or Akamai) to offload transformations to an external edge image service while maintaining responsive `srcset` generation.

```typescript
// app/image-loader.ts
export default function customLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return `https://cdn.example.com/${src}?w=${width}&q=${quality || 75}&auto=format`;
}
```

- [More detail on Static Export Image Optimization](https://nextjs.org/docs/app/building-your-application/deploying/static-exports#image-optimization)
- [More detail on Custom Image Loaders](https://nextjs.org/docs/app/api-reference/components/image#loader)

---

### Question 39c58f2f-23dd-4f76-a4d2-935b916c916d

- How does tuning the `quality` prop affect payload size and visual fidelity across WebP and AVIF formats?

### Answer

- **Default baseline (75)**: Next.js defaults to `quality={75}`, which represents the standard knee of the lossy compression curve balancing file size and Structural Similarity Index (SSIM).
- **Diminishing returns**: Increasing quality from 75 to 90+ can double the file size while offering imperceptible improvements to human eyes on standard and high-DPI displays.
- **Aggressive optimization with AVIF**: AVIF maintains structural edges and gradients better than WebP at lower bitrates; high-resolution hero images can often drop to `quality={60–65}` with 20–30% byte savings and zero noticeable artifacts.
- **High-contrast UI graphics**: For screenshots or graphics with sharp text and thin lines, lossy artifacts become visible at lower qualities; keep `quality={85}` or use uncompressed/vector SVG formats.

- [More detail on next/image quality prop](https://nextjs.org/docs/app/api-reference/components/image#quality)
- [More detail on WebP and AVIF Compression Comparison](https://web.dev/articles/serve-images-webp)

---

### Question cd65fd57-4967-4303-9268-c65f95465efe

- What are the root mechanical causes of image-attributed Cumulative Layout Shift (CLS), and how does `next/image` prevent them?

### Answer

- **Zero-height initial allocation**: Standard HTML `<img>` elements without explicit dimensions render as 0×0 px during initial layout pass. When image bytes download, the browser dynamically reflows the layout, shoving content downward.
- **Aspect-ratio space reservation**: `next/image` requires explicit `width` and `height` (or inferred from static imports). It computes the aspect ratio and applies `aspect-ratio: auto [width] / [height]` and `height: auto` in CSS, reserving the exact layout box before bytes arrive.
- **Container-constrained `fill`**: When using `fill`, the image is positioned absolutely (`position: absolute; inset: 0`). Zero CLS depends on the parent container reserving space via fixed dimensions or CSS `aspect-ratio`.
- **Responsive reflow stability**: As the viewport resizes, reserved space scales proportionally with the defined aspect ratio, preventing reflow jitter.

- [More detail on Optimizing Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [More detail on next/image Dimensions](https://nextjs.org/docs/app/building-your-application/optimizing/images#image-sizing)

---

### Question d90242eb-7fe0-4540-a1fc-753c7496ae66

- How do you diagnose image-induced LCP degradation and incorrect `sizes` props using Chrome DevTools and Lighthouse?

### Answer

- **Lighthouse "Properly size images"**: Flags images where the transferred natural resolution exceeds the rendered display size by more than 4KB–25KB, signaling a missing or misconfigured `sizes` prop.
- **Lighthouse "Preload Largest Contentful Paint image"**: Triggers when the LCP image element is discovered late or uses lazy loading, indicating a missing `priority` prop.
- **DevTools Network priority inspection**: In Chrome DevTools Network panel, inspect the **Priority** column. The LCP image must show **High** or **Highest**; an LCP image marked **Low** indicates native lazy loading was not disabled.
- **Performance panel LCP sub-part breakdown**: Check the 4 phases of LCP:
  - **TTFB**: Server response latency.
  - **Resource Load Delay**: High delay indicates missing `<link rel="preload">` (`priority`).
  - **Resource Load Duration**: High duration indicates oversized payload (wrong `sizes`, uncompressed format, or excessive `quality`).
  - **Element Render Delay**: High delay indicates main-thread blockage or hydration delay.

- [More detail on Lighthouse Image Audits](https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images)
- [More detail on Deconstruct the LCP metric on web.dev](https://web.dev/articles/optimize-lcp#lcp-breakdown)

---

### Question ecd34c6e-2183-4f2e-8127-bba6c52e8c38

- How does `next/font` mechanically achieve zero runtime network requests and GDPR privacy compliance for web fonts?

### Answer

- **Build-time asset download**: During `next build`, Next.js downloads the required Google Font binary files (`.woff2`) and associated CSS stylesheets directly from Google's servers.
- **Static local hosting**: Font binaries are stored directly in `.next/static/media` and served locally from the same origin as application assets.
- **Zero external roundtrips**: At runtime, client browsers make zero DNS lookups, TLS negotiations, or HTTP requests to `fonts.googleapis.com` or `fonts.gstatic.com`.
- **Privacy compliance**: Eliminates telemetry exposure (client IP address, browser User-Agent) to external font providers, ensuring compliance with strict privacy regulations (e.g. GDPR) without user consent banners for fonts.

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

// Downloaded at build time, self-hosted at runtime
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

- [More detail on Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [More detail on Google Fonts in Next.js](https://nextjs.org/docs/app/api-reference/components/font#google-fonts)

---

### Question 624b451c-7524-4354-ac71-8ebb0dc73226

- How does `next/font` eliminate font-swap Cumulative Layout Shift (CLS) using automated font metric overrides and `size-adjust`?

### Answer

- **The FOUT layout shift problem**: When web fonts load asynchronously (`display: 'swap'`), the browser temporarily displays a local fallback font (e.g. Arial). Because glyph dimensions and line metrics differ, swapping to the web font causes lines to wrap and content to shift.
- **Build-time metric extraction**: `next/font` reads the internal OpenType/TrueType metrics (ascent, descent, line gap, and glyph bounding boxes) of the target web font.
- **Generated fallback `@font-face`**: Next.js automatically calculates and outputs a dedicated fallback `@font-face` definition utilizing CSS `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override`.
- **Pixel-matched fallback rendering**: The system fallback font is stretched or squeezed to match the exact vertical and horizontal space of the web font, producing 0 layout shift during the font swap.

```css
/* Automatically generated by next/font under the hood */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  ascent-override: 90.49%;
  descent-override: 22.56%;
  line-gap-override: 0.0%;
  size-adjust: 107.06%;
}
```

- [More detail on next/font zero layout shift](https://nextjs.org/docs/app/building-your-application/optimizing/fonts#zero-layout-shift)
- [More detail on CSS size-adjust on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust)

---

### Question 567194f2-1edf-44c5-8e6a-627b3ef921e3

- What are the performance trade-offs between variable fonts, static weight arrays, subsetting, and `display: 'swap'` in `next/font`?

### Answer

- **Variable fonts over static weights**: Variable fonts consolidate an infinite spectrum of weights and optical sizes into a single compact `.woff2` file, eliminating multiple HTTP requests required for static weight arrays (`weight: ['400', '600', '700']`).
- **Character subsetting**: Specifying `subsets: ['latin']` strips unused glyphs (e.g. Cyrillic, Greek, Japanese), reducing font binary payloads from several megabytes to ~20KB–30KB.
- **`display: 'swap'` default**: Forces immediate text display using the metric-matched fallback font, preventing Flash of Invisible Text (FOIT) and reducing Largest Contentful Paint (LCP) time.
- **CSS variable integration**: When applied to specific component subtrees or Tailwind setups, instantiate fonts with the `variable` option to expose a CSS custom property rather than applying heavy utility classes directly to `<html>`.

```typescript
// app/fonts.ts
import { Inter, Roboto_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // Exposes CSS variable
});

export const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});
```

- [More detail on Specifying Subsets in next/font](https://nextjs.org/docs/app/api-reference/components/font#subsets)
- [More detail on Using Multiple Fonts with CSS Variables](https://nextjs.org/docs/app/building-your-application/optimizing/fonts#using-multiple-fonts)

---

### Question 1cde1b4a-5f58-48cb-828c-f58e8c38c0e6

- Compare the execution timing, DOM placement, and use cases of the four `next/script` strategies: `beforeInteractive`, `afterInteractive`, `lazyOnload`, and `worker`.

### Answer

- **`beforeInteractive`**: Injected into `<head>` before page hydration or Next.js engine runtime executes. Runs synchronously before user interaction. *Use case*: Critical polyfills, bot detection, security verification.
- **`afterInteractive` (default)**: Injected client-side immediately after Next.js completes page hydration. Does not block initial HTML parsing or hydration. *Use case*: Tag managers, standard analytics, measurement tools.
- **`lazyOnload`**: Injected during browser idle periods via `requestIdleCallback` after all document resources load. *Use case*: Chat widgets, social media embeds, customer feedback widgets.
- **`worker` (experimental)**: Relocates and executes script execution within a Web Worker thread using Partytown, preventing third-party scripts from starving the main thread. *Use case*: Heavy third-party tracking scripts.

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Runs after hydration */}
        <Script src="https://example.com/analytics.js" strategy="afterInteractive" />
        {/* Runs during idle time */}
        <Script src="https://example.com/chat-widget.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
```

- [More detail on next/script Strategies](https://nextjs.org/docs/app/building-your-application/optimizing/scripts#strategy)
- [More detail on next/script API Reference](https://nextjs.org/docs/app/api-reference/components/script)

---

### Question a327cca7-7534-42b4-800b-c47dd3f73095

- How do you match `next/script` strategies to Consent Management Platforms (CMPs) versus Analytics trackers to avoid legal violations and performance regressions?

### Answer

- **Consent Management Platforms (e.g. OneTrust, Didomi)**: Must use `strategy="beforeInteractive"`. The CMP script must execute and register user consent preferences before downstream tracking scripts fire; delaying execution causes tracking race conditions or illegal tracking before consent is registered.
- **Placement constraint**: `beforeInteractive` scripts must be declared inside the root layout (`app/layout.tsx`) or document; they cannot be defined in nested page routes.
- **Analytics trackers (e.g. Google Analytics, Segment)**: Must use `strategy="afterInteractive"`. Loading analytics via `beforeInteractive` unnecessarily delays page hydration and blocks the main thread during critical initial paint.
- **Event listener callbacks**: Leverage `onLoad` and `onReady` callbacks on `next/script` to ensure tracking initialization code executes only after the script has fully mounted.

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Critical: CMP must load before hydration and trackers */}
        <Script
          src="https://cdn.consent-manager.com/cmp.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
        {/* Standard: Analytics loads after hydration */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

- [More detail on next/script beforeInteractive](https://nextjs.org/docs/app/api-reference/components/script#beforeinteractive)
- [More detail on Script Event Handlers](https://nextjs.org/docs/app/api-reference/components/script#onload)

---

### Question 497ece0d-9f55-441b-8bf6-4581e68e5029

- How does `next/form` implement progressive enhancement for GET search/filter forms, and how does it optimize client-side transitions?

### Answer

- **Progressive enhancement baseline**: Renders a standard HTML `<form>` element. If JavaScript is disabled or fails to load, form submissions trigger a standard HTTP GET navigation to the action URL.
- **Client-side transition enhancement**: When JavaScript hydrates, `next/form` intercepts the native submit event and executes an App Router client-side transition (`router.push`) using the form's serialized key-value pairs as query parameters.
- **Layout preservation**: Client-side navigation avoids a destructive full-page reload, preserving existing React client state and eliminating re-rendering of unchanged root and parent layouts.
- **Search parameter synchronization**: Automatically updates browser URL history and `searchParams` props across Server and Client Components in the target route segment.

```tsx
// app/products/search-bar.tsx
import Form from 'next/form';

export default function SearchBar() {
  return (
    // Enhances to client-side navigation to /products?query=value
    <Form action="/products">
      <input name="query" placeholder="Search products..." />
      <button type="submit">Search</button>
    </Form>
  );
}
```

- [More detail on next/form Component](https://nextjs.org/docs/app/api-reference/components/form)
- [More detail on Forms and Mutations in Next.js](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

### Question 7be2be31-aed2-4e72-98fa-0a9910d2bc83

- How does `next/form`'s automatic prefetching optimize search and filter routes, and how does it handle dynamic query results?

### Answer

- **Viewport-based prefetching**: When `<Form action="/search">` enters the viewport, Next.js automatically prefetches the target route segment (`/search`) in the background.
- **Static shell & loading UI prefetching**: Next.js prefetches and caches the target route's shared layout and `loading.tsx` UI in the client-side Router Cache.
- **Instant submission response**: When the user submits the form, the browser navigates immediately without waiting for server response, displaying the cached layout and loading skeleton instantly while data streams in.
- **Dynamic query execution**: Because search queries are dynamic and unknown prior to user input, the specific query-filtered data is executed on-demand at submission time rather than during viewport prefetch.

```tsx
// app/page.tsx
import Form from 'next/form';

export default function HomePage() {
  return (
    // Automatically prefetches /search layout and loading.tsx when visible
    <Form action="/search" prefetch={true}>
      <input name="q" />
      <button type="submit">Search Catalog</button>
    </Form>
  );
}
```

- [More detail on next/form prefetch prop](https://nextjs.org/docs/app/api-reference/components/form#prefetch)
