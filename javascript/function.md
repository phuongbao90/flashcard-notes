# Javascript Functions

### Question d0e680ce-d04f-4fe1-842b-25ceb22ccf0e

- What makes a function "first-class" in JS, and what patterns does that enable that are awkward in languages without it?

### Answer

- **First-class functions** are values: they can be stored in variables, passed as arguments, returned from other functions, and held in data structures.
- This enables callbacks, higher-order functions, factories that return behavior, and function composition without special language syntax.
- Practical consequence: APIs can accept behavior (`.map(fn)`, `setTimeout(fn)`) instead of requiring a class or interface.

```js
const ops = { double: (n) => n * 2, square: (n) => n * n };
[1, 2, 3].map(ops.double);
```

- [More detail on First-class Function](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)
- [More detail on Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)

---

### Question 4aa5cc97-ccf8-4430-aef3-ab67d340588f

- What is a closure? Give the minimal code that proves the inner function captured the variable, not a snapshot of its value.

### Answer

- A **closure** is a function together with the lexical environment it was created in; it keeps referenced outer variables alive after the outer call returns.
- The inner function captures the **binding**, so later mutations are visible.

```js
function counter() {
  let n = 0;
  return () => ++n;
}
const c = counter();
c(); // 1
c(); // 2 — n survived the counter() call
```

