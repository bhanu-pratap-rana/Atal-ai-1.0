-- =====================================================
-- IRT Item Bank for Adaptive Assessment
-- =====================================================
-- This migration creates the IRT (Item Response Theory) item bank
-- for computerized adaptive testing in the ATAL AI platform.
--
-- IRT Parameters:
-- - difficulty (b): Item difficulty on logit scale (-3 to +3)
-- - discrimination (a): How well item differentiates abilities (0.5 to 2.5)
-- - guessing (c): Probability of correct guess (0 to 0.5)
--
-- Based on 3PL (Three-Parameter Logistic) model:
-- P(correct) = c + (1-c) / (1 + exp(-a*(theta-b)))

-- Create the IRT item bank table
CREATE TABLE IF NOT EXISTS irt_item_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'contextual_application',
    'digital_content_creation',
    'digital_device_familiarity',
    'internet_web_awareness',
    'problem_solving_aptitude'
  )),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 1 AND correct_answer <= 10),

  -- IRT 3PL Parameters
  difficulty DECIMAL(4,2) NOT NULL DEFAULT 0 CHECK (difficulty >= -4 AND difficulty <= 4),
  discrimination DECIMAL(4,2) NOT NULL DEFAULT 1.0 CHECK (discrimination >= 0.1 AND discrimination <= 3.0),
  guessing DECIMAL(3,2) NOT NULL DEFAULT 0.2 CHECK (guessing >= 0 AND guessing <= 0.5),

  -- Metadata
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'as')),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_category ON irt_item_bank(category);
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_language ON irt_item_bank(language);
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_active ON irt_item_bank(is_active);
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_difficulty ON irt_item_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_discrimination ON irt_item_bank(discrimination);

-- Composite index for adaptive selection queries
CREATE INDEX IF NOT EXISTS idx_irt_item_bank_adaptive_query
  ON irt_item_bank(language, is_active, category, difficulty);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_irt_item_bank_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_irt_item_bank_updated_at ON irt_item_bank;
CREATE TRIGGER trigger_update_irt_item_bank_updated_at
  BEFORE UPDATE ON irt_item_bank
  FOR EACH ROW
  EXECUTE FUNCTION update_irt_item_bank_updated_at();

-- Add table and column comments for documentation
COMMENT ON TABLE irt_item_bank IS
  'IRT-calibrated item bank for computerized adaptive testing (CAT)';

COMMENT ON COLUMN irt_item_bank.item_code IS
  'Unique identifier code for the item (e.g., CAT_EN_001)';

COMMENT ON COLUMN irt_item_bank.category IS
  'Digital literacy category/domain for content balancing';

COMMENT ON COLUMN irt_item_bank.question_text IS
  'The question text displayed to the student';

COMMENT ON COLUMN irt_item_bank.options IS
  'JSON array of answer options: [{id: "A", text: "Option text"}, ...]';

COMMENT ON COLUMN irt_item_bank.correct_answer IS
  'Index of the correct answer option (1-based)';

COMMENT ON COLUMN irt_item_bank.difficulty IS
  'IRT difficulty parameter (b): -3 very easy to +3 very hard';

COMMENT ON COLUMN irt_item_bank.discrimination IS
  'IRT discrimination parameter (a): how well item differentiates ability levels';

COMMENT ON COLUMN irt_item_bank.guessing IS
  'IRT guessing parameter (c): probability of correct answer by chance';

COMMENT ON COLUMN irt_item_bank.language IS
  'Language code: en (English), hi (Hindi), as (Assamese)';

COMMENT ON COLUMN irt_item_bank.is_active IS
  'Whether the item is active and available for selection';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE irt_item_bank ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active items (for assessment)
CREATE POLICY "Authenticated users can read active items"
  ON irt_item_bank
  FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- Service role can manage all items (for admin operations)
CREATE POLICY "Service role can manage all items"
  ON irt_item_bank
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Seed Sample Items (English)
-- =====================================================
-- Insert sample items for testing - these should be replaced
-- with properly calibrated items in production

