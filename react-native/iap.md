# IAP

### Question 1a8c9e42-7b3f-4d01-a2c5-8e9f01234567

- What is In-App Purchase (IAP) and how is it typically implemented in a React Native / Expo app?

### Answer

- ***In-App Purchase (IAP)*** allows mobile applications to sell digital products, subscriptions, and premium features directly through Apple's ***StoreKit*** (iOS) and Google's ***Google Play Billing Library*** (Android).
- Mobile operating systems strictly mandate that digital goods sold within apps use first-party store payment engines rather than third-party credit card processors (like Stripe).
- ***React Native / Expo Architecture***: Native bridges expose underlying C++/Objective-C/Java billing APIs to JavaScript via asynchronous native modules.
- ***Implementation Options***:
  - ***expo-in-app-purchases*** (Legacy Expo SDK module wrapping low-level store APIs).
  - ***react-native-iap*** (Community-driven open-source bridge providing direct access to StoreKit 2 and Play Billing Library v5/v6).
  - ***RevenueCat (react-native-purchases)*** (SDK platform providing cross-platform receipt validation, entitlement management, webhooks, and paywall UI).

```javascript
import * as InAppPurchases from 'expo-in-app-purchases';

// Initialize native billing client connection
await InAppPurchases.connectAsync();
```

---

### Question 2b9d0f53-8c4a-5e12-b3d6-9f0a12345678

- What is the difference between consumable, non-consumable, and subscription products?

### Answer

- ***Consumable Products***: Purchased once, consumed in-app, and can be purchased repeatedly (e.g. virtual currency, game lives, AI generation credits).
  - ***Behavior***: Store fronts do NOT maintain permanent ownership records; once consumed, they cannot be restored automatically via StoreKit/Google Play across app re-installs.
- ***Non-Consumable Products***: Purchased once and owned permanently without expiration (e.g. unlocking "Pro Mode", removing advertisements, lifetime feature access).
  - ***Behavior***: Stores maintain lifetime entitlement records. Apps MUST provide a ***Restore Purchases*** mechanism to sync access across user devices and re-installs.
- ***Subscription Products***: Recurring billing items offering access to content or services over defined billing cycles (e.g. monthly or annual premium access).
  - ***Auto-Renewable Subscriptions***: Automatically charge users at cycle end until explicitly canceled in store settings. Supports free trials, introductory pricing, and upgrades.
  - ***Non-Renewing Subscriptions***: Grant access for a fixed duration (e.g. 1-month pass) without auto-renewal; users must manual repurchase upon expiration.

---

### Question 3c0e1f64-9d5b-6f23-c4e7-a01b23456789

- How does Expo IAP (expo-in-app-purchases) work at a high level?

### Answer

- ***Bridge Connection***: `InAppPurchases.connectAsync()` connects the React Native JS thread to native StoreKit / Play Billing service daemons.
- ***Asynchronous Listener Pattern***: `setPurchaseListener()` registers a global callback to receive transaction updates (purchased, deferred, restored, failed) pushed asynchronously from store queues.
- ***Catalog Querying***: `getProductsAsync([skuIds])` queries store servers to fetch localized titles, prices, currency symbols, and store metadata.
- ***Transaction Lifecycle***:
  1. `purchaseItemAsync(productId)` launches native store payment sheets.
  2. Transaction update emits to `setPurchaseListener`.
  3. Server verifies purchase receipt payload.
  4. `finishTransactionAsync(purchase, consumed)` acknowledges/finishes the native transaction.
  5. `disconnectAsync()` releases native event listeners when tear down occurs.

```javascript
InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
  if (responseCode === InAppPurchases.IAPResponseCode.OK) {
    results.forEach(async (purchase) => {
      if (!purchase.acknowledged) {
        await verifyAndDeliverEntitlement(purchase);
        await InAppPurchases.finishTransactionAsync(purchase, true);
      }
    });
  }
});
```

---

### Question 4d1f2a75-0e6c-7a34-d5f8-b12c34567890

- What are the key steps in setting up IAP for an Expo app from configuration to purchase flow?

### Answer

- ***1. Store Console Setup***: Complete Paid Applications Agreements, tax details, and banking credentials in App Store Connect and Google Play Console. Define unique product identifiers (SKUs).
- ***2. Native Project Configuration***:
  - iOS: Add `inAppPurchase` entitlement to `app.json` under `ios.entitlements`.
  - Android: Add `com.android.vending.BILLING` permission via Expo config plugin.
