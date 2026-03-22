require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!SUPABASE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  try {
    const { data, error, count } = await supabase
      .from('water_quality_readings')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching data:', error.message);
    } else {
      console.log('Total water_quality_readings count:', count);
    }

    const {
      data: locData,
      error: locError,
      count: locCount,
    } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true });

    if (locError) {
      console.error('Error fetching locations:', locError.message);
    } else {
      console.log('Total locations count:', locCount);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
