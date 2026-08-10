# React Query

### Question d5207f32-7f50-470f-85b0-2412383cee9d

- What happen when you call invalidate a query in React Query?

### Answer

- Marks matching queries in the cache as _**stale**_, overriding any `staleTime`.
- Automatically refetches any matching queries that are currently _**active**_ (rendered by mounted components).
- Does not immediately refetch _**inactive queries**_; they remain marked as _**stale**_ and will refetch when mounted next.

---

### Question 8ce2d808-5219-4ebe-b4eb-74fd4056956c

- When invalidate a query, if i dont want to refetch active queries, what should i do?
- or if i want to refetch all including inactive queries, what should i do?

### Answer

- To avoid refetching _**active queries**_: Pass `{ refetchType: 'none' }` to `invalidateQueries`. This marks queries as _**stale**_ without triggering immediate refetches.
- To refetch all queries including _**inactive queries**_: Pass `{ refetchType: 'all' }` to `invalidateQueries`.

---

### Question 7e706777-01db-4e14-aa5a-896ffca4da95

- compare invalidateQueries and refetchQueries in React Query

### Answer

- _**invalidateQueries**_:
  - Marks queries as _**stale**_ in the cache.
  - Refetches only _**active queries**_ by default (`refetchType: 'active'`).
  - Does NOT throw errors if refetching fails; errors are stored inside query state.
- _**refetchQueries**_:
  - Refetches matching queries regardless of whether they are _**stale**_ or _**fresh**_.
  - Refetches all matching queries (both _**active**_ and _**inactive**_) by default (`type: 'all'`).
  - Returns a Promise that rejects if any query refetch fails (unless `throwOnError: false`).

---

### Question f6f287e2-6140-46ff-9463-f85310cff76c

- compare invalidateQueries and removeQueries in React Query

### Answer

- _**invalidateQueries**_:
  - Preserves existing cached data while marking it _**stale**_.
  - Triggers background refetches for _**active queries**_, keeping UI responsive while fetching.
- _**removeQueries**_:
  - Immediately purges matching queries and their data from the _**QueryCache**_.
  - Does NOT trigger any network requests.
  - Active subscribers reset back to hard loading/pending states.

---

### Question 63f63c5b-c895-4437-8ff1-fb0216257081

- will disable queries be refetched when invalidateQueries is called?

### Answer

- No, disabled queries (`enabled: false`) are NOT refetched when `invalidateQueries` is called.
- They are marked as _**stale**_ in the _**QueryCache**_, but React Query respects `enabled: false` and skips automated background refetches.

---

### Question b1613fc6-4e25-484f-bda8-8e8ea46d4b6e

- Does invalidateQueries throw an error if failed to invalidate a query?

### Answer

- No, `invalidateQueries` does NOT throw or reject its returned Promise if an underlying query refetch fails.
- Errors during refetching are captured inside the query's state (`status: 'error'`), leaving error handling to UI components or global error boundaries.

---

### Question ce9883de-7972-4179-8302-c5be19d7fdba

- A query is defined with enabled: false. Which of the following APIs will trigger a network request for that query?
  - invalidateQueries
  - refetchQueries
  - removeQueries
  - resetQueries
  - ensureQueryData

### Answer

- _**refetchQueries**_: **YES** — forces an immediate refetch, bypassing `enabled: false`.
- _**ensureQueryData**_: **YES** — fetches data over network if missing/stale, bypassing `enabled: false`.
- _**invalidateQueries**_: **NO** — respects `enabled: false` and skips network refetch.
- _**removeQueries**_: **NO** — only deletes cached data without triggering requests.
- _**resetQueries**_: **NO** — resets state but respects `enabled: false` when refetching.

---

### Question 7f2021e9-ee87-408d-839c-250e94cd6ad4

- Discuss refetchQueries:
  - Does it throw an error if failed to refetch a query?
  - what does it return?
  - in what situations would this method fail to refetch a query?

### Answer

- **Throws on error**: YES, by default it rejects the returned Promise if any query refetch fails (unless `throwOnError: false`).
- **Return value**: Returns a `Promise<Array<QueryResult>>` containing the results/data of refetched queries.
- **Failure scenarios**:
  - The `queryFn` throws an unhandled error or rejected Promise (e.g., network failure, HTTP 4xx/5xx).
  - The request is aborted via `AbortSignal`.
  - Filter options match no existing queries in the _**QueryCache**_.

