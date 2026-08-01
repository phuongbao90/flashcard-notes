# Notifications

### Question da193c2b-5980-4d5f-b3c2-70241356dbf8

- What are push notifications and how do they work end-to-end in mobile apps?

### Answer

- ***Push notifications*** are asynchronous messages sent from a remote backend server to a user's mobile device, even when the application is not actively running.
- ***End-to-End Workflow***:
  - ***Registration***: The mobile app requests notification permissions from the OS and asks the OS gateway (***APNs*** on iOS, ***FCM*** on Android) for a unique native ***device token***.
  - ***Token Persistence***: The app receives the token and registers it with the application backend, storing it alongside the user's account ID.
  - ***Trigger & Payload Creation***: An event occurs on the backend (e.g., new chat message), triggering the backend to format a JSON payload containing the push token and message data.
  - ***Gateway Dispatch***: The backend sends an HTTP request with authentication credentials to the APNs or FCM push service.
  - ***Device Delivery***: APNs/FCM routes the notification over a persistent low-level TCP socket connection maintained between the OS and gateway servers.
  - ***Handling***: The mobile OS receives the payload and either displays a system notification banner or delegates it to the app's background/foreground JS handlers.

```javascript
// Backend request example sending to FCM HTTP v1 API
const response = await fetch('https://fcm.googleapis.com/v1/projects/my-app/messages:send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: {
      token: userDeviceToken,
      notification: {
        title: 'New Message',
        body: 'You have received a new update!',
      },
      data: {
        chatId: '456',
      },
    },
  }),
});
```

---

### Question 37ba0308-a26d-4764-b86a-1c650df2466a

- What is the difference between push notifications and local notifications?

### Answer

- ***Push Notifications***:
  - ***Origin***: Triggered remotely by an external application backend server over the network via gateway services (***APNs*** / ***FCM***).
  - ***Network Requirement***: Requires an active internet connection to receive payloads.
  - ***Setup Complexity***: Requires server infrastructure, device token registration, SSL certificates/API keys, and remote push gateways.
- ***Local Notifications***:
  - ***Origin***: Scheduled and executed entirely on the client device by app logic (e.g., alarms, calendar reminders, geofence triggers).
  - ***Network Requirement***: Operates completely offline without internet or backend communication.
  - ***Setup Complexity***: Simple client-side setup using libraries like `expo-notifications` or `react-native-notifications`.

```javascript
import * as Notifications from 'expo-notifications';

// Local notification scheduled client-side
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Reminder",
    body: "Time to complete your daily check-in!",
    data: { screen: 'DailyCheckIn' },
  },
  trigger: {
    seconds: 3600, // Trigger in 1 hour offline
  },
});
```

---

### Question 78c1ebbd-9f9a-43ff-be71-50d7c0d9cbc2

- What are the key components involved in a notification system (client, server, push service)?

### Answer

- ***Client Mobile App***:
  - Requests notification permissions from the OS.
  - Obtains device/push tokens and sends them to the backend.
  - Listens for incoming notification events across app lifecycles (foreground, background, killed) and executes deep links.
- ***Application Backend***:
  - Stores user-to-token mappings in a database.
  - Manages notification templates, targeting logic, user preferences, and deduplication.
  - Formats payloads and dispatches HTTP requests to remote push gateways.
- ***Push Notification Gateway (APNs / FCM)***:
  - Third-party cloud infrastructure operated by Apple (***APNs***) and Google (***FCM***).
  - Maintains persistent, power-efficient TCP connections with all active mobile hardware.
  - Queues, throttles, authenticates, and physically delivers payloads to individual devices.

---

### Question 81a1febe-4146-468a-a644-7a15400259e9

- How do notification systems differ between iOS and Android at a high level?

### Answer

- ***Apple Push Notification service (APNs)***:
  - Uses `.p8` authentication keys (or legacy `.p12` certificates) associated with an Apple Developer Team ID and App Bundle ID.
  - Strict separation between ***Development*** (Sandbox) and ***Production*** APNs environments; tokens are incompatible between environments.
  - Enforces tight background execution windows (30 seconds maximum) for notification service extensions and background payloads.
- ***Firebase Cloud Messaging (FCM)***:
  - Uses Google Cloud Service Accounts and FCM HTTP v1 REST API.
  - Mandates ***Notification Channels*** (Android 8.0+ / API 26+) for display configuration (sound, priority, vibration).
  - Differentiates strictly between ***High Priority*** (bypasses Doze mode for immediate delivery) and ***Normal Priority*** (deferred to save battery).

---

### Question ad6e6bb5-0a20-4815-853f-ba1c4a863a46

- What permission models apply to notifications on iOS vs Android?

### Answer

- ***iOS Permission Model***:
  - Requires explicit user authorization dialog (`UNUserNotificationCenter`) before displaying alerts, playing sounds, or updating badges.
  - Supports ***Provisional Authorization*** (iOS 12+), allowing notifications to be sent quietly to the Notification Center without presenting an initial prompt.
  - Missing required `Info.plist` entitlement configurations causes silent failures or submission rejections.
- ***Android Permission Model***:
  - ***Legacy (Android 12 and below)***: Notifications granted automatically at install time without runtime prompts.
  - ***Android 13+ (API level 33+)***: Requires runtime permission request for `POST_NOTIFICATIONS`. If user denies, notifications are silenced.
  - ***Notification Channels***: Users can independently disable specific notification channels in system settings even if global permission is granted.

```javascript
import * as Notifications from 'expo-notifications';

async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}
```

---

### Question 4b8887eb-b6a3-48b2-a5da-111fd76f3c31

- How do notification delivery guarantees differ between iOS and Android?

### Answer

