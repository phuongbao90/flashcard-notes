# TypeScript Classes & OOP

### Question 62eebda0-7362-47d0-ac0b-de7ee0675416

- What two things does a class declaration create?

### Answer

- A **value** (the constructor function, usable with `new`, `extends`, `instanceof`) and a **type** (the instance shape).
- `ClassName` in type position means instances; `typeof ClassName` means the constructor/static side.
- This split is why you can pass a class around as a runtime value and still annotate instances precisely.

```ts
class User { constructor(public name: string) {} }
let u: User = new User("a");     // instance type
let C: typeof User = User;        // constructor type
```

- [More detail on Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [More detail on typeof type operator](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)

---

### Question f169e4c4-46f8-47ef-abb2-7d550018ee11

- What are parameter properties and what do they emit?

### Answer

- Modifiers on constructor parameters (`public`, `private`, `protected`, `readonly`) both declare a field and assign it.
- They emit the field assignment in the constructor (and a declaration depending on `useDefineForClassFields`).
- They are TS-specific syntax and are rejected by `erasableSyntaxOnly` environments.

```ts
class User {
  constructor(private readonly id: string, public name: string) {}
}
// → one field per parameter, assigned in the constructor
```

- [More detail on Parameter Properties](https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties)
- [More detail on erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig#erasableSyntaxOnly)

---

### Question 6a898bc7-b5c7-432c-90e8-75ce76f31359

- Do `public`, `private`, and `protected` enforce anything at runtime?

### Answer

- **No.** They exist only in the type checker; the emitted JS has a plain property.
- `private` blocks access from other code **in the same type system** (same declaration for class compatibility), `protected` allows subclass access.
- Anything can still read the property via `(x as any).secret` or at runtime in a debugger; use `#` fields for real privacy.

```ts
class A { private secret = 1; }
const a = new A();
a.secret;              // Error
(a as any).secret;      // allowed
```

- [More detail on member visibility](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)
- [More detail on private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question 9223620d-fc65-4568-95e8-c2f109b4fa65

- How do `private` fields and `#` private fields differ?

### Answer

- `private x` is **type-level**: same class members are nominal-ish, but runtime access is unrestricted.
- `#x` is **runtime-enforced** ECMAScript privacy: access outside the class body throws a SyntaxError-level error, and it cannot be bypassed with `as any`.
- `#x` also participates in `in`-based narrowing: `#x in obj`.

```ts
class A { #secret = 1; private secret = 2; has(#x: any) { return #x in this; } }
```

- [More detail on ECMAScript private fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)
- [More detail on member visibility](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)

---

### Question add6736a-d1cf-4b1f-a834-8be2d662ef03

- What rules does `readonly` follow for class fields?

### Answer

- A readonly field may be assigned **only in the declaration or the constructor** (or a parameter property).
- Assignment elsewhere — including in lifecycle methods — is a compile error.
- It is shallow: a readonly object field can still have its contents mutated.

```ts
class A {
  readonly id: string;
  constructor(id: string) { this.id = id; }
  reset() { this.id = ""; } // Error
}
```

- [More detail on readonly fields](https://www.typescriptlang.org/docs/handbook/2/classes.html#readonly)
- [More detail on readonly properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)

---

### Question 2e0cdfba-f99c-4f05-9aeb-ba5f8095536e

- How does `static` differ from instance members in the type system?

### Answer

- Statics live on the **constructor type** (`typeof Class`), instances do not see them.
- `this` inside a static method refers to the constructor (and is polymorphic over subclasses).
- Static members are inherited by subclasses unless `static` is combined with access restrictions.

```ts
class Counter {
  static total = 0;
  static create() { return new Counter(); }
}
Counter.total; // OK
const c = new Counter();
c.total;       // Error
```

- [More detail on static members](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)
- [More detail on class statics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static)

---

### Question 7dc7aaa2-1cf1-442a-9c49-5752ef6ba516

- What are static blocks for?

### Answer

- A `static { ... }` block runs once at class definition time and can access `static #private` fields — something you cannot do outside the class.
- Multiple static blocks run in declaration order, interleaved with static field initializers.
- Use them for multi-statement static initialization that needs private state.

```ts
class Registry {
  static #map = new Map<string, number>();
  static { Registry.#map.set("a", 1); }
}
```

- [More detail on static initialization blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks)
- [More detail on static members](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)

---

### Question 0f5e2c0a-3d94-4287-b849-0d9b2c23886e

- Why must `super()` be called before accessing `this` in a derived class?

### Answer

- In JS, `this` is not initialized until the base constructor runs; accessing it earlier is a runtime error.
- TS enforces it at compile time: "super must be called before accessing 'this'".
- If the derived class declares no constructor, the compiler inserts one that forwards arguments.

```ts
class Base { constructor(public id: string) {} }
class Child extends Base {
  constructor() { super("id"); this.id.toUpperCase(); } // after super only
}
```

- [More detail on extends and super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super)
- [More detail on derived classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#extends-clauses)

---

### Question 5359dbe1-e47b-46d3-abb5-d64a7198315a

- What does the `override` keyword do and why enable `noImplicitOverride`?

### Answer

- `override` documents that a method replaces a base method and makes the compiler verify the base actually has a compatible member.
- With `noImplicitOverride`, forgetting `override` is an error — this catches bugs when a base method is renamed or removed.
- It is required even for accessors; it does not affect emitted JS.

```ts
class Base { greet() {} }
class Child extends Base { override greet() {} }
```

- [More detail on override](https://www.typescriptlang.org/docs/handbook/2/classes.html#override)
- [More detail on noImplicitOverride](https://www.typescriptlang.org/tsconfig#noImplicitOverride)

---

### Question d8d74aa6-b2f9-4e12-9978-2bbb6dd5a77b

- What must remain compatible when overriding a method?

### Answer

- The override's parameters must accept everything the base type promises (contravariant), and the return type must be assignable to the base return type (covariant).
- Method syntax is checked **bivariantly** (an unsound exception shared with interfaces), so a wrong parameter type can slip through.
- Return type changes to a narrower subtype are allowed and enable polymorphic use.

```ts
class Base { find(id: string | number): object { return {}; } }
class Child extends Base { override find(id: string | number): Date { return new Date(); } } // OK
```

- [More detail on overriding](https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding-methods)
- [More detail on function parameter bivariance](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#function-parameter-bivariance)

---

### Question f05c667f-6556-4716-a827-c85ebfb04993

- How does polymorphism work with subclasses in TS?

### Answer

- A subclass instance **is assignable to the base class type** (structural + nominal `private` constraints), so it can be stored in base-typed variables/containers.
- Calls dispatch virtually at runtime, so the derived override runs even though the static type is the base.
- TS only lets you call members declared on the static type; call derived-only members after narrowing via `instanceof`.

```ts
class Animal { speak() { return "..."; } }
class Dog extends Animal { override speak() { return "woof"; } }
const pets: Animal[] = [new Dog()];
pets[0].speak(); // "woof" (static type Animal)
```

- [More detail on inheritance](https://www.typescriptlang.org/docs/handbook/2/classes.html#extends-clauses)
- [More detail on instanceof narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing)

---

### Question 39d6af7d-01af-4de1-b77d-085cd1ac72d1

- What is `super.method()` used for in an override?

### Answer

- It calls the **base implementation** of the same method, allowing the subclass to extend rather than replace behavior.
- It preserves `this` as the derived instance, so base methods operate on derived state.
- It is a runtime call (JS semantics), fully typed by TS.

```ts
class Logger { log(m: string) { console.log(m); } }
class Tagger extends Logger { override log(m: string) { super.log(`[tag] ${m}`); } }
```

- [More detail on super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super)
- [More detail on overriding methods](https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding-methods)

---

### Question a8d53f51-8acd-42f6-99f7-9ae226672e2e

- What does `strictPropertyInitialization` enforce, and how do you satisfy it?

### Answer

- Every declared instance field must be **definitely assigned** by the end of the constructor (or have an initializer).
- Fixes: initialize at declaration, assign in the constructor, use a parameter property, or assert with `!` when initialization happens elsewhere (lifecycle methods, DI frameworks).
- `declare` fields are exempt because they assert an existing runtime field.

```ts
class A {
  id!: string;               // assigned later (DI/test setup)
  name = "x";                // initializer
  constructor(public age: number) {}
}
```

- [More detail on strictPropertyInitialization](https://www.typescriptlang.org/tsconfig#strictPropertyInitialization)
- [More detail on definite assignment assertions](https://www.typescriptlang.org/docs/handbook/2/classes.html#strict-property-initialization)

---

### Question 2678683d-dbc6-448b-bf62-344338fb0fac

- What does `useDefineForClassFields` change about class fields?

### Answer

- When enabled (default for `target: ES2022+`/`ESNext`), fields are defined with `Object.defineProperty` semantics (`[[Define]]`) instead of assignment (`[[Set]]`).
- That changes behavior when a base class defines a setter for the same name: the derived field now shadows it instead of calling the setter.
- It also means declared fields without initializers create `undefined` properties, so `declare` is needed for type-only field declarations.

```ts
class A { declare x: string; } // type-only, no runtime field
```

- [More detail on useDefineForClassFields](https://www.typescriptlang.org/tsconfig#useDefineForClassFields)
- [More detail on class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)

---

### Question 16f68596-eb93-4f64-9819-7b9026264a66

- Why does a class field initializer run before the constructor body, and what does that imply for arrow-function fields?

### Answer

- Instance fields are initialized in declaration order **immediately after `super()`** and before the constructor body statements.
- Arrow-function fields therefore capture `this` early and stay bound, which is why they are common for callbacks.
- They also create a new function per instance, unlike prototype methods which are shared.

```ts
class B {
  n = 1;
  inc = () => this.n++;        // per-instance function, bound this
  dec() { this.n--; }          // shared prototype method
}
```

- [More detail on class field initialization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)
- [More detail on arrow function fields](https://www.typescriptlang.org/docs/handbook/2/classes.html#arrow-functions)

---

### Question ff8b0bbb-db40-4fd2-ac7a-6dd55e5ca5bc

- How do accessors behave in TypeScript?

### Answer

- `get`/`set` pairs declare a property-like member; the property's type is the getter's type when both exist.
- Since TS 4.3, getter and setter types may differ: the getter's type is the read type, and the setter's type must be assignable from the getter's type for typical use.
- A getter without a setter is effectively `readonly`.

```ts
class A {
  #v = "";
  get value(): string { return this.#v; }
  set value(v: string) { this.#v = v; }
}
```

- [More detail on accessors](https://www.typescriptlang.org/docs/handbook/2/classes.html#getters--setters)
- [More detail on getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)

---

### Question d6df93a6-0ef6-4298-8c40-4719b05603a6

- Why do private/protected members make classes nominal?

### Answer

- A class with a `private`/`protected` member is only assignable to another class type if the member originates from the **same declaration**.
- Two structurally identical classes with private fields are therefore not interchangeable, which models intent better than pure shape matching.
- `#` fields behave the same way, with real runtime privacy.

```ts
class A { private x = 1; }
class B { private x = 1; }
const a: A = new B(); // Error: separate declarations
```

- [More detail on classes and structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#private-and-protected-members)
- [More detail on member visibility](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)

---

### Question 13e38d1a-7fc9-46ca-8dc5-c0b1eae4ddfb

- How do you narrow an unknown value with `instanceof`?

### Answer

- `x instanceof Foo` narrows `x` to `Foo` inside the branch, provided `Foo` is a constructor value.
- It checks the prototype chain at runtime, so subclasses also match; combine with a discriminant or exact check when that matters.
- Cross-realm/in-multiple-bundle instances make `instanceof` unreliable; prefer structural guards for libraries.

```ts
function handle(e: Error | string) {
  if (e instanceof Error) e.message;
  else e.toUpperCase();
}
```

- [More detail on instanceof narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing)
- [More detail on instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)

---

### Question 788771c9-c087-418e-aff9-311c75d50fdf

- Can constructors be overloaded?

### Answer

- Yes: multiple constructor signatures before one implementation signature, same as function overloads.
- The implementation signature must accept every overload's arguments; callers only see overload signatures.
- Type and value checking of `new` uses those signatures.

```ts
class Box {
  value: string;
  constructor(v: string);
  constructor(v: number);
  constructor(v: string | number) { this.value = String(v); }
}
```

- [More detail on constructor overloads](https://www.typescriptlang.org/docs/handbook/2/classes.html#overloads)
- [More detail on overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question 7e6a7e0d-7cea-40cb-b59f-ea2835608522

- How do you write a mixin that preserves the base class type?

### Answer

- Use a generic constructor type and return a new class expression: `<T extends Constructor>(Base: T) => class extends Base { ... }`.
- The constraint `abstract new (...args: any[]) => object` accepts any class, including abstract ones.
- Mixins have no built-in type support for private fields; they compose public/protected members only.

```ts
type Ctor<T = object> = abstract new (...args: any[]) => T;
function Serializable<T extends Ctor>(Base: T) {
  return class extends Base { serialize() { return JSON.stringify(this); } };
}
```

- [More detail on mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
- [More detail on abstract construct signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#abstract-construct-signatures)

---

### Question 15e341d2-f187-4303-8372-a6f1dcccb26f

- What is an instantiation expression and where does it help with classes?

### Answer

- `Class<T>` as a value expression instantiates the generic class's type and yields a narrowed constructor value (TS 4.7).
- Useful for passing a specialized factory function without writing a wrapper.

```ts
class Store<T> { constructor(public value: T) {} }
const StringStore = Store<string>; // typeof Store<string>
new StringStore("a");
```

- [More detail on instantiation expressions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#instantiation-expressions)
- [More detail on classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)

---

### Question 4ab8c754-f2a3-4e16-ade8-7f8b60999797

- What is the `this` type in a class method and when is it useful?

### Answer

- The special `this` type means "the type of the current instance", and it is **polymorphic**: it stays the derived type in each subclass.
- Returning `this` from builder methods preserves subclass types through chaining.
- It must not be confused with `typeof this`.

```ts
class Builder {
  set(_k: string, _v: unknown): this { return this; }
}
class QBuilder extends Builder { only(): this { return this; } }
new QBuilder().set("a", 1).only(); // works
```

- [More detail on this types](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)
- [More detail on polymorphic this](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)

---

### Question ac01921a-704d-4024-b0e3-bcf772611d2b

- Why is assigning a `Dog[]` to an `Animal[]` allowed even though you can then push a `Cat`?

### Answer

- Arrays are covariant in TS (unsound but ergonomic): `Dog[]` is assignable to `Animal[]`.
- The push is caught at runtime as a bug, not at compile time; TS does not enforce invariance for arrays.
- Safer options: accept `readonly Animal[]`, or make the collection generic (`T[]`) and don't upcast the mutable array.

```ts
class Animal {}
class Dog extends Animal { bark() {} }
const dogs: Dog[] = [];
const animals: Animal[] = dogs;
animals.push(new Animal()); // accepted by TS, corrupts dogs
```

- [More detail on array covariance](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [More detail on readonly arrays](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)

---

### Question 674f7fd7-a009-4782-9823-60d3d6a1ab6f

- What is the difference between `extends` and `implements` for a class?

### Answer

- `extends` **inherits** implementation (fields, methods, statics) and creates a runtime prototype chain.
- `implements` only **asserts** the instance shape; no code is inherited, and it is erased entirely.
- A class may do both, and may implement several interfaces while extending at most one class.

```ts
interface Moveable { move(): void }
class Base { id = ""; }
class Car extends Base implements Moveable { move() {} }
```

- [More detail on implements](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses)
- [More detail on extends](https://www.typescriptlang.org/docs/handbook/2/classes.html#extends-clauses)

---

### Question 59a5a94d-18d4-4cc9-abb5-cb6acbae0433

- How do you type a class expression, and what is it good for?

### Answer

- Class expressions are values: `const C = class { ... }`. If they reference themselves internally, give the variable a type or use a named expression.
- Commonly used for mixins, one-off instrumentation, and returning anonymous classes from factories.
- The inferred type is the anonymous instance type; annotate with an interface when the name matters.

```ts
const Service = class {
  connect() {}
};
type S = InstanceType<typeof Service>;
```

- [More detail on class expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/class)
- [More detail on InstanceType](https://www.typescriptlang.org/docs/handbook/utility-types.html#instancetypetype)

---

### Question 8e4d0db8-142a-4d9a-9a6f-e941aaffb7ef

- What is the difference between a class field with an initializer and one assigned in the constructor?

### Answer

- An initializer runs on every instance creation in declaration order, after `super()` and before the constructor body.
- Constructor assignment gives more control (conditionals, parameters already processed) and is what parameter properties do.
- Both satisfy `strictPropertyInitialization`; only the initializer is guaranteed even if you add more constructors.

- [More detail on class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)
- [More detail on strictPropertyInitialization](https://www.typescriptlang.org/tsconfig#strictPropertyInitialization)

---

### Question cf00ba8d-a465-4188-9707-55c7ef3a0877

- How does TS check `this` in a static method when called on a subclass?

### Answer

- In statics, `this` is the polymorphic constructor type, so `new this()` constructs the **receiver's** class, not the declaring one.
- That makes factory statics produce correct subclass instances without casts.
- TS types `this` in statics accordingly, so `new this()` is allowed for non-abstract classes.

```ts
class Base { static create() { return new this(); } }
class Sub extends Base {}
Sub.create() instanceof Sub; // true
```

- [More detail on static members](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)
- [More detail on this types](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)

---

### Question c3d61027-2015-475c-8cac-5a7a6cc7e54d

- What is a "class as a namespace" anti-pattern in TS?

### Answer

- Using static members to hold unrelated constants/util functions, or declaring `namespace`-merged statics, hides dependencies and hurts tree-shaking.
- Static mutable state is shared across the process, which makes tests order-dependent.
- Prefer module-level functions/constants and pass instances explicitly.

```ts
class Utils { static parse(s: string) {} } // prefer export function parse()
```

- [More detail on class statics](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)
- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

---

### Question 7fee59c5-ac24-40de-8a2c-aee8716c29da

- What happens to `this` when a class method is destructured or passed as a callback?

### Answer

- The method keeps its code but loses the receiver: `this` is `undefined` under strict mode, so the call throws.
- TS does not stop the extraction because the function type still matches; the failure is at runtime.
- Fixes: bind in the constructor, use an arrow-function class field, or wrap in an arrow at the call site.

```ts
class Counter { n = 0; inc() { this.n++; } }
const c = new Counter();
const inc = c.inc;
inc(); // TypeError: Cannot read properties of undefined
```

- [More detail on this in classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#this-types)
- [More detail on bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)

---

### Question b371c2d0-d2e4-472b-ac6e-0a1083ee783d

- What does the `declare` modifier do on a class field?

### Answer

- It declares the field's type only, with **no runtime field created** and no initializer allowed.
- Needed when a field is defined by a base class, a decorator, or the framework (`useDefineForClassFields` makes plain declarations create `undefined` fields).
- It also exempts the field from `strictPropertyInitialization` (initialization happens elsewhere).

```ts
class Base { id = ""; }
class Child extends Base { declare id: string; }
```

- [More detail on useDefineForClassFields](https://www.typescriptlang.org/tsconfig#useDefineForClassFields)
- [More detail on class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)
