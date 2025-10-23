-- Complete database setup with all necessary tables and functions

-- 1. Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Create user_profile table (for additional user data)
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT,
  email TEXT,
  avatar TEXT,
  theme TEXT DEFAULT 'dark',
  settings JSONB DEFAULT '{
    "notifications": true,
    "quality": "high",
    "downloadEnabled": true,
    "language": "hindi",
    "autoplay": true,
    "crossfade": false,
    "aiShuffle": true,
    "aiSuggestions": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Create user_search_history table
CREATE TABLE IF NOT EXISTS user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Create user_downloads table
CREATE TABLE IF NOT EXISTS user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Create user_playlists table
CREATE TABLE IF NOT EXISTS user_playlists (
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

-- 7. Create user_listening_history table
CREATE TABLE IF NOT EXISTS user_listening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  duration INTEGER,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. Create user_saved_playlists table (for external playlists)
CREATE TABLE IF NOT EXISTS user_saved_playlists (
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

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_created ON user_search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_user_id ON user_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_user_id ON user_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_playlist_id ON user_playlists(playlist_id);
CREATE INDEX IF NOT EXISTS idx_user_listening_history_user_id ON user_listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_playlists_user_id ON user_saved_playlists(user_id);

-- 10. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_playlists ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 12. Create RLS Policies for user_profile
CREATE POLICY "user_profile_select_own" ON user_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_profile_update_own" ON user_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_profile_insert_own" ON user_profile FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 13. Create RLS Policies for user_search_history
CREATE POLICY "search_history_select_own" ON user_search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_history_insert_own" ON user_search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "search_history_delete_own" ON user_search_history FOR DELETE USING (auth.uid() = user_id);

-- 14. Create RLS Policies for user_favorites
CREATE POLICY "favorites_select_own" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

-- 15. Create RLS Policies for user_downloads
CREATE POLICY "downloads_select_own" ON user_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "downloads_insert_own" ON user_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "downloads_delete_own" ON user_downloads FOR DELETE USING (auth.uid() = user_id);

-- 16. Create RLS Policies for user_playlists
CREATE POLICY "playlists_select_own" ON user_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "playlists_insert_own" ON user_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_update_own" ON user_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "playlists_delete_own" ON user_playlists FOR DELETE USING (auth.uid() = user_id);

-- 17. Create RLS Policies for user_listening_history
CREATE POLICY "listening_history_select_own" ON user_listening_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "listening_history_insert_own" ON user_listening_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 18. Create RLS Policies for user_saved_playlists
CREATE POLICY "saved_playlists_select_own" ON user_saved_playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_playlists_insert_own" ON user_saved_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_playlists_delete_own" ON user_saved_playlists FOR DELETE USING (auth.uid() = user_id);

-- 19. Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar, theme)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'dark'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = new.email,
    name = COALESCE(new.raw_user_meta_data->>'name', new.email),
    updated_at = NOW();

  INSERT INTO public.user_profile (user_id, email, name, avatar, theme)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'dark'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = new.email,
    name = COALESCE(new.raw_user_meta_data->>'name', new.email),
    updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 20. Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 21. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated;

-- 22. Grant function permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated;
