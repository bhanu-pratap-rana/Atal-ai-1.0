-- =====================================================
-- Migration 157: Seed Missing Assamese Curriculum Content
-- =====================================================
--
-- This migration adds missing Assamese content for:
-- - Module 4 (Digital Communication): Topics 12.1-15.2
-- - Module 5 (Local Technology & Services): Topics 16.1-19.2
-- - Module 1-3: Various missing early topics
--
-- Content extracted from the complete Assamese curriculum at:
-- docs/curriculum/markdown/ATAL_Digital_Empowerment_Curriculum_Assamese_Complete.md
--
-- =====================================================

-- =====================================================
-- MODULE 4: DIGITAL COMMUNICATION (Topics 12.1 - 15.2)
-- =====================================================

-- Topic 12.1: Email Account Creation and Security
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T12.1', 'as', 'curriculum', 'ইমেইল একাউণ্ট সৃষ্টি আৰু সুৰক্ষা', 'ইমেইল হৈছে অধ্যয়ন, চাকৰি, আৰু সেৱাৰ বাবে আপোনাৰ অফিচিয়েল ডিজিটেল ঠিকনা।

মূল কথাসমূহ:
• ঠিকনা: name@example.com
• পাছৱৰ্ড: শক্তিশালী আৰু অনন্য
• 2-পদক্ষেপ: পাছৱৰ্ড + OTP/এপ ক''ড
• পুনৰুদ্ধাৰ: ফোন + বিকল্প ইমেইল

পদক্ষেপ-অনুসৰি:
1. এটা পৰিষ্কাৰ ঠিকনা বাছক (যেনে, ritu.sharma.2025@...)
2. এটা শক্তিশালী পাছৱৰ্ড নিৰ্ধাৰণ কৰক (8+ আখৰ, মিশ্ৰিত)
3. পুনৰুদ্ধাৰ ফোন আৰু বেকআপ ইমেইল যোগ কৰক
4. 2-পদক্ষেপ সত্যাপন অন কৰক
5. নিৰাপদ ঠাইত পুনৰুদ্ধাৰৰ তথ্য লিখক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T12.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'পঞ্চায়তৰ ঠিকনা পুথিৰ দৰে - আপোনাৰ ঘৰৰ যেনেকৈ এটা অনন্য প্ৰৱেশ আছে, আপোনাৰ ইমেইলও এটা অনন্য ডিজিটেল ঠিকনা।');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T12.1', 'as', 'example', 'সাধাৰণ ভুল', '❌ সকলোতে ডাকনাম+জন্ম বছৰ ব্যৱহাৰ কৰা → ✅ অতিৰিক্ত আখৰ/সংখ্যা যোগ কৰক স্বকীয়তাৰ বাবে
❌ সকলো চাইটৰ বাবে একে পাছৱৰ্ড → ✅ গুৰুত্বপূৰ্ণ একাউণ্টৰ বাবে পৃথক পাছৱৰ্ড');

-- Topic 12.2: Writing Professional Emails
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T12.2', 'as', 'curriculum', 'পেছাদাৰীভাৱে ৰচনা, সংলগ্ন আৰু প্ৰেৰণ', 'এটা ভাল ইমেইল চুটি, ভদ্ৰ, আৰু কাৰ্য/সময়ৰ বিষয়ে স্পষ্ট।

ইমেইল গঠন:
• TO: সঠিক ব্যক্তি
• CC: আন যিসকলে জানিব লাগে
• BCC: লুকাই থকা গ্ৰাহক
• বিষয়: চুটি উদ্দেশ্য (যেনে, "ছুটীৰ অনুৰোধ 12-14 অক্টোবৰ")
• BODY: অভিবাদন → কাৰণ বিৱৰণ → অনুৰোধ + ধন্যবাদ
• ATTACH: সঠিক ফাইল; আকাৰ/নাম পৰীক্ষা কৰক

পদক্ষেপ-অনুসৰি:
1. বিষয়: "বৃত্তিৰ নথি - ঋতু শৰ্মা - 2025"
2. শৰীৰ: অভিবাদন → উদ্দেশ্য তালিকা → সংলগ্ন ফাইলসমূহৰ সময়সীমা → ধন্যবাদ
3. স্পষ্ট নামৰ সৈতে ফাইলসমূহ সংলগ্ন কৰক
4. পুনৰ পঢ়ক; তাৰ পিছত পঠাওক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T12.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'প্ৰধান শিক্ষকলৈ আনুষ্ঠানিক পত্ৰৰ দৰে - একে অংশ: ঠিকনা, বিষয়, ভদ্ৰ ভাষা, সংলগ্নতা (প্ৰমাণপত্ৰ), স্বাক্ষৰ।');

-- Topic 12.3: Inbox Organization and Filters
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T12.3', 'as', 'curriculum', 'ইনবক্স পৰিষ্কাৰ-পৰিচ্ছন্নতা আৰু সৰল ফিল্টাৰসমূহ', 'পৰিষ্কাৰ ইনবক্সে সময় ৰাহি কৰে আৰু গুৰুত্বপূৰ্ণ মেইল হেৰুওৱাৰ পৰা ৰক্ষা কৰে।

ইনবক্স যত্ন:
• লেবেল/ফোল্ডাৰ: বিদ্যালয় / পৰিয়াল / কৰ্ম অনুসৰি গোট
• তাৰকা/পতাকা: গুৰুত্বপূৰ্ণ চিহ্নিত কৰক
• ফিল্টাৰসমূহ: যদি শিক্ষকৰ পৰা → "বিদ্যালয়" লেবেল
• আনচাবস্ক্ৰাইব: কেৱল নিৰাপদ বাতৰি কাকত

