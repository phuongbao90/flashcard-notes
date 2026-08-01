# Mobile System Design

### Question 0932ddd3-af31-4b22-ac9e-de9e10064659

- How would you structure the app architecture (state management, navigation, data layer) for a scalable social media app with a feed, stories, and messaging in React Native / Expo?

### Answer

- ***Layered Feature-Driven Architecture***: Structure code by domain feature modules (`src/features/feed`, `src/features/stories`, `src/features/chat`) containing their own components, hooks, and API logic to enforce clean boundaries and maintainability.
- ***Separation of State Concerns***:
  - ***Server State***: Use ***TanStack Query (React Query)*** for asynchronous server data (feed lists, story feeds, user profiles) with automated caching, invalidation, and pagination.
  - ***Global Client UI State***: Use ***Zustand*** or ***Jotai*** for lightweight synchronous client state (story viewer active index, global modal state, compose drafts).
  - ***Real-Time Ephemeral State***: Isolate WebSocket message feeds and typing indicators into localized stores or native event emitters to prevent broad component tree re-renders.
- ***Navigation Architecture***: Implement ***Expo Router*** or ***React Navigation*** using nested stacks; place main tabs at root, while rendering story viewers and media previews in transparent modal stacks to keep layout memory isolated.
- ***Data Persistence & Cold Boot***: Persist query caches with ***MMKV*** or ***SQLite (WatermelonDB)*** for instant offline feed rendering during app launch.

```typescript
// Shared query setup for normalized feed server state
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFeedBatch } from '@/features/feed/api';

export const useFeedQuery = () => {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => fetchFeedBatch(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: 1000 * 60 * 5, // Cache stale for 5 mins
  });
};
```

---

### Question 29dfad74-e4b8-4f0a-bf8a-f711189c7dc9

- In a ride-hailing app, real-time updates (driver location, trip status) must be reflected instantly without degrading UI performance. How would you design the client-side data flow and update strategy?

### Answer

- ***Off-React Thread Animation***: Bypass React state re-renders for incoming GPS coordinate streams by piping position updates directly into ***React Native Reanimated SharedValues***.
- ***Native Map Marker Interpolation***: Animate marker movements smoothly on the native UI thread using `withTiming` or linear coordinate interpolation instead of calling `setState` on every socket payload.
- ***Data Throttling & Dead Reckoning***: Apply client-side throttling (e.g., maximum 1 map position evaluation per 500ms) paired with dead reckoning algorithms to predict movement between delayed server updates.
- ***Trip Status State Machine***: Drive trip lifecycle changes (`SEARCHING` -> `DRIVER_ASSIGNED` -> `ARRIVED` -> `IN_TRIP` -> `COMPLETED`) via a strict state machine (e.g. ***XState***) to handle out-of-order WebSocket packets cleanly.
- ***Behavioral Details & Caveats***: Frequent background GPS updates can cause memory leaks and JS thread freezing; always detach socket listeners when the map component unmounts and validate payload sequence timestamps.

```typescript
import { useSharedValue, withTiming } from 'react-native-reanimated';

// Updating driver position smoothly on UI thread without React re-renders
const driverLat = useSharedValue(initialLocation.latitude);
const driverLng = useSharedValue(initialLocation.longitude);

const onSocketLocationReceived = (newCoords: { lat: number; lng: number }) => {
  driverLat.value = withTiming(newCoords.lat, { duration: 1000 });
  driverLng.value = withTiming(newCoords.lng, { duration: 1000 });
};
```

---

### Question 12a781b4-fe4d-4cae-a9a7-5402965d8173

- You are building an offline-first note-taking app. How would you design local storage, sync strategy, and conflict resolution on the mobile client?

### Answer

- ***Local-First Storage Engine***: Use ***WatermelonDB*** or ***Expo SQLite*** as the primary local database, allowing the UI to read and write synchronously from disk without waiting for network responses.
- ***Durable Mutation Queue***: Append offline edits (creates, updates, deletes) to an encrypted persistent SQLite mutation table marked with status flags (`PENDING`, `SYNCING`, `FAILED`).
- ***Conflict Resolution Engine***:
  - ***CRDTs (Conflict-free Replicated Data Types)***: Use CRDT libraries (Yjs / Automerge) for real-time collaborative rich-text notes.
  - ***LWW (Last-Write-Wins with Vector Clocks)***: Use logical vector clocks or server-assigned monotonic sequence IDs for simple metadata updates to handle network delays accurately.
