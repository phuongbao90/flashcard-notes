# Scope & Closures

### Question 6e07ea9a-3167-467c-9811-04ce542bcb19

- How does JavaScript determine scope resolution during lexical analysis, and how does scope chain lookup behave for nested identifiers?

### Answer

- JavaScript uses lexical (static) scoping, meaning variable scope is determined at compile/parse time based on where functions and blocks are declared in source code, not where they are called.
- When an identifier is referenced, the JS engine searches the immediate Execution Context's Environment Record; if not found, it traverses up outer scope references along the scope chain until reaching the Global Scope.
- If an identifier cannot be found in any Environment Record along the scope chain, strict mode throws a `ReferenceError`, whereas non-strict mode creates an implicit global variable on un-declared assignments.

```javascript
const globalVar = "global";

function outer() {
  const outerVar = "outer";
  function inner() {
    console.log(outerVar, globalVar); // Resolves lexically up the scope chain
  }
  inner();
}
```

---

### Question 3ad00b3c-c56a-49a2-8adf-b999f87bce65

- How do closures interact with JavaScript garbage collection, and what can cause unintended memory leaks in long-lived closures?

### Answer

- A closure retains a reference to its outer lexical environment record for as long as the closure function object itself remains reachable in memory.
- The garbage collector cannot free variables in an outer scope context if any active, reachable closure references that environment.
- Unintended memory leaks occur when long-lived objects (e.g., global event listeners, long-running timers, RxJS subscriptions) hold references to closure callbacks that encapsulate large data structures.

```javascript
function setupListener() {
  const hugeData = new Array(1000000).fill("leak");

  window.addEventListener("resize", () => {
    // Retains 'hugeData' in memory indefinitely until listener is removed
    console.log(hugeData.length);
  });
}
```

---

### Question f8794474-238c-42d3-9c24-0c9ca44ce762

- What causes stale closures in React functional components, and how do scope snapshots explain this behavior?

### Answer

- Every render of a React functional component executes with its own distinct lexical scope containing state and props snapshots created for that specific render.
- If a callback (e.g., in `useEffect`, `useCallback`, or `setTimeout`) closes over variables from render $N$ and is not updated when state changes in render $N+1$, it accesses the snapshot values captured at render $N$.
- Resolving stale closures requires maintaining accurate Hook dependency arrays, using functional state updates (`setState(prev => ...)`), or storing dynamic values in a mutable `useRef`.

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Stale closure: always reads count as 0 from initial render scope
      console.log(count);
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Missing 'count' dependency
}
```

---

### Question 293676e0-13c1-41c3-89ee-b8c634f8874d

- Why does using `var` inside a `for` loop with asynchronous callbacks print the final index value for every iteration, whereas `let` creates a distinct value per iteration?

### Answer

- `var` is function-scoped or globally-scoped, meaning a single variable binding is created and mutated across all iterations of the loop.
- `let` in a `for` loop header creates a new block-scoped variable binding for every iteration (per-iteration environment record binding), storing the iteration's specific value.
- When asynchronous callbacks (like `setTimeout` or event handlers) execute later, `var` callbacks read the single mutated binding (final loop value), while `let` callbacks close over their respective iteration scope.

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // Logs: 3, 3, 3
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 100); // Logs: 0, 1, 2
}
```

---

### Question f3bba3c0-5320-4ab4-a614-d246c713c7d3

- How do closures provide data encapsulation (factory functions/module pattern), and how do they compare with ES2022 private class fields (`#field`)?

### Answer

- Closures encapsulate state by storing variables inside an outer function scope that are accessible only via returned inner methods (privileged functions).
- Private class fields (`#field`) enforce privacy at the language grammar level via hidden class slot checks, shared via prototype methods rather than re-creating function instances per object.
- Closure-based privacy creates unique function instances per instantiation (higher memory footprint), whereas ES class `#fields` offer better memory performance and true native branding checks (`in` operator validation).