পদক্ষেপ-অনুসৰি:
1. লেবেল তৈয়াৰ কৰক: স্কুল, পৰিয়াল, নথিপত্ৰ
2. এটা ফিল্টাৰ বনাওক: পৰা: teacher@ → "School" লেবেল → Star
3. অবাঞ্ছিত প্ৰমো মেইলৰ পৰা আনচাবস্ক্ৰাইব কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T12.3', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'গাঁৱৰ জাননী বৰ্ড সজাই পৰাই তোলাৰ দৰে - পৃথক পৃথক স্তূপ: বিদ্যালয়, স্বাস্থ্য শিবিৰ, বজাৰ, চৰকাৰ।');

-- Topic 13.1: WhatsApp Account Security and Privacy Settings
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T13.1', 'as', 'curriculum', 'একাউণ্ট সুৰক্ষা আৰু গোপনীয়তা সংহতিসমূহ', 'আপোনাৰ ফটো কোনে চাব পাৰে, শেষবাৰৰ বাবে দেখা, বিষয়ে, অৱস্থা, আৰু কোনে আপোনাক গোটত যোগ কৰিব পাৰে নিয়ন্ত্ৰণ কৰক।

WhatsApp Settings → গোপনীয়তা:
• শেষবাৰৰ বাবে দেখা/অনলাইন: মোৰ যোগাযোগসমূহ
• প্ৰফাইল ফটো: মোৰ যোগাযোগসমূহ
• গ্ৰুপ: মোৰ যোগাযোগ বাদ দি...
• 2-পদক্ষেপ পৰীক্ষণ: অন (PIN)
• অদৃশ্য হোৱা বাৰ্তা: স্পৰ্শকাতৰ আড্ডাৰ বাবে 24h/7d

পদক্ষেপ-অনুসৰি:
1. 2-পদক্ষেপ সত্যাপন অন কৰক (PIN + ইমেইল ছেট কৰক)
2. প্ৰফাইল ফটো ছেট কৰক: মোৰ যোগাযোগসমূহ
3. গোটসমূহ নিৰ্ধাৰণ কৰক: মোৰ পৰিচয়সমূহ বাহিৰে (অজ্ঞাত যোগসমূহ ব্লক কৰিবলৈ)
4. স্পৰ্শকাতৰ আড্ডাৰ বাবে অদৃশ্য বাৰ্তাসমূহ বিবেচনা কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T13.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'ঘৰৰ গেট আৰু দৰ্শনাৰ্থীৰ নিয়মৰ দৰে - আপোনাৰ চোতালখন কোনে চাব পাৰে আৰু কোনে আনক ভিতৰলৈ মাতিব পাৰে সেইটো আপুনি নিৰ্ণয় কৰে।');

-- Topic 13.2: Groups, Forwarding and Rumor Control
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T13.2', 'as', 'curriculum', 'গোট, ফৰৱাৰ্ডিং আৰু উৰাবাতৰি নিয়ন্ত্ৰণ', 'ফৰৱাৰ্ড কৰাৰ আগতে চিন্তা কৰক। কেৱল পৰীক্ষিত তথ্য শ্বেয়াৰ কৰক। গোটৰ নিয়মক সন্মান কৰক।

গ্ৰুপৰ ভাল পদ্ধতি:
• সুধিব: উপযোগী, সঁচা, প্ৰয়োজন?
• ক্ৰেডিটৰ উৎস (লিংক/অফিচিয়েল পেজ)
• সন্মতি অবিহনে কোনো ব্যক্তিগত তথ্য নাই
• নিস্তব্ধ কোলাহলপূৰ্ণ গোট; প্ৰয়োজন হ''লে ভদ্ৰভাৱে এৰি দিব

পদক্ষেপ-অনুসৰি:
1. দাবীসমূহ পৰীক্ষা কৰক (তাৰিখ, উৎস, চৰকাৰী লিংক)
2. ফৰৱাৰ্ড কৰাৰ সময়ত প্ৰসংগ যোগ কৰক
3. ক্ষতিকাৰক বিষয়বস্তু এডমিনক ৰিপোৰ্ট কৰা
4. সন্মানেৰে গোটটোবোৰ নিস্তব্ধ কৰা বা এৰি দিয়া');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T13.2', 'as', 'example', 'সাধাৰণ ভুল', '❌ "জৰুৰী চৰকাৰী পুৰস্কাৰ" ফৰৱাৰ্ড কৰা → ✅ gov.in বা স্থানীয় কাৰ্যালয়ত পৰীক্ষা কৰক
❌ অনুমতি অবিহনে আনৰ ফটো পোষ্ট কৰা → ✅ প্ৰথমে সন্মতি (অনুমতি) বিচাৰক');

-- Topic 13.3: Backups, Device Linking and Scams
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T13.3', 'as', 'curriculum', 'বেকআপসমূহ, ডিভাইচ সংযোগ আৰু কেলেংকাৰীসমূহ', 'আড্ডাসমূহ নিৰাপদে বেক আপ কৰক; সংযুক্ত ডিভাইচসমূহ ব্যৱহাৰ কৰক; সাধাৰণ প্ৰতাৰণা চিনাক্ত কৰক।

মূল সংহতিসমূহ:
• বেকআপসমূহ: আড্ডাসমূহ ক্লাউড/ফোনত সংৰক্ষণ কৰক (গোপনীয়তা মনত ৰাখক)
• লিংক কৰা ডিভাইচসমূহ: WhatsApp ৱেব খুলিবলৈ QR ব্যৱহাৰ কৰক; ব্যৱহাৰৰ পিছত লগআউট কৰক
• কেলেংকাৰী: "মোলৈ আপোনাৰ ক''ড পঠাওক," ভুৱা চাকৰিৰ প্ৰস্তাৱ, পুৰস্কাৰৰ লিংক

