# Javascript Set

### Question 74cad6a6-4459-4dd6-826f-a4f68efe75e5

- What is a `Set`, and what uniqueness rule does it apply to values?

### Answer

- A **`Set`** is a collection of unique values with O(1) average `add`/`has`/`delete`, a maintained `size`, and insertion-ordered iteration.
- Uniqueness uses **SameValueZero** — like `===`, but `NaN` equals itself and `±0` are the same value.
- Unlike an array, it has no indexing and no duplicates; unlike an object, values (not keys) are stored and any type is allowed.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question 101e2c2c-3e89-4f7b-a017-380651866acd

- How do `NaN`, `0`, and `-0` behave inside a Set?

### Answer

- All `NaN` values are treated as the **same element**, so adding `NaN` twice keeps one entry and `has(NaN)` is `true`.
- `0` and `-0` are also the **same element** (the stored value is normalized to `+0`).

```js
new Set([NaN, NaN]).size; // 1
new Set([0, -0]).size;    // 1
```

- [More detail on SameValueZero](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)
- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question e8ed2669-d3b7-4b50-8a46-eb9766276912

- Is Set iteration order defined? What happens to order on delete + re-add?

### Answer

- Iteration follows **insertion order**, guaranteed.
- `add` on an existing value changes nothing and does **not** move it.
- `delete(v)` then `add(v)` moves the value to the **end**.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#description)

---

### Question f176918b-7e5b-4cbf-a2fd-51bcc11ee76f

- Set vs array: what is the complexity difference for membership checks, and what does Set cost in return?

### Answer

- `set.has(v)` is **O(1)** average (hash lookup); `array.includes(v)` is **O(n)** (linear scan).
- Set costs memory per element (hash table slots) and loses indexing, slicing, and ordering APIs beyond insertion order.
- Build a Set once and reuse it when membership is queried repeatedly; for a one-off check on a small array, `includes` is fine.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question 8166c4f7-8d57-4e10-a283-fe4695839d06

- What can be stored in a `Set` vs a `WeakSet`?

### Answer

- `Set` stores **any value**: primitives, objects, functions, symbols.
- `WeakSet` holds **weak references**, so its values must be garbage-collectable objects (and non-registered symbols in modern engines) — `add(1)` throws `TypeError`.
- WeakSet exposes no `size`, no iteration, and no `clear`; membership `has(primitive)` simply returns `false`.

- [More detail on WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)

---

### Question 2f9caf6b-f829-4107-b5d9-6e52cd129d73

- What does `set.add(x)` return, and what does that enable?

### Answer

- `add` returns the **Set itself**, enabling chaining.
- Useful for building a set in one expression and for the `new Set(prev).add(x)` pattern in immutable updates.

```js
const s = new Set().add("a").add("b");
```

- [More detail on `Set.prototype.add`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/add)

---

### Question f8935054-0ed1-4dc3-a5f2-c916564ae0c2

- Set has `has` but no `get` — why, and how do you retrieve a stored object by equality?

### Answer

- In a Set, the **value is the key**: there is no separate payload to fetch, so a `get` would return exactly what you passed in.
- If you need to recover the canonical stored object from an equal reference, callers must keep the reference or iterate and compare.
- If canonical lookup is the requirement, use a `Map` keyed by the value (or by a normalized id) instead.

- [More detail on `Set.prototype.has`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/has)
- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)

---

### Question 75130da9-5e53-44d2-ae01-04a6987d139b

- Why are `keys()` and `values()` the same function on Set, and what does `entries()` yield?

### Answer

- `Set.prototype.keys` and `Set.prototype.values` are literally the **same function object**; both yield the stored values.
- `entries()` yields `[value, value]` pairs so that Set can satisfy the same iteration shape as Map (`[key, value]`).

```js
Set.prototype.keys === Set.prototype.values; // true
[...new Set(["a"]).entries()]; // [["a", "a"]]
```

- [More detail on `Set.prototype.keys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/keys)
- [More detail on `Set.prototype.entries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/entries)

---

### Question 0f306425-518a-4b32-9082-b7a627a88f51

- Why does the `forEach` callback receive `(value, value, set)` instead of `(value, set)`?

### Answer

- Set mirrors Map's `forEach(value, key, map)` signature so generic collection code can treat them similarly.
- For a Set there is no distinct key, so the first two arguments are both the value.

```js
new Set(["a"]).forEach((v, k) => console.log(v, k)); // "a", "a"
```

