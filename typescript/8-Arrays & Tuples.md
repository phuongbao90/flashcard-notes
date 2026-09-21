# TypeScript Arrays & Tuples

### Question 3613d164-9557-4c46-8548-223a3a2a0225

- What is the difference between `T[]` and `Array<T>`?

### Answer

- No semantic difference: `Array<T>` is the generic interface, `T[]` is sugar for it. Both are the same type.
- Prefer `T[]` for simple element types and `Array<T>` when the element itself is a union/function that reads badly: `Array<A | B>` beats `(A | B)[]` in some nesting cases.
- `readonly T[]` / `ReadonlyArray<T>` is the immutable counterpart with no mutating methods.

```ts
const a: string[] = [];
const b: Array<string | number> = [];
const c: readonly string[] = a;
```

- [More detail on Array types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)
- [More detail on ReadonlyArray](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)

---

### Question 088f44b7-aea2-4154-af15-e9f2460a4f2f

- Why is `readonly string[]` not assignable to `string[]`?

### Answer

- The mutation direction is unsafe: a consumer of `string[]` may `push` or write `arr[0] = x`, which the original readonly view forbids.
- Assignability is therefore covariant for reads but blocks mutable writable arrays.
- You can safely go the other way: a mutable `string[]` **is** assignable to `readonly string[]`.

```ts
const ro: readonly string[] = [];
const mut: string[] = ro;    // Error
const ok: readonly string[] = mut;
```

- [More detail on ReadonlyArray](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)
- [More detail on assignability](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 897b1566-16f2-460e-92a9-d2db021c61ae

- What is a tuple type and how does it differ from an array type?

### Answer

- A tuple fixes the **length and per-index types**: `[string, number]`.
- Arrays are homogeneous and variable-length; tuples are positional records with a known layout.
- Extra methods (`push`) still exist but are typed against the tuple's member union, so misuse is often caught.

```ts
type Point = [x: number, y: number];
const p: Point = [1, 2];
const bad: Point = [1, "2"]; // Error
```

- [More detail on Tuple Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)
- [More detail on arrays](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)

---

### Question bc6321aa-8dc3-43a2-84de-d5607fd460e9

- What happens when you call `push` on a tuple?

### Answer

- `push` accepts any element type present in the tuple, so `[string, number]` allows pushing `string | number`.
- The tuple's declared length does not change (the type stays 2 elements), so runtime and type can diverge — a known hole.
- Mutations are the main reason to use `readonly` tuples: their API has no `push`.

```ts
const t: [string, number] = ["a", 1];
t.push("x"); // compiles; length is 3 at runtime
const r: readonly [string, number] = ["a", 1];
r.push("x"); // Error
```

- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)
- [More detail on readonly tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types)

---

### Question da51db12-277e-4f8d-a1a5-1ce28d3b51c6

- How do optional tuple elements work?

### Answer

- Suffix elements may be marked `?`: `[string, number?]` accepts length 1 or 2.
- Optional elements must come **after** required ones; optional before required/rest is an error.
- The union of tuple lengths is what makes this useful for "return value plus optional metadata".

```ts
type Pair = [string, number?];
const a: Pair = ["x"];
const b: Pair = ["x", 1];
```

- [More detail on optional tuple elements](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-tuple-elements)
- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 2e871752-884e-4635-9711-9122d490aa0f

- What are variadic tuple types and where do they appear?

### Answer

- Rest elements inside tuples: `[string, ...number[]]`, `[first: T, ...rest: T[]]`, and spreading generic tuples `[...A, ...B]`.
- They let functions preserve argument lists (`concat`, `curry`, `bind`) instead of losing them to `any[]`.
- Combined with generic inference they model "one element plus the rest of a caller-provided tuple".

```ts
declare function tail<T extends unknown[]>(arr: [unknown, ...T]): T;
const t = tail([1, "a", true]); // ["a", true]
```

