# TypeScript Functions

### Question 4988b245-9a5a-4141-88f0-bd0aff220904

- What is a function type expression and how do you add a property to it?

### Answer

- Syntax is `(param: T) => R` for the call shape; parameter names are documentation only.
- A function value can also carry properties by intersecting with an object type, or by using an interface with a call signature.
- Overloaded function types combine call signatures in one interface.

```ts
type Fmt = { (n: number): string; locale: string };
const f = ((n: number) => String(n)) as Fmt;
f.locale = "en";
```

- [More detail on Function Type Expressions](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)
- [More detail on call signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures)

---

### Question e7034719-98be-45ef-ae04-18063c44a3a6

- How do optional and default parameters differ in the resulting function type?

### Answer

- `b?: number` makes the parameter optional; the callable type is `(a: string, b?: number) => void`.
- `b = 1` infers `number` and also makes it optional; passing `undefined` triggers the default.
- Optional parameters must follow required ones; default-initialized parameters may appear before required ones but callers must pass `undefined` to skip them.

```ts
function g(a = 1, b: string) {}
g(undefined, "x"); // valid but awkward
```

- [More detail on Optional Parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters)
- [More detail on default parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#default-parameters)

---

### Question e861a52f-5544-4ffd-9bca-1e9450a5cdfb

- How do you type rest parameters, and what do they infer as?

### Answer

- `...xs: number[]` makes the parameter an array; `...xs: [string, number]` makes it a tuple with positional requirements.
- Generic rest tuples preserve the full argument list: `<T extends unknown[]>(...args: T)`.
- Rest parameters must be last and cannot be optional.

```ts
function join(sep: string, ...parts: string[]) {}
function bind2<T extends unknown[]>(fn: (...a: T) => void) {}
```

- [More detail on Rest Parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#rest-parameters)
- [More detail on variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)

---

### Question fbb1d988-1bd0-46ba-84ad-583ab7ed920c

- How do you annotate a destructured parameter object with defaults?

### Answer

- Annotate the **whole parameter** with a type, then destructure with defaults in the binding pattern.
- Without an annotation, the destructured members are implicitly `any` (error under `noImplicitAny`).
- Give the parameter a default (`= {}`) when all members are optional so the caller can omit it entirely.

```ts
type Opts = { retries?: number; signal?: AbortSignal };
function req({ retries = 3 }: Opts = {}) {}
req(); req({ retries: 1 });
```

- [More detail on Parameter Destructuring](https://www.typescriptlang.org/docs/handbook/2/functions.html#parameter-destructuring)
- [More detail on default parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#default-parameters)

---

### Question c25a4e11-904d-4166-8347-d7edfdc97432

- Why is `Function` a type you should never use?

### Answer

- `Function` describes "some callable value" with **no parameter or return information**, so calls are unchecked (`any` result).
- It also accepts classes, arrow functions, and overloaded functions indiscriminately.
- Use a concrete call signature (`() => void`, `(e: Event) => void`) or a generic constrained to `(...args: any[]) => any` when truly necessary.

```ts
function run(f: Function) { return f(1, "x"); } // no errors, no safety
```

- [More detail on Function type](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)
- [More detail on call signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures)

---

### Question dc798dc7-d16e-4004-ba13-39792e92ce44

- What are function overloads and why does the implementation signature not appear to callers?

### Answer

- Overloads declare multiple **call signatures** before one implementation signature; callers only see the overload signatures.
- The implementation signature must be compatible with every overload but is not callable from outside, so keep it general (often using a union or `any`).
- This lets a function return different types based on argument shape while keeping the body loosely typed.

```ts
function len(s: string): number;
function len(xs: unknown[]): number;
function len(v: string | unknown[]): number { return v.length; }
```

- [More detail on Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
- [More detail on overload signatures](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html#overloaded-functions)

---

### Question e238282e-6e1d-42b1-8f98-667af826f13b

- How does TypeScript resolve which overload matches a call?

### Answer

- It tries the overloads **top to bottom** and picks the first one that accepts the arguments.
- Order therefore matters: put narrower/more specific signatures first, or a wide early overload swallows later ones.
- If none matches, the error lists all overloads, which is why broad overloads at the bottom give clearer messages.

```ts
function f(x: unknown): string;
function f(x: string): number; // unreachable for string callers
function f(x: unknown) { return x; }
const n = f("a"); // string — first overload won
```

- [More detail on overload resolution](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html#overloaded-functions)
- [More detail on Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question b8720d11-bd8f-4987-82bd-2ece2e4db473

- Why is a single union-typed parameter sometimes better than overloads?

### Answer

- A union parameter is **checked once**, works with generics, and produces a single readable signature.
- Overloads multiply signatures, are order-sensitive, and their implementation signature is invisible — easy to get subtly wrong.
- Pick overloads when the **return type** depends on which argument type was passed and a conditional return cannot express it; unions + generics handle the rest.

```ts
function parse(s: string): number;
function parse(n: number): string;
function parse(x: string | number): string | number { /* ... */ }
```

- [More detail on unions in parameters](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question 849da036-6323-45e3-b8d7-f89e7e0e5096

- Why does an overload implementation returning `any` cause "no overload matches this call" errors?

### Answer

- Callers only see the overload signatures; if the implementation's logic is wrong, the error appears at the call site, not at the `return`.
- A common failure is an overload that promises `never` or a narrow type while the implementation can return `undefined`.
- Keep the implementation signature in a union or generic and add a runtime check that throws for impossible cases.

- [More detail on Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)
- [More detail on never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)

---

### Question b1962458-b63f-43fd-a044-b422d931ed86

- How do you declare a `this` type for a function?

### Answer

- Add a **fake first parameter** named `this`: `function f(this: Window, e: Event) {}`.
- It affects only type checking and produces no runtime argument; it tells TS what `this` is inside the body.
- It also participates in assignability: only callers whose `this` matches (or a compatible object) can call it.

```ts
function onScroll(this: HTMLElement, e: Event) {
  this.scrollTop; // typed
}
element.addEventListener("scroll", onScroll);
```

- [More detail on this parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#this-parameters)
- [More detail on this typing](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)

---

### Question 5dfc47dc-0f7d-40c4-a03e-14ffd012a40d

- What does `noImplicitThis` catch?

### Answer

- It errors when `this` would implicitly be `any` inside a function — usually a method extracted from its object or a callback using `this`.
- The fix is an explicit `this` parameter, an arrow function (lexical `this`), or binding.
- Without it, `this.anything` compiles and fails at runtime, especially with detaching handlers.

```ts
const obj = { n: 1, get() { return this.n; } };
const g = obj.get;
g(); // Error with noImplicitThis: 'this' implicitly has type 'any'
```

- [More detail on noImplicitThis](https://www.typescriptlang.org/tsconfig#noImplicitThis)
- [More detail on this parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#this-parameters)

---

### Question 5f1cad77-e37a-46b1-aa08-2af93b3f8ea5

- Why do arrow functions avoid `this` bugs that `function` expressions can have?

### Answer

- Arrow functions do not bind their own `this`; they capture the enclosing scope's `this`.
- `function` expressions get a fresh dynamic `this`, which depends on how they are called — often `undefined` under strict mode in callbacks.
- In classes, arrow-function class properties are therefore a common way to keep `this` for handlers (at the cost of per-instance functions).

```ts
class A {
  value = 1;
  inc = () => this.value++; // stays bound when passed as a callback
}
```

- [More detail on arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [More detail on this in classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)

---

### Question d2d830aa-932b-4291-8fbf-607af08e6cab

- How are `call`, `apply`, and `bind` typed, and what does `strictBindCallApply` change?

### Answer

- With `strictBindCallApply` (in `strict`), they are typed against the target function: `apply` takes a tuple of parameters, `bind` returns a function with the bound prefix removed.
- Without it, they accept `any[]` and silently disable checking.
- `.bind` partial application keeps correctness, which makes it useful for event handler factories.

```ts
function f(a: string, b: number) { return a + b; }
const g = f.bind(null, "x"); // (b: number) => string
g(1);
```

- [More detail on strictBindCallApply](https://www.typescriptlang.org/tsconfig#strictBindCallApply)
- [More detail on Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

---

### Question e33ec4c5-b16f-4607-a4ce-5dfc0fc9e7f7

- What is the `ThisType<T>` marker used for?

### Answer

- It is a marker interface that sets the type of `this` inside **methods of an object literal** when the object is assigned to a type containing `ThisType<T>`.
- It exists mainly to support API patterns like Vue/Knockout options objects, and works only with `noImplicitThis`.
- It emits nothing; it is purely a contextual typing aid.

```ts
type Ctx = { data: string[] };
const obj: { list(): void } & ThisType<Ctx> = {
  list() { this.data.push("x"); }, // this: Ctx
};
```

- [More detail on ThisType](https://www.typescriptlang.org/docs/handbook/utility-types.html#thistypetype)
- [More detail on noImplicitThis](https://www.typescriptlang.org/tsconfig#noImplicitThis)

---

### Question d1a21055-1a2a-4cc2-8b9f-e719be5eb92b

- Why is passing a `(x: string) => void` callback where `(x: unknown) => void` is expected an error, but the reverse is fine?

### Answer

- Callback parameters are checked **contravariantly** under `strictFunctionTypes` for function-typed positions: the callback must accept everything the caller may pass.
- A `string`-only callback cannot handle an arbitrary `unknown`, so it is rejected; a callback accepting everything can handle `string`.
- Method syntax is exempt (bivariant), which is a historical unsoundness to preserve DOM/array ergonomics.

```ts
type Cb = (x: unknown) => void;
const a: Cb = (x: string) => {}; // Error
const b: Cb = (x: unknown) => {};
```

- [More detail on strictFunctionTypes](https://www.typescriptlang.org/tsconfig#strictFunctionTypes)
- [More detail on function parameter bivariance](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#function-parameter-bivariance)

---

### Question 4a04a2d9-3986-4942-8a52-6de618c1b783

- What does `noUnusedParameters` enforce and how do you opt a parameter out?

### Answer

- It errors on parameters that are never read, including in callbacks — useful for catching stale signatures after refactors.
- Prefix the unused parameter with `_` (e.g. `_event`) to opt out; TS and most lint rules treat `_` as intentional.
- Rest siblings trick: `[first, ..._rest]` is not a convention, so prefer naming.

- [More detail on noUnusedParameters](https://www.typescriptlang.org/tsconfig#noUnusedParameters)
- [More detail on noUnusedLocals](https://www.typescriptlang.org/tsconfig#noUnusedLocals)

---

### Question 8ecdbd61-580d-40be-8e22-0b41216cdf7c

- What is an assertion function and how does it differ from a type predicate?

### Answer

- `function assert(x: unknown): asserts x is string` throws or returns void and **narrows the caller's variable** after the call.
- A predicate (`x is string`) returns a boolean and narrows inside `if`; an assertion narrows the rest of the enclosing scope.
- Assertion functions must have an explicit `asserts` return annotation; arrow functions assigned to variables can express this type.

```ts
function assertString(v: unknown): asserts v is string {
  if (typeof v !== "string") throw new Error("not a string");
}
declare const u: unknown;
assertString(u);
u.toUpperCase(); // narrowed
```

- [More detail on Assertion Functions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions)
- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

### Question 245bc280-1ee8-4668-b158-34ee78081341

- Why can `assert(x)` shape mismatch cause a compile error at the call site rather than inside `assert`?

### Answer

- The compiler checks that the asserted type is **assignable to to the parameter's declared type**; asserting an unrelated type (`asserts x is number` where `x: string`) is an error.
- It also requires the asserted identifier to be the parameter itself, not an expression or a nested property.
- Design assertions to take `unknown` (or the widest input) and narrow inside.

```ts
function assertNum(x: string): asserts x is number {} // Error: number not assignable to string
```

- [More detail on Assertion Functions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions)
- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

### Question 7d52ee52-b95c-4867-b892-473c901ca711

- How do you type a function whose result is used for chaining (fluent API)?

### Answer

- Return `this` for same-class chaining; return the concrete type for builders that produce new objects.
- In a generic context, `this` means "the receiver's type", which preserves subclass types through chained calls.
- `this` return types are erased at runtime like all types.

```ts
class Query {
  where(_c: string): this { return this; }
  limit(_n: number): this { return this; }
}
const q = new Query().where("a").limit(1); // Query
```

- [More detail on this types](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)
- [More detail on polymorphism in classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)

---

### Question b1a90abb-9b78-47e5-bd12-6c57c47b91b5

- What does `strictFunctionTypes` not check, and where does that bite?

### Answer

- It does **not** apply to method declarations (bivariant exception), and it does not apply to parameters of type `any`/`unknown`.
- It is disabled entirely for constructors and for overloaded call signatures in some positions.
- Bivariance in methods is why assigning a `(x: Dog) => void` method where `(x: Animal) => void` is expected can pass, then fail at runtime with a different subtype.

- [More detail on strictFunctionTypes](https://www.typescriptlang.org/tsconfig#strictFunctionTypes)
- [More detail on function parameter bivariance](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#function-parameter-bivariance)

---

### Question 21192ae3-8d0f-47a6-a496-02d05770daa0

- Why does `fn?.()` not change the return type in the same way as `if (fn) fn()`?

### Answer

- `fn?.()` short-circuits to `undefined` when `fn` is nullish, so the result type becomes `R | undefined`.
- It is the only way to call a possibly-missing function without an assertion; the caller must handle the union.
- For methods, `obj.method?.()` also keeps the `this` binding, unlike extracting the method first.

```ts
declare const fn: (() => number) | undefined;
const x = fn?.(); // number | undefined
```

- [More detail on optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [More detail on strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)

---

### Question 79fa2956-1cd9-4c45-b119-9ecb764b2bba

- Why does an `async` function accepting a callback need care with the callback's return type?

### Answer

- `await` on a callback result forces the caller to accept promises; if the callback type says `void`, awaiting it errors.
- Async functions always return a promise, so a callback typed `() => void` should not be awaited inside.
- Real hazard: unhandled rejections from floating promises — lint with `no-floating-promises` and `await` or `void` them explicitly.

```ts
setTimeout(() => { doAsync(); }, 0);        // floating promise
setTimeout(() => { void doAsync(); }, 0);   // intentional discard
```

- [More detail on Awaited](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype)
- [More detail on floating promises](https://typescript-eslint.io/rules/no-floating-promises/)

---

### Question 09597bff-68d2-4022-ba33-40fcfbf31f32

- What is the type of `setTimeout` in a DOM project vs a Node project, and why does it matter?

### Answer

- DOM lib declares `setTimeout(handler, timeout, ...args): number`; Node declares it returning `NodeJS.Timeout` with extra methods like `unref`.
- If both type sets are loaded, the two declarations conflict and can resolve unexpectedly.
- Store the return value in a variable matched to the environment, and use `ReturnType<typeof setTimeout>` for code shared across environments.

```ts
const id: ReturnType<typeof setTimeout> = setTimeout(() => {}, 100);
clearTimeout(id);
```

- [More detail on setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)
- [More detail on ReturnType](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype)

---

### Question 1f88af56-846d-44e0-bcd6-13a4c5a45b71

- When should you annotate a function with an interface instead of a type alias?

### Answer

- Annotate with an interface when consumers need to **merge/extend** the handler type or when library docs benefit from a named callable contract.
- Aliases are better for unions of function shapes and inline compositions.
- Both erase the same way; the difference is extension/merging and diagnostic presentation.

```ts
interface Handler { (e: Event): void }
type HandlerOrNull = Handler | null;
```

- [More detail on call signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#call-signatures)
- [More detail on type aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)

---

### Question 57aeb7b7-08d7-4d82-9740-e549c5f3b0a6

- What is a "callback with a context" parameter and how do you type `thisArg`?

### Answer

- Many APIs take a `thisArg` parameter; its type should be the `this` type expected inside the callback.
- Instead of typing it explicitly, you can depend on `ThisParameterType<T>`/`OmitThisParameter<T>` to extract or remove it.
- For ordinary libraries, annotate the callback with a `this:` parameter and the arg with the same type.

```ts
function each<T, C>(xs: T[], cb: (this: C, x: T) => void, thisArg: C) {}
```

- [More detail on ThisParameterType](https://www.typescriptlang.org/docs/handbook/utility-types.html#thisparametertypetype)
- [More detail on this parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#this-parameters)

---

### Question 4718a19a-b7cc-46e2-b4b3-ca3ad2bd5197

- How do you type a factory that returns different function shapes based on a literal argument?

### Answer

- Overloads or a conditional return type based on a generic literal: `function make<K extends "a" | "b">(k: K): K extends "a" ? A : B`.
- Conditional return types need the argument to be a literal type — widen with `as const`/`<const K>` (TS 5.0 const type parameters) when inference would widen.
- Overloads are often clearer for two or three variants; conditionals scale better for many.

```ts
function make<K extends "sum" | "count">(k: K): K extends "sum" ? (a: number, b: number) => number : () => number {
  throw new Error();
}
const sum = make("sum"); // (a: number, b: number) => number
```

- [More detail on conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [More detail on const type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)

---

### Question 43141ab7-df26-4c45-b799-142978d7b493

- Why is `function f(): void { return somePromise; }` a bug even though it compiles?

### Answer

- `void`-returning functions accept a returned value, including a promise, and callers ignore it.
- So async errors become **unhandled rejections**, and `await f()` resolves immediately — a classic lost-error bug.
- Prefer explicit `Promise<void>`, or mark intentional discards with `void promise` and lint rule `no-floating-promises`.

- [More detail on return type void](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)
- [More detail on Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

---

### Question 0939824a-a39e-4c5c-8523-e704d16b5983

- Why does `() => ({ ok: true })` need parentheses to return an object literal?

### Answer

- `{ ... }` after `=>` is parsed as a function **body**, so the object is treated as a block and the arrow returns `undefined`.
- Wrapping in parentheses forces expression parsing so the object becomes the return value.
- The inferred return type follows the same rule: with parens it is the object type, without parens it is `void`.

```ts
const a = () => ({ ok: true }); // { ok: boolean }
const b = () => { ok: true };    // void
```

- [More detail on arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions#returning_object_literals)
- [More detail on function types](https://www.typescriptlang.org/docs/handbook/2/functions.html)

---

### Question 249cff9d-f960-45a3-8367-01801416330a

- Why does `["1", "2", "3"].map(parseInt)` produce wrong numbers, and why doesn't TS catch it?

### Answer

- `map` calls the callback with `(value, index, array)`; `parseInt(value, index)` treats the index as the radix, so index 0 means "auto" and index 2 means base 2.
- TS allows it because a function with fewer parameters is assignable to a callback expected to accept more — `parseInt` is `(string, number?)`.
- The type system models arity compatibility, not the semantic mismatch of argument meaning.

```ts
["1", "2", "3"].map(parseInt);   // [1, NaN, NaN]
["1", "2", "3"].map((s) => parseInt(s, 10)); // correct
```

- [More detail on function assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-function-types)
- [More detail on parseInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)

---

### Question 22da30c7-a924-4971-b71e-d88685e199f1

- How do you type a higher-order function that forwards arguments to a wrapped function?

### Answer

- Capture the function type in a generic `F extends (...args: any[]) => any` and reuse `Parameters<F>` and `ReturnType<F>`.
- The wrapper can then keep the exact parameter tuple and return type without `any` in its public signature.
- Adding a `this` parameter requires `ThisParameterType<F>`/`OmitThisParameter<F>`.

```ts
function once<F extends (...args: any[]) => any>(fn: F) {
  let done = false;
  return (...args: Parameters<F>): ReturnType<F> => { done = true; return fn(...args); };
}
```

- [More detail on Parameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype)
- [More detail on variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)
