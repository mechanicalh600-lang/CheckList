import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://onizpprvuuigxxkldjdp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_wiyc7tpceaqelH6OD9UeYQ_tqkc6VvQ';

export const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
