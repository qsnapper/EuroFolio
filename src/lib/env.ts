/**
 * Environment variables configuration with runtime validation
 */

// Simple environment variable access with proper fallbacks
export const env = {
  // Supabase client-side variables (must be public)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Application configuration
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'EuroFolio',
  
  // Server-side environment variables
  DATABASE_URL: process.env.DATABASE_URL || '',
  EODHD_API_TOKEN: process.env.EODHD_API_TOKEN || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Validate required environment variables
export function validateRequiredEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Only validate on server startup, not on every module load
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  validateRequiredEnvVars();
}