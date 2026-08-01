# Mobile Debugging

### Question a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d

- A production React Native app crashes only on Android when navigating quickly between screens, but cannot be reproduced in development. What step-by-step approach would you take to identify the root cause?

### Answer

- ***Symbolicate Production Crash Logs***: Fetch raw native stack traces from crash analytics (Sentry, Firebase Crashlytics, or `adb logcat`). Symbolicate them using ProGuard/R8 ***mapping.txt*** files and native C++ `.so` debug symbols (`ndk-stack`) to reveal un-symbolicated addresses.
- ***Inspect Native Fragment & Concurrency Collisions***: Rapid screen switching on Android commonly triggers ***Fragment Transaction Collisions*** (e.g. `IllegalStateException: Can not perform this action after onSaveInstanceState`) or null-pointer access when asynchronous JS callbacks attempt to mutate Native Views already unmounted by the native window manager.
- ***Replicate Standalone Release Build Locally***: Build an APK locally using `npx react-native run-android --mode=release` (or `npx expo run:android --variant release`). Inspect logs via `adb logcat | grep -i "AndroidRuntime"`.
- ***Enforce Navigation Throttling & Subscription Cleanup***: Prevent double-tap rapid navigation by debouncing screen transitions or locking navigation actions until transition state settles, and cancel pending promises/listeners in `useEffect` cleanup routines.

```javascript
import { useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

export function useThrottledNavigation() {
  const navigation = useNavigation();
  const isNavigating = useRef(false);

  const navigateThrottled = useCallback((routeName, params) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    
    navigation.navigate(routeName, params);

    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  }, [navigation]);

  return navigateThrottled;
}
```

---

### Question b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e

- Users report that a feature works on iOS but silently fails on Android without errors. How would you systematically debug platform-specific issues in React Native / Expo?

### Answer

- ***Audit Android Manifest & Native Permissions***: Verify that all required Android permissions (e.g. `FOREGROUND_SERVICE`, `READ_EXTERNAL_STORAGE`, or `POST_NOTIFICATIONS`) are declared in `AndroidManifest.xml` and requested dynamically at runtime; Android silently fails native API calls if permissions are missing.
- ***Check Engine-Specific JavaScript Engine Differentials***: Inspect engine differences between iOS (JavaScriptCore) and Android (Hermes). Hermes enforces strict compliance on features like `Date.parse()` or regular expressions. Invalid date string formats (e.g. `2026-08-01 10:00:00` vs ISO 8601 standard) return `NaN` or fail silently on Hermes without throwing exceptions.
- ***Inspect Zero-Height Layout Containers***: Android layout calculation requires explicit dimension rules (`flex: 1` or fixed `height`/`width`). Missing parent flex rules can cause components to render with `height: 0` or position off-screen invisibly on Android while auto-expanding on iOS.
- ***Capture Async Native Bridge Rejections***: Wrap native module calls in `try/catch` blocks and log rejected native Promises that fail to propagate automatically to JS global error boundaries.

```javascript
// Safe Hermes-compliant Date Parsing Helper
export function parsePlatformDate(dateString) {
  if (!dateString) return null;
  // Convert standard SQL datetime to ISO-8601 compliant string for Hermes
  const isoFormatted = dateString.replace(' ', 'T');
  const timestamp = Date.parse(isoFormatted);
  
  if (isNaN(timestamp)) {
    console.warn(`[Platform Warning] Invalid date format for Hermes: ${dateString}`);
    return null;
  }
  return new Date(timestamp);
}
```

---

### Question c3d4e5f6-a1b2-4c3d-0e4f-5a6b7c8d9e0f

- Your app occasionally freezes for a few seconds when a user performs a specific action, but there are no crash logs. How would you identify whether the issue is related to the JS thread, UI thread, or a blocking operation?

### Answer

