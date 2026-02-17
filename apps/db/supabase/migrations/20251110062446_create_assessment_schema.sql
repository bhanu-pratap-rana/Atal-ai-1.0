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

-- Enable RLS on assessment tables
alter table assessment_sessions enable row level security;
alter table assessment_responses enable row level security;

-- Assessment Sessions Policies
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
  );;
