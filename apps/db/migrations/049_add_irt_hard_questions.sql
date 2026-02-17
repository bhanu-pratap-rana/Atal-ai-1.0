-- Migration: Add Hard and Very Hard IRT Questions for CAT Pre-Assessment
--
-- Purpose: Fix difficulty distribution imbalance in IRT item bank
-- Current Issue: Max difficulty is only +1.0, but IRT scale goes to +3.0
--
-- This migration adds:
-- - 10 Hard questions per language (difficulty 0.8 to 1.5)
-- - 10 Very Hard questions per language (difficulty 1.5 to 2.5)
-- - Total: 60 new questions (20 × 3 languages)
--
-- After migration:
-- - Each language: 100 questions (from 80)
-- - Difficulty range: -2.1 to +2.5 (proper CAT distribution)
-- - Pool ratio: 100/30 = 3.3x (meets 3x minimum best practice)
--
-- Best Practices Applied:
-- - 3PL model parameters: a (discrimination 1.4-2.2), b (difficulty), c (guessing 0.2-0.3)
-- - Higher discrimination for harder items (more precise measurement)
-- - Slightly higher guessing for very hard items (accounts for random correct guesses)
-- - Uniform distribution across all 5 categories

-- ============================================
-- ENGLISH HARD QUESTIONS (10 questions, difficulty 0.8-1.5)
-- ============================================

-- Contextual Application - Hard (2 questions)
INSERT INTO irt_item_bank (item_code, category, level, question_text, options, correct_answer, difficulty, discrimination, guessing, language, source_language, is_active, review_state)
VALUES
('CAT_EN_CA_HARD_001', 'contextual_application', 'basic',
 'A user needs to collaborate on a document with team members in different time zones, track all changes made by each person, and maintain version history. Which solution best meets all these requirements?',
 '[{"id":"A","text":"Email the document back and forth"},{"id":"B","text":"Use cloud-based collaborative editing like Google Docs or Microsoft 365"},{"id":"C","text":"Share via USB drive"},{"id":"D","text":"Print and scan changes"}]',
 2, 1.2, 1.8, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_CA_HARD_002', 'contextual_application', 'basic',
 'When setting up two-factor authentication (2FA) for an important account, which combination provides the strongest security?',
 '[{"id":"A","text":"Password + security question"},{"id":"B","text":"Password + SMS code"},{"id":"C","text":"Password + authenticator app with biometric lock"},{"id":"D","text":"Two different passwords"}]',
 3, 1.4, 1.9, 0.23, 'en', 'en', true, 'approved'),

-- Digital Content Creation - Hard (2 questions)
('CAT_EN_DCC_HARD_001', 'digital_content_creation', 'basic',
 'You need to create a professional document that includes a table of contents that automatically updates when you add new sections. Which feature should you use?',
 '[{"id":"A","text":"Manual numbering"},{"id":"B","text":"Heading styles with auto-generated table of contents"},{"id":"C","text":"Bullet points"},{"id":"D","text":"Text boxes"}]',
 2, 1.0, 1.7, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_DCC_HARD_002', 'digital_content_creation', 'basic',
 'When preparing images for a website, which approach best balances quality and loading speed?',
 '[{"id":"A","text":"Use maximum quality BMP files"},{"id":"B","text":"Compress images to appropriate resolution and use WebP or optimized JPEG format"},{"id":"C","text":"Always use GIF format"},{"id":"D","text":"Upload original camera photos directly"}]',
 2, 1.3, 1.8, 0.23, 'en', 'en', true, 'approved'),

-- Digital Device Familiarity - Hard (2 questions)
('CAT_EN_DDF_HARD_001', 'digital_device_familiarity', 'basic',
 'A computer is running slowly. The Task Manager shows 95% RAM usage with only a web browser open (20 tabs). What is the most effective solution?',
 '[{"id":"A","text":"Restart the computer repeatedly"},{"id":"B","text":"Close unnecessary tabs and consider adding more RAM or using a browser extension to manage tabs"},{"id":"C","text":"Delete system files"},{"id":"D","text":"Increase monitor brightness"}]',
 2, 1.1, 1.8, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_DDF_HARD_002', 'digital_device_familiarity', 'basic',
 'What is the difference between SSD and HDD storage, and when would you recommend each?',
 '[{"id":"A","text":"They are exactly the same"},{"id":"B","text":"SSD is faster with no moving parts (better for OS/apps); HDD is cheaper per GB with moving parts (better for bulk storage)"},{"id":"C","text":"HDD is always faster"},{"id":"D","text":"SSD can only store text files"}]',
 2, 1.2, 1.7, 0.23, 'en', 'en', true, 'approved'),

-- Internet & Web Awareness - Hard (2 questions)
('CAT_EN_IWA_HARD_001', 'internet_web_awareness', 'basic',
 'You receive an email from "support@amaz0n-security.com" asking you to verify your account by clicking a link. The email looks official with the Amazon logo. What should you do?',
 '[{"id":"A","text":"Click the link immediately"},{"id":"B","text":"Recognize this as likely phishing (note the zero in amaz0n), do not click, and report as spam"},{"id":"C","text":"Reply with your password"},{"id":"D","text":"Forward to all contacts"}]',
 2, 0.9, 1.6, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_IWA_HARD_002', 'internet_web_awareness', 'basic',
 'What does it mean when a website shows "Your connection is not private" warning in the browser?',
 '[{"id":"A","text":"The website is in maintenance mode"},{"id":"B","text":"The SSL/TLS certificate is invalid, expired, or missing, meaning data may not be encrypted"},{"id":"C","text":"Your internet is too slow"},{"id":"D","text":"The website has too many visitors"}]',
 2, 1.0, 1.7, 0.23, 'en', 'en', true, 'approved'),

-- Problem Solving Aptitude - Hard (2 questions)
('CAT_EN_PSA_HARD_001', 'problem_solving_aptitude', 'basic',
 'Your laptop suddenly shuts down while plugged in and won''t turn on. You try a different power outlet and the laptop still won''t start. What is the most logical next diagnostic step?',
 '[{"id":"A","text":"Buy a new laptop immediately"},{"id":"B","text":"Check if the charging indicator lights up; if not, the adapter may be faulty; if yes, try holding power button for 30 seconds (hard reset)"},{"id":"C","text":"Throw the laptop away"},{"id":"D","text":"Wait one year and try again"}]',
 2, 1.3, 1.9, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_PSA_HARD_002', 'problem_solving_aptitude', 'basic',
 'A user complains their Wi-Fi is slow only on their laptop, but other devices work fine. What troubleshooting steps would you recommend?',
 '[{"id":"A","text":"Replace the router immediately"},{"id":"B","text":"Check laptop Wi-Fi driver, run network troubleshooter, check for interference, try forgetting and reconnecting to network"},{"id":"C","text":"Buy a new internet plan"},{"id":"D","text":"Ignore the problem"}]',
 2, 1.1, 1.8, 0.23, 'en', 'en', true, 'approved'),

-- ============================================
-- ENGLISH VERY HARD QUESTIONS (10 questions, difficulty 1.5-2.5)
-- ============================================

