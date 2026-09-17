# OOP Fundamentals

### Question ca182bed-9329-48df-996e-3eedba9a69bf

- What are the **four pillars of Object-Oriented Programming (OOP)** when defined with architectural precision rather than textbook cliches?

### Answer

- **Encapsulation (Invariant protection)**: Bundling state and methods together while strictly restricting direct access to internal representation (using `#private` fields or closures). Encapsulation exists to enforce business invariants, not merely wrap variables in trivial getters and setters.
- **Abstraction (Mechanism hiding)**: Exposing what an entity accomplishes (intent) while hiding how it accomplishes it (mechanical complexity).
- **Inheritance (Code reuse via lineage)**: Mechanism by which an object acquires properties and behaviors from an ancestor. Fragile and tightly coupled if overused.
- **Polymorphism (Unified interface)**: Providing a single interface for entities of different types, allowing callers to treat different implementations uniformly without type inspection (`instanceof`).

```typescript
// ✅ Precise Encapsulation: Enforcing business invariants on private state
export class BankAccount {
  #balanceCents: number; // True ECMAScript private field

  constructor(initialDepositCents: number) {
    if (initialDepositCents < 0) throw new Error('Cannot open account with negative balance');
    this.#balanceCents = initialDepositCents;
  }

  deposit(cents: number) {
    if (cents <= 0) throw new Error('Deposit must be strictly positive');
    this.#balanceCents += cents;
  }

  withdraw(cents: number) {
    // Invariant: Balance cannot drop below zero
    if (cents > this.#balanceCents) throw new Error('Insufficient funds');
    this.#balanceCents -= cents;
  }

  get balance(): number {
    return this.#balanceCents / 100;
  }
}
```

