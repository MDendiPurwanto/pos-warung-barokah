// Server-side Supabase configuration
// This file should only be imported in loaders/actions, never in components

export function getSupabaseEnv() {
  // Check all possible environment variable names
  const url = process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_API_KEY || process.env.SUPABASE_ANON_KEY || '';
  
  if (!url || !key) {
    console.warn('⚠️ Supabase environment variables not configured properly');
    console.warn('Expected: SUPABASE_PROJECT_URL and SUPABASE_API_KEY');
  }
  
  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key);
}
