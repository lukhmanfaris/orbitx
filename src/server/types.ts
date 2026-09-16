import { SupabaseClient } from '@supabase/supabase-js';

export interface RouteDeps {
  supabase: SupabaseClient;
}