-- Contextual Application - Very Hard (2 questions)
('CAT_EN_CA_VHARD_001', 'contextual_application', 'basic',
 'An organization needs to implement a backup strategy for critical business data. According to the 3-2-1 backup rule, what is the correct implementation?',
 '[{"id":"A","text":"3 copies on the same computer"},{"id":"B","text":"3 copies total, on 2 different media types, with 1 copy stored offsite or in cloud"},{"id":"C","text":"1 copy on 3 USB drives"},{"id":"D","text":"2 copies in the same building"}]',
 2, 1.8, 2.0, 0.25, 'en', 'en', true, 'approved'),

('CAT_EN_CA_VHARD_002', 'contextual_application', 'basic',
 'When implementing role-based access control (RBAC) for a shared document system, which principle should guide permission assignment?',
 '[{"id":"A","text":"Give everyone full access for convenience"},{"id":"B","text":"Principle of least privilege - users get minimum access needed for their role"},{"id":"C","text":"Only managers should have any access"},{"id":"D","text":"Permissions are not important"}]',
 2, 2.0, 2.1, 0.25, 'en', 'en', true, 'approved'),

-- Digital Content Creation - Very Hard (2 questions)
('CAT_EN_DCC_VHARD_001', 'digital_content_creation', 'basic',
 'When creating accessible digital content for users with visual impairments, which combination of techniques is most comprehensive?',
 '[{"id":"A","text":"Use only images without text"},{"id":"B","text":"Provide alt text for images, use semantic headings, ensure color contrast ratio of 4.5:1, and support screen readers"},{"id":"C","text":"Make text very small to fit more content"},{"id":"D","text":"Use only red and green colors"}]',
 2, 1.9, 2.0, 0.25, 'en', 'en', true, 'approved'),

('CAT_EN_DCC_VHARD_002', 'digital_content_creation', 'basic',
 'You need to create a form that validates email addresses in real-time. Which regular expression pattern correctly identifies valid email formats?',
 '[{"id":"A","text":"Any text with @ symbol is valid"},{"id":"B","text":"Pattern checking for: characters before @, valid domain name, and valid TLD (e.g., user@domain.com)"},{"id":"C","text":"Only numbers are allowed"},{"id":"D","text":"Email validation is not possible"}]',
 2, 2.2, 2.1, 0.27, 'en', 'en', true, 'approved'),

-- Digital Device Familiarity - Very Hard (2 questions)
('CAT_EN_DDF_VHARD_001', 'digital_device_familiarity', 'basic',
 'A computer shows a BSOD (Blue Screen of Death) with error "KERNEL_DATA_INPAGE_ERROR". What is the most likely cause and first diagnostic step?',
 '[{"id":"A","text":"The keyboard is broken"},{"id":"B","text":"Likely disk or memory issue - run disk check (chkdsk) and memory diagnostic (mdsched) to identify failing hardware"},{"id":"C","text":"The monitor needs replacement"},{"id":"D","text":"Reinstall all programs immediately"}]',
 2, 2.1, 2.2, 0.26, 'en', 'en', true, 'approved'),

('CAT_EN_DDF_VHARD_002', 'digital_device_familiarity', 'basic',
 'What is the purpose of UEFI compared to legacy BIOS, and what security feature does UEFI enable?',
 '[{"id":"A","text":"They are identical systems"},{"id":"B","text":"UEFI supports larger drives, faster boot, and Secure Boot which prevents unauthorized bootloaders/malware from loading"},{"id":"C","text":"BIOS is newer than UEFI"},{"id":"D","text":"UEFI only works with Apple computers"}]',
 2, 2.3, 2.1, 0.27, 'en', 'en', true, 'approved'),

-- Internet & Web Awareness - Very Hard (2 questions)
('CAT_EN_IWA_VHARD_001', 'internet_web_awareness', 'basic',
 'What is the difference between symmetric and asymmetric encryption, and when is each used in HTTPS connections?',
 '[{"id":"A","text":"They are the same thing"},{"id":"B","text":"Asymmetric (public/private key) is used for initial handshake; symmetric (shared secret) for faster bulk data transfer"},{"id":"C","text":"Symmetric is more secure"},{"id":"D","text":"HTTPS does not use encryption"}]',
 2, 2.4, 2.2, 0.28, 'en', 'en', true, 'approved'),

('CAT_EN_IWA_VHARD_002', 'internet_web_awareness', 'basic',
 'A website uses cookies for tracking. What is the key difference between first-party and third-party cookies in terms of privacy?',
 '[{"id":"A","text":"All cookies are identical"},{"id":"B","text":"First-party are set by the site you visit (for functionality); third-party are set by external domains (often for cross-site tracking/ads)"},{"id":"C","text":"Third-party cookies are more secure"},{"id":"D","text":"Cookies cannot track users"}]',
 2, 1.7, 1.9, 0.25, 'en', 'en', true, 'approved'),

-- Problem Solving Aptitude - Very Hard (2 questions)
('CAT_EN_PSA_VHARD_001', 'problem_solving_aptitude', 'basic',
 'A database query that usually takes 2 seconds is now taking 45 seconds. The data volume has not changed significantly. What systematic approach would you use to diagnose this?',
 '[{"id":"A","text":"Delete the database"},{"id":"B","text":"Check query execution plan for table scans, verify indexes are not fragmented, check for blocking queries, and review recent schema changes"},{"id":"C","text":"Buy faster internet"},{"id":"D","text":"Wait longer for each query"}]',
 2, 2.5, 2.2, 0.28, 'en', 'en', true, 'approved'),

('CAT_EN_PSA_VHARD_002', 'problem_solving_aptitude', 'basic',
 'A user reports that a web application works in Chrome but fails in Safari with JavaScript errors. What is the most systematic debugging approach?',
 '[{"id":"A","text":"Tell user to only use Chrome"},{"id":"B","text":"Check browser console for errors, verify JavaScript compatibility (ES6+ features), test with polyfills, and check for Safari-specific bugs"},{"id":"C","text":"The application is broken"},{"id":"D","text":"Safari does not support websites"}]',
 2, 2.0, 2.0, 0.26, 'en', 'en', true, 'approved');

-- ============================================
-- HINDI HARD QUESTIONS (10 questions, difficulty 0.8-1.5)
-- ============================================

-- Contextual Application - Hard (2 questions)
INSERT INTO irt_item_bank (item_code, category, level, question_text, options, correct_answer, difficulty, discrimination, guessing, language, source_language, is_active, review_state)
VALUES
('CAT_HI_CA_HARD_001', 'contextual_application', 'basic',
 'एक उपयोगकर्ता को अलग-अलग समय क्षेत्रों में टीम के सदस्यों के साथ एक दस्तावेज़ पर सहयोग करना है, प्रत्येक व्यक्ति द्वारा किए गए सभी परिवर्तनों को ट्रैक करना है, और संस्करण इतिहास बनाए रखना है। कौन सा समाधान इन सभी आवश्यकताओं को पूरा करता है?',
 '[{"id":"A","text":"दस्तावेज़ को ईमेल से आगे-पीछे भेजें"},{"id":"B","text":"क्लाउड-आधारित सहयोगी संपादन जैसे Google Docs या Microsoft 365 का उपयोग करें"},{"id":"C","text":"USB ड्राइव के माध्यम से साझा करें"},{"id":"D","text":"प्रिंट करें और परिवर्तन स्कैन करें"}]',
 2, 1.2, 1.8, 0.22, 'hi', 'en', true, 'approved'),

