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

---

### Question e1f8a923-4210-482d-81fa-223456789a01

- You are building a feature that allows users to upload large ZIP files (e.g., 500MB+). How would you design the upload flow to handle unstable mobile networks and app backgrounding?

### Answer

- ***Chunked Upload Protocol (TUS / Multipart)***: Split the 500MB file into small chunks (e.g., 5MB–10MB) directly on native storage, uploading each chunk with unique offset headers so failed chunks can be resumed without re-uploading completed data.
- ***Native Background Transfer Daemon***: Use native background upload capabilities (iOS `NSURLSession` background configuration via `expo-file-system` upload task or Android `WorkManager` / `ForegroundService`) so the OS handles transfers even when the app is suspended or killed.
- ***Persistent Upload State Machine***: Store upload session metadata (file URI, chunk index, remote upload ID, checksums) in persistent ***MMKV*** or ***SQLite*** to resume seamlessly after phone reboots or app crashes.
- ***Network Quality Aware Scheduling***: Monitor network changes using ***`@react-native-community/netinfo`***; automatically pause uploads on weak cellular or offline states and auto-resume when unmetered Wi-Fi is restored.
- ***Behavioral Details & Caveats***: iOS strictly limits background execution time and may delay background tasks based on system battery and user usage patterns; always trigger local push notifications if user interaction or re-authentication is required.

```typescript
import * as FileSystem from 'expo-file-system';

// Creating a background upload task that persists across app backgrounding
const createBackgroundUpload = (fileUri: string, uploadUrl: string) => {
  const uploadTask = FileSystem.createUploadTask(
    uploadUrl,
    fileUri,
    {
      headers: { 'Content-Type': 'application/zip' },
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    },
    (data) => {
      console.log(`Uploaded ${data.totalBytesSent} / ${data.totalBytesExpectedToSend}`);
    }
  );
  return uploadTask;
};
```

---

### Question a8721c43-90b1-41e5-8f6a-123456789b02

- A user uploads a large video file, but the app frequently crashes on low-memory Android devices. What strategies would you use to prevent memory issues during file handling?

### Answer

- ***Native Stream-Based File Access***: Avoid reading full file bytes into the JS runtime (e.g., Base64 strings or ArrayBuffers); pass direct file paths (`file://...`) down to native modules (`expo-file-system` or native C++/Java uploaders) to stream data from disk directly to network sockets.
- ***Zero-Copy Disk Chunking***: When slicing files for chunked upload, slice streams directly on the native file system layer without holding chunk buffers in JS memory heap.
- ***Proactive Garbage Collection & Cache Release***: Explicitly delete temporary files, resized video frames, and cached compressed exports from `FileSystem.cacheDirectory` immediately after upload completion or failure.
- ***Memory-Aware Processing Queue***: Query device memory specs (via ***`react-native-device-info`***) and limit concurrent image/video processing operations to 1 on low-RAM (<3GB) Android devices.
- ***Behavioral Details & Caveats***: Loading a 500MB file as Base64 in JavaScript expands memory usage by ~33% and instantly triggers an Out-Of-Memory (OOM) fatal crash in the V8 / Hermes engine.

```typescript
import * as FileSystem from 'expo-file-system';

// SAFE: Passing native file URI directly to native uploader without loading into JS memory
async function safeUpload(fileUri: string, targetUrl: string) {
  // Do NOT use FileSystem.readAsStringAsync with Base64 encoding!
  const result = await FileSystem.uploadAsync(targetUrl, fileUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  return result;
}
```

---

### Question f9102b34-81c2-43f6-9a5d-234567890c03

- How would you implement resumable uploads for large files in a React Native / Expo app?

### Answer

- ***TUS Protocol Integration***: Implement the open-standard ***TUS protocol*** (using `tus-js-client` paired with custom React Native file store adapters) to support standardized chunk offsets and server handshake verification.
- ***Persistent Chunk Offset Tracking***: Before sending each chunk, record the uploaded byte count and upload token into ***MMKV*** storage.
- ***Session Re-establishment Handshake***: Upon app launch or network recovery, send a `HEAD` request to the upload endpoint to fetch the exact remote byte offset and start uploading from that point onward.
- ***Native Background Transfer Integration***: On Expo/React Native, delegate upload tasks to native session engines (`FileSystem.createUploadTask` in Expo) configured with background session identifiers.
- ***Behavioral Details & Caveats***: Mobile IP address changes during network switching (cellular to Wi-Fi) break active TCP connections; TUS handles re-authorization transparently via session IDs.

