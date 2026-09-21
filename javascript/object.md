# Javascript Object

### Question d58fe7a9-4ea5-4c65-b051-3bbb1a4b4cf0

- Mechanically, what is a JS object made of (property table, prototype, flags)?

### Answer

- An object is a collection of **own property descriptors** (key → value or getter/setter plus flags), a `[[Prototype]]` link, and an extensible flag.
- Engines optimize property storage with hidden classes/shapes and inline caches; adding/deleting keys or changing types can transition the shape and deoptimize access.
- Prototype lookup is dynamic: the table is consulted first, then the chain.

- [More detail on Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

---

### Question 9d7d6cb3-892f-43b2-9fbb-3dd11eda652d

- What do the `enumerable`, `configurable`, and `writable` flags control?

### Answer

- **`writable`** — whether the value can be changed (data properties only).
- **`enumerable`** — whether the property shows up in `for...in`, `Object.keys`, spread, `JSON.stringify`, etc.
- **`configurable`** — whether the property can be deleted or redefined (and whether its flags can change).

```js
Object.defineProperty(o, "x", { value: 1 }); // everything false
```

- [More detail on `Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [More detail on Property attributes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#description)

---

### Question afc9250e-3c66-4d2f-bb4b-466e25af917d

- What is the difference between an own property and an inherited one?

### Answer

- An **own** property lives directly on the object; an **inherited** one comes from the prototype chain.
- `Object.keys`, `Object.getOwnPropertyNames`, and `Object.hasOwn` only see own properties; `for...in` and `in` walk the chain.
- Reads resolve through the chain, but writes always create/update an own property (or hit a setter).

- [More detail on the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)

---

### Question 3a4a05df-944e-4723-acd8-bc99aaa2cf8a

- What is the difference between a data property and an accessor property?

### Answer

- A **data property** has a `value` plus `writable`; reads return the stored value.
- An **accessor property** has `get`/`set` functions and no value slot; reads/writes invoke them.
- A property is one or the other, never both — `defineProperty` overwrites the previous kind (if configurable).

- [More detail on Property descriptors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#description)

---

### Question c9cac801-b5e9-4b03-854e-c5a4fbcf291c

- What is the prototype chain used for during property lookup?

### Answer

- Reading a property walks `[[Get]]` from the object up its prototype chain until a descriptor is found, then returns its value or invokes its getter.
- If the chain ends at `null` with no match, the result is `undefined`.
- Methods live on prototypes so all instances share them; deep chains cost extra lookups, and shadowing an own property stops the walk.

- [More detail on the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)

---

### Question 8785f09f-1562-488d-8850-4ca7b8b115ec

- Trace exactly what happens during `obj.a.b.c` when `b` is missing — and where does it throw?

### Answer

- `obj.a` is read first. If it is an object, `.b` is read from it — a missing `b` yields `undefined`.
- The next access, `undefined.c`, throws `TypeError: Cannot read properties of undefined`.
- The throw happens at the **first non-object link**, not at `obj`; optional chaining (`obj.a.b?.c`) or guards prevent it.

- [More detail on Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

---

### Question d7ab7d32-00b5-42d1-8a5a-532437005e41

- What is the property enumeration order for `Object.keys({ b: 1, 2: 2, a: 3, 1: 4 })`, and why?

### Answer

- Result: `["1", "2", "b", "a"]`.
- Order is specified: **array-index keys** (non-negative integers below 2³²−1) in ascending numeric order first, regardless of insertion.
- Then remaining **string keys in insertion order**, then **symbol keys in insertion order** (for APIs that include them).

- [More detail on property order](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys#description)

---

### Question bb6bae53-809d-468f-a8dc-f1dec6830ae1

- `obj[1]` vs `obj["1"]` — are these the same property? What key type is actually stored?

### Answer

- They are the **same property**: bracket access coerces the key with `ToPropertyKey`, so `1` becomes `"1"`.
- All ordinary property keys are strings or symbols — numbers are never stored as numbers.
- This is why object-keyed lookups collide with each other and why Map exists.

```js
const o = {};
o[1] = "a";
o["1"]; // "a"
Object.keys(o); // ["1"]
```

- [More detail on Property accessors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors)

---

### Question c2d48afe-dd90-44bb-8924-b9c87341ca47

- `for...in` vs `Object.keys` vs `Object.getOwnPropertyNames` vs `Reflect.ownKeys` — what does each include?

### Answer

- **`for...in`** — own **and inherited** enumerable string-keyed properties (symbols excluded).
- **`Object.keys`** — own **enumerable** string-keyed properties.
- **`Object.getOwnPropertyNames`** — all own string keys, including non-enumerable.
- **`Reflect.ownKeys`** — all own keys: strings and symbols, enumerable or not.

- [More detail on `for...in`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in)
- [More detail on `Reflect.ownKeys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)

---

### Question b39540af-bb57-40f5-8381-1bbf7fe0a44a

- `in` vs `Object.hasOwn` vs `obj.hasOwnProperty` — how do they differ, including on null-prototype objects?

### Answer

- **`"k" in obj`** checks the whole prototype chain.
- **`Object.hasOwn(obj, "k")`** checks own properties only and works on any object, including `Object.create(null)`.
- **`obj.hasOwnProperty("k")`** can be shadowed by an own property or missing entirely on null-prototype objects — calling it then throws.

```js
Object.hasOwn(Object.create(null), "x"); // false, no throw
```

- [More detail on `Object.hasOwn`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
- [More detail on the `in` operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in)

---

### Question 8db3700a-c1aa-40ab-97c3-be1606dc4d34

- Spread vs `Object.assign`: how do they differ for getters, setters, symbols, and property descriptors?

### Answer

- Both copy **own enumerable** properties (including symbol keys) and both are shallow.
- **Spread** defines data properties (`CreateDataProperty`): it does not trigger setters on the target and always creates plain writable data properties.
- **`Object.assign`** reads sources with `[[Get]]` (invoking getters) and writes with `[[Set]]` (triggering target setters), and returns the mutated target.

```js
Object.assign({}, a, b); // target is the new {}
```

- [More detail on Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [More detail on `Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)

---

### Question ef12ef31-ee04-4e6e-a84e-0d2d7f30d7e3

- What does `delete` actually do to a property, and why can heavy use of it hurt performance?

### Answer

- `delete` removes an own property if it is configurable; non-configurable properties make it return `false` (throw in strict mode).
- Frequent deletes push objects toward dictionary-mode storage and invalidate hidden classes/inline caches that optimized property access relied on.
- Prefer `undefined` assignment when presence doesn't matter, or a Map when entries are genuinely dynamic.

- [More detail on `delete`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete)

---

### Question 9f5f57fb-f8c6-4384-adbe-048db60544cf

- `Object.defineProperty` — what flags default to `false`, and how does that surprise people coming from object literals?

### Answer

- With `defineProperty`, omitted flags default to `false`: the property is **non-writable, non-enumerable, non-configurable**.
- Object literals do the opposite — all flags default to `true`.
- Surprises: the property won't show in `Object.keys`/JSON, can't be reassigned (silently fails in sloppy mode, throws in strict), and can't be deleted.

```js
Object.defineProperty({}, "x", { value: 1 });
Object.getOwnPropertyDescriptor(obj, "x"); // writable/enumerable/configurable: false
```

- [More detail on `Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)

---

### Question ba9afeea-fb65-4677-aff7-f2c3389cd31d

- How do `Object.is` and `===` differ for `NaN` and `-0`?

### Answer

- `Object.is(NaN, NaN)` is `true`; `NaN === NaN` is `false`.
- `Object.is(0, -0)` is `false`; `0 === -0` is `true`.
- Otherwise they behave the same. React uses `Object.is` to bail out of state updates, which is why `NaN` state and `-0` can behave unexpectedly.

- [More detail on `Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

---

### Question 354cb815-6b4d-47d4-b26e-ed3323320657

- When are computed property keys evaluated in an object literal, and in what order relative to data properties?

### Answer

- Keys and values are evaluated **in source order**, once, when the literal is created.
- Computed keys cannot reference the object under construction via `this`, but they can use earlier variables/functions.
- Duplicate keys (computed or literal) follow last-wins.

```js
const k = "b";
const o = { a: 1, [k]: 2, [`${k}c`]: 3 }; // { a: 1, b: 2, bc: 3 }
```

- [More detail on Object initializer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#computed_property_names)

---

### Question 2a2205a2-2382-4eac-ae0b-b4bade714cf6

- A getter defined on a prototype vs the same getter defined as an own property — what changes?

### Answer

- A **prototype getter** is shared by all instances and is invoked with `this` bound to the receiving object, so it can read instance fields.
- An **own getter** shadows the prototype one and can be shadowed/modified per instance (if configurable).
- Interception only happens at read time on the property itself — the prototype's getter is not copied to instances.

- [More detail on `get`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)

---

### Question f47b19ba-eec8-4ab8-9199-d43902f2522c

- `{ f() {} }` vs `{ f: () => {} }` — how do `this`, constructability, and the `prototype` property differ?

### Answer

- `f() {}` is a **method**: `this` is the object when called as `o.f()`; it has no `prototype` property and cannot be constructed.
- `f: () => {}` is an **arrow**: it ignores the receiver and captures `this` lexically; arrows are also not constructable and have no `prototype`.
- `f: function () {}` is a normal function expression: constructable, has `prototype`, and `this` follows call-site rules.

- [More detail on Method definitions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions)

---

### Question 35bdc88b-4dd7-496d-ba75-8153da7d0fc8

- In `a?.b.c()`, how far does short-circuiting extend when `a` is null?

### Answer

- The entire chain short-circuits: if `a` is `null`/`undefined`, the expression evaluates to `undefined` without evaluating `.b`, `.c`, or the call `()`.
- Optional chaining is **not** a general error suppressor: only the `?.` link is guarded, and subsequent non-optional links are part of the short-circuited chain.
- Calls need explicit optional call syntax when the function itself may be missing: `a?.b.c?.()`.

- [More detail on Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

---

### Question 959004b9-fccd-4116-9836-5f65609c8854

- Destructuring defaults: why does `const { x = 1 } = { x: null }` give `null`, and how do nested defaults behave?

### Answer

- Defaults apply only when the value is **`undefined`**; `null` is treated as a real value.
- Nested patterns apply defaults at each level: `{ a: { b = 1 } = {} }` — the outer default triggers if `a` is `undefined`, the inner if `b` is.
- To normalize null too, use `??` explicitly after destructuring.

- [More detail on Destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#default_value)

---

### Question 951ac5c4-af3c-45a7-9c73-dfc56d741667

- What is missing from `Object.create(null)`, and what is it good for?

### Answer

- It has **no prototype**, so no `hasOwnProperty`, `toString`, `valueOf`, or the `__proto__` accessor.
- That makes it a clean dictionary: no inherited-key collisions and no prototype-pollution path through assignment.
- `Object.hasOwn` (not `obj.hasOwnProperty`) is required for checks; spread, `Object.keys`, and `JSON.stringify` still work.

- [More detail on `Object.create`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)

---

### Question ac64b481-811f-40e0-8535-b9d398643855

- How does prototype pollution happen in a naive deep-merge function, and what prevents it?

### Answer

- A recursive merge that does `target[key] = value` with `key === "__proto__"` invokes the prototype setter and writes onto `Object.prototype`; `constructor.prototype` paths work too.
- Any future object then inherits the attacker's properties — a serious security bug when merging untrusted data (query params, JSON bodies).
- Prevent with: skip `__proto__`/`constructor`/`prototype` keys, use `Object.create(null)` targets, define properties with `Object.defineProperty`, or switch to `Map` for user-keyed data.

- [More detail on Prototype pollution](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution)
- [More detail on `Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)

---

### Question 0a20397d-ee9f-425e-8a3b-6a23fd0a0647

- `Object.freeze` vs `Object.seal` vs `Object.preventExtensions` — and why are all three shallow?

### Answer

- **`preventExtensions`** — no new properties, existing ones unchanged.
- **`seal`** — no new properties, and existing ones become non-configurable (still writable).
- **`freeze`** — no new properties, non-configurable, and data properties become non-writable.
- All operate only on **own properties of that one object**; nested objects/arrays remain mutable unless frozen recursively.

- [More detail on `Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [More detail on `Object.seal`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal)

---

### Question 5ce7522d-e33a-4881-ac54-26c54898f1e5

- What does `JSON.stringify` omit, and what does a `toJSON` method change?

### Answer

- In objects, properties with `undefined`, function, or symbol values are **omitted**; in arrays they become `null`.
- Symbol-keyed props, non-enumerables, and the prototype are ignored; `BigInt` throws; cycles throw.
- If a value has a `toJSON` method, `stringify` calls it and serializes its result (`Date` uses this to emit ISO strings).

- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

---

### Question 9ca77c0d-9872-4c1b-88be-9be8ee6ac457

- How does `structuredClone` differ from a JSON round-trip for objects (prototypes, `undefined`, `Date`, `Map`, functions)?

### Answer

- `structuredClone` preserves `undefined`, `Date`, `RegExp`, `Map`, `Set`, typed arrays, and cycles.
- It still **loses prototypes**: a class instance comes back as a plain object, and functions cannot be cloned at all (`DataCloneError`).
- JSON round-trip: drops `undefined`/functions/symbols, turns `Date` into an ISO **string**, and throws on cycles (`TypeError`) and `BigInt`.

- [More detail on `structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

---

### Question 60e2ec67-4c4a-44cf-ae51-dd090939ae23

- Why are `Symbol` keys invisible to `JSON.stringify` and `for...in`, but copied by spread and `Object.assign`?

### Answer

- Enumeration APIs that predate symbols (`for...in`, `Object.keys`, `JSON.stringify`) only look at string keys.
- Spread/`Object.assign` copy **all own enumerable properties**, and symbol-keyed properties can be enumerable — so they are copied.
- Retrieve symbol keys explicitly with `Object.getOwnPropertySymbols` or `Reflect.ownKeys`.

- [More detail on Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [More detail on `Object.getOwnPropertySymbols`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertySymbols)

---

### Question 0cef5fd3-499d-47d8-b051-45b6b1dff9d1

- How do `Object.entries` and `Object.fromEntries` round-trip, and what happens with duplicate keys?

### Answer

- `Object.entries` returns `[key, value]` pairs (own enumerable string keys only; symbols dropped).
- `Object.fromEntries` builds from any iterable of pairs, including symbol keys.
- Duplicate keys follow **last wins**, consistent with object literal semantics.

```js
Object.fromEntries([["a", 1], ["a", 2]]); // { a: 2 }
```

- [More detail on `Object.fromEntries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries)

---

### Question 2f47337b-9391-41ec-93d1-5e0bfff1cb19

- Class instances: which members are own properties and which live on the prototype, and why does that matter for `Object.keys`?

### Answer

- **Instance fields** (including `this.x = ...` and class field declarations) are own properties; **methods/getters** live on `Class.prototype`.
- `Object.keys(instance)` returns only own enumerable fields — methods are invisible.
- Spread/`Object.assign` of an instance copies fields only, so methods are lost; `structuredClone` drops the prototype too.

- [More detail on Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)

---

### Question 78fb4b47-4a86-4477-adbe-689b718e0117

- Object vs Map for dynamic keys — restate the decision rule in terms of key types, size, and serialization.

### Answer

- Keys: any non-string key type → **Map**; string/symbol keys → object is viable.
- Size/churn: many inserts/deletes or needing `.size` → **Map**; static read-mostly → object.
- Serialization/interop: JSON, config, React state, TS structural types → **object**; in-memory lookup with object keys → **Map**.

- [More detail on Objects vs Maps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps)

---

### Question 8a45609e-e225-4ad6-97d4-84aa7dd74fd1

- Deep clone: `structuredClone` vs JSON round-trip vs a recursive clone — when is each the right call?

### Answer

- **`structuredClone`** — default choice for data with Dates, Maps/Sets, typed arrays, cycles; throws on functions and loses class prototypes.
- **JSON round-trip** — only for JSON-safe data (no `undefined`, Dates as strings); useful when the clone must also be a payload.
- **Recursive clone** — when custom class instances, getters, or selective copying must be preserved; risk of cycles unless handled.

- [More detail on `structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)

---

### Question 5394ddf2-df3e-4b0d-8c96-e35a6d4fb30b

- Is `Object.freeze` worth it in production, or dev-only? What does it cost and what does it actually guarantee?

### Answer

- It guarantees shallow immutability of that object: no writes, adds, or deletes on it (silent no-op in sloppy mode, throw in strict).
- Costs: prevents engines from specializing some property operations in rare cases, and gives a false sense of protection for nested data.
- Common approach: freeze in dev/tests to catch accidental mutations, rely on TypeScript `readonly` and lint rules in production.

- [More detail on `Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

---

### Question 9539bf72-c2a7-41cf-8d05-d0208d30f141

- Composition via spread/`assign` vs prototype/class inheritance for sharing behavior — when do you pick each?

### Answer

- **Composition** (spread/assign/functional mixins) fits data objects, ad-hoc shape changes, and avoiding `this`; changes create new objects.
- **Prototype/class inheritance** fits identity-based behavior, `instanceof` checks, and shared methods across many instances with `#private` state.
- Composition can't share methods via reference (each spread copies fields), while inheritance shares behavior but couples to the chain.

- [More detail on the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)

---

### Question 28d87a9f-8de2-42f8-bf1d-7a0b1b7a6477

- TS: `Record<string, T>` vs `{ [k: string]: T }` vs `Map` — what does each express, and when is `Record` wrong?

### Answer

- `Record<string, T>` and `{ [k: string]: T }` are effectively the same: an **index signature** object with string keys.
- `Record<"a" | "b", T>` is different — it requires exactly those keys and is checked for exhaustiveness.
- `Record` is wrong when keys are numbers/objects, when the table is mutated frequently, or when you need Map methods/size — use `Map` then.

- [More detail on `Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on Index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)

---

### Question 53917fee-3140-4c14-826b-4daca722d72f

- Shallow equality (`{ a: 1 } !== { a: 1 }`) — how does it force design choices in React props and dependency arrays?

### Answer

- Objects/arrays are compared by **reference**, so a newly created literal is always a different value to `Object.is`/`===`.
- This causes unnecessary memo-invalidations and effect re-runs; fixes are primitive deps, stable references via `useMemo`/`useCallback`, or keeping state flat.
- External stores (Zustand, Redux selectors) exist partly to avoid prop-identity churn on large object trees.

- [More detail on `Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

---

### Question 57d019ed-700a-4330-9535-5fea5d7d3bcc

- Merge objects without mutating any input.

### Answer

- Spread creates a new object and copies own enumerable properties left to right; later sources overwrite earlier keys.
- `Object.assign({}, a, b)` does the same but writes into the `{}` target (which is then returned); passing the first input would mutate it.
- Merging is shallow — nested objects are shared by reference.

```js
const merged = { ...defaults, ...options };
```

- [More detail on Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)

---

### Question 55a978ad-eba3-4efa-9e8d-0853e2cef09f

- Implement `pick` and `omit` without a library.

### Answer

- `pick` builds a new object from selected keys; `omit` uses rest destructuring to drop keys.

```js
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));
const { secret, ...safe } = user; // omit "secret"
```

- Both are shallow and cannot drop inherited properties via `omit` (rest copies own enumerable only).

- [More detail on `Object.fromEntries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries)
- [More detail on Rest in object destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#object_destructuring)

---

### Question 93ac437a-6242-48b7-b91b-b72446411fee

- Deep-freeze an object tree.

### Answer

- Freeze each object/array recursively, using a `WeakSet` to avoid infinite loops on cycles.

```js
function deepFreeze(o, seen = new WeakSet()) {
  if (o && typeof o === "object" && !seen.has(o)) {
    seen.add(o);
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v, seen);
  }
  return o;
}
```

- Note: it walks own enumerable values only, and getters are invoked by `Object.values` if present.

- [More detail on `Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

---

### Question 03ed0cfc-c0a6-47d7-ae17-35e0159d3add

- Safely read a nested path with defaults.

### Answer

- Optional chaining stops at the first nullish link; `??` supplies a fallback only for `null`/`undefined`.

```js
const city = user?.address?.city ?? "unknown";
```

- It does not distinguish a missing key from an explicit `null`, and it cannot be used to detect typos (both yield `undefined`).
- For repeated deep access, a small `get(obj, "a.b.c", fallback)` helper centralizes the path parsing.

- [More detail on Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [More detail on Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)

---

### Question 590e6fe4-5f22-41c8-9061-b7f0a3517308

- TS: `satisfies` vs a type annotation for object literals — what does `satisfies` preserve that an annotation loses?

### Answer

- An annotation **widens** the variable to the declared type; `satisfies` checks conformance while keeping the **narrow inferred** type.
- So literal values stay exact (useful for `keyof`, unions, and lookups) while still catching missing/extra/mistyped keys.

```ts
const config = { mode: "dark" } satisfies Config;
config.mode; // "dark", not Mode
```

- [More detail on the `satisfies` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)

---

### Question ce212598-5590-4647-935f-374e1dc6427a

- TS: how do you type a dictionary whose keys are a known union (`Record<"a" | "b", number>`), and how does it differ from an index signature?

### Answer

- `Record<"a" | "b", number>` requires **all** those keys and rejects any others (excess property checks apply to literals).
- An index signature `{ [k: string]: number }` allows any string key and validates every value but not key completeness.
- Use the union form for exhaustive maps (state machines, config tables); index signatures for genuinely open dictionaries.

- [More detail on `Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on Index signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)

---

### Question 66293a3f-77aa-46bc-b497-2d2d646c3c80

- `Object.groupBy` — what does it return, and why can't its result be used as a normal object prototype-wise?

### Answer

- It returns a **null-prototype object** whose values are arrays of grouped items — so it has no `hasOwnProperty`, `toString`, or `__proto__` accessor.
- That makes it safe from prototype-pollution keys and inherited-key collisions, but you must use `Object.hasOwn`/`Object.keys` on it.
- `Object.fromEntries`-style conversion is needed if a normal object with `Object.prototype` is required.

- [More detail on `Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)

---

### Question e5b0437d-a744-472a-811e-bac8814294f9

- `obj.hasOwnProperty("x")` throws or is shadowed — what happened, and what's the safe alternative?

### Answer

- Either the object has an own `hasOwnProperty` property shadowing the method, or it was created with `Object.create(null)` and has no method at all.
- Use `Object.hasOwn(obj, "x")` (or `Object.prototype.hasOwnProperty.call(obj, "x")` for older runtimes).

```js
Object.hasOwn({ hasOwnProperty: 1 }, "hasOwnProperty"); // true
```

- [More detail on `Object.hasOwn`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)

---

### Question 0d6c54b7-5560-44a7-a6e5-11e2cbcc3532

- Why does this getter blow the stack?
```js
const o = { get x() { return this.x; } };
```

### Answer

- Reading `o.x` invokes the getter; `this.x` inside it is another read of the **same accessor**, which invokes it again — infinite recursion.
- The engine eventually throws `RangeError: Maximum call stack size exceeded`.
- Fix: store the value in a different property (`_x`) or use a data property / `WeakMap` backing store.

- [More detail on `get`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)

---

### Question 4e31b177-98bd-4a08-bbed-2eb52c2f4549

- Why doesn't the default `= {}` apply here?
```js
const { data = {} } = { data: null };
```

### Answer

- Destructuring defaults trigger only for **`undefined`**, and `null` is a real value.
- `data` is therefore `null`, and `data.x` throws later.
- Fix: `const { data = {} } = obj` for undefined-only, or normalize explicitly: `const data = obj.data ?? {}`.

- [More detail on Destructuring default values](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#default_value)

---

### Question 28bbdbcc-8d5b-4b1f-9b39-e69a0cc121eb

- Why did `Object.freeze` fail to protect the nested config object?

### Answer

- `Object.freeze` is **shallow**: it freezes only the object's own properties, making them non-writable — the property still points to the same mutable nested object.
- Mutating `config.section.x` works because `section` itself was never frozen.
- Use a recursive `deepFreeze` (with a cycle guard) or immutability libraries during development.

- [More detail on `Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

---

### Question 1aa97a13-fd58-456e-9c55-a556cf1aeb85

- Why does a JSON round-trip change `undefined` fields and `Date` values, and how do you detect the difference?

### Answer

- JSON has no `undefined`: object values that are `undefined`/functions/symbols are **dropped**, and `Date` is serialized via `toJSON` into an ISO **string**.
- Parse the result and the object lost keys and type: `parsed.date instanceof Date` is `false`.
- Fix: use `structuredClone` for in-memory data, or revive explicitly (`new Date(parsed.date)`) when JSON is the wire format.

```js
JSON.parse(JSON.stringify({ d: new Date(), u: undefined })); // { d: "2026-..." }
```

- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

---

### Question d7b71ab7-06e6-44ee-bfdf-8b0555e2bd1d

- Why does this mutate the original?
```js
const copy = { ...original };
copy.nested.value = 2; // original.nested.value also becomes 2
```

### Answer

- Spread is a **shallow copy**: the top level is new, but `nested` still points to the same object as in `original`.
- Fixes: clone deeply (`structuredClone(original)`) or copy along the path (`{ ...original, nested: { ...original.nested, value: 2 } }`).

- [More detail on Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)

---
