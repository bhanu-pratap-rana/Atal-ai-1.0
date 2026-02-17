-- Create IRT Item Bank table for adaptive assessment questions
-- This table stores questions with IRT parameters for Computerized Adaptive Testing (CAT)

CREATE TABLE IF NOT EXISTS irt_item_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Question identification
  item_code VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (level IN ('basic', 'intermediate', 'advanced')),
  
  -- Question content (multilingual)
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id: "A", text: "..."} objects
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 1 AND correct_answer <= 4),
  
  -- IRT 3PL Model Parameters
  -- difficulty (b): Item difficulty on logit scale, typically -3 to +3
  -- Negative = easier, Positive = harder
  difficulty NUMERIC(10, 6) NOT NULL DEFAULT 0,
  
  -- discrimination (a): How well item differentiates ability levels, typically 0.5 to 2.5
  -- Higher = better discrimination
  discrimination NUMERIC(10, 6) NOT NULL DEFAULT 1,
  
  -- guessing (c): Probability of correct answer by guessing, typically 0.25 for 4 options
  guessing NUMERIC(10, 6) NOT NULL DEFAULT 0.25,
  
  -- Language and context
  language VARCHAR(20) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'as')),
  source_language VARCHAR(10) DEFAULT 'en' CHECK (source_language IN ('en', 'hi', 'as')),
  cultural_context VARCHAR(50) DEFAULT 'northeast_india',
  
  -- Item statistics (updated after each response for calibration)
  times_administered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  point_biserial NUMERIC(10, 6), -- Correlation between item score and total score
  
  -- Timing
  estimated_time_seconds INTEGER DEFAULT 30,
  min_time_ms INTEGER DEFAULT 3000, -- Minimum time to prevent random clicking
  
  -- Status and review
  is_active BOOLEAN DEFAULT true,
  review_state VARCHAR(20) DEFAULT 'approved' CHECK (review_state IN ('draft', 'needs_translation', 'review', 'approved')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_irt_item_bank_category ON irt_item_bank(category);
CREATE INDEX idx_irt_item_bank_language ON irt_item_bank(language);
CREATE INDEX idx_irt_item_bank_difficulty ON irt_item_bank(difficulty);
CREATE INDEX idx_irt_item_bank_level ON irt_item_bank(level);
CREATE INDEX idx_irt_item_bank_active ON irt_item_bank(is_active) WHERE is_active = true;
CREATE INDEX idx_irt_item_bank_category_language ON irt_item_bank(category, language);
CREATE INDEX idx_irt_item_bank_category_difficulty ON irt_item_bank(category, difficulty);

-- Enable RLS
ALTER TABLE irt_item_bank ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read active, approved questions (for assessment)
CREATE POLICY "irt_item_bank_read_active" ON irt_item_bank
  FOR SELECT
  USING (is_active = true AND review_state = 'approved');

-- Only admins can insert/update/delete
CREATE POLICY "irt_item_bank_admin_all" ON irt_item_bank
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_irt_item_bank_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_irt_item_bank_updated_at
  BEFORE UPDATE ON irt_item_bank
  FOR EACH ROW
  EXECUTE FUNCTION update_irt_item_bank_updated_at();

-- Add comment for documentation
COMMENT ON TABLE irt_item_bank IS 'Stores assessment questions with IRT (Item Response Theory) parameters for adaptive testing. Uses 3PL model with difficulty, discrimination, and guessing parameters.';
COMMENT ON COLUMN irt_item_bank.difficulty IS 'IRT difficulty parameter (b): Logit scale typically -3 to +3. Negative=easier, Positive=harder.';
COMMENT ON COLUMN irt_item_bank.discrimination IS 'IRT discrimination parameter (a): How well item differentiates abilities. Typically 0.5 to 2.5.';
COMMENT ON COLUMN irt_item_bank.guessing IS 'IRT guessing parameter (c): Probability of correct answer by guessing. 0.25 for 4-option MCQ.';;
