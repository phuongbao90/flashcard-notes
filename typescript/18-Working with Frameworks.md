# TypeScript Working with Frameworks

### Question 2c016337-bd3d-433c-a4bd-46d2b6e63bf8

- How do you type React function component props?

### Answer

- Define a `Props` type or interface and annotate the parameter: `function Card({ title }: CardProps)`.
- For children, add `children?: React.ReactNode` or use `React.PropsWithChildren<CardProps>`.
- `React.FC` adds `children` only in older `@types/react`; current versions never inject props you did not declare, so declare only what you need.

```tsx
type CardProps = { title: string; children?: React.ReactNode };
function Card({ title, children }: CardProps) { return <section>{title}{children}</section>; }
```

- [More detail on React TypeScript](https://react.dev/learn/typescript)
- [More detail on PropsWithChildren](https://react.dev/learn/typescript#typing-children)

---

### Question a0ec0caa-2971-436b-9228-0dcba2249207

- What is the difference between `ReactNode`, `ReactElement`, and `JSX.Element`?

### Answer

- `ReactNode` is the widest renderable type: elements, strings, numbers, `null`, `undefined`, booleans, arrays, fragments, and portals.
- `ReactElement` is a created element object (what `createElement` returns), and `JSX.Element` is its JSX-typed form (essentially `ReactElement<any, any>`).
- Use `ReactNode` for `children` and render props; `ReactElement` when you require a single element you can clone/inspect.

```tsx
function Panel({ header }: { header: ReactElement }) { return <div>{header}</div>; }
```

- [More detail on ReactNode](https://react.dev/learn/typescript#typing-children)
- [More detail on ReactElement](https://react.dev/reference/react/createElement)

---

### Question 0fba537f-195e-4007-800f-1693bb73bc9a

- How do you type event handlers in React?

### Answer

- Use React's synthetic event types: `React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>`, `React.FormEvent<HTMLFormElement>`.
- For a reusable handler, annotate a variable with `React.ChangeEventHandler<HTMLInputElement>` and the parameter is contextually typed.
- React's events are synthetic wrappers, not DOM events; do not mix `MouseEvent` (DOM) with `React.MouseEvent`.

```tsx
const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => setValue(e.target.value);
<input value={value} onChange={onChange} />
```

- [More detail on React event types](https://react.dev/learn/typescript#typing-dom-events)
- [More detail on SyntheticEvent](https://react.dev/reference/react-dom/components/common#react-event-object)

---

### Question 294adf69-a0ea-45a6-965b-18d143eba821

- Why is `e.target.value` typed as `string` in React but needs narrowing in the DOM?

### Answer

- React types `ChangeEvent<HTMLInputElement>` with a `target: EventTarget & HTMLInputElement` that already includes the element.
- So `e.target.value` is directly available — React's event type is generic over the element.
- `e.currentTarget` is also typed to the element; `e.target` is the element that fired the change.

```tsx
function handle(e: React.ChangeEvent<HTMLInputElement>) { e.target.value; }
```

- [More detail on ChangeEvent](https://react.dev/learn/typescript#typing-dom-events)
- [More detail on FormEvent](https://react.dev/learn/typescript)

---

### Question 10a5b14a-fe9b-429f-afd0-c8c5871b8bc8

- How does `useState` infer its type, and when must you annotate it?

### Answer

- From the initial value: `useState(0)` → `number`, `useState("a")` → `string` (widened), `useState<User | null>(null)` needed when the initial value is `null`.
- Annotate when the state starts empty but will hold a shape, or when the value is a union you want to constrain.
- The setter type is `Dispatch<SetStateAction<T>>`, which accepts a value or an updater function.

```tsx
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);
```

- [More detail on useState](https://react.dev/reference/react/useState)
- [More detail on React TypeScript](https://react.dev/learn/typescript)

---

### Question fbdf3872-b914-45d8-900e-a10b229ba206

- How do you type `useRef` for a DOM node versus a mutable value?

### Answer

- DOM ref: `useRef<HTMLInputElement>(null)` — `current` is `HTMLInputElement | null`, and it is assignable to a `ref` prop.
- Mutable container: `useRef<number>(0)` — `.current` is writable and persists across renders.
- Older typings split these as `RefObject` (readonly `current`) vs `MutableRefObject` (writable); `useRef<T>(null)` picks the DOM-safe one.

```tsx
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} />;
inputRef.current?.focus();
```

- [More detail on useRef](https://react.dev/reference/react/useRef)
- [More detail on React TypeScript](https://react.dev/learn/typescript)

---

### Question f0d7e259-ad0c-4284-a3a6-fc041d8fdbd3

- Why does returning a promise from `useEffect` fail to compile?

### Answer

- The effect callback type is `() => void | Destructor`; an `async` function returns `Promise<void>`, which is not a destructor.
- React would treat the promise as a cleanup function, which is a bug — the type error is protecting you.
- Pattern: define an async function inside the effect and call it, so the effect itself returns `void` or a real cleanup.

```tsx
useEffect(() => { load(); }, []);            // OK
useEffect(async () => { await load(); }, []); // Error
```

- [More detail on useEffect](https://react.dev/reference/react/useEffect)
- [More detail on React TypeScript](https://react.dev/learn/typescript)

---

### Question 2af37a56-7c85-422a-a082-41cd3051e131

- How do you type a custom hook that returns a tuple?

### Answer

- Return an object for extensibility, or a tuple if the values are well-known positions.
- Tuples need `as const` (or an explicit return type) to be inferred as fixed-length rather than a union array.
- The hook's return type is just a normal function return type; consumers get precise destructuring.

```ts
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  return [on, () => setOn((v) => !v)] as const;
}
const [on, toggle] = useToggle();
```

- [More detail on custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [More detail on const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

---

### Question 1b45c98c-dd84-4717-b665-a9891a41fed6

- How do you write a generic React component?

### Answer

- Declare a type parameter on a function declaration: `function List<T>({ items, render }: Props<T>)`.
- Components passed to JSX are inferred from props; React does not need a special generic component syntax.
- Arrow generic components need a trailing comma in `.tsx` (`<T,>`) to avoid JSX parsing.

```tsx
type ListProps<T> = { items: T[]; render: (item: T) => React.ReactNode };
function List<T>({ items, render }: ListProps<T>) { return <ul>{items.map(render)}</ul>; }
```

- [More detail on generic components](https://react.dev/learn/typescript)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question e8498c6d-00e0-4560-add4-713aa4e3840f

- What is `React.ComponentType` and when do you use it?

### Answer

- A union of function and class components: `ComponentType<P>`, useful for props that receive a component to render.
- For intrinsic elements use `keyof JSX.IntrinsicElements`; for either, `React.ElementType`.
- This keeps "pass a component" APIs typed without `any`.

```tsx
type Props = { Icon: React.ComponentType<{ size?: number }> };
```

- [More detail on ComponentType](https://react.dev/learn/typescript)
- [More detail on JSX.IntrinsicElements](https://www.typescriptlang.org/docs/handbook/jsx.html)

---

### Question a69171b1-6a06-4bcd-ac9a-1f826da3d749

- How do you extend intrinsic element props for a wrapper component?

### Answer

- Use `React.ComponentProps<"button">` (or `JSX.IntrinsicElements["button"]`) and spread the rest onto the element.
- `ComponentPropsWithoutRef` drops the `ref` member when your component does not forward it.
- This preserves `onClick`, `disabled`, ARIA attributes, etc. without re-declaring them.

```tsx
type ButtonProps = React.ComponentPropsWithoutRef<"button"> & { variant?: "primary" };
function Button({ variant, ...rest }: ButtonProps) { return <button {...rest} />; }
```

- [More detail on ComponentProps](https://react.dev/learn/typescript)
- [More detail on JSX.IntrinsicElements](https://www.typescriptlang.org/docs/handbook/jsx.html)

---

### Question a7cff446-e084-4f7a-a90f-58473b552e79

- How is `forwardRef` typed, and what changed in React 19?

### Answer

- `forwardRef<HTMLInputElement, Props>((props, ref) => ...)` fixes both the ref's element type and props; the ref parameter is `ForwardedRef<T>`.
- Without the type arguments, both are inferred from usage or fall back to `unknown`/`any`.
- React 19 allows `ref` as a regular prop for function components, making `forwardRef` unnecessary in new code (still supported).

```tsx
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => <input ref={ref} {...props} />);
```

- [More detail on forwardRef](https://react.dev/reference/react/forwardRef)
- [More detail on React 19 ref as prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop)

---

### Question 3e12718d-bb98-4fb2-8f28-416b6c0ade13

- How do you type `createContext` without making consumers handle `null`?

### Answer

- Two camps: `createContext<T | null>(null)` plus a `useX()` hook that throws when the value is missing, or a non-null default when a real default makes sense.
- The throwing-hook pattern gives consumers a guaranteed `T` and centralizes the error message.
- Avoid `createContext({} as T)` — it hides accidental usage outside a provider.

```tsx
const Ctx = createContext<Theme | null>(null);
function useTheme() { const v = useContext(Ctx); if (!v) throw new Error("ThemeProvider missing"); return v; }
```

- [More detail on createContext](https://react.dev/reference/react/createContext)
- [More detail on useContext](https://react.dev/reference/react/useContext)

---

### Question 60cbb4bc-eca7-497e-a577-4cf535a11636

- How do you type a `useReducer` with discriminated actions?

### Answer

- Define a union of action variants with a `type` discriminant, and `useReducer<Reducer<State, Action>>` or plain inference from the reducer function.
- Each case narrows `action.payload` automatically, so reducers get the same exhaustiveness benefits as other unions.
- The returned `dispatch` accepts only the union, so typos in action types are compile errors.

```ts
type Action = { type: "inc" } | { type: "set"; value: number };
function reducer(s: number, a: Action) { return a.type === "inc" ? s + 1 : a.value; }
const [n, dispatch] = useReducer(reducer, 0);
```

- [More detail on useReducer](https://react.dev/reference/react/useReducer)
- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

### Question 5a9843ee-e7e9-419b-9528-c963e3ba9326

- Why is `useState` with an object prone to type errors when using spread updates?

### Answer

- `setState({ ...state, key: value })` uses the inferred state type; if the state type includes a union or optional fields, the spread may not satisfy it.
- Functional updates (`setState((s) => ({ ...s, key: value }))`) are strongly typed and avoid stale closures.
- Partial updates that may remove required properties error — by design.

```tsx
setState((s) => ({ ...s, name: "x" }));
```

- [More detail on useState](https://react.dev/reference/react/useState)
- [More detail on state updates](https://react.dev/learn/updating-objects-in-state)

---

### Question 5a4730b1-c44b-46ac-8eb0-35deaf275b52

- How do you type a component prop that accepts either a value or a render function?

### Answer

- A union of the plain value and a function: `value: T | ((item: T) => ReactNode)`.
- Inside the component, narrow with `typeof value === "function"` before calling it.
- Add a generic so `T` flows from the data prop to the render prop.

```tsx
type Cell<T> = { value: T | ((t: T) => React.ReactNode) };
function Cell<T>({ value }: Cell<T>) {
  return <>{typeof value === "function" ? (value as (t: T) => React.ReactNode)({} as T) : value}</>;
}
```

- [More detail on render props](https://react.dev/learn/passing-props-to-a-component)
- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

---

### Question 64f53ebb-4a05-4c77-b626-976edb6d7324

- What is the error boundary type contract in TS?

### Answer

- A class component implementing `componentDidCatch(error: Error, info: React.ErrorInfo)` and/or `static getDerivedStateFromError(error): State`.
- React's types do not enforce that class components are error boundaries; the methods must match the React types exactly.
- Type the state to model the error (`{ hasError: boolean }`) so rendering can branch.

```tsx
class Boundary extends React.Component<Props, { hasError: boolean }> {
  static getDerivedStateFromError() { return { hasError: true }; }
}
```

- [More detail on error boundaries](https://react.dev/reference/react/Component#componentdidcatch)
- [More detail on ErrorInfo](https://react.dev/reference/react/Component#componentdidcatch)

---

### Question c611bcb9-e2cd-4b5c-b11b-b641ffa09324

- How do you type a polymorphic component with an `as` prop?

### Answer

- Use a generic over the element tag: `as?: E` plus props from `React.ComponentPropsWithoutRef<E>`.
- The component's props then depend on the chosen element, and `ref`/attributes are checked against it.
- This is the pattern used by Chakra/Radix; it is the most advanced React typing most apps need.

```tsx
type BoxProps<E extends React.ElementType> = { as?: E } & Omit<React.ComponentPropsWithoutRef<E>, "as">;
function Box<E extends React.ElementType = "div">({ as, ...rest }: BoxProps<E>) {
  const Tag = as ?? "div"; return <Tag {...rest} />;
}
```

- [More detail on polymorphic components](https://react.dev/learn/typescript)
- [More detail on ComponentPropsWithoutRef](https://react.dev/learn/typescript)

---

### Question ec3cf146-6a68-4e8d-8ccf-6e002e91933f

- What is the correct type for a component that wraps and clones its children?

### Answer

- Accept `React.ReactElement<{ className?: string }>` to constrain the child's props, or `ReactNode` when any renderable value is allowed.
- `React.cloneElement` preserves the generic child props type, so the added props are checked.
- For multiple children, `React.ReactNode` is usually the right input type.

```tsx
function Wrap({ children }: { children: React.ReactElement<{ className?: string }> }) {
  return React.cloneElement(children, { className: "wrap" });
}
```

- [More detail on cloneElement](https://react.dev/reference/react/cloneElement)
- [More detail on ReactElement](https://react.dev/reference/react/createElement)

---

### Question b2b57b72-8534-4ea9-a83b-0d8f2813d89c

- How do you type `React.memo` and does it change the component's type?

### Answer

- `React.memo(Component)` returns a `NamedExoticComponent<P>` that is still usable in JSX; the props type is preserved.
- A custom comparator receives `(prev: Readonly<P>, next: Readonly<P>)` — note the readonly wrapper.
- Generics on the inner component are preserved through `memo` in modern typings.

```tsx
const Row = React.memo(function Row({ id }: { id: string }) { return <li>{id}</li>; });
```

- [More detail on memo](https://react.dev/reference/react/memo)
- [More detail on React TypeScript](https://react.dev/learn/typescript)

---

### Question 3ad6ed1e-b436-4c7f-b6c4-ea140fe09e23

- What is the type of `process.env` in Node and how do you extend it?

### Answer

- `process.env` is `ProcessEnv`, whose values are typed `string | undefined`.
- Extend it by augmenting the `NodeJS.ProcessEnv` interface in a `.d.ts`; keys then become required-if-declared but still `string | undefined` unless you redeclare them.
- Do not assume a variable is present; validate at startup and convert types explicitly.

```ts
declare namespace NodeJS {
  interface ProcessEnv { DATABASE_URL: string }
}
const url = process.env.DATABASE_URL; // string | undefined
```

- [More detail on process.env](https://nodejs.org/api/process.html#processenv)
- [More detail on @types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node)

---

### Question 54974628-3e74-4469-9bd7-c1a1d0016ffd

- How do you type an Express route handler's `req`, `res`, and `next`?

### Answer

- Use `RequestHandler` from `express`, or annotate the parameters with the generic `Request`/`Response`/`NextFunction` types.
- `Request<Params, ResBody, ReqBody, ReqQuery>` lets you type path params, the JSON body, and the response body.
- Returning `void`/`Promise<void>` is the handler contract; returning a value does nothing.

```ts
import type { Request, Response } from "express";
app.get("/users/:id", (req: Request<{ id: string }>, res: Response<User>) => {
  res.json(/* User */);
});
```

- [More detail on Express types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)
- [More detail on Express routing](https://expressjs.com/en/guide/routing.html)

---

### Question 6699aac9-5483-47ca-9c59-eb4a7be6c3b6

- How do you type the request body in Express?

### Answer

- Pass the body type as the third generic argument: `Request<{}, ResBody, CreateUserBody>`.
- The body is whatever the client sent — Express does not validate it, so annotate only after a runtime check.
- Prefer deriving the type from a schema (Zod) and validating before the handler uses it.

```ts
type CreateUser = { email: string };
app.post("/users", (req: Request<{}, {}, CreateUser>, res) => {
  const { email } = req.body; // trusted only if validated upstream
});
```

- [More detail on Express Request](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)
- [More detail on express.json](https://expressjs.com/en/api.html#express.json)

---

### Question ce041c6a-2adc-4dc1-bd4b-0df76d79d4f4

- Why is `req.query.ids` typed as `string | string[] | ParsedQs | ParsedQs[] | undefined`?

### Answer

- Query strings are user-controlled: any key can appear once, repeat, or use bracket syntax, so the type is a broad union.
- Express's default query parser produces `ParsedQs` objects for nested syntax.
- Validate and normalize (`zod.coerce`, explicit conversion) before using values; never cast blindly to `string`.

```ts
const ids = req.query.ids; // string | string[] | ParsedQs | ParsedQs[] | undefined
const first = typeof ids === "string" ? ids : undefined;
```

- [More detail on req.query](https://expressjs.com/en/api.html#req.query)
- [More detail on ParsedQs](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/qs)

---

### Question ef569f80-8fe5-4a1c-9630-90a58435ae94

- How do you type Express middleware and the `next` function?

### Answer

- Middleware is `RequestHandler` (`(req, res, next) => void | Promise<void>`); `next()` with no args continues, `next(err)` short-circuits to the error handler.
- Parameter types come from the same generics as handlers, so typing a middleware that needs a body shape is explicit.
- Async middleware must catch or forward errors; in Express 5, rejected promises are forwarded automatically, in Express 4 they are not.

```ts
const auth: RequestHandler = (req, res, next) => { if (!token) { next(new Error("no token")); return; } next(); };
```

- [More detail on middleware](https://expressjs.com/en/guide/using-middleware.html)
- [More detail on Express types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)

---

### Question 3e8d1bd5-4d76-47d9-beda-0621e15b5c3a

- How do you type an Express error-handling middleware?

### Answer

- It must have **four** parameters and be declared after routes; TS only recognizes `ErrorRequestHandler` for four-arg functions.
- Type the error as `unknown` (or a custom `AppError`) and narrow before reading `message`/`status`.
- Express does not infer the error type; validation is your job.

```ts
const errors: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "unknown";
  res.status(500).json({ message });
};
```

- [More detail on error handling](https://expressjs.com/en/guide/error-handling.html)
- [More detail on ErrorRequestHandler](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)

---

### Question d7d69350-9102-47c3-8f0e-0b9f4fa94855

- How do you add `req.user` to Express without `any`?

### Answer

- Augment the Express request interface in a `.d.ts` and declare the property as optional so unauthenticated requests type-check.
- Then narrow in handlers (or write an `authenticated` middleware that guarantees it) instead of asserting at every use.

```ts
declare global { namespace Express { interface Request { user?: { id: string } } } }
export {};
```

- [More detail on Express declaration merging](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)
- [More detail on module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)

---

### Question 2da098f0-d33d-44f2-a11d-53388478e750

- How do you type `res.locals` and `app.locals`?

### Answer

- Both are `Record<string, any>` by default, so any access type-checks — a silent `any` source.
- Augment `Express.Locals` (or define your own interfaces and cast once in a helper) to get real types.
- Prefer passing typed data through function arguments where possible; locals are global-ish mutable state.

- [More detail on res.locals](https://expressjs.com/en/api.html#res.locals)
- [More detail on Express types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)

---

### Question b8355833-ad9c-423b-8438-32863f46cfdd

- How do you share request/response types between client and server?

### Answer

- Put route contract types in a shared module: path params, request body, response body, and error shape.
- Both the Express handler and the fetch client use those types; a schema library can generate them from one source.
- Avoid hand-maintained duplicates — they drift silently because nothing links them.

```ts
// shared/contracts.ts
export type GetUser = { params: { id: string }; response: User };
```

- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)

---

### Question 8bf880f3-588e-42e0-bfcb-deee1026b98a

- How do you type a typed API client with fetch or axios generics?

### Answer

- With `fetch`: cast the parsed JSON deliberately after validation and type the helper per endpoint.
- With axios: `axios.get<User>(url)` gives `AxiosResponse<User>`, and `axios.get<User>(url).then((r) => r.data)`.
- Always combine with runtime validation; generics only describe the shape you claim the server returns.

```ts
const res = await fetch("/api/user").then((r) => r.json() as Promise<User>);
const { data } = await axios.get<User>("/api/user");
```

- [More detail on axios TypeScript usage](https://github.com/axios/axios#typescript)
- [More detail on fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

---

### Question 6d0f65d2-a211-4129-ac67-cf7caa882f52

- Why do Node `http.IncomingMessage` and Express `Request` have different types?

### Answer

- `IncomingMessage` is the raw Node stream object (headers, socket, method) with no routing or body parsing.
- Express `Request` **extends** `IncomingMessage` and adds `params`, `query`, `body`, `ip`, etc.
- Use Express types inside middleware/handlers and Node types only when working directly with `http`/`net` servers.

- [More detail on IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage)
- [More detail on Express Request](https://expressjs.com/en/api.html#req)

---

### Question 16921186-3ab3-4323-add1-7d93a7cbb07e

- How do you type a middleware factory (middleware with configuration)?

### Answer

- The factory returns `RequestHandler`: `function rateLimit(opts: Opts): RequestHandler { return (req, res, next) => ... }`.
- Close over the options in the returned function; TS keeps the handler fully typed.
- Avoid exporting the inner function directly, which would leak the options parameter into route registration.

```ts
function rateLimit(max: number): RequestHandler { return (req, _res, next) => next(); }
```

- [More detail on middleware](https://expressjs.com/en/guide/using-middleware.html)
- [More detail on factory functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)

---

### Question f76a5313-7ea6-4468-9c69-83092dfe71ca

- How should you handle `next()` typing when you never call it?

### Answer

- Express still passes `next`; prefix unused parameters with `_next` (or omit them if the handler signature allows fewer parameters).
- Handlers with fewer declared parameters are assignable, so `(req, res)` is a valid `RequestHandler`.
- `noUnusedParameters` will flag `_next` unless it is prefixed with an underscore.

```ts
app.get("/health", (_req, res) => res.json({ ok: true }));
```

- [More detail on RequestHandler](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)
- [More detail on noUnusedParameters](https://www.typescriptlang.org/tsconfig#noUnusedParameters)

---

### Question 87e4c740-a87f-4ddf-a16e-5bab2798083e

- What is the safest way to validate request payloads in a typed Express app?

### Answer

- Parse with a schema at the boundary, then use the **parsed** value rather than `req.body`.
- Repeat per route or in a middleware that replaces `req.body` with the typed parse result (declare it carefully).
- The schema's inferred type is the single source of truth; route contract types derive from it (`z.infer<typeof Schema>`).

```ts
const parsed = CreateUserSchema.safeParse(req.body);
if (!parsed.success) { res.status(400).json({ errors: parsed.error.issues }); return; }
createUser(parsed.data); // typed, validated
```

- [More detail on Zod](https://zod.dev/)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question b7006ce1-f5e1-4ba5-b2da-00832c29090b

- How do you test typed Express handlers without a running server?

### Answer

- Call the handler directly with small fakes: `handle(req as Request, res as unknown as Response, next)`.
- Prefer extracting the business logic into a plain function that takes validated data, so route tests are thin and logic tests need no HTTP types.
- Use `supertest` for integration coverage of routing/status codes.

```ts
await handler({ body: { email: "a@b.c" } } as Request, res as unknown as Response, vi.fn());
```

- [More detail on supertest](https://github.com/ladjs/supertest)
- [More detail on Express routing](https://expressjs.com/en/guide/routing.html)

---

### Question f954506e-d8ae-4750-abc4-8cd15dfeb985

- How do React and Express typing strategies differ in one sentence?

### Answer

- React types are mostly **inferred locally** from props/JSX, so explicit annotations are rare.
- Express types are mostly **explicit generics** on `Request`/`Response`, because the framework cannot infer runtime data shapes.
- In both, the boundary (HTTP input, external data) needs runtime validation regardless of types.

- [More detail on React TypeScript](https://react.dev/learn/typescript)
- [More detail on Express types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)
