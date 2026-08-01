# Mobile performance

### Question 8d7e6f5a-4b3c-4d2e-9f1a-8b7c6d5e4f3a

- In a ride-hailing app with slow map loading and laggy interactions due to nearby drivers, how do you identify whether the bottleneck is the JS thread, UI thread, or network, and what optimizations would you prioritize?

### Answer

- ***Bottleneck Identification Methodology***:
  - ***JS Thread Bottleneck***: Identified using ***React Native Performance Monitor*** (In-App Dev Menu) showing drops in JS FPS (< 60) while UI FPS stays high, or via ***Hermes Sampling Profiler*** showing heavy re-renders/scripting during marker updates.
  - ***UI / Native Thread Bottleneck***: Identified when UI FPS drops while JS FPS stays 60, or via ***Xcode Instruments (Time Profiler)*** / ***Android Profiler*** showing high CPU/GPU usage during native view allocation and map tile rasterization.
  - ***Network Bottleneck***: Identified via ***Flipper Network Inspector*** or ***Charles Proxy*** showing saturated socket requests, high latency in telemetry streams, or queued tile fetches.
- ***Priority Map Optimizations***:
  - ***Disable Native View Tracking***: Set `tracksViewChanges={false}` on `react-native-maps` `Marker` components to prevent continuous native snapshot re-renders on every frame.
  - ***Marker Clustering***: Implement spatial indexing (e.g. `supercluster` or `react-native-map-clustering`) to collapse thousands of off-screen or dense driver coordinates into cluster nodes.
  - ***Off-Thread Movement Animations***: Animate driver marker movement on the native thread using ***Reanimated Shared Values*** combined with native map overlay layers rather than React `setState`.
  - ***Coordinate Throttling***: Throttle incoming WebSocket location updates using RxJS or custom ring buffers to limit JS state dispatches to 1-2 Hz per driver.

```typescript
import MapView, { Marker } from 'react-native-maps';
import React, { memo } from 'react';

const DriverMarker = memo(({ driver }: { driver: Driver }) => (
  <Marker
    coordinate={driver.location}
    tracksViewChanges={false} // Prevents continuous native snapshot re-render cycles
    icon={require('./assets/car-icon.png')}
  />
), (prev, next) => prev.driver.id === next.driver.id && prev.driver.location === next.driver.location);
```

---

### Question 7a6b5c4d-3e2f-4a1b-8c9d-0e1f2a3b4c5d

- In a social media app with infinite scrolling feeds, users report frame drops on older Android devices. What techniques would you use in React Native / Expo to improve list performance and memory usage?

### Answer

- ***Replace FlatList with FlashList***: Migrate from `FlatList` to `@shopify/flashlist`. ***FlashList*** recycles existing native views (`CellRenderer` recycling) instead of destroying and re-instantiating native view hierarchies during rapid scroll, reducing garbage collection (GC) pressure on Android.
- ***Provide Accurate Layout Estimates***: Set an accurate `estimatedItemSize` property on `FlashList` to prevent layout jumps and eliminate dynamic measurement overhead during fast scrolling.
- ***Component Hierarchy Flattening***: Simplify item JSX tree depth. Avoid wrapping feed items in redundant, nested flexbox `View` components, which trigger expensive multi-pass layout calculations in the native ***Yoga layout engine*** on Android.
- ***Image Memory Management***: Replace standard `Image` with ***`expo-image`***. Enforce explicit `decodeWidth` / `decodeHeight` props matching view dimensions to prevent decoding full-resolution raw bitmaps into memory cache.
- ***State & Callback Stability***: Wrap feed items in `React.memo` with a custom equality function. Ensure `renderItem`, `keyExtractor`, and interaction callbacks use stable references (`useCallback`) to avoid invalidating child component caches.

```tsx
import { FlashList } from "@shopify/flashlist";
import { Image } from "expo-image";
import React, { useCallback, memo } from "react";

const FeedCard = memo(({ item }: { item: Post }) => (
  <Image
    source={{ uri: item.imageUrl }}
    style={{ width: "100%", height: 300 }}
    contentFit="cover"
    recyclingKey={item.id} // Enables native bitmap recycling in expo-image
  />
));

export function FeedList({ posts }: { posts: Post[] }) {
  const renderItem = useCallback(({ item }: { item: Post }) => <FeedCard item={item} />, []);
  return <FlashList data={posts} renderItem={renderItem} estimatedItemSize={350} keyExtractor={(item) => item.id} />;
}
```

