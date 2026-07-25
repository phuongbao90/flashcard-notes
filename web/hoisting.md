# Hoisting

### Question 6cee2afb-0e9d-4731-8a3a-2b0af3867139

- How does JavaScript hoisting treat `var` declarations differently from `let` and `const` during the creation phase of an execution context?

### Answer

- During the creation phase of an execution context, environment record entries for `var` are allocated and immediately initialized to `undefined`.
- For `let` and `const`, environment record entries are created (hoisted), but remain uninitialized until evaluation reaches their declaration statement.
- Accessing a `var` before declaration evaluates to `undefined`, whereas accessing `let` or `const` before initialization throws a `ReferenceError` due to the Temporal Dead Zone (TDZ).

```javascript
console.log(a); // undefined
var a = 1;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;
```

---

### Question 175bd532-8305-46ab-8749-fb4e19c1373a

- Why does accessing a `let` or `const` variable before its declaration statement throw a `ReferenceError` even though the variable binding is hoisted?

### Answer

- `let` and `const` bindings enter the Temporal Dead Zone (TDZ) from the start of their enclosing scope until execution reaches the line where they are declared.
- Hoisting creates the variable name identifier in memory during the execution context creation phase, but the runtime forbids reading or writing to the binding until initialization executes.
- `typeof` on a variable in the TDZ also throws a `ReferenceError`, unlike `typeof` on undeclared variables which evaluates to `"undefined"`.

```javascript
// Scope starts
console.log(typeof x); // ReferenceError (in TDZ)
let x = 10; // TDZ ends here

console.log(typeof y); // "undefined" (undeclared variable)
```

---

### Question 63a723c8-cc75-4abb-8b59-7737d2ee3250

- How do Function Declarations differ from Function Expressions and Arrow Functions regarding hoisting behavior?

### Answer

- Function declarations are fully hoisted during the creation phase: both the function identifier and its implementation body are bound in memory before execution begins.
- Function expressions and arrow functions assigned to variables only hoist the variable declaration, not the assigned function body.
- Invoking a `var`-assigned function expression before its declaration throws a `TypeError` (e.g., `fn is not a function`), while invoking a `let`/`const`-assigned expression throws a `ReferenceError` due to TDZ.

```javascript
declaredFn(); // Works: prints "Hello"
function declaredFn() { console.log("Hello"); }

expressedFn(); // TypeError: expressedFn is not a function
var expressedFn = function() {};
```

---

### Question a6148e76-1a69-4690-bdc5-524fb95961dc

- What is the evaluation order and outcome when a Function Declaration and a `var` declaration share the exact same identifier in the same scope?

### Answer

- Function declarations take precedence over `var` declarations during the execution context creation phase; the identifier is bound to the function object first, ignoring the redundant `var` declaration.
- If runtime execution subsequently reaches a `var` assignment line (e.g., `var a = 10`), the variable holding the function reference is overwritten with the assigned primitive value.
- Re-declaring a function after a `var` statement with an assignment does not re-hoist over runtime value changes.

```javascript
console.log(typeof foo); // "function" (function hoisting takes precedence)

var foo = 42;
function foo() {}

console.log(typeof foo); // "number" (overwritten by runtime assignment)
```

---

### Question 19378986-c094-4e81-8dd5-f0affff04ac9

- How does block-scoping affect function declaration hoisting in ES6 strict mode versus non-strict mode?

### Answer

- In ES6 strict mode, function declarations inside a block are scoped strictly to that block and hoisted only to the top of the enclosing block scope.
- In non-strict mode (legacy Annex B web behavior), the function declaration hoists to the top of the block, but also exports its identifier to the outer function/global scope initialized as `undefined` until execution reaches the block.
- Relying on block-level function declarations in non-strict mode introduces cross-browser inconsistencies and should be avoided in modern codebases.

```javascript
"use strict";
{
  function inner() { return 1; }
}
console.log(typeof inner); // "undefined" (strictly block-scoped)
```

---

### Question 50cdde85-ace4-4859-be6d-92eae6feaefe

- How does class declaration hoisting differ from function declaration hoisting in JavaScript?

### Answer

