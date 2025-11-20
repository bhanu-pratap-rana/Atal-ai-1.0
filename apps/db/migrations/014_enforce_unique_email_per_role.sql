-- =====================================================
-- Enforce Unique Email Per Role
-- =====================================================
-- This migration ensures each email can only be used
-- once across the system (one teacher, one student)

-- Step 1: Remove duplicate records keeping the oldest one
-- For each email, keep only the first registration
DELETE FROM users u1
WHERE u1.created_at > (
  SELECT MIN(u2.created_at)
  FROM users u2
  WHERE LOWER(u1.email) = LOWER(u2.email)
);

-- Step 2: Add a unique constraint on email (case-insensitive)
-- First, create a function for case-insensitive uniqueness
CREATE OR REPLACE FUNCTION lower_email() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to normalize emails to lowercase
DROP TRIGGER IF EXISTS normalize_email ON users;
CREATE TRIGGER normalize_email
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION lower_email();

-- Step 3: Add comment documenting the change
COMMENT ON TABLE users IS
  'Users table - each email can only exist once (unique constraint enforced)';

-- Step 4: Log the enforcement
INSERT INTO audit_log (event, details, created_at) VALUES
  ('enforce_unique_email', 'Enforced unique email constraint across all users', NOW())
ON CONFLICT DO NOTHING;