INSERT INTO irt_item_bank (item_code, category, question_text, options, correct_answer, difficulty, discrimination, guessing, language) VALUES
-- Digital Device Familiarity (6 items)
('CAT_EN_DDF_001', 'digital_device_familiarity',
 'Which of the following is an input device?',
 '[{"id": "A", "text": "Monitor"}, {"id": "B", "text": "Keyboard"}, {"id": "C", "text": "Printer"}, {"id": "D", "text": "Speaker"}]',
 2, -1.5, 1.2, 0.25, 'en'),

('CAT_EN_DDF_002', 'digital_device_familiarity',
 'What is the main function of RAM in a computer?',
 '[{"id": "A", "text": "Permanent data storage"}, {"id": "B", "text": "Temporary data storage during operation"}, {"id": "C", "text": "Displaying graphics"}, {"id": "D", "text": "Connecting to the internet"}]',
 2, 0.5, 1.5, 0.25, 'en'),

('CAT_EN_DDF_003', 'digital_device_familiarity',
 'Which device is used to scan documents into a computer?',
 '[{"id": "A", "text": "Webcam"}, {"id": "B", "text": "Scanner"}, {"id": "C", "text": "Microphone"}, {"id": "D", "text": "Joystick"}]',
 2, -1.0, 1.3, 0.25, 'en'),

('CAT_EN_DDF_004', 'digital_device_familiarity',
 'What does USB stand for?',
 '[{"id": "A", "text": "Universal Serial Bus"}, {"id": "B", "text": "United System Board"}, {"id": "C", "text": "User System Backup"}, {"id": "D", "text": "Universal Storage Box"}]',
 1, 0.0, 1.4, 0.25, 'en'),

('CAT_EN_DDF_005', 'digital_device_familiarity',
 'Which component is considered the brain of the computer?',
 '[{"id": "A", "text": "Hard Drive"}, {"id": "B", "text": "CPU"}, {"id": "C", "text": "RAM"}, {"id": "D", "text": "Power Supply"}]',
 2, -0.5, 1.6, 0.25, 'en'),

('CAT_EN_DDF_006', 'digital_device_familiarity',
 'What is the purpose of a cooling fan in a computer?',
 '[{"id": "A", "text": "To make noise"}, {"id": "B", "text": "To prevent overheating"}, {"id": "C", "text": "To store data"}, {"id": "D", "text": "To connect peripherals"}]',
 2, -1.2, 1.1, 0.25, 'en'),

-- Internet & Web Awareness (6 items)
('CAT_EN_IWA_001', 'internet_web_awareness',
 'What does HTTP stand for?',
 '[{"id": "A", "text": "Hypertext Transfer Protocol"}, {"id": "B", "text": "High Text Transport Process"}, {"id": "C", "text": "Home Tool Transfer Protocol"}, {"id": "D", "text": "Hyper Tool Text Process"}]',
 1, 0.5, 1.4, 0.25, 'en'),

('CAT_EN_IWA_002', 'internet_web_awareness',
 'Which symbol is always present in an email address?',
 '[{"id": "A", "text": "#"}, {"id": "B", "text": "@"}, {"id": "C", "text": "&"}, {"id": "D", "text": "%"}]',
 2, -2.0, 1.0, 0.25, 'en'),

('CAT_EN_IWA_003', 'internet_web_awareness',
 'What is a web browser used for?',
 '[{"id": "A", "text": "Creating documents"}, {"id": "B", "text": "Viewing websites"}, {"id": "C", "text": "Playing games only"}, {"id": "D", "text": "Sending SMS"}]',
 2, -1.5, 1.2, 0.25, 'en'),

('CAT_EN_IWA_004', 'internet_web_awareness',
 'What does the ''s'' in https stand for?',
 '[{"id": "A", "text": "Speed"}, {"id": "B", "text": "Secure"}, {"id": "C", "text": "Simple"}, {"id": "D", "text": "Standard"}]',
 2, 0.0, 1.5, 0.25, 'en'),