- ***Monitor Thread Frame Rates via Performance Monitor***: Enable the React Native Dev Menu `Perf Monitor` or use profiling tools like ***Flashlight*** / ***React Native DevTools*** to observe ***JS FPS*** and ***UI FPS*** concurrently during the freeze.
- ***Analyze JS Thread vs UI Thread Drops***:
  - ***JS FPS drops to 0 while UI FPS remains 60***: The JS thread is blocked by heavy synchronous execution (e.g. massive JSON parsing, deep object cloning, complex sorting algorithms, or synchronous storage access). Smooth animations (`useNativeDriver: true`) continue running.
  - ***UI FPS drops to 0***: The main native UI thread is blocked by expensive layout recalculations, complex view hierarchy mounting, or heavy synchronous computations on native UI threads.
- ***Record Hermes CPU Profile***: Capture a `.cpuprofile` trace using the Hermes Sampling Profiler in Chrome DevTools or React Profiler to pinpoint the exact JS function call taking long CPU time.

---

### Question d4e5f6a1-b2c3-4d4e-1f5a-6b7c8d9e0f1a

- A bug appears only in production builds after enabling minification and optimization. How would you debug and isolate issues caused by production-only configurations?

### Answer

- ***Identify Name Mangling & Reflection Breakage***: Minification (Terser / Hermes bytecode compiler) mangles function and class names. Code relying on `constructor.name`, class reflection, or object key string lookups breaks in production builds.
- ***Audit Dead Code Elimination & Side-Effect Stripping***: Aggressive tree-shaking may purge modules imported solely for side-effects (e.g. crypto polyfills). Configure ProGuard / R8 keeping rules (`-keepclassmembers`) for native Java/Kotlin classes called dynamically via native bridges.
- ***Isolate Build Optimizations Step-by-Step***: Reproduce locally using a release build (`--mode=release`). Systematically toggle build flags in `android/app/build.gradle` (`enableHermes`, `minifyEnabled`, `shrinkResources`) and `metro.config.js` to isolate which step breaks execution.

```proguard
# android/app/proguard-rules.pro
# Preserve class names and methods used by native bridge reflection
-keepclasseswithmembernames class * {
    native <methods>;
}

-keep class com.facebook.react.bridge.** { *; }
```

---

### Question e5f6a1b2-c3d4-4e5f-2a6b-7c8d9e0f1a2b

- Users report inconsistent behavior when network conditions are poor (e.g., duplicate requests, stale UI). How would you reproduce, debug, and fix race conditions related to network calls?

### Answer

- ***Simulate Poor Network & Latency Inversion***: Use network throttling tools (Network Link Conditioner, Charles Proxy, or Android Emulator Extended Controls) to introduce high latency, packet drop, and out-of-order response arrivals.
- ***Cancel Stale Pending Requests with AbortController***: Cancel ongoing asynchronous requests when dependent UI state changes or components unmount to prevent out-of-order responses from overwriting newer state.
- ***Implement Optimistic Updates with Idempotency Keys***: Attach unique idempotency headers (`X-Request-ID`) to API requests to prevent server-side duplicate execution during client retries.

```javascript
import { useEffect, useState } from 'react';

export function useFetchUser(userId) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const response = await fetch(`/api/user/${userId}`, {
          signal: controller.signal,
        });
        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err);
        }
      }
    }

    loadData();

    return () => controller.abort(); // Prevents race condition from out-of-order completion
  }, [userId]);

  return data;
}
```

---

### Question f6a1b2c3-d4e5-4f6a-3b7c-8d9e0f1a2b3c

- A screen sometimes renders with incorrect data after navigating back and forth multiple times. What debugging steps would you take to identify state synchronization issues?

### Answer

- ***Understand Navigation Stack Lifecycle***: React Navigation retains previous screens in memory within the navigation stack without unmounting them. Standard `useEffect` hooks with empty dependency arrays (`[]`) do NOT re-run when focusing back onto a retained screen.
- ***Check Stale Closures & Event Listeners***: Event listeners or RxJS/EventEmitter subscriptions attached inside components can capture stale state references if dependencies are omitted in hooks.
- ***Replace Lifecycle Hooks with Focus Listeners***: Use `useFocusEffect` or `useIsFocused` to re-fetch or re-synchronize local component state whenever the screen gains focus.

