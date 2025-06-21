# Environment Variables Setup Guide

## Core Environment Variables

### Required for All Platforms
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret  
NEXTAUTH_SECRET=your_random_32_char_secret
DATABASE_URL=your_database_connection_string
```

### URL Configuration (Choose One Method)

#### Method 1: Auto-Detection (Recommended)
No additional environment variables needed. The system will auto-detect your platform:

- **Vercel**: Uses `VERCEL_URL`
- **Netlify**: Uses `DEPLOY_PRIME_URL` or `URL`
- **Render**: Uses `RENDER_EXTERNAL_URL`
- **Railway**: Uses `RAILWAY_PUBLIC_DOMAIN`
- **Replit**: Uses `REPLIT_DOMAINS`

#### Method 2: Manual Override
```bash
BASE_URL=https://yourdomain.com
```

#### Method 3: Legacy (Still Supported)
```bash
NEXTAUTH_URL=https://yourdomain.com/api/auth
```

## Platform-Specific Setup

### Vercel
```bash
# Required
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
DATABASE_URL=...

# Optional (auto-detected from VERCEL_URL)
BASE_URL=https://your-app.vercel.app
```

### Netlify
```bash
# Required
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
DATABASE_URL=...

# Optional (auto-detected from URL)
BASE_URL=https://your-app.netlify.app
```

### Render
```bash
# Required
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
DATABASE_URL=...

# Optional (auto-detected from RENDER_EXTERNAL_URL)
BASE_URL=https://your-app.onrender.com
```

### Railway
```bash
# Required
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
DATABASE_URL=...

# Optional (auto-detected from RAILWAY_PUBLIC_DOMAIN)
BASE_URL=https://your-app.railway.app
```

### Custom Domain
```bash
# Required
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
DATABASE_URL=...

# Required for custom domains
BASE_URL=https://yourdomain.com
```

## URL Resolution Priority

1. `BASE_URL` (manual override)
2. `NEXTAUTH_URL` (extract origin)
3. Platform auto-detection:
   - Vercel: `VERCEL_URL`
   - Netlify: `DEPLOY_PRIME_URL` or `URL`
   - Render: `RENDER_EXTERNAL_URL`
   - Railway: `RAILWAY_PUBLIC_DOMAIN`
   - Replit: `REPLIT_DOMAINS`
4. Request origin (fallback)
5. `localhost:5000` (development)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret

## Validation

The system will automatically validate your configuration on startup and show:
- Detected platform
- Resolved URL
- Configuration issues (if any)

Check the server logs for validation results.