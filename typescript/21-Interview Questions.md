# TypeScript Interview Questions

### Question 806415d6-5396-496d-b5f3-b4c5a350aeec

- Interview: interface vs type — what is the real difference?

### Answer

- **Extensibility:** interfaces can be declaration-merged and extended by other files; type aliases are closed (duplicate names error).
- **Expressiveness:** aliases can name unions, intersections, tuples, primitives, and conditional results; interfaces can only describe object-like shapes.
- **Errors/perf:** interface extension conflicts are reported at the declaration; alias intersections often surface later. Modern TS performance is comparable for both.
- Practical rule: interface for extendable object contracts, type for everything else.

```ts
interface A { x: string }          // merges
type B = { x: string } | { y: number }; // union alias
```

- [More detail on interface vs type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [More detail on declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)

---

### Question 5411e02d-ccb5-4d93-84ef-84e2f90a3123

- Interview: what is the difference between `never` and `void`?

### Answer

- **`void`** is a return type meaning "caller must ignore the value"; functions may return anything (assignability rule) and still be typed `void`.
- **`never`** is the empty type — no values. It marks code that cannot return (throws, infinite loop) or a position that is unreachable after exhaustive narrowing.
- Assignability: `never` is assignable to everything; `void` is not assignable to much.

```ts
function log(): void {}
function fail(): never { throw new Error(); }
```

- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)
- [More detail on void](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)

---

### Question 346e7494-b9ed-474a-bd86-30968c22eda1

- Interview: unknown vs any — explain with assignability.

### Answer

- Both are top types: every type is assignable **to** them.
- `any` is assignable **from** anything and to anything (bidirectional), so it disables checking and spreads.
- `unknown` is assignable only to `unknown`/`any`, so consuming code must narrow.
- `unknown` = safe parsing boundary; `any` = escape hatch only.

```ts
let a: any = 1; let u: unknown = 1;
const s1: string = a; // allowed
const s2: string = u; // Error
```

- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [More detail on any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)

---

### Question 1234e424-11c3-4c15-9615-a4b7ba9499eb

- Interview: explain TypeScript's structural typing and its two nominal exceptions.

### Answer

- Compatibility is decided by **members**, not names: any shape with the required members is assignable.
- Exception 1: class members declared `private`/`protected` require the same declaration origin.
- Exception 2: `#private` fields behave the same and add runtime privacy. `unique symbol` brands are the manual way to force nominal types.

```ts
class A { private x = 1 } class B { private x = 1 }
const a: A = new B(); // Error: separate private declarations
```