```javascript
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function ProfileScreen({ route }) {
  const { userId } = route.params;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function syncScreenData() {
        const data = await fetchLatestProfile(userId);
        if (isMounted) {
          // Sync state on every screen focus
        }
      }

      syncScreenData();

      return () => {
        isMounted = false;
      };
    }, [userId])
  );
}
```

---

### Question a2b3c4d5-e6f1-4a2b-8c3d-4e5f6a7b8c9d

- Your app has a memory leak that causes crashes after prolonged use. How would you detect, reproduce, and fix memory leaks in a React Native / Expo environment?

### Answer

- ***Capture & Compare Heap Snapshots***: Connect Chrome DevTools to the Hermes engine (`chrome://inspect`) or use Xcode Instruments (Leaks/Allocations) / Android Studio Profiler. Take a baseline memory heap snapshot, perform a repetitive UI flow (e.g. open and close a screen 20 times), force garbage collection, and take a second snapshot to identify retained JS objects and unreleased views.
- ***Audit Common Leak Anti-Patterns***:
  - ***Uncleared Timers & Listeners***: Forgotten `setInterval`, `setTimeout`, `DeviceEventEmitter`, or RxJS subscriptions.
  - ***Retained Native View References***: Custom native components or video players holding static strong references to Android `Context` or iOS view controllers.
  - ***Unbounded Global Caches***: Redux state or global objects continuously appending items without eviction policies (e.g. endless pagination lists stored in global state).
- ***Fix Cleanup Functions***: Ensure every hook return function explicitly unsubscribes and releases resources.

---

### Question b3c4d5e6-f1a2-4b3c-9d4e-5f6a7b8c9d0e

- A feature relying on async storage occasionally returns outdated values. How would you debug potential caching or persistence issues?

### Answer

- ***Distinguish In-Memory Cache vs Disk Writes***: Modern storage wrappers (e.g. MMKV) keep an in-memory JS cache. Race conditions occur when synchronous in-memory state is read before asynchronous disk writes complete across background workers or app reloads.
- ***Audit Unawaited Persistence Promises***: Missing `await` keywords on `AsyncStorage.setItem()` or MMKV async calls allow subsequent code execution before disk flush completes.
- ***Inspect Storage States with Developer Tools***: Use Reactotron (AsyncStorage / MMKV plugin) or Flipper to track exact timestamped storage writes, keys, and values in real time.

```javascript
// Reliable Atomic Storage Cache Wrapper Pattern
import MMKV from 'react-native-mmkv';

const storage = new MMKV();

export const StorageService = {
  setJSON(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      storage.set(key, jsonValue); // MMKV is synchronous and thread-safe
    } catch (e) {
      console.error(`Error saving key ${key}:`, e);
    }
  },

  getJSON(key) {
    try {
      const jsonValue = storage.getString(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error(`Error reading key ${key}:`, e);
      return null;
    }
  }
};
```

---

### Question c4d5e6f1-a2b3-4c4d-0e5f-6a7b8c9d0e1f

- A push notification opens the wrong screen or inconsistent data when tapped. How would you trace and debug deep linking and navigation issues?

### Answer

- ***Distinguish App Start States***:
  - ***Cold Start (App Terminated)***: App launches from zero state; deep link payload is retrieved via `Linking.getInitialURL()` or notification initial state API (`getInitialNotification()`). Race conditions occur if navigation fires before `NavigationContainer` finishes mounting.
  - ***Warm/Hot Start (App Backgrounded)***: App is active in memory; payload triggers event listeners (`Linking.addEventListener('url')`).
- ***Verify Navigation Container Readiness***: Gate deep link execution until `NavigationContainer` emits its `onReady` event.
- ***Test Payload Strings via CLI Tools***: Simulate notification deep link routing directly from shell commands without triggering push servers.

```bash
# Android Deep Link Trigger Test
npx uri-scheme open "myapp://details/123?promo=summer" --android

# iOS Simulator Deep Link Trigger Test
xcrun simctl openurl booted "myapp://details/123?promo=summer"
```

