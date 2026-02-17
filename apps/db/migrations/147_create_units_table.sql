-- Migration 147: Create units table for Module -> Units -> Topics hierarchy
-- Part of Learn Page Redesign

-- ============================================================================
-- UNITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,  -- U1.1, U1.2, etc.
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,

    -- Trilingual content
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    name_as TEXT NOT NULL,
    description_en TEXT,
    description_hi TEXT,
    description_as TEXT,

    -- Metadata
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_unit_order UNIQUE (module_id, display_order)
);

-- ============================================================================
-- ADD unit_id TO TOPICS TABLE
-- ============================================================================
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS unit_id TEXT REFERENCES public.units(id);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_units_module_id ON public.units(module_id);
CREATE INDEX IF NOT EXISTS idx_units_display_order ON public.units(module_id, display_order);
CREATE INDEX IF NOT EXISTS idx_topics_unit_id ON public.topics(unit_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Anyone can read units (they're public curriculum data)
CREATE POLICY "units_public_read" ON public.units
    FOR SELECT USING (true);

-- Only service role can modify (via migrations or admin tools)
CREATE POLICY "units_service_role_all" ON public.units
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SEED DATA: UNITS
-- ============================================================================

-- Module 1: Computer Basics (3 units)
INSERT INTO public.units (id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, display_order)
VALUES
    ('U1.1', 'M1', 'What is a Computer?', 'कंप्यूटर क्या है?', 'কম্পিউটাৰ কি?',
     'Understanding the basics of what computers do',
     'कंप्यूटर क्या करते हैं इसकी मूल बातें समझना',
     'কম্পিউটাৰে কি কৰে সেয়া বুজি পোৱা',
     1),
    ('U1.2', 'M1', 'Memory & Storage', 'मेमोरी और स्टोरेज', 'মেম''ৰি আৰু ষ্ট''ৰেজ',
     'Understanding RAM, storage, and backup',
     'RAM, स्टोरेज और बैकअप को समझना',
     'RAM, ষ্ট''ৰেজ আৰু বেকআপ বুজা',
     2),
    ('U1.3', 'M1', 'Files & Organization', 'फाइलें और संगठन', 'ফাইল আৰু সংগঠন',
     'Managing files, folders, and sharing safely',
     'फाइलों, फ़ोल्डरों और सुरक्षित शेयरिंग का प्रबंधन',
     'ফাইল, ফ''ল্ডাৰ আৰু সুৰক্ষিত শ্বেয়াৰিং পৰিচালনা',
     3)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    name_as = EXCLUDED.name_as,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    description_as = EXCLUDED.description_as,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Module 2: Operating Systems (3 units)
INSERT INTO public.units (id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, display_order)
VALUES
    ('U2.1', 'M2', 'Desktop Basics', 'डेस्कटॉप की मूल बातें', 'ডেস্কটপৰ মূল কথা',
     'Navigating the desktop and managing windows',
     'डेस्कटॉप नेविगेट करना और विंडोज़ प्रबंधित करना',
     'ডেস্কটপ নেভিগেট কৰা আৰু উইণ্ড'' পৰিচালনা কৰা',
     1),
    ('U2.2', 'M2', 'File Operations', 'फाइल संचालन', 'ফাইল কাৰ্যসমূহ',
     'Create, copy, move, and recover files',
     'फाइलें बनाएं, कॉपी करें, मूव करें और रिकवर करें',
     'ফাইল সৃষ্টি, কপি, মুভ আৰু পুনৰুদ্ধাৰ কৰক',
     2),
    ('U2.3', 'M2', 'System Management', 'सिस्टम प्रबंधन', 'চিষ্টেম পৰিচালনা',
     'Settings, apps, security, and troubleshooting',
     'सेटिंग्स, ऐप्स, सुरक्षा और समस्या निवारण',
     'ছেটিংছ, এপ্‌, সুৰক্ষা আৰু সমস্যা সমাধান',
     3)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    name_as = EXCLUDED.name_as,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    description_as = EXCLUDED.description_as,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Module 3: Internet Basics (3 units)
INSERT INTO public.units (id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, display_order)
VALUES
    ('U3.1', 'M3', 'Internet Fundamentals', 'इंटरनेट की मूल बातें', 'ইণ্টাৰনেটৰ মূল কথা',
     'What is the internet and how to connect',
     'इंटरनेट क्या है और कैसे कनेक्ट करें',
     'ইণ্টাৰনেট কি আৰু কেনেকৈ সংযোগ কৰিব',
     1),
    ('U3.2', 'M3', 'Online Safety', 'ऑनलाइन सुरक्षा', 'অনলাইন সুৰক্ষা',
     'Staying safe from scams and threats',
     'धोखाधड़ी और खतरों से सुरक्षित रहना',
     'প্ৰৱঞ্চনা আৰু ভাবুকিৰ পৰা সুৰক্ষিত থকা',
     2),
    ('U3.3', 'M3', 'Browsing Skills', 'ब्राउज़िंग कौशल', 'ব্ৰাউজিং দক্ষতা',
     'Search, download, and protect your privacy',
     'खोजें, डाउनलोड करें और अपनी गोपनीयता की रक्षा करें',
     'সন্ধান কৰক, ডাউনল''ড কৰক আৰু গোপনীয়তা সুৰক্ষিত ৰাখক',
     3)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    name_as = EXCLUDED.name_as,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    description_as = EXCLUDED.description_as,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Module 4: Digital Communication (3 units)
INSERT INTO public.units (id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, display_order)
VALUES
    ('U4.1', 'M4', 'Email', 'ईमेल', 'ইমেইল',
     'Email basics and etiquette',
     'ईमेल की मूल बातें और शिष्टाचार',
     'ইমেইলৰ মূল কথা আৰু শিষ্টাচাৰ',
     1),
    ('U4.2', 'M4', 'Messaging & Calls', 'मैसेजिंग और कॉल', 'মেছেজিং আৰু কল',
     'WhatsApp, video calls, and communication',
     'व्हाट्सएप, वीडियो कॉल और संचार',
     'হোৱাটছএপ, ভিডিঅ'' কল আৰু যোগাযোগ',
     2),
    ('U4.3', 'M4', 'Social Media', 'सोशल मीडिया', 'ছ''চিয়েল মিডিয়া',
     'Social media safety and digital citizenship',
     'सोशल मीडिया सुरक्षा और डिजिटल नागरिकता',
     'ছ''চিয়েল মিডিয়া সুৰক্ষা আৰু ডিজিটেল নাগৰিকত্ব',
     3)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    name_as = EXCLUDED.name_as,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    description_as = EXCLUDED.description_as,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Module 5: Local Technology (3 units)
INSERT INTO public.units (id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, display_order)
VALUES
    ('U5.1', 'M5', 'Digital Payments', 'डिजिटल भुगतान', 'ডিজিটেল পেমেণ্ট',
     'UPI and safe online transactions',
     'UPI और सुरक्षित ऑनलाइन लेनदेन',
     'UPI আৰু সুৰক্ষিত অনলাইন লেনদেন',
     1),
    ('U5.2', 'M5', 'Government & Local Services', 'सरकारी और स्थानीय सेवाएं', 'চৰকাৰী আৰু স্থানীয় সেৱা',
     'Online government services and local apps',
     'ऑनलाइन सरकारी सेवाएं और स्थानीय ऐप्स',
     'অনলাইন চৰকাৰী সেৱা আৰু স্থানীয় এপ্‌',
     2),
    ('U5.3', 'M5', 'E-Commerce & Digital Life', 'ई-कॉमर्स और डिजिटल जीवन', 'ই-কমাৰ্চ আৰু ডিজিটেল জীৱন',
     'Online shopping, health services, and education',
     'ऑनलाइन खरीदारी, स्वास्थ्य सेवाएं और शिक्षा',
     'অনলাইন কিনা-বেচা, স্বাস্থ্য সেৱা আৰু শিক্ষা',
     3)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    name_as = EXCLUDED.name_as,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    description_as = EXCLUDED.description_as,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- ============================================================================
-- ASSIGN TOPICS TO UNITS
-- ============================================================================

-- Module 1: Computer Basics
UPDATE public.topics SET unit_id = 'U1.1' WHERE id IN ('T1.1', 'T1.2');
UPDATE public.topics SET unit_id = 'U1.2' WHERE id IN ('T2.1', 'T2.2', 'T2.3');
UPDATE public.topics SET unit_id = 'U1.3' WHERE id IN ('T3.1', 'T3.2', 'T3.3', 'T3.4', 'T3.5');

-- Module 2: Operating Systems
UPDATE public.topics SET unit_id = 'U2.1' WHERE id IN ('T4.1', 'T4.2');
UPDATE public.topics SET unit_id = 'U2.2' WHERE id IN ('T5.1', 'T5.2');
UPDATE public.topics SET unit_id = 'U2.3' WHERE id IN ('T6.1', 'T6.2', 'T7.1', 'T7.2', 'T8.1', 'T8.2');

-- Module 3: Internet Basics
UPDATE public.topics SET unit_id = 'U3.1' WHERE id IN ('T9.1', 'T9.2');
UPDATE public.topics SET unit_id = 'U3.2' WHERE id IN ('T10.1', 'T10.2');
UPDATE public.topics SET unit_id = 'U3.3' WHERE id IN ('T11.1', 'T11.2', 'T12.1', 'T12.2', 'T13.1', 'T13.2');

-- Module 4: Digital Communication
UPDATE public.topics SET unit_id = 'U4.1' WHERE id IN ('T14.1', 'T14.2');
UPDATE public.topics SET unit_id = 'U4.2' WHERE id IN ('T15.1', 'T15.2', 'T16.1', 'T16.2');
UPDATE public.topics SET unit_id = 'U4.3' WHERE id IN ('T17.1', 'T17.2', 'T17.3', 'T17.4');

-- Module 5: Local Technology
UPDATE public.topics SET unit_id = 'U5.1' WHERE id IN ('T18.1', 'T18.2');
UPDATE public.topics SET unit_id = 'U5.2' WHERE id IN ('T19.1', 'T19.2');
UPDATE public.topics SET unit_id = 'U5.3' WHERE id IN ('T20.1', 'T20.2', 'T21.1', 'T21.2', 'T22.1', 'T22.2');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get units with their topics for a module
CREATE OR REPLACE FUNCTION public.get_module_units_with_topics(p_module_id TEXT)
RETURNS TABLE (
    unit_id TEXT,
    unit_name_en TEXT,
    unit_name_hi TEXT,
    unit_name_as TEXT,
    unit_description_en TEXT,
    unit_description_hi TEXT,
    unit_description_as TEXT,
    unit_display_order INTEGER,
    topic_id TEXT,
    topic_name_en TEXT,
    topic_name_hi TEXT,
    topic_name_as TEXT,
    topic_description_en TEXT,
    topic_description_hi TEXT,
    topic_description_as TEXT,
    topic_duration_minutes INTEGER,
    topic_display_order INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        u.id as unit_id,
        u.name_en as unit_name_en,
        u.name_hi as unit_name_hi,
        u.name_as as unit_name_as,
        u.description_en as unit_description_en,
        u.description_hi as unit_description_hi,
        u.description_as as unit_description_as,
        u.display_order as unit_display_order,
        t.id as topic_id,
        t.name_en as topic_name_en,
        t.name_hi as topic_name_hi,
        t.name_as as topic_name_as,
        t.description_en as topic_description_en,
        t.description_hi as topic_description_hi,
        t.description_as as topic_description_as,
        t.duration_minutes as topic_duration_minutes,
        t.display_order as topic_display_order
    FROM public.units u
    LEFT JOIN public.topics t ON t.unit_id = u.id AND t.is_active = true
    WHERE u.module_id = p_module_id
    AND u.is_active = true
    ORDER BY u.display_order, t.display_order;
$$;

-- Get unit count for a module
CREATE OR REPLACE FUNCTION public.get_module_unit_count(p_module_id TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.units
    WHERE module_id = p_module_id
    AND is_active = true;
$$;

-- Update get_modules_with_counts to include unit count
DROP FUNCTION IF EXISTS public.get_modules_with_counts();

CREATE OR REPLACE FUNCTION public.get_modules_with_counts()
RETURNS TABLE (
    id TEXT,
    name_en TEXT,
    name_hi TEXT,
    name_as TEXT,
    description_en TEXT,
    description_hi TEXT,
    description_as TEXT,
    icon TEXT,
    color_gradient TEXT,
    cultural_note_en TEXT,
    cultural_note_hi TEXT,
    cultural_note_as TEXT,
    display_order INTEGER,
    topic_count BIGINT,
    unit_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        m.id,
        m.name_en,
        m.name_hi,
        m.name_as,
        m.description_en,
        m.description_hi,
        m.description_as,
        m.icon,
        m.color_gradient,
        m.cultural_note_en,
        m.cultural_note_hi,
        m.cultural_note_as,
        m.display_order,
        (SELECT COUNT(*) FROM public.topics t WHERE t.module_id = m.id AND t.is_active = true) as topic_count,
        (SELECT COUNT(*) FROM public.units u WHERE u.module_id = m.id AND u.is_active = true) as unit_count
    FROM public.modules m
    WHERE m.is_active = true
    ORDER BY m.display_order;
$$;
