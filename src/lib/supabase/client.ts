import { createBrowserClient } from '@supabase/ssr'

export function createClient(supabaseUrl: string, supabaseAnonKey: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}