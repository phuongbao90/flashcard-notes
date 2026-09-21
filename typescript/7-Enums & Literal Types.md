# TypeScript Enums & Literal Types

### Question c6f2fee9-ab7a-4f0f-bfac-ab3ef22ed783

- What does an `enum` declaration emit at runtime?

### Answer

- A numeric (or heterogeneous) enum emits a **bidirectional object**: `E[0] === "A"` and `E.A === 0`.
- A string enum emits a one-way object: `E.A === "a"`, but there is no reverse mapping.
- `const enum` emits nothing at most use sites (values are inlined), unless `preserveConstEnums` is on.

```ts
enum N { A }
enum S { A = "a" }
// N → { "0": "A", A: 0 }   S → { A: "a" }
```

- [More detail on Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
- [More detail on enum runtime output](https://www.typescriptlang.org/docs/handbook/enums.html#enums-at-runtime)

---

### Question ee46926f-e39e-45e7-9570-145a312cfb13

- How does auto-incrementing work for numeric enum members?

### Answer

- The first member without an initializer gets **0**; each following initializer-less member increments the previous numeric value.
- An explicit initializer resets the counter from that value.
- Computed members (function calls, expressions) are allowed but disable some tracking and can produce runtime surprises.

```ts
enum E { A, B = 5, C }   // A=0, B=5, C=6
enum F { X = "x", Y = 1, Z } // Z = 2
```

- [More detail on numeric enums](https://www.typescriptlang.org/docs/handbook/enums.html#numeric-enums)
- [More detail on computed and constant members](https://www.typescriptlang.org/docs/handbook/enums.html#computed-and-constant-members)

---

### Question 609f84f7-6024-47b4-842e-cb1d9018bcf4

- Why are string enums usually preferred over numeric enums?

### Answer

- Their values are **readable in logs and network payloads** (`"admin"` beats `0`), and stable if members are reordered.
- No reverse mapping means no risk of `E[0]` returning a name unexpectedly; `Object.values` yields the names.
- Numeric enums accept arbitrary numbers structurally (see next card), which weakens the closed-set guarantee.

```ts
enum Role { Admin = "admin", User = "user" }
console.log(Role.Admin); // "admin"
```

- [More detail on string enums](https://www.typescriptlang.org/docs/handbook/enums.html#string-enums)
- [More detail on enums at runtime](https://www.typescriptlang.org/docs/handbook/enums.html#enums-at-runtime)

---

### Question cf0e0a18-e868-4779-880f-0cb1c1836adb

- Why can you assign an arbitrary number to a numeric enum type?

### Answer

- Numeric enum types historically accept any `number`, because computed/bitwise values must be representable.
- So `const r: Role = 42` compiles if `Role` is numeric — the closed set is not enforced.
- String enums and literal unions do enforce membership; that is a strong reason to prefer them for finite sets.

```ts
enum Level { Low }
const l: Level = 99; // compiles (unsound)
```

- [More detail on numeric enums](https://www.typescriptlang.org/docs/handbook/enums.html#numeric-enums)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question e5598e6b-0b81-4b86-9f48-7eec8a91889b

- What changed about enums in TypeScript 5.0?

### Answer

- **All enums are now union enums**: the enum's members form a union of literal types, so switching over members narrows precisely.
- Comparing members of two different enum types became an error (they cannot overlap).
- Assigning out-of-domain literals to enum-typed values is now checked in many cases; numeric enums remain permissive with plain `number`.

- [More detail on enumeration changes in 5.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)
- [More detail on enum member types](https://www.typescriptlang.org/docs/handbook/enums.html#union-enums-and-enum-member-types)

---

### Question 0f1dd656-7fee-4958-8bf9-4b461e348938

- What is an enum member type, and how does it enable exhaustive switches?

### Answer

- Each member has its own type, e.g. `E.A` is a distinct literal type, and `E` is the union of all member types.
- `switch (e) { case E.A: ... }` narrows to `E.A`; the default/end branch receives the remaining members.
- A `never` assignment in the final branch gives the same exhaustiveness guarantee as discriminated unions.

```ts
enum Shape { Circle, Square }
function area(s: Shape) {
  switch (s) {
    case Shape.Circle: return 1;
    case Shape.Square: return 2;
    default: const _x: never = s; return _x;
  }
}
```

- [More detail on union enums](https://www.typescriptlang.org/docs/handbook/enums.html#union-enums-and-enum-member-types)
- [More detail on exhaustiveness](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)

---

### Question 072f88c8-309c-4bbe-a848-59b97da834d5

- What is a heterogeneous enum and why is it discouraged?

### Answer

- An enum with both string and numeric members — legal syntax, poor semantics.
- You lose most invariants: some members reverse-map, some do not; exhaustive iteration and validation are hard to reason about.
- Use a string enum, or a discriminated union with explicit data.

```ts
enum Mixed { No = 0, Yes = "YES" } // legal, avoid
```

- [More detail on heterogeneous enums](https://www.typescriptlang.org/docs/handbook/enums.html#heterogeneous-enums)
- [More detail on string enums](https://www.typescriptlang.org/docs/handbook/enums.html#string-enums)

---

### Question 8b0616d4-8e28-41d4-a4d6-8467d1c7174b

- How do `const enum` members get compiled, and what does that imply for tooling?

### Answer

- Usages are **inlined** with the member value at each reference; no object is emitted (with `preserveConstEnums`, a plain enum is emitted).
- Inlining requires whole-program knowledge, which single-file transpilers (Babel, SWC, esbuild, Vite) do not have.
- Under `isolatedModules`, accessing **ambient** const enums is an error; prefer regular enums or `as const` objects in transported codebases.

```ts
const enum Dir { Up }
const d = Dir.Up; // emits: const d = 0 /* Up */
```

- [More detail on const enums](https://www.typescriptlang.org/docs/handbook/enums.html#const-enums)
- [More detail on isolatedModules](https://www.typescriptlang.org/tsconfig#isolatedModules)

---

### Question 3626d5bb-cd5e-4b49-840e-5cd86879b9d7

- What does `preserveConstEnums` change?

### Answer

- It makes `const enum` behave like a normal enum **at emit time**: the object is written to JS so runtime lookups work.
- Useful when some consumers cannot inline the values (e.g. `isolatedModules` pipelines, published libraries).
- With it enabled, `const enum` keeps type-level restrictions but loses the zero-overhead promise.

- [More detail on preserveConstEnums](https://www.typescriptlang.org/tsconfig#preserveConstEnums)
- [More detail on const enums](https://www.typescriptlang.org/docs/handbook/enums.html#const-enums)

---

### Question 033e0b6d-eab4-4483-bdf8-21ee23c4d9eb

- What is an ambient enum (`declare enum`, `declare const enum`) and where does it appear?

### Answer

- It declares that an enum exists at runtime **without emitting** code; the implementation is provided elsewhere (JS lib, global script, generated file).
- Common in `.d.ts` files for legacy globals and in `declare global` blocks.
- Accessing ambient `declare const enum` members under `isolatedModules` is rejected because it cannot be inlined safely.

```ts
declare enum Env { Dev, Prod }
const e: Env = Env.Dev; // compiles; Env must exist at runtime
```

- [More detail on ambient enums](https://www.typescriptlang.org/docs/handbook/enums.html#ambient-enums)
- [More detail on declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

---

### Question f01e4bad-a149-4e60-92aa-15eda47f11b9

- How do you enumerate the keys or values of an enum type in a type-safe way?

### Answer

- `keyof typeof E` gives the union of member names; values are the members themselves.
- `Object.values(E)`/`Object.keys(E)` at runtime are typed loosely (often `string[]`), so cast or build an explicit array.
- For string enums, an explicit tuple plus `satisfies` keeps runtime iteration and typing aligned:

```ts
enum Role { Admin = "admin", User = "user" }
const ROLES = [Role.Admin, Role.User] as const;
type RoleLiteral = (typeof ROLES)[number];
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on indexed access](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question a5cfcc1c-b1c1-4c66-872e-b4259a275ce8

- How does the `as const` object pattern replace an enum, and what does it preserve?

### Answer

- A frozen object of string literals with an accompanying type alias gives you named constants **and** a closed union with zero runtime magic.
- You keep autocompletion, exhaustiveness, and JSON-serializable values, and you avoid the enum runtime object and numeric quirks.
- It also works with transpile-only tooling and `erasableSyntaxOnly`.

```ts
const Role = { Admin: "admin", User: "user" } as const;
type Role = (typeof Role)[keyof typeof Role]; // "admin" | "user"
```

- [More detail on enums vs alternatives](https://www.typescriptlang.org/docs/handbook/enums.html#enums-vs-alternatives)
- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

---

### Question b3586cfa-cf5f-4ce8-8dc6-2e342ddf6e3a

- What is `erasableSyntaxOnly` and how does it affect enums?

### Answer

- A TS 5.8 compiler option that rejects syntax which **emits/needs runtime helpers**: enums, `namespace`s with values, parameter properties, and `import =`.
- It exists for environments that strip types without transforming them (e.g. Node's type stripping, some bundlers).
- With it on, use literal unions / `as const` objects instead of enums.

- [More detail on erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig#erasableSyntaxOnly)
- [More detail on enums vs alternatives](https://www.typescriptlang.org/docs/handbook/enums.html#enums-vs-alternatives)

---

### Question 6056fbdd-966d-4735-994f-da1cb2e019bf

- What is a literal type, precisely?

### Answer

- The type whose only value is that literal: `"a"`, `42`, `true`, `-1n`.
- Literals are the building blocks of discriminated unions and of `as const`-derived types.
- Each literal is a subtype of its base primitive (`"a"` <: `string`), which is what makes unions and narrowing work.

```ts
type Dir = "up" | "down";
type Answer = "yes" | "no" | 0 | 1;
```

- [More detail on Literal Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [More detail on subtypes](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 8bc78f0d-f899-4cd5-8397-91b3e2caa140

- How do you derive a literal union from a runtime validation list so it cannot drift?

### Answer

- Declare the list `as const` (or `satisfies readonly string[]`) and derive the type with indexed access.
- Any runtime schema built from the same list then uses the identical values.

```ts
const SIZES = ["sm", "md", "lg"] as const;
type Size = (typeof SIZES)[number];        // "sm" | "md" | "lg"
function isValid(s: string): s is Size { return (SIZES as readonly string[]).includes(s); }
```

- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [More detail on typeof in type position](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

---

### Question e172672a-ee8f-4992-bded-7bc62c155d86

- Why does `const xs = ["a", "b"]` widen to `string[]` and how do you keep the union?

### Answer

- Array literals without context **widen** their element types because the array is mutable.
- `as const` produces a `readonly ["a", "b"]` tuple, and indexed access with `number` gives the union.
- `satisfies readonly string[]` validates the values while preserving element literals if you combine it with `as const`.

```ts
const xs = ["a", "b"] as const;
type X = (typeof xs)[number]; // "a" | "b"
```

- [More detail on literal widening](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question 2fd6f638-c1b5-49ae-ba14-1371b62eb5f4

- Can literal types be used directly as function parameter constraints?

### Answer

- Yes — a literal union parameter restricts callers at compile time, though nothing enforces it at runtime.
- This is the standard lightweight alternative to a runtime enum.

```ts
function setTheme(theme: "light" | "dark") {}
setTheme("dark");
setTheme("blue"); // Error
```

- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [More detail on function types](https://www.typescriptlang.org/docs/handbook/2/functions.html)

---

### Question 1bb00aa9-c433-48aa-8736-f72300495b16

- Why do literal types disappear in a network payload or from `JSON.parse`?

### Answer

- Types are erased, and `JSON.parse` returns `any` — nothing validates that `"admin"` is actually one of your literals.
- The common failure mode is a server rename (`"admin"` → `"ADMIN"`) passing the compiler and breaking at runtime.
- Validate at the boundary with a guard/schema that shares the same literal list.

```ts
type Role = "admin" | "user";
function isRole(v: unknown): v is Role { return v === "admin" || v === "user"; }
```

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on unknown at boundaries](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question 789e3748-f2bb-477f-8473-9b5a3c2e8227

- What is the difference between an `enum` and a literal union for a finite set of values?

### Answer

- **Literal union:** zero runtime cost, works with `JSON.parse` values directly, easy to derive from runtime arrays, best for most app code.
- **Enum:** creates a runtime object, supports reverse mapping (numeric), supports bitwise flags, and has nominal-ish behavior that prevents mixing with raw strings.
- Enums are the better fit when you need the runtime object (iteration, reflection) or an overloaded value-to-name contract.

- [More detail on enums vs alternatives](https://www.typescriptlang.org/docs/handbook/enums.html#enums-vs-alternatives)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question e5c5e918-bc66-4f13-901e-5a3885d445dd

- How do bitwise flag patterns get typed with enums?

### Answer

- Declare numeric enum powers of two (`1 << n`) and combine with `|`; the result is typed as `number`, so it is conventionally cast back to the enum.
- This is the one numeric-enum pattern that is genuinely useful because the free-form-number assignability matches bitwise semantics.

```ts
enum Perm { Read = 1, Write = 2, Exec = 4 }
const rw = Perm.Read | Perm.Write; // number
const canRead = (p: number) => (p & Perm.Read) !== 0;
```

- [More detail on numeric enums](https://www.typescriptlang.org/docs/handbook/enums.html#numeric-enums)
- [More detail on bitwise operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_OR)

---

### Question 1c4bb6c3-9d45-4aee-8a5f-97595df0c567

- How do you exhaustively iterate enum members in a type-safe list?

### Answer

- Enums are not iterable; build a `values` array manually or from `Object.values` with a cast.
- For string enums the cast is safe; for numeric enums the reverse mappings would be included, so filter to `typeof v === "number"` (or `"string"`).
- Keeping the array as the source of truth avoids drift.

```ts
enum Color { Red = "red", Blue = "blue" }
const COLORS = Object.values(Color) as Color[];
```

- [More detail on enum runtime behavior](https://www.typescriptlang.org/docs/handbook/enums.html#enums-at-runtime)
- [More detail on Object.values](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values)

---

### Question bbe9ecd1-58cd-4add-a253-87d2d9b61983

- Why is a numeric literal type like `1` sometimes not assignable to a `number` parameter in generic code?

### Answer

- It is assignable — literals are subtypes of `number`. The reverse (assigning `number` where `1 | 2` is expected) is the error.
- In generic positions, inference may keep the literal type or widen it, which changes overload resolution.
- Use `as const` or explicit type parameters when you need the literal to survive inference.

```ts
function pick<T extends number>(n: T) { return n; }
const a = pick(1);              // 1
const b: number = 1; pick(b);   // number, widened
```

- [More detail on literal inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [More detail on generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)

---

### Question bdca2535-e51c-4349-86c9-1aadbf489356

- What does `keyof typeof SomeEnum` give you, and how is it useful?

### Answer

- The union of the enum's **member names** as string literals, e.g. `"Admin" | "User"`.
- Useful for building UI tables of labels, for validating user input against member names, and for `Record<keyof typeof E, X>`.
- It is a type-level mapping; it does not include values.

```ts
enum Role { Admin = "admin", User = "user" }
type Names = keyof typeof Role; // "Admin" | "User"
const labels: Record<Names, string> = { Admin: "A", User: "U" };
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

---

### Question 1b884c5d-04e3-4411-aba1-18c15e06cc42

- What are the risks of storing enum values in a database and later renaming a member?

### Answer

- Renaming the **name** changes nothing at runtime for string enums (the value stays), but renames of the **value** require a data migration.
- Numeric enums reorder if someone inserts a member before existing ones without explicit values, silently changing persisted meaning.
- Persist string enum values (or literal unions), never auto-incremented numeric values, and treat them as a public wire format.

```ts
enum State { Open = "open", Closed = "closed" } // safe to reorder
```

- [More detail on string enums](https://www.typescriptlang.org/docs/handbook/enums.html#string-enums)
- [More detail on enum runtime output](https://www.typescriptlang.org/docs/handbook/enums.html#enums-at-runtime)

---

### Question 07fe7e4f-63cc-4fdf-a63c-b7a68c994b49

- Can an enum member be computed from another enum or an expression?

### Answer

- Yes: `enum E { A = 1 << 1, B = "x".length }` is legal; computed members must have a numeric type.
- After a computed member, following initializer-less members fail with "Enum member must have initializer".
- Computed members are one reason numeric enums allow any `number`.

```ts
enum Flags { A = 1, B = A << 1, C = A | B }
```

- [More detail on computed members](https://www.typescriptlang.org/docs/handbook/enums.html#computed-and-constant-members)
- [More detail on enum expressions](https://www.typescriptlang.org/docs/handbook/enums.html#numeric-enums)

---

### Question 25b4e896-8202-49d4-bbed-345b8b107a48

- How do you constrain a generic parameter to a specific set of literal values?

### Answer

- Use the literal union as a constraint or as the default type parameter.
- With `T extends "a" | "b"`, `T` can still be the whole union, not just one member.
- Add a default (`T extends Color = Color`) to keep call-site ergonomics.

```ts
type Color = "red" | "green";
function paint<T extends Color>(c: T): T { return c; }
paint("red"); // T = "red"
```

- [More detail on generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- [More detail on default type parameters](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults)

---

### Question 62b6e00c-96a1-4b6c-8005-a3e71c15ff79

- Why does a `switch` over a `string` fail to be exhaustive-typed even when all known values are handled?

### Answer

- A plain `string` is open-ended — the compiler must assume any string can arrive, so the final branch is not `never`.
- Only a **closed union or enum** narrows to `never`, which is what makes the exhaustiveness check work.
- Validate input into a closed union at the boundary, then switch on the narrow type.

```ts
function f(x: "a" | "b") { switch (x) { case "a": break; case "b": break; default: const _n: never = x; } }
```

- [More detail on exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question d802d5e6-910f-4645-8051-ce0c95717501

- How do you exhaustively map enum members to labels so a new member cannot be forgotten?

### Answer

- Type the map as `Record<Enum, string>`; adding a member makes the object literal incomplete and errors.
- Combine with `as const` when you also want literal label values for deriving types.
- This converts an exhaustiveness problem from runtime (undefined labels) to compile time.

```ts
enum Role { Admin = "admin", User = "user" }
const labels = { [Role.Admin]: "Admin", [Role.User]: "User" } as const satisfies Record<Role, string>;
```

- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)

---

### Question 974ca83d-8b9c-450f-988f-9fa7ce89f796

- How do you attach a helper function to an enum?

### Answer

- Declare a namespace with the same name: declaration merging adds value members to the enum object.
- The namespace must be `export`ed for the members to be visible to importers.
- This is the classic "enum with statics" pattern; a literal union plus a plain function is usually simpler.

```ts
enum Status { Open = "open", Closed = "closed" }
namespace Status {
  export function from(v: string): Status { return v === "open" ? Status.Open : Status.Closed; }
}
Status.from("open");
```

- [More detail on declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [More detail on enums](https://www.typescriptlang.org/docs/handbook/enums.html)

---

### Question 83013b77-a8a0-444b-9918-7aae6d3bc1f6

- How do you validate unknown input into an enum at runtime?

### Answer

- Read the enum's values, filter to the actual member values, and check membership; cast the check into a type predicate.
- For numeric enums, `Object.values` includes the reverse mappings, so filter with `typeof v === "number"` (or `"string"` for string enums).
- Keep the predicate next to the enum so both change together.

```ts
enum Role { Admin = "admin", User = "user" }
const ROLES = Object.values(Role) as Role[];
function isRole(v: unknown): v is Role { return typeof v === "string" && (ROLES as string[]).includes(v); }
```

- [More detail on enums at runtime](https://www.typescriptlang.org/docs/handbook/enums.html#enums-at-runtime)
- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
