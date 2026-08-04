# Javascript Coercion

### Question 023b6083-e1f3-41d0-82ed-17aabd941951

- what is Implicit coercion?

### Answer

- JS ***automatically converts*** a value from one type to another when the operator or context expects a different type — no explicit conversion code is written.
- Driven by the spec's Abstract Operations: ToNumber, ToString, ToPrimitive.
- Examples:
  - `"5" - 1` → 4 (String coerced to Number)
  - `5 + "5"` → `"55"` (Number coerced to String — `+` prefers concatenation)
  - `if ("")` → falsy (String coerced to Boolean)
- Gotcha: `+` is the odd one out — it favors String concatenation, while `-`, `*`, `/` always coerce to Number.

---

### Question 8bc8c997-6109-4b79-9dba-d7fa23bbf750

- what is Explicit coercion?

### Answer

- ***Deliberate, visible conversion*** written by the developer, e.g. `Number("5")`, `String(5)`, `Boolean(0)`, `parseInt("10px", 10)`, unary `+`, `!!value`.
- Implicit coercion hides the conversion; explicit coercion makes intent readable and avoids surprises.
- Gotchas:
  - `Number(null)` → 0, `Number(undefined)` → ***NaN***, `Number("")` → 0.
  - `Number("10px")` → NaN, but `parseInt("10px")` → 10.
  - `String(Symbol("x"))` works, but `"" + Symbol("x")` throws TypeError.

---

### Question 71c6eab3-2950-4e8c-9453-a16282bbe110

- 4-Step Mnemonic for coercion? G - B - O - S

### Answer

- G ──► Guard Rails (Same type? null/undefined?)
- B ──► Boolean (Convert Boolean -> Number)
- O ──► Object (Convert Object -> ToPrimitive)
- S ──► String (Convert String -> Number/BigInt)

- Step 1: G - Guard Rails (Early Exit)
  - Same Type? -> Delegate directly to === (Strict Equality).
  - null or undefined involved?
    - If BOTH sides are null or undefined -> true
    - If ONLY ONE side is null or undefined -> false (no coercion allowed!)
- Step 2: B - Boolean Conversion
  - Is either side a Boolean? -> Convert that Boolean to a Number (true -> 1, false -> 0).
  - Now restart at G with the new value.
- Step 3: O - Object Unwrapping
  - Is one side an Object and the other a Primitive? -> Convert the Object via ToPrimitive(obj).
  - Now restart at G with the new value.
- Step 4: S - String Conversion
  - Is one side a String and the other a Number / BigInt?
    - If paired with Number -> Convert String to Number (ToNumber(str)).
    - If paired with BigInt -> Convert String to BigInt (StringToBigInt(str)).
  - Now restart at G with the new value.

---

### Question 34d931ee-0fdb-43ed-8f0f-63e14e4f9ee8

- use G - B - O - S to explain the following expression: true == "true"

### Answer

- G — different types (Boolean vs String), no null/undefined → continue.
- B — Boolean involved → `true` → 1. Now `1 == "true"` → restart at G.
- G — still different types (Number vs String) → continue.
- S — String + Number → ToNumber(`"true"`) → ***NaN***.
- `1 == NaN` → false.
- Result: ***false***.

---

### Question 7d3fe1e8-914f-4777-81f3-b376edba266c

- use G - B - O - S to explain the following expression: true == "true"

### Answer

- G — different types (Boolean vs String), no null/undefined → continue.
- B — Boolean involved → `true` → 1. Now `1 == "true"` → restart at G.
- G — still different types (Number vs String) → continue.
- S — String + Number → ToNumber(`"true"`) → ***NaN***.
- `1 == NaN` → false.
- Result: ***false***.

---

### Question 938a0a54-9db7-440e-a37f-34bcdb8303c6

- use G - B - O - S to explain the following expression: [1, 2] + [3, 4] and [1, 2] - [3, 4]

### Answer

- `[1, 2] + [3, 4]` → `"1,23,4"`:
  - `+` with two Objects → ToPrimitive (default hint) on both sides.
  - Arrays: `valueOf()` returns the array itself (not a primitive) → falls back to `toString()` → `"1,2"` and `"3,4"`.
  - String + String → concatenation → `"1,23,4"`.
- `[1, 2] - [3, 4]` → ***NaN***:
  - `-` forces ToNumber on both operands: ToPrimitive → `"1,2"` → ToNumber → NaN (comma breaks numeric parsing).
  - `NaN - NaN` → NaN.
- Takeaway: `+` concatenates after stringification; `-` can only subtract numbers, so it produces NaN here.

---

### Question 1dc9d031-cb48-4b8a-b1f1-4288f1b89026

