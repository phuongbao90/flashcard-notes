# nextjs architecure

### Question

- explain `revalidate: 3600` when it comes to ISR (Incremental Static Regeneration) in Next.js.

```
Day 1: App builds. Nike page is generated and cached as [B, A].
Day 2: Merchant adds product C to the database. (No user visits the site yet).
Day 3 (48 hours later): User #1 visits /products/brand/nike.
Day 4 (64 hours later): User #2 visits /products/brand/nike.
```

- What will User #1 see? What will User #2 see?

### Answer

1. User #1 arrives on Day 3:
   - Next.js checks the cache. The cached page [B, A] is 48 hours old (older than 3600 seconds).
   - User #1 immediately sees [B, A]. (Next.js serves the cached stale version instantly so User #1 doesn't wait for a database build).
   - In the background asynchronously: Next.js kicks off a background rebuild of the page. It queries the database, finds product C, builds the new HTML [C, B, A], and updates the CDN cache.

2. User #2:

- Next.js checks the cache. The CDN cache was just updated 24 hours ago!
- User #2 immediately sees [C, B, A].
- This new version will now be served to all visitors for the next 3,600 seconds (1 hour) before another background check is needed.

---

### Question

- On-Demand Cache Revalidation via Webhooks

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

### Question

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

### Question

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

### Question

### Answer

---

### Question

### Answer

---

### Question

### Answer

---