---

### Question 6b5c4d3e-2f1a-4b9c-8d7e-6f5a4b3c2d1e

- A food delivery app experiences delayed screen transitions when navigating between restaurant listings and detail pages. What could be causing this, and how would you optimize navigation performance?

### Answer

- ***Root Causes of Navigation Lag***:
  - ***JS Thread Blocking on Push***: Synchronously rendering a heavy target screen component hierarchy during the navigation push frame blocks the JS thread, delaying the screen transition animation.
  - ***JS-Based Stack Navigators***: Using JS-based card stack animators (`@react-navigation/stack`) instead of hardware-accelerated native container transitions.
- ***Native Stack Navigator Migration***: Switch to `@react-navigation/native-stack` (backed by ***`react-native-screens`***). Native stack uses native platform primitives (`UINavigationController` on iOS, `Fragment` / `FragmentManager` on Android), executing screen transitions entirely on the native UI thread.
- ***Deferred Heavy Rendering***: Defer complex sub-components (dynamic menus, reviews tab, heavy charts) until navigation transition animations complete using ***`InteractionManager.runAfterInteractions`*** or React 18 ***`useTransition`***.
- ***Optimistic Screen Skeleton***: Mount a lightweight skeleton view immediately on navigation push. Fetch restaurant detail payloads asynchronously after target screen mount, populating heavy views post-transition.

```tsx
import React, { useState, useEffect } from 'react';
import { InteractionManager, View } from 'react-native';

export function RestaurantDetailScreen({ route }: Props) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defers heavy UI component mounting until native transition animation finishes
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  if (!isReady) return <RestaurantDetailSkeleton />;
  return <FullRestaurantMenu restaurantId={route.params.id} />;
}
```

---

### Question 5c4d3e2f-1a9b-4c8d-7e6f-5a4b3c2d1e0f

- Your e-commerce app shows product images that take too long to render on slow networks. How would you optimize image loading and caching without introducing excessive memory usage?

### Answer

- ***Native Caching Engine***: Replace stock `Image` with ***`expo-image`*** or ***`react-native-fast-image`***. These leverage native caching engines (***SDWebImage*** on iOS, ***Glide*** on Android) to manage dual-tier (disk and RAM) image caches with aggressive LRU eviction.
- ***CDN Dynamic Downscaling & Formats***: Request exact pixel dimensions from image CDNs (e.g. Cloudinary, Imgix) matching device DPI resolution. Serve modern compressed formats such as ***AVIF*** or ***WebP*** to minimize payload sizes over slow networks.
- ***Low-Quality Image Placeholders (LQIP)***: Load tiny base64-encoded blur hashes (e.g., ***BlurHash*** / ***ThumbHash***) embedded directly in the API product JSON response, rendering immediate blurred backgrounds while the full network image streams in.
- ***Memory Cap Management***: Configure explicit disk and RAM cache limits in app initialization to prevent un-evicted bitmap caches from triggering OS Low-Memory Kills (OOM).

```tsx
import { Image } from 'expo-image';

const blurhash = 'L6PZf_00_w.X_49F%M%M_3t7t7R*';

export function ProductCard({ imageUrl }: { imageUrl: string }) {
  return (
    <Image
      style={{ width: 160, height: 160 }}
      source={{ uri: imageUrl }}
      placeholder={{ blurhash }} // Renders instant local blur background
      transition={200} // Smooth cross-fade transition on network load
      contentFit="cover"
      cachePolicy="memory-disk" // Enforces multi-tier disk & RAM caching
    />
  );
}
```

---

### Question 4d3e2f1a-9b8c-4d7e-6f5a-4b3c2d1e0f9a

- In a chat application, messages arrive in real time but UI updates become sluggish when conversations are long. How would you handle rendering and state updates efficiently?

### Answer

