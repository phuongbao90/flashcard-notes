# React Query

### Question d5207f32-7f50-470f-85b0-2412383cee9d

- What happen when you call invalidate a query in React Query?

### Answer

- Marks all matching queries in the cache as **stale**, overriding any `staleTime`.
- Automatically refetches matching queries that are currently **active** (used by a mounted component).
- **Inactive queries** are only marked stale; they refetch the next time a component mounts and subscribes.

- [More detail on Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [More detail on queryClient.invalidateQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientinvalidatequeries)

---

### Question 8ce2d808-5219-4ebe-b4eb-74fd4056956c

- When invalidate a query, if i dont want to refetch active queries, what should i do?
- or if i want to refetch all including inactive queries, what should i do?

### Answer

- No active refetch: pass `{ refetchType: 'none' }` to `invalidateQueries` — queries are only marked **stale**.
- Refetch everything including **inactive queries**: pass `{ refetchType: 'all' }`.

```ts
await queryClient.invalidateQueries({
  queryKey: ["todos"],
  refetchType: "none", // 'none' | 'active' (default) | 'all' | 'inactive'
});
```

- [More detail on refetchType](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation#from-mutation-responses)
- [More detail on queryClient.invalidateQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientinvalidatequeries)

---

### Question 7e706777-01db-4e14-aa5a-896ffca4da95

- compare invalidateQueries and refetchQueries in React Query

### Answer

- `invalidateQueries`:
  - Marks queries **stale**, then refetches only **active** queries by default (`refetchType: 'active'`).
  - Its Promise **never rejects** on refetch failure; errors are stored inside each query's state.
- `refetchQueries`:
  - Forces a refetch regardless of whether data is **fresh** or **stale**.
  - Refetches **active and inactive** queries by default (`type: 'all'`).
  - Its Promise **rejects** if any refetch fails, unless `throwOnError: false`.

- [More detail on queryClient.invalidateQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientinvalidatequeries)
- [More detail on queryClient.refetchQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientrefetchqueries)

---

### Question f6f287e2-6140-46ff-9463-f85310cff76c

- compare invalidateQueries and removeQueries in React Query

### Answer

- `invalidateQueries`:
  - **Preserves** cached data, marks it stale, and background-refetches **active** queries.
  - Subscribed components keep showing current data while fetching.
- `removeQueries`:
  - **Deletes** matching queries and their data from the `QueryCache`.
  - Triggers **no network requests**.
  - Active subscribers are reset to the hard loading (**pending**) state.

- [More detail on queryClient.invalidateQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientinvalidatequeries)
- [More detail on queryClient.removeQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientremovequeries)

---

### Question 63f63c5b-c895-4437-8ff1-fb0216257081

- will disable queries be refetched when invalidateQueries is called?

### Answer

- No. Queries with `enabled: false` are **not** refetched by `invalidateQueries`.
- They are still marked **stale** in the `QueryCache`, but React Query respects `enabled: false` and skips the automated refetch.

- [More detail on Disabling Queries](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries)

---

### Question b1613fc6-4e25-484f-bda8-8e8ea46d4b6e

- Does invalidateQueries throw an error if failed to invalidate a query?

### Answer

- No. `invalidateQueries` does **not** throw or reject its Promise when an underlying refetch fails.
- Refetch errors are captured in each query's state (`status: 'error'`, `error`), leaving error handling to components or error boundaries.

- [More detail on queryClient.invalidateQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientinvalidatequeries)

---

### Question ce9883de-7972-4179-8302-c5be19d7fdba

- A query is defined with enabled: false. Which of the following APIs will trigger a network request for that query?
  - invalidateQueries
  - refetchQueries
  - removeQueries
  - resetQueries
  - ensureQueryData

### Answer

- **Will fetch**: `refetchQueries` (forces refetch, bypassing `enabled`) and `ensureQueryData` (fetches via `fetchQuery` if data is missing/stale, bypassing `enabled`).
- **Will not fetch**: `invalidateQueries`, `resetQueries` (both respect `enabled: false` for their automatic refetch), and `removeQueries` (only deletes cache, never fetches).

- [More detail on Disabling Queries](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries)
- [More detail on queryClient.refetchQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientrefetchqueries)

---

### Question 7f2021e9-ee87-408d-839c-250e94cd6ad4

- Discuss refetchQueries:
  - Does it throw an error if failed to refetch a query?
  - what does it return?
  - in what situations would this method fail to refetch a query?

### Answer

- **Throws on error**: Yes by default — the returned Promise rejects if any refetch fails (unless `throwOnError: false`).
- **Returns**: a `Promise<Array<QueryObserverResult>>` with the results of all refetched queries.
- **Fails to refetch when**:
  - The `queryFn` throws or rejects (network failure, HTTP 4xx/5xx).
  - The request is aborted via `AbortSignal`.
  - The filter matches no queries in the cache — nothing is refetched, so the Promise resolves with an empty array.

- [More detail on queryClient.refetchQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientrefetchqueries)

---

### Question fe609f76-7016-430c-b7e8-addea411017d

- Why prefetchQuery should be used instead of fetchQuery in React Query?

### Answer

- `prefetchQuery` **swallows errors silently** — no unhandled Promise rejections in loaders or event handlers.
- `prefetchQuery` is a **no-op** if fresh cached data already exists (respects `staleTime`).
- `fetchQuery` **throws** on failure and returns the fetched data.
- Rule of thumb: `prefetchQuery` for speculative cache warming; `fetchQuery` when you imperatively need the data.

- [More detail on Prefetching](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
- [More detail on queryClient.fetchQuery](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientfetchquery)

---

### Question b29768f5-d27d-4fe3-879c-0a038c78d946

- when queries are stale, what happens when these methods are called in terms of active vs inactive queries:
  - invalidateQueries
  - refetchQueries
  - removeQueries
  - resetQueries
  - ensureQueryData
  - fetchQuery

### Answer

- `invalidateQueries`: marks **active and inactive** stale; refetches **only active** by default.
- `refetchQueries`: refetches **active and inactive** by default (`type: 'all'`).
- `removeQueries`: deletes **active and inactive** from cache, no refetch.
- `resetQueries`: resets **active and inactive**; refetches **only active**.
- `ensureQueryData` / `fetchQuery`: fetch if missing/stale for the query key — **ignores active/inactive** subscriber status entirely.

- [More detail on QueryClient API](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient)
- [More detail on Query Filters](https://tanstack.com/query/latest/docs/framework/react/guides/filters)

---

### Question 34f53770-0ef3-41fe-9607-81966414e1b2

- fetchQuery vs useQuery in React Query

### Answer

- `fetchQuery`:
  - **Imperative** method on `QueryClient` for non-React contexts (loaders, event handlers, server preloading).
  - Returns a Promise resolving to data; does **not** subscribe components or trigger re-renders.
- `useQuery`:
  - **Declarative** hook for components.
  - Subscribes the component to cache state, auto-refetches on mount/focus/reconnect, returns reactive state (`data`, `isPending`, `error`).

- [More detail on queryClient.fetchQuery](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientfetchquery)
- [More detail on useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)

---

### Question a4e181a1-3abb-411b-82c0-3a6d1dd795f7

- what happen when you call ensureQueryData in React Query?

### Answer

- Returns cached data if it exists for the query key and is **fresh** (within `staleTime`) — no network request.
- If data is missing or **stale**: runs `fetchQuery` under the hood, populates the `QueryCache`, and returns the fetched data.
- Ideal for loaders/startup where you need data to exist before rendering — unlike `useQuery`, it works outside React.

- [More detail on queryClient.ensureQueryData](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientensurequerydata)

---

### Question abba1d6f-2054-48c2-ab8a-126e175dcbcf

- setQueryData vs fetchQuery in React Query

### Answer

- `setQueryData`:
  - **Synchronously** writes data directly into the `QueryCache` — no `queryFn`, no network.
  - Does **not** mark data stale by default.
- `fetchQuery`:
  - **Asynchronously** runs the `queryFn` over the network and updates the cache with the response.
  - Respects `staleTime` (returns fresh cached data instead of refetching) and throws on error.

- [More detail on queryClient.setQueryData](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientsetquerydata)
- [More detail on queryClient.fetchQuery](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientfetchquery)

---

### Question 565673b1-d5eb-48f4-a4cc-bde46ce2e14f

- Discuss setQueryData
  - use cases
  - what happen when there is no query data for the given query key?
  - what happen when queries are not ultilized by query hooks?
  - Does it mark data as stale by default?

### Answer

- **Synchronous** cache write — subscribed hooks re-render immediately.
- Use cases:
  - **Optimistic updates** (show change before server confirms).
  - Updating cache **after a mutation** (avoid a refetch).
  - **Hydration / prefilling** cache manually.
- No query exists for the key: a **new query is created** with the given data — still no network request.
- No component subscribes to it: the query is **inactive immediately** and is garbage-collected after `gcTime`.
- Does **not** mark data stale by default.
- Must update **immutably** (return a new reference); mutating in place won't trigger re-renders in subscribed components.

```ts
queryClient.setQueryData(["todos"], (old) => [...old, newTodo]);
```

- [More detail on queryClient.setQueryData](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientsetquerydata)

---

### Question f303c6de-e0c4-43db-a05a-5c4bda9d64c8

- explain cancelRefetch in refetchQueries

### Answer

- Controls whether an **in-flight request** for a matching query is cancelled before the new refetch starts. Defaults to `true`.
- `cancelRefetch: true` (default): aborts the ongoing request and starts a fresh one.
- `cancelRefetch: false`: skips queries that are already fetching — the existing request finishes, no duplicate request is started.

- [More detail on queryClient.refetchQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientrefetchqueries)

---

### Question 12bdacb4-4c18-478b-a15e-0a3e4b800a60

- resetQueries
  - what does it do?
  - use cases

### Answer

- Puts matching queries back to their **initial state** as if just created:
  - Clears data and error.
  - Resets status to **pending**.
  - Restores `initialData` if it was provided.
- Then refetches **active** queries; inactive ones are only reset, not refetched.
- Use cases: **logout/login** (drop user-scoped data), **retry from a clean state**, resetting to `initialData` without unmounting components.

- [More detail on queryClient.resetQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientresetqueries)

---

### Question 0230622f-e248-4b10-9498-951b5c13e8b2

- resetQueries vs invalidateQueries

### Answer

- `resetQueries`:
  - **Clears** data and error state back to initial state (`initialData` or `undefined`), sets status to pending, then refetches active queries.
  - Subscribed components see the loading state — current data is wiped.
- `invalidateQueries`:
  - **Preserves** cached data, marks it stale, and background-refetches active queries.
  - UI keeps showing current data while the refetch runs.

- [More detail on queryClient.resetQueries](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientresetqueries)
- [More detail on Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

---

### Question de15c949-7295-4211-b49f-94ee279d64d1

- discuss select in useQuery / useInfiniteQuery
  - what does it do?
  - Does it affect what gets stored in the query cache?
  - When does it run?
  - benefits
  - best practices
  - if data.name unchanged, but data changed, will the component re-render?

### Answer

- A **data transformation layer** applied to cached data before your component receives it.
- Does **not** affect what is stored in the cache — raw data stays there; every subscriber can select differently.
- Runs only when **data changes** or the **reference to `select` itself changes** — wrap it in `useCallback` (or define it outside) so it doesn't run on every render.
- Benefits:
  - **Avoids re-renders**: component re-renders only if the selected value changes (**referential equality** — return primitives or memoized objects).
  - Centralizes transformation logic; derived data without extra state.
- Best practice: avoid heavy computation in `select`.
- If `data.name` is unchanged but the rest of `data` changed: **no re-render** — the selected value is referentially equal to the previous one.

- [More detail on useQuery select](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#select)
- [More detail on Query Observers](https://tkdodo.eu/blog/breaking-react-querys-api-on-purpose)

---

### Question d5641d6a-4e1e-4d32-87da-93443385abf8

- initialData vs placeholderData in useQuery / useInfiniteQuery

### Answer

- `initialData`:
  - Stored in the `QueryCache` as **real, authoritative data** (dataUpdatedAt set to now).
  - Participates in `staleTime` — treated as freshly fetched unless `initialDataUpdatedAt` is provided.
- `placeholderData`:
  - **Temporary UI fallback**; never written to the cache.
  - Sets `isPlaceholderData: true` while shown; replaced as soon as real data arrives.
- Rule of thumb: `initialData` = "this data is correct"; `placeholderData` = "this data is a good guess".

- [More detail on Initial Query Data](https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data)
- [More detail on Placeholder Query Data](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data)

---

### Question 52b42f0b-cca4-40ef-8c8c-8c566641ba77

- select vs useMemo

### Answer

- The critical difference: `select` can **prevent re-renders**; `useMemo` can only prevent **recomputation**.
- With `useMemo`:
  - Query data updates → component **re-renders first** → then `useMemo` compares deps and may return the same value.
  - The render already happened — memoization came too late.

```ts
const { data } = useQuery(...);
const name = useMemo(() => data.name, [data]); // still re-renders on data change
```

- With `select`:
  - React Query compares the **previous selected value vs the new one** before involving React.
  - If referentially equal → the component **does not re-render at all** — the bail-out happens inside React Query.

```ts
useQuery({
  queryKey: ["user"],
  queryFn: fetchUser,
  select: (data) => data.name, // no re-render if name unchanged
});
```

- [More detail on useQuery select](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#select)

---

### Question f8899929-399d-4624-ba07-5bda3996c25b

- discuss combine in useQueries

### Answer

- Introduced in v5 to **combine and transform** results of multiple queries into a single output — no repetitive mapping in render.
- **Re-render optimization**: the component re-renders only if the value returned by `combine` changes **referentially** — memoize objects/arrays it returns.
- `combine` receives each query result as an argument, so you can aggregate (e.g. total, filter, zip) all into one view-model.

```ts
useQueries({
  queries,
  combine: (results) => ({
    data: results.map((r) => r.data),
    pending: results.some((r) => r.isPending),
  }),
});
```

- [More detail on useQueries combine](https://tanstack.com/query/latest/docs/framework/react/reference/useQueries#combine)

---

### Question d936b043-4a89-4a04-88de-0ea8356d91cc

- what is the purpose and use case of mutationKey in useMutation?

### Answer

- A unique identifier that groups and manages related mutations outside the component.
- Use cases:
  - **Set defaults per mutation type** via `queryClient.setMutationDefaults` — `mutationFn`, `retry`, `onSuccess`, `onError`, `onSettled`, etc.
  - **Track mutation state globally** with `useIsMutating({ mutationKey })`.
  - **Filter/inspect mutations** with `useMutationState({ mutationKey })` (also enables resumed persisted mutations).

- [More detail on useMutation](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
- [More detail on setMutationDefaults](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClient#queryclientsetmutationdefaults)

---

### Question af22bea4-4759-4fcc-b553-d8761aa3a4ba

- what suspense hooks differ from non-suspense hooks in React Query?

### Answer

- Options suspense hooks do **not** support: `throwOnError` (fixed to "throw only when no cached data"), `enabled` (can't conditionally enable/disable), `placeholderData`.
- Return differences: `data` is guaranteed defined; `status` is only `'success'` or `'error'`; `error` is defined when `status` is `'error'`; `isPending` / `isPlaceholderData` don't exist — `isFetching` is still available for background updates.
- Loading and error states are delegated to **Suspense boundaries** and **error boundaries** instead of render-time flags.

- [More detail on Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)
- [More detail on useSuspenseQuery](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useSuspenseQuery)

---

### Question a3b3e3d5-a50c-4006-aae9-3fcfd1f869da

- select vs transform in queryFn

### Answer

- Transform **inside `queryFn`**:
  - Runs **before** data is stored in the `QueryCache` — the transformed output _becomes_ the cached data.
  - Applied **globally** to every observer of that query key; raw response is never kept.
- `select`:
  - Runs **after** data is read from the cache — cache keeps the raw data.
  - Applied **per component subscription** — different components can derive different views of the same cached data.
- Rule of thumb: transform in `queryFn` when all consumers want the same shape; `select` when consumers want different slices.

- [More detail on Query Functions](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions)
- [More detail on useQuery select](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery#select)

---

### Question bd9c8d91-7e49-437f-ac78-5fc05555edfe

- important notes on queryFn in React Query

### Answer

- Must **return a Promise** — resolve with data or throw an error.
- Resolving with **`undefined` is treated as a failure**; use `null` to represent "no data".
- Errors must be signalled by rejecting/throwing — with native `fetch` you must check `response.ok` and throw yourself, since `fetch` never rejects on HTTP error statuses.
- Pass query variables via **`queryKey`** — the queryFn receives `{ queryKey, signal }`:

```ts
function fetchTodoList({ queryKey, signal }) {
  const [_key, { status, page }] = queryKey;
  return fetch(`/todos/${status}?page=${page}`, { signal });
}

useQuery({
  queryKey: ["todos", { status, page }],
  queryFn: fetchTodoList,
});
```

- [More detail on Query Functions](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions)

---

### Question e0da4b94-43f5-4b07-9957-99e6e65b0f01

- discuss Network Mode in react query

### Answer

- `networkMode` controls whether queries and mutations fire when the app appears **offline**. Options: `'online'` (default), `'always'`, `'offlineFirst'`.
- `'online'` (default): fetches only when online; offline, queries are skipped and mutations are **paused** (`mutation.isPaused: true`, `fetchStatus: 'paused'`), resumed later with `queryClient.resumePausedMutations()`.
- `'always'`: fetches **regardless** of connectivity — for APIs reachable offline (cached responses, native apps).
- `'offlineFirst'`: first attempt always runs; only if it fails and the app is offline does it **pause** and retry when back online.
- Main use case: **persisted offline mutations** — set `networkMode: 'offlineFirst'` (or `'always'`) so mutations pause instead of fail while offline.

- [More detail on Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)

---

### Question 3480e17d-6987-4958-8606-92cbd701a3ab

- show loading indicator in react query

### Answer

- **Initial loading only**: `status === 'pending'` (or `isPending`) — no data yet at all.
- **Any fetch** (initial + background): `isFetching`.
- **Background refetch only**: `isFetching && status !== 'pending'` — data is already on screen.

```ts
const { data, isPending, isFetching } = useQuery(...);
```

- [More detail on useQuery status flags](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)

---

### Question d4d83f44-5ff6-447a-b1a5-c4ddec87e34f

- initial data query
  - ways to pre-populate query cache with data
  - initialDataUpdatedAt
  - initial data function

### Answer

- Ways to pre-populate the cache: `initialData`, `prefetchQuery`, `fetchQuery`, `setQueryData`.
- `initialData`:
  - **Persists in cache** as real data — if the fetch fails, you still show it (use `placeholderData` instead if you don't want that).
  - Treated as **totally fresh** by default (dataUpdatedAt = now).
  - `initialDataUpdatedAt` tells React Query when that data was really fetched — it then uses that timestamp for `staleTime` math, so old data is refetched sooner.
- Initial data function: `initialData: () => getExpensiveTodos()` — executed **only once** when the query is initialized, saving memory/CPU on re-renders.

- [More detail on Initial Query Data](https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data)

---

### Question 711dad80-32b4-49f9-a07c-f9a1fbde794e

- placeholderData
  - with cached
  - with function

### Answer

- **Not persisted** to cache; `status` starts as `'success'` with `isPlaceholderData: true`, replaced when real data arrives.
- **From cache**: pass `placeholderData: () => queryClient.getQueryData(['blogPosts'])?.find(...)` — reuse a coarser list query's data as a detail query's placeholder.
- **From previous query** (successor of `keepPreviousData`): `placeholderData: (previousData) => previousData` — when the `queryKey` changes (e.g. `['todos', 1]` → `['todos', 2]`), keep showing the old data instead of a spinner during the transition.

```ts
useQuery({
  queryKey: ["todos", id],
  queryFn: () => fetch(`/todos/${id}`),
  placeholderData: (previousData) => previousData,
});
```

- [More detail on Placeholder Query Data](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data)

---

### Question 27b3ba7c-b8fb-482e-9d42-e6a64178ff8d

- mutation
  - lifecycle
  - order of execution of onMutate, mutationFn, onError, onSuccess, onSettled

### Answer

- Lifecycle: `onMutate` → `mutationFn` → `onError` **or** `onSuccess` → `onSettled`.
- **Global** callbacks (from `setMutationDefaults`) run **before local** ones (passed to `useMutation`); the ones passed to `mutate(variables, callbacks)` run last.
- Local callbacks are **additive**, not overrides — global ones always fire too.
- Full order for one mutation:

```txt
onMutate (global) → onMutate (local)
mutationFn
onSuccess (global) → onSuccess (local)   // or onError, same order
onSettled (global) → onSettled (local)
```

- [More detail on Mutation Lifecycle](https://tanstack.com/query/latest/docs/framework/react/guides/mutation-lifecycle)

---

### Question 4f70e6aa-7d4d-41c9-9d9d-47ee86716661

- mutation
  - Consecutive mutations

### Answer

- Calling `mutate` multiple times on the same hook does **not** create independent observers.
- Each `mutate(vars, callbacks)` call **re-subscribes the single mutation observer**, so earlier local callbacks are **dropped** — only the callbacks of the **last** call fire, regardless of which mutation resolves first.

```ts
todos.forEach((todo) => {
  mutate(todo, {
    onSuccess: () => console.log("local"), // fires only for the LAST mutation
  });
});
```

- Use `mutateAsync` if you need per-call callbacks, or `useMutationState` for per-mutation tracking.

- [More detail on useMutation](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)

---

### Question c79e85e3-c1c1-47d7-b630-442dbd624819

- mutation persisted and offline
  - what are the requirements?

### Answer

- Mutation must be pausable: `networkMode: 'offlineFirst'` (or `'always'`) — otherwise it just fails while offline.
- Define the mutation **outside components** with `queryClient.setMutationDefaults` keyed by `mutationKey`, so the mutationFn and callbacks (`onMutate`, `onError`, `onSuccess`, `onSettled`) can be re-run after a page reload:

```ts
queryClient.setMutationDefaults(["addTodo"], {
  mutationFn: addTodo,
  onMutate: async (variables, context) => {
    await context.client.cancelQueries({ queryKey: ["todos"] });
    const optimisticTodo = { id: uuid(), title: variables.title };
    context.client.setQueryData(["todos"], (old) => [...old, optimisticTodo]);
    return { optimisticTodo };
  },
  onSuccess: (result, _vars, onMutateResult, context) => {
    context.client.setQueryData(["todos"], (old) =>
      old.map((todo) => (todo.id === onMutateResult.optimisticTodo.id ? result : todo)),
    );
  },
  onError: (_err, _vars, onMutateResult, context) => {
    context.client.setQueryData(["todos"], (old) =>
      old.filter((todo) => todo.id !== onMutateResult.optimisticTodo.id),
    );
  },
  retry: 3,
});
```

- Persist and resume — either:
  - `dehydrate(queryClient)` → `hydrate(queryClient, state)` → `queryClient.resumePausedMutations()`, or
  - `PersistQueryClientProvider` with `onSuccess: () => queryClient.resumePausedMutations()`.

- [More detail on Offline Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations#offline-mutations)
- [More detail on persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)

---

### Question 0f076690-c7b0-44a4-b117-b86b8a6b5a0f

- scope in useMutation
  - what is the scope of useMutation?
  - what is the purpose?
  - important nuances

### Answer

- Without `scope`, all mutations run **in parallel**.
- With `scope: { id: 'todo' }`, mutations with the **same id run serially** — later ones wait in `isPaused: true` (queued) until earlier ones settle.
- Purpose:
  - Prevent **race conditions** between rapid consecutive mutations.
  - Fix **optimistic updates** — without serialization, overlapping updates and rollbacks corrupt the cache.
  - Guarantee **ordered side effects**.
- Nuances:
  - **Different scope ids run in parallel** — only same-scope mutations are serialized.
  - Scope is **global, not per component**: `addTodo.mutate(A)` from Component A and `updateTodo.mutate(B)` from Component B with the same `scope: { id: "todo" }` still run A → B.

- [More detail on useMutation scope](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation#scope)

---

### Question 3bade988-91c1-4516-a3d0-7be18980d0e4

- explain predicate in invalidateQueries, refetchQueries, removeQueries, resetQueries

### Answer

- A `predicate` is a **filter function** passed to all cache methods: receives each `Query`, return `true` to include it in the operation, `false` to ignore it.
- Finer control than `queryKey` — you can filter by **any query property** (staleness, data shape, observers count, error state…).

```ts
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[0] === "todos" && query.isStale,
});
```

- [More detail on Query Filters](https://tanstack.com/query/latest/docs/framework/react/guides/filters)

---

### Question a0c81eab-7db2-4c1a-87a4-41c9b326d797

- optimistic update in React Query
  - how to implement

### Answer

- Implement in **`onMutate`**: cancel outgoing refetches, snapshot current cache, write the optimistic value, and return the snapshot for rollback.
- Roll back in **`onError`** using the value returned from `onMutate`; settle in **`onSettled`** by invalidating to re-sync with the server.

```ts
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo, context) => {
    // 1. Cancel refetches so they don't overwrite the optimistic update
    await context.client.cancelQueries({ queryKey: ["todos"] });
    // 2. Snapshot
    const previousTodos = context.client.getQueryData(["todos"]);
    // 3. Optimistically write
    context.client.setQueryData(["todos"], (old) => [...old, newTodo]);
    return { previousTodos };
  },
  onError: (_err, _vars, onMutateResult, context) => {
    // 4. Roll back
    context.client.setQueryData(["todos"], onMutateResult.previousTodos);
  },
  onSettled: (_data, _error, _vars, _onMutateResult, context) => {
    // 5. Re-sync
    context.client.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

- Alternative: use the mutation's returned `variables` to update UI directly instead of the cache.

- [More detail on Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

---

### Question 5cd6ad0f-c515-4b59-a10c-1d303fd5a2e0

- What is a Request Waterfall?
- in React Query

### Answer

- A request waterfall: a request for a resource (code, CSS, images, data) **does not start until a previous request finishes**:

```txt
1 |-> Markup
2 ..|-> CSS
2 ..|-> JS
2 .........|-> Data   // data request blocked behind JS
```

- In React Query, common sources:
  - **Single-component (serial) queries** — `useSuspenseQuery` hooks run serially: the first hook suspends, so later hooks never start until it resolves. Fix: parallel `useQuery`, `useSuspenseQueries`, or **prefetch**.
  - **Nested component waterfalls** — parent renders the child only after its own query resolves, delaying the child's query. Happens with `useQuery` and `useSuspenseQuery` alike. Fix: prefetch, or run both queries in the parent.
  - **Code splitting** — the component (and its query) loads only after its JS chunk arrives. Fix: prefetch data while the chunk downloads.

- [More detail on Request Waterfalls](https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls)
- [More detail on Suspense serialization](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)

---

### Question 4a154a77-d2b0-4ac9-93eb-fb32876768d9

- Server rendering and hydration in React Query
  - typical flow vs desired flow
  - quick note on Suspense

### Answer

- Typical flow (content arrives last):

```txt
1 |-> Markup (without content)
2 ..|-> JS
3 ......|-> Query
```

- Desired flow (content in first byte): prefetch data **before** rendering markup, so markup ships **with content + initial data**; when JS arrives, the page is interactive.
- Note on Suspense: switching `useQuery` → `useSuspenseQuery` is safe **as long as you always prefetch**.
  - Without prefetching, the query can fetch on the server but be **missing from the dehydrated state**, so the client refetches — causing **hydration mismatches and double fetches**.

- [More detail on Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

---

### Question 67a593c8-d6aa-4cb3-a054-3eea89956e06

- Server rendering and hydration in React Query
  - what are the implementation methods?

### Answer

- Setup: create the `QueryClient` **inside** the component wrapping the app (new client per request) — one module-level client is shared across users/requests, which is **not safe for SSR**.
- **Method 1 — `initialData`**:
  - Fetch on the server, pass data as props, feed into `useQuery({ initialData })`.
  - Downside: **props drilling** — must thread data to every component, on every page.
- **Method 2 — Hydration API**:
  - Server prefetches into a `QueryClient`, returns `dehydrate(queryClient)` as props; client `hydrate`s once — no props drilling.

```ts
export async function getServerSideProps() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: ["posts"], queryFn: getPosts });
  return { props: { dehydratedState: dehydrate(queryClient) } };
}
```

- **Method 3 — Next.js App Router**: same prefetch + dehydrate, but wrapped in `<HydrationBoundary state={dehydrate(queryClient)}>` — serialization is just passing props.

- [More detail on Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [More detail on Hydration API](https://tanstack.com/query/latest/docs/framework/react/reference/hydration)

---

### Question 5f5ed5ad-1933-444f-8517-a8548eac8075

- what are the important defaults of react query?
  - staleTime
    - static vs Infinite
  - gcTime
  - retries

### Answer

- `staleTime` (default `0`): how long data stays **fresh**; after that, refetch triggers on mount/window focus/reconnect.
  - `Infinity`: never refetch automatically, but **manual invalidation still works**.
  - `'static'`: never refetch at all — **even manual invalidation is blocked**; use for boot-time data that cannot change (feature flags, permissions loaded at login).
- `gcTime` (default `5 * 60 * 1000`): how long an **inactive** query stays in cache before garbage collection.
- `retries` (default `3`): retry count on failure; can be a function `(failureCount, error)` to customize per attempt/error.

- [More detail on Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [More detail on Caching](https://tanstack.com/query/latest/docs/framework/react/guides/caching)

---

### Question dd982c68-a792-455d-9351-5371fa885de4

- render optimizations in React Query

### Answer

- **Tracked properties**: `useQuery` re-renders only if a property you actually **access** changes (tracked via Proxy). Destructuring the whole result (`{ ...query }`) disables this optimization.
- **Structural sharing**: after refetch, unchanged parts of data keep their **references** — memoized children and comparisons don't re-render/recompute.
- **`select`**: transform data per component; re-render only if the selected value changes referentially.
- **Memoize** `select` and `combine` with `useCallback` — changing their reference re-runs the transformation every render.

- [More detail on Render Optimizations](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations)

---

### Question 5841c53b-351b-4b2c-9fa8-137e6efa0eb1

- suspense in React Query
  - what missing?
  - what is throwOnError?

### Answer

- Missing: `status`/`error` states (replaced by Suspense fallback + error boundaries), conditional `enabled`, and `placeholderData` — wrap QueryKey changes in **`startTransition`** to avoid replacing the UI with the fallback during updates.
- `throwOnError` (fixed, can't change it): errors are thrown **only when there is no cached data to show** —

```ts
throwOnError: (error, query) => typeof query.state.data === "undefined";
```

- To let **all** errors reach the error boundary, throw manually:

```ts
const { data, error, isFetching } = useSuspenseQuery({ queryKey, queryFn });
if (error && !isFetching) throw error;
```

- Default model is **fetch-on-render**: queries fetch when components mount and suspend; prefetch to move to render-as-you-fetch.

- [More detail on Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)

---
