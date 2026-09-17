# Server Actions & API Endpoint Security

### Question 149d9aef-909c-4d12-b463-b0cbe0ce6968

- Why must every `'use server'` action be treated as a public HTTP POST endpoint callable via cURL?

### Answer

- **Public endpoint compilation**: Next.js compiles `'use server'` functions into standalone **HTTP POST RPC endpoints** assigned unique action IDs.
- **Client bundle decoupling**: Although actions appear like normal JavaScript functions in application code, they do not require an active browser session or UI button to be invoked.
- **Direct invocation**: Any attacker can discover the action ID from the JavaScript bundle and issue arbitrary POST requests via **cURL** or Postman with customized JSON payloads.

```bash
curl -X POST https://example.com/api/actions \
  -H "Next-Action: 87b419b1b49e29a990e668c2d1b702" \
  -H "Content-Type: application/json" \
  -d '["malicious_input"]'
```

- [More detail on Server Actions Security](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)

---

### Question de2d9bbd-f164-4d3b-86bd-49ee594ec0d8

- How can attackers discover and invoke Server Actions that are not linked to any visible client UI elements?

### Answer

- **Static bundle analysis**: Next.js assigns deterministic or bundled action IDs that are embedded in the compiled client-side JavaScript chunks (`.next/static/chunks`).
- **Unrendered references**: If an action is imported anywhere in client-side code—even within unrendered modal branches, dead code paths, or conditional feature flags—its action ID is shipped to the browser.
- **Reconnaissance automation**: Attackers parse client bundles with regex or AST tools to enumerate all registered action IDs, and then probe them with empty or structured payloads to analyze server responses.

- [More detail on Server Action Bundling & Security](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)

---

### Question 0e7d2fba-2bc1-4d16-8cd9-d8b106dca709

- What security risks occur when placing `'use server'` at the file level of a module that contains both exported actions and internal helper utilities?

### Answer

- **Blanket RPC exposure**: Placing `'use server'` at the top of a file instructs the bundler to expose **every exported function** in that file as a public network-callable action.
- **Accidental endpoint creation**: Internal data-access helpers, administrative functions, or raw database queries exported for internal server utilities become exposed HTTP endpoints without authorization wrappers.
- **Mitigation**: Reserve `'use server'` files strictly for validated public mutation endpoints, or apply the `'use server'` directive **inline inside specific function bodies** to prevent unintentional exposures.

```typescript
// ❌ Dangerous: Exports all functions as public RPCs
'use server';
export async function updateUser(id: string) { /* ... */ }
export async function internalDeleteUserFromDb(id: string) { /* EXPOSED! */ }
```

