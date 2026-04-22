/**
 * Service provider configuration.
 * Set the corresponding VITE_*_PROVIDER environment variable to switch providers
 * without changing any business logic code.
 *
 * Valid values:
 *   database : 'local' | 'supabase' | 'firebase'
 *   storage  : 'local' | 'supabase' | 'r2' | 's3'
 *   compute  : 'worker' | 'lambda' | 'supabase-function'
 *   redirect : 'local' | 'cloudflare' | 'node'
 */
export const config = {
  database: (process.env.NEXT_PUBLIC_DB_PROVIDER as string) || 'local',
  storage: (process.env.NEXT_PUBLIC_STORAGE_PROVIDER as string) || 'local',
  compute: (process.env.NEXT_PUBLIC_COMPUTE_PROVIDER as string) || 'worker',
  redirect: (process.env.NEXT_PUBLIC_REDIRECT_PROVIDER as string) || 'local',
} as const;

export type DatabaseProvider = 'local' | 'supabase' | 'firebase';
export type StorageProvider = 'local' | 'supabase' | 'r2' | 's3';
export type ComputeProvider = 'worker' | 'lambda' | 'supabase-function';
export type RedirectProvider = 'local' | 'cloudflare' | 'node';
