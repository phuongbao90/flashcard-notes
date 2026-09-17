# Environments & Configuration

### Question 102816b8-a6c7-4c63-8f2e-10ca788e1ed2

- A feature works flawlessly in local and preview environments, passes staging, but immediately crashes in production due to a third-party payment gateway error. What is the **Staging Fidelity Gap**, and how do senior engineers critique staging environments?

### Answer

- **"Staging lied to us" postmortem pattern**: Staging environments provide false confidence when their architectural behavior diverges from production reality.
- **Common fidelity divergences**:
  1. **Sandbox vs. Production APIs**: Staging connects to third-party test sandboxes (e.g., Stripe Testmode, PayPal Sandbox) that lack production rate limits, fraud blocks, latency spikes, or real Webhook delivery guarantees.
  2. **Data Volume & Query Scale**: Staging databases contain 200 seed rows; production databases contain 20 million rows, causing slow queries to time out in prod that appeared instant in staging.
  3. **CDN & Edge Caching Differences**: Staging often runs without CDN caching, edge routing rules, or strict Content Security Policies (CSP) that break scripts in production.
- **Senior Staging Critique**:
  - Accept that staging will never have 100% fidelity.
  - Rely on **Production Canary Deploys and Feature Flags** for true behavioral verification rather than treating staging approval as an infallible guarantee.
  - Audit deliberate differences (sanitized data, sandbox keys) vs. accidental differences (untracked config drift, stale software versions).

- [More detail on Test Environments and Fidelity](https://martinfowler.com/bliki/TestDouble.html)

---

### Question 6064b528-8de2-4a0b-9006-96f9caa98e22

- Compare the three frontend configuration strategies: **Build-Time Inlining**, **SSR Server Runtime Injection**, and **Runtime Public Fetch (`/config.json`)**. When should each be chosen?

### Answer

- **1. Build-Time Inlining (`NEXT_PUBLIC_*` / `import.meta.env`)**:
  - *Mechanism*: Bundler string-replaces variable references during compilation with constant values.
  - *Pros*: Zero runtime network request, dead code elimination works (e.g., `if (process.env.FLAG) ...` tree-shakes dead branches).
  - *Cons*: Violates "Build once, deploy many"; requires a complete rebuild to change a URL; values are permanently exposed in client JS.
- **2. SSR Server Runtime Injection (Next.js Server Components / HTML `<script>`)**:
  - *Mechanism*: Node server reads process environment at request time and injects a sanitized JSON payload into the HTML `<head>` (`window.__ENV__ = {...}`).
  - *Pros*: Supports immutable container promotion across environments; changes take effect instantly on container restart.
  - *Cons*: Requires an active Node.js server runtime; incompatible with pure static export (SSG to S3/CDN).
- **3. Runtime Public Fetch (`/config.json` for SPAs)**:
  - *Mechanism*: The SPA loads a minimal entry HTML, fetches `/config.json` before mounting the root React tree, and initializes the app context.
  - *Pros*: Works with purely static CDN hosting; allows Docker containers to run `envsubst` on startup to generate `/config.json` dynamically per environment.
  - *Cons*: Introduces a network waterfall blocking initial app mount (hurts First Contentful Paint).

```html
<!-- ✅ Runtime injection pattern in SSR layout head -->
<script
  id="__ENV__"
  type="application/json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      API_URL: process.env.RUNTIME_API_URL,
      SENTRY_DSN: process.env.RUNTIME_SENTRY_DSN,
    }),
  }}
/>
```

- [More detail on 12-Factor App Configuration](https://12factor.net/config)

---

### Question 28f61dc6-7e9c-4040-8d30-734044455979

- Why is modifying environment variables directly in hosting provider web consoles (e.g., editing variables in the dashboard without code review) a severe operational risk, and how should **Configuration as Code** be enforced?

### Answer

- **The console-editing failure mode**:
  - A typo made directly in a web dashboard (e.g., adding an accidental space: `"https://api.domain.com "`) causes a production outage that cannot be traced to any commit.
  - Staging and production configurations drift silently because changes made in one dashboard are forgotten in another.
  - No peer review or rollback history exists for dashboard edits.
- **Configuration as Code (Git-backed environment management)**:
  - Use declarative configuration tools (Doppler, AWS SSM via Terraform, or encrypted `.env.vault`).
  - Configuration changes are committed via pull requests and reviewed by peers.
  - Automated CI syncs validated, diffed variables to hosting providers via their respective APIs, providing a verifiable audit trail.

- [More detail on Doppler Environment Management](https://docs.doppler.com/docs)
- [More detail on Infrastructure as Code for Configurations](https://martinfowler.com/bliki/InfrastructureAsCode.html)