('CAT_HI_CA_HARD_002', 'contextual_application', 'basic',
 'एक महत्वपूर्ण खाते के लिए दो-कारक प्रमाणीकरण (2FA) सेट करते समय, कौन सा संयोजन सबसे मजबूत सुरक्षा प्रदान करता है?',
 '[{"id":"A","text":"पासवर्ड + सुरक्षा प्रश्न"},{"id":"B","text":"पासवर्ड + SMS कोड"},{"id":"C","text":"पासवर्ड + बायोमेट्रिक लॉक के साथ प्रमाणक ऐप"},{"id":"D","text":"दो अलग-अलग पासवर्ड"}]',
 3, 1.4, 1.9, 0.23, 'hi', 'en', true, 'approved'),

-- Digital Content Creation - Hard (2 questions)
('CAT_HI_DCC_HARD_001', 'digital_content_creation', 'basic',
 'आपको एक पेशेवर दस्तावेज़ बनाना है जिसमें विषय सूची शामिल हो जो नए अनुभाग जोड़ने पर स्वचालित रूप से अपडेट हो। आपको कौन सी सुविधा का उपयोग करना चाहिए?',
 '[{"id":"A","text":"मैनुअल नंबरिंग"},{"id":"B","text":"स्वचालित-जनरेटेड विषय सूची के साथ हेडिंग शैलियाँ"},{"id":"C","text":"बुलेट पॉइंट्स"},{"id":"D","text":"टेक्स्ट बॉक्स"}]',
 2, 1.0, 1.7, 0.22, 'hi', 'en', true, 'approved'),

('CAT_HI_DCC_HARD_002', 'digital_content_creation', 'basic',
 'वेबसाइट के लिए छवियाँ तैयार करते समय, गुणवत्ता और लोडिंग गति का सबसे अच्छा संतुलन कौन सा तरीका देता है?',
 '[{"id":"A","text":"अधिकतम गुणवत्ता वाली BMP फाइलों का उपयोग करें"},{"id":"B","text":"छवियों को उचित रिज़ॉल्यूशन पर संपीड़ित करें और WebP या अनुकूलित JPEG प्रारूप का उपयोग करें"},{"id":"C","text":"हमेशा GIF प्रारूप का उपयोग करें"},{"id":"D","text":"मूल कैमरा फोटो सीधे अपलोड करें"}]',
 2, 1.3, 1.8, 0.23, 'hi', 'en', true, 'approved'),

-- Digital Device Familiarity - Hard (2 questions)
('CAT_HI_DDF_HARD_001', 'digital_device_familiarity', 'basic',
 'एक कंप्यूटर धीमा चल रहा है। टास्क मैनेजर में केवल एक वेब ब्राउज़र (20 टैब) खुला होने के साथ 95% RAM उपयोग दिखाई दे रहा है। सबसे प्रभावी समाधान क्या है?',
 '[{"id":"A","text":"कंप्यूटर को बार-बार रीस्टार्ट करें"},{"id":"B","text":"अनावश्यक टैब बंद करें और अधिक RAM जोड़ने या टैब प्रबंधित करने के लिए ब्राउज़र एक्सटेंशन का उपयोग करने पर विचार करें"},{"id":"C","text":"सिस्टम फाइलें हटाएं"},{"id":"D","text":"मॉनिटर की चमक बढ़ाएं"}]',
 2, 1.1, 1.8, 0.22, 'hi', 'en', true, 'approved'),

('CAT_HI_DDF_HARD_002', 'digital_device_familiarity', 'basic',
 'SSD और HDD स्टोरेज में क्या अंतर है, और आप प्रत्येक की सिफारिश कब करेंगे?',
 '[{"id":"A","text":"वे बिल्कुल समान हैं"},{"id":"B","text":"SSD तेज है बिना चलने वाले पुर्जों के (OS/ऐप्स के लिए बेहतर); HDD प्रति GB सस्ता है चलने वाले पुर्जों के साथ (बड़े स्टोरेज के लिए बेहतर)"},{"id":"C","text":"HDD हमेशा तेज होता है"},{"id":"D","text":"SSD केवल टेक्स्ट फाइलें स्टोर कर सकता है"}]',
 2, 1.2, 1.7, 0.23, 'hi', 'en', true, 'approved'),

-- Internet & Web Awareness - Hard (2 questions)
('CAT_HI_IWA_HARD_001', 'internet_web_awareness', 'basic',
 'आपको "support@amaz0n-security.com" से एक ईमेल प्राप्त होती है जो आपसे एक लिंक पर क्लिक करके अपना खाता सत्यापित करने के लिए कहती है। ईमेल Amazon लोगो के साथ आधिकारिक दिखती है। आपको क्या करना चाहिए?',
 '[{"id":"A","text":"तुरंत लिंक पर क्लिक करें"},{"id":"B","text":"इसे संभावित फ़िशिंग के रूप में पहचानें (amaz0n में शून्य नोट करें), क्लिक न करें, और स्पैम के रूप में रिपोर्ट करें"},{"id":"C","text":"अपना पासवर्ड के साथ उत्तर दें"},{"id":"D","text":"सभी संपर्कों को अग्रेषित करें"}]',
 2, 0.9, 1.6, 0.22, 'hi', 'en', true, 'approved'),

('CAT_HI_IWA_HARD_002', 'internet_web_awareness', 'basic',
 'जब कोई वेबसाइट ब्राउज़र में "आपका कनेक्शन निजी नहीं है" चेतावनी दिखाती है तो इसका क्या मतलब है?',
 '[{"id":"A","text":"वेबसाइट रखरखाव मोड में है"},{"id":"B","text":"SSL/TLS प्रमाणपत्र अमान्य, समाप्त, या गायब है, जिसका अर्थ है कि डेटा एन्क्रिप्टेड नहीं हो सकता"},{"id":"C","text":"आपका इंटरनेट बहुत धीमा है"},{"id":"D","text":"वेबसाइट पर बहुत अधिक विज़िटर हैं"}]',
 2, 1.0, 1.7, 0.23, 'hi', 'en', true, 'approved'),

-- Problem Solving Aptitude - Hard (2 questions)
('CAT_HI_PSA_HARD_001', 'problem_solving_aptitude', 'basic',
 'आपका लैपटॉप प्लग इन होने पर अचानक बंद हो जाता है और चालू नहीं होता। आप एक अलग पावर आउटलेट का प्रयास करते हैं और लैपटॉप अभी भी शुरू नहीं होता। सबसे तार्किक अगला डायग्नोस्टिक कदम क्या है?',
 '[{"id":"A","text":"तुरंत नया लैपटॉप खरीदें"},{"id":"B","text":"जांचें कि चार्जिंग इंडिकेटर जलता है या नहीं; अगर नहीं, तो एडाप्टर खराब हो सकता है; अगर हाँ, तो 30 सेकंड के लिए पावर बटन दबाकर रखें (हार्ड रीसेट)"},{"id":"C","text":"लैपटॉप फेंक दें"},{"id":"D","text":"एक साल रुकें और फिर प्रयास करें"}]',
 2, 1.3, 1.9, 0.22, 'hi', 'en', true, 'approved'),

