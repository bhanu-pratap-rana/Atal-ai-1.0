
-- Fix order_index for M5 topics (Local Technology)

-- T16.2: Safe Digital Documents
-- Order: 1=before filling, 2=* fields, 3=after submitting
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T16.2' AND question LIKE '%form भरने से पहले%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T16.2' AND question LIKE '%*%marked%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T16.2' AND question LIKE '%submit करने के बाद%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T16.2' AND question LIKE '%form পূৰণ কৰাৰ আগতে%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T16.2' AND question LIKE '%*%marked%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T16.2' AND question LIKE '%submit কৰাৰ পিছত%';

-- T17.1: UPI Basics
-- Order: 1=UPI stands for, 2=without internet, 3=payments help
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T17.1' AND question LIKE '%UPI का full form%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T17.1' AND question LIKE '%बिना internet%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T17.1' AND question LIKE '%Digital payments मदद%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T17.1' AND question LIKE '%UPI ৰ full form%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T17.1' AND question LIKE '%internet অবিহনে%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T17.1' AND question LIKE '%Digital payments সহায়%';

-- T17.2: Payment Scams
-- Order: 1=UPI PIN, 2=QR code, 3=payment fails
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T17.2' AND question LIKE '%UPI PIN%होना%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T17.2' AND question LIKE '%QR code%pay%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T17.2' AND question LIKE '%payment fail%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T17.2' AND question LIKE '%UPI PIN%হোৱা%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T17.2' AND question LIKE '%QR code%pay%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T17.2' AND question LIKE '%payment fail%';

-- T18.1: Product Photos
-- Order: 1=good photos, 2=Amazon Karigar, 3=pricing
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T18.1' AND question LIKE '%product photos%होना%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T18.1' AND question LIKE '%Amazon Karigar%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T18.1' AND question LIKE '%pricing%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T18.1' AND question LIKE '%product photos%থাকিব%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T18.1' AND question LIKE '%Amazon Karigar%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T18.1' AND question LIKE '%pricing%';

-- T18.2: Safe Selling
-- Order: 1=WhatsApp Business different, 2=product catalog, 3=Quick replies
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T18.2' AND question LIKE '%WhatsApp Business%अलग%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T18.2' AND question LIKE '%product catalog%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T18.2' AND question LIKE '%Quick replies%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T18.2' AND question LIKE '%WhatsApp Business%বেলেগ%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T18.2' AND question LIKE '%product catalog%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T18.2' AND question LIKE '%Quick replies%';

-- T19.1: Weather & Advisory
-- Order: 1=Kisan Suvidha, 2=mandi prices, 3=Weather apps
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T19.1' AND question LIKE '%Kisan Suvidha%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T19.1' AND question LIKE '%mandi prices%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T19.1' AND question LIKE '%Weather apps%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T19.1' AND question LIKE '%Kisan Suvidha%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T19.1' AND question LIKE '%mandi prices%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T19.1' AND question LIKE '%Weather apps%';

-- T19.2: Farm Records
-- Order: 1=after completing course, 2=improving skills, 3=safety rule
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T19.2' AND question LIKE '%course complete%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T19.2' AND question LIKE '%Digital skills%improve%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T19.2' AND question LIKE '%safety rule%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T19.2' AND question LIKE '%course সম্পূৰ্ণ%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T19.2' AND question LIKE '%Digital skills%উন্নত%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T19.2' AND question LIKE '%safety rule%';
;
