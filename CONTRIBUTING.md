# Contributing Guidelines - Aturan Ketat untuk Semua Developer

## 🚨 PENTING: Wajib Dibaca Sebelum Berkontribusi

Project ini menerapkan **standar coding yang sangat ketat**. Setiap pelanggaran akan menyebabkan pull request **DITOLAK** tanpa diskusi.

## Pre-Commit Checklist (WAJIB)

Sebelum melakukan commit, pastikan semua poin berikut sudah dicentang:

- [ ] **ESLint Check**: Jalankan `npm run strict-lint` - HARUS 0 errors, 0 warnings
- [ ] **TypeScript Check**: Jalankan `npm run type:fast` - HARUS 0 errors
- [ ] **Test Coverage**: Semua file baru harus memiliki test coverage minimal 80%
- [ ] **No Console Logs**: Tidak ada `console.log`, `console.warn`, atau `console.error`
- [ ] **No `any` Type**: Semua variabel harus memiliki type yang spesifik
- [ ] **Proper Error Handling**: Gunakan `unknown` untuk catch blocks

## Aturan ESLint yang TIDAK BOLEH DILANGGAR

### 1. TypeScript Rules (FATAL ERRORS)
```typescript
// ❌ SALAH - akan menyebabkan build gagal
const data: any = response.json()
const result = data.items

// ✅ BENAR
interface ApiResponse {
  items: DriveItem[]
}
const data: ApiResponse = await response.json()
const result = data.items
```

### 2. No Unused Variables/Imports
```typescript
// ❌ SALAH - akan menyebabkan ESLint error
import { useState, useEffect, useMemo } from 'react' // useMemo tidak digunakan
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false) // loading tidak digunakan

// ✅ BENAR
import { useState, useEffect } from 'react'
const [data, setData] = useState(null)
```

### 3. Error Handling yang Benar
```typescript
// ❌ SALAH
try {
  const data = await fetchData()
} catch (error: any) {
  console.log(error.message) // Console log + any type
}

// ✅ BENAR
try {
  const data = await fetchData()
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  // Handle error dengan proper error handling
}
```

### 4. Naming Conventions (SANGAT KETAT)
```typescript
// ❌ SALAH - underscore tidak diperbolehkan di parameter
function handleClick(_event: MouseEvent, _data: unknown) {}

// ✅ BENAR
function handleClick(event: MouseEvent, data: unknown) {}

// ❌ SALAH - interface tidak menggunakan PascalCase
interface userProfile {
  name: string
}

// ✅ BENAR
interface UserProfile {
  name: string
}
```

## Workflow Development yang Ketat

### 1. Sebelum Mulai Development
```bash
# Jalankan penegakan standar
npm run enforce-standards

# Pastikan environment bersih
npm run clean:all
npm install
```

### 2. Selama Development
```bash
# Check code quality (WAJIB setiap 30 menit)
npm run strict-lint
npm run type:fast

# Jika ada error, HARUS diperbaiki sebelum melanjutkan
```

### 3. Sebelum Commit
```bash
# Final check (WAJIB)
npm run pre-commit

# Jika gagal, TIDAK BOLEH commit sampai diperbaiki
```

## File Naming Conventions

### Components
```
✅ BENAR: UserProfile.tsx, DriveManager.tsx, StorageAnalytics.tsx
❌ SALAH: userProfile.tsx, drive-manager.tsx, storage_analytics.tsx
```

### Hooks
```
✅ BENAR: useUserProfile.ts, useDriveManager.ts
❌ SALAH: UserProfile.hook.ts, user-profile-hook.ts
```

### Utilities
```
✅ BENAR: api-utils.ts, format-helpers.ts
❌ SALAH: apiUtils.ts, formatHelpers.ts
```

## Security Requirements (TIDAK BOLEH DILANGGAR)

### 1. Environment Variables
```typescript
// ❌ SALAH - hardcode secrets
const API_KEY = "sk-1234567890abcdef"

// ✅ BENAR - menggunakan environment variables
const API_KEY = process.env.GOOGLE_CLIENT_SECRET
if (!API_KEY) {
  throw new Error('GOOGLE_CLIENT_SECRET is required')
}
```

### 2. Input Validation
```typescript
// ❌ SALAH - tidak ada validasi
function updateFile(fileId: string, data: any) {
  // Langsung pakai data tanpa validasi
}

// ✅ BENAR - dengan validasi
function updateFile(fileId: string, data: unknown) {
  if (typeof fileId !== 'string' || !fileId.trim()) {
    throw new Error('Invalid file ID')
  }
  
  // Validasi data dengan zod atau similar
}
```

## Performance Requirements

### 1. Bundle Size
- Setiap PR yang menambah >100KB ke bundle size HARUS dijelaskan
- Gunakan dynamic imports untuk components yang besar
- Optimasi imports dari libraries

### 2. API Calls
- Maksimal 25 requests per detik (sudah ada throttling)
- Wajib menggunakan cache untuk data yang tidak berubah sering
- Error handling dengan retry mechanism

## Testing Requirements (WAJIB)

### 1. Unit Tests
- Setiap utility function HARUS memiliki test
- Coverage minimal 80% untuk file baru
- Test file: `ComponentName.test.tsx` atau `functionName.test.ts`

### 2. Integration Tests
- Setiap API route HARUS memiliki integration test
- Mock external dependencies (Google Drive API)

## Troubleshooting ESLint Issues

### Issue: ESLint Timeout
```bash
# Jika ESLint hang/timeout, jalankan per direktori
npx eslint src/components --ext .ts,.tsx --fix
npx eslint src/lib --ext .ts,.tsx --fix
npx eslint src/app --ext .ts,.tsx --fix
```

### Issue: TypeScript Errors
```bash
# Check dengan detail
npx tsc --noEmit --listFiles | grep error
```

### Issue: Git Hooks Tidak Jalan
```bash
# Setup ulang git hooks
node scripts/enforce-code-standards.js
chmod +x .git/hooks/pre-commit
```

## Enforcement

### Automatic Checks
- Pre-commit hooks akan mencegah commit jika ada pelanggaran
- CI/CD akan menolak PR yang tidak memenuhi standar
- Build akan gagal jika ada TypeScript atau ESLint errors

### Manual Review
- Semua PR akan direview secara manual
- Code review akan sangat ketat terhadap:
  - Security issues
  - Performance problems
  - Code quality violations
  - Missing tests

## Resources

- [ESLint Configuration](.eslintrc.strict.js)
- [Enforcement Script](scripts/enforce-code-standards.js)
- [TypeScript Config](tsconfig.json)

## Bantuan

Jika mengalami kesulitan dengan standar ini:

1. Jalankan `npm run enforce-standards` untuk auto-fix yang mungkin
2. Check documentation di file config
3. Lihat contoh code di components yang sudah ada
4. Tanya di team chat untuk clarification

**Ingat: Standar ini dibuat untuk menjaga kualitas code dan keamanan aplikasi. Tidak ada pengecualian.**