# TypeScript Advanced Types

### Question cfc5e6cb-8f3f-4d7f-8c85-42d719d718a5

- What are the four main narrowing tools TypeScript supports, and what does each check?

### Answer

- `typeof x === "string"` — primitive kind, evaluated by the compiler.
- `x instanceof C` — prototype chain, runtime-checked.
- `"k" in x` — property existence, runtime-checked.
- User-defined type predicates (`x is T`) — provided by your own function, **trusted unchecked**.

```ts
function isString(x: unknown): x is string { return typeof x === "string"; }
```

- [More detail on Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

### Question c66f34e1-5dbb-4c8d-a7ae-c995575398ed

- Why is a user-defined type predicate unsound by construction?

### Answer

- The compiler accepts the `x is T` claim without verifying the function body — the boolean result and the claim are decoupled.
- A wrong body (`return true` regardless of input) silently narrows incorrectly at every call site.
- Mitigation: validate as strictly as the type promises (e.g. use a schema parser whose output type is derived from the schema).

```ts
function isUser(x: unknown): x is User { return true; } // compiles, catastrophically wrong
```

- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question 72633942-5e5b-4bde-a955-6c2cacabcab8

- How does the `in` operator narrow a union?

### Answer

- For `A | B`, `"k" in x` narrows to the members that declare `k` (or have an index signature that could contain it).
- It works with optional members too, because existence at runtime is what it checks.
- It also narrows to types with private `#field` declarations when checking `#field in x`.

```ts
type A = { a: number }; type B = { b: string };
declare const x: A | B;
if ("b" in x) x.b.toUpperCase();
```

- [More detail on in narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-in-operator-narrowing)
- [More detail on private fields and in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question 6838454b-e6c6-45c1-b2b3-497140cbf6d4

- What is `keyof` and what does it produce for unions and intersections?

### Answer

- `keyof T` is the union of `T`'s property keys (strings, numbers, and symbols).
- Verified identities: `keyof (A & B)` is the **union** of keys; `keyof (A | B)` is the **intersection** of keys (only keys safe on every member).
- For index signatures it widens: `keyof { [k: string]: T }` is `string | number`.

```ts
interface A { a: number; shared: 1 } interface B { b: number; shared: 2 }
type KAnd = keyof (A & B); // "a" | "b" | "shared"
type KOr = keyof (A | B);  // "shared"
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question b99c0134-6294-49c2-b346-7c1c5a5fa058

- What does `T[K]` (indexed access) do, and what happens with a union key?

### Answer

- `T[K]` is the type of property `K` on `T`, where `K extends keyof T`.
- With a union key, the result is a **union of the corresponding property types**.
- With `keyof T` itself, it yields everything: `T[keyof T]` is the union of all property types.

```ts
type User = { id: string; age: number };
type Values = User[keyof User]; // string | number
```

- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

---

### Question 5498d882-def9-4b21-afb6-1d753e85c27e

- What is a conditional type, and what does it return for a union input?

### Answer

- Syntax: `T extends U ? X : Y` — a type-level conditional.
- When `T` is a **naked type parameter**, the type **distributes** over union members: each member is tested separately and results are unioned.
- That distribution is the basis of `Exclude`, `Extract`, and most utility types.

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type R = ToArray<string | number>; // string[] | number[]
```

- [More detail on Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

---

### Question 6787f9f9-d4ca-4e60-940b-8de4d9d7c25d

- How do you stop a conditional type from distributing?

### Answer

- Wrap both sides in tuple types: `[T] extends [U] ? X : Y` — `T` is no longer a naked parameter.
- Common when checking "is this whole union assignable", not "is each member assignable".
- Other wrapping forms (`{ t: T } extends { t: U }`) also block distribution.

```ts
type IsString<T> = [T] extends [string] ? true : false;
type A = IsString<string | number>; // false (no distribution)
```

- [More detail on distributing unions](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)
- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

---

### Question 24641c18-0cde-4ff0-9394-18b8906703bb

- What does `infer` do, and where can it appear?

### Answer

- `infer X` introduces a type variable inside a conditional type's `extends` clause to **extract** a part of the checked type.
- Location matters: `infer X` in a function return position extracts the return type, in an array position the element type, in a template literal a substring pattern.
- Since TS 4.7 you can constrain it: `infer X extends string`.

```ts
type Element<T> = T extends (infer U)[] ? U : never;
type R = Element<string[]>; // string
```

- [More detail on infer](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)
- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

---

### Question 7a167411-651a-40d0-99ff-f0355b49c742

- How does `infer` extraction work for function types?

### Answer

- `T extends (...args: infer A) => infer R` captures the parameter tuple and return type.
- Rest/optional markers are preserved in `A`, which is why `Parameters<T>` can be spread.
- You can also use `infer` with `this`: `(this: infer T, ...) => any`.

```ts
type Ret<T> = T extends (...a: any[]) => infer R ? R : never;
type P<T> = T extends (...a: infer A) => any ? A : never;
```

- [More detail on inferring within conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)
- [More detail on Parameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype)

---

### Question c0c89e6f-45ea-4eaa-9883-e10fc50383f9

- What is a mapped type and what makes it homomorphic?

### Answer

- A mapped type iterates keys: `{ [K in keyof T]: ... }`.
- When the source is `keyof T` directly, it is **homomorphic** and preserves optional/readonly modifiers, plus array/tuple structure.
- Non-homomorphic maps (`[K in "a" | "b"]`) create fresh objects and lose modifiers.

```ts
type Optional<T> = { [K in keyof T]?: T[K] };
type Flags = { [K in "a" | "b"]: boolean };
```

- [More detail on Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [More detail on mapped type modifiers](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers)

---

### Question a7fa1cf1-4929-456e-ae0e-0dc9d7af3ca0

- How do you rename properties in a mapped type?

### Answer

- Use the `as` clause with a template literal or conditional expression: `[K in keyof T as `get${Capitalize<K & string>}`]: () => T[K]`.
- Returning `never` from the `as` expression **removes** that key, which is how you filter properties.
- Key remapping is the standard way to build getters, event names, and scoped identifiers.

```ts
type Getters<T> = { [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K] };
```

- [More detail on Key Remapping](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)
- [More detail on template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

---

### Question 22cd08e4-d66c-4f89-82d5-312bd6967ff4

- What are template literal types and how do they combine unions?

### Answer

- A type built from string literal patterns: `` `user-${string}` ``.
- When a placeholder is a union, the result is the union of all combinations — with a cap (~100k) to avoid explosion.
- They support the intrinsic case-transformers and can parse strings via `infer` in conditional types.

```ts
type Size = "sm" | "md";
type ClassName = `text-${Size}`; // "text-sm" | "text-md"
```

- [More detail on Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [More detail on intrinsic string types](https://www.typescriptlang.org/docs/handbook/utility-types.html#intrinsic-string-manipulation-types)

---

### Question e75d6973-a59a-4881-8666-a10b6de9d0c5

- How do you parse a route string into parameter types with template literals?

### Answer

- Extract segments with `infer` inside a template literal conditional type, then map over the parameter names.
- Turn each `:name` into a property of the resulting object type.
- Recursion is used to handle multiple segments, and TS caps the instantiation depth.

```ts
type Params<S extends string> =
  S extends `${string}:${infer P}/${infer Rest}`
    ? { [K in P | keyof Params<Rest>]: string }
    : S extends `${string}:${infer P}` ? { [K in P]: string } : {};
type P = Params<"/users/:id/posts/:postId">; // { id: string; postId: string }
```

- [More detail on template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [More detail on inferred template literal types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html#improved-inference-for-infer-types-in-template-string-types)

---

### Question 0b33f07d-7975-4b7f-b42a-f931db2ce897

- What is a recursive type and what is the compiler limit?

### Answer

- A type that refers to itself through an object/array/function member; used for trees, JSON, and deep mapped types.
- TS reports "Type instantiation is excessively deep and possibly infinite" when expansion exceeds the recursion depth limit (around 50 nested instantiations for most cases).
- TS 4.5 added tail-recursion elimination for simple recursive conditional types, allowing up to ~1000 iterations in that shape.

```ts
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
```

- [More detail on recursive types](https://www.typescriptlang.org/play)
- [More detail on tail-recursion elimination](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#tail-recursion-elimination-on-conditional-types)

---

### Question 2e57d864-8a0c-40b7-a1fa-e1b36fddaa41

- What does `satisfies` do differently from `as`?

### Answer

- `satisfies` **checks** the expression against a type and keeps the expression's inferred type; it can never change the type to something false.
- `as` **overrides** the inferred type and is unchecked beyond overlap.
- `satisfies` is the safe tool for validating config objects and lookup maps.

```ts
const config = { mode: "dev" } satisfies { mode: "dev" | "prod" };
config.mode; // "dev" literal preserved
const bad = { mode: "x" } as { mode: "dev" }; // compiles, lies
```

- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [More detail on type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)

---

### Question 404896b8-9b7b-48af-ae1b-212c905a8d51

- How do you build a type-level "getter map" from an object type and keep it in sync?

### Answer

- Mapped type + template literal key remapping generates `getX` methods from `X` properties.
- Using `satisfies` against the generated type ensures the implementation covers every key.
- Excluding non-getter-able keys (functions, symbols) via a filtered `as` clause keeps the API clean.

```ts
type Getters<T> = { [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K] };
const impl = { getName: () => "a" } satisfies Getters<{ name: string }>; // missing keys error
```

- [More detail on key remapping](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)
- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)

---

### Question facf7ca3-b014-4186-b41f-98808b10bb7a

- What is a union-to-intersection conversion and where is it used?

### Answer

- A conditional type that distributes over a union while inferring a function's parameter, then extracts the combined parameter — effectively intersecting members.
- Common in libraries that merge option objects or combine event maps.
- It relies on contravariant inference from function parameters.

```ts
type UnionToIntersection<U> =
  (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;
type R = UnionToIntersection<{ a: 1 } | { b: 2 }>; // { a: 1 } & { b: 2 }
```

- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on function variance](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-function-types)

---

### Question 3efc8d3c-085b-4fab-ab74-ed3be9a9e22c

- How do you make a type-safe event emitter with mapped tuple types?

### Answer

- Define an event map type `{ event: [args...] }`, then use a generic `emit<K extends keyof Events>(name: K, ...args: Events[K])`.
- Listeners are stored per key and typed with `Events[K]`, so payload mistakes are caught at both ends.
- This avoids `any[]` handlers and keeps autocompletion per event.

```ts
interface Events { login: [user: User]; error: [message: string, code: number] }
function emit<K extends keyof Events>(name: K, ...args: Events[K]) {}
emit("error", "boom", 500);
```

- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [More detail on variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)

---

### Question c9241643-b459-4fa6-9ace-32c6f074fedb

- What is an assertion function and what does it require?

### Answer

- A function with the return annotation `asserts x is T` narrows after the call; the body must throw on mismatch.
- It must be declared with an explicit type annotation (arrow functions need a variable annotated with the assertion signature).
- The asserted parameter must be the whole parameter — you cannot assert on `obj.prop`.

```ts
function assertDefined<T>(x: T): asserts x is NonNullable<T> {
  if (x == null) throw new Error("missing");
}
```

- [More detail on assertion functions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions)
- [More detail on NonNullable](https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype)

---

### Question bf11f4a5-15f7-417c-a622-8d72f7bad78e

- How does `typeof` differ between value position and type position?

### Answer

- Value position: the JS operator returning a string (`typeof x === "string"`), narrows types.
- Type position: a **type query** that yields the type of a value (`type T = typeof x`).
- `typeof import("./mod")` fetches a module's namespace type without importing it at runtime.

```ts
const cfg = { retries: 1 };
type Cfg = typeof cfg;          // { retries: number }
type Mod = typeof import("./m"); // module namespace type
```

- [More detail on typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
- [More detail on typeof narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#typeof-type-guards)

---

### Question ecb51458-09b5-4aec-978a-aa9772df68ea

- Why do conditional types sometimes produce `never` where you expected a type?

### Answer

- A distributive conditional whose `never` members are filtered: `never extends X ? Y : Z` yields `never` for that member.
- This is intentional in `Exclude`-style utilities, but surprising when a generic instantiation collapses to `never`.
- Debug by instantiating the utility with concrete types in the playground or by using type-level assertions.

```ts
type OnlyStrings<T> = T extends string ? T : never;
type R = OnlyStrings<1 | "a">; // "a"
```

- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)

---

### Question 8059b1c3-3645-4f09-9c18-fabac6579dd3

- When should you reach for advanced types instead of runtime validation?

### Answer

- Advanced types model **your code's relationships**; they cannot validate data from networks, storage, or user input.
- Importing a `unknown` JSON payload and casting to a complex conditional type produces zero runtime safety.
- The standard split: schema-validate at the boundary (Zod, Valibot, manual guards), then use advanced types internally.

```ts
const parsed = Schema.safeParse(payload); // runtime truth
// then the compile-time type comes from the schema, not an assertion
```

- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question b4b7888e-1093-40a6-b5e9-63c8178c24db

- What is the difference between `keyof typeof obj` and `typeof obj[keyof typeof obj]`?

### Answer

- The first yields the **keys** (`"a" | "b"`); the second yields the **values** as a union.
- Both are derived from the value's type and keep literals when the object is `as const`.
- Together they replace hand-maintained enums with a single source of truth.

```ts
const routes = { home: "/", user: "/u" } as const;
type Keys = keyof typeof routes;                 // "home" | "user"
type Values = (typeof routes)[Keys];             // "/" | "/u"
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question 18d16f8e-6181-48fe-8aeb-9cba190822e8

- What is a type-level assertion helper and why write one?

### Answer

- A tiny helper that compiles only if two types are mutually assignable (`type Assert<A, B> = A extends B ? true : never`), used in tests or a `tests/types.ts` file.
- Catches accidental type changes in CI without a full test suite entry.
- Keep it out of production bundles by keeping it in a type-only test file.

```ts
type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type _ = Expect<Equal<ReturnType<() => string>, string>>;
```

- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on typeof in type position](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

---

### Question e476bdc3-f64d-4d93-8d3c-8b6726c83320

- How do mapped types handle arrays and tuples?

### Answer

- A homomorphic mapped type over an array/tuple type **preserves** the container shape: mapping `T[]` yields `U[]`, mapping `[A, B]` yields `[UA, UB]`.
- This is how `Partial<[a, b]>` stays a tuple while making elements optional.
- Non-homomorphic maps over `number` index types degrade to objects/arrays of unions, not tuples.

```ts
type Wrapped<T> = { [K in keyof T]: T[K][] };
type R = Wrapped<[string, number]>; // [string[], number[]]
```

- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 17daafd3-5fc2-40fc-9524-cd8d194ccc49

- What does `readonly` mean on a mapped type output, and how do you remove it?

### Answer

- `readonly [K in keyof T]` (or `+readonly`) adds the modifier; `-readonly` removes it.
- Modifiers can be added/removed independently for `readonly` and `?`.
- This is how `Mutable<T>`/`Immutable<T>` utilities are written.

```ts
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Concrete<T> = { [K in keyof T]-?: T[K] };
```

- [More detail on mapping modifiers](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers)
- [More detail on readonly](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)

---

### Question eed1fffc-1018-477c-995a-57094e7398ef

- How do conditional types enable function overloads to have precise return types?

### Answer

- Instead of overloads, write one generic signature whose return is a conditional on the argument type or on a literal type parameter.
- This keeps one implementation and gives callers exact results, but error messages can be harder to read.
- Overloads are still preferred when the input/output mapping is irregular or large.

```ts
function make<K extends "list" | "get">(k: K): K extends "list" ? string[] : string {
  throw new Error();
}
```

- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question 32553ea0-0859-45a0-bb25-ec287d7b0279

- What does the `as const` + `satisfies` combination achieve for exhaustive maps?

### Answer

- `as const` preserves literal keys/values; `satisfies` checks the map contains every key of a required union.
- Together they give a compile-time completeness check plus precise literal types for downstream derivation.
- Adding a case to the union breaks the map until updated — the standard exhaustive-registry pattern.

```ts
type Status = "ok" | "error";
const messages = { ok: "fine", error: "bad" } as const satisfies Record<Status, string>;
```

- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

---

### Question 41b51f6b-b8e5-426b-8ff4-7eb7c43fb558

- What is the difference between a type guard returning `x is T` and a parser returning `T`?

### Answer

- A guard answers "is this already that type" and must not transform the value.
- A parser/decoder transforms unknown input into a validated value (`parse(x): Result<T, Error>`), carrying failure information.
- Guards are fine for narrowing existing unions; parsers are required for boundaries where failure is possible.

```ts
function isCat(x: Pet): x is Cat { return x.kind === "cat"; }        // guard
function decodeCat(raw: unknown): Cat { /* validate + construct */ } // parser
```

- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question 657cbe15-b605-4ab3-bc2d-b5b5f7de2cb8

- How do you detect at the type level whether a type has a required property?

### Answer

- Conditional check: `undefined extends T[K] ? false : true` combined with a key check (optional properties include `undefined`).
- Keep helpers small and single-purpose; deep type introspection gets unreadable fast.
- Verify helpers with type-level assertions rather than trusting the definition.

```ts
type IsRequired<T, K extends keyof T> = undefined extends T[K] ? false : true;
type R = IsRequired<{ a?: string; b: string }, "b">; // true
```

- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on optional properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)

---

### Question 13b7966b-a9c0-49b4-a89a-7adf21f6d91a

- What does `abstract new (...args) => T` (an abstract constructor type) enable in advanced types?

### Answer

- It accepts both concrete and abstract class constructors, which is required when writing factories/mixins that may build on abstract bases.
- `InstanceType` and `ConstructorParameters` are constrained exactly this way.
- Without `abstract`, passing an abstract class is a type error.

```ts
function instantiate<T>(Ctor: abstract new () => T, make: () => T): T { return make(); }
```

- [More detail on abstract construct signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#abstract-construct-signatures)
- [More detail on mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)

---

### Question 832eb825-f38a-43b0-92a8-630b2361a356

- Why can very clever types make a codebase worse?

### Answer

- They push reasoning from runtime to the compiler, so every error message becomes a puzzle and refactors break in obscure places.
- They slow `tsc` and editors, especially recursive conditional maps over big unions.
- Keep advanced types behind named aliases with clear names; if a type needs a comment paragraph to explain, consider a simpler model or runtime validation.

- [More detail on performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
