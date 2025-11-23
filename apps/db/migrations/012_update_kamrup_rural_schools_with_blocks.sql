-- UPDATE: Add block information to Kamrup Rural schools (Phase 1)
-- This migration adds block data by parsing school names and manual mapping
-- Based on: https://en.wikipedia.org/wiki/Kamrup_Rural_district

-- Step 1: Extract block from school_name where block name is explicitly mentioned
UPDATE public.schools SET block = 'Sualkuchi'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%sualkuchi%' AND block IS NULL;

UPDATE public.schools SET block = 'Rangiya'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%rangiya%' AND block IS NULL;

UPDATE public.schools SET block = 'Boko'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%boko%' AND block IS NULL;

UPDATE public.schools SET block = 'Chhaygaon'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%chhaygaon%' AND block IS NULL;

UPDATE public.schools SET block = 'Hajo'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%hajo%' AND block IS NULL;

UPDATE public.schools SET block = 'Kamalpur'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%kamalpur%' AND block IS NULL;

UPDATE public.schools SET block = 'Rani'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%rani%' AND block IS NULL;

UPDATE public.schools SET block = 'Baihata Chariali'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%baihata%' AND block IS NULL;

UPDATE public.schools SET block = 'Chandrapur'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%chandrapur%' AND block IS NULL;

UPDATE public.schools SET block = 'Raha'
WHERE district = 'KAMRUP RURAL' AND school_name ILIKE '%raha%' AND block IS NULL;

-- Step 2: Manual mapping for key schools without explicit block names in school names
-- These mappings are based on the provided block-wise school lists

-- Rangia Block - Key schools
UPDATE public.schools SET block = 'Rangia' WHERE school_code IN (
  '14H0005', -- ARIMATTA VIDYAPEETH HIGH SCHOOL, RANGIYA
  '14H1227', -- Rangia schools
  '14H0374', '14H0375', '14H0376'
) AND district = 'KAMRUP RURAL' AND block IS NULL;

-- Boko Block - Key schools
UPDATE public.schools SET block = 'Boko' WHERE school_code IN (
  '14H0034', -- BOKO HIGH SCHOOL
  '14H0035', -- BOKO GIRLS'' HIGH SCHOOL
  '14H0705', -- DON BOSCO HIGH SCHOOL, BOKO
  '14H0836', -- NAVODAY HIGH SCHOOL, BOKO
  '14H1092'  -- SANKARDEV BIDYA NIKETAN BOKO
) AND district = 'KAMRUP RURAL' AND block IS NULL;

-- Sualkuchi Block - Key schools
UPDATE public.schools SET block = 'Sualkuchi' WHERE school_code IN (
  '14H1096', -- SANKARDEV SHISHU VIDYA NIKETAN, SUALKUCHI
  '14H0619', -- Sualkuchi Higher Secondary School
  '14H0620'  -- Sualkuchi Girls High School
) AND district = 'KAMRUP RURAL' AND block IS NULL;

-- Chhaygaon Block - Key schools
UPDATE public.schools SET block = 'Chhaygaon' WHERE school_code IN (
  '14H0049', -- CHHAYGAON HIGHER SECONDARY SCHOOL
  '14H0050', -- CHHAYGAON CHAMPAKNAGAR GIRLS'' HIGH SCHOOL
  '14H0349', -- ARUNODAY HIGH SCHOOL, CHHAYGAON
  '14H1163', -- JATIYA VIDYALAYA, CHHAYGAON
  '14H1062'  -- ST MARY''S HIGH SCHOOL, CHHAYGAON
) AND district = 'KAMRUP RURAL' AND block IS NULL;

-- Hajo Block - Key schools
UPDATE public.schools SET block = 'Hajo' WHERE school_code IN (
  '14H0086', -- BARIGOG HAJO HIGHER SECONDARY SCHOOL
  '14H0618', -- BARAMBOI ANCHALIK HIGH SCHOOL
  '14H0662'  -- BARDADHI SANKARDEV GIRLS'' HIGH SCHOOL
) AND district = 'KAMRUP RURAL' AND block IS NULL;

-- Step 3: Assign remaining NULL blocks to their most likely block based on school code range
-- School codes follow pattern: 14HXXXX where first digits may indicate administrative region
-- This is a fallback - ideally should be verified against official govt data

-- Note on Implementation:
-- ========================
-- The hierarchical school finder in the admin UI requires complete block data.
-- Currently, many schools still have NULL block values.
--
-- TODO for production:
-- 1. Obtain official block-wise mapping from Assam Board of Education
-- 2. Update this migration with complete and accurate data
-- 3. Test the admin UI with all blocks populated
-- 4. Add validation to ensure no schools have NULL blocks in KAMRUP RURAL
--
-- For now, schools with NULL blocks will not appear in the block selector dropdown
