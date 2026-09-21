# Javascript Array

### Question db00c761-acf1-41f5-886c-a192b42fa623

- What is a sparse array, and how does a hole differ from an explicitly stored `undefined`?

### Answer

- A **sparse array** has indices that were never assigned; `length` still counts them, but the property does not exist.
- A **hole** fails `0 in arr` / `Object.hasOwn(arr, 0)` and is skipped by many methods; an explicit `undefined` is a real property that methods visit.
- `arr.length` reflects the highest assigned index, so `arr[100] = 1` creates a length of 101 with 100 holes.

```js
const sp = [1, , 3];      // hole at index 1
const ex = [1, undefined, 3]; // real undefined at index 1
1 in sp; // false — index 1 is a hole
1 in ex; // true — the property exists
```

- [More detail on Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#array_methods_and_empty_slots)

---

### Question 8df0bca1-97a3-472c-87cd-9b6d4209b85d

- What does `length` represent, and what happens when you assign a smaller or larger value to it?

### Answer

- `length` is one plus the highest index, and it is writable.
- Assigning a **smaller** value **truncates** the array, deleting all elements at or above the new length.
- Assigning a **larger** value pads with holes — no elements are created.

```js
const a = [1, 2, 3];
a.length = 1; // [1]
a.length = 3; // [1, <2 empty items>]
```

- [More detail on `Array.prototype.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length)

---

### Question e327ea82-29a3-468f-87f6-8c64b011bb20

- Which Array methods mutate the receiver and which return new arrays? Name each group.

### Answer

- **Mutating:** `push`, `pop`, `shift`, `unshift`, `splice`, `reverse`, `sort`, `fill`, `copyWithin`.
- **Non-mutating:** `map`, `filter`, `reduce`, `slice`, `concat`, `flat`, `flatMap`, `find*`, `some`, `every`, `indexOf`, `includes`, `join`.
- ES2023 added immutable variants for the mutating ones: `toSorted`, `toReversed`, `toSpliced`, `with`.

- [More detail on Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

---

### Question 36896fcc-883c-4dc8-9231-be932db8ea31

- Are JS arrays real arrays? What are V8's "elements kinds" and why do they affect performance?

### Answer

- JS arrays are objects with an exotic `length`; V8 still optimizes them with contiguous backing stores.
- V8 tracks **elements kinds** — `PACKED_SMI`, `PACKED_DOUBLE`, `PACKED_ELEMENTS`, and `HOLEY_*` variants — to specialize element access.
- Mixing types or creating holes forces a **kind transition** (e.g. packed → holey, smi → double → elements), which can deoptimize hot code.

```js
const a = [1, 2, 3];   // PACKED_SMI
a.push("x");           // → PACKED_ELEMENTS
a[5] = 1;              // → HOLEY_ELEMENTS
```

- [More detail on Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)

---

### Question 883e8ad0-41df-4036-ae06-89fcf6a6965a

- What is the difference between an array-like and an iterable? Give one example of each.

### Answer

- An **array-like** has indexed elements and a `length`, but no `Symbol.iterator`: `{ 0: "a", 1: "b", length: 2 }`.
- An **iterable** implements `Symbol.iterator` and can be consumed by `for...of`/spread: `Map`, `Set`, generators, strings.
- `Array.from` accepts both; spread (`[...x]`) accepts only iterables.

- [More detail on Array-like objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#array-like_objects)
- [More detail on Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)

---

### Question fe52f8ee-914a-4a71-bc55-d68576084436

- Which Array methods skip holes, which visit them as `undefined`, and which preserve holes in their result?

### Answer

- **Skip holes:** `forEach`, `map`, `filter`, `some`, `every`, `reduce`, `reduceRight`, `indexOf`.
- **Visit holes as `undefined`:** `find`, `findIndex`, `findLast`, `findLastIndex`, `includes`, `join`.
- **Preserve holes:** `map` (result is holey at the same indices), `slice`, `concat`; `filter`/`flat`/`flatMap` remove them because they only collect visited values.

- [More detail on Array methods and empty slots](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#array_methods_and_empty_slots)

---

### Question 542dcfdc-06d7-4072-801b-6f2e48a8906c

- Why does `[ , "a"].indexOf(undefined)` return `-1` while `[ , "a"].includes(undefined)` returns `true`?

### Answer

- `indexOf` **skips holes** (it checks `HasProperty` before comparing) and uses **strict equality**, which never matches `undefined` against a missing property.
- `includes` does not skip holes; it reads the element (`Get`), which yields `undefined` for a hole, and uses **SameValueZero**.
- Same reason `[NaN].includes(NaN)` is `true` but `[NaN].indexOf(NaN)` is `-1`.

- [More detail on `Array.prototype.includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)
- [More detail on `Array.prototype.indexOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)

---

### Question f18c3b4c-262c-4ef4-be3d-e47258cb4ceb

- Trace why this sort gives the wrong order:
```js
[10, 9, 1].sort(); // [1, 10, 9]
```

### Answer

- Without a comparator, `sort` converts elements to **strings** and compares them by UTF-16 code units.
- `"10" < "9"` because `"1"` comes before `"9"`, so `10` lands before `9`.
- Fix: always pass a numeric comparator — `arr.sort((a, b) => a - b)`.

- [More detail on `Array.prototype.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

---

### Question 542617e9-ed03-4fdd-a372-075cefad4520

- Why does `[3, 1, 2].sort((a, b) => a < b)` produce garbage? What must a comparator return?

### Answer

- A comparator must return a **negative number** (a before b), **positive** (a after b), or **zero** (equal).
- `a < b` returns a **boolean**, which is coerced to `0` or `1` — never negative — so the engine never learns that `a` should come first.
- Fix: `(a, b) => a - b` or `(a, b) => (a < b ? -1 : a > b ? 1 : 0)`.

- [More detail on `Array.prototype.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

---

### Question ebb240b0-823b-4a8b-8bdf-3e44341cd3e5

- Is `Array.prototype.sort` stable today? What changed in ES2019?

### Answer

- Yes — since **ES2019**, `sort` is required to be **stable**: elements that compare equal keep their original relative order.
- Before that, engines could use unstable algorithms; V8 used insertion sort for small arrays and quicksort for large ones (unstable), later switching to TimSort.
- Stability matters when sorting by multiple keys in successive passes (sort by secondary key, then primary).

- [More detail on `Array.prototype.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

---

### Question 1d278dc4-4bc5-4197-88c9-4d140044ffc5

- `new Array(3)`, `Array.of(3)`, and `Array.from({ length: 3 })` — what does each produce?

### Answer

- `new Array(3)` creates a **sparse** array of length 3 with no elements.
- `Array.of(3)` creates `[3]` — one element, because `of` always treats arguments as elements.
- `Array.from({ length: 3 })` creates `[undefined, undefined, undefined]` — three real holes-free slots whose values are `undefined`.

- [More detail on `Array.of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of)
- [More detail on `Array.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)

---

### Question c148d893-56cd-4f0a-8fd9-a6d723452d13

- Why does `.map()` preserve holes but `.filter()` remove them? What does `.flat()` do with holes?

### Answer

- `map` processes only indices that exist and writes results (or leaves holes) at the same indices, so holes stay holes.
- `filter` only collects values for which the predicate runs, and predicates are skipped for holes — so holes are never included.
- `flat` removes holes whenever it flattens, because flattening materializes existing elements only.

- [More detail on `Array.prototype.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [More detail on `Array.prototype.filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)

---

### Question a0e688ec-9d5f-4a85-a410-1a71a8794616

- `reduce` with vs without an initial value — what happens on an empty array in each case?

### Answer

- Without an initial value, the **first element** becomes the accumulator and iteration starts at index 1.
- On an empty array without an initial value, `reduce` throws `TypeError: Reduce of empty array with no initial value`.
- With an initial value, an empty array returns that value unchanged (and `reduceRight` mirrors this from the other end).

```js
[].reduce((a, b) => a + b);    // TypeError
[].reduce((a, b) => a + b, 0); // 0
```

- [More detail on `Array.prototype.reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)

---

### Question 6b3a8858-f36f-4843-87a2-96d447635f3d

- What is the complexity of `push`/`pop` vs `shift`/`unshift`, and why?

### Answer

- `push`/`pop` operate at the end: **amortized O(1)** — capacity growth occasionally copies, but not per call.
- `shift`/`unshift` operate at the front: **O(n)** because every remaining element must be reindexed.
- For queue workloads, prefer a `head` index, a `Deque`, or reversing the array once instead of shifting per item.

- [More detail on `Array.prototype.push`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push)
- [More detail on `Array.prototype.shift`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift)

---

### Question 2f1a4964-2b1d-44e4-8f19-154a274f217c

- What does `delete arr[1]` do, and why is `splice` usually the right tool instead?

### Answer

- `delete arr[1]` removes the property, leaving a **hole**; `length` is unchanged and methods may skip the index.
- `splice(1, 1)` removes the element and **shifts** the remaining elements down, keeping the array dense.
- `delete` is almost never intended on arrays; use `splice`, `filter`, or `toSpliced`.

```js
const a = [1, 2, 3];
delete a[1]; // [1, <1 empty item>, 3]
a.splice(1, 1); // [1, 3]
```

- [More detail on `Array.prototype.splice`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)

---

### Question aefdea0f-7bfd-43bb-a0ae-828da1d3b5f0

- `slice` vs `splice` — parameters, mutation, and return values.

### Answer

- `slice(start, end)` returns a **shallow copy** of the range; it never mutates. Negative indices count from the end.
- `splice(start, deleteCount, ...items)` **mutates** the receiver in place, inserting/removing items, and returns an array of the removed elements.
- Mnemonic: `slice` copies, `splice` cuts.

- [More detail on `Array.prototype.slice`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)

---

### Question 56c4bbed-c4e3-4100-ab26-a7ef948fa79e

- How do `Array.from` and spread differ for array-likes vs iterables, and when do you need the `mapFn`?

### Answer

- Spread requires a real **iterable** (`[Symbol.iterator]`); `Array.from` accepts both iterables and **array-likes** with `length`.
- `Array.from(x, mapFn)` maps while constructing — one pass and no intermediate array.

```js
[...document.querySelectorAll("li")];      // NodeList is iterable → ok
Array.from({ length: 3 }, (_, i) => i);    // array-like → [0, 1, 2]
```

- [More detail on `Array.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)

---

### Question 0f8899a1-24f1-458d-b434-85da1d21480a

- What do `at()`, `with()`, `toSorted()`, `toReversed()`, and `toSpliced()` do (ES2023), and how do they relate to their mutating counterparts?

### Answer

- `at(i)` indexes with negative support (`arr.at(-1)`); it never mutates.
- `with(index, value)` returns a copy with one index replaced; out-of-range index throws `RangeError`.
- `toSorted`/`toReversed`/`toSpliced` are the **copying versions** of `sort`/`reverse`/`splice`, enabling immutable updates.

- [More detail on `Array.prototype.with`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/with)
- [More detail on `Array.prototype.toSorted`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)

---

### Question 7f78485f-75cb-407c-b708-00e02f8c6faf

- How do `find`, `some`, and `every` short-circuit? What do `some`/`every` return on an empty array?

### Answer

- `find` returns the **first element** matching the predicate and stops; it returns `undefined` if none match (use `findIndex` for the index; both visit holes).
- `some` stops at the first `true`; `every` stops at the first `false`.
- On an empty array: `some` is `false`, `every` is `true` (vacuous truth).

- [More detail on `Array.prototype.some`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some)
- [More detail on `Array.prototype.every`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every)

---

### Question 973c4505-bdb5-424f-9d1d-5c8d8e4670cc

- How does `Object.groupBy` group values, and what happens to a numeric key returned by the callback?

### Answer

- `Object.groupBy(items, keyFn)` returns a **null-prototype object** whose values are arrays of items.
- The callback's return value is coerced with `ToPropertyKey`, so numbers become **strings** (`"1"`), and objects become `"[object Object]"`.
- Use `Map.groupBy` when keys must retain their original type (numbers, objects).

```js
Object.groupBy(["a", "bb"], (s) => s.length); // { "1": ["a"], "2": ["bb"] }
```

- [More detail on `Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)

---

### Question a296f5f4-7cf9-4f7d-82b4-06077109f375

- What do `entries()`, `keys()`, and `values()` yield, and how do they differ from `Object.keys`?

### Answer

- `entries()` yields `[index, value]` pairs; `keys()` yields indices; `values()` yields values — all as **lazy iterators**, not arrays.
- Dense arrays visit every index; for sparse arrays the iterator uses `Get`, so holes are yielded as `undefined` entries (unlike `forEach`/`map`, which skip them).
- `Object.keys` returns an **array** of own enumerable string keys and ignores array holes.

```js
for (const [i, v] of arr.entries()) console.log(i, v);
```

- [More detail on `Array.prototype.entries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/entries)

---

### Question f6747b6e-12a9-4717-8542-05be66a7d4fb

- Array destructuring: what are `b` and `rest` here, and why?
```js
const [, b = 2, ...rest] = [1];
```

### Answer

- `b` is `2`: the default applies because index 1 is **missing** (reading it yields `undefined`).
- `rest` is `[]`: the rest element collects remaining items — there are none, so it is always an array.
- The first element is skipped by the leading comma rather than bound to a variable.

- [More detail on Destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)

---

### Question c1a97de8-8102-4685-a318-a1129bfc89af

- What can `Array.isArray` do that `instanceof Array` cannot, and why?

### Answer

- `Array.isArray` works **across realms**: arrays created in an iframe or another V8 context are still recognized.
- `instanceof` compares the prototype chain against *this* realm's `Array.prototype`, so cross-realm arrays fail.
- `Array.isArray` also cannot be fooled by `Symbol.hasInstance` overrides; it checks the internal array brand.

- [More detail on `Array.isArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)

---

### Question 4a43b66e-8570-44da-b9e0-36316b8cf2f3

- How do `join` and `toString` serialize `null`, `undefined`, and holes?

### Answer

- `join` renders `null`, `undefined`, and holes as **empty strings** (the default separator is `","`).
- `toString` delegates to `join`, so it uses the same rules.
- Objects use their `toString`, and nested arrays are flattened one level by their own `join`.

```js
[1, null, undefined, , 2].join("-"); // "1----2"
```

- [More detail on `Array.prototype.join`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join)

---

### Question 00e7a998-272b-4fae-afb8-ebdef6f3c653

- Chained `.map().filter().map()` vs one imperative loop — when is the chain worth the intermediate arrays?

### Answer

- Each chained call **iterates once and allocates a new array**, so N stages means N passes and N allocations.
- The chain is worth it for clarity on small/medium arrays or one-off transformations; hot paths with large data should use one loop (or `flatMap`/`reduce`) to fuse passes.
- Measure first: allocation cost often matters far less than readability, except in per-frame or per-request hot code.

- [More detail on `Array.prototype.flatMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap)

---

### Question 1f152439-a894-43db-8db0-f44e4578b9b9

- `for...of` vs `.forEach()` vs indexed `for` — which when, especially with `break`/`continue`/`await`?

### Answer

- `for...of` supports `break`, `continue`, `return`, and `await` inside async functions; it also works on any iterable.
- `.forEach()` always visits the full array, **cannot break**, and ignores the callback's return value.
- Indexed `for` is the fastest and gives index access; use it in hot loops or when index math is central.

```js
for (const x of list) { if (x.done) break; }
```

- [More detail on `for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
- [More detail on `Array.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)

---

### Question 981d0dd4-2295-4885-a59a-f8d4b9b9d9db

- When does `reduce` hurt readability, and what replaces it?

### Answer

- `reduce` hurts when the accumulator type differs from the element type and the callback carries branching logic — readers must simulate state.
- Replace with a plain `for...of` loop (clearest), `Object.groupBy`/`Map.groupBy` for grouping, or dedicated helpers (`filter`, `map`, `some`).
- Use `reduce` for genuine folds: sums, min/max, building an indexed structure in one pass, flattening.

- [More detail on `Array.prototype.reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)

---

### Question c7fcb671-dbb8-44d2-89d5-1d73faf14bdc

- Array vs Set for membership checks and dedupe — where is the crossover point?

### Answer

- `array.includes` is O(n) per check; `set.has` is O(1) average — the gap only matters when checks repeat.
- For a handful of items checked a few times, an array avoids Set construction and memory overhead.
- For dedupe and repeated lookups over larger collections (hundreds+), build a Set once and reuse it.

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [More detail on `Array.prototype.includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)

---

### Question b5f6c933-8158-48a7-b603-518cc463b6fd

- Typed arrays vs normal arrays for numeric data: what do you give up and what do you gain?

### Answer

- Typed arrays have a **fixed length** and a fixed numeric element type (`Int32Array`, `Float64Array`, ...) backed by an `ArrayBuffer` — no holes, no mixed types.
- They gain contiguous memory, cache-friendly iteration, and direct binary/`ArrayBuffer` interop (WebGL, WASM, workers).
- They lose `push`/`pop`/`concat`/`flat` and normal array methods returning arrays — `map`/`filter` return typed arrays.

- [More detail on TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)

---

### Question 96ac77bc-e438-4ff3-9bb6-da088f09c326

- In-place `sort` vs `toSorted`: when do you need each in React/Redux-style immutable code?

### Answer

- `sort` mutates the receiver — mutating props/state breaks referential equality and can skip renders or corrupt memoized values.
- `toSorted` returns a **copy**, safe for derived state and props; same comparator semantics.
- Use in-place `sort` only for arrays you own locally (parsed input, working buffers) where allocation matters.

```js
const sorted = items.toSorted((a, b) => a.price - b.price);
```

- [More detail on `Array.prototype.toSorted`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)

---

### Question a318d833-24b7-469c-ba3b-837dabaacd05

- Remove duplicates from an array of primitives.

### Answer

- `new Set` dedupes by SameValueZero in one pass, preserving first-occurrence order.

```js
const unique = [...new Set(arr)];
```

- For objects, dedupe by a field with a Map keyed by that field instead (identity-based Set will not merge them).

- [More detail on Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### Question 8c586a3e-e9aa-4967-9aa4-175cd1590807

- Group an array of records by a field into a `Map` or object.

### Answer

- ES2024: `Object.groupBy(records, (r) => r.status)` for string keys, or `Map.groupBy` to preserve key types.
- Pre-ES2024 fallback: `reduce` into `{}`/`new Map()` with a get-or-create array.

```js
const byStatus = Map.groupBy(records, (r) => r.status);
```

- [More detail on `Map.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy)

---

### Question ce51d933-7152-4562-b995-29934691bb2d

- Chunk an array into fixed-size groups.

### Answer

- Walk the array in `size` steps and `slice` the range; `slice` returns copies, leaving the input untouched.

```js
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
```

- [More detail on `Array.prototype.slice`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)

---

### Question a243e497-064a-4457-843d-e45440e8a0de

- Partition an array into two arrays by predicate.

### Answer

- One pass, pushing into passed/failed buckets, avoids running the predicate twice.

```js
function partition(arr, pred) {
  const pass = [], fail = [];
  for (const x of arr) (pred(x) ? pass : fail).push(x);
  return [pass, fail];
}
```

- Two `filter` calls with inverted predicates also work but double the work.

- [More detail on `Array.prototype.filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)

---

### Question 16fa8596-7704-473a-9e0c-9861daf84b69

- Flatten an arbitrarily nested array.

### Answer

- `flat(Infinity)` flattens completely and removes holes; `flat(depth)` controls levels.
- `flatMap` is map + one-level flatten, useful when each item expands to several values.

```js
[1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4]
```

- Engine recursion depth still applies inside `flat(Infinity)` for very deep structures.

- [More detail on `Array.prototype.flat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat)

---

### Question 53f2d61e-3c72-4c68-a1ee-d86842138ab7

- Count occurrences of values with `reduce` — and why an object/Map beats a nested scan?

### Answer

- One pass with a counter avoids the O(n²) of scanning for each value.

```js
const counts = arr.reduce((acc, k) => {
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});
```

- Use a Map instead when keys can be objects, symbols, or `__proto__`-like strings (prototype pollution/collisions).

- [More detail on `Array.prototype.reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)

---

### Question 4249a204-33c4-4278-ac2c-6311ea184c90

- Find the last matching item (and its index) without reversing or copying the array.

### Answer

- `findLast(pred)` and `findLastIndex(pred)` scan **from the end** and short-circuit on the first match.
- They avoid `[...arr].reverse()` (copy + full pass) and manual reverse loops.

```js
items.findLast((x) => x.active);
items.findLastIndex((x) => x.active);
```

- [More detail on `Array.prototype.findLast`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast)

---

### Question 8daed48a-2f5c-493f-8123-bdf1af00b2a7

- TS: how do tuple types differ from arrays, and how does `as const` change inference?
```ts
type Point = [number, number];
```

### Answer

- A **tuple** fixes length and per-position types; `number[]` allows any length and one element type.
- `as const` produces `readonly` tuples with literal types, which is how `const` arrays keep exact values for unions/maps.

```ts
const pair = [1, "a"];            // (string | number)[]
const t = [1, "a"] as const;      // readonly [1, "a"]
```

- [More detail on Tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 3e131d9e-edca-4181-b747-08eee7535490

- Why does `[1, 2, 3].map(parseInt)` return `[1, NaN, NaN]`?

### Answer

- `map` passes `(element, index, array)`, and `parseInt(string, radix)` treats the **index as the radix**.
- `parseInt("1", 0)` → `1` (radix 0 = 10), `parseInt("2", 1)` → `NaN`, `parseInt("3", 2)` → `NaN`.
- Fix: `arr.map((s) => parseInt(s, 10))` or `arr.map(Number)`.

- [More detail on `parseInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)

---

### Question 272e454d-0d37-49f1-8944-5a9f9018caf7

- Why does removing items inside `forEach` skip elements, and what should replace it?

### Answer

- Removing at index `i` shifts later items left; `forEach` then advances to `i + 1`, **skipping** the element that moved into the removed slot.
- Replace with `filter` (build the desired array), or iterate **backwards** when mutating in place.

```js
arr.filter((x) => x.keep);
```

- [More detail on `Array.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)

---

### Question 1c54b97d-7d63-4264-8587-82cf42fac2ce

- This loop does not run forever — why not?
```js
const arr = [1, 2, 3];
arr.forEach(n => arr.push(n));
```

### Answer

- `forEach` captures `length` once at the start (3), so it visits exactly the original indices; pushed items are never visited.
- The array still grows — it ends as `[1, 2, 3, 1, 2, 3]`.
- Not a safe pattern: the bound is a spec detail, and other iteration styles (`for...of` over the same array) behave differently.

- [More detail on `Array.prototype.forEach`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)

---

### Question 0643a974-4414-4748-b391-2262d0b4b1cc

- Why is `arr.length = 0` a common way to clear an array, and what does it do to other references to the same array?

### Answer

- Setting `length = 0` removes every element **in place**, so all references to that array see an empty array.
- Reassigning `arr = []` only rebinds the variable; other references keep the original contents.
- Alternatives: `arr.splice(0)` (same in-place effect) — both mutate; `toSpliced(0)` returns an empty copy without touching the original.

- [More detail on `Array.prototype.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length)

---

### Question 59582637-7e8e-4679-ac2a-2ed4e3efa458

- Why doesn't `arr.map(fn)` change the original array even when `fn` returns a new value, and where do people mix this up with `forEach`?

### Answer

- `map` builds and returns a **new array**; it never writes back to the receiver (unless `fn` itself mutates outer state).
- Common bug: calling `arr.map(fn)` for side effects and ignoring the return value — nothing happens to `arr`.
- Rule of thumb: `map` for producing values, `forEach` for side effects, and never rely on `map` to mutate.

- [More detail on `Array.prototype.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)

---

### Question ad8c2ffa-f60d-4ce4-a124-a6e8f0ad7ae0

- Why is `Array(3).map(() => 0)` still full of holes, and what fixes it?

### Answer

- `Array(3)` creates three holes, and `map` **skips holes** without calling the callback, so the result keeps the same holes.
- Fixes: `Array.from({ length: 3 }, () => 0)` or `Array(3).fill(0)` — both create real elements.

```js
Array.from({ length: 3 }, () => 0); // [0, 0, 0]
Array(3).fill(0);                   // [0, 0, 0]
```

- [More detail on Array methods and empty slots](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#array_methods_and_empty_slots)

---