- ***Inverted Virtualized Lists***: Render messages using an inverted `FlatList` or `FlashList` (`inverted={true}`). Inverted lists place item `0` at the visual bottom, avoiding full list re-indexing when appending incoming real-time messages.
- ***Normalized State Architecture***: Store messages in a normalized structure by message ID (e.g., using Redux Toolkit `createEntityAdapter` or Zustand dictionary mapping). Avoid storing messages in a single monolithic array, which forces full array reallocation on state updates.
- ***Custom Item Equality Guards***: Wrap individual message items in `React.memo` with strict comparison logic (`prevProps.message.updatedAt === nextProps.message.updatedAt`). Ensure status changes (e.g. `SENT` -> `READ`) only re-render the single affected message component.
- ***Un-batched Event Throttling***: Buffer incoming WebSocket messages during high-volume spikes into a 100ms micro-batch queue before dispatching state updates to mitigate React re-render thrashing.

```typescript
import React, { memo } from 'react';

export const ChatMessageRow = memo(
  ({ message }: { message: Message }) => (
    <View style={styles.row}>
      <Text>{message.text}</Text>
      <StatusIndicator status={message.status} />
    </View>
  ),
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.status === next.message.status &&
    prev.message.updatedAt === next.message.updatedAt
);
```

---

### Question 3e2f1a9b-8c7d-4e6f-5a4b-3c2d1e0f9a8b

- A fitness tracking app uses multiple animations (progress rings, charts, transitions) that cause jank on low-end devices. How would you improve animation performance in React Native?

### Answer

- ***UI Thread Worklet Execution***: Migrate all animations to ***`react-native-reanimated`*** v3. Reanimated executes animation loops entirely on the UI thread via ***JS Worklets*** and ***JSI***, eliminating frame drops caused by JS thread congestion.
- ***Non-Layout Animated Properties***: Animate strictly hardware-accelerated GPU properties (`transform`, `opacity`). Avoid animating layout properties (`width`, `height`, `margin`, `top`), which force native multi-pass layout recalculations on every frame.
- ***Direct SVG Attribute Manipulation***: For complex progress rings and charts, combine Reanimated `useAnimatedProps` with `react-native-svg` path props (`strokeDashoffset`) to mutate native graphics attributes directly on the UI thread without triggering React reconciliation.
- ***Legacy Animated API Native Driver***: If using React Native built-in `Animated`, set `useNativeDriver: true` for all scalar transform and opacity animations.

```tsx
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({ progress }: { progress: number }) {
  const animatedProgress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 2 * Math.PI * 40 * (1 - animatedProgress.value),
  }));

  return (
    <Svg height="100" width="100">
      <AnimatedCircle cx="50" cy="50" r="40" stroke="blue" animatedProps={animatedProps} />
    </Svg>
  );
}
```

---

### Question 2f1a9b8c-7d6e-4f5a-4b3c-2d1e0f9a8b7c

- Your app performs several API calls on startup, leading to a slow initial load time. How would you restructure data fetching and app initialization to improve perceived performance?

### Answer

- ***Parallel & Staggered Request Orchestration***: Replace sequential API request waterfalls (`await fetchA()`; `await fetchB()`) with non-blocking parallel fetches using `Promise.allSettled()`. Prioritize critical viewport data while deferring secondary startup metrics (analytics, badge counts).
- ***Persisted Cache Hydration***: Implement persistent local caching using high-speed key-value engines like ***`react-native-mmkv`*** or ***TanStack Query (React Query)*** persistent storage plugins. Render hydrated cached data immediately on app launch for zero-wait optimistic rendering.
- ***Controlled Splash Screen Gate***: Keep native splash screen active (`expo-splash-screen`) strictly until minimal critical paths complete, preventing flash of unstyled content (FOUC) or jarring intermediate empty layout states.
- ***HTTP/2 Multiplexing & Request Coalescing***: Consolidate multiple REST initial endpoints into a unified batch GraphQL query or HTTP/2 multiplexed connections to eliminate TLS handshake roundtrip overhead.

```typescript
import storage from './storage';

export async function hydrateStartupData() {
  // Read cached session instantly from MMKV synchronous local storage
  const cachedUser = storage.getString('user_profile');
  
  // Trigger background revalidation asynchronously (Stale-While-Revalidate pattern)
  const networkPromises = Promise.allSettled([
    fetchUserProfile(),
    fetchInitialConfig(),
  ]);

  return {
    initialData: cachedUser ? JSON.parse(cachedUser) : null,
    networkPromises,
  };
}
```

