# SOLID Principles

### Question c281caeb-7cec-4c30-88a2-2a7f3b7a286c

- How does the **Single Responsibility Principle (SRP)** translate to frontend component architecture, and how do you identify a violation?

### Answer

- **Single actor/stakeholder**: A module has one reason to change, meaning it serves one specific actor or business responsibility.
- **Frontend violation smell**: A component that simultaneously fetches data, normalizes payloads, formats currencies/dates, and renders UI has four reasons to change (API schema shift, business rule change, localization redesign, or styling update).
- **Separation strategy**: Extract data orchestration into a custom hook, pure domain formatting into utility functions, and leave the component purely responsible for rendering UI.

```tsx
// ❌ SRP Violation: Component changes if API changes, formatting changes, or UI layout changes
function UserInvoiceView({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(data => setInvoice(data));
  }, [invoiceId]);

  if (!invoice) return <div>Loading...</div>;
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.cents / 100);
  return <div><h1>Invoice #{invoice.id}</h1><p>Total: {formattedTotal}</p></div>;
}

// ✅ SRP Compliant: Split by reasons to change
// 1. Hook manages data lifecycle (changes on network/API updates)
const useInvoice = (invoiceId: string) => {
  return useQuery({ queryKey: ['invoice', invoiceId], queryFn: () => fetchInvoice(invoiceId) });
};

// 2. Pure helper manages formatting (changes on business/i18n rules)
const formatCurrency = (cents: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

// 3. Presentational component manages layout and rendering (changes on UX/design updates)
function UserInvoiceView({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  if (isLoading || !invoice) return <InvoiceSkeleton />;
  return <div><h1>Invoice #{invoice.id}</h1><p>Total: {formatCurrency(invoice.cents)}</p></div>;
}
```

