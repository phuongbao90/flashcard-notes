# Framework & Deployment Hygiene

### Question a1098f01-3829-411a-8bb0-2e45da79ee14

- Why does self-hosting Next.js in Docker require an aggressive patch cadence compared to managed platforms like Vercel?

### Answer

- **Self-hosted patch responsibility**: When running Next.js self-hosted on EC2, Kubernetes, or Docker, your team owns the Node.js runtime, edge routing layer, image optimizer, and container OS. Security patches released by Next.js must be explicitly rebuilt and redeployed.
- **Platform-level mitigations**: Managed platforms like Vercel can deploy immediate platform-wide WAF rules or edge mitigations when zero-day vulnerabilities are disclosed, but self-hosted deployments remain completely vulnerable until the application container is upgraded.
- **Continuous advisory monitoring**: Subscribe to the official `vercel/next.js` GitHub security advisories and enforce Dependabot/Renovate alerts for immediate framework patch cycles.

- [More detail on Next.js GitHub Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [More detail on Next.js Self-Hosting Documentation](https://nextjs.org/docs/app/building-your-application/deploying#self-hosting)

---

### Question 719a08ef-ca30-4e89-8012-7ce90b45a023

- What was the technical root cause of CVE-2025-29927 (`x-middleware-subrequest` bypass), and why does it cement layered authorization as a mandatory pattern?

### Answer

- **Internal header spoofing**: Next.js used the internal HTTP header `x-middleware-subrequest` to track requests that had already been processed by middleware to prevent infinite loops during internal rewrites.
- **Direct bypass**: External clients could send an HTTP request with `x-middleware-subrequest: "1"` directly to the Next.js server; the server trusted the header and skipped executing `middleware.ts` entirely.
- **Single point of failure**: Applications that relied solely on middleware for authentication were completely unprotected; apps that enforced authorization inside their Data Access Layer (DAL) and Server Actions remained protected despite the middleware bypass.

- [More detail on CVE-2025-29927 Advisory](https://github.com/vercel/next.js/security/advisories)

---

### Question 871a49df-8419-482a-a820-5ca07be58916

- Why should `poweredByHeader: false` be configured in `next.config.js`, and what risk does fingerprinting pose?

### Answer

- **Automated reconnaissance**: By default, Next.js sends `X-Powered-By: Next.js` on every HTTP response. Automated vulnerability scanners scan the internet looking for specific framework signatures to launch targeted zero-day exploits.
- **Information disclosure minimization**: Setting `poweredByHeader: false` suppresses the header, reducing exposure to passive framework fingerprinting tools (e.g., Shodan, Wappalyzer).

```javascript
// next.config.js
module.exports = {
  poweredByHeader: false,
};
```

- [More detail on Next.js poweredByHeader Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/poweredByHeader)

---

### Question b01948fa-6721-42cb-b092-18ca09be4573

- Why should production browser source maps (`productionBrowserSourceMaps`) be disabled or restricted in Next.js?

### Answer

- **Source code exposure**: Enabling `productionBrowserSourceMaps: true` outputs `.map` files into `.next/static`, allowing anyone using browser DevTools to read original TypeScript source files, internal comments, proprietary business algorithms, and unreleased feature implementations.
- **Facilitates reverse engineering**: Attackers use source maps to instantly understand backend API contracts, schema structures, and validation boundaries.
- **Secure alternative**: Keep `productionBrowserSourceMaps: false` publicly; upload source maps securely to error monitoring tools (e.g., Sentry, Datadog) using CI secrets and delete local map files before final deployment.

- [More detail on Next.js productionBrowserSourceMaps](https://nextjs.org/docs/app/api-reference/next-config-js/productionBrowserSourceMaps)

---

### Question 47ba018e-5712-421a-a829-87c2b3e409dc

- What security risks exist when using wildcard domains in Next.js `images.remotePatterns`, and how can this lead to Server-Side Request Forgery (SSRF)?

### Answer

- **Next.js image proxy behavior**: The Next.js image optimizer (`/_next/image`) acts as a server-side proxy that fetches external images, optimizes them, and serves them to clients.
- **SSRF via wildcard hostnames**: If `remotePatterns` contains loose wildcards (e.g., `hostname: '**'`), an attacker can request `/_next/image?url=http://169.254.169.254/latest/meta-data/` or internal network endpoints, tricking the Next.js server into exfiltrating cloud metadata or internal services.
- **Strict pattern enforcement**: Specify precise protocols, exact hostnames, and specific pathname prefixes for remote image sources.

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.mycompany.com',
        pathname: '/public-uploads/**',
      },
    ],
  },
};
```

- [More detail on Next.js Image Optimization remotePatterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)

---

### Question 87aa09cf-984b-4ec2-8819-38b47ca08130

- Why must Preview deployments be protected by authentication, and what risks emerge when preview URLs are publicly accessible?

### Answer

- **Leaked unreleased features**: Staging / Preview URLs are often predictable or discoverable via commit history and pull requests; unauthenticated previews expose unreleased features and marketing campaigns.
- **Search engine indexing**: Unprotected preview environments can be crawled by search engines, creating duplicate content issues and indexing non-public staging pages (mitigate with `X-Robots-Tag: noindex`).
- **Data contamination**: Unauthenticated previews allow external attackers to test exploratory exploits against non-production services; protect previews using Vercel Deployment Protection, SSO, or basic auth.

- [More detail on Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)

---

### Question c01948be-8419-4cb2-8710-18ca09b45e25

- How can unvalidated Next.js dynamic route parameters (`params`) lead to path traversal vulnerabilities?

### Answer

- **Untrusted route arguments**: Dynamic route parameters (e.g., `app/documents/[slug]/route.ts`) are populated directly from user-controlled URL segments.
- **Path traversal via filesystem access**: If server code passes raw params directly to filesystem APIs (e.g., `fs.readFile(path.join('/uploads', params.slug))`), an attacker can pass `../../etc/passwd` or encoded `..%2f` to read arbitrary server files.
- **Sanitization & validation**: Validate parameters against strict alphanumeric regexes or Zod schemas, and ensure resolved paths remain within the intended base directory using `path.resolve()`.

```typescript
import path from 'path';
import fs from 'fs/promises';

export async function GET(req: Request, { params }: { params: { filename: string } }) {
  const SAFE_DIR = path.resolve('/var/app/safe_uploads');
  const safeFilename = path.basename(params.filename); // Strips directory traversal sequences
  const targetPath = path.resolve(SAFE_DIR, safeFilename);

  // Assert resolved path does not escape safe directory
  if (!targetPath.startsWith(SAFE_DIR)) {
    return new Response('Access Denied', { status: 403 });
  }

  const content = await fs.readFile(targetPath);
  return new Response(content);
}
```

- [More detail on OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
