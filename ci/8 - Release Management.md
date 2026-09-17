# Release Management

### Question fc3d1170-5df9-4d8e-9952-d3933f9dc50f

- Explain the senior principle **Deploy ≠ Release**, and how feature flags enable dark launching and instant kill switches without triggering redeployments.

### Answer

- **Decoupling deployment from release**:
  - **Deployment**: The mechanical act of installing and running software artifacts in a production environment (an engineering-driven, low-risk, continuous activity).
  - **Release**: The business act of making a feature accessible and visible to customers (a product-driven, business-timed decision).
- **Dark launching**:
  - New code and UI paths are deployed to production completely dark (hidden behind a disabled feature flag evaluation: `if (flag('new-search'))`).
  - Backend queries and load can be tested silently in the background (e.g., dual-writing or shadow-querying) without end-user impact.
- **Instant kill switch**:
  - If a production memory leak or critical bug occurs, disabling the feature flag in the configuration dashboard turns off the offending UI path in under 1 second globally.
  - Redeploying a rollback via CI requires 15–30 minutes of pipeline execution; a flag flip resolves the customer incident instantaneously.

```typescript
// ✅ Decoupling deployment from customer exposure via feature flags
export function PaymentMethodList() {
  const isApplePayEnabled = useFeatureFlag('enable-apple-pay-v2');

  return (
    <div className="space-y-4">
      <CreditCardForm />
      {/* Dark launched until finance & compliance give release sign-off */}
      {isApplePayEnabled && <ApplePayButton />}
    </div>
  );
}
```

- [More detail on Decoupling Deployment from Release](https://martinfowler.com/articles/feature-toggles.html#DecouplingDeploymentFromRelease)

---

### Question d107a664-cd8a-495b-ac49-4405670da139

- What is **Progressive Delivery** (Canary flag rollouts), and how does an engineering team coordinate metrics-driven percentage rollouts to minimize blast radius?

### Answer

- **Progressive Delivery definition**: Incrementally exposing a newly deployed feature to expanding rings or percentages of real users while observing telemetry and error budgets.
- **Canary rollout stages**:
  1. **Internal Dogfooding (Ring 0)**: Feature enabled strictly for company employees (`user.email.endsWith('@company.com')`).
  2. **Canary 1% (Ring 1)**: Exposed to a random, deterministic 1% hash of active users (`hash(userId + flagKey) % 100 < 1`).
  3. **Expansion 10% → 50% (Ring 2)**: Monitored for error anomalies and performance regressions over a defined observation window (e.g., 2–4 hours).
  4. **Full Promotion 100% (Ring 3)**: Complete customer release.
- **Automated rollbacks via metric triggers**: Modern flag platforms (LaunchDarkly, Statsig) correlate flag exposure with Sentry error rates and conversion metrics. If the 1% canary cohort experiences a 0.5% spike in unhandled exceptions, the flag is halted or rolled back automatically.

- [More detail on Progressive Delivery with Feature Flags](https://martinfowler.com/articles/feature-toggles.html#CanaryRelease)

---

### Question 261f237d-75e2-4855-b971-f2dc56380424

- Why is **Feature Flag Debt** one of the most insidious forms of frontend technical debt, and what automated processes prevent the codebase from becoming an unmaintainable web of obsolete toggles?

### Answer

- **The flag debt crisis**:
  - Leaving permanently enabled flags in code creates exponential combinatorial code paths (`2^N` possible application states that cannot be realistically tested).
  - Dead branches bloat bundle size and confuse future developers about which code is active.
  - An engineer accidentally toggling an abandoned, 2-year-old flag can resurrect obsolete, broken business logic.
- **Senior Flag Governance Process**:
  1. **Treat flags as temporary loans**: Every release flag must have an assigned owner and an explicit expiration date (e.g., maximum 30 days post-100% rollout).
  2. **Automated CI flag audits**: Implement linters or bots (e.g., Uber's Piranha or custom AST scripts) that query the flag provider API. If a flag has been 100% active for >14 days, CI raises a warning or automatically generates a cleanup PR deleting the flag check and dead branch.
  3. **Flag cleanup sprint quota**: Dedicate team capacity every quarter to delete dead flags and their surrounding conditional logic.

```typescript
// ❌ Flag Debt: Flag has been 100% rolled out for 6 months but remains in code
if (flags.useNewCheckoutFlow) {
  return <NewCheckout />;
} else {
  return <OldCheckout />; // Dead code still bundled and sent to all users!
}
```

- [More detail on Uber Piranha for Automated Feature Flag Cleanup](https://github.com/uber/piranha)

---

### Question 2c978458-5701-48c7-bce2-aabf0284808d

- A frontend application and a backend microservice deploy independently. The backend needs to rename a critical API field (`userId` → `accountUuid`). How do you execute the **Expand/Contract Pattern** to avoid production downtime?

### Answer

- **The independent deployment synchronization problem**: Frontend and backend cannot deploy simultaneously in zero-downtime architectures. If backend renames a field first, the active frontend crashes; if frontend updates first, it reads `undefined` from the un-migrated backend.
- **Expand/Contract (Parallel Run) execution steps**:
  1. **Phase 1 — Expand (Backend)**: Backend adds the new field `accountUuid` while maintaining the old field `userId` (populating both). Deployed independently with zero frontend changes.
  2. **Phase 2 — Transition (Frontend)**: Frontend deploys code that reads the new field with fallback: `data.accountUuid ?? data.userId`.
  3. **Phase 3 — Contract (Frontend)**: Once verified, frontend fully relies on `data.accountUuid` and drops all references to `userId`.
  4. **Phase 4 — Contract (Backend)**: Once logs confirm zero incoming traffic reads `userId`, backend deletes the deprecated field.

```typescript
// ✅ Phase 2: Schema-tolerant frontend code handling both old and new backend fields
interface UserResponse {
  userId?: string;      // Deprecated field
  accountUuid?: string; // New field
}

export function parseUserAccount(data: UserResponse): string {
  const resolvedId = data.accountUuid ?? data.userId;
  if (!resolvedId) throw new Error('Malformed user payload');
  return resolvedId;
}
```

- [More detail on the Expand and Contract Pattern](https://martinfowler.com/bliki/ParallelRun.html)
