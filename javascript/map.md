# Javascript Map

### Question 19066416-0b25-4df2-b96d-0626731ed3aa

- What is a `Map`, and which two limitations of plain objects does it remove?

### Answer

- A **`Map`** is a key → value collection with O(1) `get`/`set`/`has`/`delete`, a maintained `size`, and insertion-ordered iteration.
- Unlike objects, keys can be **any value** (objects, functions, primitives, symbols) and are compared by identity instead of being coerced to strings.
- It has **no prototype chain or inherited keys**, so lookups cannot collide with `toString`, `__proto__`, or similar.

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [More detail on Objects vs Maps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps)

---

### Question 58fa65d7-e94e-4b11-9876-35745e4b5865

- What key-equality algorithm does `Map` use, and how do `NaN`, `0`, and `-0` behave as keys?

### Answer

- Map uses **SameValueZero**: like `===` but with two exceptions.
- All `NaN` values are treated as the **same key**, so `map.set(NaN, 1)` can be retrieved with any `NaN`.
- `0` and `-0` are also the **same key** (the key is normalized to `+0`).

```js
new Map([[NaN, 1], [NaN, 2]]).size; // 1
new Map([[0, "a"], [-0, "b"]]).size; // 1
```

- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)
- [More detail on Equality comparisons](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)

---

### Question 6c34b430-e0c3-4c3a-8ff5-486713d74db0

- What can be a key in a `Map` vs a property key on an object?

### Answer

- A Map key can be **any value**: objects, functions, arrays, symbols, primitives — stored without coercion.
- An object property key is only a **string or symbol**; numbers, booleans, and objects are coerced via `ToPropertyKey` (objects become `"[object Object]"`).
- Consequence: object-keyed lookups on plain objects collide constantly; Maps key objects by reference.

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [More detail on Property accessors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors)

---

### Question a7458460-500e-43be-aa33-e225f13b4f1c

- Is Map iteration order guaranteed? How do overwrites affect it, and what does delete + re-add do?

### Answer

- Iteration is guaranteed to follow **insertion order**.
- Overwriting an existing key with `set` **keeps its original position**; only the value changes.
- `delete(k)` followed by `set(k, v)` moves the key to the **end** — this is the basis of the LRU-cache trick.

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#description)

---

### Question 5536281d-e62a-434a-8f64-76989c1811bf

- Why is `map.get(k) !== undefined` the wrong existence check? What's the right one?

### Answer

- `get` returns `undefined` both for a **missing key** and for a key whose stored **value is `undefined`** — the two cases are indistinguishable.
- Use `map.has(k)` for presence, then `get` (or `Map.groupBy`-style helpers) for the value.

```js
const m = new Map([["a", undefined]]);
m.get("a") !== undefined; // false — wrong conclusion
m.has("a");               // true
```

- [More detail on `Map.prototype.has`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has)

---

### Question 98f8bfce-41bb-45f7-9847-bb42cdf8179d

- Why do two different `{}` keys coexist in a Map, while two `{}` computed property names overwrite each other on an object?

### Answer

- Object keys are coerced to strings, so every plain object becomes the same key `"[object Object]"` — the second assignment overwrites the first.
- Map keys are used **as-is with reference identity**, so two separately created objects are two distinct keys.
- If object keys are what you need, Map removes the need for `JSON.stringify` keys or id-mangling workarounds.

```js
const m = new Map();
m.set({}, 1).set({}, 2); // size 2
({} )[{}] = 1; ({})[{}] = 2; // both write "[object Object]"
```

- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)

---

### Question 8fdb49c0-211e-4d89-97bf-a930ca2b68bf

- What does `map.set(k, v)` return, and why does that return value matter?

### Answer

- `set` returns the **Map itself**, enabling chaining.
- Chaining is useful for building a map from several writes in one expression and for the `has`-then-`set` pattern in map/reduce.

```js
const m = new Map().set("a", 1).set("b", 2);
```

