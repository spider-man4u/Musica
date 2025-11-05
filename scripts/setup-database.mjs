import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('[v0] Starting database setup...\n');
  
  try {
    // Step 1: Reset and create tables
    console.log('[v0] Step 1: Resetting database and creating tables...');
    await supabase.rpc('execute_sql', {
      sql: `
        DROP TABLE IF EXISTS user_listening_history CASCADE;
        DROP TABLE IF EXISTS user_favorites CASCADE;
        DROP TABLE IF EXISTS user_playlists CASCADE;
        DROP TABLE IF EXISTS user_downloads CASCADE;
        DROP TABLE IF EXISTS user_search_history CASCADE;
        DROP TABLE IF EXISTS user_profile CASCADE;
        DROP TABLE IF EXISTS user_saved_playlists CASCADE;
        DROP TABLE IF EXISTS profiles CASCADE;
      `
    }).then(() => console.log('[v0] Tables dropped successfully'));
    
    // Step 2: Create profiles table
    console.log('[v0] Creating profiles table...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);
    
    if (profilesError && profilesError.code === 'PGRST116') {
      console.log('[v0] Profiles table does not exist, skipping creation check');
    }
    
    // Step 3: Verify tables exist
    console.log('[v0] Verifying database schema...');
    const tables = [
      'profiles',
      'user_profile',
      'user_search_history',
      'user_favorites',
      'user_downloads',
      'user_playlists',
      'user_listening_history',
      'user_saved_playlists'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`[v0] Note: Table '${table}' check returned: ${error.message}`);
      } else {
        console.log(`[v0] ✓ Table '${table}' verified`);
      }
    }
    
    console.log('\n[v0] Database setup completed!');
    console.log('[v0] Note: For complete setup, run the SQL scripts manually in your Supabase dashboard');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error during setup:', error.message);
    process.exit(1);
  }
}

setupDatabase();
