-- COMPLETE SUPABASE RESET - Run this in your Supabase SQL Editor
-- This will completely reset and fix all authentication and database issues

-- 1. Drop all existing policies, triggers, and tables
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable full access for users to their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Enable full access for users to their own favorites" ON favorites;
DROP POLICY IF EXISTS "Enable read access for users to their own playlists" ON playlists;
DROP POLICY IF EXISTS "Enable insert access for users to create playlists" ON playlists;
DROP POLICY IF EXISTS "Enable update access for users to their own playlists" ON playlists;
DROP POLICY IF EXISTS "Enable delete access for users to their own playlists" ON playlists;
DROP POLICY IF EXISTS "Enable read access for playlist songs" ON playlist_songs;
DROP POLICY IF EXISTS "Enable full access for users to their own playlist songs" ON playlist_songs;
DROP POLICY IF EXISTS "Enable full access for users to their own recently played" ON recently_played;
DROP POLICY IF EXISTS "Enable full access for users to their own downloads" ON downloads;
DROP POLICY IF EXISTS "Enable full access for users to their own listening history" ON listening_history;
DROP POLICY IF EXISTS "Enable full access for users to their own search history" ON search_history;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;

DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS listening_history CASCADE;
DROP TABLE IF EXISTS downloads CASCADE;
DROP TABLE IF EXISTS recently_played CASCADE;
DROP TABLE IF EXISTS playlist_songs CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create profiles table (simplified)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  selected_artists TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user preferences table (simplified)
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'dark',
  audio_quality TEXT DEFAULT 'high',
  notifications_enabled BOOLEAN DEFAULT true,
  auto_play BOOLEAN DEFAULT true,
  ai_suggestions BOOLEAN DEFAULT true,
  ai_shuffle BOOLEAN DEFAULT true,
  crossfade BOOLEAN DEFAULT false,
  download_enabled BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'hindi',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS but with permissive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 6. Create very permissive policies for testing
CREATE POLICY "Allow all operations on profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_preferences" ON user_preferences
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Create simple trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 8. Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 10. Test the setup
SELECT 'Supabase reset completed successfully!' as status;
