-- Migration: Add Missing Practice Questions and Multilingual Translations
-- This migration:
-- 1. Adds missing English questions for T9.4, T10.3, T10.4
-- 2. Adds Hindi translations for all existing English questions
-- 3. Adds Assamese translations for all existing English questions

-- ============================================
-- PART 1: Add Missing English Questions
-- ============================================

-- T9.4: Accounts, OTPs & 2-Step Verification (M3)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T9.4', 'M3', 'en',
   'What does OTP stand for?',
   '["One Time Password", "Online Transfer Protocol", "Open Transaction Portal", "Original Transaction Pin"]',
   0,
   'OTP means One Time Password - a temporary code sent to your phone or email for secure verification.',
   1),
  ('T9.4', 'M3', 'en',
   'Why is 2-step verification safer than just a password?',
   '["It uses two different verification methods", "It is faster", "It costs more", "It only works on computers"]',
   0,
   '2-step verification requires both your password AND another method (like OTP), making it much harder for hackers.',
   2),
  ('T9.4', 'M3', 'en',
   'What should you do if someone asks for your OTP over phone?',
   '["Share it immediately", "Never share it - it is a scam", "Share only half the digits", "Ask them to call back later"]',
   1,
   'Never share your OTP with anyone, even if they claim to be from a bank or company. This is always a scam.',
   3);

-- T10.3: Browser Privacy Basics (M3)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T10.3', 'M3', 'en',
   'What are browser cookies?',
   '["Small files that websites store on your computer", "Sweet treats you can eat", "Computer viruses", "Email attachments"]',
   0,
   'Cookies are small files websites store on your computer to remember things like login status and preferences.',
   1),
  ('T10.3', 'M3', 'en',
   'How can you browse without saving history?',
   '["Use Private/Incognito mode", "Delete the browser", "Turn off the computer", "Use a faster internet"]',
   0,
   'Private or Incognito mode lets you browse without saving history or cookies on the device.',
   2),
  ('T10.3', 'M3', 'en',
   'Why should you clear browser history on shared computers?',
   '["To free up space", "To protect your personal information", "To make the computer faster", "To update the browser"]',
   1,
   'Clearing history protects your personal information like visited sites and login details from others.',
   3);

-- T10.4: Safe Downloads (M3)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T10.4', 'M3', 'en',
   'From where should you download software?',
   '["Any website that offers it", "Only from official websites or app stores", "From email attachments", "From pop-up advertisements"]',
   1,
   'Always download software from official websites or app stores to avoid malware and viruses.',
   1),
  ('T10.4', 'M3', 'en',
   'What should you check before opening a downloaded file?',
   '["The file size only", "Scan with antivirus and check the source", "The download speed", "The color of the icon"]',
   1,
   'Always scan downloaded files with antivirus and verify they came from a trusted source.',
   2),
  ('T10.4', 'M3', 'en',
   'What type of file can be dangerous to open?',
   '["PDF documents only", "Executable files (.exe) from unknown sources", "Photos from family", "Text documents"]',
   1,
   'Executable files (.exe, .apk) from unknown sources can contain viruses. Always verify the source.',
   3);

-- ============================================
-- PART 2: Add Hindi Translations
-- ============================================
-- Note: This inserts Hindi versions of questions. In production, these would be
-- professionally translated. Below are key questions translated to Hindi.

-- M1 Hindi Questions (Sample - T1.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T1.1', 'M1', 'hi',
   'कंप्यूटर का मुख्य कार्य क्या है?',
   '["केवल फोन कॉल करना", "जानकारी को प्रोसेस करना और कार्य करना", "केवल संगीत बजाना", "केवल फोटो लेना"]',
   1,
   'कंप्यूटर एक मशीन है जो जानकारी को प्रोसेस करती है और विभिन्न कार्य करती है जैसे गणना, डेटा संग्रह, और प्रोग्राम चलाना।',
   1),
  ('T1.1', 'M1', 'hi',
   'इनमें से कौन सा कंप्यूटर हार्डवेयर का उदाहरण है?',
   '["माइक्रोसॉफ्ट वर्ड", "कीबोर्ड", "गूगल क्रोम", "व्हाट्सएप"]',
   1,
   'हार्डवेयर उन भौतिक पुर्जों को कहते हैं जिन्हें आप छू सकते हैं। कीबोर्ड हार्डवेयर है, जबकि वर्ड, क्रोम, और व्हाट्सएप सॉफ्टवेयर हैं।',
   2),
  ('T1.1', 'M1', 'hi',
   'स्मार्टफोन एक प्रकार का कंप्यूटर है। सही या गलत?',
   '["सही", "गलत"]',
   0,
   'सही! स्मार्टफोन एक छोटा पोर्टेबल कंप्यूटर है जो कॉल कर सकता है, इंटरनेट ब्राउज़ कर सकता है, और एप्लिकेशन चला सकता है।',
   3);