- ***Background Sync Worker***: Drain the sync queue using ***Expo BackgroundFetch / WorkManager*** when connectivity is restored or during app state transitions (`background` -> `active`).
- ***Behavioral Details & Caveats***: Mobile device wall-clock times are user-modifiable and untrusted; never rely on local client timestamps for LWW conflict ordering.

```typescript
// Enqueuing local mutation for background sync
async function saveNoteOffline(db: SQLiteDatabase, note: NoteDraft) {
  await db.transactionAsync(async (tx) => {
    await tx.executeAsync(
      'INSERT INTO notes (id, title, content, updated_at) VALUES (?, ?, ?, ?);',
      [note.id, note.title, note.content, Date.now()]
    );
    await tx.executeAsync(
      'INSERT INTO sync_queue (id, entity, action, payload) VALUES (?, ?, ?, ?);',
      [crypto.randomUUID(), 'note', 'UPDATE', JSON.stringify(note)]
    );
  });
}
```

---

### Question 65694688-26f8-470d-96ca-c9201c398270

- A large e-commerce app needs to support feature flags for gradual rollouts and A/B testing. How would you design feature flag handling on the client side?

### Answer

- ***Persistent Local Caching***: Hydrate feature flags synchronously from ***MMKV*** on app launch, followed by an asynchronous background evaluation fetch to avoid blocking the app splash screen.
- ***Strongly Typed Flag Schema***: Define a strict TypeScript/Zod schema with compile-time default fallback values embedded directly inside the app binary.
- ***Consistent Variant Bucketing***: Pin assigned user A/B variants to local persistent storage tied to an anonymous installation seed ID to prevent visual flickering or variant swapping between sessions.
- ***Declarative React Integration***: Expose flags via custom hooks (`useFeatureFlag('checkout_v2')`) or guard components to keep UI views decoupled from flag SDK implementation.
- ***Behavioral Details & Caveats***: Fetching remote flags over high-latency networks can delay critical rendering; serve cached flags immediately and apply structural updates on the next application restart.

```typescript
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

interface FlagStore {
  flags: Record<string, boolean>;
  setFlags: (newFlags: Record<string, boolean>) => void;
}

export const useFlagStore = create<FlagStore>((set) => ({
  flags: JSON.parse(storage.getString('feature_flags') || '{}'),
  setFlags: (newFlags) => {
    storage.set('feature_flags', JSON.stringify(newFlags));
    set({ flags: newFlags });
  },
}));
```

---

### Question 988c4fef-e5b3-46ae-a14c-f775b467e2b1

- Your app needs to support multiple environments (dev, staging, production) and dynamic configuration. How would you design configuration management in a React Native / Expo app?

### Answer

- ***Build-Time Environment Injection***: Use ***Expo Config Plugins / `app.config.ts`*** combined with environment variables (`.env.development`, `.env.production`) exposed through `Constants.expoConfig.extra`.
- ***Distinct Native Application Identifiers***: Assign separate bundle IDs (`com.app.dev`, `com.app.staging`, `com.app`) to allow developers to install multiple environment builds side-by-side on a single device.
- ***Type-Safe Runtime Validation***: Validate all environment configuration objects using Zod schema parsing during early app initialization to catch missing key errors instantly.
- ***Dynamic Remote Configuration***: Combine build-time static config with a remote config layer (e.g. Firebase Remote Config) for dynamic API endpoints or operational parameters.
- ***Behavioral Details & Caveats***: JS bundles bundled inside native binaries can be decompiled easily; NEVER place secret keys, API private tokens, or master passwords inside client environment files.

```typescript
import { z } from 'zod';
import Constants from 'expo-constants';

const EnvSchema = z.object({
  apiUrl: z.string().url(),
  analyticsKey: z.string().min(1),
  environment: z.enum(['development', 'staging', 'production']),
});

export const Config = EnvSchema.parse({
  apiUrl: Constants.expoConfig?.extra?.apiUrl,
  analyticsKey: Constants.expoConfig?.extra?.analyticsKey,
  environment: Constants.expoConfig?.extra?.environment,
});
```