- ***3. Development Client Setup***: Build an Expo Custom Dev Client (`npx expo run:ios` / `npx expo run:android`) as standard Expo Go does NOT support native billing binaries.
- ***4. Client Initialization & Listener Registration***: Mount `connectAsync()` and `setPurchaseListener()` in root application provider.
- ***5. Catalog Retrieval & Purchase Trigger***: Call `getProductsAsync()` to hydrate paywall UI and `purchaseItemAsync()` to launch OS checkout.
- ***6. Receipt Validation & Transaction Completion***: Validate transaction token server-side, grant entitlement in database, and call `finishTransactionAsync()`.

---

### Question 5e2a3b86-1f7d-8b45-e6a9-c23d45678901

- How do you fetch available products in an Expo app and why might the result be empty?

### Answer

- ***Fetching Products***: Call `getProductsAsync(['com.app.pro_monthly', 'com.app.pro_yearly'])` after native connection is established via `connectAsync()`.
- ***Empty Array Causes***:
  - ***Missing Native Connection***: Invoking `getProductsAsync` before `connectAsync()` completes successfully.
  - ***Unsigned Merchant Contracts***: App Store Connect / Play Console banking or tax agreements are pending, expired, or unaccepted.
  - ***Product SKU Mismatches***: Requesting SKUs containing typos or querying iOS product IDs on Android.
  - ***Un-submitted Product Metadata***: Products in App Store Connect are stuck in "Missing Metadata" state (e.g. missing review screenshots or descriptions).
  - ***Draft App Track on Android***: Google Play Console requires the app build (with billing permissions) to be published to at least an Internal Testing track.

```javascript
await InAppPurchases.connectAsync();
const { responseCode, results } = await InAppPurchases.getProductsAsync([
  'com.myapp.premium_monthly'
]);

if (responseCode === InAppPurchases.IAPResponseCode.OK) {
  console.log('Fetched products:', results);
}
```

---

### Question 6f3b4c97-2a8e-9c56-f7ba-d34e56789012

- What are common reasons getProductsAsync returns an empty array?

### Answer

- ***Store Account Inactivity***: Account holder has not accepted updated Apple Developer Program License Agreements or Google Play Terms.
- ***Incorrect Simulator / Device Configuration***:
  - Testing on iOS Simulator without a valid `.storekit` configuration file or StoreKit test scheme.
  - Testing on physical device without logging into a valid Sandbox Apple ID or Google Play License Test Account.
- ***App Identifier Mismatch***: Bundle Identifier (iOS) or Package Name (Android) in `app.json` does not match the app record in App Store Connect / Play Console.
- ***Regional Availability Restrictions***: The test device's store country region is excluded from the product's distributed territories list in store consoles.

---

### Question 7a4c5d08-3b9f-0d67-a8cb-e45f67890123

- How do you handle the purchase lifecycle (request → response → finish transaction) in Expo?

### Answer

- ***Step 1: Initiation***: User triggers action -> App calls `purchaseItemAsync('product_id')`.
- ***Step 2: OS Interaction***: Native payment modal prompts user authentication (FaceID / TouchID / Password).
- ***Step 3: Event Emission***: OS billing framework pushes transaction payload to `setPurchaseListener()` with state `PURCHASED`, `DEFERRED`, or `FAILED`.
- ***Step 4: Server Receipt Verification***: Send transaction receipt / purchase token to backend server to verify cryptographic signature against Apple/Google servers.
- ***Step 5: Entitlement Delivery***: Backend updates user database record, confirming entitlement activation to client.
- ***Step 6: Transaction Settlement***: Client calls `finishTransactionAsync(purchase, isConsumable)` to remove transaction from native store queue.

---

### Question 8b5d6e19-4ca0-1e78-b9dc-f56a78901234

- Why is it important to call finishTransactionAsync after a successful purchase?

### Answer

- ***Platform Acknowledgment Contract***: `finishTransactionAsync` informs Apple StoreKit (`finishTransaction`) and Google Play Billing (`acknowledgePurchase` / `consumePurchase`) that the app successfully delivered the purchased item to the user.
- ***Preventing Auto-Refunds (Android)***: Google Play automatically cancels transactions and refunds money to the user within 3 days if `acknowledgePurchase` is not executed.
- ***Clearing Native Transaction Queue (iOS)***: StoreKit retains un-finished transactions in an internal queue. Un-finished items cause StoreKit to repeatedly trigger the purchase listener on every app launch, causing duplicate alerts and broken checkout states.

---

### Question 9c6e7f20-5db1-2f89-caed-a67b89012345

- What happens if you don’t finish a transaction?

### Answer

