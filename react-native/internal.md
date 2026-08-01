# React Native Internals

### Question b3d25caa-f0f3-41a3-8ed0-5bbcea5d046d

- Describe the lifecycle of a React Native frame from JS execution to pixels rendered on screen. Where can delays occur?

### Answer

- ***JS Render & VDOM Reconciliation Phase***: State update triggers React Fiber reconciler on JS thread to execute render functions, compute Virtual DOM diff, and generate UI mutations.
- ***Bridge / JSI Commitment & Layout Engine Pass***: Mutation commands travel to C++ layer. Yoga C++ layout engine traverses the Shadow Tree to calculate Flexbox layout coordinates (x, y, width, height).
- ***Native UI View Inflation & GPU Rasterization***: Native Main/UI Thread receives layout & property payloads, instantiates or updates native platform views (e.g. `UIView` / `android.view.View`), and submits view commands to OS compositor/GPU for frame rasterization.
- ***Latency Bottlenecks & Frame Drops***: Delays occur on JS Thread (un-memoized render loops, heavy array operations), Bridge/JSI layer (large JSON serialization queues in legacy architecture), Yoga layout engine (deeply nested complex layout trees), and UI Thread (excessive view hierarchy inflation or UI thread blockages during main thread tasks).

```javascript
// Optimizing frame execution by moving heavy work off JS render phase
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

export function OptimizedFrameComponent({ items }) {
  // Compute expensive operations outside render pass
  const processedData = useMemo(() => {
    return items.filter(item => item.active).map(item => item.value);
  }, [items]);

  return (
    <View style={{ flex: 1 }}>
      {processedData.map((val, idx) => (
        <Text key={idx}>{val}</Text>
      ))}
    </View>
  );
}
```

---

### Question f67f5728-9fbb-40d5-85bf-3ffd2f51c3e8

- How does the event loop on the JS thread interact with native events coming from the UI thread?

### Answer

- ***Native Hardware Event Capture***: OS captures raw hardware events (touch, keypress) on Native UI Thread and wraps them into native event primitives.
- ***Bridge Queue & Event Loop Enqueuing***: Native event handlers serialize events into JSON payloads (legacy architecture) or pass JSI Host Objects, placing them onto the JS Event Loop message queue via `MessageQueue.js`.
- ***React Synthetic Event Processing***: JS Event Loop dequeues event task during microtask/macrotask processing, resolves top-most target React component `reactTag`, creates a SyntheticEvent, and fires JS event handlers.
- ***Queue Saturation & Input Lag***: If JS event loop is saturated with heavy synchronous tasks, incoming native touch events sit delayed in the queue, resulting in input latency and unresponsive buttons.

```javascript
// Avoid blocking JS event loop during event handling
import { useCallback } from 'react';

export function TouchHandlerExample() {
  const handlePress = useCallback(() => {
    // Schedule heavy non-UI JS work asynchronously to free JS event loop tick
    setTimeout(() => {
      let count = 0;
      for (let i = 0; i < 1e6; i++) count += i;
    }, 0);
  }, []);

  return <Text onPress={handlePress}>Tap Me</Text>;
}
```

---

### Question 6627d847-a66d-4e3f-968a-9cb602d38883

- What is the difference between layout calculation (Yoga) and actual rendering on the UI thread?

### Answer

- ***Yoga C++ Layout Calculation***: Yoga is a cross-platform C++ layout engine implementing W3C Flexbox spec. It operates entirely on C++ Shadow Nodes to measure text and compute numerical bounding boxes (`x`, `y`, `width`, `height`) without instantiating any native OS UI components.
- ***UI Thread Native View Rendering***: Native UI rendering takes Yoga's computed bounding boxes and converts them into OS-specific view commands (`[UIView setFrame:]` on iOS, `View.layout()` on Android), managing view hierarchy, draw calls, background drawables, and GPU layer composition.
- ***Separation of Concerns***: Yoga enables thread-safe background layout computation (Shadow Thread in legacy, background worker threads in Fabric) while Native Rendering is strictly confined to the OS Main/UI Thread.

```javascript
// Yoga computes numerical layout metrics without OS views:
// ShadowNode -> YogaNode { width: 320, height: 480, top: 0, left: 0 }
// Native UI Thread applies metrics to OS Widgets:
// iOS: [uiView setFrame:CGRectMake(0, 0, 320, 480)];
// Android: view.layout(0, 0, 320, 480);
```

---

### Question e1e2d055-4b6c-46f4-82a4-db3afea509b4

- How does React Native prioritize tasks between user interactions (gestures) and JS computations?

### Answer

- ***Legacy Architecture (Unprioritized)***: Legacy RN treats all JS execution sequentially on a single JS thread queue without native priority preempting. A long JS calculation blocks user touch event processing.
- ***New Architecture & React Concurrent Scheduler***: Concurrent React introduces time-slicing and priority levels (`ImmediatePriority`, `UserBlockingPriority`, `NormalPriority`, `LowPriority`, `IdlePriority`). Touch events and gestures are marked as `UserBlockingPriority`.
- ***UI Thread Gesture Preemption***: Libraries like React Native Gesture Handler intercept touches natively on UI Thread before reaching JS Thread, executing gesture state transitions directly without waiting for JS thread availability.

```javascript
import React, { useState, useTransition } from 'react';
import { TextInput, View, Text } from 'react-native';

export function PriorityInput() {
  const [text, setText] = useState('');
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (val) => {
    // High Priority: Immediate input update
    setText(val);
    
    // Low Priority: Deferred heavy list computation
    startTransition(() => {
      const items = Array.from({ length: 5000 }, (_, i) => `${val} item ${i}`);
      setList(items);
    });
  };

  return (
    <View>
      <TextInput value={text} onChangeText={handleChange} />
      {isPending ? <Text>Updating...</Text> : list.map((item, i) => <Text key={i}>{item}</Text>)}
    </View>
  );
}
```

---

### Question c7794421-139b-4f24-a024-2edb6f851927

- What happens internally when the JS thread is busy and a user performs a gesture (e.g., scroll or swipe)?

### Answer

- ***Native UI Thread Continuity***: Native gesture handlers (`UIScrollView` / `RecyclerView` / `UIGestureRecognizer`) continue processing physical touch coordinates on the UI Main Thread, allowing scroll inertia or native swipes to physically animate smoothly.
- ***Bridge Event Queue Congestion***: Native `onScroll` / touch events are generated and dispatched to the JS bridge queue, but cannot execute until the JS thread completes its ongoing synchronous operation.
- ***Visual Blanking & Delayed Callbacks***: In lists (`FlatList` / `FlashList`), as scrolling exposes unrendered item windows, the busy JS thread fails to run `renderItem` to create new VDOM nodes, displaying blank white space until JS unblocks.

```javascript
// Problem: Heavy JS work freezes FlatList item rendering while native scroll moves
function HeavyList() {
  const blockJSThread = () => {
    const start = Date.now();
    while (Date.now() - start < 1000) {} // Blocks JS for 1s -> causes blank areas on scroll
  };

  return <FlatList data={data} renderItem={({ item }) => <Item data={item} onLayout={blockJSThread} />} />;
}
```

---

### Question 27cb05d5-842a-4ca0-a335-8d793c5069c5

- How does React Native handle scroll events efficiently without overwhelming the JS thread?

### Answer