---

### Question bae3244a-bb4c-461a-ac82-6c6ab6fc2d0f

- In a chat application, messages, typing indicators, and read receipts must stay in sync. How would you design state management and event handling to avoid inconsistencies?

### Answer

- ***Optimistic Message Queue***: Assign temporary client UUIDs (`tempId`) to outgoing messages, render them immediately in UI with state `SENDING`, and swap with confirmed server payloads upon ACK.
- ***Normalized Message Store***: Store chat items in a normalized structure (`entities.messages[id]`, `threads[threadId].messageIds`) in Zustand/Redux to avoid duplicate entries across nested chat screens.
- ***Decoupled Ephemeral Streams***: Keep volatile events (typing indicators, user presence) separate from persistent database stores; stream typing signals directly into localized component state.
- ***Idempotent Event Handlers***: Check message IDs and server sequence numbers on incoming WebSocket frames to ignore duplicate or out-of-order packets.
- ***Behavioral Details & Edge Cases***: Network drops during pending sends leave messages stuck in `SENDING`; attach a 10-second timeout to transition message status to `FAILED` with retry capability.

```typescript
// Optimistic message update dispatch
const sendMessage = (text: string) => {
  const tempId = crypto.randomUUID();
  const optimisticMsg = { id: tempId, text, status: 'SENDING', timestamp: Date.now() };

  addMessageToStore(optimisticMsg);

  socket.emit('send_message', optimisticMsg, (ack) => {
    if (ack.success) {
      updateMessageInStore(tempId, { id: ack.serverMsgId, status: 'SENT' });
    } else {
      updateMessageInStore(tempId, { status: 'FAILED' });
    }
  });
};
```

---

### Question 6e40c906-5aaa-405f-b7bc-520fae43c26a

- You are designing a video streaming app where performance and responsiveness are critical. How would you structure components and data flow to minimize re-renders and UI blocking?

### Answer

- ***Native Player Offloading***: Utilize native video components (e.g., `expo-video` or `react-native-video`) exposing native view controllers, driving overlays via ***Reanimated Worklets***.
- ***Isolated Progress Controllers***: Keep high-frequency playback progress timers (updating 60 times/sec) in native shared values or refs, preventing parent video screen re-renders.
- ***Recyclable Video Feeds***: Use ***FlashList*** with fixed cell dimensions (`estimatedItemSize`) for scrolling feeds, pausing and unmounting offscreen native players via `viewabilityConfig`.
- ***Player Instance Pool***: Restrict active native video instances (pre-buffering only current and next video) to avoid mobile Out-Of-Memory (OOM) app crashes.
- ***Behavioral Details & Caveats***: Passing anonymous callback functions or unmemoized style objects into video list items causes frequent JS thread stutter during scrolling.

```typescript
import { ViewabilityConfig, ViewToken } from 'react-native';

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 80,
};

const onViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
  if (viewableItems.length > 0) {
    setActiveVideoId(viewableItems[0].item.id);
  }
};
```

---

### Question 332cb46d-df6b-4bda-b1c7-2641782e5c3f

- A fitness app tracks user activity continuously and syncs data periodically. How would you design background tasks, state persistence, and data syncing on the client?

### Answer

- ***Native Telemetry Services***: Collect GPS and step-counter sensor data using native background listeners (`expo-location` background tasks) writing directly to SQLite disk files, avoiding JS runtime wakeups.
- ***Constrained Work Scheduling***: Schedule periodic data syncing using OS-compliant background schedulers (iOS `BGAppRefreshTask`, Android `WorkManager`) requiring unmetered network and sufficient battery level.
- ***Chunked Persistence Buffer***: Append coordinate updates to a local WAL-mode SQLite database to preserve telemetry across app process crashes or phone reboots.
- ***Payload Compression & Delta Uploads***: Compress batch telemetry payloads using GZIP or Protobuf before streaming to backend endpoints to minimize cellular payload size.
- ***Behavioral Details & Caveats***: iOS strictly caps background execution time (15–30 seconds); complete batch sync operations quickly and handle background task expiration signals gracefully.

