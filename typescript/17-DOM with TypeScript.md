# TypeScript DOM with TypeScript

### Question ca972808-75e0-4990-9419-dad3c276f5df

- Where do DOM types come from, and what enables them?

### Answer

- They ship with TypeScript as `lib.dom.d.ts`, included when `lib`/`target` resolves to a browser environment.
- The `lib` compiler option controls it explicitly: `"lib": ["ES2022", "DOM", "DOM.Iterable"]`.
- Node-only projects often exclude `dom` (or include `@types/node` instead) so `document`/`window` are compile errors, not runtime surprises.

```jsonc
{ "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"] } }
```

- [More detail on lib](https://www.typescriptlang.org/tsconfig#lib)
- [More detail on DOM declarations](https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts)

---

### Question 083d9ed0-3610-4f4c-b600-ad099b65532d

- What does `document.querySelector` return, and how do you get a specific element type?

### Answer

- The generic-free form returns **`Element | null`**.
- With a tag name literal, TS uses `HTMLElementTagNameMap` to return `HTMLInputElement | null`, etc.
- With an explicit type argument (`querySelector<HTMLInputElement>`) it returns that type — but it is an **unchecked assertion**, not a runtime check.

```ts
const a = document.querySelector("input");        // HTMLInputElement | null
const b = document.querySelector<HTMLInputElement>(".x"); // HTMLInputElement | null, asserted
```

- [More detail on querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
- [More detail on HTMLElementTagNameMap](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElementTagNameMap)

---

### Question a58afd40-b2d9-43ae-a05b-2229916bcd08

- Why is `document.querySelector("#a")` typed `Element | null` rather than `HTMLElement | null`?

### Answer

- Selectors are arbitrary strings at runtime; type inference only maps **known tag names** (`"div"`, `"input"`), not IDs/classes.
- `Element` is the safe base type because the match could be an SVG or other non-HTML element.
- Narrow with `instanceof HTMLElement` (real runtime check) or assert with a type argument (unchecked).

```ts
const byId = document.querySelector("#app"); // Element | null
if (byId instanceof HTMLElement) byId.style.color = "red";
```

- [More detail on Element](https://developer.mozilla.org/en-US/docs/Web/API/Element)
- [More detail on HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)

---

### Question 9ee410f8-8383-436c-9baa-29a8d8ec0932

- How is `getElementById` typed, and why is the return type still nullable?

### Answer

- `document.getElementById(id: string): HTMLElement | null` — the DOM may not contain the element.
- Types do not know about your HTML, so the null is unavoidable; `!` asserts, a guard checks.
- `document.body` and `document.documentElement` are non-null (the DOM spec guarantees them once parsing starts).

```ts
const el = document.getElementById("app");
if (el) el.dataset.ready = "1";
document.body.classList.add("dark"); // no null check needed
```

- [More detail on getElementById](https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById)
- [More detail on strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)

---

### Question ba6a6da8-4d3d-4e6f-805a-2eeaccde6db3

- What does `querySelectorAll` return, and how do you iterate it?

### Answer

- A **`NodeListOf<T>`**, not an array — it has `length`, `item()`, `forEach`, and (with `DOM.Iterable`) `Symbol.iterator`.
- `querySelectorAll<HTMLElement>(".item")` narrows the element type; the tag-name overload maps `"div"` to `NodeListOf<HTMLDivElement>`.
- To use array methods, spread/`Array.from` it — which materializes a copy.

```ts
const items = document.querySelectorAll<HTMLButtonElement>(".btn");
items.forEach((b) => (b.disabled = true));
const arr = [...items]; // needs DOM.Iterable or downlevelIteration
```

- [More detail on querySelectorAll](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll)
- [More detail on NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList)

---

### Question aa408ed8-032a-4466-ba00-7770d4e834af

- How does `createElement` infer a specific element type?

### Answer

- The overload maps the tag name literal through `HTMLElementTagNameMap`: `createElement("input")` → `HTMLInputElement`.
- Custom elements are not in the map, so they come back as `HTMLElement` unless you augment the map.
- `document.createElementNS` handles SVG and returns `Element`.

```ts
const input = document.createElement("input");
input.value = "x"; // typed
interface HTMLElementTagNameMap { "my-widget": MyWidget }
```

- [More detail on createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)
- [More detail on HTMLElementTagNameMap](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElementTagNameMap)

---

### Question 17c383d0-abf9-4b1f-9d44-b39b5df23aec

- How does `addEventListener` type the event object?

### Answer

- The element's `addEventListener` overloads use `HTMLElementEventMap`, so the event name selects the event type: `"click"` → `MouseEvent`, `"keydown"` → `KeyboardEvent`.
- The listener's `this` is typed as the element the listener is attached to.
- The generic `EventTarget` overload gives you `Event`; if your handler takes `Event` you lose the specific properties.

```ts
button.addEventListener("keydown", (e) => e.key);   // KeyboardEvent
button.addEventListener("click", (e) => e.button);  // MouseEvent
```

- [More detail on addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [More detail on HTMLElementEventMap](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElementEventMap)

---

### Question 4e2ee667-672b-4a2f-b846-1835dc91c80d

- What is the difference between `event.target` and `event.currentTarget` in TS?

### Answer

- Both are typed **`EventTarget | null`** in lib.dom — verified for a specific element listener; `this` is the only precisely typed reference.
- `target` is the element that fired the event (may be a child, useful for delegation); `currentTarget` is the listener's element.
- You must narrow both (`instanceof`) before using element-specific APIs, or use `this` inside a non-arrow handler.

```ts
list.addEventListener("click", function (e) {
  this;            // HTMLUListElement
  if (e.target instanceof HTMLLIElement) e.target.dataset.id;
});
```

- [More detail on event.target](https://developer.mozilla.org/en-US/docs/Web/API/Event/target)
- [More detail on event.currentTarget](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget)

---

### Question 34895579-af13-4ce8-a4d5-2c64bab9527e

- Why does `e.target.value` fail to compile, and how do you fix it?

### Answer

- `target` is `EventTarget | null`, which has no `value`; `value` exists on `HTMLInputElement`.
- Fix by narrowing: `if (e.target instanceof HTMLInputElement) e.target.value` (and remember `target` re-reads each access, so store it in a variable).
- The assertion form `(e.target as HTMLInputElement).value` is unchecked and unsafe for delegated events.

```ts
function onChange(e: Event) {
  const el = e.target;
  if (el instanceof HTMLInputElement) use(el.value);
}
```

- [More detail on instanceof narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#instanceof-narrowing)
- [More detail on HTMLInputElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement)

---

### Question b6b845e1-dc98-4d2e-bfc6-e735183b0092

- Why does storing `e.target` in a variable sometimes fix narrowing errors?

### Answer

- Accessing `e.target` repeatedly produces a fresh expression that TS cannot keep narrowed across statements.
- A local `const el = e.target` preserves the narrowed type inside the `if`.
- This is a general narrowing caveat, not DOM-specific.

```ts
if (e.target instanceof HTMLInputElement) {
  e.target.value = "a"; // Error: target may have changed
}
const el = e.target;
if (el instanceof HTMLInputElement) el.value = "a"; // OK
```

- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [More detail on event.target](https://developer.mozilla.org/en-US/docs/Web/API/Event/target)

---

### Question b09bfa59-95c9-4801-a9b4-6b37cc59798a

- How do you type a reusable event handler function with a generic event type?

### Answer

- Parameterize over the event map key so the handler's event type is derived: `function on<K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, handler: (e: HTMLElementEventMap[K]) => void)`.
- This is exactly how the DOM lib models `addEventListener`.
- Avoid `any` and avoid `(e: Event)` when the caller needs specific fields.

```ts
function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement, type: K, handler: (e: HTMLElementEventMap[K]) => void,
) { el.addEventListener(type, handler); }
```

- [More detail on event maps](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [More detail on addEventListener typing](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)

---

### Question 010edc07-07d6-4fc5-849b-f67a3982eecb

- How do you type a custom event with a payload?

### Answer

- Use `CustomEvent<T>` where `T` is the `detail` type: `new CustomEvent<{ id: string }>("user-picked", { detail: { id } })`.
- Listen with a cast or a typed wrapper because `addEventListener("user-picked", ...)` falls back to the generic `Event` overload — custom names are not in the event map.
- Augmenting `HTMLElementEventMap`/`WindowEventMap` gives full inference for custom names.

```ts
interface MyEventMap { "user-picked": CustomEvent<{ id: string }> }
// listen: el.addEventListener("user-picked", ((e: MyEventMap["user-picked"]) => e.detail.id) as EventListener);
```

- [More detail on CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [More detail on global event maps](https://developer.mozilla.org/en-US/docs/Web/API/WindowEventMap)

---

### Question 6fc74706-7349-4ade-ae36-f0fbfcf0deeb

- What does `dataset` return, and why is every property `string | undefined`?

### Answer

- `element.dataset` is typed `DOMStringMap`, whose index signature is `[name: string]: string | undefined`.
- HTML data attributes are strings and may be absent, so both facts are modeled.
- Convert explicitly (`Number(x)`, a boolean check) and never assume a missing attribute is `""`.

```ts
el.dataset.count;          // string | undefined
Number(el.dataset.count ?? 0);
```

- [More detail on dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)
- [More detail on DOMStringMap](https://developer.mozilla.org/en-US/docs/Web/API/DOMStringMap)

---

### Question 5eeaf320-6a13-4945-9056-7c2451e49a33

- What is the type difference between `children` and `childNodes`?

### Answer

- `children` is an **`HTMLCollection`** of `Element`s (element children only).
- `childNodes` is a **`NodeListOf<ChildNode>`** including text and comment nodes.
- Neither is an array; `children` has no `forEach`, so index or spread it.

```ts
const kids: HTMLCollection = el.children;
const nodes: NodeListOf<ChildNode> = el.childNodes;
```

- [More detail on children](https://developer.mozilla.org/en-US/docs/Web/API/Element/children)
- [More detail on childNodes](https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes)

---

### Question 6f04d996-d263-481c-862c-a5a45b0cb798

- How is `Node.appendChild` typed, and what does it return?

### Answer

- `appendChild<T extends Node>(node: T): T` — it returns the appended node typed as the argument, so you can reuse it.
- Passing a non-Node is caught at compile time.
- For strings use `append()` (accepts `Node | string`); `appendChild` does not accept strings.

```ts
const added = list.appendChild(li); // HTMLInputElement-ish T, no cast needed
```

- [More detail on appendChild](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild)
- [More detail on ParentNode.append](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)

---

### Question f28c642a-c497-4ee1-a61a-a6e5bdf7727a

- How do you safely get an element and fail loudly when it is missing?

### Answer

- Write a tiny assertion helper that narrows `Element | null` to the expected type and throws otherwise.
- This centralizes the "must exist" invariant instead of scattering `!` across the codebase.
- Typing the helper generically lets callers pick the element type with one call.

```ts
function must<T extends Element>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`missing: ${sel}`);
  return el;
}
const input = must<HTMLInputElement>("#email");
```

- [More detail on querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector)
- [More detail on assertion functions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions)

---

### Question 56bde81e-1c31-41f9-9491-76bea51471dc

- What does `Element.closest` return, and how do you type it?

### Answer

- `closest<E extends Element = Element>(selectors: string): E | null` — generic with a default of `Element`.
- Pass the expected type argument when you know the structure, but it is an unchecked assertion.
- Store the result in a variable before narrowing to avoid repeated null checks.

```ts
const card = target.closest<HTMLElement>(".card");
if (card) card.dataset.id;
```

- [More detail on closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
- [More detail on Element](https://developer.mozilla.org/en-US/docs/Web/API/Element)

---

### Question fcd559fd-a001-4769-9d38-be8764bc8ad5

- How do you type form values with `FormData`?

### Answer

- `new FormData(form)` requires an `HTMLFormElement`; entries are `[string, FormDataEntryValue]` where the value is `string | File`.
- `formData.get(name)` returns `FormDataEntryValue | null`, so narrow before using it as a string.
- For typed forms, model fields explicitly or use a library; `FormData` types are intentionally loose.

```ts
const data = new FormData(form);
const email = data.get("email");
if (typeof email === "string") use(email);
```

- [More detail on FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [More detail on FormDataEntryValue](https://developer.mozilla.org/en-US/docs/Web/API/FormDataEntryValue)

---

### Question be7d8ee6-112b-4595-be07-50a5c8542ab4

- How is the `submit` event typed, and why does `preventDefault` matter?

### Answer

- `form.addEventListener("submit", (e) => ...)` gives a `SubmitEvent` (in recent lib.dom) with `e.submitter` typed.
- You must call `e.preventDefault()` to stop navigation; TS will not remind you.
- `HTMLFormElement.requestSubmit()` triggers a real submit; `form.submit()` bypasses the submit event entirely.

```ts
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
});
```

- [More detail on submit event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event)
- [More detail on SubmitEvent](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent)

---

### Question 6af96ce7-0785-40d7-b01c-cc2fb1fda8d3

- How do you iterate a `NodeList` in a `for...of` loop without a compile error?

### Answer

- Add `DOM.Iterable` to `lib` (or transpile with `downlevelIteration`) — `NodeListOf<T>` implements `Symbol.iterator` only in that lib.
- `NodeList.forEach` works without it, and `Array.from`/spread is the other common fallback.
- `for...of` over `HTMLCollection` requires a manual `Array.from`.

```ts
for (const el of document.querySelectorAll(".item")) el.classList.add("on");
```

- [More detail on DOM.Iterable](https://www.typescriptlang.org/tsconfig#lib)
- [More detail on NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList)

---

### Question 8a38f50b-9b11-47f4-84e9-e3fc4364c687

- What is the relationship between `Element`, `HTMLElement`, and `SVGElement`?

### Answer

- `Element` is the common supertype of all elements (HTML, SVG, MathML).
- `HTMLElement` and `SVGElement` both extend `Element`; HTML-only properties (`style`, `dataset`, `hidden`) live on `HTMLElement`.
- A value typed `Element` needs `instanceof HTMLElement` before HTML-specific use; SVG-specific APIs need `SVGElement`.

```ts
const el: Element = document.querySelector("svg")!;
el.getBoundingClientRect();     // on Element
if (el instanceof SVGElement) el.viewBox.baseVal;
```

- [More detail on Element](https://developer.mozilla.org/en-US/docs/Web/API/Element)
- [More detail on SVGElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement)

---

### Question 3adcc4cb-1f4a-4066-a722-fa5c88d5cb91

- Why can SSR code fail at runtime even though DOM types compile?

### Answer

- `lib.dom` types exist at compile time regardless of where the code runs; `document` may be undefined in Node.
- Server-rendered modules must guard access to `window`/`document` or keep DOM code inside effects/handlers.
- Some setups exclude `dom` from `lib` for server-only code, making bare `document` usage a compile error.

```ts
if (typeof window !== "undefined") window.scrollTo(0, 0);
```

- [More detail on lib](https://www.typescriptlang.org/tsconfig#lib)
- [More detail on window](https://developer.mozilla.org/en-US/docs/Web/API/Window)

---

### Question 50259532-062d-4054-98e3-9c8c6e87036c

- How do you type a DOM collection as a plain array for filtering/mapping?

### Answer

- `Array.from(nodeList)` or spread materializes a real array and gives full array method typing.
- `Array.prototype.filter`/`map` on the result does not mutate the live collection (unlike `NodeList`/`HTMLCollection`, which can be live).
- Use `Array.from(list, mapFn)` for a single-pass conversion with typing.

```ts
const texts = Array.from(document.querySelectorAll("li"), (li) => li.textContent ?? "");
```

- [More detail on Array.from](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)
- [More detail on NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList)

---

### Question 35dff347-3916-46fb-a04a-9f72859443cd

- How do you type `window.setTimeout` code that also runs in Node?

### Answer

- Use `ReturnType<typeof setTimeout>` for the handle instead of `number` or `NodeJS.Timeout`.
- The DOM lib declares `number`; Node declares `NodeJS.Timeout` with `unref`. Mixing them causes type conflicts.
- `clearTimeout` accepts both, so the aliased handle works in both environments.

```ts
const id: ReturnType<typeof setTimeout> = setTimeout(() => {}, 100);
```

- [More detail on ReturnType](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype)
- [More detail on setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)

---

### Question a013514e-f231-4e5e-9b1a-c519117437b1

- What does `Element.getAttribute` return, and how does it differ from a typed property?

### Answer

- `getAttribute(name): string | null` — a raw string (or null), with no knowledge of the attribute's meaning.
- Typed properties (`input.value`, `input.disabled`) parse/reflect with correct types (`boolean` for `disabled`).
- Prefer typed properties for standard attributes; use `getAttribute` for custom/data attributes.

```ts
input.disabled;             // boolean
input.getAttribute("disabled"); // string | null
```

- [More detail on getAttribute](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute)
- [More detail on reflecting attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes)

---

### Question 3a7abe47-2ad7-46ef-a9a7-60f3bdf646cc

- How do you type a function that accepts any DOM element but only uses `id` and `classList`?

### Answer

- Type the parameter as `Element` (the narrowest common supertype that has `id`/`classList`) or as `HTMLElement` if you need `style`/`dataset`.
- Accepting `HTMLElement` rejects SVG elements; accepting `Element` accepts more callers.
- Prefer the narrowest interface that supports what you use, or define a minimal structural type.

```ts
function highlight(el: Element) { el.classList.add("hl"); }
```

- [More detail on Element](https://developer.mozilla.org/en-US/docs/Web/API/Element)
- [More detail on structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 3ed16804-22f5-4b38-9d78-761a0f42c03e

- How do you type event delegation for a list of buttons?

### Answer

- Attach one listener to the container, then narrow `event.target` to the element type you expect.
- Use `closest()` to find the delegated element (handles clicks on nested content).
- Because `target` is `EventTarget | null`, `instanceof` is the safe narrowing step.

```ts
list.addEventListener("click", (e) => {
  const el = e.target;
  if (!(el instanceof Element)) return;
  const btn = el.closest<HTMLButtonElement>("button[data-id]");
  btn?.dataset.id;
});
```

- [More detail on event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation)
- [More detail on closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

---

### Question 1b9716d2-2c96-4402-ada7-b4f70b718202

- Why is `element.style.color = 1` an error, and what is the correct value type?

### Answer

- `CSSStyleDeclaration` properties are typed `string` (e.g. `color: string`), not numbers or unions of color names.
- TS does not validate CSS syntax, so `"not-a-color"` compiles but is ignored by the browser.
- For CSS variables use `style.setProperty("--x", value)`.

```ts
el.style.color = "red";
el.style.opacity = "0.5"; // strings for numeric CSS too
```

- [More detail on CSSStyleDeclaration](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration)
- [More detail on setProperty](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty)

---

### Question 1773bf4d-7113-46d3-9106-ef0942543a32

- How do you type a drag-and-drop handler where `dataTransfer` is nullable?

### Answer

- `DragEvent.dataTransfer` is `DataTransfer | null`; guard before calling `getData`/`setData`.
- Use `e.preventDefault()` in `dragover` to allow dropping (runtime requirement, not a type rule).
- Store the transferred item in component state when `dataTransfer` payloads are unreliable across browsers.

```ts
el.addEventListener("drop", (e) => {
  e.preventDefault();
  const id = e.dataTransfer?.getData("text/plain");
  if (id) use(id);
});
```

- [More detail on DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent)
- [More detail on DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer)

---

### Question c51c71a7-1bb1-490b-9e2c-455487f2f924

- What is `globalThis` and how do you augment it safely?

### Answer

- `globalThis` is the environment-agnostic global object (window/global/self), typed as `typeof globalThis`.
- Augment it with `declare global { var myGlobal: T }` or `interface GlobalThis`-style merging, keeping properties optional when setup is conditional.
- Prefer module exports over globals; `globalThis` is for polyfills and cross-environment shims.

```ts
declare global { var __DEV__: boolean }
```

- [More detail on globalThis](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis)
- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)