- [More detail on Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [More detail on Presentational and Container Components](https://martinfowler.com/bliki/PresentationDomainDataLayering.html)

---

### Question 647c159e-48da-4f1a-838b-eb71a000c03d

- How does the **Open/Closed Principle (OCP)** apply to extensible component design, and why is map-based dispatch superior to growing `if/else` ladders?

### Answer

- **Open for extension, closed for modification**: You can introduce new behavior by adding new code (strategies, renderers, components) rather than modifying and re-testing existing stable code.
- **Switch/if cascade smell**: Adding a new UI variant or payment method by editing a 200-line `switch (variant)` block introduces regression risks to all existing branches.
- **Dictionary/strategy pattern**: Map variants to dedicated renderer components or configuration objects (`record[variant]`), allowing new variants to register without altering existing components.

```tsx
// ❌ OCP Violation: Every new alert type forces editing this shared core component
type AlertType = 'info' | 'warning' | 'error' | 'success';

function Alert({ type, message }: { type: AlertType; message: string }) {
  if (type === 'info') return <div className="bg-blue-100 text-blue-900">ℹ️ {message}</div>;
  if (type === 'warning') return <div className="bg-yellow-100 text-yellow-900">⚠️ {message}</div>;
  if (type === 'error') return <div className="bg-red-100 text-red-900">🚨 {message}</div>;
  if (type === 'success') return <div className="bg-green-100 text-green-900">✅ {message}</div>;
  return null;
}

// ✅ OCP Compliant: Map-based strategy open to new variants via external registry or extension
interface AlertRendererProps { message: string; }

const alertVariantMap: Record<string, React.ComponentType<AlertRendererProps>> = {
  info: ({ message }) => <div className="bg-blue-100 text-blue-900">ℹ️ {message}</div>,
  warning: ({ message }) => <div className="bg-yellow-100 text-yellow-900">⚠️ {message}</div>,
  error: ({ message }) => <div className="bg-red-100 text-red-900">🚨 {message}</div>,
  success: ({ message }) => <div className="bg-green-100 text-green-900">✅ {message}</div>,
};

export function Alert({ variant, message }: { variant: string; message: string }) {
  const Component = alertVariantMap[variant] ?? alertVariantMap.info;
  return <Component message={message} />;
}
// Adding 'announcement' requires only: alertVariantMap.announcement = ... without touching Alert component logic
```

- [More detail on Open-Closed Principle](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle)
- [More detail on Strategy Pattern](https://refactoring.guru/design-patterns/strategy)

---

### Question 5e6e13c4-5405-41ff-b467-9759f825e470

- What is the **Liskov Substitution Principle (LSP)** in frontend prop design, and how does breaking native element contracts violate it?

### Answer

- **Subtype substitutability**: A specialized component or subtype must be usable in place of its base component/element without breaking caller assumptions or weakening postconditions.
- **Contract violation**: If a wrapper component accepts standard HTML attributes (like `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`) but ignores or mutates `onClick`, `type`, or `disabled`, callers relying on native button behavior will silently break.
- **Strengthened preconditions**: Rejecting valid inputs that the base allows (e.g. requiring non-empty children when base accepts optional children) violates LSP.

```tsx
// ❌ LSP Violation: Claims to be a standard Button, but breaks standard onClick and ignores disabled
interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onCustomClick?: () => void; // Discards native onClick contract
}

function BrokenButton({ onCustomClick, disabled, ...props }: CustomButtonProps) {
  return (
    // Ignores 'disabled' attribute, still fires click, breaking callers expecting standard HTMLButton behavior
    <div onClick={disabled ? undefined : onCustomClick} role="button">
      {props.children}
    </div>
  );
}

// ✅ LSP Compliant: Extends base HTML attributes while honoring all standard contract behaviors
interface ValidButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  isLoading?: boolean;
}

function ValidButton({ isLoading, disabled, onClick, children, ...rest }: ValidButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      onClick={disabled || isLoading ? undefined : onClick}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

- [More detail on Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle)
- [More detail on Polymorphic Component Contracts](https://www.typescriptlang.org/docs/handbook/2/objects.html)

---

### Question 94dc6337-a70e-42ca-8a9a-751add5a12a0

- How does the **Interface Segregation Principle (ISP)** prevent unnecessary coupling and wasted re-renders in component and hook props?

### Answer

- **Lean, client-specific interfaces**: Callers and consumers should not be forced to depend on methods or properties they do not use.
- **Fat object coupling**: Passing a 30-field `User` domain model into an `Avatar` component that only needs `avatarUrl` and `fullName` tightly couples the component to the database schema, complicates unit testing, and impedes reuse across guest users.
- **Context optimization**: In React, subscribing to a fat context object re-renders the consumer when any field changes, even fields the component never touches. Granular contexts or lean selector props preserve ISP.

```tsx
// ❌ ISP Violation: Component depends on the entire 25-field User entity for a simple badge
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  billingAddress: { street: string; zip: string };
  lastLoginIp: string;
  // ...20 more fields
}

function UserBadge({ user }: { user: User }) {
  return <span>{user.name} ({user.role})</span>;
}

// ✅ ISP Compliant: Component demands only the exact shape it consumes
interface UserBadgeProps {
  name: string;
  role: string;
}

function UserBadge({ name, role }: UserBadgeProps) {
  return <span>{name} ({role})</span>;
}
// Now usable for mocks, partial users, or administrative service accounts without mocking 20 database fields
```

- [More detail on Interface Segregation Principle](https://en.wikipedia.org/wiki/Interface_segregation_principle)
- [More detail on React Context Optimization](https://react.dev/reference/react/useContext)

---

### Question 80189caf-935f-4707-a4c8-3f474e1300e4

- What is a real-life case study of applying the **Dependency Inversion Principle (DIP)** to decouple a React application from third-party analytics or payment SDKs?

### Answer

- **High-level modules depend on abstractions**: Core UI components must depend on an abstract interface (contract), never on concrete SDK instances like Google Analytics, Segment, or PostHog.
- **Real-world case study**: An e-commerce app directly importing `import analytics from 'mixpanel-browser'` inside 50 buttons cannot be tested without mocking the library bundle, and swapping to PostHog requires rewriting 50 files.
- **Solution via Inversion of Control**: Define an `AnalyticsService` contract, inject the concrete implementation at the application root via React Context or dependency injection, and let components consume the abstract hook.

```tsx
// 1. Abstraction (The contract high-level UI depends on)
export interface AnalyticsService {
  trackEvent(event: string, properties?: Record<string, unknown>): void;
}

// 2. Concrete implementations (Low-level infrastructure details)
export class PostHogAnalytics implements AnalyticsService {
  trackEvent(event: string, properties?: Record<string, unknown>) {
    window.posthog?.capture(event, properties);
  }
}

export class MockAnalyticsService implements AnalyticsService {
  public tracked: Array<{ event: string; properties?: Record<string, unknown> }> = [];
  trackEvent(event: string, properties?: Record<string, unknown>) {
    this.tracked.push({ event, properties });
  }
}

// 3. Injection seam via Context
const AnalyticsContext = createContext<AnalyticsService | null>(null);

export const useAnalytics = (): AnalyticsService => {
  const client = useContext(AnalyticsContext);
  if (!client) throw new Error('useAnalytics must be used within an AnalyticsProvider');
  return client;
};

// 4. High-level UI component: zero knowledge of PostHog or Mixpanel
export function CheckoutButton({ cartId, amount }: { cartId: string; amount: number }) {
  const analytics = useAnalytics();
  return (
    <button onClick={() => analytics.trackEvent('checkout_started', { cartId, amount })}>
      Complete Order
    </button>
  );
}
```

- [More detail on Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [More detail on Inversion of Control Containers](https://martinfowler.com/articles/injection.html)

---

### Question 2f53ef1f-7ae8-48a1-af8c-8f7f663a57b2

- Why is knowing when to **deliberately violate SOLID principles** a hallmark of senior engineering judgment?

### Answer

- **Heuristics, not absolute laws**: SOLID principles exist to manage cost of change; applying them dogmatically when code rarely changes introduces speculative indirection and cognitive tax.
- **Pragmatic SRP violation (Colocation)**: Splitting a 40-line form component, its validation schema, and its query into three files across different directories increases context-switching overhead. Colocating them in one cohesive module is often more maintainable.
- **Pragmatic OCP violation**: Writing abstract factory dispatchers for a UI that has exactly two static options (e.g. `Light` and `Dark` theme) violates YAGNI. A simple ternary or `if/else` is easier to read and maintain until genuine extension is required.
- **Pragmatic DIP violation**: Inverting every utility function (e.g., creating an abstraction for `lodash.debounce` or `Math.round`) creates boilerplate without providing swappability or testability benefits. Reserve DIP for natural I/O seams (network, storage, clock, third-party vendors).

```tsx
// ✅ Deliberate Pragmatic Violation: Colocating query, schema, and UI in one cohesive file
// Over-dogmatic SRP would force 3 files across 3 folders for 35 lines of code
const updateProfileSchema = z.object({ username: z.string().min(3) });
type ProfileFormData = z.infer<typeof updateProfileSchema>;

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const mutation = useMutation({ mutationFn: updateUsernameOnServer });
  const form = useForm<ProfileFormData>({ resolver: zodResolver(updateProfileSchema) });
  return (
    <form onSubmit={form.handleSubmit(data => mutation.mutate(data))}>
      <input {...form.register('username')} defaultValue={initialName} />
      <button type="submit" disabled={mutation.isPending}>Save</button>
    </form>
  );
}
```

- [More detail on The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
- [More detail on Pragmatic Software Architecture](https://martinfowler.com/articles/designDead.html)
