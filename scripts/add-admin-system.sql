-- Create admin users table to track admin users and their permissions
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin', -- admin, moderator, support
  permissions JSONB DEFAULT '{"send_notifications": true, "send_updates": true, "send_popups": true, "manage_users": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications/updates table for admin to send messages to users
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'notification', 'popup', 'changelog', 'update'
  style JSONB DEFAULT '{}'::jsonb,
  target_users TEXT[] DEFAULT '{}'::text[], -- array of user_ids or 'all' for everyone
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notifications to track which users have seen notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
  seen_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- Add bio and location columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Enable RLS for new tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users
CREATE POLICY "Only admins can view admin users" ON admin_users
  FOR SELECT USING (EXISTS(SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Only admins can manage admin users" ON admin_users
  FOR ALL USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

-- Create RLS policies for admin_notifications
CREATE POLICY "All users can view published notifications" ON admin_notifications
  FOR SELECT USING (is_active = true AND published_at IS NOT NULL);

CREATE POLICY "Admins can manage their own notifications" ON admin_notifications
  FOR ALL USING (admin_id IN (SELECT id FROM admin_users WHERE user_id = auth.uid()));

-- Create RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification status" ON user_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_active ON admin_notifications(is_active, published_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, created_at DESC);

-- Insert admin user for your.spider0@gmail.com (replace with actual user_id after user creates account)
-- This needs to be done manually after the user signs up
-- INSERT INTO admin_users (user_id, email, role, permissions) 
-- VALUES ('user-uuid-here', 'your.spider0@gmail.com', 'admin', '{"send_notifications": true, "send_updates": true, "send_popups": true, "manage_users": true}'::jsonb);