```javascript
// Closure pattern (re-creates methods per instance)
function createCounter() {
  let count = 0;
  return { getCount: () => count, increment: () => ++count };
}

// Private class field (shared prototype methods)
class Counter {
  #count = 0;
  getCount() {
    return this.#count;
  }
  increment() {
    return ++this.#count;
  }
}
```

---

### Question a4a1f84d-e232-4ab3-b9b5-52736b9edab9

- How does variable scoping operate inside `switch` statements and `try/catch` parameter blocks?

### Answer

- A `switch` block shares a single lexical block scope across all of its `case` clauses; declaring a `let` or `const` variable in one case without curly braces causes redeclaration `SyntaxError`s if declared again in another case.
- The `catch` clause in a `try/catch` statement creates a separate block scope for its error parameter (e.g., `catch (err)`), shadowing outer variables with the same name.
- Enclosing individual `case` blocks in explicit block braces `{}` creates isolated scope boundaries per case clause.

```javascript
switch (action) {
  case "A": {
    const data = 1; // Scoped strictly to case "A"
    break;
  }
  case "B": {
    const data = 2; // Valid: separate block scope
    break;
  }
}
```

---

### Question 81369ccb-db4d-4b2e-93af-d6c0c46cd476

- What purpose do Immediately Invoked Function Expressions (IIFE) serve regarding scope isolation, and why are they still relevant in modern JavaScript?

### Answer

- IIFEs create an immediate local function scope to encapsulate variables and prevent polluting the global scope or colliding with global identifiers.
- Prior to native ES modules, IIFEs were the standard technique for implementing the Module Pattern and creating private state.
- In modern JS, IIFEs are still useful for executing top-level `async/await` blocks in legacy environments, scoping complex multi-statement initializations without leaking temporary variables, and isolating bundled code output.

```javascript
const config = (() => {
  const secretKey = "12345";
  const buildEnv = "production";
  return { env: buildEnv, getKey: () => secretKey };
})();
// secretKey and buildEnv are completely inaccessible outside
```

---

### Question fd86430c-fe06-408e-98ee-8472eef8f27a

- How does top-level scope in an ES Module (ESM) differ from top-level scope in a traditional non-module script tag (`<script>`)?

### Answer

- Top-level variables (`var`, `let`, `const`, `function`) in an ES Module are scoped strictly to that module file and are never attached to the global object (`window` or `globalThis`).
- Non-module script tags evaluate top-level `var` and `function` declarations into properties on the global object (`window.varName`), making them globally accessible.
- ES modules automatically enforce strict mode (`"use strict"`), isolate their scope, and require explicit `export` and `import` statements to share bindings across files.

```javascript
// Non-module script:
var globalItem = "accessible globally"; // window.globalItem === "accessible globally"

// ES Module (module.js):
var moduleItem = "module scoped"; // window.moduleItem === undefined
export { moduleItem };
```

---

### Question 5cd336c3-4e95-40c2-b5e5-191799182884

- How do arrow functions resolve `this` and `arguments` identifiers compared to standard functions in terms of lexical scope?

### Answer

- Arrow functions do not define their own `this`, `arguments`, `super`, or `new.target` bindings; instead, they resolve these identifiers lexically from their enclosing parent scope.
- Standard functions bind `this` dynamically based on how they are invoked (e.g., method call, standalone invocation, `call`/`apply`/`bind`).
- Invoking `call()`, `apply()`, or `bind()` on an arrow function passes parameters but cannot change its lexically bound `this` value.

```javascript
const obj = {
  name: "App",
  getRegular: function () {
    return function () {
      console.log(this.name);
    };
  },
  getArrow: function () {
    return () => {
      console.log(this.name);
    }; // Captures 'this' lexically from getArrow
  },
};

obj.getRegular()(); // undefined (or throws in strict mode)
obj.getArrow()(); // "App"
```

---

### Question 2324071f-cdad-4893-95dd-4666b3de7fc8

- How do direct `eval()` and `with` statements disrupt static scope analysis, and what impact do they have on JavaScript engine JIT optimizations?

### Answer

