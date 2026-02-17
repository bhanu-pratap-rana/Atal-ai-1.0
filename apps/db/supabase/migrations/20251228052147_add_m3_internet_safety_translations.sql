
-- Add Hindi/Assamese translations for M3 topics T10.1-T11.2 (Internet Safety & Search)

-- T10.1 HTTPS & Padlock (Hindi)
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T10.1', 'M3', 'hi', 'easy', 
 'वेबसाइट URL में HTTPS का क्या मतलब है?',
 '["वेबसाइट तेज है", "कनेक्शन सुरक्षित और encrypted है", "वेबसाइट मुफ्त है", "कोई मतलब नहीं"]',
 1, 'HTTPS का मतलब है कि आपका डेटा encrypted है और बीच में कोई नहीं देख सकता।'),

('T10.1', 'M3', 'hi', 'medium', 
 'ब्राउज़र में पैडलॉक आइकन क्या दर्शाता है?',
 '["वेबसाइट लॉक है", "कनेक्शन सुरक्षित है", "डाउनलोड हो रहा है", "वेबसाइट धीमी है"]',
 1, 'पैडलॉक आइकन दर्शाता है कि वेबसाइट के साथ आपका कनेक्शन सुरक्षित और encrypted है।'),

('T10.1', 'M3', 'hi', 'hard', 
 'HTTP वेबसाइट पर पासवर्ड डालना क्यों खतरनाक है?',
 '["पासवर्ड लंबा हो जाता है", "कोई भी नेटवर्क पर आपका पासवर्ड देख सकता है", "वेबसाइट क्रैश हो जाती है", "कोई खतरा नहीं"]',
 1, 'HTTP पर डेटा encrypted नहीं होता, इसलिए नेटवर्क पर कोई भी आपका पासवर्ड देख सकता है।'),

-- T10.1 HTTPS & Padlock (Assamese)
('T10.1', 'M3', 'as', 'easy', 
 'ৱেবছাইট URL ত HTTPS ৰ অৰ্থ কি?',
 '["ৱেবছাইট খৰ", "সংযোগ সুৰক্ষিত আৰু encrypted", "ৱেবছাইট মুক্ত", "কোনো অৰ্থ নাই"]',
 1, 'HTTPS ৰ অৰ্থ হ''ল আপোনাৰ ডেটা encrypted আৰু মাজত কোনেও চাব নোৱাৰে।'),

('T10.1', 'M3', 'as', 'medium', 
 'ব্ৰাউজাৰত পেডলক আইকনে কি দেখুৱায়?',
 '["ৱেবছাইট লক", "সংযোগ সুৰক্ষিত", "ডাউনলোড হৈ আছে", "ৱেবছাইট লেহেম"]',
 1, 'পেডলক আইকনে দেখুৱায় যে ৱেবছাইটৰ সৈতে আপোনাৰ সংযোগ সুৰক্ষিত আৰু encrypted।'),

('T10.1', 'M3', 'as', 'hard', 
 'HTTP ৱেবছাইটত পাছৱৰ্ড দিয়া কিয় বিপজ্জনক?',
 '["পাছৱৰ্ড দীঘল হয়", "নেটৱৰ্কত যিকোনোৱে আপোনাৰ পাছৱৰ্ড চাব পাৰে", "ৱেবছাইট ক্ৰেছ হয়", "কোনো বিপদ নাই"]',
 1, 'HTTP ত ডেটা encrypted নহয়, সেয়েহে নেটৱৰ্কত যিকোনোৱে আপোনাৰ পাছৱৰ্ড চাব পাৰে।'),

-- T10.2 Spotting Online Scams (Hindi)
('T10.2', 'M3', 'hi', 'easy', 
 'फिशिंग ईमेल की पहचान कैसे करें?',
 '["ईमेल लंबा है", "अजीब भेजने वाला, गलत spelling, और urgent दबाव", "ईमेल में फोटो है", "ईमेल सुबह आई"]',
 1, 'फिशिंग ईमेल में अक्सर अजीब ईमेल address, spelling गलतियां, और जल्दी action लेने का दबाव होता है।'),