- ***`scrollEventThrottle` Control***: Limits the frequency of native scroll event messages emitted across the bridge (e.g. throttling to 16ms for 60fps or higher to reduce JS queue load).
- ***`useNativeDriver: true` (Animated API)***: Transfers scroll-linked animation nodes (e.g. collapsible header opacity) to native Animated module once, allowing UI Thread `CADisplayLink`/`Choreographer` to recalculate transforms without sending per-frame scroll events to JS.
- ***Reanimated UI Worklets***: Executes `useAnimatedScrollHandler` on a separate UI JS runtime context (UI Thread), updating view styles synchronously without bridging to the main JS Thread.

```javascript
import React from 'react';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';

export function SynchronousScroll() {
  const translationY = useSharedValue(0);

  // Runs synchronously on UI Thread worklet context
  const scrollHandler = useAnimatedScrollHandler((event) => {
    translationY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -translationY.value * 0.5 }],
  }));

  return (
    <>
      <Animated.View style={[{ height: 100, backgroundColor: 'blue' }, headerStyle]} />
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        {/* Content */}
      </Animated.ScrollView>
    </>
  );
}
```

---

### Question c8a016e5-aef8-48ea-a540-797ebf66c1ec

- Explain how batching works across the bridge. What determines when updates are flushed to native?

### Answer

- ***Message Queue Accumulation***: When JS calls native module methods or UI updates, calls are pushed onto an in-memory queue (`MessageQueue.js`) as array payloads `[moduleIDs, methodIDs, params, callIDs]`.
- ***Event Loop Tick Boundary Flush***: Queue flushing occurs at the end of the current JS Event Loop tick (microtask cleanup phase). `JSTimers` or `setImmediate` boundaries trigger `flushedQueue()`.
- ***Atomic Native Execution***: Serialized array payload crosses the C++ bridge boundary, unpacks on Native Shadow/UI Thread, and executes all queued view mutations in a single atomic platform batch, preventing partial screen redraws.

```javascript
// MessageQueue internals concept:
// Call 1: UIManager.createView(10, "RCTView", 1, { backgroundColor: -1 })
// Call 2: UIManager.updateLayout(10, 0, 0, 100, 100)
// End of JS tick -> flushedQueue() serializes both calls into single IPC array payload:
// [[UIManagerID], [createViewID, updateLayoutID], [[10, "RCTView"...], [10, 0, 0, 100, 100]]]
```

---

### Question dffb47d4-1e24-43d7-9ffa-ac019adb5e51

- What is the cost of serializing data across the bridge, and how does it impact large payloads?

### Answer

- ***Serialization CPU & Memory Overhead***: Data crossing legacy bridge must be converted from JS Objects -> JSON string -> C++ string -> Native OS Objects (`NSDictionary` / `ReadableNativeMap`).
- ***Large Payload Degradation***: Passing multi-megabyte JSON payloads (e.g. raw base64 images, large SQLite result sets, detailed location logs) causes heavy memory allocations, garbage collection spikes, and bridge congestion.
- ***Framerate Drops***: While bridge thread processes massive JSON stringification, pending UI mutation messages get stuck behind large payloads, dropping app rendering to sub-30 FPS.

```javascript
// BAD: Passing massive dataset over bridge
const rawData = await NativeBridgeModule.fetch10MBJson(); // Huge serialization bottleneck

// GOOD: Process or stream data natively, or use JSI host objects / MMKV for zero-copy access
const value = ArrayBufferModule.getDirectMemoryBuffer(); // Zero-copy memory access via JSI
```

---

### Question 0aecea20-a113-4cab-9726-92e66646e461

- In the new architecture, how does JSI eliminate or reduce serialization overhead?

### Answer

- ***Direct C++ Memory Reference***: JSI (JavaScript Interface) exposes C++ Host Objects directly to JavaScript engine (Hermes/V8) runtime environment as native JS objects/functions.
- ***Zero-Copy Memory Access***: JavaScript code invokes C++ functions (`jsi::Function`) or inspects native properties (`jsi::Object`) directly via memory pointers without stringification, JSON parsing, or IPC queues.
- ***Synchronous & Asynchronous Capabilities***: Allows instant synchronous return values (e.g. `MMKV.getString('key')`) and typed array memory sharing (`jsi::ArrayBuffer`) for near-instant data interchange.

```javascript
// C++ JSI HostFunction binding concept
// HostFunction exposes direct C++ pointer to JS runtime:
/*
jsi::Value getNativeData(jsi::Runtime& runtime, const jsi::Value* args, size_t count) {
  return jsi::String::createFromUtf8(runtime, "Direct Memory Return");
}
*/
// JS side call has 0 serialization cost:
const data = global.getNativeData();
```

---

### Question 4421337a-646e-4f55-b4a2-a36f9cc4880a

- What is the role of the Scheduler in React (Concurrent React) and how does it impact React Native rendering?

### Answer

- ***Cooperative Multitasking & Time-Slicing***: React Scheduler splits component rendering into small work chunks yielded back to the browser/native event loop every ~5ms, preventing long render passes from locking the thread.
- ***Priority-Based Rendering Tree***: Assigns execution priorities (`Immediate`, `UserBlocking`, `Normal`, `Low`, `Idle`). When user tap arrives during low-priority list rendering, Scheduler pauses low-priority rendering to process touch event state update first.
- ***Fabric Renderer Integration***: Fabric hooks directly into React Concurrent Scheduler, enabling multi-threaded Shadow Tree mutation commits and concurrent rendering without UI blocking.

```javascript
import React, { useDeferredValue, useState } from 'react';
import { TextInput, View, Text } from 'react-native';

export function DeferredSearch() {
  const [query, setQuery] = useState('');
  // React Scheduler defers updating deferredQuery when high-priority typing occurs
  const deferredQuery = useDeferredValue(query);

  return (
    <View>
      <TextInput value={query} onChangeText={setQuery} />
      <HeavySearchResults query={deferredQuery} />
    </View>
  );
}
```

---

### Question a00708f1-860c-429b-b2d2-5ef6407efe8a

- How does Fabric enable synchronous layout updates, and why is that important?

### Answer

- ***C++ Unified Immutable Shadow Tree***: Fabric maintains an immutable Shadow Tree in C++ accessible synchronously by JS Thread via JSI and UI Thread natively.
- ***Synchronous Layout Execution (`measureSync`)***: JS code can trigger component measure & layout calculation synchronously in a single frame pass (`measureInWindow` / synchronous ref measurement).
- ***Elimination of Flash of Unstyled Content (FOUC)***: Legacy RN forced async layout roundtrips (JS -> Bridge -> Shadow Thread -> UI Thread), causing visual jumps/flickers when sizing modals, tooltips, or auto-growing text inputs. Fabric applies layout before frame render.

```javascript
// Fabric allows measuring and updating view properties synchronously in 1 frame
import { useRef } from 'react';
import { UIManager, findNodeHandle } from 'react-native';

export function SynchronousMeasurement() {
  const viewRef = useRef(null);

  const measureView = () => {
    // In Fabric with JSI, layout metrics are retrieved synchronously without async bridge delay
    viewRef.current?.measureInWindow((x, y, width, height) => {
      console.log('Position immediately available:', x, y, width, height);
    });
  };

  return <View ref={viewRef} onLayout={measureView} />;
}
```

---

### Question 0985d1db-d745-45a0-bdd9-ce51913440db

- What happens if a native module performs a long-running task on the UI thread?

### Answer