- Direct `eval()` executes arbitrary code that can introduce new local variable bindings into the calling lexical environment at runtime.
- The `with` statement dynamically injects an object's properties at the head of the current scope chain, making property access resolve dynamically.
- Because lexical scope can no longer be determined statically at compile time, JS engines (like V8) disable aggressive JIT compiler optimizations (such as inline caching and fast scope variable lookups) for functions using `eval` or `with`.

```javascript
function dynamicScope(str) {
  eval(str); // Injects 'var x = 20' dynamically at runtime
  console.log(x); // Static scope analysis cannot guarantee where 'x' comes from
}

dynamicScope("var x = 20;"); // 20
```

---

### Question 7cd06052-f918-48b9-a19a-c28a74df63b2

- What is the V8 shared lexical scope allocation strategy, and how can an unused variable in an outer function be retained in memory by an unrelated closure?

### Answer

- V8 allocates a single shared `Context` object for an outer function execution containing all variables closed over by _any_ inner function defined within that outer scope.
- If inner function A closes over `largeData` and inner function B closes over `smallData`, V8 keeps the shared `Context` object in memory as long as _either_ function A or function B remains reachable.
- As a result, retaining function B in memory inadvertently retains `largeData` in memory via the shared context object, unless V8 static analysis optimizes out unreferenced bindings.

```javascript
function outer() {
  const largeData = new Array(1000000);
  const smallData = "hello";

  function unusedClosure() {
    console.log(largeData); // Closed over by unusedClosure
  }

  return function usedClosure() {
    console.log(smallData); // Shared context retains largeData via unusedClosure
  };
}

const getSmall = outer(); // Keeps shared outer context (and largeData) alive
```

---

### Question 6bed4502-1570-48fb-b905-5602d34aa09f

- Why does reading `ref.current` inside an asynchronous closure always access the latest value, whereas reading a React state variable reads the snapshot value from when the closure was created?

### Answer

- React state variables are primitive values or reference snapshots scoped to the specific render context in which the closure was defined.
- `useRef` returns a stable, identity-preserved object `{ current: value }` whose object reference remains identical across all re-renders of the component.
- When an async closure executes, referencing a state variable reads the immutable primitive/reference captured in its static lexical snapshot, whereas referencing `ref.current` dereferences a property on the shared, mutable object stored in heap memory.

```javascript
function AsyncCounter() {
  const [stateCount, setStateCount] = useState(0);
  const refCount = useRef(0);

  const handleAsyncLog = () => {
    setTimeout(() => {
      console.log(stateCount); // Closed over initial render value (snapshot)
      console.log(refCount.current); // Reads live current property on mutable object reference
    }, 3000);
  };
}
```

---

### Question a76aa1c2-6beb-481e-91ff-aaf598e727e5

- What will be printed by calling `fn1()` and `fn2()` in the following snippet, and why do both functions affect the same counter value?

```javascript
function createCounters() {
  let count = 0;
  return [
    function increment() {
      return ++count;
    },
    function decrement() {
      return --count;
    },
  ];
}

const [fn1, fn2] = createCounters();
console.log(fn1());
console.log(fn2());
```

### Answer

- `fn1()` returns `1` and `fn2()` returns `0`.
- Both `increment` and `decrement` functions are created within the same execution context of `createCounters` and share the exact same `count` environment record binding.
- Mutating `count` inside `fn1` updates the shared reference in memory, which is immediately reflected when `fn2` subsequently executes.

---

### Question 1811cdbd-0ccc-4840-993c-e9beec049cd0

- What is the console output sequence of calling `test(0)` below, and how does scope shadowing affect each output?

```javascript
let a = 1;

function test(a) {
  a = 2;
  if (true) {
    let a = 3;
    console.log(a);
  }
  console.log(a);
}

test(0);
console.log(a);
```

### Answer

- The output sequence is `3`, `2`, and `1`.
- The parameter `a` shadows the global `a = 1` inside `test()`, so `a = 2` mutates the parameter binding, not the global variable `a`.
- The block declaration `let a = 3` creates a separate block-scoped variable `a` that shadows the parameter `a` inside the `if` block, leaving the parameter `a` as `2` outside the block and global `a` unchanged as `1`.

