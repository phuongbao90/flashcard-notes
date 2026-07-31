# Image Optimisation

### Question

- img vs picture

### Answer

- img: single image source, no art direction, no responsive images
  - use it for: simple images, icons, logos, or any image that does not require different sources for different screen sizes or resolutions.
- picture: multiple image sources, art direction, responsive images
  - use it for: hero images, banners, carousels, or any image that needs to be responsive and/or have different sources for different screen sizes or resolutions.

---

### Question

- How do images impact Web Vitals (specifically LCP and CLS), and how do you optimize for both?

### Answer

- LCP (Largest Contentful Paint): Images (like hero banners) are often the LCP element.
  - Optimization: Do not lazy-load hero images. Use `<link rel="preload">` or Next.js priority prop. Serve modern compressed formats (AVIF/WebP) and fetch from an edge CDN close to the user.
- CLS (Cumulative Layout Shift): Unsized images cause layout shifts when they download and push surrounding content down.
  - Optimization: Explicitly set width and height attributes on `<img>` tags, or set CSS aspect-ratio, allowing the browser to calculate aspect ratio and reserve layout space before the image bytes land.

---

### Question

- Compare AVIF, WebP, and SVG. When should you use each?

### Answer

- AVIF: Next-gen lossy/lossless raster format based on the AV1 video codec. Offers 20-30% better compression than WebP. Best for complex photographs/hero images.
- WebP: Modern raster format widely supported across 98%+ of browsers. Great balance of high compression and universal support.
- SVG: XML-based vector graphics. Resolution-independent and tiny file size for sharp logos, icons, and simple illustrations. (Not for rich photography).

---

### Question

- Explain "Art Direction" in web design and how you would implement it cleanly.

### Answer

- Art Direction means serving visually different versions of an image depending on display constraints, rather than just scaling down a single wide image. For example, showing a full landscape banner on desktop, but swapping to a zoomed-in square crop of the main subject on mobile for legibility.

```html
<picture>
  <!-- Mobile Crop: 1:1 Aspect Ratio -->
  <source media="(max-width: 640px)" srcset="product-square.webp" type="image/webp" />
  <!-- Desktop Banner: 16:9 Aspect Ratio -->
  <source media="(min-width: 641px)" srcset="product-banner.webp" type="image/webp" />
  <img src="product-banner.jpg" alt="Product Name" width="1200" height="675" />
</picture>
```

---

### Question

- Our homepage LCP score degraded from 1.2s to 3.8s after a release. Audit shows the hero image is the bottleneck. What steps do you take to diagnose and fix it?

### Answer

- Diagnosis Steps:
  - Check Network tab in DevTools: Is loading="lazy" accidentally set on the hero image?
  - Check format and size: Is the server serving an uncompressed 4MB PNG/JPEG instead of AVIF/WebP?
  - Check fetch priority: Is the image discovered late in the HTML parser waterfall (e.g., hidden inside CSS background-image or rendered late via client-side JS)?
- Fixes:
  - Change to Next.js `<Image priority />` or add `<link rel="preload" as="image" href="..." fetchpriority="high">` in `<head>`.
  - Ensure the server converts to AVIF/WebP.
  - Avoid using CSS background-image for LCP elements because the browser must parse CSS before initiating the image fetch request.

---

### Question

- Explain how the browser's Preload Scanner handles images vs. normal DOM parsing. Why are CSS background-image properties bad for critical LCP images?

### Answer

- Preload Scanner: Browsers run a secondary, ultra-fast scanner ahead of the main HTML parser. It scans raw HTML for external resources like `<script>`, `<link rel="stylesheet">`, and `<img src="...">` to initiate downloads immediately while the main DOM tree is still building.
- Why CSS background-image hurts LCP:
  - The HTML parser must first fetch and parse the external CSS stylesheet.
  - The browser builds the CSSOM.
  - The render tree matches CSS selectors against DOM nodes.
  - Only then does the browser discover the background-image URL and initiate the network request.
- Takeaway: Always use standard HTML `<img>`, `<picture>`, or `<link rel="preload">` for LCP images so the Preload Scanner can discover them immediately without waiting for CSS execution.

---

### Question

- What does decoding="async" do on an `<img>` tag, and when should you avoid using it?

### Answer