সুৰক্ষা নিয়ম:
• কেতিয়াও 6-ডিজিটৰ ক''ড/OTP শ্বেয়াৰ নকৰিব
• অংশীদাৰী PCসমূহত লগ আউট কৰক
• সন্দেহজনক বাৰ্তা আহিলে ব্লক/ৰিপোৰ্ট কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T13.3', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'দোকান লেজাৰ আৰু অতিৰিক্ত কাউণ্টাৰৰ দৰে - লেজাৰৰ বেকআপ ফটোকপি; লিংক কৰা ডিভাইচ এটা অস্থায়ী কাউণ্টাৰ যি আপুনি ৰাতি বন্ধ কৰে।');

-- Topic 14.1: Video Call Basics
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T14.1', 'as', 'curriculum', 'কল যোগদান/হ''ষ্ট কৰা আৰু মৌলিক নিয়ন্ত্ৰণ', 'মিউট/আনমিউট, ভিডিঅ'' আৰম্ভ/বন্ধ, চেট খোলা, স্ক্ৰীন শ্বেয়াৰ, আৰু এৰি যোৱা ক''ত আছে জানক।

কল নিয়ন্ত্ৰণ (সাধাৰণ আইকন):
🎤 মাইক | 🎥 কেমেৰা | 💬 চেট | 🖥️ শ্বেয়াৰ | 👋 এৰক

পদক্ষেপ-অনুসৰি:
1. যোগদানৰ আগতে মাইক/কেমেৰা পৰীক্ষা কৰক
2. নকওঁতে মিউট কৰক
3. লিংক/প্ৰশ্নৰ বাবে চেট ব্যৱহাৰ কৰক
4. কেৱল প্ৰয়োজনীয় উইণ্ড'' শ্বেয়াৰ কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T14.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'সম্প্ৰদায়ৰ সভাৰ দৰে - হাত তোলক (চেট), মাতিলে কওক (আনমিউট), কোঠাত নথি দেখুৱাওক (স্ক্ৰীন শ্বেয়াৰ)।');

-- Topic 14.2: Low Data, Low Noise Calling Etiquette
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T14.2', 'as', 'curriculum', 'কম ডাটা, কম শব্দ কলিং শিষ্টাচাৰ', 'কলত ডাটা ব্যৱহাৰ হ্ৰাস কৰা আৰু ভদ্ৰ হোৱা।

কম বেণ্ডউইড্থ টিপছ:
• প্ৰয়োজন হ''লে ভিডিঅ'' বন্ধ কৰক
• কেৱল অডিঅ'' ম''ড
• হেডফোন = কম ইকো
• দীঘল লিংকৰ বাবে চেট
• সম্ভৱ হ''লে অফ-পিকত সময়সূচী কৰক

পদক্ষেপ-অনুসৰি:
1. লেগ হ''লে ভিডিঅ'' বন্ধ কৰক
2. হেডফোন ব্যৱহাৰ কৰক; মাইক ওচৰত ৰাখক
3. চেটত কাম সাৰাংশ কৰক
4. শেষত কাৰ্য বিন্দু ৰেকৰ্ড কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T14.2', 'as', 'example', 'সাধাৰণ ভুল', '❌ আনৰ ওপৰত কোৱা → ✅ অপেক্ষা কৰক, তাৰ পিছত কওক
❌ 4G প্ৰায় শেষ → ✅ অডিঅ''লৈ সলনি কৰক; চমুকৈ ৰাখক');

-- Topic 15.1: Respectful Messaging and Tone
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T15.1', 'as', 'curriculum', 'সন্মানজনক বাৰ্তা আৰু সুৰ', 'অধ্যয়ন/কাম/সম্প্ৰদায়ৰ বাবে সন্মানজনক বাৰ্তা লিখা।

বাৰ্তা পৰীক্ষা:
• উদ্দেশ্য স্পষ্ট?
• ভদ্ৰ অভিবাদন/সমাপ্তি?
• শব্দ সহজ (অষ্টম শ্ৰেণী)?
• পঠোৱাৰ সময় ঠিক আছে (মাজনিশা নহয়)?

পদক্ষেপ-অনুসৰি:
1. অভিবাদন আৰু উদ্দেশ্যৰে আৰম্ভ কৰক
2. চুটি পেৰাগ্ৰাফ আৰু বুলেট ব্যৱহাৰ কৰক
3. কাৰ্য/তাৰিখ স্পষ্টকৈ সুধিব
4. পঢ়ুৱৈক ধন্যবাদ দিয়ক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T15.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'বয়োজ্যেষ্ঠ/শিক্ষকৰ সৈতে কথা পতাৰ দৰে - আপুনি সন্মান দেখুৱাবলৈ সুৰ আৰু সময় সামঞ্জস্য কৰে।');

-- Topic 15.2: Consent, Photos and Digital Footprint
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T15.2', 'as', 'curriculum', 'সন্মতি, ফটো আৰু ডিজিটেল ফুটপ্ৰিণ্ট', 'অনুমতি বিচাৰা; পৰিচয় সুৰক্ষিত কৰা; পোষ্ট দীৰ্ঘ সময় থাকে বুজা।