- [More detail on `Set.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/forEach)

---

### Question af9e28b6-9997-4f36-94ac-327fd0628b63

- `new Set("ab")` vs `new Set([NaN, NaN])` vs `new Set(null)` — what does each produce, and why?

### Answer

- `new Set("ab")` iterates the string → `{"a", "b"}`.
- `new Set([NaN, NaN])` → size **1**, because SameValueZero treats all `NaN` as equal.
- `new Set(null)` → **empty set**: the constructor treats `null`/`undefined` as "no iterable" and skips the loop.

- [More detail on the Set constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/Set)

---

### Question 582bf0f3-5124-42f0-9c59-23a0697eff04

- Trace the iteration order of this loop:
```js
const s = new Set(["a", "b"]);
s.forEach(v => { if (v === "a") { s.delete("b"); s.add("c"); } });
```

### Answer

- It visits `"a"` and then `"c"`.
- `"b"` is **skipped** because it was deleted before iteration reached it.
- `"c"` **is visited** because values added during iteration are visited before completion; final order of visits: `"a"`, `"c"`.

- [More detail on `Set.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/forEach)

---

### Question b957bfb1-939e-43d4-8541-34ba1cb6e189

- Are iterators from a Set a snapshot or a live view? What happens if the Set changes mid-iteration?

### Answer

- They are **live** iterators over the Set's internal table, not snapshots.
- Values added before iteration completes are visited; values deleted before being reached are skipped; re-adding counts as a new insertion.
- If you need a stable snapshot, copy first: `for (const v of [...set])`.

- [More detail on Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)

---

### Question dda2a77a-5659-41a3-9169-06e43f40ecc1

- How does dedupe with `new Set(arr)` decide which duplicate survives, and how is that different from a Map-based dedupe?

### Answer

- Set keeps the **first** occurrence: later duplicates are ignored and do not change position.
- A Map keyed by the value keeps the **first position** but the **last value** for object dedupe (last write wins per key).
- So "first wins" → Set; "last wins" → Map; dedupe by a field → Map keyed by that field.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question cf3f6b6d-4d5f-4d43-b1ef-7c67b6620a2f

- What do `size`, `delete`, and `clear` return/do, and how do they compare to array equivalents?

### Answer

- `size` is a numeric property, maintained in O(1) — unlike `arr.length`, which is fine, but Set also handles uniqueness.
- `delete(v)` removes the value and returns a **boolean** indicating whether it existed; `clear()` empties the Set and returns `undefined`.
- `add` returns the Set for chaining; there is no indexing or `splice` equivalent.

- [More detail on `Set.prototype.delete`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/delete)
- [More detail on `Set.prototype.clear`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/clear)

---

### Question 26e05ac3-2fa3-450e-8719-ffe64eedccae

- Why does `JSON.stringify(new Set([1, 2]))` produce `{}`? Does `structuredClone` handle Set?

### Answer

- `JSON.stringify` serializes own enumerable string-keyed properties; Set entries live in an internal slot, so the result is `{}`.
- `structuredClone` **does** support Set (and Map, Date, typed arrays) and deep-copies the values.

```js
JSON.stringify([...new Set([1, 2])]);   // "[1,2]" — workaround
structuredClone(new Set([1, 2]));        // Set { 1, 2 }
```

- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [More detail on `structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)

---

### Question 4f404130-e1e8-4b50-a31b-97574a6db7c5

- What does `new Set(iterable)` accept — and what happens with a Map or another Set?

### Answer

- Any **iterable**: strings (chars), arrays, Sets, Maps, generators, typed arrays.
- A Map yields `[key, value]` pairs, so the Set stores those pairs as elements (usually not what you want).
- Another Set is copied element-by-element into a new Set — a shallow copy.

- [More detail on the Set constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/Set)

---

### Question 2ccf48f1-4da1-4a0b-ac4e-2eb975cc165d

- What is the result of `set.union(other)`, and does it mutate the receiver?

### Answer

- `union` returns a **new Set** containing the elements of both, preserving order (receiver's elements first, then new ones).
- The receiver and argument are **not mutated**.

```js
new Set([1, 2]).union(new Set([2, 3])); // Set { 1, 2, 3 }
```

- [More detail on `Set.prototype.union`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/union)

---

### Question a9debb5d-64db-4c5f-bd2d-630b42099be9

- `difference` vs `symmetricDifference` — what are the exact members of each result?

### Answer

- `a.difference(b)` contains elements **in `a` but not in `b`** (one-directional).
- `a.symmetricDifference(b)` contains elements in **exactly one** of the two sets (union minus intersection).
- Both return new Sets without mutating inputs.

```js
new Set([1, 2, 3]).difference(new Set([2, 3, 4]));          // { 1 }
new Set([1, 2, 3]).symmetricDifference(new Set([2, 3, 4])); // { 1, 4 }
```

- [More detail on `Set.prototype.difference`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/difference)
- [More detail on `Set.prototype.symmetricDifference`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/symmetricDifference)

---

### Question 24a5227b-21ae-40d6-8550-549ee51bfcbf

- How do `isSubsetOf`, `isSupersetOf`, and `isDisjointFrom` (ES2024) differ, and what argument types do they accept?

### Answer

- `a.isSubsetOf(b)` — every element of `a` is in `b`; `a.isSupersetOf(b)` — every element of `b` is in `a`.
- `a.isDisjointFrom(b)` — the sets share **no** elements.
- All three accept "set-like" objects (anything with `size`, `has`, and `keys`, e.g. a Set or Map), return booleans, and never mutate.

```js
new Set([1, 2]).isSubsetOf(new Set([1, 2, 3])); // true
```

- [More detail on `Set.prototype.isSubsetOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSubsetOf)
- [More detail on `Set.prototype.isDisjointFrom`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isDisjointFrom)

---

### Question 9f6ae451-85e1-40dc-b3d6-7f9a2cba194a

- What is the machine-level reason `has` is O(1) while `array.includes` is O(n)?

### Answer

- Set is backed by a **hash table** keyed by SameValueZero; `has` computes a bucket and checks equality against a few entries.
- `includes` has no index: it scans linearly until it finds the value.
- The advantage grows with collection size and repeated checks; for tiny arrays the constant factor of hashing can dominate.