- ***Android Behavior***: Google Play treats the order as unacknowledged. After a 3-day grace period, Google automatically revokes the order, issues a full financial refund to the customer, and marks the purchase token as canceled.
- ***iOS Behavior***: StoreKit holds the transaction in the queue indefinitely. Every time the app boots or reinstantiates `setPurchaseListener`, StoreKit fires callback events for all un-finished transactions, leading to UI popups, infinite spinner loops, and potential double-crediting if server verification is non-idempotent.
- ***Store Gating Locks***: Future purchase attempts for non-consumable items or active subscriptions may fail with store errors like "You already own this item".

---

### Question 0d7f8a31-6ec2-3090-dbfe-b78c90123456

- How do you handle pending or interrupted purchases?

### Answer

- ***Pending / Deferred States***: Occurs when purchases require external approval (e.g. iOS ***Ask to Buy*** for child accounts) or delayed offline cash payments (e.g. Google Play Balance / Boleto).
- ***Handling Architecture***:
  - Register `setPurchaseListener` immediately upon app root mounting.
  - Inspect transaction state for `IAPResponseCode.DEFERRED` or `purchaseState === 2` (Pending).
  - Inform the user with a UI banner: "Purchase pending approval/payment completion".
  - Do NOT grant entitlements or call `finishTransactionAsync` while state is pending.
  - When payment resolves hours/days later, OS automatically triggers `setPurchaseListener` on next app launch; backend verifies and finishes transaction.

---

### Question 1e8a9b42-7fd3-4101-ecaf-c89d01234567

- What is receipt validation and why is it important?

### Answer

- ***Concept***: Cryptographic verification of store-generated purchase tokens or JWS (JSON Web Signatures) with Apple App Store and Google Play Developer servers.
- ***Security Necessity***:
  - ***Prevents Client Tampering***: Jailbroken/rooted devices can use tools (e.g. LocalIAPSore, Freedom) to hook native bridges and inject fake `IAPResponseCode.OK` callbacks into JavaScript context.
  - ***Replay Attack Prevention***: Prevents malicious users from reusing valid transaction receipts across multiple app accounts.
  - ***Single Source of Truth***: Guarantees user entitlements are recorded securely in backend database independent of client app memory or device reinstalls.

---

### Question 2f9b0c53-80e4-5212-fed0-d90e12345678

- Should receipt validation be done on the client or server? Why?

### Answer

- ***Receipt validation MUST always be performed on the SERVER***.
- ***Risks of Client-Side Validation***:
  - ***Credential Exposure***: Requires embedding Apple Shared Secrets or Google Service Account private keys inside the React Native JavaScript bundle, allowing trivial extraction via decompilation.
  - ***MITM & Man-in-the-Middle Manipulation***: Attackers can proxy device traffic and spoof response status codes directly into client code.
- ***Advantages of Server-Side Validation***:
  - Keeps store secret keys and service account credentials completely secure.
  - Verifies receipts over secure HTTPS directly to Apple/Google servers.
  - Enables centralized subscription status tracking, webhook handling, and fraud detection.

---

### Question 3a0c1d64-91f5-6323-0fe1-ea1f23456789

- How would you design a backend for validating IAP receipts?

### Answer

- ***Endpoint Architecture***: `POST /api/v1/iap/verify` accepting `{ userId, platform, purchaseToken, productId, transactionReceipt }`.
- ***Validation Pipeline***:
  1. ***Auth Check***: Verify user JWT session header.
  2. ***Idempotency Gate***: Query database table `transactions` by `transactionId` (iOS) or `purchaseToken` (Android). If already processed, return `200 OK` immediately.
  3. ***Store Server Verification***:
     - iOS: Verify receipt with Apple ***App Store Server API*** (or legacy `/verifyReceipt`).
     - Android: Call Google Play Developer API `purchases.products.get` or `purchases.subscriptionsv2.get`.
  4. ***Payload Assertion***: Validate `bundle_id`, `product_id`, purchase state (`PURCHASED`), and billing timestamp.
  5. ***Database Update***: Upsert user entitlement record in DB (`user_entitlements` table) inside a database transaction.
  6. ***Client Response***: Return `{ success: true, entitlement: 'pro' }` allowing client to execute `finishTransactionAsync()`.

```javascript
// Server-side pseudocode (Node.js)
app.post('/api/v1/iap/verify', async (req, res) => {
  const { userId, platform, purchaseToken, productId } = req.body;
  
  const isDuplicate = await db.transactions.findUnique({ where: { purchaseToken } });
  if (isDuplicate) return res.json({ success: true, message: 'Already processed' });

  const isValid = await platform === 'ios' 
    ? verifyAppleReceipt(purchaseToken) 
    : verifyGoogleToken(productId, purchaseToken);

  if (!isValid) return res.status(400).json({ error: 'Invalid store receipt' });

  await db.$transaction([
    db.entitlements.upsert({ where: { userId }, update: { status: 'ACTIVE' } }),
    db.transactions.create({ data: { purchaseToken, userId, productId } })
  ]);

  res.json({ success: true });
});
```

