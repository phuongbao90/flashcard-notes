# TypeScript Type Annotations & Inference

### Question c9b5209e-a96c-43dd-b8fb-363af7d920e0

- Why annotate a variable when TypeScript can infer its type from the initializer?

### Answer

- Annotations **widen or fix intent**: `let mode: "a" | "b" = "a"` documents the allowed set, while inference would produce `string`.
- They also make the compiler validate the initializer against the contract instead of just recording it.
- Annotating empty or late-initialized variables is required, since there is nothing to infer from.

```ts
let status: "idle" | "loading" | "done" = "idle";
const ids: string[] = [];  // without annotation this is evolving any[]
```

- [More detail on Type Annotations](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-annotations-on-variables)
- [More detail on Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 7097884b-c7ae-4314-8860-66b42b1fc3a1

- What does TypeScript infer for `const arr = []`?

### Answer

- It infers an **evolving array type**: a special `any[]`-like type whose element type adapts as elements are pushed.
- The evolving type only works while the variable is being built up; reading the array in a way that fixes it freezes the element type.
- Annotate the array up front (`const arr: string[] = []`) whenever the intended element type is known.

```ts
const a = [];
a.push("x");
a.push(1);        // evolves to (string | number)[]
const first = a[0]; // string | number
```

- [More detail on evolving any](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html#better-inference-for-array-methods)
- [More detail on type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question e9bc9001-212b-417e-8d71-d2612967f93c

- A `const` object infers `{ kind: string }` from `{ kind: "a" }`. Why not the literal `"a"`, and how do you keep it?

### Answer

- Property types **widen** because object properties are mutable, so `kind` must accept any string.
- `as const` on the object freezes both the literal types and makes all properties `readonly`.
- `satisfies` combined with `as const` keeps literals while still validating the shape.

```ts
const a = { kind: "a" };                    // { kind: string }
const b = { kind: "a" } as const;           // { readonly kind: "a" }
const c = { kind: "a" } as const satisfies { kind: string };
```

- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [More detail on literal inference](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question bf1df465-752f-43ff-81ea-2fc8d69e18a4

- How does TypeScript compute the type of `const arr = [1, "a", true]`?

### Answer

- It applies the **best common type** algorithm: it picks the union of candidate element types, producing `(string | number | boolean)[]`.
- If no common type exists, it may infer `any[]` or an array of the first element's widened type (contextual typing can override).
- Tuples are never inferred from array literals; write `[number, string, boolean]` explicitly.

- [More detail on best common type](https://www.typescriptlang.org/docs/handbook/type-inference.html#best-common-type)
- [More detail on Tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 66384f4c-03c8-4d59-9c8f-156207eb0b36

- When does TypeScript silently infer `any`, and how do you prevent it?

### Answer

- **`noImplicitAny`** (part of `strict`) turns every implicit `any` into an error: unannotated parameters, catch variables (with `useUnknownInCatchVariables` it becomes `unknown`), and some index accesses.
- Without it, unannotated function parameters are `any`, which disables checking inside the function.
- Enable `strict: true` and annotate parameters; use `unknown` when the shape truly is unknown.

```ts
function f(x) { return x.anything; } // x: any without noImplicitAny
```

- [More detail on noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny)
- [More detail on strict](https://www.typescriptlang.org/tsconfig#strict)

---

### Question f6aa1ddc-b007-41e0-83f7-f7c47aa73658

- Does TypeScript infer parameter types from the way a function is called?

### Answer

- **No.** Inference is local to the declaration; call sites are not used as constraints.
- Parameter types come from annotations, default values, contextual typing from the expected function type, or from a generic parameter.
- The exception is inference *within* the call itself: with `function id<T>(x: T)`, `T` is inferred from the argument at each call.

```ts
const f = (n = 0) => n * 2;   // n inferred as number from default
const g: (e: Event) => void = (e) => {}; // e typed by context
```

- [More detail on Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [More detail on Contextual typing](https://www.typescriptlang.org/docs/handbook/type-inference.html#contextual-typing)

---

### Question 8f161914-8757-4804-9b2f-b907d7d8c1fb

- What is contextual typing and where does it appear in everyday code?

### Answer

- The **expected type** at a position flows into the expression being written, so you can omit annotations.
- Common sites: object literals assigned to a typed variable, function arguments, callback props, array method callbacks on a typed array, JSX props.
- It fails when there is no expected type — then parameters are implicitly `any` (error under `noImplicitAny`).

```ts
const handler: (e: MouseEvent) => void = (e) => console.log(e.clientX); // e is MouseEvent
[1, 2].map((n) => n.toFixed()); // n is number from number[]
```

- [More detail on Contextual typing](https://www.typescriptlang.org/docs/handbook/type-inference.html#contextual-typing)
- [More detail on Function type expressions](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)

---

### Question f335484c-106c-4ff9-88c2-bca811d45e94

- Should you annotate function return types? What are the trade-offs?

### Answer

- **Annotate public/boundary functions**: the return type becomes the contract, and a wrong branch errors at the `return`, not at every caller.
- **Let locals infer**: less noise, and refactors flow through automatically.
- Inference has one trap: a recursive function whose return type cannot be inferred errors with "implicitly has return type 'any' because it does not have a return type annotation".

```ts
function parse(json: string): User { return JSON.parse(json); } // contract + validated at return
```

- [More detail on return type annotations](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-annotations)
- [More detail on inference pitfalls](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 4518f900-4b26-417a-a2d6-2420076e3a7a

- What does `satisfies` add over a type annotation?

### Answer

- `x: T` sets the variable's type to `T`, discarding narrower inferred info.
- `x satisfies T` **validates** `x` against `T` but keeps the inferred (often narrower) type.
- Best for config objects and lookup tables where you want both checking and literal keys preserved.

```ts
const routes = { home: "/", user: "/u/:id" } satisfies Record<string, string>;
type RouteKey = keyof typeof routes; // "home" | "user"
routes.hom; // Error: typo caught (property lookup is still checked)
```

- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [More detail on type annotations](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-annotations-on-variables)

---

### Question 7ac0a7ae-425a-4ca4-9132-927a5675d89d

- Why does annotating `const el: HTMLElement = document.querySelector("#a")` fail while inference works fine?

### Answer

- `querySelector` returns `Element | null`, and `Element | null` is not assignable to `HTMLElement`.
- Inference then gives the correct union and forces a null check; the annotation only hid the nullability if the return were cast.
- The fix is narrowing or a generic call: `document.querySelector<HTMLElement>("#a")`, which still returns `HTMLElement | null`.

```ts
const el = document.querySelector<HTMLInputElement>("#name");
el.value;          // Error: possibly null
if (el) el.value;  // OK
```

- [More detail on querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
- [More detail on strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)

---

### Question 847da901-f452-4a63-8de1-f1e6b8d15133

- How does TypeScript infer types for destructured function parameters?

### Answer

- The **expected parameter type** supplies the property types, so destructuring inside the signature is contextually typed.
- Default values are part of the declared type only if you write them; the parameter type still must allow `undefined` for optional properties.
- Annotate the whole parameter object instead of each binding when the default is complex.

```ts
type Opts = { retries?: number; timeout?: number };
function request({ retries = 3, timeout = 1000 }: Opts = {}) {}
```

- [More detail on optional parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters)
- [More detail on destructuring](https://www.typescriptlang.org/docs/handbook/2/functions.html#parameter-destructuring)

---

### Question a06c1c60-3f48-49d0-ba49-0d58b2a4d1bf

- What is the difference between widening and narrowing in TS inference terms?

### Answer

- **Widening** happens on mutable storage: `let s = "a"` becomes `string`, `let n = 1` becomes `number`.
- Not widening happens in `const` bindings, `readonly` positions, and `as const`; those keep literal/unit types.
- **Narrowing** is the unrelated control-flow operation that shrinks an existing union based on runtime checks.

```ts
let a = "a";              // widened: string
const b = "a";            // literal: "a"
let c: "a" | "b" = "a";   // annotated literal union
```

- [More detail on literal widening](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html#widening-literal-types)
- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question e6d3b798-db3f-492f-af1c-722339569f62

- What type does an `async` function's return value get, and why can returning `T` be an error?

### Answer

- An `async` function always returns `Promise<T>`, where `T` is inferred from the returned expression.
- Returning a non-promise value is wrapped; returning a `Promise<Promise<T>>` style value is flattened by `await`.
- Explicit `: Promise<User>` annotations are worth it on boundaries so a wrong `return` shape errors locally.

```ts
async function load(): Promise<User> {
  const res = await fetch("/me");
  return res.json(); // Error if the JSON shape is not validated: returns Promise<any> → any
}
```

- [More detail on Promises](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html#async-functions)
- [More detail on Awaited](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype)

---

### Question 2e00bf52-8a91-45a5-a282-f2386a7b0ba5

- How do you re-use the inferred type of a value without duplicating it?

### Answer

- The **type query operator** `typeof value` extracts the type of a value in type position.
- Common pattern: define a config/generated object, then derive types with `typeof` and `keyof`/indexed access.
- Only works for values (const/let/import); for module types you need an `export type` or `typeof import("...")`.

```ts
const config = { retries: 3, baseUrl: "/api" };
type Config = typeof config;            // { retries: number; baseUrl: string }
type Keys = keyof typeof config;        // "retries" | "baseUrl"
```

- [More detail on typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

---

### Question 0462d78e-a01f-4d22-a0a5-895ea7245f30

- Why does `const x = someAnyValue` not raise any error even with `strict` on?

### Answer

- `any` is assignable to every type, so the initializer passes and `x` itself can be inferred as `any`.
- `strict` does not forbid `any`; it forbids **implicit** `any`. Explicit `any` still requires `noExplicitAny`-style linting (not a compiler flag).
- Mitigations: `unknown` at boundaries, `@typescript-eslint/no-explicit-any`, and `strict` lint rules.

- [More detail on any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)
- [More detail on noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny)

---

### Question 80687534-b27c-46af-a04d-4deb61b7b552

- What is `noUncheckedIndexedAccess` and what does enabling it change?

### Answer

- Index access returns `T | undefined` instead of `T`, forcing a check after every `arr[i]` / `record[key]`.
- It is **not** part of `strict`; enabling it is a deliberate strictness upgrade that produces many errors on existing code.
- It models reality: arrays can be sparse and records can lack keys, so the check is usually a bug fix.

```ts
const xs: string[] = [];
const first: string | undefined = xs[0];
const rec: Record<string, number> = {};
const v: number | undefined = rec["a"];
```

- [More detail on noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)
- [More detail on indexed access](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question b7f6b068-b8cf-4126-a300-031fa1aba029

- What does `declare` do on a variable or function, and when is it needed?

### Answer

- `declare` asserts **"this exists at runtime, don't emit anything"** — it is a compile-time promise used for globals injected elsewhere.
- Needed for env-injected globals (`declare const __DEV__: boolean;`), for `.d.ts` declarations, and for typing third-party globals.
- Without `declare`, assigning or defining the same name would emit conflicting JS.

```ts
declare const BUILD_HASH: string;
console.log(BUILD_HASH); // emitted as-is, value comes from the bundler
```

- [More detail on ambient declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on declare](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)

---

### Question a9071e2c-08c1-4059-9cd7-bfbe5231aeb0

- How do default parameter values interact with the inferred parameter type?

### Answer

- The default value's type is used to infer the parameter type, and the parameter becomes **optional at the call site**.
- The declared type is the default's type, so passing `undefined` explicitly is allowed and triggers the default.
- Defaults do not make the parameter nullable: passing `null` still errors unless the type includes `null`.

```ts
function greet(name = "world") {}  // (name?: string) => void
greet();            // OK
greet(undefined);   // OK
greet(null);        // Error
```

- [More detail on default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)
- [More detail on inference from defaults](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 18ed0173-0fd8-47e5-a3f0-61e551cec9a9

- Why is the type of an object literal nested inside a function call sometimes narrower than expected?

### Answer

- Object literal properties **widen** (e.g. `{ type: "a" }` → `{ type: string }`) unless context or `as const` says otherwise.
- Freshness/excess property checks apply to those literals, so a typo'd key errors even though the shape is otherwise fine.
- In generic calls, the literal's widened type can also make inference pick `string`; use `as const` to keep unit types.

```ts
function make<T>(x: T) { return x; }
const a = make({ kind: "circle" });          // { kind: string }
const b = make({ kind: "circle" } as const); // { readonly kind: "circle" }
```

- [More detail on literal inference](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [More detail on Excess Property Checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)

---

### Question 1957d362-18f7-472c-82e8-2ea009b27954

- What does `useUnknownInCatchVariables` change about `catch (e)`?

### Answer

- It makes `e` typed as **`unknown`** (it is enabled by `strict`), forcing you to narrow before accessing properties.
- Without it, `e` is `any`, so `e.message` compiles even though anything can be thrown in JS.
- The canonical narrowing: `if (e instanceof Error) use(e.message); else String(e)`.

```ts
try { risky(); } catch (e) {
  if (e instanceof Error) console.log(e.message);
}
```

- [More detail on useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig#useUnknownInCatchVariables)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question 8deb28d6-97d7-4a8a-8ac4-80f3ae354223

- Why is `Object.keys(x)` typed as `string[]` even when `x` has known keys?

### Answer

- The standard library signature is `Object.keys(o: object): string[]`, because objects can have extra keys at runtime that the type does not describe.
- To get precise keys, write a helper that casts through `keyof` — you are asserting the runtime invariant yourself.
- The safest pattern is a type guard that validates keys instead of casting.

```ts
function keys<T extends object>(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[];
}
```

- [More detail on Object.keys](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)
- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

---

### Question a94d1d0a-41c5-4945-9ddd-55d8c5d78f24

- What is `strict` composed of, and why enable it in new projects?

### Answer

- `strict` is a bundle (roughly): `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.
- Enabling it after the fact surfaces many errors, so start strict — retrofitting requires triaging each one.
- Individual flags can be turned off, but each opt-out is unsoundness you now own.

- [More detail on strict](https://www.typescriptlang.org/tsconfig#strict)
- [More detail on strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)

---

### Question 3522c13d-5b47-4a6f-b7ff-bdaa261c0af3

- What is the practical difference between annotating a variable and asserting its type?

### Answer

- An **annotation** (`: T`) requires the initializer to be assignable to `T`; it is checked.
- An **assertion** (`as T`) overrides the compiler; it is not checked beyond "types overlap".
- Prefer annotations; use assertions only as a documented boundary (e.g. after manual validation, DOM `#id` lookups).

```ts
const payload: unknown = JSON.parse(s);   // checked: must narrow before use
const user = JSON.parse(s) as { id: string }; // unchecked claim, no validation
```

- [More detail on type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- [More detail on Assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question b71b98f7-9795-427f-ab6b-54cfd0e424d8

- Why can a function returning a value be assigned to a variable annotated with a different return type only when compatible?

### Answer

- Return types are checked **covariantly**: the produced value must be assignable to the annotated/expected type.
- The exception is `void`-returning targets, which accept any return value because callers ignore it.
- So `() => "a"` is assignable to `() => string` and to `() => void`, but not to `() => number`.

```ts
const f: () => string = () => "a";
const g: () => void = () => 1;   // OK (void rule)
const h: () => number = () => "a"; // Error
```

- [More detail on return type void](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)
- [More detail on function assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-function-types)

---

### Question 87868df6-8b02-424e-aed5-75c0a3b96808

- What does `as const` do to arrays and nested objects?

### Answer

- It makes every property `readonly`, keeps **literal types**, and turns array literals into `readonly` **tuples**.
- It applies deeply, so nested objects and arrays are all frozen at the type level (no runtime `Object.freeze`).
- Mutating code then fails to compile: `arr.push(...)` and `obj.field = ...` are rejected.

```ts
const xs = [1, 2] as const;   // readonly [1, 2]
xs[0];                        // 1
xs.push(3);                   // Error
```

- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [More detail on readonly tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types)

---

### Question 1067ef68-9b12-4be1-b0d0-43ccce1f268d

- When is inference actively worse than an explicit annotation?

### Answer

- When the inferred type is **too wide**: `let status = "idle"` allows any string; annotate the union to constrain.
- When a recursive function's return type cannot be inferred (implicit any error).
- When the inferred type is a public API surface: `export function f() { ... }` leaks whatever you happened to return, including `any` from unvalidated data.

- [More detail on type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [More detail on return types](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-annotations)

---

### Question 2c06e218-3e88-4954-a2cf-e9bb47f88b8d

- How does TypeScript infer the type of a utility function like `const first = (xs: string[]) => xs[0]`?

### Answer

- The parameter type comes from the annotation (`string[]`), and the return type is the element type.
- Without `noUncheckedIndexedAccess`, that is `string` — but the array may be empty at runtime and yield `undefined`.
- Enable `noUncheckedIndexedAccess` (or annotate `string | undefined`) so the empty-array case is visible in the type.

```ts
function first(xs: string[]) { return xs[0]; }
const s = first([]); // string, but undefined at runtime without noUncheckedIndexedAccess
```

- [More detail on noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)
- [More detail on indexed access](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question df4e5c8d-8d39-476d-9b13-3bb249bcdec0

- Why does `const [a, b] = [1, "x"]` give both `a` and `b` the type `number | string` instead of positional types?

### Answer

- The array literal infers `(string | number)[]` by the best-common-type rule; a tuple is **not** inferred from an array literal.
- Destructuring an array yields the element type for every position, so both names are the union.
- Annotate a tuple (`[number, string]`) or use `as const` when positions carry different types.

```ts
const [a, b] = [1, "x"];            // both: string | number
const [c, d]: [number, string] = [1, "x"]; // c: number, d: string
```

- [More detail on array inference](https://www.typescriptlang.org/docs/handbook/type-inference.html#best-common-type)
- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 27e25661-8ed7-4672-8f86-04b407bbb81e

- Why does adding a new property to an object variable fail, even though the type was inferred from an object literal?

### Answer

- Inference happens once at the declaration: the variable's type is the shape of that literal, and it does not expand on later writes.
- Adding an undeclared key is an excess property on an existing type, so TS rejects the assignment.
- Fix by widening the type up front: annotate an interface with an index signature, or declare the property as optional.

```ts
const user = { name: "a" };
user.age = 1; // Error: 'age' does not exist on '{ name: string }'
```

- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 6cae9456-f9ac-4b5d-8d22-09d26f79b18b

- What is the difference between `as const satisfies T` and plain `satisfies T`?

### Answer

- `satisfies T` validates the value against `T` but keeps normal mutability and widening behavior for unannotated parts.
- `as const satisfies T` also validates, and additionally freezes the type at literal/readonly level.
- Validation order in the text (`as const` first) determines that inference checks against `T` after the const assertion.

```ts
const a = { mode: "dev" } satisfies { mode: string };      // { mode: string }
const b = { mode: "dev" } as const satisfies { mode: string }; // { readonly mode: "dev" }
```

- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
