# Google Drive Pro - API Documentation

## Overview

Dokumentasi API lengkap untuk aplikasi Google Drive Pro. Semua endpoint memerlukan autentikasi melalui NextAuth.js Google OAuth 2.0.

## Base URL

```
http://localhost:5000/api (development)
https://your-domain.com/api (production)
```

## Authentication

Semua endpoint API memerlukan autentikasi. Aplikasi menggunakan NextAuth.js dengan Google OAuth 2.0.

### Required Headers

```
Cookie: next-auth.session-token=<session-token>
Content-Type: application/json
```

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 📁 Files API

### 1. Get Files List
Mengambil daftar file dari Google Drive dengan berbagai filter dan sorting options.

```http
GET /api/drive/files
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `folderId` | string | No | 'root' | ID folder parent |
| `pageSize` | number | No | 50 | Jumlah item per halaman (50, 100, 250, 500, 1000) |
| `pageToken` | string | No | - | Token untuk pagination |
| `q` | string | No | - | Query pencarian Google Drive |
| `sortBy` | string | No | 'modified' | Field untuk sorting: 'name', 'modified', 'created', 'size' |
| `sortOrder` | string | No | 'desc' | Urutan sorting: 'asc', 'desc' |

**Example Request:**
```bash
curl "http://localhost:5000/api/drive/files?pageSize=100&sortBy=name&sortOrder=asc"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "1abc123def456",
        "name": "document.pdf",
        "mimeType": "application/pdf",
        "size": "2048576",
        "createdTime": "2024-01-01T10:00:00.000Z",
        "modifiedTime": "2024-01-02T15:30:00.000Z",
        "owners": [
          {
            "displayName": "John Doe",
            "emailAddress": "john.doe@gmail.com"
          }
        ],
        "shared": false,
        "trashed": false,
        "starred": false,
        "webViewLink": "https://drive.google.com/file/d/1abc123def456/view",
        "thumbnailLink": "https://lh3.googleusercontent.com/...",
        "capabilities": {
          "canEdit": true,
          "canShare": true,
          "canDelete": false,
          "canDownload": true,
          "canCopy": true,
          "canTrash": true,
          "canUntrash": false,
          "canRename": true,
          "canMoveItemWithinDrive": true
        }
      }
    ],
    "nextPageToken": "next_page_token_here",
    "hasMore": true
  }
}
```

### 2. Get File Details
Mengambil detail lengkap file tertentu.

```http
GET /api/drive/files/[id]
```

**Path Parameters:**
- `id` (string, required): ID file Google Drive

**Example Request:**
```bash
curl "http://localhost:5000/api/drive/files/1abc123def456"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1abc123def456",
    "name": "document.pdf",
    "mimeType": "application/pdf",
    "size": "2048576",
    "createdTime": "2024-01-01T10:00:00.000Z",
    "modifiedTime": "2024-01-02T15:30:00.000Z",
    "owners": [
      {
        "displayName": "John Doe",
        "emailAddress": "john.doe@gmail.com",
        "photoLink": "https://lh3.googleusercontent.com/..."
      }
    ],
    "lastModifyingUser": {
      "displayName": "Jane Smith",
      "emailAddress": "jane.smith@gmail.com"
    },
    "permissions": [...],
    "parents": ["folder_id"],
    "properties": {...}
  }
}
```

---

## 🔄 Bulk Operations

### 1. Move Files (Bulk)
Memindahkan multiple files ke folder tujuan.

```http
POST /api/drive/bulk/move
```

**Request Body:**
```json
{
  "fileIds": ["1abc123", "2def456", "3ghi789"],
  "targetFolderId": "target_folder_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moved": ["1abc123", "2def456"],
    "failed": ["3ghi789"],
    "errors": [
      {
        "fileId": "3ghi789",
        "error": "Insufficient permissions"
      }
    ]
  }
}
```

### 2. Copy Files (Bulk)
Menyalin multiple files ke folder tujuan.

```http
POST /api/drive/bulk/copy
```

**Request Body:**
```json
{
  "fileIds": ["1abc123", "2def456"],
  "targetFolderId": "target_folder_id"
}
```

### 3. Delete Files (Bulk)
Menghapus multiple files (ke trash atau permanent).

```http
POST /api/drive/bulk/delete
```

**Request Body:**
```json
{
  "fileIds": ["1abc123", "2def456"],
  "permanent": false
}
```

**Parameters:**
- `permanent` (boolean): `true` untuk hapus permanent, `false` untuk pindah ke trash

### 4. Share Files (Bulk)
Membagikan multiple files ke user/email tertentu.

```http
POST /api/drive/bulk/share
```

**Request Body:**
```json
{
  "fileIds": ["1abc123", "2def456"],
  "email": "user@example.com",
  "role": "reader",
  "type": "user"
}
```

**Parameters:**
- `role`: "reader", "writer", "owner"
- `type`: "user", "group", "domain", "anyone"

### 5. Rename Files (Bulk)
Mengganti nama multiple files dengan pattern tertentu.

```http
POST /api/drive/bulk/rename
```

**Request Body:**
```json
{
  "fileIds": ["1abc123", "2def456"],
  "pattern": "prefix_{original_name}",
  "replaceSpaces": true
}
```

---

## 📊 Performance & Monitoring

### 1. Get Performance Metrics
Mengambil statistik performa API.

```http
GET /api/drive/performance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "averageResponseTime": 645,
    "errorRate": 0.024,
    "cacheHitRate": 0.78,
    "slowRequests": [
      {
        "endpoint": "/api/drive/files",
        "responseTime": 2704,
        "timestamp": "2024-01-01T10:00:00.000Z"
      }
    ],
    "requestStats": {
      "total": 1250,
      "successful": 1220,
      "failed": 30,
      "cached": 975
    }
  }
}
```

### 2. Clear Cache
Menghapus semua cache untuk development/testing.

```http
POST /api/cache/clear
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "data": {
    "clearedEntries": 45,
    "cacheSize": 0
  }
}
```

---

## ⚠️ Error Codes

| Code | Description | HTTP Status |
|------|-------------|------------|
| `UNAUTHORIZED` | Autentikasi diperlukan | 401 |
| `FORBIDDEN` | Permissions tidak cukup | 403 |
| `NOT_FOUND` | Resource tidak ditemukan | 404 |
| `RATE_LIMIT_EXCEEDED` | Terlalu banyak request | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `INVALID_PARAMETER` | Parameter tidak valid | 400 |
| `GOOGLE_API_ERROR` | Error dari Google Drive API | 502 |

---

## 🚀 Performance Features

### Rate Limiting
- Maximum 25 requests per second per user
- Automatic throttling dengan queue system
- Exponential backoff untuk retry logic

### Caching System
- TTL-based cache (15 menit default)
- Intelligent cache invalidation
- Request deduplication untuk mencegah duplicate calls

### Field Optimization
API menggunakan field selector yang optimal untuk mengurangi bandwidth:

**Standard Fields (Tabel utama):**
```
nextPageToken, incompleteSearch, files(id, name, mimeType, size, createdTime, modifiedTime, owners(displayName, emailAddress), shared, trashed, starred, webViewLink, thumbnailLink, parents, capabilities(canEdit, canShare, canDelete, canDownload, canCopy, canTrash, canUntrash, canRename, canMoveItemWithinDrive))
```

**Detailed Fields (Dialog detail):**
```
Semua fields termasuk permissions, parents, properties, dan sharing metadata
```

---

## 💡 Best Practices

### 1. Error Handling
```javascript
try {
  const response = await fetch('/api/drive/files')
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error)
  }
  
  // Handle success
} catch (error) {
  // Handle error dengan exponential backoff
}
```

### 2. Pagination
```javascript
let allFiles = []
let pageToken = null

