# Secrets & Environment Variable Management

### Question a891f021-3921-411a-8bb0-2e45da79ee12

- How does Next.js compile `NEXT_PUBLIC_` environment variables, and why does referencing an unused public variable still expose it in the client bundle?

### Answer

- **Build-time text replacement**: During compilation, Next.js replaces all occurrences of `process.env.NEXT_PUBLIC_VAR` with its literal string value directly inside the compiled JavaScript bundle (`.next/static`).
- **Inlining anywhere referenced**: If a public environment variable is referenced in any imported file—even inside an unused utility, an unreachable branch, or a disabled feature flag—the bundler inlines the literal value into the generated chunk.
- **Strict namespace rule**: Reserve `NEXT_PUBLIC_` solely for completely public values (e.g., public analytics keys, domain URLs); never place API secrets, internal tokens, or encryption keys under this prefix.

- [More detail on Next.js Bundling Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser)

---

### Question 719efb01-ca30-4e89-8012-7ce90b45a021

- What occurs when code inside a `'use client'` component references a server-only environment variable without the `NEXT_PUBLIC_` prefix?

### Answer

- **Client replacement with empty string / undefined**: To prevent catastrophic leaks, Next.js evaluates `process.env.SECRET_KEY` inside client-targeted code as `undefined` (or an empty string `""` depending on bundler configuration).
- **Silent failure / logic bypass**: While the server secret is not leaked, client-side logic depending on that variable (e.g., `if (process.env.FEATURE_ENABLED)`) silently evaluates to false, causing subtle production bugs or unintended code paths.
- **Compilation warning / package defense**: Use `import 'server-only'` in modules accessing server variables to guarantee a build-time compiler error if imported into a client tree.

