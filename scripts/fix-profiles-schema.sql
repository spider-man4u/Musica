-- Add missing columns to profiles table if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure the table has proper constraints
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_pk PRIMARY KEY (id);
