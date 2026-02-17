-- ENGLISH VERY HARD QUESTIONS (10 questions, difficulty 1.5-2.5)

INSERT INTO irt_item_bank (item_code, category, level, question_text, options, correct_answer, difficulty, discrimination, guessing, language, source_language, is_active, review_state)
VALUES
('CAT_EN_CA_VHARD_001', 'contextual_application', 'basic',
 'An organization needs to implement a backup strategy for critical business data. According to the 3-2-1 backup rule, what is the correct implementation?',
 '[{"id":"A","text":"3 copies on the same computer"},{"id":"B","text":"3 copies total, on 2 different media types, with 1 copy stored offsite or in cloud"},{"id":"C","text":"1 copy on 3 USB drives"},{"id":"D","text":"2 copies in the same building"}]',
 2, 1.8, 2.0, 0.25, 'en', 'en', true, 'approved'),

('CAT_EN_CA_VHARD_002', 'contextual_application', 'basic',
 'When implementing role-based access control (RBAC) for a shared document system, which principle should guide permission assignment?',
 '[{"id":"A","text":"Give everyone full access for convenience"},{"id":"B","text":"Principle of least privilege - users get minimum access needed for their role"},{"id":"C","text":"Only managers should have any access"},{"id":"D","text":"Permissions are not important"}]',
 2, 2.0, 2.1, 0.25, 'en', 'en', true, 'approved'),

('CAT_EN_DCC_VHARD_001', 'digital_content_creation', 'basic',
 'When creating accessible digital content for users with visual impairments, which combination of techniques is most comprehensive?',
 '[{"id":"A","text":"Use only images without text"},{"id":"B","text":"Provide alt text for images, use semantic headings, ensure color contrast ratio of 4.5:1, and support screen readers"},{"id":"C","text":"Make text very small to fit more content"},{"id":"D","text":"Use only red and green colors"}]',
 2, 1.9, 2.0, 0.25, 'en', 'en', true, 'approved'),

('CAT_EN_DCC_VHARD_002', 'digital_content_creation', 'basic',
 'You need to create a form that validates email addresses in real-time. Which regular expression pattern correctly identifies valid email formats?',
 '[{"id":"A","text":"Any text with @ symbol is valid"},{"id":"B","text":"Pattern checking for: characters before @, valid domain name, and valid TLD (e.g., user@domain.com)"},{"id":"C","text":"Only numbers are allowed"},{"id":"D","text":"Email validation is not possible"}]',
 2, 2.2, 2.1, 0.27, 'en', 'en', true, 'approved'),

('CAT_EN_DDF_VHARD_001', 'digital_device_familiarity', 'basic',
 'A computer shows a BSOD (Blue Screen of Death) with error KERNEL_DATA_INPAGE_ERROR. What is the most likely cause and first diagnostic step?',
 '[{"id":"A","text":"The keyboard is broken"},{"id":"B","text":"Likely disk or memory issue - run disk check (chkdsk) and memory diagnostic (mdsched) to identify failing hardware"},{"id":"C","text":"The monitor needs replacement"},{"id":"D","text":"Reinstall all programs immediately"}]',
 2, 2.1, 2.2, 0.26, 'en', 'en', true, 'approved'),

('CAT_EN_DDF_VHARD_002', 'digital_device_familiarity', 'basic',
 'What is the purpose of UEFI compared to legacy BIOS, and what security feature does UEFI enable?',
 '[{"id":"A","text":"They are identical systems"},{"id":"B","text":"UEFI supports larger drives, faster boot, and Secure Boot which prevents unauthorized bootloaders/malware from loading"},{"id":"C","text":"BIOS is newer than UEFI"},{"id":"D","text":"UEFI only works with Apple computers"}]',
 2, 2.3, 2.1, 0.27, 'en', 'en', true, 'approved'),

('CAT_EN_IWA_VHARD_001', 'internet_web_awareness', 'basic',
 'What is the difference between symmetric and asymmetric encryption, and when is each used in HTTPS connections?',
 '[{"id":"A","text":"They are the same thing"},{"id":"B","text":"Asymmetric (public/private key) is used for initial handshake; symmetric (shared secret) for faster bulk data transfer"},{"id":"C","text":"Symmetric is more secure"},{"id":"D","text":"HTTPS does not use encryption"}]',
 2, 2.4, 2.2, 0.28, 'en', 'en', true, 'approved'),

('CAT_EN_IWA_VHARD_002', 'internet_web_awareness', 'basic',
 'A website uses cookies for tracking. What is the key difference between first-party and third-party cookies in terms of privacy?',
 '[{"id":"A","text":"All cookies are identical"},{"id":"B","text":"First-party are set by the site you visit (for functionality); third-party are set by external domains (often for cross-site tracking/ads)"},{"id":"C","text":"Third-party cookies are more secure"},{"id":"D","text":"Cookies cannot track users"}]',
 2, 1.7, 1.9, 0.25, 'en', 'en', true, 'approved'),

('CAT_EN_PSA_VHARD_001', 'problem_solving_aptitude', 'basic',
 'A database query that usually takes 2 seconds is now taking 45 seconds. The data volume has not changed significantly. What systematic approach would you use to diagnose this?',
 '[{"id":"A","text":"Delete the database"},{"id":"B","text":"Check query execution plan for table scans, verify indexes are not fragmented, check for blocking queries, and review recent schema changes"},{"id":"C","text":"Buy faster internet"},{"id":"D","text":"Wait longer for each query"}]',
 2, 2.5, 2.2, 0.28, 'en', 'en', true, 'approved'),

('CAT_EN_PSA_VHARD_002', 'problem_solving_aptitude', 'basic',
 'A user reports that a web application works in Chrome but fails in Safari with JavaScript errors. What is the most systematic debugging approach?',
 '[{"id":"A","text":"Tell user to only use Chrome"},{"id":"B","text":"Check browser console for errors, verify JavaScript compatibility (ES6+ features), test with polyfills, and check for Safari-specific bugs"},{"id":"C","text":"The application is broken"},{"id":"D","text":"Safari does not support websites"}]',
 2, 2.0, 2.0, 0.26, 'en', 'en', true, 'approved');;
