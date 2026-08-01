# React Pattern

### Question

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