- [More detail on type compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [More detail on private and protected members](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#private-and-protected-members)

---

### Question ab0926cc-da3a-45c4-8d13-6a3bb65eee99

- Interview: explain covariance and contravariance for functions.

### Answer

- Return types are **covariant**: a function returning a subtype is assignable where a supertype is expected.
- Parameters are **contravariant** under `strictFunctionTypes`: the callback must accept at least what callers may pass.
- Method syntax is exempt (bivariant), a deliberate unsoundness kept for ergonomics.

```ts
type Cb = (x: unknown) => void;
const bad: Cb = (x: string) => {}; // Error
const ok: Cb = (x: unknown) => {};
```

- [More detail on strictFunctionTypes](https://www.typescriptlang.org/tsconfig#strictFunctionTypes)
- [More detail on function compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-function-types)

---

### Question a4af703b-b6e0-4a2f-b5ed-171e6dc6292d

- Interview: what does "types are erased" mean for runtime code?

### Answer

- All type syntax (annotations, aliases, interfaces, generics) disappears in emitted JS — there is no runtime type information.
- Therefore no `instanceof`/reflection for interfaces, unions, or generics; runtime checks must be hand-written or schema-generated.
- Only constructs with runtime meaning survive: classes, enums, namespaces, decorators, and parameter property initializers.

```ts
function f<T>(x: T): T { return x; } // emits function f(x) { return x; }
```

- [More detail on erased types](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

---

### Question d941c3f6-2063-406d-a3ce-806bdab36f42

- Interview: walk through a conditional type and the distributive rule.

### Answer

- `T extends U ? X : Y` is evaluated per type; when `T` is a naked type parameter with a union, it **distributes**: each member is substituted and the results unioned.
- This is how `Exclude<A | B, A>` removes members.
- Prevent distribution with `[T] extends [U]` when you need whole-union semantics.

```ts
type Exclude<T, U> = T extends U ? never : T;
type R = Exclude<"a" | "b", "a">; // "b"
```

- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

---

### Question 3dd4d3ce-99e4-4c6d-90fe-9c7ff41fa8e1

- Interview: how does `infer` work? Give an example that extracts a promise value.

### Answer

- `infer X` introduces a placeholder inside the `extends` pattern; when the pattern matches, `X` is bound to the matched type.
- It can appear in return positions, array positions, template literals, and with a constraint (`infer X extends string`, TS 4.7).
- Example: unwrapping a promise's resolved type.

```ts
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type R = Unwrap<Promise<number>>; // number
```

- [More detail on inferring within conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)
- [More detail on Awaited](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype)

---

### Question 31000ad7-bbcf-4a1d-91c9-28330bfddd5a

- Interview: what is a mapped type and what makes one homomorphic?

### Answer

- A mapped type builds an object type by iterating keys: `{ [K in keyof T]: ... }`.
- It is **homomorphic** when the source is `keyof T` directly, so optional/readonly modifiers and tuple/array structure are preserved.
- `as` remapping and `-?`/`-readonly` modifiers make utilities and filters possible.

```ts
type Getters<T> = { [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K] };
```

- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [More detail on key remapping](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as)

---

### Question 7bf4a120-5160-428e-be82-ff7fc97e2561

- Interview: what do template literal types enable, and what is their practical limit?

### Answer

- They model string patterns (`\`api/${string}\``), combine literal unions into the cross product, and parse strings with `infer`.
- Use cases: route params, event names, CSS class names, dotted paths for form/state selectors.
- Limits: union combinations explode (compiler caps around 100k), recursion depth is bounded, and errors become unreadable — validate patterns at runtime too.

```ts
type Event = `on${Capitalize<"click" | "focus">}`; // "onClick" | "onFocus"
```

- [More detail on template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [More detail on intrinsic string types](https://www.typescriptlang.org/docs/handbook/utility-types.html#intrinsic-string-manipulation-types)

---

### Question bb02bd0b-aefa-48ad-a43f-0bf53b4ca62e

- Interview: generics vs `any` — what does a generic actually preserve?

### Answer

- Generics preserve the **relationship** between types across positions; `any` erases it.
- `identity<T>(x: T): T` returns exactly the input type; with `any` the return is `any`.
- Add constraints (`T extends U`) to allow operations, and defaults for convenience.

```ts
function id<T>(x: T): T { return x; }
const n = id(1); // 1
```

- [More detail on Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)

---

### Question d8628cff-b7d4-46ac-b420-ecaefd04a9b2

- Interview: how do generic constraints and defaults interact?

### Answer

- Constraints restrict what callers may pass and what operations the body may use; defaults supply a type argument when inference finds none.
- A default must satisfy its own constraint: `<T extends object = {}>` is invalid if `{}` does not extend `object` (it does — `{}` is not the empty object type but a very wide one).
- Defaults can reference earlier parameters: `<T, K extends keyof T = keyof T>`.

```ts
interface Api<T = unknown, K extends keyof T = keyof T> { data: T; keys: K[] }
```

- [More detail on generic parameter defaults](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults)
- [More detail on constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)

---

### Question 3604ae7d-b321-4709-a8b1-a5ec628d4a1e

- Interview: what do `keyof`, `typeof`, and indexed access compose into?

### Answer

- `typeof value` gets a value's type; `keyof T` gets its key union; `T[K]` gets a property type.
- Composed, they derive types from runtime constants: `keyof typeof config`, `(typeof config)[Key]`.
- Verified: `keyof (A & B)` is the union of keys; `keyof (A | B)` is the intersection.

```ts
const cfg = { a: 1, b: 2 } as const;
type K = keyof typeof cfg;        // "a" | "b"
type V = (typeof cfg)[K];         // 1 | 2
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question 5716e340-ad5f-47c4-aaaa-4533a9a33f77

- Interview: `Partial`, `Required`, `Readonly` — which are shallow and which modifiers do they set?

### Answer

- All three are shallow homomorphic mapped types: `Partial` adds `?`, `Required` removes `?`, `Readonly` adds `readonly`.
- They do not recurse into nested objects; `Required` does not strip an explicit `| undefined` from a property type.
- Deep versions must be written as recursive mapped types.

```ts
type P = Partial<{ a: { b: string } }>; // { a?: { b: string } } — nested b still required
```

- [More detail on Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [More detail on mapped type modifiers](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers)

---

### Question 177696c9-abcc-4013-b205-45d77e0c0cfb

- Interview: `Omit<T, K>` vs `Pick<T, K>` — which one can silently do nothing?

### Answer

- `Pick<T, K>` constrains `K extends keyof T`, so a bad key errors.
- `Omit<T, K>` accepts `K extends keyof any`, so an unknown key is silently ignored — no error, no removal.
- For safety, write `type StrictOmit<T, K extends keyof T> = Omit<T, K>` and use that internally.

```ts
type A = Omit<{ a: 1 }, "b">; // { a: 1 } — typo not caught
```

- [More detail on Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- [More detail on Pick](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)

---

### Question c0655ca1-58ba-48e4-bc07-39644f13a11d

- Interview: `satisfies` vs `as` vs `:` — what does each do?

### Answer

- `: T` declares the variable's type as `T` (widening to the annotation).
- `as T` overrides the type with no checking beyond overlap (can lie).
- `satisfies T` validates the expression against `T` while keeping the **inferred** (often literal) type.

```ts
const a = { k: "x" } as const satisfies Record<string, string>; // checked + literal
```

- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [More detail on type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)

---

### Question 07091b2b-31e2-4317-bfbb-a3e0ec5330bd

- Interview: enums vs literal unions — when is each the better answer?

### Answer

- Literal unions: zero runtime, work with `JSON.parse` values, derive from arrays, easy exhaustive checks — default choice.
- Enums: runtime object for iteration/reflection, reverse mapping (numeric), nominal-ish behavior, bitwise flag patterns.
- `const enum` adds inlining but breaks isolated/transpile-only toolchains; avoid in libraries.

```ts
type Role = "admin" | "user";                  // union
enum RoleE { Admin = "admin", User = "user" }  // enum
```

- [More detail on enums vs alternatives](https://www.typescriptlang.org/docs/handbook/enums.html#enums-vs-alternatives)
- [More detail on enums at runtime](https://www.typescriptlang.org/docs/handbook/enums.html#enums-at-runtime)

---

### Question c6dd165b-75a5-40ab-9c7c-64fc612340b7

- Interview: what is the difference between overloads and a union parameter?

### Answer

- Overloads give **per-signature return types** and better autocompletion for unrelated argument shapes.
- A union parameter is one signature, checked once, easier with generics, and usually clearer errors.
- With overloads, only the declared signatures are visible; the first matching one wins, so order matters.

```ts
function f(x: string): number;
function f(x: number): string;
function f(x: string | number): number | string { return x as any; }
type R = ReturnType<typeof f>; // string — the LAST overload
```

- [More detail on function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
- [More detail on overload resolution](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html#overloaded-functions)

---

### Question 49758d51-0167-46d3-a351-615a66494336

- Interview: what changed with optional properties under `exactOptionalPropertyTypes`?

### Answer

- Without it, `x?: string` accepts `{ x: undefined }` and behaves the same as `x: string | undefined`.
- With it, optional means **may be absent**, and `undefined` must be included explicitly to be assignable.
- This distinction matters for JSON serialization (key present with `undefined` is dropped) and patch semantics.

```ts
interface A { x?: string }
const a: A = { x: undefined }; // Error with exactOptionalPropertyTypes
```

- [More detail on exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
- [More detail on optional properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)

---

### Question fe9a7bd3-7948-4ef5-b21c-737ec7bbc27d

- Interview: why is TypeScript's array covariance unsound, and how do you avoid the bug?

### Answer

- `Dog[]` is assignable to `Animal[]`, so you can store an `Animal` into a `Dog[]` through the wider reference — a runtime-corrupting bug TS allows.
- Avoid by accepting `readonly Animal[]` in APIs and avoiding upcasts of mutable arrays.
- Function parameters are contravariant, which is what stops the analogous bug there.

```ts
const dogs: Dog[] = [];
const animals: Animal[] = dogs;
animals.push(new Cat()); // runtime: dogs now contains a Cat
```

- [More detail on array covariance](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [More detail on readonly arrays](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)

---

### Question a760583a-639f-4ad2-a33f-21001709a6ef

- Interview: what does `as const` do, and what does it not do?

### Answer

- It makes the type deeply `readonly` and keeps literal types (arrays become readonly tuples).
- It does **not** freeze at runtime, does not deep-clone, and does not prevent mutation of objects behind casts.
- It is the standard tool for deriving unions from runtime arrays.

```ts
const SIZES = ["sm", "md"] as const;      // readonly ["sm", "md"]
type Size = (typeof SIZES)[number];        // "sm" | "md"
```

- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [More detail on readonly tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types)

---

### Question 595c2eaa-8009-48af-92a4-d427ead5e84f

- Interview: how do you make a function preserve the caller's literal type?

### Answer

- Use a generic constrained to the literal domain or a `const` type parameter so inference does not widen.
- Widening happens for mutable storage and object literals; `const` type parameters (TS 5.0) or `as const` prevent it.
- Returning `T` rather than a widened primitive is what preserves the literal.

```ts
function key<const T extends string>(k: T): T { return k; }
const k = key("mode"); // "mode"
```

- [More detail on const type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)
- [More detail on literal inference](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question 3b62651f-7f78-430d-ae2f-b9284b1475d5

- Interview: what does `noUncheckedIndexedAccess` change, and why is it not in `strict`?

### Answer

- Array and index-signature access returns `T | undefined`, forcing a check that reflects possible holes/missing keys.
- It is excluded from `strict` because it produces a large number of errors in existing code and is opt-in.
- Tuples keep precise types for in-bounds literal indices (verified); arrays do not.

```ts
declare const xs: string[];
const s: string = xs[0];        // Error with the flag
const t: [string] = ["a"];
const a: string = t[0];          // OK — tuple index is known
```

- [More detail on noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question fcbbe679-324c-477c-9012-1d1cf7692342

- Interview: why does `arr.filter(Boolean)` not remove `undefined`?

### Answer

- `Boolean` has no type-predicate signature, so the filter overload cannot narrow the element type.
- Verified: with `strict`, `(string | undefined)[]` stays the same after `filter(Boolean)`.
- Use an explicit predicate: `filter((x): x is string => x != null)`.

```ts
const clean = xs.filter((x): x is string => x != null);
```

- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [More detail on Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)

---

### Question cdb43fb2-05fd-417e-87b2-08e58ff886c9

- Interview: what's the type of `useState(null)`, and why is it dangerous?

### Answer

- It infers `null` — the state can only ever be `null`, so `setUser(user)` is a type error.
- Annotate explicitly: `useState<User | null>(null)`.
- The same widening/annotation issue appears with empty arrays and empty objects.

```tsx
const [user, setUser] = useState<User | null>(null);
```

- [More detail on useState](https://react.dev/reference/react/useState)
- [More detail on type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 1f86b553-6ffb-44e5-be58-93063cbc21af

- Interview: how do you type React events and DOM events differently?

### Answer

- React gives synthetic events generic over the element: `React.ChangeEvent<HTMLInputElement>` with `target` already typed.
- DOM events have `target: EventTarget | null`, requiring `instanceof` narrowing.
- Mixing them (`MouseEvent` from the DOM vs `React.MouseEvent`) produces confusing property errors.

```tsx
const on: React.ChangeEventHandler<HTMLInputElement> = (e) => e.target.value;
el.addEventListener("change", (e) => { if (e.target instanceof HTMLInputElement) e.target.value; });
```

- [More detail on React event types](https://react.dev/learn/typescript#typing-dom-events)
- [More detail on event.target](https://developer.mozilla.org/en-US/docs/Web/API/Event/target)

---

### Question c473e244-cbab-4738-9680-84a897da0bb8

- Interview: how do you type an Express `Request` with params, body, and query?

### Answer

- `Request<Params, ResBody, ReqBody, ReqQuery>` — positional generics, so pass `{}` for the ones you don't use.
- `req.body` is typed by `ReqBody`, but Express does not validate it; parse before use.
- `req.query` values are broad union types, never plain `string` without normalization.

```ts
app.put("/users/:id", (req: Request<{ id: string }, {}, UpdateUser>, res: Response<User>) => { /* ... */ });
```

- [More detail on Express Request](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)
- [More detail on req.query](https://expressjs.com/en/api.html#req.query)

---

### Question ab4ac423-4f02-42e4-b5e0-bd2eb0104a99

- Interview: what is the risk of module augmentation in application code?

### Answer

- Augmentations apply process-wide and are invisible at the call site, so a property typed globally may be absent at runtime.
- Conflicting augmentations across packages produce build errors (often silenced with `skipLibCheck`).
- Prefer explicit types/parameters for app code and use augmentation for library interop only.

```ts
declare module "express-serve-static-core" { interface Request { user?: { id: string } } }
```

- [More detail on module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)

---

### Question bfe16829-008f-4c15-b8ae-7af5f34ed2df

- Interview MCQ: what is `keyof ({ a: 1 } & { b: 2 } | { c: 3 })`?

### Answer

- `&` binds tighter than `|`, so the type is `({a:1} & {b:2}) | {c:3}`.
- `keyof` over a union yields the **intersection** of the members' key unions — here `"a" | "b"` ∩ `"c"` = `never`.
- The practical lesson: parenthesize mixed unions/intersections and avoid `keyof` on unions unless intended.

```ts
type K = keyof (({ a: 1 } & { b: 2 }) | { c: 3 }); // never
type K2 = keyof ({ a: 1 } & { b: 2 });              // "a" | "b"
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on union and intersection](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)

---

### Question 1d0e2815-1992-41c1-9cdb-69b9895d0129

- Interview MCQ: `const x: [string, number] = ["a", 1]; x.push(true)` — does this compile?

### Answer

- **No.** `push` accepts only the tuple's element union (`string | number`), so `true` is rejected.
- Tuples still have array methods, so `x.push("b")` compiles even though the declared length is 2 — a known gap.
- Use `readonly [string, number]` to remove mutating methods entirely.

```ts
const x: readonly [string, number] = ["a", 1];
x.push("b"); // Error: no push on readonly tuple
```

- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)
- [More detail on readonly tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types)

---

### Question 8d89332b-b501-4310-80a5-4808e2564794

- Interview MCQ: what type does `ReturnType` give for an overloaded function?

### Answer

- The return type of the **last** overload signature (verified with a compiler probe), not a union of all returns.
- That surprises people who expect a union; use explicit overload types or a conditional generic if you need per-call returns.
- `Parameters` likewise resolves against the last signature for overloads.

```ts
function f(s: string): number;
function f(n: number): string;
function f(x: unknown) { return x }
type R = ReturnType<typeof f>; // string
```

- [More detail on ReturnType](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype)
- [More detail on overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question 4874a856-8f85-4173-ac95-7571c342faed

- Interview MCQ: does `interface User { name: string }` prevent passing `{ name: "x", age: 1 }`?

### Answer

- As a fresh **object literal**, yes — excess property checking rejects `age`.
- Through a variable of a wider inferred type, no — structural assignability allows extra properties.
- So "exact objects" are not expressible; validate at boundaries if extra keys are a real risk.

```ts
const u: User = { name: "x", age: 1 };        // Error
const extra = { name: "x", age: 1 };
const v: User = extra;                         // OK
```

- [More detail on excess property checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)
- [More detail on structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 5bd6deac-a141-4014-9fac-75d576e2aa80

- Interview: what does `strict` actually enable, and which safety flags are still left out?

### Answer

- `strict` enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`, `useUnknownInCatchVariables`.
- **Not included:** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `allowUnreachableCode` checks.
- Interviewers like this question because it reveals whether you actually configure TS.

- [More detail on strict](https://www.typescriptlang.org/tsconfig#strict)
- [More detail on noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)

---

### Question e50d7e29-1218-46c9-ba75-620ee85629ca

- Interview: how would you debug "Type instantiation is excessively deep and possibly infinite"?

### Answer

- Find the recursive conditional/mapped type and the instantiation that triggers it; large unions multiply work.
- Fixes: short-circuit with a depth counter, convert recursion to iteration where possible, narrow the input type, or memoize with an intermediate alias.
- TS 4.5 tail-recursion elimination helps only a specific recursive-conditional shape, not arbitrary recursion.

```ts
type Recurse<T, D extends number = 10> = D extends 0 ? T : Recurse<[T], Decrement<D>>;
```

- [More detail on performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [More detail on tail-recursion elimination](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#tail-recursion-elimination-on-conditional-types)

---

### Question 633744ef-1d4f-4cf9-9b5b-d76fb571ebfd

- Interview: a teammate says "we don't need runtime validation, TypeScript checks it". How do you answer?

### Answer

- Types are erased; every external value (`fetch`, `JSON.parse`, `localStorage`, env, user input) enters as `any`/asserted and is unchecked at runtime.
- A server rename, a proxy mutation, or a stale cached payload breaks typed code silently.
- The fix is one validation pass at each boundary, then rely on types inside the app.

```ts
const data: unknown = await res.json(); // typed as any without validation
const user = UserSchema.parse(data);    // runtime truth + inferred type
```

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
