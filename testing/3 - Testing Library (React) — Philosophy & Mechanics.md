# Testing Library (React) — Philosophy & Mechanics

### Question 4777fa47-2130-4b11-9d91-4aebd0847d0d

- Why is the **Testing Library Query Priority Ladder** structured with `getByRole` at the top and `getByTestId` at the bottom, and how does this ladder act as an accessibility forcing function?

### Answer

- **The guiding principle**: "The more your tests resemble the way your software is used, the more confidence they can give you." Users find elements by their semantic role and label, not CSS class names or arbitrary test attributes.
- **The Priority Ladder**:
  1. **`getByRole`**: Matches elements accessible to assistive tech via their ARIA role and accessible name (`getByRole('button', { name: /save/i })`).
  2. **`getByLabelText`**: Essential for form inputs; guarantees that labels are programmatically associated with inputs via `htmlFor`/`id`.
  3. **`getByPlaceholderText` / `getByText`**: For non-interactive text content (paragraphs, headings, helper text).
  4. **`getByTestId`**: Last resort escape hatch. Reserved exclusively for dynamic text, SVG graphs, or un-nameable containers where no accessible role exists.
- **The A11y forcing function**: If a button or input cannot be queried using `getByRole`, it is unlocatable by screen readers. The test failure forces engineers to add proper semantic HTML (`<button>` instead of `<div onClick>`), `aria-label`, or associated `<label>` elements before the test will pass.

```tsx
// ❌ Poor Practice: Bypasses accessibility tree, tests nothing about screen-reader usability
render(<div className="submit-btn" data-testid="submit-button" onClick={handleSubmit}>Save</div>);
const btn = screen.getByTestId('submit-button'); // Test passes, but keyboard & screen readers are broken!

// ✅ Best Practice: Enforces accessible HTML structure
render(<button type="submit" aria-label="Save changes">Save</button>);
const btn = screen.getByRole('button', { name: /save changes/i }); // Validates role and accessible name
```