মূল ধাৰণা:
• এবাৰ শ্বেয়াৰ কৰিলে, ফটো/বাৰ্তা বিয়পিব পাৰে আৰু অনলাইনত থাকিব পাৰে
• আনৰ ছবি পোষ্ট কৰাৰ আগতে সদায় সুধিব
• ফুটপ্ৰিণ্ট = মানুহে পিছত আপোনাৰ বিষয়ে কি বিচাৰি পায়

পদক্ষেপ-অনুসৰি:
1. কাৰোবাৰ ফটো বা কাহিনী শ্বেয়াৰ কৰাৰ আগতে সন্মতি বিচাৰক
2. দৰ্শক নিয়ন্ত্ৰণ ব্যৱহাৰ কৰক (কেৱল পৰিচিত)
3. কোনোবাই সন্মতি প্ৰত্যাহাৰ কৰিলে মচি দিয়ক
4. নিজৰ ফুটপ্ৰিণ্ট পৰ্যালোচনা কৰক (আপোনাৰ নাম সন্ধান কৰক)');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M4', 'T15.2', 'as', 'example', 'সাধাৰণ ভুল', '❌ নাবালকৰ মুখ ৰাজহুৱাকৈ পোষ্ট কৰা → ✅ ব্লাৰ/লুকুৱাওক বা পোষ্ট নকৰিব
❌ ID কাৰ্ড শ্বেয়াৰ কৰা → ✅ নম্বৰ ৰিডাক্ট কৰক; পোষ্ট নকৰিব');

-- =====================================================
-- MODULE 5: LOCAL TECHNOLOGY & SERVICES (Topics 16.1 - 19.2)
-- =====================================================

-- Topic 16.1: Finding Government Services
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T16.1', 'as', 'curriculum', 'চৰকাৰী সেৱা বিচাৰি উলিওৱা', 'প্ৰামাণিক চৰকাৰী ৱেবছাইট আৰু সেৱা লাভৰ সুৰক্ষিত উপায় চিনাক্ত কৰা।

মূল কথা:
• চৰকাৰী সেৱা চৰকাৰী ৱেবছাইটত উপলব্ধ (সাধাৰণতে .gov.in ত শেষ হয়)
• ডিভাইচ বা ডাটা নাথাকিলে, CSC (সাধাৰণ সেৱা কেন্দ্ৰ) বা বিদ্যালয়/সম্প্ৰদায়ৰ লেব ব্যৱহাৰ কৰক

সন্ধান প্ৰক্ৰিয়া:
সেৱাৰ প্ৰয়োজন → সন্ধান: site:gov.in + "সেৱাৰ নাম" + "অসম"
পৰীক্ষা কৰক: .gov.in ডমেইন, যোগাযোগ পৃষ্ঠা, শেহতীয়া তাৰিখ
ডিভাইচ নাথাকিলে → CSC / বিদ্যালয় লেবলৈ যাওক (নথি লৈ যাওক)');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T16.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'গাওঁ পঞ্চায়ত কাৰ্যালয়ৰ দৰে - চৰকাৰী জাননী বৰ্ডৰ দৰে, গছত আঁৰি থোৱা যাদৃচ্ছিক ফ্লায়াৰ নহয়।');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T16.1', 'as', 'example', 'সাধাৰণ ভুল', '❌ বিজ্ঞাপন বা চুটি লিংক ক্লিক কৰা → ✅ নিজে ঠিকনা টাইপ কৰক / বুকমাৰ্ক ব্যৱহাৰ কৰক
❌ যিকোনো ল''গ'' প্ৰকৃত বুলি ধৰি লোৱা → ✅ সম্পূৰ্ণ URL আৰু যোগাযোগ তথ্য পৰীক্ষা কৰক');

-- Topic 16.2: Secure Digital Documents
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T16.2', 'as', 'curriculum', 'সুৰক্ষিত ডিজিটেল নথি (স্কেনিং, নামকৰণ আৰু সংৰক্ষণ)', 'আবেদনৰ বাবে ডিজিটেল নথি সুৰক্ষিতভাৱে প্ৰস্তুত আৰু সংৰক্ষণ কৰা।

প্ৰক্ৰিয়া:
স্কেন → নাম দিয়ক (ID_Proof_2025.pdf) → ফোল্ডাৰ (Govt_Apps/2025) → বেকআপ (USB)

পদক্ষেপ-অনুসৰি:
1. ভাল পোহৰত স্কেন/ফটো তোলক; ধাৰ ক্ৰপ কৰক
2. নাম দিয়ক: নাম_নথিৰ_ধৰণ_বছৰ.pdf (ফাইলনামত সম্পূৰ্ণ নম্বৰ নিদিব)
3. নথি/Govt_Apps/বছৰ-ত সংৰক্ষণ কৰক
4. USB বা ফোন SD কাৰ্ডত বেকআপ কৰক
5. আপোনাৰ কি আছে তাৰ কাগজৰ চেকলিষ্ট ৰাখক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T16.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'গাঁৱৰ ৰেকৰ্ড ট্ৰাংকৰ দৰে - তলা থকা ট্ৰাংকত লেবেল দিয়া ফাইলৰ দৰে; আপুনি সুৰক্ষিত ঠাইত দ্বিতীয় কপি ৰাখে।');

-- Topic 16.3: Filling Forms on Shared Computers
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T16.3', 'as', 'curriculum', 'ভাগ-কৰা কম্পিউটাৰত ফৰ্ম পূৰণ', 'লেব/CSC/চাইবাৰ কেফেত সুৰক্ষিতভাৱে ফৰ্ম সম্পূৰ্ণ কৰা।