---

### Question 1a9b8c7d-6e5f-4a3b-2c1d-0e9f8a7b6c5d

- In a video streaming app, users experience buffering and UI freezes when switching between videos. What strategies would you use to optimize both playback and UI responsiveness?

### Answer

- ***Native Player Pool Recycling***: Avoid unmounting and creating native video view instances (`AVPlayerViewController` / `ExoPlayer`) on every video track swap. Maintain a small pool of native player view instances, recycling media surfaces and re-binding URL sources to eliminate heavy native memory allocations.
- ***Pre-buffering Adjacent Streams***: Preload adjacent video assets (e.g. next video in feed) into background native player buffers using HLS/DASH media playlists before user navigation occurs.
- ***Decouple Video State from React State Tree***: Offload high-frequency playback status updates (e.g. current progress time firing 10-60 times/sec) from global React state. Wire playback events directly to native UI components or Reanimated Shared Values to prevent broad React component re-renders.
- ***Hardware-Accelerated Control Overlays***: Build video playback controls and gesture handles using Reanimated and Gesture Handler so overlay interactions remain smooth during background media buffer operations.

```tsx
import React, { useRef } from 'react';
import Video, { VideoRef } from 'react-native-video';

export function VideoPlayerItem({ currentUrl, nextUrl }: { currentUrl: string; nextUrl: string }) {
  const activePlayerRef = useRef<VideoRef>(null);

  return (
    <>
      <Video ref={activePlayerRef} source={{ uri: currentUrl }} style={{ flex: 1 }} paused={false} />
      {/* Hidden pre-buffering instance for next video in stream */}
      <Video source={{ uri: nextUrl }} style={{ width: 0, height: 0 }} paused={true} bufferConfig={{ minBufferMs: 3000 }} />
    </>
  );
}
```

---

### Question 9b8c7d6e-5f4a-4b3c-2d1e-0f9a8b7c6d5e

- An Expo app grows in bundle size over time, causing longer startup times. How would you analyze and reduce bundle size effectively?

### Answer

- ***Bundle Inspection & Profiling***: Analyze the Metro JS output bundle using ***`react-native-bundle-visualizer`*** or `@expo/metro-config` source map analyzer to identify oversized packages, duplicate dependencies, and un-shaken code modules.
- ***Tree-Shaking & Modular Imports***: Replace monolithic libraries with modular alternatives (e.g., migrate from `lodash` to `lodash-es` or specific function imports; replace `moment.js` with `date-fns` or `dayjs`).
- ***Hermes Bytecode Pre-compilation***: Enable ***Hermes Engine*** (`jsEngine: "hermes"` in Expo `app.json`). Hermes pre-compiles JS text bundles into binary bytecode during build time, accelerating startup parsing speeds and reducing runtime memory footprint.
- ***Asset Optimization & Remote Hosting***: Move large static assets (high-res images, embedded fonts, Lottie animations) out of the JS bundle package and host them on external CDNs or dynamic Expo updates.

```json
{
  "expo": {
    "jsEngine": "hermes",
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": { "enableMinifyInReleaseBuilds": true },
          "ios": { "useFrameworks": "static" }
        }
      ]
    ]
  }
}
```

---

### Question 8c7d6e5f-4a3b-4c2d-1e0f-9a8b7c6d5e4f

- A news app uses many third-party libraries, and performance degrades after multiple updates. How would you audit dependencies and identify which ones are affecting performance?

### Answer

- ***React DevTools Profiler Flamegraphs***: Capture component render durations using React DevTools Flamegraph profiler. Identify third-party wrapper components causing frequent, cascading re-renders across sibling subtrees.
- ***Native Binary & Startup Footprint Audit***: Measure native library initialization times by adding custom tracing markers (`Performance.mark()` / `Performance.measure()`) during app bootstrap, identifying third-party packages performing synchronous main-thread IO on native init.
- ***Bridge & JSI Traffic Inspection***: Enable bridge logging (`MessageQueue.spy()`) or inspect JSI call frequencies to catch third-party modules sending un-batched, high-frequency JSON strings over the native bridge.
- ***Dependency Pruning & Replacement***: Audit package redundancy using `npx depcheck` and evaluate alternative native packages based on Hermes compatibility, JSI adoption, active maintainability, and bundle size.