```typescript
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TRACKER';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    await appendLocationsToLocalDatabase(locations);
  }
});
```

---

### Question fdf3631a-78f7-487c-a356-cb2e6212235e

- Your app must handle deep linking (e.g., opening specific screens from URLs or notifications). How would you design navigation and routing to support this reliably?

### Answer

- ***Declarative URL Scheme Mapping***: Define a strict deep link routing schema with ***Expo Router*** file routes or React Navigation `linking` configuration covering custom URI schemes (`myapp://`) and Universal Links (`https://myapp.com`).
- ***Auth Interception Queue***: Intercept incoming links prior to route resolution; if an unauthenticated user opens `myapp://settings/billing`, cache the target URL, redirect to `Login`, and resume original target post-login.
- ***Cold vs Warm Boot Event Handling***: Process initial link via `Linking.getInitialURL()` during cold boot, while subscribing to `Linking.addEventListener('url')` for warm background transitions.
- ***Schema Parameter Validation***: Parse and sanitize deep link path parameters and query strings using Zod before passing them to screen components to prevent injection attacks.
- ***Behavioral Details & Edge Cases***: Universal links and push notification intents can fire simultaneously on launch; implement a link deduplicator to prevent double navigation stack pushes.

```typescript
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Details: 'details/:id',
      Profile: 'user/:username',
    },
  },
};
```

---

### Question afa38389-6711-4705-b4ab-215e69f98290

- In a marketplace app, users can browse large datasets with filters, sorting, and pagination. How would you design client-side caching and data fetching strategies?

### Answer

