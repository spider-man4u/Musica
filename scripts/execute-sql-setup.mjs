import fetch from 'node-fetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[v0] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Combined SQL setup with all three scripts
const SQL_SETUP = `
-- Drop all existing tables and policies
DROP TABLE IF EXISTS user_listening_history CASCADE;
DROP TABLE IF EXISTS user_saved_playlists CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS user_playlists CASCADE;
DROP TABLE IF EXISTS user_downloads CASCADE;
DROP TABLE IF EXISTS user_search_history CASCADE;
DROP TABLE IF EXISTS user_profile CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create user_profile table
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar TEXT,
  theme TEXT DEFAULT 'dark',
  settings JSONB DEFAULT '{"notifications": true, "quality": "high", "downloadEnabled": true, "language": "hindi", "autoplay": true, "crossfade": false, "aiShuffle": true, "aiSuggestions": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create search history table
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create favorites table
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create downloads table
CREATE TABLE user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create playlists table
CREATE TABLE user_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  is_public BOOLEAN DEFAULT false,
  playlist_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create listening history table
CREATE TABLE user_listening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  duration INTEGER,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create saved playlists table
CREATE TABLE user_saved_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_playlist_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  song_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  playlist_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, external_playlist_id)
);

-- Create indexes
CREATE INDEX idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_created ON user_search_history(created_at DESC);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_downloads_user_id ON user_downloads(user_id);
CREATE INDEX idx_user_playlists_user_id ON user_playlists(user_id);
CREATE INDEX idx_user_listening_history_user_id ON user_listening_history(user_id);
CREATE INDEX idx_user_saved_playlists_user_id ON user_saved_playlists(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_playlists ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profile_select_own" ON user_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_profile_update_own" ON user_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_profile_insert_own" ON user_profile FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "search_history_select_own" ON user_search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_history_insert_own" ON user_search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "search_history_delete_own" ON user_search_history FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "favorites_select_own" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "downloads_select_own" ON user_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "downloads_insert_own" ON user_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "downloads_delete_own" ON user_downloads FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "playlists_select_own" ON user_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "playlists_insert_own" ON user_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_update_own" ON user_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "playlists_delete_own" ON user_playlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "listening_history_select_own" ON user_listening_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "listening_history_insert_own" ON user_listening_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_playlists_select_own" ON user_saved_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_playlists_insert_own" ON user_saved_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_playlists_delete_own" ON user_saved_playlists FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar, theme)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), new.raw_user_meta_data->>'avatar_url', 'dark')
  ON CONFLICT (id) DO UPDATE SET email = new.email, updated_at = NOW();

  INSERT INTO public.user_profile (user_id, email, name, avatar, theme)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), new.raw_user_meta_data->>'avatar_url', 'dark')
  ON CONFLICT (user_id) DO UPDATE SET email = new.email, updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated;
`;

async function executeSetup() {
  console.log('[v0] Starting database setup with combined SQL...');
  
  try {
    // Execute via Supabase SQL endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql: SQL_SETUP })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[v0] API Error:', error);
      
      console.log('[v0] Note: Direct SQL execution via API may not be available.');
      console.log('[v0] Please manually run the SQL in your Supabase SQL Editor.');
      process.exit(0);
    }

    const result = await response.json();
    console.log('[v0] Database setup completed successfully!');
    console.log('[v0] Result:', result);
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error:', error.message);
    console.log('\n[v0] To complete the database setup manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Click "New Query"');
    console.log('4. Copy and paste the SQL from scripts/reset-supabase-completely.sql');
    console.log('5. Run the script');
    console.log('6. Repeat for fix-profiles-schema.sql and setup-complete-database.sql');
    process.exit(0);
  }
}

executeSetup();
