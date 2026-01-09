-- Update Kyle's user account to admin status
UPDATE users 
SET user_type = 'admin', status = 'approved' 
WHERE email = 'kyle@kylebeggan.com';