- [More detail on variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)
- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 25774122-e3f2-450a-8cf1-aff19e6b2910

- What are labeled tuple elements and why use them?

### Answer

- Tuple members can carry names for documentation and better editor hovers: `[start: number, end: number]`.
- Labels do not affect assignability or runtime; `[string, number]` and `[a: string, b: number]` are identical types.
- They improve errors and hover text in APIs with positional arguments.

```ts
type Range = [start: number, end: number];
```

- [More detail on labeled tuple elements](https://www.typescriptlang.org/docs/handbook/2/objects.html#labeled-tuple-elements)
- [More detail on function parameter naming](https://www.typescriptlang.org/docs/handbook/2/functions.html)

---

### Question 08786bc6-5bce-4988-9995-a0aef33ed64e

- How does destructuring a tuple compare to destructuring an array?

### Answer

- Tuple destructuring gives **precise per-position types**; array destructuring gives the element type (possibly `| undefined` under `noUncheckedIndexedAccess`).
- Rest destructuring of a tuple produces a tuple (using the trailing members), not an array of `any`.
- The rest variable's type depends on how many leading elements were consumed.

```ts
declare const t: [string, number, boolean];
const [s, n, b] = t;   // string, number, boolean
const [first, ...rest] = t; // string, [number, boolean]
```

- [More detail on tuple destructuring](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)
- [More detail on array destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)

---

### Question ef92a159-00e6-414c-9283-717eed642ef3

- With `noUncheckedIndexedAccess`, what differs between indexing an array and indexing a tuple?

### Answer

- **Array:** `arr[0]` is `T | undefined` — the compiler cannot prove the index exists.
- **Tuple:** a literal in-bounds index keeps the exact type (`t[0]` is `T`), because the length is known; out-of-bounds literal indices are a compile error.
- A non-literal index (e.g. `t[i]` where `i: number`) yields the tuple member union, possibly `| undefined` under the flag.

```ts
declare const arr: string[];
declare const t: [string, number];
const a = arr[0];    // string | undefined
const b = t[0];      // string
const c = t[1_000];  // Error: no element at index 1000
```

- [More detail on noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)
- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 0e9f2a9a-8897-4a2c-87aa-caf985f48f8e

- Why does `const xs = [1, 2] as const` produce `readonly [1, 2]` instead of `readonly number[]`?

### Answer

- `as const` on an array literal produces a **readonly tuple**, keeping both the fixed length and literal element types.
- Without it, the literal widens to mutable `number[]`.
- This is the standard way to build a const table whose keys/values feed derived types.

```ts
const xs = [1, 2] as const;         // readonly [1, 2]
const ys = [1, 2];                  // number[]
type X = (typeof xs)[number];        // 1 | 2
```

- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [More detail on readonly tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types)

---

### Question 3c657dc1-c3cf-4382-b776-5552870045f7

- How do you type spreading a tuple into a function's parameter list?

### Answer

- If the tuple's type matches the parameter tuple, `fn(...t)` is accepted; TS checks argument count and types positionally.
- This is why `Parameters<typeof fn>` is a tuple: it can be re-spread with `fn(...args)`.
- Extra/missing elements are compile errors, unlike spreading an array (which may require the function to accept `...T[]`).

```ts
function move(x: number, y: number) {}
const args: [number, number] = [1, 2];
move(...args); // OK
```

- [More detail on spread in calls](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- [More detail on Parameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype)

---

### Question f8d5a5fd-8b82-4142-a432-4978b4eafb39

- What type does `map` return when called on a tuple?

### Answer

- It returns a **regular array** (`U[]`), not a tuple — the callback may change element count in the general case.
- For a readonly tuple, `map` still produces `U[]`, but `readonly`-prefixed methods like `toSpliced`/`with` exist for some operations.
- If you need to preserve tuple shape, use a mapped tuple type or explicit reconstruction.

```ts
const t = [1, 2] as const;
const r = t.map((n) => String(n)); // string[]
```

- [More detail on Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [More detail on mapped tuple types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)

---

### Question 4897b252-515f-486f-b7b3-0dc4aa139de1

- Why does `["a", "b"].includes(x)` fail to narrow `x` to `"a" | "b"`?

### Answer

- `includes` is typed against the array's element type, which is widened to `string`, so passing an arbitrary `string` is legal and no narrowing can occur.
- Use a readonly tuple (`as const`) plus a **type predicate** helper to get narrowing.
- The derived union should come from the same runtime array so validation and types never drift.

```ts
const SIZES = ["sm", "md"] as const;
type Size = (typeof SIZES)[number];
const isSize = (x: string): x is Size => SIZES.includes(x as Size);
if (isSize(input)) use(input); // Size
```

- [More detail on Array.includes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)
- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

### Question 93ffc24d-e072-4387-986b-d9cdb5a08fee

- How do you type a fixed-width matrix or 2D array?

### Answer

- Nested arrays: `number[][]` is a dynamic grid; nested tuples preserve shape: `[[number, number], [number, number]]`.
- For a type-level fixed size, mapped/recursive tuple types (`BuildTuple<N>`) exist, but they add compile-time cost and are rarely worth it.
- Prefer `readonly` shapes for data you do not mutate.

```ts
type Vec2 = readonly [number, number];
type Mat2 = readonly [Vec2, Vec2];
```

- [More detail on arrays](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)
- [More detail on recursive types](https://www.typescriptlang.org/play)

---

### Question 242d55b0-1963-4a0c-baf3-1b77df20f4f4

- Does `Array.isArray` narrow an `unknown` to `unknown[]`?

### Answer

- Yes — `Array.isArray(x)` narrows `x` to `any[]` (the lib signature uses `any[]`), which is then usable but unsafely typed.
- For a stronger result, guard the element type separately: `Array.isArray(x) && x.every(isString)`.
- Because tuple/array information is not recovered, runtime validation is still required for shape correctness.

```ts
declare const data: unknown;
if (Array.isArray(data)) data.map((x) => String(x)); // any[] elements
```

- [More detail on Array.isArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question c2abf666-3a24-48bd-b34d-51fffce60739

- What do `Array.from` and `Array.of` infer?

### Answer

- `Array.from(iterable)` infers the element type from the source iterable (or `unknown` for untyped sources).
- `Array.from(iterable, mapFn)` infers the mapped element type from the callback's return.
- `Array.of(...items)` infers the best common element type, similar to an array literal.

```ts
const a = Array.from(new Set([1, 2]));      // number[]
const b = Array.from("ab", (c) => c.length); // number[]
const c = Array.of("a", 1);                 // (string | number)[]
```

- [More detail on Array.from](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)
- [More detail on Array.of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of)

---

### Question 4400c9c0-8688-45a9-8338-c48ba2d5d880

- Why is `Object.entries(obj)` typed as `[string, T][]` and what does that cost you?

### Answer

- The lib signature cannot know the object's keys, so it widens keys to `string`.
- Iterating loses `keyof` precision, so indexing back into `obj` with the key is not guaranteed to compile.
- Typed alternatives: a helper generic over `T extends object` that casts, or iterate `Object.keys` with a validated key union.

```ts
const obj = { a: 1, b: 2 };
for (const [k, v] of Object.entries(obj)) console.log(k, v); // k: string, v: number
```

- [More detail on Object.entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

---

### Question 62e40b7e-c472-40a8-b945-50d56082cb52

- How does `flat` handle depth in its typing?

### Answer

- `flat()` (default depth 1) produces `FlatArray<U, 1>[]`: it removes one level of nesting based on the element union.
- For a non-literal depth (`flat(n: number)`), the result degrades to the fully flattened element type — the compiler cannot track the arbitrary depth.
- `flatMap` is typed like `flat(depth 1)` and does not preserve tuple shape.

```ts
const x = [[1], [2]].flat();     // number[]
const y = [[[1]]].flat(2);       // number[]
```

- [More detail on Array.flat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat)
- [More detail on FlatArray](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

### Question f68c0c44-de85-48d1-b4a4-4ea7b25c01e5

- How do you preserve an inferred tuple type through a helper function?

### Answer

- Use a generic over the whole array with a tuple constraint: `<T extends unknown[]>(xs: T) => T`, together with `as const` at the call site.
- Without the tuple constraint, inference widens to an array, and the fixed-length information is lost.
- This is how typed helpers like `createTuple`/`satisfies`-checked config tables keep literal element types.

```ts
function tuple<T extends unknown[]>(...xs: T): T { return xs; }
const t = tuple("a", 1); // [string, number]
```

- [More detail on variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)
- [More detail on generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints)

---

### Question 167ab89f-4912-4674-a110-e3d929c9c70c

- When is a tuple a bad choice for a return type?

### Answer

- When the meaning is not obvious at the call site or when you may add fields later — tuples encode position, not names, and callers use index-based destructuring.
- Named objects are better for anything beyond 2–3 elements, anything that may evolve, or values that are conventionally swapped.
- Tuples are best for genuinely positional data: coordinates, `[key, value]` pairs, `[error, result]`-style contracts.

```ts
// prefer this
type UserPage = { items: User[]; cursor: string | null };
// over this
type UserPageTuple = [User[], string | null];
```

- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)
- [More detail on objects](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#object-types)

---

### Question 653d123e-86fc-4d9d-8b9f-a27e064196b9

- How do you type an array that must not be reassigned but whose elements are updatable?

### Answer

- `readonly` on the variable (`const arr`) prevents rebinding, not mutation.
- `readonly` on the type (`readonly T[]`) prevents mutation of elements, not rebinding.
- You often want only the first: `const` for the binding, plain `T[]` for the elements.

```ts
const xs: string[] = ["a"];
xs.push("b");     // OK — elements mutable
xs = ["c"];       // Error — binding is const
```

- [More detail on const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- [More detail on readonly arrays](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)

---

### Question 9d9f8e17-a68f-4597-9809-710ff31e8942

- Why does `[1, 2, 3].map((n) => n.toString())` infer `string[]` without annotations?

### Answer

- Contextual typing: the array literal infers `number[]`, so the callback parameter is `number`, and `map`'s generic `U` is inferred from the return `string`.
- The result of `map` is `U[]` — a new array, not a tuple.
- If the callback returns a union, `U` is inferred as that union.

```ts
const r = [1, 2].map((n) => n > 1); // boolean[]
```

- [More detail on Array.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [More detail on contextual typing](https://www.typescriptlang.org/docs/handbook/type-inference.html#contextual-typing)

---

### Question 06bd10db-c92e-4744-985c-8f9d039258f9

- What is the `ReadonlyArray<T>` utility alias and how does it relate to `readonly T[]`?

### Answer

- They are the same type; `readonly T[]` is syntax sugar for `ReadonlyArray<T>` (and `readonly [A, B]` for `Readonly<[A, B]>`).
- It removes all mutating methods from the interface: no `push`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`.
- Most library APIs should accept `readonly T[]` so callers can pass tuples and frozen arrays.

```ts
function sum(xs: readonly number[]) { return xs.reduce((a, b) => a + b, 0); }
sum([1, 2]); sum([1, 2] as const);
```

- [More detail on ReadonlyArray](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)
- [More detail on readonly modifiers](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)

---

### Question d22e8c9c-562d-4cd8-ade4-6b8a67d817ad

- How do `Parameters<T>` and tuple types relate?

### Answer

- `Parameters<F>` extracts a function's parameter list **as a tuple**, preserving optional/rest markers.
- You can then annotate a variable, spread it back into the function, or index it positionally.
- `ConstructorParameters<T>` is the analogous utility for constructors.

```ts
function f(a: string, b?: number) {}
type P = Parameters<typeof f>; // [a: string, b?: number]
const args: P = ["x"];
f(...args);
```

- [More detail on Parameters](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype)
- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 7f44a7f8-0506-4ee9-9052-3be270086f49

- Why does `arr.filter(Boolean)` not remove `undefined` from `(string | undefined)[]`?

### Answer

- `Boolean` has no type-predicate signature, so `filter` cannot narrow; the result stays `(string | undefined)[]` even under `strict`.
- Write an explicit predicate: `filter((x): x is string => x != null)`.
- The generic overload only narrows when the callback itself is a **type predicate**; a plain boolean-returning callback keeps the source element type.

```ts
const xs: (string | undefined)[] = [];
const clean = xs.filter((x): x is string => x != null); // string[]
```

- [More detail on Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

### Question 28820ae9-39ae-4052-bc12-e43d8d1930fb

- How do you type arrays of mixed, mutually exclusive shapes?

### Answer

- Use an **array of a discriminated union**: `(Cat | Dog)[]`, not a union of arrays (`Cat[] | Dog[]`).
- A union of arrays lets you push only values valid for the narrowed array, and is usually not what you want.
- If you must keep separate collections, model them as separate fields in an object instead.

```ts
type Pet = { kind: "cat"; meows: true } | { kind: "dog"; barks: true };
const pets: Pet[] = [{ kind: "cat", meows: true }];
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on arrays](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)

---

### Question c2b31a79-1279-4f65-abb7-7b6dbd8e8bdb

- What is the difference between sparse arrays and arrays containing `undefined` in TS?

### Answer

- The type system has no "hole" type: a sparse array and one with explicit `undefined` look the same (`(T | undefined)[]`).
- `noUncheckedIndexedAccess` approximates the risk by making every array index possibly `undefined`.
- Methods like `forEach`/`map` skip holes at runtime but visit explicit `undefined`, which no type can express — so avoid sparse arrays.

- [More detail on array methods and empty slots](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#array_methods_and_empty_slots)
- [More detail on noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)

---

### Question dc23d4fe-7ff5-47ad-ab49-f6d60c2650e2

- Does `Array.prototype.sort` mutate the array, and how is that reflected in the types?

### Answer

- Yes — `sort` and `reverse` sort in place and return the **same** array reference.
- The types only show `T[]` in and `T[]` out, so they do not warn about mutation; use `toSorted`/`toReversed` (ES2023) for non-mutating copies.
- With `readonly T[]` the mutating methods are removed, making the intent explicit.

```ts
const xs = [3, 1];
xs.sort();          // mutates xs
const ys = xs.toSorted((a, b) => a - b); // new array
```

- [More detail on Array.sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
- [More detail on toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)

---

### Question 783915f2-82ed-4495-a32a-578a2061047c

- How do you type a non-empty array?

### Answer

- Use a tuple with a required first element and a rest element: `[T, ...T[]]`.
- This lets callers index `[0]` without `undefined` (even under `noUncheckedIndexedAccess`) and makes empty arrays unrepresentable.
- Spread arguments and variadic helpers commonly use this shape.

```ts
type NonEmpty<T> = [T, ...T[]];
function head<T>(xs: NonEmpty<T>): T { return xs[0]; }
```

- [More detail on variadic tuple types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)
- [More detail on tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)

---

### Question 988cd8a9-8208-43d2-9363-30a085546f9b

- How do you convert a `readonly` tuple to a mutable array?

### Answer

- Spread it into a new array literal: `[...tuple]` produces `T[]` with a fresh mutable array.
- `Array.from(readonlyTuple)` also works and gives `T[]`.
- Assigning the readonly tuple directly to `T[]` is an error (write-safety), and `as T[]` is an unchecked escape.

```ts
const t = ["a", 1] as const;
const arr: (string | number)[] = [...t]; // mutable copy
```

- [More detail on readonly tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types)
- [More detail on spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