- [More detail on Set performance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question 60be362c-754c-4537-8c20-92a46d850550

- Does `[...set]` differ from `Array.from(set)`? What about mapping during conversion?

### Answer

- `[...set]` and `Array.from(set)` both produce a new array of the Set's values, in insertion order.
- `Array.from(set, fn)` maps while converting in one pass; `[...set].map(fn)` allocates the intermediate array first.
- For Set specifically, `.map` exists on neither — you convert, then map.

- [More detail on `Array.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)
- [More detail on Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)

---

### Question 416f04db-497e-404b-860d-f6528dd6ce97

- Why can Set store primitives while `WeakSet.add` throws for them?

### Answer

- `WeakSet` holds **weak references**, which require a garbage-collectable target; primitives have no identity/lifetime to reference weakly.
- `weakSet.add(1)` throws `TypeError: Invalid value used in weak set`; `weakSet.has(1)` simply returns `false` instead of throwing.
- Set has no weak-reference restriction, so all value types are allowed.

- [More detail on `WeakSet.prototype.add`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet/add)
- [More detail on `Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question 8dc2d44f-aebd-4ad5-90ca-c1227ad0fc1d

- Set vs object for tag/flag membership (`"a" in obj` vs `set.has("a")`) — what are the tradeoffs?

### Answer

- Objects are lighter for a **fixed set of known flags** and serialize directly to JSON; `in` also checks the prototype chain (use `Object.hasOwn`).
- Sets avoid prototype-key collisions (`"constructor"`, `"__proto__"`), expose `size`, and iterate values without key noise.
- For dynamic, user-provided keys, Set (or a null-prototype object/Map) is safer.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [More detail on `Object.hasOwn`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)

---

### Question e5ec8298-2070-4ac6-8504-5b70a5d88321

- Set vs array for small collections — when does the O(1) lookup not pay for the overhead?

### Answer

- For a handful of items checked once or twice, building a Set adds allocation and hashing with no asymptotic benefit; `includes` is competitive.
- Set wins once checks repeat (queue/visited logic) or the collection grows into dozens/hundreds and lookup is hot.
- Set also enforces uniqueness up front, which can replace manual duplicate checks entirely.

- [More detail on Set performance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question b1c1e0e4-be8b-4b28-8871-f9229c53f14d

- When is a Set the wrong dedupe tool (last-wins, dedupe by object field, needing the payload's duplicate)?

### Answer

- Set keeps the **first** occurrence and cannot replace it; use a Map when the last value should win.
- Set dedupes object **references**, so equal-looking records survive; dedupe by `id` with a Map keyed by the field.
- If you need the duplicate's data (merge, count, sum), dedupe the array and aggregate separately — Set discards duplicates entirely.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question d7757cf3-c839-4f5a-a953-e46b971286ff

- Set equality: why is there no built-in `equals`, and what's the minimal correct comparison?

### Answer

- Sets compare elements with SameValueZero and have no structural equality method; two Sets are always different objects under `===`.
- Minimal comparison: same size and every element of one exists in the other.
- ES2024: `a.isSubsetOf(b) && b.isSubsetOf(a)` expresses the same thing.

```js
const equal = (a, b) => a.size === b.size && [...a].every((v) => b.has(v));
```

- [More detail on `Set.prototype.isSubsetOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSubsetOf)

---

### Question b2e26f2c-4891-4a86-90d8-3e50b9668471

- WeakSet vs Set: what does weak GC buy you, and what do you lose (size, iteration, primitives)?

### Answer

- Weak GC means entries vanish when their objects are unreachable — no manual cleanup and no leaks from long-lived registries.
- You lose `size`, iteration (`forEach`, spread), `clear`, and primitive support.
- Use WeakSet for "have I seen this object?" marking; use Set when you need to enumerate or count.

- [More detail on WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)

---

### Question e956776e-afc3-4c8f-a389-4e2c799614f9

- Using a Set for event subscribers/registry — what mutation hazard must you avoid while notifying?

### Answer

- Notifying while callbacks `add`/`delete` mutates the live Set, changing who is called mid-dispatch (unsubscribes are skipped, new subscribers may get the current event).
- Notify over a **snapshot**: `for (const fn of [...subs]) fn(event)`; unsubscribes then apply to the next dispatch.
- Alternatively document live semantics deliberately — both exist in real emitters.

```js
for (const fn of [...subscribers]) fn(event);
```

- [More detail on `Set.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/forEach)

---

### Question e6c5dd1e-72d1-4ac0-8e4a-274b21ec56b3

- Dedupe an array of primitives in one expression.

### Answer

- Spreading a Set keeps first-occurrence order and removes duplicates.

```js
const unique = [...new Set(arr)];
```

- Works for strings/numbers/booleans/symbols; `NaN` duplicates collapse too.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question 33aee89a-0f3f-4210-97c7-67d17e39ca93

- Compute intersection, union, and difference of two arrays (ES2024 methods and pre-ES2024 fallbacks).

### Answer

- ES2024: wrap in Sets and use `intersection`, `union`, `difference`, `symmetricDifference`.
- Fallback: build one Set and filter for intersection/difference; union via `new Set([...a, ...b])`.

```js
const sa = new Set(a), sb = new Set(b);
const inter = [...sa.intersection(sb)];
const diff = [...sa.difference(sb)];
const union = [...sa.union(sb)];
```

- [More detail on `Set.prototype.intersection`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/intersection)

---

### Question ae619309-a4c7-4111-adc6-4583b3193e4c

- Remove from array `a` every value present in array `b`.

### Answer

- Build a Set from `b` once, then filter `a` — O(n + m) instead of O(n·m) with a nested `includes`.

```js
const sb = new Set(b);
const result = a.filter((v) => !sb.has(v));
```

- Preserves `a`'s order and its duplicates of values not in `b`.

- [More detail on `Set.prototype.has`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/has)

---

### Question cd5bc4eb-a6e1-4064-8ce2-dbc163959190

- Dedupe an array of objects by `id`, keeping the last occurrence.

### Answer

- Set cannot do this (objects are distinct by reference); use a Map keyed by `id` — later items overwrite earlier ones.
- Result order stays first-seen position of each key, with the last value.

```js
const byId = new Map(items.map((item) => [item.id, item]));
const deduped = [...byId.values()];
```

- [More detail on Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

---

### Question 9c823823-6eb1-4c94-9f18-f72631a27f51

- Track visited nodes during graph/BFS traversal.

### Answer

- A Set of visited node references prevents revisiting in O(1); enqueue neighbors only when `add`/`has` says they are new.

```js
const seen = new Set([start]);
while (queue.length) {
  const node = queue.shift();
  for (const next of node.neighbors) {
    if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
```

- Use a WeakSet when the traversal is one-off and the node objects can be collected afterward.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [More detail on WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)

---

### Question 090d21f1-a13b-44dc-ad80-fab595c6587c

- Implement add/remove toggling of unique subscribers with safe iteration during notify.

### Answer

- Store subscribers in a Set; `add`/`delete` guarantee uniqueness, and notifying over a copy keeps unsubscribes safe.

```js
const subs = new Set();
const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const emit = (e) => { for (const fn of [...subs]) fn(e); };
```

- The returned unsubscribe closure is the standard React-effect cleanup shape.

- [More detail on `Set.prototype.delete`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/delete)

---

### Question 383d16d2-d39b-4fc9-bc5f-e487831d6d2f

- TS: how do you type a Set of literal values, and how does it differ from an array type for exhaustive checks?

### Answer

- `new Set<"a" | "b">()` types iteration/has against the union; inference from `new Set(["a", "b"])` widens to `Set<string>` unless you annotate or `as const`.
- Arrays preserve order and indexing types; Sets express uniqueness and membership.
- For exhaustiveness, a union-typed Set makes `has` narrow-friendly while an array of the same literals cannot enforce uniqueness at the type level.

```ts
const modes = new Set<"light" | "dark">();
```

- [More detail on Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on `as const`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-inference)

---

### Question 1c55f721-e24f-4e48-a4cb-1ca6b1401469

- React: why doesn't `state.add(x)` followed by `setState(state)` re-render, and what's the fix?

### Answer

- Set mutation happens **in place**, so the state reference is unchanged and React's `Object.is` comparison bails out.
- Fix: create a new Set in the updater.

```js
setState((prev) => new Set(prev).add(x));
setState((prev) => { const next = new Set(prev); next.delete(x); return next; });
```

- The same reasoning applies to Map and to arrays mutated with `push`.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question e4c0bc45-8fa5-4fd9-a0b4-6ed98cc26f3b

- Duplicate objects are not removed — why?
```js
new Set([{ id: 1 }, { id: 1 }]).size; // 2
```

### Answer

- Set compares by **reference identity** (SameValueZero), and the two literals are distinct objects.
- Dedupe by a field instead: key a Map by `id` and take `values()`, keeping first or last explicitly.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [More detail on Map key equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality)

---

### Question d078d801-495f-482c-b51c-9f0062ad4c13

- Why does `set[0]` return `undefined` even though the Set has elements?

### Answer

- Sets are not indexed: values live in an internal table, not as properties `"0"`, `"1"`, ... like arrays.
- Access elements by iterating or converting: `[...set][0]` or `set.values().next().value`.

```js
[...new Set(["a", "b"])][0]; // "a"
```

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question f02a5b4f-2bc0-4dae-99ac-27643b6efebf

- Why does this data vanish after a JSON round-trip?
```js
const copy = JSON.parse(JSON.stringify(new Set([1, 2])));
```

### Answer

- `JSON.stringify(new Set([1, 2]))` produces `"{}"`, so `copy` is a plain empty object.
- Rebuild manually from an array: `new Set(JSON.parse(JSON.stringify([...original])))`.

```js
new Set(JSON.parse(JSON.stringify([...new Set([1, 2])])));
```

- [More detail on `JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

---

### Question ac48bf30-0be9-4294-92bc-a2e8c69e7c86

- What does this loop log, and why?
```js
const s = new Set(["a", "b"]);
s.delete("b");
s.forEach(v => console.log(v));
```

### Answer

- It logs only `"a"`.
- `"b"` was deleted **before iteration began**, so the Set's table no longer contains it — this is not about mid-iteration mutation.

- [More detail on `Set.prototype.delete`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/delete)

---

### Question 92e80561-e9ce-44b4-b6f1-d36c0ed20ea8

- Two Sets with the same values are not equal — why, and what would you write instead?

### Answer

- Equality for objects is **reference equality**; Sets have no structural `equals`, so `===` is always `false` for distinct instances.
- Compare contents: same `size` and every element present in the other (or `isSubsetOf` both ways in ES2024).

```js
a.size === b.size && [...a].every((v) => b.has(v));
```

- [More detail on `Set.prototype.isSubsetOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/isSubsetOf)

---

### Question bfcf0a8c-217e-4110-baa1-e02c3207bc24

- `set.has(NaN)` returns `true` for a `NaN` you never added — is that a bug or spec?

### Answer

- Spec: Set uses **SameValueZero**, under which every `NaN` is the same value.
- So once any `NaN` was added, `has(NaN)` is `true` regardless of which `NaN` value you pass.
- Not a bug — the same rule applies to `Map` keys and `Array.prototype.includes`.

- [More detail on SameValueZero](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)

---
