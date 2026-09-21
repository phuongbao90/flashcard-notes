# TypeScript Best Practices

### Question 534f4b6e-ec2e-4bcd-9e63-30f9519b465e

- What rule should decide `interface` vs `type` in a codebase?

### Answer

- Use **`interface`** for object contracts that may be extended or augmented (public APIs, React props, class contracts).
- Use **`type`** for unions, intersections, tuples, primitives, function types, and anything derived (`Pick`/`Omit`/conditional).
- The performance difference is negligible; consistency matters more than the choice — pick one rule and encode it in lint config (`@typescript-eslint/consistent-type-definitions`).

```ts
interface User { id: string }             // object contract
type Result = { ok: true } | { ok: false } // union
```

- [More detail on the differences](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)

---

### Question 9e20ae08-45c0-4cfc-bee4-24465aab417a

- Why is `unknown` preferred over `any` for untrusted input?

### Answer

- `unknown` forces a narrowing step, keeping the unsafe boundary explicit and local.
- `any` disables checking and **propagates**: every access and every derived value is also `any`.
- The rule: `any` only for intentional escape hatches (with a comment), `unknown` for data of unknown shape.

```ts
function handle(payload: unknown) { if (typeof payload === "string") payload.toUpperCase(); }
```

- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [More detail on any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)

---

### Question 1a111325-dedd-4052-9456-c556e0b85c16

- Where should type annotations be mandatory, and where should inference win?

### Answer

- **Boundaries**: exported function signatures, module APIs, library props — annotate so the contract is explicit and errors land locally.
- **Locals**: let inference work; annotations on every variable add noise and hide intentional literal types.
- Annotate when the inferred type is too wide (e.g. `let status = "idle"`).

```ts
export function parse(input: string): User { /* ... */ }  // annotate
const count = items.length;                                // infer
```

