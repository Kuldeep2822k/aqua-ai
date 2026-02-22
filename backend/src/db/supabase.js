/**
 * Supabase Client Module
 * Uses the Supabase JS client with service role key for backend data access.
 * This bypasses RLS policies and gives full read/write access.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://szxufqkvkgcspnmvohwd.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let supabaseInitError = null;

if (!SUPABASE_KEY) {
  supabaseInitError = new Error(
    'Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable'
  );
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

const getSupabaseStatus = async () => {
  if (supabaseInitError) {
    return { status: 'missing', error: supabaseInitError.message };
  }
  if (!supabase) {
    return { status: 'missing', error: 'Supabase client not initialized' };
  }
  try {
    const { error } = await supabase
      .from('location_summary')
      .select('id')
      .limit(1);
    if (error) {
      return { status: 'error', error: error.message };
    }
    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', error: err?.message || 'Supabase check failed' };
  }
};

module.exports = { supabase, supabaseInitError, getSupabaseStatus };