```typescript
import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue';

// Spy on legacy bridge traffic to locate noisy third-party modules
if (__DEV__) {
  MessageQueue.spy((msg) => {
    if (msg.module === 'ThirdPartyNativeModule') {
      console.log('Bridge call detected:', msg.method, msg.args);
    }
  });
}
```

---

### Question 7d6e5f4a-3b2c-4d1e-0f9a-8b7c6d5e4f3b

- Your app uses Redux (or similar global state) and frequent updates cause unnecessary re-renders across many components. How would you detect and fix this issue?

### Answer

- ***Detection via Profiler & why-did-you-render***: Use React Profiler or integrate ***`@welldone-software/why-did-you-render`*** in development to log components re-rendering due to non-referentially-equal selector outputs.
- ***Atomic & Fine-Grained Selectors***: Extract minimal state slices instead of subscribing components to monolithic state trees. In Zustand, pass specific selector fields (`useStore(state => state.field)`). In Redux, avoid returning whole state sub-objects.
- ***Memoized Selector Computation***: Use ***`reselect`*** (`createSelector`) for derived state calculations. Reselect caches output references until input selectors change, preventing object allocation on unrelated state updates.
- ***Shallow Equality Checks***: Pass custom equality functions (e.g. `shallowEqual` in Redux `useSelector` or Zustand `useShallow`) when returning multi-property object slices to avoid re-renders when scalar values match.

```typescript
import { useSelector, shallowEqual } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

// Memoized Reselect selector
const selectUserHeaderData = createSelector(
  (state: RootState) => state.user.name,
  (state: RootState) => state.user.avatarUrl,
  (name, avatarUrl) => ({ name, avatarUrl })
);

export function UserHeader() {
  // Uses shallow comparison to prevent re-render when other user fields update
  const { name, avatarUrl } = useSelector(selectUserHeaderData, shallowEqual);
  return <Header name={name} avatarUrl={avatarUrl} />;
}
```

---

### Question 6e5f4a3b-2c1d-4e0f-9a8b-7c6d5e4f3b2a

- A marketplace app shows lag when filtering large datasets on the client side. How would you decide between client-side vs server-side filtering, and how would you optimize either approach?

### Answer

- ***Decision Matrix Thresholds***:
  - ***Client-Side Filtering***: Ideal for small, static datasets (< 1,000 items), offline-first apps, or when sub-10ms filter feedback is required without network latency.
  - ***Server-Side Filtering***: Required for large datasets (> 1,000 items), high-cardinality search, dynamic inventory, or memory-constrained mobile hardware.
- ***Client-Side Filtering Optimizations***:
  - ***Off-Main-Thread Execution***: Execute array filtering in background JS threads using ***`react-native-multithreading`*** or C++ JSI worklets to avoid blocking the main JS UI loop.
  - ***Indexed Lookups & Tries***: Pre-build indexed `Map` data structures or prefix Tries on payload arrival for $O(1)$ or $O(k)$ lookups instead of running $O(N)$ array `.filter()` calls per keystroke.
- ***Server-Side Filtering Optimizations***:
  - ***Debounced Queries & AbortController***: Debounce search inputs by 300ms and cancel in-flight stale network requests using `AbortController`.
  - ***Cursor-Based Pagination***: Paginate backend response payloads (e.g. 20 items per fetch) to preserve low memory footprint.

```typescript
import { useMemo } from 'react';

export function useOptimizedSearch(items: Product[], query: string) {
  // Pre-index items by category for O(1) retrieval
  const categoryIndex = useMemo(() => {
    const map = new Map<string, Product[]>();
    items.forEach(item => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return map;
  }, [items]);

  return categoryIndex.get(query) || [];
}
```

---

### Question 5f4a3b2c-1d0e-4f9a-8b7c-6d5e4f3b2a1c

- On Android, your app occasionally drops frames during heavy computations, while iOS performs better. What platform-specific differences might explain this, and how would you address them?

### Answer

