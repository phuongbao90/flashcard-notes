# Authentication, Session & Token Management

### Question a105e192-d9f2-45e6-b997-c6bfa0f4e3c1

- Why must session tokens be stored in `HttpOnly; Secure; SameSite` cookies rather than browser `localStorage`, and what protection do `__Host-` cookie prefixes provide?

### Answer

- **XSS token exfiltration**: Tokens stored in `localStorage` can be extracted by any script executing within the origin via `localStorage.getItem('token')`.
- **`HttpOnly` and `SameSite` flags**: `HttpOnly` blocks client JavaScript from reading the cookie; `Secure` restricts transmission to TLS connections; `SameSite=Lax` or `Strict` prevents cross-site request leakage.
- **`__Host-` prefix security**: The browser rejects cookies with the `__Host-` prefix unless they have `Secure: true`, `Path=/`, and **omit the `Domain` attribute**—preventing subdomain takeover attacks from injecting or overriding parent domain session cookies.

```typescript
// Secure session cookie configuration
response.cookies.set('__Host-session', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```

- [More detail on MDN Cookie Prefixes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#cookie_prefixes)
- [More detail on OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

### Question 871a06cf-90f7-4148-be2e-360df890b050

- Why must authorization never be delegated solely to Next.js Middleware, and how did CVE-2025-29927 demonstrate this risk?

### Answer

- **Routing optimization vs. Security perimeter**: Middleware executes at the edge before route matching; it is designed for redirects, geo-routing, and header rewrites, not as an unbypassable security perimeter.
- **CVE-2025-29927 exploit**: Next.js improperly trusted external requests containing the internal `x-middleware-subrequest` header, assuming middleware had already executed and bypassing auth-guard redirects to serve protected backend routes.
- **Layered defense (DAL & Actions)**: Every Data Access Layer (DAL) function, Server Action, and Route Handler must independently verify session authenticity and user permissions.

- [More detail on Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [More detail on Next.js Authentication Architecture](https://nextjs.org/docs/app/building-your-application/authentication)

---

### Question 2f45ea01-0982-411a-8bb0-2e45da79ee12

- What is Session Fixation, and why is rotating session identifiers upon authentication and privilege elevation mandatory?

### Answer

- **Session fixation attack**: An attacker obtains an unauthenticated session ID, tricks a victim into authenticating using that identifier (e.g., via query param or subdomain cookie), and then accesses the victim's account using the known session ID.
- **Mandatory session rotation**: The application must destroy the pre-authentication session and issue a brand-new, cryptographically random session token immediately upon successful login.
- **Privilege elevation rotation**: Re-issuing session tokens is also required when a user switches organizations, escalates roles (e.g., standard to admin), or completes step-up verification.

- [More detail on OWASP Session Fixation Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#session-fixation)

---

### Question 9fa87321-482a-4bc8-a721-a589f029de77

- How should session lifecycles be designed to balance user experience against compromised session risks (idle timeout vs. absolute timeout)?

### Answer

- **Idle timeout**: Invalidates the session if no requests are received within an inactivity window (e.g., 30 minutes of no user activity).
- **Absolute timeout**: Hard ceiling (e.g., 7 or 14 days) after which the session terminates unconditionally, forcing re-authentication regardless of recent activity.
- **Server-side session revocation**: Maintain an active session table in the database or Redis so tokens can be invalidated immediately upon user logout, password reset, or suspicious security events.

- [More detail on NIST Digital Identity Guidelines (Session Handling)](https://pages.nist.gov/800-63-3/sp800-63b.html#sec7)

---

### Question 47ba210e-ca81-42cb-bcf0-6490ea74e501

- What are the architectural security tradeoffs between opaque database-backed sessions and stateless JSON Web Tokens (JWTs)?

### Answer

- **Opaque sessions (Stateful)**: Cryptographically random identifier referencing a database/Redis record.
  - *Pros*: Immediate revocation; simple invalidation; minimal cookie payload (<100 bytes).
  - *Cons*: Requires database lookup on every server request or DAL call.
- **Stateless JWTs (Client-Stored)**: Cryptographically signed token containing claims in the cookie payload.
  - *Pros*: Zero database lookup for token verification; edge-friendly.
  - *Cons*: Cannot be revoked before `exp` without a distributed blocklist; 4KB cookie limits restrict payload size; token bloat increases network overhead on every request.

- [More detail on OWASP JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

### Question f509c314-884b-4f91-8894-39908cf0a771

- How can JWT verification be implemented in Next.js Middleware or Edge Runtime without relying on Node.js-specific `crypto` libraries?

### Answer

- **Edge Runtime constraints**: Next.js Middleware and Edge routes run on V8 isolates that lack Node.js standard libraries like `crypto` or C++ native addons (`jsonwebtoken`).
- **Web Crypto and `jose`**: Use the standard Web Crypto API or modern edge-compatible libraries like **`jose`**, which natively support JWK, JWS, and JWE in edge runtimes.

```typescript
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'https://auth.mycompany.com',
      audience: 'https://mycompany.com',
    });
    return payload;
  } catch (err) {
    return null; // Expired or invalid signature
  }
}
```

- [More detail on Jose library for Edge runtimes](https://github.com/panva/jose)

---

### Question 719ef10a-3cde-47a8-a567-9ec9035a09b4

- What is Step-Up Authentication, and how should it be implemented for sensitive user operations?

### Answer

- **Privileged boundary challenge**: Standard session cookies verify regular session identity, but high-impact actions (changing email, transferring funds, adding MFA devices) demand proof of immediate identity.
- **Step-up verification flow**: When the user requests a sensitive mutation, the server prompts for re-authentication (password verification, WebAuthn biometric assertion, or TOTP code).
- **Short-lived elevation token**: Upon verification, the server issues a scoped, single-use token or marks the session as "elevated" for a very short duration (e.g., 5 minutes) to authorize the specific mutation.

- [More detail on Step-Up Authentication Patterns](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

### Question c019283f-4bb2-411a-85d0-9990fb43217b

- How do Open Redirect vulnerabilities occur during authentication flows, and how must redirect URLs be validated?

### Answer

- **Parameter tampering**: Attackers send phishing links with manipulated `redirect`, `next`, or `callbackUrl` query parameters (e.g., `https://app.com/login?next=https://evil.com`).
- **Victim trust exploitation**: Victims successfully authenticate on the trusted domain, after which the client or server unconditionally redirects them to the attacker's domain to steal credentials or tokens.
- **Relative path or allow-list validation**: Enforce that the redirect parameter begins with a single `/` (avoiding protocol-relative `//evil.com`), or parse via `new URL()` and verify that the hostname strictly matches an approved whitelist.

```typescript
export function getSafeRedirectUrl(target: string | null, fallback = '/dashboard'): string {
  if (!target) return fallback;
  // Reject protocol-relative URLs (e.g., '//attacker.com') and absolute URLs
  if (target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) {
    return target;
  }
  return fallback;
}
```

- [More detail on OWASP Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

---

### Question 87aa09df-6712-4eb2-a63b-18a7d30ef118

- Why are `state`, `nonce`, and PKCE mandatory in frontend OAuth 2.0 / OIDC implementations?

### Answer

- **`state` (CSRF defense)**: Opaque random value passed to identity provider and verified on callback; binds the authorization request to the user's browser session, preventing Login CSRF.
- **`nonce` (Token replay defense)**: Random string included in the authorization request and embedded inside the resulting ID Token; verifies that the returned token corresponds to the original authentication request.
- **PKCE (Proof Key for Code Exchange)**: Eliminates client secret reliance in public/browser clients by requiring a cryptographic `code_verifier` and `code_challenge`, preventing authorization code interception attacks.

- [More detail on RFC 7636 Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)
- [More detail on OpenID Connect Core Specification](https://openid.net/specs/openid-connect-core-1_0.html)

---

### Question d492ba01-782a-43cf-8bb0-2e45cb987612

- How does user enumeration occur during login and password reset flows, and how should responses be hardened?

### Answer

- **Differentiating responses**: Returning errors like *"Email does not exist"* on login or displaying confirmation messages only when an email is registered confirms valid user accounts to automated credential stuffers.
- **Timing attacks**: If the server performs expensive cryptographic password hashing (bcrypt, argon2) for existing users but returns immediately for non-existent users, attackers infer account existence by measuring response latency.
- **Hardening measures**: Return generic responses (e.g., *"If this email is registered, a password reset link has been sent"*); execute a dummy hash calculation when an email is not found to equalize response times.

- [More detail on OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

### Question 391a0c4f-9da1-44bf-8029-7ca09be4713a

- Why do custom Next.js Route Handlers using cookie authentication require explicit CSRF protection, while Server Actions are protected by default?

### Answer

- **Server Actions built-in CSRF checks**: Next.js automatically compares the `Origin` and `Host` (or `X-Forwarded-Host`) request headers against an allow-list for all Server Actions; cross-origin POSTs are rejected automatically.
- **Route Handlers lack built-in CSRF**: Standard Route Handlers (`app/api/.../route.ts`) accept standard HTTP requests from any origin; browsers automatically attach `SameSite=None` or certain `SameSite=Lax` cookies to top-level cross-site POSTs.
- **Route Handler mitigation**: Implement custom CSRF token validation, verify the `Sec-Fetch-Site: same-origin` header, or validate that the `Origin` matches the application host for all state-changing Route Handlers.

```typescript
// app/api/transfer/route.ts
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  // Verify origin matches host
  if (!origin || new URL(origin).host !== host) {
    return new Response('Cross-Origin Forbidden', { status: 403 });
  }

  // Proceed with authenticated mutation
}
```

- [More detail on Next.js Server Actions CSRF Protection](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)
