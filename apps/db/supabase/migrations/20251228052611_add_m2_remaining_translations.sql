
-- Add Hindi and Assamese translations for M2 remaining topics: T4.2, T7.1, T7.2, T8.1, T8.2

-- T4.2 Window Management (Hindi)
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T4.2', 'M2', 'hi', 'easy', 
 'Start Menu किस चीज़ का access देता है?',
 '["केवल गेम्स", "प्रोग्राम, सेटिंग्स, और पावर विकल्प", "केवल इंटरनेट", "केवल फाइलें"]',
 1, 'Start Menu सभी प्रोग्राम्स, सेटिंग्स, डॉक्युमेंट्स और Shut Down, Restart जैसे पावर विकल्पों का gateway है।'),

('T4.2', 'M2', 'hi', 'easy', 
 'Window को minimize करने का मतलब है:',
 '["इसे स्थायी रूप से बंद करना", "बिना बंद किए taskbar पर छुपाना", "इसे full screen करना", "इसकी सामग्री delete करना"]',
 1, 'Minimize करने से window taskbar पर छुप जाती है। प्रोग्राम चलता रहता है और taskbar icon पर क्लिक करके वापस ला सकते हैं।'),

('T4.2', 'M2', 'hi', 'easy', 
 'Windows में Taskbar कहाँ होता है?',
 '["स्क्रीन के ऊपर", "स्क्रीन के नीचे", "बाईं तरफ", "यह मौजूद नहीं है"]',
 1, 'Taskbar स्क्रीन के नीचे होता है जो Start button, खुले प्रोग्राम, समय और system icons दिखाता है।'),

-- T4.2 Window Management (Assamese)
('T4.2', 'M2', 'as', 'easy', 
 'Start Menu এ কি access পোৱা যায়?',
 '["কেৱল গেম", "প্ৰগ্ৰাম, ছেটিংছ আৰু পাৱাৰ বিকল্প", "কেৱল ইণ্টাৰনেট", "কেৱল ফাইল"]',
 1, 'Start Menu সকলো প্ৰগ্ৰাম, ছেটিংছ, ডকুমেণ্ট আৰু Shut Down, Restart ৰ দৰে পাৱাৰ বিকল্পৰ gateway।'),

('T4.2', 'M2', 'as', 'easy', 
 'Window minimize কৰাৰ অৰ্থ হ''ল:',
 '["ইয়াক স্থায়ীভাৱে বন্ধ কৰা", "বন্ধ নকৰাকৈ taskbar ত লুকুৱা", "ইয়াক full screen কৰা", "ইয়াৰ বিষয়বস্তু delete কৰা"]',
 1, 'Minimize কৰিলে window taskbar ত লুকাই যায়। প্ৰগ্ৰাম চলি থাকে আৰু taskbar icon ত ক্লিক কৰি ঘূৰাই আনিব পাৰি।'),

('T4.2', 'M2', 'as', 'easy', 
 'Windows ত Taskbar ক''ত থাকে?',
 '["স্ক্ৰীনৰ ওপৰত", "স্ক্ৰীনৰ তলত", "বাওঁফালে", "ই নাথাকে"]',
 1, 'Taskbar স্ক্ৰীনৰ তলত থাকে যিয়ে Start button, খোলা প্ৰগ্ৰাম, সময় আৰু system icons দেখুৱায়।'),

-- T7.1 Core Protection (Hindi)
('T7.1', 'M2', 'hi', 'easy', 
 'Airplane mode:',
 '["फोन को उड़ने देता है", "सभी wireless connections बंद करता है", "केवल phone calls को प्रभावित करता है", "internet speed बढ़ाता है"]',
 1, 'Airplane mode WiFi, mobile data और Bluetooth बंद कर देता है। उड़ान के दौरान या battery बचाने के लिए use करें।'),

('T7.1', 'M2', 'hi', 'easy', 
 'फोन की display brightness कहाँ बदल सकते हैं?',
 '["Phone app", "Settings - Display", "Camera app", "Calculator"]',
 1, 'Display brightness Settings में Display के अंदर होती है। Quick settings के लिए नीचे swipe भी कर सकते हैं।'),

('T7.1', 'M2', 'hi', 'easy', 
 'WiFi से connect करने के लिए कहाँ जाएं?',
 '["Settings - WiFi/Network", "Settings - Sound", "Gallery app", "File Manager"]',
 0, 'WiFi settings, Settings में फिर WiFi या Network settings में होती है। WiFi on करें और अपना network चुनें।'),

-- T7.1 Core Protection (Assamese)
('T7.1', 'M2', 'as', 'easy', 
 'Airplane mode:',
 '["ফোন উৰিবলৈ দিয়ে", "সকলো wireless connection বন্ধ কৰে", "কেৱল phone call প্ৰভাৱিত কৰে", "internet speed বঢ়ায়"]',
 1, 'Airplane mode এ WiFi, mobile data আৰু Bluetooth বন্ধ কৰে। উৰণৰ সময়ত বা battery বচাবলৈ ব্যৱহাৰ কৰক।'),