-- M1 Hindi Questions (T1.2)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T1.2', 'M1', 'hi',
   'मॉनिटर का क्या काम है?',
   '["टाइपिंग के लिए", "आउटपुट दिखाने के लिए (स्क्रीन)", "डेटा स्टोर करने के लिए", "इंटरनेट से जुड़ने के लिए"]',
   1,
   'मॉनिटर एक आउटपुट डिवाइस है जो हमें टेक्स्ट, इमेज और वीडियो दिखाता है।',
   1),
  ('T1.2', 'M1', 'hi',
   'CPU का क्या काम है?',
   '["चित्र दिखाना", "प्रोसेसिंग/सोचना - कंप्यूटर का दिमाग", "आवाज़ निकालना", "फाइल स्टोर करना"]',
   1,
   'CPU (Central Processing Unit) कंप्यूटर का दिमाग है जो सभी गणनाएँ और प्रोसेसिंग करता है।',
   2);

-- M2 Hindi Questions (Sample - T4.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T4.1', 'M2', 'hi',
   'डेस्कटॉप को जल्दी दिखाने के लिए कौन सी कुंजी है?',
   '["Ctrl + C", "Alt + Tab", "Windows + D", "Ctrl + Alt + Delete"]',
   2,
   'Windows + D डेस्कटॉप व्यू को टॉगल करता है।',
   1),
  ('T4.1', 'M2', 'hi',
   'स्टार्ट मेनू कहाँ होता है?',
   '["हमेशा ऊपर दाएँ", "नीचे बाएँ या बीच में (Windows संस्करण के अनुसार)", "हमेशा छिपा हुआ", "केवल फोन में"]',
   1,
   'नए Windows में स्टार्ट मेनू बीच में भी हो सकता है।',
   2);

-- M3 Hindi Questions (Sample - T9.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T9.1', 'M3', 'hi',
   'इंटरनेट क्या है?',
   '["एक कंप्यूटर", "कंप्यूटरों का एक वैश्विक नेटवर्क", "एक वेबसाइट", "एक सॉफ्टवेयर"]',
   1,
   'इंटरनेट दुनिया भर के कंप्यूटरों का एक नेटवर्क है जो जानकारी साझा करने की अनुमति देता है।',
   1),
  ('T9.1', 'M3', 'hi',
   'डेटा इंटरनेट पर कैसे यात्रा करता है?',
   '["एक बड़ी फाइल के रूप में", "छोटे पैकेट में टूटकर", "केवल रात में", "केवल धीरे-धीरे"]',
   1,
   'इंटरनेट पर डेटा छोटे पैकेट में टूटकर भेजा जाता है और गंतव्य पर फिर से जुड़ जाता है।',
   2);

-- M4 Hindi Questions (Sample - T12.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T12.1', 'M4', 'hi',
   '2-स्टेप वेरिफिकेशन में क्या होता है?',
   '["पासवर्ड + OTP", "केवल पासवर्ड", "केवल OTP", "कोई सुरक्षा नहीं"]',
   0,
   '2-स्टेप वेरिफिकेशन में पासवर्ड और OTP दोनों की जरूरत होती है।',
   1),
  ('T12.1', 'M4', 'hi',
   'ईमेल अकाउंट बनाते समय कौन सा पासवर्ड सबसे सुरक्षित है?',
   '["123456", "password", "Mera@Gaon2024!", "aaa"]',
   2,
   'मजबूत पासवर्ड में अक्षर, संख्या और विशेष चिह्न होने चाहिए।',
   2);