- [More detail on Encapsulation](https://en.wikipedia.org/wiki/Encapsulation_(computer_programming))
- [More detail on MDN Private Class Features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties)

---

### Question eb10233d-854f-4a1f-bf45-0df2faf66ea2

- What are the major **inheritance pitfalls**, and what does the "gorilla-banana problem" (Joe Armstrong) mean in practice?

### Answer

- **The Gorilla-Banana problem**: "You wanted a banana, but what you got was a gorilla holding the banana and the entire jungle." When you inherit from a base class to reuse a single helper method, your class inherits the entire ancestor hierarchy, internal states, and hidden dependencies.
- **Fragile base class problem**: A minor modification to the parent class's internal method unexpectedly cascades down and breaks child class invariants across disparate subsystems.
- **Rigid taxonomy**: Real-world domain entities rarely fit pure hierarchical trees. A `User` who is both a `Buyer` and a `Seller` breaks single-inheritance models, forcing awkward multi-layer hierarchies or code duplication.

```typescript
// ❌ Fragile Base Class / Gorilla-Banana: Subclassing just to get logging
class BaseEntity {
  public dbConnection = new DatabaseConnection(); // The Jungle!
  public logger = new Logger();
  public cache = new RedisCache();
}

class PriceCalculator extends BaseEntity {
  // Wanted a pure price calculation, but inherited DB connection, cache, and logger
  computeTotal(price: number, tax: number) {
    return price * (1 + tax);
  }
}

// ✅ Composition Alternative: Inject or instantiate only the exact capability needed
export class PriceCalculator {
  computeTotal(price: number, tax: number): number {
    return price * (1 + tax);
  }
}
```

- [More detail on The Fragile Base Class Problem](https://en.wikipedia.org/wiki/Fragile_base_class)
- [More detail on Composition over Inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance)

---

### Question bbffb7b9-54bd-4540-aae0-a8654e968c11

- What are the **three types of polymorphism (Subtype, Parametric, Ad-hoc)**, and how do they map to TypeScript constructs?

### Answer

- **Subtype polymorphism (Inclusion polymorphism)**: Calling the same method on derived subtypes or interface implementers without knowing the concrete class (`class Square implements Shape`).
- **Parametric polymorphism (Generics)**: Writing code that operates identically across arbitrary types without depending on specific type characteristics (`function identity<T>(value: T): T`).
- **Ad-hoc polymorphism (Function overloading)**: Defining functions with the same name that execute different behaviors or return different shapes depending on parameter types.

```typescript
// 1. Subtype Polymorphism (Common Interface)
interface Serializable { serialize(): string; }
class UserDto implements Serializable { serialize() { return JSON.stringify(this); } }
class XmlDto implements Serializable { serialize() { return `<data />`; } }

// 2. Parametric Polymorphism (Generics)
function wrapInResult<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

// 3. Ad-hoc Polymorphism (Function Overloads)
function formatTime(timestamp: number): string;
function formatTime(date: Date): string;
function formatTime(input: number | Date): string {
  const d = typeof input === 'number' ? new Date(input) : input;
  return d.toISOString();
}
```

- [More detail on Types of Polymorphism](https://en.wikipedia.org/wiki/Polymorphism_(computer_science))
- [More detail on TypeScript Function Overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads)

---

### Question 24eca0a3-e2c9-43ed-9c81-acb4bd139d35

- How does TypeScript's **structural typing (duck typing)** differ from **nominal typing**, and what are the design implications for APIs?

### Answer

- **Nominal typing (Java/C#)**: Type equivalence is determined strictly by explicit declarations and type names. Two classes with identical fields are incompatible unless one explicitly extends the other.
- **Structural typing (TypeScript/Go)**: Type compatibility is based entirely on the shape (properties and methods) of the types. If an object has all required properties of an interface with compatible types, it satisfies that interface ("if it walks like a duck, it is a duck").
- **API design implication**: Consumers do not need to import your concrete interface or class to satisfy an API contract. Any plain object matching the shape is accepted, reducing cross-module coupling.

```typescript
// Structural Typing in TypeScript:
interface Point {
  x: number;
  y: number;
}

function renderPoint(p: Point) {
  console.log(`(${p.x}, ${p.y})`);
}

// Plain object literal with extra fields satisfies Point without explicit declaration
const cursor = { x: 10, y: 20, z: 30, color: 'blue' };
renderPoint(cursor); // ✅ Valid in TS structural type system!

// In a Nominal system (Java/C#), this would fail: "Type cursor is not an instance of Point"
```

- [More detail on TypeScript Structural Typing](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html#structural-type-system)
- [More detail on Duck Typing](https://en.wikipedia.org/wiki/Duck_typing)

---

### Question 4c5bd7de-87df-45d2-ad29-7834ae56779a

- How do **JavaScript prototypes and prototype delegation** operate under the hood, and how does ES6 `class` syntax desugar onto them?

### Answer

- **Prototypal delegation (`[[Prototype]]`)**: When accessing `obj.prop`, the JS runtime looks for `prop` directly on `obj`. If not found, it traverses up `obj.__proto__` (the prototype link) until it finds the property or reaches `null`.
- **ES6 `class` is syntax sugar**: ES6 `class` does not introduce a new object model; methods defined inside a class body are placed directly onto the constructor's `.prototype` object.
- **`this` binding**: `this` is not bound lexically in standard prototype methods; it is determined at call time by the object preceding the dot (`obj.method()`), unless bound via `.bind()` or arrow functions.

```javascript
// ES6 Class syntax:
class Dog {
  constructor(name) {
    this.name = name; // Own property on instance
  }
  bark() {
    return `${this.name} barks!`;
  }
}

// Exactly desugars to prototypal delegation under the hood:
function DogConstructor(name) {
  this.name = name;
}
DogConstructor.prototype.bark = function() {
  return `${this.name} barks!`;
};

const pet = new DogConstructor('Rex');
// pet.bark() -> lookup fails on 'pet' instance -> delegates to pet.__proto__ (DogConstructor.prototype)
console.log(pet.hasOwnProperty('bark')); // false
console.log(Object.getPrototypeOf(pet) === DogConstructor.prototype); // true
```

- [More detail on Inheritance and the Prototype Chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [More detail on ES6 Classes under the hood](https://javascript.info/class)
