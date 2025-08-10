/**
 * Supabase client configuration for client-side operations
 */

import { createBrowserClient } from '@supabase/ssr';

// For client-side Supabase, use direct process.env access
// Next.js replaces these at build time, so this is safe in browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables are available

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Export types for better TypeScript integration
export type { Database } from './database.types';