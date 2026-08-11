# Core Programming

### Question a8b6e6c9-a4ca-4458-bb16-b068c2ee0dd1

- How does the _**Single Responsibility Principle (SRP)**_ apply to React Context design, and what performance bottlenecks occur when state and dispatch are combined?

### Answer

- _**SRP**_ dictates that a React Context should have one distinct reason to change, managing a single cohesive slice of state (e.g., `ThemeContext` vs. `AuthContext`).
- Combining state data and updater functions in a single provider forces all consumer components to re-render whenever state updates, even if a component only consumes the updater function.
- Splitting into separate `StateContext` and `DispatchContext` ensures components using actions (e.g., buttons) don't re-render when state changes.
- Avoid "God Contexts" that centralize unrelated domains, as state updates in any domain will invalidate the entire context value object.

```javascript
// ✅ Decoupling State and Dispatch contexts adhering to SRP
const UserStateContext = createContext(null);
const UserDispatchContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <UserStateContext.Provider value={user}>
      <UserDispatchContext.Provider value={setUser}>{children}</UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
};
```

---

### Question dbfeca7b-5a21-4b6b-93ba-c46d709f616a

- How can React Context be leveraged to satisfy the _**Open/Closed Principle (OCP)**_ in component design?

### Answer

- _**OCP**_ requires that components be open for extension but closed for modification; in React, Context enables this via the _**Compound Components**_ pattern.
- Context shares state implicitly between parent and child components without hardcoding layout structures or resorting to brittle prop drilling.
- New features or UI sub-components can consume the existing context to extend functionality without modifying the core parent component's internal logic.
- Caveat: Exposing internal context details without abstraction can leak implementation details; export dedicated sub-components or consumer hooks instead.

```javascript
const SelectContext = createContext();

export const Select = ({ children, onChange }) => {
  const [selected, setSelected] = useState(null);
  return (
    <SelectContext.Provider value={{ selected, setSelected, onChange }}>
      <div className="select-dropdown">{children}</div>
    </SelectContext.Provider>
  );
};

// Open for extension: Sub-component extends behavior without altering Select core
Select.Option = ({ value, children }) => {
  const { selected, setSelected, onChange } = useContext(SelectContext);
  return (
    <button
      onClick={() => {
        setSelected(value);
        onChange?.(value);
      }}
      className={selected === value ? "selected" : ""}
    >
      {children}
    </button>
  );
};
```

---

### Question d25853d7-b572-4757-86b3-9a593b15085e

- How does the _**Liskov Substitution Principle (LSP)**_ govern React Context providers and custom hook abstractions?

### Answer

- _**LSP**_ dictates that sub-types or alternative context providers must be substitutable for their base contract without altering correctness or breaking consumers.
- Custom consumer hooks (e.g., `useAuth`) act as contract validators, throwing consistent errors when context is missing to guarantee non-null return types for components.
- Alternative providers (e.g., `MockAuthProvider` in tests or `FeatureFlaggedAuthProvider` in production) must implement identical context shapes, types, and return guarantees.
- Behavioral drift (such as a mock provider returning synchronous data when the real provider returns promises) breaks LSP and leads to integration test failures.

```javascript
// LSP Contract Enforcement via Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

---

### Question 9a04fdd1-7eac-44b4-a950-cdbe14980029

- How does the _**Interface Segregation Principle (ISP)**_ address React Context bloat and unnecessary component re-renders?

### Answer

- _**ISP**_ states that components should not be forced to depend on interface properties they do not consume.
- In React, a component subscribing to a Context via `useContext` re-renders whenever _any_ property of the Context provider value changes, even unused properties.
- Applying ISP requires splitting monolithic contexts into fine-grained atomic contexts or adopting selector utilities (`useContextSelector`).
- Creating fat context objects creates tight coupling and severe render performance degradation across large component trees.

```javascript
// ❌ ISP Violation: Component needs only 'theme', but re-renders when 'user' updates
const { theme } = useContext(AppMonolithContext);

// ✅ ISP Compliant: Split into granular contexts
const theme = useContext(ThemeContext);
const user = useContext(UserContext);
```

---

### Question 5c6c9951-c254-4d27-8cf8-257fbff7e717

- How can React Context be used as an Inversion of Control mechanism to achieve the _**Dependency Inversion Principle (DIP)**_?

### Answer

- _**DIP**_ dictates that high-level modules (UI components) must depend on abstractions (e.g., an `AnalyticsService` contract/interface), not on concrete low-level infrastructure (e.g., Firebase, Segment, `localStorage`).
- React Context itself is NOT the abstraction or a full IoC container; it acts as a _**dependency injection (DI) mechanism**_ that enables _**Inversion of Control (IoC)**_ by propagating concrete implementations down the tree.
- Control over dependency selection and injection is inverted from consuming components to the top-level Provider/composition root.
- Consuming components rely on a custom hook (e.g., `useAnalytics()`) that fails fast with a explicit error if the Provider is missing, enforcing contract compliance rather than silently swallowing errors.
- Implementations can be swapped seamlessly (e.g., replacing `FirebaseAnalytics` with `SegmentAnalytics` or `MockAnalyticsService`) without altering consuming UI components.
- Anti-pattern: Providing a concrete instance as `createContext()` default value or hardcoding static SDK imports directly inside components creates tight coupling and violates DIP.

```typescript
// 1. Abstraction (Service Contract Interface)
interface AnalyticsService {
  track(event: string): void;
}

// 2. DI Mechanism (Context initialized to null to enforce explicit provider injection)
const AnalyticsContext = createContext<AnalyticsService | null>(null);

const useAnalytics = (): AnalyticsService => {
  const service = useContext(AnalyticsContext);
  if (!service) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return service;
};

// 3. High-level UI Component depends strictly on the abstraction
export const TrackButton = ({ eventName, children }: { eventName: string; children: React.ReactNode }) => {
  const analytics = useAnalytics();
  return <button onClick={() => analytics.track(eventName)}>{children}</button>;
};

// 4. Composition Root: Provider injects concrete implementation down the tree
export const App = ({ analyticsService }: { analyticsService: AnalyticsService }) => (
  <AnalyticsContext.Provider value={analyticsService}>
    <TrackButton eventName="PURCHASE_CLICK">Buy Now</TrackButton>
  </AnalyticsContext.Provider>
);
```