('CAT_EN_IWA_005', 'internet_web_awareness',
 'What is a search engine?',
 '[{"id": "A", "text": "A type of car engine"}, {"id": "B", "text": "A tool to find information on the internet"}, {"id": "C", "text": "A computer game"}, {"id": "D", "text": "A type of software for accounting"}]',
 2, -1.0, 1.3, 0.25, 'en'),

('CAT_EN_IWA_006', 'internet_web_awareness',
 'What is phishing in the context of internet security?',
 '[{"id": "A", "text": "A type of online fishing game"}, {"id": "B", "text": "A scam to steal personal information"}, {"id": "C", "text": "A method to speed up internet"}, {"id": "D", "text": "A way to download files"}]',
 2, 1.0, 1.7, 0.25, 'en'),

-- Digital Content Creation (6 items)
('CAT_EN_DCC_001', 'digital_content_creation',
 'Which software is commonly used for creating presentations?',
 '[{"id": "A", "text": "Microsoft Excel"}, {"id": "B", "text": "Microsoft PowerPoint"}, {"id": "C", "text": "Microsoft Outlook"}, {"id": "D", "text": "Notepad"}]',
 2, -1.0, 1.3, 0.25, 'en'),

('CAT_EN_DCC_002', 'digital_content_creation',
 'What file format is commonly used for images?',
 '[{"id": "A", "text": ".docx"}, {"id": "B", "text": ".jpg"}, {"id": "C", "text": ".mp3"}, {"id": "D", "text": ".exe"}]',
 2, -0.5, 1.4, 0.25, 'en'),

('CAT_EN_DCC_003', 'digital_content_creation',
 'What is the purpose of spell check in a word processor?',
 '[{"id": "A", "text": "To add pictures"}, {"id": "B", "text": "To find and correct spelling errors"}, {"id": "C", "text": "To change font color"}, {"id": "D", "text": "To save the document"}]',
 2, -1.5, 1.1, 0.25, 'en'),

('CAT_EN_DCC_004', 'digital_content_creation',
 'Which keyboard shortcut is used to copy selected text?',
 '[{"id": "A", "text": "Ctrl + V"}, {"id": "B", "text": "Ctrl + C"}, {"id": "C", "text": "Ctrl + X"}, {"id": "D", "text": "Ctrl + Z"}]',
 2, -0.5, 1.5, 0.25, 'en'),

('CAT_EN_DCC_005', 'digital_content_creation',
 'What is a PDF file?',
 '[{"id": "A", "text": "A video format"}, {"id": "B", "text": "A document format that preserves formatting"}, {"id": "C", "text": "An audio format"}, {"id": "D", "text": "A programming language"}]',
 2, 0.0, 1.4, 0.25, 'en'),

('CAT_EN_DCC_006', 'digital_content_creation',
 'Which tool would you use to resize an image?',
 '[{"id": "A", "text": "Calculator"}, {"id": "B", "text": "Image editor"}, {"id": "C", "text": "Spreadsheet"}, {"id": "D", "text": "Email client"}]',
 2, -0.5, 1.2, 0.25, 'en'),

-- Problem Solving Aptitude (6 items)
('CAT_EN_PSA_001', 'problem_solving_aptitude',
 'If your computer is running slowly, what is a good first step?',
 '[{"id": "A", "text": "Buy a new computer"}, {"id": "B", "text": "Restart the computer"}, {"id": "C", "text": "Delete all files"}, {"id": "D", "text": "Throw it away"}]',
 2, -1.5, 1.2, 0.25, 'en'),

('CAT_EN_PSA_002', 'problem_solving_aptitude',
 'What should you do if you forget your password?',
 '[{"id": "A", "text": "Create a new account"}, {"id": "B", "text": "Use the ''Forgot Password'' option"}, {"id": "C", "text": "Never log in again"}, {"id": "D", "text": "Call the police"}]',
 2, -1.0, 1.4, 0.25, 'en'),

