# Deployment Strategies & Mechanics

### Question 146f076e-b824-45ea-b577-759e9fbd4a9e

- A high-traffic web application undergoes a mid-day deployment. For 45 seconds during the release, users report white screens and 404 errors on JavaScript chunks. What is the **Static Asset Deploy Ordering Race**, and how is it prevented?

### Answer

- **The mid-deploy race condition**:
  - Web bundles use content hashing (`app.[hash].js`) referenced by an un-hashed root entrypoint (`index.html`).
  - If a deploy script uploads `index.html` **before or simultaneously with** uploading new hashed JavaScript chunks to the CDN/S3 bucket, incoming browser requests receive the *new* `index.html`.
  - The browser parses the HTML and immediately requests `chunk-new.[hash].js`, which has not yet finished uploading to S3, returning a **HTTP 404** and crashing the client app.
- **Strict upload ordering protocol**:
  1. **Step 1 — Upload New Hashed Assets First**: Upload all immutable, content-hashed JavaScript, CSS, and media files to object storage / CDN (`/static/*`). These have unique hashes and will not overwrite existing assets.
  2. **Step 2 — Verify Asset Availability**: Ensure CDN edge nodes have synchronized the newly uploaded chunks.
  3. **Step 3 — Deploy / Flip the Entrypoint Last**: Atomically upload or point `index.html` (or flip edge routing) to the new release. Any client receiving the new HTML will find all referenced chunks already live and warm in the cache.

```bash
# ❌ Anti-pattern: Uploads index.html first or randomly in parallel
# aws s3 sync ./dist s3://my-app-bucket --delete

# ✅ Production standard: Two-phase deploy ordering
# Phase 1: Upload new hashed assets with 1-year immutable cache header (No deletes!)
aws s3 sync ./dist/static s3://my-app-bucket/static \
  --cache-control "public, max-age=31536000, immutable"

# Phase 2: Upload root entrypoint with no-cache header
aws s3 cp ./dist/index.html s3://my-app-bucket/index.html \
  --cache-control "public, max-age=0, must-revalidate"
```

- [More detail on S3 and CloudFront Deployment Ordering](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

---

### Question 995a4fea-4895-45f0-99d4-966ed53b8a4f

- Users with tabs open across a deployment click navigation links and encounter `ChunkLoadError: Loading chunk 842 failed`. What is the mechanical cause of **ChunkLoadError**, and what are the three tiers of production defense?

### Answer

- **Root cause**:
  - The user loaded `index.html` from Release A at 9:00 AM.
  - At 10:00 AM, Release B deploys. The deploy script or storage bucket deletes Release A's chunk files.
  - At 10:15 AM, the user clicks a route that dynamically imports a chunk (`React.lazy()` / dynamic route). The browser requests `chunk-842-releaseA.js`, which no longer exists on the server, throwing an unhandled `ChunkLoadError`.
- **Tier 1 — Multi-Release Asset Retention (Infrastructure defense)**:
  - **Never delete old assets immediately**. Configure S3/CDN buckets to retain assets from the last *N* deployments (or apply an S3 Lifecycle rule expiring files after 30–60 days). Old clients can continue loading chunks until they refresh.
- **Tier 2 — React Error Boundary with One-Shot Auto-Reload (Client defense)**:
  - Intercept chunk loading errors in an Error Boundary. If detected, perform a single hard window reload (`window.location.reload()`) to pull the latest `index.html` and chunk manifest.
  - Guard with `sessionStorage` to prevent infinite reload loops if a chunk is genuinely missing due to CDN outage.
- **Tier 3 — Deployment Version Polling & Soft Prompt (UX defense)**:
  - The client periodically polls `/version.json`. When a new version is detected, display a discreet toast: *"A new version of the app is available. Click to refresh."*

```tsx
// ✅ Graceful client recovery from ChunkLoadError via Error Boundary
export class ChunkErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      /Loading chunk .* failed/.test(error.message);

    if (isChunkError) {
      const storageKey = 'chunk_reload_retry';
      const lastReload = sessionStorage.getItem(storageKey);
      
      // Prevent infinite reload loop if CDN is truly down
      if (!lastReload || Date.now() - Number(lastReload) > 10000) {
        sessionStorage.setItem(storageKey, String(Date.now()));
        window.location.reload();
        return { hasError: false };
      }
    }
    return { hasError: true };
  }
}
```

- [More detail on Handling Dynamic Import Failures in React](https://react.dev/reference/react/lazy#error-handling)

---

### Question 44901f3a-4b54-4564-a27e-70ef5179fa51

- What is the principle of **Build Once, Deploy Many**, and how does the compilation behavior of Next.js `NEXT_PUBLIC_` variables challenge this principle?

### Answer

- **Build Once, Deploy Many**: A single immutable build artifact (Docker image, tarball, or bundle) is generated once from a specific commit hash and promoted sequentially through Preview → Staging → Production. Rebuilding per environment introduces critical drift risk (different npm dependencies resolved, different build flags, staging passes but prod breaks).
- **The `NEXT_PUBLIC_` dilemma in Next.js**:
  - `NEXT_PUBLIC_*` environment variables are **inlined into the JavaScript bundle at build time** via Webpack/Turbopack `DefinePlugin`.
  - If `NEXT_PUBLIC_API_URL` is baked during build, promoting the artifact from Staging to Production means the production app would still point to Staging APIs unless rebuilt.
- **Senior architectural solutions**:
  1. **Runtime Server Injection (SSR / Middleware)**: For SSR/Node apps, pass runtime environment variables from Node `process.env` into Server Components or render a `<script id="__ENV__">` tag in `layout.tsx` for client consumption.
  2. **Public Configuration Endpoint (`/config.json`)**: Serve a static `/config.json` fetched by the client before bootstrapping, populated at container startup via runtime environment substitution (`envsubst`).
  3. **Docker Multi-Stage Build with Dynamic Edge Proxies**: Route all API calls to relative paths (`/api/*`) and use Edge middleware or reverse proxies (Nginx/Traefik) to rewrite destinations per environment without altering frontend bundles.

- [More detail on Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

### Question ccdd8e12-c325-4101-9f6a-67740885cc2a

- How do **Atomic Deployments** work under the hood, and why is instant rollback capability the primary lever for reducing Mean Time to Restore (MTTR)?

### Answer

- **The non-atomic deployment failure**: Copying files directly into an active serving directory creates a window where half the files are from Release A and half from Release B, serving mismatched markup and script logic to active users.
- **Under-the-hood atomic switching**:
  - **Symlink Flipping (Node/Nginx)**: Deploy Release B to `/releases/20260917-v2/`. Once complete and healthy, execute an atomic symlink swap: `ln -sfn /releases/20260917-v2 /var/www/current`. Inode changes on POSIX filesystems are instantaneous.
  - **Edge Routing / DNS Aliasing (Vercel / Cloudflare / Netlify)**: Every build is deployed to an immutable deployment ID URL. Production traffic is instantly routed by updating the canonical domain's edge pointer in the routing table.
- **Instant Rollback as MTTR lever**:
  - Re-running CI to revert a commit and rebuild takes 15–30 minutes.
  - Atomic deploys retain previous immutable build IDs. Rolling back is an instant metadata pointer flip (`restore deployment_id_v1`), restoring service in under 5 seconds and reducing MTTR to near zero.

- [More detail on Atomic Deployments](https://martinfowler.com/bliki/BlueGreenDeployment.html)
