# Frontend System Design

### Question e40731db-01b9-46f2-b3f3-40bd958f8928

- If you are tasked with implementing an infinite-scrolling media feed with autoplaying video and images (e.g., TikTok or Twitter feed), what architectural decisions and trade-offs would you evaluate?

### Answer

- **DOM Virtualization (`@tanstack/react-virtual`)**: Render only visible items plus a 1–2 item overscan window to prevent DOM node ballooning, memory leaks, and paint degradation on deep scrolls.
- **Media Element Pooling**: Maintain a recycled pool of 3–5 native `<video>` elements rather than creating new DOM elements per card to prevent mobile GPU and browser memory exhaustion.
- **Autoplay Lifecycle via `IntersectionObserver`**: Mount an `IntersectionObserver` with a visibility threshold (e.g. `threshold: 0.6`); trigger playback only for the primary centered item, pausing immediately when scrolled out of view and defaulting to muted per browser autoplay policy.
- **Cursor Pagination & Prefetch Buffer**: Paginate with opaque cursor tokens (`next_cursor`) rather than numeric offsets to prevent duplicate or skipped items during continuous feed insertion; prefetch the next batch when the user reaches 80% scroll depth.
- **Scroll Restoration**: Cache the active item index and scroll offset in `sessionStorage` or history state so navigating to a detail view and clicking "back" restores exact viewport position without refetch flash.

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        video.play().catch(() => {}); // Muted autoplay fallback
      } else {
        video.pause();
      }
    });
  },
  { threshold: 0.6 }
);
```

- [More detail on Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [More detail on TanStack Virtual](https://tanstack.com/virtual/latest)

---

### Question eca8c71a-ee93-48c9-bf0c-3996ef38c563

- If you are tasked with designing a high-frequency live trading order book (100+ updates/second), how would you structure the data flow and UI rendering to keep the interface responsive?

### Answer

- **Decoupling Network Ingestion from React Renders**: Never call React `setState` per incoming WebSocket message; buffer incoming tick deltas in a raw mutable array or circular ring buffer.
- **Web Worker Compute Offloading**: Offload snapshot parsing, delta merging, and depth sorting to a Dedicated Web Worker (`postMessage`) to ensure the browser main thread remains free for user interactions.
- **`requestAnimationFrame` (RAF) Throttled Flushes**: Flush buffered order book state to the UI at the display refresh rate (capped at 30Hz or 60Hz) using RAF batching, aggregating dozens of micro-ticks into a single render pass.
- **Bypassing VDOM on Hot Paths**: For ultra-fast ladder visualizations, bypass React reconciliation entirely using HTML5 Canvas, WebGL, or direct DOM node mutations (`ref.current.textContent = price`).
- **Gap Detection & Re-Sync**: Track server sequence numbers (`seq_id`); if a dropped packet creates a sequence gap, trigger an immediate REST snapshot query to reconcile state cleanly.

```typescript
let deltaBuffer: OrderDelta[] = [];
let rafId: number | null = null;

function onWebSocketMessage(delta: OrderDelta) {
  deltaBuffer.push(delta);
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      applyDeltasToStore(deltaBuffer);
      deltaBuffer = [];
      rafId = null;
    });
  }
}
```

- [More detail on Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [More detail on window.requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

---

### Question 2c0a28b7-dc2c-4e7e-9318-2a1e3b5ea8c9

- If you are tasked with architecting a real-time collaborative canvas (e.g., Figma or Miro-lite), what architectural decisions would you make regarding data consistency, rendering, and presence?

### Answer

- **CRDT Consistency Model (Yjs / Automerge)**: Use Conflict-free Replicated Data Types (CRDTs) over WebSockets to ensure automatic conflict resolution, eventual consistency, and offline peer editing without requiring central server locks.
- **Canvas / WebGL Rendering over DOM**: Avoid rendering shapes as individual React DOM elements (10,000+ SVG/DOM nodes cause severe layout reflows); render to HTML5 Canvas or WebGL (e.g., Pixi.js) paired with an **R-Tree** spatial index for viewport culling.
- **Partitioning Persistent vs Ephemeral State**: Stream low-latency mouse cursors and active selection boxes through lightweight awareness protocols (WebRTC data channel or transient binary WebSocket frames) without writing them to disk; persist committed canvas operations to durable CRDT storage.
- **Local-Only Undo/Redo Stacks**: Isolate undo/redo transactions using client tracking scopes (e.g. `Y.UndoManager({ trackedOrigins: new Set([localClientId]) })`) so pressing `Ctrl+Z` reverses only the local user's edits, not collaborators' actions.

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('wss://collab.example.com', 'canvas-room', ydoc);
const shapesMap = ydoc.getMap('shapes');
const undoManager = new Y.UndoManager(shapesMap, { trackedOrigins: new Set([provider.doc.clientID]) });
```