- ***OS Main Thread Starvation***: Operating system requires UI Thread to process draw calls and touch events every 16.6ms (60Hz) or 8.3ms (120Hz). Long native execution blocks OS Main Looper.
- ***Dropped Frames & Complete UI Freeze***: Screen rendering completely freezes; animations stop, touches become unresponsive, and display drops to 0 FPS.
- ***OS Watchdog & ANR Crash***: Android triggers ANR (Application Not Responding) dialog after 5 seconds of UI thread blockage. iOS Watchdog (`scene-create` / `scene-update` timeout) forcefully terminates the app process with crash code `0x8badf00d`.

```javascript
// BAD: Android Native Module executing heavy I/O on Main Thread
// @ReactMethod
// public void processData() {
//     // Executing on UI Thread causes ANR crash!
//     try { Thread.sleep(6000); } catch (Exception e) {}
// }

// GOOD: Execute on Background Thread
// @ReactMethod
// public void processDataAsync(Promise promise) {
//     AsyncTask.execute(() -> {
//         // Heavy background processing
//         promise.resolve("Done");
//     });
// }
```

---

### Question 07590965-493c-4d84-992d-10ede17b3aab

- How are timers (setTimeout, setInterval) implemented in React Native, and what are their limitations?

### Answer

- ***`JSTimers.js` Centralized Registry***: React Native does not create native OS timers for every `setTimeout`. JS maintains an internal map of pending timers and orders them by target execution timestamp.
- ***Single Native `Timing` Module Signal***: JS calculates the earliest timer expiration and sends a single native bridge call to native `Timing` module (`createTimer`). When native timer fires, it calls back into JS to trigger `callTimers()`.
- ***Background & JS Contention Limitations***: Timers are throttled or paused when app enters background state. If JS thread is busy with heavy computations, timer execution is delayed beyond scheduled duration.

```javascript
// RN Timers depend on JS Event Loop execution
export function TimerCaveat() {
  const startTimer = () => {
    const target = Date.now() + 1000;
    setTimeout(() => {
      // May print > 1000ms if JS thread was busy during deadline
      console.log('Elapsed ms:', Date.now() - target + 1000);
    }, 1000);

    // Heavy JS work delays setTimeout callback execution
    for (let i = 0; i < 5e7; i++) {}
  };

  return <Button title="Test Timer" onPress={startTimer} />;
}
```

---

### Question e4a060d6-df71-4452-8e09-4401cd02d73b

- How does React Native ensure consistency between the JS virtual tree and the native UI tree?

### Answer

- ***Tag Identifier Mapping (`reactTag`)***: Every React component node is assigned a unique integer `reactTag` shared across JS VDOM, C++ Shadow Tree, and Native View Registry (`UIViewRegistry` / `NativeViewHierarchyManager`).
- ***Reconciliation & Structural Mutation Diffing***: React Fiber diffs Virtual DOM, emitting incremental mutation instructions (`createView`, `updateProps`, `insertChild`, `removeChild`).
- ***Shadow Tree Yoga Validation & Atomic Mount***: Mutations are applied to C++ Shadow Tree, Yoga calculates layout, and final verified layout/style payload is flushed atomically to Native UI thread to update native views.

```javascript
// Conceptual hierarchy mapping:
// 1. JS Virtual DOM Node (Tag 45) -> <View style={{ opacity: 0.5 }} />
// 2. C++ Shadow Node (Tag 45)    -> LayoutNode { opacity: 0.5, calculatedBounds: [0,0,100,50] }
// 3. Native OS View (Tag 45)     -> Android: ReactViewGroup(id=45, alpha=0.5f) / iOS: UIView(tag=45, alpha=0.5)
```

---

### Question 917a0010-2786-47ee-aee4-c624f709f6ef

- What are “stale closures” or outdated state issues in React Native, and how do they relate to async rendering?

### Answer

- ***Closure Scope Capture***: JavaScript functions (in `useEffect`, event listeners, or bridge promises) capture state and prop variables at the exact moment the closure is created during render.
- ***Async Delay & Stale State Access***: If state updates while an asynchronous operation (e.g. network fetch, native event callback, timer) is pending, the executing callback references outdated variable values captured from its initial closure scope.
- ***Mitigation Strategies***: Use functional state updaters (`setState(prev => prev + 1)`), `useRef` to store mutable references accessible across renders, or update `useEffect` dependency arrays properly.

```javascript
import React, { useState, useEffect, useRef } from 'react';

export function StaleClosureFix() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count; // Keep ref updated with latest state

  useEffect(() => {
    const timer = setInterval(() => {
      // STALE: console.log(count) always prints 0 if count in dep array is omitted
      // FIX: Read from mutable ref for async callback handlers
      console.log('Latest Count via Ref:', countRef.current);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return <Button title={`Increment: ${count}`} onPress={() => setCount(c => c + 1)} />;
}
```

---

### Question 7a37c556-0424-472a-8cd4-c644482361cd

- How does garbage collection in the JS engine (Hermes/JSC) affect app performance?

### Answer

- ***Stop-The-World Execution Pauses***: Garbage Collection (GC) algorithm (Mark-and-Sweep / Generational GC) pauses JS thread execution to identify unreferenced objects and reclaim heap memory.
- ***High Object Allocation Churn***: Creating ephemeral objects inside high-frequency loops (e.g. instantiating new style objects or arrow functions inside `onScroll` or `renderItem`) forces frequent GC cycles.
- ***Micro-Stutters & Dropped Frames***: If GC pause takes 10–30ms during scrolling or animation, JS thread misses the frame deadline, causing visible UI jank and dropped frames.

```javascript
// BAD: Object creation inside renderItem triggers GC pressure
const renderItemBad = ({ item }) => (
  <View style={{ padding: 10, margin: 5, backgroundColor: 'red' }}>
    <Text>{item.name}</Text>
  </View>
);

// GOOD: Extract static styles outside component render loop
const styles = StyleSheet.create({
  card: { padding: 10, margin: 5, backgroundColor: 'red' }
});
const renderItemGood = ({ item }) => (
  <View style={styles.card}>
    <Text>{item.name}</Text>
  </View>
);
```

---

### Question b4a76b42-3bbc-4545-8574-e36c8494985e

- What is Hermes, and how does it differ from JSC in terms of startup time and memory usage?

### Answer

- ***Ahead-Of-Time (AOT) Bytecode Compilation***: Hermes compiles JS source code into compact bytecode during app build phase, eliminating runtime JS parsing and JIT compilation overhead at startup.
- ***Faster Time-To-Interactive (TTI)***: App binary directly memory-maps pre-compiled bytecode (`HBC`) into memory on launch, reducing TTI by 40–60% compared to JavaScriptCore (JSC).
- ***Lower Memory Footprint & Mobile GC***: Hermes uses lean object representations, memory-mapped bytecode pages shared across OS processes, and a generational garbage collector tailored specifically for mobile memory constraints.

```javascript
// Hermes build transformation:
// App.js (JS Source Code) -> [Build Time: hermesc compiler] -> index.android.bundle (Hermes Bytecode)
// App Launch: OS memory-maps Bytecode file -> Hermes executes bytecode immediately (0 Parsing Delay)
```

---

### Question f32468e8-98ec-48cc-af71-f5b29e73543c

- How does React Native handle image decoding and rendering across threads?

### Answer

