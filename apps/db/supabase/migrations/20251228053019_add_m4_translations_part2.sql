
-- Add Hindi and Assamese translations for M4 topics: T14.2, T15.1, T15.2

-- T14.2 Low-Data Calling (Hindi)
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T14.2', 'M4', 'hi', 'easy', 
 'Strong password में होना चाहिए:',
 '["केवल आपका नाम", "Letters, numbers, और symbols का mix", "केवल numbers", "आपकी birth date"]',
 1, 'Strong passwords में uppercase, lowercase, numbers, और symbols का mix होता है। जैसे: Muga@Silk2024!'),

('T14.2', 'M4', 'hi', 'easy', 
 'सभी accounts के लिए same password use करना चाहिए:',
 '["सही, याद रखना आसान है", "गलत, अलग-अलग passwords use करें", "केवल important accounts के लिए", "केवल email के लिए"]',
 1, 'गलत! अलग-अलग passwords use करें। अगर एक account hack हो, बाकी safe रहें।'),

('T14.2', 'M4', 'hi', 'medium', 
 'Phishing है:',
 '["एक प्रकार का game", "आपकी information चुराने के लिए fake messages", "एक video calling app", "एक file format"]',
 1, 'Phishing असली जैसी दिखने वाली fake emails/websites use करती है passwords और personal information चुराने के लिए।'),

-- T14.2 Low-Data Calling (Assamese)
('T14.2', 'M4', 'as', 'easy', 
 'Strong password ত থাকিব লাগে:',
 '["কেৱল আপোনাৰ নাম", "Letters, numbers, আৰু symbols ৰ mix", "কেৱল numbers", "আপোনাৰ birth date"]',
 1, 'Strong passwords ত uppercase, lowercase, numbers, আৰু symbols ৰ mix থাকে। যেনে: Muga@Silk2024!'),

('T14.2', 'M4', 'as', 'easy', 
 'সকলো accounts ৰ বাবে একে password ব্যৱহাৰ কৰা উচিত:',
 '["সঁচা, মনত ৰখা সহজ", "ভুল, বেলেগ বেলেগ passwords ব্যৱহাৰ কৰক", "কেৱল important accounts ৰ বাবে", "কেৱল email ৰ বাবে"]',
 1, 'ভুল! বেলেগ বেলেগ passwords ব্যৱহাৰ কৰক। এটা account hack হ''লে বাকীবোৰ safe থাকে।'),

('T14.2', 'M4', 'as', 'medium', 
 'Phishing হ''ল:',
 '["এক প্ৰকাৰৰ game", "আপোনাৰ information চুৰি কৰিবলৈ fake messages", "এটা video calling app", "এটা file format"]',
 1, 'Phishing এ আচল যেন দেখা fake emails/websites ব্যৱহাৰ কৰে passwords আৰু personal information চুৰি কৰিবলৈ।'),

-- T15.1 Respectful Messages (Hindi)
('T15.1', 'M4', 'hi', 'easy', 
 'Messages में ALL CAPS में type करने का मतलब है:',
 '["शांति से emphasis", "आप CHILLA रहे हैं", "Professional writing", "तेज typing"]',
 1, 'ALL CAPS को online चिल्लाना माना जाता है। Polite communication के लिए normal capitalization use करें।'),

('T15.1', 'M4', 'hi', 'easy', 
 'किसी को WhatsApp group में add करने से पहले:',
 '["बिना पूछे add करें", "पहले उनसे permission लें", "अपने सभी contacts add करें", "नया account बनाएं"]',
 1, 'Groups में add करने से पहले permission लें। अगर वे मना करें तो उनकी choice का सम्मान करें।'),

('T15.1', 'M4', 'hi', 'easy', 
 'Unverified information मिलने पर:',
 '["तुरंत सभी को forward करें", "Share करने से पहले verify करें", "अपनी राय जोड़कर forward करें", "Official लगे तो सच मान लें"]',
 1, 'Share करने से पहले हमेशा information verify करें। Multiple sources और fact-checking websites check करें।'),

