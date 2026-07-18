import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000',
  useMock: (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true',
  llmEndpoint: (import.meta.env.VITE_LLM_ENDPOINT as string) || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
} as const;

let supabaseClient: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return supabaseClient;
}