- ***Background Network Fetching & Cache Check***: Image URL request or local asset path is resolved on background network/file I/O thread.
- ***Background Image Decoding Pass***: Compressed image formats (JPEG/PNG/WebP) are decoded into raw uncompressed ARGB bitmap pixel buffers on a dedicated background I/O decoding thread pool (e.g. via Fresco on Android, SDWebImage / ImageIO on iOS).
- ***GPU Texture Upload & Main Thread Display***: Uncompressed bitmap texture is uploaded to GPU memory. UI Main Thread only updates host view bounds (`RCTImageView` / `ReactImageView`), avoiding main thread stalls during heavy image decompression.

```javascript
import React from 'react';
import { Image } from 'react-native';

export function OptimizedImage() {
  return (
    <Image
      source={{ uri: 'https://example.com/large-image.jpg' }}
      // Specifying explicit dimensions allows background decoder to downsample bitmap
      style={{ width: 200, height: 200 }}
      resizeMode="cover"
    />
  );
}
```

---

### Question 45864b3a-8608-48f8-8184-49bb8d215629

- What happens internally when using InteractionManager.runAfterInteractions?

### Answer

- ***Interaction Task Queueing***: Enqueues JS tasks into a dedicated queue that delays execution until all ongoing UI animations or touch gestures complete.
- ***Handle Registration Tracking***: Animated API (`Animated.timing`) and gesture components register active interaction handles (`InteractionManager.createInteractionHandle()`) when animations start.
- ***Queue Flush on Interaction Completion***: Once all active handles are cleared (handle count reaches 0), `InteractionManager` flushes queued JS tasks into JS microtask queue, preventing background heavy logic from competing with smooth animation frame execution.

```javascript
import React, { useEffect, useState } from 'react';
import { InteractionManager, Text, View, ActivityIndicator } from 'react-native';

export function DeferredScreenContent() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait until screen transition animation finishes before executing heavy load
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => task.cancel();
  }, []);

  if (!isReady) return <ActivityIndicator />;
  return <View><Text>Heavy Screen Content Loaded</Text></View>;
}
```

---

### Question e3c93390-c841-4b21-9443-660f3096e237

- How do gesture libraries avoid blocking the JS thread while maintaining responsiveness?

### Answer

- ***Native UI Thread Gesture Recognizers***: `react-native-gesture-handler` attaches native gesture recognizers (`UIGestureRecognizer` on iOS, Android `MotionEvent` interceptors) directly to OS native views.
- ***Native Gesture State Machine***: Evaluates gesture state transitions (`BEGAN`, `ACTIVE`, `END`, `CANCELLED`) entirely on UI Thread without waiting for JS thread event loop processing.
- ***Reanimated UI Runtime Worklets***: Gesture events update shared values (`useSharedValue`) inside a secondary JS runtime context executing on the UI thread, driving 120fps animations synchronously.

```javascript
import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

export function NativeGestureBox() {
  const offset = useSharedValue(0);

  // Gesture evaluated entirely on UI Thread
  const pan = Gesture.Pan()
    .onChange((event) => {
      offset.value += event.changeX;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: 100, height: 100, backgroundColor: 'blue' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

### Question 5595363f-5115-4461-9de2-c1a101ee867e

- What are the trade-offs between using inline styles vs StyleSheet in React Native?

### Answer

- ***`StyleSheet.create` Optimization***: Validates style property types at module load time, creates immutable style objects, and in legacy architecture assigns integer IDs to avoid re-serializing style objects over the bridge.
- ***Inline Styles Memory Overhead***: Creating inline object literals (`style={{ marginTop: 10 }}`) instantiates new JS object references on every component render pass, triggering garbage collection pressure.
- ***Re-render Component Equality Breakdown***: Passing inline style objects to memoized child components (`React.memo`) breaks shallow prop comparison (`oldProps.style !== newProps.style`), causing unnecessary child re-renders.

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';

// GOOD: Cached static stylesheet reference
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
});

export function StyledContainer({ children }) {
  return <View style={styles.container}>{children}</View>;
}
```

---

### Question f581371e-03bf-4f2f-b814-8a1a856468e1

- How does React Native handle z-index and view stacking internally across platforms?

### Answer

- ***iOS Native `CALayer.zPosition` Mapping***: iOS natively supports `zIndex` by setting the underlying `UIView.layer.zPosition`, allowing views to overlap independently of sibling insertion order.
- ***Android Custom `ReactViewGroup` Ordering***: Android native `ViewGroup` stacks views strictly by child array order. RN Android implements custom `ReactViewGroup` which overrides `getChildDrawingOrder()` to sort children dynamically by `zIndex` before draw execution.
- ***Stacking Context Limitations***: `zIndex` in RN operates strictly within local sibling parent view hierarchy; a child view cannot overlap views outside its parent container regardless of high `zIndex` values.

```javascript
import React from 'react';
import { View, Text } from 'react-native';

export function StackingExample() {
  return (
    <View style={{ height: 100 }}>
      {/* Renders visually on top on both iOS and Android */}
      <View style={{ position: 'absolute', zIndex: 2, backgroundColor: 'red', width: 50, height: 50 }}>
        <Text>Top</Text>
      </View>
      <View style={{ position: 'absolute', zIndex: 1, backgroundColor: 'blue', width: 80, height: 80 }}>
        <Text>Bottom</Text>
      </View>
    </View>
  );
}
```

---

### Question bfdf780c-c07c-42e5-9816-8af8a65adee3

- What is the difference between layout-only views and native-backed views?

### Answer

- ***Layout-Only Views (Optimization Pass)***: Container `<View>` nodes used strictly for Flexbox positioning without background colors, borders, shadows, or event listeners. RN layout engine flattens and removes them during C++ shadow tree pass.
- ***Native-Backed Views***: View nodes with visual properties (backgrounds, borders, opacity) or interactive touch handlers (`onPress`). RN must allocate actual native platform widgets (`UIView` / `android.view.View`) for them.
- ***Performance Savings***: Layout flattening reduces OS View hierarchy depth, saves memory allocations, and improves OS view tree layout traversal speed.

```javascript
// Layout-Only View (Flattened by RN C++ layout pass, NO native view created):
<View style={{ flex: 1, padding: 10 }}>
  {/* Native-Backed View (Allocates real OS UIView / Android View): */}
  <View style={{ backgroundColor: 'red', padding: 5 }}>
    <Text>Visible Box</Text>
  </View>
</View>
```

---

### Question fbeb898d-a6d0-4141-a118-da73af3bac14

- How does React Native optimize re-renders with mechanisms like shouldComponentUpdate, React.memo, and hooks?

### Answer

- ***`React.memo` & `shouldComponentUpdate` Bailout***: Performs shallow equality comparison of props (`prevProps === nextProps`). If props match, Fiber reconciler bails out of rendering the component subtree, skipping VDOM diffing.
- ***`useCallback` & `useMemo` Primitive Reference Locking***: Maintains object/function reference equality across component renders, preventing memoized child components from re-rendering due to new inline arrow function creation.
- ***State Colocation***: Moves state down to smallest requiring sub-component tree, isolating state updates and preventing top-level root component re-renders.

