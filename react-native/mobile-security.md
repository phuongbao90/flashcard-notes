# Mobile security

### Question e1a89c20-7b3f-4e92-a1b4-5c6d7e8f9a0b

- Why must mobile applications always be treated as an ***untrusted environment*** (Zero-Trust Architecture), and how are security responsibilities divided between client and server?

### Answer

- ***Untrusted Environment Reality***: Mobile application binaries and JavaScript bundles execute on end-user hardware beyond server control. Attackers can decompile source code, hook runtime methods (using ***Frida***), inspect memory, or intercept network traffic.
- ***Client-Side Security Scope***: Focuses on defense-in-depth: protecting local data at rest, enforcing HTTPS/TLS, implementing secure authentication storage, scrubbing PII from crash logs, and validating deep link routing.
- ***Server-Side Security Scope***: Retains ultimate authority for authentication, authorization, business logic execution, input sanitization, data validation, rate limiting, and session state enforcement.
- ***Principle of Least Privilege***: Mobile clients and their issued tokens must only be granted the minimal scope, permissions, and duration necessary to perform authorized operations.

---

### Question f2b90d31-8c4a-5f03-b2c5-6d7e8f9a0b1c

- Why is ***AsyncStorage*** unsafe for sensitive data (tokens, credentials, PII), and how do native secure storage primitives (***Keychain*** / ***Keystore***) protect secrets at rest?

### Answer

- ***AsyncStorage Vulnerabilities***: On iOS, `AsyncStorage` writes unencrypted key-value pairs to unencrypted `.plist` or SQLite files in the sandbox. On Android, it writes unencrypted SQLite databases. Anyone with physical access, unencrypted backup tools, or root access can read stored secrets in plain text.
- ***iOS Keychain Architecture***: Encrypts data using hardware-backed keys inside the ***Secure Enclave*** (AES-256). Stored items are protected by OS access control flags (`kSecAccessControlBiometryAny` or `kSecAttrAccessibleAfterFirstUnlock`).
- ***Android Keystore System***: Stores cryptographic keys in a hardware-isolated environment (***TEE - Trusted Execution Environment*** or ***StrongBox OS***). Key material never enters application memory; encryption and decryption occur within the secure hardware chip.
- ***React Native / Expo Secure Implementations***: Use libraries like `expo-secure-store`, `react-native-keychain`, or `react-native-mmkv` with Keystore/Keychain-backed AES-256 encryption keys.

```typescript
import * as SecureStore from 'expo-secure-store';

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('user_access_token', token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}
```

---

### Question a3c01e42-9d5b-6a14-c3d6-7e8f9a0b1c2d

- What types of sensitive data should ***never be stored*** on a mobile device, and how do you implement ***encryption at rest*** for local databases?

### Answer

- ***Forbidden Local Secrets***: Master API secret keys, private backend signing keys, raw user passwords/PINs, un-hashed payment credentials (CVVs, credit card numbers), and un-redacted medical or identity PII.
- ***Token Storage Limits***: Store only short-lived access tokens and hardware-encrypted refresh tokens; purge them immediately upon session expiration or logout.
- ***Database Encryption at Rest***:
  - For local databases (SQLite, Realm, WatermelonDB), enable ***SQLCipher*** or Realm Encryption using 256-bit AES keys.
  - Generates the encryption key dynamically on first launch, storing the key inside iOS Keychain / Android Keystore. Never hardcode database encryption keys in JavaScript or native code.

---

### Question b4d12f53-0e6c-7b25-d4e7-8f9a0b1c2d3e

- What are the security risks of storing ***JWT access tokens*** on mobile devices, and how should access and refresh tokens be managed securely?

### Answer