- ***Best-Effort Delivery***: Neither APNs nor FCM guarantees 100% or real-time notification delivery; both services operate on a best-effort basis.
- ***APNs Delivery & Collapsing***:
  - APNs stores only the latest notification per app if a device is powered off or offline. Older notifications are overwritten if a `apns-collapse-id` is provided.
  - APNs aggressively drops low-priority or silent notifications when the device is under low power mode or thermal constraints.
- ***FCM Delivery & Doze Mode***:
  - FCM provides message delivery guarantees based on payload priority: ***High Priority*** attempts immediate delivery regardless of Doze mode, while ***Normal Priority*** payloads are batched during maintenance windows.
  - OEM Android skins (e.g., MIUI, EMUI, ColorOS) enforce custom aggressive battery optimization managers that frequently kill background sockets and block notification delivery completely.

---

### Question 829bd296-ba1a-42ac-8fbe-0ca2f15e050c

- How do foreground, background, and terminated states affect notification handling on each platform?

### Answer

- ***Foreground State***:
  - ***iOS***: System does NOT display notification banners by default unless explicit foreground presentation options (`banner`, `sound`) are set via `UNUserNotificationCenterDelegate` or `setNotificationHandler`.
  - ***Android***: Displays banners by default if Notification Channel criteria are met, while simultaneously passing data to JS listeners.
- ***Background State***:
  - System tray displays the visual notification.
  - Tapping the notification launches/resumes the app and triggers the notification response handler (`addNotificationResponseReceivedListener`).
  - Silent notifications attempt to execute background tasks within OS runtime limits.
- ***Terminated / Killed State***:
  - Display notifications are rendered natively by the OS system tray.
  - Tapping the banner cold-starts the React Native JavaScript engine. The initial payload must be captured during launch using `getLastNotificationResponseAsync()`.
  - On iOS, silent notifications in a killed state are usually suppressed by the OS. On Android, FCM high-priority data messages can invoke background headless JS tasks (`HeadlessJS`).

```javascript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export function useNotificationObserver() {
  useEffect(() => {
    // Handle banner tap when app cold-starts from killed state
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification.request.content.data;
        console.log('App opened from killed state via notification:', data);
      }
    });

    // Handle incoming notification when app is in foreground
    const subReceived = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification);
    });

    // Handle user tapping notification banner
    const subResponse = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped by user:', response.actionIdentifier);
    });

    return () => {
      subReceived.remove();
      subResponse.remove();
    };
  }, []);
}
```

---

### Question 1ac145d1-e260-4ab4-9b56-8802bf121d04

- How are notifications handled in an Expo app?

### Answer

- ***expo-notifications Module***: The official Expo framework module that provides a unified, cross-platform JavaScript API for requesting permissions, managing push tokens, scheduling local notifications, and handling interactions.
- ***Expo Application Services (EAS) Integration***:
  - Expo abstracts native APNs and FCM setup by acting as an intermediary push gateway (`https://exp.host/--/api/v2/push/send`).
  - EAS credentials store your APNs `.p8` key and FCM Server Key/Service Account credentials securely in the cloud.
- ***Development Workflow***:
  - Testing push notifications requires a ***Development Build*** (`expo run:ios` / `expo run:android` or `eas build --profile development`) or physical device setup. Expo Go has limited push notification support on iOS starting with SDK 49.

---

### Question 79a7f4e5-a50f-47f9-a9f4-6a5857f10a1b

- How do you register a device for push notifications and obtain a push token?

### Answer

- ***Steps for Registration***:
  - Ensure the execution environment is a physical device or supported development build with push entitlements configured.
  - Request OS notification permissions via `Notifications.requestPermissionsAsync()`.
  - On Android, create a default Notification Channel before fetching tokens.
  - Call `Notifications.getExpoPushTokenAsync({ projectId })` to retrieve the Expo push token (or `getDevicePushTokenAsync` for native tokens).
  - Transmit the token to your backend via API and store it mapped to the current user.

```javascript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Channel',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('Permission not granted for push notifications');
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data; // e.g. "ExponentPushToken[xxxxxxxxxxxxxx]"
}
```

---

### Question aaa38d5d-3f34-4bfb-a344-3a7cab50a4ae

- What is the difference between Expo push tokens and native device tokens?

### Answer

- ***Native Device Tokens***:
  - Raw tokens issued directly by ***APNs*** (hex string) or ***FCM*** (registration string).
  - Requires your own backend server to implement direct HTTP/2 APNs integration and Google FCM v1 API authentication.
- ***Expo Push Tokens***:
  - Formatted strings generated by Expo (e.g., `ExponentPushToken[xxx]`).
  - Act as an abstraction layer: your backend sends notifications to Expo's Push API (`exp.host`), and Expo's infrastructure translates and dispatches the payload to APNs or FCM.
  - Simplifies payload formatting, multi-platform targeting, and receipt checking across iOS and Android.

---

### Question 8a10b7d7-b3e0-4a72-bafc-a882bcb2451d

- How do you send a push notification using Expo’s push service?

### Answer

- ***Expo Push HTTP API Endpoint***: Backend sends a `POST` request to `https://exp.host/--/api/v2/push/send`.
- ***Payload Structure***: Accepts a JSON object or array of objects containing `to` (Expo push token), `title`, `body`, `data` (JSON dictionary for deep links), `sound`, `badge`, and `priority`.
- ***Delivery Receipts***: Returns a list of ***Tickets*** containing ticket IDs (`id`) or immediate error statuses (`error: 'DeviceNotRegistered'`). Receipts can be verified later via `https://exp.host/--/api/v2/push/getReceipts` to check APNs/FCM delivery confirmation.

```javascript
// Backend Node.js script using fetch to send Expo push notification
async function sendExpoPushNotification(expoPushToken, title, body, data = {}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();
  return result;
}
```

---

### Question 3c15c36d-0ece-42ac-9e6b-84bf7e818fa1