- [More detail on `Map.prototype.set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set)

---

### Question c2ae13c5-0816-46dc-b3a9-07ff6cea0bdf

- `new Map([[1, 2], [1, 3]])` — what are the final size and value, and why?

### Answer

- Size is **1**, value is **3**: the constructor inserts entries in order and later entries **overwrite** earlier ones for the same key.
- This is the same last-wins behavior as successive `set` calls; there is no duplicate-key error.

- [More detail on the Map constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map)

---

### Question b16a4d64-6041-421a-872e-f6d3011474c7

- Why does `new Map([1, 2])` throw while `new Set([1, 2])` succeeds? What about `new Map("ab")` vs `new Set("ab")`?
```js
new Map([1, 2]); // ?
new Set([1, 2]); // ?
```

### Answer

- Map entries must be **objects/array-likes** that have index `0` (key) and `1` (value); `1` and `2` are neither, so Map throws `TypeError: Iterator value 1 is not an entry object`.
- Set values can be **anything**, so `new Set([1, 2])` just stores `1` and `2`.
- The same asymmetry hits strings: `new Map("ab")` throws, while `new Set("ab")` yields `{"a", "b"}`.

- [More detail on the Map constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map)
- [More detail on the Set constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/Set)

---

### Question f9a6bfcf-c38d-4c1a-9bd4-c36c5e6c0302

- Trace exactly which keys `forEach` visits here:
```js
const m = new Map([["a", 1], ["b", 2]]);
m.forEach((v, k) => { if (k === "a") { m.delete("b"); m.set("c", 3); } });
```

### Answer

- It visits `"a"` first; during that callback `"b"` is deleted and `"c"` is added.
- `"b"` is **skipped** because it was deleted before being reached; `"c"` **is visited** because entries added during iteration are visited.
- Final visit order: `"a"`, `"c"`.

- [More detail on `Map.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach)

---

### Question 4a2381e7-f47f-429e-87d9-f2e5d88e9ca3

- Do `keys()`, `values()`, and `entries()` return arrays or lazy iterators? What are the ways to consume them?

### Answer

- They return **lazy iterators**, not arrays: no snapshot, no index access, and no `Array` methods by default.
- Consume them with `for...of`, spread (`[...map.keys()]`), or `Array.from(map.values())`; modern engines also expose iterator helpers like `.map()`/`.take()`.
- The iterators are **live**: they walk the Map's current entries, with mutation rules from the iterator protocol.

- [More detail on `Map.prototype.keys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys)
- [More detail on Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)

---

### Question d549f537-9364-4fbb-a63e-d14d613539cf

- What is the shape of each item yielded by `entries()` / `[Symbol.iterator]`, and how do you destructure while iterating?

### Answer

- Each item is a two-element array `[key, value]`.
- Map itself is iterable via the same protocol, so `[...map]` produces an array of pairs.
- Destructure directly in `for...of` (or in `.forEach((value, key) => ...)`, noting the argument order).

```js
for (const [key, value] of map) console.log(key, value);
```

- [More detail on `Map.prototype.entries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries)

---

### Question 8a9471b6-ef48-4ce0-bcef-5ab483953770

- How does `Map.groupBy` (ES2024) differ from `Object.groupBy`, and when does the difference matter?

### Answer

- `Map.groupBy` returns a **Map** with keys of any type preserved; `Object.groupBy` returns a **null-prototype object**, so keys are coerced to strings/symbols.
- The difference matters when grouping by non-string keys (objects, numbers that must stay numbers, `Map`/`Set` instances).

```js
Map.groupBy([1, 2, 3], n => n % 2).get(1); // [1, 3]
Object.groupBy([1, 2, 3], n => n % 2)[1];  // [1, 3] — key is "1"
```

- [More detail on `Map.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy)
- [More detail on `Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)

---

### Question 4c42df8a-0f7a-4ced-8daa-0ec090492444

- How do you convert a Map to a plain object, and what is lost in each direction?

### Answer

- Map → object: `Object.fromEntries(map)` — **non-string/symbol keys are coerced**, so object keys and number keys (`1` vs `"1"`) lose type identity.
- Object → Map: `new Map(Object.entries(obj))` — **symbol keys are dropped** (`Object.entries` skips them), as are non-enumerable properties.
- Round-tripping is lossless only when all keys are unique strings/symbols and values survive JSON/structured copy semantics.

- [More detail on `Object.fromEntries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries)
- [More detail on `Object.entries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)

---

### Question a19e311a-8c4c-4ce2-b7eb-d07291e54d77