-- M5 Hindi Questions (Sample - T16.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T16.1', 'M5', 'hi',
   'सरकारी वेबसाइट की पहचान कैसे करें?',
   '["कोई भी वेबसाइट सरकारी हो सकती है", ".gov.in डोमेन देखें", "सुंदर डिज़ाइन देखें", "विज्ञापन देखें"]',
   1,
   'भारत की सरकारी वेबसाइटें .gov.in या .nic.in डोमेन पर होती हैं।',
   1),
  ('T16.1', 'M5', 'hi',
   'सरकारी सब्सिडी की जानकारी कहाँ से सत्यापित करें?',
   '["WhatsApp फॉरवर्ड से", "आधिकारिक सरकारी वेबसाइट से", "अनजान कॉल से", "Facebook पोस्ट से"]',
   1,
   'सरकारी जानकारी हमेशा आधिकारिक सरकारी वेबसाइट से सत्यापित करें।',
   2);

-- ============================================
-- PART 3: Add Assamese Translations
-- ============================================

-- M1 Assamese Questions (Sample - T1.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T1.1', 'M1', 'as',
   'কম্পিউটাৰৰ মূল কাম কি?',
   '["কেৱল ফোন কল কৰা", "তথ্য প্ৰক্ৰিয়া কৰা আৰু কাম সম্পাদন কৰা", "কেৱল সংগীত বজোৱা", "কেৱল ফটো তোলা"]',
   1,
   'কম্পিউটাৰ হৈছে এটা যন্ত্ৰ যি তথ্য প্ৰক্ৰিয়া কৰে আৰু বিভিন্ন কাম সম্পাদন কৰে যেনে গণনা, ডাটা সংৰক্ষণ, আৰু প্ৰগ্ৰাম চলোৱা।',
   1),
  ('T1.1', 'M1', 'as',
   'ইয়াৰ কোনটো কম্পিউটাৰ হাৰ্ডৱেৰৰ উদাহৰণ?',
   '["মাইক্ৰচফ্ট ৱৰ্ড", "কীবৰ্ড", "গুগল ক্ৰম", "হোৱাটছএপ"]',
   1,
   'হাৰ্ডৱেৰ হৈছে সেই ভৌতিক অংশ যিবোৰ আপুনি চুব পাৰে। কীবৰ্ড হাৰ্ডৱেৰ, আনহাতে ৱৰ্ড, ক্ৰম, আৰু হোৱাটছএপ চফ্টৱেৰ।',
   2),
  ('T1.1', 'M1', 'as',
   'স্মাৰ্টফোন এক প্ৰকাৰৰ কম্পিউটাৰ। সঁচা নে মিছা?',
   '["সঁচা", "মিছা"]',
   0,
   'সঁচা! স্মাৰ্টফোন হৈছে এটা সৰু বহনযোগ্য কম্পিউটাৰ যি কল কৰিব পাৰে, ইণ্টাৰনেট ব্ৰাউজ কৰিব পাৰে, আৰু এপ্লিকেচন চলাব পাৰে।',
   3);

-- M1 Assamese Questions (T1.2)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T1.2', 'M1', 'as',
   'মনিটৰৰ কাম কি?',
   '["টাইপিঙৰ বাবে", "আউটপুট দেখুওৱা (স্ক্ৰীন)", "ডাটা সংৰক্ষণ কৰা", "ইণ্টাৰনেটৰ সৈতে সংযোগ কৰা"]',
   1,
   'মনিটৰ হৈছে এটা আউটপুট ডিভাইচ যি আমাক টেক্সট, ছবি আৰু ভিডিঅ দেখুৱায়।',
   1),
  ('T1.2', 'M1', 'as',
   'CPU ৰ কাম কি?',
   '["ছবি দেখুওৱা", "প্ৰক্ৰিয়াকৰণ/চিন্তা কৰা - কম্পিউটাৰৰ মগজু", "শব্দ উলিওৱা", "ফাইল সংৰক্ষণ কৰা"]',
   1,
   'CPU (চেণ্ট্ৰেল প্ৰচেছিং ইউনিট) হৈছে কম্পিউটাৰৰ মগজু যি সকলো গণনা আৰু প্ৰক্ৰিয়াকৰণ কৰে।',
   2);