- ***Platform Architectural Differences***:
  - ***Yoga Layout Pass Complexity***: Android native view hierarchies require more expensive layout pass measurements in the ***Yoga Layout Engine*** compared to iOS `CoreGraphics`/`UIKit` render pipelines.
  - ***Garbage Collection (GC) Pauses***: Lower-tier Android devices have restricted heap memory limits. Frequent object allocations trigger V8/Hermes GC pause sweeps that freeze the JS thread.
  - ***Thread Concurrency & Core Throttling***: Android SOCs often throttle low-power CPU cores under thermal pressure, whereas iOS hardware maintains single-thread IPC performance.
- ***Android-Specific Optimizations***:
  - ***Hermes Engine GC Tuning***: Ensure Hermes is enabled with optimized heap flags. Reduce transient object allocation inside render loops.
  - ***Hardware Texture Layering***: Apply `renderToHardwareTextureAndroid={true}` on complex animated static component subtrees to cache rendered views directly in GPU hardware memory during native animations.
  - ***Flatten View Tree***: Eliminate unnecessary `View` containers and draw text/icons on unified custom native views or canvas layers.

```tsx
import { View } from 'react-native';

export function AnimatedComplexCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      renderToHardwareTextureAndroid={true} // Offloads layout rendering to Android GPU hardware layer
      style={{ borderRadius: 8, elevation: 4 }}
    >
      {children}
    </View>
  );
}
```

---

### Question 4a3b2c1d-0e9f-4a8b-7c6d-5e4f3b2a1c0d

- A navigation-heavy app shows memory leaks after prolonged usage. How would you detect and fix memory leaks in a React Native / Expo environment?

### Answer

- ***Detection Diagnostics***:
  - ***Xcode Instruments (Allocations & Leaks)***: Track native memory footprint while repeatedly navigating forward and back across screen stacks. Look for un-reclaimed `RCTView` or `UIViewController` instances.
  - ***Android Studio Memory Heap Dump***: Capture baseline heap dumps, execute navigation loops, trigger GC, and compare heap allocations to detect retained activity contexts or un-GC'd React native view holders.
- ***Common Memory Leak Causes***:
  - ***Active Event Subscriptions***: Leaving active native event listeners (`DeviceEventEmitter`, `AppState`, `BackHandler`) or global store subscriptions un-subscribed upon screen unmount.
  - ***Un-cleared Asynchronous Timers***: Running `setInterval` or dangling `Promise` callbacks mutating state on unmounted components.
  - ***Retained Navigation Event Listeners***: Attaching `navigation.addListener()` listeners without returning cleanup functions in `useEffect`.
- ***Fix Patterns***:
  - Return cleanups for all timers and subscriptions in `useEffect`.
  - Set `unmountOnBlur: true` on tab navigators for memory-heavy screens or reset stack histories on deep navigation jumps.

```typescript
import React, { useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

export function SensorScreen({ navigation }: Props) {
  useEffect(() => {
    const emitter = new NativeEventEmitter(NativeModules.SensorModule);
    const subscription = emitter.addListener('onSensorData', (data) => {
      // Process data
    });

    // Mandatory cleanup return function prevents memory leaks on screen unmount
    return () => {
      subscription.remove();
    };
  }, []);

  return <SensorView />;
}
```

---

### Question 3b2c1d0e-9f8a-4b7c-6d5e-4f3b2a1c0d9e

- Your app uses WebView for certain features, and performance is noticeably worse compared to native screens. What are the trade-offs and optimization strategies?

### Answer

- ***Architectural Trade-Offs***:
  - ***Memory Overhead***: Each `WebView` spawns an isolated native browser engine process (`WKWebView` on iOS, `Android Webview` engine), consuming 50-150MB+ RAM per instance.
  - ***IPC Bridge Latency***: Message passing over `postMessage` / `onMessage` involves serializing strings across the native bridge, introducing overhead for real-time state synchronization.
