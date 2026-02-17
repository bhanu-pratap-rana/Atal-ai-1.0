-- Migration: Add Missing Practice Questions and Multilingual Translations

-- T9.4: Accounts, OTPs & 2-Step Verification (M3)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T9.4', 'M3', 'en',
   'What does OTP stand for?',
   '["One Time Password", "Online Transfer Protocol", "Open Transaction Portal", "Original Transaction Pin"]',
   0,
   'OTP means One Time Password - a temporary code sent to your phone or email for secure verification.',
   1),
  ('T9.4', 'M3', 'en',
   'Why is 2-step verification safer than just a password?',
   '["It uses two different verification methods", "It is faster", "It costs more", "It only works on computers"]',
   0,
   '2-step verification requires both your password AND another method (like OTP), making it much harder for hackers.',
   2),
  ('T9.4', 'M3', 'en',
   'What should you do if someone asks for your OTP over phone?',
   '["Share it immediately", "Never share it - it is a scam", "Share only half the digits", "Ask them to call back later"]',
   1,
   'Never share your OTP with anyone, even if they claim to be from a bank or company. This is always a scam.',
   3);

-- T10.3: Browser Privacy Basics (M3)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T10.3', 'M3', 'en',
   'What are browser cookies?',
   '["Small files that websites store on your computer", "Sweet treats you can eat", "Computer viruses", "Email attachments"]',
   0,
   'Cookies are small files websites store on your computer to remember things like login status and preferences.',
   1),
  ('T10.3', 'M3', 'en',
   'How can you browse without saving history?',
   '["Use Private/Incognito mode", "Delete the browser", "Turn off the computer", "Use a faster internet"]',
   0,
   'Private or Incognito mode lets you browse without saving history or cookies on the device.',
   2),
  ('T10.3', 'M3', 'en',
   'Why should you clear browser history on shared computers?',
   '["To free up space", "To protect your personal information", "To make the computer faster", "To update the browser"]',
   1,
   'Clearing history protects your personal information like visited sites and login details from others.',
   3);

-- T10.4: Safe Downloads (M3)
INSERT INTO practice_questions (topic_id, module_id, language, question, options, correct_index, explanation, order_index)
VALUES
  ('T10.4', 'M3', 'en',
   'From where should you download software?',
   '["Any website that offers it", "Only from official websites or app stores", "From email attachments", "From pop-up advertisements"]',
   1,
   'Always download software from official websites or app stores to avoid malware and viruses.',
   1),
  ('T10.4', 'M3', 'en',
   'What should you check before opening a downloaded file?',
   '["The file size only", "Scan with antivirus and check the source", "The download speed", "The color of the icon"]',
   1,
   'Always scan downloaded files with antivirus and verify they came from a trusted source.',
   2),
  ('T10.4', 'M3', 'en',
   'What type of file can be dangerous to open?',
   '["PDF documents only", "Executable files (.exe) from unknown sources", "Photos from family", "Text documents"]',
   1,
   'Executable files (.exe, .apk) from unknown sources can contain viruses. Always verify the source.',
   3);;