- [More detail on Yjs Shared Types and UndoManager](https://docs.yjs.dev/api/undo-manager)
- [More detail on HTML5 Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

---

### Question 7075fe55-55ff-4f49-911d-08b2b4aa0007

- If you are tasked with implementing a global "Command+K" search palette across multiple entity types, what architectural and accessibility factors must be considered?

### Answer

- **Query Cancellation (`AbortController`)**: Abort active in-flight network requests when the user types a new character to eliminate out-of-order race conditions and reduce server load.
- **Debounced Remote Querying with Local Cache**: Debounce network queries by 150–200ms; maintain an in-memory Trie or LRU cache to serve repeated queries and static navigation commands instantaneously (0ms latency).
- **WAI-ARIA Combobox Standard**: Implement `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, and manage focus via `aria-activedescendant` or roving `tabIndex` to provide complete screen-reader and keyboard accessibility.
- **Lazy Loading & Portaling**: Render the palette in a React Portal attached to `document.body` to avoid parent `z-index` and overflow clipping; dynamically import (`React.lazy`) the dialog bundle so it loads only when `Cmd+K` is first pressed.

```typescript
useEffect(() => {
  if (!query.trim()) return;
  const controller = new AbortController();

  fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
    .then((res) => res.json())
    .then((results) => setOptions(results))
    .catch((err) => {
      if (err.name !== 'AbortError') console.error(err);
    });

  return () => controller.abort();
}, [query]);
```

- [More detail on WAI-ARIA Combobox Design Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [More detail on AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

---

### Question 06615c78-d3c8-47e0-a9ae-c7918e48e42e

- When tasked with building a multi-step onboarding or checkout wizard with dynamic branching paths and draft persistence, how would you structure state management and validation boundaries?

### Answer

- **URL-Driven Step State**: Store the active step and branching key in the URL query string (`?step=payment&plan=enterprise`) to support native browser back/forward navigation, page refresh, and deep-linking.
- **Uncontrolled Partitioned Form State (React Hook Form + Zod)**: Isolate field validation per step using modular Zod schemas; validate only the active step's fields before allowing progression to prevent blocking invisible fields from skipped branches.
- **Tiered Draft Persistence**: Debounce local draft writes to `localStorage` for immediate crash recovery; submit validated checkpoints to the backend API (`PATCH /api/wizards/:id`) on explicit step transitions.
- **DAG / State Machine Navigation**: Model steps as a Directed Acyclic Graph (DAG) or finite state machine where next-step transitions evaluate accumulated form data rather than indexing a hardcoded array.

```typescript
// Validating isolated step schema dynamically
const currentSchema = stepSchemas[currentStepKey];

const handleNextStep = async () => {
  const stepValid = await form.trigger(stepFieldNames[currentStepKey]);
  if (stepValid) {
    saveDraftCheckpoint(form.getValues());
    router.push(`?step=${getNextStep(currentStepKey, form.getValues())}`);
  }
};
```

- [More detail on React Hook Form Performance](https://react-hook-form.com/get-started)
- [More detail on Zod Schema Validation](https://zod.dev/)

---

### Question 5b63e17d-ce34-4501-9dec-142c7757aab0

- If tasked with designing an in-browser file uploader for 5GB+ files with pause/resume and network drop resilience, what architecture would you put in place?

### Answer

- **Client-Side Blob Slicing**: Partition files into fixed-size chunks (e.g. 5MB–10MB) using `File.prototype.slice()` and upload them sequentially or with bounded concurrency (2–3 parallel chunks).
- **Resumable Protocol (Tus or S3 Multipart)**: Query the server before uploading to obtain the byte offset of the last acknowledged chunk, resuming precisely where the upload was interrupted.
- **Web Worker Checksums**: Offload MD5 or SHA-256 chunk hash generation to a **Web Worker** using the Web Crypto API (`crypto.subtle.digest`) to prevent freezing the UI thread during cryptographic hashing.
- **Zero In-Memory Buffering**: Stream raw `Blob` chunk references directly into `fetch()` or `XMLHttpRequest` payloads; never read entire multi-gigabyte files into memory with `FileReader.readAsArrayBuffer()` to prevent browser tab crashes.

```typescript
async function uploadChunks(file: File, uploadUrl: string, chunkSize = 5 * 1024 * 1024) {
  let offset = await getServerOffset(uploadUrl); // Query resume offset

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    await uploadChunk(uploadUrl, chunk, offset);
    offset += chunk.size;
    updateProgress((offset / file.size) * 100);
  }
}
```

- [More detail on File.slice()](https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice)
- [More detail on Tus Resumable Upload Protocol](https://tus.io/protocols/resumable-upload)

---

### Question 549d6483-9777-448b-a34b-9e5841cf9ba6

- If you are tasked with implementing a notification center featuring real-time push alerts, unread badge counters, and cross-tab state synchronization, what architecture would you choose?

### Answer

- **Server-Sent Events (SSE) for Real-Time Push**: Use SSE over HTTP/2 for lightweight server-to-client push; SSE includes native auto-reconnection and `Last-Event-ID` message replay, avoiding the overhead of WebSockets for unidirectional streams.
- **Cross-Tab Synchronization via `BroadcastChannel`**: Broadcast read receipts, badge counter updates, and dismissals across all open tabs via `new BroadcastChannel('notifications')` so reading a notification in Tab A instantly updates Tab B.
- **Optimistic Badge Updates**: Decrement unread badge counters immediately in client state upon user click, rolling back only if the persistence API call fails.
- **Jittered Exponential Backoff**: Implement exponential backoff with randomized jitter on connection retries to prevent a thundering herd crash on the API gateway when a server reboots.

```typescript
const channel = new BroadcastChannel('notifications_channel');

// Broadcast read receipt to peer tabs
function markAsRead(notificationId: string) {
  optimisticMarkRead(notificationId);
  channel.postMessage({ type: 'MARK_READ', id: notificationId });
  api.markRead(notificationId).catch(rollbackMarkRead);
}

channel.onmessage = (event) => {
  if (event.data.type === 'MARK_READ') syncMarkRead(event.data.id);
};
```

- [More detail on BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [More detail on Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

---

### Question 6871f775-2bfb-453e-a7c7-63e5cf43a0b6

- If tasked with building an offline-first inspection/CRM app where users capture data without an internet connection, how would you design local storage, the mutation queue, and conflict resolution?

### Answer

- **Client Embedded Database (IndexedDB / Dexie.js)**: Treat IndexedDB as the primary client database; all UI components read from and write to IndexedDB synchronously from the UI's perspective, decoupling interactions from network availability.
- **Durable Persistent Mutation Outbox**: Store mutation operations (`CREATE_INSPECTION`, `UPDATE_RECORD`) in an IndexedDB outbox table marked with status flags (`PENDING`, `SYNCING`, `FAILED`) and monotonic timestamps.
- **Background Sync Drain**: Use the browser `Background Sync API` or listen to `navigator.onLine` / window `online` events to trigger queue processing in FIFO order when connectivity returns.
- **Conflict Resolution Strategy**: Use **Last-Write-Wins (LWW)** with server-assigned monotonic version vectors for simple records; apply **3-Way Field-Level Merging** or present a visual resolution modal for concurrent rich document conflicts.

```typescript
import Dexie, { Table } from 'dexie';

interface MutationTask {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  createdAt: number;
}

class AppDatabase extends Dexie {
  mutations!: Table<MutationTask, string>;
  constructor() {
    super('AppDB');
    this.version(1).stores({ mutations: 'id, status, createdAt' });
  }
}
```

- [More detail on IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [More detail on Background Synchronization](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)

---

### Question 6184762e-5476-4551-88b6-ceb4630d2884

- When tasked with implementing fine-grained Role-Based Access Control (RBAC) and dynamic feature flags in an enterprise SPA, how would you design the authorization layer without introducing layout flash or security holes?

### Answer

- **Defense-in-Depth Principle**: Treat client-side RBAC strictly as a UX concern (hiding buttons, disabling inputs, route guards); the backend API must validate authentication and permissions independently on every mutation and query.
- **Synchronous Bootstrap Injection**: Embed initial user permissions and evaluated feature flags directly into the server-rendered HTML payload (`window.__INITIAL_FLAGS__`) or block the root layout render until flags are hydrated, preventing UI flickering and layout shifts.
- **Declarative Rule Engine (`<Can>` / CASL)**: Centralize permission logic into an ability definition module, consuming it via declarative primitives (`<Can I="delete" a="Project">`) and hooks (`usePermission('project.delete')`).
- **Route-Level Guard Integration**: Enforce permission checks inside router loaders (e.g. TanStack Router or Next.js middleware) before downloading or rendering protected route chunks.

```typescript
interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can = ({ permission, children, fallback = null }: CanProps) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};
```

- [More detail on CASL Isomorphic Authorization](https://casl.js.org/v6/en/guide/intro)
- [More detail on OWASP Access Control Principles](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)

---

### Question bc19b028-2064-478d-a3f3-27f269c6600d

- If you are tasked with implementing a drag-and-drop Kanban board with thousands of tasks, how would you ensure 60fps drag performance and efficient reordering persistence?

### Answer

- **GPU-Accelerated Transforms without Re-Renders**: Use modern drag-and-drop libraries (**dnd-kit**) that update dragged item coordinates via hardware-accelerated CSS `transform: translate3d(...)` on the GPU, avoiding React component re-renders during the drag gesture.
- **Fractional Indexing (LexoRank)**: Assign items float or lexicographical order keys (e.g., inserting between `1.0` and `2.0` yields `1.5`); updates require a single `O(1)` database row update instead of re-indexing an entire column (`O(N)` updates).
- **Column Virtualization**: Wrap task lists in virtualizers (`@tanstack/react-virtual`) when columns exceed 50 cards to maintain a steady DOM node count.
- **Optimistic Drop Rollback**: Update client state and trigger layout animations instantly on drop; dispatch the API mutation in the background and revert to the previous snapshot with a toast notification if the network request fails.

```typescript
// Fractional index calculation for O(1) position persistence
function getIntermediateRank(prevRank: number | null, nextRank: number | null): number {
  if (prevRank === null && nextRank === null) return 1000;
  if (prevRank === null) return nextRank! / 2;
  if (nextRank === null) return prevRank + 1000;
  return prevRank + (nextRank - prevRank) / 2;
}
```

- [More detail on dnd-kit Architecture](https://docs.dndkit.com/introduction/getting-started)
- [More detail on Fractional Indexing and LexoRank](https://observablehq.com/@dgreensp/implementing-fractional-indexing)

---

### Question dc4092be-d570-4889-ba21-c66583f9dabe

- If tasked with designing an analytics and performance telemetry pipeline for a high-traffic web application, what architectural considerations prevent data loss and main-thread overhead?

### Answer

- **Exit Event Delivery via `navigator.sendBeacon()`**: Use `navigator.sendBeacon()` or `fetch({ keepalive: true })` for page unload and session teardown events to guarantee transmission without delaying browser tab closing or page navigation.
- **Batched Buffering via `requestIdleCallback`**: Queue telemetry events in an in-memory buffer and flush in batches (e.g. 10 events or every 5 seconds); schedule flushes using `requestIdleCallback` to prevent competing with user interactions on the main thread.
- **Core Web Vitals Attribution (INP, LCP, CLS)**: Integrate the official `web-vitals` library to collect metric breakdowns and attribution objects (e.g. tracking which element caused high Interaction to Next Paint).
- **Client-Side PII Scrubbing**: Sanitize event payloads with regex filters before buffering to strip emails, credit cards, and passwords, combined with client-side sampling (e.g. logging 5% of normal sessions and 100% of errors) to reduce ingestion costs.

```typescript
const eventQueue: TelemetryEvent[] = [];

