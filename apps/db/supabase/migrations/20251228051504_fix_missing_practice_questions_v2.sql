
-- Fix missing practice questions for T3.1 (needs 1 more) and T6.2 (needs 1 more)
-- Also add Hindi/Assamese translations for more topics

-- T3.1 needs 1 more question
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T3.1', 'M1', 'en', 'easy', 
 'What does a file extension tell you about a file?',
 '["The file size", "The type of file and which program opens it", "When the file was created", "Who created the file"]',
 1, 'File extensions like .docx, .pdf, .jpg tell the computer (and you) what type of file it is and which program should open it.');

-- T6.2 needs 1 more question
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T6.2', 'M2', 'en', 'easy', 
 'Why should you uninstall programs you no longer use?',
 '["To make the computer look nicer", "To free up space and keep the computer running smoothly", "It is not necessary", "Only to save electricity"]',
 1, 'Uninstalling unused programs frees up storage space and can improve computer performance by reducing clutter.');

-- Add Hindi translations for M2 topics (T5.1, T5.2, T6.1, T6.2)
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
-- T5.1 Hindi
('T5.1', 'M2', 'hi', 'easy', 
 'किसी फाइल को दूसरी जगह ले जाने के लिए कौन सा विकल्प सही है?',
 '["Copy और Paste", "Cut और Paste", "Delete और Create", "Rename"]',
 1, 'Cut और Paste का उपयोग करने से फाइल मूल स्थान से हट जाती है और नए स्थान पर चली जाती है।'),

('T5.1', 'M2', 'hi', 'medium', 
 'Ctrl+C और Ctrl+V का क्या कार्य है?',
 '["फाइल हटाना", "फाइल कॉपी और पेस्ट करना", "फाइल का नाम बदलना", "कंप्यूटर बंद करना"]',
 1, 'Ctrl+C किसी चीज़ को कॉपी करता है और Ctrl+V उसे पेस्ट करता है।'),

('T5.1', 'M2', 'hi', 'hard', 
 'एक ही नाम वाली फाइल को उसी फोल्डर में पेस्ट करने पर क्या होता है?',
 '["पुरानी फाइल हट जाती है", "नई फाइल नहीं बनती", "फाइल का नाम बदल जाता है जैसे (Copy)", "कंप्यूटर बंद हो जाता है"]',
 2, 'अधिकांश ऑपरेटिंग सिस्टम में एक ही नाम वाली फाइल को पेस्ट करने पर नाम में "(Copy)" या संख्या जुड़ जाती है।'),

-- T5.2 Hindi
('T5.2', 'M2', 'hi', 'easy', 
 'गलती से हटाई गई फाइल कहाँ जाती है?',
 '["Desktop पर", "Recycle Bin में", "हमेशा के लिए हट जाती है", "Documents में"]',
 1, 'हटाई गई फाइलें पहले Recycle Bin में जाती हैं, जहाँ से उन्हें वापस लाया जा सकता है।'),

('T5.2', 'M2', 'hi', 'medium', 
 'Recycle Bin खाली करने से क्या होता है?',
 '["फाइलें वापस आ जाती हैं", "फाइलें हमेशा के लिए हट जाती हैं", "कुछ नहीं होता", "कंप्यूटर तेज हो जाता है"]',
 1, 'Recycle Bin खाली करने से फाइलें स्थायी रूप से हट जाती हैं और वापस नहीं आ सकतीं।'),

('T5.2', 'M2', 'hi', 'hard', 
 'फाइल के पुराने संस्करण को वापस लाने के लिए क्या करना चाहिए?',
 '["Recycle Bin देखना", "Previous Versions या File History का उपयोग करना", "नई फाइल बनाना", "कंप्यूटर restart करना"]',
 1, 'Previous Versions या File History की मदद से फाइल के पुराने संस्करण वापस लाए जा सकते हैं।'),

-- T6.1 Hindi
('T6.1', 'M2', 'hi', 'easy', 
 'सॉफ्टवेयर इंस्टॉल करने का सबसे सुरक्षित तरीका क्या है?',
 '["किसी भी वेबसाइट से डाउनलोड करना", "आधिकारिक वेबसाइट या ऐप स्टोर से डाउनलोड करना", "अनजान ईमेल से", "पुराने USB से"]',
 1, 'आधिकारिक वेबसाइट या ऐप स्टोर से इंस्टॉल करना सबसे सुरक्षित है क्योंकि वहाँ malware का खतरा कम होता है।'),

('T6.1', 'M2', 'hi', 'medium', 
 'प्रोग्राम इंस्टॉल करते समय Custom Installation क्यों चुनना चाहिए?',
 '["यह तेज होता है", "अनचाहे प्रोग्राम को रोकने के लिए", "यह मुफ्त होता है", "कोई फायदा नहीं है"]',
 1, 'Custom Installation में आप देख सकते हैं कि कौन से अतिरिक्त प्रोग्राम इंस्टॉल हो रहे हैं और उन्हें रोक सकते हैं।'),

('T6.1', 'M2', 'hi', 'hard', 
 'अगर कोई प्रोग्राम "Unknown Publisher" दिखाता है तो क्या करना चाहिए?',
 '["तुरंत इंस्टॉल करना", "सावधानी से जाँचना कि यह भरोसेमंद है या नहीं", "इसे ignore करना", "कंप्यूटर बंद करना"]',
 1, 'Unknown Publisher का मतलब है कि प्रोग्राम की पहचान verify नहीं हुई है। ऐसे प्रोग्राम से सावधान रहना चाहिए।'),

-- T6.2 Hindi  
('T6.2', 'M2', 'hi', 'easy', 
 'सॉफ्टवेयर अपडेट क्यों जरूरी हैं?',
 '["कंप्यूटर को सुंदर बनाने के लिए", "सुरक्षा और नई सुविधाओं के लिए", "फाइलें हटाने के लिए", "इंटरनेट के लिए"]',
 1, 'सॉफ्टवेयर अपडेट में सुरक्षा सुधार और नई सुविधाएं होती हैं जो कंप्यूटर को सुरक्षित और बेहतर बनाती हैं।'),

('T6.2', 'M2', 'hi', 'medium', 
 'किसी प्रोग्राम को सही तरीके से हटाने के लिए क्या करना चाहिए?',
 '["फोल्डर को Delete करना", "Control Panel में Add/Remove Programs का उपयोग करना", "फाइल को Recycle Bin में डालना", "कंप्यूटर restart करना"]',
 1, 'Add/Remove Programs (या Apps & Features) का उपयोग करने से प्रोग्राम पूरी तरह से और सही तरीके से हटता है।'),

('T6.2', 'M2', 'hi', 'hard', 
 'प्रोग्राम हटाने के बाद भी कुछ फाइलें बची रहती हैं, इन्हें क्या कहते हैं?',
 '["System Files", "Leftover या Residual Files", "Backup Files", "Hidden Files"]',
 1, 'Leftover या Residual Files वे अतिरिक्त फाइलें हैं जो प्रोग्राम हटाने के बाद भी बची रहती हैं।');
;
