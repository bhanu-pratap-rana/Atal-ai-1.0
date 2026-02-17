-- Seed Practice Questions for Module 4: Digital Communication (Topics T12.1-T15.2)
INSERT INTO practice_questions (topic_id, module_id, question, options, correct_index, explanation, difficulty, order_index) VALUES
-- T12.1: Email Account Creation
('T12.1', 'M4', 'What is an email address used for?', '["Making phone calls", "Sending and receiving digital messages", "Watching videos", "Playing games"]', 1, 'Email addresses let you send and receive digital messages, documents, and files over the internet.', 'easy', 1),
('T12.1', 'M4', 'A good professional email address is:', '["cooldude999@gmail.com", "rajesh.sharma@gmail.com", "xyzabc123@gmail.com", "ilovegames@gmail.com"]', 1, 'Professional emails should include your name. rajesh.sharma@gmail.com is clear and professional.', 'easy', 2),
('T12.1', 'M4', 'The Inbox in email contains:', '["Sent messages", "Received messages", "Deleted messages", "Draft messages"]', 1, 'Inbox contains messages you have received. Sent folder has messages you sent, Drafts has unsent messages.', 'easy', 3),

-- T12.2: Sending and Receiving Emails
('T12.2', 'M4', 'CC in email stands for:', '["Computer Copy", "Carbon Copy", "Central Copy", "Certified Copy"]', 1, 'CC (Carbon Copy) sends a copy to additional recipients. Everyone can see who received CC.', 'easy', 1),
('T12.2', 'M4', 'What is an email attachment?', '["The subject line", "A file sent along with the email", "The email address", "The signature"]', 1, 'Attachments are files (documents, photos, etc.) sent along with your email message.', 'easy', 2),
('T12.2', 'M4', 'Before sending an important email, you should:', '["Send immediately without checking", "Review subject, recipients, and content", "Delete the draft", "Add many emojis"]', 1, 'Always review your email before sending - check recipients, subject line, content, and attachments.', 'easy', 3),

-- T13.1: WhatsApp Basics
('T13.1', 'M4', 'WhatsApp uses which connection to send messages?', '["Regular SMS charges", "Internet connection (WiFi or mobile data)", "Phone call minutes", "Bluetooth"]', 1, 'WhatsApp uses internet (WiFi or mobile data) for messages and calls, not regular SMS or call charges.', 'easy', 1),
('T13.1', 'M4', 'To create a WhatsApp group, you need:', '["At least 10 members", "Permission from WhatsApp", "At least one other contact", "A business account"]', 2, 'You need at least one other contact to create a group. Groups can have up to 1024 members.', 'easy', 2),
('T13.1', 'M4', 'Voice messages in WhatsApp are useful when:', '["You want to type faster", "Typing is difficult or you want personal touch", "You want to save data", "You are in a meeting"]', 1, 'Voice messages help when typing is difficult, you want emotion in your message, or need to explain something quickly.', 'easy', 3),

-- T13.2: WhatsApp Safety
('T13.2', 'M4', 'You receive a message saying you won a lottery. You should:', '["Click the link immediately", "Share your bank details", "Ignore and delete - it is a scam", "Forward to friends"]', 2, 'Lottery/prize messages from unknown numbers are scams. Never click links or share personal information.', 'easy', 1),
('T13.2', 'M4', 'Someone asks for your OTP saying they are from the bank. You should:', '["Share it immediately", "Never share OTP with anyone", "Share only if they sound official", "Call them back and share"]', 1, 'Banks NEVER ask for OTP. Anyone asking for OTP is a scammer, no matter how official they sound.', 'easy', 2),
('T13.2', 'M4', 'Two-step verification in WhatsApp:', '["Slows down messaging", "Adds extra security with a PIN", "Is not important", "Shares your location"]', 1, 'Two-step verification adds a PIN that is needed when registering your number again, preventing account theft.', 'medium', 3),

-- T14.1: Video Calling
('T14.1', 'M4', 'For a clear video call, you need:', '["Only good camera", "Good internet, lighting, and quiet place", "Expensive phone only", "Bluetooth connection"]', 1, 'Clear video calls need stable internet, good lighting (face the light), and a quiet environment.', 'easy', 1),
('T14.1', 'M4', 'During a group video call, you should mute yourself when:', '["Speaking", "Not speaking to reduce background noise", "The call starts", "Someone asks a question"]', 1, 'Mute when not speaking to prevent your background noise from disturbing others in the call.', 'easy', 2),
('T14.1', 'M4', 'Google Meet is useful for:', '["Sending SMS", "Group video meetings and calls", "Editing photos", "Playing music"]', 1, 'Google Meet is for video meetings, useful for work calls, online classes, and group discussions.', 'easy', 3),

-- T14.2: Online Safety Basics
('T14.2', 'M4', 'A strong password should have:', '["Only your name", "Mix of letters, numbers, and symbols", "Only numbers", "Your birth date"]', 1, 'Strong passwords mix uppercase, lowercase, numbers, and symbols. Example: Muga@Silk2024!', 'easy', 1),
('T14.2', 'M4', 'You should use the same password for all accounts:', '["True, easier to remember", "False, use different passwords", "Only for important accounts", "Only for email"]', 1, 'False! Use different passwords. If one account is hacked, others stay safe.', 'easy', 2),
('T14.2', 'M4', 'Phishing is:', '["A type of game", "Fake messages trying to steal your information", "A video calling app", "A file format"]', 1, 'Phishing uses fake emails/websites mimicking real ones to steal passwords and personal information.', 'medium', 3),

-- T15.1: Digital Etiquette
('T15.1', 'M4', 'Typing in ALL CAPS in messages means:', '["Emphasis calmly", "You are SHOUTING", "Professional writing", "Faster typing"]', 1, 'ALL CAPS is considered shouting online. Use normal capitalization for polite communication.', 'easy', 1),
('T15.1', 'M4', 'Before adding someone to a WhatsApp group, you should:', '["Add them without asking", "Ask their permission first", "Add everyone in your contacts", "Create a new account"]', 1, 'Ask permission before adding people to groups. Respect their choice if they decline.', 'easy', 2),
('T15.1', 'M4', 'When you receive unverified information, you should:', '["Forward it to everyone immediately", "Verify before sharing", "Add your own opinions and forward", "Assume it is true if it looks official"]', 1, 'Always verify information before sharing. Check multiple sources and fact-checking websites.', 'easy', 3),

-- T15.2: Fake News Identification
('T15.2', 'M4', 'A sign that news might be fake is:', '["It appears on multiple news sites", "It has many spelling errors and dramatic claims", "It includes the source", "It has a recent date"]', 1, 'Fake news often has errors, extreme emotional language, dramatic claims, and missing or fake sources.', 'easy', 1),
('T15.2', 'M4', 'To verify an image, you can use:', '["Only your eyes", "Google Reverse Image Search", "WhatsApp", "Calculator app"]', 1, 'Google Reverse Image Search shows where an image appeared before, revealing if it is old or manipulated.', 'medium', 2),
('T15.2', 'M4', 'If news makes you very angry or scared immediately, you should:', '["Share it quickly before others", "Take time to verify before reacting", "Believe it because emotions mean it is important", "Forward to family for safety"]', 1, 'Fake news uses strong emotions to spread. If you feel very emotional, pause and verify first.', 'medium', 3);
;