```typescript
import * as tus from 'tus-js-client';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const uploadFileWithTus = (fileUri: string, endpoint: string) => {
  const upload = new tus.Upload(fileUri as any, {
    endpoint,
    retryDelays: [0, 1000, 3000, 5000],
    urlStorage: {
      getItem: (key) => Promise.resolve(storage.getString(key) ?? null),
      setItem: (key, val) => Promise.resolve(storage.set(key, val)),
      removeItem: (key) => Promise.resolve(storage.delete(key)),
    },
    onError: (error) => console.error('Upload failed:', error),
    onProgress: (bytesSent, bytesTotal) => console.log(`${bytesSent} / ${bytesTotal}`),
    onSuccess: () => console.log('Upload finished!'),
  });

  upload.findPreviousUploads().then((previousUploads) => {
    if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
    else upload.start();
  });
};
```

---

### Question d7831a45-62d4-42f7-b1e8-345678901d04

- When uploading heavy media (images/videos), how would you handle progress tracking and user feedback without blocking the UI?

### Answer

- ***UI Thread Progress Binding***: Pipe byte transfer progress callbacks from native upload modules directly into ***React Native Reanimated SharedValues*** to update progress bars on the native UI thread at 60 FPS without driving JS state re-renders.
- ***Global Persistent Upload Bar***: Render a lightweight floating progress indicator attached to the top-level app wrapper or bottom bar, keeping it visible while users navigate across different app screens.
- ***Throttled Progress Emitters***: Throttle progress state updates (e.g., max once per 100ms or 1% increment) before communicating across the Native-to-JS bridge to prevent bridge congestion.
- ***System Notification Integration***: Trigger native local notifications with progress bars (using ***`expo-notifications`*** or ***`@notifee/react-native`***) when the app is in the background.
- ***Behavioral Details & Caveats***: Calling React `setState` on every byte chunk upload callback freezes the JS main event loop, causing dropped frames and sluggish touch interactions.

```typescript
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

// Progress shared value updated directly from native upload listener
const progress = useSharedValue(0);

const onUploadProgress = (bytesSent: number, totalBytes: number) => {
  'worklet';
  progress.value = bytesSent / totalBytes;
};

const progressStyle = useAnimatedStyle(() => ({
  width: `${progress.value * 100}%`,
}));

// Render <Animated.View style={[styles.bar, progressStyle]} /> on UI thread
```

---

### Question b6742918-73e5-4bf8-a2d9-456789012e05

- A user selects a 4K video for upload, and the app becomes unresponsive. What steps would you take to optimize preprocessing (compression, resizing) before upload?

### Answer

- ***Native Hardware-Accelerated Transcoding***: Offload video transcoding (e.g., converting 4K H.264/HEVC down to 1080p MP4) to native hardware codecs (Android `MediaCodec`, iOS `AVAssetExportSession` via native modules).
- ***Background Worker Threading***: Run media compression inside native background threads or React Native C++ JSI worklets to keep the JS main thread 100% responsive.
- ***Pre-Flight Resolution & Bitrate Checks***: Inspect media metadata immediately after selection; skip compression entirely if video resolution and bitrate are already within target upload limits.
- ***Progressive Chunk Processing***: Compress or transcode media in segment chunks directly to disk files without accumulating intermediate video frames in RAM.
- ***Behavioral Details & Caveats***: Software-based video encoding in JS or unoptimized main-thread native calls causes severe CPU thermal throttling, rapid battery drain, and UI thread starvation.

```typescript
import { VideoCompressor } from 'react-native-compressor';

async function preprocessVideo(sourceUri: string) {
  // Compress natively off the JS main thread
  const compressedUri = await VideoCompressor.compress(
    sourceUri,
    {
      compressionMethod: 'auto',
      maxSize: 1920, // Downscale 4K to 1080p max resolution
    },
    (progress) => {
      console.log('Compression progress:', progress);
    }
  );
  return compressedUri;
}
```

---

### Question e5831209-64f6-4d09-b3a1-567890123f06

- How would you decide whether to compress images/videos on the client vs relying on backend processing?

### Answer

- ***Client-Side Compression Strategy***:
  - ***Bandwidth & Battery Reduction***: Compressing high-resolution media on-device drastically reduces file payload size (e.g., 15MB raw image to 800KB WebP/JPEG), saving cellular data and speeding up uploads over weak networks.
  - ***User Perceived Latency***: Instant local compression enables immediate thumbnail generation and faster upload progress UI.
- ***Backend Compression Strategy***:
  - ***Preserving Master Quality***: Required when full original fidelity is needed (e.g., professional photography, medical imaging, raw video editing apps).
  - ***Low-End Hardware Offloading***: Low-spec devices with weak CPUs experience battery drain or slow processing; fallback to raw upload on low-tier hardware.
- ***Hybrid Mobile Architecture***: Perform quick lightweight client-side downscaling/compression to an optimal baseline (e.g., 1080p, 80% JPEG quality) and let cloud backend workers generate multi-resolution streaming variants (HLS/DASH).
- ***Behavioral Details & Caveats***: Aggressive client-side video compression on low-end Android phones can crash the app or take minutes; assess device hardware capability tier before starting heavy client compression.