---

### Question fe609f76-7016-430c-b7e8-addea411017d

- Why prefetchQuery should be used instead of fetchQuery in React Query?

### Answer

- _**prefetchQuery**_ handles errors silently without throwing, preventing unhandled Promise rejections in route loaders or event handlers.
- _**prefetchQuery**_ does nothing if query data already exists in cache and is fresh (respecting `staleTime`).
- _**fetchQuery**_ returns data and **throws errors** on failure.
- Prefer _**prefetchQuery**_ for speculative cache loading; use _**fetchQuery**_ when you need returned data imperatively.

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

- _**invalidateQueries**_: Marks both _**active**_ and _**inactive**_ as stale; refetches **only active queries** by default.
- _**refetchQueries**_: Refetches **both active and inactive queries** by default (`type: 'all'`).
- _**removeQueries**_: Deletes **both active and inactive queries** from cache without refetching.
- _**resetQueries**_: Resets data state for both; refetches **only active queries**.
- _**ensureQueryData**_: Fetches data if missing/stale for target query key regardless of active/inactive subscriber status.
- _**fetchQuery**_: Fetches data if missing/stale for target query key regardless of active/inactive subscriber status.

---

### Question 34f53770-0ef3-41fe-9607-81966414e1b2

- fetchQuery vs useQuery in React Query

### Answer

- _**fetchQuery**_:
  - Imperative method on `QueryClient` meant for non-React contexts or server-side preloading.
  - Returns a Promise resolving to data; does NOT subscribe components or trigger re-renders.
- _**useQuery**_:
  - Declarative React hook for components.
  - Subscribes component to cache state, automatically manages refetches on mount/focus/reconnect, and returns reactive state (`data`, `isPending`, `error`).

---

### Question a4e181a1-3abb-411b-82c0-3a6d1dd795f7

- what happen when you call ensureQueryData in React Query?

### Answer

- Checks if cached data exists for the query key and is currently fresh (within `staleTime`).
- If fresh data exists in _**QueryCache**_: Returns cached data immediately without making a network request.
- If data is missing or _**stale**_: Triggers `fetchQuery` under the hood to fetch fresh data, populates cache, and returns it.

---

### Question abba1d6f-2054-48c2-ab8a-126e175dcbcf

- setQueryData vs fetchQuery in React Query

### Answer

- _**setQueryData**_:
  - Synchronously updates or writes data directly into the _**QueryCache**_ manually without executing `queryFn` or making network calls.
  - Does NOT mark data as _**stale**_ by default.
- _**fetchQuery**_:
  - Asynchronously executes `queryFn` over the network to update cache with response.
  - Respects `staleTime` and handles async loading/error states.

---

### Question 565673b1-d5eb-48f4-a4cc-bde46ce2e14f

- Discuss setQueryData
  - use cases
  - what happen when there is no query data for the given query key?
  - what happen when queries are not ultilized by query hooks?
  - Does it mark data as stale by default?

### Answer

- synchronous, any subscribed query hooks will re-render immediately.
- Common use cases:
  - Optimistic updates (update UI before server confirms)
  - After mutation (avoid refetch)
  - Hydration / prefill data
- When there is no query data for the given query key, it will create a new query with the given data. (not a real network request)
- If you create/update a query via setQueryData but no component subscribes to it, then:
  - It becomes inactive immediately
  - It will be deleted after gcTime
- It does NOT mark data as stale by default
- must perform in immutable way, otherwise it will not trigger re-render for subscribed components

---

### Question f303c6de-e0c4-43db-a05a-5c4bda9d64c8

- explain cancelRefetch in refetchQueries

### Answer

- Controls whether an in-flight request for matching queries should be cancelled before triggering a new refetch (defaults to `true`).
- When `cancelRefetch: true` (default): Aborts any ongoing network request for that query before starting a fresh request.
- When `cancelRefetch: false`: Skips cancelling ongoing requests and lets existing fetches finish without starting duplicates.

---

### Question 12bdacb4-4c18-478b-a15e-0a3e4b800a60

- resetQueries
  - what does it do?
  - use cases

### Answer

- puts matching queries back to their initial state — as if they were just created
  - Clear data
  - Clear error
  - Reset status → pending (or idle depending on timing)
  - Restore initialData (if you provided it)
