# Supply Chain, Dependencies & Abuse Prevention

### Question a9812f01-3829-411a-8bb0-2e45da79ee13

- Why is in-memory rate limiting ineffective on modern serverless or edge deployments, and how does a distributed sliding-window algorithm solve this?

### Answer

- **Serverless ephemeral instances**: Serverless functions (AWS Lambda, Vercel Functions) spin up and down dynamically across multiple data centers; memory is not shared between instances, rendering in-memory counters (`Map` or LRU caches) useless against distributed attacks.
- **Sliding-window counter**: A centralized, low-latency store (e.g., Upstash Redis with REST API) records timestamped requests or counter buckets across rolling time intervals.
- **Smooth traffic shaping**: Prevents the boundary burst vulnerability of fixed-window counters (where an attacker sends 2x the limit across the boundary of two adjacent fixed windows).

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  if (!success) {
    throw new Error('Rate limit exceeded. Try again later.');
  }
}
```

- [More detail on Upstash Rate Limiting Algorithms](https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms)

---

### Question 719a08ef-ca30-4e89-8012-7ce90b45a022

- Why must rate limiting on authentication endpoints combine both client IP address and account identifier keys?

### Answer

- **IP-only rate limiting flaw**: Corporate networks, university campuses, and cellular carriers route thousands of legitimate users through a shared gateway IP (NAT); throttling purely by IP blocks innocent users or allows attackers using distributed residential botnets to bypass the limiter.
- **Account-only rate limiting flaw**: Throttling solely by username/email allows an attacker to lock out legitimate users simply by spamming failed login attempts with their email (Denial of Service).
- **Compound key defense**: Enforce dual rate-limiting tiers—a broader threshold per IP (e.g., 50 failed attempts/min per IP) combined with an account-level threshold (e.g., 5 failed attempts/min per email) triggering step-up challenges (CAPTCHA / Turnstile).

- [More detail on OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

### Question 871a49df-8419-482a-a820-5ca07be58915

- How do malicious npm packages exploit `postinstall` lifecycle scripts, and why should CI build pipelines enforce `--ignore-scripts`?

### Answer

- **Arbitrary code execution on install**: When running `npm install`, npm automatically executes lifecycle scripts (`preinstall`, `install`, `postinstall`) specified in a package's `package.json` with the privileges of the executing user.
- **Supply chain theft**: Compromised or typosquatted packages execute shell scripts during installation that scan the host for environment variables (`AWS_SECRET_ACCESS_KEY`, `NPM_TOKEN`, `.env` files) and exfiltrate them to remote servers.
- **CI enforcement**: Running `npm ci --ignore-scripts` blocks all lifecycle scripts during dependency installation, requiring explicit opt-in for trusted native packages that require compilation.

```bash
# Secure CI installation command
npm ci --ignore-scripts
```

- [More detail on Socket.dev Supply Chain Security Guide](https://socket.dev/)

---

### Question b01948fa-6721-42cb-b092-18ca09be4572

- What is lockfile poisoning, and how does verifying lockfile drift in CI protect against unauthorized dependency injection?

### Answer

- **Subtle malicious resolution**: An attacker submits a pull request that modifies `package-lock.json` or `pnpm-lock.yaml` to point a trusted transitive dependency to a malicious tarball URL or compromised version tag, while keeping `package.json` clean.
- **Review blindness**: Lockfiles contain thousands of generated lines, making manual code review virtually impossible.
- **Lockfile drift verification**: In CI, always run `npm ci` (which fails if `package.json` and `package-lock.json` are out of sync) and assert that git working trees remain untouched (`git diff --exit-code package-lock.json`).

- [More detail on npm ci Command Specification](https://docs.npmjs.com/cli/v10/commands/npm-ci)

---

### Question 47ba018e-5712-421a-a829-87c2b3e409db

- What is npm package build provenance, and how does Sigstore signing verify the authenticity of published packages?

### Answer

- **Verifiable build origin**: npm provenance cryptographically links a published package directly to its source Git repository and the specific CI workflow execution (e.g., GitHub Actions) that generated the release.
- **Sigstore ledger**: Uses Sigstore's public transparency log (Rekor) and short-lived certificates to verify that the uploaded tarball was compiled by automated CI and was not tampered with on a developer's local laptop.
- **Protection against account takeovers**: Even if a maintainer's personal npm credentials are leaked, an attacker cannot publish a package containing malicious code without triggering a verified CI workflow on the source repository.

- [More detail on npm Package Provenance](https://docs.npmjs.com/generating-provenance-statements)

---

### Question 87aa09cf-984b-4ec2-8819-38b47ca0812f

- How does Regular Expression Denial of Service (ReDoS) occur, and what coding practices prevent catastrophic backtracking?

### Answer

- **Catastrophic backtracking**: Complex regular expressions containing nested quantifiers or overlapping alternation (e.g., `(a+)+$`, `(a|a+)+$`) cause the non-deterministic finite automaton (NFA) engine to explore $O(2^n)$ combinations when matching non-matching inputs.
- **CPU thread locking**: Evaluating a maliciously crafted 50-character string against a vulnerable regex locks the single Node.js event loop thread for minutes, bringing the entire web server to a halt.
- **Defenses**:
  - Cap input length before running regexes (`if (input.length > 256) throw Error()`).
  - Use `eslint-plugin-regexp` to detect exponential backtracking at build time.
  - Replace complex regular expressions with deterministic parsers or linear-time engines (e.g., Google RE2).

```typescript
// ❌ Catastrophic ReDoS vector: (a+)+$
const VULNERABLE_REGEX = /^([a-zA-Z0-9]+)+$/;