---

### Question 4b1d2e75-0206-7434-1af2-fb2c34567890

- What is the difference between sandbox and production environments in IAP?

### Answer

- ***Sandbox Environment***: Dedicated testing environment provided by Apple and Google.
  - Real credit cards are NOT charged.
  - Uses test user credentials (Sandbox Apple IDs / Google License Testers).
  - ***Compressed Subscription Billing Cycles***: Accelerates testing (e.g. 1-month iOS subscription renews in 5 minutes and expires after 6 renewals; Android monthly subscription renews 6 times every 5 minutes).
- ***Production Environment***: Live consumer store environment.
  - Real credit cards / digital wallets charged.
  - Receipts signed by production StoreKit / Google Play certificates.
  - Standard real-world subscription billing periods (monthly, yearly).

---

### Question 5c2e3f86-1317-8545-2ba3-0c3d45678901

- How do you test IAP in Expo using sandbox accounts?

### Answer

- ***iOS Sandbox Setup***:
  1. Create Sandbox Tester accounts in App Store Connect under *Users and Access > Sandbox Testers*.
  2. Build Expo Custom Dev Client binary (`npx expo run:ios`).
  3. On test iOS device, sign into Sandbox Account under *Settings > App Store > Sandbox Account* (do NOT sign out of main Apple ID in device settings).
  4. Launch dev client, initiate purchase, enter sandbox credentials when prompted.
- ***Android Sandbox Setup***:
  1. Add developer Gmail address to *Setup > License Testing* in Google Play Console.
  2. Upload development build to an *Internal Testing Track*.
  3. Join testing program via opt-in web link on test device.
  4. Initiate purchase; Google Play dialog displays "Test Card, always approves".

---

### Question 6d3f4a97-2428-9656-3cb4-1d4e56789012

- Why might a purchase succeed in sandbox but fail in production?

### Answer

- ***Hardcoded Sandbox Receipt Endpoint***: Backend server points exclusively to Apple Sandbox URL (`https://sandbox.itunes.apple.com/verifyReceipt`) instead of production (`https://buy.itunes.apple.com/verifyReceipt`).
  - ***Handling Apple 21007 Error***: Correct server implementation sends receipt to production first; if Apple returns status code `21007` (receipt is from sandbox), fallback to sandbox URL.
- ***Unapproved SKUs in Production***: Product IDs are active in sandbox testing but pending review/approval in App Store Connect or Play Console.
- ***Missing Banking / Tax Agreements***: Merchant contracts active for developer testing but missing required signatures for live currency processing.
- ***Google Play Release Track Mismatch***: APK/AAB uploaded to production missing `com.android.vending.BILLING` permission manifest configuration.

---

### Question 7e4a5b08-3539-0767-4dc5-2e5f67890123

- How do you handle subscription renewals and expiration in your app?

### Answer

- ***Server-to-Server Webhooks (RTDN / Server Notifications)***:
  - Configure ***App Store Server Notifications V2*** and ***Google Play Real-Time Developer Notifications (RTDN via GCP Pub/Sub)***.
  - Webhooks fire automatically when subscriptions renew (`DID_RENEW`), expire (`EXPIRED`), fail payment (`DID_FAIL_TO_RENEW`), or enter grace periods (`IN_GRACE_PERIOD`).
- ***Database Sync***: Server webhook listener parses payload, updates `subscription_expires_at` timestamp in user entitlements table.
- ***App Launch Hydration***: Client fetches fresh entitlement status from server `/api/user/me` endpoint on startup. Client never polls Apple/Google servers directly to check renewals.

---

### Question 8f5b6c19-464a-1878-5ed6-3f6a78901234

- How do you restore previous purchases in Expo?

### Answer

- ***Restoration API***: Trigger `getPurchaseHistoryAsync()` (or `restorePurchases()` in `react-native-iap` / RevenueCat).
- ***Execution Flow***:
  1. User taps "Restore Purchases" button on paywall.
  2. Native store prompts OS authentication if required.
  3. StoreKit / Play Billing returns array of active/past transaction receipts associated with current Apple ID / Google Account.
  4. Client sends receipts to backend verification endpoint.
  5. Server validates receipt and updates user account entitlements.