- and then refetches **active** ones. (inactive queries are not refetched)

- use cases:
  - retry from clean state
  - logout / login
  - reset to initial data

---

### Question 0230622f-e248-4b10-9498-951b5c13e8b2

- resetQueries vs invalidateQueries

### Answer

- _**resetQueries**_:
  - Clears query cache data and error states back to initial state (e.g. `initialData` or `undefined`) and sets query state to pending before refetching active queries.
- _**invalidateQueries**_:
  - Preserves existing cached data, marks it as _**stale**_, and refetches active queries in background without clearing current UI state.

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

- A data transformation layer applied to cached data before your component receives it
  - but does not affect what gets stored in the query cache
- The select function will only run if data changed, or if the reference to the select function itself changes.
  - To optimize, wrap the function in useCallback.
- benefits:
  - Avoids unnecessary re-renders
    - components will only re-render if the selected data changes
    - Referential equality -> should only return primitives or memoized objects
  - Centralize transformation logic
  - Derived data without extra state
- best practices:
  - avoid heavy computation in select, as it will run on every render of the component that uses the query
- if data.name unchanged, but data changed, will the component re-render?
  - No, if the selected value is referentially equal to the previous value, the component will not re-render.

---

### Question d5641d6a-4e1e-4d32-87da-93443385abf8

- initialData vs placeholderData in useQuery / useInfiniteQuery

### Answer

- _**initialData**_:
  - Saved directly into the _**QueryCache**_ as real, authoritative data.
  - Participates in `staleTime` logic (marked fresh initially unless `initialDataUpdatedAt` is set).
- _**placeholderData**_:
  - Temporary UI fallback data that is **NOT** saved to the _**QueryCache**_.
  - Sets `isPlaceholderData: true` and is replaced immediately when real network data arrives.

---

### Question 52b42f0b-cca4-40ef-8c8c-8c566641ba77

- select vs useMemo

### Answer

1. Where they run (important but not the main story)
   select runs inside React Query before data reaches your component
   useMemo runs inside your component during render

👉 This leads to a critical difference in re-render behavior.

2. Re-render mechanics (this is the real difference)
   With useMemo
   ```ts
   const { data } = useQuery(...)
   const name = useMemo(() => data.name, [data])
   ```
   When query updates → component re-renders
   Then useMemo runs → maybe returns same value
   But render already happened

👉 useMemo does NOT prevent re-render, it only avoids recomputation

- With select

  ```ts
  useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    select: (data) => data.name,
  });
  ```

  - Query updates internally
  - React Query compares:
  - previous selected value vs new selected value
  - If equal → component does NOT re-render  
    👉 select prevents re-render before React is even involved

---

### Question f8899929-399d-4624-ba07-5bda3996c25b

- discuss combine in useQueries

### Answer

- Introduced in React Query v5 to combine and transform results from multiple queries into a single output.
- Eliminates repetitive mapping or data extraction inside component render functions.
- **Re-render Optimization**: Component only re-renders if the value returned by `combine` changes referentially.

---

### Question d936b043-4a89-4a04-88de-0ea8356d91cc

- what is the purpose and use case of mutationKey in useMutation?

### Answer

- A unique identifier for a mutation that allows you to group and manage related mutations
- use cases:
  1. Set defaults per mutation type
     - e.g. retry, onSuccess, onError, etc.
  2. Track mutation state globally (useIsMutating)
  3. Filtering mutations (useMutationState)

---

### Question af22bea4-4759-4fcc-b553-d8761aa3a4ba

- what suspense hooks differ from non-suspense hooks in React Query?

### Answer

- options
  - suspense does not have: throwOnError, enabled, placeholderData
- returns
  - suspense hooks: isPlaceholderData is missing, data is guaranteed to be defined, status is either 'success' or 'error', error is guaranteed to be defined if status is 'error'
- cancellation on suspense does not work, because suspense hooks do not have isFetching state, so you cannot cancel a fetch in progress

---

### Question a3b3e3d5-a50c-4006-aae9-3fcfd1f869da

- select vs transform in queryFn

### Answer

- _**transform in queryFn**_:
  - Executed inside `queryFn` before data is stored in _**QueryCache**_; transformed output becomes the cached data.
  - Applied globally across all observers consuming that query key.