- How do you handle incoming notifications in foreground vs background?

### Answer

- ***Foreground Handling***:
  - Configure the global presentation handler using `Notifications.setNotificationHandler()`.
  - Listen for incoming active notifications using `Notifications.addNotificationReceivedListener()`.
- ***Background Handling***:
  - Visual notification banners are handled automatically by the native OS tray.
  - User tap interactions are handled via `Notifications.addNotificationResponseReceivedListener()`.
  - For silent background data processing, register a task via `TaskManager` and `Notifications.registerTaskAsync()`.

```javascript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Configure foreground presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Register background task for data processing
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }
  console.log('Received notification in background:', data.notification);
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
```

---

### Question 5d4adeff-a0c1-485a-81ab-1c7aec2a0551

- What are different types of notifications (alert, silent/data-only, scheduled)?

### Answer

- ***Alert (Display) Notifications***:
  - Visible notifications containing a title, body text, sound, badge count, and optional media attachments.
  - Rendered automatically by the native OS system tray when the app is in the background or killed.
- ***Silent / Data-Only Notifications***:
  - Notifications containing non-visual `data` payloads without title or body elements.
  - Used to awaken the app in the background to update local databases, invalidate caches, or fetch content silently.
- ***Scheduled / Local Notifications***:
  - Notifications configured directly on the device hardware to trigger at a future timestamp, recurring time interval, or geofence boundary.

---

### Question 45f33554-799b-4196-9289-1fdcc4e8719b

- What are silent notifications and when would you use them?

### Answer

- ***Definition***: Notifications delivered without displaying visual banners, playing sound alerts, or modifying badge counts.
- ***Platform Specific Requirements***:
  - ***iOS***: Requires `content-available: 1` in the `aps` payload, `apns-priority: 5`, and `remote-notification` background mode enabled in capabilities.
  - ***Android***: Requires an FCM payload containing only `data` keys (omitting the `notification` object) sent with `high` priority.
- ***Use Cases***:
  - Background data synchronization (e.g., syncing instant message history).
  - Remote token invalidation and logout enforcement.
  - Pre-fetching media assets or feed updates before the user opens the application.
- ***Caveats***: Apple aggressively throttles silent notifications based on system resource constraints, battery status, and low app usage.

```javascript
// Backend payload for iOS silent notification via APNs
const silentApnsPayload = {
  aps: {
    'content-available': 1,
  },
  'apns-priority': '5', // Priority 5 is required for content-available notifications
  data: {
    action: 'SYNC_INBOX',
    timestamp: Date.now(),
  },
};
```

---

### Question fdd4ea7d-66f3-4a85-870a-9c8cfea4d13b

- How do notification payload structures differ between iOS and Android?

### Answer

- ***APNs Payload (iOS Native)***:
  - Wrapped inside a top-level `aps` dictionary.
  - Keys include `alert` (`title`, `body`), `badge`, `sound`, `category`, `thread-id`, and `content-available`.
  - Custom application data fields reside at the root level alongside `aps`.
- ***FCM Payload (Android Native)***:
  - Divided into `notification` (title, body, image) and `data` (custom key-value pairs).
  - ***Notification Message***: Handled by the OS automatically when the app is in the background.
  - ***Data Message***: Delivered directly to app handlers regardless of app state.
  - Android data payloads convert all values to string types natively.

```javascript
// Comparison of native payload structures
// iOS APNs Native JSON
const apnsFormat = {
  aps: {
    alert: { title: "Order Update", body: "Driver is nearby!" },
    sound: "default",
    category: "ORDER_TRACKING"
  },
  orderId: "12345" // Custom root data
};

// Android FCM Native JSON
const fcmFormat = {
  notification: {
    title: "Order Update",
    body: "Driver is nearby!"
  },
  data: {
    orderId: "12345", // Must be strings
    screen: "OrderTracking"
  }
};
```

---

### Question 0a17eff5-7dbc-4f0c-8647-79d826c06f73

- How do you handle deep linking from notifications?

### Answer

- ***Deep Linking Strategy***:
  - Include navigation metadata inside the notification `data` payload (e.g., `{ url: 'myapp://orders/789', screen: 'OrderDetails', params: { id: '789' } }`).
  - Attach a response listener (`addNotificationResponseReceivedListener`) to intercept user taps when the app is running in foreground/background.
  - Handle cold launches from terminated states using `getLastNotificationResponseAsync()` on root component mount.
  - Use React Navigation's `linking` configuration or explicit imperative navigation (`navigationRef.navigate()`).

```javascript
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { navigationRef } from './navigation/RootNavigation';

export function useNotificationDeepLink() {
  useEffect(() => {
    function handleNotificationResponse(response) {
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Perform deep link navigation
        if (navigationRef.isReady()) {
          navigationRef.navigate(data.screen, data.params);
        }
      }
    }

    // Handle tap from background/foreground
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Handle tap from killed state
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => subscription.remove();
  }, []);
}
```

---

### Question e937c438-35bf-40bd-b75a-d4a39f87179d

- How do you request notification permissions in a user-friendly way?

### Answer

- ***Soft Prompt / Pre-Permission UI***:
  - Never display the native system permission dialog on the very first app launch; users frequently reject premature prompts.
  - Use an in-app contextual modal explaining the value proposition of enabling notifications (e.g., "Receive instant delivery alerts and exclusive discounts").
  - Trigger the OS system permission dialog (`requestPermissionsAsync()`) ONLY after the user clicks "Enable Notifications" in your custom pre-permission UI.
- ***Timing & Context***:
  - Prompt for permissions immediately after high-intent user actions (e.g., placing an order, booking a ride, or subscribing to a creator).

---

### Question b2e123ab-ad17-4c1c-9c54-5b200a780b3a

- What are provisional notifications on iOS and how do they affect UX?

