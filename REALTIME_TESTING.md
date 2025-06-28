# Real-time API Testing dengan SESSION_COOKIE

## Overview

SESSION_COOKIE environment secret sangat diperlukan untuk testing API secara real-time sebagai user autentik. Sistem ini memungkinkan developer untuk test API endpoints dengan data Google Drive user sesungguhnya, bukan mock data.

## Benefits Testing Real-time

### 1. Authentic Data Testing
- Test dengan file dan folder Drive user sesungguhnya
- Validasi permission dan sharing settings aktual
- Monitor performance dengan load data real

### 2. End-to-end Validation
- Authentication flow dengan JWT session aktual
- Google Drive API integration dengan token valid
- Error handling dengan response API sesungguhnya

### 3. Development Efficiency
- Debug issues dengan context user aktual
- Performance monitoring real-time
- Immediate feedback untuk API changes

## Setup SESSION_COOKIE

### Langkah Extract Cookie dari Browser

1. **Login ke aplikasi** di browser dengan Google account
2. **Buka Developer Tools** (F12)
3. **Navigate ke Application/Storage tab** 
4. **Pilih Cookies** untuk domain aplikasi
5. **Cari cookie "authjs.session-token"**
6. **Copy nilai cookie** (tanpa nama, hanya value)

### Set Environment Variable

```bash
# Option 1: Set di Replit Secrets
SESSION_COOKIE="authjs.session-token=eyJhbGciOiJkaXIi..."

# Option 2: Manual testing
node scripts/test-realtime-api.js "authjs.session-token=eyJhbGciOiJkaXIi..."
```

## Testing Commands

### 1. Extract Session Helper
```bash
node scripts/extract-session.js
```
Memberikan instruksi lengkap untuk extract session cookie dari browser.

### 2. Real-time API Testing
```bash
# Dengan environment variable
SESSION_COOKIE="authjs.session-token=YOUR_COOKIE" node scripts/test-realtime-api.js

# Manual dengan parameter
node scripts/test-realtime-api.js "authjs.session-token=YOUR_COOKIE"
```

### 3. Workflow Testing
```bash
# Via workflow (jika SESSION_COOKIE sudah diset)
npm run test:realtime
```

## Test Coverage

### Core Endpoints
- `/api/auth/session` - Validate user session
- `/api/drive/files` - List user files
- `/api/drive/user` - User profile info
- `/api/drive/performance` - Performance metrics

### File Operations
- `/api/drive/files/details` - File details dengan real fileId
- `/api/drive/files/essential` - Essential file info
- File operations menggunakan file IDs dari user Drive

### Performance Monitoring
- `/api/health` - Application health
- `/api/drive/performance` - Drive API performance
- Response time monitoring
- Success rate tracking

## Security Considerations

### Cookie Handling
- SESSION_COOKIE berisi JWT token yang sensitive
- Cookie akan expire setelah beberapa jam
- Jangan commit cookie values ke repository
- Gunakan environment variables atau secrets management

### Best Practices
- Extract cookie fresh sebelum testing session panjang
- Rotate session cookies regularly
- Monitor cookie expiration
- Test dengan multiple user accounts untuk comprehensive coverage

## Expected Output

```
🚀 Starting Real-time API Testing with Authentic Session
📍 Base URL: https://your-app.replit.dev
🍪 Using Session Cookie: Available

📋 Validating Session...
✅ Session Valid - User: user@gmail.com

📂 Testing Core Drive API Endpoints...
  ✅ List Files: 200 (450ms)
  ✅ User Info: 200 (120ms)
  ✅ Performance Stats: 200 (89ms)

🔧 Testing File Operations...
📄 Using test file: document.pdf (1A2B3C4D5E)
  ✅ File Details: 200 (230ms)
  ✅ Essential Details: 200 (180ms)

⚡ Testing Performance Endpoints...
  ✅ Health Check: 200 (45ms)
  ✅ Performance Metrics: 200 (67ms)

============================================================
📊 REAL-TIME API TESTING REPORT
============================================================
📈 Success Rate: 7/7 (100%)
⏱️ Total Time: 1245ms
⚡ Average Response: 168ms
✅ Successful: 7
❌ Failed: 0

🎯 API Health Status: HEALTHY
============================================================
```

## Integration dengan Development Workflow

### Pre-deployment Testing
- Validate API endpoints dengan real user data
- Performance regression testing
- Authentication flow verification

### Continuous Development
- Real-time API health monitoring
- User experience validation
- Performance optimization feedback

### Debugging Support
- Test API changes dengan authentic context
- Debug permission issues dengan real data
- Monitor API behavior dengan actual user load

## Troubleshooting

### Common Issues

1. **"Invalid or expired session cookie"**
   - Extract fresh cookie dari browser
   - Pastikan user masih login
   - Check cookie format dan completeness

2. **"Cannot get file list"**
   - Verify Google Drive API permissions
   - Check user memiliki files di Drive
   - Validate Drive API quota

3. **"SESSION_COOKIE is required"**
   - Set environment variable dengan benar
   - Gunakan manual parameter untuk testing
   - Run extract-session.js untuk instruksi

Sistem testing real-time dengan SESSION_COOKIE ini memberikan confidence tinggi bahwa API bekerja dengan baik untuk user sesungguhnya, bukan hanya untuk mock data atau test environment.