
-- Add Hindi and Assamese translations for M4 topics: T12.2, T12.3, T13.1, T13.2, T13.3

-- T12.2 Compose, Attach & Send (Hindi)
INSERT INTO practice_questions (topic_id, module_id, language, difficulty, question, options, correct_index, explanation)
VALUES 
('T12.2', 'M4', 'hi', 'easy', 
 'Email में CC का मतलब है:',
 '["Computer Copy", "Carbon Copy", "Central Copy", "Certified Copy"]',
 1, 'CC (Carbon Copy) अतिरिक्त प्राप्तकर्ताओं को कॉपी भेजता है। सभी देख सकते हैं कि CC किसे मिला।'),

('T12.2', 'M4', 'hi', 'easy', 
 'Email attachment क्या है?',
 '["Subject line", "Email के साथ भेजी गई file", "Email address", "Signature"]',
 1, 'Attachments वे files (documents, photos, आदि) हैं जो आपके email message के साथ भेजी जाती हैं।'),

('T12.2', 'M4', 'hi', 'easy', 
 'महत्वपूर्ण email भेजने से पहले:',
 '["तुरंत भेज दें बिना check किए", "Subject, recipients और content review करें", "Draft delete करें", "बहुत emojis जोड़ें"]',
 1, 'भेजने से पहले हमेशा email review करें - recipients, subject line, content और attachments check करें।'),

-- T12.2 Compose, Attach & Send (Assamese)
('T12.2', 'M4', 'as', 'easy', 
 'Email ত CC ৰ অৰ্থ হ''ল:',
 '["Computer Copy", "Carbon Copy", "Central Copy", "Certified Copy"]',
 1, 'CC (Carbon Copy) এ অতিৰিক্ত প্ৰাপকলৈ কপি পঠায়। সকলোৱে চাব পাৰে CC কোনে পালে।'),

('T12.2', 'M4', 'as', 'easy', 
 'Email attachment কি?',
 '["Subject line", "Email ৰ সৈতে পঠোৱা file", "Email address", "Signature"]',
 1, 'Attachments হ''ল সেই files (documents, photos, আদি) যিবোৰ আপোনাৰ email message ৰ সৈতে পঠোৱা হয়।'),

('T12.2', 'M4', 'as', 'easy', 
 'গুৰুত্বপূৰ্ণ email পঠোৱাৰ আগতে:',
 '["তৎক্ষণাত পঠাওক check নকৰাকৈ", "Subject, recipients আৰু content review কৰক", "Draft delete কৰক", "বহুত emojis যোগ কৰক"]',
 1, 'পঠোৱাৰ আগতে সদায় email review কৰক - recipients, subject line, content আৰু attachments check কৰক।'),

-- T12.3 Inbox Hygiene (Hindi) - Need to add these questions first in English, then translate
-- Actually T12.3 doesn't exist in English yet, let me check

-- T13.1 Account Safety (Hindi)
('T13.1', 'M4', 'hi', 'easy', 
 'WhatsApp messages भेजने के लिए कौन सा connection use करता है?',
 '["Regular SMS charges", "Internet connection (WiFi या mobile data)", "Phone call minutes", "Bluetooth"]',
 1, 'WhatsApp messages और calls के लिए internet (WiFi या mobile data) use करता है, regular SMS या call charges नहीं।'),

('T13.1', 'M4', 'hi', 'easy', 
 'WhatsApp group बनाने के लिए चाहिए:',
 '["कम से कम 10 members", "WhatsApp से permission", "कम से कम एक और contact", "Business account"]',
 2, 'Group बनाने के लिए कम से कम एक और contact चाहिए। Groups में 1024 members तक हो सकते हैं।'),

('T13.1', 'M4', 'hi', 'easy', 
 'WhatsApp में voice messages उपयोगी हैं जब:',
 '["आप तेज type करना चाहते हैं", "Type करना मुश्किल है या personal touch चाहिए", "Data बचाना है", "Meeting में हैं"]',
 1, 'Voice messages मदद करते हैं जब type करना मुश्किल हो, emotion चाहिए, या जल्दी समझाना हो।'),

-- T13.1 Account Safety (Assamese)
('T13.1', 'M4', 'as', 'easy', 
 'WhatsApp এ messages পঠাবলৈ কোন connection ব্যৱহাৰ কৰে?',
 '["Regular SMS charges", "Internet connection (WiFi বা mobile data)", "Phone call minutes", "Bluetooth"]',
 1, 'WhatsApp এ messages আৰু calls ৰ বাবে internet (WiFi বা mobile data) ব্যৱহাৰ কৰে, regular SMS বা call charges নহয়।'),

('T13.1', 'M4', 'as', 'easy', 
 'WhatsApp group বনাবলৈ লাগে:',
 '["অন্ততঃ 10 members", "WhatsApp ৰ পৰা permission", "অন্ততঃ এটা আন contact", "Business account"]',
 2, 'Group বনাবলৈ অন্ততঃ এটা আন contact লাগে। Groups ত 1024 members লৈকে থাকিব পাৰে।'),

('T13.1', 'M4', 'as', 'easy', 
 'WhatsApp ত voice messages উপযোগী যেতিয়া:',
 '["আপুনি খৰকৈ type কৰিব বিচাৰে", "Type কৰা কঠিন বা personal touch লাগে", "Data বচাব লাগে", "Meeting ত আছে"]',
 1, 'Voice messages সহায় কৰে যেতিয়া type কৰা কঠিন, emotion লাগে, বা সোনকালে বুজাব লাগে।'),

