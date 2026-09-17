# Caching & Build Performance

### Question 324d85bc-5072-46e0-9ad9-2a1cb9748309

- Why is running `npm install` in CI considered an anti-pattern that leads to "works on my machine" failures, and how does `npm ci` guarantee reproducible builds?

### Answer

- **Non-deterministic dependency resolution**: `npm install` parses `package.json` semver ranges (`^18.2.0`) and updates `package-lock.json` if newer compatible versions exist, causing CI to install dependencies different from the developer's local machine.
- **`npm ci` (Clean Install) guarantees**:
  - **Lockfile immutability**: Strictly installs the exact versions frozen in `package-lock.json`. It will **never** mutate the lockfile.
  - **Drift detection**: If `package.json` and `package-lock.json` are out of sync, `npm ci` fails immediately with an exit code error instead of silently downloading drift.
  - **Hermetic clean slate**: Automatically deletes the existing `node_modules` folder before installation to eliminate leftover, undeclared transitive dependencies.
- **Pnpm equivalent**: `pnpm install --frozen-lockfile` provides the identical deterministic enforcement.

```yaml
# ❌ Anti-pattern: Silently mutates lockfile and allows non-deterministic upstream drift
- run: npm install

# ✅ Production standard: Fails fast on lockfile mismatch and enforces exact tree
- run: npm ci
```

- [More detail on npm-ci Command](https://docs.npmjs.com/cli/v10/commands/npm-ci)

---

### Question 4c65d90d-28fd-4a30-9811-5c5187d3e1c9

- How should dependency caching be configured in GitHub Actions to maximize cache hit rates while guaranteeing automatic cache busting on dependency updates?

### Answer

- **Keying on lockfile cryptographic hash**: Key the cache on the runner OS and the hash of the lockfile (`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`).
- **Cache behavior**:
  - **Cache hit**: When the lockfile hasn't changed between commits, the runner restores pre-installed packages or store tarballs, bypassing network fetches (~10–30s vs. ~3 min).
  - **Cache miss**: When any dependency is added, updated, or removed, the lockfile hash changes. The runner experiences a cache miss, performs a clean install, and uploads a fresh cache archive.
- **Native setup action caching**: Modern CI setup actions (`actions/setup-node@v4`) provide built-in `cache: 'pnpm'` or `cache: 'npm'`, which caches the global package store instead of local `node_modules`, avoiding path-specific binary compilation issues.

```yaml
# ✅ Standard setup-node global store caching keyed automatically to lockfile
- uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
    cache: 'pnpm' # Caches ~/.local/share/pnpm/store keyed on pnpm-lock.yaml
```

- [More detail on Caching Dependencies in GitHub Actions](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

---

### Question 31876ad5-15cf-432b-911c-6ac331d93080

- How does **Remote Caching** (Turborepo / Nx) work across CI runners and local developer machines, and what causes the dangerous "false cache hit" failure mode?

### Answer

- **Content-hash-based skipping**: Turborepo/Nx hashes all inputs for a task (source files in the package, environment variables, dependency graph, and tooling configs).
- **Execution avoidance**:
  - If the computed hash matches an entry stored in the remote S3/Vercel cache bucket, CI skips the build/test execution entirely and replays the cached terminal output and dist artifacts in seconds.
- **The "false cache hit" disaster**:
  - **Root cause (untracked inputs)**: The task relies on an environment variable (e.g., `NEXT_PUBLIC_API_URL`) or an external file that was **not declared** in `turbo.json` `inputs` or `env`.
  - **Symptom**: Source code did not change, so the computed hash matches the cache. CI replays artifacts compiled for `staging` into a `production` release build, pointing production traffic to staging APIs.
- **Prevention**: Explicitly declare all environment variables affecting the build output in `turbo.json` under `globalEnv` or task-specific `env`.

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "public/**", "next.config.js"],
      "outputs": [".next/**", "!.next/cache/**"],
      // ✅ Crucial: Untracked env vars cause phantom false cache hits!
      "env": ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_ANALYTICS_ID"]
    }
  }
}
```

- [More detail on Turborepo Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)

---

### Question bbbca1bf-65f2-4160-9648-92c4895e0cc0

- Your Playwright E2E step takes 4 minutes every run just executing `npx playwright install`. How do you eliminate this overhead using runner caching?

### Answer

- **The un-cached browser penalty**: Playwright downloads ~300MB–800MB of browser binaries (Chromium, Firefox, WebKit) into `~/.cache/ms-playwright` on every ephemeral runner instance.
- **Caching browser binaries**:
  - Cache the `~/.cache/ms-playwright` directory using the Playwright package version as the cache key.
  - Browser binaries only change when the `@playwright/test` package version in `package.json` updates.
  - On cache hit, run tests immediately; on cache miss, invoke `npx playwright install --with-deps`.

```yaml
# ✅ Restoring Playwright browser binaries to reclaim 3-4 minutes per run
- name: Get Playwright Version
  id: playwright-version
  run: echo "version=$(npx playwright --version)" >> $GITHUB_OUTPUT

- name: Cache Playwright Browsers
  id: playwright-cache
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}

- name: Install Playwright Browsers if Cache Miss
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps
```

- [More detail on Caching Playwright Browsers in CI](https://playwright.dev/docs/ci#caching-browsers)