- ***WebView Optimization Strategies***:
  - ***Pre-Warming & Instance Reuse***: Pre-instantiate a background `WebView` instance or maintain a single recycled webview container to eliminate cold-start browser engine boot latencies.
  - ***Local Static HTML/Asset Bundling***: Bundle web assets (HTML, CSS, JS bundles) directly inside local app assets and load via `file://` or custom local scheme protocols instead of fetching over remote network HTTP URLs.
  - ***Hardware Acceleration & Feature Pruning***: Set `androidHardwareAccelerationDisabled={false}` and disable unnecessary features (`javaScriptEnabled` only if needed, disable geolocation/file access) to shrink memory allocation.

```tsx
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';

const localHTML = require('./assets/hybrid-chart/index.html');

export function ChartWebView() {
  return (
    <WebView
      source={Platform.OS === 'android' ? { uri: 'file:///android_asset/hybrid-chart/index.html' } : localHTML}
      originWhitelist={['*']}
      androidHardwareAccelerationDisabled={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
    />
  );
}
```

---

### Question 2c1d0e9f-8a7b-4c6d-5e4f-3b2a1c0d9e8f

- A travel app preloads data for upcoming screens to improve UX but ends up consuming too much memory and crashing on low-end devices. How would you balance prefetching and memory constraints?

### Answer

- ***Adaptive Memory-Aware Prefetching***: Query available system hardware capabilities (via `react-native-device-info`) before executing prefetch routines. Disable or limit prefetching queues on devices with < 3GB total RAM.
- ***Shallow Payload Prefetching***: Prefetch only lightweight metadata schemas (JSON text fields, low-res thumbnails) rather than full high-resolution media galleries or deep nested entities.
- ***Bounded LRU Cache Eviction***: Wrap prefetched stores in an ***LRU (Least Recently Used)*** cache with fixed item count and byte-size thresholds, automatically dropping stale prefetched screens from RAM.
- ***Native Low-Memory Warning Hooks***: Subscribe to OS system memory pressure events (`AppState` memory warnings or native `onLowMemory` callbacks) to purge all non-essential prefetched data immediately.

```typescript
import { AppState, NativeEventEmitter, NativeModules } from 'react-native';
import { LRUCache } from 'lru-cache';

// Bounded memory cache capped at 50 items or 20MB total
const prefetchCache = new LRUCache<string, object>({
  max: 50,
  maxSize: 20 * 1024 * 1024,
  sizeCalculation: (value) => JSON.stringify(value).length,
});

export function handleLowMemoryEviction() {
  // Purge prefetch cache when OS fires low memory warning
  prefetchCache.clear();
}
```

---

### Question 1d0e9f8a-7b6c-4d5e-4f3b-2a1c0d9e8f7a

- Your app experiences performance degradation only in production builds, not in development. What factors could cause this discrepancy, and how would you debug it?

### Answer

- ***Discrepancy Root Causes***:
  - ***Hermes vs JSC Engine Differences***: Hermes is enabled for production release builds while development runs on JavaScriptCore (JSC), causing JS engine execution variances.
  - ***Minification & ProGuard / R8 Side-Effects***: Terser minification or Android R8 code shrinking stripping essential native reflection signatures or corrupting JSON serialization logic.
  - ***Stripped Development Guards***: Developer warning polyfills (`__DEV__`) hiding synchronous filesystem reads or heavy initializations that run unfiltered in production.
  - ***Third-Party Production SDK Overheads***: Heavy production analytics, crash reporting (Sentry, Datadog), or performance monitoring SDKs executing un-batched main-thread network logging.
- ***Debugging Methodology***:
  - Build local Release variants (`npx react-native run-android --mode=release` / Xcode Release scheme) to profile locally.
  - Enable ***Hermes Sampling Profiler*** on Release builds to inspect production JS flamegraphs.
  - Temporarily disable R8/ProGuard or third-party analytics SDKs to isolate performance regressions.

```bash
# Build and run Android release build locally to reproduce production-only performance issues
npx react-native run-android --mode=release

# Capture Hermes Sampling Profiler trace on Release build
adb reverse tcp:8081 tcp:8081
npx react-native profile-hermes
```

---

### Question 0e9f8a7b-6c5d-4e4f-3b2a-1c0d9e8f7a6b

- A real-time stock trading app requires ultra-fast updates without UI lag. How would you design the data flow and rendering strategy to ensure performance under high-frequency updates?

### Answer

