/**
 * supabaseClient.ts — Singleton Supabase browser client.
 *
 * Uses the PUBLISHABLE (anon) key only — safe for the frontend.
 * The secret/service-role key is NEVER used here.
 *
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in Frontend/.env
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[PathPilot] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
      'Real authentication will not work. Running in demo mode.',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
);