চেকলিষ্ট:
আগত: চেকলিষ্ট + USBত ফাইল
সময়ত: ব্যক্তিগত উইণ্ড'' • কোনো "পাছৱৰ্ড সংৰক্ষণ" নাই • ছাইট পৰীক্ষা কৰক
পিছত: লগ আউট • ডাউনলোড/ইতিহাস মচক • USB আঁতৰাওক

পদক্ষেপ-অনুসৰি:
1. প্ৰিণ্ট কৰা চেকলিষ্ট + USB ফোল্ডাৰ লৈ উপস্থিত হওক
2. ব্যক্তিগত/ইনকগনিটো খোলক; "পাছৱৰ্ড সংৰক্ষণ কৰক" অস্বীকাৰ কৰক
3. USBৰ পৰা ফাইল আপলোড কৰক; ফৰ্ম জমা দিয়ক
4. লগ আউট কৰক, ডাউনলোড/ইতিহাস মচি দিয়ক
5. আপুনি USB ঘূৰাই লৈছে বুলি নিশ্চিত কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T16.3', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'ৰাজহুৱা কুঁৱা ব্যৱহাৰৰ দৰে - আপুনি সাৱধানে পানী তোলে আৰু পিছত ঢাকনি বন্ধ কৰে।');

-- Topic 17.1: UPI Basics
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T17.1', 'as', 'curriculum', 'UPI মূল কথা (ID, PIN, QR, অনুৰোধ)', 'UPI ব্যৱহাৰ কৰি সুৰক্ষিতভাৱে পেমেণ্ট কৰা/লোৱা।

মূল শব্দ:
• UPI ID (VPA): আপোনাৰ পেমেণ্ট ঠিকনা (যেনে, name@bank)
• UPI PIN: টকা পঠিওৱাৰ গোপন ক''ড (কেতিয়াও শ্বেয়াৰ নকৰিব)
• QR: দোকানত পে কৰিবলৈ স্কেন
• সংগ্ৰহ অনুৰোধ: কোনোবাই আপোনাক পেমেণ্ট অনুমোদন কৰিবলৈ কয়

পদক্ষেপ-অনুসৰি:
1. আপোনাৰ বেংকৰ/UPI এপত UPI ছেট আপ কৰক; UPI PIN সৃষ্টি কৰক
2. পে কৰিবলৈ: দোকান QR স্কেন কৰক → পৰিমাণ দিয়ক → নাম পৰীক্ষা কৰক → PIN দিয়ক
3. পাবলৈ: আপোনাৰ UPI ID/QR শ্বেয়াৰ কৰক। পাবলৈ আপুনি PIN নিদিয়ে
4. ৰসিদৰ বাবে SMS/এপ পৰীক্ষা কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T17.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'দোকানত নগদ দিয়াৰ দৰে - আপুনি গণনা আৰু সন্মত হোৱাৰ পিছতহে পে কৰে---UPI একে: নিশ্চিত, তাৰ পিছত পে।');

-- Topic 17.2: Payment Fraud and Safety Rules
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T17.2', 'as', 'curriculum', 'পেমেণ্ট প্ৰতাৰণা আৰু সুৰক্ষা নিয়ম', 'UPI/QR/গ্ৰাহক-সেৱা প্ৰতাৰণা চিনাক্ত আৰু এৰাই চলা।

লাল পতাকা:
• "আপোনাৰ OTP/UPI PIN শ্বেয়াৰ কৰক"
• "এই স্ক্ৰীন-শ্বেয়াৰ এপ ইনষ্টল কৰক"
• "পুৰস্কাৰ পাবলৈ এই QR স্কেন কৰক"
• জৰুৰী ভাবুকি / পুৰস্কাৰ / ফীৰ সৈতে চাকৰি

সুৰক্ষা নিয়ম:
1. OTP/UPI PIN/স্ক্ৰীনশ্বেয়াৰ কেতিয়াও শ্বেয়াৰ নকৰিব
2. পাবলৈ, QR ক''ড স্কেন নকৰিব---পৰিশোধকক আপোনাৰ QR স্কেন কৰিবলৈ কওক
3. যদি "বেংক" ফোন কৰে, ফোন ৰাখক আৰু চৰকাৰী নম্বৰত ফোন কৰক
4. এপ/বেংকত প্ৰতাৰণা ৰিপোৰ্ট কৰক; নম্বৰ ব্লক কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T17.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'হাটত ভুৱা লটাৰীৰ দৰে - যদি বহুত ভাল যেন লাগে, সম্ভৱতঃ ফান্দ।');

-- Topic 17.3: Family/Shop Records and Budgeting
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T17.3', 'as', 'curriculum', 'পৰিয়াল/দোকান ৰেকৰ্ড আৰু বাজেটিং', 'সৰল ডিজিটেল/কাগজ লেজাৰ ৰাখা আৰু পেমেণ্ট মিলোৱা।

দৈনিক নগদ বহী:
তাৰিখ | বিৱৰণ | আয় | খৰচ | মোড (UPI/নগদ) | বেলেন্স
মিলোৱা: SMS/এপ মুঠ ↔ পাছবুক সপ্তাহত

পদক্ষেপ-অনুসৰি:
1. এখন টেবুল সৃষ্টি কৰক (কাগজ বা স্প্ৰেডশ্বীট)
2. প্ৰতিটো বিক্ৰী/খৰচ মোড (UPI/নগদ) সহ ৰেকৰ্ড কৰক
3. দিনৰ শেষত: মুঠ কৰক আৰু বেলেন্স আপডেট কৰক
4. সাপ্তাহিক: এপ/SMSক পাছবুকৰ সৈতে তুলনা কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T17.3', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'বহী-খাটা (দৈনিক খাতা)ৰ দৰে - প্ৰতিদিন সকলো বিক্ৰী/খৰচ লিখাৰ দৰে।');