- ***App Store Guidelines Compliance***: Apple App Store Guideline 3.1.1 strictly requires all apps offering non-consumable or subscription purchases to include a visible "Restore Purchases" button on paywalls.

```javascript
const restorePurchases = async () => {
  const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
  if (responseCode === InAppPurchases.IAPResponseCode.OK) {
    await sendReceiptsToServerForRestoration(results);
  }
};
```

---

### Question 9a6c7d20-575b-2989-6fe7-407b89012345

- What is the difference between restoring purchases and querying purchase history?

### Answer

- ***Restoring Purchases***:
  - OS-level action that syncs Apple ID / Google Account purchases to the local device.
  - Prompts native credentials dialogs if necessary.
  - Triggers native transaction queue re-emissions for active subscriptions and non-consumables to restore lost access on new devices.
- ***Querying Purchase History (getPurchaseHistoryAsync)***:
  - Reads locally cached store purchase history array without triggering native store authentication prompts.
  - Returns past transactions (including consumed items and expired subscriptions) for logging or UI record display.

---

### Question 0b7d8e31-686c-3a90-70f8-518c90123456

- How do you manage user entitlement (e.g., premium access) after purchase?

### Answer

- ***Backend as Source of Truth***: Store user entitlements in backend database table indexed by `userId`.
- ***Global State Hydration***: On application launch, fetch user profile and active entitlement flags from backend API into state store (Zustand, Redux, or React Query).
- ***UI Feature Gating***: Use React context or custom hooks (`useEntitlement('pro_access')`) to conditionally render premium UI, unlock navigation routes, and enable paid API endpoints.

```javascript
// Custom Hook Pattern
export const useProAccess = () => {
  const { user } = useUserStore();
  const isPro = user?.entitlements?.includes('pro') && new Date(user.subscriptionExpiresAt) > new Date();
  return { isPro };
};
```

---

### Question 1c8e9f42-797d-4b01-81a9-629d01234567

- How do you prevent users from faking purchases or unlocking features without paying?

### Answer

- ***Server-Enforced Entitlement Guard***: Server API endpoints check backend database permissions before serving premium data or performing privileged actions; client UI visibility alone is never trusted.
- ***Cryptographic Receipt Signature Checking***: Send purchase tokens directly to official Apple/Google validation endpoints to verify valid signature.
- ***Token Replay Protection***: Store every processed `transactionId` / `purchaseToken` in database with unique constraints. Reject tokens already bound to another user account.
- ***Binary Attestation***: Implement ***Google Play Integrity API*** (Android) and ***App Attest*** (iOS) to ensure API requests originate from untampered, genuine app binaries running on uncompromised hardware.

---

### Question 2d9f0a53-8a8e-5c12-92ba-730e12345678

- What are common edge cases in IAP flows that developers often miss?

### Answer

- ***Family Sharing***: iOS auto-renewable subscriptions shared across family groups emit purchase updates via webhooks (`REVOKED` / `OFFER_REDEEMED`) requiring server-side access updates.
- ***Billing Grace Period & Account Hold***: Credit card decline triggers a grace period (e.g. 16 days) where user retains app access while Google/Apple retries payment collection.
- ***Subscription Price Increases***: If a price increase requires user consent on iOS and the user fails to accept, subscription automatically cancels upon renewal.
- ***Cross-Platform Account Conflict***: Single Apple ID used to restore purchases on two different app user accounts; server must decide whether to transfer or share entitlement.
- ***Deferred "Ask to Buy" Approvals***: Child initiates purchase; parent approves 2 days later while child app is closed.

---

### Question 3e0a1b64-9b9f-6d23-a3cb-841f23456789

- How do you handle network failures during a purchase?

### Answer

- ***Native Transaction Persistence***: StoreKit and Play Billing store completed purchases in native device queues even if network drops before hitting your server.
- ***App Resume Recovery***: On app launch or network reconnection, global `setPurchaseListener` automatically receives pending un-finished transactions.
- ***Exponential Backoff Retry***: If client POST to `/api/v1/iap/verify` fails due to network outage:
  - Retain purchase object in local persistent storage (MMKV / AsyncStorage).
  - Do NOT call `finishTransactionAsync`.
  - Retry sending receipt to server on network state change (`NetInfo`).
  - Call `finishTransactionAsync` ONLY after receiving HTTP 200 from server.

---

### Question 4f1b2c75-0cac-7e34-b4dc-952c34567890

- How do you deal with duplicate purchase events or repeated callbacks?

### Answer