```typescript
import DeviceInfo from 'react-native-device-info';

async function shouldCompressClientSide(): Promise<boolean> {
  const totalMemory = await DeviceInfo.getTotalMemory();
  const lowRamThreshold = 3 * 1024 * 1024 * 1024; // 3GB RAM
  // Skip heavy client compression on low-memory devices to prevent crash
  return totalMemory > lowRamThreshold;
}
```

---

### Question c4920318-55a7-4c10-9b2e-678901234a07

- What are the trade-offs between multipart upload vs single request upload for large files?

### Answer

- ***Single Request Upload (`POST`/`PUT`)***:
  - ***Pros***: Simple implementation, zero chunking overhead, minimal client/server handshake complexity.
  - ***Cons***: Highly vulnerable to network drops (100% loss of progress on failure), high RAM spikes if un-streamed, severe request timeout risk on slow 3G/4G connections.
- ***Multipart / Chunked Upload***:
  - ***Pros***: Resumable on failure (only retry failed 5MB chunks), support for parallel chunk uploads, lower memory footprint per request, granular progress tracking.
  - ***Cons***: Increased client logic complexity, extra HTTP header overhead per chunk, requires server-side chunk reassembly and session tracking.
- ***Mobile Best Practice Rule***: Use single upload requests ONLY for small media assets (<10MB); use multipart/chunked upload for any files larger than 20MB on mobile devices.
- ***Behavioral Details & Caveats***: Cellular towers frequently reset TCP connections on long-running single HTTP requests lasting over 60 seconds; chunking avoids long request lifespans.

```typescript
// Threshold decision pattern for mobile uploads
const UPLOAD_MODE_THRESHOLD_BYTES = 20 * 1024 * 1024; // 20MB

function selectUploadStrategy(fileSizeBytes: number) {
  if (fileSizeBytes > UPLOAD_MODE_THRESHOLD_BYTES) {
    return 'MULTIPART_CHUNKED'; // Resumable, chunked
  }
  return 'SINGLE_REQUEST'; // Direct PUT/POST
}
```

---

### Question d3810429-46b8-4e11-8c3f-789012345b08

- How would you securely upload large files directly to cloud storage (e.g., S3) without routing through your backend?

### Answer

- ***Pre-Signed URL Authorization***: Client requests short-lived pre-signed AWS S3 / Cloud Storage upload URLs (or multipart presigned upload IDs) from backend API by passing file metadata (filename, size, MIME type).
- ***Direct Client-to-S3 Streaming***: Mobile client executes `PUT` or `POST` requests directly to S3 bucket endpoints using native background transfer primitives (`expo-file-system` upload or native HTTP client), bypassing application servers.
- ***Header & Content-Type Locking***: Pre-signed URLs validate `Content-Type`, `Content-Length`, and checksum headers; mobile client must match headers exactly to prevent request rejection.
- ***Post-Upload Webhook / Server Notification***: Upon successful S3 transfer completion, mobile client notifies backend API with the file S3 key to trigger database persistence and backend background processing.
- ***Behavioral Details & Caveats***: Pre-signed URLs expire within minutes; for long multi-chunk uploads, request presigned URLs per chunk on-demand or use AWS S3 Multipart Pre-signed API.

```typescript
import * as FileSystem from 'expo-file-system';

async function uploadDirectToS3(fileUri: string, presignedUrl: string, mimeType: string) {
  const response = await FileSystem.uploadAsync(presignedUrl, fileUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': mimeType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  return response.status === 200;
}
```

---

### Question a2719530-37c9-4f22-9d4e-890123456c09

- A file upload fails midway due to network loss. How would you design retry logic and ensure data consistency?

### Answer

- ***Exponential Backoff with Jitter***: Implement retry algorithms with exponential delays (`Math.pow(2, attempt) * 1000 + randomJitter`) to prevent hammering servers during network outages.
- ***Network Connectivity Listener***: Pause retries immediately when ***`@react-native-community/netinfo`*** detects offline state; resume automatically when connectivity is re-established.
- ***Idempotent Chunk Upload Verification***: Query upload session state (`HEAD` request or remote index query) before retrying to determine exact byte offset received by server before connection drop.
- ***Transaction-Safe Local Queue***: Maintain retry attempt counters in persistent storage; mark upload task as `FAILED_NEEDS_RETRY` or `PERMANENTLY_FAILED` after max threshold (e.g., 5 attempts).
- ***Behavioral Details & Edge Cases***: Mobile connections can report connected status while internet traffic is blocked (captive portals); validate server response code (e.g., HTTP 200/206) before treating retry as successful.