-- T15.1 Respectful Messages (Assamese)
('T15.1', 'M4', 'as', 'easy', 
 'Messages ত ALL CAPS ত type কৰাৰ অৰ্থ:',
 '["শান্তভাৱে emphasis", "আপুনি চিঞৰি আছে", "Professional writing", "খৰ typing"]',
 1, 'ALL CAPS ক online ত চিঞৰা বুলি ধৰা হয়। Polite communication ৰ বাবে normal capitalization ব্যৱহাৰ কৰক।'),

('T15.1', 'M4', 'as', 'easy', 
 'কাৰোবাক WhatsApp group ত add কৰাৰ আগতে:',
 '["নোসোধাকৈ add কৰক", "প্ৰথমে তেওঁলোকৰ পৰা permission লওক", "আপোনাৰ সকলো contacts add কৰক", "নতুন account বনাওক"]',
 1, 'Groups ত add কৰাৰ আগতে permission লওক। যদি তেওঁলোকে মানা কৰে তেওঁলোকৰ choice ক সন্মান কৰক।'),

('T15.1', 'M4', 'as', 'easy', 
 'Unverified information পালে:',
 '["তৎক্ষণাত সকলোলৈ forward কৰক", "Share কৰাৰ আগতে verify কৰক", "নিজৰ মতামত যোগ কৰি forward কৰক", "Official লাগিলে সঁচা বুলি মানক"]',
 1, 'Share কৰাৰ আগতে সদায় information verify কৰক। Multiple sources আৰু fact-checking websites check কৰক।'),

-- T15.2 Consent & Digital Footprints (Hindi)
('T15.2', 'M4', 'hi', 'easy', 
 'Fake news का संकेत है:',
 '["यह multiple news sites पर है", "इसमें spelling errors और dramatic दावे हैं", "इसमें source है", "इसकी recent date है"]',
 1, 'Fake news में अक्सर errors, extreme emotional language, dramatic claims, और missing या fake sources होते हैं।'),

('T15.2', 'M4', 'hi', 'medium', 
 'Image verify करने के लिए use कर सकते हैं:',
 '["केवल अपनी आंखें", "Google Reverse Image Search", "WhatsApp", "Calculator app"]',
 1, 'Google Reverse Image Search दिखाता है image पहले कहां दिखी, यह बताता है कि यह पुरानी या manipulated है।'),

('T15.2', 'M4', 'hi', 'medium', 
 'अगर कोई news तुरंत बहुत गुस्सा या डर दिलाए तो:',
 '["दूसरों से पहले जल्दी share करें", "React करने से पहले verify करें", "Emotions का मतलब है important है, मान लें", "Safety के लिए family को forward करें"]',
 1, 'Fake news फैलने के लिए strong emotions use करती है। बहुत emotional feel हो तो रुकें और पहले verify करें।'),

-- T15.2 Consent & Digital Footprints (Assamese)
('T15.2', 'M4', 'as', 'easy', 
 'Fake news ৰ সংকেত হ''ল:',
 '["ই multiple news sites ত আছে", "ইয়াত spelling errors আৰু dramatic দাবী আছে", "ইয়াত source আছে", "ইয়াৰ recent date আছে"]',
 1, 'Fake news ত প্ৰায়ে errors, extreme emotional language, dramatic claims, আৰু missing বা fake sources থাকে।'),

('T15.2', 'M4', 'as', 'medium', 
 'Image verify কৰিবলৈ ব্যৱহাৰ কৰিব পাৰে:',
 '["কেৱল নিজৰ চকু", "Google Reverse Image Search", "WhatsApp", "Calculator app"]',
 1, 'Google Reverse Image Search এ দেখুৱায় image আগতে ক''ত দেখা গৈছিল, ই কয় যে এইটো পুৰণি বা manipulated।'),

('T15.2', 'M4', 'as', 'medium', 
 'যদি কোনো news এ তৎক্ষণাত বহুত খং বা ভয় দিয়ে তেন্তে:',
 '["আনতকৈ আগতে সোনকালে share কৰক", "React কৰাৰ আগতে verify কৰক", "Emotions ৰ অৰ্থ important, মানি লওক", "Safety ৰ বাবে family লৈ forward কৰক"]',
 1, 'Fake news বিয়পিবলৈ strong emotions ব্যৱহাৰ কৰে। বহুত emotional feel হ''লে ৰওক আৰু প্ৰথমে verify কৰক।');
;