function flushQueue() {
  if (eventQueue.length === 0) return;
  const payload = JSON.stringify(eventQueue.splice(0, 50));
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/telemetry', payload);
  } else {
    fetch('/api/telemetry', { method: 'POST', body: payload, keepalive: true });
  }
}

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushQueue();
});
```

- [More detail on navigator.sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
- [More detail on Web Vitals attribution](https://github.com/GoogleChrome/web-vitals#attribution-build)

---

### Question 9f4d687d-d824-4afc-908c-eccffad3e42e

- When building a web app with persistent WebSocket connections, how would you ensure only one browser tab maintains an active socket connection while broadcasting state to other open tabs?

### Answer

- **Web Locks API for Leader Election**: Request an exclusive lock via `navigator.locks.request('ws_leader', async (lock) => { ... })`; the browser automatically assigns the lock to the first tab and seamlessly hands it over to a standby tab if the leader tab closes or crashes.
- **BroadcastChannel Message Relay**: The elected leader opens the persistent WebSocket connection and distributes incoming server messages to passive sibling tabs through a shared `BroadcastChannel`.
- **Standby Tab Proxying**: Inactive tabs route outgoing mutations to the leader tab over the `BroadcastChannel`, which transmits them through its active WebSocket connection.
- **Resource Optimization**: Eliminates duplicate socket connections, reduces server load by 80–90% for power users with many open tabs, and avoids synchronization races.

```typescript
const channel = new BroadcastChannel('app_bus');