```typescript
import NetInfo from '@react-native-community/netinfo';

async function executeRetryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) throw new Error('OFFLINE');
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}
```

---

### Question b1820641-28d0-4e33-ae5f-901234567d10

- How would you prevent duplicate uploads when users retry after a failure?

### Answer

- ***Client-Side Content Hashing (SHA-256 / MD5)***: Compute a fast deterministic file hash or sampled checksum (hashing file header + middle + tail bytes) on the native device filesystem before starting upload.
- ***Idempotency Upload Key (Deduplication Check)***: Send the file hash or unique client upload UUID (`X-Idempotency-Key` header) during session initialization. Server checks if object already exists; if found, server returns immediate completion without re-uploading bytes.
- ***Durable Local Session Mapping***: Map `fileUri` to `uploadId` and `idempotencyKey` inside persistent ***MMKV*** storage. If user retries upload for the same file, reuse existing session context.
- ***Atomic Upload Completion Signals***: Send final completion request with payload hash; server confirms match before saving record to database.
- ***Behavioral Details & Caveats***: Computing full SHA-256 on a 1GB file in JavaScript blocks the JS thread; use native crypto modules (such as ***`react-native-quick-crypto`***) for fast hashing.

```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

function getOrCreateIdempotencyKey(fileUri: string, fileHash: string): string {
  const storageKey = `upload_idempotency_${fileHash}`;
  let idempotencyKey = storage.getString(storageKey);
  if (!idempotencyKey) {
    idempotencyKey = crypto.randomUUID();
    storage.set(storageKey, idempotencyKey);
  }
  return idempotencyKey;
}
```

---

### Question c0931752-19e1-4f44-bf60-012345678e11

- Your app needs to display a list of short videos (like reels) that play instantly when scrolled into view. How would you design the loading and caching strategy?

### Answer

- ***Three-Tier Video Queue Architecture***: Maintain active video instances for: `Previous` (paused/cached), `Current` (playing), and `Next` (pre-buffering), unmounting any instance outside this immediate window.
- ***Viewability-Driven Auto Playback***: Utilize ***`FlashList`*** / ***`FlatList`*** `viewabilityConfig` (e.g., `itemVisiblePercentThreshold: 80`) to trigger play/pause commands instantly as cell scrolls into active viewport.
- ***Native LRU Video Disk Cache***: Configure underlying native video engine (`expo-video` or `react-native-video` with native proxy caches like `ExoPlayer SimpleCache` on Android) to cache HTTP media chunks directly to disk.
- ***Inline First-Frame Poster Preview***: Display static BlurHash or low-res image poster instantly while native player initializes hardware decoders to prevent black screen flash.
- ***Behavioral Details & Caveats***: Creating more than 3 active native video player instances simultaneously causes memory saturation and severe frame drop stutter on low-to-mid range mobile devices.

```typescript
import { ViewabilityConfig } from 'react-native';

export const reelsViewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 80,
  minimumViewTime: 100, // Debounce rapid scrolling
};

// Only mount native video player for indices within [currentIndex - 1, currentIndex + 1]
export const shouldMountPlayer = (index: number, activeIndex: number) => {
  return Math.abs(index - activeIndex) <= 1;
};
```

---

### Question d9042863-0af2-4055-c071-123456789f12

- In a reels-like feature, how would you preload upcoming videos without wasting bandwidth or memory?

### Answer

- ***Bounded Buffer Preloading***: Limit preloading of upcoming video items to the first 2–3 seconds (or first 1MB chunk) of media data instead of downloading full video files.
- ***Preload Window Constraint***: Preload maximum 1–2 items ahead of current scroll index; cancel preloading jobs immediately if user scrolls rapidly past un-viewed items.
- ***Network Quality Adaptive Preload Rules***: Query ***`@react-native-community/netinfo`***; disable background video preloading completely on slow 3G connections or cellular data saver modes.
- ***Single Shared Preloader Daemon***: Run a singleton background preloading manager that queues native pre-buffer requests sequentially, cancelling pending jobs on fast scroll.
- ***Behavioral Details & Caveats***: Unconstrained video preloading on mobile cellular plans wastes gigabytes of user data and drains device battery rapidly.

```typescript
import NetInfo from '@react-native-community/netinfo';

class VideoPreloadManager {
  async preloadNextVideo(videoUrl: string) {
    const netState = await NetInfo.fetch();
    // Skip preloading if user is on cellular or weak network
    if (netState.type !== 'wifi') return;
    
    // Warm up native player network cache without playing
    NativeVideoCacheModule.preloadPartial(videoUrl, 1024 * 1024 * 2); // 2MB cap
  }
}
```

---

### Question e8153974-1ba3-4166-d182-234567890a13

- How would you handle video buffering and playback smoothly across different network conditions?

### Answer

