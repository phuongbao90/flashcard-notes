# Error Handling & Defensive Programming

### Question 79975caa-7899-41c1-aa0f-655f466d1f5f

- What are the architectural trade-offs between **throwing exceptions** and using **Result types (`Result<T, E>`)** in TypeScript?

### Answer

- **Exceptions (`throw new Error()`)**: Invisible in TypeScript function signatures (cannot specify `throws ApiError`). Callers easily forget `try/catch`, leading to unhandled promise rejections and crashed UI trees. Best reserved for truly unexpected, catastrophic system anomalies (out of memory, network hardware disconnect).
- **Result types (`Result<T, E>`)**: Encode success and expected domain failures directly into the return type (`{ ok: true; value: T } | { ok: false; error: E }`).
- **Forced handling**: TypeScript forces the caller to check `.ok` before accessing `.value`, turning error handling into a compiler-enforced contract.

```typescript
// Result Type Definition
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Function forces caller to handle validation failure:
export function parseAge(input: string): Result<number, 'INVALID_NUMBER' | 'OUT_OF_RANGE'> {
  const age = Number(input);
  if (Number.isNaN(age)) return err('INVALID_NUMBER');
  if (age < 0 || age > 130) return err('OUT_OF_RANGE');
  return ok(age);
}

// Caller usage:
const res = parseAge('foo');
if (!res.ok) {
  // TypeScript narrows error to 'INVALID_NUMBER' | 'OUT_OF_RANGE'
  console.error(`Validation failed: ${res.error}`);
} else {
  console.log(`User age: ${res.value}`);
}
```

- [More detail on Error Handling with Result Types](https://kentcdodds.com/blog/use-ternaries-rather-than-and-and-in-jsx)
- [More detail on Exceptions vs Values](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)

---

### Question 9a638337-e6ef-4294-b7a4-8edd146c0852

- What is the **Fail Fast** principle, and how do runtime `invariant()` assertions prevent subtle data corruption?

### Answer

- **Fail fast**: When an unexpected or illegal state is encountered, crash immediately and visibly at the boundary rather than continuing execution with corrupt data.
- **Subtle corruption danger**: If an unauthenticated user or missing session token is tolerated and defaults to `null` or `""`, the system may silently write corrupted rows into the database or render empty UI without surfacing errors until hours later.
- **`invariant()` pattern**: Asserts a condition; if false, throws an explicit, descriptive error immediately in development, and narrows the TypeScript type for all subsequent lines.

```typescript
// Invariant utility with TypeScript assertion signature
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant Violation: ${message}`);
  }
}

function processPayment(user: { id: string; balance: number } | null, amount: number) {
  // Fail fast immediately at the function entry seam
  invariant(user, 'Cannot process payment without an active user session');
  invariant(amount > 0, 'Payment amount must be strictly positive');

  // Downstream code is 100% safe: 'user' is guaranteed non-null
  user.balance -= amount;
}
```

- [More detail on Fail-Fast System](https://en.wikipedia.org/wiki/Fail-fast)
- [More detail on TypeScript Assertion Functions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions)

---

### Question 88ee360c-97a2-450f-bd5c-0f84567dbe2c

- What is a structured **error propagation strategy**, and why should low-level infrastructure errors be translated into domain errors?

### Answer

- **Propagation policy**: Not every function should catch errors. Catch errors only when a module can actually recover, retry, or enrich the error with context. Otherwise, allow it to bubble up to a boundary.
- **Error translation (Information hiding)**: Low-level network or library errors (e.g., `AxiosError: ECONNRESET` or `Postgres 23505`) should be caught at the repository/gateway boundary and translated into application domain errors (e.g. `DuplicateEmailError` or `ServiceUnavailableError`).
- **Benefit**: Keeps high-level UI and business logic decoupled from specific third-party client libraries and database error codes.

```typescript
// Domain-specific error types
export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}
export class UserNotFoundError extends DomainError {
  constructor(userId: string) { super(`User ${userId} does not exist`, 'USER_NOT_FOUND'); }
}

