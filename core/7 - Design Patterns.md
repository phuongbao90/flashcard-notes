# Design Patterns

### Question ffa45190-c775-4fd5-9f55-e54fd569050e

- Why is the **Singleton pattern** widely considered an anti-pattern in modern frontend applications, and what architectural alternatives replace it?

### Answer

- **Hidden dependencies and tight coupling**: Components calling `DatabaseClient.getInstance()` or `AuthService.getInstance()` disguise their dependencies, making dependency graphs invisible.
- **Testing state contamination**: Singletons preserve mutable state across unit tests; test suites cannot run deterministically or in parallel without manual teardown methods (`resetInstanceForTesting()`).
- **Modern replacement (Dependency Injection & Context)**: Use tree-scoped React Context or parameter injection. At the application root (composition root), instantiate a single instance and pass it down, allowing test environments to inject mocks trivially.

```typescript
// ❌ Problematic Singleton: Global mutable instance that corrupts tests
class UserPreferencesManager {
  private static instance: UserPreferencesManager;
  public theme = 'light';
  private constructor() {}
  static getInstance() {
    if (!this.instance) this.instance = new UserPreferencesManager();
    return this.instance;
  }
}

// ✅ Modern Alternative: Dependency Injection via Scope / Context
export interface UserPreferences {
  theme: string;
  setTheme: (t: string) => void;
}

export const PreferencesContext = createContext<UserPreferences | null>(null);

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('Must be inside PreferencesProvider');
  return ctx;
}
```