- ***Adaptive Bitrate Streaming (HLS / DASH)***: Serve video via HLS (`.m3u8`) or DASH manifests containing multiple bitrate streams (240p, 480p, 720p, 1080p); native players automatically adjust quality to match network throughput.
- ***Custom Native Buffer Configuration***: Fine-tune underlying player buffer bounds (e.g., setting Android `ExoPlayer` `minBufferMs: 2500`, `maxBufferMs: 15000`, `bufferForPlaybackMs: 1000`) for low startup latency.
- ***Graceful Stall & Skeleton State Handling***: Monitor native player stall events (`onBuffer` / `onPlaybackStalled`); overlay semi-transparent loading spinners over frozen video frames without hiding video controls.
- ***Network Fallback Degradation***: Dynamically force lower quality video resolution stream tags when client detects cellular network degradation via `NetInfo`.
- ***Behavioral Details & Caveats***: Progressive MP4 playback over unstable networks causes frequent buffer freezes because MP4 cannot adjust resolution dynamically mid-stream.

```typescript
// Custom buffer configuration for expo-video / react-native-video
const videoBufferConfig = {
  minBufferMs: 2500,
  maxBufferMs: 15000,
  bufferForPlaybackMs: 1000,
  bufferForPlaybackAfterRebufferMs: 2000,
};
```

---

### Question f7264a85-2cb4-4277-e293-345678901b14

- What techniques would you use to minimize startup delay when a video becomes visible on screen?

### Answer

- ***Warm Player Instance Reuse***: Reuse pre-warmed native player instances instead of destroying and re-instantiating native view controllers on every item mount.
- ***Moov Atom FastStart Optimization***: Ensure MP4 files have the `moov atom` metadata stored at the start of the file (via `-movflags +faststart` FFmpeg compression) so playback begins immediately without downloading the whole file.
- ***Instant Poster-to-Video Crossfade***: Render local poster image cached in memory; smoothly crossfade opacity to live video view only after native `onReadyForDisplay` callback fires.
- ***Pre-Fetched Audio / Video Context***: Initialize player decoder context during scroll gesture deceleration before item locks into full center focus.
- ***Behavioral Details & Caveats***: If the `moov atom` is at the end of an MP4 file, mobile players must download the entire video before playing a single frame.

```typescript
import { useState } from 'react';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

const VideoItem = ({ posterUri, videoSource }: { posterUri: string; videoSource: string }) => {
  const posterOpacity = useSharedValue(1);

  const onReadyForDisplay = () => {
    // Hide poster smoothly once video frame is decoded natively
    posterOpacity.value = withTiming(0, { duration: 200 });
  };

  return (
    <View style={{ flex: 1 }}>
      <VideoView source={videoSource} onReadyForDisplay={onReadyForDisplay} />
      <Animated.Image source={{ uri: posterUri }} style={[{ position: 'absolute', inset: 0 }, { opacity: posterOpacity }]} />
    </View>
  );
};
```

---

### Question a6375b96-3dc5-4388-f3a4-456789012c15

- How would you manage multiple video players in a scrolling list to avoid performance degradation?

### Answer

- ***Strict Player Instance Pooling***: Maintain a pool of maximum 2–3 native video player components, recycling instances as items scroll offscreen (similar to list cell recycling).
- ***Detached Offscreen Player Controllers***: Pause native playback and detach surface textures immediately when item distance exceeds 1 screen height outside the viewport.
- ***Pure Lightweight Placeholder Views***: Render simple `Image` or `View` components for offscreen items; swap in the native Video View component only when cell enters visible range.
- ***Off-JS Thread Gesture Control***: Manage scroll gestures and active player indexing via ***React Native Reanimated*** and ***Gesture Handler*** without triggering React component tree re-renders.
- ***Behavioral Details & Caveats***: Leaving active native video players mounted offscreen causes heavy CPU background rendering, rapid battery drain, and eventual native memory crash.

```typescript
import React, { memo } from 'react';

// Memoized Feed Item rendering video ONLY when active
export const VideoFeedItem = memo(({ item, isActive }: { item: VideoItem; isActive: boolean }) => {
  if (!isActive) {
    // Offscreen render simple image poster, 0 video engine overhead
    return <Image source={{ uri: item.posterUrl }} style={{ flex: 1 }} />;
  }

  return <ActiveVideoPlayer source={item.videoUrl} />;
}, (prev, next) => prev.isActive === next.isActive);
```

---

### Question b5486ca7-4ed6-4499-04b5-567890123d16

- A reels feed works well on iOS but lags on Android devices. What platform-specific optimizations would you consider?

### Answer