// Low-level Gateway translates third-party fetch errors into Domain Errors
export async function fetchUserById(id: string): Promise<User> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (res.status === 404) throw new UserNotFoundError(id);
    if (!res.ok) throw new DomainError('Internal Server Error', 'SERVER_ERROR');
    return await res.json();
  } catch (err) {
    if (err instanceof DomainError) throw err;
    // Low-level network crash translated into clean domain error
    throw new DomainError('Network failure occurred', 'NETWORK_UNREACHABLE');
  }
}
```

- [More detail on Error Translation](https://martinfowler.com/books/eaa.html)
- [More detail on JavaScript Error Subclassing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types)

---

### Question 6c58e560-e659-4669-87ce-ed60263a4b0d

- What does **"Boundaries validate, internals trust"** mean in software architecture?

### Answer

- **Untrusted external perimeter**: All external data entering the application (URL query parameters, form inputs, local storage, third-party webhook payloads, WebSocket events) must be rigorously parsed and validated at the boundary.
- **Trusted internal core**: Once data passes the boundary validation and is transformed into a verified domain type, internal functions should trust the type and avoid repetitive defensive checks (`if (!user) ...`, `if (typeof x !== 'string') ...`).
- **Prevents defensive spaghetti**: Sprinkling defensive checks across hundreds of internal helper functions bloats code and obscures core business logic.

```typescript
import { z } from 'zod';

// 1. Boundary: Strict schema validation
const createUserPayloadSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18),
});

type ValidatedUserPayload = z.infer<typeof createUserPayloadSchema>;

export async function handlePostUserEndpoint(req: Request) {
  const json = await req.json();
  // Validates at the system boundary: throws or rejects if invalid
  const validatedPayload = createUserPayloadSchema.parse(json);

  // 2. Internal functions trust the validated contract: no redundant type checks!
  await registerUserInDatabase(validatedPayload);
}

// Internal function: Clean and confident
async function registerUserInDatabase(payload: ValidatedUserPayload) {
  // No need for 'if (typeof payload.email !== "string")' — guaranteed by the boundary!
  await db.user.create({ data: payload });
}
```

- [More detail on Parse, Don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
- [More detail on Software Architecture Boundaries](https://martinfowler.com/bliki/BoundaryObject.html)

---

### Question db88e4ff-2c19-4017-a489-b145570605ed

- How is **graceful degradation** designed as an architectural concern in frontend applications rather than an afterthought?

### Answer

- **Partial failure resilience**: If a secondary widget (e.g. recommended products, live notifications) crashes or times out, the primary application flow (checkout, viewing the main article) should remain fully operational.
- **Granular React Error Boundaries**: Placing error boundaries around individual widgets prevents an isolated component crash from unmounting the entire application root.
- **Skeleton states and fallbacks**: Provide intentional fallback UI (cached offline data, retry buttons, or empty state indicators) that communicates status transparently to the user without jarring layout shifts.

```tsx
// Architectural Error Boundary placement:
export function ProductDetailsPage({ productId }: { productId: string }) {
  return (
    <div>
      {/* Primary critical flow */}
      <ProductDetails productId={productId} />

      {/* Non-critical feature isolated by Error Boundary */}
      <ErrorBoundary fallback={<RecommendedProductsFallback />}>
        <RecommendedProductsList productId={productId} />
      </ErrorBoundary>

      {/* Non-critical reviews isolated */}
      <ErrorBoundary fallback={<div>Customer reviews temporarily unavailable.</div>}>
        <CustomerReviews productId={productId} />
      </ErrorBoundary>
    </div>
  );
}
```

- [More detail on React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [More detail on Graceful Degradation](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation)

---

### Question 812e98f2-ab0e-4e0c-923f-fb12aa986480

- Why is **swallowing errors (`catch {}`)** considered one of the most destructive habits in software engineering?

### Answer

- **The black hole of debugging**: An empty `catch (err) {}` or `catch { return null; }` suppresses the call stack and context. When an unexpected exception occurs, the system fails silently downstream without logs, metrics, or traces.
- **Data corruption escalation**: Instead of halting immediately, the program continues executing in an invalid state, triggering bizarre secondary errors that take days to diagnose.
- **Legitimate error catching requirements**: If catching an error:
  1. Either recover completely from the expected failure mode, OR
  2. Log the original error with full telemetry and re-throw, OR
  3. Wrap the error in a higher-level domain exception that retains the original cause (`new Error('...', { cause: err })`).

```typescript
// ❌ Catastrophic Anti-Pattern: Swallowing error turns syntax/network bug into a silent ghost
async function loadUserData(userId: string) {
  try {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  } catch (err) {
    // Swallows 401 Unauthorized, 500 Server Crashes, and TypeError bugs!
    return null; // Downstream renders blank screen; zero logs in Datadog/Sentry!
  }
}

// ✅ Resilient Error Handling: Preserve error chain and telemetry
async function loadUserData(userId: string) {
  try {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  } catch (err) {
    logger.error('Failed to load user profile', { userId, err });
    throw new Error(`Unable to fetch user data for ID: ${userId}`, { cause: err });
  }
}
```

- [More detail on Error Cause in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- [More detail on Catching and Handling Errors](https://react.dev/reference/react/useActionState)