do {
  const url = `/api/drive/files?pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`
  const response = await fetch(url)
  const data = await response.json()
  
  allFiles.push(...data.data.files)
  pageToken = data.data.nextPageToken
} while (pageToken)
```

### 3. Bulk Operations
```javascript
// Gunakan batch size yang reasonable
const batchSize = 50
const batches = []

for (let i = 0; i < fileIds.length; i += batchSize) {
  batches.push(fileIds.slice(i, i + batchSize))
}

for (const batch of batches) {
  await fetch('/api/drive/bulk/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileIds: batch,
      targetFolderId: 'target_folder'
    })
  })
}
```

---

## 🔧 Development Notes

### Field Usage Analysis
- **owners.emailAddress**: Ditampilkan di tabel utama, diperlukan untuk copy email
- **owners.displayName**: Ditampilkan di dialog detail dan avatar
- **capabilities**: CRITICAL untuk bulk operations - menentukan aksi yang diizinkan
- **thumbnailLink**: Diperlukan untuk preview gambar

### Cache Keys
```
drive:{userId}:{folderId}:p{pageSize}:{query}:{pageSize}
```

### Testing
```bash
# Test dengan curl
curl -X GET "http://localhost:5000/api/drive/files?pageSize=10" \
  -H "Cookie: next-auth.session-token=your-token"

# Clear cache untuk testing
curl -X POST "http://localhost:5000/api/cache/clear" \
  -H "Cookie: next-auth.session-token=your-token"
```

---

## 📞 Support

Untuk pertanyaan atau masalah:
1. Periksa logs di workflow console
2. Gunakan endpoint `/api/drive/performance` untuk monitoring
3. Clear cache jika ada masalah data
4. Hubungi tim development untuk issue kompleks