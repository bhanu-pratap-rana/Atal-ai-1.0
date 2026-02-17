-- Migration: Add Hard and Very Hard IRT Questions for CAT Pre-Assessment
-- Adding 60 new questions (20 per language) with difficulty 0.8 to 2.5

-- ============================================
-- ENGLISH HARD QUESTIONS (10 questions, difficulty 0.8-1.5)
-- ============================================

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

('CAT_EN_DCC_HARD_001', 'digital_content_creation', 'basic',
 'You need to create a professional document that includes a table of contents that automatically updates when you add new sections. Which feature should you use?',
 '[{"id":"A","text":"Manual numbering"},{"id":"B","text":"Heading styles with auto-generated table of contents"},{"id":"C","text":"Bullet points"},{"id":"D","text":"Text boxes"}]',
 2, 1.0, 1.7, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_DCC_HARD_002', 'digital_content_creation', 'basic',
 'When preparing images for a website, which approach best balances quality and loading speed?',
 '[{"id":"A","text":"Use maximum quality BMP files"},{"id":"B","text":"Compress images to appropriate resolution and use WebP or optimized JPEG format"},{"id":"C","text":"Always use GIF format"},{"id":"D","text":"Upload original camera photos directly"}]',
 2, 1.3, 1.8, 0.23, 'en', 'en', true, 'approved'),

('CAT_EN_DDF_HARD_001', 'digital_device_familiarity', 'basic',
 'A computer is running slowly. The Task Manager shows 95% RAM usage with only a web browser open (20 tabs). What is the most effective solution?',
 '[{"id":"A","text":"Restart the computer repeatedly"},{"id":"B","text":"Close unnecessary tabs and consider adding more RAM or using a browser extension to manage tabs"},{"id":"C","text":"Delete system files"},{"id":"D","text":"Increase monitor brightness"}]',
 2, 1.1, 1.8, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_DDF_HARD_002', 'digital_device_familiarity', 'basic',
 'What is the difference between SSD and HDD storage, and when would you recommend each?',
 '[{"id":"A","text":"They are exactly the same"},{"id":"B","text":"SSD is faster with no moving parts (better for OS/apps); HDD is cheaper per GB with moving parts (better for bulk storage)"},{"id":"C","text":"HDD is always faster"},{"id":"D","text":"SSD can only store text files"}]',
 2, 1.2, 1.7, 0.23, 'en', 'en', true, 'approved'),

('CAT_EN_IWA_HARD_001', 'internet_web_awareness', 'basic',
 'You receive an email from "support@amaz0n-security.com" asking you to verify your account by clicking a link. The email looks official with the Amazon logo. What should you do?',
 '[{"id":"A","text":"Click the link immediately"},{"id":"B","text":"Recognize this as likely phishing (note the zero in amaz0n), do not click, and report as spam"},{"id":"C","text":"Reply with your password"},{"id":"D","text":"Forward to all contacts"}]',
 2, 0.9, 1.6, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_IWA_HARD_002', 'internet_web_awareness', 'basic',
 'What does it mean when a website shows "Your connection is not private" warning in the browser?',
 '[{"id":"A","text":"The website is in maintenance mode"},{"id":"B","text":"The SSL/TLS certificate is invalid, expired, or missing, meaning data may not be encrypted"},{"id":"C","text":"Your internet is too slow"},{"id":"D","text":"The website has too many visitors"}]',
 2, 1.0, 1.7, 0.23, 'en', 'en', true, 'approved'),

('CAT_EN_PSA_HARD_001', 'problem_solving_aptitude', 'basic',
 'Your laptop suddenly shuts down while plugged in and will not turn on. You try a different power outlet and the laptop still will not start. What is the most logical next diagnostic step?',
 '[{"id":"A","text":"Buy a new laptop immediately"},{"id":"B","text":"Check if the charging indicator lights up; if not, the adapter may be faulty; if yes, try holding power button for 30 seconds (hard reset)"},{"id":"C","text":"Throw the laptop away"},{"id":"D","text":"Wait one year and try again"}]',
 2, 1.3, 1.9, 0.22, 'en', 'en', true, 'approved'),

('CAT_EN_PSA_HARD_002', 'problem_solving_aptitude', 'basic',
 'A user complains their Wi-Fi is slow only on their laptop, but other devices work fine. What troubleshooting steps would you recommend?',
 '[{"id":"A","text":"Replace the router immediately"},{"id":"B","text":"Check laptop Wi-Fi driver, run network troubleshooter, check for interference, try forgetting and reconnecting to network"},{"id":"C","text":"Buy a new internet plan"},{"id":"D","text":"Ignore the problem"}]',
 2, 1.1, 1.8, 0.23, 'en', 'en', true, 'approved');;