navigator.locks.request('ws_leader', async (lock) => {
  const socket = new WebSocket('wss://api.example.com/live');
  socket.onmessage = (event) => channel.postMessage(event.data);

  channel.onmessage = (event) => {
    if (event.data.action === 'SEND') socket.send(event.data.payload);
  };

  // Hold lock indefinitely until tab closes
  await new Promise(() => {});
});
```

- [More detail on Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [More detail on BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

---

### Question 835ab8b8-d361-4e29-bdef-12c38fabc044

- If tasked with designing the internationalization (i18n) architecture for a global platform supporting 30+ languages, what performance, layout, and bundle considerations would you evaluate?

### Answer

- **Namespace & Route-Level Translation Chunking**: Never bundle all languages or strings into the main JavaScript bundle; split translations into per-locale, per-namespace JSON files loaded asynchronously on route demand.
- **CSS Logical Properties for RTL Support**: Mandate CSS logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline`) instead of physical directions (`left`, `right`) to support bidirectional (LTR/RTL) rendering without maintaining separate stylesheets.
- **ICU MessageFormat Standards**: Adopt ICU MessageFormat syntax for translation strings to handle dynamic pluralization rules, grammatical genders, and number/currency formatting cleanly without hardcoded client logic.
- **Dynamic Font Subsetting & Loading**: Load specialized language fonts (e.g. CJK, Arabic) dynamically with `font-display: swap` only when the active locale demands them to avoid inflating initial page weight for Latin-language users.

