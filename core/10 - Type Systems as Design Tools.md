# Type Systems as Design Tools

### Question 65a997f9-5c66-4657-ae5c-72674fe23815

- How does **making invalid states unrepresentable** via discriminated unions eliminate entire classes of UI bugs?

### Answer

- **The optional-flag anti-pattern**: Using loose optional fields (`{ loading?: boolean; error?: Error; data?: Data }`) permits mathematically impossible states (e.g. `loading: true` AND `error: Error` AND `data: Data` simultaneously). Developers are forced to write fragile ternary cascades.
- **Discriminated unions**: Define mutually exclusive state variants identified by a shared discriminant tag (`status: 'idle' | 'loading' | 'success' | 'error'`).
- **Compiler enforcement**: TypeScript guarantees that `data` cannot be accessed when `status === 'loading'`, and `error` cannot be accessed when `status === 'success'`.

```typescript
// ❌ Impossible States Representable: Permits 2^3 = 8 state combinations (most invalid!)
interface BadAsyncState<T> {
  isLoading: boolean;
  error?: Error;
  data?: T;
}
// What does it mean if isLoading === true AND error !== undefined? Undefined behavior!

// ✅ Making Invalid States Unrepresentable: Exactly 4 valid states
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderView(state: AsyncState<UserProfile>) {
  switch (state.status) {
    case 'idle': return <p>Ready</p>;
    case 'loading': return <Spinner />;
    case 'error': return <ErrorMessage error={state.error} />;
    case 'success':
      // TypeScript guarantees state.data is defined; zero optional chaining needed!
      return <ProfileCard profile={state.data} />;
  }
}
```

