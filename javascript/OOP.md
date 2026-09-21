# OOP in JavaScript

### Question 6396085e-b366-4efc-86c4-9e006b72ce17

- Trace every step the engine performs for `new Foo()`. Where does `Foo.prototype` come in, and what happens when `Foo` explicitly returns an object versus a primitive?

### Answer

- **Steps of `new Foo()`**: (1) a new **empty object** is allocated; (2) its **`[[Prototype]]` is set to `Foo.prototype`**; (3) the constructor runs with **`this` bound** to that object; (4) if the constructor **returns an object, that object replaces `this`** as the result — otherwise `this` is returned.
- `Foo.prototype` is the object every instance links to **at creation time** — this single link is the entire inheritance mechanism, so later reassigning `Foo.prototype` does not affect already-created instances.
- Returning a **primitive** (`return 42`, `return null` when the value is treated as object-less) is **ignored**; only object returns win.

```javascript
function Foo() {
  return { hijacked: true }; // object return wins
}
new Foo(); // { hijacked: true } — prototype link is Foo.prototype? No: the returned object's own [[Prototype]] applies
```

- This "object return wins" rule is exactly how exotic built-ins like `Error` and `Array` defeat naive ES5 subclassing.

- [More detail on the new operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)

---

### Question eeefa65d-1dc7-4199-9a78-7fb7fc335859

- Explain how property lookup walks the **prototype chain** for `obj.toString()`: where the chain starts, how shadowing works, what terminates the chain, and what `Object.create(null)` produces.

### Answer

- Lookup starts at the object's **own properties**; if the key is not found, the engine follows the internal **`[[Prototype]]` link** (`Object.getPrototypeOf`) upward, level by level.
- **Shadowing**: an own property wins immediately — the walk stops at the first match and never reaches the inherited one.
- The chain terminates when `[[Prototype]]` is **`null`**. For ordinary objects the last link is `Object.prototype` (home of `toString`, `hasOwnProperty`), then `null`.
- `Object.create(null)` produces a **"dictionary" object with no prototype at all**: no inherited `toString`, `constructor`, or `valueOf` — safe against prototype pollution but harder to debug (`console.log` may show `[Object: null prototype]`).

```javascript
const a = { x: 1 };
const b = Object.create(a); // b -> a -> Object.prototype -> null
b.x;        // 1 (found on a)
b.toString; // found on Object.prototype
const dict = Object.create(null);
dict.toString; // undefined — no chain to walk
```

- [More detail on the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)

---

### Question 0990b1ea-4a6d-4fa6-b1f9-4465885ebb9c

- `class` is often called "syntactic sugar over prototypes" — list at least 4 behaviors where a `class` differs from a constructor `function`.

### Answer

- **Strict mode**: class bodies (including methods and field initializers) always run in **strict mode**, no opt-out; a constructor function inherits the surrounding mode.
- **Non-enumerable methods**: class prototype methods are created `enumerable: false`; assigning `Foo.prototype.method = ...` creates enumerable properties.
- **Hoisting/TDZ**: a `class` declaration is hoisted but stays **uninitialized until evaluation** (`new C()` above the class throws `ReferenceError`); function declarations are fully initialized at environment creation.
- **Must use `new`**: calling `MyClass()` without `new` throws `TypeError`; constructor functions called plain get `globalThis`/`undefined` as `this` instead.
- Extras: class prototype has a non-writable `constructor`; methods are non-constructable (`new obj.method()` throws); the class name is const-like inside the class body.

