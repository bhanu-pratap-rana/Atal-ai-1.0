
-- Add missing practice questions for T12.3, T13.3, T16.3, T17.3
-- Part 1: English and Hindi only

-- ============================================
-- T12.3: Inbox Hygiene & Simple Filters
-- ============================================

-- English
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T12.3', 'M4', 'What is the best way to automatically organize emails from your teacher?', 
   '["Read all emails at once", "Create a filter: From teacher → label \"School\"", "Delete all emails", "Forward to friends"]',
   1, 'Filters automatically sort incoming emails, saving time and reducing missed messages.', 'medium', 1, 'en'),
  ('T12.3', 'M4', 'Which is a good inbox hygiene practice?',
   '["Keep all emails in inbox forever", "Use labels/folders to organize emails", "Never delete spam", "Open all attachments immediately"]',
   1, 'Using labels and folders helps keep your inbox organized and makes finding emails easier.', 'easy', 2, 'en'),
  ('T12.3', 'M4', 'If you receive a suspicious email with an "unsubscribe" link, what should you do?',
   '["Click unsubscribe immediately", "Mark it as spam instead", "Forward it to everyone", "Reply asking to unsubscribe"]',
   1, 'Clicking unsubscribe in suspicious emails can confirm your address to scammers. Mark as spam instead.', 'hard', 3, 'en');

-- Hindi
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T12.3', 'M4', 'अपने शिक्षक से आने वाले ईमेल को स्वचालित रूप से व्यवस्थित करने का सबसे अच्छा तरीका क्या है?',
   '["सभी ईमेल एक साथ पढ़ें", "एक फ़िल्टर बनाएं: शिक्षक से → \"स्कूल\" लेबल", "सभी ईमेल हटाएं", "दोस्तों को फॉरवर्ड करें"]',
   1, 'फ़िल्टर स्वचालित रूप से आने वाले ईमेल को सॉर्ट करते हैं, समय बचाते हैं और छूटे संदेशों को कम करते हैं।', 'medium', 1, 'hi'),
  ('T12.3', 'M4', 'कौन सी अच्छी इनबॉक्स स्वच्छता प्रथा है?',
   '["सभी ईमेल हमेशा इनबॉक्स में रखें", "ईमेल व्यवस्थित करने के लिए लेबल/फ़ोल्डर का उपयोग करें", "स्पैम कभी न हटाएं", "सभी अटैचमेंट तुरंत खोलें"]',
   1, 'लेबल और फ़ोल्डर का उपयोग करने से आपका इनबॉक्स व्यवस्थित रहता है और ईमेल ढूंढना आसान होता है।', 'easy', 2, 'hi'),
  ('T12.3', 'M4', 'यदि आपको "अनसब्सक्राइब" लिंक वाला एक संदिग्ध ईमेल मिलता है, तो आपको क्या करना चाहिए?',
   '["तुरंत अनसब्सक्राइब पर क्लिक करें", "इसे स्पैम के रूप में चिह्नित करें", "सभी को फॉरवर्ड करें", "अनसब्सक्राइब करने के लिए जवाब दें"]',
   1, 'संदिग्ध ईमेल में अनसब्सक्राइब पर क्लिक करने से स्कैमर्स को आपका पता पुष्टि हो सकता है। इसके बजाय स्पैम के रूप में चिह्नित करें।', 'hard', 3, 'hi');

-- ============================================
-- T13.3: Backups, Device Linking & Scams
-- ============================================