- ***JWT Exposure Risks***: Standard JWTs are Base64-encoded strings holding claims (user IDs, roles, permissions). Long-lived JWTs stored locally expose scope and identity to attackers if extracted via local storage leaks or memory dumps.
- ***Short-Lived Access Tokens***: Issue access tokens with brief lifetimes (e.g. 5–15 minutes) kept in volatile memory or secure storage to minimize token theft blast radius.
- ***Refresh Token Rotation (RTR)***: Store refresh tokens in hardware secure storage. Every token refresh exchange yields a new access token AND a new single-use refresh token while invalidating the old refresh token.
- ***Automatic Token Revocation***: If a previously used/invalid refresh token is presented to the backend, invalidate the entire refresh token family immediately to counter token theft.

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({ baseURL: 'https://api.example.com' });

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const oldRefreshToken = await SecureStore.getItemAsync('refresh_token');
      const { data } = await axios.post('https://api.example.com/auth/refresh', {
        refreshToken: oldRefreshToken,
      });
      await SecureStore.setItemAsync('refresh_token', data.newRefreshToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

---

### Question c5e23a64-1f7d-8c36-e5f8-9a0b1c2d3e4f

- What are the security limits of ***Biometric Authentication*** (Face ID / Touch ID) in mobile apps, and how do you prevent local biometric bypass attacks?

### Answer

- ***Local JS Biometric Hooking Vulnerability***: Standard biometric SDKs (`expo-local-authentication`, `react-native-biometrics`) return a simple `boolean` (`success: true`) to JavaScript. Attackers using runtime instrumentation (Frida, Xposed) can hook the method to force a `true` return without touching hardware biometrics.
- ***Hardware Key-Bound Biometrics Defense***: Generate a cryptographic key pair inside iOS Keychain / Android Keystore configured with biometric hardware access rules (`kSecAccessControlBiometryAny` / `setUserAuthenticationRequired(true)`).
- ***Cryptographic Verification***: The private key can only sign challenge payloads after the device hardware validates biometrics. The backend or local module verifies the signature, rendering JavaScript-level hooking useless.
- ***Fallback Safety***: Never fallback to a client-side PIN stored in JavaScript state. Fallback authentication must require full server-side password re-verification.

---

### Question d6f34b75-2a8e-9d47-f6a9-0b1c2d3e4f5a

- What is ***Certificate Pinning***, why is standard HTTPS insufficient against ***Man-In-The-Middle (MITM)*** attacks on mobile devices, and how is it implemented?

### Answer

- ***Standard HTTPS Limitations***: Mobile operating systems trust hundreds of public Certificate Authorities (CAs). If an attacker installs a rogue root CA certificate on a user's device or proxy (e.g. Charles, Burp, rogue Wi-Fi), they can silently decrypt and manipulate HTTPS traffic.
- ***Certificate Pinning Mechanics***: Hardcodes the backend server's public key hash (***SPKI Subject Public Key Info Fingerprint***) or certificate inside the app binary. During the TLS handshake, the app verifies the server's public key against the pinned hash, terminating connections that fail to match.
- ***Implementation Methods***: Use native network security configs (Android `network_security_config.xml`), iOS `NSAppTransportSecurity` + TrustKit, or libraries like `react-native-ssl-pinning`.
- ***Rotation Safeguards***: Always embed backup pin hashes (for future certificate renewals) to prevent bricking app communications during certificate rotation.

---

### Question e7a45c86-3b9f-0e58-a7b0-1c2d3e4f5a6b

- What data should ***never be transmitted from client to server***, and how do you protect API communications against replay attacks and parameter tampering?

### Answer

- ***Forbidden Client Transmissions***: Never transmit client-computed authorization state (e.g. `{ isAdmin: true }`), calculated order total prices, discount applicability flags, or raw un-salted passwords.
- ***Anti-Replay Protections***: Attach timestamp headers, single-use cryptographic nonces, and request signatures computed over request parameters:
  - ***HMAC Request Signatures***: Generate `HMAC-SHA256(requestBody + timestamp + nonce, secretKey)` on client and verify signature server-side within a tight time window (e.g. < 30 seconds).
- ***Transport Layer Enforcement***: Mandate TLS 1.3, disable weak cipher suites, and enforce HTTP Strict Transport Security (HSTS) on API endpoints.

---

### Question f8b56d97-4ca0-1f69-b8c1-2d3e4f5a6b7c

- How easily can React Native / Expo applications be ***reverse engineered***, what sensitive information is leaked in bundles, and how do you protect API keys?

### Answer

- ***Reverse Engineering Vulnerability***: React Native bundles (`index.android.bundle`, `main.jsbundle`) or Hermes bytecode (`index.android.hbc`) are easily decompiled using tools like `hbctool` or `react-native-decompiler`, exposing full JavaScript source code and string literals.
- ***Leaked Bundle Information***: Hardcoded API keys, environment variables (`.env` imported via `react-native-config` or `EXPO_PUBLIC_`), private endpoint URLs, and secret client keys.
- ***Protecting API Keys***:
  - ***Public Keys (Firebase, Google Maps)***: Restrict keys server-side by Bundle ID / Package Name, HTTP Referer, and SHA-1 certificate fingerprints.
  - ***Private Third-Party Keys (Stripe Secret Key, AWS credentials)***: Must **NEVER** exist in client code. Route requests through your backend API proxy.

---

### Question a9c67ea8-5db1-2a70-c9d2-3e4f5a6b7c8d

- Does ***Code Obfuscation*** (R8 / ProGuard / Hermes Bytecode) prevent reverse engineering, and what are its technical limitations?

### Answer

- ***Hermes Bytecode Compilation***: Compiles JavaScript into Hermes bytecode (`.hbc`). Removes readable JavaScript source text, but structural AST and string constants can still be inspected via bytecode disassemblers.
- ***Native Obfuscation (R8/ProGuard)***: Renames Java/Kotlin classes, methods, and fields, strips unused code, and optimizes bytecode on Android, securing native bridge modules.
- ***JavaScript Obfuscators***: Encodes strings into hex arrays, mangles identifiers, and adds control flow flattening. Increases reverse engineering friction but does not make analysis impossible.
- ***Practical Limitation***: Obfuscation is security through obscurity. It deters casual inspection but cannot resist determined static/dynamic analysis. Backend validation must remain the core boundary.

---

### Question b0d78fb9-6ec2-3b81-dae3-4f5a6b7c8d9e

- How do you detect if an app is running on a ***rooted or jailbroken device***, and how should risk be managed without blocking legitimate users?

### Answer

- ***Root / Jailbreak Detection Checks***: Libraries check for binary paths (`/system/bin/su`, `/Applications/Cydia.app`), write access to restricted directories, or present hook frameworks (Frida, Substrate).
- ***Hardware-Backed Remote Attestation***: Local checks can be bypassed via Frida or MagiskHide. Validate integrity using remote hardware attestation APIs:
  - ***Android Play Integrity API***: Server verifies verdict tokens (`MEETS_STRONG_INTEGRITY` vs `MEETS_DEVICE_INTEGRITY`).
  - ***iOS App Attest***: Server verifies cryptographically signed attestation tokens via Apple servers.
- ***Adaptive Risk Strategy***: Avoid outright app blocks (which alienate legitimate power users). Restrict high-risk actions (biometric auto-login, high-value transfers) while permitting read-only operations.

---

### Question c1e89ac0-7fd3-4c92-ebf4-5a6b7c8d9e0f

- How do ***over-requested permissions*** increase mobile security risks, and how do you ensure compliance with privacy regulations (GDPR, ATT)?

### Answer

- ***Over-Permission Attack Vectors***: Requesting unnecessary dangerous permissions (Location, Contacts, Camera) expands the app's attack surface. A compromised third-party SDK inside your app could silently harvest and exfiltrate user data.
- ***Runtime Just-In-Time Permissions***: Request permissions contextually when the user activates a feature, explaining the business necessity prior to triggering system prompts.
- ***iOS App Tracking Transparency (ATT)***: Must request user consent before tracking cross-app activities or reading the `IDFA`. If consent is denied, fallback to non-tracking identifiers.
- ***Privacy Compliance (GDPR/CCPA)***: Implement explicit opt-in consent banners for analytics, provide data export/deletion workflows, and strip PII from crash monitoring systems (Sentry/Bugsnag).

---

### Question d2f90bd1-80e4-5da3-fc05-6a7b8c9d0e1f

- What business logic must ***never be executed on the client***, and why is server-side input validation mandatory even if client-side validation passes?

### Answer

- ***Forbidden Client-Side Logic***: Payment processing and pricing calculations, role-based access authorization, discount/coupon eligibility checks, transaction velocity limits, and fraud scoring.
- ***Bypassing Client Validation***: Client-side validation (Formik, Zod schemas) provides instant UX feedback. However, attackers bypass client code entirely using direct HTTP requests (curl, Postman) or MITM proxy manipulation.
- ***Mandatory Server Validation***: Backends must independently sanitize and validate payload schemas, types, string lengths, ranges, and authorized roles for every incoming request.
- ***API Abuse Protection***: Implement API gateway rate limiting (Redis token bucket), Web Application Firewalls (WAF), and Bot Management tools (reCAPTCHA Enterprise, Cloudflare Turnstile).

---

### Question e3a01ce2-91f5-6eb4-0d16-7b8c9d0e1f2a

- How do deep linking vulnerabilities (***Custom Schemes*** vs ***Universal Links***) lead to authorization exploits, and what are the top ***OWASP Mobile*** security risks?

### Answer

- ***Deep Link Vulnerability Mechanisms***:
  - ***Scheme Hijacking***: Custom URI schemes (`myapp://`) can be registered by malicious apps on the device to intercept OAuth callback tokens.
  - ***Parameter Tampering***: Unvalidated parameters (`myapp://transfer?to=attacker&amount=1000`) cause unauthorized state mutations if executed blindly.
  - ***Open Redirects***: Dynamic redirect parameters (`myapp://login?redirectTo=https://phishing.com`) lead users to external phishing sites.
- ***Deep Link Defensive Architecture***: Use iOS Universal Links and Android App Links with verified domain associations (`apple-app-site-association` & `.well-known/assetlinks.json`). Validate deep link routes via strict Zod schemas and require explicit biometric re-authentication for state-mutating actions.
- ***OWASP Mobile Top 10 Focus***: Covers M1: Insecure Credentials Usage, M2: Insecure Data Storage, M3: Insecure Communication, M4: Insecure Authentication, M5: Insecure Authorization, M7: Impaired Code Integrity, and M8: Insecure Configuration.

---

### Question f4b12df3-02a6-7fc5-1e27-8c9d0e1f2a3b

- What tools and techniques are used for ***Mobile Security Penetration Testing***, and how do you monitor and respond to security incidents?

### Answer

- ***Static Application Security Testing (SAST)***: Scan codebase and binary bundles for hardcoded secrets, insecure APIs, and vulnerable dependencies using ***MobSF (Mobile Security Framework)***, Semgrep, and `npm audit` / Snyk.
- ***Dynamic Application Security Testing (DAST)***: Intercept API communications using proxies (Burp Suite, OWASP ZAP, Charles) and perform runtime method hooking using ***Frida*** and ***Objection***.
- ***Incident Response Protocols***:
  - ***Real-Time Monitoring***: Monitor abnormal traffic spikes, attestation failures, and refresh token reuse alerts via Datadog / Sentry / SIEM.
  - ***Remote Feature Flags & Forced Updates***: Maintain server-side min-version flags to block compromised app builds instantly from API access.
  - ***Server-Side Token Revocation***: Globally revoke compromised session token families upon detecting intrusion signals.

---

### Question a5c23ea4-13b7-80d6-2f38-9d0e1f2a3b4c

- In a ***Fintech App*** handling transactions, how do you architect end-to-end client and server security to prevent fraud and data leaks?

### Answer

- ***Client Data Hardening***: Store access/refresh tokens in hardware-backed Keychain/Keystore. Encrypt cached transaction records using SQLCipher. Prevent screen capture and OS app switcher thumbnail caching using native flags (`FLAG_SECURE` on Android, overlay screen on iOS).
- ***Transport Layer Security***: Enforce TLS 1.3 with Certificate Pinning for all API endpoints. Use short-lived OAuth 2.0 PKCE access tokens (5-minute TTL) with Refresh Token Rotation.
- ***Transaction Authorization & Attestation***: Mandate hardware biometric re-authentication for outgoing transfers. Verify ***Play Integrity API*** (Android) and ***App Attest*** (iOS) verdict tokens server-side before executing financial operations.
- ***Server-Side Fraud Controls***: Enforce idempotency headers, rate limits, step-up 2FA for anomalous transactions, and server-side balance calculations.

---

### Question b6d34fb5-24c8-91e7-3049-0e1f2a3b4c5d

- In an ***E-Commerce App*** suffering from automated bot attacks (scraping, cart hoarding, credential stuffing), how do you protect your backend APIs?

### Answer

- ***App Attestation Verification***: Integrate Apple App Attest (iOS) and Google Play Integrity API (Android). Backend verifies cryptographic attestation assertions to ensure incoming requests originate exclusively from genuine app binaries on untampered hardware.
- ***Dynamic Request Signatures***: Generate dynamic HMAC request signatures on the client using short-lived session keys combined with timestamps and request nonces. Reject requests missing valid signatures or replay nonces.
- ***CAPTCHA Step-Up Verification***: Trigger Google reCAPTCHA Enterprise or Cloudflare Turnstile mobile SDK verification when anomalous request frequencies or suspicious IP ranges are detected.
- ***Gateway Rate Limiting***: Implement token bucket rate limiting per IP and user account at the API Gateway level.

---

### Question c7e45ac6-35d9-02f8-415a-1f2a3b4c5d6e

- In a ***Social App*** experiencing account takeovers, what security flaws would you audit, and how do you prevent ***JWT token theft and replay attacks***?

### Answer

- ***Audit Priorities***:
  - Audit local storage to verify tokens are not stored in unencrypted `AsyncStorage` or logged in debug output.
  - Verify OAuth flow utilizes ***PKCE*** to prevent authorization code interception via custom schemes.
  - Audit backend token refresh handlers for strict Refresh Token Rotation enforcement.
- ***Preventing Token Theft & Replay Attacks***:
  - ***Refresh Token Rotation (RTR)***: Each refresh token is single-use. Replay of an expired/used refresh token signals token theft, triggering immediate global revocation of that user's session family.
  - ***Server Token Versioning (`tokenVersion`)***: Maintain a `tokenVersion` integer on the user database record embedded into JWT claims. Incrementing `tokenVersion` instantly revokes all active JWTs across devices upon password reset or security breach.

---

### Question d8f56bd7-46ea-13a9-526b-2a3b4c5d6e7f

- A developer accidentally committed and bundled a private third-party API key in the React Native JavaScript bundle. What risks does this create, and what is the remediation process?

### Answer

- ***Security Risks***: Attackers decompile the JS bundle, extract the secret key, and exhaust third-party API quotas, access private databases, or generate unauthorized financial charges.
- ***Step-by-Step Remediation Process***:
  1. ***Revoke & Rotate Key***: Immediately invalidate the compromised API key in the third-party developer dashboard and generate a new key.
  2. ***Refactor to Backend Proxy***: Remove private keys from mobile code entirely. Route API requests through your secure backend proxy where the secret is stored in server environment variables.
  3. ***Scrub Version Control History***: Remove the exposed secret from git commit history using `git-filter-repo` or BFG Repo-Cleaner before pushing updates.
  4. ***Deploy OTA / Mandatory Update***: Push an Over-The-Air update (Expo Updates / CodePush) or force a mandatory store update to remove the compromised bundle from user devices.

---

### Question e9a67ce8-57fb-24ba-637c-3b4c5d6e7f8a

- A React Native developer stored authentication tokens in `AsyncStorage`. How do you migrate live users to ***Secure Storage*** without forcing them to re-login?

### Answer

- ***Security Exposure Risk***: Tokens in `AsyncStorage` exist as unencrypted plain text accessible via local backup extraction, device rooting, or file system inspection.
- ***Zero-Downtime Migration Pattern***:
  1. On app launch, attempt to read tokens from native secure storage (`expo-secure-store` / `react-native-keychain`).
  2. If absent in secure storage, fallback to reading legacy tokens from `AsyncStorage`.
  3. If legacy tokens exist in `AsyncStorage`, write them into native secure storage immediately.
  4. Once written to secure storage, purge the legacy token keys from `AsyncStorage`.
  5. If tokens exist in neither storage, redirect the user to the login screen.

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export async function getValidAuthToken(): Promise<string | null> {
  let token = await SecureStore.getItemAsync('user_token');
  if (!token) {
    const legacyToken = await AsyncStorage.getItem('user_token');
    if (legacyToken) {
      await SecureStore.setItemAsync('user_token', legacyToken);
      await AsyncStorage.removeItem('user_token');
      token = legacyToken;
    }
  }
  return token;
}
```

---

### Question fa078df9-68ac-35cb-748d-4c5d6e7f8a9b

- In a scenario where an attacker operates a rogue Wi-Fi network and installs custom root CA certificates on victim devices, how do you prevent data exposure?

### Answer

- ***Interception Threat Model***: Rogue CAs combined with rogue Wi-Fi access points enable transparent SSL/TLS proxying (MITM), exposing HTTP authorization headers and request/response payloads in plain text.
- ***Defense Layer 1: Certificate Pinning***: Hardcode the backend server's SPKI public key hash in the mobile app. The app rejects TLS connections if the certificate chain terminates at an untrusted custom root CA certificate.
- ***Defense Layer 2: Application-Layer Encryption (E2EE)***: Encrypt sensitive payload fields at the application layer using asymmetric keys (RSA-OAEP / ECIES) or AES-256-GCM before sending over HTTP. Even if TLS is decrypted, intercepted payload data remains unreadable ciphertext.
- ***Defense Layer 3: Ephemeral Key Exchanges***: Utilize Diffie-Hellman ephemeral key exchanges for session setup so historical intercepted traffic cannot be retroactively decrypted.

---

### Question ab189ea0-79bd-46dc-859e-5d6e7f8a9b0c

- Users attempt to bypass payment flows in a mobile marketplace app by manipulating API requests or deep links. How do you design server-side enforcement to prevent bypasses?

### Answer

- ***Bypass Exploit Vectors***: Modifying price parameters in request payloads (`{ price: 0.01 }`), triggering payment completion deep links (`myapp://checkout/success?orderId=99`), or intercepting client state.
- ***Server-Side Enforcement Rules***:
  - ***Server Price Computation***: Mobile clients send only product IDs and quantities (`{ productId: "item_42", qty: 1 }`). Backends calculate prices, taxes, and discounts strictly from backend database records.
  - ***Gateway Webhook Verification***: Order status changes (`PAID`) must only be triggered via cryptographically signed webhooks sent directly from payment processors (Stripe, PayPal) to your backend. Never rely on client callbacks or deep link navigation to verify payment success.
  - ***Strict State Machine Transitions***: Enforce strict backend state transitions (`PENDING` -> `PROCESSING` -> `COMPLETED`). Direct jumps to `COMPLETED` triggered by client requests must be rejected.

---

### Question bc290fb1-8ace-57ed-96af-6e7f8a9b0c1d

- How can attackers exploit dynamic parameters in deep links, and what architecture secures mobile deep link routing?

### Answer

- ***Exploit Vectors***:
  - ***State Manipulation / CSRF***: Triggering un-authenticated links like `myapp://account/delete`.
  - ***Open Redirect Phishing***: Injecting `redirectTo=https://phishing.com` into authentication deep links.
  - ***Privilege Escalation***: Manipulating parameters (`myapp://profile?userId=admin`) to view unauthorized data.
- ***Defensive Architecture***:
  - ***Universal Links / App Links***: Bind deep links exclusively to verified domain associations (`apple-app-site-association` & `.well-known/assetlinks.json`).
  - ***Route Schema Validation***: Validate incoming URLs against strict Zod schemas. Enforce relative internal pathing and reject absolute external redirect URLs.
  - ***Authentication & Interaction Guards***: Verify active user session tokens before opening protected routes. Require explicit user confirmation (or biometrics) before performing state-mutating actions triggered via deep links.

---

### Question cd3a1ac2-9bdf-68fe-07b0-7f8a9b0c1d2e

- How do you implement a security policy for rooted/jailbroken devices that mitigates security risks without blocking power users?

### Answer

- ***The Detection Dilemma***: Outright blocking of rooted/jailbroken devices alienates power users and triggers negative reviews. Local detection checks can also be bypassed via Frida or Magisk.
- ***Adaptive Security Policy***:
  - ***Feature Tiering***: Permit rooted devices to use low-risk, read-only capabilities (browsing products, reading articles), while blocking high-risk operations (adding payment methods, initiating transfers).
  - ***Disable Biometrics & Force Short Sessions***: On compromised devices, force shorter session timeouts and require explicit password entry rather than hardware biometrics (which may be hooked).
  - ***Enhanced Server Safeguards***: Apply stricter rate limiting, mandate step-up 2FA for transactions, and run continuous remote attestation checks (Play Integrity API).
  - ***User Risk Notification***: Display a clear warning modal informing users that executing on a rooted OS degrades local hardware security guarantees.

---

### Question de4b2bd3-0cef-790f-18c1-8a9b0c1d2e3f

- In a ***Health App*** subject to GDPR and HIPAA, how do you design data handling, storage, and telemetry across client and backend?

### Answer

- ***Client Storage & View Hardening***: Encrypt all local database records (SQLCipher / Realm Encryption) using AES-256 keys stored in Keychain/Keystore. Set strict HTTP cache control headers (`Cache-Control: no-store, private`). Obscure views in the OS app switcher and block screen capture.
- ***Telemetry & Logging Privacy***: Strip all PII, health metrics, and authorization tokens from crash monitoring systems (Sentry/Bugsnag) using client-side `beforeSend` data sanitizers. Disable third-party analytics from tracking health payload events.
- ***Backend Access Control & Auditing***: Enforce Role-Based (RBAC) and Attribute-Based Access Control (ABAC) on microservices. Maintain immutable audit logs for every access request to medical records (capturing timestamp, user ID, patient ID, and access justification).

---

### Question ef5c3ce4-1df0-8a10-29d2-9b0c1d2e3f4a

- In an app used on shared family devices or tablets, how do you prevent user session leaks and protect session data upon logout?

### Answer

- ***Shared Device Vulnerability***: Logging out without purging native secure storage, in-memory caches, or HTTP response caches allows subsequent users on the same device to access sensitive session data.
- ***Complete Session Purge Pipeline***:
  - ***Secure Storage Scrubbing***: Delete access tokens, refresh tokens, and cached user profile data from native Keychain/Keystore upon logout.
  - ***Global Memory Reset***: Reset global React state (Redux, Zustand, React Query cache) using a top-level root reset action or cache clearing method.
  - ***Cache & Media Purge***: Clear HTTP request cache, disk image caches (`FastImage.clearDiskCache()`), and WebView cookies.
- ***Inactivity Guard***: Automatically lock app UI behind a biometric/passcode screen after N minutes of backgrounding or user inactivity.

---

### Question fa6d4df5-2ea1-9b21-3ae3-0c1d2e3f4a5b

- Assuming an attacker decompiles your React Native app bundle and inspects all JavaScript source code, how do you ensure core business security remains un-compromised?

### Answer

- ***Zero-Trust Client Design***: Architect the mobile app under the assumption that all client source code, JavaScript assets, and native modules are public and readable by attackers.
- ***Zero Hardcoded Secrets***: Ensure no private API keys, backend database credentials, signing keys, or master tokens exist within the JavaScript bundle or native code.
- ***Backend Business Logic Encapsulation***: All proprietary algorithms, authorization checks, discount calculations, and state mutations must reside exclusively behind authenticated backend APIs.
- ***Dynamic App Attestation***: Validate app authenticity via Apple App Attest / Google Play Integrity API on backend requests before granting access to sensitive business microservices.

---

### Question 0b7e5ea6-3fb2-0c32-4bf4-1d2e3f4a5b6c

- How can malicious actors abuse ***Push Notifications*** (FCM/APNs), and how do you design secure payload structures to prevent data leaks?

### Answer

- ***Push Notification Risks***: Push payloads pass through third-party servers (Apple/Google), display on lock screens without authentication, and can be intercepted or spoofed if push server keys leak.
- ***Data Minimization (Silent Push Design)***: Never transmit sensitive PII, account balances, or authentication tokens in push notification payloads.
- ***Fetch-On-Receipt Architecture***: Send only generic event notifications containing an encrypted reference ID (e.g. `{ type: "NEW_MESSAGE", messageId: "8821" }`). Upon receiving the payload or user tap, the app securely fetches message details from backend APIs over HTTPS.
- ***Payload Verification***: Validate embedded deep links against strict route domain whitelists before opening destinations.

---

### Question 1c8f6fb7-40c3-1d43-5ca5-2e3f4a5b6c7d

- If a device's biometric authentication (Face ID / Touch ID) is compromised, bypassed via Frida, or altered by the user, how do you maintain system security?

### Answer

- ***Hardware Cryptographic Binding (Fail-Safe Defense)***: Store session keys in native Keychain/Keystore bound to hardware biometric policies (`BiometryAny` / `setUserAuthenticationRequired`). If biometrics are bypassed via JS hooking, the Secure Enclave / TEE refuses to release the decryption key, causing cryptographic operations to fail.
- ***Biometric Enrollment Change Detection***: Track biometric domain state (`evaluatedPolicyDomainState` on iOS). If the user adds or modifies fingerprints/faces in OS settings, invalidate stored keys automatically and require password re-authentication.
- ***Server Password Fallback***: Never accept client-side passcodes for fallback. Require full server-side password re-authentication to regenerate session keys when biometrics are unavailable or altered.

---

### Question 2d907ac8-51d4-2e54-6db6-3f4a5b6c7d8e

- In the event of a compromised mobile app release or token leak, how do you execute rapid incident response and recover secure operations?

### Answer

- ***Phase 1: Immediate Server-Side Containment***:
  - ***Global Token Revocation***: Revoke all active refresh tokens and session keys globally or for affected cohorts on backend servers.
  - ***API Gateway Blockade***: Block requests originating from compromised app version strings or user-agents at the API Gateway level.
  - ***Force Password Resets***: Require password resets for affected accounts before issuing new session tokens.
- ***Phase 2: Patching & Secret Rotation***:
  - ***Deploy Emergency Hotfix***: Push fixes via Expo Updates / CodePush or expedite native app store releases.
  - ***Rotate Backend Keys***: Rotate any exposed third-party API keys or signing secrets immediately.
- ***Phase 3: Force Minimum Version Update***: Enforce a mandatory `min_required_version` check on app launch API responses, displaying an un-dismissable "Update Required" screen blocking access to old builds.
