const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase credentials not found in environment variables');
  console.warn('Using mock data fallback');
}

const supabase = createClient(supabaseUrl || 'http://localhost:3000', supabaseKey || 'mock-key');

module.exports = supabase;
