# Storybook & Component-Driven Testing

### Question a7985c2c-173f-4b84-aa0c-0e2b609ba6a1

- What does the **state-coverage mindset** mean in Storybook development, and why does building stories for edge states replace costly multi-step backend orchestration?

### Answer

- **The UI State explosion**: A production component does not exist in just one happy state. It must handle at least 6 canonical states:
  1. **Loading / Skeleton**: While async data is pending.
  2. **Empty / Zero-data**: When collections contain zero items (assert empty state guidance and CTA).
  3. **Error / Retry**: When API returns 400/500 (assert error message and retry action).
  4. **Boundary Content (Long text / Overflow)**: 150-character titles, unbroken URL strings, and emoji to test layout wrapping.
  5. **Internationalization (RTL & Multi-language)**: Right-to-left layout and German/Russian 200% string expansion.
  6. **Disabled / Read-only**: Unpermitted actions or frozen account states.
- **The Storybook advantage**: Orchestrating these 6 states in a running full-stack app requires complex database seeds, network interceptors, or mocked backend flags. In Storybook, each state is defined as an isolated story with pure props, making edge states viewable in one click.

```tsx
// ProductCard.stories.tsx - State-coverage through stories
import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';

const meta: Meta<typeof ProductCard> = { component: ProductCard };
export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = { args: { title: 'Running Shoes', price: 99 } };
export const EmptyStock: Story = { args: { title: 'Running Shoes', price: 99, inStock: false } };
export const ExtremeOverflowTitle: Story = {
  args: {
    title: 'Super Ultra Lightweight Ergonomic Carbon Fiber Professional Marathon Racing Shoes With Dynamic Cushioning',
    price: 299,
  },
};
export const LoadingSkeleton: Story = { args: { isLoading: true } };
```

- [More detail on Component Story Format](https://storybook.js.org/docs/api/csf)
- [More detail on Component-Driven Development](https://www.componentdriven.org/)

---

### Question 7bacb73a-bda1-48bc-9c45-8adb6a21ac2d

- How do Storybook **`play` functions** and `@storybook/test` bridge the gap between static component documentation and automated functional testing?

### Answer

- **Component tests inside documentation**:
  - Historically, Storybook was only for manual visual inspection, while Vitest/Jest ran interaction tests in headlessly simulated JSDOM.
  - **`play` functions**: Small snippets of code that execute after a story finishes rendering in Storybook.
  - Powered by `@storybook/test` (combining Testing Library queries and Vitest assertions) running directly in a real browser.
- **Benefits**:
  - **Live visual debugging**: When an interaction test fails, developers can visually inspect the interactive DOM state in the browser rather than parsing CLI terminal output.
  - **Reusability**: Stories with `play` functions can be automatically executed in CI as automated regression tests using the Storybook Test Runner.

```tsx
// LoginForm.stories.tsx - Component interaction test within Storybook
import { expect, userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = { component: LoginForm };
export default meta;

export const InvalidSubmission: StoryObj<typeof LoginForm> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitBtn = canvas.getByRole('button', { name: /sign in/i });

    // Step 1: Click submit with empty credentials
    await userEvent.click(submitBtn);

    // Step 2: Assert validation message appears
    await expect(canvas.getByText(/email is required/i)).toBeInTheDocument();
  },
};
```

- [More detail on Storybook Interaction Testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [More detail on Storybook Test Runner](https://storybook.js.org/docs/writing-tests/test-runner)

---

### Question fe40c725-0a5a-417a-8d09-8eddb70f9650

- How do you integrate **Mock Service Worker (MSW)** and the **Accessibility Addon (`@storybook/addon-a11y`)** into Storybook to build automated quality gates per component?

### Answer

- **MSW Addon integration (`msw-storybook-addon`)**:
  - Allows mocking network requests directly inside story parameters (`parameters.msw.handlers = [http.get(...)]`).
  - Components that fetch data internally (via `fetch` or TanStack Query) can render live loading, error, and populated states inside Storybook without hitting real backend APIs.
- **A11y Addon (`@storybook/addon-a11y`)**:
  - Runs `axe-core` automatically against every rendered story in real time.
  - Highlights accessibility violations (color contrast, missing ARIA labels, invalid tab indexes) in the Storybook bottom panel.
  - In CI, the Storybook Test Runner fails the build if any story contains non-whitelisted accessibility violations.

```tsx
// UserList.stories.tsx - MSW handlers attached per story
import { http, HttpResponse } from 'msw';
import { UserList } from './UserList';

export default { component: UserList };

export const ErrorState = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users', () => new HttpResponse(null, { status: 500 })),
      ],
    },
    // Enforce strict WCAG violations check
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
};
```

- [More detail on MSW with Storybook](https://storybook.js.org/docs/writing-stories/build-pages-with-storybook#mocking-api-services)
- [More detail on Storybook Accessibility Testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