- [More detail on type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [More detail on return type annotations](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-annotations)

---

### Question 70256393-61dd-437c-98fd-634134175e11

- What is the rule for reading arrays in library code?

### Answer

- Accept `readonly T[]` when you only read — callers can pass tuples, frozen arrays, and `as const` values.
- Return mutable arrays only when the caller is meant to mutate them.
- This makes APIs more permissive at the input and honest about output.

```ts
function sum(xs: readonly number[]): number { return xs.reduce((a, b) => a + b, 0); }
```

- [More detail on readonly arrays](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)
- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question c2a7b2a0-8ffd-4869-bc94-0831bc6a3ff9

- Why is "make illegal states unrepresentable" the highest-value typing practice?

### Answer

- Encoding invariants in types removes whole classes of runtime checks and bugs.
- Typical moves: union variants with discriminants, no `collection: T | null` plus `loaded: boolean`, no `items?: T[]` plus `isLoading`.
- The payoff grows with every consumer: the compiler enforces the invariant everywhere, not just in one guard.

```ts
type State = { status: "loading" } | { status: "done"; items: Item[] } | { status: "error"; message: string };
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question e96a6f29-fb31-4ba3-8266-17424bc48e9d

- When should you use `satisfies` instead of a type annotation?

### Answer

- Use `satisfies` when you want **validation without widening** — config objects, lookup tables, route maps, exhaustive registries.
- Use an annotation when the declared type should be the public contract (narrower inference is not desired).
- `satisfies` also catches excess/missing keys against `Record<Union, T>` maps.

```ts
const routes = { home: "/", user: "/u/:id" } satisfies Record<string, string>;
```

- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [More detail on type annotations](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

---

### Question 0a4cde83-b3df-403a-bece-860940900a7a

- Why should type assertions (`as`) be treated as code smells?

### Answer

- Each assertion is an unchecked promise the compiler cannot verify; wrong assertions become runtime crashes.
- They hide refactor breakage: rename a field and the assertion keeps compiling.
- Acceptable uses: DOM type assertions after a runtime check, test fixtures, `as const`, and narrowing through `unknown` with a comment.

```ts
const user = data as User;          // smell
const user = parseUser(data);        // parse + validate, honest type
```

- [More detail on type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- [More detail on type guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

### Question a49865ae-e0b7-48f5-8639-0e97fad448b4

- How do you avoid scattering non-null assertions across DOM code?

### Answer

- Centralize the lookup in a helper that throws a descriptive error and returns the narrowed type.
- Reserve `!` for places where the invariant truly cannot fail and is obvious.
- The same pattern applies to env vars, test setups, and DI-injected fields.

```ts
function must<T extends Element>(sel: string): T { const el = document.querySelector<T>(sel); if (!el) throw new Error(sel); return el; }
```

- [More detail on non-null assertion](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator)
- [More detail on querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)

---

### Question 836756ea-ed2a-4986-a7a8-d56c83912a7f

- Why prefer literal unions over enums in application code?

### Answer

- Zero runtime output, direct compatibility with JSON/DB values, and no transpiler pitfalls (`const enum` under `isolatedModules`).
- They derive naturally from `as const` arrays, so validation and types share one source of truth.
- Enums remain reasonable when you need runtime iteration/reflection or a nominal token.

```ts
const SIZES = ["sm", "md"] as const;
type Size = (typeof SIZES)[number];
```

- [More detail on enums vs alternatives](https://www.typescriptlang.org/docs/handbook/enums.html#enums-vs-alternatives)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question dffe4334-ea37-4893-b962-e635d59bcf34

- What is boolean blindness and how do types fix it?

### Answer

- Boolean parameters (`send(user, true, false)`) are unreadable and easy to swap, because types carry no meaning.
- Replace with an options object with named fields, or a literal union for modes.
- Named arguments do not exist in JS, so the options object is the idiomatic fix.

```ts
function send(msg: string, opts: { encrypted: boolean; priority: "low" | "high" }) {}
```

- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question a26c9242-bcbb-47e5-8403-cbe50bb26a84

- Why are branded types worth the ceremony for IDs and domain primitives?

### Answer

- `string` IDs for users/posts/orders are interchangeable structurally, which is exactly the bug you want to prevent.
- A brand (`string & { __brand: "UserId" }`) makes them nominally distinct with zero runtime cost.
- Costs: a cast at construction and slightly noisier errors — usually worth it at domain boundaries.

```ts
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };
type UserId = Brand<string, "UserId">;
```

- [More detail on branded types](https://www.typescriptlang.org/play)
- [More detail on structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question bb7a9802-0df7-4ec8-8576-662cb23360c7

- Where does runtime validation belong relative to TypeScript types?

### Answer

- At every **trust boundary**: HTTP responses, request bodies, `localStorage`, env vars, URL params, third-party SDK results.
- Inside the app, rely on types; re-validating typed data is duplicated work unless an invariant can break.
- Schema libraries give both validation and the inferred type from one definition, keeping them in sync.

```ts
const user = UserSchema.parse(response); // throws or returns User
```

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question d4ee13a3-db15-4c9d-b63a-c0476993bf55

- Why colocate types with the code that owns them?

### Answer

- A type next to its values/functions is easier to find, refactor, and keep in sync; changes stay in one diff.
- A global `types.ts` becomes a hub of unrelated types, encouraging broad imports and cycles.
- Exception: shared cross-package contracts belong in a dedicated contracts module.

- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on type aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)

---

### Question 1aa47490-7020-4032-a8cf-be310f327aa2

- How do exhaustive switches prevent regressions when adding a variant?

### Answer

- The `default` branch assigns the narrowed remainder to `never`; a new union member makes that branch non-`never` and fails the build.
- Without it, new variants silently fall through to a default behavior.
- Use a small `assertNever(x: never): never` helper for the error path.

```ts
default: { const _x: never = action; throw new Error(`unhandled: ${JSON.stringify(_x)}`); }
```

- [More detail on exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)

---

### Question 735abfed-b64a-4c33-bda1-d567a9511585

- Why should public APIs avoid anonymous inline object types?

### Answer

- `function f(user: { id: string; name: string })` cannot be referenced, extended, or documented by consumers.
- Named types produce better hovers, error messages, and allow `Pick`/`Omit` composition later.
- Keep inline types for local callbacks where the shape is private and obvious.

```ts
type UserRef = { id: string; name: string };
function f(user: UserRef) {}
```

- [More detail on type aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)
- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)

---

### Question 5fde48b7-a575-400b-8e89-f32ed9581330

- What is the purpose of `strict: true` in a new project, and how do you adopt it in an existing one?

### Answer

- For new code, `strict` gives sound null checks, no implicit `any`, and property initialization checks — bugs caught at compile time.
- For existing code, enable strict flags incrementally (`strictNullChecks` first) with per-directory `extends` configs or a ratchet plan.
- Do not disable a flag permanently without documenting the reason.

```jsonc
{ "compilerOptions": { "strict": true } }
```

- [More detail on strict](https://www.typescriptlang.org/tsconfig#strict)
- [More detail on strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)

---

### Question 12e762e6-7813-4e84-a449-6be73c6dc289

- Which lint rules pay for themselves in a TypeScript codebase?

### Answer

- `@typescript-eslint/no-explicit-any` — catches escape hatches at review time.
- `consistent-type-imports` + `no-import-type-side-effects` — keeps `import type` correct for bundlers.
- `no-floating-promises` and `no-misused-promises` — the highest-value runtime-bug rules for async code.
- `no-unnecessary-condition` (with care) — finds dead guards and missing ones.

- [More detail on typescript-eslint](https://typescript-eslint.io/rules/)
- [More detail on no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/)

---

### Question cd36987e-1284-468e-9103-28c228cff4b1

- Why is `catch (e)` treated as `unknown`, and what should you do with it?

### Answer

- JS allows throwing anything (`throw "string"`, `throw 42`, or a promise rejection value), so `any`/`Error` would be a lie.
- Narrow with `instanceof Error` for the common case and fall back to `String(e)`.
- For non-Error rejections, log the raw value too — stack traces may be missing.

```ts
catch (e) { const msg = e instanceof Error ? e.message : String(e); }
```

- [More detail on useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig#useUnknownInCatchVariables)
- [More detail on Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

---

### Question 959391d3-f267-4e0d-bc59-7369badc5ff3

- When is `skipLibCheck` a good trade-off?

### Answer

- Good for app builds where dependency declaration errors are not actionable and checking slows the build significantly.
- Bad when you author/type libraries and need full verification, or when you suspect conflicting global augmentations.
- It does not weaken checking of your own code — only `.d.ts` files.

```jsonc
{ "compilerOptions": { "skipLibCheck": true } }
```

- [More detail on skipLibCheck](https://www.typescriptlang.org/tsconfig#skipLibCheck)
- [More detail on performance](https://github.com/microsoft/TypeScript/wiki/Performance)

---

### Question 8535e390-0917-4b58-b25e-ed0555f7991e

- How do you keep two related types from drifting apart?

### Answer

- Derive one from the other (`Pick`, `Omit`, `ReturnType`, `typeof`, or a schema) rather than copying fields.
- If the shapes must stay compatible, add a compile-time assignability assertion in a test file.
- Duplicate hand-written DTOs across client/server are the classic drift bug.

```ts
type PublicUser = Omit<User, "passwordHash">;
```

- [More detail on utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [More detail on typeof in type position](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

---

### Question 04b895c0-8d1d-4301-9b63-92da8f0992a0

- Why prefer `type` for function signatures over interfaces with call signatures in app code?

### Answer

- Aliases read closer to JS syntax, compose with unions/intersections, and are one construct instead of two.
- Keep interfaces for object contracts you expect consumers to extend; function types are rarely extended.
- Consistency is the real goal: mixed styles for the same concept confuse readers.

```ts
type Handler = (e: Event) => void;
```

- [More detail on function type expressions](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)
- [More detail on call signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures)

---

### Question 4cc621a2-6413-40c9-99f4-78d0c2211de1

- Should exported functions always have explicit return types?

### Answer

- Yes for library/public APIs: the return type becomes a stable contract, and accidents like returning `any` from unvalidated JSON are caught.
- Optional for internal helpers where inference is obvious and refactors benefit from automatic flow.
- Generics and conditional returns are a case where explicit types are required for usability.

- [More detail on return type annotations](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-annotations)
- [More detail on declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

---

### Question 19b7ef12-5726-44e8-b22b-e8efb456c675

- Why should `namespace` be avoided in app code today?

### Answer

- ES modules already provide scoping; namespaces add a second, runtime-emitting mechanism with poor tree-shaking.
- They conflict with `isolatedModules`/`erasableSyntaxOnly` pipelines and confuse bundlers.
- Reserve them for ambient declarations in `.d.ts` files and legacy global libraries.

- [More detail on namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- [More detail on namespaces and modules](https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html)

---

### Question 5dbb3a88-151a-4864-b38c-d415189dc8cb

- What is the argument for and against default exports in TypeScript?

### Answer

- Against: names are lost on import (editors rename them), refactoring/grep is harder, and CJS/ESM interop differs per tool.
- For: single-purpose module files read cleanly with a default export.
- Common team rule: named exports everywhere; defaults only for React components/framework-required files.

- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop)

---

### Question 0da6351f-6e34-4efe-89dc-e6b8a6033524

- Why does typechecking belong in CI as a blocking gate?

### Answer

- Editors show errors only for files a developer opens; a full `tsc --noEmit` finds breakage across the repo (and generated/exported types).
- Type errors fail in production the same way lint-clean runtime bugs do — missing null checks, wrong payloads.
- Prefer `--noEmit` in CI plus a separate build step so CI is faster and the build tool is not the typechecker.

```bash
tsc --noEmit
```

- [More detail on noEmit](https://www.typescriptlang.org/tsconfig#noEmit)
- [More detail on performance](https://github.com/microsoft/TypeScript/wiki/Performance)

---

### Question 8660b128-47db-4d76-845b-dd8ee1011c75

- How do you keep large type definitions maintainable?

### Answer

- Split domain types into modules by feature, and compose with utilities instead of one 500-line file.
- Name intermediate transformations (`type UserPatch = Partial<Pick<User, "name" | "email">>`) so the reader sees intent.
- Avoid deeply recursive conditional utilities on big unions; they hurt comprehension and compile time.

- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

### Question 49b30889-4ed8-468e-abdc-34d65bbd61b9

- What is the recommended migration path from JavaScript to TypeScript?

### Answer

- Enable `allowJs` + `checkJs` to type-check JS with JSDoc first, fix errors, then rename files to `.ts` in dependency order (leaf modules first).
- Turn on strict flags incrementally; keep the build green at every step.
- Avoid mixing `any` everywhere during migration — each boundary converted permanently reduces the work.

```jsonc
{ "compilerOptions": { "allowJs": true, "checkJs": true, "noImplicitAny": true } }
```

- [More detail on allowJs](https://www.typescriptlang.org/tsconfig#allowJs)
- [More detail on JS migration](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)

---

### Question d8e45195-714d-4c83-b68a-cc02d856e3d6

- Why is `{}` a bad way to say "an empty object" or "any object"?

### Answer

- `{}` accepts every non-nullish value, including `"hello"`, `42`, and `true` — it is not an empty shape and not an object type.
- Use `object` for "any non-primitive", `Record<string, never>` for a truly empty object, or declare the fields you need.
- `Object` has the same problem, worse.

```ts
const a: {} = "str";              // allowed
const b: Record<string, never> = {}; // truly empty
```

- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on the object type](https://www.typescriptlang.org/docs/handbook/2/functions.html#object)

---

### Question cf3a1907-7e53-4f9b-9324-f85e8822b4be

- What is the risk of `<T = any>` as a generic default?

### Answer

- Callers that omit the type argument silently get `any`, disabling checking exactly where generics were meant to help.
- Prefer `<T = unknown>` (safe, forces narrowing) or no default at all so callers must supply/infer it.
- Same reasoning applies to `any` constraints and `as any` in adapter functions.

```ts
interface Api<T = unknown> { data: T }
```

- [More detail on generic defaults](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question fcaed251-89fa-4be3-90ff-a112481c1d66

- How do you review a type change in a PR for hidden runtime impact?

### Answer

- Check whether the type merely describes existing runtime behavior or whether code changed to satisfy it.
- Look for widened inputs (a new nullable field), narrowed outputs (callers now fail), and `as`/`!`/`any` introduced to silence errors.
- Ask whether the boundary validation still covers the new shape.

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 29c2f7db-5bfc-4f1c-9397-e132b36080b9

- Why write type-level tests for shared utilities?

### Answer

- Utilities like `DeepPartial` or `StrictOmit` are code; a regression in the type silently changes every caller's type.
- Type tests (`tsd`, `expectType`, or a `types.test-d.ts` compiled in CI) pin the behavior.
- Include negative tests with `@ts-expect-error` to verify invalid usage fails.

```ts
expectType<number>(add(1, 2));
// @ts-expect-error strings are not numbers
add("1", "2");
```

- [More detail on tsd](https://github.com/SamVerschueren/tsd)
- [More detail on ts-expect-error](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#ts-ignore-or-ts-expect-error)

---

### Question 8f5b7696-d30a-4c41-a75d-ec516a6ef220

- Why not use `strict` as the only type-safety knob?

### Answer

- Several high-value flags are **not** in `strict`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`.
- These model real runtime risks (array holes, optional properties, typos) but require migration effort.
- Decide per flag, enable when the codebase can absorb it, and document the decision.

```jsonc
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "noImplicitOverride": true } }
```

- [More detail on strict](https://www.typescriptlang.org/tsconfig#strict)
- [More detail on noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)

---

### Question 66da4c2b-580e-4445-aa47-2d30e8d1de19

- What does "types describe, they do not enforce" imply for API design?

### Answer

- Consumers can always cast, and runtime data can always violate your types, so invariants that must hold need runtime checks (validation, access control, DB constraints).
- Types are documentation plus static verification, not a security boundary.
- Design APIs so the safe path is the typed path, but keep runtime enforcement where it matters.

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on runtime validation](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