- [More detail on Singleton Pattern](https://refactoring.guru/design-patterns/singleton)
- [More detail on Singletons as Anti-Patterns](https://wiki.c2.com/?SingletonsAreEvil)

---

### Question 55353af1-a879-40cd-8da2-64295c4c4a68

- How do the **Factory** and **Builder** patterns streamline complex frontend component and query instantiation?

### Answer

- **Factory pattern**: Encapsulates object/component creation logic when the exact type or configuration depends on runtime criteria (e.g. rendering form fields dynamically based on a schema type: `'text' | 'date' | 'select'`).
- **Builder pattern**: Constructs complex objects step-by-step with chained methods, preventing telescoping constructor parameters (e.g. building complex API query URLs or elasticsearch filters).

```tsx
// 1. Factory Pattern: Component Factory based on field descriptor
interface FieldConfig { type: 'text' | 'number' | 'toggle'; label: string; name: string; }

const fieldRegistry = {
  text: (props: any) => <input type="text" {...props} />,
  number: (props: any) => <input type="number" {...props} />,
  toggle: (props: any) => <input type="checkbox" {...props} />,
};

export function FieldFactory({ config }: { config: FieldConfig }) {
  const Component = fieldRegistry[config.type];
  return <label>{config.label}<Component name={config.name} /></label>;
}

// 2. Builder Pattern: Fluent query string builder
export class RequestBuilder {
  private params = new URLSearchParams();
  constructor(private baseUrl: string) {}

  filter(key: string, value: string): this {
    this.params.set(`filter[${key}]`, value);
    return this;
  }
  page(num: number): this {
    this.params.set('page', String(num));
    return this;
  }
  buildUrl(): string {
    return `${this.baseUrl}?${this.params.toString()}`;
  }
}
// Usage: new RequestBuilder('/api/products').filter('cat', 'shoes').page(2).buildUrl();
```

- [More detail on Factory Method](https://refactoring.guru/design-patterns/factory-method)
- [More detail on Builder Pattern](https://refactoring.guru/design-patterns/builder)

---

### Question 32c20f69-4c7f-46d2-b6a6-0f690a557815

- How do the **Adapter** and **Facade** structural patterns isolate frontend code from messy external dependencies and third-party APIs?

### Answer

- **Adapter pattern**: Converts the interface of an existing class or third-party service into another interface that callers expect, making incompatible interfaces work together (e.g., adapting Stripe SDK and PayPal SDK to a common `PaymentAdapter`).
- **Facade pattern**: Provides a simplified, high-level interface to an entire complex subsystem (e.g., your Data Access Layer `UserService` is a facade that hides cookies, caching, HTTP headers, and JSON serialization behind a clean `getUser(id)` call).

```typescript
// 1. Adapter Pattern: Unifying third-party analytics APIs
interface UnifiedTracker {
  track(event: string, meta?: Record<string, unknown>): void;
}

export class GoogleAnalyticsAdapter implements UnifiedTracker {
  track(event: string, meta?: Record<string, unknown>) {
    window.gtag?.('event', event, meta);
  }
}

export class MixpanelAdapter implements UnifiedTracker {
  track(event: string, meta?: Record<string, unknown>) {
    window.mixpanel?.track(event, meta);
  }
}

// 2. Facade Pattern: Simplifying subsystem orchestration
export class AuthFacade {
  static async loginAndWarmCache(email: string, pass: string) {
    const token = await authApi.authenticate(email, pass);
    tokenStorage.saveToken(token);
    const user = await userApi.getProfile(token);
    queryCache.setQueryData(['user'], user);
    return user;
  }
}
```

- [More detail on Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [More detail on Facade Pattern](https://refactoring.guru/design-patterns/facade)

---

### Question 9dc97d74-a43c-476d-b00e-acb95f36b333

- How do **Decorator** and **Proxy** patterns enhance functionality without altering core component logic?

### Answer

- **Decorator pattern**: Attaches additional behaviors to an object or component dynamically by wrapping it without modifying the original code (e.g., Next.js middleware, higher-order logging wrappers, or authentication guard HOCs).
- **Proxy pattern**: Provides a surrogate or placeholder for another object to control access to it (e.g., lazy-loading heavy bundles via `React.lazy`, caching expensive API calls, or logging property mutations via ES6 `new Proxy()`).

```typescript
// 1. Decorator: Higher-order function adding performance timing to any async function
export function withTiming<TArgs extends any[], TReturn>(
  fnName: string,
  fn: (...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const start = performance.now();
    try {
      return await fn(...args);
    } finally {
      console.log(`[Timing] ${fnName} took ${(performance.now() - start).toFixed(2)}ms`);
    }
  };
}

// 2. Proxy Pattern: Intercepting object mutations for change tracking
export function createReactiveStore<T extends object>(initial: T, onChange: () => void): T {
  return new Proxy(initial, {
    set(target, prop, value) {
      Reflect.set(target, prop, value);
      onChange();
      return true;
    },
  });
}
```

- [More detail on Decorator Pattern](https://refactoring.guru/design-patterns/decorator)
- [More detail on Proxy Pattern](https://refactoring.guru/design-patterns/proxy)

---

### Question f16d1de3-936d-431e-8f63-8ead3ebe53a4

- How does the **Composite pattern** represent the foundational architecture of React's element tree and DOM hierarchies?

### Answer

- **Uniform interface for primitives and containers**: The Composite pattern lets clients treat individual objects (leaf nodes) and compositions of objects (containers) uniformly.
- **React element tree**: In React, both leaf nodes (`<button>`, `<span>`) and composite container nodes (`<Card>`, `<Layout>`) implement the same recursive interface (`ReactNode` / `JSX.Element`).
- **Render recursion**: The React reconciler traverses composite trees recursively without needing special handling for nested containers vs terminal DOM nodes.

```tsx
// Composite Pattern: Uniform ReactNode composition
interface MenuItemProps {
  label: string;
  children?: React.ReactNode; // Can be empty (leaf) or contain submenus (composite)
}

export function MenuItem({ label, children }: MenuItemProps) {
  return (
    <div className="menu-group">
      <div className="menu-label font-bold">{label}</div>
      {children && <div className="pl-4">{children}</div>}
    </div>
  );
}

// Uniform usage: Leaf and composite are nested identically
export function AppMenu() {
  return (
    <MenuItem label="Settings">
      <MenuItem label="Profile" />       {/* Leaf node */}
      <MenuItem label="Security">       {/* Composite node */}
        <MenuItem label="2FA" />         {/* Leaf node */}
        <MenuItem label="Change Password" />
      </MenuItem>
    </MenuItem>
  );
}
```

- [More detail on Composite Pattern](https://refactoring.guru/design-patterns/composite)
- [More detail on React Element Trees](https://react.dev/learn/describing-the-ui)

---

### Question d7ce2fd7-9c58-43f9-b8af-19fb4ca598c3

- How do the **Observer** and **Strategy** behavioral patterns power modern UI reactivity and sorting/validation pipelines?

### Answer

- **Observer pattern**: Defines a one-to-many dependency so that when one subject changes state, all its registered dependents are notified automatically. Underpins every state library (Redux, Zustand, RxJS, DOM `addEventListener`).
- **Strategy pattern**: Defines a family of interchangeable algorithms, encapsulates each one, and makes them swappable at runtime. Callers delegate execution to the selected strategy without caring which algorithm executes (e.g., sort comparators, discount calculation algorithms, form validation rules).

```typescript
// 1. Observer Pattern: Minimal reactive store subscription
export class ObservableStore<T> {
  private subscribers = new Set<(state: T) => void>();
  constructor(private state: T) {}

  subscribe(listener: (state: T) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener); // Cleanup
  }
  setState(next: T) {
    this.state = next;
    this.subscribers.forEach(cb => cb(this.state));
  }
}

// 2. Strategy Pattern: Interchangeable pricing strategies
type PricingStrategy = (subtotal: number) => number;

export const regularPricing: PricingStrategy = (amount) => amount;
export const holidayPricing: PricingStrategy = (amount) => amount * 0.8;
export const vipPricing: PricingStrategy = (amount) => (amount > 100 ? amount * 0.75 : amount * 0.9);

export function computeCheckoutTotal(amount: number, strategy: PricingStrategy): number {
  return strategy(amount); // Swappable calculation strategy
}
```

- [More detail on Observer Pattern](https://refactoring.guru/design-patterns/observer)
- [More detail on Strategy Pattern](https://refactoring.guru/design-patterns/strategy)

---

### Question 297378f5-a2ab-4db1-ae1c-d9b68d95ef17

- How do **Command** and **State (Finite State Machine)** patterns solve undo/redo history and complex UI transitions?

### Answer

- **Command pattern**: Encapsulates a request as a standalone object containing all information needed to execute or reverse the action (`execute()` and `undo()`). Essential for rich-text editors, canvas drawings, and undo/redo stacks.
- **State pattern (FSM / XState)**: Allows an object to alter its behavior when its internal state changes, formalizing explicit transitions and prohibiting invalid state transitions (e.g. a media player cannot transition directly from `Idle` to `Playing` without passing through `Loading`).

```typescript
// 1. Command Pattern: Undo/Redo Engine
interface Command {
  execute(): void;
  undo(): void;
}

export class HistoryManager {
  private undoStack: Command[] = [];
  execute(command: Command) {
    command.execute();
    this.undoStack.push(command);
  }
  undo() {
    const cmd = this.undoStack.pop();
    cmd?.undo();
  }
}

// 2. State Machine: Exhaustive UI transitions
type PlayerState = 'idle' | 'loading' | 'playing' | 'paused';
type PlayerEvent = { type: 'LOAD' } | { type: 'LOADED' } | { type: 'PAUSE' } | { type: 'RESUME' };

export function playerReducer(state: PlayerState, event: PlayerEvent): PlayerState {
  switch (state) {
    case 'idle': return event.type === 'LOAD' ? 'loading' : state;
    case 'loading': return event.type === 'LOADED' ? 'playing' : state;
    case 'playing': return event.type === 'PAUSE' ? 'paused' : state;
    case 'paused': return event.type === 'RESUME' ? 'playing' : state;
    default: return state;
  }
}
```

- [More detail on Command Pattern](https://refactoring.guru/design-patterns/command)
- [More detail on State Pattern](https://refactoring.guru/design-patterns/state)

---

### Question 71325a3e-8bba-437f-b127-a84f1fbbf36d

- What is the senior framing on design patterns: why is knowing **when each pattern is overkill** more critical than memorizing GoF implementations?

### Answer

- **Patterns as shared vocabulary**: Design patterns provide concise names for communication (e.g. "let's use an adapter here for third-party billing"). They are not dogmatic blueprints to be forced into every pull request.
- **"Solution looking for a problem" trap**: Junior engineers frequently identify a pattern first and search for a place to implement it, creating useless abstract layers and factory classes for straightforward 5-line operations.
- **Senior decision rule**: Start with the simplest idiomatic language construct (first-class functions, object maps, native closures). Introduce formal patterns only when complexity, variation, and test isolation requirements genuinely demand them.

```tsx
// ❌ Overkill: Building a full Mediator, Factory, and Abstract Factory for a 2-button toolbar
// ✅ Senior Pragmatism: Direct props and native closures are clear, concise, and sufficient
export function Toolbar({ onBold, onItalic }: { onBold: () => void; onItalic: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onBold} aria-label="Bold"><b>B</b></button>
      <button onClick={onItalic} aria-label="Italic"><i>I</i></button>
    </div>
  );
}
```

- [More detail on Design Patterns](https://refactoring.guru/design-patterns)
- [More detail on Design Principles and Patterns](https://martinfowler.com/articles/designDead.html)