---

### Question d5e6f1a2-b3c4-4d5e-1f6a-7b8c9d0e1f2a

- A bug occurs only on certain Android devices with specific OS versions. How would you gather enough information and isolate the issue without having physical access to those devices?

### Answer

- ***Replicate Target Environment in Android Studio Emulator***: Create an Android Virtual Device (AVD) matching the exact OS version (e.g. Android 14 API 34), ABI architecture (ARM64 vs x86), screen resolution, and vendor-specific OEM settings.
- ***Utilize Remote Device Cloud Farms***: Execute manual or automated test sessions on device clouds (AWS Device Farm, Firebase Test Lab, BrowserStack) to obtain real-device system logs (`adb logcat`), video recordings, and screenshots.
- ***Analyze Telemetry & Hardware Metadata***: Check Sentry/Crashlytics crash reports for specific hardware metadata: GPU vendor (Adreno vs Mali), available RAM, SoC chipset, and vendor custom Android skins (Xiaomi MIUI, Samsung One UI) which often aggressively enforce background battery management rules.

---

### Question e6f1a2b3-c4d5-4e6f-2a7b-8c9d0e1f2a3b

- Your app logs show errors, but they are not helpful (e.g., minified stack traces). What tools and steps would you use to improve debugging visibility in production?

### Answer

- ***Automate Source Map & Symbol Uploads***: Upload JS Metro source maps (`.map`) and native debug symbols (Android `mapping.txt` / R8 mappings, iOS `dSYM` bundles) to crash tracking tools (Sentry, Bugsnag, Datadog) automatically during CI/CD release builds.
- ***Symbolicate Hermes Bytecode Offsets***: Hermes compiles JS into bytecode (`.hbc`). Use `@react-native-community/cli` source map composition (`compose-source-maps`) to transform Hermes bytecode stack offsets back into readable TypeScript source code line numbers.
- ***Attach Global Error Handlers & Breadcrumbs***: Intercept uncaught JS exceptions using `ErrorUtils.setGlobalHandler()` and log network requests, navigation route changes, and user actions as contextual breadcrumbs.

```javascript
// Custom Global JS Error Handler setup
if (!__DEV__) {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Send structured error payload to crash reporter
    Sentry.captureException(error, {
      extra: { isFatal },
    });
    
    // Call default handler to maintain native crash behavior if fatal
    defaultHandler(error, isFatal);
  });
}
```

---

### Question f1a2b3c4-d5e6-4f1a-3b8c-9d0e1f2a3b4c

- A third-party library causes intermittent crashes, but only under specific conditions. How would you confirm the root cause and decide whether to patch, replace, or work around it?

### Answer

- ***Isolate in Minimal Reproduction Example (MRE)***: Extract the library and minimal configuration into a fresh, isolated React Native project to confirm if the crash is inherent to the library or caused by app code interactions.
- ***Analyze Native Symbolicated Stack Traces***: Determine if the crash originates in JS (e.g. unhandled exception) or Native C++/Java/Swift (e.g. null pointer exception, main thread UI access violation).
- ***Determine Fix Strategy***:
  - ***Patch (`patch-package` / `npx patch-package`)***: Best for isolated bugs, missing null checks, or single-line native fixes when upstream maintainers are slow to merge PRs.
  - ***Workaround***: Wrap library components inside React ***Error Boundaries*** or JS guard conditions if the crash is non-fatal and triggered by edge-case inputs.
  - ***Replace***: Mandatory if the library is unmaintained, incompatible with modern React Native architecture (Fabric/Turbomodules/Hermes), or causes native memory corruption.

---

### Question a3b4c5d6-e7f2-4a3b-8c4d-5e6f7a8b9c0d

- A form submission occasionally fails without user feedback. How would you trace the full flow (UI → validation → API → response) to identify where the failure occurs?

### Answer

