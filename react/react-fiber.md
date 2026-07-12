# React

## React Fiber

### Question

What is React Fiber?

### Answer

Fiber is the new reconciliation engine in React 16. It allows incremental rendering of the virtual DOM.

### Question

What are the main goals of React Fiber?

### Answer

- Ability to split interruptible work in chunks.
- Ability to prioritize, rebase, and reuse work in progress.
- Ability to yield back and forth between parents and children.
- Support for returning multiple elements from render.

### Question

- What are the main differences between React Fiber and the previous reconciliation algorithm?

### Answer

- React Fiber uses a linked list structure to represent the virtual DOM, while the previous algorithm used a tree structure.
