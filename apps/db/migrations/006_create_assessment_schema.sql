-- =====================================================
-- Assessment Schema for Pre-Assessment & Analytics
-- =====================================================
-- This migration creates tables for tracking assessment sessions,
-- responses, and learning analytics signals for the ATAL AI platform.

-- Assessment Sessions
-- Tracks when a student starts and completes an assessment
create table if not exists assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assessment Responses
-- Stores individual item responses with analytics signals
create table if not exists assessment_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions(id) on delete cascade,
  item_id text not null,
  module text not null,
  is_correct boolean,
  rt_ms int,                     -- response time in milliseconds
  focus_blur_count int default 0, -- number of times user lost focus
  chosen_option text,             -- the option student selected
  created_at timestamptz not null default now()
);

-- Add indexes for common queries
create index if not exists idx_assessment_sessions_user_id
  on assessment_sessions(user_id);

create index if not exists idx_assessment_sessions_class_id
  on assessment_sessions(class_id);

create index if not exists idx_assessment_sessions_submitted
  on assessment_sessions(submitted_at)
  where submitted_at is not null;

create index if not exists idx_assessment_responses_session_id
  on assessment_responses(session_id);

create index if not exists idx_assessment_responses_module
  on assessment_responses(module);

create index if not exists idx_assessment_responses_item_id
  on assessment_responses(item_id);

-- Add composite index for analytics queries
create index if not exists idx_assessment_responses_session_module
  on assessment_responses(session_id, module);

-- Add updated_at trigger for sessions
create or replace function update_assessment_session_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trigger_update_assessment_session_updated_at
  before update on assessment_sessions
  for each row
  execute function update_assessment_session_updated_at();

-- Add comments for documentation
comment on table assessment_sessions is
  'Tracks assessment attempts by students, including start and submission times';

comment on column assessment_sessions.user_id is
  'Student taking the assessment';

comment on column assessment_sessions.class_id is
  'Optional class context for the assessment';

comment on column assessment_sessions.started_at is
  'When the student started the assessment';

comment on column assessment_sessions.submitted_at is
  'When the student submitted the assessment (null if in progress)';

comment on table assessment_responses is
  'Individual item responses within an assessment session';

comment on column assessment_responses.session_id is
  'Assessment session this response belongs to';

comment on column assessment_responses.item_id is
  'Identifier for the assessment item/question';

comment on column assessment_responses.module is
  'Module/category of the assessment item (e.g., "digital-literacy")';

comment on column assessment_responses.is_correct is
  'Whether the response was correct (null for open-ended)';

comment on column assessment_responses.rt_ms is
  'Response time in milliseconds - used for analytics';

comment on column assessment_responses.focus_blur_count is
  'Number of times student lost focus during this item - engagement signal';

comment on column assessment_responses.chosen_option is
  'The option/answer the student selected';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on assessment tables
alter table assessment_sessions enable row level security;
alter table assessment_responses enable row level security;

-- Assessment Sessions Policies
-- Students can view and create their own sessions
create policy "Students can view their own assessment sessions"
  on assessment_sessions
  for select
  using (auth.uid() = user_id);

create policy "Students can create their own assessment sessions"
  on assessment_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "Students can update their own assessment sessions"
  on assessment_sessions
  for update
  using (auth.uid() = user_id);

-- Teachers can view sessions for their classes
create policy "Teachers can view sessions in their classes"
  on assessment_sessions
  for select
  using (
    exists (
      select 1 from classes
      where classes.id = assessment_sessions.class_id
      and classes.teacher_id = auth.uid()
    )
  );

-- Assessment Responses Policies
-- Students can view and create their own responses
create policy "Students can view their own assessment responses"
  on assessment_responses
  for select
  using (
    exists (
      select 1 from assessment_sessions
      where assessment_sessions.id = assessment_responses.session_id
      and assessment_sessions.user_id = auth.uid()
    )
  );

create policy "Students can create their own assessment responses"
  on assessment_responses
  for insert
  with check (
    exists (
      select 1 from assessment_sessions
      where assessment_sessions.id = assessment_responses.session_id
      and assessment_sessions.user_id = auth.uid()
    )
  );

-- Teachers can view responses for sessions in their classes
create policy "Teachers can view responses in their classes"
  on assessment_responses
  for select
  using (
    exists (
      select 1 from assessment_sessions
      join classes on classes.id = assessment_sessions.class_id
      where assessment_sessions.id = assessment_responses.session_id
      and classes.teacher_id = auth.uid()
    )
  );

-- =====================================================
-- USAGE NOTES
-- =====================================================
-- Pre-Assessment Flow:
-- 1. Student starts assessment → create assessment_session
-- 2. For each item → create assessment_response with signals
-- 3. Student submits → update assessment_session.submitted_at
--
-- Analytics Signals Captured:
-- - Response time (rt_ms): Time to answer each item
-- - Focus/blur count: Engagement and attention metrics
-- - Correctness: Learning progress tracking
-- - Module grouping: Domain-specific analytics
--
-- Privacy & Security:
-- - RLS ensures students only see their own data
-- - Teachers only see data for their classes
-- - All queries respect user context via auth.uid()
