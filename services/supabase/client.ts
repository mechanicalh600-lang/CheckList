import { createClient } from '@supabase/supabase-js';

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

// Browser configuration is injected by the build pipeline. The Supabase URL
// and publishable key are intentionally public client configuration and may be
// present in the deployment workflow/bundle. Privileged or service-role keys
// must never be stored in source control or shipped to the browser.
export const supabaseUrl = process.env.SUPABASE_URL || '';
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
}

const museumFetch: typeof fetch = (input, init) => {
  const options: RequestInit = init ?? {};
  const headers = new Headers(options.headers);
  const token = getMuseumSession();
  if (token) headers.set('x-museum-session', token);
  return fetch(input, { ...options, headers });
};

// Non-live placeholders keep the historical UI renderable when configuration
// is absent, while all real requests remain disabled until env values are supplied.
export const supabase = createClient(
  supabaseUrl || 'https://missing-config.invalid',
  supabaseAnonKey || 'missing-config',
  {
    global: { fetch: museumFetch },
  }
);