- Class declarations are hoisted to the top of their enclosing scope, but unlike function declarations, they are not initialized with a value.
- Classes behave like `let` and `const` declarations; referencing a class before its declaration line throws a `ReferenceError` because it resides in the Temporal Dead Zone.
- The `extends` clause of a class expression or declaration is evaluated at runtime when execution hits the statement, so superclasses must be initialized before class evaluation.

```javascript
const instance = new User(); // ReferenceError: Cannot access 'User' before initialization

class User {
  constructor(name) {
    this.name = name;
  }
}
```

---

### Question fd4e814f-95a1-4863-ba74-0ddd86f9bfe9

- How do ES module `import` statements interact with hoisting and execution timing?

### Answer

- ES module `import` declarations are hoisted to the very top of the module scope and resolved synchronously during module instantiation, before any code inside the module executes.
- Imported bindings can be accessed anywhere in the module, even before the physical `import` statement in the file structure.
- Imported bindings are live, read-only bindings; attempts to reassign imported identifiers throw a `TypeError` at runtime or fail compilation.

```javascript
// Execution of helper() works before import line due to ES module hoisting
helper();

import { helper } from "./utils.js";
```

---

### Question 8b15579c-df7e-43a6-afbf-95a1f5e88dee

- What will be logged to the console when executing the code snippet below, and why?

```javascript
var x = 1;

function test() {
  console.log(x);
  var x = 2;
}

test();
```

### Answer

- Logs `undefined`.
- The local variable `x` is hoisted to the top of `test()`'s function scope during the creation phase and initialized to `undefined`.
- The local `x` shadows the outer `x = 1`, so `console.log(x)` accesses the unassigned local `x` before its assignment statement executes.

---

### Question a8ab7f7f-fdc9-498e-abd0-2e3a06b30921

- What happens when `getOutput()` is invoked in the code snippet below, and what error or output is produced?

```javascript
function getOutput(x = y, y = 2) {
  return x + y;
}

getOutput();
```

### Answer

- Throws a `ReferenceError: Cannot access 'y' before initialization`.
- Parameter evaluation occurs left-to-right in a dedicated parameter scope; default parameters evaluate as `let`/`const`-like declarations.
- When `x = y` is evaluated, parameter `y` has been declared in scope but not yet initialized, placing `y` in the Temporal Dead Zone (TDZ).

---

### Question eff09449-05fb-468b-8dc8-651b61757b7a

- What is the output of the following code snippet? Explain the underlying variable and function hoisting mechanics.

```javascript
var a = 1;

function foo() {
  a = 10;
  return;
  function a() {}
}

foo();
console.log(a);
```

### Answer

- Logs `1`.
- Inside `foo()`, the function declaration `function a() {}` is hoisted to the top of the function execution context, creating a local variable `a` initialized to the function object.
- The assignment `a = 10` overwrites the local `a` binding inside `foo()`, leaving the outer/global variable `a` untouched at `1`.

---

### Question 02cf2033-0c33-4fa9-af75-67fb460e2349

- What will be logged to the console by the following code snippet?

```javascript
var fn = "hello";

function fn() {
  return "world";
}

console.log(typeof fn);
```

### Answer

- Logs `"string"`.
- During the creation phase, `function fn()` is hoisted first, initializing `fn` as a function object; the `var fn` declaration is ignored as `fn` is already bound.
- During the execution phase, the statement `var fn = "hello"` assigns the string `"hello"` to `fn`, overwriting the function reference before `console.log` executes.

---

### Question 75328488-beb0-4ae8-aa3e-8ce31329f34e

- What is the result of executing the code snippet below in ES6 strict mode, and why?

```javascript
"use strict";

foo();

if (true) {
  function foo() {
    console.log("inside block");
  }
}
```

### Answer

- Throws a `ReferenceError: foo is not defined`.
- In strict mode, function declarations inside block statements (`if`, `for`, `{}`) are strictly block-scoped and their declarations hoist only to the top of that block.
- Because `foo()` is invoked in the outer scope before entering the `if` block, `foo` is not bound in the outer scope execution context.

---

### Question 112d9162-faa3-4093-afdd-fd5d4f9c1d22

- What is logged when the following code snippet executes?

```javascript
let count = 10;

function increment() {
  console.log(count);
  let count = 20;
}

increment();
```

### Answer

- Throws a `ReferenceError: Cannot access 'count' before initialization`.
- The inner `let count = 20` declaration hoists to the top of `increment()`'s function scope, creating a local `count` binding.
- This inner binding shadows the outer `let count = 10`, but accessing it via `console.log(count)` fails because the local `count` is still in the Temporal Dead Zone (TDZ).