- _**select**_:
  - Executed after data is retrieved from _**QueryCache**_; raw response remains unchanged in cache.
  - Applied per component subscription, allowing different components to derive different representations from the same cached data.

---

### Question bd9c8d91-7e49-437f-ac78-5fc05555edfe

- important notes on queryFn in React Query

### Answer

- return a promise
  - resolve with data or throw an error
- success must not be undefined
  - if queryFn returns undefined, treat as failure and throw an error
  - use null if you want to represent empty data
- to determine query has error, must return a rejected promise or throw an error
  - with native fetch, you need to check response.ok and throw an error if false
- Query Function Variables#
  ```ts
  function Todos({ status, page }) {
    const result = useQuery({
      queryKey: ["todos", { status, page }],
      queryFn: fetchTodoList,
    });
  }

  // Access the key, status and page variables in your query function!
  function fetchTodoList({ queryKey }) {
    const [_key, { status, page }] = queryKey;
    return new Promise();
  }
  ```

---

### Question e0da4b94-43f5-4b07-9957-99e6e65b0f01

- discuss Network Mode in react query

### Answer

---

### Question 3480e17d-6987-4958-8606-92cbd701a3ab

- show loading indicator in react query

### Answer

- status === 'pending' -> show initial loading indicator
- isFetching === true -> intial + background loading indicator
- isRefetching === true && status !== 'pending' -> background loading indicator only

---

### Question d4d83f44-5ff6-447a-b1a5-c4ddec87e34f

- initial data query
  - ways to pre-populate query cache with data
  - initialDataUpdatedAt
  - initial data function

### Answer

- ways to pre-populate query cache with data:
  - initialData
  - prefetchQuery
  - fetchQuery
  - setQueryData

- initialData:
  - persist in cache, so if data is not completed, use placeholderData instead
  - staleTime and initialDataUpdatedAt
    - by default, initialData is treated as totally fresh, as if it were just fetched
    - with initialDataUpdatedAt, react query use initialDataUpdatedAt instead of Date.now() to determine if data is stale or not
    - use if data is old

- initial data function:
  - `initialData: () => getExpensiveTodos(),`
  - a function that returns the initial data for a query
  - function will be executed only once when the query is initialized, saving you precious memory and/or CPU

---

### Question 711dad80-32b4-49f9-a07c-f9a1fbde794e

- placeholderData
  - with cached
  - with function

### Answer

- do not persist in cache
- status will not have 'pending', it will start with 'success' and isPlaceholderData will be true
- Placeholder Data from Cache
  - in useQuery, you can get cached data from getQueryData and use it as placeholderData

  ```ts
    placeholderData: () => {
      // Use the smaller/preview version of the blogPost from the 'blogPosts'
      // query as the placeholder data for this blogPost query
      return queryClient
        .getQueryData(['blogPosts'])
        ?.find((d) => d.id === blogPostId)
    },
  ```

- Placeholder Data from Function
  - use the data from one query as the placeholder data for another query. When the QueryKey changes, e.g. from ['todos', 1] to ['todos', 2], we can keep displaying "old" data instead of having to show a loading spinner while data is transitioning from one Query to the next.
    ```ts
    const result = useQuery({
      queryKey: ["todos", id],
      queryFn: () => fetch(`/todos/${id}`),
      placeholderData: (previousData, previousQuery) => previousData,
    });
    ```

---

### Question 27b3ba7c-b8fb-482e-9d42-e6a64178ff8d

- mutation
  - lifecycle
  - order of execution of onMutate, mutationFn, onError, onSuccess, onSettled

### Answer

- lifecycle:
  - onMutate → mutationFn → onError / onSuccess → onSettled
- order of execution: onSuccess defined in useMutation runs first, then the one passed to mutate.
  - onMutate (global)
  - onMutate (local)

  - mutationFn

  - onSuccess (global) ✅ FIRST
  - onSuccess (local) ✅ SECOND

  - onSettled (global)
  - onSettled (local)

- Local callbacks do NOT replace global ones
  - They are additive, not overrides

---

### Question 4f70e6aa-7d4d-41c9-9d9d-47ee86716661

- mutation
  - Consecutive mutations

### Answer

```ts
todos.forEach((todo) => {
  mutate(todo, {
    onSuccess: () => {
      // Will execute only once, for the last mutation (Todo 3),
      // regardless which mutation resolves first
      console.log("local");
    },
  });
});
```

