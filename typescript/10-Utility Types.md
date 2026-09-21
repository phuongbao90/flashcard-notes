# TypeScript Utility Types

### Question 8e505d73-8584-461a-b9e3-b07cbeaa58b4

- What are TypeScript's built-in utility types, mechanically speaking?

### Answer

- They are **predefined mapped/conditional types** shipped in `lib.es5.d.ts` and later libs, exported from the global scope.
- They transform an existing type into a new one without runtime output.
- Most are one-liners built from mapped types, `keyof`, and conditional types — which is why you can write your own equivalents.

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type Partial<T> = { [P in keyof T]?: T[P] };
```

- [More detail on Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

---

### Question 69058003-c147-498d-90b9-cb4bbb89568d

- What does `Partial<T>` do, and what does it not do?

### Answer

- Makes every property optional (`?`), so any subset of the shape is assignable.
- It is **shallow**: nested objects keep their required members.
- With `exactOptionalPropertyTypes`, previously required props become optional and cannot be explicitly set to `undefined` unless their type already includes it.

```ts
interface User { name: string; address: { city: string } }
const p: Partial<User> = { name: "a" };     // OK
const q: Partial<User> = { address: {} };   // Error: city missing
```

- [More detail on Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)
- [More detail on exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)

---

### Question 8993dc93-1654-49af-9aba-fce773c0b131

- How do you make a `Partial<T>` deep?

### Answer

- There is no built-in deep partial; write a recursive mapped type that recurses into object properties and arrays.
- Stop recursion on primitives, functions, dates, and class instances (they should not be reconstructed as plain objects).
- Deep utilities are expensive for large types; keep them to a small number of hot spots.

```ts
type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
```

- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [More detail on recursive types](https://www.typescriptlang.org/play)

---

### Question e0d04a31-2b3b-4184-b63b-35faa2c6a4ed

- What is the difference between `Required<T>` and removing `?` manually?

### Answer

- `Required<T>` removes optionality with the mapped modifier `-?`, but does **not** remove `undefined` from the property type if it was written explicitly.
- Manual rewriting loses generality and drifts when the source type changes.
- Pair it with `Partial` in round-trips: `Required<Partial<T>>` restores required props unless the union included `undefined`.

```ts
interface A { x?: string }
type R = Required<A>; // { x: string }

