import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://onizpprvuuigxxkldjdp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_wiyc7tpceaqelH6OD9UeYQ_tqkc6VvQ';

export const MUSEUM_SESSION_KEY = 'newray_checklist_museum_session';

export const setMuseumSession = (token: string) => {
  if (typeof window !== 'undefined' && token) {
    window.localStorage.setItem(MUSEUM_SESSION_KEY, token);
  }
};

export const clearMuseumSession = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(MUSEUM_SESSION_KEY);
  }
};

export const getMuseumSession = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(MUSEUM_SESSION_KEY);
};

export const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing!');
}

const museumFetch: typeof fetch = (input, init) => {
  const options: RequestInit = init ?? {};
  const headers = new Headers(options.headers);
  const token = getMuseumSession();
  if (token) headers.set('x-museum-session', token);
  return fetch(input, { ...options, headers });
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  global: { fetch: museumFetch },
});