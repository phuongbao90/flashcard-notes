# TypeScript Projects & Practice

### Question dd390c55-0231-48fe-86d7-989595b104f3

- When modeling a Todo, should `completed` be a boolean or a union of states?

### Answer

- A boolean is fine when there are exactly two states and no extra data.
- If you later need `archived`, `deleted`, or `syncing`, a discriminant union avoids illegal combinations and exhaustive handling.
- The cheap upgrade path is to start boolean and refactor when a third state appears; the expensive mistake is `completed` + `deleted` + `scheduledFor`.

```ts
type Todo = { id: TodoId; title: string; status: "open" | "done" };
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question d52972d8-367c-45aa-a040-5fb3f5fade9d

- How do you type a safe `updateTodo` function for a todo app?

### Answer

- Separate create from patch: `type TodoPatch = Partial<Pick<Todo, "title" | "status">>`.
- The function takes the id plus the patch and returns the updated `Todo` (or a `Result`), never mutating the input.
- Reject empty patches at the type level (`{}` is possible with `Partial`, so validate if that matters).

```ts
function updateTodo(id: TodoId, patch: TodoPatch): Todo { /* ... */ }
```

- [More detail on Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)
- [More detail on Pick](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)

---

### Question bdb1c028-d224-46b9-9f9e-dfa6b80df215

- How do you make todo filter state impossible to misuse?

### Answer

- Model filters as a union that carries the data needed by each variant: `{ kind: "all" } | { kind: "tag"; tag: string }`.
- Then filtering is an exhaustive switch, and adding a filter kind breaks every consumer at compile time.
- Avoid `filter: string` plus an unrelated `tag?: string` — that is the illegal-states pattern.

```ts
type Filter = { kind: "all" } | { kind: "active" } | { kind: "tag"; tag: Tag };
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

### Question 15764f64-2bdc-4987-b37c-0dbe4ebf5e3a

- How do you type a store/actions layer for a todo app without over-abstracting?

### Answer

- Start with plain functions over typed state: `addTodo(state, draft): State`.
- Add a `type` discriminant only when you need a reducer/event log; the functions stay the implementation.
- Return new state objects so React/Redux patterns work; use `ReadonlyArray<Todo>` in inputs.

```ts
function addTodo(state: TodoState, draft: Draft): TodoState { return { ...state, todos: [...state.todos, make(draft)] }; }
```

- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on readonly arrays](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type)

---

### Question 65f88370-1042-43d4-84ea-0a102a85783b

- What persistence boundary must be validated in a type-safe todo app?

### Answer

- Anything read from `localStorage`, IndexedDB, a server, or an imported file — types cannot verify stored JSON.
- Parse to `unknown`, validate, and migrate old data versions explicitly before trusting it.
- Version the serialized shape (`{ version: 1, todos: [...] }`) so migrations are explicit.

```ts
const raw: unknown = JSON.parse(localStorage.getItem("todos") ?? "null");
const data = TodoStorageSchema.parse(raw); // runtime truth
```