- ***Audit Silent Catch Blocks & Validation Rejections***: Check if client-side validation libraries (Zod, Yup) reject form values without triggering error UI state, or if `try/catch` blocks swallow API errors without updating user-facing state.
- ***Inspect HTTP Payload & Response Cycles***: Use Reactotron, Flipper Network Inspector, or Proxyman to capture outgoing request bodies, headers, and exact HTTP response codes (e.g. 422 Unprocessable Entity vs 500 Internal Error).
- ***Enforce Explicit Form State Machine Architecture***: Implement explicit submission states (`idle`, `validating`, `submitting`, `success`, `error`) and ensure every error code updates the error state.

```javascript
import { useState } from 'react';

export function useFormSubmit(submitApiCall) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (formData) => {
    setStatus('submitting');
    setErrorMessage(null);

    try {
      await submitApiCall(formData);
      setStatus('success');
    } catch (err) {
      console.error('[Form Submit Failed]:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    }
  };

  return { handleSubmit, status, errorMessage };
}
```

---

### Question b4c5d6e7-f2a3-4b4c-9d5e-6f7a8b9c0d1e

- Your app behaves differently when running in Expo Go versus a standalone build. How would you debug environment-specific issues?

### Answer

- ***Identify Unlinked Native Modules***: Expo Go includes a fixed, pre-compiled set of native libraries. Custom native modules (Swift, Kotlin, C++) or libraries requiring custom native Gradle/CocoaPods setup will fail or behave unpredictably in Expo Go.
- ***Audit Static Asset Resolution & Env Variables***: Assets and environment configuration (`process.env`, `EXPO_PUBLIC_` variables) are served dynamically via Metro dev server in Expo Go but embedded statically into binary bundles in standalone builds.
- ***Debug with Expo Development Builds***: Create an Expo Development Build (`npx expo run:android` / `npx expo run:ios`) using `expo-dev-client`. This compiles your exact native binary environment while keeping JS debugging and hot-reloading active.

---

### Question c5d6e7f2-a3b4-4c5d-0e6f-7a8b9c0d1e2f

- A Redux (or similar) state update does not trigger a UI re-render as expected. What debugging steps would you take to identify the issue?

### Answer

- ***Detect Reference Mutability Violations***: React Redux relies on strict shallow reference equality checks (`===`). Direct mutations of state objects (e.g., `state.user.profile = name`) modify internal values while keeping the object reference identical, preventing selectors from detecting changes and triggering re-renders.
- ***Audit Selector Returns & Memoization***: Inspect `useSelector` hooks. Returning new object or array literals directly inside selectors (e.g. `state => state.items.filter(...)`) creates a new reference on every dispatch, whereas returning unmutated slices without properly configured memoization (Reselect / `shallowEqual`) causes unexpected render loops or stale references.
- ***Verify Dispatches in Redux DevTools / Reactotron***: Confirm that: (1) the action was actually dispatched with valid payload, (2) the target reducer handled the action, and (3) the resulting state slice reference changed.

```javascript
// ❌ WRONG: Direct State Mutation (No Re-render)
function badReducer(state, action) {
  state.items.push(action.payload); // Mutates array reference
  return state;
}

// ✅ CORRECT: Immutable State Update (Triggers Re-render)
function goodReducer(state, action) {
  return {
    ...state,
    items: [...state.items, action.payload], // Creates new array reference
  };
}
```

---

### Question d6e7f2a3-b4c5-4d6e-1f7a-8b9c0d1e2f3a

- A feature works correctly in isolation but breaks when integrated with other parts of the app. How would you debug integration issues?

### Answer

- ***Inspect Global State & Context Pollution***: Isolated feature tests run with clean initial state. In integrated builds, global state (Redux, React Context, AsyncStorage) modified by prior user flows can corrupt incoming feature state.
- ***Identify Singleton & Event Listener Collisions***: Check for shared singleton services (e.g. `DeviceEventEmitter`, `Geolocation`, Audio Focus, or WebSocket managers) where multiple components attach competing listeners or overwrite handler callbacks.
- ***Audit UI Overlay & Layout Stacking Contexts***: Modals, Portals, and absolute positioned elements in shared app shells can obscure, capture touch events, or apply restrictive flex constraints on integrated sub-views.

