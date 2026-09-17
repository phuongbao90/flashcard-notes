# Verification & Continuous Assurance

### Question a1098f01-3829-411a-8bb0-2e45da79ee15

- Why are UI-level E2E tests insufficient for verifying authorization, and why must authorization testing be enforced at the Data Access Layer (DAL) level?

### Answer

- **UI tests test UI visibility, not security**: Verifying that an "Edit" button or admin menu link is hidden in the DOM only tests presentation logic; it does not test whether an attacker can directly invoke the underlying Server Action or DAL function.
- **DAL negative assertion tests**: Integration tests must directly invoke DAL functions and Server Actions using non-owner and cross-tenant session mocks, explicitly asserting that the operation throws an authorization error (`UnauthorizedError` or `ForbiddenError`).
- **Comprehensive test matrix**: Every data modification and sensitive read query must have automated negative test cases (asserting rejection) alongside positive test cases.

```typescript
// __tests__/dal/documents.test.ts
import { describe, it, expect } from 'vitest';
import { getDocumentByIdDTO } from '@/dal/documents';

describe('Document DAL Authorization', () => {
  it('rejects cross-tenant document read attempts', async () => {
    // User belongs to Org A, document belongs to Org B
    const session = { userId: 'user-1', orgId: 'org-A' };

    await expect(
      getDocumentByIdDTO('doc-belonging-to-org-B', session)
    ).rejects.toThrow('Forbidden: Cross-tenant access denied');
  });
});
```

- [More detail on OWASP Testing Guide - Authorization Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/README)

---

### Question 719a08ef-ca30-4e89-8012-7ce90b45a024

- How should automated bundle auditing be integrated into CI/CD pipelines to prevent accidental secret exposure?

### Answer

- **Post-build bundle analysis**: Run an automated scanner immediately following the `next build` step in the CI pipeline.
- **Regex & Entropy scanning**: Scan the generated client assets (`.next/static/**`) for known secret prefixes (e.g., Stripe, AWS, GitHub tokens) and high-entropy strings.
- **Hard pipeline failure**: Configure the CI job to fail immediately and block deployment if any prohibited pattern or unexpected `NEXT_PUBLIC_` string is discovered.

```yaml
# .github/workflows/ci.yml
- name: Build Next.js Application
  run: npm run build

- name: Audit Client Bundle for Secret Leaks
  run: |
    npx gitleaks dir --no-git --source .next/static/ -v
```

