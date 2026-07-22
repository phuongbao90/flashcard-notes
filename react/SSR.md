# React

## Server-Side Rendering (SSR)

### Question

- What is hydration in React SSR?

### Answer

- It is a process where JavaScript takes over already-rendered HTML (usually from SSR) and attaches event listeners + restores interactivity without re-rendering the DOM from scratch.

- key points:
  - HTML already exists (from server)
  - React runs on the client
  - React reuses that HTML
  - React attaches event handlers + builds internal state (Fiber tree)
---
### Question
- Explain client boundary in React SSR.
- Give an example of it, what is its purpose?

### Answer
- Client Components can only import other Client Components.

```
        App
Header          Article ("use client")
          Counter   Discussion
```

- The client boundary is everything inside Article.
- All of the components within this boundary are implicitly converted to Client Components. 
  - Even though components like HitCounter don't have the 'use client' directive, they'll still hydrate/render on the client in this particular situation.
  - The Counter component itself might still be rendered as a Server Component in other situations, if it's imported somewhere else by a Server Component.
- This means we don't have to add 'use client' to every single file that needs to run on the client. In practice, we only need to add it when we're creating new client boundaries.
---
### Question
- Does Server components get included in the JS bundle?

### Answer
- No, Server Components are never included in the JS bundle.
  -  Thus, we can reduce the amount of JavaScript that needs to be sent to the client, which can improve performance and reduce load times.

---
### Question
- Discuss the significance of the Suspense component in React SSR.

### Answer
- it enables:
  - Streaming HTML on the server. To opt into it, you’ll need to switch from renderToString to the new renderToPipeableStream method
  - Selective Hydration on the client. To opt into it, you’ll need to switch to hydrateRoot on the client and then start wrapping parts of your app with Suspense.
    - ***Hydrating the page before all the HTML has been streamed:*** Before React 18, code splitting (via React.lazy) and Server-Side Rendering (SSR) didn't mix well.
      ```javascript
      1. HTML Stream       →  Shell sent immediately  →  User sees layout
      2. Code Splitting   →  Main JS loads & hydrates →  Header/Nav active
      3. Deferred Bundle  →  Comments JS loads later  →  Comments hydrate
      ```
    - ***Interacting with the page before all the components have hydrated***: Interaction Hijacking: When a user clicks an unhydrated component, React intercepts the event during the capture phase, jumps to that specific Suspense boundary, hydrates it synchronously on the spot, and then dispatches the original click.

---
### Question
- Discuss renderToPipeableStream

### Answer
- introduced in React 18
- Alternative to renderToString
- It is a new API that allows for streaming HTML from the server to the client in chunks
- Instead of waiting for the entire page to finish rendering before sending HTML to the browser, it sends the page in chunks as it renders.

- features:
  - Streaming Server-Side Rendering (SSR): Sends initial static HTML immediately, then streams slow parts (wrapped in Suspense) over the same HTTP connection as inline script tags when ready.
  - Selective Hydration: The browser can start downloading and hydrating ready components (interactive elements) before slow data fetches finish.
  - Backpressure Support: Works directly with Node.js streams to pause rendering if the network buffer is full, preventing server memory spikes.

- core benefits:
  - Faster time-to-first-byte (TTFB)
  - Improved performance for large pages
  - Better user experience, as users can start interacting with the page sooner