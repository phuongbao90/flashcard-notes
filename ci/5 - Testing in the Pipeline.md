# Testing in the Pipeline

### Question 7f106c6d-ddde-4e3f-87e5-7225ef52137b

- A suite of 200 Playwright E2E tests takes 32 minutes to run sequentially on a single CI machine. How do you scale this execution to under 5 minutes using **CI Sharding**?

### Answer

- **The sequential E2E bottleneck**: Browser instantiation, network requests, and DOM navigation make E2E tests orders of magnitude slower than unit tests. As the suite grows, running sequentially on one runner hits an unacceptable scaling wall.
- **Playwright sharding mechanics**:
  - Playwright natively supports the `--shard=x/y` argument to divide the total test files into distinct slices across parallel runners.
  - GitHub Actions matrix strategy orchestrates multiple concurrent runner instances (e.g., 8 shards).
  - Each shard runs a distinct subset of tests concurrently (`shard 1/8`, `shard 2/8`, etc.).
  - A final aggregation step downloads the trace and blob reports from all shards and merges them into a single unified HTML report.

```yaml
# ✅ Running Playwright across 4 parallel shards
jobs:
  e2e-tests:
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report
```

- [More detail on Playwright Sharding in CI](https://playwright.dev/docs/test-sharding)

---

### Question 224ab2c0-27e8-4da0-a075-c5082bc5de37

- An E2E test fails intermittently once every 10 CI runs. A developer proposes adding `retries: 3` in `playwright.config.ts` so the PR stays green. What is the senior critique of this approach, and what is the proper **Flake Management Discipline**?

### Answer

- **The danger of unmonitored retries**: Auto-retry silently converts real intermittent bugs (race conditions, unhandled promise rejections, state leaks) into green builds. Bugs that flake in CI inevitably manifest as intermittent crashes for production users.
- **The senior stance**: "Rerunning until green is denial, not quality assurance."
- **Disciplined flake management**:
  1. **Trace-on-first-retry**: Only record expensive browser traces on retry (`trace: 'on-first-retry'`) to capture DOM snapshots, network waterfalls, and console logs without inflating happy-path test execution time.
  2. **Quarantine lanes**: Move consistently flaky tests out of the blocking PR pipeline into a non-blocking `quarantine` job that runs continuously on a schedule. This preserves gate trust while preventing flaky tests from blocking team PRs.
  3. **Track Flake Rate as a KPI**: Instrument test runners to report retry events to an observability dashboard (e.g., Datadog or Currents). A test that passes on retry is flagged as a flaky defect and prioritized in the bug backlog.

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0, // Capture trace, but must be monitored!
  use: {
    // ✅ Zero overhead on pass; complete forensic timeline on failure
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

- [More detail on Playwright Trace Viewer and CI Diagnostics](https://playwright.dev/docs/trace-viewer)

---

### Question d9fc3bbc-735b-4afc-8f51-260e20b0ef9e

- How does **Visual Regression Testing** (Chromatic / Percy / Lost Pixel) operate as a PR quality gate, and how does the review workflow distinguish between intentional UI redesigns and accidental regressions?

### Answer

- **Functional tests miss visual breaks**: A unit or E2E test passes if a button exists in the DOM and fires an `onClick` handler—even if CSS broke, rendering the button transparent or obscured behind an overlay.
- **Visual regression mechanics**:
  - CI boots Storybook or renders component states in headless browsers.
  - Takes pixel-perfect screenshots of components across breakpoints and themes.
  - Computes an image diff against the baseline commit (`main`).
- **The PR Gate & Approval Workflow**:
  - If pixel differences exceed threshold (e.g., 0.01% delta), the visual check enters a **pending status** on the PR.
  - **Intentional changes (e.g., brand redesign)**: Reviewers open the web dashboard, inspect the side-by-side visual diff, and click "Accept Changes" to approve the new baseline. The CI status turns green.
  - **Accidental changes (e.g., broken CSS cascade)**: Reviewers reject the diff, blocking the PR until the developer fixes the regression.

- [More detail on Visual Testing with Storybook and Chromatic](https://storybook.js.org/docs/writing-tests/visual-testing)

---

### Question 933294c5-054f-4d3a-a907-db9c1d94784c

- When a CI test fails on a remote runner, developers complain they cannot reproduce the failure locally. What **Artifact Retention Strategy** must the pipeline implement to make remote failures instantly diagnosable?

### Answer

- **The local reproduction fallacy**: Local environments differ in screen resolutions, CPU throttling, OS fonts, and network speeds; forcing developers to reproduce CI failures locally wastes hours.
- **Pipeline as evidence collector**: Every failure in CI must produce actionable, preserved artifacts attached directly to the GitHub Actions run:
  1. **Playwright Traces (`trace.zip`)**: Allows developers to open `playwright.dev/trace` and inspect full execution history, DOM snapshots before/after each action, network requests, and console warnings.
  2. **Failure Screenshots & Videos**: Visual confirmation of the exact page state at the moment an assertion timed out.
  3. **Server Output Logs**: Next.js/Node stdout and stderr logs capturing uncaught exceptions and 500 API responses.
- **Retention lifecycle**: Configure artifact retention to expire after 7–14 days (`retention-days: 7`) to prevent bloated CI storage costs.

```yaml
# ✅ Retaining debug artifacts strictly when tests fail
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-failure-traces
    path: test-results/
    retention-days: 7
```

- [More detail on GitHub Actions Storing Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
