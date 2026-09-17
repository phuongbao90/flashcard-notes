# Browser Internals

### Question 34b13dac-5877-49dc-83ab-b32328c325d8

- What is the multi-process architecture of modern browser engines (Chromium), and how do processes communicate safely via Mojo IPC?

### Answer

- **Browser Process**: Privileged coordinator managing the browser chrome (address bar, bookmarks, navigation buttons), disk storage, network streams, and lifecycle of child processes.
- **Renderer Process**: Unprivileged, sandboxed process responsible for HTML, CSS, and JavaScript execution via Blink and V8. Typically allocated per site instance under Site Isolation.
- **GPU Process**: Dedicated process executing GPU rasterization, composite draw calls, and hardware-accelerated 3D graphics across multiple renderers.
- **Utility and Network Processes**: Independent isolated processes handling network protocol stacks, audio decoding, and storage subsystems.
- **Mojo IPC**: Cross-platform message-passing framework using operating system pipes with strongly-typed interfaces defined via IDL files. Restricts untrusted renderer processes from executing arbitrary OS system calls directly.

- [More detail on Chromium Multi-process Architecture](https://developer.chrome.com/blog/inside-browser-part1)
- [More detail on Mojo IPC](https://chromium.googlesource.com/chromium/src/+/main/docs/mojo_ipc_conversion.md)

---

### Question 081295b6-6045-4f24-9e39-7ccc0c358565

- How does Site Isolation enforce security boundaries for cross-origin iframes using Out-of-Process iframes (OOPIF)?

### Answer

- **Site Isolation**: Enforces process boundaries based on site origins (scheme + eTLD+1), guaranteeing that documents from different origins never share memory space in the same OS process.
- **Out-of-Process iframes (OOPIF)**: Cross-origin `<iframe>` elements do not execute in their parent document's renderer process. The browser spawns a dedicated renderer process for the embedded origin.
- **Spectre mitigation**: Prevents malicious origins from reading sensitive in-memory data (passwords, tokens, rendered content) across origins via CPU speculative execution cache-timing side-channels.
- **Compositor integration**: The parent renderer renders an invisible placeholder `RenderWidgetHostView`, while the browser and GPU processes composite the child iframe's draw quads into the correct visual position.

- [More detail on Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/)
- [More detail on Mitigating Spectre in Web Browsers](https://developer.chrome.com/blog/site-isolation/)

---

### Question 4888273f-703f-41ec-b28d-4216438fdb4d

- What are the sequential steps executed across browser and renderer processes during a page navigation from URL submission to First Paint?

### Answer

- **1. Input & URL Resolution**: Browser Process UI thread parses the address bar input; if a URL, it signals the Network Service to initiate DNS lookup, TCP handshake, and TLS negotiation.
- **2. Response Evaluation**: Network Service inspects HTTP response headers (`Content-Type`, `Content-Security-Policy`, redirects). If `text/html`, navigation proceeds; file downloads hand off to the download manager.
- **3. Process Allocation**: Browser Process evaluates Site Isolation rules to determine whether to reuse an existing renderer process or spawn a fresh sandboxed Renderer Process.
- **4. Commit Navigation**: Browser Process sends an IPC message to the renderer passing ownership of the document stream. Browser UI updates (URL bar, navigation history, security padlock).
- **5. Document Loading & First Paint**: Renderer parses HTML, builds DOM/CSSOM, dispatches preloads, computes Layout, produces Paint display lists, and sends compositor frames to the GPU for presentation.

- [More detail on Browser Navigation Flow](https://developer.chrome.com/blog/inside-browser-part2)

---

### Question 1bf38885-ef71-4fbe-902a-e0f44d9555b0

- How does the browser network engine handle HTTP 103 Early Hints, and what performance advantage does it provide over standard HTTP responses?

### Answer

- **HTTP 103 Early Hints**: An informational HTTP status code sent by an origin server while it is still computing the final HTML response (e.g. database lookups, server-side rendering).
- **Header inspection**: Response contains `Link: </style.css>; rel=preload; as=style` headers before the final `200 OK` response headers arrive.
- **Speculative warming**: The browser network engine immediately initiates DNS pre-resolution, TLS connection warming, and parallel subresource downloads during server compute time.
- **Zero wasted work**: When the subsequent `200 OK` payload arrives, preloaded stylesheets and critical fonts are already downloaded or in flight, drastically reducing LCP and render-blocking delays.

- [More detail on HTTP 103 Early Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103)
- [More detail on Loading Performance with Early Hints](https://developer.chrome.com/docs/web-platform/early-hints)

---

### Question 8c52145e-1952-4b06-8aae-d2f89bb3391b

- Why cannot HTML be parsed with a standard context-free LL(k) or LR(k) parser, and how does the HTML5 state machine handle re-entrant execution?

### Answer

- **Dynamic re-entrancy**: Synchronous JavaScript execution via `<script>` or `document.write()` can inject raw markup strings directly into the unconsumed input stream while parsing is in progress.
- **Spec-defined error tolerance**: HTML never throws fatal syntax errors on invalid syntax (e.g., mismatched nesting, unclosed tags). The HTML5 parser implements explicit error-recovery algorithms like the adoption agency algorithm.
- **State machine**: Operates in two tightly coupled stages: **Tokenization** (converting character streams into StartTag, EndTag, Comment, and Character tokens) and **Tree Construction** (updating the DOM tree based on the current insertion mode).
- **Parser yielding**: Encountering an inline or external synchronous `<script>` forces the parser to pause tree construction and wait for the script to download and execute against the current DOM state.

- [More detail on HTML5 Parsing Specification](https://html.spec.whatwg.org/multipage/parsing.html#parsing)
- [More detail on How Browsers Work: Parsing](https://web.dev/articles/howbrowserswork#parsing_general)

---

### Question 5b3836b3-4875-4004-806f-3539662074c8

- How does the browser Preload Scanner discover and download resources while the main HTML parser is blocked on synchronous scripts?

### Answer

- **Secondary tokenizer**: The **Preload Scanner** is an independent, lightweight thread running speculatively ahead on incoming raw HTML network byte streams.
- **Token inspection**: Scans for resource-bearing attributes (`<link rel="stylesheet">`, `<script src="...">`, `<img src="...">`) while the main thread parser is paused waiting on synchronous JavaScript.
- **Early dispatch**: Dispatches parallel network requests through the Network Service with appropriate internal priorities before the main parser encounters the tags.
- **Limitation**: The Preload Scanner does not construct a DOM tree or execute JavaScript; resources referenced inside CSS (`background-image: url(...)`), inline JS (`fetch()`, dynamic `import()`), or dynamically injected elements cannot be discovered until executed.

- [More detail on Preload Scanner Mechanics](https://web.dev/articles/preload-scanner)

---

### Question 498cd580-82c5-4216-8434-1f22ecf66347

- Why does CSSOM construction block JavaScript execution, and why does an external stylesheet indirectly block DOM parsing when followed by a `<script>` tag?

### Answer

- **Render-blocking CSS**: Browsers do not paint partial styles; the **CSSOM** must be completely built before constructing the Render Tree to avoid Flash of Unstyled Content (FOUC).
- **Script dependency on CSSOM**: JavaScript can query computed element styles at any moment (e.g., `window.getComputedStyle(el).color`). If a script ran before preceding CSS was parsed, it would receive stale or undefined style data.
- **Indirect DOM blocking**: CSSOM construction itself does **not** block HTML parsing. However, if an external `<link rel="stylesheet">` is followed by a `<script>`, the browser pauses script execution until the stylesheet downloads and builds the CSSOM. Consequently, that script pauses the HTML parser, indirectly blocking DOM construction.

- [More detail on Critical Rendering Path and CSSOM](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [More detail on Render-Blocking CSS](https://web.dev/learn/performance/understanding-the-critical-path)

---

### Question ac20e156-6db5-467a-9a6d-f3d3c0e84e71

- What is the difference between the DOM Tree, Render Tree, and Layout Tree, and how are elements with `display: none` vs `display: contents` represented?

### Answer

- **DOM Tree**: Complete in-memory node representation of the parsed HTML document, including `<head>`, `<script>`, comments, and non-visual elements.
- **Render / Layout Tree**: Visual tree of rectangular formatting boxes created by combining DOM elements with resolved CSSOM computed styles.
- **`display: none`**: Completely omitted from the Render/Layout tree along with all descendants; generates no layout boxes or paint records.
- **`visibility: hidden`**: Included in the Layout tree and consumes physical geometric space; omitted only during the Paint phase.
- **`display: contents`**: The element itself generates no layout box, but its children are promoted to the layout tree as direct layout children of the element's parent.
- **Generated content**: Pseudo-elements (`::before`, `::after`) exist in the Layout Tree as generated visual boxes even though they are absent from the DOM Tree.

- [More detail on Layout Tree and Box Model](https://developer.chrome.com/blog/inside-browser-part3#layout)

---

### Question bab45812-f5f3-4c13-bd6a-910802b57467

- How does the browser Layout engine calculate geometries using Formatting Contexts, and why is layout computation computationally expensive?

### Answer

- **Geometry calculation**: Layout converts visual nodes into rectangular bounding boxes with physical coordinates (x, y, width, height) relative to their parent or viewport.
- **Formatting Contexts**: Layout engines partition rules into formatting contexts: **BFC** (Block Formatting Context), **IFC** (Inline Formatting Context), **Flexbox**, and **Grid**.
- **Intrinsic sizing passes**: Sizing requires recursive parent-child tree traversals. Min-content and Max-content calculations require visiting descendant nodes before parents can establish final sizes.
- **Algorithmic complexity**: In standard documents, layout has $O(N)$ complexity where $N$ is the number of rendered DOM nodes. Complex nested flex/grid layouts with indefinite sizing can degrade toward $O(N^2)$ due to multiple speculative measurement passes.

- [More detail on Block Formatting Contexts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Block_formatting_context)
- [More detail on Modern Browser Layout](https://www.chromium.org/developers/design-documents/layout-team/layoutng/)

---

### Question 12a794fd-3602-4433-b849-7a2ba178e35b

- What engine mechanism causes Forced Synchronous Layout (Layout Thrashing), and how can it be diagnosed in performance traces?

### Answer

- **Deferred batching**: Browsers normally queue DOM write mutations and defer layout recalculation until the end of the current task or frame.
- **Forced flush**: When JavaScript queries a geometric property (`offsetWidth`, `clientHeight`, `getBoundingClientRect()`, `scrollTop`) after a DOM mutation, the engine cannot return the value from cache; it must synchronously execute Style Recalculation and Layout mid-frame.
- **Thrashing loop**: Reading geometry and writing styles alternately inside a loop forces the engine to recalculate layout repeatedly for every iteration, causing severe frame drops and high INP.
- **Diagnostics**: Chrome DevTools Performance panel flags these events as bright purple/red "Forced Reflow" or "Layout Thrashing" warnings with call stacks pinpointing the offending read line.

```javascript
// BAD: Forces layout recalculation on every iteration
cards.forEach(card => {
  const height = card.offsetHeight; // FORCED READ (flushes layout)
  card.style.height = `${height + 20}px`; // WRITE
});

// GOOD: Batch all reads before executing writes
const heights = cards.map(card => card.offsetHeight); // Single READ pass
cards.forEach((card, i) => {
  card.style.height = `${heights[i] + 20}px`; // Single WRITE pass
});
```

- [More detail on Avoiding Layout Thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- [More detail on Properties that Trigger Layout](https://csstriggers.com/)

---

### Question b6534165-c3a5-426f-8e8d-261679809a96

- How does the browser Paint engine convert layout boxes into Display Lists, and how do CSS Stacking Contexts dictate paint order?

### Answer

- **Paint Records (Display List)**: Painting does not generate screen pixels directly; it produces a serialized list of 2D drawing commands (e.g., `drawRect`, `drawText`, `clipPath`) called Paint Records.
- **Tree traversal order**: Painting does not follow DOM tree hierarchy; it traverses nodes according to **CSS Stacking Contexts**.
- **Stacking Context hierarchy**:
  1. Background and borders of the root element.
  2. Descendant stacking contexts with negative `z-index`.
  3. Non-inline, non-positioned block-level descendants.
  4. Non-positioned floats.
  5. In-flow inline descendants (text nodes).
  6. Descendant stacking contexts with `z-index: 0` or `auto`.
  7. Descendant stacking contexts with positive `z-index`.
- **Optimization**: Display lists can be cached and incrementally invalidated; moving an element along the screen allows existing paint records to be replayed at an offset without re-running paint code.

- [More detail on The Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)
- [More detail on Painting in Blink](https://developer.chrome.com/blog/inside-browser-part3#paint)

---

### Question 9c8e22fb-d1f2-412d-ab6d-5b02bc118ee6

- What criteria cause the browser engine to promote an element to its own GraphicsLayer (Compositor Layer), and how does this bypass the Main Thread?

### Answer

- **Layer promotion triggers**:
  - CSS 3D transforms (`transform: translate3d(...)`, `translateZ(0)`).
  - Explicit optimization hints (`will-change: transform`, `will-change: opacity`).
  - Native hardware elements (`<video>`, WebGL `<canvas>`).
  - Active CSS animations on `transform`, `opacity`, or `filter`.
  - Overlap with an underlying composited layer (implicit promotion).
- **Off-main-thread updates**: Once promoted, mutations to `transform` and `opacity` do not require Main Thread Style, Layout, or Paint recalculation.
- **Compositor manipulation**: The Compositor Thread updates layer transformation matrices directly and dispatches draw quads to the GPU, maintaining 60/120fps animations even if the Main Thread is locked by JavaScript.

- [More detail on GPU Accelerated Compositing](https://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome/)
- [More detail on Stick to Compositor-Only Properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)

---

### Question 0d88e9a0-9ab8-4aba-998e-e7e04cc16dd4

- What are the performance costs and failure modes of overusing `will-change: transform` or triggering uncontrolled layer promotion?

### Answer

- **VRAM exhaustion**: Each promoted GraphicsLayer allocates dedicated GPU backing textures (bitmaps) sized to the layer's bounding box. Multiplying layers consumes hundreds of megabytes of video memory.
- **Layer Squashing & Explosion**: When an unpromoted element overlaps a promoted element, the engine must either promote the overlapping element too ("overlap promotion") or squash layers, causing massive compositor recalculations.
- **Rasterization overhead**: Uploading large texture bitmaps across the PCI-e bus to GPU memory introduces significant memory transfer latency.
- **Best Practice**: Apply `will-change` sparingly and remove it after animations finish. Never apply `will-change: transform` universally across component selectors (e.g., `* { will-change: transform; }`).

- [More detail on will-change CSS Property](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [More detail on The Cost of Memory Pressure in Web Apps](https://web.dev/articles/rendering-performance)

---

### Question 162c9d96-cf84-4069-b4fe-80f6f6f15df2

- How does the Compositor Thread divide GraphicsLayers into Tiles and coordinate with Raster Threads and Viz to draw pixels?

### Answer

- **Tiling**: A GraphicsLayer can be huge (e.g., a 10,000px tall scrolling page). Storing the entire layer as a single GPU texture would exceed VRAM limits. The compositor splits each layer into smaller **Tiles** (typically 256x256 or 512x512 pixels).
- **Raster Threads**: The Compositor Thread coordinates an internal pool of background worker **Raster Threads** to convert the Paint Records within each tile into compressed pixel bitmaps.
- **Viewport prioritization**: Tiles intersecting or immediately adjacent to the current viewport are rasterized first; distant offscreen tiles are rasterized lazily during idle cycles.
- **Draw Quads & Viz**: Once rasterized, the Compositor Thread generates **Draw Quads** (bounding boxes with texture handles) wrapped in a **CompositorFrame**, which is submitted via IPC to the **Viz** service in the GPU Process to display on screen.

- [More detail on Compositor Architecture](https://developer.chrome.com/blog/inside-browser-part3#compositing)
- [More detail on Viz Architecture in Chromium](https://chromium.googlesource.com/chromium/src/+/main/components/viz/README.md)

---

### Question 0ee498fd-8004-40a8-a9b8-38e7d3bd8fb5

- Why do non-passive `wheel` and `touchstart` event listeners cause scrolling jank, and how does `{ passive: true }` resolve the issue in the Compositor Thread?

### Answer

- **Slow Scroll Regions**: The Compositor Thread can scroll pages independently off the Main Thread. However, if a touch/wheel listener is registered without `passive: true`, the engine cannot scroll immediately because JavaScript might call `event.preventDefault()`.
- **Main-Thread lock**: The compositor must pause scroll updates and wait for the Main Thread to run the event listener to completion. If the Main Thread is busy with JavaScript, scrolling freezes (jank).
- **`{ passive: true }` guarantee**: Tells the browser engine that the listener will **never** call `event.preventDefault()`.
- **Immediate compositor scrolling**: The Compositor Thread immediately scrolls the viewport on the GPU without blocking, and dispatches the event asynchronously to the Main Thread. Modern browsers treat `touchstart` and `wheel` on `window` and `document` as passive by default.

```javascript
// Prevents Main Thread blocking during touch scrolling
window.addEventListener("touchstart", handleTouch, { passive: true });
```

- [More detail on Passive Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive)

---

### Question 263929c1-06ec-4cdc-b13e-a753b2fabebc

- How does JavaScript code progress through the V8 multi-tier execution engine from raw source to optimized machine code?

### Answer

- **Parser & AST**: Raw JS source strings are parsed into an **Abstract Syntax Tree (AST)** and scope allocation tree.
- **Ignition (Interpreter)**: Compiles the AST into compact register-based **Bytecode**. Starts execution almost instantly with minimal startup memory footprint and collects runtime type feedback.
- **Sparkplug (Baseline Compiler)**: Compiles Ignition bytecode directly into non-optimizing native machine code without performing speculative optimizations. Runs fast compilation to boost execution speed before optimization tiers.
- **Maglev (Mid-Tier Compiler)**: Generates high-performance machine code in hundreds of milliseconds, sitting between Sparkplug and TurboFan to smooth CPU spikes.
- **TurboFan (Optimizing Compiler)**: Hot functions with consistent type feedback are passed to TurboFan. It uses speculative optimization (inlining, loop unrolling, type specialization) to generate highly optimized machine code.

- [More detail on V8 Engine Pipeline](https://v8.dev/docs)
- [More detail on Maglev - V8's Mid-Tier Compiler](https://v8.dev/blog/maglev)

---

### Question cd2a9560-0887-49c3-9808-6e5986d1e13f

- What causes V8 TurboFan to deoptimize (bail out) compiled machine code, and what runtime penalty occurs?

### Answer

- **Speculative assumptions**: TurboFan generates native machine code based on speculative assumptions derived from Ignition's type feedback (e.g., assuming a function parameter is always a 31-bit Small Integer `Smi`).
- **Assumption invalidation**: If the function is invoked with an unexpected type (e.g., passing a string or object where an integer was assumed), the optimized machine code hits a **deoptimization bailout checkpoint**.
- **State reconstruction**: The engine pauses execution, reconstructs the call frame back into Ignition interpreter registers, and falls back to executing bytecode in Ignition.
- **Performance penalty**: Deoptimization incurs expensive CPU overhead (rebuilding call frames, discarding optimized code). If a function repeatedly deoptimizes and re-optimizes, V8 marks it as deopt-heavy and stops compiling it with TurboFan.

```javascript
// Triggers deoptimization bailout in TurboFan
function compute(val) {
  return val.x + 1; // TurboFan assumes shape containing { x: int }
}
for (let i = 0; i < 10000; i++) compute({ x: 1 }); // Optimized
compute({ x: "string" }); // DEOPTIMIZED! Assumption violated.
```

- [More detail on V8 Deoptimization Internals](https://mathiasbynens.be/notes/shapes-ics)
- [More detail on TurboFan Optimizations](https://v8.dev/blog/turbofan-jit)

---

### Question c4c7e98f-5ca2-4d08-ab3a-89d89e61862a

- How do V8 Hidden Classes (Shapes/Maps) represent JavaScript objects in memory, and what operations force objects into Dictionary Mode (slow mode)?

### Answer

- **Hidden Classes (Maps)**: JavaScript lacks static C++/Java object layouts. V8 assigns an internal `Map` descriptor to each object, storing fixed property offsets, transitions, and prototype pointers.
- **Transition trees**: Adding properties in sequence creates transition edges (`Map0` -> `Map1(x)` -> `Map2(x, y)`). Objects instantiated with the exact same properties in the **same order** share the same hidden class.
- **Order mismatch**: Instantiating objects with the same properties in different orders creates distinct transition trees and diverging hidden classes, reducing optimization sharing.
- **Dictionary Mode (Hash Table)**: Deleting properties via `delete obj.prop` or adding an excessive number of dynamic properties invalidates the hidden class transition tree. V8 converts the object to a self-contained string hash table, permanently slowing property reads and writes.

```javascript
// Fast: Shared Hidden Class (Same property initialization order)
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
const p1 = new Point(1, 2);
const p2 = new Point(3, 4);

// Slow: delete mutates object into Dictionary Mode
delete p1.x; // p1 drops out of hidden class optimization!
```

- [More detail on JavaScript Engine Fundamentals: Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics)
- [More detail on V8 Hidden Classes](https://v8.dev/blog/fast-properties)

---

### Question 93bb9035-3ac5-4c9c-abf9-3d3a9bc7afb6

- What are the states of an Inline Cache (IC) in V8, and why do megamorphic call sites degrade application performance?

### Answer

- **Inline Cache (IC)**: Optimization mechanism that caches property memory offsets directly at the call-site bytecode instruction to bypass repeated hidden class lookups.
- **Monomorphic (Fastest)**: The call-site has encountered exactly **one** hidden class. The property offset is inlined into machine code with a single shape-equality check.
- **Polymorphic (Fast)**: The call-site encounters 2 to 4 distinct hidden classes. V8 uses a small linear lookup table comparing the object's map against cached entries.
- **Megamorphic (Slowest)**: The call-site encounters 5 or more distinct hidden classes. V8 abandons local inlining and routes lookups through a global stub cache or generic hash table lookup.
- **Impact on hot code**: Functions repeatedly invoked with heterogeneously shaped objects (e.g., passing varied config objects to a utility function) enter megamorphic states, preventing TurboFan inlining and slowing execution by up to an order of magnitude.

- [More detail on Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics)
- [More detail on Polymorphic and Megamorphic ICs](https://mathiasbynens.be/notes/prototypes)

---

### Question 7f0bd609-ea6b-4cbb-97b0-25e164178289

- How does the V8 Garbage Collector partition the heap into generational spaces, and how do Minor GC (Scavenger) and Major GC (Orinoco) operate?

### Answer

- **Generational Hypothesis**: Most objects die young. V8 divides the heap into **New Space** (1–64 MB, holding recently allocated objects) and **Old Space** (surviving objects).
- **Minor GC (Scavenger)**:
  - New Space is split into **Eden**, **From-Space**, and **To-Space**.
  - Allocations occur in Eden. During Scavenge, Cheney's copying algorithm copies reachable objects from Eden/From-Space into contiguous memory in To-Space.
  - Objects that survive two Minor GC cycles are **promoted (tenured)** to Old Space.
- **Major GC (Orinoco - Mark-Sweep-Compact)**:
  - **Marking**: Identifies reachable live objects from root pointers. Uses **Concurrent Marking** on background worker threads to avoid stopping the main thread.
  - **Sweeping**: Traverses dead memory blocks and returns them to free lists using background worker threads.
  - **Compaction**: Evacuates and reorganizes fragmented live objects in Old Space to eliminate memory fragmentation.

- [More detail on V8 Garbage Collection](https://v8.dev/blog/trash-talk)
- [More detail on Concurrent Marking in V8](https://v8.dev/blog/concurrent-marking)

---

### Question b6d1226f-1c7b-4e7a-a26d-6713631471f6

- What causes a Detached DOM Tree memory leak in browser engines, and how can it be diagnosed using Chrome DevTools Heap Snapshots?

### Answer

- **Native DOM vs JS wrappers**: DOM elements are native C++ Blink objects (`Element`). When JavaScript interacts with a DOM node, V8 creates a JS wrapper object (`v8::DOMWrapper`).
- **Detached state**: A DOM node removed from the active document tree via `removeChild()` or `innerHTML = ""` is detached. If no JavaScript references point to it, Blink destroys the native C++ node and V8 cleans the wrapper.
- **The leak**: If a long-lived JavaScript object (global cache, closure, event listener on `window`, React ref) retains a reference to even a **single** detached child node, the entire native C++ DOM subtree (ancestors, siblings, children, event listeners) is retained in memory.
- **Diagnosis**: Take a Heap Snapshot in Chrome DevTools Memory panel. Filter class names by `Detached HTMLElement` or `Detached HTMLDivElement`. Expanding the retaining tree highlights the exact JS variable or closure pinning the native tree.

```javascript
// Memory Leak: Retaining detached DOM nodes in JS memory
const cache = [];
function removeCard() {
  const card = document.getElementById("profile-card");
  card.parentNode.removeChild(card);
  // LEAK: Pinned in JS array; entire DOM subtree remains in RAM
  cache.push(card);
}
```

- [More detail on Fixing Memory Leaks with DevTools](https://developer.chrome.com/docs/devtools/memory-problems)
- [More detail on Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)

---

### Question 7a642620-9b75-4b9e-952f-c83874532470

- What is the exact execution order within a single browser event loop turn when a rendering opportunity occurs?

### Answer

- **1. Task (Macrotask) Execution**: The event loop selects and executes the oldest runnable task from task queues (e.g. `setTimeout`, input event, network response).
- **2. Drain Microtask Queue**: Drains all microtasks (`Promise.then`, `queueMicrotask`, `MutationObserver`) until the microtask queue is completely empty.
- **3. Rendering Opportunity Check**: If display refresh VSync signal matches (e.g., every 16.6ms for 60Hz displays) and document is visible:
  - Run **`Window.requestAnimationFrame()`** callbacks.
  - Recalculate **Style** (compute CSSOM changes).
  - Compute **Layout** (geometric dimensions and positions).
  - Execute **Paint** (create Paint Records / display lists).
  - Hand over layers to Compositor Thread.
- **4. Idle Period**: If time remains before the next VSync deadline, execute **`requestIdleCallback()`** callbacks.
- **5. Repeat**: Poll for the next runnable task.

- [More detail on Event Loops in HTML Specification](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
- [More detail on In The Loop by Jake Archibald](https://www.youtube.com/watch?v=cCOL7MC4Pl0)

---

### Question 3e794432-4c69-497b-88a4-d1d712f23f54

- Why does an infinite microtask chain lock the browser UI without throwing a Maximum Call Stack Size Exceeded error?

### Answer

- **Stack clearing vs Queue draining**: A call stack overflow (`RangeError`) only occurs during synchronous recursion where new stack frames are pushed faster than they return. Microtask callbacks run after the synchronous call stack has already unwound to depth zero.
- **Exhaustion requirement**: The HTML event loop specification mandates that the **Microtask Queue must be drained to zero** before the event loop can proceed to UI rendering or process subsequent macrotasks.
- **Starvation trap**: If a microtask continuously schedules another microtask (`Promise.resolve().then(...)` or `queueMicrotask`), the engine stays in an infinite loop draining microtasks.
- **Failure symptom**: The browser tab completely freezes. Paint updates, CSS animations, mouse clicks, and keyboard inputs are ignored because the event loop never reaches the rendering phase or user input task queues.

```javascript
// FREEZES TAB: Starves rendering and user inputs indefinitely
function starve() {
  Promise.resolve().then(starve);
}
starve();
```

- [More detail on Microtasks and the JavaScript Runtime Environment](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)
- [More detail on Tasks, Microtasks, Queues and Schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)

---

### Question 3d9c5353-550b-4934-a0f5-e46d459dc0d8

- How do `scheduler.yield()` and `scheduler.postTask()` improve Interaction to Next Paint (INP) compared to `setTimeout(fn, 0)`?

### Answer

- **`setTimeout(fn, 0)` limitations**: Schedules a macrotask with a minimum 4ms clamping penalty after 5 nested calls. It enters the generic task queue behind unrelated background work and cannot prioritize input processing.
- **`scheduler.yield()`**: Pauses a long-running computation and yields control back to the event loop. The remaining work is queued at the front of the same priority queue, allowing browser rendering and high-priority input handling to run immediately before resuming computation.
- **`scheduler.postTask()` Priorities**:
  - `user-blocking`: Critical operations directly impacting user interactions (highest priority).
  - `user-visible`: Default rendering and data fetching operations.
  - `background`: Non-urgent operations (analytics, prefetching, cache warming).
- **Task cancellation**: Both APIs integrate with standard `AbortController` / `AbortSignal`, enabling tasks to be discarded instantly if a user navigates away.

```javascript
async function parseLargeList(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);
    // Yield to main thread every 50 items to keep INP < 200ms
    if (i % 50 === 0 && "scheduler" in window && "yield" in scheduler) {
      await scheduler.yield();
    }
  }
}
```

- [More detail on Prioritized Task Scheduling API](https://developer.mozilla.org/en-US/docs/Web/API/Prioritized_Task_Scheduling_API)
- [More detail on Optimizing Long Tasks with scheduler.yield](https://web.dev/articles/optimize-long-tasks)

---

### Question 92c6de0d-6664-4ab5-a677-6f5c38d5988f

- What is the order of precedence across browser caching layers (Memory Cache, Service Worker, HTTP Disk Cache, and BFCache)?

### Answer

- **1. Back/Forward Cache (BFCache)**: Instant in-memory snapshot of the entire frozen page and execution state. Evaluated first on back/forward navigations (0ms network and parse latency).
- **2. Memory Cache**: Fast in-memory resource cache tied to the current renderer process lifetime. Holds compiled scripts, parsed stylesheets, and decoded image bitmaps. Ignores HTTP `max-age=0` / `no-cache` for resources requested multiple times within the same page session.
- **3. Service Worker Cache**: Controlled programmatically via `CacheStorage`. The Service Worker `fetch` event intercepts outgoing network requests before they hit the browser network layer.
- **4. HTTP Disk Cache**: Persistent browser cache on storage disk respecting standard HTTP headers (`Cache-Control`, `ETag`, `Last-Modified`). Serves 304 Not Modified responses on conditional requests.
- **Network Dispatch**: If all cache layers miss or are invalidated, the request is dispatched over TCP/TLS to the origin server or CDN.

- [More detail on HTTP Caching Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [More detail on Chromium Caching Layers](https://www.chromium.org/developers/design-documents/network-stack/disk-cache/)

---

### Question c91b1c85-76e7-4d39-968a-078eb7788a7c

- How does the Back/Forward Cache (BFCache) freeze and restore documents, and what programming patterns disqualify a page from BFCache eligibility?

### Answer

- **Freezing mechanics**: When navigating away, the browser suspends the entire page state (DOM tree, JS execution stack, pending timers) and keeps it in memory. Returning restores the page instantly without firing `DOMContentLoaded` or re-executing scripts.
- **Disqualifying patterns**:
  - Registering `unload` event listeners (use `pagehide` or `visibilitychange` instead).
  - Open, unclosed `WebSocket`, `WebRTC`, or `IndexedDB` transaction connections.
  - Active audio/video playback or active Web Locks.
  - Serving HTML with `Cache-Control: no-store`.
- **Lifecycle events**:
  - Restoring fires `pageshow` with `event.persisted === true`.
  - Freezing fires `pagehide` with `event.persisted === true`.

```javascript
// Detect BFCache restoration and refresh stale state
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // Reconnect sockets or re-validate fresh session data
    reconnectWebSocket();
  }
});
```

- [More detail on Back/Forward Cache (BFCache)](https://web.dev/articles/bfcache)
- [More detail on Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)

---

### Question d0763f76-a78c-426c-bf64-a48d346242a2

- How does the Speculation Rules API achieve instant page navigations compared to `rel="prefetch"` and `rel="preload"`?

### Answer

- **Resource hints limitation**: `rel="prefetch"` only downloads raw asset bytes into the HTTP cache; when the user navigates, the browser must still initialize a renderer, parse HTML, construct the DOM, and run initial scripts.
- **Speculation Rules Prerendering**: The **Speculation Rules API** (`<script type="speculationrules">`) instructs the browser to fully pre-render a destination URL in an invisible background sandboxed renderer process.
- **Background execution**: The browser parses HTML, runs JavaScript, computes layout, and paints into an offscreen buffer.
- **Instant activation**: When the user clicks the link, the browser replaces the current tab with the pre-rendered background process, achieving near 0ms navigation latency.

```html
<script type="speculationrules">
{
  "prerender": [
    {
      "where": { "href_matches": "/products/*" },
      "eagerness": "moderate"
    }
  ]
}
</script>
```

- [More detail on Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
- [More detail on Prerendering Pages in Chrome with Speculation Rules](https://developer.chrome.com/docs/web-platform/prerender-pages)

---

### Question b0478019-7083-4b41-b713-353f64778b11

- How do operating system sandboxes isolate the browser Renderer Process from accessing the host filesystem and network sockets?

### Answer

- **Zero-trust renderer**: The Renderer Process processes untrusted web content (HTML, JS, CSS, WebAssembly). Modern browsers assume any renderer can be compromised via zero-day exploits.
- **OS sandboxing primitives**:
  - **Linux / ChromeOS**: Uses `seccomp-bpf` system call filtering, user namespaces, and `chroot` to block all filesystem, socket, and process execution syscalls.
  - **macOS**: Uses Seatbelt (macOS Sandbox framework) to restrict file and IPC access.
  - **Windows**: Uses Restricted Tokens, Low Integrity Levels, and Job Objects.
- **Broker process delegation**: If a renderer needs to read a file or make a network request, it cannot make direct OS syscalls. It must request permission via Mojo IPC to the privileged **Browser Process**, which validates origin security and user consent before returning data.

- [More detail on Chromium Sandbox Design](https://chromium.googlesource.com/chromium/src/+/main/docs/design/sandbox.md)
- [More detail on The Chrome Security Architecture](https://www.chromium.org/Home/chromium-security/core-principles/)

---

### Question 1d39f251-b743-4e18-b9d9-2577a512abaf

- Why do browser engines require Cross-Origin Isolation (`COOP` and `COEP`) to enable `SharedArrayBuffer` and high-resolution timers?

### Answer

- **Spectre vulnerability**: Spectre attacks allow malicious code to read arbitrary host memory by exploiting speculative CPU branching. Attackers require high-precision clocks (like `performance.now()` without jitter) or multithreaded shared memory (`SharedArrayBuffer` as a background counter) to measure nanosecond cache-timing differences.
- **Cross-Origin Opener Policy (`COOP`)**: `Cross-Origin-Opener-Policy: same-origin` forces top-level windows to sever references (`window.opener = null`) with other origins, granting the document a private browsing context group.
- **Cross-Origin Embedder Policy (`COEP`)**: `Cross-Origin-Embedder-Policy: require-corp` prevents loading any cross-origin subresource that does not explicitly opt in via CORS or `Cross-Origin-Resource-Policy: cross-origin`.
- **Capability unlocking**: When both headers are active, `window.crossOriginIsolated === true`, safely unlocking `SharedArrayBuffer`, high-precision timers, and WebAssembly SIMD/threads without risking cross-origin memory exfiltration.

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

- [More detail on Cross-Origin Isolation Overview](https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated)
- [More detail on Making your website "cross-origin isolated"](https://web.dev/articles/cross-origin-isolation-guide)

---

### Question df5a86a7-7ba4-401e-8258-5508ca08694e

- How do browser engines attach Sec-Fetch-* request headers, and how do they defend against CSRF, XSSI, and XS-Leaks?

### Answer

- **Forbidden header names**: `Sec-Fetch-*` headers are generated exclusively by the browser network engine; JavaScript running on the page cannot modify or forge them.
- **Core headers**:
  - **`Sec-Fetch-Site`**: Indicates request origin relationship (`same-origin`, `same-site`, `cross-site`, `none` for user navigations).
  - **`Sec-Fetch-Mode`**: Indicates request mode (`cors`, `no-cors`, `navigate`, `websocket`).
  - **`Sec-Fetch-Dest`**: Indicates resource destination (`document`, `image`, `script`, `empty`).
- **Server defense**: Servers inspect these headers to reject unauthorized cross-origin requests before evaluating business logic or database operations.

```javascript
// Express middleware: Blocks cross-site requests to internal APIs
function rejectCrossSiteRequests(req, res, next) {
  const site = req.headers["sec-fetch-site"];
  if (site === "cross-site") {
    return res.status(403).json({ error: "Cross-site request forbidden" });
  }
  next();
}
```

- [More detail on Sec-Fetch-Site Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site)
- [More detail on Protect your resources against web attacks with Fetch Metadata](https://web.dev/articles/fetch-metadata)