---

### Question e7f2a3b4-c5d6-4e7f-2a8b-9c0d1e2f3a4b

- Your app occasionally makes duplicate API calls, causing inconsistent data. How would you trace and fix unintended side effects?

### Answer

- ***Check React StrictMode in Development***: `React.StrictMode` intentionally mounts, unmounts, and re-mounts components in development to expose uncleaned side-effects. Confirm whether duplicate calls occur in production builds.
- ***Fix Unstable Hook Dependency Arrays***: Inline function definitions, object literals, or array literals passed as dependencies to `useEffect` or `useCallback` recreate references on every render, triggering effect re-execution.
- ***Leverage Query Deduplication Middleware***: Use query caching solutions (React Query / RTK Query) which automatically deduplicate concurrent requests for matching query keys, or debounce manual submission actions.

```javascript
import { useQuery } from '@tanstack/react-query';

export function useUserProfile(userId) {
  // React Query automatically deduplicates simultaneous calls across components
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
```

---

### Question f2a3b4c5-d6e7-4f2a-3b9c-0d1e2f3a4b5c

- A user reports a bug, but you cannot reproduce it locally. What steps would you take to gather information, reproduce the issue, and validate the fix?

### Answer

- ***Extract User Diagnostics & Telemetry Breadcrumbs***: Gather session logs from telemetry tools (Sentry, LogRocket, UXCam): exact app version, OS version, device model, user locale, battery level, network state, and event sequence breadcrumbs leading up to the issue.
- ***Reconstruct Exact User State Locally***: Export anonymized user database/AsyncStorage state snapshots and import them into a local development build to recreate identical data conditions.
- ***Write Automated Regression Tests & Validate in Beta Build***: Write a failing unit/integration test (Jest / React Native Testing Library) modeling the issue, apply the fix to make tests pass, and distribute a targeted staging build (TestFlight / Google Play Internal Track) to the affected user group for validation.

---

### Question a4b5c6d7-e8f3-4a4b-8c5d-6e7f8a9b0c1d

- After a recent release, crash rates increase significantly. How would you triage, prioritize, and fix issues under time pressure?

### Answer

- ***Analyze Crash Metrics & Impact Severity***: Inspect Sentry / Crashlytics dashboards to group crashes by stack trace, impacted user percentage, device models, and OS versions to isolate the primary culprit.
- ***Select Hotfix Strategy (OTA vs Emergency Native Release)***:
  - ***JavaScript-Only Bug***: Push an immediate Over-The-Air (OTA) update via Expo Updates or CodePush to patch production instantly without waiting for app store reviews.
  - ***Native Crash / Build Config Issue***: Initiate an expedited emergency app store binary submission or roll back to the previous stable release.
- ***Isolate Breaking Change with Git Bisect & Remote Flags***: Use `git bisect` between release tags to pinpoint the offending commit. Disable problematic features remotely via feature flags (Firebase Remote Config, LaunchDarkly).

---

### Question b5c6d7e8-f3a4-4b5c-9d6e-7f8a9b0c1d2e

- A bug fix introduces a regression in another feature. What debugging and testing strategies would you use to prevent and detect regressions?

### Answer

- ***Establish Multi-Tier Automated Testing Architecture***:
  - ***Unit & Integration Testing***: Validate business logic, state reducers, and component trees with Jest and React Native Testing Library (RNTL).
  - ***End-to-End (E2E) UI Automation***: Automate critical user journeys (authentication, payment, navigation) on native emulators using Detox, Maestro, or Appium in CI pipelines.
- ***Enforce Static Type Checking & Linting Rules***: Enforce strict TypeScript rules (`strictNullChecks`, `noImplicitAny`) and schema validation (Zod) to prevent broken property contracts when refactoring shared modules.
- ***Block Releases via CI/CD Quality Gates***: Configure GitHub Actions / Bitrise to block PR merges automatically whenever existing test suites fail or code coverage drops below established thresholds.