-- M2 Assamese Questions (Sample - T4.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T4.1', 'M2', 'as',
   'ডেস্কটপ দ্ৰুতভাৱে দেখুৱাবলৈ কোনটো কী ব্যৱহাৰ কৰিব?',
   '["Ctrl + C", "Alt + Tab", "Windows + D", "Ctrl + Alt + Delete"]',
   2,
   'Windows + D য়ে ডেস্কটপ ভিউ টগল কৰে।',
   1),
  ('T4.1', 'M2', 'as',
   'ষ্টাৰ্ট মেনু ক''ত থাকে?',
   '["সদায় ওপৰৰ সোঁফালে", "তলৰ বাওঁফালে বা মাজত (Windows সংস্কৰণ অনুসৰি)", "সদায় লুকাই থাকে", "কেৱল ফোনত"]',
   1,
   'নতুন Windows ত ষ্টাৰ্ট মেনু মাজতো থাকিব পাৰে।',
   2);

-- M3 Assamese Questions (Sample - T9.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T9.1', 'M3', 'as',
   'ইণ্টাৰনেট কি?',
   '["এটা কম্পিউটাৰ", "কম্পিউটাৰৰ এক বিশ্বব্যাপী নেটৱৰ্ক", "এটা ৱেবছাইট", "এটা চফ্টৱেৰ"]',
   1,
   'ইণ্টাৰনেট হৈছে বিশ্বজুৰি কম্পিউটাৰৰ এক নেটৱৰ্ক যি তথ্য শ্বেয়াৰ কৰিবলৈ অনুমতি দিয়ে।',
   1),
  ('T9.1', 'M3', 'as',
   'ডাটা ইণ্টাৰনেটত কেনেকৈ ভ্ৰমণ কৰে?',
   '["এটা ডাঙৰ ফাইল হিচাপে", "সৰু পেকেটত ভাগ হৈ", "কেৱল ৰাতি", "কেৱল লাহে লাহে"]',
   1,
   'ইণ্টাৰনেটত ডাটা সৰু পেকেটত ভাগ হৈ পঠোৱা হয় আৰু গন্তব্যস্থানত পুনৰ যোগ হয়।',
   2);

-- M4 Assamese Questions (Sample - T12.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T12.1', 'M4', 'as',
   '2-ষ্টেপ ভেৰিফিকেচনত কি হয়?',
   '["পাছৱৰ্ড + OTP", "কেৱল পাছৱৰ্ড", "কেৱল OTP", "কোনো সুৰক্ষা নাই"]',
   0,
   '2-ষ্টেপ ভেৰিফিকেচনত পাছৱৰ্ড আৰু OTP দুয়োটাৰ প্ৰয়োজন।',
   1),
  ('T12.1', 'M4', 'as',
   'ইমেইল একাউণ্ট সৃষ্টি কৰোতে কোনটো পাছৱৰ্ড আটাইতকৈ সুৰক্ষিত?',
   '["123456", "password", "Mur@Gaon2024!", "aaa"]',
   2,
   'শক্তিশালী পাছৱৰ্ডত আখৰ, সংখ্যা আৰু বিশেষ চিহ্ন থাকিব লাগে।',
   2);

-- M5 Assamese Questions (Sample - T16.1)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T16.1', 'M5', 'as',
   'চৰকাৰী ৱেবছাইট কেনেকৈ চিনাক্ত কৰিব?',
   '["যিকোনো ৱেবছাইট চৰকাৰী হ''ব পাৰে", ".gov.in ডমেইন চাওক", "ধুনীয়া ডিজাইন চাওক", "বিজ্ঞাপন চাওক"]',
   1,
   'ভাৰতৰ চৰকাৰী ৱেবছাইটবোৰ .gov.in বা .nic.in ডমেইনত থাকে।',
   1),
  ('T16.1', 'M5', 'as',
   'চৰকাৰী ৰাজসাহায্যৰ তথ্য ক''ৰ পৰা সত্যাপন কৰিব?',
   '["WhatsApp ফৰৱাৰ্ডৰ পৰা", "আধিকাৰিক চৰকাৰী ৱেবছাইটৰ পৰা", "অচিনাকি কলৰ পৰা", "Facebook পোষ্টৰ পৰা"]',
   1,
   'চৰকাৰী তথ্য সদায় আধিকাৰিক চৰকাৰী ৱেবছাইটৰ পৰা সত্যাপন কৰক।',
   2);