('CAT_HI_PSA_HARD_002', 'problem_solving_aptitude', 'basic',
 'एक उपयोगकर्ता शिकायत करता है कि उनका Wi-Fi केवल उनके लैपटॉप पर धीमा है, लेकिन अन्य डिवाइस ठीक काम करते हैं। आप कौन से समस्या निवारण कदमों की सिफारिश करेंगे?',
 '[{"id":"A","text":"तुरंत राउटर बदलें"},{"id":"B","text":"लैपटॉप का Wi-Fi ड्राइवर जांचें, नेटवर्क ट्रबलशूटर चलाएं, हस्तक्षेप की जांच करें, नेटवर्क भूलकर फिर से कनेक्ट करने का प्रयास करें"},{"id":"C","text":"नया इंटरनेट प्लान खरीदें"},{"id":"D","text":"समस्या को अनदेखा करें"}]',
 2, 1.1, 1.8, 0.23, 'hi', 'en', true, 'approved'),

-- ============================================
-- HINDI VERY HARD QUESTIONS (10 questions, difficulty 1.5-2.5)
-- ============================================

-- Contextual Application - Very Hard (2 questions)
('CAT_HI_CA_VHARD_001', 'contextual_application', 'basic',
 'एक संगठन को महत्वपूर्ण व्यावसायिक डेटा के लिए बैकअप रणनीति लागू करनी है। 3-2-1 बैकअप नियम के अनुसार, सही कार्यान्वयन क्या है?',
 '[{"id":"A","text":"एक ही कंप्यूटर पर 3 प्रतियाँ"},{"id":"B","text":"कुल 3 प्रतियाँ, 2 अलग-अलग मीडिया प्रकारों पर, 1 प्रति ऑफसाइट या क्लाउड में संग्रहीत"},{"id":"C","text":"3 USB ड्राइव पर 1 प्रति"},{"id":"D","text":"एक ही भवन में 2 प्रतियाँ"}]',
 2, 1.8, 2.0, 0.25, 'hi', 'en', true, 'approved'),

('CAT_HI_CA_VHARD_002', 'contextual_application', 'basic',
 'साझा दस्तावेज़ प्रणाली के लिए भूमिका-आधारित पहुंच नियंत्रण (RBAC) लागू करते समय, अनुमति असाइनमेंट के लिए कौन सा सिद्धांत मार्गदर्शन करना चाहिए?',
 '[{"id":"A","text":"सुविधा के लिए सभी को पूर्ण पहुंच दें"},{"id":"B","text":"न्यूनतम विशेषाधिकार का सिद्धांत - उपयोगकर्ताओं को उनकी भूमिका के लिए आवश्यक न्यूनतम पहुंच मिलती है"},{"id":"C","text":"केवल प्रबंधकों के पास कोई पहुंच होनी चाहिए"},{"id":"D","text":"अनुमतियाँ महत्वपूर्ण नहीं हैं"}]',
 2, 2.0, 2.1, 0.25, 'hi', 'en', true, 'approved'),

-- Digital Content Creation - Very Hard (2 questions)
('CAT_HI_DCC_VHARD_001', 'digital_content_creation', 'basic',
 'दृष्टि बाधित उपयोगकर्ताओं के लिए सुलभ डिजिटल सामग्री बनाते समय, कौन सी तकनीकों का संयोजन सबसे व्यापक है?',
 '[{"id":"A","text":"बिना टेक्स्ट के केवल छवियों का उपयोग करें"},{"id":"B","text":"छवियों के लिए ऑल्ट टेक्स्ट प्रदान करें, सेमांटिक हेडिंग का उपयोग करें, 4.5:1 का रंग कंट्रास्ट अनुपात सुनिश्चित करें, और स्क्रीन रीडर का समर्थन करें"},{"id":"C","text":"अधिक सामग्री फिट करने के लिए टेक्स्ट बहुत छोटा करें"},{"id":"D","text":"केवल लाल और हरे रंगों का उपयोग करें"}]',
 2, 1.9, 2.0, 0.25, 'hi', 'en', true, 'approved'),

('CAT_HI_DCC_VHARD_002', 'digital_content_creation', 'basic',
 'आपको एक फॉर्म बनाना है जो वास्तविक समय में ईमेल पतों को मान्य करता है। कौन सा रेगुलर एक्सप्रेशन पैटर्न वैध ईमेल प्रारूपों की सही पहचान करता है?',
 '[{"id":"A","text":"@ चिह्न वाला कोई भी टेक्स्ट मान्य है"},{"id":"B","text":"@ से पहले वर्णों, वैध डोमेन नाम, और वैध TLD की जांच करने वाला पैटर्न (उदा., user@domain.com)"},{"id":"C","text":"केवल संख्याएं अनुमत हैं"},{"id":"D","text":"ईमेल सत्यापन संभव नहीं है"}]',
 2, 2.2, 2.1, 0.27, 'hi', 'en', true, 'approved'),

-- Digital Device Familiarity - Very Hard (2 questions)
('CAT_HI_DDF_VHARD_001', 'digital_device_familiarity', 'basic',
 'एक कंप्यूटर BSOD (ब्लू स्क्रीन ऑफ डेथ) दिखाता है जिसमें त्रुटि "KERNEL_DATA_INPAGE_ERROR" है। सबसे संभावित कारण और पहला डायग्नोस्टिक कदम क्या है?',
 '[{"id":"A","text":"कीबोर्ड टूटा हुआ है"},{"id":"B","text":"संभावित डिस्क या मेमोरी समस्या - खराब हार्डवेयर की पहचान के लिए डिस्क चेक (chkdsk) और मेमोरी डायग्नोस्टिक (mdsched) चलाएं"},{"id":"C","text":"मॉनिटर को बदलने की जरूरत है"},{"id":"D","text":"सभी प्रोग्राम तुरंत पुनः इंस्टॉल करें"}]',
 2, 2.1, 2.2, 0.26, 'hi', 'en', true, 'approved'),

('CAT_HI_DDF_VHARD_002', 'digital_device_familiarity', 'basic',
 'लीगेसी BIOS की तुलना में UEFI का उद्देश्य क्या है, और UEFI कौन सी सुरक्षा सुविधा सक्षम करता है?',
 '[{"id":"A","text":"वे समान प्रणालियाँ हैं"},{"id":"B","text":"UEFI बड़ी ड्राइव, तेज बूट, और Secure Boot का समर्थन करता है जो अनधिकृत बूटलोडर/मैलवेयर को लोड होने से रोकता है"},{"id":"C","text":"BIOS, UEFI से नया है"},{"id":"D","text":"UEFI केवल Apple कंप्यूटरों के साथ काम करता है"}]',
 2, 2.3, 2.1, 0.27, 'hi', 'en', true, 'approved'),

-- Internet & Web Awareness - Very Hard (2 questions)
('CAT_HI_IWA_VHARD_001', 'internet_web_awareness', 'basic',
 'सिमेट्रिक और असिमेट्रिक एन्क्रिप्शन में क्या अंतर है, और HTTPS कनेक्शन में प्रत्येक का उपयोग कब किया जाता है?',
 '[{"id":"A","text":"वे एक ही चीज हैं"},{"id":"B","text":"असिमेट्रिक (पब्लिक/प्राइवेट कुंजी) प्रारंभिक हैंडशेक के लिए उपयोग होता है; सिमेट्रिक (साझा गुप्त) तेज बल्क डेटा ट्रांसफर के लिए"},{"id":"C","text":"सिमेट्रिक अधिक सुरक्षित है"},{"id":"D","text":"HTTPS एन्क्रिप्शन का उपयोग नहीं करता"}]',
 2, 2.4, 2.2, 0.28, 'hi', 'en', true, 'approved'),