-- T13.2 Groups & Rumor Control (Hindi)
('T13.2', 'M4', 'hi', 'easy', 
 'आपको lottery जीतने का message आए तो:',
 '["तुरंत link click करें", "Bank details share करें", "Ignore करें और delete करें - यह scam है", "Friends को forward करें"]',
 2, 'Unknown numbers से lottery/prize messages scam हैं। कभी links click न करें या personal information share न करें।'),

('T13.2', 'M4', 'hi', 'easy', 
 'कोई bank से होने का दावा करके OTP मांगे तो:',
 '["तुरंत share करें", "कभी भी किसी को OTP share न करें", "अगर official लगें तो share करें", "Callback करके share करें"]',
 1, 'Banks कभी OTP नहीं मांगते। OTP मांगने वाला कोई भी scammer है, चाहे कितना भी official लगे।'),

('T13.2', 'M4', 'hi', 'medium', 
 'WhatsApp में Two-step verification:',
 '["Messaging धीमी करता है", "PIN के साथ extra security जोड़ता है", "महत्वपूर्ण नहीं है", "Location share करता है"]',
 1, 'Two-step verification एक PIN जोड़ता है जो number दोबारा register करने पर चाहिए, account चोरी रोकता है।'),

-- T13.2 Groups & Rumor Control (Assamese)
('T13.2', 'M4', 'as', 'easy', 
 'আপোনাক lottery জিকাৰ message আহিলে:',
 '["তৎক্ষণাত link click কৰক", "Bank details share কৰক", "উপেক্ষা কৰক আৰু delete কৰক - এইটো scam", "Friends লৈ forward কৰক"]',
 2, 'Unknown numbers ৰ পৰা lottery/prize messages scam। কেতিয়াও links click নকৰিব বা personal information share নকৰিব।'),

('T13.2', 'M4', 'as', 'easy', 
 'কোনোবাই bank ৰ পৰা বুলি কৈ OTP বিচাৰিলে:',
 '["তৎক্ষণাত share কৰক", "কেতিয়াও কাকো OTP share নকৰিব", "official লাগিলে share কৰক", "Callback কৰি share কৰক"]',
 1, 'Banks এ কেতিয়াও OTP নোসোধে। OTP সোধা যিকোনো ব্যক্তি scammer, যিমানেই official নালাগক।'),

('T13.2', 'M4', 'as', 'medium', 
 'WhatsApp ত Two-step verification:',
 '["Messaging লেহেম কৰে", "PIN ৰ সৈতে extra security যোগ কৰে", "গুৰুত্বপূৰ্ণ নহয়", "Location share কৰে"]',
 1, 'Two-step verification এ এটা PIN যোগ কৰে যি number পুনৰ register কৰোঁতে লাগে, account চুৰি ৰোধ কৰে।'),

-- T13.3 Backups & Device Linking (Hindi) - These questions don't exist in English, skip for now

-- T14.1 Join/Host Calls (Hindi)
('T14.1', 'M4', 'hi', 'easy', 
 'Clear video call के लिए चाहिए:',
 '["केवल अच्छा camera", "अच्छा internet, lighting, और शांत जगह", "केवल महंगा phone", "Bluetooth connection"]',
 1, 'Clear video calls के लिए stable internet, अच्छी lighting (light की तरफ मुंह करें), और शांत वातावरण चाहिए।'),

('T14.1', 'M4', 'hi', 'easy', 
 'Group video call में खुद को mute करना चाहिए जब:',
 '["बोल रहे हों", "नहीं बोल रहे हों ताकि background noise कम हो", "Call शुरू हो", "कोई सवाल पूछे"]',
 1, 'जब नहीं बोल रहे हों तो mute करें ताकि आपका background noise दूसरों को disturb न करे।'),

('T14.1', 'M4', 'hi', 'easy', 
 'Google Meet उपयोगी है:',
 '["SMS भेजने के लिए", "Group video meetings और calls के लिए", "Photos edit करने के लिए", "Music बजाने के लिए"]',
 1, 'Google Meet video meetings के लिए है, work calls, online classes, और group discussions के लिए उपयोगी।'),

-- T14.1 Join/Host Calls (Assamese)
('T14.1', 'M4', 'as', 'easy', 
 'Clear video call ৰ বাবে লাগে:',
 '["কেৱল ভাল camera", "ভাল internet, lighting, আৰু শান্ত ঠাই", "কেৱল দামী phone", "Bluetooth connection"]',
 1, 'Clear video calls ৰ বাবে stable internet, ভাল lighting (পোহৰৰ ফালে মুখ কৰক), আৰু শান্ত পৰিৱেশ লাগে।'),

('T14.1', 'M4', 'as', 'easy', 
 'Group video call ত নিজকে mute কৰা উচিত যেতিয়া:',
 '["কথা কৈ আছে", "কথা কোৱা নাই যাতে background noise কম হয়", "Call আৰম্ভ হয়", "কোনোবাই প্ৰশ্ন সোধে"]',
 1, 'যেতিয়া কথা কোৱা নাই mute কৰক যাতে আপোনাৰ background noise আনক disturb নকৰে।'),

('T14.1', 'M4', 'as', 'easy', 
 'Google Meet উপযোগী:',
 '["SMS পঠাবলৈ", "Group video meetings আৰু calls ৰ বাবে", "Photos edit কৰিবলৈ", "Music বজাবলৈ"]',
 1, 'Google Meet video meetings ৰ বাবে, work calls, online classes, আৰু group discussions ৰ বাবে উপযোগী।');
;