('T10.2', 'M3', 'hi', 'medium', 
 '"आपने 1 करोड़ जीते" जैसा मैसेज आए तो क्या करना चाहिए?',
 '["तुरंत लिंक पर क्लिक करें", "इसे scam समझकर delete करें", "बैंक details भेजें", "सबको forward करें"]',
 1, 'ऐसे मैसेज लगभग हमेशा scam होते हैं। कभी भी लिंक पर क्लिक न करें या details न भेजें।'),

('T10.2', 'M3', 'hi', 'hard', 
 'नकली वेबसाइट असली से कैसे अलग दिखती है?',
 '["नकली तेज होती है", "URL में spelling गलत, design थोड़ा अलग, no HTTPS", "नकली में ads नहीं होते", "कोई अंतर नहीं"]',
 1, 'नकली साइट में URL spelling गलत (जैसे amaz0n), design थोड़ा अलग, और अक्सर HTTPS नहीं होता।'),

-- T10.2 Spotting Online Scams (Assamese)
('T10.2', 'M3', 'as', 'easy', 
 'ফিছিং ইমেইল কেনেকৈ চিনিব পাৰি?',
 '["ইমেইল দীঘল", "অদ্ভুত প্ৰেৰক, ভুল spelling, আৰু urgent দবাব", "ইমেইলত ফটো আছে", "ইমেইল ৰাতিপুৱা আহিল"]',
 1, 'ফিছিং ইমেইলত প্ৰায়ে অদ্ভুত ইমেইল address, spelling ভুল, আৰু সোনকালে action লোৱাৰ দবাব থাকে।'),

('T10.2', 'M3', 'as', 'medium', 
 '"আপুনি ১ কোটি জিকিলে" ৰ দৰে মেছেজ আহিলে কি কৰা উচিত?',
 '["তৎক্ষণাত লিংকত ক্লিক কৰক", "ইয়াক scam বুলি মচি পেলাওক", "বেংক details পঠিয়াওক", "সকলোলৈ forward কৰক"]',
 1, 'এনে মেছেজ প্ৰায় সদায় scam। কেতিয়াও লিংকত ক্লিক নকৰিব বা details নপঠিয়াব।'),

('T10.2', 'M3', 'as', 'hard', 
 'নকলী ৱেবছাইট আচলৰ পৰা কেনেকৈ বেলেগ দেখা যায়?',
 '["নকলী খৰ হয়", "URL ত spelling ভুল, design অলপ বেলেগ, HTTPS নাই", "নকলীত ads নাথাকে", "কোনো পাৰ্থক্য নাই"]',
 1, 'নকলী ছাইটত URL spelling ভুল (যেনে amaz0n), design অলপ বেলেগ, আৰু প্ৰায়ে HTTPS নাথাকে।'),

-- T11.1 Smart Keywords & Operators (Hindi)
('T11.1', 'M3', 'hi', 'easy', 
 'Google में बेहतर search results के लिए क्या करना चाहिए?',
 '["लंबे वाक्य लिखें", "सही keywords का उपयोग करें", "सिर्फ एक शब्द लिखें", "random अक्षर लिखें"]',
 1, 'सही और specific keywords से बेहतर search results मिलते हैं।'),

('T11.1', 'M3', 'hi', 'medium', 
 '"best phones 2024" में quotes का क्या फायदा है?',
 '["search तेज होता है", "exact phrase match के results मिलते हैं", "कोई फायदा नहीं", "ads हट जाते हैं"]',
 1, 'Quotes में डालने से exact वही phrase containing results मिलते हैं।'),

('T11.1', 'M3', 'hi', 'hard', 
 'site:gov.in income tax search करने से क्या होता है?',
 '["सभी websites search होती हैं", "सिर्फ gov.in domain की websites search होती हैं", "search बंद हो जाता है", "ads दिखते हैं"]',
 1, 'site: operator से सिर्फ specific domain (इस case में gov.in) की websites में search होता है।'),

