# TypeScript Generics

### Question e04d5cbd-932c-46bc-b982-34869bf736c8

- What problem do generics solve that `any` does not?

### Answer

- Generics **preserve the relationship** between input and output types: `identity<T>(x: T): T` returns the exact input type.
- `any` erases the information, so the return value is `any` and downstream code is unchecked.
- A generic function is like a function at the type level: the caller supplies (or the compiler infers) the type argument.

```ts
function id<T>(x: T): T { return x; }
const n = id(1);            // 1 (literal preserved)
const s = id("a");          // "a"
```

- [More detail on Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question 9e5cf412-8324-4305-9aa5-851733f3ee16

- How does type argument inference work for `function first<T>(xs: T[]): T`?

### Answer

- TS infers `T` from the **argument's element type**; `first([1, 2])` gives `1 | 2` if the array is a tuple/`as const`, `number` for a normal literal.
- Inference can fail (relations are cyclic, many candidates) and fall back to `unknown`, `{}`, or an error.
- Callers can always override with an explicit type argument: `first<string>(xs)`.

```ts
function first<T>(xs: T[]): T | undefined { return xs[0]; }
const n = first([1, 2, 3]); // number | undefined
```

- [More detail on generic inference](https://www.typescriptlang.org/docs/handbook/2/generics.html#using-type-parameters-in-generic-constraints)
- [More detail on type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question a37a81d1-10c8-490e-b95d-b979d4e738b5

- What is a generic constraint and when do you need one?

### Answer

- `T extends C` restricts `T` to types assignable to `C`, so the body may use `C`'s members.
- Without a constraint the body can only use operations valid for every type (assignment, identity).
- Constraints improve errors too: callers get "does not satisfy the constraint" instead of a body-level complaint.

```ts
function len<T extends { length: number }>(x: T): number { return x.length; }
len("abc"); len([1]); len({ length: 1 });
```

- [More detail on Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 279667b5-1df7-409b-9576-c6cc72b4fc1f

- Why does `function get<T>(obj: T, key: keyof T)` fail to infer `T`'s keys usefully in some calls?

### Answer

- Inference for `T` is driven by `obj`; `keyof T` then accepts any key of that type, but the **return type** is the union of all property types unless the key is also generic.
- Add a second parameter `K extends keyof T` so the return type tracks the specific key: `T[K]`.
- That pattern is the standard type-safe property getter.

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
const n = get({ a: 1 }, "a"); // number
```

- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question 00aeb8a4-5cf6-4697-a3bb-7bb836bfb63a

- What are default type parameters and what is the ordering rule?

### Answer

- `interface Box<T = string>` provides a default used when no argument is given and inference finds none.
- Parameters **with** defaults may be followed by required ones only if the required ones have defaults too; defaults are like function default parameters.
- A default may reference earlier type parameters: `<T, K extends keyof T = keyof T>`.

```ts
interface Api<T = unknown> { data: T }
type AnyApi = Api; // Api<unknown>
```

- [More detail on Generic Parameter Defaults](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults)
- [More detail on generic interfaces](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-interfaces)

---

### Question 56756566-c05b-4abf-bed7-2fde24bbf877

- How do you write a generic arrow function in a `.tsx` file?

### Answer

- `<T>(x: T) => x` parses as JSX; add a trailing comma: `<T,>(x: T) => x`, or use `extends unknown`/`function` syntax.
- This is the most common generics gotcha in React codebases.

```tsx
const id = <T,>(x: T): T => x;
const id2 = <T extends unknown>(x: T): T => x;
```

- [More detail on generic arrow functions](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)

---

### Question d8d0a188-92a0-49e6-a398-179f94f0d006

- What is a generic class and how does it relate to a generic interface?

### Answer

- `class Box<T> { constructor(public value: T) {} }` carries `T` through fields, methods, and the constructor type.
- A generic interface can be implemented by a generic class, but the class's own type parameter must satisfy the interface's constraints.
- `typeof Box` is not itself generic in the same way — the instance type is; use instantiation expressions for specialized constructors.

```ts
class Stack<T> { #items: T[] = []; push(i: T) { this.#items.push(i); } }
const s = new Stack<number>(); // T inferred as number
```

- [More detail on Generic Classes](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-classes)
- [More detail on instantiation expressions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#instantiation-expressions)

---

### Question 92b30f53-0c33-46ac-9f76-16159ae6b03c

- What does a `const` type parameter (`<const T>`) change?

### Answer

- Added in TS 5.0: it makes inference behave as if the argument were `as const`, keeping literal values and readonly/tuple structure without a call-site assertion.
- Applies to functions, classes, and methods; can be combined with constraints/defaults.
- Removes the need for callers to write `as const` on every generic call.

```ts
function tuple<const T extends readonly unknown[]>(...args: T): T { return args; }
const t = tuple("a", 1); // readonly ["a", 1]
```

- [More detail on const type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)
- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

---

### Question 613ffd83-30e6-46fa-b498-e0ed0535ec6f

- What are variance annotations (`in`/`out`) on type parameters?

### Answer

- Added in TS 4.7: `out T` marks a parameter covariant (used in outputs only), `in T` contravariant (inputs only).
- They are used when TS cannot infer variance structurally — mainly for TS-only type aliases over function types — and affect assignability checks.
- `in out T` (or no annotation) means invariant; annotating an actually-invariant parameter helps the compiler and documents intent.

```ts
interface Producer<out T> { get(): T }
interface Consumer<in T> { set(value: T): void }
```

- [More detail on variance annotations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#optional-variance-annotations-for-type-parameters)
- [More detail on variance](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 5968a78b-8e92-4108-8b50-f6dd80a1bfc6

- When does using a generic make an API worse?

### Answer

- When the type parameter appears only once or is unconstrained: it adds an inference variable without adding relationships.
- When callers always pass the same explicit type argument: a concrete type would be simpler.
- Heuristic: a second use of `T` in the signature is what makes it earn its keep.

```ts
function log<T>(x: T) {}       // T used once → just use unknown
function pick<T>(o: T, k: keyof T): T[keyof T] {} // T used twice → keep
```

- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question b064e84c-0cdd-4fe4-a5a1-e256d913be64

- What is a generic constraint that references another type parameter, and where is it common?

### Answer

- `<T, K extends keyof T>` constrains `K` to `T`'s keys; the value of `T` must be inferred before `K` can be checked.
- Common in property accessors, form libraries, and state selectors — any "get part of an object by key" API.
- Because constraints resolve left to right, put the base parameter first.

```ts
function set<T, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value };
}
```

- [More detail on generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

---

### Question eed57c3b-f78b-4d79-87e0-8c05f7ffeee9

- How does generic inference treat object literals passed as arguments?

### Answer

- Literal properties **widen** during inference (the fresh literal is not kept literal unless `as const` or a `const` type parameter is used).
- Excess property checks still apply to the literal at the call site.
- Tuple/array literals widen to arrays unless the parameter is constrained to `readonly unknown[]` with a `const` type parameter.

```ts
function keep<T>(x: T): T { return x; }
const a = keep({ kind: "a" }); // { kind: string }
```

- [More detail on literal inference](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [More detail on Excess Property Checks](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)

---

### Question c9322772-b342-46a9-a40a-94141cc7e711

- What does `T extends object` accept that `T extends Record<string, unknown>` does not?

### Answer

- `object` accepts arrays, functions, and class instances without index signatures.
- `Record<string, unknown>` requires a string index signature, so most interfaces/classes fail to satisfy it.
- For "any non-primitive", use `object`; for "arbitrary plain key/value map", use `Record<string, unknown>`.

```ts
function f<T extends object>(x: T) {}
f([1]); f(() => {}); f(new Date());

function g<T extends Record<string, unknown>>(x: T) {}
g({ a: 1 });      // OK
f(new Map()); g(new Map()); // Map is not assignable to Record
```

- [More detail on the object type](https://www.typescriptlang.org/docs/handbook/2/functions.html#object)
- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)

---

### Question 51ac7c44-a8ea-4d32-ae81-111c64c2aaf9

- Why does an explicit type argument sometimes make an error go away when inference failed?

### Answer

- Explicit arguments skip inference, so the compiler no longer needs to find a candidate; it checks assignability directly instead.
- This often reveals the real problem (the argument is genuinely incompatible) rather than fixing it.
- If the explicit argument is wrong, you get a clearer error pointing at the actual mismatch.

```ts
first<string>([1, 2]); // Error: number[] not assignable to string[]
```

- [More detail on generic inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 81f558d2-2adc-40cc-9d15-8d9c0f84cce7

- How do generic functions interact with function overloads?

### Answer

- Each overload can declare its own type parameters; overloads are resolved before inference of the implementation.
- Type parameters from different overloads are independent — the caller only sees the selected signature.
- If a generic overload is placed before a non-generic one, it may capture calls you meant for the later signature.

- [More detail on function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 0fe06273-57b2-46d3-b848-b5dae922a1a4

- What does `NoInfer<T>` solve in generic API design?

### Answer

- Without it, the compiler infers `T` from **every** position, so a default/fallback argument can widen `T` unexpectedly.
- `NoInfer<T>` (TS 5.4) excludes a position from inference, so only the primary argument determines `T`.
- This avoids needing multiple type parameters just to isolate inference sources.

```ts
function withDefault<T>(value: T | undefined, fallback: NoInfer<T>): T {
  return value ?? fallback;
}
withDefault("a", "b"); // T = string, not "a" | "b"
```

- [More detail on NoInfer](https://www.typescriptlang.org/docs/handbook/utility-types.html#noinfertype)
- [More detail on inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 862d7179-29c9-49b6-a37f-df7064c92ad4

- What is the difference between a generic **parameter** and a generic **argument**?

### Answer

- The parameter is the declared name inside the definition (`<T>`); the argument is the concrete type supplied at the use site (`Map<string, number>`).
- TS usually infers arguments from values; explicit arguments are written in angle brackets.
- Error messages use the distinction: "Type 'X' does not satisfy the constraint 'Y'".

- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html#working-with-generic-type-variables)
- [More detail on inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 59697c3b-ba8b-4796-93d2-00eee4647ac9

- How do you constrain a generic function to keep the caller's specific literal type in the result?

### Answer

- Constrain the parameter so TS keeps the literal: `K extends string` plus a `const` type parameter, or make the parameter a generic object.
- Returning `T`/`T[K]` preserves it; returning a widened primitive loses it.
- `as const` at the call site remains the universal fallback.

```ts
function key<K extends string>(k: K): K { return k; }
const k = key("mode"); // "mode"
```

- [More detail on literal inference](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on const type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)

---

### Question d450b77c-3451-467d-8cca-45a55bede0a9

- What are generic defaults used for in React-style component props?

### Answer

- A component that renders one item of unknown type defaults the generic: `interface ListProps<T = unknown> { items: T[] }`.
- Consumers then get inference from props while the component can still be referenced without a type argument.
- This avoids `any` while keeping the type reusable in generic containers.

```ts
interface ListProps<T = unknown> { items: T[]; render: (item: T) => React.ReactNode }
```

- [More detail on generic parameter defaults](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults)
- [More detail on React with TypeScript](https://react.dev/learn/typescript)

---

### Question 76f8c066-3e71-4d66-8847-8ee6a8072a86

- What is a recursive generic type constraint and what limits exist?

### Answer

- A type parameter can reference itself: `type Tree<T> = { value: T; children: Tree<T>[] }`, or via an interface.
- Recursive **constraints** (`T extends Comparable<T>`) are common for operators/builders.
- TS limits instantiation depth; deep recursion yields "Type instantiation is excessively deep and possibly infinite".

```ts
type Comparable<T> = { compareTo(other: T): number };
```

- [More detail on recursive types](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on performance](https://github.com/microsoft/TypeScript/wiki/Performance)

---

### Question 93c70547-4556-4416-b850-9777d8ff92f1

- How does a generic type alias differ from a generic interface?

### Answer

- Aliases can be generic over any type shape, including unions and primitives: `type Maybe<T> = T | null`.
- Interfaces can be generic object shapes, support declaration merging, and can be extended with `extends`.
- Both erase identically and are interchangeable for object shapes.

```ts
type Pair<T> = [T, T];
interface Box<T> { value: T }
```

- [More detail on generic types](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-types)
- [More detail on interface vs type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

---

### Question 9c4315da-f397-43de-a283-a9b76a1de91b

- What is an instantiation expression and when does it replace a wrapper function?

### Answer

- `fn<string>` as a value substitutes type arguments once and yields an already-instantiated function (TS 4.7).
- Useful for passing a specialized generic function where a non-generic callback is expected.
- A wrapper `(x) => fn<string>(x)` is equivalent, just noisier.

```ts
function parse<T>(s: string): T { return JSON.parse(s); }
const parseUser = parse<User>; // (s: string) => User
```

- [More detail on instantiation expressions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#instantiation-expressions)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 43b36cfa-9574-42b0-a19d-de2eeeb8c521

- Why can a generic type parameter not be used with `new`, property access, or operators without a constraint?

### Answer

- `T` could be any type, including primitives, so no operation is universally valid.
- A constraint adds the capabilities you need: `T extends { id: string }` permits `x.id`.
- This is why "T is unused except for identity" functions have empty bodies of real logic.

```ts
function id<T>(x: T): T { return x; } // no members available on x
function nameOf<T extends { name: string }>(x: T) { return x.name; }
```

- [More detail on generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)
- [More detail on type parameters](https://www.typescriptlang.org/docs/handbook/2/generics.html#working-with-generic-type-variables)

---

### Question 4bf37d32-c82b-4115-a4fe-998133d79537

- How do you use generics with a class hierarchy to type a repository pattern?

### Answer

- Parameterize the base on the entity type and the key type, then let concrete repos fix the arguments.
- Abstract methods use those parameters, so implementations cannot drift from the contract.
- Keep the generic surface small; add a second parameter only if it is genuinely used in multiple positions.

```ts
abstract class Repo<T, Id = string> {
  abstract find(id: Id): Promise<T | null>;
  abstract save(entity: T): Promise<void>;
}
class UserRepo extends Repo<User, number> { /* ... */ }
```

- [More detail on generic classes](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-classes)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 7aeb4f6f-2a40-44ed-8fc4-9533ae8c0a55

- What does `T extends any` do in a conditional type versus an `any` constraint in a function?

### Answer

- In a **conditional type**, `T extends any ? X : Y` triggers distribution and is used as an identity/normalization idiom.
- In a **function constraint**, `T extends any` constrains nothing and just disables implicit-any for the parameter.
- Both are mostly code smells unless distribution is exactly what you need.

```ts
type Dist<T> = T extends any ? [T] : never; // distribute union members
```

- [More detail on distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question e219b4d6-6ffe-4d90-884a-428f5a7a8570

- How do generic functions handle optional and rest parameters?

### Answer

- Optional parameters propagate as optional tuple elements in `Parameters<T>`; rest parameters become trailing rest tuple elements.
- Generic `...args: T` with `T extends unknown[]` preserves the whole argument tuple across forwarding wrappers.
- This is why wrapper functions (debounce, bind, memoize) can be written without losing types.

```ts
function debounce<F extends (...a: any[]) => void>(fn: F) {
  return (...args: Parameters<F>) => fn(...args);
}
```

- [More detail on variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)
- [More detail on Parameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype)

---

### Question 0dee9f46-1845-4c63-ad25-6fda84e601eb

- What is the difference between a generic type and a type alias for a specific instantiation?

### Answer

- `Box<T>` is reusable and yields different types per argument; `Box<string>` is a single concrete type.
- `typeof`/`InstanceType`/`ReturnType` make concrete instantiations from generic declarations, which is often more readable at call sites.
- Prefer concrete aliases (`type UserBox = Box<User>`) when a specific instantiation repeats.

```ts
class Box<T> { constructor(public value: T) {} }
type UserBox = Box<User>;
```

- [More detail on generic types](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-types)
- [More detail on InstanceType](https://www.typescriptlang.org/docs/handbook/utility-types.html#instancetypetype)

---

### Question 6fab9a9b-53f0-4151-bb09-0038aee8e19b

- Why do generic errors often mention a type you never wrote?

### Answer

- Inference resolved your call to an internal type (a constraint default, an intersection, or an expanded object type) and the error reports that.
- Reading errors: start at the innermost message, then look for the generic that introduced the type.
- Explicit type arguments or intermediate aliases usually make the error legible.

- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

### Question 7122382c-6901-4a5d-af0e-6b43655db9ba

- How do you express "the same type as the input" in a static method?

### Answer

- Parameterize the class/static method and return that parameter: `static from<T>(value: T): Box<T>`.
- Avoid returning `Box<any>` or `Box<unknown>`, which erase the relationship.
- For derived-class-aware factories use the polymorphic `this` type in statics instead.

```ts
class Box<T> {
  constructor(public value: T) {}
  static of<T>(value: T) { return new Box(value); }
}
```

- [More detail on generic classes](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-classes)
- [More detail on this types](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)

---

### Question f9ef8323-dbbe-4a84-a42c-45a75678853a

- What is a branded generic type and why combine branding with generics?

### Answer

- A brand is a phantom property carrying a string literal; combined with generics, one implementation backs several nominal types.
- The generic factory stamps the brand, and consumers cannot mix the branded types structurally.

```ts
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };
type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;
```

- [More detail on branded types](https://www.typescriptlang.org/play)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 07b3c81d-d515-4cc5-b94f-d0fbc8387e15

- Why can a generic function not be partially applied at the type level (e.g. `fn<T>`)?

### Answer

- TS has no first-class "type lambda"; a generic function value cannot be handed over with one parameter fixed unless it is an **instantiation expression** or wrapper.
- Instantiation expressions (`fn<string>`) substitute all parameters at once.
- For partial application, use a wrapper function or a generic type alias that fixes the parameter.

```ts
const wrap = <T>(f: (x: T) => T) => f; // partial-ish via currying
```

- [More detail on instantiation expressions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#instantiation-expressions)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
