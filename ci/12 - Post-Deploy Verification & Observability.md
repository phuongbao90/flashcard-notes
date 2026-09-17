# Post-Deploy Verification & Observability

### Question 8b13f2d2-0d35-43a5-9627-a7291ccd43db

- A production release introduces an unhandled TypeError. The on-call engineer opens Sentry and sees minified, useless stack traces (`at a.b (chunk-781.js:1:342)`). What pipeline step was missing, and how are **Source Map Uploads** secured?

### Answer

- **The unmapped minified stack trace problem**: Production bundles are aggressively mangled, minified, and tree-shaken. Without source maps, error monitoring platforms cannot map compiled errors back to original TypeScript source lines, turning incident triage into guesswork.
- **Source map pipeline integration**:
  - During the CI build step, compile source maps (`productionBrowserSourceMaps: true` or hidden source maps).
  - Use the Sentry CLI / GitHub Action (`@sentry/nextjs`) to upload the `.map` files directly to Sentry's private API, tagging them with the exact git commit SHA (`release: my-app@commit_sha`).
- **Security best practice (Never serve maps publicly)**:
  - Configure the build to delete or exclude `.map` files from public static hosting (`.next/static/**/*.map`) **after** uploading to Sentry.
  - Publicly accessible source maps expose internal source code, proprietary algorithms, and internal API structures to reverse engineering.

```yaml
# ✅ Uploading source maps to Sentry and cleaning public build output
- name: Upload Source Maps to Sentry
  uses: getsentry/action-release@v1
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: acme-corp
    SENTRY_PROJECT: web-frontend
  with:
    environment: production
    version: ${{ github.sha }}

- name: Scrub Public Source Maps
  run: rm -f .next/static/**/*.map
```

- [More detail on Sentry Source Maps Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#source-maps)

---

### Question dc7b858a-9945-487f-b956-3297c547dc7d

- How do **Deployment Markers** on observability dashboards turn hours of "git archaeology" into seconds of incident diagnosis?

### Answer

- **The incident correlation challenge**: When error rates spike or API latency jumps, engineers waste hours asking in Slack: *"Did someone deploy something recently?"* or bisecting recent PRs.
- **Deployment marker mechanics**:
  - The final step of the deploy pipeline sends a webhook or API event to monitoring platforms (Datadog, New Relic, Sentry, Grafana) annotating the deployment event with commit hash, author, PR title, and timestamp.
  - Dashboards render a vertical colored line or banner across all time-series graphs at the precise minute the release went live.
- **Instant causal diagnosis**:
  - If the 500-error graph or Core Web Vitals LCP curve spikes immediately following the vertical deployment marker, causality is established in seconds.
  - Incident response immediately initiates a rollback of that specific release version rather than investigating infrastructure or database anomalies.

```yaml
# ✅ Sending deployment event marker to Datadog
- name: Post Datadog Deployment Event
  run: |
    curl -X POST "https://api.datadoghq.com/api/v1/events" \
      -H "DD-API-KEY: ${{ secrets.DD_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Frontend Deployed: ${{ github.sha }}",
        "text": "PR: ${{ github.event.head_commit.message }} by ${{ github.actor }}",
        "tags": ["service:frontend", "env:production", "version:${{ github.sha }}"]
      }'
```

- [More detail on Datadog Deployment Tracking](https://docs.datadoghq.com/tracing/guide/deployment_tracking/)

---

### Question 2a2153a5-d9f2-444e-9a3b-14a5e3b6669e

- What are **Post-Deploy Smoke Tests**, and how can they be wired to trigger **Automated Rollbacks** without human intervention?

### Answer

- **The post-deploy verification gap**: A green build passing mock-heavy unit tests in CI does not guarantee the live production CDN, edge DNS, environment variables, or database connections are operational.
- **Automated Smoke Test Mechanics**:
  - Immediately following an atomic deploy, CI executes a lightweight, high-priority synthetic test suite against the live production URL.
  - Asserts critical user journeys:
    1. HTTP 200 on root and primary marketing paths.
    2. Successful synthetic test login via test user account.
    3. Add-to-cart API responds with valid payload.
    4. Sentry health ping / telemetry reporting works.
- **Automated Rollback trigger**:
  - If any critical smoke test assertion fails within 60 seconds post-deploy, the pipeline immediately invokes the cloud host rollback API (e.g., flipping the routing pointer back to the previous deployment ID).
  - Pings an urgent incident alert to Slack/PagerDuty: *"Release v2 failed post-deploy smoke; automated rollback to v1 executed in 4.2s."*

- [More detail on Synthetic Monitoring and Smoke Tests](https://martinfowler.com/bliki/SyntheticMonitoring.html)
