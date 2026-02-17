-- Seed Practice Questions for Module 5: Local Technology and Services (Topics T16.1-T19.2)
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index) VALUES
-- T16.1: Government Digital Services
('T16.1', 'M5', 'DigiLocker is used to:', '["Store physical documents", "Store and access digital versions of documents", "Delete government records", "Make video calls"]', 1, 'DigiLocker stores digital versions of your documents like Aadhaar, PAN, driving license for easy access anywhere.', 'easy', 1),
('T16.1', 'M5', 'UMANG app provides access to:', '["Only entertainment", "Multiple government services in one app", "Only banking", "Social media"]', 1, 'UMANG (Unified Mobile Application for New-age Governance) gives access to many government services in one app.', 'easy', 2),
('T16.1', 'M5', 'A benefit of e-Government services is:', '["You must visit office in person", "Apply from anywhere and track status online", "Services only available during office hours", "More paperwork required"]', 1, 'e-Government lets you apply online anytime, track status, and reduces the need for office visits.', 'easy', 3),

-- T16.2: Online Form Filling
('T16.2', 'M5', 'Before filling an online form, you should:', '["Start filling immediately", "Keep all required documents ready", "Close the browser", "Delete your photos"]', 1, 'Prepare documents (Aadhaar, photos, bank details) before starting. Sessions may timeout if you search for documents midway.', 'easy', 1),
('T16.2', 'M5', 'Fields marked with * in forms are:', '["Optional", "Mandatory/Required", "For decoration", "To be ignored"]', 1, 'Asterisk (*) marks required fields. You cannot submit the form without filling these fields.', 'easy', 2),
('T16.2', 'M5', 'After submitting an online application, you should:', '["Forget about it", "Save or print the acknowledgment/reference number", "Delete browser history", "Submit again"]', 1, 'Always save the application/reference number. You need it to track status and for any queries.', 'easy', 3),

-- T17.1: Digital Payments Introduction
('T17.1', 'M5', 'UPI stands for:', '["Unified Payment Interface", "Universal Payment Integration", "Unified Personal Identity", "User Payment Information"]', 0, 'UPI - Unified Payments Interface - allows instant bank-to-bank transfers through mobile phones.', 'easy', 1),
('T17.1', 'M5', 'Which payment method works without internet?', '["Google Pay", "PhonePe", "USSD Banking (*99#)", "Net Banking"]', 2, 'USSD Banking (*99#) works on basic phones without internet. Dial *99# from registered mobile number.', 'medium', 2),
('T17.1', 'M5', 'Digital payments help because:', '["You must always carry cash", "Transactions are instant, trackable, and convenient", "They require visiting bank", "They work only in cities"]', 1, 'Digital payments are instant, create automatic records, work 24/7, and eliminate need to carry cash.', 'easy', 3),

-- T17.2: UPI Payments
('T17.2', 'M5', 'UPI PIN should be:', '["Shared with shopkeepers", "Kept secret and never shared", "Written on your phone", "Same as your ATM PIN"]', 1, 'Never share UPI PIN with anyone. Not even bank employees or shopkeepers. Enter it only on your phone.', 'easy', 1),
('T17.2', 'M5', 'To pay using QR code:', '["Type the code manually", "Scan the code with UPI app", "Take photo with camera app", "Send SMS to the number on QR"]', 1, 'Open UPI app, select Scan QR, point camera at QR code, verify details, enter amount and PIN.', 'easy', 2),
('T17.2', 'M5', 'If UPI payment fails but money is deducted:', '["Panic and call police", "Money usually returns in 24-48 hours automatically", "Payment went through successfully", "Create new bank account"]', 1, 'Failed transactions usually auto-reverse within 24-48 hours. If not returned in 5 days, contact bank with UTR number.', 'medium', 3),

-- T18.1: Online Selling Basics
('T18.1', 'M5', 'Good product photos should have:', '["Dark lighting and blurry image", "Clear lighting, multiple angles, clean background", "Only one photo from far away", "Heavy filters and editing"]', 1, 'Good photos need natural lighting, multiple angles, show actual product clearly with clean background.', 'easy', 1),
('T18.1', 'M5', 'Amazon Karigar is for:', '["Buying electronics", "Selling handmade crafts by artisans", "Booking travel", "Ordering food"]', 1, 'Amazon Karigar is specially for artisans and weavers to sell authentic handmade products.', 'easy', 2),
('T18.1', 'M5', 'When pricing your product, you should consider:', '["Only material cost", "Material, labor, shipping, and similar product prices", "Just guess any price", "Always price lowest"]', 1, 'Calculate material cost, add fair labor value, estimate shipping, and check competitor prices for fair pricing.', 'medium', 3),

-- T18.2: WhatsApp Business
('T18.2', 'M5', 'WhatsApp Business is different from regular WhatsApp because:', '["It costs money", "It has business features like catalog, quick replies, labels", "It only works on computer", "It cannot send photos"]', 1, 'WhatsApp Business adds features like product catalog, automated messages, quick replies, and customer labels.', 'easy', 1),
('T18.2', 'M5', 'A product catalog in WhatsApp Business:', '["Shows your personal photos", "Displays your products with prices and descriptions", "Is same as status updates", "Shows your contact list"]', 1, 'Catalog showcases your products with photos, prices, and descriptions. Customers can browse without leaving chat.', 'easy', 2),
('T18.2', 'M5', 'Quick replies in WhatsApp Business help you:', '["Delete messages faster", "Send saved common responses quickly", "Block customers", "Make video calls"]', 1, 'Quick replies let you save and send common responses with shortcuts. Type /greeting to send welcome message.', 'easy', 3),

-- T19.1: Agriculture Apps
('T19.1', 'M5', 'Kisan Suvidha app provides:', '["Only games for farmers", "Weather, market prices, and farming tips", "Social media for farmers", "Online shopping only"]', 1, 'Kisan Suvidha gives weather forecasts, mandi prices, plant protection tips, and farming advisories.', 'easy', 1),
('T19.1', 'M5', 'Checking mandi prices before selling helps farmers:', '["Waste time", "Get better price by comparing different markets", "Confuse buyers", "Nothing useful"]', 1, 'Comparing prices across mandis helps farmers choose where to sell for best returns.', 'easy', 2),
('T19.1', 'M5', 'Weather apps help farmers by:', '["Only showing temperature", "Planning sowing, irrigation, and harvest based on forecasts", "Making rain", "Controlling weather"]', 1, 'Weather forecasts help plan agricultural activities - when to sow, irrigate, apply fertilizer, and harvest.', 'easy', 3),

-- T19.2: Course Completion
('T19.2', 'M5', 'After completing this course, you can:', '["Only use basic features", "Use digital services, payments, selling, and stay safe online", "Become a computer engineer", "Nothing new"]', 1, 'You now have skills for government services, digital payments, online selling, and safe internet use.', 'easy', 1),
('T19.2', 'M5', 'To keep improving digital skills, you should:', '["Stop using technology", "Practice regularly and help others learn", "Never try new features", "Avoid smartphones"]', 1, 'Skills improve with practice. Use your skills daily, explore new features, and teach family members.', 'easy', 2),
('T19.2', 'M5', 'The most important safety rule for all digital activities is:', '["Share passwords with friends", "Never share OTP, PIN, or passwords with anyone", "Click all links you receive", "Trust all online messages"]', 1, 'Never share OTP, PIN, or passwords. This single rule protects you from most online frauds.', 'easy', 3);
;
