# React Pattern

### Question d8509e29-c086-4e70-83c7-23c82d4fcaf9

- How to implement a infinite scroll in React?

### Answer

1. Server-Side Initial Seed (Zero CLS)
   - feed the initial data from the server to the client to avoid layout shifts.
2. Add invisible elements
   - `<div ref={sentinelRef} aria-hidden="true" className="h-1 w-full" />`
3. Use Intersection Observer API in useEffect
   - Use the Intersection Observer API to detect when the sentinel element is in view and trigger a fetch for more data.
   ```ts
   const observer = new IntersectionObserver(
     ([entry]) => {
       if (entry?.isIntersecting) void loadMore();
     },
     { rootMargin: "256px 0px" }, // Pre-fetches 256px BEFORE reaching bottom
   );
   observer.observe(sentinel);
   ```
4. Async Concurrency Lock & State Accumulation
   - Concurrency Lock: inFlightRef or status === "loading" prevents duplicate requests if the user scrolls rapidly.
   - Fetch Next Page: Calls the BFF client fetcher using the current list length as the offset (offset: state.reviews.length).
   - Append State: Merges new items into existing state:

---

### Question 61075d18-296e-4fe4-96b1-4796f4ad0be9

### Answer

---

### Question 47bfcd0c-2c93-4e5b-8d1f-7b53738488c3

### Answer

---

### Question b3a0a102-4da7-4ee0-b24d-6caff7510815

### Answer

---

### Question e666143e-00d1-4562-932d-d2b551def7ba

### Answer

---

### Question d8d32910-2796-4771-887d-5d1bf16ef90c

### Answer

---

### Question f7b7af18-8846-42a5-80ea-4d1a771ae090

### Answer

---

### Question d54b451d-dc2d-44a5-afa4-ccb4e8cffedb

### Answer

---

### Question 2e9dec2b-1369-4892-80e0-bef1bb8db669

### Answer

---

### Question b45cfdca-8eaf-4122-96de-68b10715aedd

### Answer

---