-- T9.4 Hindi and Assamese translations
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T9.4', 'M3', 'hi',
   'OTP का मतलब क्या है?',
   '["वन टाइम पासवर्ड", "ऑनलाइन ट्रांसफर प्रोटोकॉल", "ओपन ट्रांजैक्शन पोर्टल", "ओरिजिनल ट्रांजैक्शन पिन"]',
   0,
   'OTP का मतलब है वन टाइम पासवर्ड - सुरक्षित सत्यापन के लिए आपके फोन या ईमेल पर भेजा गया एक अस्थायी कोड।',
   1),
  ('T9.4', 'M3', 'hi',
   '2-स्टेप वेरिफिकेशन सिर्फ पासवर्ड से ज्यादा सुरक्षित क्यों है?',
   '["यह दो अलग-अलग सत्यापन विधियों का उपयोग करता है", "यह तेज है", "इसकी कीमत ज्यादा है", "यह केवल कंप्यूटर पर काम करता है"]',
   0,
   '2-स्टेप वेरिफिकेशन में आपके पासवर्ड और एक अन्य विधि (जैसे OTP) दोनों की आवश्यकता होती है।',
   2),
  ('T9.4', 'M3', 'hi',
   'अगर कोई फोन पर आपसे OTP मांगे तो क्या करना चाहिए?',
   '["तुरंत शेयर करें", "कभी शेयर न करें - यह धोखाधड़ी है", "केवल आधे अंक शेयर करें", "उन्हें बाद में कॉल करने को कहें"]',
   1,
   'अपना OTP कभी किसी को न बताएं, भले ही वे बैंक या कंपनी से होने का दावा करें। यह हमेशा धोखाधड़ी है।',
   3),
  ('T9.4', 'M3', 'as',
   'OTP ৰ অৰ্থ কি?',
   '["ৱান টাইম পাছৱৰ্ড", "অনলাইন ট্ৰেন্সফাৰ প্ৰট''কল", "অপেন ট্ৰেঞ্জেকচন পৰ্টেল", "অৰিজিনেল ট্ৰেঞ্জেকচন পিন"]',
   0,
   'OTP ৰ অৰ্থ হৈছে ৱান টাইম পাছৱৰ্ড - সুৰক্ষিত সত্যাপনৰ বাবে আপোনাৰ ফোন বা ইমেইললৈ পঠোৱা এক অস্থায়ী কোড।',
   1),
  ('T9.4', 'M3', 'as',
   '2-ষ্টেপ ভেৰিফিকেচন কেৱল পাছৱৰ্ডতকৈ বেছি সুৰক্ষিত কিয়?',
   '["ই দুটা ভিন্ন সত্যাপন পদ্ধতি ব্যৱহাৰ কৰে", "ই দ্ৰুত", "ই বেছি খৰচী", "ই কেৱল কম্পিউটাৰত কাম কৰে"]',
   0,
   '2-ষ্টেপ ভেৰিফিকেচনত আপোনাৰ পাছৱৰ্ড আৰু অন্য এটা পদ্ধতি (যেনে OTP) দুয়োটাৰ প্ৰয়োজন।',
   2),
  ('T9.4', 'M3', 'as',
   'যদি কোনোবাই ফোনত আপোনাৰ OTP বিচাৰে তেন্তে কি কৰিব?',
   '["তৎক্ষণাত শ্বেয়াৰ কৰক", "কেতিয়াও শ্বেয়াৰ নকৰিব - এইটো প্ৰতাৰণা", "কেৱল আধা সংখ্যা শ্বেয়াৰ কৰক", "তেওঁলোকক পিছত কল কৰিবলৈ কওক"]',
   1,
   'আপোনাৰ OTP কেতিয়াও কাকো নক''ব, যদিও তেওঁলোকে বেংক বা কোম্পানীৰ পৰা বুলি দাবী কৰে। এইটো সদায় প্ৰতাৰণা।',
   3);

