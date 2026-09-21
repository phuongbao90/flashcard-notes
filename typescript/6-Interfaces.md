# TypeScript Interfaces

### Question aa1e1a0a-306b-401b-89ef-b9a4281730db

- What does an `interface` declaration describe, and what does it emit?

### Answer

- It names an **object shape**: required/optional/readonly properties, call, construct, and index signatures, plus method signatures.
- It is type-space only and is fully **erased** — no runtime value, no `instanceof` support.
- Because it is a named object type, it can be extended and implemented (classes), and it can be declaration-merged.

```ts
interface User { id: string; name?: string; readonly email: string }
class Account implements User { id = "1"; email = "a@b.c" }
```

- [More detail on Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question 544e47a6-a07a-4791-a751-2d117b245adf

- What is the difference between an optional property and one typed `| undefined`?

### Answer

- Optional (`name?: string`) means the property **may be omitted** from the object.
- `name: string | undefined` means the property must exist but its value may be `undefined`.
- `exactOptionalPropertyTypes` enforces this distinction on writes; without it `{ name: undefined }` is allowed for an optional property.

```ts
interface A { name?: string }
interface B { name: string | undefined }
const a: A = {};                       // OK
const b: B = {};                       // Error: property 'name' is missing
```

- [More detail on Optional Properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)
- [More detail on exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)

---

### Question 79827d14-fd35-427a-a8ce-6d9a1bd770fa

- What does `readonly` guarantee on an interface property?

### Answer

- It is a **compile-time-only** restriction: assignments and `delete` through that type are rejected.
- It does not freeze the object, does not prevent aliasing, and does not stop mutation through a non-readonly reference.
- `Readonly<T>` is the generic version for any object type; `readonly T[]` is the array form.

```ts
interface Cfg { readonly mode: string }
const c: Cfg = { mode: "dev" };
c.mode = "prod";               // Error
(c as { mode: string }).mode = "prod"; // still possible: readonly is shallow
```

- [More detail on readonly properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)
- [More detail on Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)

---

### Question ea401e59-d612-4903-a524-637512c67bbc

- Why is `readonly` not deep in an interface?

### Answer

- `readonly` marks only the immediately declared property; nested object references are unaffected.
- Assigning a new nested object is blocked, mutating the nested object is not.
- Use `as const` (fully literal/readonly) or `Readonly`/`DeepReadonly`-style mapped types for deeper guarantees.

```ts
interface S { readonly user: { name: string } }
const s: S = { user: { name: "a" } };
s.user = { name: "b" };   // Error
s.user.name = "b";        // OK — shallow readonly
```

- [More detail on readonly](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)
- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

---

### Question 5d0ab0ed-2fcf-42db-bb14-19e3af0bf23f

- How do you declare a callable interface (a function type) and what extras does it allow?

### Answer

- Use a **call signature** member `(args): Return`; the interface then describes a function value.
- It can add properties (hybrid types), overloads via multiple call signatures, and generic call signatures.
- Aliases can do the same, but only interfaces can be merged/extended across files.

```ts
interface Fmt {
  (n: number, digits?: number): string;
  locale: string;
}
declare const f: Fmt;
f(1); f.locale;
```

- [More detail on call signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures)
- [More detail on function types](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)

---

### Question 7af27a7a-f896-4d27-bb03-330ed88e3e7f

- What is the difference between a method signature and a function-valued property in an interface?

### Answer

- `f(): void` is a **method** signature; `f: () => void` is a function-typed **property**.
- The difference is checked under `strictFunctionTypes`: properties are checked contravariantly, methods are checked bivariantly.
- Practically, method syntax is more permissive, which can hide unsound handler assignability.

```ts
interface A { f(x: string): void }
interface B { f: (x: string) => void }
// A accepts a wider range of implementations than B
```

- [More detail on strictFunctionTypes](https://www.typescriptlang.org/tsconfig#strictFunctionTypes)
- [More detail on function compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-function-types)

---

### Question ce48df69-0dad-4602-a631-84c53cba7476

- How does interface extension work, and can you extend multiple interfaces?

### Answer

- `interface B extends A` copies A's members into B and requires B's value to satisfy A too.
- Multiple bases are allowed: `interface C extends A, B`.
- Extension is **checked**: re-declaring an inherited property with an incompatible type errors; compatible narrowing is allowed.

```ts
interface Timestamped { createdAt: string }
interface Post extends Timestamped { title: string }
class Blog implements Post { createdAt = ""; title = ""; }
```

- [More detail on Extending interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#extending-types)
- [More detail on interface implementation](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses)

---

### Question 60a94306-9983-4dc2-af80-5c9933d09cec

- What happens when you extend an interface and redeclare a property with an incompatible type?

### Answer

- The compiler errors: "Interface 'B' incorrectly extends interface 'A'". Property types must be compatible/resolvable through intersection semantics.
- Narrowing a property type is allowed in some cases (e.g. base `string`, derived literal union) — that is covariance.
- Changing to an unrelated type, or widening to `string | number`, fails.

```ts
interface A { x: string }
interface B extends A { x: "a" | "b" }   // OK
interface C extends A { x: number }       // Error
```

- [More detail on extending types](https://www.typescriptlang.org/docs/handbook/2/objects.html#extending-types)
- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 37dfca13-d2dd-439e-a9da-bd7e5f58af28

- What is an index signature and when does it hide type errors?

### Answer

- `[key: string]: T` says "any string key yields `T`" — including keys you never declared, so `obj.typo` type-checks.
- When a specific property is declared too, its type must be assignable to the index type.
- Prefer a concrete shape or `Record<K, V>` with a key union; index signatures are for genuinely open maps.

```ts
interface Env { [key: string]: string; NODE_ENV: string }
const e: Env = { NODE_ENV: "dev" };
e.TYPO; // string, no error
```

- [More detail on index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)
- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)

---

### Question 9c0373e4-ec47-46db-92fa-7a2c8ede80cc

- Why can't an interface have both a `string` index signature and a numeric-looking property of a different type?

### Answer

- A numeric key like `0` is also a string key at runtime, so `obj[0]` is covered by the string index, keeping types consistent — declaring `0: number` alongside `[k: string]: string` errors.
- TS allows a **numeric** index signature to coexist with a string one only when the numeric value type is assignable to the string one.
- Real arrays work because both index types align with the element type.

```ts
interface A { [k: string]: string; 0: string } // OK
interface B { [k: string]: string; 0: number } // Error
```

- [More detail on index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)
- [More detail on array typing](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-array-type)

---

### Question 2b6dbc17-f3a5-414e-ae6c-038f8cd8d823

- What is declaration merging and why is it both useful and dangerous?

### Answer

- Multiple `interface` declarations with the same name in the same scope are **merged** into one type.
- Useful for augmenting third-party or global types (e.g. Express `Request`, `Window`).
- Dangerous: a typo reopens an existing interface instead of failing, and separately-authored files can silently combine.

```ts
interface Config { a: string }
interface Config { b: number }
const c: Config = { a: "x", b: 1 }; // both members required
```

- [More detail on declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [More detail on module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)

---

### Question 55f7784b-8ff1-475a-8033-06855e72a3b2

- Can `type` aliases be declaration-merged?

### Answer

- **No.** A duplicate `type` name in the same scope is an error ("Duplicate identifier"), even if the definitions match.
- That is a deliberate design choice: aliases are closed, which makes them safer for unions and tuples.
- Only namespaces, interfaces, classes (with interfaces), and enum declarations merge.

- [More detail on declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [More detail on interface vs type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

---

### Question 2a5ecaf7-60b1-4c1f-bbaf-eaae1677ad09

- How do you declare an interface that a class can implement with a construct signature requirement?

### Answer

- A **construct signature** `new (args): T` describes the constructor shape, and a class (its `typeof` side) satisfies it if the constructor is compatible.
- `abstract new (...)` is used when you only need the constructor, not instantiation; both forms are represented in TS as `InstanceType`/`ConstructorParameters` utilities.
- A class `implements` an interface only for its **instance** side, not statics.

```ts
interface Ctor<T> { new (value: string): T }
class User { constructor(public name: string) {} }
const C: Ctor<User> = User;
```

- [More detail on construct signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#construct-signatures)
- [More detail on ConstructorParameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#constructorparameterstype)

---

### Question 9ed282be-f23d-42fa-89ca-309dac9ad316

- How does a class `implements` an interface — what is checked and what is not?

### Answer

- The class **instance type** must be assignable to the interface: all required members, correct types, no missing props.
- Optional, readonly, and index-signature members are checked (readonly on the interface does not require readonly in the class).
- `implements` is erased; the class is unaffected at runtime, and methods keep their inferred bodies unless annotated.

```ts
interface Named { readonly name: string; greet?(): void }
class P implements Named { name = "x"; } // OK; greet optional
```

- [More detail on implements clauses](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses)
- [More detail on class types](https://www.typescriptlang.org/docs/handbook/2/classes.html)

---

### Question cf188f60-0c6b-4d23-8515-918472bacaa6

- Why can a class implementing an interface change the property type to a subtype, but not to a supertype?

### Answer

- Object property types are (largely) **covariant**: a class may narrow what the interface promises.
- Widening (`string` → `string | number`) breaks the interface contract, so it errors.
- Function-valued properties are checked contravariantly in their parameters under `strictFunctionTypes`, so parameter widening in the implementation is what is required there.

```ts
interface HasId { id: string }
class A implements HasId { id: "fixed" = "fixed"; } // narrower, OK
class B implements HasId { id: string | number = 1; } // Error
```

- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [More detail on strictFunctionTypes](https://www.typescriptlang.org/tsconfig#strictFunctionTypes)

---

### Question 1e3326ed-0159-4b97-ab72-f366614aef5c

- What is a hybrid interface type and where is it common?

### Answer

- An interface that combines a **call/construct signature** with properties — callable and property-bearing at once.
- Common in npm packages: `jQuery`, old `express` app factories, `styled.div` with `.attrs`.
- Variant 2: a value that is both a namespace and a function (`declare function f(): void; declare namespace f { export const version: string }`).

```ts
interface Request { (url: string): Promise<Response>; defaults: Record<string, string> }
declare const request: Request;
await request("/a"); request.defaults;
```

- [More detail on hybrid types](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [More detail on call signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures)

---

### Question fb6a8ade-ab95-466e-802e-63660999fbb2

- How do you type a recursive interface such as a folder tree?

### Answer

- Reference the interface by name inside itself; object-typed recursion is fine (no infinite expansion).
- Make the recursive member optional or an array so terminating leaves are representable.
- Use `readonly`/`?` deliberately: leaves usually omit `children`.

```ts
interface Node {
  name: string;
  children?: Node[];
}
```

- [More detail on recursive types](https://www.typescriptlang.org/play)
- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)

---

### Question 187a2c24-18e4-4ba1-bcdb-e94fbe176eb1

- Why does adding an index signature to an interface sometimes break its use as a React props type?

### Answer

- A `[key: string]: X` index requires **every** declared property to be assignable to `X`, including `children`, event handlers, and optional props.
- It also makes typos legal (`props.anythin`), disabling useful checking.
- For extensible prop sets, prefer explicit optional props plus a specific catch-all (e.g. `data-*` is not representable).

```ts
interface Props { id: string; [k: string]: string } // children would break this
```

- [More detail on index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)
- [More detail on React props typing](https://react.dev/learn/typescript)

---

### Question d0fc7108-c6f8-4b49-a96c-e68aea2967ca

- What is the difference between `interface A extends B` and `type A = B & {...}`?

### Answer

- `extends` is checked at declaration time and reports conflicts at the **interface** declaration with a clear message.
- Intersection does not check for conflicts; it produces `never`/merged members during evaluation, so errors surface at use sites.
- Extending copies members (better for editors/refactoring); intersections are lazily resolved.

```ts
interface A { x: string }
interface B extends A { x: number } // Error here
type C = A & { x: number };          // { x: never }, errors later
```

- [More detail on extending types](https://www.typescriptlang.org/docs/handbook/2/objects.html#extending-types)
- [More detail on Intersections](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)

---

### Question e65998f7-fabf-4416-bead-0fe9ec2958a5

- How do you declare an empty interface, and why is it discouraged?

### Answer

- `interface Empty {}` matches **any non-nullish value**, including primitives, so it constrains almost nothing.
- Lint rule `@typescript-eslint/no-empty-interface` flags it; empty object types are usually a placeholder mistake.
- If you need "any object", use `object`; if you need an extension point, declare the members you require.

```ts
interface Anything {}
const a: Anything = "str"; // compiles
```

- [More detail on empty interfaces](https://typescript-eslint.io/rules/no-empty-interface/)
- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

---

### Question a130935f-d11b-4a78-afe2-34defed1649f

- When should you use `interface` for a public API — what happens if you change a property type later?

### Answer

- Changing a member type in an interface is a **breaking change** for every implementer and consumer; the compiler flags all breakages.
- Adding a required member breaks implementations; adding an optional member is usually safe but can still conflict.
- With `implements`, the compiler lists classes that no longer satisfy the interface, which is the reason interfaces shine for contracts.

- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)
- [More detail on implement clauses](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses)

---

### Question 57aca361-d733-458b-8e2d-3408f008d5ad

- What is module augmentation with an interface, and how do you restrict its scope?

### Answer

- Module augmentation reopens an existing module's types from another file: `declare module "x" { interface Y { extra: string } }`.
- It applies only where the augmented module is the **same module instance** (same resolved path/package).
- Global augmentation (`declare global`) affects everything; wrap in `declare module` when possible and keep the file side-effect-free.

```ts
declare module "express-serve-static-core" {
  interface Request { user?: { id: string } }
}
```

- [More detail on module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)

---

### Question 118a0093-1c77-49fc-88a4-da11907aea63

- How do you express "an object with at least these properties" in an interface?

### Answer

- An interface is **exact by default** for excess property checks but structurally allows extra properties when assigned via a variable.
- There is no exact-object type built in; extra properties are structurally permitted.
- To require a subset while allowing more, use an interface with the required members and pass values through variables, or add an index signature for a known extra shape.

```ts
interface Required { id: string }
const extra = { id: "1", other: 2 };
const r: Required = extra; // OK, structurally
```

- [More detail on Excess Property Checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)
- [More detail on structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 3cb92a25-b6e3-498a-9f5a-be26960dc7a6

- Why is `interface` preferred in library type definitions over `type` for object shapes?

### Answer

- Interfaces merge, so consumers can add members without forking the declaration (a core reason for DefinitelyTyped compatibility).
- Editors display interface names in hover/tooltips; intersections/aliases can degrade to expanded anonymous shapes.
- Interfaces extend with clear conflict checking, which produces better errors for library authors.

- [More detail on type aliases vs interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
- [More detail on Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)

---

### Question aa2027e6-cf43-4911-86f9-65008ae56f04

- What does an index signature with `readonly` mean?

### Answer

- `readonly [key: string]: T` prevents assignment/deletion through that index: `obj.k = v` and `delete obj.k` error.
- It still allows mutating the value object itself.
- Useful for `as const`-style config maps where keys are dynamic.

```ts
interface Env { readonly [key: string]: string }
declare const env: Env;
env.PORT = "3000";    // Error
```

- [More detail on readonly and index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)
- [More detail on readonly properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)

---

### Question 0f37653a-e904-44e8-8819-7c578a648969

- How do you model optional methods that a class may implement?

### Answer

- Declare `greet?(): void` — the class may omit it, and callers must handle `undefined`.
- Under `strictNullChecks`, calling `obj.greet()` errors; call `obj.greet?.()`.
- Optional methods are common in plugin/lifecycle interfaces where only some hooks are implemented.

```ts
interface Plugin { setup?(): void }
declare const p: Plugin;
p.setup?.();
```

- [More detail on optional properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)
- [More detail on optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

---

### Question 42da1748-6019-40a5-b4e3-c56ec6b0b59a

- What is the "excess property check" behavior difference between an interface and a type alias with an index signature?

### Answer

- Neither interface nor alias allows extra keys on **fresh object literals** unless an index signature exists.
- Adding `[k: string]: unknown` disables the check for that literal but also erases typo detection and forces declared props to be assignable to it.
- So "allow extra keys" is a real trade-off, not free flexibility.

```ts
interface Strict { id: string }
const a: Strict = { id: "1", extra: true };       // Error

interface Open { id: string; [k: string]: unknown }
const b: Open = { id: "1", extra: true };         // OK
```

- [More detail on excess property checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)
- [More detail on index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)

---

### Question 450daabe-f771-4e08-bf08-088d6f860bb9

- How do generic interfaces work, and what is a common misuse?

### Answer

- `interface Box<T> { value: T }` parameterizes the shape; the type argument can have defaults and constraints.
- Common misuse: putting `any`/unconstrained `T` in public APIs, which spreads like `any` and gives poor errors.
- Another: using a generic interface for a fixed type (`Box<string>`) where a plain interface would be simpler.

```ts
interface Api<T> { data: T; status: number }
type UserApi = Api<User>;
```

- [More detail on generic interfaces](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-interfaces)
- [More detail on generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)

---

### Question 7303e020-6b55-4470-b584-74f3845b564f

- What is the interface-segregation view of "one big interface" and how does TS help you avoid it?

### Answer

- A large interface forces every implementer to satisfy members they may not need; small, focused interfaces compose better.
- TS makes splitting cheap because structural typing means a class already satisfies any subset interface it matches — no `implements` needed.
- Composition via `extends A, B` or `A & B` keeps readers seeing an explicit contract.

```ts
interface Reader { read(): string }
interface Writer { write(s: string): void }
type IO = Reader & Writer;
```

- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)
- [More detail on intersections](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)

---

### Question f55bd14c-7474-43f2-8c43-555160ec74ae

- How do you require **at least one** property from a set in an interface?

### Answer

- An interface cannot express "one of"; use a union of interfaces with `never`-typed alternatives for the rest.
- For "one or more fields" over a known key set, a distributive helper over `keyof T` builds the union.
- An index signature is not the answer: it requires every declared property to match the index type and permits typos.

```ts
type RequireOne<T, K extends keyof T> = { [P in K]-?: Required<Pick<T, P>> & Partial<Omit<T, P>> }[K];
interface Contact { email: string; phone: string }
const a: RequireOne<Contact, keyof Contact> = { email: "a@b.c" }; // phone optional here
```

- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
