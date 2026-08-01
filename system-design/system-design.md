# System design

### Question 1a7ed1c2-ecfe-4200-9c4f-f9a489865246

- What do you implement a banner system for a website?

### Answer

- Start with requirements framing (senior signal):
  - trust boundary (backend vs client validation) who decide valid banners?
  - personalization (per-user breaks cache) region / user segment
  - chrome vs critical (banners = non-critical → must not break page)
  - admin write-path → need cache invalidation
- Architecture / data flow:
  - fetch in Server Component (RSC) early
  - use placement-scoped API (better cache hit, avoid overfetch)
  - caching:
    - prefer tag-based revalidation (+ on-demand invalidation)
    - TTL as fallback (hybrid best)
  - handle schedule staleness:
    - cache may show expired/not-yet-live banners
    - options: accept small window, compute server-side, or revalidate at boundary
- Component structure:
  - RSC container → fetch + guard (return null on error)
  - split by shape (carousel vs static)
  - client island only for carousel logic
  - leaf components:
    - image (responsive)
    - slide
    - action mapper (type → behavior)
  - action types:
    - internal nav, external link, deeplink
    - voucher = side-effect, not link
- Key concerns:
  - Accessibility:
    - WCAG 2.2.2 (pause/stop autoplay)
    - respect reduced-motion
    - proper roles/labels + keyboard support
    - autoplay is questionable by default
  - Performance:
    - hero likely LCP
    - preload/priority first image
    - responsive images (srcset)
    - lazy-load non-visible slides
    - avoid CLS
  - Hydration:
    - no time/random logic in client
    - compute on server → pass as data
  - Targeting:
    - filter in RSC (safe if contextual, not per-user)

---

### Question 59b2d07f-0333-43da-bb01-70f3862d6f74

- How do you get user geolocation data for a website?

### Answer

---

### Question fd55b75b-0103-4b84-890a-cbcd403bf937

- What is the difference in development for mobile and web?

### Answer

1. Update & deploy cycle
   - Mobile: App store review, user update
   - Web: Continuous deployment, instant update

2. Security & Data storage
   - Mobile:
     - Auth storage: Keychain (iOS), Keystore (Android)
     - Primary threat: reverse engineering, jailbreak/rooting, man-in-the-middle attacks
     - security techniques: obfuscation, code signing, certificate pinning, biometric authentication
   - Web:
     - Auth storage: HttpOnly cookies
     - Primary threat: XSS, CSRF
     - security techniques: CSP, CORS, SameSite cookies
3. Offline support
   - Mobile: native offline support, local database (SQLite, Realm)
   - Web: online-first. If offline, page reload will fail. Can use service workers for caching, but not as reliable as native offline support.

4. Hardware access
   - Mobile: native APIs for camera, GPS, accelerometer, etc.
   - Web: limited access to hardware APIs (WebRTC, WebUSB, WebBluetooth), but not as extensive as native mobile apps.

---

### Question b48871a3-4b5c-42f0-9807-7f30fc535549

### Answer

---

### Question 44f92f2c-021c-4593-b8c4-c54bd4da89e2

### Answer

---
