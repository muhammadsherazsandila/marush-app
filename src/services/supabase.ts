import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { Database } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
  process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export { Session, User };
export type { SupabaseClient };

// Re-export mockStore and dataProvider for unified service layer access
export { mockStore, dataProvider } from './dataProvider';
