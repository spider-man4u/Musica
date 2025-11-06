-- Setup admin user for your.spider0@gmail.com
-- Run this after the user signs up with email: your.spider0@gmail.com
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users table

-- Find the user ID first:
-- SELECT id, email FROM auth.users WHERE email = 'your.spider0@gmail.com';

-- Then run:
INSERT INTO admin_users (user_id, email, role, permissions)
VALUES (
  'USER_ID_HERE',
  'your.spider0@gmail.com',
  'admin',
  '{"send_notifications": true, "send_updates": true, "send_popups": true, "manage_users": true}'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  permissions = '{"send_notifications": true, "send_updates": true, "send_popups": true, "manage_users": true}'::jsonb;