### Answer

- ***Provisional Authorization***:
  - Introduced in iOS 12 (`UNAuthorizationOptionProvisional`).
  - Allows an application to send notifications immediately without showing an explicit permission prompt to the user beforehand.
- ***User Experience Impact***:
  - Provisional notifications arrive silently in the Notification Center (no lock screen banner, sound, or badge).
  - The notification includes inline OS controls ("Keep..." or "Turn off..."), allowing users to opt into prominent delivery or disable notifications altogether directly from the banner.
  - Eliminates initial onboarding permission friction while empowering users to manage preference controls.

```javascript
import * as Notifications from 'expo-notifications';

async function requestProvisionalPermission() {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      provideAppNotificationSettings: true,
      // Request provisional quiet authorization on iOS
      allowProvisional: true,
    },
  });
  return status;
}
```

---

### Question cd4d6f1c-b67b-4e73-a75e-a0e74530fa83

- How do you handle cases where users deny notification permission?

### Answer

- ***Graceful Degradation***:
  - Ensure core app functionality remains completely usable even if notification permission is denied.
  - Save the denied status in local state (e.g., MMKV/AsyncStorage) or global state to avoid repeatedly bugging the user.
- ***Fallback Communication Channels***:
  - Display critical updates inside an in-app Notification Center / Inbox feed fetched via REST API.
  - Utilize alternative fallback channels such as SMS, Email, or WebSockets for urgent transactional events (e.g., 2FA codes, order confirmations).

---

### Question 0f280bc1-b815-4b53-9aa4-e2c84bd2b7cb

- How do you guide users to re-enable notifications from system settings?

### Answer

- ***System Setting Redirection***:
  - Once a native permission prompt is explicitly denied, the OS prevents displaying the system prompt again programmatically.
  - Detect when permission status is `'denied'`. Display an in-app banner or button explaining that notifications are currently muted.
  - Redirect the user directly to the app's native device system settings screen using `Linking.openSettings()`.

```javascript
import { Linking, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

async function checkAndGuideToSettings() {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();

  if (status === 'denied' && !canAskAgain) {
    Alert.alert(
      'Notifications Disabled',
      'Please enable notifications in system settings to receive order updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }
}
```

---

### Question a1352775-c628-4e90-992f-2c06e9a22da9

- What are best practices to avoid notification fatigue?

### Answer

- ***Granular User Preference Controls***:
  - Provide an in-app notification preference matrix (e.g., toggles for Marketing, Order Tracking, Security, Chat).
- ***Notification Grouping & Collapsing***:
  - Group related notifications logically using `thread-id` on iOS or `groupKey` / channels on Android.
  - Use `apns-collapse-id` or FCM `collapse_key` to replace older unread notifications with updated status (e.g., updating driver location instead of spamming 10 banners).
- ***Frequency Limits & Quiet Hours***:
  - Implement server-side rate limiting and respect local user timezones to avoid dispatching promotional notifications late at night.

---

### Question 68821338-f849-4d67-a063-551337dc2b63

- How do you handle notifications when the app is in foreground, background, or killed?

### Answer

- ***Foreground Handling***:
  - Use `Notifications.setNotificationHandler()` to control banner display.
  - Intercept the incoming payload with `addNotificationReceivedListener()` to update active React component state directly (e.g., chat bubble) without forcing a intrusive banner alert.
- ***Background Handling***:
  - Native OS handles banner rendering.
  - Listen to user banner taps with `addNotificationResponseReceivedListener()` to trigger navigation.
- ***Killed State Handling***:
  - Rendered by OS system tray.
  - Retrieve launch payload on app startup via `getLastNotificationResponseAsync()` after navigation ref mounts.

---

### Question 87c713f5-ea86-4890-afd3-740cd6edef67

- How do you ensure users don’t miss important notifications when the app is inactive?

### Answer

- ***In-App Notification Feed (Inbox)***:
  - Maintain a persistent notification inbox endpoint on the backend database.
  - Every push notification is stored on the server. When the app opens, query `GET /api/notifications` to fetch missed messages regardless of OS push delivery failures.
- ***Multi-Channel Fallbacks***:
  - Automatically dispatch secondary channel messages (SMS, Email, WhatsApp) if push delivery receipts are missing for time-sensitive notifications (e.g., flight gate changes or transaction fraud).

---

### Question 114bbd96-8f26-4afd-9e42-913440f13bcf

- How do you manage notification state in your app (e.g., read/unread, badge count)?

### Answer

- ***Badge Count Management***:
  - Use `Notifications.setBadgeCountAsync(count)` to programmatically update the app icon badge number on the device.
- ***Read/Unread Synchronization***:
  - Store notification read states on the application backend database.
  - When a user taps a notification or opens the in-app notification inbox, send a request to `PATCH /api/notifications/:id/read`.
  - Recalculate unread total on backend and update client badge count to `0` or current unread count via `setBadgeCountAsync(newCount)`.

```javascript
import * as Notifications from 'expo-notifications';

async function markNotificationsAsRead(unreadCount) {
  // Sync badge count on mobile home screen
  await Notifications.setBadgeCountAsync(unreadCount);
}

async function clearAllBadges() {
  await Notifications.setBadgeCountAsync(0);
}
```

---

### Question 0f860f83-931c-4535-89bb-6490da9f85bb

- How would you design a backend system for sending notifications at scale?

### Answer

- ***Decoupled Architecture***:
  - ***Event Producers***: Application services publish notification events (e.g., `OrderShipped`) to a message queue (***Apache Kafka***, ***RabbitMQ***, or ***AWS SQS***).
  - ***Notification Consumer Service***: Worker instances pull events from the queue, resolve targeted user IDs, and look up active push tokens from a distributed cache (***Redis***).
  - ***Payload Assembly & Delivery Service***: Workers batch payloads and dispatch requests asynchronously via HTTP/2 connection pools to APNs and FCM v1 APIs.