- Is `new Map(otherMap)` a shallow or deep clone? What does `structuredClone` add, and what does it throw on?

### Answer

- `new Map(otherMap)` is **shallow**: keys and values are copied by reference, not duplicated.
- `structuredClone(map)` performs a **deep** clone of keys and values, handles cycles, and preserves the Map type.
- It throws `DataCloneError` for non-cloneable values such as functions, DOM nodes, or class instances with unsupported state.

- [More detail on `structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- [More detail on the Map constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map)

---

### Question 1af19ae8-8f62-4693-accf-fbb261a846e6

- Why does `JSON.stringify(new Map([["a", 1]]))` produce `{}`, and what's the standard workaround?

### Answer

- `JSON.stringify` serializes **own enumerable string-keyed properties**; a Map's entries live in an internal slot, so the object has nothing to serialize.
- Workarounds: `JSON.stringify([...map])` (array of pairs) or `JSON.stringify(Object.fromEntries(map))` (string-keyed entries only).

```js
JSON.stringify([...new Map([["a", 1]])]); // '[["a",1]]'
```

- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

---

### Question 487de071-b0c2-40eb-bc93-9bc91614df5d

- Mechanically, why is `map.size` O(1) while `Object.keys(obj).length` is not?

### Answer

- A Map maintains a **counter in an internal slot**, updated on every add/delete, so `size` just reads it.
- Objects have no size field: `Object.keys(obj)` allocates an array of key strings by enumerating the object first.

- [More detail on `Map.prototype.size`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/size)
- [More detail on `Object.keys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)

---

### Question 0562fa8f-5432-46d5-ad5a-199b2185b955

- How does a Map decide that two object keys are the same key?

### Answer

- By **reference identity** (SameValueZero): the exact same object/function value, not structural equality.
- A clone or an equal-looking literal is a different key and produces a miss.

```js
const k = {};
const m = new Map([[k, 1]]);
m.get(k);        // 1
m.get({});       // undefined
```

- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)

---

### Question 96ed85e6-15b5-42b6-a817-a73daa3a4117

- Map vs object for fixed-schema data (config, records with known fields) — which and why?

### Answer

- Use a **plain object** for fixed schemas: literal syntax, destructuring, spread, JSON.stringify, structural TS types, and `Object.keys` validation all work directly.
- A Map buys nothing when keys are a known string set and you never add/remove dynamically.
- Objects also carry a prototype, which is usually desirable for config helpers/methods — and can be `Object.hasOwn`-guarded when needed.

- [More detail on Objects vs Maps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps)

---

### Question cab96602-2413-4db3-ab72-e22ed319e04f

- Map vs object for a dynamic lookup table keyed by string ids — when does Map actually win?

### Answer

- Map wins for **frequent insert/delete**, for `size`, for avoiding prototype-key collisions (`"constructor"`, `"__proto__"`), and for storing values keyed by objects/numbers without coercion.
- Objects remain competitive for read-mostly small tables; engines optimize property lookup well when shapes are stable.
- Benchmarking matters: the theoretical O(1) vs O(1) difference is often smaller than object shape stability effects.

- [More detail on Objects vs Maps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps)

---

### Question f6f4294b-d6ff-4535-be98-55bc8726a866

- When does an object beat a Map (spread, destructuring, JSON, React state updates)?

### Answer

- Objects win when the data must be **serialized** (`JSON.stringify`), spread/merged, destructured, or typed with structural interfaces.
- React state updates conventionally use new object references; Map updates (`map.set(...)`) mutate unless you copy, and `React.memo` comparisons expect plain-object semantics.
- For one-off grouping or small static maps, object literals are less ceremony.

- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [More detail on Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)

---

### Question b249c131-35c7-4304-be60-0698728ef881

- Iterating a Map vs `Object.entries(obj)` — what does each allocate?

### Answer

- Map iterators yield existing entry records **lazily**: no intermediate array of pairs is created.
- `Object.entries(obj)` allocates a **new array** plus one two-element array per property on every call.
- For hot loops over large collections, the Map iterator avoids that per-iteration allocation; `for...in`/`Object.keys` also allocate key arrays.

- [More detail on `Object.entries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
- [More detail on `Map.prototype.entries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries)

---

