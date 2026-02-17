/**
 * Supabase Client Configuration
 * Tunisia E-commerce SPA
 * 
 * This file initializes and exports a single Supabase client instance
 * for use throughout the application.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables with VITE_ prefix for client-side access
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Missing Supabase credentials! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Create and export the Supabase client with type safety
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Persist session in localStorage
      persistSession: true,
      // Auto refresh token before expiry
      autoRefreshToken: true,
      // Detect session from URL (for magic links, OAuth)
      detectSessionInUrl: true,
      // Storage key for session
      storageKey: 'souq-tunisia-auth',
    },
    // Global settings
    global: {
      headers: {
        'x-application-name': 'souq-tunisia',
      },
    },
    // Real-time configuration
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Export types for convenience
export type SupabaseClient = typeof supabase;