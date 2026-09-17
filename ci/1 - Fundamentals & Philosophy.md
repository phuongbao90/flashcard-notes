# Fundamentals & Philosophy

### Question da5f26a2-e887-4e14-8e09-7c1be9f66ed3

- In a team operating with two-week release branches (GitFlow), releases frequently stall due to high merge conflicts and production regressions. How does transitioning to **Trunk-Based Development with Feature Flags** solve this, and what is the required engineering discipline?

### Answer

- **The GitFlow bottleneck**: Long-lived feature branches drift from `main`, turning merges into high-stress "merge hell" events where untested integration combinations produce regressions during release week.
- **Trunk-based mechanics**: All engineers merge small, frequent batches (at least daily) directly into `main` (trunk) using short-lived branches (<24h). Incomplete features are wrapped in runtime **feature flags** (dark launches) to keep `main` continuously deployable.
- **Risk reduction via batch size**: Shipping 1% diffs makes bugs instantly isolatable (`git bisect` over 5 commits vs. 200 commits). Debugging a two-line delta takes minutes; debugging a 3-month release takes days.
- **Discipline required**: High test coverage, non-negotiable CI verification, and strict flag lifecycle management (flags must be deleted after release to prevent flag debt).

```typescript
// ✅ Incomplete feature merged to trunk behind a dynamic feature flag
export function CheckoutButton({ cartId }: { cartId: string }) {
  const isOneClickCheckoutEnabled = useFeatureFlag('checkout-one-click-v2');

  if (isOneClickCheckoutEnabled) {
    return <OneClickCheckoutModal cartId={cartId} />;
  }

  return <StandardCheckoutRedirect cartId={cartId} />;
}
```

- [More detail on Trunk-Based Development](https://trunkbaseddevelopment.com/)
- [More detail on Feature Flags and Decoupling Deployment](https://martinfowler.com/articles/feature-toggles.html)

---

### Question c6effed6-b04a-49ed-a482-bb437f4de3b2

- What is the precise operational distinction between **Continuous Delivery** and **Continuous Deployment**, and when is Continuous Delivery the deliberate, senior-level choice for a web frontend?

### Answer

- **Continuous Delivery (CDel)**: Every commit passing CI is automatically built, tested, and packaged into a deployable artifact, but promotion to production requires an explicit manual trigger or business gate (e.g., one-click release).
- **Continuous Deployment (CDep)**: Every passing commit automatically deploys straight to production without human intervention.
- **Deliberate Continuous Delivery use cases**:
  - **Coordinated marketing or external launches**: Business requires synchronized multi-channel release (app stores, PR, marketing landing pages).
  - **Regulated compliance domains**: Healthcare (HIPAA), banking, or fintech where audit rules mandate a dual-control "four-eyes" approval before production modification.
  - **Independent micro-frontend dependencies**: Requiring manual sanity verification across multiple downstream orchestrators during phased enterprise rollouts.
- **Senior interview bar**: Junior engineers describe tools ("we use GitHub Actions for deployment"); senior engineers articulate the exact risk profile and compliance/business model dictating automatic vs. gated releases.

- [More detail on Continuous Delivery vs Deployment](https://martinfowler.com/bliki/ContinuousDelivery.html)

---

### Question 4b3bbe2b-2813-4c87-b347-32493aeabdca

- Your engineering VP considers CI/CD an operational cost center and asks for justification to invest 2 sprints in pipeline infrastructure. How do you leverage **DORA metrics** to build the business case?

### Answer

- **The 4 Core DORA Metrics**:
  1. **Deployment Frequency (DF)**: How often code is deployed to production (Elite: multiple per day).
  2. **Lead Time for Changes (LTTC)**: Time from commit to running in production (Elite: <1 hour).
  3. **Change Failure Rate (CFR)**: Percentage of deployments causing production failure/incident (Elite: 0–5%).
  4. **Mean Time to Restore (MTTR)**: Time to restore service when a production incident occurs (Elite: <1 hour).
- **Frontend pipeline translation**:
  - A 40-minute flaky pipeline throttles DF and inflates LTTC, forcing developers into large, risky branch merges.
  - Automated quality gates and preview deployments directly drive down CFR by catching regressions pre-merge.
  - Fast, one-click rollback mechanisms directly slash MTTR from hours to seconds.
- **Business justification pitch**: "Every 15-minute reduction in CI feedback loop returns ~12 developer-hours per week across our 20-engineer team, while instant rollbacks protect our $50k/hour checkout revenue from extended downtime."

- [More detail on DORA Metrics](https://cloud.google.com/devops/state-of-devops)

---

### Question 344f5b52-9b51-42d5-a897-531a0561a007

- What risks arise from configuring deploy steps directly within hosting provider web consoles (dashboard clicks), and why is **Pipeline as Code** mandatory for engineering maturity?

### Answer

- **Snowflake deployment environments**: Web console configuration creates undocumented, unreproducible settings that exist only in one engineer's head or a proprietary dashboard.
- **Accidental drift & lack of audit trail**: Console updates lack code reviews, change history, and revertability. An accidental toggle modification in production leaves no git trace for incident postmortems.
- **Pipeline as Code guarantees**:
  - Workflows are defined in version-controlled declarations (`.github/workflows/*.yml`, `.gitlab-ci.yml`).
  - Pipeline changes require peer review and test runs just like application code.
  - Branching pipelines enables testing pipeline upgrades (e.g., Node 18 → Node 20) in an isolated branch without breaking team builds.

```yaml
# .github/workflows/ci.yml
# ✅ Version-controlled, reviewed, and reproducible workflow specification
name: Frontend CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm typecheck && pnpm test
```

- [More detail on Pipeline as Code](https://martinfowler.com/bliki/DeploymentPipeline.html)