('CAT_EN_PSA_003', 'problem_solving_aptitude',
 'A website is not loading. What could be a possible cause?',
 '[{"id": "A", "text": "The keyboard is broken"}, {"id": "B", "text": "No internet connection"}, {"id": "C", "text": "The monitor is off"}, {"id": "D", "text": "The mouse is not working"}]',
 2, -0.5, 1.5, 0.25, 'en'),

('CAT_EN_PSA_004', 'problem_solving_aptitude',
 'How can you protect your computer from viruses?',
 '[{"id": "A", "text": "Never turn it on"}, {"id": "B", "text": "Install antivirus software"}, {"id": "C", "text": "Only use it in the morning"}, {"id": "D", "text": "Cover it with a cloth"}]',
 2, -0.5, 1.3, 0.25, 'en'),

('CAT_EN_PSA_005', 'problem_solving_aptitude',
 'Your file won''t open. What should you try?',
 '[{"id": "A", "text": "Delete the file"}, {"id": "B", "text": "Check if you have the right software to open it"}, {"id": "C", "text": "Rename the computer"}, {"id": "D", "text": "Turn off the internet"}]',
 2, 0.0, 1.4, 0.25, 'en'),

('CAT_EN_PSA_006', 'problem_solving_aptitude',
 'What is the best way to organize files on your computer?',
 '[{"id": "A", "text": "Save everything on the desktop"}, {"id": "B", "text": "Create folders and use descriptive names"}, {"id": "C", "text": "Delete files after use"}, {"id": "D", "text": "Never save any files"}]',
 2, 0.5, 1.5, 0.25, 'en'),

-- Contextual Application (6 items)
('CAT_EN_CA_001', 'contextual_application',
 'Which application would you use to create a budget spreadsheet?',
 '[{"id": "A", "text": "PowerPoint"}, {"id": "B", "text": "Excel"}, {"id": "C", "text": "Paint"}, {"id": "D", "text": "Notepad"}]',
 2, -0.5, 1.4, 0.25, 'en'),

('CAT_EN_CA_002', 'contextual_application',
 'You need to send an important document quickly. What is the best method?',
 '[{"id": "A", "text": "Post office"}, {"id": "B", "text": "Email"}, {"id": "C", "text": "Telegram"}, {"id": "D", "text": "Fax machine"}]',
 2, -1.5, 1.2, 0.25, 'en'),

('CAT_EN_CA_003', 'contextual_application',
 'What tool would you use to have a video call with someone far away?',
 '[{"id": "A", "text": "Calculator"}, {"id": "B", "text": "Video conferencing app"}, {"id": "C", "text": "Text editor"}, {"id": "D", "text": "Spreadsheet"}]',
 2, -1.0, 1.3, 0.25, 'en'),

('CAT_EN_CA_004', 'contextual_application',
 'You want to store your photos safely online. What should you use?',
 '[{"id": "A", "text": "USB drive only"}, {"id": "B", "text": "Cloud storage"}, {"id": "C", "text": "Print them all"}, {"id": "D", "text": "Floppy disk"}]',
 2, 0.0, 1.5, 0.25, 'en'),

('CAT_EN_CA_005', 'contextual_application',
 'How can you verify if news online is true?',
 '[{"id": "A", "text": "Believe everything you read"}, {"id": "B", "text": "Check multiple reliable sources"}, {"id": "C", "text": "Only trust social media"}, {"id": "D", "text": "Ignore all news"}]',
 2, 0.5, 1.6, 0.25, 'en'),

('CAT_EN_CA_006', 'contextual_application',
 'Which is a good practice for creating a strong password?',
 '[{"id": "A", "text": "Use your birthday"}, {"id": "B", "text": "Mix letters, numbers, and symbols"}, {"id": "C", "text": "Use the word ''password''"}, {"id": "D", "text": "Use only numbers"}]',
 2, 0.0, 1.4, 0.25, 'en')

ON CONFLICT (item_code) DO NOTHING;;
