/**
 * Supabase Client Module
 * Uses the Supabase JS client with service role key for backend data access.
 * This bypasses RLS policies and gives full read/write access.
 */

const isTestEnv = process.env.NODE_ENV === 'test';
const { createClient } = isTestEnv
  ? { createClient: null }
  : require('@supabase/supabase-js');

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://szxufqkvkgcspnmvohwd.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const createMockQuery = (table) => {
  const result = { data: [], error: null, count: 0 };
  const builder = {
    select: () => builder,
    eq: () => builder,
    ilike: () => builder,
    gte: () => builder,
    lte: () => builder,
    order: () => builder,
    range: () => builder,
    limit: () => builder,
    update: () => builder,
    insert: () => builder,
    delete: () => builder,
    in: () => builder,
    single: () =>
      Promise.resolve({
        data: table === 'alerts' ? { id: 1, status: 'active' } : null,
        error: null,
      }),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
};

const createMockClient = () => ({
  from: (table) => createMockQuery(table),
});

if (!SUPABASE_KEY && !isTestEnv) {
  throw new Error(
    'Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable'
  );
}

const supabase = isTestEnv
  ? createMockClient()
  : createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

module.exports = { supabase };