- ***Idempotent Backend Verification Endpoint***:
  - Database maintains a unique index on `transactionId` (iOS) and `purchaseToken` (Android).
  - When backend receives receipt verification request:
    - If token exists in DB: Return `{ success: true, status: 'ALREADY_PROCESSED' }`.
    - If token is new: Validate with store, insert token record, grant entitlement, return `{ success: true }`.
- ***Safe Client Handling***: Upon receiving `ALREADY_PROCESSED` from backend, client safely invokes `finishTransactionAsync(purchase)` to clear duplicate event from native store queue without re-granting rewards.

---

### Question 5a2c3d86-1dbd-8f45-c5ed-a63d45678901

- How would you design the UI/UX for a smooth purchase experience?

### Answer

- ***Paywall Transparency***: Explicitly present product title, pricing, currency, subscription duration, free trial length, and renewal terms to comply with store review policies.
- ***Non-Blocking Loading States***: Display loading spinner on buy button, disable touch events on paywall options to prevent duplicate purchase triggers.
- ***Error Communication***: Map raw store errors to user-friendly text:
  - `IAPResponseCode.USER_CANCELED`: Silent reset of loading UI without alert dialog.
  - Payment failure / declined: Show "Payment declined by store. Please check store billing settings."
- ***Instant Feedback & Transitions***: Dismiss paywall modal and show success animation immediately upon backend confirmation. Include prominent "Restore Purchases", "Terms of Service", and "Privacy Policy" links.

---

### Question 6b3d4e97-2ece-9056-d6fe-b74e56789012

- How do you manage state (e.g., React Query, Zustand, Redux) for IAP status?

### Answer

- ***Centralized Entitlement Slice***: Maintain user entitlement state separately from store catalog metadata.
- ***React Query Pattern***:
  - Query: `useQuery({ queryKey: ['user-entitlements'], queryFn: fetchEntitlements })`.
  - Mutation: `useMutation({ mutationFn: verifyReceiptOnServer })`.
- ***Cache Invalidation Flow***:
  1. Purchase listener triggers receipt verification mutation.
  2. Mutation succeeds -> execute `queryClient.invalidateQueries(['user-entitlements'])`.
  3. React components subscribing to entitlement data automatically re-render with updated Pro status.

```javascript
// React Query invalidation example
const { mutate: verifyReceipt } = useMutation({
  mutationFn: (purchase) => api.post('/iap/verify', purchase),
  onSuccess: async (_, purchase) => {
    await InAppPurchases.finishTransactionAsync(purchase, true);
    queryClient.invalidateQueries({ queryKey: ['user-entitlements'] });
  },
});
```

---

### Question 7c4e5f08-3fdf-0167-e7af-c85f67890123

- How do you ensure purchase state persists across app restarts?

### Answer

- ***Database Persistence (Primary)***: User session token authenticates with backend on app boot; server returns stored entitlement flags (`isPro: true`).
- ***Encrypted Local Cache (Offline Fallback)***: Cache current entitlement payload in secure local storage (e.g. `MMKV` with encryption or `expo-secure-store`) tagged with an expiration timestamp (`cachedUntil`).
- ***Un-finished Transaction Hydration***: `setPurchaseListener` registered at root startup automatically processes any native transactions that completed while the app was offline or closed.

---

### Question 8d5f6a19-40ea-1278-f8ba-d96a78901234

- What is the role of App Store Connect / Google Play Console in IAP setup?

### Answer

- ***Product & SKU Catalog Management***: Define unique product IDs, pricing tiers, localized product names, descriptions, and subscription duration periods.
- ***Subscription Group Architecture (iOS)***: Group subscriptions into levels to govern auto-upgrade, downgrade, and cross-grade logic.
- ***Store Review Assets***: Upload paywall screenshots, review notes, and test login credentials for Apple/Google app reviewers.
- ***Cryptographic Credentials & Webhooks***: Generate App Store Shared Secrets, App Store Server Notification URLs, Google Cloud Pub/Sub topics, and Service Account JSON credentials for backend verification.

---

### Question 9e6a7b20-51fb-2389-09cb-ea7b89012345

- What are common configuration mistakes in App Store Connect or Play Console?

### Answer

- ***Unaccepted Contracts***: Leaving developer Paid Applications / Tax & Banking agreements in pending status.
- ***Missing In-App Purchase Review Screenshot (iOS)***: Submitting a new IAP SKU without attaching a paywall screenshot, triggering automatic submission rejection.
- ***Play Console Draft State (Android)***: Querying SKUs on Android before uploading an AAB containing `com.android.vending.BILLING` to an active testing track.
- ***Fragmented Subscription Groups (iOS)***: Placing competing subscription tiers (e.g. Monthly Pro vs Yearly Pro) into separate Subscription Groups, causing double-billing instead of prorated upgrades.