- ***Deterministic Query Caching***: Use ***TanStack Query (`useInfiniteQuery`)*** with sorted, normalized query key tuple representations (`['products', { category, sort, priceRange }]`).
- ***Optimized Windowed Rendering***: Render product lists using ***FlashList***, configuring `onEndReachedThreshold` and `estimatedItemSize` to stabilize memory footprint during deep pagination.
- ***Query Persister Integration***: Save query caches to persistent ***MMKV*** storage via `createSyncStoragePersister` for instant offline loading of previously viewed product categories.
- ***Debounced Request Cancellation***: Debounce text filter inputs by 300ms and pass `AbortController` signals to ongoing API requests to abort stale network calls automatically.
- ***Behavioral Details & Caveats***: Mutating filter objects out of order can generate duplicate cache entries; always normalize and sort object keys before evaluating query keys.

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export const useProductSearch = (filters: Record<string, any>) => {
  // Normalize filter object keys for stable cache matching
  const normalizedFilters = Object.keys(filters)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: filters[key] }), {});

  return useInfiniteQuery({
    queryKey: ['products', normalizedFilters],
    queryFn: ({ pageParam = 1, signal }) => fetchProducts({ filters: normalizedFilters, page: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
};
```

---

### Question cc553d3a-30d4-46ff-b512-be1b79cfce28

- You are building a multi-tenant app where UI and features differ per user role. How would you design the app to dynamically adapt UI and logic without duplicating code?

### Answer

- ***Role-Based Capability Matrix (RBAC)***: Evaluate user permissions using a centralized `usePermissions()` hook checking capability flags (`['CAN_VIEW_REPORTS', 'CAN_EDIT_USERS']`) instead of checking explicit role strings.
- ***Polymorphic Slot Components***: Render tenant-specific UI layouts dynamically using component map lookup tables (`DashboardSlots[tenantId]`) falling back to standard default layouts.
- ***Dynamic Navigation Routing***: Filter navigation routes conditionally at the navigation container level based on active tenant permissions before mounting screens.
- ***Design System Theme Injection***: Wrap tenant views in a `TenantThemeProvider` to override primary design tokens (palette, logos, typography) dynamically across tenant scopes.
- ***Behavioral Details & Caveats***: Scattering inline role checks (`if (user.role === 'ADMIN')`) across individual child components causes maintenance coupling; encapsulate all access rules inside central capability predicates.

```typescript
type Role = 'ADMIN' | 'MANAGER' | 'VIEWER';

const capabilityMap: Record<Role, string[]> = {
  ADMIN: ['CREATE_USER', 'DELETE_USER', 'VIEW_ANALYTICS'],
  MANAGER: ['CREATE_USER', 'VIEW_ANALYTICS'],
  VIEWER: ['VIEW_ANALYTICS'],
};

export const hasCapability = (role: Role, capability: string): boolean => {
  return capabilityMap[role]?.includes(capability) ?? false;
};
```

---

### Question 7184e1dc-0f32-4244-8636-9cc36a0f3915

- A news app must preload content for smooth transitions while minimizing data usage. How would you design prefetching and caching strategies?

### Answer

- ***Predictive Feed Prefetching***: Trigger background article prefetching (`queryClient.prefetchQuery`) as article cards enter the visible viewport using `onViewableItemsChanged`.
- ***Network-Aware Preloading***: Inspect network state via `@react-native-community/netinfo`; restrict rich media prefetching to unmetered connections (`WiFi`), skipping heavy preloads on cellular data.
- ***Two-Tier Cache Hierarchy***: Combine an in-memory query cache for active screens with an LRU disk cache (MMKV / FastImage disk cache) bounded by explicit TTL expiration policies.
- ***BlurHash Thumbnails***: Serve low-resolution image placeholders inline with feed API payloads to display visual previews immediately before full-resolution images finish loading.
- ***Behavioral Details & Caveats***: Aggressive prefetching consumes mobile battery and network quota; cap maximum concurrent background prefetch tasks and cancel pending jobs on rapid list scrolling.

```typescript
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

const prefetchArticle = async (articleId: string) => {
  const netState = await NetInfo.fetch();
  // Only prefetch full body content if on unmetered Wi-Fi connection
  if (netState.type === 'wifi') {
    await queryClient.prefetchQuery({
      queryKey: ['article', articleId],
      queryFn: () => fetchArticleDetails(articleId),
    });
  }
};
```

---

### Question 542095db-e120-4f1d-9a6d-29eeefbf4690

- Your app integrates multiple third-party SDKs (analytics, ads, payments). How would you structure the codebase to isolate and manage these dependencies cleanly?

### Answer

- ***Facade Pattern Architecture***: Hide vendor SDKs behind generic internal interface abstractions (`AnalyticsService`, `PaymentGateway`) so main application code never imports third-party packages directly.
- ***Adapter Implementation Pattern***: Build vendor-specific adapter classes (`MixpanelAdapter`, `StripeAdapter`) implementing clean, internal TypeScript contracts.
- ***Centralized Dependency Injection***: Initialize third-party adapters in a service registry container during application boot, allowing painless vendor swapping.
- ***Development Mock Adapters***: Provide no-op mock adapters for local development, unit testing, and Expo Go preview environments where native third-party binaries cannot run.
- ***Behavioral Details & Edge Cases***: Native third-party SDK crashes can take down the app process; wrap SDK init calls in defensive error try/catch blocks and ensure non-blocking asynchronous execution.

```typescript
// Internal abstraction facade interface
export interface IAnalyticsService {
  trackEvent(name: string, payload?: Record<string, any>): void;
}

export class MixpanelAdapter implements IAnalyticsService {
  trackEvent(name: string, payload?: Record<string, any>) {
    // Native Mixpanel SDK call encapsulated internally
    MixpanelSDK.track(name, payload);
  }
}
```

---

### Question c313146d-7317-47b6-b7cf-f8fea98c3450

- You are designing error handling and logging for a production app. How would you capture, store, and report errors without affecting performance?

### Answer

- ***Tiered Error Boundaries***:
  - Wrap component subtrees in ***React Error Boundaries*** to catch rendering errors and show fallback UI.
  - Intercept unhandled JS exceptions using `ErrorUtils.setGlobalHandler`.
  - Capture native C++/Objective-C/Java crashes via native error reporters (Sentry / Crashlytics).
- ***Batched Asynchronous Logging***: Append non-fatal logs to an in-memory ring buffer or MMKV disk file; upload log batches during network idle times to avoid network overhead.
- ***PII Scrubbing Pipeline***: Sanitize error context payloads to strip user credentials, access tokens, and personal details before transmitting to external servers.
- ***Automated Source Map Uploads***: Upload JS minified source maps automatically during CI/CD build pipelines to symbolicate production stack traces accurately.
- ***Behavioral Details & Edge Cases***: Infinite logging loops (errors occurring inside the error reporter) cause application freeze; implement strict rate-limiting and re-entrancy guards inside log handlers.

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://example@sentry.io/123',
  beforeSend(event) {
    // Scrub sensitive auth token header before sending
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});
```

---

### Question 501d2e1d-ec26-4df6-8b6c-2c2572a906ea

- A global app must support localization, theming, and accessibility. How would you design these concerns to be scalable and maintainable?

### Answer

- ***Type-Safe Localization System***: Implement `i18next` with strict TypeScript key auto-completion, lazy-loading translation JSON files per screen/module to minimize initial bundle size.
- ***Tokenized Dynamic Design System***: Define core design tokens (palette, spacing, typography) in a central theme store; calculate active themes dynamically using memoized styles or Reanimated theme contexts.
- ***Accessible Component Primitives***: Enforce accessibility attributes on primitive UI wrappers (`accessible`, `accessibilityLabel`, `accessibilityRole`), respecting system dynamic font scaling (`allowFontScaling`).
- ***Right-to-Left (RTL) Layout Engine***: Use flexbox alignment and logical positioning attributes (`marginStart`, `paddingEnd` instead of physical `marginLeft`, `paddingLeft`) along with `I18nManager.isRTL`.
- ***Behavioral Details & Caveats***: Dynamic theme or language switching re-renders the entire component tree; isolate theme context consumers to leaf components or memoized design system primitives.

```typescript
import { StyleSheet } from 'react-native';

// Using logical properties for automated RTL support
export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingStart: 16, // Automatically flips between LTR and RTL
    marginEnd: 8,
  },
});
```

---

### Question be197cdc-72b3-46b2-addd-bf15b49e787e

- Your app needs to handle authentication (login, token refresh, session expiration). How would you design secure and reliable auth state management on the client?

### Answer

- ***Hardware-Encrypted Token Storage***: Store access and refresh tokens in OS-level encrypted storage (iOS Keychain / Android Keystore via `expo-secure-store`) rather than unencrypted AsyncStorage or MMKV.
- ***Atomic Token Refresh Interceptor***: Intercept HTTP 401 Unauthorized responses inside API clients (Axios / fetch interceptors); pause pending outbound requests, execute a single refresh token call, and replay failed requests with the new token.
- ***Global Auth State Machine***: Manage session status (`UNAUTHENTICATED`, `AUTHENTICATING`, `AUTHENTICATED`) using a global Zustand store accessible to top-level navigation guards.
- ***Session Termination & Wipe***: Wipe local encrypted storage, clear server query caches (`queryClient.clear()`), and reset navigation stack to `Auth` upon refresh token invalidation or manual sign-out.
- ***Behavioral Details & Caveats***: Simultaneous parallel requests encountering 401 errors can trigger duplicate token refresh calls, causing token revocation; lock the refresh invocation behind a single shared Promise.

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

let refreshPromise: Promise<string> | null = null;

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      if (!refreshPromise) {
        refreshPromise = fetchNewToken().finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;
      error.config.headers['Authorization'] = `Bearer ${newToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### Question 3dea20b3-2639-450e-a95a-fe7fd2f37420

- In a complex app, multiple screens depend on shared data. How would you decide between global state, server state, and local component state?

### Answer

- ***State Classification Framework***:
  - ***Server State*** (Remote, asynchronous source of truth): Manage with ***TanStack Query*** for caching, automated refetching, and cache invalidation.
  - ***Global Client State*** (Synchronous, shared across un-nested screens): Manage with ***Zustand / Jotai*** for UI preferences, auth status, active theme, or shopping cart.
  - ***Local Component State*** (Synchronous, component-scoped): Manage with `useState` / `useReducer` for text inputs, modal visibility, and tab indices.
- ***Single Source of Truth Principle***: Never duplicate Server State into Global Client State stores; read server data directly via query hooks (`useQuery`) to prevent data desynchronization.
- ***Fine-Grained Selector Subscriptions***: Subscribe to state stores using explicit selectors (`useStore(state => state.activeTheme)`) to limit component re-renders to target state updates.
- ***Behavioral Details & Caveats***: Elevating local UI state to global state causes unnecessary full-tree re-renders; keep state local until multiple distant screens explicitly require access.

```typescript
// Reading Server State directly without copying to global store
const { data: userProfile } = useQuery({
  queryKey: ['userProfile'],
  queryFn: fetchUserProfile,
});
```

---

### Question cf8076a8-2563-4a15-bb8a-8fe39e33aa6e

- You are building an app that must work well on both low-end Android devices and high-end iOS devices. How would you design for performance and adaptability across devices?

### Answer

- ***Hardware Capability Profiling***: Detect device hardware specifications on app startup (RAM, CPU cores via `react-native-device-info`) and classify devices into performance tiers (`LOW`, `MID`, `HIGH`).
- ***Adaptive Feature Degradation***: Disable memory-intensive visual effects (blur views, drop shadows, heavy animations, glassmorphism) automatically on `LOW` tier hardware.
- ***UI Thread Animation Offloading***: Offload list animations, gestures, and layout transitions to native threads using ***React Native Reanimated*** and ***Gesture Handler***.
- ***Dynamic List & Image Tuning***: Scale requested image asset resolutions based on device screen DPI; adjust `FlashList` parameters (`drawDistance`, `maxToRenderPerBatch`) according to device capability tiers.
- ***Behavioral Details & Caveats***: Low-end Android devices suffer from severe memory fragmentation; unmount hidden offscreen view hierarchies aggressively and release unused image caches.

```typescript
import { DynamicColorIOS, Platform } from 'react-native';

export const isLowEndDevice = Platform.OS === 'android' && Platform.Version < 28;

// Disable complex blur effects dynamically on low-end devices
export const renderBackground = () => {
  if (isLowEndDevice) {
    return <SolidColorView color="#121212" />;
  }
  return <BlurView intensity={80} />;
};
```

---

### Question 029476bb-833c-463d-b1d6-72df63c18193

- Your app requires modular development with multiple teams working on different features. How would you design the project structure and boundaries?

### Answer

- ***Monorepo Architecture (Turborepo / Nx)***: Structure the codebase into decoupled feature packages (`packages/feature-auth`, `packages/feature-checkout`) and core shared packages (`packages/ui-kit`, `packages/network-client`).
- ***Enforced Module Import Boundaries***: Enforce strict directional import rules via ESLint (`eslint-plugin-boundaries`); forbid direct cross-feature imports, forcing inter-module communication through public contract APIs.
- ***Isolated Feature Development***: Enable individual feature teams to develop, test, and run their feature packages independently using isolated Storybooks or lightweight standalone app harnesses.
- ***Shared Design Tokens & Network Wrappers***: Distribute core design primitives and HTTP client instances from central shared packages to guarantee architectural consistency across teams.
- ***Behavioral Details & Caveats***: Circular dependencies between feature packages ruin build graphs; use event buses or public facade interfaces for cross-feature interactions.

```json
// package.json workspace definition
{
  "name": "root",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

---

### Question 7f564310-410f-43cc-a47b-646d841873a4

- You are designing a mobile app that must support OTA (over-the-air) updates using Expo. What considerations would you take into account for compatibility, rollout, and rollback?

### Answer

- ***Strict Runtime Versioning***: Configure explicit `runtimeVersion` values in `app.json` matching native binary releases to prevent incompatible JS OTA updates from executing on older native binaries.
- ***Phased Deployment Channels***: Distribute OTA updates progressively across Expo deployment channels (`production`, `staging`) and percentage-based rollouts to monitor crash telemetry before full release.
- ***Automated JS Fallback & Rollback***: Configure Expo Updates recovery settings (`checkAutomatically: ON_LOAD`) with strict fetch timeouts; fall back to the embedded JS bundle automatically if an OTA update fails to boot.
- ***Embedded Binary Assets***: Bundle critical app images and fonts inside the native binary to keep OTA update payloads lightweight and fast over cellular networks.
- ***Behavioral Details & Caveats***: OTA updates CANNOT modify native iOS/Android code (Native Modules, Info.plist, AndroidManifest.xml, Expo Config Plugins); native layer modifications require submitting a full App Store binary build.

```json
// app.json configuring runtime version safety
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/your-project-id",
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 3000
    }
  }
}
```
