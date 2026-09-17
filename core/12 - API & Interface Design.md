# API & Interface Design

### Question 872802d2-68d4-41a2-aba6-7a327582d6ea

- Why is **internal codebase consistency** one of the highest leverage design investments, and how does predictability compound?

### Answer

- **Cognitive tax reduction**: When naming conventions, error-handling styles, folder layouts, and async patterns are strictly consistent across a repository, engineers intuitively know how an unfamiliar module works before reading its implementation.
- **Inconsistency smell**: Having some hooks return tuples (`[data, error]`), others return objects (`{ data, error }`), and others throw exceptions forces callers to constantly check documentation and increases cognitive overhead.
- **Predictability compounds**: Consistency speeds up code reviews, makes automated tooling (codemods, linters) trivial to write, and prevents defect introduction during cross-team collaboration.

```typescript
// ❌ Inconsistent Conventions: Different signatures for similar domain queries
export function useUser(id: string): [User | null, boolean] { /* returns tuple */ }
export function useProduct(id: string): { data: Product; isPending: boolean } { /* returns object */ }
export function useOrder(id: string): UserOrder { /* throws promise or returns directly */ }

// ✅ Cohesive, Predictable Architecture: Standardized return contract across all domain hooks
export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUser(id: string): QueryResult<User> { /* ... */ }
export function useProduct(id: string): QueryResult<Product> { /* ... */ }
export function useOrder(id: string): QueryResult<Order> { /* ... */ }
```

- [More detail on Principle of Least Astonishment in API Design](https://en.wikipedia.org/wiki/Principle_of_least_astonishment)
- [More detail on API Design Principles](https://martinfowler.com/articles/enterpriseREST.html)

---

### Question bd39893c-10bf-4b28-949c-f2835abdabf4

- What defines a **breaking change in Semantic Versioning (SemVer)**, and why do subtle behavioral changes often constitute major breaks?

### Answer

- **SemVer contract (`MAJOR.MINOR.PATCH`)**:
  - `PATCH`: Backwards-compatible bug fixes.
  - `MINOR`: Backwards-compatible new features.
  - `MAJOR`: Any breaking change to the public API contract.
- **Subtle breaking changes**:
  - Tightening a parameter type (e.g. changing `status?: string` to `status: 'active' | 'inactive'`).
  - Broadening a return type (e.g. returning `User | null` where previously it always returned `User`).
  - Reordering positional function arguments.
  - Changing the default value of an optional flag.
  - Changing error types or status codes that callers caught programmatically.
- **Hyrum's Law intersection**: Even an unstated behavioral change (e.g. returning keys in a different order or omitting a legacy default header) breaks dependent downstream systems in practice.

```typescript
// Library v1.0.0
export function parseDate(input: string, format = 'MM/DD/YYYY'): Date { /* ... */ }

// ❌ Accidental Breaking Change in "Minor" v1.1.0:
// Changing default format breaks all callers who omitted the second argument!
export function parseDate(input: string, format = 'YYYY-MM-DD'): Date { /* ... */ }

// ❌ Accidental Breaking Change: Narrowing parameter type
// v1.0.0 accepted string | number; v1.1.0 accepting only string breaks existing number callers!
export function formatCurrency(amount: string): string { /* ... */ }
```

- [More detail on Semantic Versioning](https://semver.org/)
- [More detail on Backwards Compatibility](https://en.wikipedia.org/wiki/Backward_compatibility)

---

### Question c81afc65-98f6-4ac7-a5d5-58c41181678b

- How do you design APIs for the **"Pit of Success"** to make misuse virtually impossible?

### Answer

- **Pit of Success**: Designing APIs such that the easiest, most natural way to use the library is also the correct, secure, and performant way.
- **Eliminate positional parameter traps**: Avoid functions with more than 2 positional arguments (`createUser('John', 'Doe', true, false, 25)`). Use named option objects (`createUser({ firstName: 'John', lastName: 'Doe', isAdmin: false })`) to eliminate accidental argument swapping.
- **Safe defaults**: Default to the safe and defensive behavior (e.g. default to escaping HTML, default to `SameSite=Lax`, default to authenticated endpoints). Force callers to explicitly opt into dangerous or bypass behaviors.

```typescript
// ❌ Positional Trap: Extremely easy to accidentally swap boolean arguments
function fetchRecords(query: string, limit: number, skipCache: boolean, includeDeleted: boolean) {
  // fetchRecords('search', 20, false, true) vs fetchRecords('search', 20, true, false)
}

// ✅ Pit of Success (Options Object with Safe Defaults):
interface FetchRecordsOptions {
  query: string;
  limit?: number;
  skipCache?: boolean;
  includeDeleted?: boolean;
}

export function fetchRecords({
  query,
  limit = 20,
  skipCache = false, // Safe default: leverage cache
  includeDeleted = false, // Safe default: never expose deleted rows accidentally
}: FetchRecordsOptions) {
  // Self-describing call site: fetchRecords({ query: 'shoes', skipCache: true })
}
```

- [More detail on The Pit of Success](https://blog.codinghorror.com/falling-into-the-pit-of-success/)
- [More detail on Named Parameters vs Positional Arguments](https://martinfowler.com/bliki/NamedParameter.html)

---

### Question 97eecbd2-748b-4bc0-9d24-be2839b69b1a

- What is a professional **deprecation cycle** for shared packages and design system components?

### Answer

- **Step 1: Mark deprecated with replacement instructions**: Add JSDoc `@deprecated` annotation explaining the replacement API and link to documentation. IDEs will immediately show strikethroughs to consumers.
- **Step 2: Non-breaking runtime warnings**: In development builds (`process.env.NODE_ENV !== 'production'`), log a throttled warning to the browser console when the deprecated API is called.
- **Step 3: Provide automated codemods**: Distribute automated migration scripts (e.g., via `jscodeshift` or ESLint auto-fix) that automatically rewrite consumer code to the new API.
- **Step 4: Hard removal in next Major version**: Keep the deprecated API functional across minor releases; remove it only upon a bump of the `MAJOR` SemVer version.

```tsx
// Deprecating a legacy Button prop gracefully:
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * @deprecated Use `variant="destructive"` instead of `isDanger`. Will be removed in v3.0.0.
   */
  isDanger?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export function Button({ isDanger, variant = 'primary', ...props }: ButtonProps) {
  if (process.env.NODE_ENV !== 'production' && isDanger) {
    console.warn('[DesignSystem] Prop `isDanger` is deprecated. Use `variant="destructive"` instead.');
  }

  const computedVariant = isDanger ? 'destructive' : variant;
  return <button className={`btn-${computedVariant}`} {...props} />;
}
```

- [More detail on JSDoc Deprecated Tag](https://jsdoc.app/tags-deprecated.html)
- [More detail on Automated Refactoring with Codemods](https://github.com/facebook/jscodeshift)
