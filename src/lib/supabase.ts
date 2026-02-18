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

/**
 * Untyped profiles table accessor for write operations (insert/upsert/update).
 *
 * WHY THIS EXISTS:
 * The `Database` type in database.ts is hand-maintained and can fall behind the
 * actual schema after migrations. When the Update type doesn't perfectly match
 * what postgrest-js expects, TypeScript collapses the payload type to `never`.
 *
 * This helper returns a query builder for `profiles` with the payload typed as
 * `Record<string, unknown>` so columns added in recent migrations
 * (wholesale_approved_at, approved_by, wholesale_discount_tier, admin_notes…)
 * never cause "not assignable to never" errors.
 *
 * READ operations should still use supabase.from('profiles').select() —
 * the Row type is a superset and always resolves correctly.
 *
 * Usage:
 *   const { error } = await profilesWrite().update({ wholesale_status: 'approved', ... }).eq('id', id);
 *   const { error } = await profilesWrite().upsert({ id, email, ... });
 */
export const profilesWrite = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any).from('profiles') as ReturnType<typeof supabase.from>;

/**
 * Untyped orders table accessor for write operations (update).
 *
 * Same reason as profilesWrite: the hand-maintained Database type can lag
 * behind real migrations (e.g. bank_transfer_proof_url added in 005), causing
 * the Update payload type to collapse to `never`.
 *
 * Usage:
 *   const { error } = await ordersWrite().update({ bank_transfer_proof_url: path }).eq('id', id);
 */
export const ordersWrite = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any).from('orders') as ReturnType<typeof supabase.from>;