- [More detail on Testing Library Priority Guide](https://testing-library.com/docs/queries/about#priority)
- [More detail on Accessible Name Computation](https://www.w3.org/TR/accname-1.1/)

---

### Question cbd77a07-315f-4505-b01e-dba33c515194

- What critical user interaction bugs are missed when using `fireEvent` that **`userEvent`** faithfully replicates, and why should `userEvent` be the universal default?

### Answer

- **`fireEvent` executes single synthetic events**: Calling `fireEvent.click(button)` dispatches a isolated synthetic DOM `click` event directly to the target element. It ignores whether the element is focused, visible, or disabled.
- **`userEvent` simulates real browser lifecycles**: Calling `await user.click(button)` simulates the exact sequence of events an actual user generates in a browser:
  1. Moves cursor to coordinates (`mousemove`, `pointerover`, `mouseover`).
  2. Checks element actionable state: does nothing if the element has `pointer-events: none` or is `disabled`!
  3. Triggers `pointerdown` and `mousedown`.
  4. Moves browser focus to the element (`focus`, `focusin`).
  5. Triggers `pointerup`, `mouseup`, and finally `click`.
- **Missed bug example (Typing into an input)**:
  - `fireEvent.change(input, { target: { value: 'abc' } })` instantly mutates the input value without firing `keydown`, `keypress`, `keyup`, or updating selection range. Form masking, input debouncing, and keydown preventDefault logic are completely bypassed.
  - `await user.type(input, 'abc')` fires all keyboard events per character, catching input-masking bugs and validation handlers.

```tsx
// ❌ fireEvent: Bypasses 'disabled' pointer-event checks and input lifecycle
fireEvent.click(disabledButton); // May still trigger handlers if component has flaws!
fireEvent.change(maskedPhoneInput, { target: { value: '1234567890' } }); // Bypasses auto-format mask!

// ✅ userEvent: Replicates real browser behavior
const user = userEvent.setup();
await user.click(disabledButton); // Accurately blocked by browser pointer-events
await user.type(maskedPhoneInput, '1234567890'); // Triggers keydown, auto-formats to (123) 456-7890
```

- [More detail on user-event vs fireEvent](https://testing-library.com/docs/user-event/intro)
- [More detail on Testing User Interactions](https://kentcdodds.com/blog/user-event)

---

### Question db6d6769-fee7-4749-bf83-af34cfd6307a

- How do you apply **async discipline** in React Testing Library, and what is the definitive difference between `findBy*` and `waitFor`?

### Answer

- **The Async Rule**: Never use arbitrary `sleep()` or `setTimeout()` in tests. Tests must wait for explicit observable DOM conditions. Arbitrary sleeps either waste CI time (too long) or produce flaky builds under CI load (too short).
- **`findBy*` (Best for element appearance)**:
  - Combination of `getBy*` and `waitFor`.
  - Continuously retries querying the DOM until the element appears or times out (default 1000ms).
  - Use when asserting that an element will appear after an asynchronous action (network response, timer).
- **`waitFor` (Best for assertions & element disappearance)**:
  - Retries a callback assertion until it stops throwing.
  - Use for asserting that an element disappears (`expect(screen.queryByText(...)).not.toBeInTheDocument()`), or checking non-query assertions (e.g. `expect(mockFn).toHaveBeenCalled()`).
  - **Rule**: Keep `waitFor` callbacks minimal. Never execute side-effects or user actions inside `waitFor`.

```tsx
// ❌ Dangerous: Arbitrary sleep creates flaky tests
await new Promise((r) => setTimeout(r, 500));
expect(screen.getByText(/loaded/i)).toBeInTheDocument();

// ❌ Anti-pattern: Placing action inside waitFor
await waitFor(async () => {
  await user.click(screen.getByRole('button')); // Action executed repeatedly on retry!
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ✅ Correct Async Discipline
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: /submit/i }));

// 1. findBy* to wait for dynamic appearance
const alert = await screen.findByRole('alert');
expect(alert).toHaveTextContent(/submission successful/i);

// 2. waitFor to verify disappearance of loading spinner
await waitFor(() => {
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
```

- [More detail on Testing Library Async Methods](https://testing-library.com/docs/dom-testing-library/api-async)
- [More detail on Common Mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#using-waitfor-incorrectly)

---

### Question c02473b4-b7dc-4ef5-8239-eeb1c7809d55

- Why do React **`act(...)` warnings** occur, and how do you resolve them cleanly without blindly wrapping test actions in `act()`?

### Answer

- **What `act()` signifies**: React warns: *"An update to Component inside a test was not wrapped in act(...)"* when a state update (e.g., `useState`, `useReducer`, or hook transition) occurs after test execution completed or outside React's knowledge.
- **The root cause**: Almost always an **un-awaited asynchronous operation**. A component triggered an async `fetch`, a timer, or a resolved promise that updated state after the test finished its assertions and unmounted.
- **The Anti-Pattern**: Blindly wrapping `act(() => { ... })` around renders or actions suppresses the symptom but ignores the bug: you have pending un-awaited state transitions.
- **The Proper Fix**: Identify the async transition that triggered the late state change and await its observable DOM consequence with `findBy*` or `waitFor`.

```tsx
// ❌ Wrong fix: Blindly wrapping act() silences warning but leaves state unverified
await act(async () => {
  render(<UserProfile userId="1" />);
});

// ✅ Proper fix: Await the DOM outcome of the asynchronous state change
render(<UserProfile userId="1" />);
// Awaiting the final rendered data state ensures React finishes updating before test finishes
expect(await screen.findByText(/welcome, alex/i)).toBeVisible();
```

- [More detail on act() in React Testing](https://react.dev/reference/react/act)
- [More detail on Fixing the 'Not Wrapped in act()' Warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)

---

### Question 1ee8e5c2-14d6-4fd0-9e57-5f0eb7c6a4cc

- What are the top **implementation-detail assertions** that should NEVER be written in frontend component tests, and what should be asserted instead?

### Answer

- **Smell 1: Asserting internal component state**
  - *Don't assert*: `expect(component.state.count).toBe(2)`.
  - *Assert instead*: `expect(screen.getByRole('spinbutton')).toHaveValue(2)`.
- **Smell 2: Asserting prop drilling and intermediate component props**
  - *Don't assert*: `expect(childComponent.prop('isActive')).toBe(true)`.
  - *Assert instead*: What the prop causes in the DOM: `expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(/active tab/i)`.
- **Smell 3: Asserting private helper function call counts via spies**
  - *Don't assert*: `expect(spyOnInternalCalculateTotal).toHaveBeenCalledTimes(1)`.
  - *Assert instead*: The calculated output displayed to the user: `expect(screen.getByText(/total: \$120\.00/i)).toBeVisible()`.
- **Smell 4: Asserting specific CSS class names or tag hierarchies**
  - *Don't assert*: `expect(div).toHaveClass('container-fluid-xyz')`.
  - *Assert instead*: Visual or functional attribute: `expect(element).toBeVisible()`, or test via visual regression.

```tsx
// ❌ Implementation details: Tightly coupled to internal architecture
it('handles counter click (bad)', () => {
  const spy = vi.spyOn(CounterComponent.prototype, 'handleIncrement');
  render(<CounterComponent />);
  fireEvent.click(screen.getByRole('button'));
  expect(spy).toHaveBeenCalledTimes(1); // Fails if method is renamed or converted to hook!
});

// ✅ Behavioral assertion: Survives any refactor
it('increments counter value displayed to user (good)', async () => {
  const user = userEvent.setup();
  render(<CounterComponent />);
  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText(/count: 1/i)).toBeVisible();
});
```

- [More detail on Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [More detail on Testing Library Philosophy](https://testing-library.com/docs/guiding-principles)
