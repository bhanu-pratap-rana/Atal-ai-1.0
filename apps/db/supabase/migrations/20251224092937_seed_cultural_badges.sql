-- =====================================================
-- Seed Cultural Badges
-- =====================================================
-- 10 badges representing Assamese heritage and learning milestones

INSERT INTO badges (id, name_en, name_hi, name_as, description, icon, unlock_criteria, cultural_note, rarity, points_value)
VALUES
  ('muga_silk_master', 'Muga Silk Master', 'मुगा सिल्क मास्टर', 'মুগা শিল্পী',
   'Complete 10 lessons with 70% or higher mastery', '🪙',
   '{"type": "lessons_completed", "threshold": 10}',
   'Assam''s golden Muga silk represents patience and quality in learning - just like mastering digital skills requires dedication.',
   'common', 100),

  ('gamosa_graduate', 'Gamosa Graduate', 'गामोसा ग्रेजुएट', 'গামোচা গ্ৰেজুৱেট',
   'Score 90% or higher on any module assessment', '🧣',
   '{"type": "high_score", "threshold": 90}',
   'The Gamosa symbolizes respect and excellence in Assamese culture. Earning this badge shows your dedication to excellence.',
   'uncommon', 150),

  ('bihu_dancer', 'Bihu Dancer', 'बिहू डांसर', 'বিহু নৃত্যশিল্পী',
   'Complete 3 or more lessons in a single week', '💃',
   '{"type": "weekly_streak", "threshold": 3}',
   'Bihu dance represents joy in dedication and hard work. Your consistent learning rhythm is worth celebrating!',
   'uncommon', 150),

  ('brahmaputra_scholar', 'Brahmaputra Scholar', 'ब्रह्मपुत्र विद्वान', 'ব্ৰহ্মপুত্ৰ পণ্ডিত',
   'Master all 5 modules with 70% or higher', '🌊',
   '{"type": "modules_mastered", "threshold": 5}',
   'Like the mighty Brahmaputra that flows through all of Assam, you have flowed through all the knowledge in this course.',
   'rare', 300),

  ('perfect_score', 'Perfect Score', 'पूर्ण अंक', 'পূৰ্ণ নম্বৰ',
   'Achieve 100% on any module assessment', '⭐',
   '{"type": "perfect_score"}',
   'Ultimate achievement - perfection in learning. You have shown mastery worthy of the greatest scholars.',
   'legendary', 500),

  ('voice_learner', 'Voice Learner', 'आवाज़ शिक्षार्थी', 'কণ্ঠ শিক্ষাৰ্থী',
   'Use voice features 10 or more times', '🎤',
   '{"type": "voice_interactions", "threshold": 10}',
   'Assamese oral tradition is rich and ancient. By using voice, you connect learning to our cultural heritage.',
   'common', 100),

  ('first_steps', 'First Steps', 'पहला कदम', 'প্ৰথম পদক্ষেপ',
   'Complete your very first lesson', '👣',
   '{"type": "first_lesson"}',
   'Every journey begins with a single step. You have taken yours into the world of digital literacy.',
   'common', 50),

  ('curious_mind', 'Curious Mind', 'जिज्ञासु मन', 'কৌতূহলী মন',
   'Ask 20 or more questions to the AI tutor', '🔍',
   '{"type": "questions_asked", "threshold": 20}',
   'Curiosity is the foundation of all learning. Your questions show a true desire to understand.',
   'uncommon', 150),

  ('night_owl', 'Night Owl', 'रात का उल्लू', 'নিশাচৰ উইচা',
   'Study late at night (after 9 PM) 5 times', '🦉',
   '{"type": "night_activity", "threshold": 5}',
   'Like the owl that sees in the dark, you find light in knowledge even at night.',
   'uncommon', 100),

  ('early_bird', 'Early Bird', 'सुबह का पक्षी', 'পুৱাৰ চৰাই',
   'Study early in the morning (5-7 AM) 3 times', '🐦',
   '{"type": "early_activity", "threshold": 3}',
   'The early bird catches the worm. Starting your day with learning shows great discipline.',
   'uncommon', 100)
ON CONFLICT (id) DO NOTHING;;
