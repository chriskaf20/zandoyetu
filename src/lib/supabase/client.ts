import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dimhzfxztyvbtljdyhqq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbWh6Znh6dHl2YnRsamR5aHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTk0ODUsImV4cCI6MjA5NjEzNTQ4NX0.VvZawR2MC8eiOmfILTDd1iW1bJEnNpWsqAWrAskyQvc';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