('T7.1', 'M2', 'as', 'easy', 
 'ফোনৰ display brightness ক''ত সলনি কৰিব পাৰি?',
 '["Phone app", "Settings - Display", "Camera app", "Calculator"]',
 1, 'Display brightness Settings ত Display ৰ ভিতৰত থাকে। Quick settings ৰ বাবে তললৈ swipe কৰিব পাৰে।'),

('T7.1', 'M2', 'as', 'easy', 
 'WiFi ত connect কৰিবলৈ ক''লৈ যাব?',
 '["Settings - WiFi/Network", "Settings - Sound", "Gallery app", "File Manager"]',
 0, 'WiFi settings, Settings ত তাৰ পিছত WiFi বা Network settings ত থাকে। WiFi on কৰক আৰু আপোনাৰ network বাছক।'),

-- T7.2 Spotting Scams (Hindi)
('T7.2', 'M2', 'hi', 'easy', 
 'फोन का wallpaper कहाँ बदल सकते हैं?',
 '["Phone app", "Settings - Wallpaper/Display", "Calculator", "Clock app"]',
 1, 'Wallpaper settings, Settings में Wallpaper या Display में होती है। Home screen पर long-press भी कर सकते हैं।'),

('T7.2', 'M2', 'hi', 'easy', 
 'Widget क्या है?',
 '["एक प्रकार का virus", "Home screen पर live जानकारी वाला app shortcut", "एक phone setting", "एक प्रकार की file"]',
 1, 'Widgets बिना app खोले home screen पर live info दिखाते हैं - जैसे मौसम, calendar events, या clock।'),

('T7.2', 'M2', 'hi', 'easy', 
 'बेहतर पढ़ने के लिए font size बढ़ाने के लिए:',
 '["बड़ा फोन खरीदें", "Settings - Display - Font Size पर जाएं", "Magnifying glass use करें", "हर app में zoom करें"]',
 1, 'Settings फिर Display फिर Font Size से सभी apps में text size बढ़ा सकते हैं।'),

-- T7.2 Spotting Scams (Assamese)
('T7.2', 'M2', 'as', 'easy', 
 'ফোনৰ wallpaper ক''ত সলনি কৰিব পাৰি?',
 '["Phone app", "Settings - Wallpaper/Display", "Calculator", "Clock app"]',
 1, 'Wallpaper settings, Settings ত Wallpaper বা Display ত থাকে। Home screen ত long-press কৰিও পাৰে।'),

('T7.2', 'M2', 'as', 'easy', 
 'Widget কি?',
 '["এক প্ৰকাৰৰ virus", "Home screen ত live তথ্য থকা app shortcut", "এটা phone setting", "এক প্ৰকাৰৰ file"]',
 1, 'Widgets এ app নোখোলাকৈ home screen ত live info দেখুৱায় - যেনে বতৰ, calendar events, বা clock।'),

('T7.2', 'M2', 'as', 'easy', 
 'ভালকৈ পঢ়িবলৈ font size বঢ়াবলৈ:',
 '["ডাঙৰ ফোন কিনক", "Settings - Display - Font Size লৈ যাওক", "Magnifying glass ব্যৱহাৰ কৰক", "প্ৰতিটো app ত zoom কৰক"]',
 1, 'Settings তাৰ পিছত Display তাৰ পিছত Font Size ৰে সকলো app ত text size বঢ়াব পাৰি।'),

-- T8.1 Weekly Care (Hindi)
('T8.1', 'M2', 'hi', 'easy', 
 'Software updates क्यों महत्वपूर्ण हैं?',
 '["वे app के रंग बदलते हैं", "वे bugs और security issues fix करते हैं", "वे आपका data delete करते हैं", "वे phone धीमा करते हैं"]',
 1, 'Updates security vulnerabilities, bugs fix करते हैं और अक्सर नई features जोड़ते हैं। अपने devices अपडेट रखें।'),

('T8.1', 'M2', 'hi', 'easy', 
 'Apps के लिए Auto-update उपयोगी है क्योंकि:',
 '["इसमें पैसे लगते हैं", "Apps बिना manual checking के current रहते हैं", "इसमें कोई data नहीं लगता", "यह पुरानी apps delete करता है"]',
 1, 'Auto-update apps को automatically current रखता है। Mobile data बचाने के लिए केवल WiFi पर enable करें।'),

('T8.1', 'M2', 'hi', 'medium', 
 'Phone update करने से पहले आपको:',
 '["सभी apps delete करने चाहिए", "महत्वपूर्ण data backup करना चाहिए", "SIM card निकालना चाहिए", "फोन बंद करना चाहिए"]',
 1, 'Major updates से पहले हमेशा data backup करें। Downloads के लिए WiFi use करें और battery कम से कम 50% रखें।'),