- ***Rate Limiting & Dead Letter Queues (DLQ)***:
  - Protect push gateways from throttling by implementing token bucket rate-limiting.
  - Move failed delivery requests to a DLQ for retry with exponential backoff.

---

### Question a1576ab4-697b-4937-825f-1429e8f537d8

- How do you handle token storage and synchronization between client and server?

### Answer

- ***Database Schema***:
  - Store tokens in a dedicated table: `user_id`, `device_id`, `push_token`, `platform` (ios/android), `is_active`, `updated_at`.
- ***Multi-Device Support***:
  - Allow multiple active push tokens per `user_id` so users receive notifications across phones and tablets.
- ***Synchronization Trigger***:
  - Send the push token to the server on every app cold-start and whenever the token refresher listener (`addPushTokenListener`) emits a new token.
  - Upsert the token record based on `(user_id, device_id)` composite primary key.

```sql
-- Backend database schema representation (SQL)
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  push_token VARCHAR(500) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);
```

---

### Question 2ebba38b-a2f3-473f-acfe-a382a1e58ab1

- What happens when a push token becomes invalid and how do you handle it?

### Answer

- ***Causes of Invalidation***:
  - User uninstalls the application.
  - App data is cleared or restored on a new physical device.
  - APNs / FCM explicitly rotates or revokes registration tokens.
- ***Gateway Error Responses***:
  - ***APNs***: Returns HTTP `410 Gone` with reason `Unregistered` or `BadDeviceToken`.
  - ***FCM***: Returns error `UNREGISTERED` or `messaging/registration-token-not-registered`.
  - ***Expo Push API***: Returns ticket/receipt error `'DeviceNotRegistered'`.
- ***Backend Handling Strategy***:
  - Immediately flag or delete the invalid token (`is_active = false`) in your database upon receiving gateway error responses to prevent wasting throughput and incurring gateway rate limit penalties.

```javascript
// Backend worker logic handling Expo delivery receipt errors
async function handlePushReceipts(receipts) {
  for (const [receiptId, receipt] of Object.entries(receipts)) {
    if (receipt.status === 'error') {
      if (receipt.details?.error === 'DeviceNotRegistered') {
        const invalidToken = receipt.details.expoPushToken;
        // Invalidate token in backend DB
        await db.userPushTokens.update({ is_active: false }, { where: { push_token: invalidToken } });
      }
    }
  }
}
```

---

### Question 6e3f7d7b-d040-4007-b717-23ed56c1f9e0

- How do you implement targeting (user segments, topics, personalization)?

### Answer

- ***Topic Subscriptions (FCM)***:
  - Subscribe client devices directly to FCM pub/sub topics (e.g., `topics/sports_news`). Backend dispatches a single FCM payload to the topic without storing millions of individual tokens.
- ***Segmented Database Targeting***:
  - Query your backend database based on user demographic filters, activity metrics, or subscription tiers (e.g., "Users active in last 30 days"). Stream target token batches into notification worker queues.
- ***Dynamic Personalization***:
  - Utilize message template engine (e.g., Handlebars/Mustache) on backend workers to inject personalized fields (`"Hey {{firstName}}, your {{itemName}} is back in stock!"`).

---

### Question 0a56fec2-37f9-43fe-a7e3-ca4b7c0b1a1d

- Why might notifications not be delivered even if sent successfully?

### Answer

- ***Device Offline / Airplane Mode***: Device has no active connection to APNs/FCM gateways.
- ***System Permission Revocation***: User disabled app notifications in OS system settings after token registration.
- ***OEM Battery Optimizations***: Custom Android ROMs (Xiaomi MIUI, Huawei EMUI, Samsung OneUI) force-kill background services and kill FCM socket connections.
- ***App Uninstalled***: Device uninstalled app; gateway has not yet flagged token as unregistered.
- ***Doze Mode & Low Power Mode***: OS defers normal-priority FCM payloads or low-priority APNs silent pushes to conserve battery.
- ***APNs Certificate / Key Mismatch***: Using Sandbox token with Production APNs key or vice versa.

---

### Question a5199ef7-d389-4d83-92aa-c117b57174b0

- How do you handle duplicate notifications?

### Answer

- ***Causes***: Server retry mechanisms dispatched duplicate HTTP requests during transient gateway network timeouts.
- ***Client-Side Deduplication Strategy***:
  - Include a unique `messageId` or `eventId` string inside the custom notification `data` payload.
  - Maintain a lightweight local cache (e.g., MMKV or SQLite) storing recently processed `messageId`s with a 24-hour expiration.
  - When receiving a notification in foreground/background, verify whether `messageId` exists in the local store. If present, drop the notification immediately.

```javascript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export function isDuplicateNotification(messageId) {
  if (!messageId) return false;
  
  const key = `notif_id_${messageId}`;
  if (storage.contains(key)) {
    return true; // Already processed
  }
  
  // Cache message ID for deduplication
  storage.set(key, Date.now());
  return false;
}
```

---

### Question 6a19dc37-8649-44cd-8143-969e7e221b39

- How do you handle delayed or out-of-order notifications?

### Answer

- ***Causes***: FCM/APNs queue delays, network reconnection spikes, or OS maintenance window batching.
- ***Mitigation Strategies***:
  - ***Server Timestamps***: Include a server creation timestamp (`sent_at`) inside the notification `data` payload.
  - ***Stale Data Discard***: On the client, compare `sent_at` with current timestamp; if the notification expired or is older than active state, discard visual display or trigger state refresh.
  - ***Authority Fetching***: Treat push notifications purely as a lightweight signal ("ping"). Never rely on push payload state as single source of truth; query backend API on tap to fetch latest fresh state.

