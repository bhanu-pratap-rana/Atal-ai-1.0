
-- Add Hindi and Assamese translations for M5 topics: T16.2, T16.3, T17.1, T17.2, T17.3

-- T16.2 Safe Digital Documents (Hindi)
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T16.2', 'M5', 'hi', 'easy', 
 'Online form भरने से पहले:',
 '["तुरंत भरना शुरू करें", "सभी जरूरी documents तैयार रखें", "Browser बंद करें", "Photos delete करें"]',
 1, 'शुरू करने से पहले documents (Aadhaar, photos, bank details) तैयार रखें। बीच में खोजने से session timeout हो सकता है।'),

('T16.2', 'M5', 'hi', 'easy', 
 'Online application submit करने के बाद:',
 '["भूल जाएं", "Acknowledgment/reference number save या print करें", "Browser history delete करें", "फिर से submit करें"]',
 1, 'Application/reference number हमेशा save करें। Status track करने और queries के लिए जरूरी है।'),

('T16.2', 'M5', 'hi', 'easy', 
 'Forms में * से marked fields हैं:',
 '["Optional", "Mandatory/Required", "Decoration के लिए", "Ignore करने के लिए"]',
 1, 'Asterisk (*) required fields mark करता है। इन fields को भरे बिना form submit नहीं कर सकते।'),

-- T16.2 Safe Digital Documents (Assamese)
('T16.2', 'M5', 'as', 'easy', 
 'Online form পূৰণ কৰাৰ আগতে:',
 '["তৎক্ষণাত পূৰণ আৰম্ভ কৰক", "সকলো প্ৰয়োজনীয় documents সাজু ৰাখক", "Browser বন্ধ কৰক", "Photos delete কৰক"]',
 1, 'আৰম্ভ কৰাৰ আগতে documents (Aadhaar, photos, bank details) সাজু ৰাখক। মাজতে বিচাৰিলে session timeout হ''ব পাৰে।'),

('T16.2', 'M5', 'as', 'easy', 
 'Online application submit কৰাৰ পিছত:',
 '["পাহৰি যাওক", "Acknowledgment/reference number save বা print কৰক", "Browser history delete কৰক", "আকৌ submit কৰক"]',
 1, 'Application/reference number সদায় save কৰক। Status track কৰিবলৈ আৰু queries ৰ বাবে লাগে।'),

('T16.2', 'M5', 'as', 'easy', 
 'Forms ত * ৰে marked fields হ''ল:',
 '["Optional", "Mandatory/Required", "Decoration ৰ বাবে", "Ignore কৰিবলৈ"]',
 1, 'Asterisk (*) এ required fields mark কৰে। এই fields পূৰণ নকৰাকৈ form submit কৰিব নোৱাৰি।'),

-- T16.3 Forms on Shared Computers (Hindi) - Questions not in English, skip

-- T17.1 UPI Basics (Hindi)
('T17.1', 'M5', 'hi', 'easy', 
 'Digital payments मदद करते हैं क्योंकि:',
 '["हमेशा cash लेकर चलना पड़ता है", "Transactions instant, trackable, और convenient हैं", "Bank जाना पड़ता है", "केवल cities में काम करते हैं"]',
 1, 'Digital payments instant हैं, automatic records बनाते हैं, 24/7 काम करते हैं, और cash ले जाने की जरूरत नहीं।'),

('T17.1', 'M5', 'hi', 'easy', 
 'UPI का full form है:',
 '["Unified Payment Interface", "Universal Payment Integration", "Unified Personal Identity", "User Payment Information"]',
 0, 'UPI - Unified Payments Interface - mobile phones से instant bank-to-bank transfers की सुविधा देता है।'),

('T17.1', 'M5', 'hi', 'medium', 
 'कौन सा payment method बिना internet के काम करता है?',
 '["Google Pay", "PhonePe", "USSD Banking (*99#)", "Net Banking"]',
 2, 'USSD Banking (*99#) basic phones पर बिना internet के काम करता है। Registered mobile number से *99# dial करें।'),

-- T17.1 UPI Basics (Assamese)
('T17.1', 'M5', 'as', 'easy', 
 'Digital payments সহায় কৰে কাৰণ:',
 '["সদায় cash লৈ ফুৰিব লাগে", "Transactions instant, trackable, আৰু convenient", "Bank যাব লাগে", "কেৱল cities ত কাম কৰে"]',
 1, 'Digital payments instant, automatic records বনায়, 24/7 কাম কৰে, আৰু cash লৈ ফুৰাৰ প্ৰয়োজন নাই।'),

('T17.1', 'M5', 'as', 'easy', 
 'UPI ৰ full form হ''ল:',
 '["Unified Payment Interface", "Universal Payment Integration", "Unified Personal Identity", "User Payment Information"]',
 0, 'UPI - Unified Payments Interface - mobile phones ৰ পৰা instant bank-to-bank transfers ৰ সুবিধা দিয়ে।'),

('T17.1', 'M5', 'as', 'medium', 
 'কোন payment method internet অবিহনে কাম কৰে?',
 '["Google Pay", "PhonePe", "USSD Banking (*99#)", "Net Banking"]',
 2, 'USSD Banking (*99#) basic phones ত internet অবিহনে কাম কৰে। Registered mobile number ৰ পৰা *99# dial কৰক।'),

-- T17.2 Payment Scams (Hindi)
('T17.2', 'M5', 'hi', 'easy', 
 'UPI PIN होना चाहिए:',
 '["Shopkeepers के साथ share करें", "Secret रखें और कभी share न करें", "Phone पर लिखें", "ATM PIN जैसा ही"]',
 1, 'कभी भी UPI PIN किसी को share न करें। Bank employees या shopkeepers को भी नहीं। केवल अपने phone पर enter करें।'),

