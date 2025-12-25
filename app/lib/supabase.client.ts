import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

// Get environment variables from window object (injected by root loader)
const ENV = typeof window !== 'undefined' && window.ENV ? window.ENV : { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };

const supabaseUrl = ENV.SUPABASE_URL || '';
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase is not configured. Please set SUPABASE_PROJECT_URL and SUPABASE_API_KEY environment variables.');
  console.warn('Current config:', {
    url: supabaseUrl ? '✓ URL configured' : '✗ URL missing',
    key: supabaseAnonKey ? '✓ Key configured' : '✗ Key missing'
  });
}

// Create Supabase client only if properly configured
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null as any;