- ***Decouple Data Ingestion from React State***: Ingest high-frequency WebSocket tick updates (100+ ticks/sec) into an off-React-state C++ or JSI buffer array. Avoid calling React `setState` per incoming tick to prevent render tree collapse.
- ***Frame-Rate Render Batching (60 FPS Ticker)***: Synchronize UI updates with native screen refresh rates using `requestAnimationFrame` or a 16.6ms frame ticker loop, batching raw incoming tick queues before dispatching state.
- ***Direct UI Thread Mutation via Reanimated Shared Values***: Store high-frequency numbers (e.g. stock price labels, color indicators) in Reanimated Shared Values. Mutate native text nodes directly via JSI without triggering React component lifecycle re-renders.
- ***Virtualized & Stable Grid Viewports***: Render stock watchlists using `FlashList` with rigid item heights and explicit key extractors, memoizing grid row components.

```tsx
import Animated, { useSharedValue, useAnimatedProps } from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function TickerPriceRow({ priceSharedValue }: { priceSharedValue: Animated.SharedValue<string> }) {
  // Directly updates native text property on UI thread without triggering React re-renders
  const animatedProps = useAnimatedProps(() => ({
    text: priceSharedValue.value,
  } as any));

  return <AnimatedTextInput editable={false} animatedProps={animatedProps} style={{ color: 'green' }} />;
}
```

---

### Question 9f8a7b6c-5d4e-4f3b-2a1c-0d9e8f7a6b5c

- Your app uses heavy JSON parsing from API responses, causing noticeable delays. How would you optimize parsing and data handling?

### Answer

- ***JSI / Off-Thread Background Parsing***: Offload multi-megabyte `JSON.parse()` operations off the main JS single thread to background worker threads using ***`react-native-multithreading`*** or C++ JSI background tasks.
- ***Binary Protocol Adoption (Protobuf / FlatBuffers)***: Replace text-based JSON payloads with binary serialization formats (***Protocol Buffers*** or ***FlatBuffers***). FlatBuffers allow accessing nested fields directly from memory without parsing the entire payload into JS objects.
- ***Stream Parsing & Chunking***: Implement streaming JSON parsers (e.g. `oboe.js` or `JSONStream`) to process incoming chunked network responses incrementally over HTTP stream connections.
- ***Backend Schema Projection***: Trim backend payload size via GraphQL or field filtering parameters, returning strictly fields required for immediate screen visualization.

```typescript
import { spawnThread } from 'react-native-multithreading';

// Offload multi-megabyte JSON parsing to background JSI thread
export async function parseLargePayloadAsync(rawJsonString: string) {
  return await spawnThread(() => {
    'worklet';
    return JSON.parse(rawJsonString);
  });
}
```

---

### Question 8a7b6c5d-4e3f-4b2a-1c0d-9e8f7a6b5c4d

- A cross-platform app performs well on iOS but poorly on Android when rendering complex layouts. What layout or styling differences could cause this, and how would you optimize for Android?

### Answer

- ***Platform Layout & Styling Causes***:
  - ***Expensive Elevation & Shadows***: Android `elevation` triggers expensive hardware shadow map computations on native Android view layers, whereas iOS `shadowColor` / `shadowOffset` uses optimized CoreAnimation shadow paths.
  - ***Deep Nested Flexbox Views***: Android's native view system incurs higher layout recalculation overhead per nested layer during Yoga layout passes compared to iOS `UIView` hierarchies.
  - ***GPU Overdraw***: Multiple overlapping opaque background views (`backgroundColor`) cause the Android GPU to render pixels multiple times per frame (overdraw).
- ***Android Optimization Strategies***:
  - ***Flatten View Tree Hierarchy***: Replace nested container `View` components with single flattened flex containers or absolute layout positioning.
  - ***Replace Elevation with Custom Vector/Image Shadows***: Avoid high `elevation` values on animated cards; use static SVG or image shadow assets on Android.
  - ***Remove Redundant Backgrounds***: Remove unnecessary `backgroundColor` styles on nested child views to eliminate GPU overdraw on Android surfaces.

```tsx
import { View, Platform, StyleSheet } from 'react-native';

export function CardContainer({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    // Cross-platform optimized shadow styling
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2, // Keep elevation low to avoid heavy Android GPU shadow passes
      },
    }),
  },
});
```
