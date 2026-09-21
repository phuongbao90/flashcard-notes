# TypeScript Abstract Classes & Polymorphism

### Question 08589864-0ad3-490c-b0b0-8c20f31fac4a

- What is an abstract class, and what happens if you try to instantiate it?

### Answer

- A class marked `abstract` cannot be constructed directly; it exists to be extended.
- `new AbstractClass()` is a compile error ("Cannot create an instance of an abstract class"); the emitted JS still contains the class (with no compile-time guard).
- Because runtime has no abstract concept, the enforcement exists only at compile time — but it applies to every TS consumer.

```ts
abstract class Shape { abstract area(): number }
class Circle extends Shape { area() { return 0; } }
new Shape(); // Error
```

- [More detail on Abstract Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
- [More detail on abstract construct signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#abstract-construct-signatures)

---

### Question d86f570c-179e-4ad0-b917-235eaf9880df

- What is an abstract method, and what does it emit?

### Answer

- A method declared `abstract` has **no body** and must be implemented by every concrete subclass.
- It emits nothing on the base prototype; only the implementing class provides the function.
- Any non-abstract class that fails to implement it is a compile error ("Non-abstract class 'X' does not implement inherited abstract member 'area'").

```ts
abstract class Repo { abstract find(id: string): Promise<unknown> }
```

- [More detail on abstract members](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
- [More detail on class emit](https://www.typescriptlang.org/play)

---

### Question 8279ebc5-1502-4848-86a5-1fd38d26e1df

- Can an abstract class have a constructor, and can it have implemented methods?

### Answer

- Yes to both: abstract classes are normal classes minus direct instantiation.
- A constructor runs when a subclass calls `super(...)`; it is the standard place for shared initialization.
- Implemented methods provide shared behavior, while abstract members define the contract subclasses must fill.

```ts
abstract class Base {
  constructor(protected readonly name: string) {}
  describe() { return this.name; }
  abstract kind(): string;
}
```

- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
- [More detail on constructors](https://www.typescriptlang.org/docs/handbook/2/classes.html#constructors)

---

### Question 50abae7d-4a72-4756-98b2-e90a19c30bb4

- What is a protected constructor and when is it useful with abstract classes?

### Answer

- A `protected` constructor allows only subclasses to call `super()`, blocking external `new` even if the class is concrete.
- Combined with `abstract`, it documents "construct through a subclass or a static factory only".
- TypeScript's `ConstructorParameters`/instance utilities still work on the class's constructor type.

```ts
class Singleton {
  private static instance: Singleton;
  protected constructor() {}
  static get() { return (Singleton.instance ??= new Singleton()); }
}
```

- [More detail on member visibility](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 2e678b84-4308-4453-9420-dcb6e56672c9

- Can `static` members be abstract?

### Answer

- **No.** `abstract static` is not supported. Statics belong to the constructor, which cannot be made abstract per member.
- The workaround is an abstract **instance** member, or passing a class reference typed as `abstract new (...) => T` and requiring the check at runtime.
- This is a common surprise when designing plugin registries.

- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
- [More detail on static members](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)

---

### Question d0b47954-8e52-48d5-876e-11670adc2e78

- How do you type a variable or parameter that must be a class constructor without requiring instantiation?

### Answer

- Use an abstract construct signature: `abstract new (...args: any[]) => T`.
- A concrete class is assignable to it; an abstract class is **not** assignable to a non-abstract construct signature like `new (...) => T`.
- This is exactly why `InstanceType`/`ConstructorParameters` are constrained to abstract constructors.

```ts
function build<T>(Ctor: abstract new () => T): T { throw new Error(); }
```

- [More detail on abstract construct signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#abstract-construct-signatures)
- [More detail on InstanceType](https://www.typescriptlang.org/docs/handbook/utility-types.html#instancetypetype)

---

### Question 62103e14-aaff-431e-ba2d-ffeaa5957aab

- What is the Template Method pattern, and how is it expressed with abstract classes?

### Answer

- A concrete method in the base class defines the algorithm skeleton and calls abstract "hook" methods that subclasses implement.
- The base keeps control flow and invariants; subclasses supply only the variable steps.
- In TS, hooks are typically `protected abstract`.

```ts
abstract class Exporter {
  export(rows: string[]) {
    const prepared = this.prepare();
    return this.render([prepared, ...rows]);
  }
  protected abstract prepare(): string;
  protected abstract render(rows: string[]): string;
}
```

- [More detail on abstract members](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
- [More detail on protected](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)

---

### Question 352bc445-50c5-42bb-8cbf-271f99176aa5

- How does polymorphism let you treat different subclasses uniformly, and what does the static type allow?

### Answer

- Store subclass instances in a base-typed collection and call shared base members; runtime dispatch picks the override.
- The static type only exposes **base-declared** members, so subclass-only members need narrowing (`instanceof` or a discriminant).
- This is the core trade-off: uniformity vs access to specific capabilities.

```ts
abstract class Payment { abstract pay(cents: number): Promise<void> }
const methods: Payment[] = [new Card(), new Bank()];
await Promise.all(methods.map((m) => m.pay(100))); // static type Payment
```

- [More detail on polymorphism](https://www.typescriptlang.org/docs/handbook/2/classes.html#extends-clauses)
- [More detail on instanceof narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing)

---

### Question 1114e195-5728-41be-ab63-59bc17969fec

- When should you prefer an abstract class over an interface?

### Answer

- Prefer **abstract class** when you need shared implementation, protected state, constructor logic, or a nominal identity (private/protected members).
- Prefer **interface** when you only describe shape: it supports multiple "inheritance", works for unrelated classes, and produces no runtime code.
- A common hybrid: an interface for consumers/mocks plus an abstract base implementing it for authors.

```ts
interface Store { get(k: string): string }
abstract class BaseStore implements Store { abstract get(k: string): string }
```

- [More detail on abstract classes vs interfaces](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)

---

### Question 7c06ea39-fb6e-463a-8e01-dbf432708285

- Why is single inheritance a real constraint for abstract-class-heavy designs?

### Answer

- A class can extend exactly **one** base class, so behavior reuse from two abstract bases is impossible.
- The usual fixes are interfaces plus composition (dependencies as fields), or mixins.
- Deep hierarchies also suffer the fragile base class problem: base changes ripple into every subclass.

```ts
class A {} class B {}
class C extends A {} // class D extends A, B is illegal
```

- [More detail on mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
- [More detail on extends](https://www.typescriptlang.org/docs/handbook/2/classes.html#extends-clauses)

---

### Question b15b0b2f-1707-4fde-b23f-8bb2b3615043

- How does Liskov substitution apply to TS polymorphism?

### Answer

- A subclass must remain usable anywhere the base type is expected: don't weaken preconditions, don't strengthen postconditions, and don't throw where the base does not.
- TS checks signature compatibility but cannot check semantics, so LSP violations like returning `null` (when the base promised a value) or throwing new errors are your responsibility.
- Prefer returning the type promised by the base, or widen the base contract to reflect reality.

```ts
class Base { find(): User | null { return null; } }
class Bad extends Base { override find(): User { throw new Error(); } } // compiles, violates LSP
```

- [More detail on type compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [More detail on overriding](https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding-methods)

---

### Question 55e0c7f8-c770-4b89-acdd-10c79d863b16

- What is covariant return typing in an override, and when is it safe?

### Answer

- Overriding methods may return a **narrower** type than the base, and TS accepts it.
- It is safe for consumers that only read the result through the base type; the more specific result is still assignable to the base's return type.
- Covariant *parameters* are not allowed under `strictFunctionTypes` (methods are bivariant, so watch for holes).

```ts
class Base { clone(): Base { return new Base(); } }
class Sub extends Base { override clone(): Sub { return new Sub(); } }
```

- [More detail on overriding methods](https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding-methods)
- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question e8f812c6-e65d-4745-a6b9-fdaf7da12972

- What error appears when a concrete subclass misses an abstract member, and how do you handle intentionally incomplete classes?

### Answer

- Error: "Non-abstract class 'X' does not implement inherited abstract member 'y' from class 'Y'".
- Fixes: implement the member, mark the subclass `abstract`, or make the base member non-abstract with a default.
- Marking intermediate subclasses `abstract` is the correct way to keep partially implemented hierarchies.

```ts
abstract class Mid extends Base {} // still abstract, no need to implement yet
```

- [More detail on abstract members](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)
- [More detail on class inheritance](https://www.typescriptlang.org/docs/handbook/2/classes.html)

---

### Question a3a2d9c2-744f-4f22-86af-e1e6184b7a47

- How do abstract classes work with generics?

### Answer

- Abstract classes can be generic just like concrete ones: `abstract class Repo<T> { abstract find(id: string): Promise<T> }`.
- Subclasses either fix the type argument (`class UserRepo extends Repo<User>`) or stay generic themselves.
- The abstract member's signature then uses `T` in a checked way, which keeps subclass implementations aligned.

```ts
abstract class Store<T> { abstract put(item: T): void }
class MemoryStore<T> extends Store<T> { #items: T[] = []; put(item: T) { this.#items.push(item); } }
```

- [More detail on generic classes](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-classes)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 1f4510c3-7e6c-4c8d-8f7b-8cc026fbda34

- What is the difference between a discriminated union and an abstract-class hierarchy for modeling variants?

### Answer

- A **union** is data-first: all variants visible at once, exhaustive `switch` checking, serializable, no behavior without extra functions.
- An **abstract class** is behavior-first: each subclass carries methods, polymorphism dispatches without switches, but exhaustiveness is not checked and behavior is bound to classes.
- Rule of thumb: use unions for data/state and class hierarchies when subclasses genuinely own algorithms and mutable lifecycle.

```ts
type Shape = { kind: "circle" } | { kind: "square" }; // union
abstract class Shape2 { abstract area(): number }       // hierarchy
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 5db7cfd5-fd88-40df-b591-06319a090885

- How do you build a registry of subclasses checked for completeness at compile time?

### Answer

- Declare a union of keys and a `Record<Key, Constructor>` value; the record must contain every key.
- Store the classes (not instances) and instantiate on demand; type the constructor via an abstract construct signature.
- Adding a new key breaks the record until it is added.

```ts
type Kind = "a" | "b";
const registry: Record<Kind, abstract new () => unknown> = { a: A, b: B };
```

- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on abstract construct signatures](https://www.typescriptlang.org/docs/handbook/2/functions.html#abstract-construct-signatures)

---

### Question b57e8ba2-dc6d-4017-8dc7-a7bf77bccc2d

- Why is `instanceof` sometimes the wrong dispatch mechanism with subclasses?

### Answer

- It is a runtime prototype check: bundle duplication, cross-realm values, and mocks/proxies can all break identity.
- Long `instanceof` chains duplicate the concept of a variant and miss exhaustiveness checking.
- Prefer a discriminated union or a polymorphic method; keep `instanceof` for error types and genuine type-guard boundaries.

- [More detail on instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

### Question 5595b992-2daa-416a-98d6-197869396664

- How do you unit-test code that depends on an abstract class?

### Answer

- Depend on the **type** (the abstract class name) in parameters; pass a small hand-written fake subclass in tests.
- Because abstract classes have nominal identity for private/protected members, a plain object literal will not satisfy the type when protected members exist.
- If testability matters, define an interface for consumers and keep the abstract class as one implementation.

```ts
abstract class Clock { abstract now(): number }
class FakeClock extends Clock { now() { return 0; } }
```

- [More detail on structural typing and private members](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#private-and-protected-members)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 617151b1-bfef-485e-a091-b8e79f82c2af

- What is the Strategy pattern and how does an abstract class compare to a function type for it?

### Answer

- Strategy is "inject an algorithm"; the smallest TS version is a **function type** parameter (`(x: T) => U`), no class needed.
- An abstract class is justified only when the strategy needs multiple related operations, configuration, or shared state.
- Functions are cheaper, easier to compose, and test without inheritance.

```ts
type Sort = (xs: number[]) => number[];
function run(xs: number[], sort: Sort) { return sort(xs); }
```

- [More detail on function types](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question e193de6e-8d14-4341-af54-e6b64e0d6f3e

- How do `protected` members differ from `private` in an inheritance design?

### Answer

- `protected` is visible to subclasses and thus part of the extendable contract; `private` is not visible and makes the class nominal.
- Using `protected` for state that subclasses must manipulate is intentional API design — it couples base and subclass.
- Many designs prefer `private` state plus `protected abstract` hooks, so subclasses cannot corrupt invariants.

- [More detail on member visibility](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)
- [More detail on abstract members](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 12df1a7a-08a4-48e4-a734-1d83394b3e6b

- What does "favor composition over inheritance" mean in a TS codebase?

### Answer

- Prefer holding dependencies as fields/parameters and delegating to them, instead of extending behavior through subclassing.
- Composition keeps the type surface small, avoids diamond-ish hierarchies, and makes tests straightforward (pass a fake).
- Use inheritance when variants share a **stable** contract and behavior, not as a code-reuse shortcut.

```ts
class Logger { constructor(private readonly sink: Sink) {} }
```

- [More detail on classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [More detail on mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)

---

### Question 5d44968c-7c62-4420-8615-9a2cc52a501e

- How can you prevent a class from being extended in TypeScript?

### Answer

- TS has no `final`/`sealed` keyword; the closest is a **private constructor** plus a static factory, which blocks `extends` (a derived class must call `super()`).
- A private constructor-type field/brand works as a nominal seal.
- Note that emitted JS is still extendable at runtime; only TS consumers are constrained.

```ts
class Sealed {
  private constructor() {}
  static create() { return new Sealed(); }
}
class Other extends Sealed {} // Error: Cannot extend a class with a private constructor
```

- [More detail on constructors](https://www.typescriptlang.org/docs/handbook/2/classes.html#constructors)
- [More detail on member visibility](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)

---

### Question b6774fae-6d8c-4b5b-a63a-a2270f32b32e

- How do you share behavior across unrelated classes that cannot share an abstract base?

### Answer

- Mixins: a generic function returning a class expression that extends the passed base.
- Or delegate to a helper object held as a field (composition), which is easier to type and test.
- Mixins are best for small, orthogonal capabilities (timestamping, disposal) rather than core domain behavior.

```ts
function Disposable<T extends abstract new (...a: any[]) => object>(Base: T) {
  return class extends Base { dispose() {} };
}
```

- [More detail on mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
- [More detail on composition](https://www.typescriptlang.org/docs/handbook/2/classes.html)

---

### Question a3c4c378-a6ad-426f-8bfc-b770017314b8

- What is the "fragile base class" problem, and what does it look like in TS code?

### Answer

- Changes to a base class can silently affect all subclasses that relied on its internal behavior.
- In TS you see it as broad `override`s, calls to `super` that must stay in sync, and protected members becoming de-facto public API.
- Mitigations: keep bases small and abstract (hooks with no state), avoid `protected` mutable state, and use composition.

- [More detail on overriding methods](https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding-methods)
- [More detail on protected members](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)

---

### Question 350edcee-04f9-4766-a3df-6e77a2e154f0

- What is an abstract getter, and what rule must subclasses follow?

### Answer

- `abstract get value(): string;` is allowed and forces subclasses to implement the accessor.
- A subclass implementation may be a getter or a readonly field of a compatible type; `override` should annotate it.
- Getters/setters both participate in the property type, so implementations must match the promised degree of mutability.

```ts
abstract class A { abstract get id(): string }
class B extends A { get id() { return "b"; } }
```

- [More detail on accessors](https://www.typescriptlang.org/docs/handbook/2/classes.html#getters--setters)
- [More detail on abstract members](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 65768169-c6ba-4bde-ad77-f8b95e24df97

- Does `implements` work on an abstract class, and does it inherit anything?

### Answer

- Yes — an abstract class can implement interfaces and may leave their members abstract for subclasses.
- It can also implement an interface's namesakes via abstract declarations, which is a common pattern for layering.
- `implements` is erased, so no runtime behavior comes from the interface.

```ts
interface HasId { id: string }
abstract class Entity implements HasId { abstract id: string }
```

- [More detail on implements clauses](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 298da019-5016-4896-a1fc-fdc321d8ebca

- Why might an abstract class be a poor choice for a public library API?

### Answer

- It forces consumers into **single inheritance**, which conflicts with their own base classes and frameworks.
- Its `protected` members become an implicit contract you cannot change without breaking subclasses.
- Interfaces (shape-only) plus optional helpers compose better for libraries; reserve abstract classes for internal hierarchies.

- [More detail on interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html#interfaces)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question 6f2c5388-6ee1-48da-a421-c33d46fb05cc

- How does type narrowing plus polymorphism interact when the base class declares a discriminant?

### Answer

- Adding a literal-typed readonly field to the base (`readonly kind = "circle"`) gives each subclass a distinct discriminant.
- You can then narrow a base-typed value to a subclass with a simple `switch (x.kind)`, with exhaustiveness via `never`.
- This hybrid combines runtime data-oriented narrowing with polymorphic methods.

```ts
abstract class Shape { abstract readonly kind: string }
class Circle extends Shape { readonly kind = "circle" as const; area() { return 0; } }
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question e07d5651-3268-4067-b202-5deb521a9bbb

- How do you declare an abstract class inside a `.d.ts` file?

### Answer

- Declare it normally with `declare abstract class` and abstract members without bodies; `declare` suppresses emit.
- All members that exist at runtime must be described; abstract members describe the contract subclasses must implement.
- Mixing `declare` with implementations is allowed for type declarations in a global/ambient file.

```ts
declare abstract class Plugin {
  abstract setup(): void;
  version: string;
}
```

- [More detail on declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [More detail on ambient declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)

---

### Question bf2a8cea-df7e-48a0-b5d5-cf8b31eee795

- What is the DI-token pattern with abstract classes?

### Answer

- A token is either the abstract class itself (used as a type) and a symbol/string key, or a class whose constructor the container injects.
- Using the abstract class's **type** as the field type keeps consumers compatible with any implementation.
- With `emitDecoratorMetadata`, decorators can read the constructor parameter types for injection — but the type is erased at runtime, so the metadata is the only link.

```ts
abstract class Logger { abstract log(m: string): void }
class Service { constructor(private readonly logger: Logger) {} }
```

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on abstract classes](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members)

---

### Question c1159243-8fd0-46e1-8ab0-dd3bc3a47013

- How do you give an abstract class a default implementation while allowing full replacement?

### Answer

- Provide a concrete method in the base and let subclasses override it with `override`.
- Subclasses that extend behavior call `super.method()`; those that replace it simply do not.
- Making the method `protected` keeps it out of the public surface but available to subclasses.

```ts
abstract class Renderer {
  protected format(s: string): string { return s.trim(); }
}
```

- [More detail on overriding methods](https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding-methods)
- [More detail on protected](https://www.typescriptlang.org/docs/handbook/2/classes.html#member-visibility)

---

### Question 18b6341d-fe0e-4869-a658-0b3b66fcc599

- What does polymorphism buy you over a big `if/else` on properties?

### Answer

- New variants are added by new subclasses without editing the dispatcher; the compiler checks each subclass implements the contract.
- Runtime dispatch replaces repeated branching, and behavior lives next to the data it needs.
- Trade-off: control flow becomes implicit, so debuggability and exhaustiveness-checking are easier with unions — choose per design.

- [More detail on polymorphism](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