---

### Question 9a22ea6e-c333-4117-8076-fa9f0b4fcd60

- What happens when `run()` is called in the following scenario involving `try...catch` block scoping?

```javascript
function run() {
  var err = "outer error";

  try {
    throw "inner error";
  } catch (err) {
    var err = "caught error";
    console.log(err);
  }

  console.log(err);
}

run();
```

### Answer

- Logs `"caught error"` twice (`"caught error"` inside catch block, `"caught error"` outside catch block).
- The `catch (err)` parameter creates a block-scoped binding for `err` within the catch block; `err = "caught error"` updates this catch parameter.
- However, `var err` inside the catch block is function-hoisted to `run()`, sharing the top-level `var err` variable, which causes the outer `err` variable to also be mutated to `"caught error"`.

---

### Question bde6798c-1342-47e1-9029-25e3db06d15b

- Why does referencing a `let` variable inside a `case` clause of a `switch` statement throw a `ReferenceError` when a different `case` branch executes?

### Answer

- Throws a `ReferenceError: Cannot access 'result' before initialization`.
- A `switch` block shares a single lexical block scope across all `case` and `default` clauses.
- The `let result` declaration hoists to the top of the entire `switch` block, putting `result` in the Temporal Dead Zone (TDZ) for all cases until line `case 1:` initializes it, which never runs when `value === 2`.

```javascript
const value = 2;

switch (value) {
  case 1:
    let result = "one";
    break;
  case 2:
    console.log(result); // ReferenceError: Cannot access 'result' before initialization
    break;
}
```

---

### Question b6298574-e53d-4787-a84c-0ff258167d3a

- What is the output of `y()` in the following function default parameter scenario, and why does body variable hoisting not affect `y`?

### Answer

- Logs `1`.
- When default parameters are present, JavaScript creates an intermediate **Parameter Environment Record** separate from the **Function Body Environment Record**.
- The closure `y` captures `x` from the Parameter Environment Record (where `x = 1`); the subsequent `var x = 2` inside the function body creates and mutates a separate variable in the Function Body Environment Record.

```javascript
function demo(x = 1, y = () => x) {
  var x = 2;
  return y();
}

console.log(demo());
```

---

### Question 5e64537e-c381-44e8-b553-350a7971abdc

- How does non-strict mode Annex B function hoisting behave when accessing a block-declared function before, inside, and after the block?

### Answer

- Logs `"undefined"`, `"function"`, `"function"`, `"function"` in non-strict mode browsers (Annex B mechanics).
- Prior to entering the `if` block, `fn` is hoisted to the outer function/global scope initialized as `undefined`.
- Inside the block, `fn` is bound as a function; when runtime execution hits `function fn() {}`, it assigns and synchronizes the function reference to the outer scope `fn` variable.

```javascript
console.log(typeof fn); // "undefined"

if (true) {
  console.log(typeof fn); // "function"
  function fn() {}
  console.log(typeof fn); // "function"
}

console.log(typeof fn); // "function"
```

---

### Question 3b47d36e-e3a6-4da7-b3a2-a2253395d960

- Why does `setTimeout` log `3, 3, 3` with `var` but `0, 1, 2` with `let` in a `for` loop?

### Answer

- Prints `3, 3, 3` for `var` and `0, 1, 2` for `let`.
- `var i` hoists to the enclosing function/global scope, creating a single shared binding across all loop iterations; when callbacks execute after the loop, `i` has reached `3`.
- `let j` creates a distinct per-iteration environment record for every loop cycle, capturing a fresh immutable copy of `j` for each closure.

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
```

---

### Question 09d7af1c-0fee-41c3-afd5-57c315b2c3dd

- What happens when a class static field initializer attempts to access another static field declared below it?

### Answer

- Logs `undefined`.
- Static fields are evaluated sequentially during class evaluation after the class binding is initialized.
- When `static A = Config.B` executes, `Config.B` has not yet been assigned a value, so property access on `Config` evaluates to `undefined` (unlike class instantiation in TDZ, static fields evaluate as object property initializations).

```javascript
class Config {
  static A = Config.B;
  static B = 42;
}

console.log(Config.A);
```
