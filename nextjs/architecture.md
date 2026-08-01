# nextjs architecure

### Question 49bf2df3-87d0-4913-bdbe-c2bde1dd3cb2

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

### Question f6f1db1e-89c8-436c-bca2-f2dcf4f8ffaa

- On-Demand Cache Revalidation via Webhooks

### Answer

---

### Question 610e4e5d-3360-4363-aad9-0458aadc1180

### Answer

---

### Question 9b8b5f70-c5e1-4d94-ab22-4ff7fb0d8ee0

### Answer

---

### Question 1e915ce2-4017-4063-b124-9f31c00b56ef

### Answer

---

### Question 321cf2bd-eea8-40dc-a708-ccc1d5d9bfa3

### Answer

---

### Question cfc30c7d-da26-4fa7-ab51-2d5ef3747217

### Answer

---

### Question e0448e81-55d6-4592-841b-d2d98817369c

### Answer

---

### Question 7db3e791-0c5a-4b21-bb11-489a5820017c

### Answer

---

### Question 59784179-eb73-4445-837e-f45cad2a6245

### Answer

---

### Question 84215209-2624-49d3-a7a5-4341361dcbdf

### Answer

---

### Question d43c21be-3263-48dc-9ee8-660bd8934235

### Answer

---

### Question 689d91f5-666d-4467-8bfe-ed0cf4060b3c

### Answer

---

### Question e4fb25ca-d137-46e7-9399-72265413f5fe

### Answer

---

### Question 1560cfce-b438-4892-b7b2-b4652cd6742d

### Answer

---

### Question 964ab4e0-f4b9-4725-bb4d-8c9dfa4ca68d

### Answer

---
