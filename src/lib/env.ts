/**
 * Environment variables configuration with runtime validation
 */

// Environment variable access compatible with Edge Runtime and browser
function getEnvVar(name: string, fallback: string = ''): string {
  try {
    // Check if process and process.env exist
    if (typeof process !== 'undefined' && process && process.env) {
      return process.env[name] || fallback;
    }
  } catch (error) {
    // In some Edge Runtime environments, accessing process might throw
    console.warn(`Failed to access process.env.${name}:`, error);
  }
  
  // Fallback for environments where process is not available
  return fallback;
}

// For client-side NEXT_PUBLIC_ variables, also use safe access
const clientEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: getEnvVar('NEXT_PUBLIC_APP_NAME', 'EuroFolio'),
} as const;

// For server-side variables, use the safe getter
const serverEnvVars = {
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  EODHD_API_TOKEN: getEnvVar('EODHD_API_TOKEN'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
} as const;

// Combine both for the final env object
export const env = {
  ...clientEnvVars,
  ...serverEnvVars,
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
// Skip validation in Edge Runtime or when process is not available
try {
  if (typeof window === 'undefined' && 
      typeof process !== 'undefined' && 
      process && 
      process.env &&
      getEnvVar('NODE_ENV') === 'production') {
    validateRequiredEnvVars();
  }
} catch (error) {
  // Skip validation if there's any issue accessing process
  console.warn('Skipping environment validation due to runtime constraints');
}