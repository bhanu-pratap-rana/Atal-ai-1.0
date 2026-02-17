-- =====================================================
-- PART 7: badges (Cultural Badge Definitions - READ-ONLY)
-- =====================================================

-- Enable RLS (public read-only)
ALTER TABLE IF EXISTS badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS public_read_cultural_badges ON badges;
DROP POLICY IF EXISTS admin_manage_cultural_badges ON badges;
DROP POLICY IF EXISTS badges_admin_delete ON badges;
DROP POLICY IF EXISTS badges_admin_insert ON badges;
DROP POLICY IF EXISTS badges_admin_update ON badges;

-- Everyone can view badge definitions (public read)
CREATE POLICY public_read_cultural_badges ON badges
  FOR SELECT
  USING (true);

-- Only admins can modify badge definitions
CREATE POLICY admin_manage_cultural_badges ON badges
  FOR ALL
  USING (
    (SELECT (auth.jwt()->'app_metadata'->>'role')) IN ('admin', 'super_admin')
  );;