```javascript
import React, { useState, useCallback } from 'react';
import { View, Button } from 'react-native';

const HeavyChild = React.memo(({ onPress }) => {
  console.log('HeavyChild rendered');
  return <Button title="Child Action" onPress={onPress} />;
});

export function ParentComponent() {
  const [count, setCount] = useState(0);

  // useCallback prevents HeavyChild from re-rendering when count changes
  const handleChildPress = useCallback(() => {
    console.log('Child clicked');
  }, []);

  return (
    <View>
      <Button title={`Increment Parent: ${count}`} onPress={() => setCount(c => c + 1)} />
      <HeavyChild onPress={handleChildPress} />
    </View>
  );
}
```

---

### Question 59488786-3864-42c9-8cf7-c9f2d3871e55

- What happens when you trigger multiple state updates in quick succession? How does React Native batch them?

### Answer

- ***Automatic Batching (React 18 / Concurrent React)***: Multiple state updates triggered inside event handlers, promises, timers, or native event callbacks are grouped into a single unified render pass.
- ***Single Reconciliation & Shadow Tree Commit***: Fiber reconciler evaluates all queued state mutations together, generating one single Virtual DOM diff and one Shadow Tree update pass.
- ***Bypassing Batching (`flushSync`)***: For rare cases requiring immediate synchronous DOM/Native view layout update, `flushSync()` forces React to flush pending updates synchronously.

```javascript
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';

export function BatchingExample() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleUpdate = () => {
    // Both state updates are batched into 1 single re-render cycle
    setCount(c => c + 1);
    setFlag(f => !f);
  };

  return (
    <View>
      <Text>Count: {count}, Flag: {String(flag)}</Text>
      <Button title="Update State" onPress={handleUpdate} />
    </View>
  );
}
```

---

### Question 2fa6d47f-573d-42f0-8fc3-26596d26e7d2

- How does the bridge handle error propagation from native to JS and vice versa?

### Answer

- ***Native to JS Error Propagation***: Native module methods accept JS Promise callbacks (`Promise.reject(code, message, error)`). Rejections map to JS Promise rejections. Uncaught native async errors trigger `RCTFatal()` or call `ErrorUtils.setGlobalHandler()`.
- ***JS to Native Fatal Crash Handler***: Uncaught JS exceptions bubble to JS engine global error boundary (`JSIExecutor` / `ReactErrorUtils`). RN native host captures exception string, displays RedBox in dev mode, or logs crash and terminates app process in production.
- ***Native C++ Boundary Exception Catching***: Fabric and TurboModules wrap C++ JSI host function invocations in `try/catch` blocks, converting native C++ exceptions (`std::exception`) into thrown JavaScript Error instances.

```javascript
import React, { Component } from 'react';
import { Text } from 'react-native';

export class GlobalErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Caught error:", error, info); }
  render() {
    return this.state.hasError ? <Text>Something went wrong</Text> : this.props.children;
  }
}
```

---

### Question 5370f225-6daf-47f0-a95f-543a904ee2b4

- What are the implications of synchronous vs asynchronous gestures in the new architecture?

### Answer

- ***Legacy Asynchronous Gestures***: Touch events travel across async queue (UI Thread -> Bridge -> JS Thread -> Bridge -> UI Thread). Causes 16–32ms touch response lag, visual latency, and scroll jitter during fast touch interactions.
- ***New Architecture Synchronous Gestures***: Fabric layout engine and Reanimated UI worklets process gestures synchronously on the UI Thread via JSI Host Functions.
- ***Implications & Responsiveness***: Eliminates frame latency, allows real-time 120Hz gesture tracking (e.g. interactive bottom sheet dragging, swipeable cards), and guarantees gesture state consistency without thread synchronization lag.

```javascript
// Synchronous gesture execution via Reanimated worklet (0 Bridge Frame Latency)
const gesture = Gesture.Pan().onUpdate((e) => {
  'worklet';
  // Executes synchronously on UI thread runtime during touch move event
  translationX.value = e.translationX;
});
```

---

### Question 839028a9-34a3-4189-81ab-9944428edd0c

- How does React Native deal with accessibility events across threads?

### Answer

- ***Accessibility Node Hierarchy Mapping***: Accessibility props (`accessible={true}`, `accessibilityLabel`, `accessibilityRole`, `accessibilityState`) defined in JS are synchronized across Fabric Shadow Tree to Native View Hierarchy.
- ***Native Accessibility Provider Integration***: OS Accessibility services (iOS VoiceOver / Android TalkBack) inspect native OS view tree (`UIAccessibilityElement` / `AccessibilityNodeInfo`) on UI Thread.
- ***Cross-Thread Accessibility Events***: Screen focus shifts (`AccessibilityInfo.announceForAccessibility()`) dispatch messages from JS across bridge/JSI to native OS Accessibility Manager, triggering spoken screen announcements.

```javascript
import React from 'react';
import { TouchableOpacity, Text, AccessibilityInfo } from 'react-native';

export function AccessibleButton() {
  const handlePress = () => {
    AccessibilityInfo.announceForAccessibility('Action completed successfully');
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Submit Form"
      accessibilityHint="Double tap to submit your details"
      onPress={handlePress}
    >
      <Text>Submit</Text>
    </TouchableOpacity>
  );
}
```

---

### Question e94291bb-9f8a-4361-93b0-af95da094c8a

- What are common causes of memory leaks related to native modules and event listeners?

### Answer

- ***Unremoved Native Event Emitter Subscriptions***: Registering `DeviceEventEmitter` or `NativeEventEmitter` listeners inside `useEffect` without returning cleanup function `subscription.remove()` retains component instances in memory.
- ***Native Module Static Context Retention***: Native modules keeping static references to `ReactContext`, `Activity`, or `UIView` objects prevent OS garbage collector from freeing unmounted screen resources.
- ***Circular JSI Host Object References***: Strong C++ `jsi::Value` references pointing to JS functions without resetting host object handles prevent JS engine Garbage Collection.

```javascript
import React, { useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const { LocationModule } = NativeModules;
const locationEmitter = new NativeEventEmitter(LocationModule);

export function LocationTracker() {
  useEffect(() => {
    const subscription = locationEmitter.addListener('onLocationUpdate', (loc) => {
      console.log('Location:', loc);
    });

    // CRITICAL: Must clean up subscription to prevent memory leak
    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
```

---

### Question 0919b873-6566-49eb-87a6-d64000c96c85

- How does React Native handle font loading and text measurement internally?

### Answer

- ***Native Engine Text Measurement (Yoga C++ Measure Function)***: `<Text>` node layout cannot be computed solely by Flexbox rules. Yoga delegates text node measurement to platform C++ measure functions calling OS text layout engines (`CoreText` on iOS, `TextPaint` / `BoringLayout` on Android).
- ***Async Custom Font Asset Registration***: Custom font files (.ttf / .otf) must be bundled into native assets (`assets/fonts`). OS font managers load font metrics into memory at app launch.
- ***Font Fallback & Layout Shifts***: If text layout computation occurs before custom font metrics finish loading, platform falls back to default system font metrics, which can trigger text wrapping layout shifts upon font load completion.

```javascript
import React from 'react';
import { Text, StyleSheet } from 'react-native';

// Custom font family metrics affect Yoga layout calculation
const styles = StyleSheet.create({
  customText: {
    fontFamily: 'Inter-Bold', // Requires font asset present in native assets
    fontSize: 16,
    lineHeight: 24, // Explicit line height avoids cross-platform metric discrepancy
  },
});

export function CustomTypography() {
  return <Text style={styles.customText}>Measured via OS Native Text Engine</Text>;
}
```

---

### Question f2a0c2c6-2b91-4fd8-9bec-1c25d7feab50

