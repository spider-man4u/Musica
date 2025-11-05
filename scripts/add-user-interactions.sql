-- Create user interactions table to track likes, skips, and play duration
CREATE TABLE IF NOT EXISTS user_song_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_title TEXT,
  song_artist TEXT,
  interaction_type TEXT NOT NULL, -- 'like', 'skip', 'play', 'complete'
  skip_time INTEGER, -- seconds before skip
  duration_played INTEGER, -- total duration played in seconds
  total_duration INTEGER, -- total song duration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_interaction_type CHECK (interaction_type IN ('like', 'skip', 'play', 'complete'))
);

-- Create indexes for fast queries
CREATE INDEX idx_user_interactions_user_id ON user_song_interactions(user_id);
CREATE INDEX idx_user_interactions_created_at ON user_song_interactions(created_at DESC);
CREATE INDEX idx_user_interactions_type ON user_song_interactions(interaction_type);

-- Create song preference scores table for AI recommendations
CREATE TABLE IF NOT EXISTS song_preference_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL,
  song_title TEXT,
  song_artist TEXT,
  genre TEXT,
  score FLOAT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  avg_completion_rate FLOAT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, song_id)
);

CREATE INDEX idx_preference_scores_user_id ON song_preference_scores(user_id);
CREATE INDEX idx_preference_scores_score ON song_preference_scores(score DESC);

-- Enable RLS
ALTER TABLE user_song_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_preference_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_song_interactions
CREATE POLICY "Users can insert their own interactions" 
  ON user_song_interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interactions" 
  ON user_song_interactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" 
  ON user_song_interactions FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for song_preference_scores
CREATE POLICY "Users can insert their own preferences" 
  ON song_preference_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own preferences" 
  ON song_preference_scores FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON song_preference_scores FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
  ON song_preference_scores FOR DELETE 
  USING (auth.uid() = user_id);
