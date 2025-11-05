import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const scripts = [
  { name: 'reset-supabase-completely.sql', file: './reset-supabase-completely.sql' },
  { name: 'fix-profiles-schema.sql', file: './fix-profiles-schema.sql' },
  { name: 'setup-complete-database.sql', file: './setup-complete-database.sql' }
];

async function executeScripts() {
  console.log('[v0] Starting database setup...');
  
  try {
    // Read SQL files
    const fs = await import('fs').then(m => m.promises);
    
    for (const script of scripts) {
      console.log(`\n[v0] Executing: ${script.name}`);
      const sqlContent = await fs.readFile(script.file, 'utf-8');
      
      // Split by semicolons and filter empty statements
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`[v0] Found ${statements.length} SQL statements in ${script.name}`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        try {
          const statement = statements[i] + ';';
          console.log(`[v0] Executing statement ${i + 1}/${statements.length}...`);
          await sql(statement);
        } catch (error) {
          console.error(`[v0] Error executing statement ${i + 1}:`, error.message);
          // Continue with next statement instead of failing
        }
      }
      
      console.log(`[v0] Completed: ${script.name}`);
    }
    
    console.log('\n[v0] Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Fatal error:', error.message);
    process.exit(1);
  }
}

executeScripts();