- Explain the roles of the JS thread, UI thread, and native modules in React Native. How do they interact during a typical user interaction?

### Answer

- ***JavaScript Thread (Main JS)***: Runs the JavaScript runtime engine (Hermes/JSC), executing business logic, React Fiber reconciler, state updates, and Virtual DOM diffing.
- ***UI Thread (OS Main)***: Responsible for OS window management, touch event interception, instantiating/updating platform views (`UIView` / `android.view.View`), and submitting draw commands to GPU compositor.
- ***Native Background Modules / Threads***: Off-thread background execution context for heavy tasks like network requests (Networking), audio playback, storage I/O, and location tracking.
- ***Interaction Flow***: User touches button -> UI Thread captures touch event -> sends event over bridge/JSI to JS Thread -> JS runs `onPress` state update -> React Fiber diffs tree -> sends view mutation payload back to UI Thread -> UI Thread updates native view visuals.

```javascript
// Typical Interaction Flow:
// [UI Thread] Touches Screen -> Captures Event
//   └─► [Bridge / JSI] Enqueues Event Payload
//         └─► [JS Thread] Executes `onPress` -> setState() -> VDOM Reconciliation
//               └─► [Shadow Tree / Yoga] Calculates Layout Bounds
//                     └─► [UI Thread] Applies Native View Mutations -> Renders Frame
```

---

### Question debf8bc5-3b14-4875-891a-ccd8fbe60652

- What happens under the hood when a user taps a button in a React Native app? Walk through the full flow across threads.

### Answer

- ***Step 1: Hardware Touch Event Capture (UI Thread)***: Physical touch on glass triggers native OS event (`UITouch` on iOS, `MotionEvent` on Android). OS passes event to `RCTTouchHandler` / `ReactRootView`.
- ***Step 2: Touch Serialization & Bridge Dispatch (UI -> JS)***: Native touch handler extracts touch coordinates, target `reactTag`, and timestamp, serializing payload to dispatch across JSI/Bridge queue to JS Event Loop.
- ***Step 3: React Synthetic Event Resolution (JS Thread)***: JS runtime receives touch event, resolves component `reactTag` target, creates React `SyntheticEvent`, and invokes `onPress` handler.
- ***Step 4: State Update & VDOM Reconciliation (JS Thread)***: `onPress` calls `setState()`. React Fiber reconciler updates component subtree and generates structural UI mutation operations.
- ***Step 5: Yoga Layout & Native View Mutation (C++ / UI Thread)***: Fabric C++ Shadow Tree applies mutations, Yoga computes layout bounds, and atomic view property updates are sent to UI Thread to render visual state (e.g. highlight button color).

```javascript
// Step-by-step touch propagation pseudocode:
// 1. UI Thread: MotionEvent (ACTION_DOWN, x: 150, y: 300)
// 2. JSI Dispatch: global.nativeFabricEmitEvent("topTouchStart", { target: 42, x: 150, y: 300 })
// 3. JS Thread: SyntheticEvent.dispatch(targetTag: 42) -> onPress() -> setCount(1)
// 4. React Fiber: VDOM Diff -> Mutate ShadowNode(42) { backgroundColor: 'blue' }
// 5. Native View Manager: viewRegistry.get(42).setBackgroundColor(Color.BLUE)
```

---

### Question 22fffbcf-b5a4-4454-9d97-d7e6deb03b4d

- What is the bridge in React Native, and why can it become a performance bottleneck?

### Answer

- ***Bridge Architecture Definition***: The bridge is an asynchronous, serialized C++ communication channel (`CxxBridge`) connecting the JS runtime environment to Native iOS/Android platforms.
- ***JSON Serialization Overhead***: Every cross-boundary call stringifies JS objects to JSON, passes text across C++ boundary, and parses JSON back to native objects, consuming CPU and RAM.
- ***Async Queue Latency & Congestion***: Asynchronous FIFO messaging prevents synchronous layout reads/writes. When heavy data streams (scrolling events, animations, large payloads) clog the bridge queue, critical UI updates drop frames.

```javascript
// Bridge Message Queue Queueing Concept (Legacy Architecture):
// JS Thread ---> [JSON Stringify] ---> | Bridge FIFO Queue | ---> [JSON Parse] ---> Native Thread
// If Queue holds 500 scroll events, UI update message gets stuck behind them!
```

---

### Question 0ef1adca-1b65-45be-9666-392ccaaef439

- How does the new architecture (JSI, Fabric, TurboModules) change the communication model compared to the old bridge?

### Answer

- ***JSI Direct Memory Access vs JSON Queue***: Replaces asynchronous JSON string bridge with direct C++ JavaScript Interface (JSI), allowing JS to directly reference C++ host objects synchronously or asynchronously.
- ***TurboModules Lazy Initialization vs Eager Loading***: Replaces eager startup initialization of all native modules with lazy, on-demand JSI loading via C++ Codegen bindings.
- ***Fabric Unified Shadow Tree vs Async Shadow Thread***: Unifies UI rendering under a shared C++ Shadow Tree supporting synchronous layout measurement, multi-threading, and React 18 Concurrent Features.

```javascript
// Legacy Model:  JS Thread <--- (Async JSON Bridge Queue) ---> Native UI Thread
// New Model:     JS Thread <== (JSI Direct C++ Pointers / Host Objects) ==> Native UI Thread
```

---

### Question 304ee3b9-b58c-41ef-b446-fd5e0d695b92

- What is the difference between synchronous and asynchronous communication between JS and native in React Native?

### Answer

- ***Asynchronous Communication (Legacy Bridge / Promises)***: Messages are queued and processed asynchronously on subsequent event loop ticks. Callers do not block waiting for results; required for non-blocking background I/O, but introduces latency and visual flash.
- ***Synchronous Communication (JSI Host Functions)***: JS Thread executes native C++ code directly inline, halting JS thread execution until native function returns immediate result (`const val = MMKV.getString('key')`).
- ***Use Cases & Trade-offs***: Synchronous calls enable instant storage reads and 1-frame layout measurement, but performing slow native operations synchronously blocks the JS Thread.

```javascript
// Asynchronous Call (Legacy Bridge):
NativeModules.Storage.getItem('key').then(val => console.log(val)); // Delayed response

// Synchronous Call (JSI / TurboModules):
const val = MMKV.getString('key'); // Returns value immediately in same execution line
```

---

### Question 31ce098f-0033-4c17-94b1-588b7732ca10

- How can blocking the JS thread affect UI responsiveness? Give examples of operations that might cause this.

### Answer

- ***Impact on Responsiveness***: Single-threaded JS runtime cannot process incoming native touch events or run `requestAnimationFrame` while executing a synchronous task, causing unresponsive buttons, frozen text inputs, and dropped animation frames.
- ***Blocking Operation Examples***:
  1. Synchronously parsing a 10MB JSON response string (`JSON.parse()`).
  2. Heavy array sorting/filtering over 100,000 items on JS main thread.
  3. Synchronous cryptographic hashing (e.g. `bcrypt` hashing) inside render loop.
  4. Infinite or deeply nested un-memoized component re-rendering loops.

```javascript
// Blocking operation causing frozen UI:
export function HeavySyncWork() {
  const freezeApp = () => {
    // Blocks JS Thread for 2 seconds -> App UI becomes completely unresponsive!
    const data = [];
    for (let i = 0; i < 5e7; i++) {
      data.push(Math.random());
    }
  };

  return <Button title="Freeze App" onPress={freezeApp} />;
}
```