-- Topic 18.1: Low-Data Product Photos and Descriptions
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T18.1', 'as', 'curriculum', 'কম-ডাটা সামগ্ৰীৰ ফটো আৰু বিৱৰণ', 'স্পষ্ট, সৰু আকাৰৰ ফটো তোলা আৰু উপযোগী বিৱৰণ লিখা।

ফটো টিপছ:
• খিৰিকীৰ পোহৰমুখী
• সৰল কাপোৰৰ পটভূমি
• স্থিৰ ধৰক
• ধাৰ ক্ৰপ কৰক
• কম্প্ৰেছ (≤500-800 KB)

বিৱৰণ:
• নাম • আকাৰ • সামগ্ৰী • ব্যৱহাৰ • যত্ন • মূল্য

পদক্ষেপ-অনুসৰি:
1. বস্তু খিৰিকীৰ ওচৰত ৰাখক; পিছফালে সৰল কাপোৰ ব্যৱহাৰ কৰক
2. 3টা কোণৰ পৰা তোলক; ক্ৰপ কৰক; কম্প্ৰেছ কৰক
3. ফাইলৰ নাম দিয়ক: মুগা_স্কাৰ্ফ_সোণালী_180x40চেমি_2025.jpg
4. বিৱৰণ: সামগ্ৰী, আকাৰ, ৰং, যত্ন, মূল্য, ডেলিভাৰী বিকল্প');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T18.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'বজাৰত শাৰী দেখুওৱাৰ দৰে - আপুনি ভাল পোহৰত সুন্দৰকৈ মেলি বৈশিষ্ট্য ব্যাখ্যা কৰে।');

-- Topic 18.2: Secure Sales Channels and Orders
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T18.2', 'as', 'curriculum', 'সুৰক্ষিত বিক্ৰী চেনেল আৰু অৰ্ডাৰ', 'কেটালগ সুৰক্ষিতভাৱে শ্বেয়াৰ কৰা; ক্ৰেতা পৰীক্ষা কৰা; স্পষ্ট অৰ্ডাৰ নিয়ম নিৰ্ধাৰণ কৰা।

বিক্ৰী চেকলিষ্ট:
• ক্ৰেতা পৰীক্ষিত? (ফোন/চেট ইতিহাস/ৰেফাৰেন্স)
• পেমেণ্ট মোড সন্মত? (UPI, COD)
• ডেলিভাৰী পৰিকল্পনা? (স্থানীয় পিকআপ/কুৰিয়াৰ)
• ৰিটাৰ্ণ/ৰিফাণ্ড চৰ্ত? (স্পষ্টকৈ লিখক)

পদক্ষেপ-অনুসৰি:
1. এটা সৰল কেটালগ শ্বেয়াৰ কৰক (ফটো + বিৱৰণ + মূল্য)
2. ক্ৰেতা পৰীক্ষা কৰক (চুটি চেট/কল)
3. আগতীয়া লওক বা COD ব্যৱহাৰ কৰক; ৰসিদ ৰাখক
4. ডেলিভাৰী তাৰিখ শ্বেয়াৰ কৰক; সুৰক্ষিতভাৱে পেক কৰক; প্ৰমাণ ফটো ৰাখক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T18.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'হাটত অৰ্ডাৰ লোৱাৰ দৰে - আপুনি বোৱাৰ আগতে পৰিমাণ, মূল্য, পিকআপ সময় নিশ্চিত কৰে।');

-- Topic 19.1: Weather and Advice with Low Data
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T19.1', 'as', 'curriculum', 'কম ডাটাৰে বতৰ আৰু পৰামৰ্শ', 'কাম পৰিকল্পনা কৰিবলৈ কম-ডাটা বতৰ/পৰামৰ্শ বিকল্প ব্যৱহাৰ কৰা।

সপ্তাহৰ পৰিকল্পনা:
• বৰষুণ? (হয়/নহয়)
• তাপমাত্ৰা পৰিসৰ
• বতাহ (স্প্ৰে সুৰক্ষিত/নহয়)
• পৰিকল্পনা: জলসিঞ্চন / স্প্ৰে / চপোৱা / সংৰক্ষণ

পদক্ষেপ-অনুসৰি:
1. সপ্তাহৰ বাবে বৰষুণৰ সম্ভাৱনা আৰু বতাহ নোট কৰক
2. শান্ত, শুকান সময়ত স্প্ৰে নিৰ্ধাৰণ কৰক
3. গধুৰ বৰষুণৰ আগতে চপোৱা আৰু শুকোৱা পৰিকল্পনা কৰক
4. এটা সৰল সাপ্তাহিক খেতি পৰিকল্পনা লিখক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T19.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'বাৰিষাৰ বাবে প্ৰস্তুতিৰ দৰে - আপুনি আকাশ আৰু ৰেডিঅ'' চাই, তাৰ পিছত ধান খেতিৰ কাম পৰিকল্পনা কৰে।');

-- Topic 19.2: Farm Records and Costs (Profit Basics)
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T19.2', 'as', 'curriculum', 'খেতি ৰেকৰ্ড আৰু খৰচ (লাভৰ মূল কথা)', 'লাভ চাবলৈ সৰল খৰচ/উৎপাদন ৰেকৰ্ড ৰখা।

খৰচ শ্বীট:
বস্তু | পৰিমাণ | হাৰ | মুঠ

