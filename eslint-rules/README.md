# Custom ESLint Rules for React Development

This directory contains simplified custom ESLint rules focused on practical React development patterns.

## Available Rules

### Basic React Rules (`react-async-state.js`)

#### `fetch-needs-error-handling`
**Type**: Suggestion  
**Description**: Ensures fetch calls include proper error handling

```typescript
// ❌ BAD - Missing error handling
fetch('/api/data').then(response => {
  setData(response.data);
});

// ✅ GOOD - With error handling
fetch('/api/data')
  .then(response => setData(response.data))
  .catch(error => console.error('Fetch failed:', error));

// ✅ GOOD - With try/catch
try {
  const response = await fetch('/api/data');
  setData(response.data);
} catch (error) {
  console.error('Fetch failed:', error);
}
```

#### `useEffect-needs-cleanup`
**Type**: Suggestion  
**Description**: useEffect with side effects should return cleanup function

```typescript
// ❌ BAD - Missing cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    setData('updated');
  }, 1000);
}, []);

// ✅ GOOD - With cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    setData('updated');
  }, 1000);

  return () => clearTimeout(timer);
}, []);
```

### TypeScript Rules (`typescript-async-state.js`)

#### `async-needs-abort-controller`
**Type**: Suggestion  
**Description**: Async functions with fetch should use AbortController

```typescript
// ❌ BAD - Missing AbortController
const fetchData = async () => {
  const response = await fetch('/api/data');
  return response.json();
};

// ✅ GOOD - With AbortController
const fetchData = async (signal: AbortSignal) => {
  const response = await fetch('/api/data', { signal });
  return response.json();
};
```

## Usage

These rules are integrated into the project's ESLint configuration. Run:

```bash
npm run lint
```

## Testing

Test the rules with:

```bash
npm run test:eslint-rules
```

This will verify that the ESLint configuration is working correctly with TypeScript and React.