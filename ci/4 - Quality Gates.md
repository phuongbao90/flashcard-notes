# Quality Gates

### Question a2585250-626b-40e4-a995-ff2526f16dce

- A developer imports a heavy date library (`moment.js`) inside a common UI utility component, doubling the main bundle size. How do **Bundle Size Budgets** catch this before merge, and how are budgets enforced in CI?

### Answer

- **The silent bundle bloat problem**: Code reviewers cannot gauge bundle footprint changes from inspecting git diffs; an innocuous `import { format } from 'heavy-lib'` can pull in 400KB of un-tree-shaken dependencies.
- **Automated budget gates (`size-limit` / `@next/bundle-analyzer`)**:
  - CI compiles the application and runs `size-limit` against pre-configured chunk thresholds.
  - Compares the PR's bundle size against the baseline commit (`main`).
  - If any route bundle or shared vendor chunk exceeds the budget threshold (e.g., `+10KB` regression limit or absolute `180KB` cap), the job exits with a non-zero code, blocking the merge.
- **PR feedback bot**: Posts a GitHub comment showing a markdown table diff of changed assets and chunk sizes, making performance impact an explicit code review discussion.

```json
// .size-limit.json
[
  {
    "path": ".next/static/chunks/app/page-*.js",
    "limit": "120 KB",
    "name": "Landing Page JS"
  },
  {
    "path": ".next/static/chunks/main-*.js",
    "limit": "180 KB",
    "name": "Global Shared Runtime"
  }
]
```

- [More detail on size-limit](https://github.com/ai/size-limit)
- [More detail on Next.js Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)

---

### Question bb2f426f-2dfa-4d03-a9dc-a6f19dbaade9

- Why is setting an arbitrary **80% Code Coverage** hard gate an anti-pattern for senior teams, and how does **Coverage Ratcheting** provide a superior quality guarantee?

### Answer

- **The Goodhart's Law trap**: When an arbitrary target (e.g., 80%) becomes the metric, developers write tautological tests that assert execution (`expect(component).toBeTruthy()`) rather than correctness, just to cross the threshold.
- **Coverage proves execution, not correctness**: 100% coverage on a function simply means every line executed; it does not prove edge cases, race conditions, or business validation rules are properly asserted.
- **Coverage Ratcheting (Delta-based enforcement)**:
  - Enforce that a PR **must not decrease overall repo coverage** (e.g., `fail if coverage delta < -0.1%`).
  - Enforce **patch coverage**: 100% of newly added lines in the PR diff must be tested, without requiring immediate retroactive testing of ancient legacy modules.
  - Over time, ratchet up the overall baseline monotonically as code is refactored or added.

```yaml
# Codecov / Jest configuration enforcing patch coverage without blocking on legacy debt
coverageThreshold:
  global:
    branches: 75
    functions: 75
    lines: 75
  # ✅ Ratchet rule: new PR lines must maintain high quality
  './src/**/*.ts':
    lines: 90
```

- [More detail on Coverage Ratcheting and Code Quality](https://martinfowler.com/bliki/TestCoverage.html)

---

### Question 23801793-a10a-4d2b-801d-102db78fd993

- Lighthouse CI scores vary by ±15 points between consecutive CI runs on the same commit. What causes this flakiness, and how do you stabilize **Lighthouse CI / A11y Quality Gates**?

### Answer

- **Flakiness root cause**: Shared public CI runner VMs (e.g., standard GitHub Actions runners) have unpredictable CPU throttling, noisy neighbors, and volatile network latency, heavily skewing Performance metric calculations (LCP, TBT).
- **Stabilization strategy**:
  - **Isolate non-performance metrics**: Make **Accessibility (axe-core)**, **Best Practices**, and **SEO** hard blocking gates (assert `minScore: 0.95` or `1.0`). These are deterministic DOM/meta audits that never flake.
  - **Median across runs**: For performance scores, configure LHCI to run 3–5 iterations per URL (`numberOfRuns: 3`) and evaluate the **median run**.
  - **Budget on raw metrics over aggregate scores**: Assert against raw, deterministic budgets (e.g., Total JS Transfer Size `< 250KB`, Cumulative Layout Shift `< 0.05`) rather than the composite Performance score (0–100).
  - **Self-hosted / Bare-metal runner**: Run performance benchmarking jobs on dedicated, unthrottled hardware runners to eliminate VM noisy neighbor variance.

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3, // Takes median run to suppress VM noise
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 1.0 }], // Deterministic: Hard Gate
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // Performance: Warn / Soft Gate
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

- [More detail on Lighthouse CI Best Practices](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)

---

### Question 0ee3996a-0722-422d-a902-e84104cce94f

- What is the operational risk of a "flaky blocking gate", and how does the senior philosophy of **Gate Trust** protect team health?

### Answer

- **The erosion of CI trust**: A quality gate that fails randomly on valid code trains developers that CI failure is meaningless noise.
- **The "Merge Anyway" death spiral**:
  - When a gate is distrusted, developers request admin bypasses ("click merge anyway, it's just that flaky test").
  - Once bypasses become standard operating culture, legitimate compile errors, security holes, and regressions slip into `main` unhindered.
- **Senior Gate Philosophy**:
  - **Fast**: Every blocking gate must finish within minutes; a 30-minute gate tempts engineers to bypass.
  - **Trusted**: False positives must approach zero. If a gate has a >1% flake rate, it must be **quarantined immediately** (moved to non-blocking warning) until fixed.
  - **Actionable**: When a gate fails, the error log must point to the exact file, line number, and corrective remediation. Cryptic errors without clear guidance destroy engineering velocity.

- [More detail on Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html)