// ✅ Safe: Strict linear regex with enforced input length cap
export function validateUsername(input: string): boolean {
  if (input.length > 32) return false; // Enforce hard upper bound
  return /^[a-zA-Z0-9_]{3,32}$/.test(input);
}
```

- [More detail on OWASP Regular Expression Denial of Service (ReDoS)](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)

---

### Question c01948be-8419-4cb2-8710-18ca09b45e24

- How do Next.js `serverActions.bodySizeLimit` settings protect servers from payload-based resource exhaustion attacks?

### Answer

- **Memory exhaustion via oversized payloads**: By default, Next.js sets a 1MB payload size limit on Server Actions. If disabled or set to large limits (e.g., 50MB), attackers can flood action endpoints with giant JSON payloads to exhaust server memory and buffer allocations.
- **Configuring explicit limits**: Configure `experimental.serverActions.bodySizeLimit` in `next.config.js` to enforce strict payload limits appropriate for the workload (e.g., `'128kb'` for form inputs, reserving larger limits only for dedicated upload endpoints).

```javascript
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '256kb', // Restricts request bodies for Server Actions
    },
  },
};
```

- [More detail on Next.js Server Actions Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/serverActions)

---

### Question d1498b01-3921-4b12-ba09-5ca07be58914

- Why must API endpoints and database queries enforce hard pagination limits on result sets?

### Answer

- **Unbounded query DoS**: If an endpoint accepts client-supplied `limit` parameters without an upper bound (e.g., `?limit=1000000`), the database fetches millions of rows, serializes them into memory, and crashes the Node.js process with an Out-of-Memory (OOM) error.
- **Database connection exhaustion**: Massive queries hold open database connection pool slots and saturate network bandwidth between the database and application servers.
- **Strict upper bounds**: Enforce a hard ceiling on all pagination parameters (e.g., `Math.min(limit, 50)`) and adopt keyset/cursor pagination for scalable data traversal.

```typescript
export async function getAuditLogs(cursor?: string, requestedLimit = 20) {
  // Enforce non-negotiable ceiling
  const take = Math.min(Math.max(1, requestedLimit), 50);

  return db.auditLog.findMany({
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}
```

- [More detail on OWASP API Security - Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)

---

### Question 62ed3d0a-f635-435e-9ad2-712f5d9e4808

- How does integrating an edge security layer (e.g., Arcjet or Upstash Rate Limiter) in Next.js Middleware protect Server Actions from distributed credential stuffing?

### Answer

- **Edge-layer request evaluation**: Middleware inspects incoming action headers (`Next-Action`) and client IP/identity signatures before the request reaches backend Node.js compute or database pools.
- **Sliding-window enforcement**: Uses a globally coordinated Redis or edge-backed token bucket algorithm to throttle bursts and return HTTP 429 ("Too Many Requests") immediately, shielding downstream authentication systems from resource exhaustion.

```typescript
// middleware.ts
import arcjet, { shield, slidingWindow } from '@arcjet/next';

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: 'LIVE' }),
    slidingWindow({ mode: 'LIVE', interval: '1m', max: 10 }),
  ],
});

export async function middleware(request: Request) {
  const decision = await aj.protect(request);
  if (decision.isDenied()) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

- [More detail on Arcjet Rate Limiting for Next.js](https://docs.arcjet.com/)

---

### Question fbb5e1b9-5c76-4668-af94-0da064d70acc

- What makes this email validation regular expression vulnerable to Regular Expression Denial of Service (ReDoS) during high-throughput user registrations?

```javascript
const emailRegex = /^([a-zA-Z0-9_\.-]+)+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
```

### Answer

- **Catastrophic backtracking via nested quantifiers**: The expression `([a-zA-Z0-9_\.-]+)+` allows multiple overlapping ways for the regex engine to partition the same string of valid characters.
- **Exploitation**: An attacker submitting a string of 30+ repeating characters followed by an invalid character (e.g., `aaaaaaaaaaaaaaaaaaaaaaaaaaaa!`) forces exponential execution steps, pegging the Node.js event loop at 100% CPU and blocking concurrent requests.
- **Mitigation**: Remove nested quantifiers (e.g., `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`) and enforce maximum string length limits before matching.

- [More detail on OWASP Regular Expression Denial of Service (ReDoS)](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)

---

### Question a830c6ee-29c3-451c-b541-39d76b118f3d

- Trace how prototype pollution in a deep object merge function inside a Next.js Route Handler can lead to authorization bypass or application crashes.

### Answer

- **`__proto__` property traversal**: When an unvalidated JSON payload contains properties like `"__proto__": { "isAdmin": true }`, naive recursive merge functions traverse and assign values to the object prototype.
- **Global object contamination**: Because JavaScript objects inherit from `Object.prototype`, the injected property becomes accessible on *every* object in the Node.js process (`({}).isAdmin === true`), corrupting security checks across all tenants and requests.
- **Mitigation**: Freeze `Object.prototype`, ignore `__proto__` and `constructor` keys during cloning, or use `Object.create(null)` for unpollutable dictionary lookups.

- [More detail on OWASP Prototype Pollution Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html)