উৎপাদন শ্বীট:
শস্য | পৰিমাণ | মূল্য | মুঠ

লাভ = (উৎপাদন মুঠ) − (খৰচ মুঠ)

পদক্ষেপ-অনুসৰি:
1. দুখন টেবুল বনাওক: খৰচ আৰু উৎপাদন
2. মুঠ যোগ কৰক; লাভ গণনা কৰক
3. উন্নত পৰিকল্পনা বাছিবলৈ জাত/ঋতু তুলনা কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T19.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'ঘৰুৱা বাজেটৰ দৰে - খাদ্য আৰু বিলৰ বাবে মাহেকীয়া বাজেটৰ দৰে।');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M5', 'T19.2', 'as', 'example', 'সাধাৰণ ভুল', '❌ সৰু খৰচ (পৰিবহন) পাহৰা → ✅ সকলো অন্তৰ্ভুক্ত কৰক
❌ কোনো বেকআপ নাই → ✅ USBলৈ কপি কৰক বা কাগজৰ শ্বীটৰ ফটো তোলক');

-- =====================================================
-- MODULE 1: MISSING EARLY TOPICS (T1.1 - T3.2)
-- =====================================================

-- Topic 1.1: Four Functions of Computer (I → P → O → S)
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T1.1', 'as', 'curriculum', 'কম্পিউটাৰৰ চাৰিটা কাম (I → P → O → S)', 'প্ৰতিটো কম্পিউটাৰে 4টা কাম কৰে: Input → Processing → Output → Storage

• ইনপুট (Input): আপুনি তথ্য দিয়ে (কিব''ৰ্ড/মাউছ/টাচ)
• প্ৰচেছিং (Processing): কম্পিউটাৰৰ মগজুৱে (CPU) সেই তথ্যৰ ওপৰত কাম কৰে
• আউটপুট (Output): আপুনি ফলাফল স্ক্ৰীণ/ছাউণ্ড/প্ৰিন্টত দেখা পায়
• ষ্ট''ৰেজ (Storage): তাৰ পিছত ফাইল সংৰক্ষণ হয়, বিদ্যুৎ আঁতৰি গ''লেও সুৰক্ষিত থাকে

উদাহৰণ (পদক্ষেপে পদক্ষেপে):
1. ন''ট এপত এটা শাৰী টাইপ কৰক → Input
2. CPU য়ে অক্ষৰ ঠিক কৰি দিয়ে → Processing
3. স্ক্ৰীণত লিখনী দেখা যায় → Output
4. সংৰক্ষণ কৰিবলৈ Ctrl + S টিপক → Storage');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T1.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'গাঁৱৰ সামুদায়িক সভাগৃহৰ দৰে:
• ইনপুট (Input) = মানুহে সমস্যাত আবেদন জমা দিয়ে
• প্ৰচেছিং (Processing) = হলৰ মেনেজাৰে কামৰ পৰিকল্পনা আৰু ৰূপৰেখা কৰে
• আউটপুট (Output) = ফলাফল ফলকত ঘোষণা কৰা হয়
• ষ্টোৰেজ (Storage) = কাগজপত্ৰ ভাণ্ডাৰত সুৰক্ষিত ৰখা হয়');

-- Topic 1.2: Main Parts You See and Use
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T1.2', 'as', 'curriculum', 'আপুনি দেখা আৰু ব্যৱহাৰ কৰা মুখ্য অংশসমূহ', 'সাধাৰণ কম্পিউটাৰ অংশসমূহ চিনাক্ত কৰি সিহঁতে কি কৰে জানক।

• মনিটৰ (স্ক্ৰীণ): লেখ/ছবি দেখুৱায় (Output/আউটপুট)
• কিব''ৰ্ড/মাউছ/টাচ: আপুনি আদেশ দিয়ে (Input/ইনপুট)
• CPU/চিষ্টম ইউনিট: কম্পিউটাৰৰ মগজু (Processing)
• Storage (সংৰক্ষণ) (HDD/SSD/USB): ফাইল সুৰক্ষিত ৰাখে (Storage)');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T1.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'সাপ্তাহিক হাট (বজাৰ)ৰ দৰে:
• দোকান = মনিটৰ সামগ্ৰীসমূহ প্ৰদৰ্শন কৰে
• গ্ৰাহকে অ''ৰ্ডাৰ দিয়ে = Input/ইনপুট
• মাৰ্কেট/হাটৰ মেনেজাৰ = CPU কাম ব্যৱস্থাপনা কৰে
• গুদাম ঘৰ = Storage');

-- Topic 2.1: RAM vs Storage
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T2.1', 'as', 'curriculum', 'RAM বনাম Storage — কামৰ টেবুল বনাম আলমাৰি', 'অস্থায়ী RAM আৰু স্থায়ী সংৰক্ষণৰ পাৰ্থক্য বুজাই দিয়া।

• RAM (কামৰ টেবুল): যি কাম এতিয়া আপুনি ব্যৱহাৰ কৰি ধৰি ৰাখিছে; বিদ্যুৎ বন্ধ হ''লে মচি যায়
• Storage (আলমাৰি/ভাণ্ডাৰ): ফাইল বহু মাহ/বছৰলৈ ৰাখে

তুলনা:
| RAM (কামৰ টেবুল) | STORAGE (আলমাৰি) |
| অস্থায়ী (সাফ হয়) | স্থায়ী (থাকে) |
| অতি দ্ৰুত | অধিক ক্ষমতা |
| এতিয়া খোলা এপ্পৰ বাবে | সংৰক্ষিত ফাইলৰ বাবে |');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T2.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'ধান মৰণি বনাম ধানৰ ভঁৰালৰ দৰে:
• RAM = দৈনিক ধান মৰণি স্থান (দ্ৰুত আৰু সন্ধিয়া সাফ কৰি থোৱা হয়)
• Storage = সামূহিক ধানৰ ভঁৰাল (সংগঠিত, দীৰ্ঘদীয়া সময়ৰ বাবে সুৰক্ষিত)');

