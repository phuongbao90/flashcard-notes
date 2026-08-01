# Permissions

### Question d17948c7-3f93-4321-9d41-9f8bcc4e63a7

- What are runtime permissions and why are they required in mobile apps?

### Answer

- ***Runtime permissions*** are authorization requests prompted to the user dynamically while the application is running, rather than automatically granted at installation time.
- Mobile OS architectures (iOS and Android 6.0+) enforce runtime permission models to protect sensitive user data (e.g., location, contacts, media) and hardware resources (e.g., camera, microphone, Bluetooth).
- They ensure transparency, user consent, and granular privacy control, preventing untrusted apps from silently accessing sensitive APIs without explicit user approval.

---

### Question f275881b-651a-4194-8557-cd69138a4584

- What is the difference between install-time permissions and runtime permissions?

### Answer

- ***Install-time permissions*** (or Normal Permissions on Android): Granted automatically by the OS during application installation without prompting the user (e.g., `INTERNET`, `VIBRATE`, network state access).
- ***Runtime permissions*** (or Dangerous Permissions on Android / Privacy Permissions on iOS): Require explicit, interactive user consent via system modal dialogs before accessing hardware or sensitive data APIs.
- ***Security Implications***: Install-time permissions cannot be revoked individually by users without uninstalling the app, whereas runtime permissions can be granted, limited, or revoked by users at any time in system settings.

---

### Question a2fbdd6b-49a1-4198-afef-200acdb276ef

- How does permission handling differ between iOS and Android at a high level?

### Answer

- ***iOS Architecture***: All privacy-sensitive permissions require mandatory usage description strings in `Info.plist` (e.g., `NSCameraUsageDescription`). If missing, the app crashes immediately upon triggering the prompt or launching. System permission dialogs can only be shown once natively.
- ***Android Architecture***: Permissions must be declared in `AndroidManifest.xml`. Android allows requesting permissions again after initial rejection unless the user checks 'Don't ask again' (Android 10 and below) or rejects twice (Android 11+).
- ***System Dialog Behavior***: iOS offers precise state options ('Allow Once', 'While Using App', 'Always', 'Select Photos'), while Android modal behaviors vary across API levels (e.g., Android 12+ introduced approximate vs. precise location toggles).

---

### Question 978a68c4-cdd3-435e-bed3-e998a5e09262

- Which permissions require explicit user approval in iOS vs Android?

### Answer

- ***iOS Explicit Approval***: Camera (`NSCameraUsageDescription`), Microphone, Location (Foreground/Background), Photo Library (Full/Limited), Contacts, Calendar, Reminders, HealthKit, Bluetooth, Motion/Fitness, Push Notifications, App Tracking Transparency (ATT).
- ***Android Explicit Approval***: Dangerous permission groups: `CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `READ_CONTACTS`, `WRITE_CONTACTS`, `READ_CALENDAR`, `POST_NOTIFICATIONS` (Android 13+), `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` (Android 13+).
- ***Install-Time Approvals***: Normal permissions (e.g. internet access, set alarm, vibrate) do NOT require explicit user dialog approval on either platform.

---

### Question ad0325ae-b0f3-4b09-8529-3b677a708bee

- What are “dangerous permissions” in Android?

### Answer

- ***Dangerous Permissions*** are Android system permissions that directly access private user data or sensitive hardware capabilities (e.g., `ACCESS_FINE_LOCATION`, `CAMERA`, `READ_CALL_LOG`).
- ***Permission Groups***: Categorized into logical groups (e.g., `CAMERA`, `LOCATION`, `STORAGE`, `MICROPHONE`). Prior to Android 9, granting one permission in a group auto-granted all other permissions within that group.
- ***Runtime Requirement***: Apps targeting Android 6.0 (API level 23) or higher must request dangerous permissions explicitly at runtime before calling restricted native APIs; declaring them in `AndroidManifest.xml` alone is insufficient.

---

### Question 7a8d8bcc-ae1f-4981-aa7e-ab404faaa395

- How are permissions managed in an Expo app?

### Answer

- ***Expo Plugins & Modules***: Expo manages permissions through dedicated SDK libraries (e.g., `expo-camera`, `expo-location`, `expo-image-picker`, `expo-notifications`).
- ***Config Plugins***: When building standalone native binaries (via EAS Build or `npx expo run:ios|android`), Expo Config Plugins automatically inject necessary manifest permissions into `AndroidManifest.xml` and description keys into `Info.plist` based on `app.json` properties.
- ***Unified API***: Expo provides standard async methods (`getPermissionsAsync()` and `requestPermissionsAsync()`) across modules to query and request permissions with platform-agnostic status objects.

---

### Question 3729a398-a4dd-404d-8fe8-22555bf969b8

- How do you request permissions in Expo (e.g., camera, location, media library)?

### Answer

- ***Module Async APIs***: Call module-specific hooks or async request methods such as `useCameraPermissions()`, `Location.requestForegroundPermissionsAsync()`, or `MediaLibrary.requestPermissionsAsync()`.
- ***PermissionResponse Structure***: Inspect returned properties: `status` (`granted`, `denied`, `undetermined`), `granted` (boolean), and `canAskAgain` (boolean).

```javascript
import { useCameraPermissions } from 'expo-camera';