('CAT_HI_IWA_VHARD_002', 'internet_web_awareness', 'basic',
 'एक वेबसाइट ट्रैकिंग के लिए कुकीज़ का उपयोग करती है। गोपनीयता के संदर्भ में पहली-पार्टी और थर्ड-पार्टी कुकीज़ में मुख्य अंतर क्या है?',
 '[{"id":"A","text":"सभी कुकीज़ समान हैं"},{"id":"B","text":"पहली-पार्टी उस साइट द्वारा सेट की जाती है जिसे आप विज़िट करते हैं (कार्यक्षमता के लिए); थर्ड-पार्टी बाहरी डोमेन द्वारा सेट की जाती है (अक्सर क्रॉस-साइट ट्रैकिंग/विज्ञापनों के लिए)"},{"id":"C","text":"थर्ड-पार्टी कुकीज़ अधिक सुरक्षित हैं"},{"id":"D","text":"कुकीज़ उपयोगकर्ताओं को ट्रैक नहीं कर सकतीं"}]',
 2, 1.7, 1.9, 0.25, 'hi', 'en', true, 'approved'),

-- Problem Solving Aptitude - Very Hard (2 questions)
('CAT_HI_PSA_VHARD_001', 'problem_solving_aptitude', 'basic',
 'एक डेटाबेस क्वेरी जो आमतौर पर 2 सेकंड लेती है अब 45 सेकंड ले रही है। डेटा वॉल्यूम में महत्वपूर्ण बदलाव नहीं हुआ है। इसका निदान करने के लिए आप कौन सी व्यवस्थित विधि का उपयोग करेंगे?',
 '[{"id":"A","text":"डेटाबेस हटाएं"},{"id":"B","text":"टेबल स्कैन के लिए क्वेरी निष्पादन योजना जांचें, इंडेक्स फ्रैगमेंटेड नहीं हैं यह सत्यापित करें, ब्लॉकिंग क्वेरीज़ की जांच करें, और हाल के स्कीमा परिवर्तनों की समीक्षा करें"},{"id":"C","text":"तेज इंटरनेट खरीदें"},{"id":"D","text":"प्रत्येक क्वेरी के लिए अधिक समय प्रतीक्षा करें"}]',
 2, 2.5, 2.2, 0.28, 'hi', 'en', true, 'approved'),

('CAT_HI_PSA_VHARD_002', 'problem_solving_aptitude', 'basic',
 'एक उपयोगकर्ता रिपोर्ट करता है कि एक वेब एप्लिकेशन Chrome में काम करता है लेकिन Safari में JavaScript त्रुटियों के साथ विफल होता है। सबसे व्यवस्थित डिबगिंग दृष्टिकोण क्या है?',
 '[{"id":"A","text":"उपयोगकर्ता को केवल Chrome का उपयोग करने के लिए कहें"},{"id":"B","text":"त्रुटियों के लिए ब्राउज़र कंसोल जांचें, JavaScript संगतता (ES6+ सुविधाएं) सत्यापित करें, पॉलीफिल के साथ परीक्षण करें, और Safari-विशिष्ट बग की जांच करें"},{"id":"C","text":"एप्लिकेशन टूटा हुआ है"},{"id":"D","text":"Safari वेबसाइटों का समर्थन नहीं करता"}]',
 2, 2.0, 2.0, 0.26, 'hi', 'en', true, 'approved');

-- ============================================
-- ASSAMESE HARD QUESTIONS (10 questions, difficulty 0.8-1.5)
-- ============================================

-- Contextual Application - Hard (2 questions)
INSERT INTO irt_item_bank (item_code, category, level, question_text, options, correct_answer, difficulty, discrimination, guessing, language, source_language, is_active, review_state)
VALUES
('CAT_AS_CA_HARD_001', 'contextual_application', 'basic',
 'এজন ব্যৱহাৰকাৰীয়ে বিভিন্ন সময় মণ্ডলত থকা দলৰ সদস্যসকলৰ সৈতে এটা নথিপত্ৰত সহযোগিতা কৰিব লাগে, প্ৰতিজন ব্যক্তিয়ে কৰা সকলো পৰিবৰ্তন ট্ৰেক কৰিব লাগে, আৰু সংস্কৰণ ইতিহাস বজাই ৰাখিব লাগে। কোন সমাধানে এই সকলো প্ৰয়োজনীয়তা পূৰণ কৰে?',
 '[{"id":"A","text":"নথিপত্ৰটো ইমেইলৰ জৰিয়তে আগলৈ-পাছলৈ পঠাওক"},{"id":"B","text":"Google Docs বা Microsoft 365ৰ দৰে ক্লাউড-ভিত্তিক সহযোগিতামূলক সম্পাদনা ব্যৱহাৰ কৰক"},{"id":"C","text":"USB ড্ৰাইভৰ জৰিয়তে শ্বেয়াৰ কৰক"},{"id":"D","text":"প্ৰিণ্ট কৰক আৰু পৰিবৰ্তনসমূহ স্কেন কৰক"}]',
 2, 1.2, 1.8, 0.22, 'as', 'en', true, 'approved'),

('CAT_AS_CA_HARD_002', 'contextual_application', 'basic',
 'এটা গুৰুত্বপূৰ্ণ একাউণ্টৰ বাবে দুই-কাৰক প্ৰমাণীকৰণ (2FA) ছেট আপ কৰোঁতে, কোন সংযোগে সৰ্বাধিক সুৰক্ষা প্ৰদান কৰে?',
 '[{"id":"A","text":"পাছৱৰ্ড + সুৰক্ষা প্ৰশ্ন"},{"id":"B","text":"পাছৱৰ্ড + SMS ক\'ড"},{"id":"C","text":"পাছৱৰ্ড + বায়োমেট্ৰিক লকৰ সৈতে প্ৰমাণীকৰণকাৰী এপ"},{"id":"D","text":"দুটা বেলেগ বেলেগ পাছৱৰ্ড"}]',
 3, 1.4, 1.9, 0.23, 'as', 'en', true, 'approved'),

-- Digital Content Creation - Hard (2 questions)
('CAT_AS_DCC_HARD_001', 'digital_content_creation', 'basic',
 'আপুনি এটা পেছাদাৰী নথিপত্ৰ সৃষ্টি কৰিব লাগে যিটোত বিষয়সূচী অন্তৰ্ভুক্ত থাকে যি নতুন অধ্যায় যোগ কৰিলে স্বয়ংক্ৰিয়ভাৱে আপডেট হয়। আপুনি কোন সুবিধা ব্যৱহাৰ কৰা উচিত?',
 '[{"id":"A","text":"মেনুৱেল নম্বৰিং"},{"id":"B","text":"স্বয়ংক্ৰিয়-জেনেৰেটেড বিষয়সূচীৰ সৈতে শীৰ্ষক শৈলী"},{"id":"C","text":"বুলেট পইণ্ট"},{"id":"D","text":"টেক্সট বাকচ"}]',
 2, 1.0, 1.7, 0.22, 'as', 'en', true, 'approved'),