- decoding="async": Allows the browser to decode image bytes asynchronously off the main thread before rendering. This prevents main-thread jank/frame drops during page scrolling or animation when large images are decoded.
- When to use: Below-the-fold images, dynamic galleries, or heavy list views.
- When to avoid: Above-the-fold LCP hero images. Asynchronous decoding can slightly delay the actual painting of the hero image, increasing your overall LCP metric. For LCP images, use decoding="sync" or let the browser use default sync behavior.

---

### Question

- How does the sizes attribute in srcset actually work? What mistake do developers often make with sizes?

### Answer

- How it works: The browser needs to choose the right image from srcset before it has downloaded CSS or calculated the element's layout width. The sizes attribute tells the browser what width the image will take up on screen at different media query breakpoints.
- Formula: Browser calculated image width = viewport width * sizes condition * devicePixelRatio (DPR).
- Common Mistake: Leaving sizes="100vw" on images arranged in a multi-column desktop grid. If a grid item is only 25vw wide on desktop, leaving 100vw forces the browser to download an image 4x larger than necessary.
- Correct Example: sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw".

---

### Question

- Compare On-Demand Image Optimization (e.g., Next.js / Imgix) vs Build-Time Image Generation. What are the trade-offs?

### Answer

- Build-Time Generation (e.g., Gatsby, static sharp scripts):
  - Pros: Zero server compute costs at runtime; files are served directly as static assets from S3/CDN.
  - Cons: Build times balloon exponentially as the site grows to thousands of images; cannot optimize user-uploaded dynamic content.
- On-Demand Optimization (e.g., Next.js /_next/image, Cloudinary, Imgix):
  - Pros: Faster builds; scales infinitely to millions of dynamic dynamic/CMS images; generates exact size requested on first view and caches it at the edge.
  - Cons: Cold-hit latency for the very first request of a specific size; serverless/compute cost for initial transformation.

---

### Question

- What is a custom loader in Next.js `<Image />` (loader prop), and why would you use one?

### Answer

- By default, Next.js routes images through its built-in node/serverless optimization endpoint (/_next/image).
- A custom loader is a client-side function that overrides this default URL builder to delegate optimization to an external dedicated Image CDN (e.g., Cloudinary, Imgix, Fastly, AWS CloudFront).

```ts
const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) => {
  return `https://res.cloudinary.com/demo/image/upload/w_${width},q_${quality || 75}/${src}`;
};

