-- =====================================================
-- Migration 044: Seed Cultural Badges
-- =====================================================
-- Creates 5 cultural badges for gamification:
-- 1. Muga Silk Master - Complete 10 lessons
-- 2. Gamosa Graduate - Score 90%+ on assessment
-- 3. Bihu Dancer - Complete 3 lessons in one week
-- 4. Brahmaputra Scholar - Master all 5 modules
-- 5. Perfect Score - 100% on any module assessment
--
-- All badges have trilingual names (English, Hindi, Assamese)
-- and cultural context notes
-- =====================================================

-- Clear existing badges to avoid conflicts
DELETE FROM badges WHERE id IN (
  'muga_silk_master',
  'gamosa_graduate',
  'bihu_dancer',
  'brahmaputra_scholar',
  'perfect_score'
);

-- Insert cultural badges
INSERT INTO badges (id, name_en, name_hi, name_as, description, icon, unlock_criteria, cultural_note, rarity, points_value)
VALUES
  -- 1. Muga Silk Master (Common) - Complete 10 lessons
  (
    'muga_silk_master',
    'Muga Silk Master',
    'मुगा सिल्क मास्टर',
    'মুগা শিল্পী',
    'Complete 10 lessons with at least 70% mastery',
    '🪙',
    '{"type": "lessons_completed", "threshold": 10, "min_mastery": 70}',
    'Assam''s golden Muga silk represents patience and quality in learning. Just as Muga silk requires careful cultivation, your learning journey requires dedication.',
    'common',
    100
  ),

  -- 2. Gamosa Graduate (Uncommon) - Score 90%+ on assessment
  (
    'gamosa_graduate',
    'Gamosa Graduate',
    'गामोसा ग्रेजुएट',
    'গামোচা গ্ৰেজুৱেট',
    'Score 90% or higher on any summative assessment',
    '🧣',
    '{"type": "high_score", "threshold": 90, "assessment_type": "summative"}',
    'The Gamosa (গামোচা) is a symbol of Assamese identity and respect. Like receiving a Gamosa, this badge honors your excellent achievement.',
    'uncommon',
    200
  ),

  -- 3. Bihu Dancer (Uncommon) - Complete 3 lessons in one week
  (
    'bihu_dancer',
    'Bihu Dancer',
    'बिहू डांसर',
    'বিহু নৃত্যশিল্পী',
    'Complete 3 or more lessons within a single week',
    '💃',
    '{"type": "weekly_streak", "threshold": 3, "period_days": 7}',
    'Bihu dance represents the joyful spirit of Assamese festivals. Your consistent learning rhythm mirrors the energetic beats of Bihu dhol!',
    'uncommon',
    150
  ),

  -- 4. Brahmaputra Scholar (Rare) - Master all 5 modules
  (
    'brahmaputra_scholar',
    'Brahmaputra Scholar',
    'ब्रह्मपुत्र विद्वान',
    'ব্ৰহ্মপুত্ৰ পণ্ডিত',
    'Achieve mastery (85%+) in all 5 curriculum modules',
    '🌊',
    '{"type": "modules_mastered", "threshold": 5, "min_mastery": 85}',
    'Like the mighty Brahmaputra that flows through all of Assam, your knowledge now flows through all domains of digital literacy.',
    'rare',
    500
  ),

  -- 5. Perfect Score (Legendary) - 100% on any module
  (
    'perfect_score',
    'Perfect Score',
    'पूर्ण अंक',
    'পূৰ্ণ নম্বৰ',
    'Achieve a perfect 100% score on any module summative assessment',
    '⭐',
    '{"type": "perfect_score", "score": 100, "assessment_type": "summative"}',
    'Ultimate achievement - perfection in learning. Like the rare golden silk of Sualkuchi, your perfect score shines bright!',
    'legendary',
    1000
  );

-- =====================================================
-- Additional Badges for Engagement
-- =====================================================

INSERT INTO badges (id, name_en, name_hi, name_as, description, icon, unlock_criteria, cultural_note, rarity, points_value)
VALUES
  -- Voice Learner - Use voice feature 10 times
  (
    'voice_learner',
    'Voice Learner',
    'वॉइस लर्नर',
    'কণ্ঠ শিক্ষাৰ্থী',
    'Use voice chat feature 10 times to learn',
    '🎤',
    '{"type": "voice_usage", "threshold": 10}',
    'Like the oral traditions of Assamese folk songs, you embrace learning through voice and sound.',
    'common',
    75
  ),

  -- First Steps - Complete first lesson
  (
    'first_steps',
    'First Steps',
    'पहला कदम',
    'প্ৰথম খোজ',
    'Complete your very first lesson',
    '👣',
    '{"type": "lessons_completed", "threshold": 1}',
    'Every journey begins with a single step. You have taken your first step towards digital empowerment!',
    'common',
    50
  ),

  -- Curious Mind - Ask 20 questions to AI tutor
  (
    'curious_mind',
    'Curious Mind',
    'जिज्ञासु मन',
    'কৌতূহলী মন',
    'Ask 20 questions to the AI tutor',
    '💡',
    '{"type": "questions_asked", "threshold": 20}',
    'Curiosity is the spark of learning. Your inquisitive nature reflects the questioning spirit of great scholars.',
    'uncommon',
    150
  ),

  -- Night Owl - Study after 8 PM
  (
    'night_owl',
    'Night Owl',
    'रात का उल्लू',
    'নিশাচৰ পেঁচা',
    'Complete a lesson after 8 PM',
    '🦉',
    '{"type": "time_based", "after_hour": 20, "lessons": 1}',
    'Like the wise owl that learns in the quiet of night, you dedicate your evening hours to knowledge.',
    'common',
    50
  ),

  -- Early Bird - Study before 7 AM
  (
    'early_bird',
    'Early Bird',
    'सुबह का पक्षी',
    'ভোৰৰ চৰাই',
    'Complete a lesson before 7 AM',
    '🐦',
    '{"type": "time_based", "before_hour": 7, "lessons": 1}',
    'The early bird catches the worm! Your dedication to morning study shows true commitment.',
    'common',
    50
  )

ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_hi = EXCLUDED.name_hi,
  name_as = EXCLUDED.name_as,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  unlock_criteria = EXCLUDED.unlock_criteria,
  cultural_note = EXCLUDED.cultural_note,
  rarity = EXCLUDED.rarity,
  points_value = EXCLUDED.points_value;

-- =====================================================
-- Reload PostgREST schema cache
-- =====================================================
NOTIFY pgrst, 'reload schema';
