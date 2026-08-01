# Deeplink

### Question c7e210b4-9a8f-431d-b6a5-3d9284e1b7f0

- How can malicious apps exploit Custom URI Schemes to execute ***Scheme Hijacking*** and ***Parameter Tampering***, and what defensive architecture patterns must React Native apps enforce?

### Answer

- ***Custom URI Scheme Hijacking***: Custom schemes (`myapp://`) are registered globally in OS manifests without ownership verification.
  - ***Exploit Mechanism***: A malicious app registers `myapp://` on the target device. When the user opens `myapp://auth/callback?token=SECRET`, the OS may route the intent to the malicious app, leaking access tokens or authorization credentials.
- ***Parameter Tampering & State Corruption***: Attackers can craft custom deep links (e.g. `myapp://account/transfer?amount=10000&to=attacker`) and trigger them via web browsers or hidden iFrames.
- ***Defensive Architecture Patterns***:
  - ***Migrate to Universal/App Links***: Eliminate custom schemes for sensitive operations; use HTTPS domain verification (`apple-app-site-association` & `assetlinks.json`).
  - ***Strict Runtime Schema Validation***: Validate all deep link paths and query parameters against a strict runtime schema validator (e.g. Zod) before updating app state.
  - ***Interactive Confirmation Guards***: Require explicit user interaction (modals, biometric re-authentication) before executing financial, destructive, or state-mutating actions triggered by deep links.

---

### Question 6b819f2e-4c7a-401d-89e3-1f5a2b3c4d5e

- What is an ***Open Redirect Vulnerability*** in deep link handlers, how can attackers abuse dynamic redirect parameters, and how do you secure web-to-app handshakes?

### Answer

- ***Vulnerability Mechanism***: Occurs when deep link handlers blindly trust redirect query parameters (e.g., `myapp://login?redirectTo=https://attacker.com`).
  - ***Exploit Scenario***: The app authenticates the user and automatically redirects or opens an internal WebView/external browser pointing to `attacker.com`, enabling phishing or credential theft under trusted app branding.
- ***Securing Web-to-App Handshakes***:
  - ***Domain Whitelisting***: Validate redirect URLs against a strict server-side or hardcoded domain whitelist using URL parsing (checking exact protocol, host, and port).
  - ***Enforce Relative Paths***: Restrict deep link redirect destinations strictly to internal app route names (e.g. `redirectTo=/dashboard`) rather than arbitrary external URLs.
  - ***Origin-Bound State Tokens***: Protect web-to-app authentication transitions using single-use, short-lived encrypted state tokens bound to verified web origins.

---

### Question 3a4f5b6c-7d8e-4f9a-8b1c-2d3e4f5a6b7c

- How does ***OAuth 2.0 PKCE (Proof Key for Code Exchange)*** protect mobile deep link authentication callbacks against authorization code interception?

### Answer

- ***Flaw of Standard Auth Code Grant on Mobile***: Returning authorization codes via custom URI schemes (`myapp://oauth?code=XYZ`) allows malicious apps listening on the same scheme to intercept the authorization code.
- ***PKCE Mechanics***:
  1. ***Code Verifier & Challenge***: Mobile app generates a high-entropy random string (***Code Verifier***) and hashes it to produce a ***Code Challenge***.
  2. ***Authorization Request***: App opens auth server URL passing `code_challenge` and `code_challenge_method=S256`.
  3. ***Callback & Exchange***: Auth server responds via deep link containing ONLY an authorization code. Mobile app sends the code PLUS the raw `code_verifier` over a secure HTTPS POST request to token endpoint.
- ***Interception Prevention***: Even if an attacker intercepts the authorization code from the deep link, they cannot exchange it for tokens without the raw `code_verifier` held exclusively in the original app's memory.

---

### Question 8f9e0a1b-2c3d-4e5f-9a0b-1c2d3e4f5a6b

- How should React Native applications architect deep link routing for ***Auth-Protected Screens*** when session tokens are hydrating asynchronously from secure native storage?

### Answer

- ***Session Hydration Guard Pattern***: Block deep link navigation handling until session authentication state resolves from secure storage (e.g. Keychain/Keystore via MMKV/EncryptedStorage).
- ***Pending Link Queueing Architecture***:
  - When a deep link targets a protected screen (e.g. `myapp://settings/billing`), intercept the URL and store it in a ***Pending Deep Link Queue*** inside global state.
  - Render a splash screen or loading view while validating session tokens asynchronously.
- ***Post-Hydration Resolution Paths***:
  - ***Valid Session***: Flush the pending link queue and navigate directly to the target protected route.
  - ***Expired / Missing Session***: Route user to the Login screen, attaching the target route metadata as a post-login intent parameter.
  - ***Token Refresh Failure***: If background token refresh fails during deep link handling, clear stored tokens cleanly before redirecting to auth without dropping original destination intent.