-- English
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T13.3', 'M4', 'A contact asks for your 6-digit WhatsApp verification code. What should you do?',
   '["Share it immediately", "Ask why they need it", "Do not share; block and report", "Send only half the code"]',
   2, 'That code lets them hijack your account. Never share verification codes with anyone.', 'hard', 1, 'en'),
  ('T13.3', 'M4', 'After using WhatsApp Web on a school computer, what should you do?',
   '["Leave it open for convenience", "Log out from the session", "Share the QR code with friends", "Delete the browser"]',
   1, 'Always log out of linked devices on shared computers to prevent unauthorized access.', 'medium', 2, 'en'),
  ('T13.3', 'M4', 'What is the recommended frequency for WhatsApp chat backups?',
   '["Never backup", "Weekly or monthly", "Every minute", "Only when phone is full"]',
   1, 'Weekly or monthly backups ensure your chats are saved without consuming too much data.', 'easy', 3, 'en');

-- Hindi
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T13.3', 'M4', 'एक संपर्क आपसे आपका 6-अंकीय WhatsApp सत्यापन कोड मांगता है। आपको क्या करना चाहिए?',
   '["तुरंत साझा करें", "पूछें कि उन्हें क्यों चाहिए", "साझा न करें; ब्लॉक और रिपोर्ट करें", "केवल आधा कोड भेजें"]',
   2, 'वह कोड उन्हें आपके खाते पर कब्जा करने देता है। सत्यापन कोड कभी किसी के साथ साझा न करें।', 'hard', 1, 'hi'),
  ('T13.3', 'M4', 'स्कूल कंप्यूटर पर WhatsApp Web का उपयोग करने के बाद, आपको क्या करना चाहिए?',
   '["सुविधा के लिए इसे खुला छोड़ दें", "सत्र से लॉग आउट करें", "दोस्तों के साथ QR कोड साझा करें", "ब्राउज़र हटाएं"]',
   1, 'अनधिकृत पहुंच को रोकने के लिए साझा कंप्यूटरों पर हमेशा लिंक किए गए उपकरणों से लॉग आउट करें।', 'medium', 2, 'hi'),
  ('T13.3', 'M4', 'WhatsApp चैट बैकअप की अनुशंसित आवृत्ति क्या है?',
   '["कभी बैकअप न करें", "साप्ताहिक या मासिक", "हर मिनट", "केवल जब फोन भर जाए"]',
   1, 'साप्ताहिक या मासिक बैकअप सुनिश्चित करते हैं कि आपकी चैट बहुत अधिक डेटा खर्च किए बिना सहेजी जाएं।', 'easy', 3, 'hi');

-- ============================================
-- T16.3: Filling Forms on Shared Computers
-- ============================================

-- English
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T16.3', 'M5', 'After submitting a form on a shared PC, the safest next step is...',
   '["Leave immediately", "Log out, clear downloads/history, remove USB", "Save password for next time", "Keep files on desktop"]',
   1, 'This prevents your personal data from being accessed by the next user.', 'hard', 1, 'en'),
  ('T16.3', 'M5', 'What should you use when filling forms on a shared computer?',
   '["Normal browser window", "Private/Incognito window", "Save all passwords", "Share your login with others"]',
   1, 'Private/Incognito mode prevents saving of browsing history, cookies, and login data.', 'medium', 2, 'en'),
  ('T16.3', 'M5', 'Before visiting a cyber cafe to fill an online form, you should...',
   '["Go without preparation", "Bring a checklist and files on USB", "Memorize all documents", "Ask someone else to fill it"]',
   1, 'A prepared checklist and USB with files ensures you complete the form correctly and safely.', 'easy', 3, 'en');

