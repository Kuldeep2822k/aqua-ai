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

if (!SUPABASE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = { supabase };