<Image loader={cloudinaryLoader} src="sample.jpg" width={500} height={300} alt="Sample" />
```

- Why use it: Offloads serverless compute costs from Vercel/Node server to a specialized third-party media engine.

---

### Question

- GIF files are notoriously huge. How should you optimize animated images on a modern web application?

### Answer

- Never use .gif directly for heavy animations. GIFs have poor compression and do not support modern multi-frame lossy codecs.
- Solutions:
  - Convert to Video (`<video>` tag with autoplay loop muted playsinline): Replacing a GIF with an MP4/WebM video reduces file size by 80%–90%.
  - Animated WebP / Animated AVIF: Modern image formats support multi-frame animation with superior lossy compression compared to legacy GIF.

---

### Question

- Why use Image from Next.js instead of a normal img tag?

### Answer

- forces width and height (or fill) specifically to guarantee zero CLS by calculating the exact aspect ratio upfront before render.
- It sends the request to an on-demand optimization route (/_next/image). The server fetches the source image, resizes it to the exact requested breakpoint, converts it to WebP/AVIF, and caches it at the edge CDN for subsequent users.

- Red Flag to avoid: Not knowing how fill works (forgetting that fill requires a position: relative/absolute parent container).

---

### Question

- what is wrong with this code snippet?

```tsx
<img src="/hero.png" loading="lazy" style="width: 100%;" />
```

### Answer

- loading="lazy" on a Hero Image: This severely damages LCP because the browser delays fetching the image until after layout calculation. (Fix: Remove loading="lazy" or add priority in Next.js).
- Uncompressed PNG format: .png is huge for hero photos. (Fix: Use AVIF or WebP).
- Missing width & height attributes: Causes massive CLS on initial render. (Fix: Add intrinsic width="1200" height="600").
- No responsive srcset or sizes: Mobile devices will download the full desktop-sized 4K image. (Fix: Add srcset and sizes, or use Next.js `<Image />`).

---

### Question

- what are the problems with hosting nextjs app on VPS - image context?

### Answer

1. Pain Point 1: Heavy CPU & RAM Usage (Resource Starvation)
   - Next.js on-demand image optimization is CPU-intensive. A VPS with limited resources can become overwhelmed when multiple users request large images simultaneously, leading to slow response times or server crashes.
2. ⚠️ Pain Point 2: Ephemeral Disk Cache in Docker / Containers
   - On a VPS, Next.js stores cached images in the local file system at .next/cache/images.
   - The Risk: If you deploy via Docker, PM2, or CI/CD pipelines where containers restart or get replaced on every deploy, your image cache gets completely erased.
   - Every deployment forces your VPS to re-process every image from scratch on the next user visit.
3. ⚠️ Pain Point 3: No Edge Distribution (Global Latency)
   - On Vercel, optimized images are automatically stored on a global Edge CDN (200+ locations worldwide). A user in Tokyo gets the image from a Tokyo server.
   - On a self-hosted VPS in Frankfurt, a user in Tokyo has to fetch images across the ocean directly from your single Frankfurt VPS every time.

---

### Question

- How to solve the problems of hosting nextjs app on VPS - image context?

### Answer

- option 1: Put Cloudflare in front of your VPS
  - "Request Collapsing" (Coalescing)
    - 50 people open your homepage at 10:00 AM, requesting hero.jpg
    - Cloudflare sees 50 identical requests and collapses them into a single request to your VPS
    - Your VPS only processes hero.jpg once, and Cloudflare serves the cached result to all
    - But it wont save you from: 50 users request 50 DIFFERENT uncached images at once -> still overwhelms your VPS
- option 2: Use a Custom Loader (Offload to an External Image CDN)
  - Use a dedicated image CDN (Cloudinary, Imgix, Fastly, AWS CloudFront) to handle on-demand optimization and caching.
  - Your VPS only serves the original source images. The CDN handles resizing, format conversion, and edge caching.
  - This drastically reduces CPU load on your VPS and ensures fast global delivery.

---

### Question

- what happen to static images in nextjs during build time? (e.g. /public/images/hero.png)

### Answer

- During npm run build, Webpack/Turbopack:

  - Reads the local .png file from your disk.
  - Inspects the file header to extract its intrinsic width and height (1920x1080).
  - Generates a tiny SVG/blur placeholder to inline into the JavaScript bundle.

---

### Question

- in what scenarios will image be downloaded in the build time?

### Answer

- Scenario 1: Generating Base64 Blur Placeholders (plaiceholder)
- Scenario 2: Static HTML Export (output: 'export') with Build-Time Plugins

---

### Question

- How do you serve muted autoplaying videos in a Next.js app without user interaction?

### Answer

1. Strip the Audio Track Completely
2. Use Modern Video Codecs (AV1 & WebM) with Fallbacks
   - AV1 <- WebM <- MP4
   ```html
   <video autoplay loop muted playsinline poster="/hero-poster.webp">
     <!-- 1. Smallest / Best quality (Modern Browsers) -->
     <source src="/banner.av1.webm" type="video/webm; codecs=av01.0.05M.08" />
     <!-- 2. WebM fallback -->
     <source src="/banner.vp9.webm" type="video/webm" />
     <!-- 3. Universal MP4 fallback -->
     <source src="/banner.mp4" type="video/mp4" />
   </video>
   ```
3. Mandatory HTML Attributes (autoplay muted playsinline)
4. Visual Tricks to Slash File Size (Bitrate Tuning)
   - lower framerate (e.g., 24fps instead of 60fps)
   - lower resolution (e.g., 720p instead of 1080p)
   - CSS dark overlay to hide compression artifacts
5. Visual Tricks to Slash File Size (Bitrate Tuning)
6. Mobile & Accessibility Optimizations

---

### Question

- Problem with memory leak when serving video

### Answer

- In a Single Page Application (Next.js App Router / React), a user clicks a link to navigate to another page while the background video is buffering.

- The component unmounts, but the browser continues downloading the heavy video stream in the background, consuming user bandwidth and RAM.

- The Fix
  - Clean up the video stream in useEffect when the component unmounts:
  ```ts
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video) {
        video.pause();
        video.removeAttribute("src"); // Stop downloading network buffer
        video.load();
      }
    };
  }, []);
  ```

---