- [More detail on JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question c0349ff1-d2e8-4e54-b888-7a5abed5beda

- How do you guarantee a todo's id is not mixed up with a user's id?

### Answer

- Brand the id types: `TodoId = Brand<string, "TodoId">`, `UserId = Brand<string, "UserId">`.
- Branded ids are nominally distinct with zero runtime cost, and the compiler rejects cross-assignment.
- Provide a single `createTodoId(raw: string): TodoId` factory so casting is centralized.

```ts
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };
type TodoId = Brand<string, "TodoId">;
```

- [More detail on branded types](https://www.typescriptlang.org/play)
- [More detail on structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)

---

### Question 025c6460-d277-42d3-a9b9-1f9a8cd6c0b3

- How do you type JWT payloads in an Express auth system?

### Answer

- Define the claims shape explicitly and treat decoded tokens as untrusted: `jwt.verify` returns `string | JwtPayload`, not your type.
- Verify the token, then validate the claims (issuer, audience, expiry, custom fields) before casting.
- Keep `req.user` optional in augmentation and narrow in authenticated handlers.

```ts
const decoded = jwt.verify(token, secret);
if (typeof decoded === "string" || typeof decoded.sub !== "string") throw new Error("bad token");
const userId = decoded.sub;
```

- [More detail on jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#readme)
- [More detail on Express augmentation](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express)

---

### Question 2f5a1d5f-bcbe-46af-b0e1-d16ccc136e06

- How do you type the login request/response contract for an auth API?

### Answer

- Define shared request and response types (`LoginBody`, `LoginResult`) and reuse them on the client.
- Never model the failure case as a thrown string; use a discriminated result or proper HTTP statuses with a typed error body.
- Do not include the password hash or the raw user entity in the response type.

```ts
type LoginBody = { email: string; password: string };
type LoginResult = { accessToken: string; user: PublicUser };
```

- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on Pick/Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)

---

### Question 27349131-d5bb-4087-8d6b-7944b170401e

- How do you type auth middleware that guarantees `req.user`?

### Answer

- Two options: make then narrow `req.user` in every handler, or define an `AuthedRequest` type that has it required and use it in protected routes.
- The second is safe if the middleware that guarantees the field is registered before those routes — a structural convention.
- Avoid a global `req.user!` sprinkle; assert once in a wrapper.

```ts
type AuthedRequest = Request & { user: { id: UserId } };
const requireAuth: RequestHandler = (req, res, next) => { /* sets req.user or 401 */ next(); };
```

- [More detail on intersections](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)
- [More detail on middleware](https://expressjs.com/en/guide/using-middleware.html)

---

### Question 3221d5cd-464e-42e7-a869-2e3c7afde98b

- Why should token/session expiry be part of the type, not just an implicit convention?

### Answer

- Expiry affects the shape of the state: a session that may be expired is not the same as an authenticated session.
- Model it as a union (`{ status: "active"; exp: number } | { status: "expired" }`) or keep a guard function that checks it explicitly.
- Types cannot enforce time; they can force the code to acknowledge the possibility.

```ts
type Session = { status: "active"; userId: UserId; exp: number } | { status: "expired" };
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

---

### Question 37778d8f-834d-4e98-a425-faa41f12a87e

- How do you type the `Authorization` header handling without `any`?

### Answer

- Read `req.headers.authorization` as `string | undefined` and parse the scheme explicitly.
- Return null/throws on a malformed header instead of assuming `Bearer ` prefix.
- Keep the parsed type a simple discriminated result or a branded token string.

```ts
const header = req.headers.authorization;
const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
```

- [More detail on req.headers](https://expressjs.com/en/api.html#req.headers)
- [More detail on optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

---

### Question e8777180-cdc0-469a-ac7a-034121e6e690

- How do you type environment configuration for the auth service?

### Answer

- Declare `NodeJS.ProcessEnv` keys, then validate and parse them once at startup into a `Config` object with required types.
- Failing fast on a missing `JWT_SECRET` beats `string | undefined` checks scattered through the code.
- Export the frozen validated config from a single module.

```ts
const Config = { jwtSecret: requireEnv("JWT_SECRET"), port: Number(process.env.PORT ?? 3000) };
```

- [More detail on process.env](https://nodejs.org/api/process.html#processenv)
- [More detail on ProcessEnv augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)

---

### Question a52fba5f-65dc-4260-b48d-c34228ef369a

- How do you type a generic Axios client that preserves per-call response types?

### Answer

- Wrap axios with your own functions that pass the response type parameter: `get<T>(url): Promise<T>`.
- Normalize errors into a typed `ApiError` so callers catch a known shape instead of `unknown`.
- Keep the instance private and export named endpoint functions — a generic client alone still lets callers lie about `T`.

```ts
async function get<T>(url: string): Promise<T> { const { data } = await http.get<T>(url); return data; }
```

- [More detail on axios TypeScript usage](https://github.com/axios/axios#typescript)
- [More detail on AxiosError](https://axios-http.com/docs/handling_errors)

---

### Question 6721ed1e-f688-4c5a-9820-cd10afbb2102

- Why is a generic API client alone not type-safe against a real server?

### Answer

- `get<User>()` is a **claim**, not a check: axios parses JSON and returns it typed `User` without validating.
- If the server renames a field, you get a runtime `undefined` typed as `string`.
- Pair the generic with a schema parse inside the wrapper so both the compile-time and runtime types come from one place.

```ts
async function getUser(id: string): Promise<User> { return UserSchema.parse(await get(`/users/${id}`)); }
```

- [More detail on axios generics](https://github.com/axios/axios#typescript)
- [More detail on runtime validation](https://zod.dev/)

---

### Question a54d9a1a-52aa-474f-a7bb-dc8758d4fbe3

- How do you type API error responses to avoid `any` in catch blocks?

### Answer

- Define an `ApiError` class or a discriminated `Result<T, E>` and convert transport errors at the wrapper boundary.
- `axios.isAxiosError(e)` gives a typed `AxiosError` whose `response?.data` is `unknown` — validate before display.
- Callers then handle one known error type instead of inspecting HTTP internals.

```ts
try { await get<User>("/me"); } catch (e) { if (e instanceof ApiError) show(e.message); }
```

- [More detail on AxiosError](https://axios-http.com/docs/handling_errors)
- [More detail on result types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

---

### Question 04fb7325-7807-4d29-91fd-c7e5e4dd6817

- How do you type paginated responses generically?

### Answer

- Model the envelope once: `type Page<T> = { items: T[]; nextCursor: string | null }`.
- Endpoints then return `Page<User>`, `Page<Post>`, and the pagination logic is written once.
- If the server uses offset pagination, encode both total and offset so callers can render controls.

```ts
type Page<T> = { items: T[]; nextCursor: string | null };
```

- [More detail on generic types](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-types)
- [More detail on type aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)

---

### Question e85abd03-b828-49e1-9038-6c3fbbffa3d4

- How do you type an AbortSignal-aware API wrapper?

### Answer

- Accept an options object with `signal?: AbortSignal` and pass it through; the function's type does not change.
- Distinguish cancellation from failure in the error type so callers do not show an error for aborts.
- Keep cancellation a caller concern; do not silently swallow it.

```ts
async function get<T>(url: string, opts: { signal?: AbortSignal } = {}): Promise<T> { /* ... */ }
```

- [More detail on AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [More detail on axios cancellation](https://axios-http.com/docs/cancellation)

---

### Question a80e18a0-b44c-40aa-a4d2-42334135e4b0

- How do you type a form validator built with DOM APIs and utility types?

### Answer

- Define a `Fields` interface and a `FieldErrors = Partial<Record<keyof Fields, string>>`.
- Validators map a `Fields` value to `FieldErrors`, and rendering iterates `keyof Fields`.
- This keeps field names synchronized between validation, inputs, and error display.

```ts
interface Fields { email: string; age: number }
type FieldErrors = Partial<Record<keyof Fields, string>>;
function validate(v: Fields): FieldErrors { return {}; }
```

- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

---

### Question 2dc0b723-9b53-431a-abff-ebaf7e39c016

- How do you type a validator that narrows input to a valid value?

### Answer

- A validator returning `result is T` narrows for callers; a validator returning errors does not.
- Prefer parsers returning `{ ok: true; value: T } | { ok: false; errors: E }` when you need error details.
- Avoid boolean validators that discard the reason — the UI usually needs it.

```ts
function validateEmail(raw: unknown): { ok: true; value: string } | { ok: false; error: string } { /* ... */ }
```

- [More detail on type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)

---

### Question bbc30c83-58f3-4761-8c6a-46d053bedcca

- How do you derive form types from a schema to avoid duplication?

### Answer

- Define the schema once and infer both input and output types (`z.infer`), using the same schema for client and server.
- Field name unions come from `keyof z.infer<typeof Schema>`, so error maps and inputs stay aligned.
- The schema is the runtime and compile-time source of truth.

```ts
const Signup = z.object({ email: z.string().email(), age: z.number().min(18) });
type Signup = z.infer<typeof Signup>;
type Field = keyof Signup;
```

- [More detail on Zod](https://zod.dev/)
- [More detail on indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

---

### Question 201e1bd9-8bc7-4021-9f10-b58dc263838a

- How do you type reading form values from the DOM in a validator?

### Answer

- Use `FormData` and coerce explicitly: every entry is `string | File`.
- Build the `Fields` object with the same keys as the schema and convert types in one place (`Number(...)` for numeric fields).
- Avoid reading `input.value` element-by-element — you lose the single-source-of-truth mapping.

```ts
const raw = Object.fromEntries(new FormData(form)) as Record<string, string>;
```

- [More detail on FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [More detail on Object.fromEntries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries)

---

### Question 512db4a8-fc1e-4b14-b95d-5996adc78a7c

- How do you type showing validation errors in the DOM without unsafe queries?

### Answer

- Map each field name to its error element with a checked lookup (a `data-error` attribute selector plus a helper) or keep refs in a typed record.
- Iterate `keyof Fields` so every field is handled; a `Partial<Record<K, ...>>` lookup returns `string | undefined`.
- Clear errors in the same pass to avoid stale messages.

```ts
for (const key of Object.keys(errors) as (keyof Fields)[]) { const el = document.querySelector(`[data-error="${key}"]`); if (el) el.textContent = errors[key] ?? ""; }
```

- [More detail on Record](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)
- [More detail on Object.keys](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)

---

### Question bdb54122-1354-48d4-abd2-e8f129d4eb24

- How do you type async validation without blocking every keystroke?

### Answer

- Debounce in the caller and keep the validator async and pure: `(value: unknown) => Promise<FieldErrors>`.
- Cancel/ignore stale results (compare a request id) instead of relying on type safety — there is none here.
- Model loading state as a union so the UI cannot show "valid" while a request is pending.

```ts
type Validity = { state: "checking" } | { state: "valid" } | { state: "invalid"; error: string };
```

- [More detail on Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

### Question a550e632-689c-4745-9f09-fac1eff674e9

- How do you type a CRUD API for a blog post entity end to end?

### Answer

- Define `Post`, `PostDraft` (create), `PostPatch` (update), and response envelopes once in a shared module.
- Repository functions take/return those types; the HTTP layer maps to them and validates input.
- Deriving `PostPatch = Partial<Omit<Post, "id" | "createdAt">>` keeps patches aligned with the entity.

```ts
type PostPatch = Partial<Omit<Post, "id" | "createdAt">>;
```

- [More detail on Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- [More detail on Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)

---

### Question 0345d9c8-5cc2-4c97-9471-37b5f3c45454

- How do you type database rows that differ from the domain model?

### Answer

- Keep a `PostRow` type mirroring the table (snake_case, nullable columns) and a `Post` domain type; map explicitly.
- Do not let `null` columns into the domain model — map them to `undefined`, defaults, or domain unions.
- This isolates schema changes to the mapping layer.

```ts
type PostRow = { id: string; created_at: string; title: string | null };
function toPost(row: PostRow): Post { return { id: row.id, createdAt: row.created_at, title: row.title ?? "" }; }
```

- [More detail on object types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [More detail on null and undefined](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#null-and-undefined)

---

### Question 2b073897-6928-4a0f-a0b0-fe08be3b69ee

- How do you type authorization rules for CRUD operations?

### Answer

- Model the actor and the action as a discriminated union or a resource+action pair, and write one `can()` function.
- Returning a boolean loses the reason; a `Result` type lets handlers respond 403 vs 404 deliberately.
- Keep `Resource` types generic over the entity to reuse the checks.

```ts
type Action = { kind: "read" } | { kind: "update"; fields: string[] };
function can(actor: Actor, post: Post, action: Action): boolean { return true; }
```

- [More detail on discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question c7dfee84-4f3e-468c-9fdf-aba41255a081

- How do you type a slug or unique key generator so collisions are handled explicitly?

### Answer

- Return a `Result`/union with a `collision` case instead of throwing or retrying silently.
- Keep the slug generator pure and let the repository/DB layer own uniqueness.
- Model the DB unique constraint failure as a typed error, not a string match on the message.

```ts
type SlugResult = { ok: true; slug: string } | { ok: false; reason: "collision" };
```

- [More detail on union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [More detail on error handling](https://nodejs.org/api/errors.html)

---

### Question 245ad08b-6fad-4a40-9c12-8a2c24a8d9ee

- How do you keep pagination cursors type-safe across blog queries?

### Answer

- Use an opaque cursor type (branded string) so cursors from one endpoint cannot be passed to another.
- The repository parses/validates the cursor before use and returns an error union for malformed input.
- Encode the cursor format inside the module that owns it.

```ts
type Cursor = Brand<string, "Cursor">;
type Page<T> = { items: T[]; next: Cursor | null };
```

- [More detail on branded types](https://www.typescriptlang.org/play)
- [More detail on generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

### Question 3f18afb4-46ae-4c77-b852-5da1f0084f63

- How should tests be typed in these projects?

### Answer

- Test the **behavior**, not the types, except for a small set of type-level assertions on shared utilities.
- Use typed factories (`makeUser(overrides?: Partial<User>): User`) so fixtures stay valid as models change.
- Avoid `as any` in tests for fixtures; it hides model changes that would break production code.

```ts
const user = makeUser({ name: "x" });
```

- [More detail on Partial](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)
- [More detail on tsd](https://github.com/SamVerschueren/tsd)

---

### Question 3649b31e-aed0-4437-98c0-7dd9d728da93

- How do you structure a TypeScript project so types do not become a coupling layer?

### Answer

- Put shared contracts in a dedicated module (or package) with no runtime dependencies.
- Use `import type` so type-only imports never create runtime coupling or cycles.
- Keep framework-specific types (Express, React) at the edges; the domain layer should import none of them.

```ts
import type { Post } from "./contracts/post";
```

- [More detail on type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

---

### Question f6fa2210-7665-4bbb-bf7e-c492b8a6efae

- What does a "fully type-safe" app still require beyond types?

### Answer

- Runtime validation at every boundary, error handling for every failure mode, and tests for behavior.
- Types cannot prove network responses, DB constraints, user input, or time — those need checks.
- The goal is that the compiler eliminates the mechanical bugs so review focuses on logic and design.

- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)
- [More detail on unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