- ***Hardware Surface Texture Tuning***: Configure Android `ExoPlayer` to use `SurfaceView` vs `TextureView` correctly (`useTextureView={false}` preferred for hardware overlay performance on low-end Android).
- ***Hermes Engine & JSI Enabled***: Enable Hermes JS engine, ProGuard / R8 code shrinking, and native C++ JSI bindings to minimize JS execution overhead.
- ***Hardware-Accelerated Codec Selection***: Prefer H.264 Baseline/Main profile over AV1 or HEVC for universal hardware acceleration compatibility across budget Android SOCs (MediaTek / Snapdragon low-end).
- ***Android Memory Heap & Image Cache Scaling***: Reduce ***`FlashList`*** `drawDistance` and limit image/video cache sizes specifically on Android platform checks (`Platform.OS === 'android'`).
- ***Behavioral Details & Caveats***: Android devices have huge hardware fragmentation; low-cost devices lack hardware decoders for newer codecs like AV1, causing software decoding UI lag.

```typescript
import { Platform } from 'react-native';

export const getAndroidVideoProps = () => {
  if (Platform.OS !== 'android') return {};

  return {
    useTextureView: false, // SurfaceView uses hardware composer directly
    maxBitRate: 2000000,   // Cap bitrate on Android to prevent decoder lag
  };
};
```

---

### Question c4597db8-5fe7-45aa-15c6-678901234e17

- How would you implement adaptive bitrate streaming in a mobile app for smoother video playback?

### Answer

- ***HLS / DASH Protocol Setup***: Provide master playlist URLs (`.m3u8` for HLS or `.mpd` for DASH) containing variant streams (e.g., 360p @ 800kbps, 720p @ 2500kbps, 1080p @ 5000kbps).
- ***Native Player Engine Integration***: Pass HLS stream URLs directly to native players (`expo-video` or `react-native-video` backed by `AVPlayer` on iOS and `ExoPlayer` on Android) which handle automatic bitrate switching natively.
- ***Custom Bandwidth Metering & Bitrate Caps***: Set player maximum bitrate limits (`maxBitRate` / `preferredPeakBitRate`) when app is on cellular connection or user toggles "Data Saver" mode.
- ***Bitrate Change Telemetry Listener***: Listen to native events (`onBandwidthUpdate` / `onTracksChanged`) to track network stream quality metrics for user feedback UI or analytics logging.
- ***Behavioral Details & Caveats***: iOS App Store guidelines require HLS for video streams over 5 minutes or exceeding 5MB over cellular networks.

```typescript
import NetInfo from '@react-native-community/netinfo';

const getAdaptiveBitrateConfig = async () => {
  const netState = await NetInfo.fetch();
  // Cap cellular video bitrate to 1.5 Mbps to prevent buffering stutter
  const maxBitRate = netState.type === 'cellular' ? 1500000 : 0; // 0 = unconstrained
  return { maxBitRate };
};
```

---

### Question d3608ec9-60f8-46bb-26d7-789012345f18

- What are the trade-offs between using progressive download vs streaming (HLS/DASH) for video content?

### Answer

- ***Progressive Download (Standard MP4)***:
  - ***Pros***: Easy local caching to disk, simple HTTP server hosting, fast playback start if FastStart optimized, zero manifest parsing overhead.
  - ***Cons***: Single fixed resolution (wastes bandwidth on weak networks or displays lower quality on high-res screens), high initial data consumption, cannot adjust bitrate dynamically.
- ***Adaptive Streaming (HLS / DASH)***:
  - ***Pros***: Seamless dynamic bitrate adjustment based on real-time network throughput, DRM content protection support, lower bandwidth consumption on short views.
  - ***Cons***: Harder to cache full files offline on mobile, requires backend encoding pipeline, higher latency for initial playlist manifest fetch.
- ***Mobile Choice Guidance***: Use Progressive MP4 for short reels (<30 secs) requiring full offline disk caching; use HLS/DASH for long-form video content (>1 min).
- ***Behavioral Details & Caveats***: Offline caching HLS playlists requires specialized native download managers handling master and segment `.ts` chunks.

```typescript
// Choosing media source type based on video duration
const getMediaSource = (video: { urlMp4: string; urlHls: string; durationSec: number }) => {
  if (video.durationSec < 30) {
    return { uri: video.urlMp4, type: 'mp4' }; // Progressive download for short reels
  }
  return { uri: video.urlHls, type: 'm3u8' }; // HLS streaming for long form
};
```

---

### Question e2719fd0-71a9-47cc-37e8-890123456a19

- How would you cache media files locally to improve performance while avoiding excessive storage usage?

### Answer