---

### Question 56a11216-117e-4261-9033-7b209522fb78

- How do you handle network failures during notification delivery?

### Answer

- ***Backend Retry Mechanism***:
  - Wrap push gateway HTTP requests in retry policies with exponential backoff and jitter (e.g., using `p-retry` or AWS SQS retry policies).
  - Only retry transient network errors (HTTP 5xx, socket timeouts); do NOT retry 4xx client errors (e.g., invalid token).
- ***Client Offline Recovery***:
  - Store unread alerts on backend DB. Upon network reconnection, client app syncs unread inbox state via REST/GraphQL API.

---

### Question 4e801a4f-00a9-4315-8324-695da80eaff7

- What happens if a user logs out or switches accounts on the same device?

### Answer

- ***Data Leakage Vulnerability***: If a user logs out and the device token remains associated with their `user_id` on the backend, sensitive push notifications for Account A will continue to pop up while Account B (or no user) uses the device.
- ***Mandatory Logout Protocol***:
  - On user logout action, immediately send a request to `POST /api/auth/logout` containing the active `push_token` and `device_id`.
  - Disassociate or delete the push token record from `user_id` on backend database.
  - Clear local push token cache on client.

```javascript
async function handleUserLogout(userId, pushToken, deviceId) {
  try {
    // Unregister token from backend before removing auth credentials locally
    await fetch('https://api.myapp.com/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pushToken, deviceId }),
    });
  } catch (error) {
    console.error('Failed to unregister push token during logout:', error);
  } finally {
    // Clear local storage / auth tokens
    await clearAuthTokens();
  }
}
```

---

### Question 0bfb803e-0a12-4eab-80ea-b5bdef616e7e

- How do you test notifications in development vs production?

### Answer

- ***Development Testing***:
  - ***Expo Push Tool***: Use Expo's web testing interface (`https://expo.dev/notifications`) to manually send test payloads to Expo push tokens.
  - ***Environment Credentials***: Use APNs Development / Sandbox configuration and FCM Development project service accounts.
  - ***Local Testing***: Drag and drop `.apns` JSON payload files onto the Xcode iOS Simulator or use `xcrun simctl push`.
- ***Production Testing***:
  - Test using release binaries signed with production APNs `.p8` keys. Sandbox tokens will reject on production APNs gateways.

---

### Question f1e731b4-2994-4167-b4da-86c42eb3edab

- Why might notifications behave differently on emulator vs real device?

### Answer

- ***iOS Simulator Limitations***:
  - Standard Xcode iOS simulators cannot register for remote APNs push tokens directly prior to Xcode 14/iOS 16, and simulator tokens cannot receive remote APNs payloads from remote backends. Local scheduled notifications work.
- ***Android Emulator Requirements***:
  - Android emulators MUST use system images equipped with ***Google Play Store / Google APIs***. Standard AOSP emulator builds lack Google Play Services and fail FCM token initialization.
- ***Hardware Constraints***: Emulators do not accurately replicate OEM power-saving modes, Doze mode transitions, or thermal throttling.

---

### Question f0dd8346-76fc-4689-8c7a-443d54bc4bb4

- How do you debug issues with missing or inconsistent notifications?

### Answer

- ***Step-by-Step Diagnostic Protocol***:
  - ***Verify Token Generation***: Log `getExpoPushTokenAsync()` on client to ensure token is valid and sent to backend.
  - ***Check OS Permissions***: Verify app notification permissions and channel settings on testing device.
  - ***Backend Logs & Receipts***: Inspect backend HTTP status codes from APNs/FCM/Expo API. Check Expo delivery receipts for errors like `DeviceNotRegistered`.
  - ***Verify Credentials***: Confirm Apple `.p8` Key ID, Team ID, and Bundle ID match the provisioning profile, and FCM service account matches the bundle/package name.
  - ***Foreground Presentation***: Check if `setNotificationHandler` is suppressing foreground banners.

---

### Question 96ed670b-4c01-48c5-b16b-e764c0bed59f

- How do you implement scheduled/local notifications?

### Answer

- ***Local Scheduling with expo-notifications***:
  - Call `Notifications.scheduleNotificationAsync()` specifying `content` (title, body, data) and `trigger` (time interval, specific date, or calendar trigger).
- ***Managing Scheduled Notifications***:
  - Fetch pending scheduled items via `getAllScheduledNotificationsAsync()`.
  - Cancel specific triggers using `cancelScheduledNotificationAsync(id)` or wipe all using `cancelAllScheduledNotificationsAsync()`.

```javascript
import * as Notifications from 'expo-notifications';

// Schedule a recurring daily notification at 9:00 AM local time
async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync(); // Clear existing

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Habit Tracker",
      body: "Don't forget to log your progress today!",
      data: { route: 'HabitTracker' },
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
  return notificationId;
}
```

---

### Question b0f32e86-31b3-4220-9807-1f5e20a62551

- How do you implement notification channels (Android) and categories (iOS)?

### Answer

- ***Android Notification Channels***:
  - Required for Android 8.0+ (API 26+). Categorizes notifications into user-controllable channels (e.g., `orders`, `promotions`).
  - Configure importance (`MAX`, `HIGH`, `DEFAULT`, `LOW`), custom sound, vibration, and light color via `setNotificationChannelAsync()`.
- ***iOS Notification Categories & Actions***:
  - Registers interactive action buttons (e.g., "Accept", "Decline", "Reply") attached to notification banners.
  - Configured using `setNotificationCategoryAsync()` matching the `categoryIdentifier` specified in the APNs payload.