-- Hindi
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T16.3', 'M5', 'साझा पीसी पर फ़ॉर्म जमा करने के बाद, सबसे सुरक्षित अगला कदम है...',
   '["तुरंत चले जाएं", "लॉग आउट करें, डाउनलोड/इतिहास साफ़ करें, USB निकालें", "अगली बार के लिए पासवर्ड सहेजें", "फ़ाइलें डेस्कटॉप पर रखें"]',
   1, 'यह अगले उपयोगकर्ता द्वारा आपके व्यक्तिगत डेटा तक पहुंच को रोकता है।', 'hard', 1, 'hi'),
  ('T16.3', 'M5', 'साझा कंप्यूटर पर फ़ॉर्म भरते समय आपको क्या उपयोग करना चाहिए?',
   '["सामान्य ब्राउज़र विंडो", "प्राइवेट/इनकॉग्निटो विंडो", "सभी पासवर्ड सहेजें", "दूसरों के साथ अपना लॉगिन साझा करें"]',
   1, 'प्राइवेट/इनकॉग्निटो मोड ब्राउज़िंग इतिहास, कुकीज़ और लॉगिन डेटा को सहेजने से रोकता है।', 'medium', 2, 'hi'),
  ('T16.3', 'M5', 'ऑनलाइन फ़ॉर्म भरने के लिए साइबर कैफ़े जाने से पहले, आपको...',
   '["बिना तैयारी के जाएं", "USB पर चेकलिस्ट और फ़ाइलें लेकर जाएं", "सभी दस्तावेज़ याद करें", "किसी और से भरवाएं"]',
   1, 'तैयार चेकलिस्ट और फ़ाइलों वाला USB सुनिश्चित करता है कि आप फ़ॉर्म सही और सुरक्षित रूप से भरें।', 'easy', 3, 'hi');

-- ============================================
-- T17.3: Family/Shop Records & Budgeting
-- ============================================

-- English
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T17.3', 'M5', 'What should a weekly reconciliation include?',
   '["Only counting coins", "Match ledger totals with SMS/app and passbook", "Asking a neighbor", "Deleting old entries"]',
   1, 'Reconciliation confirms that your records are accurate by matching multiple sources.', 'medium', 1, 'en'),
  ('T17.3', 'M5', 'When maintaining a digital ledger, you should record...',
   '["Only cash transactions", "Only UPI transactions", "Both UPI and cash transactions", "Only large amounts"]',
   2, 'Recording all transactions (UPI and cash) gives you a complete picture of your finances.', 'easy', 2, 'en'),
  ('T17.3', 'M5', 'What is a good backup practice for paper ledgers?',
   '["No backup needed", "Take a photo of the ledger or copy to USB", "Post on social media", "Memorize all entries"]',
   1, 'Photos or digital copies protect your records in case the paper is lost or damaged.', 'medium', 3, 'en');

-- Hindi
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index, language)
VALUES
  ('T17.3', 'M5', 'साप्ताहिक मिलान में क्या शामिल होना चाहिए?',
   '["केवल सिक्के गिनना", "SMS/ऐप और पासबुक के साथ खाता बही का मिलान", "पड़ोसी से पूछना", "पुरानी प्रविष्टियां हटाना"]',
   1, 'मिलान कई स्रोतों का मिलान करके पुष्टि करता है कि आपके रिकॉर्ड सटीक हैं।', 'medium', 1, 'hi'),
  ('T17.3', 'M5', 'डिजिटल खाता बही बनाते समय, आपको क्या रिकॉर्ड करना चाहिए?',
   '["केवल नकद लेनदेन", "केवल UPI लेनदेन", "UPI और नकद दोनों लेनदेन", "केवल बड़ी राशि"]',
   2, 'सभी लेनदेन (UPI और नकद) रिकॉर्ड करने से आपके वित्त की पूरी तस्वीर मिलती है।', 'easy', 2, 'hi'),
  ('T17.3', 'M5', 'कागज़ी खाता बही के लिए अच्छी बैकअप प्रथा क्या है?',
   '["बैकअप की ज़रूरत नहीं", "खाता बही की फ़ोटो लें या USB में कॉपी करें", "सोशल मीडिया पर पोस्ट करें", "सभी प्रविष्टियां याद करें"]',
   1, 'फ़ोटो या डिजिटल कॉपी आपके रिकॉर्ड को सुरक्षित रखती हैं यदि कागज़ खो जाए या क्षतिग्रस्त हो जाए।', 'medium', 3, 'hi');
;
