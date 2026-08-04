# Javascript Coercion

### Question 023b6083-e1f3-41d0-82ed-17aabd941951

- what is Implicit coercion?

### Answer

- ***Implicit coercion*** is JavaScript’s automatic conversion of a value when an operator or language construct needs another type.
- It is performed by abstract operations such as `ToPrimitive`, `ToNumber`, `ToString`, and `ToBoolean`.
- Examples:
  - `"5" - 1` → `4`: subtraction converts both operands to numbers.
  - `5 + "5"` → `"55"`: a string operand makes `+` concatenate after primitive conversion.
  - `if ("")` treats the empty string as falsy through Boolean conversion.
- Gotcha: `+` is context-dependent; `-`, `*`, `/`, and `%` perform numeric coercion, while `+` can perform string concatenation.

---

### Question 8bc8c997-6109-4b79-9dba-d7fa23bbf750

- what is Explicit coercion?

### Answer

- ***Explicit coercion*** is a conversion requested directly in code, such as `Number("5")`, `String(5)`, `Boolean(0)`, unary `+`, or `!!value`.
- `parseInt()` and `parseFloat()` are parsing functions: they read a numeric prefix rather than validating the entire string.
- Important behaviors:
  - `Number(null)` and `Number("")` → `0`; `Number(undefined)` → `NaN`.
  - `Number("10px")` → `NaN`, while `parseInt("10px", 10)` → `10`.
  - `Boolean("false")` → `true` because every non-empty string is truthy.
  - `String(Symbol("x"))` works, but `"" + Symbol("x")` throws a `TypeError`.

---

### Question 71c6eab3-2950-4e8c-9453-a16282bbe110

- 4-Step Mnemonic for coercion? G - B - O - S

### Answer

- G-B-O-S is a ***learning mnemonic for loose equality (`==`)***; it is not a complete rule for every operator.
- ***G — Guard rails:***
  - If both operands have the same type, compare them as strict equality would.
  - If both operands are `null` or `undefined`, the result is `true`; either value compared with any other type is `false`.
- ***B — Boolean conversion:*** convert a Boolean to a Number (`true` → `1`, `false` → `0`), then restart at G.
- ***O — Object unwrapping:*** when an Object is compared with a primitive, apply `ToPrimitive`. Arrays commonly fall through to `toString()`, producing a comma-joined string, then restart at G.
- ***S — String conversion:*** when a String is paired with a Number, convert it with `ToNumber`; when paired with a BigInt, attempt `StringToBigInt`. An invalid BigInt string makes the comparison `false`.
- If the process reaches a Number/BigInt pair, JavaScript compares their numeric values; any comparison involving `NaN` is `false`.

---

### Question 34d931ee-0fdb-43ed-8f0f-63e14e4f9ee8

- use G - B - O - S to explain the following expression: true == "true"

### Answer

- `true == "true"` evaluates to ***false***.
- ***G:*** the operands have different types, so continue.
- ***B:*** convert `true` to `1`; the comparison becomes `1 == "true"`.
- ***S:*** convert `"true"` with `ToNumber`; the result is `NaN`.
- Equality with `NaN` is always `false`, so `1 == NaN` is `false`.
- `true === "true"` is also `false`, but strict equality rejects the different types without coercion.

---

### Question 7d3fe1e8-914f-4777-81f3-b376edba266c

- use G - B - O - S to explain the following expression: true == "true"

### Answer

- `true == "true"` evaluates to ***false***.
- ***G:*** the operands have different types, so continue.
- ***B:*** convert `true` to `1`; the comparison becomes `1 == "true"`.
- ***S:*** convert `"true"` with `ToNumber`; the result is `NaN`.
- Equality with `NaN` is always `false`, so `1 == NaN` is `false`.
- `true === "true"` is also `false`, but strict equality rejects the different types without coercion.

---

### Question 938a0a54-9db7-440e-a37f-34bcdb8303c6

- use G - B - O - S to explain the following expression: [1, 2] + [3, 4] and [1, 2] - [3, 4]

### Answer

- G-B-O-S is intended for `==`; these arithmetic expressions mainly use `ToPrimitive` followed by the operator’s numeric or string rules.
- `[1, 2] + [3, 4]` → `"1,23,4"`:
  - Each array’s `valueOf()` returns an object, so `toString()` produces `"1,2"` and `"3,4"`.
  - The resulting primitive operands are strings, so `+` concatenates them.
- `[1, 2] - [3, 4]` → ***`NaN`***:
  - Subtraction converts each array to its primitive string, then attempts numeric conversion.
  - `ToNumber("1,2")` is `NaN` because the comma is not valid in a numeric literal; `NaN - NaN` remains `NaN`.
- Gotcha: arrays are not converted into numeric collections; their default primitive representation is a string.

---

### Question 1dc9d031-cb48-4b8a-b1f1-4288f1b89026

