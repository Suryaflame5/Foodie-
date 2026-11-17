import { createClient } from '@supabase/supabase-js';
// The Supabase publishable key is designed for browser use; database access
// remains protected by Row Level Security. Environment variables override these
// public project defaults when configured on the hosting provider.
const url=(import.meta.env.VITE_SUPABASE_URL as string|undefined)||'https://njuxgtacizzgwqymtcbc.supabase.co';
const anonKey=(import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined)||'sb_publishable_hvG4fuailEzlXC48rguBiw_wKX2hn4-';
export const isSupabaseConfigured=Boolean(url&&anonKey);
export const supabase=isSupabaseConfigured?createClient(url,anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export type AppLanguage='en'|'ta'|'te';
export const languageNames:Record<AppLanguage,string>={en:'English',ta:'தமிழ்',te:'తెలుగు'};