('T17.2', 'M5', 'hi', 'easy', 
 'QR code से pay करने के लिए:',
 '["Code manually type करें", "UPI app से code scan करें", "Camera app से photo लें", "QR पर लिखे number पर SMS भेजें"]',
 1, 'UPI app खोलें, Scan QR select करें, QR code पर camera point करें, details verify करें, amount और PIN enter करें।'),

('T17.2', 'M5', 'hi', 'medium', 
 'अगर UPI payment fail हो लेकिन पैसे कट जाएं:',
 '["घबराएं और police को call करें", "पैसे आमतौर पर 24-48 घंटे में automatically वापस आ जाते हैं", "Payment successfully हो गया", "नया bank account बनाएं"]',
 1, 'Failed transactions आमतौर पर 24-48 घंटे में auto-reverse हो जाते हैं। 5 दिन में न आए तो UTR number के साथ bank से संपर्क करें।'),

-- T17.2 Payment Scams (Assamese)
('T17.2', 'M5', 'as', 'easy', 
 'UPI PIN হোৱা উচিত:',
 '["Shopkeepers ৰ সৈতে share কৰক", "Secret ৰাখক আৰু কেতিয়াও share নকৰিব", "Phone ত লিখক", "ATM PIN ৰ দৰে একে"]',
 1, 'কেতিয়াও UPI PIN কাকো share নকৰিব। Bank employees বা shopkeepers কো নহয়। কেৱল নিজৰ phone ত enter কৰক।'),

('T17.2', 'M5', 'as', 'easy', 
 'QR code ৰে pay কৰিবলৈ:',
 '["Code manually type কৰক", "UPI app ৰে code scan কৰক", "Camera app ৰে photo লওক", "QR ত লিখা number লৈ SMS পঠাওক"]',
 1, 'UPI app খোলক, Scan QR বাছক, QR code ত camera point কৰক, details verify কৰক, amount আৰু PIN enter কৰক।'),

('T17.2', 'M5', 'as', 'medium', 
 'যদি UPI payment fail হয় কিন্তু টকা কাটি যায়:',
 '["ভয় খাওক আৰু police ক call কৰক", "টকা সাধাৰণতে 24-48 ঘণ্টাত automatically ঘূৰি আহে", "Payment successfully হ''ল", "নতুন bank account বনাওক"]',
 1, 'Failed transactions সাধাৰণতে 24-48 ঘণ্টাত auto-reverse হয়। 5 দিনত নাহিলে UTR number ৰ সৈতে bank ৰ সৈতে যোগাযোগ কৰক।'),

-- T17.3 Family/Shop Records (Hindi) - Questions not in English, skip for now
-- T18.1 Low-Data Product Photos (Hindi)
('T18.1', 'M5', 'hi', 'easy', 
 'Amazon Karigar किसके लिए है:',
 '["Electronics खरीदने के लिए", "कारीगरों द्वारा हस्तशिल्प बेचने के लिए", "Travel booking के लिए", "Food order करने के लिए"]',
 1, 'Amazon Karigar विशेष रूप से कारीगरों और बुनकरों के लिए है authentic हस्तनिर्मित products बेचने के लिए।'),

('T18.1', 'M5', 'hi', 'easy', 
 'अच्छी product photos में होना चाहिए:',
 '["Dark lighting और blurry image", "Clear lighting, multiple angles, clean background", "दूर से केवल एक photo", "Heavy filters और editing"]',
 1, 'अच्छी photos में natural lighting, multiple angles, clean background के साथ actual product clearly दिखना चाहिए।'),

('T18.1', 'M5', 'hi', 'medium', 
 'Product की pricing करते समय consider करना चाहिए:',
 '["केवल material cost", "Material, labor, shipping, और similar product prices", "बस कोई भी price guess करें", "हमेशा सबसे कम price"]',
 1, 'Material cost calculate करें, fair labor value जोड़ें, shipping estimate करें, और fair pricing के लिए competitor prices check करें।'),

-- T18.1 Low-Data Product Photos (Assamese)
('T18.1', 'M5', 'as', 'easy', 
 'Amazon Karigar কাৰ বাবে:',
 '["Electronics কিনিবলৈ", "শিল্পীসকলে হস্তশিল্প বিক্ৰী কৰিবলৈ", "Travel booking ৰ বাবে", "Food order কৰিবলৈ"]',
 1, 'Amazon Karigar বিশেষভাৱে শিল্পী আৰু বোৱনীসকলৰ বাবে authentic হস্তনিৰ্মিত products বিক্ৰী কৰিবলৈ।'),

('T18.1', 'M5', 'as', 'easy', 
 'ভাল product photos ত থাকিব লাগে:',
 '["Dark lighting আৰু blurry image", "Clear lighting, multiple angles, clean background", "দূৰৰ পৰা কেৱল এখন photo", "Heavy filters আৰু editing"]',
 1, 'ভাল photos ত natural lighting, multiple angles, clean background ৰ সৈতে actual product স্পষ্টকৈ দেখা যাব লাগে।'),

('T18.1', 'M5', 'as', 'medium', 
 'Product ৰ pricing কৰোঁতে বিবেচনা কৰা উচিত:',
 '["কেৱল material cost", "Material, labor, shipping, আৰু similar product prices", "যিকোনো price guess কৰক", "সদায় সৰ্বনিম্ন price"]',
 1, 'Material cost হিচাপ কৰক, fair labor value যোগ কৰক, shipping estimate কৰক, আৰু fair pricing ৰ বাবে competitor prices check কৰক।');
;