('CAT_AS_DCC_HARD_002', 'digital_content_creation', 'basic',
 'ৱেবছাইটৰ বাবে ছবি প্ৰস্তুত কৰোঁতে, গুণগত মান আৰু লোডিং গতিৰ সৰ্বোত্তম ভাৰসাম্য কোন পদ্ধতিয়ে দিয়ে?',
 '[{"id":"A","text":"সৰ্বাধিক গুণগত মানৰ BMP ফাইল ব্যৱহাৰ কৰক"},{"id":"B","text":"ছবিসমূহ উপযুক্ত ৰিজ\'লিউচনত সংকোচন কৰক আৰু WebP বা অপ্টিমাইজড JPEG ফৰ্মেট ব্যৱহাৰ কৰক"},{"id":"C","text":"সদায় GIF ফৰ্মেট ব্যৱহাৰ কৰক"},{"id":"D","text":"মূল কেমেৰা ফটো পোনপটীয়াকৈ আপলোড কৰক"}]',
 2, 1.3, 1.8, 0.23, 'as', 'en', true, 'approved'),

-- Digital Device Familiarity - Hard (2 questions)
('CAT_AS_DDF_HARD_001', 'digital_device_familiarity', 'basic',
 'এটা কম্পিউটাৰ লাহে লাহে চলি আছে। টাস্ক মেনেজাৰত কেৱল এটা ৱেব ব্ৰাউজাৰ (20 টেব) খোলা থকাৰ সৈতে 95% RAM ব্যৱহাৰ দেখুৱাইছে। আটাইতকৈ ফলপ্ৰসূ সমাধান কি?',
 '[{"id":"A","text":"কম্পিউটাৰটো বাৰে বাৰে ৰিষ্টাৰ্ট কৰক"},{"id":"B","text":"অপ্ৰয়োজনীয় টেব বন্ধ কৰক আৰু অধিক RAM যোগ কৰা বা টেব পৰিচালনা কৰিবলৈ ব্ৰাউজাৰ এক্সটেনচন ব্যৱহাৰ কৰাৰ কথা বিবেচনা কৰক"},{"id":"C","text":"চিষ্টেম ফাইল মচি পেলাওক"},{"id":"D","text":"মনিটৰৰ উজ্জ্বলতা বঢ়াওক"}]',
 2, 1.1, 1.8, 0.22, 'as', 'en', true, 'approved'),

('CAT_AS_DDF_HARD_002', 'digital_device_familiarity', 'basic',
 'SSD আৰু HDD ষ্ট\'ৰেজৰ মাজত কি পাৰ্থক্য আছে, আৰু আপুনি প্ৰতিটোৰ কেতিয়া পৰামৰ্শ দিব?',
 '[{"id":"A","text":"সিহঁত একেবাৰে একে"},{"id":"B","text":"SSD দ্ৰুত আৰু চলন্ত অংশ নাই (OS/এপৰ বাবে ভাল); HDD প্ৰতি GB সস্তা আৰু চলন্ত অংশ আছে (বাল্ক ষ্ট\'ৰেজৰ বাবে ভাল)"},{"id":"C","text":"HDD সদায় দ্ৰুত"},{"id":"D","text":"SSD কেৱল টেক্সট ফাইল ষ্ট\'ৰ কৰিব পাৰে"}]',
 2, 1.2, 1.7, 0.23, 'as', 'en', true, 'approved'),

-- Internet & Web Awareness - Hard (2 questions)
('CAT_AS_IWA_HARD_001', 'internet_web_awareness', 'basic',
 'আপুনি "support@amaz0n-security.com"ৰ পৰা এটা ইমেইল পায় যিয়ে আপোনাক এটা লিংকত ক্লিক কৰি আপোনাৰ একাউণ্ট পৰীক্ষা কৰিবলৈ কয়। ইমেইলটো Amazon ল\'গ\'ৰ সৈতে অফিচিয়েল দেখা যায়। আপুনি কি কৰা উচিত?',
 '[{"id":"A","text":"তৎক্ষণাত লিংকত ক্লিক কৰক"},{"id":"B","text":"ইয়াক সম্ভাব্য ফিছিং হিচাপে চিনাক্ত কৰক (amaz0nত শূন্য মন কৰক), ক্লিক নকৰিব, আৰু স্পেম হিচাপে ৰিপ\'ৰ্ট কৰক"},{"id":"C","text":"আপোনাৰ পাছৱৰ্ডেৰে উত্তৰ দিয়ক"},{"id":"D","text":"সকলো সম্পৰ্কলৈ ফৰৱাৰ্ড কৰক"}]',
 2, 0.9, 1.6, 0.22, 'as', 'en', true, 'approved'),

('CAT_AS_IWA_HARD_002', 'internet_web_awareness', 'basic',
 'যেতিয়া এটা ৱেবছাইটে ব্ৰাউজাৰত "আপোনাৰ সংযোগ ব্যক্তিগত নহয়" সতৰ্কবাণী দেখুৱায় তেতিয়া ইয়াৰ অৰ্থ কি?',
 '[{"id":"A","text":"ৱেবছাইটটো ৰক্ষণাবেক্ষণ ম\'ডত আছে"},{"id":"B","text":"SSL/TLS প্ৰমাণপত্ৰ অবৈধ, ম্যাদ উকলা, বা অনুপস্থিত, অৰ্থাৎ ডাটা এনক্ৰিপ্ট নহ\'ব পাৰে"},{"id":"C","text":"আপোনাৰ ইণ্টাৰনেট অতি লেহেমীয়া"},{"id":"D","text":"ৱেবছাইটত অত্যধিক দৰ্শক আছে"}]',
 2, 1.0, 1.7, 0.23, 'as', 'en', true, 'approved'),

-- Problem Solving Aptitude - Hard (2 questions)
('CAT_AS_PSA_HARD_001', 'problem_solving_aptitude', 'basic',
 'আপোনাৰ লেপটপ প্লাগ ইন থকা অৱস্থাত হঠাতে বন্ধ হৈ যায় আৰু অন নহয়। আপুনি এটা বেলেগ পাৱাৰ আউটলেট চেষ্টা কৰে আৰু লেপটপ এতিয়াও আৰম্ভ নহয়। আটাইতকৈ যুক্তিসংগত পৰৱৰ্তী ডায়েগন\'ষ্টিক পদক্ষেপ কি?',
 '[{"id":"A","text":"তৎক্ষণাত নতুন লেপটপ কিনক"},{"id":"B","text":"চাৰ্জিং সূচক জ্বলে নে নাই পৰীক্ষা কৰক; যদি নহয়, এডাপ্টাৰ বেয়া হ\'ব পাৰে; যদি হয়, 30 ছেকেণ্ডৰ বাবে পাৱাৰ বুটাম ধৰি ৰাখক (হাৰ্ড ৰিছেট)"},{"id":"C","text":"লেপটপ পেলাই দিয়ক"},{"id":"D","text":"এবছৰ অপেক্ষা কৰক আৰু পুনৰ চেষ্টা কৰক"}]',
 2, 1.3, 1.9, 0.22, 'as', 'en', true, 'approved'),

