
-- Fix order_index for all Hindi and Assamese practice questions
-- to match the English question order for consistent sequencing

-- T4.2: Window Management
-- Order: 1=Taskbar location, 2=Start Menu access, 3=Window minimize
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T4.2' AND question LIKE '%Taskbar%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T4.2' AND question LIKE '%Start Menu%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T4.2' AND question LIKE '%minimize%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T4.2' AND question LIKE '%Taskbar%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T4.2' AND question LIKE '%Start Menu%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T4.2' AND question LIKE '%minimize%';

-- T7.1: Phone Settings
-- Order: 1=brightness, 2=WiFi, 3=Airplane mode
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T7.1' AND question LIKE '%brightness%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T7.1' AND question LIKE '%WiFi%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T7.1' AND question LIKE '%Airplane%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T7.1' AND question LIKE '%brightness%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T7.1' AND question LIKE '%WiFi%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T7.1' AND question LIKE '%Airplane%';

-- T7.2: Widgets
-- Order: 1=wallpaper, 2=widget, 3=font size
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T7.2' AND question LIKE '%wallpaper%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T7.2' AND question LIKE '%Widget%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T7.2' AND question LIKE '%font size%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T7.2' AND question LIKE '%wallpaper%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T7.2' AND question LIKE '%Widget%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T7.2' AND question LIKE '%font size%';

-- T8.1: Software Updates
-- Order: 1=updates important, 2=before updating, 3=auto-update
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T8.1' AND question LIKE '%updates%महत्वपूर्ण%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T8.1' AND question LIKE '%update करने से पहले%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T8.1' AND question LIKE '%Auto-update%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T8.1' AND question LIKE '%updates%গুৰুত্বপূৰ্ণ%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T8.1' AND question LIKE '%update কৰাৰ আগতে%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T8.1' AND question LIKE '%Auto-update%';

-- T8.2: Troubleshooting
-- Order: 1=app freezes, 2=running slowly, 3=restart
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T8.2' AND question LIKE '%freeze%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T8.2' AND question LIKE '%धीमा%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T8.2' AND question LIKE '%restart%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T8.2' AND question LIKE '%freeze%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T8.2' AND question LIKE '%লেহেম%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T8.2' AND question LIKE '%restart%';

-- T9.2: Ways to Connect
-- Order: 1=WiFi connects, 2=Mobile data, 3=faster speed
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T9.2' AND question LIKE '%WiFi internet%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T9.2' AND question LIKE '%Mobile data%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T9.2' AND question LIKE '%speed%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T9.2' AND question LIKE '%WiFi internet%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T9.2' AND question LIKE '%Mobile data%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T9.2' AND question LIKE '%speed%';

-- T9.3: Browsers
-- Order: 1=browser used to, 2=which is browser, 3=address bar
UPDATE practice_questions SET order_index = 1 WHERE language = 'hi' AND topic_id = 'T9.3' AND question LIKE '%browser का उपयोग%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'hi' AND topic_id = 'T9.3' AND question LIKE '%कौन सा web browser%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'hi' AND topic_id = 'T9.3' AND question LIKE '%address bar%';

UPDATE practice_questions SET order_index = 1 WHERE language = 'as' AND topic_id = 'T9.3' AND question LIKE '%browser ব্যৱহাৰ%';
UPDATE practice_questions SET order_index = 2 WHERE language = 'as' AND topic_id = 'T9.3' AND question LIKE '%কোনটো web browser%';
UPDATE practice_questions SET order_index = 3 WHERE language = 'as' AND topic_id = 'T9.3' AND question LIKE '%address bar%';
;