-- T8.1 Weekly Care (Assamese)
('T8.1', 'M2', 'as', 'easy', 
 'Software updates কিয় গুৰুত্বপূৰ্ণ?',
 '["সেইবোৰে app ৰ ৰং সলনি কৰে", "সেইবোৰে bugs আৰু security issues fix কৰে", "সেইবোৰে আপোনাৰ data delete কৰে", "সেইবোৰে phone লেহেম কৰে"]',
 1, 'Updates এ security vulnerabilities, bugs fix কৰে আৰু প্ৰায়ে নতুন features যোগ কৰে। আপোনাৰ devices আপডেট ৰাখক।'),

('T8.1', 'M2', 'as', 'easy', 
 'Apps ৰ বাবে Auto-update উপযোগী কাৰণ:',
 '["ইয়াত টকা লাগে", "Apps manual checking অবিহনে current থাকে", "ইয়াত কোনো data নালাগে", "ই পুৰণি apps delete কৰে"]',
 1, 'Auto-update এ apps স্বয়ংক্ৰিয়ভাৱে current ৰাখে। Mobile data বচাবলৈ কেৱল WiFi ত enable কৰক।'),

('T8.1', 'M2', 'as', 'medium', 
 'Phone update কৰাৰ আগতে আপুনি:',
 '["সকলো apps delete কৰা উচিত", "গুৰুত্বপূৰ্ণ data backup কৰা উচিত", "SIM card উলিয়াব লাগে", "ফোন বন্ধ কৰা উচিত"]',
 1, 'Major updates ৰ আগতে সদায় data backup কৰক। Downloads ৰ বাবে WiFi ব্যৱহাৰ কৰক আৰু battery অন্ততঃ 50% ৰাখক।'),

-- T8.2 Troubleshooting (Hindi)
('T8.2', 'M2', 'hi', 'easy', 
 'अगर कोई app freeze हो जाए, तो पहले:',
 '["नया फोन खरीदें", "App को force close करें और फिर खोलें", "सभी photos delete करें", "Customer care को call करें"]',
 1, 'Recent apps या Settings-Apps से force close करें, फिर फिर से खोलें। यह ज्यादातर temporary app issues solve करता है।'),

('T8.2', 'M2', 'hi', 'easy', 
 'अगर phone धीमा चल रहा हो, तो आप:',
 '["Unused apps बंद करें और cache clear करें", "और apps add करते रहें", "इसे कभी बंद न करें", "Problem ignore करें"]',
 0, 'Background apps बंद करें, cache clear करें, unused apps delete करें, और performance maintain करने के लिए नियमित restart करें।'),

('T8.2', 'M2', 'hi', 'easy', 
 'Device restart करने से:',
 '["आपका सारा data delete हो जाता है", "अक्सर temporary glitches fix होते हैं", "कभी जरूरत नहीं होती", "Battery damage होती है"]',
 1, 'Restart करने से temporary memory clear होती है और अक्सर minor issues fix होते हैं। यह safe है और नियमित रूप से recommended है।'),

-- T8.2 Troubleshooting (Assamese)
('T8.2', 'M2', 'as', 'easy', 
 'যদি কোনো app freeze হয়, প্ৰথমে:',
 '["নতুন ফোন কিনক", "App force close কৰক আৰু আকৌ খোলক", "সকলো photos delete কৰক", "Customer care ক call কৰক"]',
 1, 'Recent apps বা Settings-Apps ৰ পৰা force close কৰক, তাৰ পিছত আকৌ খোলক। ই বেছিভাগ temporary app issues সমাধান কৰে।'),

('T8.2', 'M2', 'as', 'easy', 
 'যদি phone লেহেমকৈ চলে, আপুনি:',
 '["Unused apps বন্ধ কৰক আৰু cache clear কৰক", "আৰু apps যোগ কৰি থাকক", "কেতিয়াও বন্ধ নকৰিব", "Problem উপেক্ষা কৰক"]',
 0, 'Background apps বন্ধ কৰক, cache clear কৰক, unused apps delete কৰক, আৰু performance বজাই ৰাখিবলৈ নিয়মীয়াকৈ restart কৰক।'),

('T8.2', 'M2', 'as', 'easy', 
 'Device restart কৰিলে:',
 '["আপোনাৰ সকলো data delete হয়", "প্ৰায়ে temporary glitches fix হয়", "কেতিয়াও প্ৰয়োজন নহয়", "Battery ক্ষতি হয়"]',
 1, 'Restart কৰিলে temporary memory clear হয় আৰু প্ৰায়ে minor issues fix হয়। ই safe আৰু নিয়মীয়াকৈ recommended।');
;