- ***Two-Tier Cache Hierarchy***: Maintain an in-memory cache for immediate image/poster renders and a persistent disk LRU (Least Recently Used) cache for video/image assets.
- ***LRU Disk Cache Manager with Max Quota***: Enforce strict storage caps (e.g., maximum 500MB total media cache) using native LRU eviction rules (e.g., native proxy caches or ***`expo-file-system`*** directory management).
- ***Periodic Cache Pruning Task***: Run background cache cleanup on app startup or background transitions, purging files older than TTL (e.g., 7 days) or when available device storage drops below 1GB.
- ***Storage Quota Inspection***: Check free device disk space using `expo-file-system` `getFreeDiskStorageAsync()` before downloading large media files.
- ***Behavioral Details & Caveats***: Storing media files in persistent document directories without size caps causes mobile OS "Storage Full" warnings, leading the OS to clear app cache forcibly.

```typescript
import * as FileSystem from 'expo-file-system';

async function pruneMediaCache(maxSizeBytes = 500 * 1024 * 1024) {
  const cacheDir = FileSystem.cacheDirectory + 'media/';
  const info = await FileSystem.getInfoAsync(cacheDir);
  if (!info.exists) return;

  const files = await FileSystem.readDirectoryAsync(cacheDir);
  // Sort files by modification time and delete oldest if total size > maxSizeBytes
}
```

---

### Question f1820ae1-82ba-48dd-48f9-901234567b20

- A user scrolls quickly through a video feed, causing frequent mounts/unmounts of video components. How would you optimize rendering and resource cleanup?

### Answer

- ***Debounced Activation Guard***: Delay native player initialization and playback start by 150ms after an item enters view, skipping player allocation if user scrolls past rapidly.
- ***Synchronous Resource Release in Cleanup***: Ensure `useEffect` unmount cleanup calls native release/unload methods synchronously to release hardware codecs immediately.
- ***Memoized Cell Components***: Wrap feed items in `React.memo` with custom comparison predicates (`prevProps.isSelected === nextProps.isSelected`) to prevent re-renders of non-focused video cells.
- ***Recyclable Component Containers***: Use ***FlashList*** which recycles native layout views instead of creating and unmounting DOM node hierarchies continuously.
- ***Behavioral Details & Caveats***: Rapidly mounting/unmounting native video decoders without waiting for asynchronous release callbacks causes native video driver deadlocks or memory leaks.

```typescript
import React, { useState, useEffect } from 'react';

const DeferredVideoPlayer = ({ isVisible, source }: { isVisible: boolean; source: string }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setShouldRender(false);
      return;
    }
    // Debounce rendering player by 150ms to ignore fast scrolls
    const timer = setTimeout(() => setShouldRender(true), 150);
    return () => clearTimeout(timer);
  }, [isVisible]);

  return shouldRender ? <NativePlayer source={source} /> : <PlaceholderView />;
};
```

---

### Question a0931bf2-93cb-49ee-590a-012345678c21

- How would you handle background uploads or downloads when the app is minimized or killed?

### Answer

- ***OS Native Background Transfer Daemon***: Use native background session tasks (iOS `NSURLSessionConfiguration.backgroundSession` and Android `WorkManager` / `JobScheduler` via `expo-file-system` background upload/download tasks).
- ***Background Completion Handlers***: Register native app delegate background completion callbacks to handle transfer events when the application is woken up by the OS in the background.
- ***Persistent Background State Synchronization***: Save job IDs and progress tokens in ***MMKV*** or ***SQLite*** so when the app opens, the UI reconciles background progress state cleanly.
- ***System User Notifications***: Post local push notifications upon background completion or failure to inform the user when the app process is dead.
- ***Behavioral Details & Caveats***: iOS strictly manages background battery consumption; background tasks may be deferred for hours if the phone is in low-power mode or background app refresh is disabled.

```typescript
import * as FileSystem from 'expo-file-system';

const startResumableBackgroundDownload = async (url: string, fileUri: string) => {
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    fileUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      console.log(`Download progress: ${progress * 100}%`);
    }
  );

  const result = await downloadResumable.downloadAsync();
  return result;
};
```

---

### Question b9042ca3-04dc-4af5-6a1b-123456789d22

- What are the risks of handling large files entirely in JS memory, and how would you avoid them?

### Answer

- ***Risks of Large Files in JS Memory***:
  - ***Out-Of-Memory (OOM) Fatal Crashes***: Loading files >50MB into JS strings or ArrayBuffers consumes memory that triggers JS heap allocation failure and crashes the app process.
  - ***JS Main Thread Freezing***: Parsing, encoding, or slicing large binary blobs in JS blocks garbage collection and freezes UI touch responsiveness.
  - ***Bridge Serialization Overhead***: Passing large Base64 strings across JS-to-Native bridge causes massive serializing latency and frame dropping.
- ***Prevention Strategies***:
  - Operate strictly using file URIs (`file:///...`) passed directly to native modules.
  - Offload binary chunking, hashing, and encryption to C++ JSI / native modules.
  - Stream data directly from disk to network sockets without touching JS memory space.
