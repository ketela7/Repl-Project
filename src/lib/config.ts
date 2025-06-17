// Configuration for environment variables
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },
  turnstile: {
    siteKey: process.env.TURNSTILE_SITE_KEY!,
    secretKey: process.env.TURNSTILE_SECRET_KEY!,
  },
}

// For client-side components, we need to pass these via props or server-side rendering
export const getPublicConfig = () => ({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY!,
})