- [More detail on Gitleaks for CI/CD](https://github.com/gitleaks/gitleaks)

---

### Question 871a49df-8419-482a-a820-5ca07be58917

- What static analysis tools and TypeScript configurations provide the strongest continuous security assurances for Next.js applications?

### Answer

- **TypeScript strict mode**: Enable `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` in `tsconfig.json` to eliminate undefined property errors and unintended type coercions.
- **`eslint-plugin-security`**: Flags dangerous coding patterns in ESLint, including unsafe regexes, pseudo-random number generation (`Math.random`), and dynamic execution (`eval`).
- **Pre-commit secret detection**: Enforce pre-commit hooks via Husky or lint-staged running `gitleaks protect --staged` to catch credentials on local developer machines before code is committed to Git.

- [More detail on eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security)
- [More detail on TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig/#strict)

---

### Question b01948fa-6721-42cb-b092-18ca09be4574

- How should a team monitor Content Security Policy (CSP) violation reports in production, and how do you filter out noise?

### Answer

- **Report-To endpoint**: Deploy `Content-Security-Policy-Report-Only` pointing to an ingestion route or telemetry vendor (e.g., Sentry, Report-URI, Datadog).
- **Noise filtering**: Real-world CSP reports are filled with false positives caused by user browser extensions (e.g., LastPass, Grammarly) injecting DOM nodes or scripts; filter reports by stripping known extension schemes (`chrome-extension://`, `moz-extension://`).
- **Targeted violation alerting**: Group reports by blocked directive and target domain; trigger security notifications when unexpected external domains attempt script or iframe injection on core authenticated routes.

```typescript
// app/api/csp-report/route.ts
export async function POST(req: Request) {
  const report = await req.json();
  const blockedUri = report['csp-report']?.['blocked-uri'] || '';

  // Filter out common browser extension noise
  if (blockedUri.startsWith('chrome-extension://') || blockedUri.startsWith('moz-extension://')) {
    return new Response(null, { status: 204 });
  }

  logger.warn({ cspViolation: report['csp-report'] }, 'CSP Violation Detected');
  return new Response(null, { status: 204 });
}
```

- [More detail on MDN Reporting API](https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API)

---

### Question 47ba018e-5712-421a-a829-87c2b3e409dd

- What specific security events should trigger immediate real-time alerts in a web application's monitoring and SIEM infrastructure?

### Answer

- **High-frequency authorization failures**: A sudden spike in 403 Forbidden or IDOR rejections from a specific user session or IP address (indicating active endpoint probing).
- **Rate-limit threshold breaches**: Repeated trips of sliding-window rate limiters on login, password reset, or OTP endpoints.
- **Session anomalies**: Simultaneous requests with the same session token from divergent geographical locations or drastically different user agents (potential token hijacking).
- **CSRF origin mismatches**: High volumes of rejected cross-origin POST requests to Server Actions or Route Handlers.

- [More detail on OWASP Proactive Controls - Implement Logging and Monitoring](https://owasp.org/www-project-proactive-controls/v3/en/c9-security-logging)

---

### Question 87aa09cf-984b-4ec2-8819-38b47ca08131

- How does an engineering team apply the STRIDE threat modeling framework to evaluate new React/Next.js feature designs?

### Answer

- **S - Spoofing**: Can an attacker forge another user's identity? (Checked via session token signature, PKCE, `HttpOnly` cookies).
- **T - Tampering**: Can an attacker alter parameters or payloads in transit? (Checked via runtime schema validation with Zod, Server Action integrity checks).
- **R - Repudiation**: Can a user deny performing a critical transaction? (Checked via tamper-evident, append-only database audit logs).
- **I - Information Disclosure**: Does private data leak over network or HTML? (Checked via Flight payload awareness, DTO mapping in DAL, disabling source maps).
- **D - Denial of Service**: Can resources be exhausted? (Checked via rate limiters, regex ReDoS linters, `bodySizeLimit`, DB query pagination).
- **E - Elevation of Privilege**: Can a regular user perform admin functions? (Checked via DAL authorization checks on every operation, RBAC/ABAC enforcement).

- [More detail on Microsoft STRIDE Threat Modeling](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats#stride-model)

---

### Question 499f96f7-4126-446d-b370-580edf5412e7

- How can pre-commit Git hooks using Husky, lint-staged, and Gitleaks prevent API keys and `.env` files from entering the Git commit history?

### Answer

- **Local pre-commit boundary**: Husky intercepts the `git commit` command on the developer's local machine before any commit object is written to the repository.
- **Fast staged-file analysis**: `lint-staged` passes only newly modified or staged files to **Gitleaks**, which evaluates code against high-entropy patterns and secret rule sets; if a matched secret (e.g., Stripe key, private key) is found, the hook aborts the commit immediately.

```json
// package.json
{
  "lint-staged": {
    "*": "gitleaks protect --staged --verbose"
  }
}
```

- [More detail on Gitleaks Secret Scanner](https://github.com/gitleaks/gitleaks)

---

### Question fc53e365-2047-4211-97b4-937d0f37478e

- How should automated integration tests be structured using Vitest to verify Data Access Layer (DAL) authorization without booting the full Next.js HTTP server?

### Answer

- **Isolated function testing**: Import and test DAL functions directly in Vitest or Jest, mocking the authentication provider (e.g., `vi.mock('@/lib/auth')`) to simulate different user sessions and roles.
- **Cross-tenant assertion**: Attempt to query or mutate a resource belonging to Tenant A while authenticated as Tenant B; assert that the DAL function throws a 403 Forbidden or "Not Found" error, validating IDOR controls at sub-millisecond execution speeds.

```typescript
// tests/dal/workspace.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getTenantWorkspaceDTO } from '@/lib/dal/workspaces';

vi.mock('@/lib/auth', () => ({
  auth: () => Promise.resolve({ user: { id: 'usr_1', organizationId: 'org_attacker' } }),
}));

describe('DAL Tenant Isolation', () => {
  it('throws when accessing another organization workspace', async () => {
    await expect(getTenantWorkspaceDTO('ws_victim_tenant')).rejects.toThrow(
      'Not found or access denied'
    );
  });
});
```

- [More detail on Next.js Data Access Layer Testing](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#data-access-layer)

---

### Question 10dda303-9ed8-477c-a888-2b5d6741b501

- What are the tradeoffs between Static Application Security Testing (SAST) and Dynamic Application Security Testing (DAST) when auditing Next.js Server Actions?

### Answer

- **SAST (Code scanning)**: Evaluates source files directly in CI to guarantee that every action defines a Zod schema and calls session auth functions before merging, but cannot test live reverse proxies or header transformations.
- **DAST (Runtime probing)**: Discovers real action IDs from compiled chunks and shoots live HTTP payloads (e.g., oversized buffers, tampered JSON) to test actual runtime limits, but requires a deployed staging environment and cannot inspect unexported code paths.

- [More detail on OWASP Source Code Analysis Tools](https://owasp.org/www-community/Source_Code_Analysis_Tools)