-- T10.3 Hindi and Assamese translations
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T10.3', 'M3', 'hi',
   'ब्राउज़र कुकीज़ क्या हैं?',
   '["छोटी फाइलें जो वेबसाइटें आपके कंप्यूटर पर स्टोर करती हैं", "खाने की मिठाई", "कंप्यूटर वायरस", "ईमेल अटैचमेंट"]',
   0,
   'कुकीज़ छोटी फाइलें हैं जो वेबसाइटें लॉगिन स्थिति और प्राथमिकताओं को याद रखने के लिए आपके कंप्यूटर पर स्टोर करती हैं।',
   1),
  ('T10.3', 'M3', 'hi',
   'बिना हिस्ट्री सेव किए कैसे ब्राउज़ करें?',
   '["प्राइवेट/इनकॉग्निटो मोड का उपयोग करें", "ब्राउज़र डिलीट करें", "कंप्यूटर बंद करें", "तेज इंटरनेट का उपयोग करें"]',
   0,
   'प्राइवेट या इनकॉग्निटो मोड आपको डिवाइस पर हिस्ट्री या कुकीज़ सेव किए बिना ब्राउज़ करने देता है।',
   2),
  ('T10.3', 'M3', 'hi',
   'साझा कंप्यूटरों पर ब्राउज़र हिस्ट्री क्यों साफ करनी चाहिए?',
   '["जगह खाली करने के लिए", "अपनी व्यक्तिगत जानकारी की सुरक्षा के लिए", "कंप्यूटर तेज करने के लिए", "ब्राउज़र अपडेट करने के लिए"]',
   1,
   'हिस्ट्री साफ करने से आपकी व्यक्तिगत जानकारी जैसे विज़िट की गई साइट्स और लॉगिन विवरण दूसरों से सुरक्षित रहती है।',
   3),
  ('T10.3', 'M3', 'as',
   'ব্ৰাউজাৰ কুকীজ কি?',
   '["সৰু ফাইল যি ৱেবছাইটে আপোনাৰ কম্পিউটাৰত সংৰক্ষণ কৰে", "খাব পৰা মিঠাই", "কম্পিউটাৰ ভাইৰাছ", "ইমেইল এটাচমেণ্ট"]',
   0,
   'কুকীজ হৈছে সৰু ফাইল যি ৱেবছাইটে লগইন স্থিতি আৰু পছন্দ মনত ৰাখিবলৈ আপোনাৰ কম্পিউটাৰত সংৰক্ষণ কৰে।',
   1),
  ('T10.3', 'M3', 'as',
   'হিষ্ট্ৰি সংৰক্ষণ নকৰাকৈ কেনেকৈ ব্ৰাউজ কৰিব?',
   '["প্ৰাইভেট/ইনকগনিটো মোড ব্যৱহাৰ কৰক", "ব্ৰাউজাৰ মচি পেলাওক", "কম্পিউটাৰ বন্ধ কৰক", "দ্ৰুত ইণ্টাৰনেট ব্যৱহাৰ কৰক"]',
   0,
   'প্ৰাইভেট বা ইনকগনিটো মোডে আপোনাক ডিভাইচত হিষ্ট্ৰি বা কুকীজ সংৰক্ষণ নকৰাকৈ ব্ৰাউজ কৰিবলৈ দিয়ে।',
   2),
  ('T10.3', 'M3', 'as',
   'শ্বেয়াৰড কম্পিউটাৰত ব্ৰাউজাৰ হিষ্ট্ৰি কিয় পৰিষ্কাৰ কৰিব লাগে?',
   '["ঠাই খালী কৰিবলৈ", "আপোনাৰ ব্যক্তিগত তথ্য সুৰক্ষিত কৰিবলৈ", "কম্পিউটাৰ দ্ৰুত কৰিবলৈ", "ব্ৰাউজাৰ আপডেট কৰিবলৈ"]',
   1,
   'হিষ্ট্ৰি পৰিষ্কাৰ কৰিলে আপোনাৰ ব্যক্তিগত তথ্য যেনে ভিজিট কৰা ছাইট আৰু লগইন বিৱৰণ আনৰ পৰা সুৰক্ষিত থাকে।',
   3);

