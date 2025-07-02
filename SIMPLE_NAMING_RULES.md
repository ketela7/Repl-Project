# Simple Naming Rules - Aturan Penamaan Sederhana

## 🎯 Tujuan
Menerapkan penamaan yang konsisten dan mudah dibaca di seluruh project untuk meningkatkan maintainability dan collaboration.

## 📋 Aturan Dasar

### 1. File Components (`.tsx`)
**Aturan**: PascalCase - setiap kata diawali huruf kapital
```
✅ BENAR:
- AppSidebar.tsx
- ItemsDeleteDialog.tsx
- UserProfile.tsx
- DriveManager.tsx

❌ SALAH:
- app-sidebar.tsx
- items-delete-dialog.tsx
- userProfile.tsx
- drive_manager.tsx
```

### 2. File Utilities (`.ts`)
**Aturan**: camelCase - huruf pertama kecil, kata berikutnya kapital
```
✅ BENAR:
- apiUtils.ts
- requestDeduplication.ts
- performanceUtils.ts
- validationUtils.ts

❌ SALAH:
- api-utils.ts
- request-deduplication.ts
- performance_utils.ts
- ValidationUtils.ts
```

### 3. React Hooks (`.ts`)
**Aturan**: camelCase dengan prefix "use"
```
✅ BENAR:
- useMobile.ts
- useTimezone.ts
- useSessionDuration.ts
- useAuthState.ts

❌ SALAH:
- use-mobile.ts
- use_timezone.ts
- UseMobile.ts
- mobile-hook.ts
```

### 4. Variables & Functions
**Aturan**: camelCase, tidak ada underscore prefix
```typescript
✅ BENAR:
const userData = await fetchUser()
function handleClick(event: MouseEvent) {}
const isLoading = false

❌ SALAH:
const user_data = await fetchUser()
function handle_click(_event: MouseEvent) {}
const _isLoading = false
```

### 5. Interfaces & Types
**Aturan**: PascalCase
```typescript
✅ BENAR:
interface UserProfile {
  name: string
  email: string
}

type DriveItem = {
  id: string
  name: string
}

❌ SALAH:
interface userProfile {
  name: string
  email: string
}

type drive_item = {
  id: string
  name: string
}
```

## 🔄 Migration Yang Telah Dilakukan

### File Renames
```bash
# Components (kebab-case → PascalCase)
nextauth-form.tsx → NextauthForm.tsx
search-params-handler.tsx → SearchParamsHandler.tsx
theme-switcher.tsx → ThemeSwitcher.tsx
app-sidebar.tsx → AppSidebar.tsx
auth-nav-user.tsx → AuthNavUser.tsx
nav-main.tsx → NavMain.tsx
nav-user.tsx → NavUser.tsx
sidebar-items.tsx → SidebarItems.tsx

# Dialog Components
items-delete-dialog.tsx → ItemsDeleteDialog.tsx
items-download-dialog.tsx → ItemsDownloadDialog.tsx
items-share-dialog.tsx → ItemsShareDialog.tsx
items-trash-dialog.tsx → ItemsTrashDialog.tsx
items-untrash-dialog.tsx → ItemsUntrashDialog.tsx
operations-dialog.tsx → OperationsDialog.tsx
items-copy-dialog.tsx → ItemsCopyDialog.tsx
items-move-dialog.tsx → ItemsMoveDialog.tsx

# Hooks (kebab-case → camelCase)
use-mobile.ts → useMobile.ts
use-timezone.ts → useTimezone.ts
use-session-duration.ts → useSessionDuration.ts

# Utils (kebab-case → camelCase)
request-deduplication.ts → requestDeduplication.ts
performance-utils.ts → performanceUtils.ts
web-vitals.ts → webVitals.ts
validation-utils.ts → validationUtils.ts
progressive-fields.ts → progressiveFields.ts
```

### Import Updates
Semua import statements telah diupdate untuk menggunakan nama file yang baru:
```typescript
// Lama
import { useMobile } from '@/lib/hooks/use-mobile'
import { ItemsDeleteDialog } from './items-delete-dialog'

// Baru
import { useMobile } from '@/lib/hooks/useMobile'
import { ItemsDeleteDialog } from './ItemsDeleteDialog'
```

## 🛠️ Tools & Scripts

### 1. Automated Naming Fix
```bash
# Jalankan script untuk memperbaiki penamaan
node scripts/fix-naming-violations.js
```

### 2. Import Reference Fix
```bash
# Jalankan script untuk memperbaiki import references
node scripts/fix-imports.js
```

### 3. Validation
```bash
# Check apakah semua aturan sudah diterapkan
npm run type:fast
npm run lint:fast
```

## 📝 Checklist untuk Developer

Sebelum commit, pastikan:

- [ ] **File Components**: Menggunakan PascalCase (ContohComponent.tsx)
- [ ] **File Utils**: Menggunakan camelCase (contohUtils.ts)
- [ ] **Hooks**: Menggunakan camelCase dengan prefix "use" (useContoh.ts)
- [ ] **Variables**: Tidak ada underscore prefix (_variable ❌)
- [ ] **Functions**: Menggunakan camelCase (functionName)
- [ ] **Interfaces**: Menggunakan PascalCase (InterfaceName)
- [ ] **Imports**: Semua import path sudah diupdate dengan nama file baru

## 🚫 Common Violations

### Yang Sering Dilanggar:
1. **Underscore Prefix**: `_variable`, `_function()` ❌
2. **Kebab Case Components**: `my-component.tsx` ❌  
3. **Snake Case Utils**: `my_utils.ts` ❌
4. **Inconsistent Hooks**: `use-hook.ts` ❌
5. **Lowercase Interfaces**: `interface myInterface` ❌

### Fix Yang Benar:
1. **Remove Underscore**: `variable`, `function()` ✅
2. **PascalCase Components**: `MyComponent.tsx` ✅
3. **CamelCase Utils**: `myUtils.ts` ✅
4. **CamelCase Hooks**: `useHook.ts` ✅
5. **PascalCase Interfaces**: `interface MyInterface` ✅

## 🔍 Enforcement

### Pre-commit Hooks
Git hooks akan mencegah commit jika ada pelanggaran naming:
```bash
# Setup hooks
node scripts/enforce-code-standards.js
```

### ESLint Rules
ESLint dikonfigurasi untuk mendeteksi pelanggaran naming:
```javascript
'@typescript-eslint/naming-convention': [
  'error',
  {
    'selector': 'parameter',
    'format': ['camelCase'],
    'leadingUnderscore': 'forbid' // TIDAK BOLEH UNDERSCORE
  }
]
```

## 📚 References

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Naming Conventions](https://react.dev/learn/thinking-in-react)
- [Next.js File Conventions](https://nextjs.org/docs/app/building-your-application/routing/colocation)

---
**Ingat**: Aturan ini dibuat untuk konsistensi dan readability. Semua developer HARUS mengikuti aturan ini tanpa pengecualian.