- You are not creating multiple independent observers.
- Instead:
  - There is one mutation observer
  - Each mutate call re-subscribes that observer
  - So previous local callbacks get dropped

---

### Question c79e85e3-c1c1-47d7-b630-442dbd624819

- mutation persisted and offline
  - what are the requirements?

### Answer

- must setup `queryClient.setMutationDefaults` with mutationKey, onMutate, onError, onSuccess, onSettled
  ```ts
  queryClient.setMutationDefaults(["addTodo"], {
    mutationFn: addTodo,
    onMutate: async (variables, context) => {
      // Cancel current queries for the todos list
      await context.client.cancelQueries({ queryKey: ["todos"] });

      // Create optimistic todo
      const optimisticTodo = { id: uuid(), title: variables.title };

      // Add optimistic todo to todos list
      context.client.setQueryData(["todos"], (old) => [...old, optimisticTodo]);

      // Return a result with the optimistic todo
      return { optimisticTodo };
    },
    onSuccess: (result, variables, onMutateResult, context) => {
      // Replace optimistic todo in the todos list with the result
      context.client.setQueryData(["todos"], (old) =>
        old.map((todo) => (todo.id === onMutateResult.optimisticTodo.id ? result : todo)),
      );
    },
    onError: (error, variables, onMutateResult, context) => {
      // Remove optimistic todo from the todos list
      context.client.setQueryData(["todos"], (old) =>
        old.filter((todo) => todo.id !== onMutateResult.optimisticTodo.id),
      );
    },
    retry: 3,
  });
  ```
- either:
  - use dehydrate and hydrate
    ```ts
    const state = dehydrate(queryClient);

    // The mutation can then be hydrated again when the application is started:
    hydrate(queryClient, state);
    // Resume the paused mutations:
    queryClient.resumePausedMutations();
    ```
  - or use persistQueryClient
    ```ts
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient.resumePausedMutations()
      }}
    >
      <RestOfTheApp />
    </PersistQueryClientProvider>
    ```

---

### Question 0f076690-c7b0-44a4-b117-b86b8a6b5a0f

- scope in useMutation
  - what is the scope of useMutation?
  - what is the purpose?
  - important nuances

### Answer

- Per default, all mutations run in parallel
  ```ts
  mutate(A);
  mutate(B);
  mutate(C);
  ```
- with scope:
  ```ts
  const mutation = useMutation({
    mutationFn: addTodo,
    scope: { id: "todo" },
  });
  // A → B → C   (strict order)
  // when A starts, B & C are in isPaused: true
  // queue mutation:
  // mutation.status === 'pending'
  // mutation.isPaused === true
  ```
- purpose:
  - prevent race conditions when multiple mutations
  - Fix optimistic updates
    - Without scope:
      - multiple optimistic updates overlap
      - rollback logic becomes inconsistent
  - Required for ordered side effects

- nuances:
  - different scopes run in parallel
  - scope is global, not per component
    ```ts
    // assume addTodo and updateTodo have the same scope i.e. { id: "todo" }
    addTodo.mutate(A); // from Component A
    updateTodo.mutate(B); // from Component B
    // even though they are from different components, they will run in order A → B
    ```

---

### Question 3bade988-91c1-4516-a3d0-7be18980d0e4

- explain predicate in invalidateQueries, refetchQueries, removeQueries, resetQueries

### Answer

- predicate is just a filter function.
  - It receives every query in the cache (query)
  - It must return true or false
  - If it returns true → that query gets invalidated
  - If it returns false → it is ignored
- has finer control than queryKey, because you can filter by any property of the query, not just the key.

---

### Question a0c81eab-7db2-4c1a-87a4-41c9b326d797

- optimistic update in React Query
  - how to implement

### Answer

- either:
  - use the onMutate option to update your cache directly,
  - or leverage the returned variables to update your UI from the useMutation result.