### Question 3cf19f9a-587c-4889-9681-5d0f57a8551d

- WeakMap vs Map: what is the GC difference, and what constraints does WeakMap impose on keys?

### Answer

- **WeakMap keys are weakly held**: if nothing else references a key object, the entry is collectable, and the value goes with it.
- Keys must be objects or non-registered symbols — no primitives — because primitives cannot be weakly referenced.
- WeakMap exposes no `size`, no iteration, and no `clear`; you cannot enumerate what it holds.

- [More detail on WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

---

### Question 6ec14ca1-70d8-44f9-a6a3-85f0cd7d25c0

- What are real WeakMap use cases (private state, associating data with DOM nodes), and how do they avoid leaks?

### Answer

- **Private instance data**: closure/WeakMap stores state keyed by `this`, invisible to outside code.
- **Associating metadata with DOM nodes**: when a node is removed and dereferenced, its metadata entry is collected automatically.
- **Caches keyed by object identity**: a Map-based cache would pin every key forever; a WeakMap lets entries disappear with their keys.

- [More detail on WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

---

### Question a53726e3-6288-48d3-8559-b7472d888534

- LRU cache backed by Map insertion order: how does the get-refresh trick work, and what are the limits of that approach?

### Answer

- `get(k)` re-inserts the entry: `delete(k)` then `set(k, v)` moves it to the end, making the first key the least recently used.
- Eviction: when `size > capacity`, `delete(map.keys().next().value)` removes the oldest.
- Limits: no TTL/weights, deletion churn on every hit, insertion order is the only recency signal, and the cache is not serializable.

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#description)

---

### Question 595d1473-6b16-4c3a-962a-6de9cec4d590

- When is a Map overkill for grouping — i.e., when are arrays plus `reduce` clearer?

### Answer

- When the result is consumed once (e.g., rendering a list), `Object.groupBy` or a `reduce` into a plain object is shorter and serializable.
- Map is overkill when keys are a small known set, when values are read in the same expression, or when no later lookup by key occurs.
- Reach for Map when grouping is followed by repeated **lookups**, deletions, or object/number keys.

- [More detail on `Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)
- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

---

### Question 981cf922-1a38-424c-bbb5-fa78c0625a3c

- Dedupe an array of objects by `id`, keeping the last occurrence.

### Answer

- Keys are unique by construction, so writing each item into a Map keyed by `id` makes later items overwrite earlier ones.
- Preserve first-occurrence order by inserting on first sight only (`if (!m.has(id)) m.set(...)`) when order matters.

```js
const byId = new Map(items.map((item) => [item.id, item]));
const deduped = [...byId.values()]; // last wins, first-seen position
```

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

---

### Question 566a9c39-afef-4945-a97a-c7b710356601

- Count occurrences of array values.

### Answer

- Read-modify-write with `get` plus a default; use `has` when keys can legitimately hold `undefined`.

```js
const counts = new Map();
for (const k of values) counts.set(k, (counts.get(k) ?? 0) + 1);
```

- The Map version handles object keys and `NaN` correctly; a plain-object counter coerces keys to strings.

- [More detail on `Map.prototype.get`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get)

---

### Question fe57f829-e82a-4c70-9413-9f5d10dec251

- Implement a bounded LRU cache with `get`/`set`.

### Answer

- Use Map insertion order as the recency list: hits are re-inserted at the end, and overflow evicts from the front.

```js
class LRU {
  #cap; #m = new Map();
  constructor(cap) { this.#cap = cap; }
  get(k) {
    if (!this.#m.has(k)) return undefined;
    const v = this.#m.get(k);
    this.#m.delete(k).set(k, v);
    return v;
  }
  set(k, v) {
    if (this.#m.has(k)) this.#m.delete(k);
    this.#m.set(k, v);
    if (this.#m.size > this.#cap) this.#m.delete(this.#m.keys().next().value);
  }
}
```

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

---

### Question d332c359-9366-49d1-b6b6-040412392c1e

- Build a multimap (`Map<string, Set<string>>`) for tags → items, including add and remove.

### Answer

- Get-or-create the inner Set, then mutate it; remove empty Sets to keep the outer Map clean.

```js
function add(m, tag, item) {
  if (!m.has(tag)) m.set(tag, new Set());
  m.get(tag).add(item);
}
function remove(m, tag, item) {
  const s = m.get(tag);
  if (!s) return;
  s.delete(item);
  if (s.size === 0) m.delete(tag);
}
```

- This keeps per-tag membership O(1) without coercing keys.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question f99186ee-a003-4c3f-8e56-006ba4521b4d

- Convert an object to a Map and back, preserving key types where possible.

### Answer

- Object keys are already strings/symbols, so preservation is limited to those types.
- `new Map(Object.entries(obj))` drops symbol keys; to keep them, use `Reflect.ownKeys(obj)` and filter enumerable own properties.
- Back to object: `Object.fromEntries(map)` coerces keys with `ToPropertyKey` — string/symbol keys survive, everything else becomes a string (e.g. `"[object Object]"`).

- [More detail on `Object.entries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
- [More detail on `Reflect.ownKeys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)

---

### Question 1d79161b-cb46-4191-a7a3-e0bb5ef24404

- TS: how do you type a `Map` with object keys and a `Map<string, Set<number>>`, and why isn't `Record` a drop-in replacement?

### Answer

- `Map<K, V>` is generic over both key and value types, including object keys: `Map<User, Session>`.
- `Record<string, T>` is an index-signature object type: keys must be strings (or a keyof union) and it has object semantics, not Map methods.
- Nested collections stay readable as `Map<string, Set<number>>`; the equivalent `Record<string, Set<number>>` works only with string keys.

```ts
const byUser = new Map<User, Set<number>>();
```

- [More detail on Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on `Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)

---

### Question 63412db0-386f-4422-94c5-06757794ae9f

- TS: how do you type `Map.groupBy` results so the keys are a union rather than `string`?

### Answer

- The standard library types `groupBy` generically: the key selector's return type becomes the Map key type.
- So `Map.groupBy(items, (x) => x.status)` infers `Map<Status, Item[]>` when `status` is a union of literals — no annotation needed.
- If inference widens, give the callback an explicit return type or a `const`-asserted key value.

```ts
const m = Map.groupBy(items, (x) => x.status); // Map<"a" | "b", Item[]>
```

- [More detail on `Map.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy)

---

### Question 6a09acaf-9c60-4d9c-883c-5157aeb57850

- The map clearly contains the key, yet `get` returns `undefined` — what are the two most likely causes?

### Answer

- The stored **value is `undefined`** — presence and value are different questions; use `has` to check.
- The key is **not the same key**: a different object identity, or a type mismatch passed in (`1` vs `"1"`, an array created twice).
- Less common: the lookup happens before the `set` (async ordering).

- [More detail on `Map.prototype.has`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has)

---

### Question b2b7511f-fef5-4df6-a1b3-155c2b557ce0

- Why doesn't this find anything?
```js
const key = { id: 1 };
const m = new Map([[key, "a"]]);
m.get({ id: 1 }); // ?
```

### Answer

- `{ id: 1 }` on the `get` line is a **new object**, so it is not the same reference as `key`.
- The lookup misses and returns `undefined`; Maps never compare object contents.
- Fix: store/keep the original key reference, or key by a primitive (`key.id`).

- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)

---

### Question fa5e6fab-94c9-4cf4-8bdd-01d62bd102ec

- Why does this lose all the Map data?
```js
const m = new Map([["a", 1]]);
const copy = JSON.parse(JSON.stringify(m));
copy.get("a"); // ?
```

### Answer

- `JSON.stringify(m)` produces `"{}"`, so the parsed result is a plain empty object — it has no `get` method and throws `copy.get is not a function` (or returns `undefined` with optional chaining).
- Serialize as pairs instead: `JSON.parse(JSON.stringify([...m]))` and rebuild with `new Map(...)`.

- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

---

### Question 305f487e-20e9-4e11-9287-d22547e19381

- Why does `map["a"]` return `undefined` even after `map.set("a", 1)`?

### Answer

- Bracket access reads **object properties**, but `set` writes to the Map's internal entry table — not to a property named `"a"`.
- The two stores are unrelated; mixing them is a common bug when code is ported from objects to Maps.

```js
map.set("a", 1);
map["a"]; // undefined
map.get("a"); // 1
```

- [More detail on `Map.prototype.set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set)

---