- use G - B - O - S to explain the following expression: "0" == []

### Answer

- `"0" == []` evaluates to ***false***.
- ***G:*** the operands are a String and an Object, so continue.
- ***O:*** `ToPrimitive([])` produces the empty string `""`; the comparison becomes `"0" == ""`.
- ***G:*** both operands are now Strings, so equality compares them without numeric conversion: `"0" === ""` is `false`.
- Contrast: `0 == []` is `true` because `[]` becomes `""`, and the String/Number step converts `""` to `0`.

---

### Question 83e5d00a-a6c7-4c0f-8126-33603c14ef5b

- use G - B - O - S to explain the following expression: null > 0, null == 0, and null >= 0

### Answer

- G-B-O-S describes `==`; relational operators use a different comparison algorithm.
- `null == 0` → ***false*** because `null` only loosely equals `null` or `undefined`; it is not coerced when compared with `0`.
- `null > 0` → `false`: this comparison uses numeric conversion, so `ToNumber(null)` → `0`, giving `0 > 0`.
- `null >= 0` → ***true***: the same conversion gives `0 >= 0`.
- Gotcha: `null == 0` is `false` while `null >= 0` is `true` because equality and relational operators have different coercion rules.

---

### Question d261cda1-ac6e-4fd8-8165-131faa98e8f5

- use G - B - O - S to explain the following expression: [[]] == false

### Answer

- `[[]] == false` evaluates to ***true***.
- ***B:*** convert `false` to `0`; the comparison becomes `[[]] == 0`.
- ***O:*** `ToPrimitive([[]])` produces `""`. The inner empty array stringifies to `""`, so the outer array also joins to an empty string.
- ***S:*** convert `""` to the Number `0`; the final comparison is `0 == 0`.
- Important: `[[]]` is truthy as an Object; this result comes from loose-equality coercion, not Boolean truthiness.

---

### Question af251839-a7ce-4c35-ae28-295572b7ab8a

- use G - B - O - S to explain the following expression: [[[2]]] == 2

### Answer

- `[[[2]]] == 2` evaluates to ***true***.
- ***O:*** array primitive conversion calls `toString()` after `valueOf()` returns an Object. Nested arrays stringify recursively, producing the String `"2"` in this case; they are not actually flattened.
- ***S:*** the String/Number equality step converts `"2"` to `2`.
- Both operands are then the Number `2`, so the comparison is `true`.
- Gotcha: nested arrays with multiple elements retain commas, such as `[[1, 2]].toString()` → `"1,2"`, which does not convert to a number.

---

### Question 29dc7cd8-8aff-4c7a-bc20-92a8d85f37ec

- use G - B - O - S to explain the following expression: 1n == true vs 1n === true

### Answer

- `1n == true` evaluates to ***true***.
- ***B:*** loose equality converts `true` to the Number `1`, producing `1n == 1`.
- BigInt/Number loose equality then compares their numeric values without converting the BigInt to a Number; `1n` and `1` represent the same integer.
- `1n === true` evaluates to ***false*** because strict equality does not coerce and the operand types differ.
- Gotcha: `1n === 1` is also `false`, and BigInt/Number arithmetic such as `1n + 1` throws a `TypeError` even though `1n == 1` is `true`.

---

### Question 02fd00f7-0526-4dcf-9157-28f818e8e2e3

- use G - B - O - S to explain the following expression: [] == ![]

### Answer

- `[] == ![]` evaluates to ***true***.
- First, `![]` evaluates to `false` because every Object, including an empty array, is truthy.
- ***B:*** convert `false` to `0`; ***O:*** convert `[]` to its primitive `""`; ***S:*** convert `""` to `0`.
- The final comparison is `0 == 0`, so the result is `true`.
- Gotcha: `[]` is truthy in a Boolean context but can become an empty string during loose equality; `[] === ![]` is `false`.

---

### Question 7bb19b71-4730-4fee-9a71-911e3b155060

- edge case: what are the results of the following expressions?
  - [] + []
  - [] + {}
  - {} + []
  - [] == ![]
  - NaN == NaN

### Answer

- `[] + []` → `""`: both arrays become empty strings, then `+` concatenates them.
- `[] + {}` → `"[object Object]"` for an ordinary object: `[]` becomes `""`, while the object uses its default string representation.
- A bare `{} + []` at the start of a statement can be parsed as an empty block followed by unary `+[]`, producing `0`. In expression context, `({} + [])` produces `"[object Object]"`.
- `[] == ![]` → `true` because `![]` is `false`, and the loose-equality chain converts both sides to `0`.
- `NaN == NaN` → `false`; use `Number.isNaN(value)` to test for the numeric `NaN` value.

```javascript
[] + []       // ""
[] + {}       // "[object Object]"
{} + []       // 0  (statement-start parse)
({} + [])     // "[object Object]"
[] == ![]     // true
NaN == NaN    // false
```

---
