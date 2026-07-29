# System design

### Question

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

### Question

- How do you get user geolocation data for a website?

### Answer

---

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---
