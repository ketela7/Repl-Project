# Custom ESLint Rules untuk React Async State Issues

Dokumen ini menjelaskan custom ESLint rules yang dibuat untuk mendeteksi dan mencegah masalah **Async State Race Conditions** yang sering terjadi dalam aplikasi React.

## Masalah yang Diselesaikan

### 1. **React State Batching Issues**
React menggabungkan state updates secara asynchronous, menyebabkan nilai state tidak langsung tersedia setelah `setState()`.

### 2. **Race Conditions**
Multiple async operations yang berjalan bersamaan dapat saling menimpa hasil satu sama lain.

### 3. **Stale Closures**
Function closures yang menggunakan nilai state lama karena tidak ter-update.

### 4. **Memory Leaks**
State updates yang terjadi setelah component unmount.

## ESLint Rules yang Tersedia

### Basic Rules (`react-async-state.js`)

#### `no-immediate-state-access`
**Severity**: Error  
**Deteksi**: Akses state langsung setelah setState

```typescript
// ❌ BAD - akan detect error
setCount(5);
if (count === 5) { // Error: count mungkin masih nilai lama
  // ...
}

// ✅ GOOD
setCount(5);
setCount(prev => {
  if (prev === 5) { // Gunakan functional update
    // ...
  }
  return prev;
});
```

#### `require-abort-controller`
**Severity**: Warning  
**Deteksi**: fetch() tanpa AbortController

```typescript
// ❌ BAD
fetch('/api/data', {
  method: 'POST',
  body: formData
});

// ✅ GOOD
fetch('/api/data', {
  method: 'POST',
  body: formData,
  signal: abortController.signal
});
```

#### `state-collection-needs-ref`
**Severity**: Warning  
**Deteksi**: useState dengan Set/Map tanpa useRef

```typescript
// ❌ BAD
const [selectedItems, setSelectedItems] = useState(new Set());

// ✅ GOOD
const [selectedItems, setSelectedItems] = useState(new Set());
const selectedItemsRef = useRef(new Set());
```

#### `complex-state-needs-reducer`
**Severity**: Warning  
**Deteksi**: Complex state object (3+ properties) yang harus pakai useReducer

```typescript
// ❌ BAD
const [dialogState, setDialogState] = useState({
  upload: false,
  createFolder: false,
  details: false,
  preview: false
});

// ✅ GOOD
const [dialogState, dispatch] = useReducer(dialogReducer, initialState);
```

### Advanced TypeScript Rules (`typescript-async-state.js`)

#### `useState-stale-closure`
**Severity**: Error  
**Deteksi**: Stale closure dalam useCallback/useEffect

```typescript
// ❌ BAD
const [count, setCount] = useState(0);
const handleClick = useCallback(() => {
  console.log(count); // Stale closure!
}, []); // count tidak ada di dependencies

// ✅ GOOD
const handleClick = useCallback(() => {
  console.log(count);
}, [count]); // Dependencies lengkap
```

#### `async-state-error-handling`
**Severity**: Warning  
**Deteksi**: Async function tanpa AbortError handling

```typescript
// ❌ BAD
try {
  const response = await fetch('/api/data');
} catch (error) {
  toast.error('Failed'); // Tidak membedakan AbortError
}

// ✅ GOOD
try {
  const response = await fetch('/api/data');
} catch (error) {
  if (error.name === 'AbortError') return; // Handle abort
  toast.error('Failed');
}
```

#### `useEffect-cleanup-required`
**Severity**: Warning  
**Deteksi**: useEffect dengan async ops tanpa cleanup

```typescript
// ❌ BAD
useEffect(() => {
  const timer = setTimeout(() => {
    setData('new data');
  }, 1000);
}, []);

// ✅ GOOD
useEffect(() => {
  const timer = setTimeout(() => {
    setData('new data');
  }, 1000);

  return () => clearTimeout(timer); // Cleanup
}, []);
```

#### `prevent-state-update-unmounted`
**Severity**: Error  
**Deteksi**: State update setelah component unmount

```typescript
// ❌ BAD
const fetchData = async () => {
  const response = await fetch('/api/data');
  setData(response); // Bisa terjadi setelah unmount
};

// ✅ GOOD
const fetchData = async () => {
  const response = await fetch('/api/data', {
    signal: abortController.signal
  });
  if (!abortController.signal.aborted) {
    setData(response);
  }
};
```

#### `sequential-state-race`
**Severity**: Error  
**Deteksi**: Sequential state updates yang bisa race

```typescript
// ❌ BAD
setLoading(true);
setError(null);
setData(null);
setLoading(false); // Race condition possible

// ✅ GOOD
dispatch({ type: 'FETCH_START' });
dispatch({ type: 'FETCH_SUCCESS', payload: data });
```

## Penggunaan

### 1. Instalasi Rules

Rules sudah terintegrasi dalam `.eslintrc.strict.js`:

```javascript
// CUSTOM ASYNC STATE RULES - MENCEGAH RACE CONDITIONS
'async-state/no-immediate-state-access': 'error',
'async-state/require-abort-controller': 'warn',
'async-state/state-collection-needs-ref': 'warn',
'async-state/require-search-debounce': 'warn',
'async-state/complex-state-needs-reducer': 'warn',
```

### 2. Menjalankan Check

```bash
# Quick check
npm run lint:fast

# Full check
npm run lint

# Auto-fix yang bisa
npm run lint -- --fix
```

### 3. Pre-commit Hook

Rules akan otomatis dijalankan sebelum commit untuk memastikan code quality.

## Best Practices

### 1. **Gunakan useRef untuk Immediate Access**
```typescript
const [items, setItems] = useState(new Set());
const itemsRef = useRef(new Set());

const updateItems = (newItems) => {
  setItems(newItems);
  itemsRef.current = newItems; // Immediate access
};
```

### 2. **Selalu Gunakan AbortController**
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const fetchData = async () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  abortControllerRef.current = new AbortController();

  try {
    const response = await fetch('/api/data', {
      signal: abortControllerRef.current.signal
    });
    // Handle response
  } catch (error) {
    if (error.name === 'AbortError') return;
    // Handle real errors
  }
};
```

### 3. **Debounce Search Inputs**
```typescript
const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleSearchChange = (query: string) => {
  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  searchTimeoutRef.current = setTimeout(() => {
    setSearchQuery(query);
    performSearch(query);
  }, 300);
};
```

### 4. **UseReducer untuk Complex State**
```typescript
const dialogReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_DIALOG':
      return { ...state, [action.dialog]: true };
    case 'CLOSE_ALL':
      return Object.keys(state).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
    default:
      return state;
  }
};

const [dialogState, dispatch] = useReducer(dialogReducer, initialState);
```

## Kontribusi

Untuk menambah rules baru:

1. Edit `eslint-rules/react-async-state.js` atau `eslint-rules/typescript-async-state.js`
2. Tambahkan rule ke `.eslintrc.strict.js`
3. Update dokumentasi ini
4. Test dengan contoh kode yang sesuai

## Testing Rules

Buat test case untuk memverifikasi rules:

```typescript
// Test file: __tests__/eslint-rules.test.js
describe('Async State ESLint Rules', () => {
  it('should detect immediate state access', () => {
    const code = `
      setCount(5);
      if (count === 5) {
        console.log('detected');
      }
    `;
    // Assert rule violation
  });
});