-- T10.4 Hindi and Assamese translations
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T10.4', 'M3', 'hi',
   'सॉफ्टवेयर कहाँ से डाउनलोड करना चाहिए?',
   '["जो भी वेबसाइट ऑफर करे", "केवल आधिकारिक वेबसाइट या ऐप स्टोर से", "ईमेल अटैचमेंट से", "पॉप-अप विज्ञापनों से"]',
   1,
   'मैलवेयर और वायरस से बचने के लिए हमेशा आधिकारिक वेबसाइट या ऐप स्टोर से सॉफ्टवेयर डाउनलोड करें।',
   1),
  ('T10.4', 'M3', 'hi',
   'डाउनलोड की गई फाइल खोलने से पहले क्या जांचना चाहिए?',
   '["केवल फाइल साइज़", "एंटीवायरस से स्कैन करें और सोर्स जांचें", "डाउनलोड स्पीड", "आइकन का रंग"]',
   1,
   'डाउनलोड की गई फाइलों को हमेशा एंटीवायरस से स्कैन करें और सुनिश्चित करें कि वे विश्वसनीय स्रोत से आई हैं।',
   2),
  ('T10.4', 'M3', 'hi',
   'किस प्रकार की फाइल खोलना खतरनाक हो सकता है?',
   '["केवल PDF दस्तावेज़", "अज्ञात स्रोतों से एक्जीक्यूटेबल फाइलें (.exe)", "परिवार से फोटो", "टेक्स्ट दस्तावेज़"]',
   1,
   'अज्ञात स्रोतों से एक्जीक्यूटेबल फाइलें (.exe, .apk) में वायरस हो सकते हैं। हमेशा स्रोत सत्यापित करें।',
   3),
  ('T10.4', 'M3', 'as',
   'চফ্টৱেৰ ক''ৰ পৰা ডাউনলোড কৰিব লাগে?',
   '["যি ৱেবছাইটে অফাৰ কৰে", "কেৱল আধিকাৰিক ৱেবছাইট বা এপ ষ্ট''ৰৰ পৰা", "ইমেইল এটাচমেণ্টৰ পৰা", "পপ-আপ বিজ্ঞাপনৰ পৰা"]',
   1,
   'মেলৱেৰ আৰু ভাইৰাছৰ পৰা হাত সাৰিবলৈ সদায় আধিকাৰিক ৱেবছাইট বা এপ ষ্ট''ৰৰ পৰা চফ্টৱেৰ ডাউনলোড কৰক।',
   1),
  ('T10.4', 'M3', 'as',
   'ডাউনলোড কৰা ফাইল খোলাৰ আগতে কি পৰীক্ষা কৰিব লাগে?',
   '["কেৱল ফাইল ছাইজ", "এণ্টিভাইৰাছেৰে স্কেন কৰক আৰু উৎস পৰীক্ষা কৰক", "ডাউনলোড স্পীড", "আইকনৰ ৰং"]',
   1,
   'ডাউনলোড কৰা ফাইলবোৰ সদায় এণ্টিভাইৰাছেৰে স্কেন কৰক আৰু নিশ্চিত কৰক যে সেইবোৰ বিশ্বাসযোগ্য উৎসৰ পৰা আহিছে।',
   2),
  ('T10.4', 'M3', 'as',
   'কি ধৰণৰ ফাইল খোলা বিপদজনক হ''ব পাৰে?',
   '["কেৱল PDF নথিপত্ৰ", "অচিনাক্ত উৎসৰ পৰা এক্সিকিউটেবল ফাইল (.exe)", "পৰিয়ালৰ পৰা ফটো", "টেক্সট নথিপত্ৰ"]',
   1,
   'অচিনাক্ত উৎসৰ পৰা এক্সিকিউটেবল ফাইল (.exe, .apk) ত ভাইৰাছ থাকিব পাৰে। সদায় উৎস সত্যাপন কৰক।',
   3);