('CAT_AS_PSA_HARD_002', 'problem_solving_aptitude', 'basic',
 'এজন ব্যৱহাৰকাৰীয়ে অভিযোগ কৰে যে তেওঁলোকৰ Wi-Fi কেৱল তেওঁলোকৰ লেপটপত লেহেমীয়া, কিন্তু আন ডিভাইচসমূহ ঠিকে কাম কৰে। আপুনি কি সমস্যা সমাধান পদক্ষেপৰ পৰামৰ্শ দিব?',
 '[{"id":"A","text":"তৎক্ষণাত ৰাউটাৰ সলনি কৰক"},{"id":"B","text":"লেপটপৰ Wi-Fi ড্ৰাইভাৰ পৰীক্ষা কৰক, নেটৱৰ্ক ট্ৰাবলশ্বুটাৰ চলাওক, হস্তক্ষেপৰ বাবে পৰীক্ষা কৰক, নেটৱৰ্ক পাহৰি পুনৰ সংযোগ কৰি চাওক"},{"id":"C","text":"নতুন ইণ্টাৰনেট প্লেন কিনক"},{"id":"D","text":"সমস্যাটো আওকাণ কৰক"}]',
 2, 1.1, 1.8, 0.23, 'as', 'en', true, 'approved'),

-- ============================================
-- ASSAMESE VERY HARD QUESTIONS (10 questions, difficulty 1.5-2.5)
-- ============================================

-- Contextual Application - Very Hard (2 questions)
('CAT_AS_CA_VHARD_001', 'contextual_application', 'basic',
 'এটা সংস্থায় সমালোচনামূলক ব্যৱসায়িক ডাটাৰ বাবে বেকআপ কৌশল ৰূপায়ণ কৰিব লাগে। 3-2-1 বেকআপ নিয়ম অনুসৰি, সঠিক ৰূপায়ণ কি?',
 '[{"id":"A","text":"একেটা কম্পিউটাৰত 3 কপি"},{"id":"B","text":"মুঠ 3 কপি, 2 বেলেগ মিডিয়া প্ৰকাৰত, 1 কপি অফছাইট বা ক্লাউডত সংৰক্ষিত"},{"id":"C","text":"3 USB ড্ৰাইভত 1 কপি"},{"id":"D","text":"একেটা ভৱনত 2 কপি"}]',
 2, 1.8, 2.0, 0.25, 'as', 'en', true, 'approved'),

('CAT_AS_CA_VHARD_002', 'contextual_application', 'basic',
 'শ্বেয়াৰড নথিপত্ৰ ব্যৱস্থাৰ বাবে ভূমিকা-ভিত্তিক অভিগম নিয়ন্ত্ৰণ (RBAC) ৰূপায়ণ কৰোঁতে, অনুমতি নিৰ্ধাৰণক কোন নীতিয়ে পথ প্ৰদৰ্শন কৰা উচিত?',
 '[{"id":"A","text":"সুবিধাৰ বাবে সকলোকে সম্পূৰ্ণ অভিগম দিয়ক"},{"id":"B","text":"নূন্যতম বিশেষাধিকাৰ নীতি - ব্যৱহাৰকাৰীসকলে তেওঁলোকৰ ভূমিকাৰ বাবে প্ৰয়োজনীয় নূন্যতম অভিগম পায়"},{"id":"C","text":"কেৱল মেনেজাৰসকলৰহে কোনো অভিগম থাকিব লাগে"},{"id":"D","text":"অনুমতিসমূহ গুৰুত্বপূৰ্ণ নহয়"}]',
 2, 2.0, 2.1, 0.25, 'as', 'en', true, 'approved'),

-- Digital Content Creation - Very Hard (2 questions)
('CAT_AS_DCC_VHARD_001', 'digital_content_creation', 'basic',
 'দৃষ্টি প্ৰতিবন্ধী ব্যৱহাৰকাৰীসকলৰ বাবে সুলভ ডিজিটেল বিষয়বস্তু সৃষ্টি কৰোঁতে, কোন কৌশলৰ সংযোগ আটাইতকৈ ব্যাপক?',
 '[{"id":"A","text":"টেক্সট অবিহনে কেৱল ছবি ব্যৱহাৰ কৰক"},{"id":"B","text":"ছবিৰ বাবে অল্ট টেক্সট প্ৰদান কৰক, চেমান্টিক শীৰ্ষক ব্যৱহাৰ কৰক, 4.5:1ৰ ৰং কন্ট্ৰাষ্ট অনুপাত নিশ্চিত কৰক, আৰু স্ক্ৰীন ৰিডাৰ সমৰ্থন কৰক"},{"id":"C","text":"অধিক বিষয়বস্তু ফিট কৰিবলৈ টেক্সট অতি সৰু কৰক"},{"id":"D","text":"কেৱল ৰঙা আৰু সেউজীয়া ৰং ব্যৱহাৰ কৰক"}]',
 2, 1.9, 2.0, 0.25, 'as', 'en', true, 'approved'),

('CAT_AS_DCC_VHARD_002', 'digital_content_creation', 'basic',
 'আপুনি এটা ফৰ্ম সৃষ্টি কৰিব লাগে যিয়ে ৰিয়েল-টাইমত ইমেইল ঠিকনা বৈধ কৰে। কোন ৰেগুলাৰ এক্সপ্ৰেছন পেটাৰ্ণে বৈধ ইমেইল ফৰ্মেট সঠিকভাৱে চিনাক্ত কৰে?',
 '[{"id":"A","text":"@ চিহ্ন থকা যিকোনো টেক্সট বৈধ"},{"id":"B","text":"@ৰ আগত আখৰ, বৈধ ড\'মেইন নাম, আৰু বৈধ TLD পৰীক্ষা কৰা পেটাৰ্ণ (যেনে, user@domain.com)"},{"id":"C","text":"কেৱল সংখ্যা অনুমোদিত"},{"id":"D","text":"ইমেইল বৈধকৰণ সম্ভৱ নহয়"}]',
 2, 2.2, 2.1, 0.27, 'as', 'en', true, 'approved'),

-- Digital Device Familiarity - Very Hard (2 questions)
('CAT_AS_DDF_VHARD_001', 'digital_device_familiarity', 'basic',
 'এটা কম্পিউটাৰে BSOD (ব্লু স্ক্ৰীন অফ ডেথ) দেখুৱায় যিটোত ত্ৰুটি "KERNEL_DATA_INPAGE_ERROR" আছে। আটাইতকৈ সম্ভাব্য কাৰণ আৰু প্ৰথম ডায়েগন\'ষ্টিক পদক্ষেপ কি?',
 '[{"id":"A","text":"কিব\'ৰ্ড ভাঙি গৈছে"},{"id":"B","text":"সম্ভাব্য ডিস্ক বা মেম\'ৰি সমস্যা - বিফল হাৰ্ডৱেৰ চিনাক্ত কৰিবলৈ ডিস্ক চেক (chkdsk) আৰু মেম\'ৰি ডায়েগন\'ষ্টিক (mdsched) চলাওক"},{"id":"C","text":"মনিটৰ সলনি কৰিব লাগে"},{"id":"D","text":"সকলো প্ৰ\'গ্ৰাম তৎক্ষণাত পুনৰ ইনষ্টল কৰক"}]',
 2, 2.1, 2.2, 0.26, 'as', 'en', true, 'approved'),