- [More detail on Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

---

### Question 18a6ec9b-2804-43ec-90c9-94033feeaacb

- JS decides `this` at the **call-site**, not the definition-site. Explain the resolution rules, then predict A vs B and why:

```javascript
const user = {
  name: 'Bao',
  greet: () => `Hi ${this.name}`,       // A
  sayHi() { return `Hi ${this.name}`; } // B
};
user.greet();
user.sayHi();
```

### Answer

- **Resolution rules** (highest to lowest): `new` binding → explicit `call`/`apply`/`bind` → **implicit** (call as `obj.fn()`) → default (`undefined` in strict mode, `globalThis` in sloppy). **Arrow functions skip all of this** — they capture `this` lexically from the enclosing scope at definition time.
- **A** `user.greet()`: the arrow ignores the `user.` call-site and uses the scope where the literal was defined. In an ES module (strict, top-level `this` is `undefined`) this **throws `TypeError`**; in a sloppy classic script it reads `window.name`.
- **B** `user.sayHi()`: method shorthand is a normal function called with implicit binding → `this === user` → **`"Hi Bao"`**.
- Practical rule: arrow functions for callbacks that must keep the surrounding `this`; regular methods when the object should own `this`.

- [More detail on this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

---

### Question b65ed0ba-0131-4638-9122-ecedbdd6c5e7

- Why does extracting a method lose `this` — and what exactly does `bind` return internally that fixes it?

```javascript
const print = user.sayHi;
print(); // what is `this` here, and why?
```

### Answer

- `this` is decided by **how the function is invoked**, not where it was written. `user.sayHi()` binds `this = user`; once extracted, `print()` is a **standalone call** → `this` is `undefined` (strict) or `globalThis` (sloppy). The function object carries no attachment to `user`.
- `bind` returns a new **exotic function** that stores `[[BoundThis]]`, `[[BoundTargetFunction]]`, and `[[BoundArguments]]` internally. On every call, the engine **ignores the call-site and invokes the target with the stored `this`** (plus prepended arguments).
- The binding is **permanent**: further `call`/`apply`/`bind` on a bound function cannot rebind `this`.
- `new` on a bound function is the one escape hatch — `construct` ignores `[[BoundThis]]` (but keeps curried args).

- [More detail on Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

---

### Question 011fcc8a-8309-4575-95b7-96c2f8d9e7dc

- Explain the exact algorithm `instanceof` runs. Why are BOTH `[] instanceof Array` and `[] instanceof Object` true? How does `Symbol.hasInstance` hijack the check?

### Answer

- **Algorithm**: if the right side has a `Symbol.hasInstance` method, call it with the left value. Otherwise, the default `Function.prototype[Symbol.hasInstance]` **walks the left operand's prototype chain**, returning `true` on the first link that `=== Ctor.prototype`, and `false` when the chain reaches `null`.
- `[] instanceof Array` → the instance's `[[Prototype]]` is `Array.prototype` → `true` immediately.
- `[] instanceof Object` → walk: `Array.prototype` (no match) → its `[[Prototype]]` is `Object.prototype` → **match** → `true`. The chain is linear, so every object passes `instanceof Object` (unless null-prototype).
- **Hijack**: `static [Symbol.hasInstance](value)` on a class replaces the walk entirely — any predicate, no prototype involved:

```javascript
class Even {
  static [Symbol.hasInstance](n) { return n % 2 === 0; }
}
4 instanceof Even; // true — no chain walk at all
```

- [More detail on instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
- [More detail on Symbol.hasInstance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance)

---

### Question 46bad652-f608-4343-930d-c1a01a3a75a5

- What does `super()` do internally in a derived class, and why does touching `this` before `super()` throw a `ReferenceError`?

### Answer

- A derived constructor **does not create its own `this`**. `super()` delegates instantiation to the parent chain: the engine allocates the instance using **`new.target.prototype`** (so a `new Sub()` still gets `Sub.prototype`), runs base field initializers and the base constructor body, and **returns the initialized `this`** which becomes available in the derived constructor.
- Method-form `super.method()` resolves through the method's **`[[HomeObject]]`**: `super` means "the prototype **of the object the method was defined on**", which is how the engine knows which "super" to use.
- Before `super()` returns, the derived constructor's `this` binding is in the **"uninitialized" state** — any read triggers `ReferenceError: Must call super constructor before accessing 'this'`. This guarantees base initialization happens exactly once, first.
- Consequence: a derived class with no explicit constructor gets a synthetic `constructor(...args) { super(...args); }`.

- [More detail on super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super)

---

### Question 7a309718-0302-4ad2-a96c-0b083fd2a48e

- Trace the **field initialization order** in a derived class: when do base fields, base constructor body, derived fields, and derived constructor body run? Why does the base constructor print `undefined` here?

```javascript
class Base {
  constructor() { this.init(); }        // runs before Sub's fields exist
}
class Sub extends Base {
  name = 'sub';
  init() { console.log(this.name); }
}
new Sub();
```

### Answer

- **Order**: (1) instance allocated with `new.target.prototype`; (2) **base class fields** initialize; (3) **base constructor body** runs; (4) **derived class fields** initialize — immediately after `super()` returns, before the rest of the derived constructor body; (5) **derived constructor body** continues.
- The snippet logs **`undefined`**: `this.init()` dispatches to `Sub.prototype.init` (methods are already on the prototype chain), but `Sub`'s instance field `name` **does not exist yet** — it is only installed at step 4.
- This is the JS version of the classic **"calling virtual methods from a base constructor"** trap from class-based languages — made sharper in JS because the uninitialized thing is data, not the method dispatch.
- Fix: pass the value into the base (`super('sub')`), or have `init()` tolerate partially-initialized state, or avoid template-method calls from base constructors.

- [More detail on Public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)

---

### Question 329b00d2-8aa3-4f86-9b14-41b40d3f7cd8

- Where do `static` methods and fields actually live? Explain static inheritance through `extends` and what `this` refers to inside a static method when called via a subclass.

### Answer

- Static members are own properties of the **class object itself** (which is a function) — never on `.prototype`, never copied to instances.
- `extends` wires the classes' `[[Prototype]]`: `Object.getPrototypeOf(Sub) === Base`. So `Sub.create()` finds `create` by walking **class-to-class**, a second inheritance axis parallel to the instance prototype chain.
- `this` in a static method is the **actual receiver**: `Sub.create()` runs `create` with `this === Sub`, which makes static factories polymorphic — `new this()` constructs a `Sub`.

```javascript
class A {
  static create() { return new this(); }
}
class B extends A {}
B.create() instanceof B; // true — this in create() is B
```

- Static **fields** re-initialize per class, but only if declared; they are looked up through the chain otherwise. `super.staticMethod()` works in static context and resolves via the class's `[[Prototype]]`.

- [More detail on static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static)

---

### Question 451f1a83-fb89-443d-94c4-5e6767df040c

- How is `#field` privacy enforced at runtime, and why can a subclass not even *write* `this.#secret` — yet inherited methods from the base CAN access it on subclass instances?

### Answer

- A `#field` is **not a property**: it is stored in the object's internal private-elements list, invisible to `Object.keys`, `for...in`, `JSON.stringify`, and `Reflect` — enforced by the **spec itself**, not convention.
- Private names are **lexically scoped to the class body that declares them**. Referencing `#secret` in any other class body is a **`SyntaxError` at parse time** — the name simply does not exist there, before any runtime access could be attempted.
- The base's methods are *written inside* the base's body, so `this.#secret` in `reveal()` is legal. When `new B()` runs, `super()` executes the base constructor, which **installs the private element on the B instance** — so inherited methods operate on subclass instances without the subclass ever seeing the name.
- Accessing a private field that was never installed (e.g., calling the method on a foreign object) throws **`TypeError`** at runtime — the "brand check".

- [More detail on Private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question 37c1784c-534f-4e38-b8c5-ae0c9068d105

- When do `get`/`set` accessors execute on a class or object literal? Show the `Object.defineProperty` equivalent and one invariant they can protect.

### Answer

- Accessors run **on property access and assignment** — the caller writes `user.age` and unknowingly invokes a function; there is no way to tell accessor vs data property from the syntax alone.
- Accessors live on the **prototype** in classes (shared, non-enumerable by default), so they do not bloat instances.

```javascript
const obj = {};
Object.defineProperty(obj, 'age', {
  get() { return this._age; },
  set(v) {
    if (typeof v !== 'number' || v < 0) throw new RangeError('invalid age');
    this._age = v;
  },
  enumerable: true,
  configurable: true,
});
```

- Invariant example: a setter **validates/clamps before assignment**, so the object can never hold an invalid state — the same contract a `#private` field + getter/setter pair enforces in a class.
- Gotcha: defining **only a `get`** makes the property effectively read-only — assignment silently fails (or throws in strict mode).

- [More detail on getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)
- [More detail on setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set)

---

### Question 02dc3921-a85d-44fd-acdb-f963f10efe28

- What does `new.target` evaluate to in: a direct `new Foo()` call, a derived-class constructor, and a plain function call? How does this enable detecting "was I constructed directly?"

### Answer

- In `new Foo()` inside `Foo`'s body: **`Foo` itself** — a reference to the constructor invoked by `new`.
- In a **base constructor during `new Sub()`**: still **`Sub`** — `new.target` propagates down the `super()` chain unchanged, which is why built-ins allocate instances with `new.target.prototype` and subclassing `Error` works.
- In a plain **`Foo()` call**: **`undefined`** — the classic "did I get `new` or not" test.
- Direct-construction guard (abstract base classes):

```javascript
class Shape {
  constructor() {
    if (new.target === Shape) throw new TypeError('Shape is abstract');
  }
}
class Circle extends Shape {}
new Circle(); // ok — new.target === Circle
new Shape();  // throws
```

- [More detail on new.target](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target)

---

### Question ee3ec441-c433-4691-8d21-c7658cad88f9

- How does `super.method()` inside an **object literal's** method find its target — and why does `greet: () => super.greet()` not even parse?

### Answer

- A method defined in an object literal gets an internal **`[[HomeObject]]`** equal to the literal itself. `super.method()` means: look up `method` on **the prototype of the home object** — i.e., whatever `__proto__:` was set to **at creation time**.
- The binding is frozen at creation: reassigning the literal's prototype later (or moving the method to another object) does **not** redirect `super` — the home object is what counts.
- Arrow functions have **no `[[HomeObject]]`** and no own `this`/`super` binding, so `super` inside one is a **`SyntaxError`** — it cannot borrow super from a lexical home the way it borrows `this`.

```javascript
const proto = { greet() { return 'proto'; } };
const obj = {
  __proto__: proto,
  greet() { return super.greet() + '!'; } // works: method has a home object
};
obj.greet(); // "proto!"
```

- [More detail on super in object literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super)

---

### Question afd2fd74-2ea2-46bf-97c0-8912cb51bca7

- Class vs factory function vs closure-based module for the same encapsulated unit: compare `this` pitfalls, real privacy, prototype memory sharing, performance, and testability. When would you pick each?

### Answer

- **Class**: methods shared on the prototype (one copy, many instances); engines optimize instances with identical shape (**monomorphic hidden classes**); `instanceof` works; `this` pitfall exists for extracted/regular callbacks; true privacy requires `#` fields.
- **Factory** (`createUser()` returning a plain object): no `this` at all — the entire call-site pitfall disappears; privacy via closures is free; but per-instance methods cost memory (or must be manually shared), and there is no `instanceof` contract — callers rely on **structural shape** (duck typing).
- **Closure module** (singleton/state machine): state is captured, fully private, no `this`; ideal for one-of-a-kind units where inheritance is irrelevant.
- **Pick**: class for domain types with an is-a contract and hot paths; factory for small value objects / records where `this` is a liability; closure module for singletons. All three produce objects with methods — only the tradeoffs differ.

- [More detail on Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

---

### Question 0ef47d5f-c552-45a4-aadd-3e7c4edc1c3b

- Why is "favor composition over inheritance" standard advice in JS specifically? Explain the fragile base class problem and how a prototype chain couples subclass behavior to base internals.

### Answer

- **Fragile base class problem**: a base class change to an internal method or field cascades into every subclass that (implicitly) depended on that implementation — even though the *contract* never changed. Inheritance couples subclasses to **how** the base works, not just what it promises.
- In JS the chain is a **live delegation link**, so the coupling is dynamic: the base can even replace a method at runtime after subclasses were written, and every subclass instantly changes behavior.
- **Gorilla-banana problem**: `extends Base` to reuse one helper drags in the base's whole state graph and dependencies; `super()` side effects run on every construction, making subclass tests require the entire ancestry.
- **Composition** replaces the link with explicit collaborators (`constructor(engine, tank)`): dependencies are visible, injectable, mockable, and swappable at construction time instead of frozen at author time.

- [More detail on Object-oriented JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)

---

### Question 620e06ec-0f4a-4bca-a888-f216cb76b851

- When IS `extends` the right tool despite the advice? Give the concrete signal versus the "has-a / uses-a" case where a mixin or composition wins.

### Answer

- The signal for `extends` is a **stable is-a relationship with polymorphic dispatch**: every subtype truly satisfies the base's contract (Liskov substitutability), and callers invoke the same method on the base type and get subtype-specific behavior.
- Legitimate uses: **subtyping framework hooks** (`class MyError extends Error`, `class MyArray extends Array`), and domain taxonomies that are closed and stable (`class ValidationError extends AppError`).
- "has-a / uses-a" → composition: `Car` uses an `Engine` — pass it in, delegate calls. Multiple orthogonal capabilities (Serializable + Loggable) → **mixins**, because JS has single inheritance and forcing capabilities into a chain creates rigid taxonomies.
- Rule of thumb: extend **types**, compose **behaviors**.

- [More detail on extends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends)

---

### Question f994f0fa-63c1-4df0-91c6-21bbed19ae09

- `#private` field vs closure variable vs TypeScript `private`: when is each enforced, what does each cost at runtime, and why does TS `private` still leak at runtime boundaries?

### Answer

- **`#field`**: enforced by the **engine at runtime** (parse-time scoping + `TypeError` brand checks); methods stay on the shared prototype, so memory layout stays optimal. Visible only inside the declaring class body.
- **Closure variable**: enforced by **lexical scope** — total privacy even pre-`#`, and even from other methods of the "class"; cost: every method that touches it must be created per instance inside the closure, defeating prototype sharing.
- **TypeScript `private`**: enforced **only at compile time** and **erased** in emitted JS — the property becomes a normal enumerable own property. At runtime it appears in `Object.keys`, is reachable via `any` casts, and survives `JSON.stringify`, so it must never be trusted at a trust boundary (e.g., data crossing to client bundles or API responses).

```typescript
class A { private x = 1; #y = 2; }
Object.keys(new A()); // ["x"] — TS private leaks, #y does not
```

- [More detail on Private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question 3381a6ce-b08a-4e26-85fd-1b961d8a5392

- What are the real costs of deep class hierarchies in a React/Next codebase? When does flat composition with small interfaces win?

### Answer

- **Coupling/mocking**: constructing a leaf class runs every ancestor constructor; unit tests need the whole ancestry or heavy stubbing, and refactors ripple through the tree.
- **Bundling**: `extends` is a static dependency — importing a leaf pulls the entire ancestor graph into the chunk, hurting tree-shaking and code-splitting.
- **Hidden temporal coupling**: field-initialization order and base-constructor template calls (the `super()` + overridden-method trap) create bugs that only appear at specific depths.
- **Flat composition wins** when capabilities are orthogonal: small classes/modules with narrow interfaces, wired at composition root (or via props/context in React), keep each piece independently testable and deletable. Reserve hierarchies for genuinely substitutable type families.

- [More detail on Inheritance](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance)

---

### Question e9e926ed-3750-4225-8b5a-323f3fd4aeb3

- Implement `myInstanceof(obj, Ctor)` from scratch by walking the prototype chain — where must the loop stop, and what edge does `Symbol.hasInstance` add?

### Answer

- Walk `Object.getPrototypeOf` until **`null`** (end of chain), comparing each link against `Ctor.prototype` with strict identity.

```javascript
function myInstanceof(obj, Ctor) {
  if (Ctor != null && typeof Ctor[Symbol.hasInstance] === 'function') {
    return !!Ctor[Symbol.hasInstance](obj);
  }
  let proto = Object.getPrototypeOf(obj ?? Object(obj)); // real instanceof returns false for primitives; simplest: bail out
  while (proto !== null) {
    if (proto === Ctor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

- Edges: the **`null`** terminator prevents infinite loops (circular prototypes are impossible by spec); **primitives** return `false` in the spec's `OrdinaryHasInstance` ("if O is not an Object, return false") — so guard non-objects before calling `Object.getPrototypeOf`, which throws on `null`/`undefined`.
- The `Symbol.hasInstance` branch must be honored **first** — a custom hook replaces the walk entirely.

- [More detail on instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)

---

### Question 84ba02fb-ad8a-4e0c-a822-4eab2a603390

- Write a mixin that composes behavior into a class WITHOUT breaking `instanceof` on the original class, and explain why the naive `Object.assign(Child.prototype, behavior)` is sufficient.

### Answer

- **Naive mixin** — copy own enumerable methods onto the target prototype:

```javascript
const canGreet = { greet() { return `hi ${this.name}`; } };

class User {}
Object.assign(User.prototype, canGreet);
new User().greet();       // works
new User() instanceof User; // true — prototype identity never changed
```

- It is sufficient because `instanceof` compares the instance's `[[Prototype]]` to `User.prototype` by **identity**; adding properties does not change the link. This matches how class methods are just properties of the prototype.
- **Class-factory mixin** — cleaner for `super` and composition:

```javascript
const Greetable = (Base) => class extends Base {
  greet() { return `hi ${this.name}`; }
};
class User extends Greetable(Object) {}
```

- Caveats: `Object.assign` copies only **own enumerable** props (use `getOwnPropertyNames` for symbols/hidden), name collisions are last-wins, and mixins get no `super` wiring to the target.

- [More detail on Mix-ins](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes#mix-ins)

---

### Question 1ba280f5-e35d-49e5-894d-42b6dbeb3e6b

- Design an abstract-base-class pattern in plain JS: throw on direct construction, require subclasses to implement a method, and explain why JS has no `abstract` keyword to do this for you.

### Answer

```javascript
class Shape {
  constructor() {
    if (new.target === Shape) {
      throw new TypeError('Shape is abstract — construct a subclass');
    }
    if (typeof this.area !== 'function') {
      throw new TypeError(`${new.target.name} must implement area()`);
    }
  }
}

class Circle extends Shape {
  constructor(r) { super(); this.r = r; }
  area() { return Math.PI * this.r ** 2; }
}
```

- **`new.target === Shape`** detects direct construction (a subclass call carries `new.target = Sub`).
- The `this.area` check works because **prototype methods exist before any constructor body runs** — only instance fields would be uninitialized at that point.
- No `abstract` keyword because JS classes are **runtime first-class values**: there is no compile step to enforce abstraction, so the language offers the runtime primitives (`new.target`, `Symbol.hasInstance`, `#` brand checks) to build the pattern instead.

- [More detail on new.target](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target)

---

### Question e6d1eb36-c5d7-4e68-92e5-420cbb255822

- Refactor this hierarchy into composition — which pieces become collaborators, and what replaces the polymorphic method calls?

```javascript
class Engine { start() { /* ... */ } }
class FuelTank { refuel() { /* ... */ } }
class Vehicle extends Engine { /* but also needs FuelTank... */ }
```

### Answer

- `Engine` and `FuelTank` become **collaborators held in fields**, injected via the constructor; `Vehicle` **delegates** (forwards) calls — delegation replaces polymorphic dispatch.

```javascript
class Vehicle {
  #engine;
  #tank;
  constructor({ engine, tank } = {}) {
    this.#engine = engine ?? new Engine();
    this.#tank = tank ?? new FuelTank();
  }
  start() { this.#engine.start(); }  // forwarding
  refuel(liters) { this.#tank.refuel(liters); }
}
```

- Gains: `Vehicle` no longer **is** an engine (the model bug disappears); each collaborator is independently testable and injectable as a fake; capabilities combine without a taxonomy.
- Polymorphism survives via **duck-typed collaborators**: any object with `start()` can be injected — interfaces by shape, not by lineage.

- [More detail on Inheritance vs composition](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance)

---

### Question b0372fec-5286-492b-a9b7-c83f25d613bc

- Convert a class with a mutable public field into one using `#field` + a validating getter/setter. What invariant does this protect that a public field cannot?

### Answer

```javascript
// before: public field — any code can write any value
class ThermostatBad { temp = 20; }

// after: private state + validating accessor
class Thermostat {
  #temp = 20;
  get temp() { return this.#temp; }
  set temp(v) {
    if (typeof v !== 'number' || v < 10 || v > 30) {
      throw new RangeError('temp must be 10–30');
    }
    this.#temp = v;
  }
}
```

- The protected **invariant** is "the value always satisfies the rule" — with a public field, `t.temp = 999` is unguardable; with `#temp` + setter, **every write passes validation**, so no consumer can ever observe an invalid state.
- A read-only property needs only a getter (assignment then fails silently or throws in strict mode). This is the difference between *encapsulation as invariant protection* and mere data hiding.

- [More detail on Private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question 957ca537-9fdf-4977-b26e-1f9f3cfb74eb

- When is `Object.create(null)` the right container for a lookup dictionary? Compare with `Map` — which do you reach for today and why?

### Answer

- `Object.create(null)` gives a **null-prototype dictionary**: no inherited keys (`toString`, `constructor`, `valueOf`), so `'toString' in dict` is your own data or `false` — immune to **prototype pollution** and key-collision surprises with untrusted input.
- **`Map` is the default today**: arbitrary key types (objects, `NaN`, primitives), guaranteed **insertion order**, `size`, direct iteration, and no accidental string coercion of keys — plus engines optimize frequent add/delete far better than dictionary objects.
- Reach for `Object.create(null)` when you specifically need **object semantics** — dot access, spread/destructuring, `Object.entries` interop, JSON-shaped payloads — without inherited members leaking into `for...in` or `in` checks.

```javascript
const seen = Object.create(null);
seen[userInput] = true;   // '__proto__'? safely a plain key? — note: assignment of '__proto__' on null-proto objects sets a plain own property
```

- Caveat: on null-prototype objects, assigning the key `'__proto__'` creates a plain own property (no setter), which is exactly why this shape is safe for untrusted keys.

- [More detail on Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

---

### Question 1d369bc0-be8b-46b0-b3d2-0705a077a271

- Implement a polymorphic static factory: `A.create()` returns `new A()`, but `B.create()` (B extends A) returns a `B` without overriding `create`. What property of static `this` makes this work?

### Answer

```javascript
class A {
  static create(...args) { return new this(...args); }
}
class B extends A {}

A.create() instanceof A; // true
B.create() instanceof B; // true — no override anywhere
```

- `create` is found via **static inheritance** (`B.[[Prototype]] === A`), and `this` inside a static method is the **actual receiver** — `B.create()` runs it with `this === B`, so `new this()` constructs a `B`.
- This is **late binding on the class object**: one factory implementation, subtype-correct construction everywhere — the class-level mirror of polymorphic method dispatch.
- Contrast: hardcoding `new A()` inside `create` would freeze the type and return wrong instances for every subclass.

- [More detail on static](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static)

---

### Question 96255dda-6fcc-4c44-b097-2575a4b0ea69

- This timer's `seconds` never updates — it actually throws. Trace why:

```javascript
class Timer {
  seconds = 0;
  start() {
    setInterval(function () { this.seconds++; }, 1000);
  }
}
```

### Answer

- The callback is a **plain function** invoked by `setInterval` as a **standalone call** — no receiver, so `this` resolves via the default rule.
- Class bodies are **always strict mode**, and strict standalone calls get **`this === undefined`** — so the first tick throws `TypeError: Cannot read properties of undefined (reading 'seconds')` (or on incrementing). In sloppy mode it would instead mutate `globalThis.seconds` — silent global leak.
- **Fix**: an **arrow function** ignores the call-site and captures `this` lexically from `start()`, where `this` is the timer instance:

```javascript
start() {
  setInterval(() => { this.seconds++; }, 1000);
}
```

- Rule: `function` callbacks that need the object → `bind` or arrow; the surrounding method already has the right `this`.

- [More detail on this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

---

### Question 65ecc1d4-7c6d-4f7e-b1e7-07930f45b3f6

- Why does this throw while the `function` version works? What exactly is hoisted for a `class`?

```javascript
const c = new Circle(2); // ???
class Circle {}
```

### Answer

- A `class` declaration is **hoisted but uninitialized** — the binding exists in the scope, yet stays in the **temporal dead zone** until execution reaches the declaration. `new Circle()` before that throws **`ReferenceError: Cannot access 'Circle' before initialization`**.
- Function declarations are hoisted **fully initialized** (identifier and function object both), so `new Circle(2)` above `function Circle() {}` works.
- Mechanically the class binding behaves like `let`/`const`: block-scoped, TDZ until evaluation. Class **expressions** (`const C = class {}`) behave identically once assigned.
- Runtime reason: class evaluation must set up `extends` wiring, `constructor`, and methods before the binding can be used — the engine defers that instead of pre-initializing like functions.

- [More detail on Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

---

### Question 76e52c63-422f-4ae0-8e9c-07aeba8b9d1b

- What does this print and in what order do the pieces run? Explain via field-initialization timing.

```javascript
class Base {
  constructor() { console.log('in base:', this.name); }
}
class Sub extends Base {
  name = 'sub';
  constructor() {
    super();
    console.log('after super:', this.name);
  }
}
new Sub();
```

### Answer

- Output: **`in base: undefined`** then **`after super: sub`**.
- Order of operations for `new Sub()`: allocate instance → run `super()` → base has no fields → **base constructor body** (`this.name` not yet defined → `undefined`) → **derived instance fields initialize** (`name = 'sub'`) → rest of **derived constructor body** (`'sub'`).
- The general rule: derived field initializers run **immediately after `super()` returns**, not before the base constructor and not after the derived constructor body.
- This is why template methods called from base constructors see partially-initialized derived state — data arrives later than dispatch does.

- [More detail on Public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)

---

### Question f8882e33-0c37-4df6-a803-3eba2a5462a1

- Explain both results: why does the first check fail after the prototype reassignment, and what does `Object.setPrototypeOf` do to V8's hidden-class optimizations?

```javascript
function A() {}
A.prototype = { greet() { return 'hi'; } };
new A().constructor === A; // ?
new A() instanceof A;      // ?
```

### Answer

- `new A().constructor === A` → **`false`**: the object-literal prototype has **no own `constructor`** property, so lookup falls through the chain to `Object.prototype.constructor === Object`.
- `new A() instanceof A` → **`true`**: `instanceof` only compares the instance's `[[Prototype]]` to `A.prototype` by **identity** — the object literal IS the current `A.prototype`, so it matches regardless of the missing `constructor` (which is only a fallible hint, never authority).
- `Object.setPrototypeOf` (or `obj.__proto__ =`) mutates an existing object's shape: V8 must **transition/deprecate the object's hidden class**, invalidating inline caches and monomorphic call sites (→ megamorphic, deopt) — versus `Object.create`/`new`, which allocate with the right shape from the start. Set the prototype **at creation time**, never after.

- [More detail on Object.setPrototypeOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf)

---

### Question 797b3ece-34a5-4ae4-9446-6cf50a6105a3

- This classic React class component crashes on click. Explain the call-site that loses `this`, then show the two canonical fixes and why the arrow class field works.

```jsx
class Button extends React.Component {
  handleClick() { console.log(this.props.label); }
  render() {
    return <button onClick={this.handleClick}>go</button>;
  }
}
```

### Answer

- React stores `this.handleClick` (already **extracted**) and invokes it as a standalone function on the event — there is no `button.handleClick()` receiver, and class code is strict, so inside the handler **`this` is `undefined`** → `TypeError: Cannot read properties of undefined (reading 'props')`.
- **Fix 1 — bind once** in the constructor: `this.handleClick = this.handleClick.bind(this);` — every later call uses the stored `[[BoundThis]]`.
- **Fix 2 — arrow class field**: `handleClick = () => {...}` is an **instance field initialized per instance**, capturing the constructor's `this` lexically; call-site binding is bypassed entirely.

```jsx
class Button extends React.Component {
  handleClick = () => { console.log(this.props.label); }; // field, not method
  render() { return <button onClick={this.handleClick}>go</button>; }
}
```

- The field costs one function per instance (methods on the prototype cost one total); irrelevant at typical button counts.

- [More detail on this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

---

### Question 992232f6-09fb-4e13-b951-3ce1fc8f9042

- Explain the asymmetry: why does the inherited method succeed but the direct property access fail to even parse, and what installed `#secret` onto the `B` instance?

```javascript
class A {
  #secret = 1;
  reveal() { return this.#secret; }
}
class B extends A {}
new B().reveal(); // ?
new B().#secret;  // ???
```

### Answer

- `new B().reveal()` → **`1`**: private names are **lexically scoped to the declaring class body** — `reveal`'s code lives inside `A`, so `this.#secret` is legal there. `new B()` ran `A`'s constructor via `super()`, which **installed the private element** `#secret` on the `B` instance, so the read succeeds (brand check passes).
- `new B().#secret` at top level → **`SyntaxError`** (not a runtime `TypeError`): the token `#secret` simply does not exist outside `A`'s body, and the parser rejects it before anything runs. `B`'s own body could not reference it either.
- Private fields therefore do **not participate in inheritance or the prototype chain** — they are per-instance slots with class-lexical visibility. Runtime `TypeError` only appears when a method accessing `#secret` meets an object that lacks the brand (e.g., `A.prototype.reveal.call({})`).

- [More detail on Private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question 96a853e8-1c54-426f-a02f-ea8a36cbe8e1

- Recursive setter — why does this overflow the stack, and what is the minimal fix?

```javascript
class User {
  set name(v) { this.name = v; } // ???
}
```

### Answer

- Inside the setter, `this.name = v` is an **assignment to the same property name**, which **re-invokes the setter** with no base case — infinite recursion ends in **`RangeError: Maximum call stack size exceeded`**. Accessors are not "fields with hooks"; every read/write dispatches to them.
- **Minimal fix**: back the property with a **private field** (or differently-named property) so the setter writes data, not the accessor:

```javascript
class User {
  #name;
  get name() { return this.#name; }
  set name(v) { this.#name = String(v).trim(); }
}
```

- The same recursion trap applies to getters returning `this.name`.

- [More detail on setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set)

---

### Question 15a8f9e9-1baf-47c3-a4e7-c2b3d19b7047

- Custom `instanceof` — trace what runs and why the check returns true:

```javascript
class Even {
  static [Symbol.hasInstance](n) { return n % 2 === 0; }
}
4 instanceof Even; // ?
```

### Answer

- `4 instanceof Even` → **`true`**.
- The `instanceof` operator first looks for **`Even[Symbol.hasInstance]`** — a static method on the class — and calls it with the left operand: `Even[Symbol.hasInstance](4)` → `4 % 2 === 0` → `true`.
- The **prototype-chain walk never runs**: a `Symbol.hasInstance` implementation fully replaces the default algorithm, so "instance" becomes whatever predicate you define — even for primitives, which normally always fail `instanceof`.
- Notes: the method must be `static` (it lives on the class object), is consulted on the **right-hand** operand, and should return a boolean (the spec coerces via `ToBoolean`).

- [More detail on Symbol.hasInstance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance)

---

### Question 12740079-63bf-412d-b0b2-85e6f9a42fc8

- What does each call return and why? Where do `super`-in-literal methods get their target, and what happens if you write `greet: () => super.greet()` instead?

```javascript
const proto = { greet() { return 'proto'; } };
const obj = {
  __proto__: proto,
  greet() { return super.greet() + '!'; }
};
obj.greet(); // ?
```

### Answer

- `obj.greet()` → **`"proto!"`**: the method `greet` was defined in the literal, so it got a **`[[HomeObject]]`** = `obj`; `super.greet()` resolves `greet` on **the prototype of that home object** — `proto` — yielding `'proto'`, then `+ '!'`.
- Replacing the method with `greet: () => super.greet()` → **`SyntaxError` at parse time**: arrow functions have no own `this`/`super` and no `[[HomeObject]]`, so `super` is not valid inside one (it cannot lexically borrow a home object the way it borrows `this`).
- The home object is fixed **at creation** from the literal's `__proto__:` — reassigning the prototype later does not retarget `super`.

- [More detail on super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super)

---

### Question 1c480d19-df56-405b-ae06-227170c842f0

- Why did `instanceof MyError` break when `class MyError extends Error` was transpiled to ES5 constructor functions, and why does it work natively? What does the base `Error` constructor do with `this`?

### Answer

- **Native classes**: `class MyError extends Error` — `super()` invokes `Error` with **`new.target === MyError`**, so the spec's `Error` constructor allocates the instance using `MyError.prototype` and returns it; `this` is correctly branded, and `instanceof MyError` is `true`.
- **ES5 transpilation**: subclasses call the parent as `Error.call(this, msg)`. `Error` is one of the **exotic constructors that ignores `this` entirely when called as a function** — it constructs and **returns a brand-new Error object**.
- Babel-era helpers honored the "`new` rule — an explicit object return replaces `this`", so `_possibleConstructorReturn` returned that fresh Error as the instance. Its `[[Prototype]]` is **`Error.prototype`, not `MyError.prototype`** → `e instanceof MyError` → **`false`**.
- ES5 workaround was to skip `Error.call` and manually assign `this.message`/`this.name` (with the prototype chain set via `Object.create`); the real fix arrived with native classes, which pass `new.target` through the chain precisely so built-in constructors allocate subclass instances.

- [More detail on Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [More detail on extends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends)

---