- [More detail on Next.js Environment Variable Security](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

### Question 871a49df-5721-42cb-b092-18ca09be4571

- Why do client-side `NEXT_PUBLIC_` variables fail to update when environment variables change at container runtime in multi-stage Docker builds?

### Answer

- **Build-time baking**: `NEXT_PUBLIC_` variables are inlined during `npm run build` (`next build`). When running a multi-stage Docker build, those values become immutable bytes baked into the static `.next/static` assets.
- **Runtime disconnect**: Changing environment variables in the container deployment (e.g., `docker run -e NEXT_PUBLIC_API_URL=...` or Kubernetes Pod specs) only affects server-side `process.env` at runtime; the client bundles continue serving the build-time baked strings.
- **Solution for runtime client configs**: For values that vary across runtime environments without rebuilding Docker images, expose a runtime endpoint (e.g., `/api/config`) or pass configuration from a Server Component root layout via `data-*` attributes.

- [More detail on Next.js Docker Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying#docker-image)

---

### Question b01948fa-8419-482a-a820-5ca07be58914

- How should an automated bundle audit script be implemented in CI pipelines to prevent leaked secrets in production builds?

### Answer

- **Inspect build artifacts**: Run automated regex scanning against the compiled `.next/static/` directory after `next build` finishes in CI.
- **High-entropy pattern matching**: Scan for known private key signatures (`sk_live_`, `BEGIN RSA PRIVATE KEY`, `ghp_`, AWS access keys) and fail the CI pipeline immediately if any match is detected.

```bash
# CI Secret Leak Verification Step
npm run build
grep -rE "(sk_live_[0-9a-zA-Z]{24}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA )?PRIVATE KEY-----)" .next/static/
if [ $? -eq 0 ]; then
  echo "🚨 CRITICAL SECURITY ERROR: Secrets detected in client-side static bundles!"
  exit 1
fi
```

- [More detail on TruffleHog Secret Scanner](https://github.com/trufflesecurity/trufflehog)

---

### Question 47ba018e-ca81-42cb-b829-18ca09b45e23

- What is the non-negotiable incident response protocol when an API key or database secret is committed to a Git repository?

### Answer

- **Assume instant compromise**: Public or private, treat any committed secret as completely compromised the second `git push` executes; automated scrapers scan public repositories and leaked access tokens within seconds.
- **Immediate revocation and rotation**: Immediately revoke the exposed token at the service provider and provision a new secret.
- **History rewriting is secondary**: Rewriting Git history (via `git filter-repo` or BFG Repo-Cleaner) cleans the repository for future clones, but **does not protect the compromised credentials**; credential rotation is the only valid containment action.

- [More detail on GitHub Best Practices for Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

### Question 87aa09cf-482a-45c1-90a1-7c98eb14092b

- Why must Preview / Staging deployments be strictly isolated from Production secrets and databases?

### Answer

- **Staging security asymmetry**: Preview environments (e.g., PR preview deployments in Vercel or Kubernetes) are accessed by contractors, external reviewers, and automated testing tools; they have broader attack surfaces and looser access controls than production.
- **Data corruption / wiping**: A bug or unauthorized action executed in a preview branch wired to the production database can corrupt live customer records or trigger irreversible mutations.
- **Isolated preview infrastructure**: Use dedicated staging databases seeded with anonymized/mock data, and provision distinct test API keys (e.g., Stripe test mode) for all preview builds.

- [More detail on Vercel Environment Variables by Environment](https://vercel.com/docs/projects/environment-variables)

---

### Question c01948be-5712-421a-a829-87c2b3e409da

- Why should database connections in application code enforce the principle of least privilege, and what permissions should be revoked?

### Answer

- **Blast radius containment**: If an SQL injection or ORM flaw occurs, an application running as database `superuser` or schema owner allows attackers to execute OS commands, drop tables, read system catalogs, and read other databases.
- **Restricted database role**: The application's database user should only have `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on specific application tables.
- **Revoke DDL permissions**: Revoke `DROP`, `ALTER`, `CREATE`, and `TRUNCATE` permissions from runtime app users; execute schema migrations using a separate, privileged deployment pipeline role.

```sql
-- Least-privilege application role
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE myapp TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE CREATE, DROP, ALTER ON SCHEMA public FROM app_user;
```

- [More detail on OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)

---

### Question 3fdfe743-85a8-4edc-ac57-ebf95220b5cf

- How does schema validation using `@t3-oss/env-nextjs` or Zod prevent deployment failures and secret misconfigurations in Next.js applications?

### Answer

- **Build-time boundary verification**: Explicitly defines schemas for `server` and `client` environment variables, validating values during `next build`.
- **Fail-fast crash guarantee**: If a critical production secret (e.g., `DATABASE_URL` or `STRIPE_SECRET_KEY`) is missing, mistyped, or prefixed incorrectly with `NEXT_PUBLIC_`, the build process halts with immediate schema diagnostics before code deploys to production.

```typescript
// env.mjs
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

- [More detail on T3 Env Next.js documentation](https://env.t3.gg/docs/nextjs)

---

### Question 222b222e-96a7-4940-95ed-1ddad4ab6a40

- What security risk occurs when logging third-party API webhook payloads inside a Server Action or Route Handler, and how is it resolved?

```typescript
export async function POST(req: Request) {
  const payload = await req.json();
  console.log('Stripe webhook received:', payload, process.env.STRIPE_SECRET_KEY);
  // ...
}
```

### Answer

- **Cloud log secret exfiltration**: Unsanitized `console.log` statements stream raw environment secrets and customer PII directly into third-party cloud logging services (e.g., Datadog, AWS CloudWatch, LogDNA), exposing credentials to developers and third-party integrations with read permissions.
- **Remediation**: Use structured loggers with built-in secret redaction and mask any payload fields containing authorization headers, session tokens, or private keys before writing to `stdout`.

- [More detail on OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

---

### Question fbc2c3a9-8b4f-448f-b175-1564148c55e5

- In Next.js, what is the exact file loading precedence for environment variables, and why should `.env.local` never be checked into Git?

### Answer

- **Precedence order (highest to lowest)**: `process.env` (system environment) > `.env.production.local` / `.env.development.local` > `.env.local` > `.env.production` / `.env.development` > `.env`.
- **`.env.local` purpose**: Designed exclusively for local machine overrides and developer-specific secrets; committing it to Git leaks individual credentials across team repositories.

- [More detail on Next.js Environment Variable Load Order](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#environment-variable-load-order)