- [More detail on the use server directive](https://react.dev/reference/rsc/use-server)

---

### Question aa665572-594c-47b4-aa8b-7cfc0757ec59

- How does the static nature of Next.js build-time Action IDs impact attacker reconnaissance and automated vulnerability scanning?

### Answer

- **Build-time determinism**: Server Action IDs are generated at build time (e.g., cryptographic hashes derived from file paths and export names) and remain **constant throughout deployment**.
- **Per-request immobility**: Action IDs do not rotate per session or per request; once discovered by an attacker, the endpoint identifier remains valid for repeated scanning and exploitation until the next application build.
- **Automated exploitation**: Attackers can maintain long-lived collections of target action IDs across test and production environments to probe for parameter tampering, auth bypasses, and rate limits.

- [More detail on Server Actions Security Model](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)

---

### Question a683c8aa-1507-472c-b2a3-24953f272760

- Why is Next.js Middleware authentication insufficient as an authorization boundary for Server Actions?

### Answer

- **Coarse path matching**: Next.js Middleware operates on **request URLs and route paths**, whereas Server Actions are invoked through POST requests to the current page path or a shared action dispatcher.
- **Action colocation**: A Server Action defined in a protected route can be imported and executed from a public page, or invoked directly using its action header without traversing expected page route segments.
- **Defense in depth**: Middleware can be bypassed by routing misconfigurations or header spoofing; every Server Action must independently verify the user's session and specific **RBAC/ABAC permissions** inside its execution body.

```typescript
export async function deletePostAction(postId: string) {
  'use server';
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden');
  // perform delete
}
```

- [More detail on Next.js Authentication and Server Actions](https://nextjs.org/docs/app/building-your-application/authentication#authorization)

---

### Question a6ed5fb0-eda0-42ce-94cc-2b79a49d02e2

- How did the Next.js `x-middleware-subrequest` header vulnerability (CVE-2025-29927) bypass middleware authentication, and what architectural principle does it reinforce?

### Answer

- **Header spoofing mechanism**: Attackers sent an external request with the internal header `x-middleware-subrequest`, which Next.js improperly trusted as an indication that middleware had already executed for the request.
- **Complete auth bypass**: The internal check skipped middleware execution entirely, granting direct access to protected downstream pages and route handlers without running session validation.
- **Architectural principle**: Reinforces that **Middleware is a routing optimization, not a security perimeter**; the Data Access Layer (DAL) and Server Actions must enforce strict, self-contained authorization checks.

- [More detail on Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [More detail on Next.js Data Access Layer](https://nextjs.org/docs/app/building-your-application/authentication#data-access-layer-dal)

---

### Question 6044e8c7-1407-4ad3-9b12-42ff817df310

- Why does verifying user authentication inside a Server Action fail to prevent Insecure Direct Object Reference (IDOR) vulnerabilities?

### Answer

- **Authentication ≠ Authorization**: Verifying a valid session proves identity, but does not verify whether the authenticated user has permission to view or modify the **specific target record**.
- **Client-supplied identifiers**: When an action accepts a raw resource identifier (e.g., `documentId`), an attacker can substitute another user's ID while presenting their own valid session cookie.
- **Mandatory scoping**: Every database query in a Server Action must scope mutations and reads by both resource ID and tenant/user ownership (e.g., `WHERE id = :docId AND userId = :currentUserId`).

```typescript
// ❌ IDOR Vulnerability
await db.document.update({ where: { id: docId }, data: { content } });

// ✅ Scoped by authenticated ownership
await db.document.update({
  where: { id: docId, userId: session.user.id },
  data: { content },
});
```

- [More detail on OWASP IDOR Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)

---

### Question 18a7de49-deef-4a6b-9933-d55b23fb8e71

- In a multi-tenant SaaS application, how does accepting a client-supplied `organizationId` in a Server Action cause cross-tenant authorization bypass?

### Answer

- **Untrusted tenant switching**: If a Server Action relies on an `organizationId` passed from client arguments or hidden form inputs, an attacker can submit another company's tenant ID while authenticated.
- **Session-derived isolation**: The active `tenantId` must be extracted strictly from the authenticated session, validated against the user's active memberships in the database, and never accepted as an unverified client parameter.
- **Tenant scoping**: All data operations must enforce compound tenancy filters (e.g., `where: { id, organizationId: session.orgId }`) or utilize row-level security (RLS) policies.

- [More detail on Multi-Tenant Authorization Patterns](https://nextjs.org/docs/app/building-your-application/authentication#authorization)

---

### Question 05450f85-ec4f-4419-9481-9ec8228e63fd

- Why is standard session cookie authentication insufficient for high-risk Server Actions, and how should step-up authentication be designed?

### Answer

- **Stale or stolen sessions**: Standard session cookies may remain valid for days; if a session is hijacked via XSS, physical device access, or session fixation, attackers can execute irreversible actions.
- **High-risk boundaries**: Operations such as email change, password modification, API key generation, and large balance transfers require **step-up authentication** (re-prompting for password, MFA token, or WebAuthn assertion).
- **Verification token flow**: The sensitive action must require a short-lived, single-use cryptographic verification token generated immediately after the user completes the step-up prompt.

- [More detail on Step-Up Authentication (NIST Guidelines)](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

### Question e071fb83-7309-4f89-8724-7d6e7415f1f7

- Why is runtime schema validation (e.g., Zod or Valibot) mandatory at Server Action boundaries despite TypeScript static typing?

### Answer

- **Zero runtime type safety**: TypeScript types are completely erased during compilation; they provide compile-time developer hints but offer **zero runtime defense**.
- **External network payload**: Since Server Actions are HTTP endpoints, incoming payloads are unvalidated strings or serialized JSON passed directly from untrusted clients.
- **Runtime validation requirement**: Parse every argument with a schema library (`zod`, `valibot`) at the top of the action body to enforce shape, type, boundaries, and string formats before processing.

```typescript
import { z } from 'zod';

const UpdateSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
});

export async function updateCart(input: unknown) {
  'use server';
  const { id, quantity } = UpdateSchema.parse(input);
  // safe processing
}
```

- [More detail on Validating Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#server-side-validation)

---

### Question 49935028-efce-4dfd-8d05-0fc3dd14f1d6

- Why must non-payload parameters like pagination offsets, limit sizes, and sort criteria undergo strict schema validation in Server Actions?

### Answer

- **Resource exhaustion (DoS)**: Uncapped `limit` or `pageSize` values allow clients to request millions of rows in a single query, causing database memory exhaustion and server CPU spikes.
- **Integer overflow & negative offsets**: Unchecked negative offsets can trigger database driver errors, unexpected full-table scans, or application crashes.
- **Strict schema bounds**: Enforce strict caps and positive integer constraints (e.g., `z.number().int().min(1).max(50)`) and enum constraints for sort directions (`z.enum(['asc', 'desc'])`).

- [More detail on Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

### Question 70180c1a-9d88-4894-8009-375ba6a3dcf8

- Why does validating a dynamic sort field as `z.string()` in a Server Action still leave database queries vulnerable to SQL injection?

### Answer

- **Unescaped identifier injection**: Many ORMs and query builders (e.g., Prisma `$queryRaw`, Knex, raw SQL) support parameterized values for inputs, but **cannot parameterize SQL column identifiers** in `ORDER BY` clauses.
- **`z.string()` pitfall**: Validating that an input is a string still permits malicious payloads such as `'price; DROP TABLE users; --'` or blind boolean SQL injection statements.
- **Strict allowlisting**: Validate sort fields against a strict enum of safe column names (`z.enum(['createdAt', 'price', 'name'])`), rejecting any arbitrary column string.

```typescript
// ❌ Dangerous: z.string() allows arbitrary SQL injection in identifiers
const SortSchema = z.object({ sortBy: z.string() });

// ✅ Secure: Strict column allowlist
const SortSchema = z.object({
  sortBy: z.enum(['created_at', 'price', 'title']),
  order: z.enum(['asc', 'desc']),
});
```

- [More detail on OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

### Question c6faf989-5f16-4195-8611-cb9b1dc2e2a2

- How does passing unparsed Server Action arguments directly into an ORM mutation method cause mass-assignment vulnerabilities?

### Answer

- **Payload forwarding**: Passing client-submitted objects directly to ORM methods (e.g., `db.user.update({ where, data: payload })`) writes whatever keys are provided in the payload.
- **Privilege escalation**: An attacker injects protected attributes such as `role: 'ADMIN'`, `isVerified: true`, `creditBalance: 99999`, or `organizationId`.
- **Explicit DTO pick**: Always parse inputs through a strict schema that strips unknown keys (`.strict()`) or manually construct the mutation object selecting only explicitly editable properties.

```typescript
// ❌ Mass Assignment Vulnerability
await db.user.update({ where: { id }, data: formDataObject });

// ✅ Explicit property assignment
await db.user.update({
  where: { id },
  data: {
    displayName: validatedData.displayName,
    bio: validatedData.bio,
  },
});
```

- [More detail on Mass Assignment Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)

---

### Question 43ad15f2-e0a4-45f9-83c3-2755a893e37a

- How can a Server Action that accepts an external image or webhook URL for user profiles expose internal cloud infrastructure to Server-Side Request Forgery (SSRF)?

### Answer

- **Internal network access**: If a Server Action fetches a client-provided URL on the server, an attacker can specify private internal addresses (e.g., `http://169.254.169.254/latest/meta-data/` or `http://10.0.0.1/admin`).
- **Cloud metadata exfiltration**: Cloud environments expose sensitive IAM credentials, instance tokens, and VPC microservices to local requests from the host.
- **Mitigation strategy**: Enforce protocol allowlists (`https:` only), block private IP ranges (RFC 1918, RFC 3927 metadata addresses) using DNS resolution checks, or delegate file fetching to client-side uploads.

- [More detail on OWASP Server-Side Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

---

### Question be9e5667-7a9f-42fd-bc5d-a8198f227a6b

- How does Next.js protect Server Actions against CSRF attacks, and what header comparison does it perform?

### Answer

- **Origin-to-Host verification**: Next.js automatically compares the incoming **`Origin`** header (or `Referer` if `Origin` is missing) against the target **`Host`** (or `X-Forwarded-Host`) header.
- **Mismatched request abort**: If the `Origin` does not match the server's `Host`, Next.js rejects the action invocation with a 403 Forbidden status before executing the action function.
- **POST isolation**: Because browsers enforce that cross-origin scripts cannot forge or alter the `Origin` header during cross-origin fetch/form requests, malicious sites cannot forge Server Action POSTs.

- [More detail on Server Actions CSRF Protection](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#csrf-protection)

---

### Question b1712ffd-b3d9-461f-a510-256d46d0faa6

- How can reverse proxy misconfigurations involving `X-Forwarded-Host` compromise Next.js Server Action CSRF verification?

### Answer

- **Host header spoofing**: When Next.js runs behind a reverse proxy (e.g., Nginx, AWS ALB), it checks `X-Forwarded-Host` to determine the trusted application domain.
- **Untrusted header forwarding**: If the proxy forwards client-supplied `X-Forwarded-Host` headers without overwriting or validating them against trusted hostnames, an attacker can supply `X-Forwarded-Host: evil.com`.
- **CSRF bypass**: Next.js compares `Origin: evil.com` with the poisoned `Host: evil.com`, considers them identical, and permits cross-origin CSRF execution.
- **Fix**: Configure proxies to explicitly strip or overwrite `X-Forwarded-Host` with the actual canonical server hostname.

- [More detail on Next.js Proxy & Allowed Origins](https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#allowedorigins)

---

### Question e386159a-a0a4-42c6-beeb-638140bb4159

- Under what circumstances is modern browser `SameSite=Lax` cookie behavior insufficient to prevent CSRF, requiring custom token validation?

### Answer

- **Lax "2-minute window"**: Chrome permits recently set cookies without explicit `SameSite` to be sent on top-level cross-site POST requests within the first 120 seconds of issuance ("Lax-allowing-unsafe").
- **GET mutations**: `SameSite=Lax` sends cookies on cross-site top-level GET navigations (e.g., links or window redirects); any state-mutating endpoint exposed via GET is completely exposed.
- **Cross-subdomain attacks**: `SameSite` scopes to the eTLD+1 domain; an attacker who compromises a sibling subdomain (e.g., `blog.example.com`) can launch cross-origin CSRF attacks against `app.example.com`.

- [More detail on MDN SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value)
- [More detail on OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

### Question 2d3b9d36-535e-4cbb-b9ed-063dd08faa3c

- When is configuring `serverActions.allowedOrigins` in `next.config.js` required for Server Actions?

### Answer

- **Multi-domain architectures**: Required when Server Actions are submitted from different origins, such as cross-domain micro-frontends, separate marketing domains, or mobile web views.
- **Reverse proxy mismatch**: When public users access the app via a domain or port that differs from the internal host header perceived by Node.js.
- **Origin allowlisting**: Specifies an array of trusted domains that pass Next.js's built-in `Origin` vs `Host` CSRF validation check.

```javascript
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      allowedOrigins: ['my-proxy.com', '*.app.example.com'],
    },
  },
};
```

- [More detail on serverActions.allowedOrigins](https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#allowedorigins)

---

### Question f14b892a-d437-4b84-ae50-47dd2edaed90

- Why do Next.js Route Handlers (`route.ts`) require manual CSRF and origin validation whereas Server Actions have built-in verification?

### Answer

- **No automatic origin check**: Next.js automatically validates `Origin` against `Host` for Server Actions, but applies **no automatic origin or CSRF checks to Route Handlers**.
- **REST/Webhook standard**: Route Handlers are designed as standard HTTP endpoints for public webhooks, mobile APIs, and external integrations where automated origin blocking would break non-browser clients.
- **Manual enforcement**: If a Route Handler uses cookie-based authentication to perform state mutations, developers must manually verify the `Origin` header or validate custom CSRF tokens.

```typescript
// app/api/transfer/route.ts
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin !== 'https://trusted.com') {
    return new Response('Forbidden', { status: 403 });
  }
  // proceed with mutation
}
```

- [More detail on Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

### Question 0aa5c5fb-2630-4847-9486-dfd68729596d

- Why does an API Route Handler accepting `POST` requests remain vulnerable to cross-site execution even when CORS headers are completely omitted?

### Answer

- **CORS blocks reads, not writes**: The browser's Same-Origin Policy and CORS mechanism prevent foreign origins from **reading the response body**, but do not stop simple POST requests from **arriving and executing on the server**.
- **Simple request triggering**: Standard HTML `<form method="POST">` submissions execute cross-site without triggering a CORS preflight (`OPTIONS`) request.
- **False sense of security**: Leaving CORS unconfigured does not protect state-mutating endpoints; CSRF protection requires explicit origin verification or anti-CSRF tokens.

- [More detail on MDN CORS Simple Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)

---

### Question 5005de6f-ae0c-4a93-9da1-293b7f5a8014

- Why does React's encryption of bound Server Action closure arguments fail to provide authorization or prevent replay attacks?

### Answer

- **Encryption protects secrecy, not authorization**: React encrypts arguments bound via `.bind()` using a server-side secret key to prevent clients from inspecting payload contents.
- **Opaque replayable tokens**: The encrypted blob is sent to the client and returned upon invocation; an attacker who intercepts or receives a valid encrypted blob can replay it indefinitely.
- **IDOR through encrypted blobs**: If user A receives an encrypted action bound to document #123 and shares the encrypted string with user B, user B can submit it; the server must still check whether the current caller owns document #123.

- [More detail on Server Actions Closure Encryption](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#closure-arguments)

---

### Question 298bb81c-78e4-48e4-b33b-9814c3b25c5d

- What security risks arise from capturing sensitive values or entity IDs in Server Action closures via `.bind()`, and what is the secure pattern?

### Answer

- **Premature binding & race states**: Binding mutable values or permission flags into a closure snapshot freezes values at render time, ignoring subsequent privilege revocations or status changes.
- **Server key dependency**: Bound arguments rely on server encryption keys; server restarts or multi-instance deployments without shared encryption keys cause deserialization failures.
- **Secure pattern**: Keep Server Actions modular and stateless; pass only minimal IDs as explicit arguments and re-fetch both sensitive data and current authorization state from the database inside the action body.

- [More detail on React Server Actions with bind](https://react.dev/reference/rsc/use-server#passing-arguments-to-server-actions)

---

### Question c4b666e1-c150-42f6-8917-a0cd69c25d17

- In a Server Component, if an inline `'use server'` action closes over component props, how does Next.js transmit those props over the network, and can a client tamper with them?

### Answer

- **Hidden encrypted payload**: Next.js automatically serializes and encrypts closed-over variables into hidden action metadata passed to the client.
- **Tampering resistance vs logic traps**: Clients cannot alter the encrypted values without invalidating the cryptographic signature, preventing raw data tampering.
- **Stale data trap**: While clients cannot tamper with the bytes, the closed-over props reflect data at the time of component rendering; relying on them for access control creates stale-authorization vulnerabilities.

- [More detail on Server Action Closures](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#closure-arguments)

---

### Question 6500f34c-9a7f-4185-8a73-1de87b97f021

- Why and how should rate limiting be applied at the Server Action layer rather than solely at the edge or reverse proxy?

### Answer

- **Account context at the edge is absent**: Edge proxies rate-limit primarily by IP address, which fails against distributed botnets (rotating IPs) and unfairly throttles enterprise users sharing corporate NAT gateways.
- **Compound keying**: The Server Action layer has access to the authenticated user ID and parsed input payload (e.g., target email/username), allowing compound rate-limiting keys: `rate-limit:ip:${ip}` and `rate-limit:account:${userId}`.
- **Targeted abuse defense**: Sensitive workflows (login, password reset, funds transfer) can enforce sliding-window limiters via Redis (e.g., Upstash) directly before executing costly business logic.

```typescript
const isAllowed = await redis.slidingWindow({
  key: `action:reset:${userId}`,
  maxRequests: 5,
  windowMs: 60_000,
});
if (!isAllowed) throw new Error('Too many attempts. Try again later.');
```

- [More detail on OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

### Question d23f3fad-4c9e-4ec8-bfe8-fcc658357a96

- Why are Server Actions performing financial deductions or coupon redemptions vulnerable to Time-of-Check to Time-of-Use (TOCTOU) race conditions, and how can they be prevented?

### Answer

- **Asynchronous non-atomic checks**: If an action checks a balance (`if (user.balance >= price)`) and then issues a separate update (`deductBalance()`), concurrent cURL requests can pass the check simultaneously before either deduction writes.
- **Double spending**: Attackers fire parallel requests in milliseconds to redeem single-use discount codes or withdraw funds multiple times.
- **Prevention**: Use **database-level atomic updates** (`UPDATE users SET balance = balance - price WHERE id = :id AND balance >= price`), transactions with strict isolation (`SERIALIZABLE`), or distributed locks (Redlock) keyed by user ID.

```typescript
// ✅ Atomic deduction preventing TOCTOU
const result = await db.$executeRaw`
  UPDATE accounts 
  SET balance = balance - ${amount} 
  WHERE id = ${accountId} AND balance >= ${amount}
`;
if (result === 0) throw new Error('Insufficient funds');
```

- [More detail on Concurrency Control and Race Conditions](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Management_Cheat_Sheet.html)

---

### Question 95c0fb99-cece-43a4-a051-7bc655db32ca

- How can an unauthenticated or weakly authorized Server Action calling `revalidatePath` or `revalidateTag` be weaponized for cache-stampede DoS attacks?

### Answer

- **Server cache invalidation**: Next.js `revalidatePath` and `revalidateTag` purge cached data across the Full Route Cache and Data Cache, forcing the next request to re-render pages and re-query databases.
- **DDoS amplification**: An attacker spamming a Server Action that invokes `revalidatePath('/', 'layout')` eliminates cached pages continuously, forcing every subsequent user request to hit the origin database.
- **Protection**: Strictly authorize revalidation actions to authenticated administrators, rate-limit invocation frequencies, and avoid accepting arbitrary paths or tags directly from client input.

- [More detail on on-demand revalidation](https://nextjs.org/docs/app/building-your-application/caching#on-demand-revalidation)

---

### Question 7ad79f41-6841-4087-90f3-8e658db817e9

- How can unconfigured default `bodySizeLimit` settings in Server Actions lead to Denial of Service (DoS) through large payload flooding?

### Answer

- **Memory consumption**: Server Actions accept incoming POST bodies; by default, Next.js sets `serverActions.bodySizeLimit` (e.g., 1MB), but poorly configured apps may increase this or fail to cap parser buffers.
- **Event-loop blocking**: Parsing massive JSON strings or deeply nested structures consumes excessive CPU cycles and causes Node.js event-loop starvation for all other requests.
- **Hardening**: Restrict `bodySizeLimit` to the smallest necessary size for regular JSON actions (e.g., `'128kb'`), reserving larger limits only for dedicated multipart upload handlers.

```javascript
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '128kb',
    },
  },
};
```

- [More detail on Next.js Server Action bodySizeLimit](https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit)

---

### Question 843d586b-c195-4c22-965b-be79032057b1

- Why is catching server errors and returning `{ success: false, error: err.message }` in a Server Action a dangerous information disclosure anti-pattern?

### Answer

- **Bypassing Next.js error redaction**: Next.js automatically redacts unhandled server errors in production, returning an obfuscated digest code to the client to prevent data leaks.
- **Database & stack leaks**: Manually catching exceptions and forwarding `err.message` to the client sends raw database connection strings, table names, SQL constraint errors, and third-party API error details directly to attackers.
- **Safe error handling**: Log detailed error stacks internally to secure logging infrastructure, returning only generic, localized error codes (e.g., `{ error: 'PAYMENT_FAILED' }`) to the client.

```typescript
// ❌ Dangerous: Leaks raw database/system error messages to client
try {
  await db.transaction(/* ... */);
} catch (err: any) {
  return { success: false, error: err.message };
}

// ✅ Secure: Log internally, return sanitized user-facing code
try {
  await db.transaction(/* ... */);
} catch (err) {
  logger.error(err);
  return { success: false, error: 'GENERIC_SERVER_ERROR' };
}
```

- [More detail on Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

---

### Question 12f9d5db-abb3-4e16-a9e9-d399df34d71a

- Why should Server Actions return minimal Data Transfer Objects (DTOs) rather than raw ORM models or database entities?

### Answer

- **Hidden column exposure**: Raw ORM entities (e.g., Prisma, TypeORM objects) select all table columns by default, including password hashes, reset tokens, internal billing IDs, and audit logs.
- **Flight payload serialization**: Any object returned from a Server Action is fully serialized into the client-side RSC response payload, visible in the browser Network tab even if never rendered by React components.
- **DTO filtering**: Transform query results through an explicit DTO mapper or schema picker before returning data from the action boundary.

```typescript
// ❌ Leaks hashedPassword, ssn, and internal flags
const user = await db.user.findUnique({ where: { id } });
return user;

// ✅ Explicit DTO whitelist
return {
  id: user.id,
  name: user.name,
  avatarUrl: user.avatarUrl,
};
```

- [More detail on Data Transfer Objects in Next.js](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#data-access-layer-dal)

---

### Question 4cbf9097-1b90-4557-95ad-d97c80577af6

- What attack surfaces are exposed by Server Action function signatures and imports being visible in client JavaScript bundles?

### Answer

- **Internal architecture mapping**: Shipped client bundles contain the names, parameter structures, and client-facing interfaces of imported Server Actions, providing attackers with a blueprint of internal server capabilities.
- **Sensitive naming leaks**: Exporting action names such as `adminDeleteTenantDatabase` or `internalBypassSubscriptionCheck` reveals sensitive operational capabilities and invites targeted brute-force exploration.
- **Remediation**: Use generic, business-oriented naming conventions, remove unneeded development/debug action exports from production code, and never pass server-only secret configuration as action arguments.

- [More detail on Client Bundle Inspection](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)

---

### Question 85d19800-8b76-42f9-8e6a-7a70e7823758

- Why does invoking a state-mutating Server Action inside a client-side `useEffect` hook create security risks and break HTTP idempotency guarantees?

### Answer

- **Drive-by execution on GET navigation**: Placing mutations inside `useEffect` converts safe page visits into state mutations; if a victim navigates to a malicious URL with specific query params, the page mounts and triggers unintended mutations.
- **CSRF-like side effects**: Attackers can trigger financial, account, or deletion mutations simply by sending users a crafted link that triggers the effect upon loading.
- **React Strict Mode & double invocation**: React re-runs effects in development and concurrent transitions, multiplying unintended side effects and exhausting resources.
- **Correct pattern**: Trigger state-mutating Server Actions strictly through explicit user interactions (e.g., button clicks, form submissions).

- [More detail on React useEffect purity rules](https://react.dev/reference/react/useEffect)

---

### Question 5858e746-76fb-4422-885b-7a617e8e7cd3

- What security vulnerabilities occur when accepting file uploads via `FormData` in Server Actions, and why is checking `file.type` insufficient?

### Answer

- **MIME spoofing**: The `file.type` property is derived from client-provided headers and file extensions; an attacker can upload an executable script (`.php`, `.html`, `.js`) while setting `file.type: 'image/png'`.
- **Stored XSS & RCE**: Storing files with unvalidated extensions or serving them from the same origin allows attackers to achieve Stored XSS or Remote Code Execution.
- **Defense in depth**: Inspect **magic bytes (file signatures)** on the server using libraries like `file-type`, strip dangerous filenames to prevent directory traversal (`../../`), generate random UUID filenames, and store uploads in isolated, non-executable buckets (e.g., AWS S3).

- [More detail on OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

---

### Question ee9bb76e-eec7-4c5b-9aa8-9fe9c44b7047

- How can calling `redirect()` inside a Server Action with unvalidated user input result in Open Redirect vulnerabilities?

### Answer

- **Unvalidated destination URLs**: Passing client-supplied strings (`returnUrl`, `next`) directly to `redirect()` allows attackers to redirect users to external phishing domains after successful authentication or mutation.
- **Internal `NEXT_REDIRECT` mechanism**: Next.js `redirect()` throws an internal error caught by framework middleware to issue an HTTP 303/307 redirect header to the browser.
- **Safe redirection**: Enforce that redirect targets are relative paths starting with a single `/` (rejecting protocol-relative `//evil.com` URLs) or validate against a strict domain allowlist.

```typescript
// ❌ Dangerous Open Redirect
redirect(formData.get('returnUrl'));

// ✅ Safe relative redirect validation
const rawTarget = formData.get('returnUrl');
const safeTarget = (typeof rawTarget === 'string' && rawTarget.startsWith('/') && !rawTarget.startsWith('//'))
  ? rawTarget
  : '/dashboard';

redirect(safeTarget);
```

- [More detail on Next.js redirect API](https://nextjs.org/docs/app/api-reference/functions/redirect)
- [More detail on OWASP Unvalidated Redirects](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
