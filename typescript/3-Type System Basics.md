# TypeScript Type System Basics

### Question 3668ff5d-5025-4856-b950-a7a95caf1545

- Which types are primitives in TypeScript, and what separates them from non-primitives?

### Answer

- Primitives: **`string`**, **`number`**, **`boolean`**, **`null`**, **`undefined`**, **`symbol`**, **`bigint`**.
- A primitive is immutable and compared by value; non-primitives (`object`, array, function, `Map`, `Set`, class instance) are references compared by identity.
- The wrapper types `String`, `Number`, `Boolean` are object interfaces — not the same types as `string`, `number`, `boolean`.

```ts
const a: string = "hi";
const b: String = "hi"; // allowed (boxing), but b is NOT assignable to `string`
```

- [More detail on Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [More detail on JS data types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures)

---

### Question c3f56166-fc4a-45be-abb3-4ec529a1db49

- Why does TypeScript have no `int`, `float`, `double`, or `char` types?

### Answer

- TypeScript types describe **JavaScript runtime values**, and JS has exactly one numeric primitive: `number` (IEEE-754 double).
- `number` covers integers, floats, `NaN`, `±Infinity`, and reports no overflow or precision errors at compile time.
- Use **`bigint`** when you need arbitrary-precision integers; it is a separate type with no implicit conversion to `number`.

- [More detail on number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [More detail on Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

---

### Question 6ff5b571-2a49-432e-8d1b-346e4ab3792e

- What is the difference between `number` and `Number` (and `string` vs `String`)?

### Answer

- Lowercase **`number`/`string`** are the primitive types; capitalized **`Number`/`String`** are the wrapper-object interfaces.
- Primitive values are auto-boxed only for property access, so `const n: Number = 1` compiles, but `const n: number = new Number(1)` is an error.
- Rule: always use the lowercase forms; capital forms appear in `.d.ts` and generic constraints like `T extends object`.

- [More detail on TypeScript object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on JS wrapper objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

---

### Question 82a5054f-9c98-4ab6-b115-353e315f3d51

- What does `strictNullChecks` change about `null` and `undefined`?

### Answer

- **Off:** `null` and `undefined` are assignable to every type, so missing values silently pass type checking.
- **On (part of `strict`):** they are excluded from every type and must be added explicitly: `string | null`.
- With it on, TS forces you to narrow before use, which is why optional chaining and `??` became the default style.

```ts
// strictNullChecks: true
let name: string = null;        // Error
let name2: string | null = null; // OK
```

- [More detail on strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)
- [More detail on null and undefined](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#null-and-undefined)

---

### Question 3ceae7cd-617e-4ffb-b2ea-4ec14ed1d3ac

- What does the `void` return type mean, and when would you use it instead of `undefined`?

### Answer

- **`void`** means "caller must ignore the return value"; **`undefined`** means the function must return `undefined` on every path.
- Use `void` for side-effect functions and callbacks (`onClick`, `forEach`) where the return value is irrelevant.
- `Promise<void>` means the promise resolves, but the resolved value carries no data.

```ts
function log(msg: string): void {}
function fail(): undefined { return undefined; }
```

- [More detail on void](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)
- [More detail on Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

---

### Question 53fe53d8-dbc2-4846-b1a2-3e22b92ecb9a

- Why does `const f: () => void = () => 42` compile, and what does that rule enable?

### Answer

- Assignability to a **`void`-returning** function type ignores the source function's return type.
- Without this special rule, every callback passed to `forEach`, `addEventListener`, or a callback prop would have to be typed exactly.
- The caller may only rely on `void`, so the returned `42` is intentionally unusable at the call site.

```ts
type Cb = () => void;
const f: Cb = () => 42;        // OK
const x: number = f();         // Error: void is not assignable to number
[1, 2].forEach((n) => n + 1);  // OK: number-returning callback in void context
```

- [More detail on return-type void](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)
- [More detail on Assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question e93c5ee3-94fd-4e5b-b874-1201dc6d5598

- What is the `never` type and where does it show up in real code?

### Answer

- **`never`** is the bottom type: the set of values is empty, so nothing is assignable to it, but it is assignable to everything.
- It appears when a function cannot return normally: it always throws or loops forever.
- It also appears after exhaustive narrowing, which makes it the standard exhaustiveness check in `switch`/`if` chains.

```ts
function assertNever(x: never): never { throw new Error("unhandled: " + x); }
```

- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)
- [More detail on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)

---

### Question 1df851c1-cde0-4220-be36-b2475f80932c

- How does `never` give you a compile-time exhaustiveness check?

### Answer

- Narrow a discriminated union member by member; the default branch then holds the **remaining** union.
- If all members were handled, the remaining type collapses to **`never`**, so a `never`-typed parameter accepts it.
- Add a new union member later and the default branch stops compiling — that is the point: the compiler lists where you forgot to update.

```ts
type Shape = { kind: "circle" } | { kind: "square" };
function area(s: Shape) {
  switch (s.kind) {
    case "circle": return 1;
    case "square": return 2;
    default: const _exhaustive: never = s; return _exhaustive;
  }
}
```

- [More detail on exhaustive checks with never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [More detail on Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

### Question 5d498af6-398c-4644-b105-eda8a276413a

- `any` vs `unknown`: which one should receive an unvalidated JSON payload, and why?

### Answer

- **`unknown`**: you must narrow or validate before using it, so the compiler keeps the unsafety visible.
- **`any`**: every operation is allowed and produces more `any`, so a typo like `data.user.nmae` never errors.
- Pattern: parse to `unknown` at the boundary, validate with a schema, then hand out a precise type.

```ts
const data: unknown = JSON.parse(raw);
// data.name        // Error until narrowed
const name = (data as { name: string }).name; // explicit, auditable assertion
```

- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [More detail on any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)

---

### Question 1ba08e86-ec18-41a8-8865-96a2452f0173

- Why does `any` "contaminate" the rest of the codebase?

### Answer

- `any` is **assignable both ways**, so it silently satisfies any parameter or return type.
- Operations on it return `any`: `any.foo`, `any[0]`, `any + 1`, `JSON.parse` results that were cast — the unsafety spreads one call at a time.
- A single `any` at a boundary frequently defeats type checking across whole call chains; `unknown` stops the spread at the boundary.

```ts
declare const config: any;
const port: number = config.server.port; // no error, may throw at runtime
```

- [More detail on any](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)
- [More detail on noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny)

---

### Question 40f87679-98cf-4530-bbe8-1da6dff8737e

- What is the difference between `object`, `{}`, and `Object`?

### Answer

- **`object`** — any non-primitive value: `{}`, arrays, functions, class instances. Not `string`, `number`, `boolean`.
- **`{}`** — any value that is not `null`/`undefined`, including primitives (`const x: {} = "hi"` is legal).
- **`Object`** — almost everything, because primitives are boxed; only `null`/`undefined` are rejected under `strictNullChecks`.

```ts
const a: object = [];        // OK
const b: object = "hi";      // Error
const c: {} = "hi";          // OK
```

- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on the object type](https://www.typescriptlang.org/docs/handbook/2/functions.html#object)

---

### Question 48c512c1-9722-4a71-81fc-b525be2c7c28

- Is `unknown` a top type, and how does it differ from `any` in the type lattice?

### Answer

- Both **`any`** and **`unknown`** are top types: every value is assignable to them.
- They differ in the other direction: `unknown` is assignable only to `unknown`/`any`, while `any` is assignable to everything.
- `never` is the bottom type counterpart: assignable to everything, nothing assignable to it.

- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)

---

### Question daf04203-6284-4e2f-b83b-73345d56b9ee

- Are tuples fixed-length at runtime?

### Answer

- **No.** Tuples are a compile-time contract over a normal array; runtime length and element types are unchecked.
- A `[string, number]` value is still an array: `push("extra")` type-errors, but a cast or `any` value bypasses that, and the array can be mutated at runtime.
- Use `readonly` tuples plus runtime validation when the tuple crosses a trust boundary (API response, `JSON.parse`).

```ts
const pair: [string, number] = ["a", 1];
(pair as any).push("boom"); // runtime length is now 3, types say 2
```

- [More detail on Tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question dd70004d-0360-431c-b1a8-b3861cce50d5

- What survives compilation after `tsc` erases types?

### Answer

- All annotations, `type` aliases, `interface` declarations, and generic parameters are **erased** — they do not exist at runtime.
- Code with runtime meaning is emitted: classes, non-const `enum`s, decorators (with legacy emit), parameter property initializers, `namespace`s.
- Consequence: there is no `typeof`/`instanceof` check for interfaces or unions; runtime validation must be written or generated (Zod, io-ts, hand-written guards).

```ts
interface User { name: string }
// emits nothing

enum Role { Admin } // emits an object
```

- [More detail on erased types](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on enum runtime output](https://www.typescriptlang.org/docs/handbook/enums.html)

---

### Question e9d104d1-1e0c-4ce6-93f2-5a88773805bc

- Why do you need `unique symbol` before a symbol can act as a literal type?

### Answer

- The `symbol` type is a primitive type but **not a unit type** — every `Symbol()` call has the same type `symbol`.
- A `const`-declared symbol is inferred as **`unique symbol`**, a type with exactly one value, which is what lets it key a type:

```ts
const KEY = Symbol("key");       // typeof KEY is unique symbol
interface S { [KEY]: number }    // computed key from a unique symbol
declare const s: symbol;
interface Bad { [s]: number }    // Error: index signature must be a unique symbol
```

- [More detail on unique symbol](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#symbol)
- [More detail on Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)

---

### Question 7cd086b8-a985-47d6-a7be-e6b474b44943

- TypeScript is structurally typed — what does that mean for two identical interfaces?

### Answer

- TS compares **shapes**, not declaration names: two unrelated interfaces with the same members are mutually assignable.
- The exceptions are nominal: class members declared `private`/`protected` are only compatible when they originate from the same declaration.
- Branded/opaque types work by adding a phantom property to defeat structural matching:

```ts
interface A { id: string }
interface B { id: string }
const a: A = { id: "1" };
const b: B = a; // OK — structural

type UserId = string & { readonly __brand: "UserId" };
```

- [More detail on Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [More detail on nominal typing with brands](https://www.typescriptlang.org/play)

---

### Question 9fbc7db2-2881-4001-abe4-6ebf1f4e02e2

- Why does an object literal fail excess property checking while a variable with the same shape passes?

### Answer

- Assigning a **fresh object literal** triggers excess property checks: unknown keys are rejected even if the target type only requires a subset.
- Assigning through an intermediate **variable** skips the freshness check, because normal structural assignability applies.
- Practical uses: catch typos early; deliberately widen by assigning to an intermediate variable (or index-signature your config type).

```ts
interface Opts { mode: string }
const opts: Opts = { mode: "a", extra: 1 };        // Error: 'extra' does not exist

const tmp = { mode: "a", extra: 1 };
const opts2: Opts = tmp;                            // OK
```

- [More detail on Excess Property Checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)
- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

---

### Question 4fb9252b-aa7f-4b84-9bae-4ae0d6ece744

- Why is `NaN` typed as `number`, and what does that imply for comparisons?

### Answer

- `typeof NaN === "number"`, and TS follows runtime semantics: `NaN` is a `number` value.
- `NaN` is not equal to itself, so `x === NaN` is always `false` at runtime — the compiler will not warn you.
- Use `Number.isNaN(x)` for a NaN check; `number` also includes `±Infinity`, so arithmetic can silently produce non-finite values.

```ts
const x = 0 / 0;       // number
x === NaN;             // false
Number.isNaN(x);       // true
```

- [More detail on Number.isNaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN)
- [More detail on number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

---

### Question d828a391-9baa-4728-b77f-514e6d543b62

- What does `bigint` require, and why can't you mix it with `number`?

### Answer

- Literals use the `n` suffix (`100n`) or `BigInt("100")`, and you need `target`/`lib` at **ES2020** or later — otherwise TS reports "BigInt literals are not available".
- Mixing `bigint` and `number` in arithmetic is an error; there is no implicit conversion in either direction.
- Convert explicitly: `Number(bigintValue)`, and expect precision loss above `Number.MAX_SAFE_INTEGER`.

```ts
1n + 1;                    // Error: operator '+' cannot be applied to '1' and '1'
BigInt(Number.MAX_SAFE_INTEGER) + 1n; // OK
```

- [More detail on bigint](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#bigint)
- [More detail on BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

---

### Question 258de619-2dac-43b4-8ff4-7012a9df5b4b

- Why do `Map` and `Set` need both generics and a sufficiently modern `lib` setting?

### Answer

- `Map<K, V>` and `Set<T>` are collections whose element types are part of their type, so generics are required: `Map<string, number>`.
- Their declarations live in `lib.es2015.collection.d.ts`; with an old `target`/`lib`, the names do not exist at all.
- A `Map`'s key is typed, but at runtime keys use SameValueZero comparison, so object keys compare by identity.

```ts
const counts = new Map<string, number>();
counts.set("a", 1);
counts.get("b"); // number | undefined
```

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [More detail on lib](https://www.typescriptlang.org/tsconfig#lib)

---

### Question 20d58d07-8834-446b-9501-f750b8a65e21

- How can a class name be used in both type and value position?

### Answer

- The name of a class creates a **value** (the constructor function, usable with `new`) and a **type** (the instance shape).
- `typeof ClassName` gives the constructor/static side type; using `ClassName` directly as a type means instances.
- That split is why `const C: typeof Foo = Foo` works but `const C: Foo = Foo` does not.

```ts
class User { name = ""; static create() { return new User(); } }
let u: User;            // instance type
let c: typeof User = User; // constructor type
c.create();             // statics are visible here
```

- [More detail on Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [More detail on typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

---

### Question e8bfdff8-a1b7-416e-aedd-4364842c698a

- Can an `interface` be used at runtime, for example with `instanceof`?

### Answer

- `interface` lives in the **type space only**; it is erased and produces no runtime value.
- `instanceof` needs a constructor value, so it works with classes, not interfaces.
- To distinguish unions at runtime, use a discriminant property and a type guard function; classes' instance checks also fail across realms/duplicated dependencies.

```ts
interface Animal { kind: "cat" }
declare const a: Animal;
a instanceof Animal; // Error: 'Animal' only refers to a type
```

- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question 3e17a722-d8ec-421f-9028-bb1ca0c3ac13

- Is an array assignable to `object`? Is it assignable to `Record<string, unknown>`?

### Answer

- Arrays are objects: `const o: object = []` is valid.
- `Record<string, unknown>` is a **string index signature**, so an array is not assignable to it (no string index signature is declared), though `Record<number, unknown>` works because arrays have a numeric index signature.
- Use `object` for "some non-primitive" and a concrete shape/`unknown[]` when you need element access.

```ts
const a: object = [1, 2];                       // OK
const b: Record<string, unknown> = [1, 2];      // Error
const c: Record<number, unknown> = [1, 2];      // OK
```

- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)

---

### Question 3dba1c94-0173-4305-a316-cef0903e7554

- What is the difference between `x?: string` and `x: string | undefined`?

### Answer

- `x?: string` means the property **may be absent**; `x: string | undefined` means it must be present but may hold `undefined`.
- With `--exactOptionalPropertyTypes`, that distinction is enforced at both declare and assign sites.
- Without the flag, assigning `undefined` to an optional property is allowed, which is why many codebases enable the flag.

```ts
interface Cfg { mode?: string }
const a: Cfg = {};                       // OK
const b: Cfg = { mode: undefined };      // Error with exactOptionalPropertyTypes
```

- [More detail on exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes)
- [More detail on Optional Properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)

---

### Question c853d7a2-11ac-4fe7-ad6d-880ea05ba6a1

- Does a type assertion (`as`) convert a value at runtime?

### Answer

- **No.** `as T` is erased; it only tells the compiler to trust your claim about a value it cannot verify.
- Assertions are rejected when the types are unrelated (e.g. `"x" as number`), which prevents obvious mistakes.
- `as unknown as T` bypasses that safety; every such line is a potential runtime error and should be justified.

```ts
const s = "42";
const n = s as unknown as number;
n + 1; // runtime: "421", not 43
```

- [More detail on type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
- [More detail on Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

---

### Question 54fa657d-c887-41fb-bf51-d8e2891be95d

- What does the non-null assertion `!` do, and what is the risk?

### Answer

- Postfix `!` **removes** `null`/`undefined` from the type of an expression — no runtime check is emitted.
- If the value is nullish at runtime, you get the failure you were trying to avoid, now with no compiler warning.
- Prefer narrowing (`if (el)`, `??`, optional chaining) or an explicit `throw`; use `!` only where an invariant is guaranteed, e.g. after rendering.

```ts
const el = document.querySelector("#app")!; // trust me
el.textContent = "hi";                        // throws if #app is missing
```

- [More detail on non-null assertion](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator)
- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question 6ee88eb7-43c4-45df-95c9-f1a90d77b2de

- How does function assignability treat parameter counts?

### Answer

- A function with **fewer** parameters is assignable to a type with more — the extra arguments are simply ignored.
- This matches JS call semantics and is why callbacks can ignore the index/array arguments of `Array.prototype.map`.
- Arity order still matters: `(a: number, b: string) => void` is not assignable to `(a: string, b: number) => void`.

```ts
type F = (n: number, i: number) => void;
const f: F = () => {};       // OK, zero params
[1].map(() => 0);            // OK, callback signature may be narrower
```

- [More detail on Assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-function-types)
- [More detail on function types](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)

---

### Question 07a7e257-e9f8-4bee-96cb-7df5c258c541

- How does TypeScript narrow a `string | number` union at runtime?

### Answer

- Narrowing uses control-flow analysis over **runtime checks**: `typeof`, `instanceof`, `in`, `Array.isArray`, equality against literals, and truthiness.
- Inside each branch TS computes the compatible subset of the union, so `x` is `string` in the first branch and `number` in the second.
- Narrowing is local to the flow: reassigning `x` resets the narrowed type.

```ts
function f(x: string | number) {
  if (typeof x === "string") x.toUpperCase();
  else x.toFixed(2);
}
```

- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [More detail on typeof type guard](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#typeof-type-guards)

---

### Question 6631abe6-af5a-4875-a2c5-11ad4f608bdf

- What does `Promise<void>` mean, and when is it the right return type?

### Answer

- It is a promise that **resolves with no meaningful value**; the resolved value must not be consumed.
- Use it for async side effects where callers should only await completion, not read data.
- `Promise<undefined>` is slightly different: assignability requires the resolved value to be `undefined` explicitly.

```ts
async function save(): Promise<void> { await api.put("/doc"); }
await save(); // no value to read
```

- [More detail on Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [More detail on void](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)

---

### Question 39428390-8acb-4ac2-95f1-d5447517844c

- Which TypeScript types have no runtime counterpart at all?

### Answer

- Type-only constructs: **`never`**, **`unknown`**, **`void`**, **`any`**, unions, intersections, generics, and all aliases/interfaces.
- They exist only in the checker's model of your program and vanish from emitted JS.
- So `if (typeof v === "unknown")` is meaningless; the only runtime universe is JS values, and every check must be written against them.

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on types from types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

### Question 2b1b9a20-6fb9-4180-ac36-d06a2d3be443

- Why does `let x = "a"` widen to `string` while `const y = "a"` keeps the literal type `"a"`?

### Answer

- Literal types **widen** when stored in a mutable variable, because the variable can later be reassigned to any `string`.
- `const` bindings cannot be reassigned, so the inferred type stays the literal `"a"` (a unit type).
- Widening can be overridden with an explicit annotation or `as const` for objects/arrays.

```ts
let x = "a";        // string
const y = "a";      // "a"
const z = { k: "a" }; // { k: string } — properties widen
const w = { k: "a" } as const; // { readonly k: "a" }
```

- [More detail on literal widening](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

---

### Question f4ae2854-4226-44b7-8d0f-833e1b3daf80

- Why is `let x: string` without a value legal, but reading it is an error?

### Answer

- An annotation creates a **declared type**, but TS tracks that the variable is *used before assigned* and reports "Variable 'x' is used before being assigned".
- `strictPropertyInitialization` applies the same idea to class fields; definite assignment `!` opts out per field.
- The check is flow-based: assigning in every reachable branch before the first read satisfies it.

```ts
let x: string;
console.log(x); // Error: used before being assigned
x = "ok";
```

- [More detail on definite assignment](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#strict-class-initialization)
- [More detail on strictPropertyInitialization](https://www.typescriptlang.org/tsconfig#strictPropertyInitialization)