- ***Behavioral Details & Caveats***: The Hermes JS engine has memory heap limits (~512MB–1GB depending on device); converting a 200MB file to Base64 exceeds available heap instantly.

```typescript
// DANGEROUS ANTI-PATTERN:
// const fileData = await FileSystem.readAsStringAsync(largeFileUri, { encoding: 'base64' }); // OOM Crash!

// SAFE PATTERN: Pass fileUri directly to native networking stack
await FileSystem.uploadAsync(uploadUrl, largeFileUri, {
  uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
});
```

---

### Question c8153db4-15ed-4bf6-7b2c-234567890e23

- How would you design a system to limit upload size dynamically based on device capability and network conditions?

### Answer

- ***Dynamic Quality & Limit Evaluator***: Evaluate maximum allowable file upload dimensions, video resolution, and batch limits by checking current network type (`WiFi`, `4G`, `3G` via ***`@react-native-community/netinfo`***) and device RAM tier (via ***`react-native-device-info`***).
- ***Adaptive Pre-Upload Transcoding***: On slow 3G or low-spec hardware, automatically force downscaling of 4K video to 720p and set image quality compression to 70%.
- ***Client Pre-Flight Validation Rule Engine***: Run file size predicate checks before file picker resolution; reject files exceeding dynamic caps with informative error toasts.
- ***Dynamic Chunk Size Scaling***: Adjust chunk sizes dynamically based on connection latency (e.g., 10MB chunks on high-speed Wi-Fi down to 1MB chunks on unstable 3G).
- ***Behavioral Details & Caveats***: Static fixed file size limits frustrate users on fast connections or cause guaranteed upload failures for users on poor cellular networks.

```typescript
import NetInfo from '@react-native-community/netinfo';

export const getDynamicUploadLimits = async () => {
  const netState = await NetInfo.fetch();

  if (netState.type === 'wifi') {
    return { maxVideoResolution: '1080p', maxUploadSizeBytes: 500 * 1024 * 1024, chunkSizeBytes: 10 * 1024 * 1024 };
  }
  // Cellular / 3G fallback
  return { maxVideoResolution: '720p', maxUploadSizeBytes: 50 * 1024 * 1024, chunkSizeBytes: 2 * 1024 * 1024 };
};
```

---

### Question d7264ec5-26fe-4ce7-8c3d-345678901f24

- A user uploads multiple large files simultaneously, causing network congestion. How would you manage concurrency and queueing?

### Answer

- ***Bounded Priority Queue Architecture***: Implement a client-side async concurrency queue (e.g., using `p-limit` or custom task queue) capped at maximum 2 concurrent file transfers.
- ***Priority Task Assignment***: Assign priorities to upload queue items (e.g., user avatar upload = High Priority, background media batch = Low Priority).
- ***Serial Chunk Execution Engine***: Process file chunks sequentially within active tasks rather than firing parallel HTTP requests for multiple files simultaneously.
- ***Pause & Resume Queue Control***: Allow users to manually pause, resume, or re-order queued uploads from an upload manager sheet UI.
- ***Behavioral Details & Caveats***: Firing 10 parallel HTTP uploads over cellular connection causes TCP packet collision, high latency, request timeouts, and battery drain.

```typescript
import pLimit from 'p-limit';

// Limit concurrent uploads to max 2 active uploads at a time
const limit = pLimit(2);

const uploadQueue = files.map((file) => {
  return limit(() => uploadSingleFile(file));
});

await Promise.all(uploadQueue);
```

---

### Question e6375fd6-370f-4df8-9d4e-456789012a25

- How would you ensure data integrity (e.g., checksum validation) when uploading large files?

### Answer

- ***Native Content Hash Generation***: Compute MD5 or SHA-256 checksums per chunk and for the whole file using native crypto modules (such as ***`react-native-quick-crypto`*** or native file stream hashers).
- ***Standardized HTTP Digest Headers***: Attach `Content-MD5` or `Digest` headers to each chunk HTTP upload request.
- ***Server Verification & Retry Handshake***: Cloud storage (e.g., AWS S3) validates chunk checksum against `Content-MD5` header natively and rejects corrupted chunks with HTTP 400 Bad Digest, triggering automatic client chunk retry.
- ***Post-Upload End-to-End Validation***: Compare client-calculated master file checksum against server S3 ETag or validation hash response after assembly.
- ***Behavioral Details & Caveats***: Calculating hashes synchronously in JS blocks the main thread; compute stream hashes in native C++/Java/Obj-C threads during background chunking.

```typescript
import QuickCrypto from 'react-native-quick-crypto';

// Compute SHA-256 hash using native fast crypto engine
function computeChunkHash(chunkBuffer: ArrayBuffer): string {
  return QuickCrypto.createHash('sha256')
    .update(chunkBuffer)
    .digest('hex');
}
```