---

### Question 5c5dc3d3-edaa-4d51-b732-f67f08e23a56

- Why do animations sometimes feel smoother when using native-driven animations instead of JS-driven ones?

### Answer

- ***JS-Driven Animation Overhead***: Recalculates animation values on JS thread every 16ms frame, serializing updated style parameters across bridge to UI thread. If JS thread is busy, animation frames drop and stutter.
- ***Native-Driven Animation Execution (`useNativeDriver: true`)***: Offloads animation configuration (start, end, duration, easing) to native Animated C++ node hierarchy ONCE at start.
- ***OS Display Link Driven Frame Updates***: Native UI Thread `CADisplayLink` (iOS) or `Choreographer` (Android) updates native view transform/opacity properties frame-by-frame on UI thread, running smoothly at 60/120fps regardless of JS thread congestion.

```javascript
import React, { useRef } from 'react';
import { Animated, Button } from 'react-native';

export function SmoothNativeAnimation() {
  const opacity = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true, // Offloads animation loop directly to OS UI Thread
    }).start();
  };

  return (
    <Animated.View style={{ opacity }}>
      <Button title="Fade In" onPress={fadeIn} />
    </Animated.View>
  );
}
```

---

### Question 4e583d18-e6c8-408d-ae08-30d529e00664

- What is the role of the Shadow Tree / layout system in React Native, and how does layout calculation work?

### Answer

- ***Role of Shadow Tree***: Intermediate C++ tree node hierarchy mirroring Virtual DOM nodes. Contains layout properties (`flexDirection`, `padding`, `alignItems`) independent of OS-specific views.
- ***Yoga C++ Layout Calculation Mechanics***:
  1. JS VDOM changes update C++ Shadow Nodes.
  2. Yoga C++ engine traverses Shadow Tree, calculating exact physical pixel bounding boxes (`x`, `y`, `width`, `height`).
  3. Calculated layout metrics are committed to Native View hierarchy (`UIView` / `android.view.View`).
- ***Cross-Platform Consistency***: Guarantees identical Flexbox layout behavior across iOS, Android, and Web platforms.

```javascript
// Layout Flow:
// React Component (<View style={{ flex: 1, flexDirection: 'row' }}>)
//   └─► C++ ShadowNode (Flexbox constraints)
//         └─► Yoga C++ Engine (Calculates pixel bounds: { top: 0, left: 0, width: 390, height: 844 })
//               └─► Native View Manager (Sets native frame coordinates)
```

---

### Question 86b0326e-95e7-4da9-a86f-bbcd1c5d8851

- How does React Native handle batching of UI updates, and why is it important for performance?

### Answer

- ***Batching Execution Mechanism***: Multiple state updates and VDOM mutations triggered within a single event loop turn are merged into a single atomic payload.
- ***Single Native Layout & Draw Pass***: Flushes queued mutations to C++ Shadow Tree and UI Thread in one batch per frame, executing a single Yoga layout pass and native view update.
- ***Performance Importance***: Eliminates intermediate partial UI renders, prevents screen flicker, minimizes bridge/JSI IPC overhead, and reduces expensive native view re-layouts.

```javascript
// Without Batching: 3 state updates -> 3 bridge calls -> 3 native layout passes (Flicker & Slow)
// With React Native Batching: 3 state updates -> 1 combined Fiber diff -> 1 bridge flush -> 1 native layout pass
```

---

### Question 3f3016eb-ff71-4cdf-8224-30e7297fd1dd

- What are “dropped frames,” and how do they relate to the 60 FPS requirement on mobile devices?

### Answer

- ***Frame Budget Requirements***: Mobile displays refresh screen at 60Hz (16.67ms frame budget) or 120Hz (8.33ms frame budget).
- ***Dropped Frame Definition***: If JS Thread or UI Thread computation exceeds the frame budget (e.g. taking 25ms to complete render pass), OS fails to draw new frame before display refresh tick.
- ***Visual Jank Impact***: Display hardware repeats the previous frame. Users experience visual stutter, jerky scrolling, and input unresponsiveness ("jank").

```javascript
// Frame Budget Comparison:
// Target 60 FPS  ->  16.67ms available per frame
// Target 120 FPS ->   8.33ms available per frame
// Execution Time: JS Render (12ms) + Yoga Layout (3ms) + UI Commit (4ms) = 19ms -> DROPPED FRAME!
```

---

### Question 787ea7a5-b918-4f06-bbc8-b99ecc408473

- How does React reconciliation differ in React Native compared to React for the web?

### Answer

- ***Web React Target (Browser DOM)***: Reconciles Virtual DOM nodes into browser DOM elements via Web APIs (`document.createElement`, `appendChild`, `setAttribute`).
- ***React Native Target (Platform Host Views)***: Reconciles Virtual DOM nodes into C++ Shadow Nodes (Fabric) emitting atomic native view mutation commands (`createView`, `updateProps`, `insertChild`).
- ***Platform View Managers***: Native platform view managers (`ReactViewGroupManager` / `RCTViewManager`) interpret mutation commands to instantiate and manipulate native OS widgets (`android.view.View` / `UIView`).

```javascript
// Web Reconciliation Output:   vdom -> HTMLDOMElement (<div>)
// React Native Reconciliation: vdom -> C++ ShadowNode -> Native ViewCommand -> android.view.View / UIView
```

---

### Question d63efaca-8564-451a-88fc-740b6ab1c77b

- What happens when you call setState in React Native? How does it propagate to native UI updates?

### Answer

- ***Step 1: Enqueue Update***: `setState()` queues update object on component's React Fiber node on JS Thread.
- ***Step 2: React Reconciliation***: Fiber reconciler computes VDOM subtree diff and generates incremental mutation commands.
- ***Step 3: Shadow Tree Mutation***: Mutations update C++ Shadow Nodes.
- ***Step 4: Yoga Layout Pass***: Yoga C++ layout engine computes layout positioning for modified nodes.
- ***Step 5: UI Thread Commit***: Atomic view mutation commands flush to OS UI Thread, updating native view properties (`UIView` / `android.view.View`) and redrawing hardware pixels.

```javascript
// Execution Flow of setState:
// setState() -> Fiber Reconciler -> VDOM Diff -> C++ Shadow Node Mutation -> Yoga Layout -> UI View Mutation -> Screen Redraw
```

---

### Question 09fbfc7b-1064-43bd-b5e3-ef55a7fcb783

- What are TurboModules, and how do they improve performance compared to the traditional Native Modules?

### Answer

- ***Lazy On-Demand Initialization***: Legacy native modules initialized eagerly during app launch. TurboModules load lazily into memory via JSI host objects only when JS code requires them, reducing app startup time and RAM usage.
- ***Type-Safe C++ Codegen Bindings***: Uses Codegen tool to generate static C++ interfaces from TypeScript/Flow spec files, eliminating runtime bridge interface checks.
- ***Direct JSI Communication***: Method calls execute directly over JSI without JSON bridge stringification or IPC queue latency.

```typescript
// TurboModule TypeScript Interface Spec for Codegen
import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly getStringSync: (key: string) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CustomTurboModule');
```

---

### Question dc648dfd-0712-4de1-8775-0afe1dcb2604

- How does Fabric improve rendering and layout compared to the legacy architecture?