---

### Question 0f7b8c31-620c-3490-1ad0-fb8c90123456

- How do you handle price localization and different currencies?

### Answer

- ***Dynamic Store Metadata Usage***: NEVER hardcode prices ($4.99) or currency symbols in React Native components.
- ***Store Provided Strings***: Extract `price` and `localizedPrice` (iOS) or `formattedPrice` (Android) returned by `getProductsAsync()`.
- ***Formatting Accuracy***: Use the OS-provided localized price string directly (e.g. "€4.99", "¥500", "4,99 €"). It automatically reflects localized currency formatting, tax inclusion standards, and localized store pricing tiers based on the user's active App Store / Google Play account region.

```javascript
// Display localized price directly from product object
<Text>{product.title} - {product.price}</Text> // Renders localized symbol e.g., "¥500"
```

---

### Question 1a8c9d42-731d-4501-2be1-0c9d01234567

- How would you implement feature gating based on subscription tiers?

### Answer

- ***Centralized Capability Map***: Define feature capabilities associated with each subscription tier.
- ***Feature Gate Component / Hook***:
```javascript
const TIER_PERMISSIONS = {
  free: ['read_articles'],
  pro: ['read_articles', 'download_pdf', 'ai_summary'],
  enterprise: ['read_articles', 'download_pdf', 'ai_summary', 'team_sharing']
};

export const useCanAccessFeature = (featureName) => {
  const { userTier } = useUserStore();
  const allowedFeatures = TIER_PERMISSIONS[userTier] || TIER_PERMISSIONS.free;
  return allowedFeatures.includes(featureName);
};
```
- ***Server-Side Validation Guard***: Enforce permission checks inside backend API middleware; reject unauthorized API requests with `403 Forbidden`.

---

### Question 2b9d0e53-842e-5612-3cf2-1d0e12345678

- How do you handle upgrades, downgrades, or cancellations for subscriptions?

### Answer

- ***iOS Behavior (Subscription Groups)***:
  - Upgrades within same group apply immediately with prorated refund for remaining period.
  - Downgrades apply at next renewal date.
  - Handled natively by StoreKit without custom backend proration calculations.
- ***Android Behavior (Proration Modes)***:
  - Must explicitly pass `prorationMode` when buying a new SKU over an active subscription (e.g. `IMMEDIATE_WITH_TIME_PRORATION` or `DEFERRED`).
- ***Cancellations Management***:
  - Apple/Google do NOT allow canceling subscriptions directly within third-party app code.
  - Provide a button linking users to OS native subscription management screens:
    - iOS Deep Link: `https://apps.apple.com/account/subscriptions`
    - Android Deep Link: `https://play.google.com/store/account/subscriptions?package=com.yourapp`

---

### Question 3c0e1f64-953f-6723-4da3-2e1f23456789

- What is the difference between client-side caching and server-side source of truth for purchases?

### Answer

- ***Client-Side Caching***:
  - Storing entitlement state in local device storage (MMKV, AsyncStorage).
  - Used for fast offline rendering and instant app startup.
  - Vulnerable to local device clock tampering, jailbreak modifications, and state sync delays when subscriptions expire externally.
- ***Server-Side Source of Truth***:
  - Canonical entitlement record stored in backend database, updated via real-time store webhooks (RTDN / App Store Server Notifications).
  - Resilient to client tampering, synced across multiple devices, and accurate regardless of local app install state.

---

### Question 4d1f2a75-0640-7834-5eb4-3f2c34567890

- How do you handle multiple devices using the same account?

### Answer

- ***Account-Bound Entitlements***: Bind verified purchase receipts to the internal app `userId` on your backend database rather than local device IDs.
- ***Seamless Multi-Device Hydration***: User logs into App Account B on a second device (iPad/Android tablet); app queries `/api/v1/user/me`, receiving active Pro status without needing to restore store receipts.
- ***Apple ID / Google Account Conflict Resolution***:
  - If single Apple ID attempts to restore purchases on Account A and Account B:
    - Server verifies if receipt is active.
    - Policy Option A: Transfer entitlement to newest account.
    - Policy Option B: Reject restoration if store transaction is already associated with an active distinct user account, preventing single subscription sharing across multiple app logins.

---

### Question 5e2a3b86-1751-8945-6fc5-4c3d45678901

- How do you debug IAP issues in Expo apps?

### Answer

