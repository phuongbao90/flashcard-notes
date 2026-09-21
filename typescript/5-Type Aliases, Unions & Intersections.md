# TypeScript Type Aliases, Unions & Intersections

### Question d2fc39d5-e2a7-4ed0-bfdc-f5badca3a1d6

- What is the `type` keyword actually doing when you write `type ID = string`?

### Answer

- It creates a **name for an existing type** — any type: primitive, union, intersection, object literal, tuple, function, or generic.
- The alias is a type-space-only construct: erased at compile time, no value is created.
- Aliases are transparent: `ID` is interchangeable with `string` everywhere, including in diagnostics.

```ts
type ID = string | number;
type User = { id: ID; tags: string[] };
const a: ID = 1; // fully interchangeable with string | number
```

- [More detail on Type Aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)
- [More detail on types from types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

### Question d5cb1a56-9e23-42ba-86d1-fc339bebeb83

- Can a type alias reference itself (recursive types)?

### Answer

- Yes. Aliases may be recursive as long as the recursion sits behind an object, array, or function — the type is lazily expanded.
- Common uses: JSON values, tree nodes, linked lists, nested comment structures.
- A directly self-referencing alias (`type T = T`) is a circular reference error; recursion through a member is fine.

```ts
type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };
type TreeNode<T> = { value: T; children: TreeNode<T>[] };
```

- [More detail on recursive types](https://www.typescriptlang.org/play)
- [More detail on Type Aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)

---

### Question 5863f2b7-81cd-4255-86b9-23d591591c4b

- What does `A | B` mean in terms of values, not syntax?

### Answer

- The **union** is the set-theoretic union: a value of type `A | B` is a value that belongs to `A` or to `B` (or both).
- Assignability is "at least one": a value must be assignable to at least one member.
- Reading is the hard direction: only members common to every variant are accessible without narrowing.

```ts
type Num = number | string;
const a: Num = 1;      // OK
const b: Num = "x";    // OK
declare const c: Num;
c.toFixed();           // Error: property does not exist on string
```

- [More detail on Unions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question 6b477748-a617-410e-85e5-65431f81dd96

- What does `A & B` mean, and how does it differ from a union?

### Answer

- The **intersection** requires a value to satisfy **all** members at once.
- For object types it merges members; for incompatible primes it collapses to `never` (`string & number` has no values).
- Assignability is "all of": the value must be assignable to every member; reading gives access to every member's properties.

```ts
type Named = { name: string };
type Aged = { age: number };
const p: Named & Aged = { name: "a", age: 1 };

type Impossible = string & number; // never
```

- [More detail on Intersections](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)
- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)

---

### Question 35cfa12f-55f6-477e-9f4a-0e0ba5a024d6

- How do you decide between a union and an intersection when modeling an API response?

### Answer

- Use a **union** when the value is *one of several shapes* — different variants that are mutually exclusive.
- Use an **intersection** when the value must have *all of several capability sets* — composition/mixins.
- Modeling with a wrong one usually produces errors at the read site or an over-permissive type.

```ts
type Ok = { status: "ok"; data: User };
type Err = { status: "error"; message: string };
type Result = Ok | Err;                 // union: one or the other

type Timestamped = { createdAt: string };
type Post = { title: string } & Timestamped; // intersection: both, always
```

- [More detail on Unions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on Intersections](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)

---

### Question eb6e69ca-5c6c-4203-86a1-ed9d92c66fd3

- Why does `a: A | B` reject `a.bOnly` even after checking `a` is non-null?

### Answer

- Narrowing by non-null check only removes `null`/`undefined`; the union members remain intact.
- Property access is allowed only if **every** member has that property (or you narrow to one member first).
- Narrow with a discriminant, `in`, or a type guard to get access to variant-specific members.

```ts
type A = { a: number }; type B = { b: string };
declare const x: A | B;
"b" in x ? x.b : x.a; // `in` narrows to the member owning the property
```

- [More detail on in narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-in-operator-narrowing)
- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

### Question 3e8e10f8-299d-4041-ada6-93751168321a

- How does `boolean` relate to `true` and `false` as literal types?

### Answer

- `boolean` is defined as the union **`true | false`**.
- Narrowing on a boolean literal check reduces to the literal type, which is why `=== true` checks can matter in generic code.
- Arrays made with `as const` keep literal `true`/`false` element types, while a plain array widens them to `boolean[]`.

- [More detail on boolean](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#boolean)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question 33a55401-a875-4b3b-b014-af33dc7d5d15

- Why does `string | "a"` collapse to `string`, and `true | boolean` to `boolean`?

### Answer

- Union members are simplified by **subsumption**: if one member is a supertype of another, the narrower one is redundant.
- This means literal unions with a wide member give back all the safety you hoped for.

```ts
type T1 = "a" | string;    // string
type T2 = 1 | number;      // number
type T3 = null | string;   // stays: null is not a subtype of string
```

- [More detail on union simplification](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question 42be2b92-aff2-407d-900f-4fb9816c7d18

- Why does `const status = "idle"` not stop you from comparing `status` against `"done"`?

### Answer

- The comparison itself is fine because `"idle"` and `"done"` are both `string`; TS only errors on impossible comparisons between unrelated literal unions.
- To restrict the allowed set, annotate the intended union: `let status: "idle" | "done" = "idle"`.
- Without that, code can drift to any string and the union is never enforced.

```ts
let status: "idle" | "done" = "idle";
status = "loading"; // Error: "loading" not in the union
```

- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

---

### Question f83c0755-932a-4726-bd61-e6f4492428b7

- Why is a union of object literals rejected by excess property checking in a surprising way?

### Answer

- For `A | B`, a fresh literal must match exactly one member and trigger excess property checks against **each** applicable member.
- Extra properties not present in any member are rejected; overlapping discriminants can produce "no property is common" errors.
- Workaround: annotate with the intended member explicitly, or give the union a discriminant property.

```ts
type T = { a: number } | { b: number };
const x: T = { a: 1, b: 2 }; // Error: 'b' does not exist on the first member
```

- [More detail on Excess Property Checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)
- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

---

### Question 634bd2bb-7d55-4d40-b248-3e6a9644e045

- What is the operator precedence of `|` and `&`?

### Answer

- `&` binds tighter than `|`, so `A & B | C` parses as `(A & B) | C`.
- Precedence surprises are a common source of wrong types in larger unions.
- Always parenthesize mixed unions/intersections.

```ts
type T = { a: 1 } & { b: 2 } | { c: 3 };     // ({a} & {b}) | {c}
type U = { a: 1 } & ({ b: 2 } | { c: 3 });   // explicit, usually intended
```

- [More detail on Intersections](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)
- [More detail on Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

---

### Question 9f03864e-79cf-45cb-80c6-b0d8f482d78a

- How do literal types let you avoid enums entirely?

### Answer

- A union of string literals models the same closed set as a string enum, with **zero runtime output**.
- Pair it with a `satisfies`-checked map when you need associated values (e.g. labels).

```ts
type Role = "admin" | "user" | "guest";
const labels = { admin: "Admin", user: "User", guest: "Guest" } satisfies Record<Role, string>;
```

- [More detail on literals vs enums](https://www.typescriptlang.org/docs/handbook/enums.html#enums-vs-alternatives)
- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)

---

### Question f98d12c6-8b72-40bc-9818-106ad1c62ba7

- Why does a union with `undefined` force checks after every access?

### Answer

- `T | undefined` includes `undefined`, and with `strictNullChecks` any property access on the union is an error.
- Narrowing with `if (v)`, `v ?? fallback`, or `v?.prop` is required to read through it.
- In objects, `prop?: T` is the same union applied to an optional member (plus the possibility of absence).

```ts
type Cfg = { retries: number | undefined };
declare const c: Cfg;
c.retries + 1;              // Error
(c.retries ?? 0) + 1;       // OK
```

- [More detail on optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question 70010ed1-fc0b-4ebf-8ac6-edda270d89f5

- What does `never` inside an intersection tell you about the type?

### Answer

- An intersection containing `never` **absorbs** the whole type: `T & never` is `never`.
- That is how "impossible" types like `string & number` model code that can never be valid.
- `never` is also used deliberately to make a type uninhabitable but expose the members as "phantom" properties for branded types.

```ts
type Brand<T, B> = T & { readonly __brand: B };
type UserId = Brand<string, "UserId">;
// UserId is not assignable to plain string without a cast
```

- [More detail on branded types](https://www.typescriptlang.org/play)
- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)

---

### Question b0b41991-865a-40c8-8a3d-6e4557b9d240

- How do you model a state machine with unions and get exhaustiveness for free?

### Answer

- Make each state a variant with a **discriminant** literal (`status`), and let each variant carry the data valid in that state.
- `switch` on the discriminant narrows to each variant; the `default` branch receives `never` once all are handled.
- This makes illegal states unrepresentable — no `data: T | undefined` combos to guard.

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; items: string[] }
  | { status: "error"; message: string };
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on never exhaustiveness](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)

---

### Question 207f7021-0e08-4889-85c6-050215f44b1d

- Do union member order and duplicates matter?

### Answer

- Order is irrelevant to identity: `A | B` and `B | A` are the same type.
- Duplicate members are deduped: `A | A` is `A`.
- Order does matter for **conditional type distribution** and for diagnostic readability, but not for assignability.

- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on conditional types distribution](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

---

### Question d5ba82cc-2fe5-4e4a-a1e1-f22483117b84

- What is the difference between a type alias for a function and an interface with a call signature?

### Answer

- Both describe callable types with identical checking; alias syntax is `type F = (a: string) => void`, interface syntax uses a call signature member.
- Interfaces with call signatures can additionally be **declaration-merged** and extended with more call signatures by other files.
- Aliases can express unions/intersections of function types; interfaces cannot be unions.

```ts
type Handler = (e: Event) => void;
interface HandlerI { (e: Event): void }
```

- [More detail on call signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures)
- [More detail on interface vs type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

---

### Question 78623b36-2d8c-408a-8d9c-eee92b86a87f

- Why can't you add a `readonly` modifier to a union alias, and what do you do instead?

### Answer

- `readonly` is a **property/element modifier**, not a standalone type wrapper, so `readonly (A | B)` is invalid syntax.
- Apply `readonly` per property (`{ readonly x: string }`) or use `Readonly<A | B>`, though `Readonly` applies shallowly and can drop union-specific behavior.
- For tuples, `readonly` works directly: `readonly [string, number]`.

```ts
type Pair = readonly [string, number];
type Cfg = { readonly mode: "a" | "b" };
```

- [More detail on readonly in object types](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)
- [More detail on Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)

---

### Question 86fde369-65f9-498e-b8e2-6dcd41d2a0eb

- When would you use `satisfies` with a union to check that a value is one of the allowed variants?

### Answer

- `satisfies` validates a value against the union while preserving the **literal** type of the expression.
- It is a good fit for a config table: the keys stay literal for indexing, and each value is checked to be a valid variant.
- With plain `: T`, literal keys and values are widened away.

```ts
type Theme = "light" | "dark";
const preset = { light: { bg: "#fff" }, dark: { bg: "#000" } } satisfies Record<Theme, { bg: string }>;
```

- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)

---

### Question ab367ca0-2793-45ee-8e2b-cc8543ce461e

- How does `Extract`/`Exclude` relate to unions?

### Answer

- `Exclude<U, M>` removes from `U` every member assignable to `M`.
- `Extract<U, M>` keeps only the members assignable to `M`.
- They operate structurally on union members, which is why they are the standard tools for filtering discriminated unions.

```ts
type Event = { type: "click" } | { type: "key" } | "log";
type NamedEvent = Extract<Event, { type: string }>; // click | key
type Other = Exclude<Event, { type: string }>;      // "log"
```

- [More detail on Exclude](https://www.typescriptlang.org/docs/handbook/utility-types.html#excludetype-excludedunion)
- [More detail on Extract](https://www.typescriptlang.org/docs/handbook/utility-types.html#extracttype-union)

---

### Question 624c6be7-01eb-4bb1-a2c3-68c35e3d40a9

- Why does assigning an `A` to `A | B` work, but assigning an `A | B` back to `A` require a check?

### Answer

- Widening to a union is always safe — the value already satisfies one member.
- Narrowing from a union back to one member is unsafe in general because the value may actually be the other member.
- So `A` → `A | B` is implicit, and the reverse requires a type guard, assertion, or discriminant check.

```ts
declare const a: { a: 1 };
const u: { a: 1 } | { b: 2 } = a;  // OK
declare const x: { a: 1 } | { b: 2 };
const y: { a: 1 } = x;             // Error
```

- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question d882c0a3-4a12-4002-8c6d-dcc736a2a3e1

- What makes a good discriminant property?

### Answer

- A property shared by every variant whose type is a **unique literal** in each variant (string or number literal).
- TS requires the discriminant to be a literal type; `kind: string` in all members does not narrow.
- Keep the discriminant flat (not nested) so `switch`/`if` narrowing works directly.

```ts
type Msg =
  | { type: "text"; body: string }
  | { type: "image"; url: string };
declare const m: Msg;
if (m.type === "image") m.url; // narrowed
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question 49117cec-1de3-41d5-ba25-b7c07f2968f2

- What happens when two intersection members declare the same property with different types?

### Answer

- The property type becomes the **intersection of the two types**, which is often `never` for incompatible primitives.
- If one member is an object type and the other is an object type, they merge recursively.
- Assignability then fails for any value that cannot satisfy both, so the error shows up at construction time.

```ts
type A = { id: string } & { id: number };  // { id: never }
const a: A = { id: 1 };                    // Error
```

- [More detail on Intersections](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)
- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 2d22ee65-b29a-4571-91d3-995e885c5224

- Why is `type` often preferred over `interface` for unions, tuples, and aliases of primitives?

### Answer

- `interface` can only describe object shapes (plus call/construct/index signatures); it cannot name a union, tuple, or primitive alias.
- `type` can name any type, so it is the only option for `type Result = Ok | Err`.
- Interfaces are still preferred by many for extensible object contracts, where declaration merging helps.

```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
type Point = [number, number];
```

- [More detail on interface vs type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [More detail on Type Aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)

---

### Question df355339-16c5-4146-a1fa-d51c29c20d4a

- How do you create a union from the keys of an object?

### Answer

- `keyof typeof obj` produces the union of literal keys.
- Combined with indexed access, you can derive value unions too: `(typeof obj)[keyof typeof obj]`.

```ts
const colors = { red: "#f00", green: "#0f0" } as const;
type Color = keyof typeof colors;        // "red" | "green"
type Hex = (typeof colors)[Color];       // "#f00" | "#0f0"
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question 5dc5b519-2e8f-4a89-a7e7-30be5b63dd5d

- What is the practical cost of using very wide unions?

### Answer

- Compile time grows with member count, especially when unions are combined with conditional/mapped types that distribute over every member.
- Error messages become hard to read because TS prints the entire union.
- Large unions are usually better modeled as an object map plus `keyof`, or as a discriminant-carrying interface.

- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

---

### Question 8e3bf1b9-3935-4172-92fc-92b2dcb984ee

- Why does `x === "a"` narrow a `string | "a"`-style union but not a plain `string`?

### Answer

- Narrowing works by **removing** members incompatible with the check; a plain `string` has no members to remove.
- Literal unions gain precision from the check because the negative branch excludes `"a"`.
- That is why boolean-ish unions of literals are the main user of equality narrowing.

```ts
declare const x: "a" | "b";
if (x === "a") { /* x: "a" */ } else { /* x: "b" */ }
```

- [More detail on equality narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#equality-narrowing)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question b099ace3-88bf-4464-82c7-87620c62d385

- What is the difference between `T | unknown` and `T & unknown`?

### Answer

- `T | unknown` is just **`unknown`** — `unknown` absorbs unions because every value is assignable to it.
- `T & unknown` is **`T`** — intersecting with the top type adds nothing.
- These identity rules are useful when reading generic types built from utility types.

- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [More detail on union and intersection](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)

---

### Question eb0946c9-33a3-4489-8073-1bb4108397c4

- How do you model "exactly one of two optional properties" with a union?

### Answer

- Use a union of variants where each forbidden property is typed `never` — an optional `never` can only be absent.
- This is the standard exclusive-or encoding, and it catches both properties being present at compile time.
- Keep a shared discriminant if you also need to narrow between variants.

```ts
type Range = { min: number; max?: never } | { min?: never; max: number };
const a: Range = { min: 1 };
const b: Range = { min: 1, max: 2 }; // Error
```

- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)

---

### Question 2f24e01d-d22b-42cc-9106-992f0bdb29e4

- Why does `A | never` simplify to `A`?

### Answer

- `never` is the empty set of values, so it contributes nothing to a union — union identity with the bottom type.
- This is what makes `Exclude<T, U>` work: non-matching members map to `never`, and the union drops them.
- The dual identity is `T & unknown === T` (intersecting with the top type).

```ts
type Exclude<T, U> = T extends U ? never : T;
type R = Exclude<"a" | "b", "a">; // never | "b" → "b"
```

- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)
- [More detail on distribute conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)
