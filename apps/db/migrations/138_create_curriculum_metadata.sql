-- Migration 138: Create curriculum metadata tables for modules and topics
-- This removes hardcoded curriculum structure from the frontend code

-- ============================================================================
-- MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,  -- M1, M2, etc.
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    name_as TEXT NOT NULL,
    description_en TEXT,
    description_hi TEXT,
    description_as TEXT,
    icon TEXT DEFAULT '📚',
    color_gradient TEXT DEFAULT 'from-primary to-primary-dark',
    cultural_note_en TEXT,
    cultural_note_hi TEXT,
    cultural_note_as TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TOPICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,  -- T1.1, T1.2, etc.
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    name_as TEXT NOT NULL,
    description_en TEXT,
    description_hi TEXT,
    description_as TEXT,
    duration_minutes INTEGER DEFAULT 15,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_topics_module_id ON public.topics(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON public.modules(display_order);
CREATE INDEX IF NOT EXISTS idx_topics_display_order ON public.topics(module_id, display_order);

-- ============================================================================
-- RLS POLICIES - Public read access, admin write
-- ============================================================================
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Anyone can read modules and topics (they're public curriculum data)
CREATE POLICY "modules_public_read" ON public.modules
    FOR SELECT USING (true);

CREATE POLICY "topics_public_read" ON public.topics
    FOR SELECT USING (true);

-- Only service role can modify (via migrations or admin tools)
CREATE POLICY "modules_service_role_all" ON public.modules
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "topics_service_role_all" ON public.topics
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SEED DATA: MODULES
-- ============================================================================
INSERT INTO public.modules (id, name_en, name_hi, name_as, description_en, description_hi, description_as, icon, color_gradient, cultural_note_en, cultural_note_hi, cultural_note_as, display_order)
VALUES
    ('M1', 'Computer Basics', 'कंप्यूटर मूल बातें', 'কম্পিউটাৰ মূল কথা',
     'Learn about computers, hardware, and software fundamentals',
     'कंप्यूटर, हार्डवेयर और सॉफ्टवेयर की मूल बातें सीखें',
     'কম্পিউটাৰ, হাৰ্ডৱেৰ আৰু চফ্টৱেৰৰ মূল কথা শিকক',
     '💻', 'from-primary to-primary-dark', NULL, NULL, NULL, 1),

    ('M2', 'Operating Systems', 'ऑपरेटिंग सिस्टम', 'অপাৰেটিং চিষ্টেম',
     'Master your operating system - Windows, Android, and file management',
     'अपने ऑपरेटिंग सिस्टम में महारत हासिल करें - विंडोज, एंड्रॉइड और फाइल प्रबंधन',
     'আপোনাৰ অপাৰেটিং চিষ্টেমত দক্ষতা অৰ্জন কৰক - উইণ্ড''জ, এণ্ড্ৰইড আৰু ফাইল ব্যৱস্থাপনা',
     '🖥️', 'from-cyan to-cyan-dark', NULL, NULL, NULL, 2),

    ('M3', 'Internet Basics', 'इंटरनेट मूल बातें', 'ইণ্টাৰনেট মূল কথা',
     'Navigate the internet safely and effectively',
     'इंटरनेट को सुरक्षित और प्रभावी ढंग से नेविगेट करें',
     'ইণ্টাৰনেট সুৰক্ষিত আৰু ফলপ্ৰসূভাৱে ব্যৱহাৰ কৰক',
     '🌐', 'from-accent to-accent-dark', NULL, NULL, NULL, 3),

    ('M4', 'Digital Communication', 'डिजिटल संचार', 'ডিজিটেল যোগাযোগ',
     'Email, messaging, and online communication skills',
     'ईमेल, मैसेजिंग और ऑनलाइन संचार कौशल',
     'ইমেইল, মেছেজিং আৰু অনলাইন যোগাযোগ দক্ষতা',
     '📧', 'from-success to-success-dark', NULL, NULL, NULL, 4),

    ('M5', 'Local Technology', 'स्थानीय तकनीक', 'স্থানীয় প্ৰযুক্তি',
     'Digital tools for local needs - payments, government services, and more',
     'स्थानीय जरूरतों के लिए डिजिटल उपकरण - भुगतान, सरकारी सेवाएं और बहुत कुछ',
     'স্থানীয় প্ৰয়োজনৰ বাবে ডিজিটেল সঁজুলি - পেমেণ্ট, চৰকাৰী সেৱা আৰু আৰু বহুতো',
     '🏛️', 'from-warning to-warning-dark',
     'Includes Assamese language apps and local digital services',
     'इसमें असमिया भाषा ऐप्स और स्थानीय डिजिटल सेवाएं शामिल हैं',
     'অসমীয়া ভাষাৰ এপ্‌ আৰু স্থানীয় ডিজিটেল সেৱা অন্তৰ্ভুক্ত',
     5)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    name_as = EXCLUDED.name_as,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    description_as = EXCLUDED.description_as,
    icon = EXCLUDED.icon,
    color_gradient = EXCLUDED.color_gradient,
    cultural_note_en = EXCLUDED.cultural_note_en,
    cultural_note_hi = EXCLUDED.cultural_note_hi,
    cultural_note_as = EXCLUDED.cultural_note_as,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- ============================================================================
-- SEED DATA: TOPICS
-- ============================================================================
-- Module 1: Computer Basics
INSERT INTO public.topics (id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, duration_minutes, display_order)
VALUES
    ('T1.1', 'M1', 'The Four Jobs of a Computer', 'कंप्यूटर के चार काम', 'কম্পিউটাৰৰ চাৰিটা কাম',
     'Input, Processing, Storage, Output - the fundamental operations',
     'इनपुट, प्रोसेसिंग, स्टोरेज, आउटपुट - मूलभूत संचालन',
     'ইনপুট, প্ৰচেছিং, ষ্ট''ৰেজ, আউটপুট - মৌলিক কাৰ্যসমূহ',
     15, 1),
    ('T1.2', 'M1', 'Main Parts You See and Use', 'मुख्य भाग जो आप देखते और उपयोग करते हैं', 'আপুনি দেখা আৰু ব্যৱহাৰ কৰা মূল অংশসমূহ',
     'Monitor, keyboard, mouse, CPU, speakers - physical components',
     'मॉनिटर, कीबोर्ड, माउस, सीपीयू, स्पीकर - भौतिक घटक',
     'মনিটৰ, কীব''ৰ্ড, মাউছ, চিপিইউ, স্পীকাৰ - ভৌতিক উপাদান',
     15, 2),
    ('T2.1', 'M1', 'RAM vs Storage', 'RAM बनाम स्टोरेज', 'RAM বনাম ষ্ট''ৰেজ',
     'Understanding temporary vs permanent memory',
     'अस्थायी बनाम स्थायी मेमोरी को समझना',
     'অস্থায়ী বনাম স্থায়ী মেম''ৰি বুজা',
     15, 3),
    ('T2.2', 'M1', 'Save Habits for Power Cuts', 'बिजली कटौती के लिए सेव आदतें', 'বিদ্যুৎ বিচ্ছেদৰ বাবে সংৰক্ষণৰ অভ্যাস',
     'Auto-save, frequent saving, UPS basics',
     'ऑटो-सेव, बार-बार सेव करना, यूपीएस की मूल बातें',
     'অট''-চেভ, সঘনাই সংৰক্ষণ, ইউপিএছৰ মূল কথা',
     15, 4),
    ('T2.3', 'M1', 'Backup Basics (3-2-1 Rule)', 'बैकअप की मूल बातें (3-2-1 नियम)', 'বেকআপৰ মূল কথা (৩-২-১ নিয়ম)',
     '3 copies, 2 media types, 1 offsite',
     '3 प्रतियां, 2 मीडिया प्रकार, 1 ऑफसाइट',
     '৩ টা কপি, ২ টা মিডিয়া প্ৰকাৰ, ১ টা অফছাইট',
     15, 5),
    ('T3.1', 'M1', 'What is a File?', 'फाइल क्या है?', 'ফাইল কি?',
     'Documents, photos, videos - digital containers',
     'दस्तावेज़, फ़ोटो, वीडियो - डिजिटल कंटेनर',
     'নথি, ফট'', ভিডিঅ'' - ডিজিটেল কণ্টেইনাৰ',
     15, 6),
    ('T3.2', 'M1', 'Good File Names', 'अच्छे फाइल नाम', 'ভাল ফাইলৰ নাম',
     'Naming conventions, avoiding special characters',
     'नामकरण परंपराएं, विशेष वर्णों से बचना',
     'নামকৰণ পৰম্পৰা, বিশেষ আখৰ এৰাই চলা',
     15, 7),
    ('T3.3', 'M1', 'Folders that Make Sense', 'फोल्डर जो समझ में आएं', 'যুক্তিযুক্ত ফ''ল্ডাৰ',
     'Organizing files into logical folders',
     'फाइलों को तार्किक फ़ोल्डरों में व्यवस्थित करना',
     'ফাইলসমূহ যুক্তিযুক্ত ফ''ল্ডাৰত সংগঠিত কৰা',
     15, 8),
    ('T3.4', 'M1', 'Safe Saving & Simple Backup', 'सुरक्षित सेविंग और सरल बैकअप', 'সুৰক্ষিত সংৰক্ষণ আৰু সৰল বেকআপ',
     'Save to multiple locations, USB backup',
     'कई स्थानों पर सेव करें, यूएसबी बैकअप',
     'একাধিক স্থানত সংৰক্ষণ কৰক, ইউএছবি বেকআপ',
     15, 9),
    ('T3.5', 'M1', 'Private Info & Safe Sharing', 'निजी जानकारी और सुरक्षित शेयरिंग', 'ব্যক্তিগত তথ্য আৰু সুৰক্ষিত শ্বেয়াৰিং',
     'What not to share, safe sharing practices',
     'क्या शेयर नहीं करना चाहिए, सुरक्षित शेयरिंग अभ्यास',
     'কি শ্বেয়াৰ নকৰিব, সুৰক্ষিত শ্বেয়াৰিং অভ্যাস',
     15, 10),

-- Module 2: Operating Systems
    ('T4.1', 'M2', 'Understanding the Desktop', 'डेस्कटॉप को समझना', 'ডেস্কটপ বুজি পোৱা',
     'Icons, taskbar, start menu, desktop shortcuts',
     'आइकन, टास्कबार, स्टार्ट मेन्यू, डेस्कटॉप शॉर्टकट',
     'আইকন, টাস্কবাৰ, ষ্টাৰ্ট মেনু, ডেস্কটপ শ্বৰ্টকাট',
     15, 1),
    ('T4.2', 'M2', 'Window Management', 'विंडो प्रबंधन', 'উইণ্ড'' ব্যৱস্থাপনা',
     'Minimize, maximize, resize, close windows',
     'विंडो को छोटा करें, बड़ा करें, आकार बदलें, बंद करें',
     'উইণ্ড'' সৰু কৰক, ডাঙৰ কৰক, আকাৰ সলনি কৰক, বন্ধ কৰক',
     15, 2),
    ('T5.1', 'M2', 'Create, Copy, Move, Rename, Delete', 'बनाएं, कॉपी, मूव, रीनेम, डिलीट', 'সৃষ্টি, কপি, মুভ, ৰিনেম, ডিলিট',
     'Basic file operations in file explorer',
     'फाइल एक्सप्लोरर में बुनियादी फाइल संचालन',
     'ফাইল এক্সপ্ল''ৰাৰত মৌলিক ফাইল কাৰ্যসমূহ',
     15, 3),
    ('T5.2', 'M2', 'File Recovery & Versions', 'फाइल रिकवरी और वर्जन', 'ফাইল পুনৰুদ্ধাৰ আৰু সংস্কৰণ',
     'Recycle bin, file history, recovery options',
     'रीसायकल बिन, फाइल हिस्ट्री, रिकवरी विकल्प',
     'ৰিচাইকল বিন, ফাইল হিষ্ট''ৰী, পুনৰুদ্ধাৰ বিকল্প',
     15, 4),
    ('T6.1', 'M2', 'Settings Panel Overview', 'सेटिंग्स पैनल अवलोकन', 'ছেটিংছ পেনেলৰ সাৰাংশ',
     'Navigate system settings effectively',
     'सिस्टम सेटिंग्स को प्रभावी ढंग से नेविगेट करें',
     'চিষ্টেম ছেটিংছ ফলপ্ৰসূভাৱে ব্যৱহাৰ কৰক',
     15, 5),
    ('T6.2', 'M2', 'Display & Accessibility', 'डिस्प्ले और एक्सेसिबिलिटी', 'ডিছপ্লে আৰু এক্সেছিবিলিটি',
     'Adjust brightness, text size, contrast',
     'ब्राइटनेस, टेक्स्ट साइज, कंट्रास्ट एडजस्ट करें',
     'ব্ৰাইটনেছ, টেক্সট চাইজ, কণ্ট্ৰাষ্ট এডজাষ্ট কৰক',
     15, 6),
    ('T7.1', 'M2', 'Installing Apps Safely', 'ऐप्स को सुरक्षित रूप से इंस्टॉल करना', 'এপ্‌ সুৰক্ষিতভাৱে ইনষ্টল কৰা',
     'Official stores, avoiding malware',
     'आधिकारिक स्टोर, मैलवेयर से बचाव',
     'আনুষ্ঠানিক ষ্ট''ৰ, মেলৱেৰৰ পৰা সাৱধান',
     15, 7),
    ('T7.2', 'M2', 'Uninstalling & Cleanup', 'अनइंस्टॉल और क्लीनअप', 'আনইনষ্টল আৰু ক্লিনআপ',
     'Remove unused apps, clear cache',
     'अप्रयुक्त ऐप्स हटाएं, कैश साफ करें',
     'অব্যৱহৃত এপ্‌ আঁতৰাওক, কেশ্ব পৰিষ্কাৰ কৰক',
     15, 8),
    ('T8.1', 'M2', 'Antivirus & Updates', 'एंटीवायरस और अपडेट', 'এণ্টিভাইৰাছ আৰু আপডেট',
     'Keep your system protected and current',
     'अपने सिस्टम को सुरक्षित और अपडेट रखें',
     'আপোনাৰ চিষ্টেম সুৰক্ষিত আৰু আপডেট ৰাখক',
     15, 9),
    ('T8.2', 'M2', 'Basic Troubleshooting', 'बुनियादी समस्या निवारण', 'মৌলিক সমস্যা সমাধান',
     'Restart, safe mode, common fixes',
     'रीस्टार्ट, सेफ मोड, सामान्य समाधान',
     'ৰিষ্টাৰ্ট, ছেফ ম''ড, সাধাৰণ সমাধান',
     15, 10),

-- Module 3: Internet Basics
    ('T9.1', 'M3', 'What is the Internet?', 'इंटरनेट क्या है?', 'ইণ্টাৰনেট কি?',
     'Global network connecting computers worldwide',
     'दुनिया भर के कंप्यूटरों को जोड़ने वाला वैश्विक नेटवर्क',
     'বিশ্বব্যাপী কম্পিউটাৰ সংযোগ কৰা বৈশ্বিক নেটৱৰ্ক',
     15, 1),
    ('T9.2', 'M3', 'Ways to Connect', 'कनेक्ट करने के तरीके', 'সংযোগ কৰাৰ উপায়',
     'WiFi, mobile data, broadband, fiber',
     'वाईफाई, मोबाइल डेटा, ब्रॉडबैंड, फाइबर',
     'ৱাইফাই, ম''বাইল ডেটা, ব্ৰডবেণ্ড, ফাইবাৰ',
     15, 2),
    ('T10.1', 'M3', 'HTTPS & the Padlock', 'HTTPS और पैडलॉक', 'HTTPS আৰু তলা',
     'Secure connections, checking for safety',
     'सुरक्षित कनेक्शन, सुरक्षा की जांच',
     'সুৰক্ষিত সংযোগ, সুৰক্ষা পৰীক্ষা',
     15, 3),
    ('T10.2', 'M3', 'Spotting Online Scams', 'ऑनलाइन धोखाधड़ी की पहचान', 'অনলাইন স্কেমৰ চিনাক্তকৰণ',
     'Phishing, fake websites, too-good-to-be-true offers',
     'फ़िशिंग, नकली वेबसाइट, बहुत अच्छे ऑफर',
     'ফিছিং, নকল ৱেবছাইট, অত্যধিক ভাল অফাৰ',
     15, 4),
    ('T11.1', 'M3', 'Search Engine Basics', 'सर्च इंजन की मूल बातें', 'চাৰ্চ ইঞ্জিনৰ মূল কথা',
     'Using Google effectively',
     'गूगल का प्रभावी उपयोग',
     'গুগল ফলপ্ৰসূভাৱে ব্যৱহাৰ কৰা',
     15, 5),
    ('T11.2', 'M3', 'Evaluating Search Results', 'खोज परिणामों का मूल्यांकन', 'সন্ধান ফলাফলৰ মূল্যায়ন',
     'Reliable vs unreliable sources',
     'विश्वसनीय बनाम अविश्वसनीय स्रोत',
     'বিশ্বাসযোগ্য বনাম অবিশ্বাসযোগ্য উৎস',
     15, 6),
    ('T12.1', 'M3', 'Downloads Done Right', 'सही तरीके से डाउनलोड', 'সঠিকভাৱে ডাউনল''ড',
     'Safe downloading practices',
     'सुरक्षित डाउनलोड अभ्यास',
     'সুৰক্ষিত ডাউনল''ড অভ্যাস',
     15, 7),
    ('T12.2', 'M3', 'Browser Bookmarks & History', 'ब्राउज़र बुकमार्क और हिस्ट्री', 'ব্ৰাউজাৰ বুকমাৰ্ক আৰু হিষ্ট''ৰী',
     'Organize and find saved pages',
     'सेव किए गए पेज व्यवस्थित करें और खोजें',
     'সংৰক্ষিত পৃষ্ঠা সংগঠিত কৰক আৰু বিচাৰক',
     15, 8),
    ('T13.1', 'M3', 'Protecting Personal Data', 'व्यक्तिगत डेटा की सुरक्षा', 'ব্যক্তিগত ডেটা সুৰক্ষা',
     'What to share, what to keep private',
     'क्या शेयर करें, क्या निजी रखें',
     'কি শ্বেয়াৰ কৰিব, কি ব্যক্তিগত ৰাখিব',
     15, 9),
    ('T13.2', 'M3', 'Password Best Practices', 'पासवर्ड सर्वोत्तम अभ्यास', 'পাছৱৰ্ড শ্ৰেষ্ঠ অভ্যাস',
     'Strong passwords and password managers',
     'मजबूत पासवर्ड और पासवर्ड मैनेजर',
     'শক্তিশালী পাছৱৰ্ড আৰু পাছৱৰ্ড মেনেজাৰ',
     15, 10),

-- Module 4: Digital Communication
    ('T14.1', 'M4', 'Email Basics', 'ईमेल की मूल बातें', 'ইমেইলৰ মূল কথা',
     'Creating accounts and sending emails',
     'खाते बनाना और ईमेल भेजना',
     'একাউণ্ট সৃষ্টি আৰু ইমেইল পঠোৱা',
     15, 1),
    ('T14.2', 'M4', 'Email Etiquette', 'ईमेल शिष्टाचार', 'ইমেইল শিষ্টাচাৰ',
     'Professional and polite communication',
     'पेशेवर और विनम्र संचार',
     'পেছাদাৰী আৰু বিনয়ী যোগাযোগ',
     15, 2),
    ('T15.1', 'M4', 'WhatsApp Essentials', 'WhatsApp अनिवार्यताएं', 'WhatsApp প্ৰয়োজনীয়তা',
     'Messaging, groups, and calls',
     'मैसेजिंग, ग्रुप और कॉल',
     'মেছেজিং, গ্ৰুপ আৰু কল',
     15, 3),
    ('T15.2', 'M4', 'WhatsApp Privacy & Safety', 'WhatsApp गोपनीयता और सुरक्षा', 'WhatsApp গোপনীয়তা আৰু সুৰক্ষা',
     'Privacy settings and blocking',
     'गोपनीयता सेटिंग्स और ब्लॉकिंग',
     'গোপনীয়তা ছেটিংছ আৰু ব্ল''কিং',
     15, 4),
    ('T16.1', 'M4', 'Video Calls Made Easy', 'वीडियो कॉल आसान बनाएं', 'ভিডিঅ'' কল সহজ কৰক',
     'Google Meet, Zoom basics',
     'गूगल मीट, जूम की मूल बातें',
     'গুগল মিট, জুমৰ মূল কথা',
     15, 5),
    ('T16.2', 'M4', 'Video Call Etiquette', 'वीडियो कॉल शिष्टाचार', 'ভিডিঅ'' কল শিষ্টাচাৰ',
     'Professional video calling tips',
     'पेशेवर वीडियो कॉलिंग टिप्स',
     'পেছাদাৰী ভিডিঅ'' কলিং টিপছ',
     15, 6),
    ('T17.1', 'M4', 'Social Media Overview', 'सोशल मीडिया अवलोकन', 'ছ''চিয়েল মিডিয়াৰ সাৰাংশ',
     'Understanding different platforms',
     'विभिन्न प्लेटफार्मों को समझना',
     'বিভিন্ন প্লেটফৰ্ম বুজা',
     15, 7),
    ('T17.2', 'M4', 'Staying Safe on Social Media', 'सोशल मीडिया पर सुरक्षित रहें', 'ছ''চিয়েল মিডিয়াত সুৰক্ষিত থাকক',
     'Privacy and safety tips',
     'गोपनीयता और सुरक्षा टिप्स',
     'গোপনীয়তা আৰু সুৰক্ষা টিপছ',
     15, 8),
    ('T17.3', 'M4', 'Digital Citizenship', 'डिजिटल नागरिकता', 'ডিজিটেল নাগৰিকত্ব',
     'Being a responsible online citizen',
     'एक जिम्मेदार ऑनलाइन नागरिक बनना',
     'এজন দায়িত্বশীল অনলাইন নাগৰিক হোৱা',
     15, 9),
    ('T17.4', 'M4', 'Cyberbullying Awareness', 'साइबरबुलिंग जागरूकता', 'চাইবাৰবুলিং সজাগতা',
     'Recognizing and responding to cyberbullying',
     'साइबरबुलिंग को पहचानना और उसका जवाब देना',
     'চাইবাৰবুলিং চিনাক্ত কৰা আৰু প্ৰতিক্ৰিয়া জনোৱা',
     15, 10),

-- Module 5: Local Technology
    ('T18.1', 'M5', 'UPI & Digital Payments', 'UPI और डिजिटल भुगतान', 'UPI আৰু ডিজিটেল পেমেণ্ট',
     'Using Google Pay, PhonePe, Paytm',
     'गूगल पे, फोनपे, पेटीएम का उपयोग',
     'গুগল পে, ফ''নপে, পেটিএম ব্যৱহাৰ',
     15, 1),
    ('T18.2', 'M5', 'Safe Transaction Practices', 'सुरक्षित लेनदेन अभ्यास', 'সুৰক্ষিত লেনদেন অভ্যাস',
     'Protecting your money online',
     'ऑनलाइन अपने पैसे की सुरक्षा',
     'অনলাইনত আপোনাৰ ধন সুৰক্ষিত ৰখা',
     15, 2),
    ('T19.1', 'M5', 'Government Services Online', 'ऑनलाइन सरकारी सेवाएं', 'অনলাইন চৰকাৰী সেৱা',
     'Aadhaar, DigiLocker, and more',
     'आधार, डिजीलॉकर और अन्य',
     'আধাৰ, ডিজিলকাৰ আৰু অন্যান্য',
     15, 3),
    ('T19.2', 'M5', 'Local Language Apps', 'स्थानीय भाषा ऐप्स', 'স্থানীয় ভাষাৰ এপ্‌',
     'Apps in Hindi, Assamese, and regional languages',
     'हिंदी, असमिया और क्षेत्रीय भाषाओं में ऐप्स',
     'হিন্দী, অসমীয়া আৰু আঞ্চলিক ভাষাত এপ্‌',
     15, 4),
    ('T20.1', 'M5', 'E-Commerce Basics', 'ई-कॉमर्स की मूल बातें', 'ই-কমাৰ্চৰ মূল কথা',
     'Online shopping safely',
     'सुरक्षित ऑनलाइन खरीदारी',
     'সুৰক্ষিত অনলাইন কিনা-বেচা',
     15, 5),
    ('T20.2', 'M5', 'Avoiding Online Fraud', 'ऑनलाइन धोखाधड़ी से बचें', 'অনলাইন প্ৰৱঞ্চনাৰ পৰা সাৱধান',
     'Recognizing scams and protecting yourself',
     'धोखाधड़ी पहचानें और खुद को बचाएं',
     'প্ৰৱঞ্চনা চিনাক্ত কৰক আৰু নিজকে সুৰক্ষিত ৰাখক',
     15, 6),
    ('T21.1', 'M5', 'Local Digital Services', 'स्थानीय डिजिटल सेवाएं', 'স্থানীয় ডিজিটেল সেৱা',
     'State and local online services',
     'राज्य और स्थानीय ऑनलाइन सेवाएं',
     'ৰাজ্য আৰু স্থানীয় অনলাইন সেৱা',
     15, 7),
    ('T21.2', 'M5', 'Digital Health Services', 'डिजिटल स्वास्थ्य सेवाएं', 'ডিজিটেল স্বাস্থ্য সেৱা',
     'Telemedicine and health apps',
     'टेलीमेडिसिन और स्वास्थ्य ऐप्स',
     'টেলিমেডিচিন আৰু স্বাস্থ্য এপ্‌',
     15, 8),
    ('T22.1', 'M5', 'Educational Apps & Resources', 'शैक्षिक ऐप्स और संसाधन', 'শৈক্ষিক এপ্‌ আৰু সম্পদ',
     'Free learning resources online',
     'मुफ्त ऑनलाइन शिक्षण संसाधन',
     'বিনামূলীয়া অনলাইন শিক্ষণ সম্পদ',
     15, 9),
    ('T22.2', 'M5', 'Future of Digital Literacy', 'डिजिटल साक्षरता का भविष्य', 'ডিজিটেল সাক্ষৰতাৰ ভৱিষ্যত',
     'Continuing your digital journey',
     'अपनी डिजिटल यात्रा जारी रखें',
     'আপোনাৰ ডিজিটেল যাত্ৰা অব্যাহত ৰাখক',
     15, 10)
ON CONFLICT (id) DO UPDATE SET
    module_id = EXCLUDED.module_id,
    name_en = EXCLUDED.name_en,
    name_hi = EXCLUDED.name_hi,
    name_as = EXCLUDED.name_as,
    description_en = EXCLUDED.description_en,
    description_hi = EXCLUDED.description_hi,
    description_as = EXCLUDED.description_as,
    duration_minutes = EXCLUDED.duration_minutes,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get all modules with their topic counts
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
    topic_count BIGINT
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
        COUNT(t.id) as topic_count
    FROM public.modules m
    LEFT JOIN public.topics t ON t.module_id = m.id AND t.is_active = true
    WHERE m.is_active = true
    GROUP BY m.id
    ORDER BY m.display_order;
$$;

-- Get topics for a specific module
CREATE OR REPLACE FUNCTION public.get_module_topics(p_module_id TEXT)
RETURNS TABLE (
    id TEXT,
    name_en TEXT,
    name_hi TEXT,
    name_as TEXT,
    description_en TEXT,
    description_hi TEXT,
    description_as TEXT,
    duration_minutes INTEGER,
    display_order INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        t.id,
        t.name_en,
        t.name_hi,
        t.name_as,
        t.description_en,
        t.description_hi,
        t.description_as,
        t.duration_minutes,
        t.display_order
    FROM public.topics t
    WHERE t.module_id = p_module_id
    AND t.is_active = true
    ORDER BY t.display_order;
$$;

-- Get a single topic by ID
CREATE OR REPLACE FUNCTION public.get_topic(p_topic_id TEXT)
RETURNS TABLE (
    id TEXT,
    module_id TEXT,
    name_en TEXT,
    name_hi TEXT,
    name_as TEXT,
    description_en TEXT,
    description_hi TEXT,
    description_as TEXT,
    duration_minutes INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        t.id,
        t.module_id,
        t.name_en,
        t.name_hi,
        t.name_as,
        t.description_en,
        t.description_hi,
        t.description_as,
        t.duration_minutes
    FROM public.topics t
    WHERE t.id = p_topic_id;
$$;