- use G - B - O - S to explain the following expression: "0" == []

### Answer

- G — different types (String vs Object), no null/undefined → continue.
- O — Object involved → ToPrimitive([]) → `valueOf()` not primitive → `toString()` → `""`. Now `"0" == ""` → restart at G.
- G — same type (String vs String) → delegate to `===` → `"0" === ""` → false.
- Result: ***false***.
- Gotcha: contrast with `0 == []` → true (empty string coerces to 0 in the S step).

---

### Question 83e5d00a-a6c7-4c0f-8126-33603c14ef5b

- use G - B - O - S to explain the following expression: null > 0, null == 0, and null >= 0

### Answer

- `null == 0` → ***false***: G — null on only one side → false immediately, ***no coercion allowed***. `null` only loosely equals `null`/`undefined`.
- `null > 0` → false: relational operators (`<`, `>`, `<=`, `>=`) don't follow the == rules — they force ToNumber: `ToNumber(null)` → 0 → `0 > 0` → false.
- `null >= 0` → ***true***: `ToNumber(null)` → 0 → `0 >= 0` → true.
- Gotcha: `null >= 0` is true while `null == 0` is false — relational and equality operators use different conversion rules. Classic interview trap.

---

### Question d261cda1-ac6e-4fd8-8165-131faa98e8f5

- use G - B - O - S to explain the following expression: [[]] == false

### Answer

- G — different types (Object vs Boolean), no null/undefined → continue.
- B — Boolean involved → `false` → 0. Now `[[]] == 0` → restart at G.
- O — Object involved → ToPrimitive([[]]) → `toString()` → `""` (inner `[]` stringifies to `""`). Now `"" == 0` → restart at G.
- S — String + Number → `""` → 0. Now `0 == 0` → true.
- Result: ***true***.

---

### Question af251839-a7ce-4c35-ae28-295572b7ab8a

- use G - B - O - S to explain the following expression: [[[2]]] == 2

### Answer

- G — different types (Object vs Number), no null/undefined → continue.
- O — Object involved → ToPrimitive([[[2]]]) → `toString()` → `"2"` (nested arrays flatten to their elements). Now `"2" == 2` → restart at G.
- S — String + Number → `"2"` → 2. Now `2 == 2` → true.
- Result: ***true***.

---

### Question 29dc7cd8-8aff-4c7a-bc20-92a8d85f37ec

- use G - B - O - S to explain the following expression: 1n == true vs 1n === true

### Answer

- `1n == true` → ***true***:
  - G — different types (BigInt vs Boolean), no null/undefined → continue.
  - B — Boolean involved → `true` → 1. Now `1n == 1` → restart at G.
  - G — BigInt vs Number: no Boolean/Object/String step applies — the spec compares BigInt and Number ***numerically*** → `1n == 1` → true.
- `1n === true` → ***false***: strict equality never coerces — different types (BigInt vs Boolean) → false immediately.
- Takeaway: `==` normalizes the Boolean first, then BigInt vs Number compare numerically; `===` only checks type identity.

---

### Question 02fd00f7-0526-4dcf-9157-28f818e8e2e3

- use G - B - O - S to explain the following expression: [] == ![]

### Answer

- `![]` → false (every Object is truthy). Now the expression is `[] == false`.
- G — different types (Object vs Boolean), no null/undefined → continue.
- B — Boolean involved → `false` → 0. Now `[] == 0` → restart at G.
- O — Object involved → ToPrimitive([]) → `""`. Now `"" == 0` → restart at G.
- S — String + Number → `""` → 0. Now `0 == 0` → true.
- Result: ***true*** — `[]` is truthy, yet `==`'s coercion chain makes it equal to its own negation.

---

### Question 7bb19b71-4730-4fee-9a71-911e3b155060

- edge case: what are the results of the following expressions?
  - [] + []
  - [] + {}
  - {} + []
  - [] == ![]
  - NaN == NaN

### Answer

- `[] + []` → `""` (both sides ToPrimitive → `""` → concatenation).
- `[] + {}` → `"[object Object]"` (`[]` → `""`, `{}` → `"[object Object]"`).
- `{} + []` → ***0*** at statement start: parsed as an empty block `{}` followed by `+[]` (unary plus → ToNumber(`""`) → 0). In expression context `({} + [])` → `"[object Object]"`.
- `[] == ![]` → true (see previous card: `[]` → `""` → 0, `![]` → false → 0).
- `NaN == NaN` → false: NaN is the only value not equal to itself — use `Number.isNaN()` to test.

```javascript
[] + []       // ""
[] + {}       // "[object Object]"
{} + []       // 0  (block + unary plus at statement start)
[] == ![]     // true
NaN == NaN    // false
```

---