---

### Question 2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a

- How do attackers exploit deep link ***Referral Programs*** (e.g. `myapp://invite?code=REF123`), and how do you design a secure server-side referral verification pipeline?

### Answer

- ***Client-Side Vulnerabilities & Referral Exploits***:
  - ***Parameter Tampering***: Users modify client-side referral codes or replay referral deep links multiple times.
  - ***Self-Referral & Farm Fraud***: Fraudsters create multiple device instances / emulators to claim referrer rewards repeatedly.
- ***Secure Referral Verification Pipeline***:
  - ***Never Trust Client Link State***: Deep link parameters (`code=REF123`) must only act as an untrusted intent suggestion; rewards must never be granted purely based on link receipt.
  - ***Hardware Attestation & App Integrity***: Verify first-launch requests via ***Google Play Integrity API*** (Android) or ***App Attest*** (iOS) to ensure request originates from a genuine, un-tampered app binary on physical hardware.
  - ***Server-Side Event Binding***: Bind referral rewards strictly to server-side business milestones (e.g. completed first paid order or verified KYC) linked to unique device IDs and payment fingerprints, preventing un-authenticated or fake account reward farming.

---

### Question 9b0c1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e

- What are the privacy limitations of ***Deferred Referral Deep Links***, and how do server-side attribution engines reconcile rewards without deterministic tracking?

### Answer

- ***Privacy Barriers to Deterministic Referral Tracking***:
  - ***iOS App Tracking Transparency (ATT)***: Restricts access to IDFA. Un-installed users clicking web referral links cannot be matched deterministically via device ID across store installs.
  - ***Network Fingerprinting Degradation***: IP address + User-Agent fingerprinting fails on cellular networks (carrier NAT), VPNs, or Apple iCloud Private Relay.
- ***Server-Side Deferred Attribution Reconciliation***:
  - ***Ephemeral Web Click Tokens***: Web landing page generates a short-lived, encrypted single-use click token stored on server alongside referrer ID.
  - ***Android Play Install Referrer API***: Native Play Store mechanism passes referral parameters deterministically from store to app launch on Android.
  - ***Probabilistic Matching Window***: For iOS without consent, use short time-window (e.g. < 15 minute) server-side matching of IP/User-Agent, combined with mandatory in-app referral code entry fallback if confidence score is low.

---

### Question 7d4e5f6a-1b2c-3d4e-8f9a-0b1c2d3e4f5a

- What are the technical differences between ***iOS Universal Links*** and ***Android App Links*** in domain verification, OS dispatch rules, and failure fallbacks?

### Answer

- ***Domain Verification Configuration***:
  - ***iOS Universal Links***: Uses `apple-app-site-association` (AASA) JSON file hosted on domain root or `.well-known/`. Verified via Apple CDN (`app-site-association.cdn-apple.com`) starting iOS 14. Requires `applinks:` in Xcode Entitlements.
  - ***Android App Links***: Uses `.well-known/assetlinks.json` declaring target package name and SHA-256 certificate fingerprint. Configured via `android:autoVerify="true"` on `<intent-filter>` in `AndroidManifest.xml`.
- ***OS Dispatch Rules & User Preferences***:
  - ***iOS***: Tapping a Universal Link inside Safari or Mail opens app seamlessly. If user taps the top-right domain link (`example.com >`), iOS remembers preference and forces web opening until reset.
  - ***Android***: Android 12+ (API 31) strictly enforces verified App Links to open the app automatically. Unverified links fall back immediately to default browser (no disambiguation dialog).
- ***Failure Fallback Behavior***:
  - ***iOS***: If AASA verification fails or app is uninstalled, OS opens URL directly in Safari without throwing errors.
  - ***Android***: If verification fails, Android treats link as a standard web intent, opening the default browser unless app specifically registers unverified custom schemes.

---

### Question 5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d

- From a React Native developer perspective, what are the key practical differences between iOS and Android when handling and testing deep links?

### Answer

- ***Cold Start vs. Warm Start Initialization Nuances***:
  - ***iOS***: Universal Links deliver initial URLs smoothly during app launch. However, if JS execution is delayed, `Linking.getInitialURL()` may resolve to `null` if the app takes too long to initialize event listeners.
  - ***Android Launch Mode Gotcha***: Android requires `android:launchMode="singleTask"` in `AndroidManifest.xml`. Without this setting, clicking a deep link creates a new duplicate instance of the React Native root activity instead of bringing the existing app instance to the foreground.