-- Topic 2.2: Saving Files Habit
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T2.2', 'as', 'curriculum', 'বিদ্যুৎ নাহিলে ফাইল সংৰক্ষন কৰাৰ অভ্যাস', 'সহজ অভ্যাস ব্যৱহাৰ কৰি কাম হেৰুৱা নহ''ব।

মূল অভ্যাস:
• সোনকালেই আৰু নিয়মিত Save কৰক (Ctrl + S)
• Save As কৰে ভাল নাম আৰু সঠিক ফোল্ডাৰত ৰাখক
• AutoSave/Auto-Recover উপলব্ধ থাকিলে অন কৰক

সংৰক্ষণ চক্ৰ:
প্ৰতি 10 মিনিট: Ctrl + S
দিনৰ শেষত: Save As → Backup_YYYY_MM USB/ফোনত
সাপ্তাহিক: Backup ফাইল খুলি পৰীক্ষা কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T2.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'দোকান বন্ধ কৰাৰ সময়ৰ দৰে - বন্ধ কৰাৰ আগতে দোকানদাৰে সন্ধিয়া টকা গণে, আলমাৰি লক কৰে, ৰেকৰ্ডৰ নকল ৰাখে — ফাইলৰ ক্ষেত্ৰতো একৈ।');

-- Topic 2.3: Backup Basics - 3-2-1 Rule
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T2.3', 'as', 'curriculum', 'Backup Basics — সহজ 3-2-1 নিয়ম', 'মৌলিক Backup পৰিকল্পনা ব্যৱহাৰ কৰি গুৰুত্বপূৰ্ণ ফাইল সুৰক্ষিত ৰাখিব পাৰিব।

3-2-1 নিয়ম:
• 3টা Copy (Original + USB + দ্বিতীয় USB/Cloud)
• 2টা মাধ্যম (Device + USB)
• 1টা Offsite (দ্বিতীয় USB ঘৰে/স্কুলত)

পদক্ষেপ-অনুসৰি:
"Backups/YYYY_MM" Folder বনাওক → সপ্তাহে সপ্তাহে গুৰুত্বপূৰ্ণ ফাইল Copy কৰক → খুলিলে পৰীক্ষা কৰক');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T2.3', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'বীজ সংৰক্ষণৰ দৰে - কৃষকে একেই বীজ বিভিন্ন ঠাইত আৰু বিভিন্ন ভঁৰালত ৰাখে, যাতে সম্পূৰ্ণ হেৰুৱা নযায়।');

-- Topic 3.1: What is a File? (Types and Extensions)
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T3.1', 'as', 'curriculum', 'ফাইল কি? (প্ৰকাৰ আৰু সম্প্ৰসাৰণ)', 'সাধাৰণ ফাইলৰ ধৰণ আৰু সম্প্ৰসাৰণৰ অৰ্থ কি চিনাক্ত কৰা।

এটা ফাইলে আপোনাৰ তথ্য ৰাখে আৰু ইয়াৰ এটা নাম + সম্প্ৰসাৰণ আছে:
• .docx (শব্দ)
• .pdf (নিৰ্দিষ্ট ডক)
• .jpg/.png (ফটো)
• .mp3 (সংগীত)
• .mp4 (ভিডিঅ'')
• .txt (সাধাৰণ লিখনী)

উদাহৰণ:
নাম + সম্প্ৰসাৰণ = ফাইল
স্কুল_ৰচনা_জানুৱাৰী2025.docx
পৰিয়ালৰ_ফটো_বিহু2025.jpg');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T3.1', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'গাঁৱৰ ৰেকৰ্ড বুকৰ দৰে - জন্ম, মাটি, কৰৰ বাবে বিভিন্ন কিতাপ: কামৰ বাবে বিভিন্ন ফাইল প্ৰকাৰ।');

-- Topic 3.2: Good File Names
INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T3.2', 'as', 'curriculum', 'মানুহে বুজি পোৱা ভাল ফাইলৰ নাম', 'স্পষ্ট, উপযোগী নাম সৃষ্টি কৰা।

নিয়ম: কোন/কি + উদ্দেশ্য + তাৰিখ আৰু _ বা – (কোনো খালী ঠাই/চিহ্ন নাই)

উদাহৰণ:
ভাল: শৰ্মা_বিবাহ_জানুৱাৰী2025_অনুষ্ঠান_001.jpg
বেয়া: IMG_4321.jpg বা Doc1.docx

2025 চনত বৃত্তি প্ৰয়-পত্ৰৰ বাবে:
ভাল: বৃত্তি_প্ৰপত্ৰ_2025.pdf
বেয়া: মাইফাইল.pdf');

INSERT INTO curriculum_content (module_id, topic_id, language, content_type, title, content)
VALUES ('M1', 'T3.2', 'as', 'cultural_context', 'সাংস্কৃতিক উপমা', 'লেবেলযুক্ত শস্যৰ বস্তাৰ দৰে - শস্য + ঋতু + বছৰ লিখা যাতে যিকোনো ব্যক্তিয়ে দ্ৰুতভাবে বিচাৰি পায়।');

-- =====================================================
-- Reload PostgREST schema cache
-- =====================================================

NOTIFY pgrst, 'reload schema';