- ***Expo Custom Dev Client Mandatory***: Native billing libraries are NOT compiled into standard Expo Go binaries. Must generate dev client (`npx expo run:ios` / `npx expo run:android`).
- ***Xcode StoreKit Testing (.storekit Configuration)***:
  - Create a `.storekit` environment file in Xcode project.
  - Simulates purchase flows, subscription renewals, cancellations, and speed-up time locally without touching App Store Connect or network calls.
- ***Android Logcat Filtering***: Inspect Logcat output filtered by tag `PlayBillingLibrary` or `com.android.vending.billing` to inspect raw error codes.
- ***Verbose Bridge Logging***: Wrap `setPurchaseListener` callbacks in structured log output to track incoming transaction states.

---

### Question 6f3b4c97-2862-9a56-7ad6-5d4e56789012

- What logs or signals would you monitor in production for IAP issues?

### Answer

- ***Funnel Conversion Drop-Offs***: Monitor metric ratio: `Paywall Impressions` -> `purchaseItemAsync Calls` -> `Server Validation Requests` -> `finishTransactionAsync Completions`.
- ***Un-Acknowledged Transaction Rates (Android)***: Alert if count of un-finished transactions older than 12 hours rises, indicating auto-refund risks.
- ***Server Receipt Validation Error Spikes***: Track HTTP 4xx/5xx error rates on `/api/v1/iap/verify` (indicates expired Apple/Google API credentials or broken payloads).
- ***Webhook Queue Latency & Failures***: Monitor GCP Pub/Sub and App Store Server Notification processing queues for webhook drops or database lock timeouts.

---

### Question 7a4c5d08-3973-0b67-8be7-6e5f67890123

- How do you handle refunds and revoked purchases?

### Answer

- ***Automated Revocation via Webhooks***:
  - iOS: Handle App Store Server Notification event `REVOKE` or `REFUND`.
  - Android: Consume Google Play Voided Purchases API or RTDN `SUBSCRIPTION_REVOKED` / `PURCHASE_VOIDED` message.
- ***Backend Processing Pipeline***:
  1. Receive webhook containing `originalTransactionId` or `purchaseToken`.
  2. Locate associated user entitlement record in database.
  3. Set `entitlement.status = 'REVOKED'` and update expiration date.
  4. Log refund event in audit table for fraud analysis.
- ***Client Invalidation***: Next time user opens app, entitlement query fetches updated revoked status, revoking access gracefully.

---

### Question 8b5d6e19-4a84-1c78-9cf8-7f6a78901234

- What is the impact of app reinstallation on IAP state?

### Answer

- ***Subscriptions & Non-Consumable Products***:
  - Purchase records remain permanently linked to the user's Apple ID or Google Account in store servers.
  - Reinstalling app clears local state; user taps "Restore Purchases", invoking `getPurchaseHistoryAsync()` to re-verify receipt and restore access.
- ***Consumable Products***:
  - StoreKit and Play Billing do NOT maintain consumable transaction state after consumption.
  - If a user reinstalls app before unspent consumable items (e.g. 500 coins) were synced to backend database, those consumables are lost.
  - MUST sync consumable balances to backend database immediately upon purchase.

---

### Question 9c6e7f20-5b95-2d89-ade9-8a7b89012345

- How do you design your app to be resilient to App Store / Play Store outages?

### Answer

- ***Decoupled Session Access***: App entitlement checks query backend database session token, NOT Apple/Google store servers during normal app operation.
- ***Grace Period Caching***: Store verified entitlement expiration timestamps locally in encrypted storage. If backend or store APIs experience temporary outages, grant user cached access for a grace period (e.g. 3 days).
- ***Asynchronous Transaction Queueing***: If Apple/Google validation servers return 5xx errors during checkout, retain native transaction in queue and retry verification asynchronously rather than failing instantly and canceling order.

---

### Question 0d7f8a31-6ca6-3e90-bdfa-9b8c90123456

- What are the limitations of Expo IAP compared to fully native implementations?

### Answer

- ***Deprecation Status***: `expo-in-app-purchases` is deprecated in modern Expo SDKs (SDK 46+).
- ***Lacks StoreKit 2 & Play Billing v5/v6 Features***: Does not natively support modern iOS StoreKit 2 features (e.g. JWS transactions, App Store Offer Codes, Win-Back offers) or Google Play Billing v6 multi-offer base plans.
- ***No Native UI Components***: Provides basic JavaScript API methods without pre-built paywalls, customer portal sheets, or localized paywall UI rendering.
- ***Industry Standard Alternatives***:
  - Use Expo Custom Dev Clients (`expo-dev-client`) combined with `react-native-iap` (open-source bare native bridge) OR `react-native-purchases` (RevenueCat SDK offering backend receipt validation, paywall UI, and subscription analytics).