```typescript
// Lazy loading locale namespace on route entry
export async function loadLocaleNamespace(locale: string, namespace: string) {
  const messages = await import(`@/locales/${locale}/${namespace}.json`);
  i18nInstance.addResourceBundle(locale, namespace, messages.default, true, true);
}
```

- [More detail on CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- [More detail on ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

---

### Question 10993eee-4119-4598-ad0d-0e76a65645c2

- Why does the Compound Component pattern provide superior maintainability over single monolithic components with extensive boolean and render props?

### Answer

- **Inversion of Control (IoC)**: Compound components delegate layout structure and composition to the consumer while encapsulating state management and keyboard accessibility internally via React Context.
- **Elimination of Prop Explosion**: Monolithic components accumulate dozens of props (`headerRight`, `isFooterSticky`, `customBadgeRender`, `iconPlacement`) that violate the Open-Closed Principle and make the component brittle.
- **Flexible Composition without API Churn**: Consumers can reorder elements, add arbitrary intermediate wrappers, or omit optional elements without requesting changes or additions to the parent component API.
- **Caveat**: Context lookups add slight overhead; compound components must validate that child components are rendered within the expected parent provider context.

```typescript
const AccordionContext = createContext<{ openId: string; toggle: (id: string) => void } | null>(null);

export const Accordion = ({ children }: { children: React.ReactNode }) => {
  const [openId, setOpenId] = useState('');
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? '' : id));
  return <AccordionContext.Provider value={{ openId, toggle }}>{children}</AccordionContext.Provider>;
};

Accordion.Item = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion.Item must be used within Accordion');
  return <div className={ctx.openId === id ? 'expanded' : 'collapsed'}>{children}</div>;
};
```

- [More detail on React Context for Component Composition](https://react.dev/learn/passing-data-deeply-with-context)
- [More detail on Compound Component Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)

---

### Question d0e39587-2d50-4534-be95-c4f579e7b50a

- When architecting an enterprise design system, what are the architectural trade-offs between adopting headless UI primitives (e.g., Radix UI, React Aria) versus monolithic pre-styled libraries (e.g., MUI, Ant Design)?

### Answer

- **Separation of Behavior and Presentation**: Headless primitives provide fully tested WAI-ARIA accessibility, keyboard navigation, focus management, and touch interactions without coupling to an opinionated CSS runtime.
- **Zero Style Specification Battles**: Eliminates specificity wars, CSS-in-JS runtime overhead, and complex override patterns (`!important`, theme wrappers) common when customizing monolithic UI libraries.
- **Longevity Across Design Shifts**: Allows engineering teams to migrate styling architectures (e.g. Tailwind CSS, CSS Modules, Vanilla Extract) without touching or rewriting complex interaction and accessibility logic.
- **Trade-Off**: Headless primitives require a higher initial engineering investment to establish base styling tokens, typography, and default states compared to ready-made, styled component kits.

- [More detail on Radix UI Primitives](https://www.radix-ui.com/primitives)
- [More detail on React Aria Architecture](https://react-spectrum.adobe.com/react-aria/why-react-aria.html)

---

### Question 3572e138-be52-4a4a-99aa-5e993683b837

- How should frontend engineers categorize application state, and what criteria determine whether state belongs in the URL, server cache, global store, or local component?

### Answer

- **Server Cache State (TanStack Query / SWR)**: Asynchronous, remotely owned data; requires caching, background invalidation, deduplication, and garbage collection, and should never be manually mirrored in global client stores.
- **URL State (Query Params / Route Segments)**: State that must be shareable, bookmarkable, or resilient to page refresh (active filters, search terms, pagination offsets, tab keys); the URL must remain the single source of truth.
- **Global Client UI State (Zustand / Jotai)**: Cross-cutting, synchronous client-only state that spans multiple unrelated component subtrees (theme mode, sidebar collapse, modal managers).
- **Local Ephemeral State (`useState` / `useReducer`)**: State strictly consumed within a single component or leaf subtree (input focus, hover states, dropdown toggle); colocate as close to consumers as possible to avoid unnecessary parent re-renders.

- [More detail on Kent C. Dodds on Application State Management](https://kentcdodds.com/blog/application-state-management-with-react)
- [More detail on URL as Source of Truth](https://tanstack.com/router/latest/docs/framework/react/guide/search-params)

---

### Question a5495970-b0d6-48d2-b0aa-258507ef888b

- What architectural criteria dictate choosing an atomic state model (Jotai), a centralized single-store (Zustand / Redux), or a finite state machine (XState)?

### Answer

- **Atomic State (Jotai / Recoil)**: Best for complex, interconnected canvas or spreadsheet apps with hundreds of independent nodes; allows fine-grained re-renders of individual atoms without selector overhead or top-down store re-evaluations.
- **Centralized Single-Store (Zustand / Redux Toolkit)**: Best for standard business applications with predictable, global state transitions; offers centralized debugging, simple DevTools inspection, middleware, and minimal boilerplate.
- **Finite State Machines (XState)**: Mandatory for mission-critical workflows with complex interdependent states (payment processing, multi-step onboarding, media playback) to eliminate impossible states and race conditions declaratively.
- **Trade-Off**: Atomic stores can become hard to inspect globally if atom relationships are fragmented; state machines require significant upfront modeling effort.

- [More detail on XState State Machines](https://stately.ai/docs/xstate)
- [More detail on Zustand Documentation](https://zustand.docs.pmnd.rs/getting-started/introduction)

---

### Question 3d043e83-c4d6-4852-b436-c2d1402c6d13

- When does a normalized client cache (e.g., Apollo Client, Relay) justify its complexity over a document-level query cache (e.g., TanStack Query)?

### Answer

- **Normalized Cache (`id` + `__typename`)**: Flattens nested response objects into a relational graph dictionary; mutating an entity in one view automatically updates every other component displaying that entity across the entire app without refetching.
- **Normalization Overhead**: Requires strict universal ID conventions, complex manual cache updates for array modifications (adding/removing items from connection lists), and increases client-side memory usage.
- **Document Cache (TanStack Query)**: Stores data indexed by composite query keys (`['users', id]`); simple to conceptualize with zero relational mapping, but requires manual invalidation (`queryClient.invalidateQueries`) or imperative `setQueryData` for cross-query updates.
- **Architectural Guideline**: Default to document caching for 90% of applications; choose normalized caching only for highly relational applications with frequent, widespread cross-screen entity updates (e.g., social networks or project management suites).

- [More detail on Apollo Client Cache Normalization](https://www.apollographql.com/docs/react/caching/overview)
- [More detail on TanStack Query Caching Model](https://tanstack.com/query/latest/docs/framework/react/guides/caching)

---

### Question dc05f448-5873-49b2-96d6-c5c48d5ec124

- When architecting a real-time data ingestion layer, what technical trade-offs govern the decision between Server-Sent Events (SSE) and WebSockets?

### Answer

- **Server-Sent Events (SSE)**: Operates over standard HTTP/2 or HTTP/3; provides native auto-reconnection, `Last-Event-ID` message synchronization, firewall/proxy traversal, and connection multiplexing over a single TCP connection.
- **SSE Unidirectionality**: SSE is strictly server-to-client; client mutations must travel via standard HTTP POST/PUT requests, which is ideal for LLM streaming, live dashboards, and notification feeds.
- **WebSockets**: Provides full-duplex, bidirectional communication over a persistent TCP connection with low per-message framing overhead (2–10 bytes).
- **WebSocket Operational Overhead**: Requires custom heartbeat/ping-pong handlers, reconnection logic, load-balancer sticky sessions, and dedicated gateway infrastructure, bypassing HTTP/2 multiplexing.
- **Decision Guideline**: Prefer SSE for unidirectional streams (dashboards, notifications, AI token streams); use WebSockets for interactive bidirectional applications (chat, collaborative drawing, multiplayer gaming).

- [More detail on Server-Sent Events Specifications](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [More detail on WebSockets Architecture](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

### Question bc54f725-7ceb-41d0-89ac-77c0ed58fead

- Why does a layer-based directory structure (`/components`, `/hooks`, `/services`) fail to scale in multi-team codebases, and how does a Feature-Driven / Feature-Sliced structure solve it?

### Answer

- **Cognitive Overhead & Weak Boundaries**: Layer-based structures disperse related domain logic across distant folders; adding or refactoring a feature requires modifying files across multiple root directories, obscuring cohesion.
- **Feature-Driven Architecture**: Groups code by business domain (`src/features/billing/components`, `src/features/billing/api`, `src/features/billing/hooks`), encapsulating internal implementation details behind an explicit public API contract (`index.ts`).
- **Enforced Dependency Boundaries**: Allows automated lint rules (e.g. `eslint-plugin-boundaries`) to prohibit cross-feature private imports, preventing cyclic dependencies and architectural erosion over time.
- **Code Pruning & Ownership**: Entire unused or deprecated features can be deleted in a single directory removal without hunting down orphaned files across global folders.

- [More detail on Feature-Sliced Design Concepts](https://feature-sliced.design/docs/get-started/overview)
- [More detail on Modular Web Architecture](https://martinfowler.com/articles/modular-monolith.html)

---

### Question b3a38b44-a8fd-4abc-9cf3-188adb3581d3

- When is adopting a Micro-Frontend architecture an architectural anti-pattern, and under what specific conditions is it justified?

### Answer

- **When it is an Anti-Pattern (Most Teams)**: Adopted as a code organization solution rather than an organizational alignment solution; introduces duplicated shared dependencies, inconsistent UI/UX, fragile runtime module federation, complex cross-app routing, and massive CI/CD overhead.
- **When it is Justified**: Large enterprises (100+ engineers) with multiple autonomous, cross-functional teams that must build, test, and deploy completely decoupled business verticals independently without shared deployment bottlenecks.
- **The Pragmatic Alternative (Modular Monolith)**: A monorepo (Turborepo / Nx) with strictly enforced package boundaries (`packages/ui`, `packages/billing`), providing code isolation and independent team ownership while preserving unified build tooling, type-safety, and zero runtime federation penalties.

- [More detail on Micro Frontends Trade-Offs](https://martinfowler.com/articles/micro-frontends.html)
- [More detail on Monorepos with Turborepo](https://turbo.build/repo/docs/core-concepts/monorepos)

---

### Question 001fdb47-e0bf-4db6-a922-c034e5bc0bae

- How does a technical anchor execute a zero-downtime rewrite of a legacy frontend application to a modern framework using the Strangler Fig pattern?

### Answer

- **Reverse Proxy / Edge Routing**: Place an edge proxy (Cloudflare Workers, Nginx, or Next.js rewrites) in front of both legacy and modern applications under the same domain.
- **Incremental Route-by-Route Migration**: Route newly built pages or migrated endpoints to the modern application while proxying unmigrated routes to the legacy monolith.
- **Unified Authentication & Session Sharing**: Share authentication state via domain-scoped `HttpOnly` session cookies or shared token stores, allowing users to navigate seamlessly across legacy and modern pages without re-authenticating.
- **Telemetry & Feature Parity Verification**: Run end-to-end telemetry comparisons on migrated routes to ensure error rates, latency, and business metrics match or exceed legacy benchmarks before permanently decommissioning legacy routes.

- [More detail on Strangler Fig Application Pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [More detail on Edge Routing and Rewrites](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

### Question 86fc8ee9-9fc0-4008-945f-9020e333af54

- How does an RFC (Request for Comments) and ADR (Architecture Decision Record) process prevent architectural churn and maintain team alignment?

### Answer

- **Asynchronous Alignment & Exploration**: RFCs invite cross-team feedback, challenge assumptions, and uncover edge cases before implementation begins, preventing expensive rewrites and misaligned deliverables.
- **Immutable Context Documentation (ADRs)**: ADRs record the context, trade-offs, alternatives considered, and anticipated consequences of decisions in version control; future engineers understand *why* a choice was made rather than guessing or prematurely refactoring it.
- **De-Personalizing Technical Decisions**: Reframes architectural discussions around objective criteria (performance budgets, team skills, maintenance cost) rather than personal developer preferences.
- **Standardized Lightweight Template**: Keep ADRs short (Title, Status, Context, Decision, Consequences) to minimize documentation friction while maximizing historical clarity.

- [More detail on Architecture Decision Records](https://adr.github.io/)
- [More detail on Thoughtworks on ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)

---

### Question db631c3d-872b-4a2a-bcd5-990c1d9d1b8c

- How can a technical anchor enforce architectural layering and prevent illegal cross-module imports mechanically rather than relying on manual code review?

### Answer

- **Architectural Linting (`eslint-plugin-boundaries` / `dependency-cruiser`)**: Configure automated rules in CI that fail builds if feature modules import internal files from other features or if UI primitives import domain business logic.
- **TypeScript Project References**: Divide the codebase into isolated `tsconfig.json` modules with `composite: true` and explicit `references`, preventing unauthorized imports at compile time.
- **Node Package Exports Maps (`exports` in `package.json`)**: Whitelist public API entry points using package exports, rendering internal module files un-importable by consumer code.
- **Shift-Left Quality**: Enforces standards automatically on pre-commit or CI pull request checks, freeing code review time to focus on business logic and architecture rather than import policing.

```json
// .eslintrc.json using eslint-plugin-boundaries
{
  "plugins": ["boundaries"],
  "rules": {
    "boundaries/element-types": [
      2,
      {
        "default": "disallow",
        "rules": [
          { "from": "features", "allow": ["shared", ["features", { "featureName": "${from.featureName}" }]] },
          { "from": "shared", "allow": ["shared"] }
        ]
      }
    ]
  }
}
```

- [More detail on eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
- [More detail on TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

### Question 64d15df8-9204-47f7-bb85-f2bb61050762

- During code reviews, what criteria indicate that a `useEffect` hook is being misused for state synchronization, and what is the idiomatic architectural alternative?

### Answer

- **Anti-Pattern Symptoms**: Calling a state setter inside `useEffect` to sync with incoming props (`useEffect(() => { setFiltered(items.filter(...)) }, [items])`) or chaining effects where state change A triggers effect B which sets state C.
- **Performance & Glitch Hazards**: Causes redundant render passes, temporary UI flickering, stale state bugs, and potential infinite re-render loops.
- **Derived State during Render**: Calculate values directly in the component body or wrap in `useMemo` for expensive computations (`const filtered = useMemo(() => items.filter(...), [items])`).
- **Event Handler Execution**: Execute side effects (API calls, analytics, state updates) inside the user event handler (e.g. `onClick`) that triggered the interaction.
- **Key-Based State Resetting**: Reset component state upon entity ID change by passing a dynamic `key` prop (`<UserProfile key={userId} />`) to unmount and re-mount cleanly instead of manually resetting state inside an effect.

- [More detail on React Docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [More detail on Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)

---

### Question 539f0c01-f1bd-4d9c-a383-dbc43639828a

- When evolving a shared design system or core utility library, what multi-phase deprecation strategy minimizes disruption across consuming product teams?

### Answer

- **Phase 1: Non-Breaking Coexistence & JSDoc Deprecation**: Export the new API alongside the old API; mark legacy exports with `@deprecated` JSDoc annotations and development-only console warnings linking to migration documentation.
- **Phase 2: Automated AST Codemods (`jscodeshift`)**: Write and publish automated codemod scripts that parse ASTs and automatically refactor 90%+ of consumer call sites to the new API.
- **Phase 3: CI Lint Enforcement & Deadlines**: Introduce an ESLint rule flagging deprecated API usage as errors on new PRs, communicating a firm deprecation deadline via engineering town halls and release changelogs.
- **Phase 4: Removal in Major SemVer Release**: Remove the deprecated code in the next SemVer major release only after telemetry or repository audits verify zero remaining consumer call sites.

```typescript
/**
 * @deprecated Use `<Button variant="destructive">` instead. Will be removed in v3.0.
 */
export const DangerButton = (props: ButtonProps) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[DesignSystem] DangerButton is deprecated. Use <Button variant="destructive"> instead.');
  }
  return <Button variant="destructive" {...props} />;
};
```

- [More detail on jscodeshift](https://github.com/facebook/jscodeshift)
- [More detail on Semantic Versioning](https://semver.org/)