### Answer

- ***C++ Unified Shadow Tree***: Unifies rendering logic in C++, accessible directly across JS and UI threads via JSI.
- ***Multi-Threaded Rendering & Priority Support***: Enables background thread layout computation and integrates directly with React 18 Concurrent Features for prioritized time-sliced rendering.
- ***Synchronous Layout & Measurement***: Eliminates asynchronous layout lag, allowing synchronous view measurement and mounting to prevent visual flash of unstyled content (FOUC).

```javascript
// Fabric Architectural Features:
// 1. Unified C++ Core (Shared between JS & Native)
// 2. Priority-Aware Multi-Threading (Background layout passes)
// 3. Synchronous Layout Execution (Eliminates async layout jump/flicker)
```

---

### Question 52972a13-8e38-49ff-93c1-2396a3f1ac2d

- What is the role of JSI (JavaScript Interface), and how does it enable direct communication between JS and native code?

### Answer

- ***Lightweight C++ Engine Abstraction Layer***: JSI provides a unified C++ API wrapper around JavaScript engines (Hermes, V8, JSC), exposing C++ Host Objects directly to JS environment.
- ***Direct C++ Function Execution***: JS code calls native C++ host functions directly like standard JS functions (`global.nativeModule.method()`) without string serialization or bridge queues.
- ***Shared Memory Buffer Support***: Enables zero-copy memory buffer sharing (`jsi::ArrayBuffer`) between native C++ memory and JavaScript runtimes for high-performance video, image, or data streaming.

```cpp
// Concept C++ JSI Host Object Registration:
/*
runtime.global().setProperty(
  runtime,
  "nativeCalculator",
  jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "add"),
    2,
    [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
      double a = args[0].asNumber();
      double b = args[1].asNumber();
      return jsi::Value(a + b); // Direct Return!
    }
  )
);
*/
```

---

### Question 20b41ec6-ccde-4d4d-ab48-6de5a8fe0c8b

- How does React Native handle gestures and touch events internally across threads?

### Answer

- ***Native OS Touch Interception***: OS captures raw touches on UI Main Thread (`UITouch` / `MotionEvent`). Root view (`ReactRootView` / `RCTTouchHandler`) intercepts events.
- ***JS Synthetic Event Dispatching***: Converts touch objects into React Synthetic Touch Events (`topTouchStart`, `topTouchMove`, `topTouchEnd`), serializing payloads across bridge/JSI to JS Event Loop.
- ***Native Gesture Interceptors (RN Gesture Handler)***: Attaches native gesture recognizers to platform views, running gesture state machine on UI Thread to animate views locally before/without JS thread intervention.

```javascript
// Touch Event Routing:
// OS Hardware Touch -> UI Main Thread (UIGestureRecognizer / MotionEvent)
//   ├── Default Path:  Bridge/JSI -> JS Event Loop -> React SyntheticEvent (Async)
//   └── Gesture Handler Path: UI Thread Recognizer -> Direct UI State Machine -> Reanimated Worklet (Sync)
```

---

### Question e3242f06-cba8-469c-9ec8-083441b24065

- What causes “jank” in React Native apps, and how can thread contention contribute to it?

### Answer

- ***Jank Definition***: Visual stutter and dropped frames caused by execution tasks exceeding the 16.6ms (60fps) or 8.3ms (120fps) frame deadline.
- ***JS Thread Contention Causes***: Heavy synchronous JS computations, un-memoized component render loops, and frequent Garbage Collection pauses locking JS thread.
- ***UI Thread Contention Causes***: Heavy view hierarchy creation/inflation, expensive native layout operations on OS Main thread, and synchronous thread locks waiting for background tasks.

```javascript
// Causes of Jank:
// 1. JS Thread Saturation: Array processing during scroll -> Misses frame deadline -> Jank
// 2. UI Thread Saturation: Inflating 200 complex native views simultaneously -> Main thread freeze -> Jank
// 3. GC Stop-The-World: 30ms Garbage Collection pause -> Dropped frame -> Jank
```

---

### Question 561c1c62-921f-4e9a-b0e6-8f7b1785a388

- How does memory management work between JS and native in React Native? What are common pitfalls?

### Answer

- ***Dual Memory Management Contexts***: JS Heap memory managed by JS Engine Garbage Collector (Hermes/JSC Mark-and-Sweep). Native OS memory managed by ARC (iOS) or ART GC (Android).
- ***Bridge Host Object Lifetime Coupling***: JSI Host Objects bind JS object lifecycles to underlying C++ native object instances.
- ***Common Memory Leaks & Pitfalls***:
  1. Retaining unremoved native event listeners in JS components.
  2. Holding static references to `Activity` or `ReactContext` inside Android Native Modules.
  3. Caching massive base64 image strings or un-evicted bitmap textures in memory.

```javascript
// Common Memory Leak Pitfall:
export function LeakingComponent() {
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('Event', () => {});
    // MISSING CLEANUP: Unmounting component leaves listener alive in memory!
  }, []);
  return <View />;
}
```

---

### Question 76d124e0-1e4e-4153-b1e8-d7c479f1e050

- What is the difference between controlled and uncontrolled components in the context of React Native performance?

### Answer

- ***Controlled Components (`TextInput value={state} onChangeText={setState}`)***: Every typed character sends event across bridge to JS -> JS updates state -> sends updated text prop back to native input. Under thread load, async bridge latency causes cursor jumping and character flickering.
- ***Uncontrolled Components (`TextInput defaultValue={init}` or `ref`)***: Native view handles typing and text state locally on UI Thread without waiting for JS state roundtrip, preventing typing lag.
- ***Performance Choice***: Use uncontrolled inputs with `ref` or debounced updates for high-frequency input forms to avoid roundtrip bridge lag.

```javascript
import React, { useRef } from 'react';
import { TextInput, Button, View } from 'react-native';

export function UncontrolledInputExample() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    // Read value directly from ref without bridge state echo per keystroke
    console.log('Submitted Value:', inputRef.current);
  };

  return (
    <View>
      <TextInput
        defaultValue="Initial Value"
        onChangeText={(text) => { inputRef.current = text; }}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
```

---

### Question 11286041-2188-41bb-97e1-5c89513158ef

- How do libraries like Reanimated or Gesture Handler leverage native capabilities to bypass JS thread limitations?

### Answer

- ***Secondary UI JS Runtime Engine***: Reanimated instantiates a dedicated secondary JS runtime context executing directly on the UI/Render Thread.
- ***UI Worklets Execution***: JavaScript animation functions marked with `'worklet'` directive are compiled to execute on the UI runtime context frame-by-frame.
- ***Direct Synchronous Native View Mutations***: Gesture Handler captures native touches on UI Thread and triggers UI worklets, mutating native view props directly via JSI host objects at 120fps without touching the main JS thread.

```javascript
import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Button, View } from 'react-native';

export function ReanimatedWorkletBox() {
  const offset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    // Evaluates frame-by-frame on UI Thread runtime
    transform: [{ translateX: offset.value }],
  }));

  const handlePress = () => {
    // Triggers UI-driven spring physics animation
    offset.value = withSpring(offset.value === 0 ? 150 : 0);
  };

  return (
    <View>
      <Animated.View style={[{ width: 100, height: 100, backgroundColor: 'purple' }, animatedStyle]} />
      <Button title="Animate UI Thread" onPress={handlePress} />
    </View>
  );
}
```

---