interface B { x?: string | undefined }
type R2 = Required<B>; // { x: string | undefined } — undefined stays
```

- [More detail on Required](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)
- [More detail on optional properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)

---

### Question 5e04b125-112d-4158-9f02-414c92ab41e9

- What does `Readonly<T>` protect against, and what does it not?

### Answer

- It marks all properties `readonly` (shallow) so reassignment and `delete` are compile errors.
- It does not freeze values, does not deep-freeze nested objects, and has no runtime effect.
- For arrays use `readonly T[]`/`ReadonlyArray<T>`; `Readonly<string[]>` only removes the array's own writable methods on the index signature, so prefer the array syntax.

```ts
const cfg: Readonly<{ mode: string }> = { mode: "a" };
cfg.mode = "b"; // Error (compile time only)
```

- [More detail on Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)
- [More detail on readonly arrays](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)

---

### Question 10bcca7e-dfa5-4b7b-8485-6df5d1473b55

- What does `Pick<T, K>` require, and what is its common use?

### Answer

- `K` must be assignable to `keyof T` (`Pick<T, K extends keyof T>`), so typos **are** caught.
- It builds a new object type containing only the named properties.
- Common use: create a DTO/view model or a narrowed props type from a domain type.

```ts
interface User { id: string; name: string; email: string }
type UserPreview = Pick<User, "id" | "name">;
```

- [More detail on Pick](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)
- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

---

### Question 270b3684-69ce-4cce-b3ef-262175a9a2f8

- Why does `Omit<T, K>` not catch typos in `K`, and how do you make it safe?

### Answer

- Its signature is `Omit<T, K extends keyof any>`, so `K` can be any key-like string — a misspelled key silently omits nothing.
- It is implemented as `Pick<T, Exclude<keyof T, K>>`, so unknown keys are simply ignored.
- Build a checked wrapper when safety matters:

```ts
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
type A = StrictOmit<User, "emial">; // Error at this alias
```

- [More detail on Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- [More detail on Pick](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)

---

### Question 64a3b1da-dc9a-4003-a4d7-c5b1505a8105

- Why is `Omit` dangerous on a union type?

### Answer

- `Omit<A | B, "id">` is not distributive: `keyof (A | B)` is the intersection of keys, so properties unique to one member can be lost or preserved incorrectly.
- The result is a single object type rather than a union of the transformed members.
- Distribute manually:

```ts
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
```

- [More detail on Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- [More detail on distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

---

### Question f3e43834-c345-4ec1-9a07-2d361fff1c67

- What is `Record<K, T>` and when is it better than an index signature?

### Answer

- `Record<K, T>` is a mapped type over the key union `K`: `{ [P in K]: T }`.
- With a literal/union key set it produces **exact keys**, unlike `[k: string]: T` which allows any key.
- Use `Record<string, T>` only for genuinely open maps; otherwise `Record<"a" | "b", T>` gives real checking.

```ts
type Scores = Record<"math" | "art", number>;
const s: Scores = { math: 1, art: 2 };
s.science = 3; // Error: index signature missing / key not known
```

- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)

---

### Question 616ea8fd-89d2-4c3a-b814-d81cae08c2f9

- What does `ReturnType<F>` give, and what are its limits?

### Answer

- It extracts the return type of a function type: `ReturnType<() => string>` is `string`.
- For **overloaded** functions it returns the type of the **last** overload signature (verified: it does not produce an overloaded result).
- For generic functions it returns the type with generic parameters instantiated to `unknown` (or their constraints), which is often useless; use explicit type arguments on the function type instead.

```ts
function parse(s: string): number;
function parse(n: number): string;
function parse(x: string | number) { return x; }
type R = ReturnType<typeof parse>; // string (last overload)
```

- [More detail on ReturnType](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype)
- [More detail on function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question e7481424-5728-46cf-9526-d8682433e292

- What does `Parameters<F>` preserve that a `unknown[]` annotation does not?

### Answer

- It preserves **arity and per-position types**, including optional and rest markers.
- A rest parameter becomes a trailing rest element: `(a: string, ...rest: number[])` → `[a: string, ...rest: number[]]`.
- That tuple can be spread straight back into the function, which `unknown[]` cannot.

```ts
type P = Parameters<(a: string, b?: number) => void>; // [a: string, b?: number]
```

- [More detail on Parameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype)
- [More detail on variadic tuples](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)

---

### Question 3915d2db-36a5-4b88-9897-7b1410175e0f

- How do `Exclude` and `Extract` differ, and over what do they operate?

### Answer

- `Exclude<T, U>` removes from `T` every member assignable to `U`; `Extract<T, U>` keeps only those members.
- They operate over **union members** and use assignability, not equality — so structural matches count.
- `Extract<"a" | 1 | true, string>` is `"a"`, because `1` and `true` are not assignable to `string`.

```ts
type T = Exclude<"a" | "b" | "c", "a">;            // "b" | "c"
type E = Extract<string | number | (() => void), Function>; // () => void
```

- [More detail on Exclude](https://www.typescriptlang.org/docs/handbook/utility-types.html#excludetype-excludedunion)
- [More detail on Extract](https://www.typescriptlang.org/docs/handbook/utility-types.html#extracttype-union)

---

### Question 656ab0f0-2460-4a52-b1c0-95dba19f892b

- What does `NonNullable<T>` remove, and how is it implemented?

### Answer

- It removes `null` and `undefined` from a union: `NonNullable<string | null>` is `string`.
- Implementation is `Exclude<T, null | undefined>`, so it only works on unions; for `T = any` it yields `any`.
- Handy with `noUncheckedIndexedAccess` and optional DOM lookups.

```ts
const el = document.querySelector("input");
type El = NonNullable<typeof el>; // HTMLInputElement
```

- [More detail on NonNullable](https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype)
- [More detail on Exclude](https://www.typescriptlang.org/docs/handbook/utility-types.html#excludetype-excludedunion)

---

### Question 4abd86e2-28e5-4ac6-84ac-1dc666bd5892

- What is `Awaited<T>` and why was it added?

### Answer

- It recursively unwraps promises: `Awaited<Promise<Promise<string>>>` is `string`.
- It also unwraps `PromiseLike` and thenables, matching `await` semantics.
- It is the standard companion to `ReturnType` for async functions: `Awaited<ReturnType<typeof load>>`.

```ts
async function load(): Promise<{ id: string }> { return { id: "1" }; }
type Loaded = Awaited<ReturnType<typeof load>>; // { id: string }
```

- [More detail on Awaited](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype)
- [More detail on async functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html#async-functions)

---

### Question 63ddb7dc-3834-4c4c-ac9c-490bf16b1276

- What do `Uppercase`, `Lowercase`, `Capitalize`, and `Uncapitalize` require to work?

### Answer

- They are **intrinsic string manipulation types**: the compiler performs case transformation at the type level.
- They only work on string literal types (often derived via template literal types); on plain `string` they return `string`.
- Used to build event-handler or CSS-property style API types.

```ts
type Getter<T extends string> = `get${Capitalize<T>}`;
type G = Getter<"name">; // "getName"
type Upper = Uppercase<"abc">; // "ABC"
```

- [More detail on Intrinsic String Manipulation Types](https://www.typescriptlang.org/docs/handbook/utility-types.html#intrinsic-string-manipulation-types)
- [More detail on template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

---

### Question 1e8ae98b-abae-4e15-b1ab-e86d541df40f

- What are `ThisParameterType` and `OmitThisParameter` for?

### Answer

- `ThisParameterType<F>` extracts a function's `this` type (or `unknown`).
- `OmitThisParameter<F>` returns the same signature with the `this` parameter removed.
- They are mainly used when writing higher-order helpers that forward `this` correctly.

```ts
function f(this: Window, x: number) {}
type T = ThisParameterType<typeof f>; // Window
type NoThis = OmitThisParameter<typeof f>; // (x: number) => void
```

- [More detail on ThisParameterType](https://www.typescriptlang.org/docs/handbook/utility-types.html#thisparametertypetype)
- [More detail on OmitThisParameter](https://www.typescriptlang.org/docs/handbook/utility-types.html#omitthisparametertype)

---

### Question c7a1e846-69bf-463b-80c5-49712df32fc6

- How do you get the instance type of a class from its constructor?

### Answer

- `InstanceType<typeof MyClass>` gives the instance type; `ConstructorParameters<typeof MyClass>` gives its constructor parameter tuple.
- `ConstructorParameters` works only if the constructor type is compatible with `abstract new (...args: any) => any`.
- These are useful when passing classes around (DI, factories) without hardcoding the instance type.

```ts
class User { constructor(public name: string) {} }
type U = InstanceType<typeof User>;              // User
type P = ConstructorParameters<typeof User>;     // [name: string]
```

- [More detail on InstanceType](https://www.typescriptlang.org/docs/handbook/utility-types.html#instancetypetype)
- [More detail on ConstructorParameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#constructorparameterstype)

---

### Question 91dde68a-665e-4e0f-a052-9d49c41f9ed4

- What does `NoInfer<T>` do and when was it added?

### Answer

- It blocks inference from a position, so a type parameter's value is decided by other arguments only.
- Added in TypeScript 5.4; useful for APIs where a fallback/default argument must not widen the inferred generic.
- Replaces the older `[T][T extends any ? 0 : never]` hack.

```ts
function pick<T>(items: T[], fallback: NoInfer<T>): T { return items[0] ?? fallback; }
pick([1, 2], 3); // T = number, not 1 | 2 | 3
```

- [More detail on NoInfer](https://www.typescriptlang.org/docs/handbook/utility-types.html#noinfertype)
- [More detail on TS 5.4 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html)

---

### Question 3fdb03be-1ce9-49e1-b0c2-c77cf665f7f9

- How do you read a utility type composition like `Readonly<Partial<Pick<T, K>>>` without getting lost?

### Answer

- Read inside-out: first restrict keys (`Pick`), then make optional (`Partial`), then freeze (`Readonly`).
- Mapped types apply left-to-right as nesting; each wraps the previous result.
- Name intermediate aliases in real code — deep nested utilities in signatures are unmaintainable.

```ts
type Preview = Readonly<Partial<Pick<User, "id" | "name">>>;
```

- [More detail on Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

---

### Question 8a9d39fc-32f0-4918-8e44-ab33b82db634

- What does `Partial<T>` do at the type level — which mapped-type syntax performs it?

### Answer

- It adds the optional modifier `?` to every key: `{ [P in keyof T]?: T[P] }`.
- `Required` uses `-?` to remove it; `Readonly` adds `readonly`; a `-readonly` modifier removes it.
- Homomorphic mapped types (`[K in keyof T]`) preserve modifiers and array/tuple structure of the source.

```ts
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
```

- [More detail on mapped type modifiers](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers)
- [More detail on Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)

---

### Question 62936fd2-e0ca-4973-bc2c-f44aeb624102

- Why does `Readonly<Partial<T>>` not make a function's parameters readonly?

### Answer

- It freezes the **object's properties**: a readonly function-valued property cannot be reassigned, but the function's signature is unchanged.
- Parameter mutability is not part of a function type in TS (there is no readonly parameter type).
- `readonly T[]` on the parameter type is what communicates "do not mutate this array".

- [More detail on Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)
- [More detail on readonly arrays](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)

---

### Question 7415ac92-41b5-4ff7-8616-5e4f12c82a74

- How do utility types interact with `keyof typeof` when deriving from a runtime object?

### Answer

- `keyof typeof obj` yields the literal key union; utilities then operate on the same runtime-derived type.
- `Pick<typeof obj, K>` and `Record<K, ...>` keep the code and its source of truth in sync.
- Add `as const`/`satisfies` so keys and values stay literal.

```ts
const fieldSpecs = { id: "string", age: "number" } as const;
type Field = keyof typeof fieldSpecs;
type Specs = Readonly<typeof fieldSpecs>;
```

- [More detail on keyof typeof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

---

### Question 86f60bce-dac7-485c-a28a-c89f05bdc5ee

- When is `Record<string, T>` the wrong choice for a dictionary?

### Answer

- When the key set is actually finite — then the record accepts typos and misses exhaustive checking.
- When values have heterogeneous shapes — a `Record` forces one value type; use a discriminated union or a mapped type with per-key values.
- Also wrong when keys must be `symbol` or `number` only.

```ts
type Bad = Record<string, string>;
type Good = Record<"home" | "about", string>;
```

- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)

---

### Question 11c1ff8b-6234-4915-8104-d3a5dbf9bb3f

- How do you write your own `Nullable<T>`-style utility and when is it worth it?

### Answer

- A union alias `type Nullable<T> = T | null` covers most needs and reads better at call sites.
- Utilities are worth writing when they transform **structure** (mapped/conditional), not for one-off unions.
- Any custom utility should be exported once with tests/examples, not re-declared per file.

```ts
type Nullable<T> = T | null;
type MaybeAsync<T> = T | Promise<T>;
```

- [More detail on generic type aliases](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-types)
- [More detail on utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

### Question 096b3e44-10e3-44c0-bb65-be8160e26f6a

- Why is `Partial<T>` a common source of undefined-at-runtime bugs in API bodies?

### Answer

- Making every property optional means the compiler accepts `{}` and partial payloads; validation of required fields is no longer enforced by types.
- The server still requires some fields, so the mismatch surfaces as a 400 at runtime.
- Use separate types for **create** (required) and **patch** (all optional) instead of one `Partial` type.

```ts
type CreateUser = { name: string; email: string };
type PatchUser = Partial<CreateUser>;
```

- [More detail on Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)
- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

---

### Question acc9221c-f0f0-487a-a488-aa30d8db36c2

- What is the cost of heavy utility-type composition on compile time?

### Answer

- Conditional and mapped types are evaluated per instantiation; deep recursion over large unions/objects multiplies work.
- `d.ts` output can balloon when the compiler expands the type instead of keeping the alias.
- Mitigate by naming intermediate aliases, avoiding recursive utilities on huge schemas, and checking with `tsc --extendedDiagnostics`.

- [More detail on performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

---

### Question e10dac82-e64c-437f-8811-2a58fb3708f0

- How do `Required`, `Partial`, and `Pick` combine to validate configuration with defaults?

### Answer

- Accept `Partial<Config>` on input, apply defaults, and expose `Required<Config>` onward.
- The conversion function has one place where defaults are applied, and callers downstream never check for missing fields.
- This is the standard "parse, don't validate" shape for config objects.

```ts
interface Config { port: number; host: string }
function load(input: Partial<Config>): Required<Config> {
  return { port: 3000, host: "localhost", ...input };
}
```

- [More detail on Required](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)
- [More detail on Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)

---

### Question 1f928534-4df0-4cad-9c61-c477d30571a4

- How do you require a subset of properties on an otherwise-optional type?

### Answer

- Compose `Required<Pick<T, K>> & Partial<Omit<T, K>>`, or simply `Required<Pick<T, K>>` when only the subset matters.
- This is the standard "at least these fields" shape for API calls that need a few required fields plus optional extras.
- Order matters for reading: pick the keys first, then remove optionality.

```ts
interface User { id: string; name: string; email?: string }
type Contactable = Required<Pick<User, "id" | "email">>;
```

- [More detail on Required](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)
- [More detail on Pick](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)

---

### Question 71e1604f-5f86-4c07-810b-20f01ce3eddf

- Do mapped utility types distribute over unions?

### Answer

- **Homomorphic** mapped types do: `Partial<A | B>` becomes `Partial<A> | Partial<B>` (verified with `{ a: 1 }` and `{ b: 1 }` both accepted).
- Non-homomorphic maps (`{ [K in "a" | "b"]: ... }`) operate on the key union directly and do not preserve union structure.
- `Record`-style maps and `Omit` over unions are the usual places where this matters.

```ts
interface A { a: number } interface B { b: number }
type P = Partial<A | B>; // { a?: number } | { b?: number }
```

- [More detail on homomorphic mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [More detail on distributive types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

---

### Question 1bb10bcd-d585-4781-8291-34a379909bc6

- How do you type a lookup table where each key maps to a **different** value type?

### Answer

- Use a mapped type over the key union with an indexed access on the source type: `{ [K in keyof M]: (payload: M[K]) => void }`.
- `Record<Key, T>` forces one value type and loses the per-key relationship.
- This pattern is how typed emitters, action registries, and message handlers are built.

```ts
interface Events { login: { userId: string }; error: { message: string; code: number } }
type Handlers = { [K in keyof Events]: (payload: Events[K]) => void };
```

- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