const [permission, requestPermission] = useCameraPermissions();

const handlePress = async () => {
  if (!permission?.granted) {
    const result = await requestPermission();
    if (result.granted) {
      // Access camera feature safely
    }
  }
};
```

---

### Question fbdf5082-d715-4506-b8ca-5391814de265

- What is the difference between getPermissionsAsync and requestPermissionsAsync?

### Answer

- ***getPermissionsAsync()***: Non-intrusive query method. Returns the current permission status without prompting the user or triggering system modal dialogs.
- ***requestPermissionsAsync()***: Interactive request method. Prompts the user with the native OS permission modal if the current status is `undetermined` or requestable.
- ***Best Practice***: Always check status via `getPermissionsAsync()` or custom state first before triggering `requestPermissionsAsync()` to prevent flashing system UI unnecessarily.

```javascript
import * as Location from 'expo-location';

// 1. Non-intrusive status check
const { status: currentStatus, canAskAgain } = await Location.getForegroundPermissionsAsync();

// 2. Interactive request only if allowed
if (currentStatus === 'undetermined') {
  const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
}
```

---

### Question bb4a44c3-6df1-439f-9957-e2c2959a4a19

- What permissions require configuration in app.json / app.config.js?

### Answer

- ***iOS Descriptions***: `ios.infoPlist` entries for human-readable usage explanations (e.g., `NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSMicrophoneUsageDescription`).
- ***Android Permissions***: `android.permissions` array specifying explicit Android permission strings (e.g., `["CAMERA", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS"]`).
- ***Expo Plugin Configs***: Config plugin properties inside `plugins` array for SDK modules (e.g., `["expo-camera", { "cameraPermission": "Allow App to take photos" }]`).

```javascript
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan barcode receipts."
      }
    },
    "android": {
      "permissions": ["CAMERA", "RECORD_AUDIO"]
    }
  }
}
```

---

### Question fce2ac66-77ed-436d-814b-d148eb6d2bd2

- How do you configure iOS permission descriptions (e.g., NSCameraUsageDescription) and what happens if you forget?

### Answer

- ***Configuration***: Set custom usage strings under `expo.ios.infoPlist.<Key>` in `app.json` or pass them directly to Expo SDK plugin configuration objects.
- ***Consequence of Forgetting***: If a native API protected by an `Info.plist` usage description is invoked without the string present in the built `.app` bundle, the iOS runtime throws an uncatchable exception (`SIGABRT`) and immediately crashes the app.
- ***App Store Rejection***: Apple App Store review automatically rejects builds submitted without explicit, meaningful usage description strings or builds containing generic placeholder descriptions.

---

### Question d3ac01bc-8c04-4bc3-8ad9-03d04be259ee

- What permission states exist across iOS and Android (granted, denied, limited, blocked, etc.)?

### Answer

- ***GRANTED***: User explicitly permitted access to the requested hardware or dataset.
- ***DENIED***: User declined access during prompt, but permission can still be requested again (on Android or initially on iOS).
- ***UNDETERMINED / UNGRANTED***: Initial unrequested state; permission has never been asked before.
- ***LIMITED***: User granted restricted access to specific assets (iOS 14+ photo library selective access).
- ***BLOCKED / PERMANENTLY DENIED***: User explicitly denied permission and selected 'Never ask again' (Android) or rejected system prompt (iOS). Cannot be re-prompted natively.

---

### Question 4d369415-fafa-498d-886d-46911631def0

- What does “limited” permission mean on iOS (e.g., photo library)?

### Answer

- ***Limited Photo Access (iOS 14+)***: User grants the app permission to access ONLY specific, user-selected photos/videos rather than the entire device camera roll.
- ***SDK Status***: Expo `MediaLibrary` or `expo-image-picker` returns status `accessPrivileges: 'limited'`. Reading unselected photos will return empty or throw security errors.
- ***Handling Selective Access***: Apps can present `MediaLibrary.presentPermissionsPickerAsync()` on iOS to let users edit their selected photo subset without redirecting them to system settings.

```javascript
import * as MediaLibrary from 'expo-media-library';

const handleLimitedPhotos = async () => {
  const { accessPrivileges } = await MediaLibrary.getPermissionsAsync();
  if (accessPrivileges === 'limited') {
    // Present system UI to let user select additional photos
    await MediaLibrary.presentPermissionsPickerAsync();
  }
};
```

---

### Question adc88f51-b603-444f-9a5b-7336b17abdd2

- What does “never ask again” mean on Android and how do you handle it?

### Answer

- ***Never Ask Again State***: Occurs when a user checks 'Don't ask again' during permission rejection (Android 10-) or denies a permission prompt twice consecutively (Android 11+).
- ***System Behavior***: Any subsequent call to `requestPermissionsAsync()` immediately resolves to `denied` with `canAskAgain: false` without rendering a UI dialog to the user.
- ***Handling Strategy***: Detect `canAskAgain === false` when status is `denied`, display an informative custom alert explaining why the permission is required, and provide a direct CTA button opening native app settings (`Linking.openSettings()`).

---

### Question 6bda94ee-355b-4684-bc71-0b75bb135345

- How do you detect if a permission is permanently denied?

### Answer

- ***Expo Detection Pattern***: Inspect the `canAskAgain` property in the `PermissionResponse` returned by `getPermissionsAsync()` or `requestPermissionsAsync()`.
- ***Condition***: If `status === 'denied'` AND `canAskAgain === false` (or on iOS when `status === 'denied'`), the permission is permanently denied.
- ***Action***: Disable in-app triggers that call `requestPermissionsAsync()` and guide users via custom UI dialog to system settings.

```javascript
const isPermanentlyDenied = (permissionResponse) => {
  const { status, canAskAgain } = permissionResponse;
  return status === 'denied' && canAskAgain === false;
};
```

---

### Question 3826a9da-d58a-4768-9dd9-26b034ef2929

- How do iOS permission prompts differ in behavior and frequency compared to Android?

### Answer

- ***Prompt Frequency (iOS)***: Native prompt can only be presented ONCE in an app's lifecycle for most permissions. Once answered (granted or denied), OS will never render the dialog again unless the app is uninstalled and reinstalled.
- ***Prompt Frequency (Android)***: Native prompt can be shown twice on Android 11+. On Android 10 and lower, it can be shown until the user explicitly toggles 'Don't ask again'.
- ***Behavioral Inversion***: iOS permissions default to blocked after one rejection, requiring immediate deep-linking to system settings, while Android supports a `shouldShowRequestPermissionRationale` phase before permanently blocking.

---

### Question f58936cc-a251-4fa6-8aec-97d7fb4b05a4

- How does Android permission grouping affect user prompts?

### Answer

- ***Legacy Grouping (Android < 9)***: If user granted one permission in a group (e.g., `READ_EXTERNAL_STORAGE`), granting another in the same group (e.g., `WRITE_EXTERNAL_STORAGE`) succeeded silently without showing a prompt.
- ***Modern Grouping (Android 9+)***: System still evaluates permission groups, but explicitly presents dialog UI confirming the group context. However, apps must still request each individual permission explicitly in code before invoking APIs.
- ***Security Hardening***: Developers cannot rely on permission group co-granting; permissions must always be checked and requested individually per resource type.

---

### Question b1315f1a-b02f-430f-b7c2-9d7afac1639e

- How do background location permissions differ between iOS and Android?

### Answer

- ***iOS Flow***: App requests 'While Using App' (`NSLocationWhenInUseUsageDescription`) first. If granted, app can upgrade to 'Always Allow' (`NSLocationAlwaysAndWhenInUseUsageDescription`). iOS can show a temporary prompt or automatic system background location reminder card later.
- ***Android Flow (Android 10+)***: `ACCESS_BACKGROUND_LOCATION` MUST be requested separately AFTER `ACCESS_FINE_LOCATION` or `ACCESS_COARSE_LOCATION` is granted. Requesting foreground and background permissions simultaneously in a single request array is forbidden on Android 11+ and will fail or crash.
- ***Android UI Redirect***: On Android 11+, background location cannot display an inline dialog; it opens system settings page directly where the user must select 'Allow all the time'.

---

### Question 9acd2bc4-51a8-4546-a623-32283e8336af

- How does iOS handle “Allow Once”, “While Using”, and “Always Allow”?

### Answer

- ***Allow Once***: Temporary authorization valid only for the current active app session. Once the app closes or enters background for a prolonged period, permission status reverts to `undetermined`.
- ***While Using App***: Location access granted exclusively while app is active in foreground or running a foreground service with visual indicator (blue status bar banner).
- ***Always Allow***: Continuous location access in foreground, background, and terminated states. iOS displays periodic background location audit popups showing map pins of location points collected, prompting user to confirm or downgrade access.

---

### Question c1904d4d-4383-4612-9b5e-b4ed8ac85c7b

- How do you handle upgrading from foreground to background permissions?

### Answer

- ***Stepwise Escalation***: Never request background permissions initially. First request foreground permission (`ACCESS_FINE_LOCATION` / `NSLocationWhenInUseUsageDescription`).
- ***Contextual Justification***: Once foreground is active and user initiates a background feature (e.g., 'Start Track Navigation'), display an educational custom screen explaining why background tracking is required.
- ***Separate Native Call***: Call `Location.requestBackgroundPermissionsAsync()` explicitly in response to user action.

```javascript
async function upgradeToBackgroundLocation() {
  const foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted) {
    const req = await Location.requestForegroundPermissionsAsync();
    if (!req.granted) return false;
  }
  
  // Upgrade to background separately after foreground is active
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.granted;
}
```

---

### Question 8e5b66fd-9c22-499e-947f-a964533c2349

- What is the best UX pattern for requesting permissions?

### Answer

- ***Contextual Request (Just-In-Time)***: Ask for permission exactly when the user triggers a feature needing it (e.g., clicking camera button to take profile photo), never during initial onboarding.
- ***Value-First Pitch***: Clearly state what feature the permission enables and how user data is protected before opening native system modals.
- ***Two-Step / Soft Ask***: Pre-screen permission intent using custom app modals before invoking native system prompts.

---

### Question dd6ef32b-2f7a-4f19-b464-d41c02102a11

- Why should you avoid requesting permissions on app launch?

### Answer

- ***High Bounce & Rejection Rate***: Users greeted with system permission modals upon launch lack context, leading to immediate rejection and app abandonment.
- ***Single-Shot Burn (iOS)***: Burning the single iOS native prompt on startup before user understands value permanently locks users out of feature until manually enabled in Settings.
- ***Store Policy Guidelines***: Apple Human Interface Guidelines (HIG) and Google Play policy explicitly discourage requesting permissions at startup unless core functionality cannot render without it.

---

### Question 6d75ad11-6457-4ad4-a704-7ca730a93f28

- How do you implement “soft ask” vs “hard ask”?

### Answer

- ***Soft Ask***: An in-app custom modal/sheet designed with branded UI explaining feature benefits with 'Allow' and 'Not Now' buttons. It does NOT trigger native OS permission dialogs.
- ***Hard Ask***: Invoking the official OS API (`requestPermissionsAsync()`) which triggers the un-skippable native system permission dialog.
- ***Workflow***: Soft ask 'Allow' button triggers the hard ask. Soft ask 'Not Now' dismisses modal gracefully, preserving native hard ask prompt for future contextual opportunities.

```javascript
const handleCameraFeaturePress = async () => {
  const status = await Location.getForegroundPermissionsAsync();
  if (status.status === 'undetermined') {
    setShowSoftAskModal(true); // Renders custom UI pre-dialog
  } else if (status.granted) {
    openCamera();
  } else {
    promptOpenSettings();
  }
};
```

---

### Question 400632e9-3a98-4371-8fd7-6daa2bfaf603

- How do you handle permission denial and re-requesting gracefully?

### Answer

- ***First Denial (Soft Handling)***: Gracefully fallback feature UI (e.g., show avatar placeholder or manual address search bar). Provide an inline banner with 'Grant Access'.
- ***Permanent Denial (Settings Guide)***: If `canAskAgain === false` or status is `denied` on iOS, show alert dialog explaining: 'Camera access is turned off. Enable it in Settings to scan receipts.'
- ***Direct Linking***: Provide direct button opening native app settings via `Linking.openSettings()`.

---

### Question 4383e644-eb20-43e9-9a10-a4ee5419e19e

- How do you guide users to enable permissions via system settings?

### Answer

- ***Linking API***: Use `Linking.openSettings()` from React Native core to launch app's settings page in iOS Settings / Android App Info directly.
- ***Step-by-Step UI Guidance***: Provide clear instructions before navigating: '1. Tap Open Settings below. 2. Select Permissions. 3. Toggle Camera ON.'
- ***AppState Synchronization***: Listen to `AppState` changes (`active` state transition) so app automatically re-queries permission status when user returns from Settings.

```javascript
import { AppState, Linking, Alert } from 'react-native';

const promptOpenSettings = () => {
  Alert.alert(
    'Permission Required',
    'Location access is permanently disabled. Please enable it in App Settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
};
```

---

### Question e3d77dc7-841a-496f-99c9-3ef779708f38

- What are common mistakes developers make when requesting permissions?

### Answer

- ***Startup Spamming***: Requesting all permissions simultaneously when app launches.
- ***Missing Info.plist Descriptions***: Omitting strings in `app.json`, causing fatal native app crashes (`SIGABRT`).
- ***Ignoring Never Ask Again State***: Calling `requestPermissionsAsync()` repeatedly without checking `canAskAgain`, creating unresponsive UI.
- ***Assuming Granted Status***: Calling camera/location hardware APIs without checking permission status first, causing native crashes or silent promise rejections.
- ***Simultaneous Location Request***: Requesting foreground and background location in a single call on Android 11+, causing native validation failure.

---

### Question 4f6a21c5-d722-49f7-bcd6-9a7716a6592f

- How do you ensure the app remains functional when critical permissions are denied?

### Answer

- ***Graceful Fallbacks***: Design alternative user flows for denied permissions (e.g., location denied -> manual zip code entry; camera denied -> file picker or image upload; contacts denied -> manual input).
- ***Non-Blocking UI***: Never block entire app layout with full-screen error overlays unless application is single-purpose (e.g., QR scanner app).
- ***Feature Degradation***: Disable or hide specific buttons while keeping surrounding app functionality intact and fully usable.

---

### Question 63a63213-a6ba-42e1-8b77-f093522d6c8f

- How do you manage permission state in app state (Redux, Zustand, etc.)?

### Answer

- ***Global Store Integration***: Store permission status in client state store (e.g., Zustand/Redux) to share state across components without prop drilling.
- ***AppState Re-hydration***: Use `AppState.addEventListener('change', ...)` to re-check permissions when app transitions to `active` foreground state.
- ***Store Updates***: Update global state store upon return from system settings or feature interactions.

```javascript
import { create } from 'zustand';
import * as Camera from 'expo-camera';

export const usePermissionStore = create((set) => ({
  cameraStatus: 'undetermined',
  checkCameraPermission: async () => {
    const res = await Camera.getCameraPermissionsAsync();
    set({ cameraStatus: res.status });
  },
}));
```

---

### Question 3d935345-f4dc-48a8-86eb-d04cd1284a6a

- Should permission state be treated as a source of truth?

### Answer

- ***NO***: Local app state or persistent cache (AsyncStorage) should NEVER be treated as the ultimate source of truth for permissions.
- ***OS Source of Truth***: System settings are the absolute source of truth. Users can alter or revoke permissions in OS Settings at any moment while app is in background.
- ***Best Practice***: Treat stored permission state as temporary UI cache, but always re-query native OS APIs (`getPermissionsAsync()`) before invoking restricted hardware features or upon app foregrounding (`AppState`).

---

### Question 72c4d6a7-8e9a-47f7-b2f9-208f6369771d

- How do you handle race conditions when multiple components request the same permission?

### Answer

- ***Problem***: Multiple components mounted simultaneously triggering parallel `requestPermissionsAsync()` calls, causing conflicting native UI modals or duplicate promise rejections.
- ***Solution - Promise Deduplication Queue***: Wrap permission requests in a centralized permission manager or custom hook with single flight / promise deduplication logic.
- ***In-Flight Reuse***: Return existing in-flight Promise if a request for permission X is already pending execution.

```javascript
let pendingLocationPromise = null;

export const requestLocationDeduplicated = async () => {
  if (pendingLocationPromise) return pendingLocationPromise;
  
  pendingLocationPromise = Location.requestForegroundPermissionsAsync().finally(() => {
    pendingLocationPromise = null;
  });
  
  return pendingLocationPromise;
};
```

---

### Question 874002a6-2fbf-4088-bd34-b7b5d88f1292

- How do you centralize permission handling in a large app?

### Answer

- ***Permission Facade Layer***: Build an abstraction service or manager layer (`PermissionService`) encapsulating all native Expo / React Native permission modules.
- ***Standard Interface***: Enforce standard interfaces for querying, requesting, soft-asking, and deep-linking to settings.
- ***Decoupled Components***: Decouple component UI from native SDK imports to simplify unit testing, mocking, and maintenance across features.

---

### Question e7acf921-95fd-45eb-a5fb-0bc6572cf588

- How would you design a reusable permission service or hook?

### Answer

- ***Custom Hook Design***: Create custom hook `usePermission(permissionType)` returning `{ status, granted, canAskAgain, requestPermission, openSettings }`.
- ***Automatic AppState Sync***: Automatically synchronize status with `AppState` changes to detect updates when user returns from native device settings.

```javascript
import { useState, useEffect, useCallback } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';

export function useLocationPermission() {
  const [status, setStatus] = useState(null);

  const check = useCallback(async () => {
    const res = await Location.getForegroundPermissionsAsync();
    setStatus(res);
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  const request = async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    setStatus(res);
    return res;
  };

  return { status, granted: status?.granted, request, openSettings: Linking.openSettings };
}
```

---

### Question a57c450a-f23b-4ed2-bbad-a751e279b3b7

- How do you test permission flows across development and production?

### Answer

- ***Simulator / Emulator Testing***: Test initial prompt flows (`undetermined` state) by resetting simulator privacy settings or uninstalling app build.
- ***Automated End-to-End (Detox / Maestro)***: Use E2E framework commands to automatically mock system permissions (e.g., `device.launchApp({ permissions: { location: 'always' } })` in Detox).
- ***Production Validation***: Verify production builds (EAS TestFlight / Internal Distribution) to ensure `Info.plist` descriptions and `AndroidManifest.xml` permissions are compiled into final binaries.

---

### Question 29ce81a7-acaa-4eaf-8991-589e5ec5239d

- Why do permissions behave differently on emulator vs real devices?

### Answer

- ***Hardware Mocking***: Emulators mock hardware features (e.g., camera feed, GPS location) which may auto-grant permissions or behave inconsistently compared to physical device hardware daemons.
- ***OS Pre-Grants***: Debug binaries installed via ADB / Metro on emulators sometimes inherit developer settings or pre-granted permissions across re-installs.
- ***Push Notifications***: iOS Simulators (prior to Xcode 14/iOS 16) could not register APNs tokens or test real push notification permissions natively, whereas real devices require APNs credentials.

---

### Question 6e90fd70-86b9-4d60-84fb-798bded6d416

- How do you reset permissions during testing?

### Answer

- ***iOS Simulator Reset***: Device Menu -> `Erase All Content and Settings`, or run CLI command: `xcrun simctl privacy booted reset all <bundle.id>`.
- ***Android Emulator Reset***: Run ADB shell command: `adb shell pm reset-permissions` or `adb shell pm revoke <package.name> android.permission.CAMERA`.
- ***Manual App Reset***: Long-press app icon -> App Info -> Storage -> Clear Data / Clear Storage (Android), or delete and reinstall app (iOS).

---

### Question 83a52333-c42b-4991-98e2-6e788de3b48a

- How do you debug inconsistent permission behavior across devices?

### Answer

- ***Log Output Inspection***: Log detailed `PermissionResponse` outputs: inspect `status`, `granted`, `canAskAgain`, and `expires` properties.
- ***OS Version Fragmentation***: Check target OS version differences (e.g., Android 12 vs 13 media permissions differences).
- ***Manifest Verification***: Verify native Android manifest and iOS `Info.plist` merged outputs inside build directory (`android/app/src/main/AndroidManifest.xml` and build logs).

---

### Question 246bf4e0-1a98-4f09-86e7-be7c9e305eb9

- How do you handle push notification permissions in Expo?

### Answer

- ***Expo Notifications Module***: Use `expo-notifications` library: `Notifications.getPermissionsAsync()` and `Notifications.requestPermissionsAsync()`.
- ***iOS Options Configuration***: Specify notification options when requesting: `ios: { allowAlert: true, allowBadge: true, allowSound: true }`.
- ***Token Acquisition***: Fetch push token (`getExpoPushTokenAsync()`) ONLY after permission `granted` returns true.

```javascript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') return null;
  return (await Notifications.getExpoPushTokenAsync()).data;
}
```

---

### Question 6a76c910-7fb5-485a-94c8-d2ce51285150

- How do notification permissions differ between iOS and Android?

### Answer

- ***iOS Requirement***: Requires explicit runtime user approval since iOS 1.0. System modal dialog opens upon `requestPermissionsAsync()`.
- ***Android < 13***: Notifications were granted automatically at install time (Normal Permission). No runtime prompt displayed.
- ***Android 13+ (API 33+)***: `POST_NOTIFICATIONS` introduced as a mandatory runtime permission. Apps must explicitly prompt user at runtime on Android 13+.

---

### Question ce89d91b-ea7b-4ac7-ae41-79e3db266c9f

- What are provisional notifications on iOS and how do you handle them?

### Answer

- ***Provisional Authorization***: Allows iOS apps to send non-intrusive notifications directly to Notification Center quietly without displaying a popup dialog to user on first launch.
- ***Implementation***: Pass `ios: { allowProvisional: true }` in `requestPermissionsAsync()`.
- ***User Experience***: Notifications appear silently in Notification Center with 'Keep...' or 'Turn off...' buttons, giving users time to evaluate value before explicitly opting in or out.

```javascript
import * as Notifications from 'expo-notifications';

const requestProvisional = async () => {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowProvisional: true,
    },
  });
  // Status will be 'granted' provisionally without prompting explicit popup
};
```

---

### Question c720c786-3a82-47ed-8357-23450c0239bd

- What are common edge cases when working with camera, microphone, or media permissions?

### Answer

- ***Simultaneous Audio/Video Access***: Streaming apps requesting camera and microphone permissions concurrently. If user grants camera but denies microphone, video stream initializes without audio track.
- ***Android 13 Media Permissions Split***: `READ_EXTERNAL_STORAGE` is deprecated on Android 13+. Must check `READ_MEDIA_IMAGES` and `READ_MEDIA_VIDEO` separately.
- ***System Hardware Disablement***: Permission granted in OS settings, but physical hardware is disabled (e.g., privacy hardware kill-switch or camera disabled via MDM enterprise policy).

---

### Question 80dfe925-edb5-49b4-a6fa-8888da16a18c

- What issues can occur when permissions change after initial grant (e.g., revoked in settings)?

### Answer

- ***OS Process Kill***: When user revokes a runtime permission in OS Settings while app is in background, iOS and Android forcefully terminate (kill) app process to clear security contexts.
- ***State Invalidation***: Stored in-memory state or Redux store holding `granted: true` becomes invalid when app re-launches.
- ***Handling***: Always re-verify permission status before calling native APIs upon app re-activation (`AppState === 'active'`).

---

### Question 743cc530-3423-4636-9acc-f6d64a705a6f

- In a food delivery or real estate app, users deny location permission but expect relevant results. How would you design fallback experiences?

### Answer

- ***Default Location Selection***: Fallback to manual address input modal or search bar with auto-complete (e.g., Google Places API).
- ***IP-Based / City Geolocation***: Resolve coarse city/zip level location via server-side IP geolocation for initial list ordering.
- ***Contextual Banner***: Display non-intrusive banner on search results: 'Showing results for New York. Enable precise location for accurate delivery.'

---

### Question 42079622-3f56-4311-93e9-64de12f9286d

- In a ride-hailing or trekking app, users select “Allow Once” or disable precise location. What issues arise and how do you handle them?

### Answer

- ***Allow Once Expiration***: App loses background location access midway through ride or trek when session ends.
- ***Coarse Location Issues***: Android 12+ / iOS 14+ allows toggling 'Precise: Off'. Pickup point or trail navigation becomes inaccurate by several hundred meters.
- ***Handling***: Check `accuracy` property in location response. If `reduced`/`coarse`, present custom UI explaining: 'Precise location required to dispatch driver to your exact curb. Tap to enable Precise Location.'

---

### Question e58768a4-2f11-4b4f-9595-8eba24558464

- In apps requiring background tracking (fitness, delivery, hiking), how do you handle permission upgrades and mid-session revocation?

### Answer

- ***Foreground Service Indicator***: Run native persistent notification (Android Foreground Service) or blue status bar (iOS) while tracking actively to prevent OS process kill.
- ***Mid-Session Revocation Handling***: Wrap background location task callbacks in error handlers. If permission revoked mid-session, halt recording gracefully, persist tracked route data to local DB (SQLite/AsyncStorage), and notify user upon next launch.

---

### Question 1a2002ee-e54a-4aed-a6d7-584cf19942af

- In a social/media app, users grant limited or later revoke photo access. How do you handle missing or broken assets?

### Answer

- ***Limited Access (iOS)***: Detect `accessPrivileges === 'limited'`. Provide inline button 'Add More Photos' invoking `MediaLibrary.presentPermissionsPickerAsync()`.
- ***Revoked Access***: Handle promise rejections when fetching asset URI. Render local placeholder fallback image with retry overlay prompting settings re-engagement.

---

### Question 44fcc205-fc81-439a-8f2b-9d95131f9414

- In apps requiring camera/microphone (streaming, messaging, warehouse scanning), how do you handle denial without blocking core flows?

### Answer

- ***Barcode Scanner Fallback***: Allow manual alphanumeric code input field if camera permission is denied in warehouse scan app.
- ***Messaging App Fallback***: Hide/disable audio record button or present soft-ask prompt when pressed; keep text messaging and file attachment flows completely accessible.

---

### Question 1b9db8d2-930e-4cfc-beab-97ddccd82999

- In Android, users select “Never ask again” for storage/media. How do you recover upload functionality?

### Answer

- ***Detect State***: `status === 'denied'` and `canAskAgain === false`.
- ***Alternative Upload Input***: Provide alternative upload source that does not require storage permission (e.g., system Document Picker / System File Selector via `Storage Access Framework` which bypasses dangerous storage runtime permission dialogs).
- ***Settings Guide***: Show contextual modal with 'Open Settings' button targeting app info page.

---

### Question ab49e4d1-7b9d-4a14-84e3-c64bc7467f4a

- In apps relying on notifications (e-commerce, gig work, subscriptions), how do you handle denied permissions and maintain engagement?

### Answer

- ***In-App Notification Center***: Build internal inbox feed storing announcements, order updates, and promotions in database so users receive updates inside app regardless of OS permission state.
- ***Alternative Channels***: Provide SMS or Email notification opt-ins in user settings for critical transactional alerts (e.g., order dispatched, gig offer assigned).

---

### Question 27ad8b86-cd78-4e5c-8ab6-519b13a48467

- In fintech or privacy-sensitive apps, how do you justify and increase acceptance of sensitive permissions?

### Answer

- ***Educational Primer Screen***: Show transparent pre-permission screen outlining regulatory requirements (e.g., 'KYC Verification requires identity document scan').
- ***Privacy Commitment***: Explicitly state security measures: 'Your photo is encrypted and never sold or shared with third parties.'
- ***Action-Driven Timing***: Only prompt for camera permission at the exact moment user reaches the ID verification step in KYC flow.

---

### Question d48a4264-d672-40a3-82b8-63afec763cb9

- In large apps where multiple modules request the same permission, what architectural issues arise and how do you solve them?

### Answer

- ***Architectural Issues***: Fragmented calls leading to duplicate system prompts, race conditions, inconsistent fallbacks, and maintenance bloat across feature teams.
- ***Solution***: Establish a unified `PermissionFacade` singleton or global React Context provider.
- ***Centralized Management***: Feature modules delegate permission queries to facade, which handles deduplication, caching, soft-asks, logging, and settings redirects centrally.

---

### Question 7fa30732-da63-467b-84f6-8fbba0990de4

- In cross-platform apps, how do you handle inconsistencies (e.g., iOS denied vs Android granted) for the same feature?

### Answer

- ***Abstraction Adapter***: Normalize platform-specific permission states into a unified cross-platform state object (`GRANTED`, `DENIED_RETRYABLE`, `BLOCKED_SETTINGS_REQUIRED`).
- ***Platform Specific Logic***: Isolate iOS vs Android specific branching (e.g., `Platform.OS === 'ios'`) inside permission utility hooks, exposing clean boolean flags (`canTryRequest`, `shouldShowSettingsCTA`) to UI components.

---

### Question 9a50857f-cb62-4fae-81b8-e07a8d687735

- In offline-critical apps (trekking, maps), how do permission limitations (location, storage) affect functionality?

### Answer

- ***Location Degradation***: Without GPS permission, app cannot pinpoint user on offline vector maps. Fallback to manual map pin placement and compass heading if available.
- ***Storage Limitations***: Offline map tiles must be stored in app cache directory (`FileSystem.cacheDirectory` or `documentDirectory`) which does NOT require external storage permission on modern iOS/Android.

---

### Question ca439e27-7684-432f-a02f-5b615ecb8eb0

- In apps with high churn during onboarding, how do you optimize permission request timing?

### Answer

- ***Zero Onboarding Requests***: Defer ALL permission requests past user signup and onboarding screens.
- ***Value Realization First***: Allow user to explore app catalog, browse products, or set up profile before asking for permissions.
- ***Conversion Optimization***: Request permissions only when user attempts high-intent actions (e.g., clicking 'Scan Card', 'Use Current Location', 'Enable Deal Alerts').

---

### Question 1291fc57-a189-4314-80d5-0a4aec898f51

- In apps with OS/version fragmentation (Android 13+, iOS changes), how do you adapt permission flows?

### Answer

- ***API Level Branching***: Use `Platform.Version` or SDK tools to execute version-appropriate permission requests (e.g., Android 13+ requests `POST_NOTIFICATIONS` and `READ_MEDIA_IMAGES`; Android 12- requests `READ_EXTERNAL_STORAGE`).
- ***Expo Plugin Abstraction***: Leverage modern Expo SDK packages that auto-adapt manifest specifications and API bridges based on target SDK levels.

```javascript
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

async function getMediaPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    // Android 13+ uses granular media permissions handled internally by expo-image-picker / media-library
    return await MediaLibrary.requestPermissionsAsync();
  }
  return await MediaLibrary.requestPermissionsAsync();
}
```

---

### Question ea901674-7f11-4809-a4e5-6f2006e3789e

- In edge cases where permissions are granted but features still fail (e.g., mic works but no audio), what would you investigate?

### Answer

- ***Hardware Disablement / Mute***: Hardware privacy switch, system-level microphone mute, or active phone call occupying audio input route.
- ***Audio Session Category (iOS)***: `AVAudioSession` category not configured for recording (`AVAudioSessionCategoryPlayAndRecord`).
- ***Android Audio Focus***: Another foreground app holding exclusive audio recording focus (`AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE`).
- ***App Manifest Inconsistency***: Permission granted in OS runtime, but hardware feature manifest flag missing (`<uses-feature android:name="android.hardware.microphone" />`).

---

### Question 7c8a8375-0068-40c9-a987-b973ca0dd260

- In worst-case scenarios (e.g., emergency SOS without location permission), how do you design fail-safe behavior?

### Answer

- ***Emergency Exemption / Cell Triangulation***: Native SOS features trigger OS emergency location services bypass where OS automatically provides location to emergency services (E911).
- ***App Level Fail-Safe***: Instantly show direct dial button (`Linking.openURL('tel:911')`).
- ***Cell/Wi-Fi Coarse Data***: Transmit last known cached coordinates or IP-based approximate location payload along with manual location text input prompt ('Type your current landmark or address').

---