- [More detail on Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

---

### Question 0b7fd7ce-4131-449b-b2bf-47b9576437b2

- What are the two rules of a pure function, and why do they matter for memoization and testing?

### Answer

- A **pure function** (1) returns the same output for the same input and (2) has no side effects (no mutation, I/O, or reliance on external mutable state).
- Purity makes memoization sound: the same input can only produce the cached result.
- Pure functions are trivially testable — no setup, no mocks, no cleanup — and safe to run concurrently or reorder.

```js
// pure
const add = (a, b) => a + b;
// impure: depends on external state
let tax = 0.2;
const total = (n) => n * (1 + tax);
```

- [More detail on Keeping Components Pure](https://react.dev/learn/keeping-components-pure)

---

### Question 06922593-3ee1-4718-8ee8-a19270738a5f

- Function declaration vs function expression vs arrow function — what are the real semantic differences beyond syntax?

### Answer

- **Declarations** (`function f() {}`) are fully hoisted: callable before the definition; they also create a named binding in the enclosing scope.
- **Expressions** (`const f = function () {}`) follow the variable's rules: `var` is hoisted as `undefined`, `let`/`const` are in the TDZ until initialized.
- **Arrows** have no own `this`, `arguments`, `super`, or `new.target`, no `prototype` property, and cannot be constructors or generators.
- Function expressions can be named (useful for stack traces) and can be generators/async; declarations can too, but arrows cannot be generators at all.

- [More detail on Defining functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions#defining_functions)
- [More detail on Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

---

### Question 600b239b-2e14-4f13-9ccb-f3a42ea29fbd

- What is a higher-order function, and why are `map`/`filter`/`reduce` HOFs while `Math.max` is not?

### Answer

- A **higher-order function** takes one or more functions as arguments or returns a function.
- `map`, `filter`, and `reduce` receive a callback and delegate per-element behavior to it, so they are HOFs.
- `Math.max` only accepts numbers and returns a number — behavior is fixed, not parameterized.

```js
const twice = (fn) => (x) => fn(fn(x));  // returns a function → HOF
```

- [More detail on First-class Function](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)

---

### Question 6edf5bdc-ef47-46c6-94e2-c2442b7093a5

- How is `this` resolved at call time? List the binding rules in precedence order.

### Answer

- `this` is determined per call, not per definition. Precedence, highest first:
  1. **`new` binding** — `new Fn()` sets `this` to the newly created object.
  2. **Explicit binding** — `fn.call(obj)`, `fn.apply(obj)`, or `fn.bind(obj)`.
  3. **Implicit binding** — `obj.fn()` sets `this` to `obj` (only the last receiver before the dot counts).
  4. **Default binding** — plain `fn()` gives `undefined` in strict mode, `globalThis` in sloppy mode.
- **Arrow functions** ignore all of the above: they capture `this` lexically from the enclosing scope.

- [More detail on `this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

---

### Question 723d2ca1-8d19-41b4-aaad-eb52ead22d8b

- What does this log or throw, and why?
```js
const o = { name: "o", f: () => this.name };
console.log(o.f());
```

### Answer

- The arrow **ignores `o`**: `this` is captured from the enclosing scope, not from the call site.
- In an ES module or strict-mode script, top-level `this` is `undefined`, so this **throws** `TypeError: Cannot read properties of undefined`.
- In a sloppy-mode script, `this` is `globalThis`, so it logs `globalThis.name` (usually `undefined`).
- Fix: use a method shorthand (`f() { return this.name; }`) or a regular function expression.

- [More detail on Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

---

### Question aa6b125a-3d2a-4309-a518-37d9c7f2c92d

- Why does `setTimeout(obj.method, 0)` lose `this`, and what are two fixes?

### Answer

- `setTimeout` stores the function and later calls it as a plain call — `fn()`, not `obj.method()` — so no implicit binding is applied.
- **Fix 1:** bind it: `setTimeout(obj.method.bind(obj), 0)`.
- **Fix 2:** wrap it: `setTimeout(() => obj.method(), 0)`.
- In strict mode the lost `this` is `undefined` and the method typically throws; in sloppy mode it silently targets `globalThis`.

- [More detail on `Function.prototype.bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

---

### Question df930b95-8963-414a-aefd-8c3a2a5934b9

- Trace the output and explain it:
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));
```

### Answer

- Output: `3, 3, 3`. `var` creates **one** binding shared by all iterations; the timers run after the loop finishes, when `i === 3`.
- **Fix 1:** use `let`, which creates a fresh per-iteration binding that each closure captures.
- **Fix 2:** capture the value with an IIFE or a local copy: `((j) => setTimeout(() => console.log(j)))(i)`.

- [More detail on Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

---

### Question bf2bc6b3-6ea6-4c20-93d2-83c92184a388

- How do arrow functions capture `this`, and why does that make them invalid as constructors?

### Answer

- Arrows have **no own `this`**: references resolve to the `this` of the enclosing lexical scope, fixed at creation time.
- They also lack `arguments`, `super`, `new.target`, and a `prototype` property.
- `new` requires an internal `[[Construct]]` method and a `prototype` to build the instance; arrows have neither, so `new (() => {})` throws `TypeError`.

- [More detail on Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

---

### Question 79e3b975-4d92-44a2-8ff1-7c42255ca03a

- Walk through `new Fn()` step by step, including what an explicit `return` does when it returns an object vs a primitive.

### Answer

- Steps: (1) a new empty object is created; (2) its prototype is set to `Fn.prototype`; (3) `Fn` is called with `this` bound to that object; (4) the result is returned.
- If the constructor **returns an object**, that object replaces the new instance.
- If it returns a **primitive** (or nothing), the return is ignored and the new instance is used.

```js
function A() { this.x = 1; return { y: 2 }; }
new A(); // { y: 2 }, no x
```

- [More detail on `new`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)

---

### Question 540e5e97-febe-4726-b854-a7f985434568

- What is `new.target`, and how does a function use it to distinguish `new Fn()` from `Fn()`? What does it evaluate to inside an arrow?

### Answer

- `new.target` is `undefined` on a normal call and references the constructor being invoked when called with `new`.
- It guards "must be called with new" syntax and supports abstract base classes.

```js
function Fn() {
  if (!new.target) throw new TypeError("use new");
}
```

- Inside an arrow, `new.target` is inherited from the enclosing function — arrows never introduce their own.

- [More detail on `new.target`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target)

---

### Question 26199636-22ad-4629-b994-304e4a832745

- Parameters have their own scope. What happens here, and why?
```js
function f(a = b, b = 1) { return a; }
```

### Answer

- Calling `f()` **throws a `ReferenceError`**: default expressions are evaluated left to right at call time, and `b` is still in its **TDZ** when `a`'s default runs.
- Parameter defaults can reference earlier parameters (`function f(a, b = a) {}`) but not later ones.
- The parameter scope is separate from the function body scope, which matters for closures created in defaults.

- [More detail on Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)

---

### Question 5e1916e7-38dc-45fa-9fcb-c04f16d4cf70

- Are default parameter expressions evaluated at definition time or at call time? What changes if the default is `{}`?

### Answer

- Defaults are evaluated **at call time**, but only when the argument is `undefined` (`null` does not trigger the default).
- A fresh object default is created per call, so it is never shared across calls.

```js
function f(opts = {}) { return opts; }
f() === f(); // false — two different objects
```

- [More detail on Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)

---

### Question 135d45e3-abfe-44b2-bce3-229ef41c619a

- `arguments` vs rest params: how do they differ in array-ness, arrow support, and linkage to named params?

### Answer

- `arguments` is an **array-like** (has `length` and indices, and is iterable) but lacks `map`/`filter`; rest params produce a **real array**.
- Rest params work in arrow functions; `arguments` does not exist in arrows (it resolves to the enclosing function's).
- In sloppy mode, `arguments` is linked to named parameters (assigning one updates the other); rest params are always independent copies.

- [More detail on Rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)
- [More detail on `arguments`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments)

---

### Question 29ae5f1a-de7a-4857-8b0d-f9084fb57851

- How does hoisting treat function declarations, `var` function expressions, and `const` function expressions?

### Answer

- **Function declarations** are fully hoisted: the function object exists before the statement executes.
- `var f = function () {}` hoists only the binding as `undefined`; calling before assignment throws `TypeError: f is not a function`.
- `let`/`const` expressions hoist the binding but leave it in the **TDZ**; calling before initialization throws `ReferenceError`.

- [More detail on Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)

---

### Question 0389f62a-2c6e-4c3c-a0fb-24da6c7764e0

- What exactly does `bind` return, and why can a bound function still be invoked with `new`? What does `instanceof` do with it?

### Answer

- `bind` returns a **new bound function** that permanently fixes `this` (and optionally pre-fills leading arguments) without invoking the original.
- When called with `new`, the bound `this` is **ignored**: construction forwards to the target function, and the instance gets `target.prototype`.
- `instanceof` follows the bound function's target, so `new Bound() instanceof Target` is `true`.

- [More detail on `Function.prototype.bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

---

### Question 0a88d938-49a3-4c71-9837-4414dcb10cf5

- `call` vs `apply` vs `bind` — what does each do with `this` and arguments?

### Answer

- `fn.call(thisArg, a, b)` invokes immediately with `this` and a **comma-separated argument list**.
- `fn.apply(thisArg, [a, b])` invokes immediately with `this` and an **array-like** of arguments — useful when args are already in an array.
- `fn.bind(thisArg, a)` does **not invoke**: it returns a new function with `this` (and optional partial args) fixed.

- [More detail on `Function.prototype.call`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
- [More detail on `Function.prototype.apply`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)

---

### Question 9826b569-2a29-4c70-b2cc-5d256d1d1424

- What does an async function always return, and how does a `throw` inside it surface to the caller?

### Answer

- An async function **always returns a Promise**: returned values resolve it, thrown errors reject it.
- A `throw` before the first `await` still becomes a **rejected promise**, not a synchronous throw at the call site.
- Callers must `await` or `.catch()`; otherwise the rejection surfaces as an unhandled rejection.

- [More detail on async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

---

### Question 55e3c46b-4aa8-4523-989d-a58b574307f0

- What state does a generator hold while paused, and what does passing a value to `next(v)` do?

### Answer

- A paused generator keeps its **entire execution context**: local variables, the instruction position, and the try/finally state.
- `next(v)` resumes execution and makes `v` the **result of the pending `yield` expression**; the first `next()` call's argument is ignored because nothing is waiting yet.
- `return(v)` finishes the generator, setting `{ value: v, done: true }`; `throw(e)` throws at the paused `yield`.

- [More detail on `function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
- [More detail on `Generator.prototype.next`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next)

---

### Question f913e8c0-4b11-46c2-8363-2386d2e8ef17

- What is the microtask ordering of this code?
```js
async function main() {
  console.log(1);
  await null;
  console.log(3);
}
main();
console.log(2);
```

### Answer

- Output: `1, 2, 3`. Calling `main()` runs synchronously until the first `await`.
- `await null` **suspends** `main` and queues its continuation as a microtask; control returns to the caller, which logs `2`.
- Once the synchronous stack empties, the microtask queue drains and logs `3`. Only then do macrotasks (`setTimeout`) run.

- [More detail on the event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [More detail on `await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

---

### Question 8bc9f655-7f2b-45ff-92c2-81bdc4a14975

- How do `f.length` and `f.name` behave with defaults, rest params, and destructured params?

### Answer

- `f.length` counts parameters **before** the first one with a default or a rest param; everything from that point on is excluded.
- Destructured params without defaults still count toward `length`; adding a default (`{x} = {}`) stops the count.
- `f.name` is inferred from the variable or property it is assigned to (`const f = () => {}` gives `"f"`); otherwise it is the empty string for anonymous expressions.
- Named function expressions keep their own name. Engine stack traces show `anonymous` only when no name can be inferred.

- [More detail on `Function.prototype.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length)
- [More detail on `Function.prototype.name`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name)

---

### Question 9d93f2e2-b5fb-42c5-a589-f22e6c4057e2

- What is the difference between `f.call(null)` in strict mode vs sloppy mode?

### Answer

- In **strict mode**, `this` stays exactly as passed: `f.call(null)` runs with `this === null`.
- In **sloppy mode**, `null` and `undefined` are replaced with `globalThis`, and primitives are boxed (`f.call(1)` gives a `Number` object).
- This is why functions relying on `this` behave differently when a library switches files to ESM/modules (always strict).

- [More detail on Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)

---

### Question 162f6d79-9ef9-43fe-8450-1edef67a64ac

- When is a closure-based factory function better than a class with private fields, and vice versa?

### Answer

- **Factory + closure** wins for small objects, true privacy without syntax, avoiding `this` entirely, and returning plain objects.
- **Class + `#private`** wins for many instances (methods are shared on the prototype instead of duplicated per closure), `instanceof`, inheritance, and better tooling/TS support.
- Memory: a closure factory creates a new function object per instance for every method; prototype methods are created once.

- [More detail on Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
- [More detail on Private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question ddc35228-2b57-4dbb-b6ef-9ad779693032

- When does currying pay off, and when is it over-engineering?

### Answer

- Currying pays off when you repeatedly apply the same leading arguments — configuration, dependency injection, pipelines (`pipe(map(f), filter(g))`) — and for point-free composition.
- It is over-engineering when callers always provide all arguments at once: extra wrappers hurt readability, stack traces, and TS inference.
- Prefer plain functions with optional/config arguments until partial application is actually needed.

- [More detail on Partially applied functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#partially_applied_functions)

---

### Question 498c44de-3380-4633-a182-d54981cc0db2

- Memoization: what breaks with object arguments, and when is the memory cost not worth it?

### Answer

- Object arguments are compared by **reference** in a `Map`/cache key, so two structurally equal objects are misses; the cache must key on normalized/serialized values instead.
- Unbounded caches leak memory for long-lived functions — add a max size or TTL.
- Memoization is unsound if the function depends on external mutable state, time, or random values, or has side effects.

- [More detail on Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)

---

### Question 4ae95855-478c-4706-9a0c-cea75975c51f

- Debounce vs throttle — which fits search-as-you-type vs scroll handlers, and why?

### Answer

- **Debounce** delays execution until input stops for N ms → search-as-you-type, resize-after-stop, autosave.
- **Throttle** executes at most once per N ms during a stream → scroll/mousemove/pointer handlers that need steady updates.
- Both need `cancel()`/`flush()` for cleanup, and both must preserve `this` and arguments from the latest call.

- [More detail on `setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)
- [More detail on `clearTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/clearTimeout)

---

### Question da18076f-dd6a-4766-bed1-9e9ef23c7d69

- Recursion vs iteration: what forces the choice (stack limits, readability, V8's lack of TCO)?

### Answer

- Recursion is clearer for trees and divide-and-conquer; iteration wins for linear scans and when depth is unbounded.
- Each recursive frame consumes stack; engines throw `RangeError: Maximum call stack size exceeded` (V8 does **not** implement proper tail calls).
- For deep structures, convert to an explicit loop with a manual stack/queue, or use generators as a trampoline.

- [More detail on Recursion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions#recursion)
- [More detail on Too much recursion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion)

---

### Question 82367bd0-af9f-45ca-99a3-d469937963c1

- When would you deliberately NOT write a pure function (DOM, I/O, logging, time/random), and how do you isolate the effects?

### Answer

- Effects are unavoidable for DOM updates, network calls, logging, timers, and randomness; a "pure" wrapper around them would lie.
- Isolate effects at the **edges**: keep computation pure and pass results to an impure shell that writes to the DOM/logs, or inject dependencies (`now`, `random`, `fetch`) as functions.
- This keeps the interesting logic testable without mocks and confines the parts that need integration tests.

- [More detail on Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [More detail on `Date.now`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)

---

### Question d0cf3350-f17e-4b63-9c9d-74eaac1c3750

- Passing `bind`ed functions vs wrapping arrow functions for callbacks: which is clearer, cheaper, and easier to test?

### Answer

- `bind` is a native, optimized operation that fixes `this` and arguments once; the bound function is stable if created once.
- An arrow wrapper is explicit and can add logic (`() => obj.run(x)`), but creating it per render/iteration produces a new identity — relevant for memoization and `useEffect` deps.
- Both lose `this` only if you forget; neither is "cheaper" by a margin worth measuring outside hot loops.

- [More detail on `Function.prototype.bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

---

### Question 0fc69a95-041b-4156-aa54-2a4cf66c42c3

- Implement `once(fn)` so it runs at most once and returns the first result.

### Answer

- Capture a `called` flag and the first result in the closure; subsequent calls return the cached result without invoking `fn`.

```js
function once(fn) {
  let called = false, result;
  return (...args) => {
    if (!called) { called = true; result = fn(...args); }
    return result;
  };
}
```

- [More detail on Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)

---

### Question dbf510cd-71b3-4238-8823-5104c609678c

- Implement `pipe(...fns)`, including how to type it in TS so the output of one step flows into the input of the next.

### Answer

- `pipe` applies functions left to right, feeding each result into the next; the variadic TS version relies on overloads or a tuple of function types.

```ts
function pipe<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C {
  return (a) => g(f(a));
}
```

- For N steps, no single signature covers every tuple length; you need overloads or a recursive tuple-mapped type so the compiler can check each link in the chain.

- [More detail on Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 0b7a57fb-535a-4676-b53e-78e2caf52531

- Implement `debounce(fn, ms)` that also exposes `cancel()`.

### Answer

- Keep the timer id in the closure; each call clears the pending timeout and schedules a new one with the latest arguments.

```js
function debounce(fn, ms) {
  let t;
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}
```

- [More detail on `setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)

---

### Question 238af592-f050-4c9f-8f15-5315bf7ae600

- Implement `memoize(fn)` with a `Map`, then explain what breaks with two object arguments.

### Answer

- The cache stores `argument → result`; use `has` before `get` so cached `undefined` results still hit.

```js
function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}
```

- With two object arguments the map key can only be one of them; you need a composite key (nested `Map`s or a serialized key), and serialization must be stable across key order.

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

---

### Question 21c66e6d-1a86-417a-907b-a59797c3d414

- TS: what does a `this` parameter do, and how does it catch callback misuse at compile time?
```ts
function handler(this: Window, e: Event) {}
```

### Answer

- A **`this` parameter** is erased at runtime; it only declares the type `this` must have inside the body.
- Callers then get errors if they pass `handler` somewhere `this` cannot be guaranteed (e.g. as a bare callback typed with a different `this`).

```ts
window.addEventListener("click", handler); // ok
handler(new Event("click"));              // error: this context required
```

- [More detail on `this` parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#this-parameters)

---

### Question 5599ea88-478c-4874-9385-06625c6b6b9a

- TS: overload signatures vs a union-typed parameter — give a case where overloads are strictly better.

### Answer

- Overloads express **correlated input/output** that a union cannot: e.g. `parse(input: string): Obj` and `parse(input: number): Obj[]`.
- A union signature (`parse(input: string | number): Obj | Obj[]`) forces the caller to narrow the result manually and permits invalid combinations.
- Overloads also allow different parameter counts/shapes with distinct return types.

- [More detail on Function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question b4b5535f-2f85-4b5b-afb3-3c036b854023

- TS: why does `void` as a return type accept a function that returns a value, and how does that prevent misuse of a callback's result?

### Answer

- `() => void` is intentionally permissive: a function returning a value is assignable to it, so a callback typed `void` can be passed a function that returns something (common with `forEach`/`addEventListener`).
- The caller side is then blocked from reading the result: `const x = cb()` where `cb` returns `void` is a compile error.
- Inside a function explicitly annotated to return `void`, `return someValue` is also rejected — only bare `return;` is allowed.

- [More detail on Return type `void`](https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-void)

---

### Question c53b9f01-acab-4cda-a496-c6e6a0fc6e7a

- TS: why do generic wrapper functions (`debounce<T extends unknown[]>(fn: (...args: T) => void)`) preserve parameter types where `(...args: any[]) => any` loses them?

### Answer

- `T extends unknown[]` captures the callback's parameter **tuple**, so the wrapper's returned function has the same parameter list and the compiler can check call sites.
- `any[]` erases arity and types: the wrapper accepts anything and returns `any`, so mistakes compile silently.
- The same pattern preserves return types by adding a second type parameter for the result.

```ts
function debounce<T extends unknown[], R>(fn: (...args: T) => R, ms: number) {
  return (...args: T): void => { /* ... */ };
}
```

- [More detail on Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 34d5087a-f6a5-4edd-85ca-182aa5435627

- TS: how do generic constraints and defaults work here, and why is `keyof` necessary?
```ts
function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;
```

### Answer

- `K extends keyof T` constrains keys to actual properties of `T`, so typos fail at compile time.
- The return type `Pick<T, K>` preserves the exact subset of property types rather than widening to `Record<string, unknown>`.
- Generic defaults (`K extends keyof T = keyof T`) let callers omit the second type argument.

- [More detail on Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on `Pick`](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)

---

### Question 6bef2588-8019-4bf6-94cc-8aeefcb828c2

- Why is `this.n` undefined inside the callback?
```js
const o = { n: 1, inc() { [1].forEach(function () { this.n++; }); } };
```

### Answer

- The `forEach` callback is a **regular function** invoked as a plain call, so it does not inherit `this` from `inc`.
- In strict mode `this` is `undefined` and `this.n++` throws; in sloppy mode `this` is `globalThis` and it mutates a global.
- Fixes: use an arrow callback, or pass `forEach`'s second `thisArg` argument.

- [More detail on `this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

---

### Question 6be30337-c6f4-48f6-96ae-dfe2e66adc09

- Why is the result `[1, NaN, NaN]`, and what's the fix?
```js
[1, 2, 3].map(parseInt);
```

### Answer

- `map` calls the callback with `(value, index, array)`; `parseInt(string, radix)` treats the **index as the radix**.
- So it evaluates `parseInt("1", 0)` → `1`, `parseInt("2", 1)` → `NaN`, `parseInt("3", 2)` → `NaN`.
- Fix: `arr.map((s) => parseInt(s, 10))` or `arr.map(Number)`.

- [More detail on `parseInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)

---

### Question e1cb64f1-439d-4543-9a96-53be55a870c0

- Why does a memoized function still recompute for two structurally equal object keys?

### Answer

- Cache keys use **reference identity** (`SameValueZero`), so `{ id: 1 }` written twice creates two distinct keys and two misses.
- Structural equality would require serializing the argument into a stable primitive key (`JSON.stringify` with sorted keys, or a normalized id).
- Alternatively, memoize on primitives only and let callers pass an id.

- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)

---

### Question eee424ae-2058-4d43-b6bb-f04f0532732d

- What's wrong with this debounce?
```js
function debounce(fn, ms) {
  let t;
  return () => { clearTimeout(t); t = setTimeout(fn, ms); };
}
```

### Answer

- It drops the call's `this` and **arguments**: the timer invokes `fn()` with none, so `fn` receives nothing and loses its receiver.
- It offers no `cancel()`/`flush()`, so pending work cannot be cleaned up on unmount.
- Fix: forward `(...args)` and the receiver (`fn.apply(this, args)` or an arrow that captures them).

- [More detail on `setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)

---

### Question affac2b7-12be-4078-865b-366015e2d0b3

- Why does this loop log `1` but never `2`?
```js
function* g() { yield 1; return 2; }
for (const v of g()) console.log(v);
```

### Answer

- `for...of` consumes only values delivered by `yield`; a `return` finishes the generator with `{ value: 2, done: true }`, which the loop discards.
- To observe the return value, drive the iterator manually and inspect the final `next()` result.

```js
const it = g();
it.next();        // { value: 1, done: false }
it.next();        // { value: 2, done: true }
```

- [More detail on Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)

---
