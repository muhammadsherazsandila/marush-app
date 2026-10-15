import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './nativeCrypto';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const configuredAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

const isValidSupabaseUrl = (value: string | undefined): value is string => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || (__DEV__ && url.protocol === 'http:')) &&
      url.hostname.length > 0 &&
      !url.hostname.includes('placeholder') &&
      !url.hostname.startsWith('your-');
  } catch {
    return false;
  }
};

export const isSupabaseConfigured =
  isValidSupabaseUrl(configuredUrl) &&
  Boolean(configuredAnonKey) &&
  !configuredAnonKey?.toLowerCase().includes('placeholder') &&
  !configuredAnonKey?.toLowerCase().startsWith('your-');

const client: SupabaseClient<any> | null = isSupabaseConfigured
  ? (createClient(configuredUrl!, configuredAnonKey!, {
      auth: {
        storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    }) as SupabaseClient<any>)
  : null;

export const getSupabaseClient = (): SupabaseClient<any> => {
  if (!client) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return client;
};

export { Session, User };
export type { SupabaseClient };
