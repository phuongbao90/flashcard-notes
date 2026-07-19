# React

## React Memorization

### Question 52a6560d-3219-4608-9cd3-9268284964e5

- What is the purpose of useMemo in React?

### Answer

- allows to remember computed values between renders.

### Question c8c55e55-ff66-422e-82d0-4b24c9a014df

- What is the purpose of useCallback & useMemo in React?

### Answer

- help us optimize re-renders. They do this in two ways:
  - Reducing the amount of work that needs to be done in a given render.
  - Reducing the number of times that a component needs to re-render.

### Question b141e0a7-9c3a-4114-96f6-76dfaf66ab2e

- Can useMemo be used to replace useCallback?
- give example

### Answer

- yes, with useMemo you can return a anonymous function and it will be memoized
- useCallback is syntactic sugar. It exists purely to make our lives a bit nicer when trying to memoize callback functions.

```javascript
const handleMegaBoost = React.useCallback(() => {
  setCount((currentValue) => currentValue + 1234);
}, []);

const handleMegaBoost = React.useMemo(() => {
  return function () {
    setCount((currentValue) => currentValue + 1234);
  };
}, []);
```

### Question 61489bb2-7b89-4698-8df4-f3197c0840ed

- when should we memorize?

### Answer

- not strictly necessary but it can be useful in certain scenarios. You should consider memorization when:
  - Inside generic custom hooks
    ```javascript
    function useToggle(initialValue = false) {
      const [value, setValue] = React.useState(initialValue);
      const toggle = React.useCallback(() => {
        setValue((currentValue) => !currentValue);
      }, []);
      return [value, toggle];
    }
    ```
  - Inside context providers
    ```javascript
    function AuthProvider({ user, status, forgotPwLink, children }) {
      const memoizedValue = React.useMemo(() => {
        return {
          user,
          status,
          forgotPwLink,
        };
      }, [user, status, forgotPwLink]);
      return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
    }
    ```