```javascript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function setupChannelsAndCategories() {
  // Android Channel Setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chat_messages', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'chat_sound.wav',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // iOS Category Setup with Action Buttons
  await Notifications.setNotificationCategoryAsync('CHAT_INVITE', [
    {
      identifier: 'ACCEPT_ACTION',
      buttonTitle: 'Accept',
      options: { opensAppInForeground: true },
    },
    {
      identifier: 'DECLINE_ACTION',
      buttonTitle: 'Decline',
      options: { isDestructive: true },
    },
  ]);
}
```

---

### Question 472d10d7-b7ab-4b9f-927a-abe0b6ccc077

- How do you handle rich notifications (images, actions, buttons)?

### Answer

- ***Rich Media Attachments***:
  - ***iOS***: Requires adding a native ***Notification Service Extension*** target to your iOS project if images are hosted remotely (downloads image URL before presenting banner).
  - ***Android***: Supported out-of-the-box by passing `image` URL in FCM notification payload or Expo push options.
- ***Interactive Actions***:
  - Attach category IDs to payload (`categoryIdentifier` on iOS, `channelId` on Android).
  - Listen for button tap actions in `addNotificationResponseReceivedListener()` by inspecting `response.actionIdentifier`.

---

### Question 14683df6-5acf-4b37-8ab0-6184da117f8f

- How do you track notification engagement (open rate, CTR)?

### Answer

- ***Key Metrics***:
  - ***Sent Count***: Total push requests dispatched by backend.
  - ***Delivery Rate***: Percentage confirmed by APNs/FCM receipts.
  - ***Click-Through Rate (CTR) / Open Rate***: Percentage of users who tapped the banner to launch the app.
- ***Tracking Implementation***:
  - Attach campaign tracking parameters (`campaignId`, `variantId`) in the notification `data` payload.
  - Send analytics events to your telemetry service (e.g., Mixpanel, Amplitude, Segment) inside `addNotificationResponseReceivedListener()` when `actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER`.

```javascript
import * as Notifications from 'expo-notifications';
import { trackAnalyticsEvent } from './analytics';

Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  if (data?.campaignId) {
    trackAnalyticsEvent('NOTIFICATION_OPENED', {
      campaignId: data.campaignId,
      action: response.actionIdentifier,
      sentAt: data.sentAt,
    });
  }
});
```

---

### Question 4643bd27-4b76-4503-8081-dcb2564551af

- In an e-commerce app, users deny notification permission but still expect order updates. How would you design fallback communication?

### Answer

- ***Multi-Channel Fallback Matrix***:
  - ***In-App Order Status Card***: Place a prominent, live-updating order banner directly on the home screen feed fetched on app resume via WebSocket or REST polling.
  - ***Transactional SMS & Email***: Trigger automated fallback SMS/WhatsApp messages for critical delivery states (e.g., "Driver is outside") if push permission is revoked.
  - ***Contextual Soft Prompting***: When the user opens the order tracking screen, display a contextual banner explaining: "Notifications are off. Turn on push to receive real-time driver arrival alerts" with a direct link to `Linking.openSettings()`.

---

### Question a18bc00c-6ba3-486c-828b-1988ff63a05e

- In a ride-hailing or delivery app, real-time updates are critical. How do you handle delayed or missing notifications?

### Answer

- ***Dual Transport Layer (Push + WebSocket)***:
  - While app is active or in background, maintain a persistent socket connection (e.g., Socket.io / AWS AppSync SSE) alongside FCM/APNs push notifications.
  - Use FCM ***High Priority*** payloads and iOS ***Live Activities / ActivityKit*** for real-time lockscreen widget tracking.
  - ***SMS Escalation Fallback***: Server monitors delivery receipts; if push ack is missing within 30 seconds of driver arrival, automatically dispatch fallback SMS alert.

---

### Question 46c2329d-87e4-4fc2-9453-b223707cc9a9

- In a social media app, users complain about too many notifications. How would you reduce fatigue while maintaining engagement?

### Answer

- ***Smart Aggregation / Digesting***:
  - Instead of sending 10 individual push alerts for 10 likes, buffer events on backend for 15 minutes and send a single aggregated notification: *"John and 9 others liked your photo"*.
- ***Collapse Identifiers***:
  - Pass `apns-collapse-id` / FCM `collapse_key` so new updates overwrite unread alerts in system tray.
- ***Granular Frequency & Topic Controls***:
  - Provide in-app toggles for specific event types and allow users to set quiet hours or daily summary digests.

---

### Question 10f2e67e-ec4c-4a01-9e30-e41f53e910ad

- In a subscription-based app, users miss renewal reminders due to disabled notifications. How do you reduce churn?

### Answer

- ***Client-Side Scheduled Local Reminders***:
  - When the user subscribes or opens the app with an active subscription, schedule local offline notifications 7 days and 1 day prior to expiration via `scheduleNotificationAsync()`.
- ***Multi-Touch Reminders***:
  - Combine push alerts with automated transactional emails and prominent in-app banner modals displayed on launch when subscription expiration approaches.

---

### Question aa94b912-e2fd-4651-a198-c15927112345

- In a chat app, messages arrive out of order or duplicated. What could cause this and how would you fix it?

### Answer

- ***Root Causes***: FCM message reordering, server HTTP retry duplicate pushes, or network packet jitter.
- ***Remediation Plan***:
  - Assign a strict, monotonically increasing `sequenceId` and unique `messageId` to every chat message on the backend.
  - Client stores incoming messages in a local offline database (e.g., WatermelonDB / SQLite), deduplicates by `messageId`, and sorts by `sequenceId` before rendering UI.
  - Treat push notification as a trigger to pull missing message deltas from backend REST API rather than inserting directly into state.

---

### Question 39e129d5-02ce-4d23-8f05-1d896feee37d

- In a fintech app, notifications are critical (e.g., transactions, fraud alerts). How do you ensure reliability and trust?

### Answer

- ***High-Priority Dual Channel Delivery***:
  - Send transaction alerts via FCM High Priority + APNs alert payload. Trigger instant SMS concurrently for high-value fraud alerts.