```ts
const queryClient = useQueryClient();

useMutation({
  mutationFn: updateTodo,
  // When mutate is called:
  onMutate: async (newTodo, context) => {
    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await context.client.cancelQueries({ queryKey: ["todos"] });

    // Snapshot the previous value
    const previousTodos = context.client.getQueryData(["todos"]);

    // Optimistically update to the new value
    context.client.setQueryData(["todos"], (old) => [...old, newTodo]);

    // Return a result with the snapshotted value
    return { previousTodos };
  },
  // If the mutation fails,
  // use the result returned from onMutate to roll back
  onError: (err, newTodo, onMutateResult, context) => {
    context.client.setQueryData(["todos"], onMutateResult.previousTodos);
  },
  // Always refetch after error or success:
  onSettled: (data, error, variables, onMutateResult, context) =>
    context.client.invalidateQueries({ queryKey: ["todos"] }),
});
```

---

### Question 5cd6ad0f-c515-4b59-a10c-1d303fd5a2e0

- What is a Request Waterfall?
- in React Query

### Answer

- when a request for a resource (code, css, images, data) does not start until after another request for a resource has finished.
  - examples:
    1 |-> Markup
    2 ..|-> CSS
    2 ..|-> JS
    2 ..|-> Image

- in React Query:
  - Single Component Waterfalls / Serial Queries
    - Dependent Queries -> restructure component tree
    - or suspense queries -> use useSuspenseQueries or prefetch
      ```ts
      // The following queries will execute in serial, causing separate roundtrips to the server:
      const usersQuery = useSuspenseQuery({ queryKey: ["users"], queryFn: fetchUsers });
      const teamsQuery = useSuspenseQuery({ queryKey: ["teams"], queryFn: fetchTeams });
      const projectsQuery = useSuspenseQuery({ queryKey: ["projects"], queryFn: fetchProjects });
      // First hook runs → usersQuery
      // If it's not ready, it throws a promise (Suspense behavior)
      // React stops rendering right there
      // The next hooks (teamsQuery, projectsQuery) never execute yet
      ```
  - Nested Component Waterfalls
    - when both a parent and a child component contains queries, and the parent does not render the child until its query is done.
    - This can happen both with useQuery and useSuspenseQuery.
    - solution: prefetch, fetch queries in parent component
  - Code Splitting

---

### Question 4a154a77-d2b0-4ac9-93eb-fb32876768d9

- Server rendering and hydration in React Query
  - typical flow vs desired flow
  - quick note on Suspense

### Answer

- typical flow:
  1. |-> Markup (without content)
  2. ..|-> JS
  3. .... |-> Query

- desired flow
  1. |-> Markup (with content AND initial data)
  2. ..|-> JS
  - As soon as 1. is complete, the user can see the content and when 2. finishes, the page is interactive and clickable
  - we need to prefetch that data before we generate/render the markup,

- note on Suspense:
  - useQuery -> useSuspenseQuery; **as long as you always prefetch queries**
    - if not prefetch, in some cases, the data will Suspend and get fetched on the server but never be hydrated to the client, where it will fetch again
      - cause hydration mismatch and double fetches on the client

---

### Question 67a593c8-d6aa-4cb3-a054-3eea89956e06

- Server rendering and hydration in React Query
  - what are the implementation methods?

### Answer

- initial setup:
  - create a queryClient inside a component that wraps your app, and pass it to the QueryClientProvider
  - do not create queryClient outside of a component, because it will be shared across all requests and users, which is not safe for SSR

1. initialData method
   - fetch data on the server and pass it to the client as initialData
   - downside: props drilling, you have to pass the data down to every component that needs it, and you have to do this for every page
   ```ts
   export async function getServerSideProps() {
     const posts = await getPosts();
     return { props: { posts } };
   }

   function Posts(props) {
     const { data } = useQuery({
       queryKey: ["posts"],
       queryFn: getPosts,
       initialData: props.posts,
     });

     // ...
   }
   ```
2. using Hydration API (with prefetch)
   - fetch data on the server and pass it to the client as dehydrated state
   - no props drilling, you can use it anywhere in your app
   - downside: you have to prefetch the data on the server, which can be tricky if you have a lot of queries or if you don't know what queries will be needed on the client

   ```ts
   export async function getServerSideProps() {
     const queryClient = new QueryClient();
     await queryClient.prefetchQuery({ queryKey: ["posts"], queryFn: getPosts });
     return { props: { dehydratedState: dehydrate(queryClient) } };
   }

   function Posts() {
     const { data } = useQuery({
       queryKey: ["posts"],
       queryFn: getPosts,
     });

     // ...
   }
   ```