- ***Browser & User State Opt-out Behaviors***:
  - ***iOS Safari Breadcrumb Preference***: If a user taps the domain breadcrumb (`example.com >`) in the top status bar after opening a Universal Link, iOS persists a manual preference routing all future clicks for that domain to Safari instead of the app.
  - ***Android 12+ Verification Enforcement***: Android 12 (API 31) strictly requires domain auto-verification (`android:autoVerify="true"`). Unverified domain links fall back directly to the web browser without showing the app chooser dialog.
- ***CLI Testing Differences***:
  - ***iOS Simulator***: Tested via `xcrun simctl openurl booted "myapp://path"`. Note that iOS Simulator requires iOS 14+ for local Universal Link testing without Apple CDN scraping.
  - ***Android Emulator***: Tested via `adb shell am start -W -a android.intent.action.VIEW -d "myapp://path" com.myapp`. Verification status can be checked via `adb shell pm get-app-links <package_name>`.

---

### Question 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d

- What are the essential ***Production Best Practices*** for architecting deep linking in large-scale React Native applications?

### Answer

- ***Centralized Schema Abstraction & Type Safety***:
  - Define a single declarative routing schema for React Navigation mapping deep link path tokens to strongly-typed TypeScript screen props.
  - Validate all dynamic path parameters and query strings at runtime (e.g. using Zod schemas) before passing parameters to screen components.
- ***Analytics Attribution & Telemetry***:
  - Capture referral parameters (UTM parameters, campaign IDs, click tokens) on initial deep link resolution and forward to analytics engines without blocking navigation rendering threads.
- ***Graceful Fallbacks & Wildcard Route Handlers***:
  - Implement catch-all wildcard routes (`path: '*'`) to handle invalid or deprecated deep links safely, redirecting users to a user-friendly error screen or dashboard.
  - Fall back to an in-app browser (`react-native-inappbrowser-reborn` or `WebBrowser`) for deep links pointing to web-only features unsupported in the current mobile client.
- ***Automated CLI Testing in CI/CD Pipelines***:
  - Automate link testing in build pipelines using `xcrun simctl openurl booted <URL>` (iOS) and `adb shell am start -W -a android.intent.action.VIEW -d <URL> <package_name>` (Android).

---

### Question 4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a

- What is the integration pattern for deep linking between web applications and React Native using ***React Navigation*** (`NavigationContainer`), and how are path hierarchies, query parameters, and custom state resolvers mapped?

### Answer

- ***Config Object Structure***: The `linking` prop accepts `prefixes` (web origins + custom schemes) and a declarative `config.screens` map matching web paths to screen components.
- ***Nested Route Mapping***: Web nested paths (e.g. `/shop/categories/laptops`) map to nested navigator configs where outer keys match navigator screen names and inner `screens` map sub-routes.
- ***Query Parameter & Path Parameter Parsing***: Path segments with colons (e.g. `/user/:id`) parse into route `params.id`. Query strings (`/search?q=shoes`) automatically populate `params.q`.
- ***Custom Path Resolvers***: `getStateFromPath(path, options)` overrides default parsing to transform web URL structures into complex navigation state trees (e.g. mapping dynamic web subdomains or query filters to tab indexes).

```javascript
const linking = {
  prefixes: ['https://example.com', 'myapp://'],
  config: {
    screens: {
      HomeTab: 'home',
      ShopStack: {
        screens: {
          ProductDetails: 'product/:id', // maps /product/123 to params.id
        },
      },
    },
  },
};

<NavigationContainer linking={linking}>
  {/* App Stack */}
</NavigationContainer>
```

---

### Question 8f9a0b1c-2d3e-4f5a-6b7c-8d9e0f1a2b3c

- What is the integration pattern for deep linking between web applications and React Native using ***Expo Router*** (file-based routing), and how does it simplify web/mobile route parity compared to traditional React Navigation?

### Answer

- ***File-System Directory Parity***: Routes are declared automatically by file directory structure inside the `app/` folder (e.g., `app/user/[id].tsx` maps automatically to `/user/:id` on both web and native).
- ***Zero-Config Deep Link Generation***: `expo-router` handles scheme/domain prefix resolution (`scheme` in `app.json`) automatically without requiring explicit manual `linking` configuration objects.
- ***Typed Links & Dynamic Segments***:
  - Dynamic route parameters use brackets `[id].tsx` or catch-all `[...unhandled].tsx`.
  - Native `<Link href="/user/123">` components work seamlessly across web DOM anchors (`<a>`) and mobile native touchables.
- ***Web-First Native Parity & Universal SSR/SSG***: Shared file routes compile to web pages (Next.js/Vite style) and native mobile deep link handlers from a single code file, eliminating manual web-to-mobile URL path translation layers.

```typescript
// app/user/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>User ID: {id}</Text>;
}
```