- [More detail on Discriminated Unions in TypeScript](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on Making Invalid States Unrepresentable](https://kentcdodds.com/blog/stop-using-isloading-booleans)

---

### Question 28116695-c92b-45a8-9bbf-58afabfeef72

- What is the philosophy of **"Parse, don't validate"** (Alexis King), and how does it transform runtime boundary enforcement?

### Answer

- **Validation (Fragile check)**: Validating checks a boolean predicate (`isValid(x)`) and throws or returns false. Crucially, the return type of `x` remains broad (e.g. `string` or `any`). Upstream assumptions are not captured in the type system, requiring downstream code to re-check the same assertions.
- **Parsing (Proof-carrying transformation)**: Parsing takes unstructured, untrusted data (`unknown`), validates it, and returns a new, provably narrower type (`User`).
- **Proof carrier**: Once data has been parsed, downstream functions receive a type that statically proves that validation already succeeded.

```typescript
// ❌ Traditional Validation: Returns boolean; type information is lost
function isValidEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}
// Downstream functions still receive primitive 'string' and might still worry about validity!

// ✅ Parse, Don't Validate: Transforms untrusted input into a verified, narrow domain type
import { z } from 'zod';

const EmailSchema = z.string().email().brand<'Email'>();
export type ValidEmail = z.infer<typeof EmailSchema>;

export function parseEmail(input: unknown): ValidEmail {
  return EmailSchema.parse(input); // Throws if invalid, returns branded ValidEmail if valid
}

// Downstream function accepts only the proof of parsing:
export function sendReceipt(email: ValidEmail) {
  // Statically impossible to pass an unvalidated string here!
}
```

- [More detail on Parse, Don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
- [More detail on Zod Schema Validation](https://zod.dev/)

---

### Question 951a68cf-f481-4b7d-bb30-e91602e97ead

- Why is `unknown` strictly superior to `any` at system boundaries, and what is **narrowing discipline**?

### Answer

- **`any` (Disables the compiler)**: `any` completely turns off TypeScript's type checker for that variable. It propagates like a virus across function calls, permitting typos and invalid method calls to crash at runtime.
- **`unknown` (Type-safe honest top type)**: Indicates that the type of the value is truly unknown at compile time (e.g. `JSON.parse()`, `fetch()`, or `event.data`). TypeScript forbids reading properties, calling methods, or passing `unknown` into other functions without explicit narrowing.
- **Narrowing discipline**: Force developers to prove the type using type guards (`typeof`, `Array.isArray()`), discriminated tags, or schema parsers before consumption.

```typescript
// ❌ Dangerous 'any': Silently allows property typos and runtime explosions
function handleApiResponseBad(data: any) {
  // Compiles with zero errors, but crashes in production if 'user' or 'profile' is missing
  console.log(data.user.profile.firstName);
}

// ✅ Safe 'unknown': Compiler enforces narrowing discipline before property access
function handleApiResponseSafe(data: unknown) {
  // data.user.profile -> TypeScript error: "Object is of type 'unknown'"

  if (typeof data === 'object' && data !== null && 'user' in data) {
    const user = (data as { user: unknown }).user;
    if (typeof user === 'object' && user !== null && 'name' in user) {
      console.log((user as { name: string }).name); // Provably safe!
    }
  }
}
```

- [More detail on TypeScript Unknown Type](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [More detail on Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question 6bdf1c0c-5824-45a0-8679-ea13388ceb81

- How do **branded (nominal) types** prevent accidental identifier swaps and domain confusion in TypeScript?

### Answer

- **The primitive ID-swap bug**: In standard TypeScript, `type UserId = string` and `type OrderId = string` are aliases for primitive `string`. Passing an `orderId` into a function expecting a `userId` compiles without warning, leading to severe silent database lookup bugs.
- **Branded type mechanism**: Intersect the primitive type with an object containing a unique readonly brand property (`type UserId = string & { readonly __brand: unique symbol }`).
- **Compile-time enforcement**: Even though the value is a runtime string, TypeScript treats `UserId` and `OrderId` as mutually incompatible types.

```typescript
// Declaring branded nominal types:
declare const UserIdBrand: unique symbol;
export type UserId = string & { readonly [UserIdBrand]: typeof UserIdBrand };

declare const OrderIdBrand: unique symbol;
export type OrderId = string & { readonly [OrderIdBrand]: typeof OrderIdBrand };

// Constructors / Smart Casts:
export const asUserId = (id: string) => id as UserId;
export const asOrderId = (id: string) => id as OrderId;

// Function requiring specific IDs:
function cancelUserOrder(userId: UserId, orderId: OrderId) {
  // ...
}

const user = asUserId('user_123');
const order = asOrderId('ord_456');

cancelUserOrder(user, order); // ✅ Valid!
// cancelUserOrder(order, user);
// ❌ Compile error: Argument of type 'OrderId' is not assignable to parameter of type 'UserId'
```

- [More detail on Nominal Typing in TypeScript](https://michalzalecki.com/nominal-typing-in-typescript/)
- [More detail on TypeScript Branded Types](https://github.com/microsoft/TypeScript/wiki/FAQ#can-i-make-a-type-alias-nominal)

---

### Question f75d264c-6c69-47e1-8ceb-3db15bd518e7

- How does **deriving types directly from runtime schemas (e.g. Zod)** apply the DRY principle to data modeling?

### Answer

- **Dual declaration duplication**: Manually maintaining both a TypeScript `interface User { ... }` and a runtime validation validator leads to drift over time. Updating an interface without updating the validator creates runtime crashes; updating the validator without updating the interface leads to stale types.
- **Single Source of Truth**: Define the runtime schema once using a validation library (Zod, Valibot, ArkType), and infer the static TypeScript type automatically using `z.infer<typeof Schema>`.
- **Zero drift guarantee**: Every change to runtime validation constraints immediately updates static TypeScript types and downstream compiler checks across the entire codebase.

```typescript
import { z } from 'zod';

// Single source of truth for both runtime parsing and static typing:
export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  priceCents: z.number().int().positive(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']),
});

// Statically inferred type (Zero manual interface maintenance!)
export type Product = z.infer<typeof ProductSchema>;

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  // Validates at runtime AND returns inferred static Product type
  return ProductSchema.parse(await res.json());
}
```

- [More detail on Zod Type Inference](https://zod.dev/?id=type-inference)
- [More detail on Single Source of Truth](https://en.wikipedia.org/wiki/Single_source_of_truth)

---

### Question 71480b85-94f0-458e-8069-d5f2df7dea97

- When should a senior engineer exercise **restraint and avoid adding complex type gymnastics**?

### Answer

- **Type-level gymnastics tax**: Crafting deeply nested conditional types, recursive string template literal parsers, and multi-layered generic abstractions slows down the TypeScript compiler (`tsc`), causes indecipherable error messages, and intimidates teammates.
- **Runtime clarity over compile-time purity**: If a type signature requires 50 lines of complex utility types to express a dynamic edge case, simplifying the runtime API to accept simpler arguments is virtually always the superior engineering decision.
- **Senior restraint heuristic**: Types should serve the code, not the other way around. If a generic abstraction is only used in one place or obscures runtime intent, use explicit, straightforward concrete types.

```typescript
// ❌ Over-engineered Type Gymnastics: Recursive tuple string flattener
type DeepJoin<T extends any[], D extends string> = T extends [] ? '' :
  T extends [infer F] ? `${F & string}` :
  T extends [infer F, ...infer R] ? `${F & string}${D}${DeepJoin<R, D>}` : string;
// Confusing to teammates, degrades compiler performance!

// ✅ Senior Restraint: Simple function signature with standard types
function joinSegments(segments: string[], delimiter = '/'): string {
  return segments.join(delimiter);
}
```

- [More detail on TypeScript Performance Best Practices](https://github.com/microsoft/TypeScript/wiki/Performance)
- [More detail on KISS in Type Design](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
