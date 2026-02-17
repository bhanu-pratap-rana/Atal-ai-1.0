
-- Add Hindi and Assamese translations for M3 remaining topics: T9.2, T9.3

-- T9.2 Ways to Connect (Hindi)
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T9.2', 'M3', 'hi', 'easy', 
 'WiFi internet से connect करता है:',
 '["केवल cables से", "Wireless radio waves से", "Bluetooth से", "USB cable से"]',
 1, 'WiFi radio waves का उपयोग करके devices को wirelessly router से connect करता है, जो internet से जुड़ा होता है।'),

('T9.2', 'M3', 'hi', 'easy', 
 'Mobile data उपयोग करता है:',
 '["WiFi signals", "आपके SIM provider का cellular network", "केवल satellite", "Bluetooth connection"]',
 1, 'Mobile data आपके mobile provider से SIM card के माध्यम से cellular networks (2G/3G/4G/5G) का उपयोग करता है।'),

('T9.2', 'M3', 'hi', 'medium', 
 'आमतौर पर कम खर्च में तेज speed कौन देता है?',
 '["Mobile data", "घर का WiFi", "दोनों समान हैं", "Public WiFi"]',
 1, 'Home WiFi आमतौर पर heavy usage के लिए mobile data से तेज speed और सस्ता होता है।'),

-- T9.2 Ways to Connect (Assamese)
('T9.2', 'M3', 'as', 'easy', 
 'WiFi internet ৰ সৈতে connect কৰে:',
 '["কেৱল cables ৰে", "Wireless radio waves ৰে", "Bluetooth ৰে", "USB cable ৰে"]',
 1, 'WiFi এ radio waves ব্যৱহাৰ কৰি devices ক wirelessly router ৰ সৈতে connect কৰে, যি internet ৰ সৈতে সংযুক্ত।'),

('T9.2', 'M3', 'as', 'easy', 
 'Mobile data ব্যৱহাৰ কৰে:',
 '["WiFi signals", "আপোনাৰ SIM provider ৰ cellular network", "কেৱল satellite", "Bluetooth connection"]',
 1, 'Mobile data এ আপোনাৰ mobile provider ৰ পৰা SIM card ৰ জৰিয়তে cellular networks (2G/3G/4G/5G) ব্যৱহাৰ কৰে।'),

('T9.2', 'M3', 'as', 'medium', 
 'সাধাৰণতে কম খৰচত খৰ speed কোনে দিয়ে?',
 '["Mobile data", "ঘৰৰ WiFi", "দুয়োটা সমান", "Public WiFi"]',
 1, 'Home WiFi সাধাৰণতে heavy usage ৰ বাবে mobile data তকৈ খৰ speed আৰু সস্তা।'),

-- T9.3 Web Addresses & Browsers (Hindi)
('T9.3', 'M3', 'hi', 'easy', 
 'Web browser का उपयोग होता है:',
 '["Phone calls करने के लिए", "Internet पर websites देखने के लिए", "Photos edit करने के लिए", "SMS messages भेजने के लिए"]',
 1, 'Web browsers जैसे Chrome, Firefox, और Edge आपको internet पर websites देखने और interact करने देते हैं।'),

('T9.3', 'M3', 'hi', 'easy', 
 'इनमें से कौन सा web browser है?',
 '["WhatsApp", "Google Chrome", "Microsoft Word", "VLC Player"]',
 1, 'Google Chrome एक web browser है। WhatsApp messaging है, Word document editing है, VLC media player है।'),

('T9.3', 'M3', 'hi', 'easy', 
 'Browser में address bar क्या दिखाता है?',
 '["आपका phone number", "Website URL/address", "Time और date", "Battery percentage"]',
 1, 'Address bar website URLs दिखाता है और आपको type करने देता है जैसे www.google.com या www.facebook.com।'),

-- T9.3 Web Addresses & Browsers (Assamese)
('T9.3', 'M3', 'as', 'easy', 
 'Web browser ব্যৱহাৰ কৰা হয়:',
 '["Phone calls কৰিবলৈ", "Internet ত websites চাবলৈ", "Photos edit কৰিবলৈ", "SMS messages পঠাবলৈ"]',
 1, 'Web browsers যেনে Chrome, Firefox, আৰু Edge এ আপোনাক internet ত websites চাবলৈ আৰু interact কৰিবলৈ দিয়ে।'),

('T9.3', 'M3', 'as', 'easy', 
 'ইয়াৰ মাজত কোনটো web browser?',
 '["WhatsApp", "Google Chrome", "Microsoft Word", "VLC Player"]',
 1, 'Google Chrome এটা web browser। WhatsApp messaging, Word document editing, VLC media player।'),

('T9.3', 'M3', 'as', 'easy', 
 'Browser ত address bar এ কি দেখুৱায়?',
 '["আপোনাৰ phone number", "Website URL/address", "Time আৰু date", "Battery percentage"]',
 1, 'Address bar এ website URLs দেখুৱায় আৰু আপোনাক type কৰিবলৈ দিয়ে যেনে www.google.com বা www.facebook.com।');
;
