# Web Worker

### Question e71c48b5-617a-4032-84cb-a212e0a1617e

- What are Web Workers, and what core problem do they solve in browser single-thread architecture?

### Answer

- **What the interviewer wants to hear**: Understanding of JavaScript's single-threaded nature, main thread blocking, UI rendering (60 FPS / 16.6ms frame budget), and offloading heavy tasks.
- **Answer**: JavaScript executes on a **single main thread**, which also handles rendering, DOM updates, and user input events. If a script executes long computations (e.g., image manipulation, large dataset sorting, heavy parsing), it **locks the main thread**, causing **frame drops (jank)** and poor **INP (Interaction to Next Paint)**. **Web Workers** allow running JavaScript code in **background threads** isolated from the main thread. They communicate back and forth via messaging (`postMessage` and `onmessage`), allowing **CPU-intensive work to execute concurrently without freezing the UI**.

- [More detail on the Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
---

### Question 374df91e-2f3a-4d48-b213-2febfe6de6b6

- What limitations and restricted APIs exist inside a Web Worker thread?

### Answer

- **What the interviewer wants to hear**: Awareness of thread isolation and security boundaries.
- **Answer**: Inside a Web Worker:
  - **No DOM Access**: You cannot access `document`, `window`, or direct DOM nodes.
  - **No Direct React State**: You cannot directly call `setState`, access React context, or read React refs.
  - **Supported APIs**: `fetch`/`XMLHttpRequest`, `WebSockets`, `IndexedDB`, `setTimeout`/`setInterval`, `crypto`, `location` (read-only), `navigator` (limited), and `OffscreenCanvas`.
  - **Global Scope**: The global scope is `self` (`DedicatedWorkerGlobalScope`), not `window`.

- [More detail on Functions and classes available to workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers)
---

### Question 13f2628e-3977-4675-a2f7-e0a40d8900a6

- How do you instantiate and manage a Web Worker lifecycle inside a React component or custom hook?

### Answer

- **What the interviewer wants to hear**: Clean lifecycle management (useEffect), preventing memory leaks, avoiding worker re-creation on re-renders, and thread cleanup (worker.terminate()).
- **Answer**: You should create the worker instance inside a **custom hook or `useEffect` combined with `useRef` or `useMemo`** so that the worker **persists across re-renders** and **terminates properly when unmounted**.

```tsx
export function useDataProcessorWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 1. Instantiate worker using URL syntax
    workerRef.current = new Worker(new URL("./processor.worker.ts", import.meta.url));
    // 2. Setup message listener
    workerRef.current.onmessage = (event: MessageEvent) => {
      setResult(event.data);
      setIsProcessing(false);
    };
    // 3. Cleanup on component unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runTask = (data: any) => {
    setIsProcessing(true);
    workerRef.current?.postMessage(data);
  };
  return { runTask, result, isProcessing };
}
```

- [More detail on the Worker interface](https://developer.mozilla.org/en-US/docs/Web/API/Worker)
- [More detail on useEffect](https://react.dev/reference/react/useEffect)
---

### Question 9d9c4ea7-24c1-488e-85a3-c7e58d549b8a

- What is the difference between Structured Clone Algorithm and Transferable Objects when sending data to a Worker?

### Answer

- **What the interviewer wants to hear**: Understanding memory overhead, copy vs. transfer, performance implications when passing large datasets in React apps.
- **Answer**:
  - **Structured Clone Algorithm (Default)**: **Deep-copies** data sent via `postMessage`. For very large payloads (e.g., 50MB array/JSON), this copying step runs on the main thread and can still cause a perceptible pause.
  - **Transferable Objects (Transferable)**: **Zero-copy byte transfer**. The memory address of objects like `ArrayBuffer`, `MessagePort`, or `ImageBitmap` is transferred ownership directly to the worker thread. Once transferred, the object becomes **zero-length and inaccessible on the main thread**.

- [More detail on Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
---

### Question 2df138c6-1f20-41ba-b84a-b7cd3a3cf4b5

- How do you instantiate a Web Worker in Next.js without causing SSR breakage or bundler build errors?

### Answer

- **What the interviewer wants to hear**: Knowledge of window/browser check for SSR, Webpack 5 / Turbopack native URL worker loader support, and dynamic import/client component constraints.
- **Answer**:
  - **SSR Guard**: Web Workers are **browser-only APIs** (`window`/`Worker` don't exist in Node.js server render). Worker instantiation must happen inside `'use client'` components within `useEffect` or behind a `typeof window !== 'undefined'` check.
  - **Bundler Native Standard**: Next.js (Webpack 5 & Turbopack) natively supports Web Worker bundling using standard ES module syntax without needing external loaders like `worker-loader`:
  ```tsx
  "use client";
  import { useEffect } from "react";
  export default function AnalyticsComponent() {
    useEffect(() => {
      // Webpack 5 / Turbopack automatically bundles worker.ts into a separate chunk
      const worker = new Worker(new URL("./analytics.worker.ts", import.meta.url));

      worker.postMessage("init");
      return () => worker.terminate();
    }, []);
    return <div>Client Analytics</div>;
  }
  ```

- [More detail on Webpack: Web Workers](https://webpack.js.org/guides/web-workers/)
---

### Question 2ccd4f35-2538-45e4-ad50-605129d43958

- How do Web Workers differ from Service Workers and Server Actions / API Routes in Next.js?

### Answer

- **Web Worker**

  - **Execution Env**: Browser client background thread
  - **Primary Purpose**: Offload CPU-heavy computation from main thread
  - **Lifespan**: Tied to tab/page session
  - **DOM Access**: No
  - **Network Access**: Yes (fetch)

- **Service Worker**

  - **Execution Env**: Browser network proxy thread
  - **Primary Purpose**: Offline capabilities, PWA support, caching strategy, push notifications
  - **Lifespan**: Persists across tabs and sessions
  - **DOM Access**: No
  - **Network Access**: Intercepts & handles network fetch requests

- **Next.js Server Action / API Route**

  - **Execution Env**: Node.js / Edge Server
  - **Primary Purpose**: Database queries, handling secret API keys, backend business logic
  - **Lifespan**: Per HTTP request / invocation
  - **DOM Access**: No
  - **Network Access**: Yes

- [More detail on the Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [More detail on Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
---

### Question 2b6fd270-81e7-444b-b85c-68db08a08f5a

- Your Next.js e-commerce app parses and filters a 50MB CSV/JSON dataset uploaded by an admin. The page stutters and drops INP metrics. How would you solve this using Web Workers?

### Answer

- **What the interviewer wants to hear**: Step-by-step architectural breakdown of problem diagnosis, solution implementation, UI state handling, and streaming/chunking.
- **Answer**:
  - **Identify Root Cause**: Parsing 50MB CSV in JS (`JSON.parse` or PapaParse on main thread) blocks layout/input processing for >500ms, severely degrading **TBT (Total Blocking Time)** and **INP**.
  - **Worker offloading**:
    - File input handler reads `File` object (or `ArrayBuffer`) in React.
    - Send raw data or `ArrayBuffer` to worker thread using **Transferables**.
  - Worker handles parsing, sorting, and filtering in background.
  - **Progressive UI Updates**: Worker sends batch updates (e.g., every 5,000 rows processed) back to React via `postMessage` so the component shows a real-time progress bar without UI freezing.
    **Cleanup**: Once completed, terminate or reuse worker instance in pool.

- [More detail on Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
---

### Question b80c249e-d3cc-4f5f-ae30-342a2c2807f8

- How do Web Workers impact Core Web Vitals (specifically INP and TBT)?

### Answer

- **What the interviewer wants to hear**: Connection between JavaScript execution time, main-thread blocking tasks (>50ms Long Tasks), and Google's performance metrics.
- **Answer**:
  - **TBT (Total Blocking Time)**: Measures total time between FCP and TTI where main thread was blocked by tasks > 50ms. Moving work to a Web Worker **reduces main thread task lengths to near 0ms**, directly reducing TBT.
  - **INP (Interaction to Next Paint)**: Measures latency of user interactions (clicks, keypresses). If the main thread is busy calculating data, user interactions queue up. Web Workers **keep the main thread free**, ensuring **instantaneous UI event handlers and feedback**.

- [More detail on Optimize INP](https://web.dev/articles/optimize-inp)
---

### Question 2a9f077e-f2c4-4892-8dac-3438d65161e7

- What is a SharedWorker, and how does it differ from a DedicatedWorker in a multi-tab React application?

### Answer

- **What the interviewer wants to hear**: Understanding of multi-tab communication, persistent connections, port-based messaging (MessagePort), and shared memory state.
- **Answer**:
  - **DedicatedWorker (`new Worker()`)**: Linked to a **single script execution instance in one browser tab**. When the tab closes, the worker is destroyed.
  - **SharedWorker (`new SharedWorker()`)**: Shared across **multiple browsing contexts** (tabs, windows, or iframes) from the **same origin**.
  - **Use Cases in React**:
    - **Single WebSocket Connection**: Maintaining one open WebSocket or SSE connection across 10 active tabs, multiplexing messages back to all React tabs.
    - **Cross-Tab State Synchronization**: Synchronizing dynamic state or cached data across tabs without relying on localStorage event polling.

```ts
// SharedWorker instantiation in React
useEffect(() => {
  const sharedWorker = new SharedWorker(new URL("./shared.worker.ts", import.meta.url));

  // SharedWorkers communicate through a MessagePort
  sharedWorker.port.start();

  sharedWorker.port.onmessage = (e) => {
    console.log("Received from shared worker:", e.data);
  };

  sharedWorker.port.postMessage({ type: "CONNECT_TAB" });

  return () => {
    sharedWorker.port.postMessage({ type: "DISCONNECT_TAB" });
  };
}, []);
```

- [More detail on SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)
---

### Question bee4896f-5cc1-46e1-9868-d818aa1111db

- How do you detect and propagate errors from inside a Web Worker to the main thread?

### Answer

- Main thread: **`worker.onerror`** fires for uncaught errors (with `message`, `filename`, `lineno`); `worker.onmessageerror` fires when a message cannot be deserialized.
- Inside the worker, wrap `onmessage` logic in **try/catch** and post a structured result (`{ ok: false, error }`) — an uncaught error leaves no promise to reject on the caller side.
- Listen for **`unhandledrejection`** inside the worker (`self.addEventListener("unhandledrejection", ...)`) so async failures don't vanish silently.

```javascript
// worker
self.onmessage = async (e) => {
  try {
    const result = await heavyTask(e.data);
    self.postMessage({ ok: true, result });
  } catch (err) {
    self.postMessage({ ok: false, error: err.message });
  }
};
```

- [More detail on the Worker interface](https://developer.mozilla.org/en-US/docs/Web/API/Worker)
- [More detail on the unhandledrejection event](https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event)

---

### Question 35a71f87-0c72-491a-a523-1929d3512d12

- Which values cannot be structured-cloned when posted to a Worker, and which lose behavior silently?

### Answer

- **Throws `DataCloneError`**: functions, DOM nodes, live handles (`WebSocket`) — anything with behavior or native state.
- **Silently loses behavior**: class instances arrive as **plain objects** — prototype chain, methods, and getters are gone (`instanceof MyModel` is `false` on the other side). Send DTOs or rehydrate explicitly.
- **Cloneable**: primitives, plain objects/arrays, `Map`/`Set`, `Date`, `RegExp`, `Error`, `Blob`/`File`, and `ArrayBuffer` (copy or transfer).

- [More detail on the structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- [More detail on Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)

---

### Question dd132888-bffe-46f5-8e55-a89ac8ed20ec

- What problem does Comlink solve over raw `postMessage` for Worker communication?

### Answer

- Raw `postMessage` forces a hand-rolled protocol: message `type` strings, switch statements, and manual wiring for every method.
- **Comlink exposes/imports async APIs via `Proxy`**: `Comlink.expose(api, self)` in the worker, `const api = Comlink.wrap(worker)` on the main thread — calling `api.parse(csv)` returns a promise and marshals arguments/results automatically (structured clone and transferables underneath).
- It removes boilerplate without changing the messaging model — still clone-based, not shared memory.

- [More detail on Comlink](https://github.com/GoogleChromeLabs/comlink)
- [More detail on Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)

---

### Question 93de5315-a540-4104-8c85-696fd39ab441

- Spawning a fresh Worker per task is slow. When and how should you build a Worker pool?

### Answer

- Every `new Worker` costs **script fetch + parse + thread spawn** (tens of milliseconds); one worker per keystroke or per row destroys the latency you offloaded work to save.
- Pool pattern: create **`Math.min(navigator.hardwareConcurrency - 1, maxWorkers)`** warm workers at startup, keep a task queue, hand each job to an idle worker, and return it on completion.
- Add an **idle timeout** (`setTimeout` → `worker.terminate()`) to release memory when demand drops.

- [More detail on navigator.hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency)
- [More detail on the Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

---

### Question f167a483-45c4-4432-ac30-fb4d257a13d1

- How do you move canvas rendering off the main thread?

### Answer

- Main thread: `canvas.transferControlToOffscreen()` hands the canvas to an **`OffscreenCanvas`** living in a worker; the DOM canvas becomes a display surface only.
- The worker gets a normal `2d`/`webgl` context and renders — including its own `requestAnimationFrame` loop — entirely **off the main thread**, immune to main-thread jank.
- Input still arrives on the main thread: forward pointer events/coordinates via `postMessage`; render commands travel the other way.

- [More detail on OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [More detail on the Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

---

### Question 3db0a667-5a55-4d02-9fd7-26bc75e93fa6

- How does SharedArrayBuffer + Atomics differ from `postMessage` for worker-to-worker data sharing?

### Answer

- **`postMessage` copies** (or transfers ownership) — workers never see the same bytes; every exchange is a message round trip.
- **`SharedArrayBuffer` maps the same memory** into multiple workers: zero-copy reads/writes with no serialization — the basis for multithreaded Wasm and lock-free pipelines.
- Coordination must be explicit: **`Atomics.wait` / `Atomics.notify`** block and wake threads safely; without atomics you get data races. The API requires **cross-origin isolation** (COOP + COEP headers).

- [More detail on SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [More detail on Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics)

---

### Question 59502c0b-cfde-48b2-953a-a228717a74f2

- How do you debug code running inside a Web Worker in Chrome DevTools?

### Answer

- The **Sources panel thread list** shows every dedicated/shared worker as its own execution context — select it to set breakpoints, inspect scope, and use a console scoped to the worker.
- `console.log` from the worker prints in the main console tagged with its worker; `debugger;` statements pause the worker like main-thread code.
- The **Application panel** lists service workers/shared workers with per-instance DevTools windows, plus stop/restart controls.

- [More detail on debugging Workers in DevTools](https://developer.chrome.com/docs/devtools/javascript/sources#workers)
- [More detail on the Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

---
