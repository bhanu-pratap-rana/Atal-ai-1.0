
-- Fix order_index for M4 topics (Digital Communication)

-- T12.2: Compose, Attach & Send
-- Order: 1=CC stands for, 2=attachment, 3=before sending
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T12.2' AND question LIKE '%CC%मतलब%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T12.2' AND question LIKE '%attachment%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T12.2' AND question LIKE '%email भेजने से पहले%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T12.2' AND question LIKE '%CC%অৰ্থ%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T12.2' AND question LIKE '%attachment%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T12.2' AND question LIKE '%email পঠোৱাৰ আগতে%';

-- T13.1: Account Safety
-- Order: 1=WhatsApp connection, 2=create group, 3=voice messages
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T13.1' AND question LIKE '%WhatsApp%connection%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T13.1' AND question LIKE '%group बनाने%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T13.1' AND question LIKE '%voice messages%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T13.1' AND question LIKE '%WhatsApp%connection%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T13.1' AND question LIKE '%group বনাবলৈ%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T13.1' AND question LIKE '%voice messages%';

-- T13.2: Groups & Rumor Control
-- Order: 1=lottery message, 2=OTP request, 3=Two-step verification
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T13.2' AND question LIKE '%lottery%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T13.2' AND question LIKE '%OTP मांगे%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T13.2' AND question LIKE '%Two-step verification%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T13.2' AND question LIKE '%lottery%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T13.2' AND question LIKE '%OTP বিচাৰিলে%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T13.2' AND question LIKE '%Two-step verification%';

-- T14.1: Video Calls
-- Order: 1=clear video call, 2=mute yourself, 3=Google Meet
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T14.1' AND question LIKE '%Clear video call%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T14.1' AND question LIKE '%mute करना%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T14.1' AND question LIKE '%Google Meet%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T14.1' AND question LIKE '%Clear video call%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T14.1' AND question LIKE '%mute কৰা%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T14.1' AND question LIKE '%Google Meet%';

-- T14.2: Low-Data Calling Etiquette
-- Order: 1=strong password, 2=same password, 3=phishing
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T14.2' AND question LIKE '%Strong password%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T14.2' AND question LIKE '%same password%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T14.2' AND question LIKE '%Phishing%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T14.2' AND question LIKE '%Strong password%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T14.2' AND question LIKE '%একে password%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T14.2' AND question LIKE '%Phishing%';

-- T15.1: Respectful Messages
-- Order: 1=ALL CAPS, 2=adding to group, 3=unverified info
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T15.1' AND question LIKE '%ALL CAPS%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T15.1' AND question LIKE '%group में add%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T15.1' AND question LIKE '%Unverified information%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T15.1' AND question LIKE '%ALL CAPS%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T15.1' AND question LIKE '%group ত add%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T15.1' AND question LIKE '%Unverified information%';

-- T15.2: Consent & Footprints
-- Order: 1=fake news sign, 2=verify image, 3=angry/scared
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T15.2' AND question LIKE '%Fake news%संकेत%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T15.2' AND question LIKE '%Image verify%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T15.2' AND question LIKE '%गुस्सा या डर%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T15.2' AND question LIKE '%Fake news%সংকেত%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T15.2' AND question LIKE '%Image verify%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T15.2' AND question LIKE '%খং বা ভয়%';
;