-- T11.1 Smart Keywords & Operators (Assamese)
('T11.1', 'M3', 'as', 'easy', 
 'Google ত ভাল search results ৰ বাবে কি কৰা উচিত?',
 '["দীঘল বাক্য লিখক", "সঠিক keywords ব্যৱহাৰ কৰক", "মাত্ৰ এটা শব্দ লিখক", "random আখৰ লিখক"]',
 1, 'সঠিক আৰু specific keywords ৰে ভাল search results পোৱা যায়।'),

('T11.1', 'M3', 'as', 'medium', 
 '"best phones 2024" ত quotes ৰ কি লাভ?',
 '["search খৰ হয়", "exact phrase match ৰ results পোৱা যায়", "কোনো লাভ নাই", "ads আঁতৰি যায়"]',
 1, 'Quotes ত দিলে exact সেই phrase থকা results পোৱা যায়।'),

('T11.1', 'M3', 'as', 'hard', 
 'site:gov.in income tax search কৰিলে কি হয়?',
 '["সকলো websites search হয়", "মাত্ৰ gov.in domain ৰ websites search হয়", "search বন্ধ হয়", "ads দেখা যায়"]',
 1, 'site: operator ৰে মাত্ৰ specific domain (এই ক্ষেত্ৰত gov.in) ৰ websites ত search হয়।'),

-- T11.2 Check If Information Is Trustworthy (Hindi)
('T11.2', 'M3', 'hi', 'easy', 
 'ऑनलाइन जानकारी की सत्यता कैसे जांचें?',
 '["पहली website को मान लें", "कई sources से verify करें", "सबसे लंबे article को मानें", "जांचने की जरूरत नहीं"]',
 1, 'हमेशा कई विश्वसनीय sources से जानकारी verify करें।'),

('T11.2', 'M3', 'hi', 'medium', 
 'कौन सी website आमतौर पर ज्यादा भरोसेमंद होती है?',
 '["कोई भी blog", "सरकारी (.gov) या शैक्षिक (.edu) websites", "anonymous websites", "पुरानी websites"]',
 1, 'सरकारी और शैक्षिक websites आमतौर पर ज्यादा भरोसेमंद होती हैं क्योंकि इनकी जांच होती है।'),

('T11.2', 'M3', 'hi', 'hard', 
 'Fake news की पहचान के लिए क्या देखना चाहिए?',
 '["headline बड़ी है या छोटी", "author, date, sources cited, और other coverage", "website का रंग", "comments की संख्या"]',
 1, 'Author का नाम, publish date, cited sources, और अन्य reputable sources पर coverage देखें।'),

-- T11.2 Check If Information Is Trustworthy (Assamese)
('T11.2', 'M3', 'as', 'easy', 
 'অনলাইন তথ্যৰ সত্যতা কেনেকৈ পৰীক্ষা কৰিব?',
 '["প্ৰথম website মানি লওক", "কেইবাটাও sources ৰ পৰা verify কৰক", "আটাইতকৈ দীঘল article মানক", "পৰীক্ষাৰ প্ৰয়োজন নাই"]',
 1, 'সদায় কেইবাটাও বিশ্বাসযোগ্য sources ৰ পৰা তথ্য verify কৰক।'),

('T11.2', 'M3', 'as', 'medium', 
 'কোন website সাধাৰণতে বেছি বিশ্বাসযোগ্য?',
 '["যিকোনো blog", "চৰকাৰী (.gov) বা শৈক্ষিক (.edu) websites", "anonymous websites", "পুৰণি websites"]',
 1, 'চৰকাৰী আৰু শৈক্ষিক websites সাধাৰণতে বেছি বিশ্বাসযোগ্য কাৰণ এইবোৰ পৰীক্ষা কৰা হয়।'),

('T11.2', 'M3', 'as', 'hard', 
 'Fake news চিনাক্ত কৰিবলৈ কি চোৱা উচিত?',
 '["headline ডাঙৰ নে সৰু", "author, date, sources cited, আৰু other coverage", "website ৰ ৰং", "comments ৰ সংখ্যা"]',
 1, 'Author ৰ নাম, publish date, cited sources, আৰু আন reputable sources ত coverage চাওক।');
;