3. using App Router (nextJs)
   - using HydrationBoundary with dehydrate and prefetchQuery
   ```ts
   export default async function PostsPage() {
    const queryClient = new QueryClient()

    await queryClient.prefetchQuery({
        queryKey: ['posts'],
        queryFn: getPosts,
    })

    return (
        // Neat! Serialization is now as easy as passing props.
        // HydrationBoundary is a Client Component, so hydration will happen there.
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Posts />
        </HydrationBoundary>
    )
   }

   ```

---

### Question 5f5ed5ad-1933-444f-8517-a8548eac8075

- what are the important defaults of react query?
  - staleTime
    - static vs Infinite
  - gcTime
  - retries

### Answer

- staleTime:
  - default: 0
  - the amount of time (in milliseconds) that a query's data is considered fresh. After this time, the data becomes stale and will be refetched on the next mount or focus.
  - 'static' vs Infinite
    - static: never trigger a refetch, even if the Query is invalidated manually.
      - refetchOnMount, refetchOnWindowFocus, and refetchOnReconnect set to "always" are also blocked by 'static'.
      - Use 'static' for data that cannot change while the app is running: feature flags fetched at boot, user permissions loaded at login, static reference tables.
    - infinite: never trigger a refetch until the Query is invalidated manually.
      - Use Infinity when you still want manual invalidation to work.
- gcTime:
  - default: 5 * 60 * 1000 (5 minutes)
  - the amount of time (in milliseconds) that a query's data will remain in the cache after it becomes inactive (no active subscribers). After this time, the data will be garbage collected

- retries:
  - default: 3
  - the number of times a query will retry on failure before throwing an error. You can also provide a function to customize the retry behavior based on the error or attempt count.

---

### Question dd982c68-a792-455d-9351-5371fa885de4

- render optimizations in React Query

### Answer

- tracked properties:
  - React Query will only trigger a re-render if one of the properties returned from useQuery is actually "used". This is done by using Proxy object.
    - If you use object rest destructuring, you will disable this optimization.
    ```ts
    const {data} = useQuery(...) // tracked
    // data is used, so re-render will be triggered if data changes
    ```
- structural sharing
  - ensure that as many references as possible will be kept intact between re-renders.
  - If a subset changed, React Query will keep the unchanged parts and only replace the changed parts

- select
  - transform data before it reaches your component, and only trigger a re-render if the selected value changes referentially.
- memorization
  - useCallback on select, combine

---

### Question 5841c53b-351b-4b2c-9fa8-137e6efa0eb1

- suspense in React Query
  - what missing?
  - what is throwOnError?

### Answer

- status & error: are not needed
- can't conditionally enable / disable the Query
- placeholderData also doesn't exist
- To prevent the UI from being replaced by a fallback during an update, wrap your updates that change the QueryKey into startTransition.
- throwOnError
  - we're only throwing errors if there is no other data to show.
  - That means if a Query ever successfully got data in the cache, the component will render, even if data is stale.
  - Thus, the default for throwOnError is: `throwOnError: (error, query) => typeof query.state.data === 'undefined'`
  - need to manually throw
  ```ts
  const { data, error, isFetching } = useSuspenseQuery({ queryKey, queryFn });

  if (error && !isFetching) {
    throw error;
  }
  ```
- Fetch-on-render
  - when your components attempt to mount, they will trigger query fetching and suspend

---

### Question 27923078-56ed-4c73-ad6b-7c15f84036ff

### Answer

---

### Question 5c054244-c2a7-4c73-a2e7-07e096e3fe8c

### Answer

---

### Question 3772f79f-ee6c-454e-8576-ca9f8e11b823

### Answer

---

### Question 5b8cb516-68b0-422b-b8b6-59958bac4076

### Answer

---

### Question d31217ca-5718-420b-b3ca-bebde43d17a8

### Answer

---

### Question dbc505a2-2dfb-4088-a5c9-9ccea894dcb0

### Answer

---

### Question a4bae6c1-2f7a-496d-bb70-39f32900fa0c

### Answer

---

### Question ad734b8a-7fec-49b3-9fc8-4976bc0f45eb

### Answer

---

### Question 49cc322a-1556-4a65-97b1-4f2aef7e2482

### Answer

---

### Question 279b518b-52c0-4dd5-85d9-da679f664c03

### Answer

---

### Question 29624995-59d3-455b-93f5-d9642103ed55

### Answer

---