---

### Question 86f730d7-e885-495a-8627-3400768669d1

- What values will `obj.showName()` and `obj.showNameDelayed()` print to the console, and why do they behave differently?

```javascript
const obj = {
  name: "Module",
  showName: function () {
    console.log(this.name);
  },
  showNameDelayed: function () {
    setTimeout(function () {
      console.log(this.name);
    }, 100);
  },
};

obj.showName();
obj.showNameDelayed();
```

### Answer

- `obj.showName()` prints `"Module"`, whereas `obj.showNameDelayed()` prints `undefined` (or empty string in browsers).
- `showName` is invoked directly as a method on `obj`, binding `this` dynamically to `obj`.
- The standard callback function passed to `setTimeout` is executed later by the timer subsystem as a standalone function call, resetting its `this` binding to `window` (or `undefined` in strict mode).

---

### Question 8825f913-dda5-4677-930a-71d7e02952e5

- What error or output occurs when executing `b(3)` in the snippet below, and why does re-assigning `a = null` cause this behavior?

```javascript
var a = function recursive(n) {
  if (n <= 1) return 1;
  return n * a(n - 1);
};

var b = a;
a = null;

console.log(b(3));
```

### Answer

- Executing `b(3)` throws a `TypeError: a is not a function`.
- Inside the function body, recursive execution references variable identifier `a` instead of its named function expression identifier `recursive`.
- When `a` is re-assigned to `null`, `b` still references the function object, but internal evaluation of `a(n - 1)` dynamically resolves `a` to `null` via scope lookup, failing at invocation.

---

### Question aaa5c62b-e656-4296-877e-2171cd202c99

- What will be logged by the IIFE code snippet below, and why does mutating `val` inside the IIFE not affect the outer `val`?

```javascript
var val = 10;

(function (val) {
  val = val + 20;
  console.log(val);
})(val);

console.log(val);
```

### Answer

- Logs `30` followed by `10`.
- The IIFE receives `10` as an argument assigned to its parameter `val`.
- Parameter `val` is a local function-scoped variable that shadows the global `val`; modifying `val` inside the IIFE mutates only the local parameter, leaving global `val` as `10`.

---

### Question a5a073b1-254f-4ce6-aba8-1e7e14f3b1df

- In a React component with the following click handler, what values will be logged after clicking the button twice quickly and waiting for the timeouts?

```javascript
function Component() {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  const handleClick = () => {
    setCount(count + 1);
    countRef.current = countRef.current + 1;

    setTimeout(() => {
      console.log(`State: ${count}, Ref: ${countRef.current}`);
    }, 1000);
  };
}
```

### Answer

- Assuming initial state `count = 0` and `countRef.current = 0`:
  - First click timeout output: `State: 0, Ref: 2`
  - Second click timeout output: `State: 1, Ref: 2`
- The `setTimeout` callback closes over the primitive `count` snapshot from the render context in which `handleClick` was invoked (0 for render 0, 1 for render 1).
- `countRef.current` points to the same mutable heap object reference across renders, so both delayed timeouts read the updated final property value (`2`).

---

### Question dd1ec0aa-5615-4569-a65d-c5a29349bc20

- What will calling `fn()` return in the snippet below, and why is `x` accessible even though it is assigned after `getValue` is defined?

```javascript
function outer() {
  var getValue = function () {
    return x;
  };
  var x = 100;
  return getValue;
}

const fn = outer();
console.log(fn());
```

### Answer

- Calling `fn()` returns `100`.
- When `outer()` executes, `getValue` is defined and closes over `outer`'s environment record containing binding `x`.
- By the time `outer()` completes and returns `getValue`, runtime execution has reached `var x = 100`, populating the environment record entry with `100` before `fn()` is invoked.

---

### Question b72aac60-14f5-47c7-acb0-6751dfe3a461