- ***Secure Server-Driven Inbox***:
  - Store all transaction records in a secure, encrypted backend audit log.
  - App displays an authoritative in-app Security Center inbox. User can verify if a push alert is authentic or spoofed.
- ***Immediate Token Invalidation on Security Events***:
  - Invalidate all device push tokens on password reset or account compromise.

---

### Question d4d384ac-eadd-4aa6-bd22-ea3fd882dc84

- In a content app, users want personalized notifications. How would you design segmentation and targeting?

### Answer

- ***Explicit & Implicit Preference Profiling***:
  - ***Explicit***: Allow users to select favorite categories/topics during onboarding.
  - ***Implicit***: Track reading history and compute interest tags on backend.
- ***Segmented Push Pipeline***:
  - Map users to interest topics in Redis/Postgres.
  - When publishing content, backend worker queries target tokens matching interest vectors and dispatches personalized notification batches.

---

### Question 28afe9f0-7e77-4f16-a14a-bf523b7b2c7a

- In a gig worker app, users rely on notifications for job assignments but disable them. What alternative strategies would you use?

### Answer

- ***Alternative Delivery Channels***:
  - Automated voice calls (Twilio Programmable Voice) or SMS for urgent high-payout job offers.
- ***Persistent Foreground Audio/Socket Alerting***:
  - When the app is open, maintain WebSocket socket connection and play loud custom audio alerts.
- ***In-App Lock Screen & Widget Integration***:
  - Utilize iOS Live Activities and Android Ongoing Notifications to keep active job availability visible on lock screen.

---

### Question 37a78ab8-454d-4062-80bc-13b60251b609

- In a news app, you want to A/B test notification strategies. What metrics and experiments would you design?

### Answer

- ***Experimental Setup***:
  - Divide user base into random experiment cohorts (Control, Variant A: Headline style, Variant B: Rich media image).
- ***Metrics to Track***:
  - ***CTR (Click-Through Rate)***: Banner taps / Total sent.
  - ***1-Day / 7-Day Retention***: App sessions post notification.
  - ***Unsubscribe / Opt-Out Rate***: Percentage of users who disable notifications or uninstall within 24 hours of notification broadcast.

---

### Question 166388a1-3a8a-4203-9e31-261f0a302c26

- In a travel app, users are in different time zones. How do you schedule notifications correctly?

### Answer

- ***Timezone-Aware Scheduling***:
  - Store user device's local timezone offset (e.g., `America/New_York`) on backend upon app launch.
  - Backend scheduler calculates target dispatch time relative to UTC for each user's local 8:00 AM morning window.
  - Alternatively, use client-side local notification scheduling (`scheduleNotificationAsync`) using local time triggers.

---

### Question a73437f9-c392-49e5-a231-140800a18257

- In a marketplace app, users log in on multiple devices. How do you handle duplicate notifications across devices?

### Answer

- ***Cross-Device State Syncing***:
  - Include `order_event_id` in data payload. Send notification to all registered tokens of the user.
  - When user opens notification on Device A, Device A sends read receipt to backend.
  - Backend dispatches a silent push (`content-available: 1`) to Device B to clear or update the badge and dismiss the banner locally via `dismissNotificationAsync()`.

---

### Question 5a839975-dd47-457f-ac26-ac4a0f2e765f

- In a gaming app, users receive rewards via notifications. How do you prevent abuse or missed rewards?

### Answer

- ***Zero-Trust Security Design***:
  - Never include reward authorization tokens or redeemable game items directly in client-side push notification payloads (susceptible to spoofing or replay attacks).
  - Treat notification purely as a visual prompt. Tapping banner calls `POST /api/rewards/claim` on backend.
  - Server verifies claim eligibility, user identity, and idempotency key before granting reward.

---

### Question ad7647c3-948a-46f6-b87d-7d571f3478a9

- In an app where users frequently log out/in, how do you manage push tokens correctly?

### Answer

- ***Token Lifecycle Management***:
  - On `logout`: Transmit `push_token` and `userId` to backend API to mark `is_active = false` or delete token association.
  - On `login`: Fetch current push token via `getExpoPushTokenAsync()` and register upsert mapping with the new `userId`.
  - Store active `userId` alongside token in secure local storage (MMKV) to verify match before processing background notification events.

---

### Question 2081eab0-0cd0-440d-bfe6-b9e8cb7c013f

- In a scenario where notifications are sent but never received on iOS, what platform-specific issues would you investigate?

### Answer

- ***iOS Diagnostic Checklist***:
  - ***Environment Mismatch***: APNs Sandbox token sent to APNs Production gateway (or vice versa).
  - ***APNs Credentials***: Expired `.p8` key / `.p12` certificate or wrong Team ID / Key ID configured in EAS/backend.
  - ***Bundle ID Mismatch***: Entitlements configured for different Bundle Identifier.
  - ***Background App Refresh***: User disabled "Background App Refresh" in iOS system settings.
  - ***Missing Entitlements***: Missing `aps-environment` entitlement in iOS Xcode project file.

---

### Question e5243a26-d527-467d-8217-3a78903440df

- In worst-case scenarios (e.g., emergency alerts), how do you design for maximum delivery reliability?

### Answer

- ***Multi-Provider Failover Architecture***:
  - Dual Gateway Routing: Primary dispatch via FCM / APNs high priority; secondary dispatch via SMS / Twilio / WhatsApp Business API if delivery receipt is unconfirmed after 15 seconds.
  - Critical Alerts Permission (iOS): Request `allowCriticalAlerts` entitlement from Apple, allowing emergency sirens to sound even when device is on Silent or Doze/Focus modes.
  - Client Local Cache & Polling: App periodically polls server background endpoint as redundancy.

---

