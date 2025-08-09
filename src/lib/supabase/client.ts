/**
 * Supabase client configuration for client-side operations
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export const supabase = createBrowserClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Export types for better TypeScript integration
export type { Database } from './database.types';