- What is logged when executing `funcs[0]()` and `funcs[1]()` in the snippet below, and how does the IIFE solve the loop closure issue?

```javascript
const funcs = [];

for (var i = 0; i < 2; i++) {
  funcs.push(
    (function (capturedI) {
      return function () {
        return capturedI;
      };
    })(i),
  );
}

console.log(funcs[0]());
console.log(funcs[1]());
```

### Answer

- Logs `0` followed by `1`.
- The IIFE executes immediately on each loop iteration, creating a distinct execution context and capturing the current `i` value in its parameter `capturedI`.
- The returned inner function closes over `capturedI` (unique per IIFE context), preserving `0` and `1` despite `i` being a single mutated `var` binding in the outer scope.

---

### Question 2a2b6626-ada9-4f98-abf1-e0867e4f37cf

- What will be logged to the console by `delayLog()`, and why does `setTimeout` read `"Modified"` instead of `"Initial"`?

```javascript
function delayLog() {
  let message = "Initial";

  setTimeout(() => {
    console.log(message);
  }, 100);

  message = "Modified";
}

delayLog();
```

### Answer

- Logs `"Modified"`.
- The `setTimeout` callback captures the environment record binding reference for `message`, not a snapshot copy of its string primitive value at the time `setTimeout` was called.
- Before the event loop runs the timer callback, synchronous execution continues and updates `message` to `"Modified"`, which is what the callback reads upon execution.

---

## Advanced React & Next.js Scope Patterns

### Question 94d7b70b-87ea-41ef-869f-a8cadb9af6b5

- What security and data corruption risks occur when declaring mutable state at the top-level module scope in Next.js Server Components or API routes?

```javascript
// app/api/user/route.js
let userCache = {}; // Top-level module variable

export async function GET(request) {
  const userId = request.headers.get("x-user-id");
  userCache[userId] = await fetchUserData(userId);
  return Response.json(userCache);
}
```

### Answer

- In Node.js server environments (like Next.js API routes or Server Components), top-level module scope variables are instantiated once per worker process and shared across all incoming HTTP requests.
- Modifying `userCache` inside a request handler causes cross-request state bleed, exposing private data of User A to User B and creating race conditions.
- Server-side state must be scoped strictly per request (inside request handler execution context) or managed via request-isolated storage like React `cache()` or Node.js `AsyncLocalStorage`.

---

### Question 06ea94ee-34d0-4e5b-b803-b79720dd2e07

- How does the `useLatest` custom hook pattern solve stale closure issues in async callbacks without requiring effect re-subscriptions?

```javascript
function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

function useInterval(callback, delay) {
  const savedCallback = useLatest(callback);

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]); // No need to re-run interval on callback identity changes
}
```

### Answer

- `useLatest` maintains a mutable `useRef` object that is updated with the newest callback or prop value after every render.
- By reading `savedCallback.current()` inside `setInterval`, the timer closure accesses the latest function reference without needing `callback` in `useEffect`'s dependency array.
- This decouples callback identity updates from timer setup/teardown cycles, eliminating stale closures while avoiding timer resets.

---

### Question 872e0c10-6995-49b3-af08-bec7bf238750

- Why does failing to return a cleanup function in `useEffect` when attaching global event listeners cause closure-based memory leaks upon component unmount?

```javascript
function UserProfile({ userId }) {
  useEffect(() => {
    const handler = (e) => {
      console.log(`User ${userId} clicked`, e.target);
    };
    window.addEventListener("click", handler);
    // Missing cleanup: return () => window.removeEventListener("click", handler);
  }, [userId]);
}
```

### Answer

- Attaching `handler` inside `useEffect` creates a long-lived closure bound to the DOM `window` root, retaining `userId` and the component's enclosing environment record in memory.
- When `UserProfile` unmounts or `userId` updates, the old listener remains attached to `window`, keeping its captured lexical scope reachable by the garbage collector.
- Returning a cleanup function (`removeEventListener`) severs the DOM reference to `handler`, enabling GC to reclaim the component's unmounted scope context and memory.