('CAT_AS_DDF_VHARD_002', 'digital_device_familiarity', 'basic',
 'লিগেচি BIOSৰ তুলনাত UEFIৰ উদ্দেশ্য কি, আৰু UEFIয়ে কোন সুৰক্ষা সুবিধা সক্ষম কৰে?',
 '[{"id":"A","text":"সিহঁত একে ব্যৱস্থা"},{"id":"B","text":"UEFIয়ে বৃহৎ ড্ৰাইভ, দ্ৰুত বুট, আৰু Secure Boot সমৰ্থন কৰে যিয়ে অনুমোদিত নোহোৱা বুটল\'ডাৰ/মেলৱেৰ ল\'ড হোৱাত বাধা দিয়ে"},{"id":"C","text":"BIOS, UEFIতকৈ নতুন"},{"id":"D","text":"UEFI কেৱল Apple কম্পিউটাৰৰ সৈতে কাম কৰে"}]',
 2, 2.3, 2.1, 0.27, 'as', 'en', true, 'approved'),

-- Internet & Web Awareness - Very Hard (2 questions)
('CAT_AS_IWA_VHARD_001', 'internet_web_awareness', 'basic',
 'ছিমেট্ৰিক আৰু এছিমেট্ৰিক এনক্ৰিপচনৰ মাজত কি পাৰ্থক্য আছে, আৰু HTTPS সংযোগত প্ৰতিটো কেতিয়া ব্যৱহাৰ কৰা হয়?',
 '[{"id":"A","text":"সিহঁত একেই বস্তু"},{"id":"B","text":"এছিমেট্ৰিক (পাব্লিক/প্ৰাইভেট কি) প্ৰাৰম্ভিক হেণ্ডশ্বেকৰ বাবে ব্যৱহাৰ কৰা হয়; ছিমেট্ৰিক (শ্বেয়াৰড চিক্ৰেট) দ্ৰুত বাল্ক ডাটা ট্ৰান্সফাৰৰ বাবে"},{"id":"C","text":"ছিমেট্ৰিক অধিক সুৰক্ষিত"},{"id":"D","text":"HTTPS এনক্ৰিপচন ব্যৱহাৰ নকৰে"}]',
 2, 2.4, 2.2, 0.28, 'as', 'en', true, 'approved'),

('CAT_AS_IWA_VHARD_002', 'internet_web_awareness', 'basic',
 'এটা ৱেবছাইটে ট্ৰেকিঙৰ বাবে কুকীজ ব্যৱহাৰ কৰে। গোপনীয়তাৰ ক্ষেত্ৰত প্ৰথম-পক্ষ আৰু তৃতীয়-পক্ষ কুকীজৰ মাজত মূল পাৰ্থক্য কি?',
 '[{"id":"A","text":"সকলো কুকীজ একে"},{"id":"B","text":"প্ৰথম-পক্ষ আপুনি ভিজিট কৰা ছাইটে ছেট কৰে (কাৰ্যক্ষমতাৰ বাবে); তৃতীয়-পক্ষ বাহিৰৰ ড\'মেইনে ছেট কৰে (প্ৰায়ে ক্ৰছ-ছাইট ট্ৰেকিং/বিজ্ঞাপনৰ বাবে)"},{"id":"C","text":"তৃতীয়-পক্ষ কুকীজ অধিক সুৰক্ষিত"},{"id":"D","text":"কুকীজে ব্যৱহাৰকাৰী ট্ৰেক কৰিব নোৱাৰে"}]',
 2, 1.7, 1.9, 0.25, 'as', 'en', true, 'approved'),

-- Problem Solving Aptitude - Very Hard (2 questions)
('CAT_AS_PSA_VHARD_001', 'problem_solving_aptitude', 'basic',
 'এটা ডাটাবেছ কুৱেৰী যিয়ে সাধাৰণতে 2 ছেকেণ্ড লয় এতিয়া 45 ছেকেণ্ড লৈছে। ডাটা ভলিউমত উল্লেখযোগ্য পৰিবৰ্তন হোৱা নাই। ইয়াক নিদান কৰিবলৈ আপুনি কোন পদ্ধতিগত পদ্ধতি ব্যৱহাৰ কৰিব?',
 '[{"id":"A","text":"ডাটাবেছ মচি পেলাওক"},{"id":"B","text":"টেবুল স্কেনৰ বাবে কুৱেৰী এক্সিকিউচন প্লেন পৰীক্ষা কৰক, ইনডেক্স ফ্ৰেগমেণ্টেড নহয় বুলি পৰীক্ষা কৰক, ব্লকিং কুৱেৰী পৰীক্ষা কৰক, আৰু শেহতীয়া স্কিমা পৰিবৰ্তন পৰ্যালোচনা কৰক"},{"id":"C","text":"দ্ৰুত ইণ্টাৰনেট কিনক"},{"id":"D","text":"প্ৰতিটো কুৱেৰীৰ বাবে দীঘলীয়া অপেক্ষা কৰক"}]',
 2, 2.5, 2.2, 0.28, 'as', 'en', true, 'approved'),

('CAT_AS_PSA_VHARD_002', 'problem_solving_aptitude', 'basic',
 'এজন ব্যৱহাৰকাৰীয়ে ৰিপ\'ৰ্ট কৰে যে এটা ৱেব এপ্লিকেচন Chromeত কাম কৰে কিন্তু Safariত JavaScript ত্ৰুটিৰ সৈতে বিফল হয়। আটাইতকৈ পদ্ধতিগত ডিবাগিং পদ্ধতি কি?',
 '[{"id":"A","text":"ব্যৱহাৰকাৰীক কেৱল Chrome ব্যৱহাৰ কৰিবলৈ কওক"},{"id":"B","text":"ত্ৰুটিৰ বাবে ব্ৰাউজাৰ কনছ\'ল পৰীক্ষা কৰক, JavaScript সামঞ্জস্যতা (ES6+ সুবিধা) পৰীক্ষা কৰক, পলিফিলেৰে পৰীক্ষা কৰক, আৰু Safari-নিৰ্দিষ্ট বাগ পৰীক্ষা কৰক"},{"id":"C","text":"এপ্লিকেচন ভাঙি গৈছে"},{"id":"D","text":"Safariয়ে ৱেবছাইট সমৰ্থন নকৰে"}]',
 2, 2.0, 2.0, 0.26, 'as', 'en', true, 'approved');

-- ============================================
-- SUMMARY
-- ============================================
-- Added: 60 new questions (20 per language)
-- - 10 Hard questions per language (difficulty 0.8-1.5)
-- - 10 Very Hard questions per language (difficulty 1.5-2.5)
--
-- New totals per language: 100 questions
-- New difficulty distribution:
--   Very Easy (<-1.5): ~10 items
--   Easy (-1.5 to -0.5): ~35 items
--   Medium (-0.5 to 0.5): ~25 items
--   Hard (0.5 to 1.5): ~20 items
--   Very Hard (>1.5): ~10 items
--
-- Pool ratio: 100/30 = 3.33x (exceeds 3x minimum)
